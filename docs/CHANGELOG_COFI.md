# CHANGELOG_COFI — Itération « Standard DAF »

_Date : 2026-04-25_

## Ajouts

### Composant unifié IndicateurAvecVisuel (chantier 4)
- `src/components/cofieple/IndicateurAvecVisuel.tsx`
- Mise en page imposée : N°/titre/réf · chiffres clés ↔ visuel ·
  commentaire auto (éditable) · commentaire manuel.
- `pageBreakInside: avoid` → garantit visuel + chiffres sur la même page PDF.
- Statuts couleur (excellent/normal/fragile/critique/neutre) via tokens HSL.
- 3 types de visuels (`bars`, `lines`, `donut`, `stacked`, `sparkline`)
  + slot `customVisual` pour SVG custom (organigrammes, sankey…).

### Vue consolidée groupement (chantier 8)
- `src/components/cofieple/VueGroupement.tsx`
- Agrégation inter-EPLE depuis `cofieple_snapshots`.
- KPI : FDR cumulé, trésorerie cumulée, jours FDR moyen, EPLE en risque.
- Top 5 EPLE en risque (score composite 0–100).
- Heatmap des indicateurs critiques (FDR, trésorerie, jours, créances).
- Export PDF consolidé paysage A4 (jspdf + autotable).
- Branchée dans `CompteFinancier.tsx` (onglet « Groupement »).

### Export 3 PDF + ZIP + JSON (chantiers 9-10)
- `src/lib/compteFinancier/exportTroisPdf.ts`
  - `generateOrdoPdf` · `generateAcPdf` · `generateAnnexePdf`
  - `generateZipBundle` (3 PDF + JSON + manifest dans 1 ZIP)
  - `generateIndicateursJson` (transmission rectorat / DDFiP / CRC)
  - En-tête institutionnel : RF + MEN + Académie + UAI/commune
  - Page de garde tricolore, pied de page paginé, charte bleu République
  - Filigrane « PROJET » optionnel sur toutes les pages
- `src/components/cofieple/ExportTroisPdfBouton.tsx`
  - Menu déroulant : Ordo / AC / Annexe / les 3 / ZIP / JSON
  - Toggle filigrane PROJET (badge visuel sur le bouton)
  - Branché dans la barre d'export du Rapport Ordonnateur

### Tests de recette (chantier 11)
- `scripts/verify-cofi-ordonnateur.mjs` — 4 sections + ≥30 fiches +
  séparation stricte (aucun calcul bilanciel côté ordo).
- `scripts/verify-cofi-ac.mjs` — 22 éléments pièce 14 enrichie
  (FR haut/bas/écart, FR mobilisable, 5 rubriques réserves,
  vétusté, DGP, endettement, liquidité, indépendance).
- `scripts/verify-cofi-pdf-visuels.mjs` — 11 vérifications composant
  unifié + export PDF + filigrane + en-tête institutionnel.
- `scripts/verify-cofi-comparatif.mjs` — couche pluriannuelle N à N-4.
- `scripts/verify-cofi-groupement.mjs` — 6 vérifications vue groupement.
- **Tous en exit 0.**

## Audit interne préalable

- `docs/RECAP_COFI_INSTRUCTIONS.md` — état FAIT/PARTIEL/NON FAIT/DÉFÉRÉ
  honnête sur 70+ éléments demandés, avec arbitrage explicite des reports.

## Préservé (non régressé)

- 34 fiches catalog ordonnateur (`catalog.ts`)
- Moteur bilanciel pièce 14 (`bilanFinancierEngine.ts` — 27 fonctions)
- 10 indicateurs REPROFI AC (`reprofiIndicateursEngine.ts`)
- Annexe comptable 11 composantes (`AnnexeComptableSection.tsx`)
- Hero éditorial, magazine PDF, narration IA, NarrationContinue
- Vue consolidée multi-budgets d'1 EPLE (`VueConsolidee.tsx`)
- Séparation stricte sphère ordonnateur ↔ sphère AC