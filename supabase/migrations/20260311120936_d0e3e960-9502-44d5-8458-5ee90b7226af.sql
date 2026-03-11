-- Add unique constraint on UAI if not exists (for upsert onConflict)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'establishments_uai_key'
  ) THEN
    ALTER TABLE public.establishments ADD CONSTRAINT establishments_uai_key UNIQUE (uai);
  END IF;
END $$;

-- Allow authenticated users to update establishments they're linked to
CREATE POLICY "Users can update linked establishments"
ON public.establishments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_establishments ue
    WHERE ue.user_id = auth.uid() AND ue.establishment_id = establishments.id
  ) OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_establishments ue
    WHERE ue.user_id = auth.uid() AND ue.establishment_id = establishments.id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);