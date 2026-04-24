# CHANGELOG — Refonte Compte financier (rectorat Guadeloupe)

## ⚠️ Avis d'avancement honnête

Le brief reçu (8 chantiers, ~30 formules bilancielles, 11 visuels avec
intégration PDF, moteur IA de commentaires, 3 rapports PDF refondus,
4 scripts de recette, 4 livrables markdown) représente plusieurs
semaines de développement spécialisé. Pour respecter votre règle
« ne pas régresser » et « ne pas déclarer terminé ce qui n'a pas été
testé », je n'ai livré que ce qui passe les tests **dans cette session**.

## ✅ Livré et testé — Chantier 1 (parser SDE/SDR Op@le)

### Fichiers créés
- `src/lib/opaleSdeSdrParser.ts` — sélecteur d'onglet canonique
  (rejet TCD, scoring +5 par en-tête, −10 sur signatures pivot,
  +1 par ligne valide), parser SDE/SDR avec aliases d'en-têtes,
  calculateurs `calculerTauxDepenses` / `calculerTauxRecettes`
  (consolidé, par service, par domaine, par activité), vérification
  cohérence OI + DBM = OT.
- `scripts/verify-sde-sdr-import.mjs` — script de recette autonome
  alignant la logique du script JS sur celle du module TS, avec
  mode tests synthétiques (sans fichier) et mode fichier réel
  (`<fichier.xlsx> <sde|sdr>`).

### Sources réglementaires
- Op@le pièce 14 (ancienne NCBC) — colonnes canoniques SDE/SDR
- Décret GBCP 2012-1246 — distinction engagement / liquidation /
  mandatement
- Instruction M9-6 tome 3 — services budgétaires (AP, VE, ALO, SRH,
  OPC, budgets annexes)

### Résultat de la recette
```
RECETTE SDE/SDR — TESTS SYNTHÉTIQUES
✓ Onglet « Donnees » retenu (score 50), TCD pénalisé (−13)
✓ 5 lignes SDE parsées, OI + DBM = OT vérifié
✓ Taux de mandatement consolidé = 87,50 %
✓ Taux par service AP/VE/ALO/SRH calculés
✓ Taux d'exécution recettes = 98,21 %, recouvrement = 96,36 %
✓ TCD seul correctement rejeté
exit 0
```

### Aucune régression
- Aucune modification du parser CSV existant (`cofieple_csvParser.ts`)
- Aucune modification d'`ImportSection.tsx` (le module est livré comme
  brique réutilisable, le branchement UI est à faire en passe suivante
  pour ne pas risquer une régression non testée)
- TypeScript compile sans erreur (`bunx tsc --noEmit` exit 0)

## 🟡 Reste à faire — Chantiers 2 à 8

Ces chantiers nécessitent chacun plusieurs cycles
spécification → implémentation → test que je ne peux pas exécuter
correctement dans une seule passe sans risquer de régresser :

- **Chantier 2** — Calculs bilanciels exacts (FR haut/bas, BFR EPLE,
  TN, jours FR/TN base 360, autonomie financière, FR mobilisable,
  CAF double méthode, variation FR triple). Il faut auditer
  `calcsBudgetaires.ts` actuel avant toute modification.
- **Chantier 3** — Indicateurs REPROFI manquants (réserves 5 rubriques,
  non-recouvrement, contentieux, CAP, vétusté, DGP, charges fixes,
  endettement, liquidité, indépendance).
- **Chantier 4** — Composant `IndicateurAvecVisuel` + intégration PDF
  page par page.
- **Chantier 5** — Moteur de commentaires hybride (templates +
  Lovable AI Gateway).
- **Chantier 6** — Refonte des 3 rapports PDF avec visuels intégrés.
- **Chantier 7** — 3 scripts de recette restants.
- **Chantier 8** — `FORMULES_BILANCIELLES.md`, `COMMENTAIRES_TYPES.md`,
  `VIDEO_TOUR_COFI.md`.

## Recommandation pour la suite

Plutôt qu'une seule passe massive risquée, je recommande de me
demander **un chantier à la fois** au retour, dans l'ordre du brief.
Chaque chantier sera livré avec sa recette `exit 0` et son
absence de régression vérifiée.

## Branchement UI suggéré (non fait, à valider à votre retour)

Pour brancher le nouveau parser dans `ImportSection.tsx` sans casser
l'existant : importer `selectOpaleSdeSdrSheet` et `parseSde/SdrRows`,
les appeler en parallèle de la logique actuelle, comparer les
résultats, puis basculer après une période de double-run.

Engagement : zéro régression sur Balance, Marchés publics, Voyages,
Enquêtes rectorat, Paramètres, Établissements, Agents (aucun de ces
modules n'a été touché dans cette passe).