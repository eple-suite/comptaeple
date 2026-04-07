
-- 1. Fix user_roles policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add self-delete policy on user_establishments
CREATE POLICY "Users can remove themselves from establishments"
  ON public.user_establishments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Fix voyage_participants RLS: use establishment membership instead of user_id
DROP POLICY IF EXISTS "Users can view participants" ON public.voyage_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON public.voyage_participants;
DROP POLICY IF EXISTS "Users can update participants" ON public.voyage_participants;
DROP POLICY IF EXISTS "Users can delete participants" ON public.voyage_participants;

CREATE POLICY "Users can view participants"
  ON public.voyage_participants FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM voyages v
      JOIN user_establishments ue ON ue.establishment_id = v.establishment_id
      WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can insert participants"
  ON public.voyage_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM voyages v
      JOIN user_establishments ue ON ue.establishment_id = v.establishment_id
      WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update participants"
  ON public.voyage_participants FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM voyages v
      JOIN user_establishments ue ON ue.establishment_id = v.establishment_id
      WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM voyages v
      JOIN user_establishments ue ON ue.establishment_id = v.establishment_id
      WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete participants"
  ON public.voyage_participants FOR DELETE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM voyages v
      JOIN user_establishments ue ON ue.establishment_id = v.establishment_id
      WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );
