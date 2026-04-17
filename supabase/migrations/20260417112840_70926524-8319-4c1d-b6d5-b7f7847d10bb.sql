
-- 1. voyage_participants : restreindre la lecture au créateur du voyage + admins
DROP POLICY IF EXISTS "Users can view participants" ON public.voyage_participants;

CREATE POLICY "Trip creator and admins can view participants"
ON public.voyage_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Idem pour les paiements (mêmes données sensibles indirectement liées)
DROP POLICY IF EXISTS "Users can manage paiements" ON public.voyage_paiements;

CREATE POLICY "Trip creator and admins can view paiements"
ON public.voyage_paiements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_paiements.voyage_id
      AND v.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Trip creator and admins can insert paiements"
ON public.voyage_paiements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_paiements.voyage_id
      AND v.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Trip creator and admins can update paiements"
ON public.voyage_paiements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_paiements.voyage_id
      AND v.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Trip creator and admins can delete paiements"
ON public.voyage_paiements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_paiements.voyage_id
      AND v.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2. user_establishments : supprimer l'auto-claim
DROP POLICY IF EXISTS "Users can claim an unlinked establishment for themselves" ON public.user_establishments;

-- 3. logs : valider l'UAI contre les établissements de l'utilisateur
DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.logs;

CREATE POLICY "Users can insert logs for their establishments"
ON public.logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    uai IS NULL
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      JOIN public.establishments e ON e.id = ue.establishment_id
      WHERE ue.user_id = auth.uid()
        AND upper(e.uai) = upper(logs.uai)
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
