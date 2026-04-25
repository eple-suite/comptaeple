# Changelog — Module Balance Comptable

## [v3.0 — Refonte CRC] 2026-04-25

### Ajouts majeurs
- **Référentiel partagé `comptes_sens_normal_ref`** (102 comptes M9-6 seedés, 8 classes,
  22 critiques). Lecture authentifiée, écriture admin uniquement.
- **Moteur d'anomalies par compte unitaire** (`src/lib/balance/anomaliesEngine.ts`)
  appliquant règles de sens (en cours / clôture) + 7 règles complémentaires :
  RGP 411X créditeur, 515100/515900, 531 caisse négative, 467/47X clôture, 443110
  non-déspécialisable, 185000 miroir BA, créances 4411X sans contrepartie.
- **6 projections prédictives** (`predictifEngine.ts`) : trajectoire attente,
  érosion trésorerie, créances familles, sous-conso subventions, déséquilibre SRH,
  résultat exercice annualisé. Score de risque 0-100 + top vigilance.
- **Rapport PDF institutionnel** (`rapportBalancePdf.ts`) : page de garde RF/MEN,
  synthèse exécutive, cartographie, anomalies, prédictif, annexe complète.
- **Synchronisation alertes_transverses** (`syncBalanceAlertes.ts`) idempotente.
- **UI** : nouvel onglet « Anomalies M9-6 » sur `/balance` (`AnomaliesPanelM96`).
- **Tables annexes** : `balance_drilldown_notes` (annotations), `balance_parametres_periode`.

### Recette
- `verify-balance-anomalies.mjs` — 11 tests, exit 0
- `verify-balance-predictif.mjs` — 10 tests, exit 0
- `verify-balance-pdf.mjs` — 5 tests, exit 0

### Préservation
- Aucune régression sur l'import existant (88 comptes, repairSheetRange,
  scoring d'onglet conservés).
- Cartographie hiérarchique existante (`CartographieSoldes`) conservée.
- Page `BalanceAnalysis.tsx` enrichie (nouvel onglet uniquement).

### Conformité
M9-6 (tomes 1-4) · GBCP 2012-1246 · Code éducation · Ord. RGP 2022-408 · CRC.