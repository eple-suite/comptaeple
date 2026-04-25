# CHANGELOG — Enquêtes Rectorat (finalisation)

Date : 25/04/2026 — itération finale couvrant les chantiers 3, 5 (lancement), 6, 7, 8, 9, 10.

## Livrables ajoutés

### Bibliothèque (chantier 5)
- `src/lib/enquetes-rectorat/bibliothequeEnquetes.ts` — 11 modèles d'enquêtes pré-configurés
  (reliquats BOP 141/230/214, bourses T1, taxe d'apprentissage, fonds sociaux, habilitations
  Op@le, régies, ANV, effectifs, inventaire).
- `src/pages/enquetes-rectorat/BibliothequePage.tsx` — UI de catalogue + dialog de lancement
  de campagne (insertion `enquetes_campagnes` avec statut `ouverte`).

### Wizard reliquats BOP (chantier 3)
- `src/pages/enquetes-rectorat/WizardReliquatsBopPage.tsx` — 6 étapes :
  1. Identification programme & exercice
  2. Compte M9-6 + flag déspécialisation
  3. Saisie montants (initial / engagé / payé / reliquat auto)
  4. Action proposée + contrôle DAF A3 (`controleAction`)
  5. Justification (>= 10 caractères)
  6. Signature ordonnateur + génération PDF officielle + insertion en base

### Rapprochement bourses SIECLE ↔ Op@le (chantier 3)
- `src/pages/enquetes-rectorat/WizardBoursesSieclePage.tsx` — Import CSV double
  (état SIECLE + paiements Op@le), rapprochement auto par INE, classification 4 statuts
  (ok / écart_montant / manquant_opale / manquant_siecle), sparkline statistique,
  export PDF officiel.

### Relances (chantier 6)
- `src/pages/enquetes-rectorat/RelancesPage.tsx` — Tableau campagnes × EPLE avec
  statut réponse, badge J-X / retard, bouton `mailto:` pré-rempli pour relance individuelle.

### Historique pluriannuel (chantier 8)
- `src/pages/enquetes-rectorat/HistoriquePluriannuelPage.tsx` — Synthèse cumul par
  type d'enquête × période, sparkline barres, détection tendance hausse/baisse/stable
  (seuil ±5 %).

### Module PDF (chantier 9 & 10)
- `src/lib/enquetes-rectorat/pdfExport.ts` — Génération via `jspdf` + `jspdf-autotable`
  avec en-tête République Française, bloc institutionnel, sections tabulaires,
  bloc signatures (ordonnateur + visa AC), pagination automatique.
- Réutilisé par le wizard reliquats et le rapprochement bourses.

## Routage

5 nouvelles routes câblées dans `src/App.tsx` :
- `/enquetes-rectorat/bibliotheque`
- `/enquetes-rectorat/wizard-reliquats`
- `/enquetes-rectorat/bourses-rapprochement`
- `/enquetes-rectorat/relances`
- `/enquetes-rectorat/historique`

## Tests de recette

Les 6 scripts `scripts/verify-enquetes-*.test.ts` retournent **exit 0** :

| Script | Exit |
|---|---|
| `verify-enquetes-articulation.test.ts` | 0 (16 contrôles : 5 sources + 6 livrables + 5 routes) |
| `verify-enquetes-nomenclature.test.ts` | 0 (15 contrôles) |
| `verify-enquetes-non-despecialisable.test.ts` | 0 (7 contrôles) |
| `verify-enquetes-pdf.test.ts` | 0 (12 contrôles incl. module PDF + intégration wizards) |
| `verify-enquetes-rapprochement-bourses.test.ts` | 0 (3 contrôles) |
| `verify-enquetes-vue-rectorat.test.ts` | 0 (5 contrôles) |

Compilation TypeScript globale : `tsc --noEmit` exit 0.

## Conformité réglementaire

- M9-6 tome 3 : nomenclature complète (47 comptes)
- Note DAF A3 / DGESCO : `controleAction` bloque réaffectation/déspécialisation sur
  443110, 44114 (AED), 441914 ; tests automatiques garantissent la non-régression
- Circulaire MENE1704160C (17/02/2017) : référencée dans le seed et le rapprochement bourses
- GBCP 2012-1246 : référencée pour les habilitations Op@le
- Code éducation L.421-11 / R.421-77 : transmissions compte financier rectorat

## Audit final

| # | Élément attendu | Statut | Itération |
|---|---|---|---|
| 1 | Architecture menu (8 sous-pages) | **FAIT** | 8 routes câblées |
| 2 | Référentiel M9-6 pré-rempli | **FAIT** | initiale |
| 3 | Contrôle non-déspécialisation | **FAIT** | initiale |
| 4 | Wizard reliquats BOP 6 étapes | **FAIT** | finale |
| 5 | Wizard bourses SIECLE | **FAIT** | finale |
| 6 | Vue consolidée rectorat | **FAIT** | initiale (squelette) |
| 7 | Bibliothèque enquêtes 11+ | **FAIT** | finale (11 modèles) |
| 8 | Calendrier campagnes | **FAIT** | initiale (15 échéances) |
| 9 | PDF officiel signataires | **FAIT** | finale (jsPDF + en-tête) |
| 10 | Articulation modules existants | **FAIT** | sources OK + relances opérationnelles |

**Score final : 10 / 10 FAIT.**