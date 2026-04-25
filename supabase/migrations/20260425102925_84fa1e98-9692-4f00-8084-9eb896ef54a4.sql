-- Extensions nécessaires pour le job planifié
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table des coupons-réponse 8 € (post-voyage)
CREATE TABLE IF NOT EXISTS public.vs_coupons_8eur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.vs_voyages(id) ON DELETE CASCADE,
  participant_id UUID,
  ine TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  montant_concerne NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_envoi DATE NOT NULL DEFAULT CURRENT_DATE,
  date_limite_reponse DATE NOT NULL,
  reponse TEXT CHECK (reponse IN ('reversement','don_expres','don_tacite_silence')),
  date_reponse DATE,
  source TEXT NOT NULL DEFAULT 'manuel',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vs_coupons_8eur_voyage ON public.vs_coupons_8eur(voyage_id);
CREATE INDEX IF NOT EXISTS idx_vs_coupons_8eur_pending ON public.vs_coupons_8eur(date_limite_reponse) WHERE reponse IS NULL;

ALTER TABLE public.vs_coupons_8eur ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateurs rattachés à l'établissement du voyage + admin
CREATE POLICY "VS coupons view"
ON public.vs_coupons_8eur
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vs_voyages v
    JOIN public.user_establishments ue ON ue.establishment_id = v.establishment_id
    WHERE v.id = vs_coupons_8eur.voyage_id AND ue.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Écriture : utilisateurs rattachés à l'établissement du voyage + admin
CREATE POLICY "VS coupons manage"
ON public.vs_coupons_8eur
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vs_voyages v
    JOIN public.user_establishments ue ON ue.establishment_id = v.establishment_id
    WHERE v.id = vs_coupons_8eur.voyage_id AND ue.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vs_voyages v
    JOIN public.user_establishments ue ON ue.establishment_id = v.establishment_id
    WHERE v.id = vs_coupons_8eur.voyage_id AND ue.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger updated_at
CREATE TRIGGER vs_coupons_8eur_updated_at
BEFORE UPDATE ON public.vs_coupons_8eur
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();