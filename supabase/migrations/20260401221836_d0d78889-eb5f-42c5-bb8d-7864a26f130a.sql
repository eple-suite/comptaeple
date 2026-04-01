
-- Fix 1: Replace ALL policy on voyage_participants with explicit per-operation policies including WITH CHECK
DROP POLICY IF EXISTS "Users can manage participants" ON public.voyage_participants;

CREATE POLICY "Users can view participants"
ON public.voyage_participants FOR SELECT TO authenticated
USING (
  (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can insert participants"
ON public.voyage_participants FOR INSERT TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update participants"
ON public.voyage_participants FOR UPDATE TO authenticated
USING (
  (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete participants"
ON public.voyage_participants FOR DELETE TO authenticated
USING (
  (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Add explicit DELETE policy for balances (scoped to linked establishments)
CREATE POLICY "Users can delete linked balances"
ON public.balances FOR DELETE TO authenticated
USING (
  (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = balances.establishment_id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 3: Remove overly permissive update policy on unclaimed establishments
DROP POLICY IF EXISTS "Authenticated users can update unclaimed establishments" ON public.establishments;
