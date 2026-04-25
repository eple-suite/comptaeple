
-- ===== ENUMS spécifiques à la plateforme =====
DO $$ BEGIN
  CREATE TYPE public.opale_module AS ENUM (
    'comptabilite_generale','comptabilite_budgetaire','depense','recette',
    'tresorerie','paie','immobilisations','integration_pes','inventaire',
    'restitutions','parametrage','habilitations','autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opale_type_contenu AS ENUM (
    'procedure','blocage_resolu','astuce','contournement','parametrage','question_reponse'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opale_statut_actualite AS ENUM ('valide','a_verifier','obsolete','en_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opale_statut_publication AS ENUM ('brouillon','soumise','en_validation','publiee','rejetee','archivee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opale_visibilite AS ENUM ('prive_groupement','academique','national_si_partage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opale_question_statut AS ENUM ('ouverte','repondue','resolue','fermee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== TABLE opale_fiches =====
CREATE TABLE IF NOT EXISTS public.opale_fiches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  auteur_id UUID NOT NULL,
  groupement_origine_id UUID,
  module_opale public.opale_module NOT NULL DEFAULT 'autre',
  sous_theme TEXT,
  type_contenu public.opale_type_contenu NOT NULL DEFAULT 'procedure',
  symptome_observe TEXT,
  contexte_apparition TEXT,
  cause_identifiee TEXT,
  procedure_resolution JSONB NOT NULL DEFAULT '[]'::jsonb,
  pieces_jointes JSONB NOT NULL DEFAULT '[]'::jsonb,
  version_opale_concernee TEXT NOT NULL DEFAULT '',
  date_constatation DATE,
  statut_actualite public.opale_statut_actualite NOT NULL DEFAULT 'valide',
  date_derniere_verification TIMESTAMPTZ,
  verifie_par_id UUID,
  periodicite_reverification_mois INT NOT NULL DEFAULT 6,
  statut_publication public.opale_statut_publication NOT NULL DEFAULT 'brouillon',
  visibilite public.opale_visibilite NOT NULL DEFAULT 'prive_groupement',
  modere_par_id UUID,
  date_moderation TIMESTAMPTZ,
  motif_rejet TEXT,
  nb_consultations INT NOT NULL DEFAULT 0,
  nb_utiles INT NOT NULL DEFAULT 0,
  nb_pas_utiles INT NOT NULL DEFAULT 0,
  taux_utilite_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  liens_fiches_associees UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  references_documentation_officielle TEXT,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_publication TIMESTAMPTZ,
  date_maj TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes_internes TEXT
);

CREATE INDEX IF NOT EXISTS idx_opale_fiches_auteur ON public.opale_fiches(auteur_id);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_module ON public.opale_fiches(module_opale);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_statut_pub ON public.opale_fiches(statut_publication);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_visibilite ON public.opale_fiches(visibilite);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_actualite ON public.opale_fiches(statut_actualite);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_tags ON public.opale_fiches USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_opale_fiches_fts ON public.opale_fiches USING GIN (
  to_tsvector('french',
    coalesce(titre,'') || ' ' || coalesce(symptome_observe,'') || ' ' ||
    coalesce(contexte_apparition,'') || ' ' || coalesce(cause_identifiee,'')
  )
);

ALTER TABLE public.opale_fiches ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.opale_user_can_view_fiche(_user_id UUID, _fiche_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.opale_fiches f
    WHERE f.id = _fiche_id
      AND (
        public.has_role(_user_id, 'admin'::app_role)
        OR public.has_role(_user_id, 'moderateur_opale'::app_role)
        OR public.has_role(_user_id, 'observateur_rectoral'::app_role)
        OR f.auteur_id = _user_id
        OR f.statut_publication = 'publiee'
      )
  );
$$;

CREATE POLICY "opale_fiches_select_publiees"
ON public.opale_fiches FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'observateur_rectoral'::app_role)
  OR auteur_id = auth.uid()
  OR statut_publication = 'publiee'
);

CREATE POLICY "opale_fiches_insert_self"
ON public.opale_fiches FOR INSERT TO authenticated
WITH CHECK (auteur_id = auth.uid());

CREATE POLICY "opale_fiches_update_owner_or_mod"
ON public.opale_fiches FOR UPDATE TO authenticated
USING (
  auteur_id = auth.uid()
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "opale_fiches_delete_admin"
ON public.opale_fiches FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== TABLE opale_fiches_versions =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  version INT NOT NULL,
  contenu_complet JSONB NOT NULL,
  modifie_par_id UUID NOT NULL,
  date_modification TIMESTAMPTZ NOT NULL DEFAULT now(),
  motif_modification TEXT
);
CREATE INDEX IF NOT EXISTS idx_opale_fv_fiche ON public.opale_fiches_versions(fiche_id);
ALTER TABLE public.opale_fiches_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_fv_select"
ON public.opale_fiches_versions FOR SELECT TO authenticated
USING (public.opale_user_can_view_fiche(auth.uid(), fiche_id));

CREATE POLICY "opale_fv_insert"
ON public.opale_fiches_versions FOR INSERT TO authenticated
WITH CHECK (modifie_par_id = auth.uid());

-- ===== TABLE opale_fiches_commentaires =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_commentaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL,
  contenu TEXT NOT NULL,
  parent_commentaire_id UUID REFERENCES public.opale_fiches_commentaires(id) ON DELETE CASCADE,
  signale_inapproprie BOOLEAN NOT NULL DEFAULT false,
  supprime BOOLEAN NOT NULL DEFAULT false,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_maj TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opale_com_fiche ON public.opale_fiches_commentaires(fiche_id);
ALTER TABLE public.opale_fiches_commentaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_com_select"
ON public.opale_fiches_commentaires FOR SELECT TO authenticated
USING (public.opale_user_can_view_fiche(auth.uid(), fiche_id));

CREATE POLICY "opale_com_insert"
ON public.opale_fiches_commentaires FOR INSERT TO authenticated
WITH CHECK (auteur_id = auth.uid() AND public.opale_user_can_view_fiche(auth.uid(), fiche_id));

CREATE POLICY "opale_com_update"
ON public.opale_fiches_commentaires FOR UPDATE TO authenticated
USING (
  auteur_id = auth.uid()
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ===== TABLE opale_fiches_evaluations =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  evaluateur_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('utile','pas_utile')),
  commentaire TEXT,
  date_evaluation TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fiche_id, evaluateur_id)
);
ALTER TABLE public.opale_fiches_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_eval_select"
ON public.opale_fiches_evaluations FOR SELECT TO authenticated
USING (public.opale_user_can_view_fiche(auth.uid(), fiche_id));

CREATE POLICY "opale_eval_insert"
ON public.opale_fiches_evaluations FOR INSERT TO authenticated
WITH CHECK (evaluateur_id = auth.uid() AND public.opale_user_can_view_fiche(auth.uid(), fiche_id));

CREATE POLICY "opale_eval_update_self"
ON public.opale_fiches_evaluations FOR UPDATE TO authenticated
USING (evaluateur_id = auth.uid());

CREATE POLICY "opale_eval_delete_self"
ON public.opale_fiches_evaluations FOR DELETE TO authenticated
USING (evaluateur_id = auth.uid());

-- ===== TABLE opale_fiches_consultations =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  user_id UUID,
  date_consultation TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opale_cons_fiche ON public.opale_fiches_consultations(fiche_id);
ALTER TABLE public.opale_fiches_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_cons_insert" ON public.opale_fiches_consultations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "opale_cons_select_priv" ON public.opale_fiches_consultations
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'observateur_rectoral'::app_role)
  OR user_id = auth.uid()
);

-- ===== TABLE opale_fiches_favoris =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fiche_id, user_id)
);
ALTER TABLE public.opale_fiches_favoris ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_fav_self_all" ON public.opale_fiches_favoris
FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== TABLE opale_fiches_signalements =====
CREATE TABLE IF NOT EXISTS public.opale_fiches_signalements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES public.opale_fiches(id) ON DELETE CASCADE,
  signaleur_id UUID NOT NULL,
  motif TEXT NOT NULL CHECK (motif IN ('obsolete','inexacte','inappropriee','doublon','autre')),
  description TEXT,
  traite BOOLEAN NOT NULL DEFAULT false,
  traite_par_id UUID,
  date_traitement TIMESTAMPTZ,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opale_fiches_signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_sig_select"
ON public.opale_fiches_signalements FOR SELECT TO authenticated
USING (
  signaleur_id = auth.uid()
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "opale_sig_insert"
ON public.opale_fiches_signalements FOR INSERT TO authenticated
WITH CHECK (signaleur_id = auth.uid());

CREATE POLICY "opale_sig_update_mod"
ON public.opale_fiches_signalements FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ===== TABLE opale_questions =====
CREATE TABLE IF NOT EXISTS public.opale_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id UUID NOT NULL,
  titre TEXT NOT NULL,
  contexte TEXT,
  module_concerne public.opale_module NOT NULL DEFAULT 'autre',
  version_opale TEXT,
  captures JSONB NOT NULL DEFAULT '[]'::jsonb,
  statut public.opale_question_statut NOT NULL DEFAULT 'ouverte',
  fiche_resultante_id UUID REFERENCES public.opale_fiches(id) ON DELETE SET NULL,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_resolution TIMESTAMPTZ,
  date_maj TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opale_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_q_select_all" ON public.opale_questions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "opale_q_insert" ON public.opale_questions
FOR INSERT TO authenticated WITH CHECK (auteur_id = auth.uid());

CREATE POLICY "opale_q_update" ON public.opale_questions
FOR UPDATE TO authenticated
USING (
  auteur_id = auth.uid()
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "opale_q_delete_admin" ON public.opale_questions
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
);

-- ===== TABLE opale_reponses =====
CREATE TABLE IF NOT EXISTS public.opale_reponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.opale_questions(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL,
  contenu TEXT NOT NULL,
  est_acceptee_par_demandeur BOOLEAN NOT NULL DEFAULT false,
  votes_pour INT NOT NULL DEFAULT 0,
  votes_contre INT NOT NULL DEFAULT 0,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_maj TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opale_rep_q ON public.opale_reponses(question_id);
ALTER TABLE public.opale_reponses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_r_select_all" ON public.opale_reponses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "opale_r_insert" ON public.opale_reponses
FOR INSERT TO authenticated WITH CHECK (auteur_id = auth.uid());

CREATE POLICY "opale_r_update" ON public.opale_reponses
FOR UPDATE TO authenticated
USING (
  auteur_id = auth.uid()
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ===== TABLE opale_acces_log =====
CREATE TABLE IF NOT EXISTS public.opale_acces_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  cible_type TEXT,
  cible_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  date_action TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opale_log_user ON public.opale_acces_log(user_id);
CREATE INDEX IF NOT EXISTS idx_opale_log_cible ON public.opale_acces_log(cible_type, cible_id);
ALTER TABLE public.opale_acces_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opale_log_insert" ON public.opale_acces_log
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "opale_log_select_admin" ON public.opale_acces_log
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderateur_opale'::app_role)
  OR user_id = auth.uid()
);

-- ===== TRIGGERS =====
DROP TRIGGER IF EXISTS trg_opale_fiches_updated ON public.opale_fiches;
CREATE TRIGGER trg_opale_fiches_updated
BEFORE UPDATE ON public.opale_fiches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_opale_com_updated ON public.opale_fiches_commentaires;
CREATE TRIGGER trg_opale_com_updated
BEFORE UPDATE ON public.opale_fiches_commentaires
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.opale_recalc_utilite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _u INT;
  _p INT;
  _id UUID;
BEGIN
  _id := COALESCE(NEW.fiche_id, OLD.fiche_id);
  SELECT
    COUNT(*) FILTER (WHERE vote = 'utile'),
    COUNT(*) FILTER (WHERE vote = 'pas_utile')
  INTO _u, _p
  FROM public.opale_fiches_evaluations
  WHERE fiche_id = _id;
  UPDATE public.opale_fiches
     SET nb_utiles = _u,
         nb_pas_utiles = _p,
         taux_utilite_pct = CASE WHEN (_u + _p) > 0 THEN ROUND(100.0 * _u / (_u + _p), 2) ELSE 0 END
   WHERE id = _id;
  RETURN COALESCE(NEW, OLD);
END$$;

DROP TRIGGER IF EXISTS trg_opale_eval_recalc ON public.opale_fiches_evaluations;
CREATE TRIGGER trg_opale_eval_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.opale_fiches_evaluations
FOR EACH ROW EXECUTE FUNCTION public.opale_recalc_utilite();

CREATE OR REPLACE FUNCTION public.opale_incr_consultation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opale_fiches
     SET nb_consultations = nb_consultations + 1
   WHERE id = NEW.fiche_id;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_opale_cons_incr ON public.opale_fiches_consultations;
CREATE TRIGGER trg_opale_cons_incr
AFTER INSERT ON public.opale_fiches_consultations
FOR EACH ROW EXECUTE FUNCTION public.opale_incr_consultation();
