Nomenclature officielle des 11 composantes de l'Annexe M9-6 du Compte Financier EPLE

## 11 Sections Réglementaires (onglets dans AnnexeComptableSection.tsx)
1. Faits caractéristiques de l'exercice — IA synthétise variations majeures + contexte
2. Principes, règles et méthodes comptables — texte standardisé M9-6 personnalisable
3. Notes sur l'actif immobilisé et les amortissements — tableau Brut/Amort/Net (cptes 20,21,28)
4. Notes sur les stocks — analyse cptes 31,32,33, variation de stock
5. Notes sur les créances — focus 411, analyse ancienneté, piste d'audit pour le juge
6. Notes sur les dettes — cptes 401, dettes fiscales/sociales
7. Notes sur les financements — réserves (106), subv invest (13), analyse FDR/BFR/Tréso
8. Notes sur les provisions — cptes 15,49; si mouvementés → justification juridique exigée
9. Notes sur les charges — analyse comparative N/N-1 classe 6 + graphique tendance
10. Notes sur les produits — ressources propres + subventions classe 7 + graphique tendance
11. Autres informations — engagements hors bilan (classe 8), événements post-clôture

## Architecture
- Auto-Audit en onglet 0 (pré-validation avant annexe)
- Chaque section a un NarrativeSection avec bouton "Générer l'analyse" (IA)
- Edge function: supabase/functions/generate-annexe/index.ts avec 11 prompts
- Données extraites dynamiquement du m9-6engine via le store (balanceData)
- Graphiques de tendance N/N-1 pour charges (§9) et produits (§10)
- Export PDF Dém'act compilé avec les 11 sections + auto-audit + signatures
