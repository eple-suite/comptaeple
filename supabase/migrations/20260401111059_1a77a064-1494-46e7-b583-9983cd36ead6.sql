
-- Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view establishments" ON public.establishments;

-- Create a restricted SELECT policy: only linked users or admins
CREATE POLICY "Users can view linked establishments"
ON public.establishments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.user_id = auth.uid()
    AND ue.establishment_id = establishments.id
  ) OR public.has_role(auth.uid(), 'admin'::app_role)
);
