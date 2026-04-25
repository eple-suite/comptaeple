-- =========================================================
-- COCKPIT RECTORAL — Fondations
-- =========================================================

-- 1. GROUPEMENTS COMPTABLES -------------------------------
CREATE TABLE IF NOT EXISTS public.groupements_comptables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  academie text NOT NULL DEFAULT 'Guadeloupe',
  rectorat_libelle text NOT NULL DEFAULT 'Académie de la Guadeloupe',
  lycee_siege_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  agent_comptable_titulaire text,
  agent_comptable_prise_fonction date,
  fonde_de_pouvoir text,
  adresse text,
  telephone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS groupement_id uuid REFERENCES public.groupements_comptables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_establishments_groupement ON public.establishments(groupement_id);

ALTER TABLE public.groupements_comptables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groupements visible to linked users"
  ON public.groupements_comptables FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.establishments e
      JOIN public.user_establishments ue ON ue.establishment_id = e.id
      WHERE e.groupement_id = groupements_comptables.id
        AND ue.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage groupements"
  ON public.groupements_comptables FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_groupements_updated
  BEFORE UPDATE ON public.groupements_comptables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ALERTES TRANSVERSES ----------------------------------
CREATE TABLE IF NOT EXISTS public.alertes_transverses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_origine text NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  niveau text NOT NULL CHECK (niveau IN ('rouge','orange','jaune','info')),
  titre text NOT NULL,
  description text,
  echeance date,
  statut text NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte','close','ignoree')),
  action_url text,
  reference_reglementaire text,
  dedup_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closed_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alertes_dedup
  ON public.alertes_transverses(module_origine, establishment_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alertes_etab ON public.alertes_transverses(establishment_id);
CREATE INDEX IF NOT EXISTS idx_alertes_statut ON public.alertes_transverses(statut);

ALTER TABLE public.alertes_transverses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alertes select by establishment access"
  ON public.alertes_transverses FOR SELECT
  TO authenticated
  USING (
    establishment_id IS NULL
    OR user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Alertes insert authenticated"
  ON public.alertes_transverses FOR INSERT
  TO authenticated
  WITH CHECK (
    establishment_id IS NULL
    OR user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Alertes update by establishment access"
  ON public.alertes_transverses FOR UPDATE
  TO authenticated
  USING (
    establishment_id IS NULL
    OR user_has_establishment_access(auth.uid(), establishment_id)
  );

CREATE POLICY "Alertes delete admin"
  ON public.alertes_transverses FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_alertes_transverses_updated
  BEFORE UPDATE ON public.alertes_transverses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. JALONS CALENDRIER PERSONNALISÉS ----------------------
CREATE TABLE IF NOT EXISTS public.cockpit_jalons_perso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  date_jalon date NOT NULL,
  couleur text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cockpit_jalons_perso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jalons perso owner all"
  ON public.cockpit_jalons_perso FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. PROFILS ÉTENDUS --------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_role text NOT NULL DEFAULT 'agent_comptable',
  ADD COLUMN IF NOT EXISTS tour_complete boolean NOT NULL DEFAULT false;
