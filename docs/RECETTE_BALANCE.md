# Recette — Module Balance Comptable

## Scripts (exit 0 obligatoire)

| Script | Tests | Statut |
|---|---|---|
| `scripts/verify-balance-anomalies.mjs` | 11 | ✅ exit 0 |
| `scripts/verify-balance-predictif.mjs` | 10 | ✅ exit 0 |
| `scripts/verify-balance-pdf.mjs` | 5 | ✅ exit 0 |

## Couverture fonctionnelle

### Anomalies par compte
- 411300 créditeur → critique RGP (Ord. 2022-408 art. 11)
- 515900 créditeur → conforme (placement)
- 515900 débiteur → critique trésorerie
- 515100 créditeur → critique trésorerie négative impossible
- 531 créditeur → critique caisse négative
- 467 / 47X non nul en clôture → critique apurement (M9-6 T3)
- 467 / 47X non nul en cours d'exercice → conforme
- 443110 débiteur → critique bourses (NON-DÉSPÉCIALISABLE)
- 28X / 29X / 39X débiteur → critique sens amortissement
- Stats agrégées : pondération critique×20, majeure×8, mineure×3, info×1

### Prédictif
- 6 projections obligatoires produites
- Score de risque borné [0;100]
- Top vigilance non vide en cas dégradé
- Cas stable → pas de niveau rouge

### PDF
- Document instancié, ≥ 4 pages
- Signature `%PDF-` valide

## Manuel
- `/balance` → onglet « Anomalies M9-6 » : référentiel chargé (Supabase OU fallback),
  liste anomalies + score, bouton Réanalyser.
- Période sélectionnable : "cours" / "cloture".