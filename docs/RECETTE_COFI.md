# RECETTE_COFI — Validation

## Scripts (tous exit 0)

| Script | Vérifications | Résultat |
|--------|--------------|----------|
| `verify-cofi-ordonnateur` | 4 sections A/B/C/D · 34 fiches · 0 indicateur bilanciel | ✅ |
| `verify-cofi-ac` | 22 éléments pièce 14 enrichie | ✅ |
| `verify-cofi-pdf-visuels` | 11 vérifications composant + PDF + filigrane | ✅ |
| `verify-cofi-comparatif` | Pluriannuel N à N-4 | ✅ |
| `verify-cofi-groupement` | 6 vérifications vue groupement | ✅ |

## Comparaison à un modèle DAF de référence

| Élément attendu DAF | Présent | Source |
|---------------------|---------|--------|
| Page de garde tricolore (RF + MEN) | ✅ | `drawCover()` |
| En-tête institutionnel sur chaque page | ✅ | `drawHeader()` |
| Pied de page paginé (« page X / N ») | ✅ | `drawFooter()` |
| Filigrane PROJET tant que non voté | ✅ | `drawWatermark()` |
| Référence M9-6 / GBCP / Code éducation | ✅ | page de garde |
| FR par le haut + par le bas + écart | ✅ | `calculerFR` |
| FR effectivement mobilisable | ✅ | `calculerFRMobilisable` |
| 5 rubriques de réserves | ✅ | `calculerReserves` |
| Triple réconciliation variation FR | ✅ | `calculerVariationFR` |
| Séparation ordo / AC stricte | ✅ | catalog ordo sans formules bilancielles |
| Vue groupement (heatmap + top 5) | ✅ | `VueGroupement.tsx` |
| Bundle ZIP rectorat (3 PDF + JSON) | ✅ | `generateZipBundle` |

## Test manuel suggéré

1. Naviguer `/compte-financier` → onglet « Groupement » :
   tableau récap, heatmap colorée, top 5 EPLE en risque, bouton PDF.
2. Onglet « Rapport ordonnateur » → bouton « Export Compte Financier » :
   menu déroulant 5 entrées + toggle PROJET, génère 3 PDF unifiés
   avec en-tête RF/MEN, filigrane PROJET, page de garde tricolore.
3. Importer composant `IndicateurAvecVisuel` dans n'importe quelle fiche
   pour bénéficier de la mise en page imposée standard DAF.