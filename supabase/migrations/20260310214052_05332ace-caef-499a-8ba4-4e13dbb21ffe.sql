
-- ═══════════════════════════════════════════════════════════════
-- COFIEPLE — Tables pluriannuelles (N à N-4)
-- Stockage des résultats financiers et indicateurs hors-comptables
-- ═══════════════════════════════════════════════════════════════

-- Table des exercices financiers COFIEPLE (résultats annuels)
CREATE TABLE public.cofieple_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uai TEXT NOT NULL,
  exercice INTEGER NOT NULL,
  type_budget TEXT NOT NULL DEFAULT 'principal',
  
  -- Résultats budgétaires
  total_charges_prev NUMERIC NOT NULL DEFAULT 0,
  total_charges_reel NUMERIC NOT NULL DEFAULT 0,
  total_produits_prev NUMERIC NOT NULL DEFAULT 0,
  total_produits_reel NUMERIC NOT NULL DEFAULT 0,
  resultat_budgetaire NUMERIC NOT NULL DEFAULT 0,
  resultat_comptable NUMERIC NOT NULL DEFAULT 0,
  
  -- Structuration financière
  fdr NUMERIC NOT NULL DEFAULT 0,
  bfr NUMERIC NOT NULL DEFAULT 0,
  tresorerie NUMERIC NOT NULL DEFAULT 0,
  caf NUMERIC NOT NULL DEFAULT 0,
  jours_autonomie NUMERIC NOT NULL DEFAULT 0,
  
  -- Réserves et immobilisations
  reserves NUMERIC NOT NULL DEFAULT 0,
  reserves_ss_specialite NUMERIC NOT NULL DEFAULT 0,
  reserves_srh NUMERIC NOT NULL DEFAULT 0,
  total_immo NUMERIC NOT NULL DEFAULT 0,
  total_amortissements NUMERIC NOT NULL DEFAULT 0,
  
  -- Taux d'exécution
  taux_exec_charges NUMERIC NOT NULL DEFAULT 0,
  taux_exec_produits NUMERIC NOT NULL DEFAULT 0,
  
  -- Score de risque
  score_risque INTEGER DEFAULT 0,
  niveau_risque TEXT DEFAULT 'faible',
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, uai, exercice, type_budget)
);

-- Table des indicateurs hors-comptables (effectifs, boursiers, ratios)
CREATE TABLE public.cofieple_extra_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uai TEXT NOT NULL,
  exercice INTEGER NOT NULL,
  
  -- Effectifs
  effectif_eleves INTEGER DEFAULT 0,
  effectif_internes INTEGER DEFAULT 0,
  effectif_dp INTEGER DEFAULT 0,
  effectif_boursiers INTEGER DEFAULT 0,
  effectif_personnel INTEGER DEFAULT 0,
  
  -- Ratios de passage
  taux_reussite_bac NUMERIC DEFAULT 0,
  taux_passage NUMERIC DEFAULT 0,
  
  -- Restauration
  nb_repas_servis INTEGER DEFAULT 0,
  cout_denrees_repas NUMERIC DEFAULT 0,
  prix_moyen_repas NUMERIC DEFAULT 0,
  
  -- Hébergement
  tarif_internat NUMERIC DEFAULT 0,
  taux_occupation_internat NUMERIC DEFAULT 0,
  
  -- Commentaires utilisateur (pré-remplissage annexes)
  commentaire_fdr TEXT DEFAULT '',
  commentaire_tresorerie TEXT DEFAULT '',
  commentaire_caf TEXT DEFAULT '',
  commentaire_general TEXT DEFAULT '',
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, uai, exercice)
);

-- RLS policies
ALTER TABLE public.cofieple_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cofieple_extra_indicators ENABLE ROW LEVEL SECURITY;

-- Users can manage their own exercises
CREATE POLICY "Users can view own exercises" ON public.cofieple_exercises
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON public.cofieple_exercises
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON public.cofieple_exercises
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON public.cofieple_exercises
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Users can manage their own indicators
CREATE POLICY "Users can view own indicators" ON public.cofieple_extra_indicators
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own indicators" ON public.cofieple_extra_indicators
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own indicators" ON public.cofieple_extra_indicators
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own indicators" ON public.cofieple_extra_indicators
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can manage exercises" ON public.cofieple_exercises
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage indicators" ON public.cofieple_extra_indicators
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_cofieple_exercises_user_uai ON public.cofieple_exercises(user_id, uai, exercice);
CREATE INDEX idx_cofieple_extra_user_uai ON public.cofieple_extra_indicators(user_id, uai, exercice);
