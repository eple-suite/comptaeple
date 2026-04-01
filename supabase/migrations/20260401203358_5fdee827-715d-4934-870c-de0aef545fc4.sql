CREATE OR REPLACE FUNCTION public.can_create_establishment_with_uai(_uai text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.establishments e
    WHERE upper(e.uai) = upper(_uai)
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_create_establishment_with_uai(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_create_establishment_with_uai(text) FROM anon;

DROP POLICY IF EXISTS "Authenticated users can create establishments" ON public.establishments;

CREATE POLICY "Authenticated users can create establishments"
ON public.establishments
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_establishment_with_uai(uai));