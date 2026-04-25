
CREATE TYPE public.entretien_campagne_statut AS ENUM ('preparation','ouverte','cloturee','archivee');

CREATE TABLE public.entretiens_campagnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  annee_scolaire text NOT NULL,
  libelle text,
  date_ouverture date,
  date_cloture date,
  date_butoir_signatures date,
  statut entretien_campagne_statut NOT NULL DEFAULT 'preparation',
  consignes_locales text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, annee_scolaire)
);

CREATE INDEX idx_campagnes_etab ON public.entretiens_campagnes(establishment_id);
CREATE INDEX idx_campagnes_statut ON public.entretiens_campagnes(statut);

ALTER TABLE public.entretiens_campagnes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campagnes_select" ON public.entretiens_campagnes FOR SELECT TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "campagnes_insert" ON public.entretiens_campagnes FOR INSERT TO authenticated
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "campagnes_update" ON public.entretiens_campagnes FOR UPDATE TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "campagnes_delete" ON public.entretiens_campagnes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_campagnes_updated BEFORE UPDATE ON public.entretiens_campagnes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
