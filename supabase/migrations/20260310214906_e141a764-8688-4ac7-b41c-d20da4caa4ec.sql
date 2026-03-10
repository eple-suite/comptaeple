
ALTER TABLE public.cofieple_extra_indicators
  ADD COLUMN IF NOT EXISTS effectif_externes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_fonds_social numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nb_repas_commensaux integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS etp_ressources_propres numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS surface_batiments numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conso_eau numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conso_gaz numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conso_electricite numeric DEFAULT 0;
