
-- ═══════════════════════════════════════════════════════════════
-- EXTENSION NON DESTRUCTIVE — Module Paramètres niveau rectoral
-- ═══════════════════════════════════════════════════════════════

-- ─── ENUMS NOUVEAUX (idempotents) ──────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.etablissement_type AS ENUM (
    'college','lycee_general','lycee_technologique','lycee_professionnel',
    'erea','segpa','cfa','greta','annexe'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.statut_juridique AS ENUM ('eple','epla','opa','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.classement_ep AS ENUM ('rep','rep_plus','hors_ep');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collectivite_rattachement AS ENUM ('departement','region','etat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.statut_rattachement AS ENUM ('actif','sortant','entrant','archive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_role_principal AS ENUM (
    'ac','fp','ordonnateur','ordonnateur_suppleant','sg','adjoint_gestionnaire',
    'assistant_gestion','regisseur_recettes','regisseur_avances','suppleant_regie',
    'magasinier','chef_cuisine','secretaire_intendance','gestionnaire_materiel',
    'responsable_cfa','responsable_greta','correspondant_cicf','archiviste_comptable','autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profil_opale AS ENUM (
    'admin_etab','ordonnateur','gestionnaire','valideur','consultation','aucun'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delegation_type AS ENUM (
    'ordonnateur_general','ordonnateur_partiel','ac','fonde_pouvoir','mandataire'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delegation_statut AS ENUM ('active','expiree','abrogee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bottin_categorie AS ENUM (
    'rectorat','dsden','collectivite','dgfip','ddfip','ars','prefecture',
    'police','gendarmerie','pompiers','medecine_scolaire','dsi','eafc','autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acte_type AS ENUM (
    'nomination_regisseur_recettes','nomination_regisseur_avances','nomination_suppleant_regie',
    'nomination_mandataire','arrete_constitutif_regie','arrete_abrogation_regie',
    'delegation_signature_ordo','delegation_signature_ac','abrogation_delegation',
    'engagement_ac','pv_installation_ac','pv_remise_service_ac','lettre_mission_cicf','autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.civilite AS ENUM ('mme','m');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── EXT. groupements_comptables ───────────────────────────────
ALTER TABLE public.groupements_comptables
  ADD COLUMN IF NOT EXISTS region_academique varchar(80),
  ADD COLUMN IF NOT EXISTS code_groupement varchar(40),
  ADD COLUMN IF NOT EXISTS date_creation_arrete date,
  ADD COLUMN IF NOT EXISTS arrete_constitutif_url text,
  ADD COLUMN IF NOT EXISTS date_derniere_modification date,
  ADD COLUMN IF NOT EXISTS perimetre_actif boolean DEFAULT true;

-- ─── EXT. establishments ───────────────────────────────────────
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS type_etablissement public.etablissement_type,
  ADD COLUMN IF NOT EXISTS statut_juridique public.statut_juridique,
  ADD COLUMN IF NOT EXISTS siret varchar(14),
  ADD COLUMN IF NOT EXISTS adresse_ligne_1 varchar(200),
  ADD COLUMN IF NOT EXISTS adresse_ligne_2 varchar(200),
  ADD COLUMN IF NOT EXISTS adresse_ligne_3 varchar(200),
  ADD COLUMN IF NOT EXISTS code_postal varchar(10),
  ADD COLUMN IF NOT EXISTS commune varchar(120),
  ADD COLUMN IF NOT EXISTS departement varchar(80),
  ADD COLUMN IF NOT EXISTS telephone varchar(30),
  ADD COLUMN IF NOT EXISTS email_secretariat varchar(150),
  ADD COLUMN IF NOT EXISTS email_intendance varchar(150),
  ADD COLUMN IF NOT EXISTS site_web text,
  ADD COLUMN IF NOT EXISTS nb_eleves_total integer,
  ADD COLUMN IF NOT EXISTS nb_eleves_dp integer,
  ADD COLUMN IF NOT EXISTS nb_eleves_internes integer,
  ADD COLUMN IF NOT EXISTS nb_eleves_externes integer,
  ADD COLUMN IF NOT EXISTS nb_eleves_boursiers integer,
  ADD COLUMN IF NOT EXISTS taux_boursiers numeric(5,2),
  ADD COLUMN IF NOT EXISTS classement_ep public.classement_ep,
  ADD COLUMN IF NOT EXISTS indice_position_sociale numeric(6,2),
  ADD COLUMN IF NOT EXISTS surface_batie_m2 integer,
  ADD COLUMN IF NOT EXISTS nb_batiments integer,
  ADD COLUMN IF NOT EXISTS annee_construction integer,
  ADD COLUMN IF NOT EXISTS annee_derniere_renovation integer,
  ADD COLUMN IF NOT EXISTS collectivite_rattachement public.collectivite_rattachement,
  ADD COLUMN IF NOT EXISTS nom_collectivite varchar(200),
  ADD COLUMN IF NOT EXISTS contact_collectivite varchar(200),
  ADD COLUMN IF NOT EXISTS contrat_objectifs_en_cours boolean,
  ADD COLUMN IF NOT EXISTS contrat_tripartite_url text,
  ADD COLUMN IF NOT EXISTS chef_etablissement_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS adjoint_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS secretaire_general_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gestionnaire_materiel_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chef_cuisine_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cpe_principal_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_rattachement_groupement date,
  ADD COLUMN IF NOT EXISTS statut_rattachement public.statut_rattachement DEFAULT 'actif',
  ADD COLUMN IF NOT EXISTS notes text;

-- ─── EXT. agents ───────────────────────────────────────────────
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS matricule_education_nationale varchar(20),
  ADD COLUMN IF NOT EXISTS matricule_etablissement varchar(40),
  ADD COLUMN IF NOT EXISTS civilite public.civilite,
  ADD COLUMN IF NOT EXISTS nom_naissance varchar(120),
  ADD COLUMN IF NOT EXISTS nom_usage varchar(120),
  ADD COLUMN IF NOT EXISTS prenoms_secondaires varchar(200),
  ADD COLUMN IF NOT EXISTS lieu_naissance varchar(150),
  ADD COLUMN IF NOT EXISTS nationalite varchar(40),
  ADD COLUMN IF NOT EXISTS indice_majore integer,
  ADD COLUMN IF NOT EXISTS rifseeup_groupe varchar(8),
  ADD COLUMN IF NOT EXISTS montant_ifse_mensuel numeric(10,2),
  ADD COLUMN IF NOT EXISTS cia_dernier_montant numeric(10,2),
  ADD COLUMN IF NOT EXISTS date_prevue_fin_fonction date,
  ADD COLUMN IF NOT EXISTS date_effective_fin_fonction date,
  ADD COLUMN IF NOT EXISTS role_principal public.agent_role_principal,
  ADD COLUMN IF NOT EXISTS roles_secondaires text[],
  ADD COLUMN IF NOT EXISTS etablissements_affectation uuid[],
  ADD COLUMN IF NOT EXISTS delegation_signature boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delegation_signature_acte_url text,
  ADD COLUMN IF NOT EXISTS profil_opale public.profil_opale,
  ADD COLUMN IF NOT EXISTS profils_autres jsonb,
  ADD COLUMN IF NOT EXISTS email_professionnel varchar(150),
  ADD COLUMN IF NOT EXISTS telephone_professionnel varchar(30),
  ADD COLUMN IF NOT EXISTS bureau varchar(80),
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS n_plus_un_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS n_plus_deux_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;

-- ─── NOUVELLE TABLE delegations_signature ──────────────────────
CREATE TABLE IF NOT EXISTS public.delegations_signature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_delegant_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_delegataire_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  type_delegation public.delegation_type NOT NULL,
  perimetre text,
  montant_max numeric(14,2),
  date_debut date NOT NULL,
  date_fin date,
  arrete_url text,
  statut public.delegation_statut NOT NULL DEFAULT 'active',
  motif_abrogation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delegations_signature ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delegations_select" ON public.delegations_signature;
CREATE POLICY "delegations_select" ON public.delegations_signature FOR SELECT
  USING (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "delegations_insert" ON public.delegations_signature;
CREATE POLICY "delegations_insert" ON public.delegations_signature FOR INSERT
  WITH CHECK (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "delegations_update" ON public.delegations_signature;
CREATE POLICY "delegations_update" ON public.delegations_signature FOR UPDATE
  USING (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "delegations_delete" ON public.delegations_signature;
CREATE POLICY "delegations_delete" ON public.delegations_signature FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_delegations_signature_updated_at
  BEFORE UPDATE ON public.delegations_signature
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── NOUVELLE TABLE historique_fonctions ───────────────────────
CREATE TABLE IF NOT EXISTS public.historique_fonctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  role text,
  date_debut date,
  date_fin date,
  motif_changement text,
  arrete_url text,
  archive_at timestamptz NOT NULL DEFAULT now(),
  payload_avant jsonb,
  payload_apres jsonb
);
ALTER TABLE public.historique_fonctions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "histo_select" ON public.historique_fonctions;
CREATE POLICY "histo_select" ON public.historique_fonctions FOR SELECT
  USING (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "histo_insert" ON public.historique_fonctions;
CREATE POLICY "histo_insert" ON public.historique_fonctions FOR INSERT
  WITH CHECK (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));

-- ─── NOUVELLE TABLE bottin_institutionnel ──────────────────────
CREATE TABLE IF NOT EXISTS public.bottin_institutionnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groupement_id uuid REFERENCES public.groupements_comptables(id) ON DELETE CASCADE,
  categorie public.bottin_categorie NOT NULL,
  organisme varchar(200) NOT NULL,
  correspondant_nom varchar(150),
  fonction varchar(150),
  email varchar(150),
  telephone varchar(30),
  adresse text,
  notes text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bottin_institutionnel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bottin_select" ON public.bottin_institutionnel;
CREATE POLICY "bottin_select" ON public.bottin_institutionnel FOR SELECT USING (true);
DROP POLICY IF EXISTS "bottin_insert" ON public.bottin_institutionnel;
CREATE POLICY "bottin_insert" ON public.bottin_institutionnel FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "bottin_update" ON public.bottin_institutionnel;
CREATE POLICY "bottin_update" ON public.bottin_institutionnel FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "bottin_delete" ON public.bottin_institutionnel;
CREATE POLICY "bottin_delete" ON public.bottin_institutionnel FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bottin_updated_at
  BEFORE UPDATE ON public.bottin_institutionnel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── NOUVELLE TABLE arretes_actes ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.arretes_actes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.acte_type NOT NULL,
  agent_concerne_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  groupement_id uuid REFERENCES public.groupements_comptables(id) ON DELETE SET NULL,
  date_signature date NOT NULL,
  date_effet date,
  date_fin_effet date,
  pdf_url text,
  signataire_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  statut text DEFAULT 'actif',
  references_reglementaires text,
  contenu_hash text,
  payload jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.arretes_actes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actes_select" ON public.arretes_actes;
CREATE POLICY "actes_select" ON public.arretes_actes FOR SELECT
  USING (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "actes_insert" ON public.arretes_actes;
CREATE POLICY "actes_insert" ON public.arretes_actes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "actes_update" ON public.arretes_actes;
CREATE POLICY "actes_update" ON public.arretes_actes FOR UPDATE
  USING (establishment_id IS NULL OR public.user_has_establishment_access(auth.uid(), establishment_id));
DROP POLICY IF EXISTS "actes_delete" ON public.arretes_actes;
CREATE POLICY "actes_delete" ON public.arretes_actes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_arretes_actes_updated_at
  BEFORE UPDATE ON public.arretes_actes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── NOUVELLE TABLE rgpd_acces_logs ────────────────────────────
CREATE TABLE IF NOT EXISTS public.rgpd_acces_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fiche_type text NOT NULL,
  fiche_id uuid NOT NULL,
  action text NOT NULL,
  contexte jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rgpd_acces_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rgpd_logs_select" ON public.rgpd_acces_logs;
CREATE POLICY "rgpd_logs_select" ON public.rgpd_acces_logs FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "rgpd_logs_insert" ON public.rgpd_acces_logs;
CREATE POLICY "rgpd_logs_insert" ON public.rgpd_acces_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── INDEX utiles ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_delegations_dates ON public.delegations_signature (date_fin) WHERE statut = 'active';
CREATE INDEX IF NOT EXISTS idx_actes_type_date ON public.arretes_actes (type, date_signature DESC);
CREATE INDEX IF NOT EXISTS idx_histo_agent ON public.historique_fonctions (agent_id, archive_at DESC);
CREATE INDEX IF NOT EXISTS idx_bottin_groupement ON public.bottin_institutionnel (groupement_id, categorie);
