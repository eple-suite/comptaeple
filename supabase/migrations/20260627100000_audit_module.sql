-- Module Audit complet EPLE — persistance serveur (consolidation multi-EPLE).
-- À appliquer sur le projet qbhxjaz. RLS : cloisonnement par établissement.
-- (L'application fonctionne déjà en local ; ces tables servent la consolidation
--  groupement et l'historisation pluriannuelle.)

CREATE TABLE IF NOT EXISTS public.audit_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid NOT NULL,
  etablissement_nom text NOT NULL,
  budget_type text NOT NULL CHECK (budget_type IN ('EPLE','GRETA','CFA')),
  campagne integer NOT NULL,
  statut text NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('preparation','en_cours','cloturee','archivee')),
  auditeur text,
  date_debut timestamptz NOT NULL DEFAULT now(),
  date_cloture timestamptz,
  signature_auditeur text,
  visa_ordonnateur text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_controles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.audit_missions(id) ON DELETE CASCADE,
  controle_ref text NOT NULL,                       -- id du référentiel (ex. rh-vacations)
  resultat text NOT NULL DEFAULT 'non_evalue'
    CHECK (resultat IN ('non_evalue','conforme','conforme_reserve','non_conforme','non_verifiable')),
  observations text,
  recommandation text,
  pieces jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, controle_ref)
);

CREATE TABLE IF NOT EXISTS public.audit_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.audit_missions(id) ON DELETE CASCADE,
  controle_ref text,
  domaine_id text,
  libelle text NOT NULL,
  responsable text,
  echeance date,
  priorite text NOT NULL DEFAULT 'moyen' CHECK (priorite IN ('faible','moyen','important','critique')),
  etat text NOT NULL DEFAULT 'a_faire' CHECK (etat IN ('a_faire','en_cours','fait','abandonne')),
  commentaire text,
  date_cloture date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_actions ENABLE ROW LEVEL SECURITY;

-- Politiques : un utilisateur accède aux missions des établissements qui lui
-- sont rattachés (table user_establishments). Adapter au modèle de droits.
CREATE POLICY audit_missions_rw ON public.audit_missions
  FOR ALL USING (
    etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  ) WITH CHECK (
    etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())
  );

CREATE POLICY audit_controles_rw ON public.audit_controles
  FOR ALL USING (
    mission_id IN (SELECT id FROM public.audit_missions
      WHERE etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  ) WITH CHECK (
    mission_id IN (SELECT id FROM public.audit_missions
      WHERE etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  );

CREATE POLICY audit_actions_rw ON public.audit_actions
  FOR ALL USING (
    mission_id IN (SELECT id FROM public.audit_missions
      WHERE etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  ) WITH CHECK (
    mission_id IN (SELECT id FROM public.audit_missions
      WHERE etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  );
