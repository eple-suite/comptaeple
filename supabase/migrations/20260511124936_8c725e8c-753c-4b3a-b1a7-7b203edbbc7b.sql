
-- Permettre à un utilisateur authentifié de se rattacher lui-même
-- à un établissement encore non revendiqué (aucun lien existant).
DROP POLICY IF EXISTS "Only admins can link users to establishments" ON public.user_establishments;

CREATE POLICY "Admins can link any user to establishments"
ON public.user_establishments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can self-link to unclaimed establishments"
ON public.user_establishments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_unclaimed_establishment(establishment_id)
);
