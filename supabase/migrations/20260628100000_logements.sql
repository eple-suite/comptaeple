-- Module Logements de fonction — persistance serveur. À appliquer sur qbhxjaz.
-- RLS : cloisonnement par établissement.

CREATE TABLE IF NOT EXISTS public.logements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid,
  libelle text NOT NULL,
  adresse text,
  surface numeric,
  type_concession text NOT NULL DEFAULT 'COP' CHECK (type_concession IN ('NAS','COP','COG')),
  occupant_nom text NOT NULL,
  occupant_fonction text,
  date_debut date NOT NULL,
  date_fin date,
  redevance_mensuelle numeric NOT NULL DEFAULT 0,
  provisions_charges_mensuelles numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.releves_consommation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logement_id uuid NOT NULL REFERENCES public.logements(id) ON DELETE CASCADE,
  annee integer NOT NULL,
  fluide text NOT NULL CHECK (fluide IN ('eau','electricite','gaz','chauffage')),
  index_initial numeric NOT NULL DEFAULT 0,
  index_final numeric NOT NULL DEFAULT 0,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  UNIQUE (logement_id, annee, fluide)
);

CREATE TABLE IF NOT EXISTS public.titres_logement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logement_id uuid NOT NULL REFERENCES public.logements(id) ON DELETE CASCADE,
  periode text,
  redevance numeric NOT NULL DEFAULT 0,
  charges numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  emis_le date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.logements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releves_consommation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titres_logement ENABLE ROW LEVEL SECURITY;

CREATE POLICY logements_rw ON public.logements
  FOR ALL USING (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  ) WITH CHECK (
    etablissement_id IS NULL
    OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  );

CREATE POLICY releves_rw ON public.releves_consommation
  FOR ALL USING (
    logement_id IN (SELECT id FROM public.logements WHERE etablissement_id IS NULL
      OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  ) WITH CHECK (
    logement_id IN (SELECT id FROM public.logements WHERE etablissement_id IS NULL
      OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  );

CREATE POLICY titres_logement_rw ON public.titres_logement
  FOR ALL USING (
    logement_id IN (SELECT id FROM public.logements WHERE etablissement_id IS NULL
      OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  ) WITH CHECK (
    logement_id IN (SELECT id FROM public.logements WHERE etablissement_id IS NULL
      OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  );
