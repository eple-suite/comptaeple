-- CFA / Apprentissage (NPEC, ressources OPCO). À appliquer sur qbhxjaz.
CREATE TABLE IF NOT EXISTS public.cfa_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid,
  intitule text NOT NULL,
  diplome text,
  npec numeric NOT NULL DEFAULT 0,
  nb_apprentis integer NOT NULL DEFAULT 0,
  cout_annuel numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cfa_formations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cfa_formations_rw ON public.cfa_formations FOR ALL
  USING (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  WITH CHECK (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()));
