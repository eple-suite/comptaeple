-- Table de personnalisation des rapports par établissement
CREATE TABLE public.establishment_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL UNIQUE REFERENCES public.establishments(id) ON DELETE CASCADE,
  logo_url TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',
  signataire_ordonnateur TEXT NOT NULL DEFAULT '',
  signataire_agent_comptable TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#254478',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_branding ENABLE ROW LEVEL SECURITY;

-- SELECT : utilisateurs rattachés ou admin
CREATE POLICY "Branding visible par utilisateurs rattachés ou admin"
ON public.establishment_branding
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.user_id = auth.uid()
      AND ue.establishment_id = establishment_branding.establishment_id
  )
);

-- INSERT : utilisateurs rattachés ou admin
CREATE POLICY "Branding insérable par utilisateurs rattachés ou admin"
ON public.establishment_branding
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.user_id = auth.uid()
      AND ue.establishment_id = establishment_branding.establishment_id
  )
);

-- UPDATE
CREATE POLICY "Branding modifiable par utilisateurs rattachés ou admin"
ON public.establishment_branding
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.user_id = auth.uid()
      AND ue.establishment_id = establishment_branding.establishment_id
  )
);

-- DELETE : admin uniquement
CREATE POLICY "Branding supprimable par admin"
ON public.establishment_branding
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_establishment_branding_updated_at
BEFORE UPDATE ON public.establishment_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket de stockage des logos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('establishment-logos', 'establishment-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies — lecture publique
CREATE POLICY "Logos publiquement accessibles"
ON storage.objects
FOR SELECT
USING (bucket_id = 'establishment-logos');

-- Upload : utilisateurs authentifiés rattachés à un établissement (le 1er segment du chemin = establishment_id)
CREATE POLICY "Upload logo par utilisateur rattaché"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Update logo par utilisateur rattaché"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Delete logo par utilisateur rattaché"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'establishment-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id::text = (storage.foldername(name))[1]
    )
  )
);