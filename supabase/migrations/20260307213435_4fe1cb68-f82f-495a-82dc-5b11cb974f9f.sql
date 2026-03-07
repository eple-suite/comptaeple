
-- Allow authenticated users to insert establishments
CREATE POLICY "Authenticated users can insert establishments"
ON public.establishments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert their own user_establishments links
CREATE POLICY "Users can insert own links"
ON public.user_establishments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
