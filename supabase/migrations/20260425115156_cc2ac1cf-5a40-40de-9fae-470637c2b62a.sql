-- 2. Table passations_sgeple
CREATE TABLE IF NOT EXISTS public.passations_sgeple (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  sgeple_sortant_id UUID,
  sgeple_entrant_id UUID,
  date_effective_passation DATE,
  date_dernier_jour_sortant DATE,
  date_premier_jour_entrant DATE,
  statut TEXT NOT NULL DEFAULT 'programmee' CHECK (statut IN ('programmee','en_cours','cloturee','abandonnee')),
  inventaire_outils JSONB NOT NULL DEFAULT '[]'::jsonb,
  inventaire_dossiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  dossiers_en_cours JSONB NOT NULL DEFAULT '[]'::jsonb,
  habilitations_a_revoquer JSONB NOT NULL DEFAULT '[]'::jsonb,
  habilitations_a_creer JSONB NOT NULL DEFAULT '[]'::jsonb,
  pv_passation_url TEXT,
  attestation_remise_url TEXT,
  validee_par_ac UUID,
  date_validation_ac TIMESTAMPTZ,
  validee_par_ordo UUID,
  date_validation_ordo TIMESTAMPTZ,
  signature_sortant_at TIMESTAMPTZ,
  signature_entrant_at TIMESTAMPTZ,
  observations TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passations_etab ON public.passations_sgeple(establishment_id);
CREATE INDEX IF NOT EXISTS idx_passations_statut ON public.passations_sgeple(statut);

-- 3. Table accreditations_chefs_etablissement
CREATE TABLE IF NOT EXISTS public.accreditations_chefs_etablissement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  chef_etablissement_id UUID,
  chef_etablissement_nom TEXT,
  date_prise_fonction DATE,
  date_arrete_affectation DATE,
  numero_arrete TEXT,
  arrete_affectation_pdf_url TEXT,
  piece_identite_pdf_url TEXT,
  piece_identite_chiffree BOOLEAN NOT NULL DEFAULT true,
  accreditation_drfip_pdf_url TEXT,
  specimen_signature_url TEXT,
  delegations_signature JSONB NOT NULL DEFAULT '[]'::jsonb,
  coordonnees_pro JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','pieces_recues_partielles','completes','valide_par_ac','transmis_drfip','expire')),
  date_validation_ac TIMESTAMPTZ,
  ac_validateur_id UUID,
  date_transmission_drfip TIMESTAMPTZ,
  bordereau_drfip_url TEXT,
  date_expiration_conservation DATE,
  observations TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accred_etab ON public.accreditations_chefs_etablissement(establishment_id);
CREATE INDEX IF NOT EXISTS idx_accred_statut ON public.accreditations_chefs_etablissement(statut);

-- 4. Table habilitations_opale
CREATE TABLE IF NOT EXISTS public.habilitations_opale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  agent_id UUID,
  agent_nom TEXT,
  sphere TEXT NOT NULL CHECK (sphere IN ('ordonnateur','comptable')),
  profil_opale TEXT NOT NULL,
  perimetre_eple_ids UUID[] NOT NULL DEFAULT '{}',
  date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
  date_activation_souhaitee DATE,
  date_activation_effective DATE,
  date_revocation_prevue DATE,
  date_revocation_effective DATE,
  motif_demande TEXT,
  motif_revocation TEXT,
  acte_url TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente_signature' CHECK (statut IN ('en_attente_signature','active','a_revoquer','revoquee','archivee')),
  signe_par_ordonnateur_id UUID,
  date_signature_ordonnateur TIMESTAMPTZ,
  signe_par_ac_id UUID,
  date_signature_ac TIMESTAMPTZ,
  consulte_par_rectorat JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hab_etab ON public.habilitations_opale(establishment_id);
CREATE INDEX IF NOT EXISTS idx_hab_sphere ON public.habilitations_opale(sphere);
CREATE INDEX IF NOT EXISTS idx_hab_agent ON public.habilitations_opale(agent_id);
CREATE INDEX IF NOT EXISTS idx_hab_statut ON public.habilitations_opale(statut);
CREATE UNIQUE INDEX IF NOT EXISTS uq_hab_agent_etab_sphere_active
  ON public.habilitations_opale(agent_id, establishment_id, sphere)
  WHERE statut = 'active' AND agent_id IS NOT NULL;

-- 5. Table habilitations_recapitulatif_annuel
CREATE TABLE IF NOT EXISTS public.habilitations_recapitulatif_annuel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  groupement_id TEXT NOT NULL,
  annee_scolaire TEXT NOT NULL,
  date_generation TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT,
  xlsx_url TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','en_signature','signe','transmis_rectorat','archive')),
  signe_par_ordonnateurs JSONB NOT NULL DEFAULT '{}'::jsonb,
  signe_par_ac BOOLEAN NOT NULL DEFAULT false,
  date_signature_ac TIMESTAMPTZ,
  date_transmission_rectorat TIMESTAMPTZ,
  url_consultation_rectorat TEXT,
  token_consultation_rectorat TEXT UNIQUE,
  rapport_completude_pct NUMERIC(5,2),
  contenu JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recap_groupement_annee ON public.habilitations_recapitulatif_annuel(groupement_id, annee_scolaire);

-- 6. Observateurs rectoraux
CREATE TABLE IF NOT EXISTS public.observateurs_rectoraux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  perimetre_groupement_id TEXT,
  perimetre_eple_ids UUID[] NOT NULL DEFAULT '{}',
  date_activation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_expiration DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  actif BOOLEAN NOT NULL DEFAULT true,
  cree_par UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.observateur_rectoral_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  observateur_id UUID NOT NULL REFERENCES public.observateurs_rectoraux(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  cible_type TEXT,
  cible_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obs_logs_obs ON public.observateur_rectoral_logs(observateur_id);

-- 7. Liens utiles
CREATE TABLE IF NOT EXISTS public.liens_utiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  ordre_affichage INT NOT NULL DEFAULT 100,
  actif BOOLEAN NOT NULL DEFAULT true,
  ajoute_par UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_liens_categorie ON public.liens_utiles(categorie);
CREATE INDEX IF NOT EXISTS idx_liens_actif ON public.liens_utiles(actif);

-- Triggers updated_at
CREATE TRIGGER trg_passations_updated BEFORE UPDATE ON public.passations_sgeple
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_accred_updated BEFORE UPDATE ON public.accreditations_chefs_etablissement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hab_updated BEFORE UPDATE ON public.habilitations_opale
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_recap_updated BEFORE UPDATE ON public.habilitations_recapitulatif_annuel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_obs_updated BEFORE UPDATE ON public.observateurs_rectoraux
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_liens_updated BEFORE UPDATE ON public.liens_utiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.passations_sgeple ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditations_chefs_etablissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilitations_opale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilitations_recapitulatif_annuel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observateurs_rectoraux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observateur_rectoral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liens_utiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passations_admin_all" ON public.passations_sgeple FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "passations_agent_etab" ON public.passations_sgeple FOR ALL
  USING (public.user_has_establishment_access(auth.uid(), establishment_id))
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));

CREATE POLICY "accred_admin_all" ON public.accreditations_chefs_etablissement FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "accred_agent_etab" ON public.accreditations_chefs_etablissement FOR ALL
  USING (public.user_has_establishment_access(auth.uid(), establishment_id))
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "accred_observateur_select" ON public.accreditations_chefs_etablissement FOR SELECT
  USING (public.has_role(auth.uid(),'observateur_rectoral'));

CREATE POLICY "hab_admin_all" ON public.habilitations_opale FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "hab_agent_etab" ON public.habilitations_opale FOR ALL
  USING (public.user_has_establishment_access(auth.uid(), establishment_id))
  WITH CHECK (public.user_has_establishment_access(auth.uid(), establishment_id));
CREATE POLICY "hab_observateur_select" ON public.habilitations_opale FOR SELECT
  USING (public.has_role(auth.uid(),'observateur_rectoral'));

CREATE POLICY "recap_admin_all" ON public.habilitations_recapitulatif_annuel FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "recap_authenticated_select" ON public.habilitations_recapitulatif_annuel FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "recap_agent_write" ON public.habilitations_recapitulatif_annuel FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "recap_agent_update" ON public.habilitations_recapitulatif_annuel FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "obs_admin_all" ON public.observateurs_rectoraux FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "obs_self_select" ON public.observateurs_rectoraux FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "obs_logs_admin_select" ON public.observateur_rectoral_logs FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "obs_logs_self_insert" ON public.observateur_rectoral_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "obs_logs_self_select" ON public.observateur_rectoral_logs FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "liens_select_authenticated" ON public.liens_utiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "liens_admin_write" ON public.liens_utiles FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "liens_admin_update" ON public.liens_utiles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "liens_admin_delete" ON public.liens_utiles FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('accreditation-pieces','accreditation-pieces', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "accred_pieces_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'accreditation-pieces' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'accreditation-pieces' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "accred_pieces_agent_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'accreditation-pieces' AND auth.uid() IS NOT NULL);

CREATE POLICY "accred_pieces_agent_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'accreditation-pieces' AND auth.uid() IS NOT NULL);
