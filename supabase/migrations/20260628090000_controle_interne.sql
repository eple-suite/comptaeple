-- Plan de contrôle interne comptable (CIC) — persistance serveur + consolidation.
-- À appliquer sur qbhxjaz. RLS : cloisonnement par établissement.

CREATE TABLE IF NOT EXISTS public.plan_controle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid,
  processus text NOT NULL,
  action text NOT NULL,
  frequence text NOT NULL CHECK (frequence IN ('quotidien','hebdomadaire','mensuel','trimestriel','annuel')),
  responsable text,
  risque text NOT NULL DEFAULT 'moyen' CHECK (risque IN ('faible','moyen','eleve','critique')),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.controle_realise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.plan_controle(id) ON DELETE CASCADE,
  etablissement_id uuid,
  statut text NOT NULL DEFAULT 'non_realise' CHECK (statut IN ('conforme','anomalie','en_cours','non_realise')),
  date_controle date,
  observation text,
  agent text,
  pv_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_controle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_realise ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_controle_rw ON public.plan_controle
  FOR ALL USING (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  ) WITH CHECK (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  );

CREATE POLICY controle_realise_rw ON public.controle_realise
  FOR ALL USING (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  ) WITH CHECK (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  );
