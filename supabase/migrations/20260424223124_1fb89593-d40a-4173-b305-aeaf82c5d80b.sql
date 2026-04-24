CREATE TABLE public.vs_enquetes_rectorat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  annee_scolaire TEXT NOT NULL DEFAULT '',
  periode TEXT NOT NULL DEFAULT 'annuel',
  statut TEXT NOT NULL DEFAULT 'brouillon',
  donnees JSONB NOT NULL DEFAULT '{}'::jsonb,
  commentaires_rectorat TEXT NOT NULL DEFAULT '',
  date_soumission TIMESTAMP WITH TIME ZONE,
  date_validation TIMESTAMP WITH TIME ZONE,
  soumis_par_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vs_enquetes_rectorat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VS enquetes view"
ON public.vs_enquetes_rectorat FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue
          WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_enquetes_rectorat.establishment_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "VS enquetes insert"
ON public.vs_enquetes_rectorat FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_establishments ue
          WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_enquetes_rectorat.establishment_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "VS enquetes update"
ON public.vs_enquetes_rectorat FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue
          WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_enquetes_rectorat.establishment_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "VS enquetes delete"
ON public.vs_enquetes_rectorat FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue
          WHERE ue.user_id = auth.uid() AND ue.establishment_id = vs_enquetes_rectorat.establishment_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER update_vs_enquetes_rectorat_updated_at
BEFORE UPDATE ON public.vs_enquetes_rectorat
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vs_enquetes_etab_annee ON public.vs_enquetes_rectorat(establishment_id, annee_scolaire);