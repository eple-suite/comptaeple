# CHANGELOG — Module Marchés publics (CCP 2026)

## Itération 25/04/2026

### Base de données
- **Reseed `mp_seuils_ccp`** avec les valeurs officielles 2026 sur 3 périodes :
  - 01/01–31/03/2026 : dispense FS = 40 k, travaux = 100 k, formalisée FS = 215 k, travaux = 5 382 k.
  - 01/04/2026–31/12/2027 : dispense FS rehaussée à **60 k** (décret 2025-1386), reste inchangé.
  - 01/01/2028 (prévisionnel) : seuils JOUE 221 k / 5 538 k anticipés.
- **Nouvelles tables** (RLS par établissement) : `mp_marches_avenants`, `mp_marches_reconductions`, `mp_marches_sous_traitants`, `mp_groupements_commandes`, `mp_groupements_membres`, `mp_archives` (full-text + hash SHA-256).
- **Extension** `mp_marches_bdc` : colonnes `objet`, `date_livraison_prevue`, `date_reception`, `user_id`, `updated_at`.

### Moteur logique
- `lib/saucissonnageEngine.ts` : ajout `detecterRepetitionFournisseur` (3+ commandes/6 mois fournisseur×famille = critique) et `heatmapFournisseurFamille`.
- `lib/seuilsEngine.ts` inchangé — déjà conforme à la signature `getSeuilsApplicables(seuils, date, type)`.

### Wizard `MarcheNouveau`
- Passage de 6 à **7 étapes affichées** : insertion étape **« Clauses obligatoires 2026 »** (étape 5).
- Nouvelle clause environnementale **BLOQUANTE** (≥ 30 car. + leviers à cocher : Écolabel, recyclabilité, empreinte carbone, circuit court, réemploi, bio).
- Critère de capacité économique : **plafond CA ≤ 1,5 × montant marché** (décret 2025-1383) — bloquant si dépassé.
- 8e étape « Suivi d'exécution » exposée via la fiche détail du marché (hors wizard de création).

### Pièces générées (`docs/pieces.ts`)
- 11 pièces existantes préservées.
- **+4 nouvelles** : `generateDUME`, `generateDC4`, `generateConventionGroupement`, `generateRAR` (avec interface `RarLigne`).

### Tests de recette
- 5 scripts `scripts/verify-marches-*.test.ts` — tous **exit 0** (seuils, saucissonnage, clauses, pièces, RAR).
