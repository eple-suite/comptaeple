---
name: Financial Validation Logic
description: Logique de filtrage des lignes SDE/SDR pour éviter les doubles comptes dans la hiérarchie CGR Op@le
type: feature
---

## Filtrage hiérarchique CGR — Anti double-comptage

### Règle absolue
Les données Op@le (SDE/SDR) sont organisées en arbre hiérarchique :
- Niveau 1 : ETS (total établissement)
- Niveau 2 : FONC (fonctionnement = ETS)
- Niveau 3 : SG (Services Généraux), SS (Services Spéciaux)
- Niveau 4 : AP, VE, ALO (enfants de SG), SRH (enfant de SS)
- Niveaux 5+ : détails feuilles

**N'utiliser QUE les lignes feuilles (`aggregationLevel === 'detail'`) pour les agrégations par service.**
**Utiliser la ligne ETS (`aggregationLevel === 'global'`) pour les totaux généraux.**

### Module `src/lib/executionRowFilters.ts`
- `getLeafSdeRows()` / `getLeafSdrRows()` : filtre les lignes feuilles uniquement
- `getEtsSdeRow()` / `getEtsSdrRow()` : retourne la ligne agrégat racine ETS
- `checkSdeHierarchy()` : contrôle AP+VE+ALO=SG et SG+SS=ETS

### Contrôles automatiques
- Contrôle 1 : AP + VE + ALO = SG (tolérance 0,02 €)
- Contrôle 2 : SG + SS = ETS (tolérance 0,02 €)
- Alerte rouge visible si un contrôle échoue

### Fichiers impactés
- `src/pages/execution/SituationDepensesTab.tsx` — utilise `getLeafSdeRows` + `getEtsSdeRow`
- `src/pages/execution/SituationRecettesTab.tsx` — utilise `getLeafSdrRows` + `getEtsSdrRow`
- `src/pages/execution/CoherenceBudgetaireTab.tsx` — utilise les deux filtres
- `src/lib/rapportExecutionPdf.ts` — helpers `aggregateDepByService`, `aggregateRecByService`, `buildCoherence` filtrés

### Exceptions de solde (comptes mixtes)
- 443110 (Bourses) : classé 'mixte' — débit ou crédit autorisé
- 515900 (Trésor règlements en cours) : **CRÉDITEUR strict** (M9-6 Tome 3, ord. 2022-408).
  Schéma : D 401XXX / C 515900 puis D 515900 / C 515100. Solde débiteur = 🔴 critique.

### Comptes à sens unilatéral (paramétrables via table `cofieple_comptes_sens_normal`)
- 515100, 531 : strictement débiteur ou nul
- 515900 : strictement créditeur ou nul
- 28x, 29x, 39x, 49x, 59x : strictement créditeur (passifs correcteurs)
- 419 : créditeur strict (avances reçues)
- 409 : débiteur strict (avances versées)
