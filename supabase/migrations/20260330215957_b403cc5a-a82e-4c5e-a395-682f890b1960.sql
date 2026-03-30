
-- ============================================================
-- SECURITY FIX: Harden RLS policies
-- ============================================================

-- 1) user_establishments: Remove open INSERT policy, restrict to admins only
DROP POLICY IF EXISTS "Users can insert own links" ON public.user_establishments;

CREATE POLICY "Only admins can link users to establishments"
  ON public.user_establishments
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) establishments: Remove open INSERT policy, restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can insert establishments" ON public.establishments;

CREATE POLICY "Only admins can create establishments"
  ON public.establishments
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) indicators: Add missing UPDATE and DELETE policies
CREATE POLICY "Users can update linked indicators"
  ON public.indicators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = indicators.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = indicators.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete linked indicators"
  ON public.indicators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = indicators.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) voyage_marches_alertes: Add missing UPDATE and DELETE policies
CREATE POLICY "Users can update marches alertes"
  ON public.voyage_marches_alertes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_marches_alertes.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_marches_alertes.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete marches alertes"
  ON public.voyage_marches_alertes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_marches_alertes.establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );
