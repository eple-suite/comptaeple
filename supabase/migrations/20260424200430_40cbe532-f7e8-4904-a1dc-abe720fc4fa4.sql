-- ═══════════════════════════════════════════════════════════════
-- Module VOYAGES SCOLAIRES — Schéma complet (chantier 1)
-- Conformité : Circulaire MENE2407159C, R.421-20, M9-6, GBCP, CCP 2026
-- ═══════════════════════════════════════════════════════════════

-- 1) Voyages (table principale)
CREATE TABLE IF NOT EXISTS public.vs_voyages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reference_interne TEXT NOT NULL DEFAULT '',
  libelle TEXT NOT NULL,
  destination_ville TEXT NOT NULL DEFAULT '',
  destination_pays TEXT NOT NULL DEFAULT 'France',
  type_sortie TEXT NOT NULL DEFAULT 'voyage_nuitees', -- sortie_jour | sortie_repas | voyage_1nuit | voyage_nuitees
  caractere TEXT NOT NULL DEFAULT 'facultatif', -- obligatoire | facultatif
  type_projet TEXT NOT NULL DEFAULT 'cle_en_main', -- cle_en_main | prestataires_separes | erasmus_porteur | erasmus_partenaire
  date_depart DATE,
  date_retour DATE,
  nombre_nuitees INTEGER NOT NULL DEFAULT 0,
  classes_concernees JSONB NOT NULL DEFAULT '[]'::jsonb,
  nb_eleves_prevus INTEGER NOT NULL DEFAULT 0,
  nb_accompagnateurs_prevus INTEGER NOT NULL DEFAULT 0,
  responsable_pedago_id UUID,
  responsable_pedago_nom TEXT NOT NULL DEFAULT '',
  lien_projet_etablissement TEXT NOT NULL DEFAULT '',
  rattachement_adage BOOLEAN NOT NULL DEFAULT false,
  -- Statut & gouvernance
  statut TEXT NOT NULL DEFAULT 'projet', -- projet | autorise_ca | en_cours | execute | bilan_ca | clos | annule
  date_ca_autorisation DATE,
  numero_acte_ca TEXT,
  -- Budget global
  montant_total_ht NUMERIC NOT NULL DEFAULT 0,
  montant_total_ttc NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'EUR',
  -- Données type clé en main
  agence_nom TEXT,
  agence_siret TEXT,
  agence_garantie TEXT,
  conditions_annulation JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Données Erasmus+
  erasmus_type TEXT,
  erasmus_convention_ref TEXT,
  erasmus_subvention_notifiee NUMERIC NOT NULL DEFAULT 0,
  erasmus_avance_recue NUMERIC NOT NULL DEFAULT 0,
  erasmus_periode_debut DATE,
  erasmus_periode_fin DATE,
  erasmus_taux_cofi NUMERIC NOT NULL DEFAULT 0,
  -- Régies et tags
  regie_avances_id UUID,
  regie_recettes_id UUID,
  caf_dispositif TEXT,
  tags_pedago JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Wizard
  wizard_step INTEGER NOT NULL DEFAULT 1,
  wizard_completed BOOLEAN NOT NULL DEFAULT false,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vs_voyages_etab ON public.vs_voyages(establishment_id);
CREATE INDEX IF NOT EXISTS idx_vs_voyages_statut ON public.vs_voyages(statut);
CREATE INDEX IF NOT EXISTS idx_vs_voyages_dates ON public.vs_voyages(date_depart, date_retour);

ALTER TABLE public.vs_voyages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VS voyages view" ON public.vs_voyages FOR SELECT TO authenticated
USING ((EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_voyages.establishment_id)) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS voyages insert" ON public.vs_voyages FOR INSERT TO authenticated
WITH CHECK ((EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_voyages.establishment_id)) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS voyages update" ON public.vs_voyages FOR UPDATE TO authenticated
USING ((EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_voyages.establishment_id)) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS voyages delete" ON public.vs_voyages FOR DELETE TO authenticated
USING ((EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_voyages.establishment_id)) OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_vs_voyages_updated BEFORE UPDATE ON public.vs_voyages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Recettes
CREATE TABLE IF NOT EXISTS public.vs_recettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  nature TEXT NOT NULL DEFAULT 'famille',
  montant NUMERIC NOT NULL DEFAULT 0,
  statut_financeur TEXT NOT NULL DEFAULT 'hypothese', -- notifiee | demandee | promesse | hypothese
  imputation_compte TEXT NOT NULL DEFAULT '',
  titre_recette_num TEXT,
  statut_encaissement TEXT NOT NULL DEFAULT 'a_emettre',
  pj_url TEXT,
  observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_recettes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS recettes view" ON public.vs_recettes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_recettes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS recettes manage" ON public.vs_recettes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_recettes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_recettes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 3) Dépenses
CREATE TABLE IF NOT EXISTS public.vs_depenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  poste TEXT NOT NULL DEFAULT 'transport', -- transport|hebergement|restauration|activites|assurance|admin|fournitures|divers|accompagnateurs
  libelle TEXT NOT NULL,
  fournisseur TEXT NOT NULL DEFAULT '',
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  taux_tva NUMERIC NOT NULL DEFAULT 0,
  montant_ttc NUMERIC NOT NULL DEFAULT 0,
  compte_charge TEXT NOT NULL DEFAULT '',
  bon_commande TEXT,
  devis_url TEXT,
  facture_url TEXT,
  service_fait_date DATE,
  statut_paiement TEXT NOT NULL DEFAULT 'a_engager',
  est_accompagnateur BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS depenses view" ON public.vs_depenses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_depenses.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS depenses manage" ON public.vs_depenses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_depenses.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_depenses.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 4) Participants
CREATE TABLE IF NOT EXISTS public.vs_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  ine TEXT,
  numero_interne TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe TEXT,
  date_naissance DATE,
  classe TEXT NOT NULL DEFAULT '',
  mef TEXT,
  regime TEXT,
  boursier BOOLEAN NOT NULL DEFAULT false,
  echelon_bourse INTEGER,
  responsables JSONB NOT NULL DEFAULT '[]'::jsonb,
  statut_inscription TEXT NOT NULL DEFAULT 'inscrit',
  participation_theorique NUMERIC NOT NULL DEFAULT 0,
  participation_reelle NUMERIC NOT NULL DEFAULT 0,
  bourse_deduite NUMERIC NOT NULL DEFAULT 0,
  fonds_social NUMERIC NOT NULL DEFAULT 0,
  aide_fse NUMERIC NOT NULL DEFAULT 0,
  reste_a_payer NUMERIC NOT NULL DEFAULT 0,
  mode_paiement TEXT,
  date_paiement DATE,
  quittance_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_participants ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vs_part_voyage ON public.vs_participants(voyage_id);
CREATE INDEX IF NOT EXISTS idx_vs_part_ine ON public.vs_participants(ine);
CREATE POLICY "VS participants view" ON public.vs_participants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_participants.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS participants manage" ON public.vs_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_participants.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_participants.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_vs_part_updated BEFORE UPDATE ON public.vs_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Accompagnateurs
CREATE TABLE IF NOT EXISTS public.vs_accompagnateurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  fonction TEXT NOT NULL DEFAULT 'enseignant',
  discipline TEXT,
  email TEXT,
  telephone TEXT,
  montant_prise_charge NUMERIC NOT NULL DEFAULT 0,
  ordre_mission_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_accompagnateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS accomp view" ON public.vs_accompagnateurs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_accompagnateurs.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS accomp manage" ON public.vs_accompagnateurs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_accompagnateurs.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_accompagnateurs.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 6) Documents générés
CREATE TABLE IF NOT EXISTS public.vs_documents_generes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL, -- code stable (fiche-projet, acte-ca, budget-prev, bilan-creteil, lettre-famille, ...)
  libelle TEXT NOT NULL,
  pdf_url TEXT,
  docx_url TEXT,
  metadonnees JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID
);
ALTER TABLE public.vs_documents_generes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS docs view" ON public.vs_documents_generes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_documents_generes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS docs manage" ON public.vs_documents_generes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_documents_generes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_documents_generes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 7) Bilans (modèle Créteil)
CREATE TABLE IF NOT EXISTS public.vs_bilans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  date_ca_bilan DATE,
  numero_acte_ca_bilan TEXT,
  nb_eleves_partis INTEGER NOT NULL DEFAULT 0,
  nb_accomp_presents INTEGER NOT NULL DEFAULT 0,
  recettes_realisees NUMERIC NOT NULL DEFAULT 0,
  depenses_realisees NUMERIC NOT NULL DEFAULT 0,
  resultat NUMERIC NOT NULL DEFAULT 0,
  reliquat_par_famille NUMERIC NOT NULL DEFAULT 0,
  modalite_traitement TEXT, -- remboursement | don_express | don_tacite | deficit_pris_en_charge
  bilan_pedagogique TEXT NOT NULL DEFAULT '',
  pv_url TEXT,
  cloture BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_bilans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS bilans view" ON public.vs_bilans FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_bilans.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS bilans manage" ON public.vs_bilans FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_bilans.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_bilans.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_vs_bilans_updated BEFORE UPDATE ON public.vs_bilans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) Jalons rétroplanning
CREATE TABLE IF NOT EXISTS public.vs_jalons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL DEFAULT 0,
  libelle TEXT NOT NULL,
  jours_avant_depart INTEGER NOT NULL DEFAULT 0, -- négatif après J
  date_prevue DATE,
  date_realisee DATE,
  responsable TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'a_faire',
  observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_jalons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS jalons view" ON public.vs_jalons FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_jalons.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS jalons manage" ON public.vs_jalons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_jalons.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_jalons.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));

-- 9) Alertes journalisées
CREATE TABLE IF NOT EXISTS public.vs_alertes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  niveau TEXT NOT NULL DEFAULT 'info', -- info | orange | rouge
  message TEXT NOT NULL,
  contexte JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolue BOOLEAN NOT NULL DEFAULT false,
  resolue_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vs_alertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VS alertes view" ON public.vs_alertes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_alertes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "VS alertes manage" ON public.vs_alertes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_alertes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM vs_voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = vs_alertes.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(),'admin'::app_role));