# CHANGELOG

## [BLOQUÉ] Recette import balance Op@le — fichier `w105973251.xlsx` reçu mais VIDE

### Script de recette
- `scripts/verify-balance-import.mjs` opérationnel.

### Sortie complète de l'exécution
```
╔════════════════════════════════════════════════════════╗
║  RECETTE IMPORT BALANCE OP@LE — verify-balance-import  ║
╚════════════════════════════════════════════════════════╝

Fichier testé : /tmp/w105973251.xlsx

━━━ 1. Onglets trouvés ━━━
  ℹ « Balance »
  ℹ « Donnees »

━━━ 2. Détection de l'onglet balance ━━━
  ✗ Aucun onglet exploitable détecté

VALIDATION ÉCHOUÉE — Import impossible.
```
Exit code : **1**

### Diagnostic
Le fichier `w105973251.xlsx` fourni est **structurellement vide** :

- **Sheet « Balance »** (TCD) : 7 lignes d'en-têtes seulement, `Total général = 0`.
- **Sheet « Donnees »** : 3 lignes — `A1` = méta job (toutes valeurs à `0`),
  `A2` = méta établissement (UAI = `0`, période = `0`), `A3` = en-têtes de
  colonnes. **Aucune ligne de données comptables.**
- **Cellules numériques non nulles dans tout le classeur : 0.**

Le référentiel attendu par le script (88 lignes, UAI `9710040S`, période
`04/2026`, totaux ~1,5 M€, 8 comptes de contrôle) **ne peut pas être
rapproché de ce fichier** : il n'y a littéralement rien à importer.

### Hypothèses
1. Export Op@le effectué sans période sélectionnée (filtre vide).
2. Mauvais fichier joint (template au lieu de l'extraction réelle).
3. Anonymisation excessive avant transmission.

### Action requise
Merci de redéposer le fichier `w105973251.xlsx` **avec ses données
comptables réelles** (UAI `9710040S`, période `04/2026`). Le script
sera relancé immédiatement et la sortie sera annexée ici.

### Code applicatif
Aucune modification de `src/` : aucune correction à l'aveugle tant que
le fichier de référence n'est pas exploitable.