-- =========================================================================
-- MODULE ENTRETIENS PROFESSIONNELS (CREP/CREF) — BIATSS EPLE
-- Conformité : décret 2010-888 du 28/07/2010, décret 86-83 du 17/01/1986,
-- circulaire MENH1310955C, annexes C9 et C9 bis
-- =========================================================================

-- Enums --------------------------------------------------------------------

CREATE TYPE public.entretien_statut AS ENUM (
  'brouillon',
  'convocation_envoyee',
  'entretien_realise',
  'redaction_n1',
  'en_attente_signature_n1',
  'notifie_agent_pour_observations',
  'en_attente_signature_agent',
  'en_attente_visa_n2',
  'finalise',
  'archive',
  'recours_en_cours',
  'revision_demandee'
);

CREATE TYPE public.agent_categorie AS ENUM ('A', 'B', 'C');

CREATE TYPE public.agent_statut AS ENUM (
  'titulaire',
  'contractuel_cdd',
  'contractuel_cdi',
  'detache',
  'mis_a_disposition'
);

CREATE TYPE public.agent_filiere AS ENUM (
  'AENES',
  'ITRF',
  'Bibliotheques',
  'SAENES',
  'Medico_sociale',
  'Autre'
);

CREATE TYPE public.entretien_mode AS ENUM ('presentiel', 'visio', 'hybride');

CREATE TYPE public.objectif_atteinte AS ENUM (
  'atteint',
  'partiellement_atteint',
  'non_atteint',
  'sans_objet'
);

CREATE TYPE public.competence_niveau AS ENUM (
  'excellent',
  'tres_bon',
  'satisfaisant',
  'a_developper',
  'insuffisant',
  'sans_objet'
);

CREATE TYPE public.formation_categorie AS ENUM ('T1', 'T2', 'T3');

CREATE TYPE public.formation_priorite AS ENUM ('haute', 'moyenne', 'basse');

CREATE TYPE public.formation_fondement AS ENUM (
  'agent',
  'evaluateur',
  'consensuelle'
);

CREATE TYPE public.signature_role AS ENUM ('n1', 'agent', 'n2');

CREATE TYPE public.recours_type AS ENUM (
  'revision_hierarchique',
  'saisine_cap',
  'saisine_ccp'
);

CREATE TYPE public.recours_statut AS ENUM (
  'en_cours',
  'accepte',
  'rejete',
  'silence_vaut_refus'
);

-- Tables -------------------------------------------------------------------

CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  date_naissance date,
  email text,
  corps text,
  grade text,
  echelon int,
  indice int,
  categorie public.agent_categorie,
  filiere public.agent_filiere,
  statut public.agent_statut NOT NULL DEFAULT 'titulaire',
  administration_origine text,
  date_entree_corps date,
  date_entree_etablissement date,
  date_derniere_promotion date,
  service text,
  fonction text,
  quotite_travail numeric(5,2) DEFAULT 100.00,
  fiche_poste_id uuid,
  n1_user_id uuid,
  n2_user_id uuid,
  actif boolean NOT NULL DEFAULT true,
  notes_rh text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_etab ON public.agents(establishment_id);
CREATE INDEX idx_agents_n1 ON public.agents(n1_user_id);

CREATE TABLE public.entretiens_fiches_poste (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  intitule text NOT NULL,
  service text,
  categorie public.agent_categorie,
  filiere public.agent_filiere,
  missions_principales text,
  activites text,
  competences_requises text,
  conditions_exercice text,
  partagee_groupement boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fiches_poste_etab ON public.entretiens_fiches_poste(establishment_id);

ALTER TABLE public.agents
  ADD CONSTRAINT fk_agents_fiche_poste
  FOREIGN KEY (fiche_poste_id) REFERENCES public.entretiens_fiches_poste(id) ON DELETE SET NULL;

CREATE TABLE public.entretiens_professionnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  agent_evalue_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  evaluateur_user_id uuid NOT NULL,
  autorite_n2_user_id uuid,
  campagne_annee text NOT NULL,
  periode_debut date,
  periode_fin date,
  statut public.entretien_statut NOT NULL DEFAULT 'brouillon',
  date_convocation date,
  date_entretien date,
  duree_entretien_min int,
  lieu text,
  mode public.entretien_mode DEFAULT 'presentiel',
  texte_libre_appreciation text,
  texte_libre_formation text,
  ia_response_json jsonb,
  ia_score_completude numeric(3,2),
  appreciation_generale text,
  perspectives text,
  signature_n1_at timestamptz,
  signature_n1_hash text,
  notification_agent_at timestamptz,
  observations_agent text,
  signature_agent_at timestamptz,
  signature_agent_hash text,
  visa_n2_at timestamptz,
  observations_n2 text,
  signature_n2_hash text,
  finalise_at timestamptz,
  pdf_crep_url text,
  pdf_cref_url text,
  pdf_crep_hash text,
  pdf_cref_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entretiens_agent ON public.entretiens_professionnels(agent_evalue_id);
CREATE INDEX idx_entretiens_evaluateur ON public.entretiens_professionnels(evaluateur_user_id);
CREATE INDEX idx_entretiens_n2 ON public.entretiens_professionnels(autorite_n2_user_id);
CREATE INDEX idx_entretiens_etab_campagne ON public.entretiens_professionnels(establishment_id, campagne_annee);
CREATE INDEX idx_entretiens_statut ON public.entretiens_professionnels(statut);

CREATE TABLE public.entretiens_objectifs_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  ordre int NOT NULL DEFAULT 0,
  libelle text NOT NULL,
  atteinte public.objectif_atteinte,
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_obj_passes_entretien ON public.entretiens_objectifs_passes(entretien_id);

CREATE TABLE public.entretiens_objectifs_futurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  ordre int NOT NULL DEFAULT 0,
  libelle text NOT NULL,
  indicateur text,
  echeance text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_obj_futurs_entretien ON public.entretiens_objectifs_futurs(entretien_id);

CREATE TABLE public.entretiens_competences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  rubrique text NOT NULL CHECK (rubrique IN ('C1_resultats','C2_competences_techniques','C3_qualites_personnelles','C4_encadrement')),
  sous_critere text NOT NULL,
  niveau public.competence_niveau,
  commentaire text,
  confiance_ia text CHECK (confiance_ia IN ('eleve','moyen','faible')),
  extrait_source text,
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_competences_entretien ON public.entretiens_competences(entretien_id);

CREATE TABLE public.entretiens_formation_bilan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  intitule text NOT NULL,
  organisme text,
  duree_heures int,
  date_debut date,
  date_fin date,
  evaluation text CHECK (evaluation IN ('utile','partiellement_utile','non_utile')),
  reinvestissement text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_bilan_entretien ON public.entretiens_formation_bilan(entretien_id);

CREATE TABLE public.entretiens_formation_demandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  intitule text NOT NULL,
  categorie public.formation_categorie NOT NULL DEFAULT 'T1',
  priorite public.formation_priorite NOT NULL DEFAULT 'moyenne',
  fondement public.formation_fondement NOT NULL DEFAULT 'agent',
  statut text DEFAULT 'demandee',
  lien_pafac text,
  extrait_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_dem_entretien ON public.entretiens_formation_demandes(entretien_id);

CREATE TABLE public.entretiens_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  signataire_role public.signature_role NOT NULL,
  signataire_user_id uuid NOT NULL,
  signataire_nom text,
  date_signature timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entretien_id, signataire_role)
);

CREATE INDEX idx_signatures_entretien ON public.entretiens_signatures(entretien_id);

CREATE TABLE public.entretiens_recours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  type public.recours_type NOT NULL,
  date_saisine date NOT NULL,
  date_limite_reponse date,
  motif text NOT NULL,
  reponse text,
  date_reponse date,
  statut public.recours_statut NOT NULL DEFAULT 'en_cours',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recours_entretien ON public.entretiens_recours(entretien_id);

-- Triggers updated_at -------------------------------------------------------

CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_fiches_poste_updated BEFORE UPDATE ON public.entretiens_fiches_poste
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_entretiens_updated BEFORE UPDATE ON public.entretiens_professionnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_recours_updated BEFORE UPDATE ON public.entretiens_recours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger : circuit signatures (sécurité réglementaire) --------------------

CREATE OR REPLACE FUNCTION public.entretiens_signatures_circuit_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_n1 boolean;
  has_n2 boolean;
BEGIN
  IF NEW.signataire_role = 'agent' THEN
    SELECT EXISTS (SELECT 1 FROM public.entretiens_signatures
                   WHERE entretien_id = NEW.entretien_id AND signataire_role = 'n1')
      INTO has_n1;
    SELECT EXISTS (SELECT 1 FROM public.entretiens_signatures
                   WHERE entretien_id = NEW.entretien_id AND signataire_role = 'n2')
      INTO has_n2;
    IF NOT has_n1 OR NOT has_n2 THEN
      RAISE EXCEPTION 'Signature agent bloquée : N+1 et N+2 doivent signer avant (circuit décret 2010-888).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_signatures_circuit BEFORE INSERT ON public.entretiens_signatures
  FOR EACH ROW EXECUTE FUNCTION public.entretiens_signatures_circuit_check();

-- RLS ----------------------------------------------------------------------

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_fiches_poste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_professionnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_objectifs_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_objectifs_futurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_formation_bilan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_formation_demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entretiens_recours ENABLE ROW LEVEL SECURITY;

-- Helper : l'utilisateur a accès à un établissement ?
CREATE OR REPLACE FUNCTION public.user_has_establishment_access(_user_id uuid, _establishment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_establishments
    WHERE user_id = _user_id AND establishment_id = _establishment_id
  ) OR public.has_role(_user_id, 'admin'::app_role);
$$;

-- Helper : l'utilisateur est partie prenante d'un entretien ?
CREATE OR REPLACE FUNCTION public.user_is_entretien_party(_user_id uuid, _entretien_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entretiens_professionnels e
    LEFT JOIN public.agents a ON a.id = e.agent_evalue_id
    WHERE e.id = _entretien_id
      AND (
        e.evaluateur_user_id = _user_id
        OR e.autorite_n2_user_id = _user_id
        OR a.email IN (SELECT email FROM auth.users WHERE id = _user_id)
        OR public.has_role(_user_id, 'admin'::app_role)
        OR public.user_has_establishment_access(_user_id, e.establishment_id)
      )
  );
$$;

-- Policies agents
CREATE POLICY "agents_select" ON public.agents FOR SELECT TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "agents_insert" ON public.agents FOR INSERT TO authenticated
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "agents_update" ON public.agents FOR UPDATE TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "agents_delete" ON public.agents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policies fiches de poste
CREATE POLICY "fiches_poste_select" ON public.entretiens_fiches_poste FOR SELECT TO authenticated
  USING (
    partagee_groupement = true
    OR establishment_id IS NULL
    OR public.user_has_establishment_access(auth.uid(), establishment_id)
  );
CREATE POLICY "fiches_poste_insert" ON public.entretiens_fiches_poste FOR INSERT TO authenticated
  WITH CHECK (
    establishment_id IS NULL
    OR public.user_has_establishment_access(auth.uid(), establishment_id)
  );
CREATE POLICY "fiches_poste_update" ON public.entretiens_fiches_poste FOR UPDATE TO authenticated
  USING (
    establishment_id IS NULL
    OR public.user_has_establishment_access(auth.uid(), establishment_id)
  );
CREATE POLICY "fiches_poste_delete" ON public.entretiens_fiches_poste FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policies entretiens
CREATE POLICY "entretiens_select" ON public.entretiens_professionnels FOR SELECT TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), id));
CREATE POLICY "entretiens_insert" ON public.entretiens_professionnels FOR INSERT TO authenticated
  WITH CHECK (
    evaluateur_user_id = auth.uid()
    AND public.user_has_establishment_access(auth.uid(), establishment_id)
  );
CREATE POLICY "entretiens_update" ON public.entretiens_professionnels FOR UPDATE TO authenticated
  USING (
    evaluateur_user_id = auth.uid()
    OR autorite_n2_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "entretiens_delete" ON public.entretiens_professionnels FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policies sous-tables (delegate via entretien_id)
CREATE POLICY "obj_passes_all" ON public.entretiens_objectifs_passes FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "obj_futurs_all" ON public.entretiens_objectifs_futurs FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "competences_all" ON public.entretiens_competences FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "form_bilan_all" ON public.entretiens_formation_bilan FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "form_dem_all" ON public.entretiens_formation_demandes FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "signatures_select" ON public.entretiens_signatures FOR SELECT TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id));
CREATE POLICY "signatures_insert" ON public.entretiens_signatures FOR INSERT TO authenticated
  WITH CHECK (
    signataire_user_id = auth.uid()
    AND public.user_is_entretien_party(auth.uid(), entretien_id)
  );

CREATE POLICY "recours_all" ON public.entretiens_recours FOR ALL TO authenticated
  USING (public.user_is_entretien_party(auth.uid(), entretien_id))
  WITH CHECK (public.user_is_entretien_party(auth.uid(), entretien_id));