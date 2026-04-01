CREATE OR REPLACE FUNCTION public.is_unclaimed_establishment(_establishment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_establishments ue
    WHERE ue.establishment_id = _establishment_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_unclaimed_establishment(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_unclaimed_establishment(uuid) FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'establishments'
      AND policyname = 'Authenticated users can create establishments'
  ) THEN
    CREATE POLICY "Authenticated users can create establishments"
    ON public.establishments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'establishments'
      AND policyname = 'Authenticated users can view unclaimed establishments'
  ) THEN
    CREATE POLICY "Authenticated users can view unclaimed establishments"
    ON public.establishments
    FOR SELECT
    TO authenticated
    USING (public.is_unclaimed_establishment(id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'establishments'
      AND policyname = 'Authenticated users can update unclaimed establishments'
  ) THEN
    CREATE POLICY "Authenticated users can update unclaimed establishments"
    ON public.establishments
    FOR UPDATE
    TO authenticated
    USING (public.is_unclaimed_establishment(id))
    WITH CHECK (public.is_unclaimed_establishment(id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_establishments'
      AND policyname = 'Users can claim an unlinked establishment for themselves'
  ) THEN
    CREATE POLICY "Users can claim an unlinked establishment for themselves"
    ON public.user_establishments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND public.is_unclaimed_establishment(establishment_id)
    );
  END IF;
END $$;