-- Valeurs inactives (registre P503). À appliquer sur qbhxjaz. RLS par établissement.
CREATE TABLE IF NOT EXISTS public.valeurs_inactives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid,
  type text NOT NULL CHECK (type IN ('timbre_fiscal','ticket_restauration','carte','autre')),
  designation text NOT NULL,
  valeur_unitaire numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.valeurs_mouvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valeur_id uuid NOT NULL REFERENCES public.valeurs_inactives(id) ON DELETE CASCADE,
  sens text NOT NULL CHECK (sens IN ('entree','sortie')),
  quantite integer NOT NULL,
  date date NOT NULL,
  motif text
);
CREATE TABLE IF NOT EXISTS public.valeurs_controles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid,
  valeur_id uuid NOT NULL REFERENCES public.valeurs_inactives(id) ON DELETE CASCADE,
  date date NOT NULL,
  agent text,
  stock_constate integer NOT NULL,
  observation text
);
ALTER TABLE public.valeurs_inactives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valeurs_mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valeurs_controles ENABLE ROW LEVEL SECURITY;
CREATE POLICY vi_rw ON public.valeurs_inactives FOR ALL
  USING (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  WITH CHECK (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()));
CREATE POLICY vi_mvt_rw ON public.valeurs_mouvements FOR ALL
  USING (valeur_id IN (SELECT id FROM public.valeurs_inactives WHERE etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())))
  WITH CHECK (valeur_id IN (SELECT id FROM public.valeurs_inactives WHERE etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid())));
CREATE POLICY vi_ctrl_rw ON public.valeurs_controles FOR ALL
  USING (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()))
  WITH CHECK (etablissement_id IS NULL OR etablissement_id IN (SELECT establishment_id FROM public.user_establishments WHERE user_id = auth.uid()));
