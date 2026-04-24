
-- ============================================
-- MARCHÉS PUBLICS — Schéma complet (CCP 2026)
-- ============================================

-- Table des seuils CCP horodatés (modifiable par AC, source de vérité)
CREATE TABLE public.mp_seuils_ccp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_debut date NOT NULL,
  date_fin date,
  type_marche text NOT NULL CHECK (type_marche IN ('fournitures_services','travaux','fournitures_services_etat')),
  seuil_dispense numeric NOT NULL,
  seuil_mapa_publicite numeric,           -- ex 90 000 € HT publicité BOAMP
  seuil_formalisee numeric NOT NULL,
  seuil_petits_lots numeric,              -- art. R2123-1 b 2°
  seuil_profil_acheteur numeric,          -- dématérialisation obligatoire
  base_legale text NOT NULL DEFAULT '',
  commentaire text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.mp_seuils_ccp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MP seuils view all auth" ON public.mp_seuils_ccp FOR SELECT TO authenticated USING (true);
CREATE POLICY "MP seuils admin manage" ON public.mp_seuils_ccp FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "MP seuils auth insert" ON public.mp_seuils_ccp FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "MP seuils auth update" ON public.mp_seuils_ccp FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER mp_seuils_updated_at BEFORE UPDATE ON public.mp_seuils_ccp
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Familles d'achat (codification CPV simplifiée EPLE)
CREATE TABLE public.mp_familles_achat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  type_marche text NOT NULL CHECK (type_marche IN ('fournitures','services','travaux')),
  groupe text NOT NULL DEFAULT '',
  ordre integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_familles_achat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MP familles view all" ON public.mp_familles_achat FOR SELECT TO authenticated USING (true);
CREATE POLICY "MP familles admin manage" ON public.mp_familles_achat FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fournisseurs marchés (base + anti-saucissonnage)
CREATE TABLE public.mp_fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  raison_sociale text NOT NULL,
  siret text,
  adresse text NOT NULL DEFAULT '',
  code_postal text NOT NULL DEFAULT '',
  ville text NOT NULL DEFAULT '',
  contact_nom text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_tel text NOT NULL DEFAULT '',
  familles_principales jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  actif boolean NOT NULL DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_fournisseurs_etab ON public.mp_fournisseurs(establishment_id);
CREATE INDEX idx_mp_fournisseurs_siret ON public.mp_fournisseurs(siret);

ALTER TABLE public.mp_fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MP fournisseurs view" ON public.mp_fournisseurs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_fournisseurs.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP fournisseurs insert" ON public.mp_fournisseurs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_fournisseurs.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP fournisseurs update" ON public.mp_fournisseurs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_fournisseurs.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP fournisseurs delete" ON public.mp_fournisseurs FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_fournisseurs.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER mp_fournisseurs_updated_at BEFORE UPDATE ON public.mp_fournisseurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marchés
CREATE TABLE public.mp_marches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  reference_interne text NOT NULL,
  libelle text NOT NULL,
  service_demandeur text NOT NULL DEFAULT '',
  demandeur text NOT NULL DEFAULT '',
  date_emission_besoin date NOT NULL,
  date_livraison_souhaitee date,
  date_engagement date,                      -- détermine seuils applicables
  date_notification_cible date,
  type_marche text NOT NULL CHECK (type_marche IN ('fournitures','services','travaux')),
  famille_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  quantites text NOT NULL DEFAULT '',
  specifications text NOT NULL DEFAULT '',
  contraintes text NOT NULL DEFAULT '',
  exigences_environnementales text NOT NULL DEFAULT '',
  clauses_sociales text NOT NULL DEFAULT '',
  allotissement boolean NOT NULL DEFAULT true,
  justification_lot_unique text NOT NULL DEFAULT '',

  -- Estimation
  methode_estimation text NOT NULL DEFAULT 'devis',
  montant_estime_ht numeric NOT NULL DEFAULT 0,
  taux_tva numeric NOT NULL DEFAULT 8.5,
  montant_estime_ttc numeric NOT NULL DEFAULT 0,
  duree_mois integer NOT NULL DEFAULT 0,
  reconductions_nb integer NOT NULL DEFAULT 0,
  reconductions_duree_mois integer NOT NULL DEFAULT 0,
  montant_total_ht numeric NOT NULL DEFAULT 0,

  -- Anti-saucissonnage
  cumul_meme_famille_12m numeric NOT NULL DEFAULT 0,
  previsionnel_12m_suivants numeric NOT NULL DEFAULT 0,
  cumul_total_12m numeric NOT NULL DEFAULT 0,

  -- Procédure auto
  procedure_calculee text NOT NULL DEFAULT 'dispense' CHECK (procedure_calculee IN ('dispense','mapa','mapa_publicite','formalisee')),
  base_legale text NOT NULL DEFAULT '',

  -- Critères attribution
  criteres jsonb NOT NULL DEFAULT '[]'::jsonb,
  methode_notation_prix text NOT NULL DEFAULT 'lineaire',

  -- Imputation
  chapitre_budgetaire text NOT NULL DEFAULT '',
  compte_imputation text NOT NULL DEFAULT '',
  code_activite text NOT NULL DEFAULT '',

  -- Suivi
  statut text NOT NULL DEFAULT 'preparation' CHECK (statut IN ('preparation','publie','analyse','attribue','notifie','execution','solde','cloture','resilie')),
  fournisseur_attributaire_id uuid,
  date_attribution date,
  date_notification date,
  date_fin_execution date,
  montant_realise numeric NOT NULL DEFAULT 0,

  -- Workflow
  checklist_validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  historique jsonb NOT NULL DEFAULT '[]'::jsonb,

  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_marches_etab ON public.mp_marches(establishment_id);
CREATE INDEX idx_mp_marches_famille ON public.mp_marches(famille_code);
CREATE INDEX idx_mp_marches_statut ON public.mp_marches(statut);
CREATE INDEX idx_mp_marches_date_eng ON public.mp_marches(date_engagement);

ALTER TABLE public.mp_marches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MP marches view" ON public.mp_marches FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_marches.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP marches insert" ON public.mp_marches FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_marches.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP marches update" ON public.mp_marches FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_marches.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP marches delete" ON public.mp_marches FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = mp_marches.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER mp_marches_updated_at BEFORE UPDATE ON public.mp_marches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lots
CREATE TABLE public.mp_marches_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  titre text NOT NULL,
  description text NOT NULL DEFAULT '',
  montant_estime_ht numeric NOT NULL DEFAULT 0,
  criteres jsonb NOT NULL DEFAULT '[]'::jsonb,
  fournisseur_attributaire_id uuid,
  montant_attribue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_lots_marche ON public.mp_marches_lots(marche_id);

ALTER TABLE public.mp_marches_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MP lots view" ON public.mp_marches_lots FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_lots.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP lots manage" ON public.mp_marches_lots FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_lots.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_lots.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Jalons (rétroplanning)
CREATE TABLE public.mp_marches_jalons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  ordre integer NOT NULL DEFAULT 0,
  libelle text NOT NULL,
  date_prevue date NOT NULL,
  date_realisee date,
  responsable text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire','en_cours','fait','en_retard')),
  observations text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_jalons_marche ON public.mp_marches_jalons(marche_id);

ALTER TABLE public.mp_marches_jalons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MP jalons view" ON public.mp_marches_jalons FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_jalons.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP jalons manage" ON public.mp_marches_jalons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_jalons.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_jalons.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Bons de commande / engagements
CREATE TABLE public.mp_marches_bdc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  numero text NOT NULL,
  date_emission date NOT NULL,
  fournisseur_id uuid,
  montant_ht numeric NOT NULL DEFAULT 0,
  montant_ttc numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'emis' CHECK (statut IN ('emis','livre','facture','paye','annule')),
  observations text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_bdc_marche ON public.mp_marches_bdc(marche_id);

ALTER TABLE public.mp_marches_bdc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MP bdc view" ON public.mp_marches_bdc FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_bdc.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP bdc manage" ON public.mp_marches_bdc FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_bdc.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_bdc.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Documents générés
CREATE TABLE public.mp_marches_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  type_piece text NOT NULL,
  nom_fichier text NOT NULL,
  url_fichier text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_mp_pieces_marche ON public.mp_marches_pieces(marche_id);

ALTER TABLE public.mp_marches_pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MP pieces view" ON public.mp_marches_pieces FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_pieces.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "MP pieces manage" ON public.mp_marches_pieces FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_pieces.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_pieces.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Seed des seuils CCP 2026
INSERT INTO public.mp_seuils_ccp (date_debut, date_fin, type_marche, seuil_dispense, seuil_mapa_publicite, seuil_formalisee, seuil_petits_lots, seuil_profil_acheteur, base_legale, commentaire) VALUES
  ('2026-01-01','2026-03-31','fournitures_services', 40000, 90000, 216000, 40000, 40000, 'R2122-8 CCP — version antérieure au décret 2025-1386', 'Seuil dispense fournitures/services au 1er janvier 2026'),
  ('2026-04-01', NULL,        'fournitures_services', 60000, 90000, 216000, 60000, 60000, 'R2122-8 CCP modifié par décret 2025-1386 du 29/12/2025', 'Seuil dispense relevé à 60 000 € HT à compter du 1er avril 2026'),
  ('2026-01-01', NULL,        'travaux',             100000, 90000, 5404000, 100000, 100000, 'R2122-8 CCP pérennisé par décret 2025-1386', 'Seuil dispense travaux pérennisé à 100 000 € HT'),
  ('2026-01-01', NULL,        'fournitures_services_etat', 40000, 90000, 140000, 40000, 40000, 'R2124-1 CCP', 'Seuils État — référence');

-- Seed familles d'achat EPLE
INSERT INTO public.mp_familles_achat (code, libelle, type_marche, groupe, ordre) VALUES
  ('F-MAN','Manuels scolaires','fournitures','Pédagogique',10),
  ('F-MAT','Matériel pédagogique','fournitures','Pédagogique',20),
  ('F-CONSO','Consommables pédagogiques','fournitures','Pédagogique',30),
  ('F-MOB','Mobilier scolaire','fournitures','Équipement',40),
  ('F-INFO','Équipement informatique','fournitures','Équipement',50),
  ('F-DENR','Denrées alimentaires','fournitures','Restauration',60),
  ('F-ENT','Produits d''entretien','fournitures','Logistique',70),
  ('F-BUR','Fournitures de bureau','fournitures','Administration',80),
  ('F-VET','Vêtements de travail','fournitures','Logistique',90),
  ('F-OUT','Petit outillage','fournitures','Logistique',100),
  ('S-VOY','Voyages et sorties pédagogiques','services','Pédagogique',200),
  ('S-TRP','Transport scolaire','services','Pédagogique',210),
  ('S-MAINT','Maintenance des équipements','services','Logistique',220),
  ('S-NET','Nettoyage','services','Logistique',230),
  ('S-REST','Restauration sous-traitée','services','Restauration',240),
  ('S-FORM','Formation professionnelle','services','Administration',250),
  ('S-INTEL','Prestations intellectuelles','services','Administration',260),
  ('S-ASS','Assurances','services','Administration',270),
  ('S-TEL','Télécommunications','services','Administration',280),
  ('S-REPRO','Reprographie','services','Administration',290),
  ('S-GARD','Gardiennage','services','Sécurité',300),
  ('S-CTRL','Contrôles réglementaires','services','Sécurité',310),
  ('S-LAB','Analyses de laboratoire','services','Restauration',320),
  ('T-RENO','Travaux de rénovation','travaux','Bâtiment',400),
  ('T-PEINT','Peinture','travaux','Bâtiment',410),
  ('T-PLOMB','Plomberie','travaux','Bâtiment',420),
  ('T-ELEC','Électricité','travaux','Bâtiment',430),
  ('T-MEN','Menuiserie','travaux','Bâtiment',440),
  ('T-COUV','Couverture','travaux','Bâtiment',450),
  ('T-VRD','VRD','travaux','Extérieur',460),
  ('T-AMEN','Aménagement extérieur','travaux','Extérieur',470);
