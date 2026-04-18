-- Remplacer la politique SELECT trop ouverte par une politique restreinte
DROP POLICY IF EXISTS "Logos publiquement accessibles" ON storage.objects;

-- Lecture autorisée uniquement aux utilisateurs authentifiés (pas de listing anonyme)
-- Les URLs publiques restent servies par le CDN même sans cette politique côté API.
CREATE POLICY "Logos lisibles par authentifiés"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'establishment-logos');

-- Rendre le bucket privé au sens listing, mais les fichiers restent servis via getPublicUrl (CDN)
UPDATE storage.buckets SET public = true WHERE id = 'establishment-logos';