Audit des sources réglementaires — Mars 2026. Corrections appliquées le 15/03/2026.

## Corrections appliquées

### 1. Circulaire voyages scolaires
- **AVANT** : circulaire n°2011-117 du 3 août 2011 + BO n°2 du 13/01/2005
- **APRÈS** : circulaire du 16 juillet 2024 relative aux sorties et voyages scolaires (remplace 2011-117) + Guide Eduscol décembre 2025
- Fichiers : chat-eple/index.ts, voyageBudgetEngine.ts

### 2. Seuils commande publique — Décret n°2025-1386 du 29/12/2025
- **AVANT** : SANS_PUBLICITE=40k, MAPA=90k, EUROPEEN=221k, "3 devis obligatoires"
- **APRÈS** : DISPENSE=40k (60k au 01/04/2026), PUBLICITE_OBLIGATOIRE=90k, EUROPEEN=216k
- "3 devis" n'est PAS une obligation légale, c'est une bonne pratique → reformulé "mise en concurrence recommandée"
- Travaux : dispense < 100 000 € HT (pérennisé)
- Fichiers : voyageBudgetEngine.ts, types.ts, VoyageMarchesTab.tsx, VoyageMarchesMoniteur.tsx, validate-accounts/index.ts

### 3. Op@le
- Précisé que Op@le remplace GFC/COFI depuis 2024-2025
- Ne plus utiliser la terminologie GFC/COFI sauf pour expliquer la transition

### 4. Sources confirmées valides
- Décret 2012-1246 (GBCP) ✅
- M9-6 instruction codificatrice ✅
- Code de l'éducation R421-1+ ✅
- Décrets régies n°2019-798 et n°2020-922 ✅
- Code de la commande publique (mis à jour seuils) ✅

### TODO — 01/04/2026
- Mettre à jour SEUILS.DISPENSE de 40000 à 60000 dans voyageBudgetEngine.ts et types.ts
