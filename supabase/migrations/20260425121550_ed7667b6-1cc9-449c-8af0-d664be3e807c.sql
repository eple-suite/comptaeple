-- Table d'historique des imports d'élèves (fonds sociaux)
CREATE TABLE public.fs_imports_eleves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  fichier_nom TEXT NOT NULL,
  fichier_type TEXT NOT NULL CHECK (fichier_type IN ('csv', 'xlsx', 'xls')),
  annee_scolaire TEXT NOT NULL,
  mapping_utilise JSONB NOT NULL DEFAULT '{}'::jsonb,
  mapping_source TEXT NOT NULL DEFAULT 'ia' CHECK (mapping_source IN ('ia', 'manuel', 'mixte')),
  total_lignes INTEGER NOT NULL DEFAULT 0,
  lignes_importees INTEGER NOT NULL DEFAULT 0,
  lignes_rejetees INTEGER NOT NULL DEFAULT 0,
  rapport_erreurs JSONB NOT NULL DEFAULT '[]'::jsonb,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'echoue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_imports_eleves_etab ON public.fs_imports_eleves(establishment_id, created_at DESC);

ALTER TABLE public.fs_imports_eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture imports élèves par établissement"
  ON public.fs_imports_eleves FOR SELECT
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));

CREATE POLICY "Insertion imports élèves par utilisateur de l'établissement"
  ON public.fs_imports_eleves FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Mise à jour imports par auteur"
  ON public.fs_imports_eleves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_fs_imports_eleves_user_name
  BEFORE INSERT ON public.fs_imports_eleves
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_trail_user_name();

CREATE TRIGGER trg_fs_imports_eleves_updated_at
  BEFORE UPDATE ON public.fs_imports_eleves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();