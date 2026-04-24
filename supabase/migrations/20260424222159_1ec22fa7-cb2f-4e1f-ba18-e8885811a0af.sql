-- Ajout des champs pour les deux délibérations CA distinctes
-- (R.421-20 Code éducation : vote de principe + vote du budget)

ALTER TABLE public.vs_voyages
  ADD COLUMN IF NOT EXISTS date_ca_principe date,
  ADD COLUMN IF NOT EXISTS numero_acte_ca_principe text,
  ADD COLUMN IF NOT EXISTS date_ca_budget date,
  ADD COLUMN IF NOT EXISTS numero_acte_ca_budget text;

-- Migration douce : recopie l'ancien champ unique vers le vote budget
-- (le plus opérationnel, car celui qui rend le budget exécutoire)
UPDATE public.vs_voyages
   SET date_ca_budget = date_ca_autorisation,
       numero_acte_ca_budget = numero_acte_ca
 WHERE date_ca_budget IS NULL
   AND date_ca_autorisation IS NOT NULL;

COMMENT ON COLUMN public.vs_voyages.date_ca_principe IS
  'Délibération CA n°1 : autorisation de principe du voyage (programmation, contributions familles)';
COMMENT ON COLUMN public.vs_voyages.date_ca_budget IS
  'Délibération CA n°2 : approbation du budget définitif (post mise en concurrence)';