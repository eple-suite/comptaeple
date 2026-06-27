-- Fonds social — modalité « extinction_creance »
-- Une aide de restauration/cantine (ou FSC) ne peut être versée en espèces à la
-- famille : elle éteint la créance demi-pension au compte C/411xx (M9-6 tome 3).
-- On élargit la contrainte CHECK de fs_decisions.modalite_versement.

ALTER TABLE public.fs_decisions
  DROP CONSTRAINT IF EXISTS fs_decisions_modalite_versement_check;

ALTER TABLE public.fs_decisions
  ADD CONSTRAINT fs_decisions_modalite_versement_check
  CHECK (modalite_versement IN ('aide_directe', 'organisme_tiers', 'extinction_creance'));
