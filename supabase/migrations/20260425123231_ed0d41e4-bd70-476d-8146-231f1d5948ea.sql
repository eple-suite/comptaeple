-- ════════════════════════════════════════════════════════════════
-- ENQUETES RECTORAT — Nomenclature M9-6 + Campagnes
-- ════════════════════════════════════════════════════════════════

-- 1) Add 'observateur_rectoral' role if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.app_role'::regtype
      AND enumlabel = 'observateur_rectoral'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'observateur_rectoral';
  END IF;
END$$;

-- 2) Référentiel comptes M9-6 pour enquêtes rectorat
CREATE TABLE IF NOT EXISTS public.enquetes_referentiel_comptes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compte text NOT NULL UNIQUE,
  libelle text NOT NULL,
  racine_famille text NOT NULL,
  programme_bop text,
  sous_programme text,
  sens_solde_normal text NOT NULL CHECK (sens_solde_normal IN ('D','C','nul','D_ou_nul','C_ou_nul','variable')),
  despecialisable boolean NOT NULL DEFAULT true,
  financeur_type text NOT NULL CHECK (financeur_type IN ('etat','collectivite','ue','organisme_public','organisme_prive','dgf','famille','autre')),
  niveau_alerte_si_anormal text NOT NULL DEFAULT 'majeure' CHECK (niveau_alerte_si_anormal IN ('critique','majeure','mineure','info')),
  commentaire_reglementaire text,
  reference_reglementaire text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enquetes_referentiel_comptes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Référentiel lisible par tout authentifié"
  ON public.enquetes_referentiel_comptes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Référentiel modifiable par admin"
  ON public.enquetes_referentiel_comptes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_enquetes_referentiel_updated
  BEFORE UPDATE ON public.enquetes_referentiel_comptes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Campagnes d'enquêtes
CREATE TABLE IF NOT EXISTS public.enquetes_campagnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intitule text NOT NULL,
  type_enquete text NOT NULL,
  periode_concernee text,
  date_lancement date NOT NULL DEFAULT current_date,
  date_echeance date NOT NULL,
  statut text NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('brouillon','ouverte','clôturée','archivée')),
  perimetre_etablissement_ids uuid[] NOT NULL DEFAULT '{}',
  cree_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  origine text NOT NULL DEFAULT 'ac' CHECK (origine IN ('rectorat','ac','systeme')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enquetes_campagnes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campagnes lisibles par utilisateurs concernés ou rectorat"
  ON public.enquetes_campagnes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'observateur_rectoral'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id = ANY(perimetre_etablissement_ids)
    )
  );

CREATE POLICY "Campagnes créables par AC ou admin"
  ON public.enquetes_campagnes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = cree_par
  );

CREATE POLICY "Campagnes modifiables par créateur ou admin"
  ON public.enquetes_campagnes
  FOR UPDATE TO authenticated
  USING (auth.uid() = cree_par OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Campagnes supprimables par admin"
  ON public.enquetes_campagnes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_enquetes_campagnes_updated
  BEFORE UPDATE ON public.enquetes_campagnes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Réponses EPLE par campagne
CREATE TABLE IF NOT EXISTS public.enquetes_reponses_eple (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id uuid NOT NULL REFERENCES public.enquetes_campagnes(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL,
  statut text NOT NULL DEFAULT 'non_commencee' CHECK (statut IN ('non_commencee','en_cours','soumise','validee','rejetee')),
  donnees jsonb NOT NULL DEFAULT '{}'::jsonb,
  commentaires_ac text,
  commentaires_rectorat text,
  soumise_le timestamptz,
  validee_le timestamptz,
  signataire_ac text,
  signataire_ordo text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campagne_id, establishment_id)
);

ALTER TABLE public.enquetes_reponses_eple ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Réponses lisibles par utilisateurs autorisés"
  ON public.enquetes_reponses_eple
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'observateur_rectoral'::app_role)
    OR public.user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Réponses créables par utilisateurs EPLE"
  ON public.enquetes_reponses_eple
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Réponses modifiables par utilisateurs EPLE"
  ON public.enquetes_reponses_eple
  FOR UPDATE TO authenticated
  USING (
    public.user_has_establishment_access(auth.uid(), establishment_id)
    AND statut NOT IN ('soumise','validee')
  );

CREATE POLICY "Réponses suppressibles par admin uniquement"
  ON public.enquetes_reponses_eple
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_enquetes_reponses_updated
  BEFORE UPDATE ON public.enquetes_reponses_eple
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_enquetes_reponses_etab ON public.enquetes_reponses_eple(establishment_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_reponses_campagne ON public.enquetes_reponses_eple(campagne_id);

-- 5) Pré-remplissage référentiel M9-6 (familles complètes)
INSERT INTO public.enquetes_referentiel_comptes
  (compte, libelle, racine_famille, programme_bop, sous_programme, sens_solde_normal, despecialisable, financeur_type, niveau_alerte_si_anormal, commentaire_reglementaire, reference_reglementaire)
VALUES
-- 4411X — créances État
('4411',   'État - Créances diverses',                        '4411X','divers',null,'D',true, 'etat','majeure','Créance sur l''État, sens normal débiteur.','M9-6 tome 3'),
('44111',  'État - P140 (1er degré)',                         '4411X','140','1er degré','D',true, 'etat','majeure','Créance État BOP 140 enseignement scolaire 1er degré public.','M9-6 tome 3 / LFI'),
('44112',  'État - P141 (2nd degré public)',                  '4411X','141','2nd degré public','D',true, 'etat','majeure','Créance État BOP 141 enseignement scolaire 2nd degré public.','M9-6 tome 3 / LFI'),
('44113',  'État - P214 (soutien)',                           '4411X','214','soutien politique éducation','D',true, 'etat','majeure','Créance État BOP 214 soutien.','M9-6 tome 3'),
('44114',  'État - P230 AED (assistants éducation)',          '4411X','230','AED','D',false,'etat','critique','NON DÉSPÉCIALISABLE — crédits fléchés AED. Reversement ou restitution rectorat uniquement.','DAF A3 / BOP 230'),
('44115',  'État - P230 autres dispositifs',                  '4411X','230','autres','D',true, 'etat','majeure','BOP 230 hors AED.','M9-6 tome 3'),
('44116',  'État - autres ministères',                        '4411X','autres',null,'D',true, 'etat','majeure','Créance autres ministères (Agriculture, Mer, etc.).','M9-6 tome 3'),
('44118',  'État - divers',                                   '4411X','divers',null,'D',true, 'etat','mineure','Créances diverses État.','M9-6 tome 3'),
-- 44191X — reliquats État
('44191',  'État - Reliquats globaux',                        '44191X','divers',null,'C',true, 'etat','majeure','Reliquat de subvention État, sens normal créditeur.','M9-6 tome 3'),
('441911', 'État - Reliquat P140',                            '44191X','140',null,'C',true, 'etat','majeure','Reliquat BOP 140.','M9-6 tome 3'),
('441912', 'État - Reliquat P141',                            '44191X','141',null,'C',true, 'etat','majeure','Reliquat BOP 141.','M9-6 tome 3'),
('441913', 'État - Reliquat P214',                            '44191X','214',null,'C',true, 'etat','majeure','Reliquat BOP 214.','M9-6 tome 3'),
('441914', 'État - Reliquat P230 AED',                        '44191X','230','AED','C',false,'etat','critique','NON DÉSPÉCIALISABLE — reliquat AED, restitution rectorat ou reversement uniquement.','DAF A3'),
('441915', 'État - Reliquat P230 autres',                     '44191X','230','autres','C',true, 'etat','majeure','Reliquat BOP 230 hors AED.','M9-6 tome 3'),
('441916', 'État - Reliquat autres ministères',               '44191X','autres',null,'C',true, 'etat','mineure','Reliquat autres ministères.','M9-6 tome 3'),
('441918', 'État - Reliquat divers',                          '44191X','divers',null,'C',true, 'etat','mineure','Reliquat divers.','M9-6 tome 3'),
-- 443110 cas spécial bourses
('443110', 'Bourses nationales (versées par EPLE)',           '443110','230','bourses 2nd degré','C_ou_nul',false,'etat','critique','NON DÉSPÉCIALISABLE — bourses nationales 2nd degré, reversement familles ou restitution rectorat uniquement.','Circulaire MENE1704160C 17/02/2017 / DAF A3'),
-- 4412X — collectivités
('4412',   'Collectivités territoriales - créances',          '4412X',null,null,'D',true, 'collectivite','majeure','Créance collectivités, sens normal débiteur.','M9-6 tome 3'),
('44121',  'Région - créance',                                '4412X',null,'région','D',true, 'collectivite','majeure','Créance Conseil régional.','M9-6 tome 3'),
('44122',  'Département - créance',                           '4412X',null,'département','D',true, 'collectivite','majeure','Créance Conseil départemental.','M9-6 tome 3'),
('44128',  'Autres collectivités - créance',                  '4412X',null,'autres','D',true, 'collectivite','mineure','Communes, EPCI, etc.','M9-6 tome 3'),
-- 44192X — reliquats collectivités
('44192',  'Collectivités - reliquats',                       '44192X',null,null,'C',true, 'collectivite','majeure','Reliquat collectivité.','M9-6 tome 3'),
('441921', 'Région - reliquat',                               '44192X',null,'région','C',true, 'collectivite','majeure','Reliquat Région.','M9-6 tome 3'),
('441922', 'Département - reliquat',                          '44192X',null,'département','C',true, 'collectivite','majeure','Reliquat Département.','M9-6 tome 3'),
('441928', 'Autres collectivités - reliquat',                 '44192X',null,'autres','C',true, 'collectivite','mineure','Reliquat autres collectivités.','M9-6 tome 3'),
-- 4413X — UE
('4413',   'Union européenne - créances',                     '4413X',null,null,'D',true, 'ue','majeure','Créance UE.','M9-6 tome 3'),
('44131',  'Erasmus+ KA1 - créance',                          '4413X',null,'Erasmus+ KA1','D',true, 'ue','majeure','Créance Erasmus+ mobilité (KA1).','Règlement (UE) 2021/817'),
('44132',  'Erasmus+ KA2 - créance',                          '4413X',null,'Erasmus+ KA2','D',true, 'ue','majeure','Créance Erasmus+ partenariat (KA2).','Règlement (UE) 2021/817'),
('44138',  'Autres dispositifs UE - créance',                 '4413X',null,'autres','D',true, 'ue','mineure','FSE+, etc.','M9-6 tome 3'),
-- 44193X — reliquats UE
('44193',  'UE - reliquats',                                  '44193X',null,null,'C',true, 'ue','majeure','Reliquat UE.','M9-6 tome 3'),
('441931', 'Erasmus+ KA1 - reliquat',                         '44193X',null,'Erasmus+ KA1','C',true, 'ue','majeure','Reliquat Erasmus+ KA1.','Règlement (UE) 2021/817'),
('441932', 'Erasmus+ KA2 - reliquat',                         '44193X',null,'Erasmus+ KA2','C',true, 'ue','majeure','Reliquat Erasmus+ KA2.','Règlement (UE) 2021/817'),
('441938', 'Autres dispositifs UE - reliquat',                '44193X',null,'autres','C',true, 'ue','mineure','Reliquat autres dispositifs UE.','M9-6 tome 3'),
-- 4416X — autres organismes publics
('4416',   'Autres organismes publics - créances',            '4416X',null,null,'D',true, 'organisme_public','majeure','Caisses, mutuelles, organismes paritaires.','M9-6 tome 3'),
('44161',  'Caisses sociales',                                '4416X',null,'caisses','D',true, 'organisme_public','majeure','CAF, CPAM, etc.','M9-6 tome 3'),
('44162',  'Mutuelles',                                       '4416X',null,'mutuelles','D',true, 'organisme_public','mineure','Mutuelles partenaires.','M9-6 tome 3'),
('44168',  'Autres organismes publics divers',                '4416X',null,'autres','D',true, 'organisme_public','mineure','Organismes paritaires divers.','M9-6 tome 3'),
-- 4417X — organismes privés / dons
('4417',   'Organismes privés / dons - créances',             '4417X',null,null,'D',true, 'organisme_prive','majeure','Fondations, mécénat, associations.','M9-6 tome 3'),
('44171',  'Fondations',                                      '4417X',null,'fondations','D',true, 'organisme_prive','majeure','Fondations privées.','M9-6 tome 3'),
('44172',  'Mécénat d''entreprise',                           '4417X',null,'mécénat','D',true, 'organisme_prive','majeure','Mécénat entreprises.','Code général impôts art. 238 bis'),
('44173',  'Associations',                                    '4417X',null,'associations','D',true, 'organisme_prive','mineure','Subventions associations.','M9-6 tome 3'),
('44178',  'Organismes privés divers',                        '4417X',null,'autres','D',true, 'organisme_prive','mineure','Autres dons et legs.','M9-6 tome 3'),
-- 44181X — DGF (dotations globales fonctionnement)
('44181',  'DGF Région',                                      '44181X',null,'région','D_ou_nul',true, 'collectivite','majeure','Dotation globale fonctionnement Région.','Code éducation L.421-11'),
('44182',  'DGF Département',                                 '44181X',null,'département','D_ou_nul',true, 'collectivite','majeure','Dotation globale fonctionnement Département.','Code éducation L.421-11'),
('44185',  'DGF - Aides sociales élèves',                     '44181X',null,'aides sociales','D_ou_nul',true, 'collectivite','majeure','Aides sociales élèves financées par collectivité.','Code éducation'),
('44188',  'DGF - autres aides',                              '44181X',null,'autres','D_ou_nul',true, 'collectivite','mineure','Autres aides DGF.','Code éducation')
ON CONFLICT (compte) DO UPDATE SET
  libelle = EXCLUDED.libelle,
  racine_famille = EXCLUDED.racine_famille,
  programme_bop = EXCLUDED.programme_bop,
  sous_programme = EXCLUDED.sous_programme,
  sens_solde_normal = EXCLUDED.sens_solde_normal,
  despecialisable = EXCLUDED.despecialisable,
  financeur_type = EXCLUDED.financeur_type,
  niveau_alerte_si_anormal = EXCLUDED.niveau_alerte_si_anormal,
  commentaire_reglementaire = EXCLUDED.commentaire_reglementaire,
  reference_reglementaire = EXCLUDED.reference_reglementaire,
  updated_at = now();