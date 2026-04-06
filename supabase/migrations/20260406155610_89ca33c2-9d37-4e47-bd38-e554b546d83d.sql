
-- 1. Create trigger to populate user_name server-side on cofieple_audit_trail
CREATE OR REPLACE FUNCTION public.set_audit_trail_user_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''),
    'Utilisateur'
  )
  INTO NEW.user_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  IF NEW.user_name IS NULL THEN
    NEW.user_name := 'Utilisateur';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_audit_user_name
BEFORE INSERT ON public.cofieple_audit_trail
FOR EACH ROW
EXECUTE FUNCTION public.set_audit_trail_user_name();

-- 2. Tighten voyage_participants SELECT to voyage creator + admins only
DROP POLICY IF EXISTS "Users can view participants" ON public.voyage_participants;

CREATE POLICY "Users can view participants"
ON public.voyage_participants
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also tighten INSERT, UPDATE, DELETE to voyage creator + admins
DROP POLICY IF EXISTS "Users can insert participants" ON public.voyage_participants;
CREATE POLICY "Users can insert participants"
ON public.voyage_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can update participants" ON public.voyage_participants;
CREATE POLICY "Users can update participants"
ON public.voyage_participants
FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can delete participants" ON public.voyage_participants;
CREATE POLICY "Users can delete participants"
ON public.voyage_participants
FOR DELETE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.voyages v
    WHERE v.id = voyage_participants.voyage_id
      AND v.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);
