-- Table de référence : sens normal d'un compte (paramétrable par l'agent comptable)
CREATE TABLE public.cofieple_comptes_sens_normal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uai TEXT NOT NULL,
  compte_prefix TEXT NOT NULL,           -- ex : "515900", "531", "28", "419", "409"
  libelle TEXT NOT NULL DEFAULT '',
  sens_normal TEXT NOT NULL DEFAULT 'mixte', -- 'debiteur' | 'crediteur' | 'mixte' | 'nul'
  gravite_violation TEXT NOT NULL DEFAULT 'anomalie', -- 'info' | 'anomalie' | 'bloquant'
  commentaire TEXT NOT NULL DEFAULT '',
  actif BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'utilisateur', -- 'utilisateur' | 'systeme_m96'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cofieple_sens_normal_sens_check CHECK (sens_normal IN ('debiteur','crediteur','mixte','nul')),
  CONSTRAINT cofieple_sens_normal_gravite_check CHECK (gravite_violation IN ('info','anomalie','bloquant')),
  CONSTRAINT cofieple_sens_normal_unique UNIQUE (user_id, uai, compte_prefix)
);

CREATE INDEX idx_cofieple_sens_normal_lookup
  ON public.cofieple_comptes_sens_normal (user_id, uai, compte_prefix);

ALTER TABLE public.cofieple_comptes_sens_normal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sens normal"
  ON public.cofieple_comptes_sens_normal FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sens normal"
  ON public.cofieple_comptes_sens_normal FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sens normal"
  ON public.cofieple_comptes_sens_normal FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sens normal"
  ON public.cofieple_comptes_sens_normal FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage sens normal"
  ON public.cofieple_comptes_sens_normal FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cofieple_sens_normal_updated_at
  BEFORE UPDATE ON public.cofieple_comptes_sens_normal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();