-- ════════════════════════════════════════════════════════════════
-- TABLE DE RÉFÉRENCE PARTAGÉE (RÉFÉRENTIEL COMPTABLE M9-6 NATIONAL)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.comptes_sens_normal_ref (
  compte VARCHAR(6) PRIMARY KEY,
  libelle TEXT NOT NULL,
  classe SMALLINT NOT NULL CHECK (classe BETWEEN 1 AND 8),
  sous_classe VARCHAR(2) NOT NULL,
  sens_normal TEXT NOT NULL CHECK (sens_normal IN ('D','C','nul','D_ou_nul','C_ou_nul','variable')),
  sens_cloture TEXT NOT NULL CHECK (sens_cloture IN ('D','C','nul','D_ou_nul','C_ou_nul','variable')),
  despecialisable BOOLEAN NOT NULL DEFAULT TRUE,
  type_compte TEXT NOT NULL CHECK (type_compte IN (
    'capitaux','immo','amort','stock','tiers_client','tiers_fournisseur',
    'etat','collectivite','organisme','attente','financier','charge',
    'produit','ordre','liaison','personnel','social','ue'
  )),
  niveau_alerte_si_anormal TEXT NOT NULL DEFAULT 'majeure' CHECK (niveau_alerte_si_anormal IN ('critique','majeure','mineure','info')),
  message_alerte TEXT NOT NULL DEFAULT '',
  cause_probable TEXT NOT NULL DEFAULT '',
  action_corrective TEXT NOT NULL DEFAULT '',
  reference_m96 VARCHAR(64) NOT NULL DEFAULT '',
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csnr_classe ON public.comptes_sens_normal_ref(classe);
CREATE INDEX IF NOT EXISTS idx_csnr_type ON public.comptes_sens_normal_ref(type_compte);

ALTER TABLE public.comptes_sens_normal_ref ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Référentiel : lecture pour tous les authentifiés"
  ON public.comptes_sens_normal_ref FOR SELECT TO authenticated USING (true);
CREATE POLICY "Référentiel : insertion admin"
  ON public.comptes_sens_normal_ref FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Référentiel : modification admin"
  ON public.comptes_sens_normal_ref FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Référentiel : suppression admin"
  ON public.comptes_sens_normal_ref FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_csnr_updated_at BEFORE UPDATE ON public.comptes_sens_normal_ref
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════
-- NOTES DRILL-DOWN ("Marquer comme analysé")
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.balance_drilldown_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  compte VARCHAR(6) NOT NULL,
  year INTEGER NOT NULL,
  commentaire TEXT NOT NULL DEFAULT '',
  analysed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, establishment_id, compte, year)
);

CREATE INDEX IF NOT EXISTS idx_bdn_etab_year ON public.balance_drilldown_notes(establishment_id, year);

ALTER TABLE public.balance_drilldown_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes drill : voir si accès EPLE"
  ON public.balance_drilldown_notes FOR SELECT TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "Notes drill : insérer ses notes"
  ON public.balance_drilldown_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "Notes drill : modifier ses notes"
  ON public.balance_drilldown_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Notes drill : supprimer ses notes"
  ON public.balance_drilldown_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_bdn_updated_at BEFORE UPDATE ON public.balance_drilldown_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════
-- PARAMÈTRES DE PÉRIODE BALANCE PAR EPLE
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.balance_parametres_periode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL UNIQUE REFERENCES public.establishments(id) ON DELETE CASCADE,
  type_periode TEXT NOT NULL DEFAULT 'civil' CHECK (type_periode IN ('civil','scolaire','glissant_12m')),
  date_cloture DATE,
  alertes_actives BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_parametres_periode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Param période : voir si accès EPLE"
  ON public.balance_parametres_periode FOR SELECT TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "Param période : créer si accès EPLE"
  ON public.balance_parametres_periode FOR INSERT TO authenticated
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "Param période : modifier si accès EPLE"
  ON public.balance_parametres_periode FOR UPDATE TO authenticated
  USING (public.user_has_establishment_access(auth.uid(), establishment_id));

CREATE TRIGGER trg_bpp_updated_at BEFORE UPDATE ON public.balance_parametres_periode
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════
-- SEED — RÉFÉRENTIEL 88 COMPTES STRUCTURANTS M9-6
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.comptes_sens_normal_ref
  (compte, libelle, classe, sous_classe, sens_normal, sens_cloture, despecialisable, type_compte, niveau_alerte_si_anormal, message_alerte, cause_probable, action_corrective, reference_m96)
VALUES
  -- CLASSE 1 : CAPITAUX
  ('10681','Réserves','1','10','C','C',TRUE,'capitaux','majeure','Réserves doivent être créditrices','Erreur d''affectation du résultat','Vérifier OD d''affectation','M9-6 T1 §1.1'),
  ('120000','Résultat excédentaire','1','12','C','C',TRUE,'capitaux','mineure','Résultat affecté en réserves','Excédent N-1 non affecté','OD d''affectation 12→10','M9-6 T1 §1.2'),
  ('129000','Résultat déficitaire','1','12','D','D',TRUE,'capitaux','mineure','Déficit à apurer sur réserves','Déficit N-1','Affectation sur 10681','M9-6 T1 §1.2'),
  ('131000','Subv. invest. État','1','13','C','C',TRUE,'capitaux','majeure','Subventions État doivent être créditrices','Erreur ventilation','Vérifier 131/132/134','M9-6 T1 §1.3'),
  ('132000','Subv. invest. Collectivité','1','13','C','C',TRUE,'capitaux','majeure','Subventions collectivité créditrices','Erreur ventilation','Vérifier 131/132/134','M9-6 T1 §1.3'),
  ('134000','Subv. invest. Autres','1','13','C','C',TRUE,'capitaux','majeure','Autres subventions créditrices','Erreur ventilation','Vérifier compte 134','M9-6 T1 §1.3'),
  ('139000','QP virée au CdR','1','13','D','D',TRUE,'capitaux','mineure','Quote-part virée au compte de résultat','Neutralisation amortissement','Vérifier 681/777','M9-6 T1 §1.3'),
  ('140000','Provisions réglementées','1','14','C','C',TRUE,'capitaux','majeure','Provisions doivent être créditrices','Erreur dotation','Vérifier 687/787','M9-6 T1 §1.4'),
  ('150000','Provisions risques charges','1','15','C','C',TRUE,'capitaux','majeure','Provisions risques créditrices','Erreur reprise','Vérifier 681/781','M9-6 T1 §1.5'),

  -- CLASSE 2 : IMMOBILISATIONS
  ('201000','Frais établissement','2','20','D','D',TRUE,'immo','majeure','Immo incorporelle débitrice','Cession non enregistrée','Vérifier 675/775','M9-6 T1 §2.0'),
  ('211000','Terrains','2','21','D','D',TRUE,'immo','majeure','Terrains débiteurs','Cession non enregistrée','Vérifier sortie d''actif','M9-6 T1 §2.1'),
  ('213000','Bâtiments','2','21','D','D',TRUE,'immo','majeure','Bâtiments débiteurs','Cession non enregistrée','Vérifier sortie d''actif','M9-6 T1 §2.1'),
  ('215000','Installations techniques','2','21','D','D',TRUE,'immo','majeure','Installations débitrices','Cession non enregistrée','Vérifier sortie d''actif','M9-6 T1 §2.1'),
  ('218000','Autres immo corporelles','2','21','D','D',TRUE,'immo','majeure','Mobilier matériel débiteur','Cession non enregistrée','Vérifier 675/775','M9-6 T1 §2.1'),
  ('231000','Immo en cours','2','23','D','D',TRUE,'immo','majeure','Immo en cours débitrice','Mise en service non actée','Solder 231→21x','M9-6 T1 §2.3'),
  ('261000','Titres participation','2','26','D','D',TRUE,'immo','majeure','Titres débiteurs','Cession','Vérifier mouvement','M9-6 T1 §2.6'),
  ('281100','Amort. terrains','2','28','C','C',TRUE,'amort','critique','Amortissements TOUJOURS créditeurs','Erreur dotation','Vérifier 6811','M9-6 T1 §2.8'),
  ('281300','Amort. bâtiments','2','28','C','C',TRUE,'amort','critique','Amortissements TOUJOURS créditeurs','Erreur dotation','Vérifier 6811','M9-6 T1 §2.8'),
  ('281500','Amort. installations','2','28','C','C',TRUE,'amort','critique','Amortissements TOUJOURS créditeurs','Erreur dotation','Vérifier 6811','M9-6 T1 §2.8'),
  ('281800','Amort. autres immo','2','28','C','C',TRUE,'amort','critique','Amortissements TOUJOURS créditeurs','Erreur dotation','Vérifier 6811','M9-6 T1 §2.8'),
  ('290000','Dépréciations immo incorp.','2','29','C','C',TRUE,'amort','critique','Dépréciations TOUJOURS créditrices','Erreur dotation','Vérifier 6816','M9-6 T1 §2.9'),
  ('291000','Dépréciations immo corp.','2','29','C','C',TRUE,'amort','critique','Dépréciations TOUJOURS créditrices','Erreur dotation','Vérifier 6816','M9-6 T1 §2.9'),

  -- CLASSE 3 : STOCKS
  ('311000','Stocks matières','3','31','D','D',TRUE,'stock','majeure','Stocks débiteurs','Inventaire non passé','Variation 6031/7031','M9-6 T1 §3.1'),
  ('321000','Stocks fournitures','3','32','D','D',TRUE,'stock','majeure','Stocks débiteurs','Inventaire non passé','Variation 6032','M9-6 T1 §3.2'),
  ('331000','En-cours production','3','33','D','D',TRUE,'stock','mineure','En-cours débiteurs','Production non valorisée','Variation 7133','M9-6 T1 §3.3'),
  ('351000','Stocks produits','3','35','D','D',TRUE,'stock','mineure','Stocks produits débiteurs','Inventaire non passé','Variation 7135','M9-6 T1 §3.5'),
  ('371000','Stocks marchandises','3','37','D','D',TRUE,'stock','mineure','Stocks marchandises débiteurs','Inventaire non passé','Variation 6037','M9-6 T1 §3.7'),
  ('391000','Dépréciations stocks','3','39','C','C',TRUE,'amort','critique','Dépréciations stocks TOUJOURS créditrices','Erreur dotation','Vérifier 6817/7817','M9-6 T1 §3.9'),

  -- CLASSE 4 : TIERS — CLIENTS / FAMILLES
  ('411200','Familles DP','4','41','D','D_ou_nul',TRUE,'tiers_client','critique','Créances familles : SOLDE CRÉDITEUR = TROP-PERÇU (RGP 2022-408)','Encaissement avant titre / sur-paiement','Émettre titre de remboursement','Ord. 2022-408 art. 11'),
  ('411300','Familles internat','4','41','D','D_ou_nul',TRUE,'tiers_client','critique','Créances familles : SOLDE CRÉDITEUR = TROP-PERÇU (RGP 2022-408)','Encaissement avant titre / sur-paiement','Émettre titre de remboursement','Ord. 2022-408 art. 11'),
  ('411800','Autres clients','4','41','D','D_ou_nul',TRUE,'tiers_client','majeure','Créances clients débitrices','Encaissement avant titre','Vérifier circuit','M9-6 T2 §4.1'),
  ('416000','Créances douteuses','4','41','D','D',TRUE,'tiers_client','majeure','Créances douteuses débitrices','Reclassement créance','Vérifier provision 491','M9-6 T2 §4.16'),
  ('418000','Produits non encore facturés','4','41','D','variable',TRUE,'tiers_client','mineure','Produits à émettre débiteurs','Régularisation','OD inversion N+1','M9-6 T2 §4.18'),
  ('419000','Avances reçues clients','4','41','C','C',TRUE,'tiers_client','majeure','Avances familles créditrices','Encaissement anticipé','Apurer sur 411x','M9-6 T2 §4.19'),

  -- TIERS FOURNISSEURS
  ('401000','Fournisseurs','4','40','C','C_ou_nul',TRUE,'tiers_fournisseur','majeure','Fournisseurs créditeurs (dettes)','Paiement sans facture','Vérifier circuit DAO','M9-6 T2 §4.0'),
  ('404000','Fournisseurs immo','4','40','C','C_ou_nul',TRUE,'tiers_fournisseur','majeure','Fournisseurs immo créditeurs','Paiement sans facture immo','Vérifier circuit immo','M9-6 T2 §4.04'),
  ('408000','Factures non parvenues','4','40','C','variable',TRUE,'tiers_fournisseur','mineure','FNP créditrices','Charges à payer','OD inversion N+1','M9-6 T2 §4.08'),
  ('409000','Avances aux fournisseurs','4','40','D','D',TRUE,'tiers_fournisseur','majeure','Avances aux fournisseurs débitrices','Acompte versé','Apurer sur facture','M9-6 T2 §4.09'),

  -- ÉTAT
  ('441100','État - Subv. à recevoir','4','44','D','D_ou_nul',TRUE,'etat','majeure','Créance État débitrice','Subvention notifiée non versée','Relancer ordonnateur académique','M9-6 T2 §4.41'),
  ('441900','État - Avances reçues','4','44','C','C_ou_nul',TRUE,'etat','majeure','Avances État créditrices','Versement avant notification','Régulariser sur 441100','M9-6 T2 §4.41'),
  ('442000','État - Impôts retenus','4','44','C','variable',TRUE,'etat','majeure','Retenues à reverser','Reversement non effectué','Reverser DGFIP','M9-6 T2 §4.42'),
  ('443110','Bourses crédit à répartir','4','44','C','C_ou_nul',FALSE,'etat','critique','Compte 443110 NON-DÉSPÉCIALISABLE — solde DÉBITEUR = bourses payées sans réception préalable','Paiement bourses sans avance État','Solliciter avance académique','M9-6 T2 §4.431'),
  ('443120','Bourses part familles','4','44','D','D_ou_nul',FALSE,'etat','majeure','Excédent bourses à rembourser familles','Sur-versement','Émettre titre familles','M9-6 T2 §4.431'),
  ('443200','Primes / indemnités État','4','44','C','variable',TRUE,'etat','mineure','Primes à reverser','Reversement non effectué','Vérifier liquidation','M9-6 T2 §4.432'),
  ('443800','Fonds sociaux État','4','44','C','C_ou_nul',TRUE,'etat','majeure','Fonds sociaux à utiliser','Crédits non engagés','Décision commission FSE/FSL','M9-6 T2 §4.438'),
  ('444000','État - IS / IFA','4','44','variable','variable',TRUE,'etat','info','Impôt société variable','Acompte vs solde','Vérifier liquidation IS','M9-6 T2 §4.44'),
  ('445000','TVA','4','44','variable','variable',TRUE,'etat','majeure','TVA collectée/déductible','Régularisation périodique','Déclaration CA3','M9-6 T2 §4.45'),
  ('447000','Autres impôts État','4','44','variable','variable',TRUE,'etat','mineure','Autres impôts','Reversement','Vérifier liquidation','M9-6 T2 §4.47'),

  -- COLLECTIVITÉS
  ('441200','Collectivité - Subv. à recevoir','4','44','D','D_ou_nul',TRUE,'collectivite','majeure','Créance collectivité débitrice','DGF notifiée non versée','Relancer collectivité','M9-6 T2 §4.412'),
  ('441920','Collectivité - Avances reçues','4','44','C','C_ou_nul',TRUE,'collectivite','majeure','Avances collectivité créditrices','Versement avant notification','Régulariser','M9-6 T2 §4.4192'),
  ('441220','DGF Région/Département','4','44','D','D_ou_nul',TRUE,'collectivite','majeure','DGF débitrice (en attente versement)','Notification sans encaissement','Relancer','M9-6 T2 §4.4122'),

  -- UE
  ('441300','UE - Subv. à recevoir','4','44','D','D_ou_nul',TRUE,'ue','majeure','Créance UE débitrice','ERASMUS+ notifié non versé','Relancer agence Erasmus','M9-6 T2 §4.413'),
  ('441930','UE - Avances reçues','4','44','C','C_ou_nul',TRUE,'ue','majeure','Avances UE créditrices','Préfinancement','Justifier emploi','M9-6 T2 §4.4193'),

  -- PERSONNEL
  ('421000','Personnel - Rémunérations dues','4','42','C','C_ou_nul',TRUE,'personnel','majeure','Rémunérations dues créditrices','Paie en attente paiement','Vérifier mandatement','M9-6 T2 §4.21'),
  ('422000','Comités d''entreprise','4','42','C','C_ou_nul',TRUE,'personnel','mineure','Subventions CE créditrices','Reversement à effectuer','Vérifier convention','M9-6 T2 §4.22'),
  ('425000','Personnel - Avances/acomptes','4','42','C','C_ou_nul',TRUE,'personnel','mineure','Avances paie créditrices','Acompte non reconstitué','Vérifier paie suivante','M9-6 T2 §4.25'),
  ('427000','Personnel - Oppositions','4','42','C','C',TRUE,'personnel','majeure','Oppositions à reverser','Saisies non reversées','Reverser créancier','M9-6 T2 §4.27'),
  ('428000','Personnel - CCP/CET','4','42','variable','variable',TRUE,'personnel','info','Charges à payer personnel variables','Régularisation','Vérifier provisions','M9-6 T2 §4.28'),

  -- SOCIAL
  ('431000','Sécurité sociale','4','43','C','C_ou_nul',TRUE,'social','majeure','Cotisations URSSAF créditrices','Cotisations à reverser','DSN mensuelle','M9-6 T2 §4.31'),
  ('437000','Autres organismes sociaux','4','43','C','C_ou_nul',TRUE,'social','majeure','Cotisations à reverser','Mutuelles, retraite','Vérifier reversement','M9-6 T2 §4.37'),
  ('438000','Charges sociales sur CP','4','43','variable','variable',TRUE,'social','info','Charges à payer sociales','Provisions CP','OD inversion N+1','M9-6 T2 §4.38'),

  -- COMPTES D'ATTENTE (CRITIQUE)
  ('467000','Autres comptes débiteurs/créditeurs','4','46','C_ou_nul','nul',TRUE,'attente','critique','Compte 467 NON NUL en CLÔTURE = critique (M9-6 T3)','Écriture en attente d''imputation','Apurer avant clôture','M9-6 T3 §4.67'),
  ('471000','Recettes à classer','4','47','variable','nul',TRUE,'attente','critique','Compte 471 NON NUL en CLÔTURE = critique','Encaissement non imputé','Apurer avant 31/12','M9-6 T3 §4.71'),
  ('472000','Dépenses à classer','4','47','variable','nul',TRUE,'attente','critique','Compte 472 NON NUL en CLÔTURE = critique','Décaissement non imputé','Apurer avant 31/12','M9-6 T3 §4.72'),
  ('473000','Recettes à régulariser','4','47','variable','nul',TRUE,'attente','critique','Compte 473 NON NUL en CLÔTURE = critique','Régularisation pendante','Apurer avant 31/12','M9-6 T3 §4.73'),
  ('474000','Dépenses à régulariser','4','47','variable','nul',TRUE,'attente','critique','Compte 474 NON NUL en CLÔTURE = critique','Régularisation pendante','Apurer avant 31/12','M9-6 T3 §4.74'),
  ('475000','Comptes transitoires','4','47','variable','nul',TRUE,'attente','critique','Compte 475 NON NUL en CLÔTURE = critique','Transitoire non soldé','Apurer avant 31/12','M9-6 T3 §4.75'),
  ('476000','Différences de change','4','47','variable','nul',TRUE,'attente','critique','Compte 476 NON NUL en CLÔTURE = critique','Différence non imputée','Apurer avant 31/12','M9-6 T3 §4.76'),
  ('477000','Comptes d''attente divers','4','47','variable','nul',TRUE,'attente','critique','Compte 477 NON NUL en CLÔTURE = critique','Imputation manquante','Apurer avant 31/12','M9-6 T3 §4.77'),

  -- LIAISON
  ('185000','Liaison BP/BA','1','18','variable','variable',FALSE,'liaison','majeure','Compte 185000 doit refléter le miroir budget annexe (égalité absolue)','Discordance entre BP et BA','Réconcilier les sphères','M9-6 T1 §1.85'),
  ('186000','Biens et prestations échangés','1','18','C','C',TRUE,'liaison','mineure','Liaison biens/prestations','Échange entre services','Vérifier 7791','M9-6 T1 §1.86'),

  -- CLASSE 5 : FINANCIER
  ('500000','Valeurs mobilières','5','50','D','D',TRUE,'financier','majeure','VMP débitrices','Cession non enregistrée','Vérifier 767','M9-6 T1 §5.0'),
  ('511200','Chèques à encaisser','5','51','D','D_ou_nul',TRUE,'financier','critique','Chèques à encaisser ne peuvent JAMAIS être créditeurs','Erreur écriture','Inverser OD','M9-6 T2 §5.11'),
  ('514000','Trésor public','5','51','D','D',TRUE,'financier','majeure','Trésor débiteur','Erreur imputation','Vérifier 515','M9-6 T2 §5.14'),
  ('515100','Trésor compte courant','5','51','D','D_ou_nul',TRUE,'financier','critique','Compte 515100 ne peut JAMAIS être créditeur (trésorerie négative impossible)','Erreur ou découvert','Vérifier extrait DFT','M9-6 T2 §5.151'),
  ('515900','Trésor placement','5','51','C','C_ou_nul',TRUE,'financier','critique','Compte 515900 ne peut JAMAIS être débiteur (placement = passif)','Inversion D/C','Inverser OD','M9-6 T2 §5.159'),
  ('531000','Caisse principale','5','53','D','D_ou_nul',TRUE,'financier','critique','Caisse 531 ne peut JAMAIS être créditrice (caisse négative impossible)','Décaissement sans encaissement','Vérifier billetage','M9-6 T2 §5.31'),
  ('541000','Régies d''avances','5','54','D','variable',TRUE,'financier','majeure','Régie d''avance débitrice','Avance versée régisseur','Vérifier reddition','M9-6 T2 §5.41'),

  -- CLASSE 6 : CHARGES
  ('601000','Achats matières','6','60','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.0'),
  ('602100','Achats denrées','6','60','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.02'),
  ('611100','Sous-traitance générale','6','61','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.11'),
  ('615000','Entretien réparations','6','61','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.15'),
  ('620000','Services extérieurs','6','62','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.20'),
  ('640000','Charges personnel','6','64','D','D',TRUE,'charge','majeure','Charges personnel débitrices','Erreur paie','Vérifier mandatement','M9-6 T2 §6.40'),
  ('650000','Autres charges','6','65','D','D',TRUE,'charge','majeure','Charges débitrices','Erreur d''écriture','Vérifier OD','M9-6 T2 §6.50'),
  ('657100','Fonds sociaux versés','6','65','D','D',TRUE,'charge','mineure','Fonds sociaux versés','Aides versées familles','Vérifier décision','M9-6 T2 §6.571'),
  ('660000','Charges financières','6','66','D','D',TRUE,'charge','mineure','Charges financières débitrices','Intérêts','Vérifier','M9-6 T2 §6.60'),
  ('670000','Charges exceptionnelles','6','67','D','D',TRUE,'charge','majeure','Charges except. débitrices','Pénalités','Vérifier','M9-6 T2 §6.70'),
  ('681100','DAP immobilisations','6','68','D','D',TRUE,'charge','majeure','Dotation amort. débitrice','Erreur dotation','Vérifier 28x','M9-6 T2 §6.811'),

  -- CLASSE 7 : PRODUITS
  ('701000','Ventes produits finis','7','70','C','C',TRUE,'produit','majeure','Produits créditeurs','Erreur d''écriture','Vérifier OD','M9-6 T2 §7.01'),
  ('706220','Demi-pension élèves','7','70','C','C',TRUE,'produit','majeure','Produits DP créditeurs','Erreur d''écriture','Vérifier OD','M9-6 T2 §7.0622'),
  ('706230','Internat élèves','7','70','C','C',TRUE,'produit','majeure','Produits internat créditeurs','Erreur d''écriture','Vérifier OD','M9-6 T2 §7.0623'),
  ('708000','Produits activités annexes','7','70','C','C',TRUE,'produit','majeure','Produits annexes créditeurs','Erreur d''écriture','Vérifier OD','M9-6 T2 §7.08'),
  ('741100','Subv. État fonctionnement','7','74','C','C',TRUE,'produit','majeure','Subventions État créditrices','Erreur d''écriture','Vérifier 4411','M9-6 T2 §7.411'),
  ('741210','Subv. Région fonctionnement','7','74','C','C',TRUE,'produit','majeure','Subventions Région créditrices','Erreur d''écriture','Vérifier 44122','M9-6 T2 §7.4121'),
  ('741220','Subv. Département fonctionnement','7','74','C','C',TRUE,'produit','majeure','Subv. Département créditrices','Erreur d''écriture','Vérifier 44122','M9-6 T2 §7.4122'),
  ('741300','Subv. Communes/EPCI','7','74','C','C',TRUE,'produit','majeure','Subv. Communes créditrices','Erreur d''écriture','Vérifier','M9-6 T2 §7.413'),
  ('760000','Produits financiers','7','76','C','C',TRUE,'produit','mineure','Produits financiers créditeurs','Intérêts placements','Vérifier 515900','M9-6 T2 §7.60'),
  ('770000','Produits exceptionnels','7','77','C','C',TRUE,'produit','mineure','Produits except. créditeurs','Cession','Vérifier','M9-6 T2 §7.70'),
  ('781000','Reprises amort./prov.','7','78','C','C',TRUE,'produit','mineure','Reprises créditrices','Reprise provision','Vérifier 14x/15x','M9-6 T2 §7.81'),

  -- CLASSE 8 : ORDRE
  ('801000','Engagements donnés','8','80','variable','variable',TRUE,'ordre','info','Engagements hors bilan','Suivi engagements','Vérifier','M9-6 T1 §8.0'),
  ('802000','Engagements reçus','8','80','variable','variable',TRUE,'ordre','info','Engagements hors bilan','Suivi engagements','Vérifier','M9-6 T1 §8.0')
ON CONFLICT (compte) DO NOTHING;
