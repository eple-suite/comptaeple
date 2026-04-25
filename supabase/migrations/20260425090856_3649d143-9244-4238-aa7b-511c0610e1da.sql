-- ═══════════════════════════════════════════════════════════════
-- IMPORTS HISTORIQUE — versioning, archivage 10 ans
-- + Bucket de stockage des fichiers originaux
-- ═══════════════════════════════════════════════════════════════

-- Enum des types d'import (cohérent avec src/lib/import/fileTypeDetector.ts)
DO $$ BEGIN
  CREATE TYPE public.import_file_type AS ENUM (
    'balance', 'sde', 'sdr', 'grand_livre', 'etat_tiers',
    'siecle_eleves', 'siecle_bourses', 'regies', 'paie', 'inconnu'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.import_status AS ENUM ('succes', 'ecrase', 'echec');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table principale
CREATE TABLE IF NOT EXISTS public.imports_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  type_import public.import_file_type NOT NULL,
  filename TEXT NOT NULL,
  taille_octets BIGINT NOT NULL DEFAULT 0,
  hash_sha256 TEXT,
  date_edition_fichier TIMESTAMPTZ,
  periode_debut DATE,
  periode_fin DATE,
  importe_par UUID NOT NULL,
  date_import TIMESTAMPTZ NOT NULL DEFAULT now(),
  statut public.import_status NOT NULL DEFAULT 'succes',
  totaux_json JSONB DEFAULT '{}'::jsonb,
  anomalies_json JSONB DEFAULT '[]'::jsonb,
  ecart_vs_precedent_json JSONB DEFAULT '{}'::jsonb,
  fichier_original_path TEXT,
  uai_detecte TEXT,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imports_historique_etab ON public.imports_historique(establishment_id);
CREATE INDEX IF NOT EXISTS idx_imports_historique_type_periode ON public.imports_historique(establishment_id, type_import, periode_debut, periode_fin);
CREATE INDEX IF NOT EXISTS idx_imports_historique_hash ON public.imports_historique(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_imports_historique_statut ON public.imports_historique(statut);

ALTER TABLE public.imports_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imports — lecture par membres de l'EPLE"
  ON public.imports_historique FOR SELECT
  TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));

CREATE POLICY "Imports — création par membres de l'EPLE"
  ON public.imports_historique FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_establishment_access(auth.uid(), establishment_id)
    AND importe_par = auth.uid()
  );

CREATE POLICY "Imports — mise à jour par admin"
  ON public.imports_historique FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Imports — suppression par admin"
  ON public.imports_historique FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger : marquer comme "ecrase" tout import précédent même type/EPLE/période
CREATE OR REPLACE FUNCTION public.imports_historique_archive_previous()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'succes' AND NEW.periode_debut IS NOT NULL THEN
    UPDATE public.imports_historique
       SET statut = 'ecrase'
     WHERE establishment_id = NEW.establishment_id
       AND type_import = NEW.type_import
       AND periode_debut = NEW.periode_debut
       AND COALESCE(periode_fin, periode_debut) = COALESCE(NEW.periode_fin, NEW.periode_debut)
       AND id <> NEW.id
       AND statut = 'succes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imports_historique_archive_previous ON public.imports_historique;
CREATE TRIGGER trg_imports_historique_archive_previous
  AFTER INSERT ON public.imports_historique
  FOR EACH ROW EXECUTE FUNCTION public.imports_historique_archive_previous();

-- ─────────────────────────────────────────────────────────────
-- Bucket de stockage des fichiers originaux (privé)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('imports-archive', 'imports-archive', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imports archive — lecture par membres EPLE"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'imports-archive'
    AND EXISTS (
      SELECT 1 FROM public.imports_historique ih
      WHERE ih.fichier_original_path = storage.objects.name
        AND public.user_has_establishment_access(auth.uid(), ih.establishment_id)
    )
  );

CREATE POLICY "Imports archive — upload par utilisateurs auth"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'imports-archive'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Imports archive — suppression admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'imports-archive'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );