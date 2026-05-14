
-- Helper function: user_has_groupement_access
CREATE OR REPLACE FUNCTION public.user_has_groupement_access(_user_id uuid, _groupement_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.user_establishments ue
      JOIN public.establishments e ON e.id = ue.establishment_id
      WHERE ue.user_id = _user_id
        AND e.groupement_id = _groupement_id
    );
$$;

REVOKE EXECUTE ON FUNCTION public.user_has_groupement_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_groupement_access(uuid, uuid) TO authenticated;

-- ===== historique_fonctions =====
DROP POLICY IF EXISTS histo_select ON public.historique_fonctions;
DROP POLICY IF EXISTS histo_insert ON public.historique_fonctions;

CREATE POLICY histo_select ON public.historique_fonctions
  FOR SELECT TO authenticated
  USING (
    (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY histo_insert ON public.historique_fonctions
  FOR INSERT TO authenticated
  WITH CHECK (
    (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

-- ===== arretes_actes =====
DROP POLICY IF EXISTS actes_select ON public.arretes_actes;
DROP POLICY IF EXISTS actes_update ON public.arretes_actes;
DROP POLICY IF EXISTS actes_delete ON public.arretes_actes;
DROP POLICY IF EXISTS actes_insert ON public.arretes_actes;

CREATE POLICY actes_select ON public.arretes_actes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (groupement_id IS NOT NULL AND public.user_has_groupement_access(auth.uid(), groupement_id))
  );

CREATE POLICY actes_insert ON public.arretes_actes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (groupement_id IS NOT NULL AND public.user_has_groupement_access(auth.uid(), groupement_id))
  );

CREATE POLICY actes_update ON public.arretes_actes
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (groupement_id IS NOT NULL AND public.user_has_groupement_access(auth.uid(), groupement_id))
  );

CREATE POLICY actes_delete ON public.arretes_actes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== delegations_signature =====
DROP POLICY IF EXISTS delegations_select ON public.delegations_signature;
DROP POLICY IF EXISTS delegations_insert ON public.delegations_signature;
DROP POLICY IF EXISTS delegations_update ON public.delegations_signature;
DROP POLICY IF EXISTS delegations_delete ON public.delegations_signature;

CREATE POLICY delegations_select ON public.delegations_signature
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
  );

CREATE POLICY delegations_insert ON public.delegations_signature
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
  );

CREATE POLICY delegations_update ON public.delegations_signature
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
  );

CREATE POLICY delegations_delete ON public.delegations_signature
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== alertes_transverses =====
DROP POLICY IF EXISTS "Alertes select by establishment access" ON public.alertes_transverses;
DROP POLICY IF EXISTS "Alertes insert authenticated" ON public.alertes_transverses;
DROP POLICY IF EXISTS "Alertes update by establishment access" ON public.alertes_transverses;

CREATE POLICY "Alertes select by establishment access" ON public.alertes_transverses
  FOR SELECT TO authenticated
  USING (
    (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Alertes insert authenticated" ON public.alertes_transverses
  FOR INSERT TO authenticated
  WITH CHECK (
    (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Alertes update by establishment access" ON public.alertes_transverses
  FOR UPDATE TO authenticated
  USING (
    (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

-- ===== bottin_institutionnel =====
DROP POLICY IF EXISTS bottin_select ON public.bottin_institutionnel;

CREATE POLICY bottin_select ON public.bottin_institutionnel
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (groupement_id IS NOT NULL AND public.user_has_groupement_access(auth.uid(), groupement_id))
  );
