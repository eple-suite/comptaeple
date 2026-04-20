CREATE TABLE public.cofieple_codes_activite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uai TEXT NOT NULL,
  exercice INTEGER NOT NULL,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT 'AP',
  domaine TEXT NOT NULL DEFAULT '',
  categorie_analyse TEXT NOT NULL DEFAULT '',
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, uai, exercice, code)
);

ALTER TABLE public.cofieple_codes_activite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codes activite"
ON public.cofieple_codes_activite FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own codes activite"
ON public.cofieple_codes_activite FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own codes activite"
ON public.cofieple_codes_activite FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own codes activite"
ON public.cofieple_codes_activite FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage codes activite"
ON public.cofieple_codes_activite FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_codes_activite_updated_at
BEFORE UPDATE ON public.cofieple_codes_activite
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_codes_activite_lookup
ON public.cofieple_codes_activite(user_id, uai, exercice, actif);