-- 1) Align SELECT policy on voyage_participants with INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Trip creator and admins can view participants" ON public.voyage_participants;

CREATE POLICY "Users linked to establishment can view participants"
ON public.voyage_participants
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1
    FROM public.voyages v
    JOIN public.user_establishments ue ON ue.establishment_id = v.establishment_id
    WHERE v.id = voyage_participants.voyage_id
      AND ue.user_id = auth.uid()
  ))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Restrict listing of establishment-logos bucket
-- Drop any existing broad SELECT policies on this bucket
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND (
        polname ILIKE '%establishment-logo%'
        OR polname ILIKE '%establishment_logo%'
        OR polname ILIKE 'Public Access%establishment%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END$$;

-- Allow listing only to users linked to the establishment (folder = establishment_id)
CREATE POLICY "Linked users can list establishment logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Allow linked users to upload/update/delete their establishment logos
CREATE POLICY "Linked users can upload establishment logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Linked users can update establishment logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Linked users can delete establishment logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Switch bucket to private — public URLs already saved in DB continue to work
-- via signed URLs only if regenerated. Since logos are referenced by getPublicUrl,
-- we keep the bucket public to preserve existing logo display, but the broad
-- listing policy is now removed. (No bucket flip — listing restriction is enough
-- to address the linter finding for "public bucket allows listing".)
