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

## ✅ Livré et testé — Chantiers 2 & 3 (bilan M9-6 + REPROFI)

### Fichiers créés
- `src/lib/compteFinancier/bilanFinancierEngine.ts` — module pur
  (sans React/Supabase) implémentant les formules canoniques M9-6 :
  * FR par le haut (cap. permanents − immo nettes) et par le bas
    (AC − DCT) avec contrôle de cohérence et écart explicite ;
  * BFR EPLE (AC d'exploitation − dettes d'exploitation) ;
  * Trésorerie nette en double approche (FR−BFR vs observée 51+53+54−519) ;
  * Charges décaissables (classe 6 net − dotations 681/686/687) ;
  * Jours de FR & TN base 360 + qualification REPROFI
    (critique <30j, fragile 30-60, confortable 60-120, surdimensionné >120) ;
  * Autonomie financière (cap propres / ressources stables) ;
  * FR mobilisable (déduction réserves grevées 10681/10683/10687,
    art. 43231 tome 4) ;
  * CAF méthode additive et soustractive avec contrôle d'écart ;
  * Variation de FR triple (calc, par CAF, observée) ;
  * Agrégateur `calculerBilanComplet` pour appel unique.
- `src/lib/compteFinancier/reprofiIndicateursEngine.ts` — 10 indicateurs
  REPROFI 4.6 avec seuils :
  réserves 5 rubriques détaillées, taux de non-recouvrement,
  provisions contentieux, comptes d'attente provisoires anormaux,
  vétusté du parc immobilier, dépendance générale aux subventions (DGP),
  poids des charges fixes, capacité d'endettement (années de CAF),
  liquidité immédiate, indépendance financière.
- `scripts/verify-bilan-reprofi.mjs` — recette synthétique sur balance
  EPLE fictive cohérente couvrant les 7 formules bilancielles + les
  10 indicateurs REPROFI.

### Sources réglementaires explicites dans le code
- M9-6 tome 3 (plan comptable) — classes 10, 13, 16, 21, 28, 41, 51…
- M9-6 tome 4 art. 43231 — réserves grevées, FR mobilisable
- Op@le pièce 14 — situation patrimoniale
- REPROFI 4.6 — seuils de qualification

### Résultat de la recette
```
RECETTE bilan + REPROFI — TESTS SYNTHÉTIQUES
✓ FR_haut = 84 000 € (cap 204k − immo 120k)
✓ FR_haut/FR_bas cohérents (écart = provisions 15)
✓ BFR = 10 000 € ; TN_calc = 74 000 €
✓ Charges décaissables = 380 000 €
✓ Jours FR = 79,6 (bande confortable REPROFI)
✓ Autonomie = 73,5 % (normale)
✓ FR mobilisable = 54 000 € après réserves grevées
✓ CAF additive = 40 000 €
✓ Tx non-recouvrement = 6,25 %, vétusté = 40 %
✓ DGP = 81,4 % (dépendance forte)
✓ Endettement = 1,25 année de CAF (excellent)
✓ Liquidité = 2,00 (excellent), indépendance = 75 %
exit 0
```

### Aucune régression
- Aucune modification de `src/utils/calcsBudgetaires.ts` (l'existant
  reste actif, le nouveau moteur est offert comme couche additionnelle).
- Aucune modification d'UI (chantiers 4-6 : intégration visuelle et
  PDF restent à faire en passes suivantes ciblées).
- TypeScript compile sans erreur (`bunx tsc --noEmit` exit 0).

## 🟡 Reste à faire — Chantiers 4 à 8

## ✅ Livré et testé — Branchement parser SDE/SDR dans l'import UI

### Fichiers modifiés
- `src/lib/opaleSdeSdrParser.ts` — ajout des fonctions
  `buildSdeRowsFromRecords`, `buildSdrRowsFromRecords`,
  `computeTauxDepensesFromRecords`, `computeTauxRecettesFromRecords`
  (adaptateurs pour rows déjà normalisés clé/valeur).
- `src/components/cofieple/ImportSection.tsx` :
  * `pickBestWorkbookRows` utilise désormais `selectOpaleSdeSdrSheet`
    en *fast path* pour SDE/SDR : sélection automatique de l'onglet
    « Donnees » canonique, rejet TCD, log diagnostic dédié. Fallback
    intact sur la logique de scoring historique si la sélection
    canonique échoue.
  * Après import réussi d'un fichier SDE/SDR, calcul immédiat des
    taux d'exécution réglementaires (engagement, liquidation,
    mandatement, disponibilité pour SDE ; exécution recettes,
    recouvrement pour SDR) et affichage en toast récapitulatif.
  * Vérification de cohérence OI + DBM = OT avec alerte ciblée
    (premier écart + nombre total).

### Non-régression
- Aucun changement de signature exposée (store, parsers existants
  intacts).
- Le calcul des taux est encapsulé dans un try/catch : un échec
  n'empêche jamais l'import de réussir.
- Imports CSV inchangés (le branchement n'opère que pour les
  workbooks XLSX/XLS via `pickBestWorkbookRows`).
- TypeScript : `bunx tsc --noEmit` exit 0.

- **Chantier 4** — Composant `IndicateurAvecVisuel` consommant
  `BilanComplet` + `PanierReprofi` ; intégration page `CompteFinancier`.
- **Chantier 5** — Moteur de commentaires hybride (templates par
  niveau + Lovable AI Gateway pour synthèse).
- **Chantier 6** — Refonte des 3 rapports PDF avec visuels intégrés
  (Ordonnateur, Agent Comptable, Annexe).
- **Chantier 7** — Scripts de recette restants (CAF réelle Op@le,
  variation FR, contrôles cohérence DBM).
- **Chantier 8** — Livrables markdown (`FORMULES_BILANCIELLES.md`,
  `COMMENTAIRES_TYPES.md`, `VIDEO_TOUR_COFI.md`).

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