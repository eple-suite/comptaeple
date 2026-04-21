# CHANGELOG

## [En attente] Recette import balance Op@le — fichier `w105973251.xlsx`

### Script de recette
- Ajout de `scripts/verify-balance-import.mjs` (référentiel autonome).
- Usage : `node scripts/verify-balance-import.mjs <chemin/w105973251.xlsx>`

### Statut
❌ **Validation NON exécutée sur le fichier de référence** : le fichier
`w105973251.xlsx` (UAI attendu `9710040S`, période `04/2026`) n'est pas
présent dans le workspace (`/dev-server/tmp_uploads/` ne contient que
`balance.xlsx` et `balance-1-2.xlsx`, qui correspondent à un autre
établissement — UAI `P03427`).

### Test à blanc effectué (script vs `balance.xlsx` UAI P03427)
Le script s'exécute correctement et applique bien sa logique :
- ✓ Détection automatique de l'onglet exploitable (rejet TCD)
- ✓ Aucune colonne fantôme (`__EMPTY_`, `Unnamed:`, `Somme de`)
- ✓ Équilibre Débit/Crédit vérifié (écart 0,00 €)
- ✗ Échecs **attendus** sur les valeurs de référence (UAI/période/totaux/comptes)
  car le fichier testé n'est pas le fichier de recette.

### Action requise de l'utilisateur
Déposer `w105973251.xlsx` dans le chat (ou dans `/tmp/uploads/`),
puis relancer :
```
node scripts/verify-balance-import.mjs <chemin/w105973251.xlsx>
```
La sortie complète sera annexée à ce CHANGELOG dès obtention du fichier.

### Code applicatif
Aucune modification du code applicatif (`src/`) effectuée à ce stade :
sans le fichier de référence et sa sortie réelle, je ne dispose pas du
diagnostic exact du défaut à corriger côté applicatif. Toute correction
« à l'aveugle » risquerait de masquer le vrai bug.