-- ═══════════════════════════════════════════════════════════════
-- SPRINT A — MODULE FONDS SOCIAUX & ENQUÊTE RECTORAT
-- Migration additive — aucune table existante n'est modifiée
-- ═══════════════════════════════════════════════════════════════

-- 1) ÉLÈVES
CREATE TABLE public.fs_eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  ine text,
  nom text NOT NULL,
  prenom text NOT NULL,
  date_naissance date,
  classe text NOT NULL DEFAULT '',
  niveau text DEFAULT '',
  voie text NOT NULL DEFAULT 'GT' CHECK (voie IN ('GT','PRO','1er_degre')),
  filiere text DEFAULT '',
  statut_boursier boolean NOT NULL DEFAULT false,
  echelon_bourse integer,
  demi_pensionnaire boolean NOT NULL DEFAULT true,
  interne boolean NOT NULL DEFAULT false,
  responsables_legaux jsonb NOT NULL DEFAULT '[]'::jsonb,
  adresse_postale jsonb,
  annee_scolaire text NOT NULL DEFAULT '',
  actif boolean NOT NULL DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, ine)
);

CREATE INDEX idx_fs_eleves_etab ON public.fs_eleves(establishment_id);
CREATE INDEX idx_fs_eleves_voie ON public.fs_eleves(voie);
CREATE INDEX idx_fs_eleves_boursier ON public.fs_eleves(statut_boursier);
CREATE INDEX idx_fs_eleves_search ON public.fs_eleves USING gin (to_tsvector('french', coalesce(nom,'') || ' ' || coalesce(prenom,'') || ' ' || coalesce(classe,'')));

ALTER TABLE public.fs_eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS éleves view"   ON public.fs_eleves FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_eleves.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS éleves insert" ON public.fs_eleves FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_eleves.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS éleves update" ON public.fs_eleves FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_eleves.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS éleves delete" ON public.fs_eleves FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_eleves.establishment_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_fs_eleves_updated BEFORE UPDATE ON public.fs_eleves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) COMMISSIONS
CREATE TABLE public.fs_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  date_commission date NOT NULL,
  type text NOT NULL DEFAULT 'ordinaire' CHECK (type IN ('ordinaire','extraordinaire','urgence')),
  annee_scolaire text NOT NULL DEFAULT '',
  membres_presents jsonb NOT NULL DEFAULT '[]'::jsonb,
  dossiers_examines_count integer NOT NULL DEFAULT 0,
  proces_verbal_url text,
  observations text DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_commissions_etab ON public.fs_commissions(establishment_id);

ALTER TABLE public.fs_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS commissions view"   ON public.fs_commissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_commissions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS commissions insert" ON public.fs_commissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_commissions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS commissions update" ON public.fs_commissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_commissions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS commissions delete" ON public.fs_commissions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_commissions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_fs_commissions_updated BEFORE UPDATE ON public.fs_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) DÉCISIONS D'AIDE FS / FSC
CREATE TABLE public.fs_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  numero_decision text NOT NULL,
  eleve_id uuid NOT NULL REFERENCES public.fs_eleves(id) ON DELETE RESTRICT,
  annee_scolaire text NOT NULL DEFAULT '',
  type_fonds text NOT NULL CHECK (type_fonds IN ('FS','FSC')),
  nature_aide text NOT NULL CHECK (nature_aide IN (
    'restauration','internat_hebergement','alimentation_bons_alimentation',
    'sorties_voyages_periscolaire','transport_scolaire_carburant',
    'fournitures_scolaires_materiel','vetements','soins_medicaux_hygiene'
  )),
  modalite_attribution text NOT NULL CHECK (modalite_attribution IN ('commission','urgence')),
  commission_id uuid REFERENCES public.fs_commissions(id) ON DELETE SET NULL,
  modalite_versement text NOT NULL CHECK (modalite_versement IN ('aide_directe','organisme_tiers')),
  organisme_tiers_nom text,
  organisme_tiers_siret text,
  montant numeric(10,2) NOT NULL CHECK (montant > 0),
  code_activite_opale text NOT NULL DEFAULT '',
  compte_imputation_opale text DEFAULT '',
  date_decision date NOT NULL,
  motif text NOT NULL DEFAULT '',
  pieces_justificatives_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_chef_etablissement_pdf_url text,
  notification_famille_pdf_url text,
  piece_comptable_pdf_url text,
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','decide','mandate','paye','annule')),
  date_mandatement date,
  numero_mandat text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, numero_decision)
);

CREATE INDEX idx_fs_decisions_etab ON public.fs_decisions(establishment_id);
CREATE INDEX idx_fs_decisions_eleve ON public.fs_decisions(eleve_id);
CREATE INDEX idx_fs_decisions_type ON public.fs_decisions(type_fonds);
CREATE INDEX idx_fs_decisions_nature ON public.fs_decisions(nature_aide);
CREATE INDEX idx_fs_decisions_annee ON public.fs_decisions(annee_scolaire);

ALTER TABLE public.fs_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS decisions view"   ON public.fs_decisions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_decisions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS decisions insert" ON public.fs_decisions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_decisions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS decisions update" ON public.fs_decisions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_decisions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS decisions delete" ON public.fs_decisions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_decisions.establishment_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_fs_decisions_updated BEFORE UPDATE ON public.fs_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) SUBVENTIONS RECTORAT
CREATE TABLE public.fs_subventions_rectorat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  date_versement_tresor date NOT NULL,
  date_notification date,
  montant numeric(10,2) NOT NULL CHECK (montant > 0),
  bop text NOT NULL CHECK (bop IN ('141','230','214','140')),
  compte_imputation text NOT NULL,
  nature text DEFAULT '',
  libelle_notification text DEFAULT '',
  annee_scolaire text NOT NULL DEFAULT '',
  est_avance_annee_suivante boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_subv_etab ON public.fs_subventions_rectorat(establishment_id);

ALTER TABLE public.fs_subventions_rectorat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS subv view"   ON public.fs_subventions_rectorat FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_subventions_rectorat.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS subv insert" ON public.fs_subventions_rectorat FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_subventions_rectorat.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS subv update" ON public.fs_subventions_rectorat FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_subventions_rectorat.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS subv delete" ON public.fs_subventions_rectorat FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_subventions_rectorat.establishment_id) OR has_role(auth.uid(),'admin'::app_role));

-- 5) RELIQUATS D'OUVERTURE
CREATE TABLE public.fs_reliquats_ouverture (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  annee_civile integer NOT NULL,
  bop text NOT NULL,
  compte text NOT NULL,
  libelle_dispositif text DEFAULT '',
  montant numeric(10,2) NOT NULL,
  nature text DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_reliq_etab ON public.fs_reliquats_ouverture(establishment_id);

ALTER TABLE public.fs_reliquats_ouverture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS reliq view"   ON public.fs_reliquats_ouverture FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_reliquats_ouverture.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS reliq insert" ON public.fs_reliquats_ouverture FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_reliquats_ouverture.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS reliq update" ON public.fs_reliquats_ouverture FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_reliquats_ouverture.establishment_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "FS reliq delete" ON public.fs_reliquats_ouverture FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = fs_reliquats_ouverture.establishment_id) OR has_role(auth.uid(),'admin'::app_role));