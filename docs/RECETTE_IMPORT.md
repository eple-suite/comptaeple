# Recette — Plateforme d'import

## Scripts automatisés (tous exit 0)

| Script | Couverture |
|--------|-----------|
| `verify-import-shared-lib.mjs` | Présence des 11 fichiers de la librairie + 21 symboles exposés |
| `verify-import-textutils.mjs` | Nombres FR (espaces insécables, parenthèses, anglo), INE/UAI, mention RGPD complète |
| `verify-import-detection.mjs` | 7 cas de détection automatique (balance, SDE, SDR, SIECLE, bourses, grand livre, tiers) |
| `verify-import-crosscheck.mjs` | Tolérance 0,01 €, écart > tolérance signalé, isolation des fichiers seuls |
| `verify-import-historique.mjs` | Migration SQL (table, enums, RLS, trigger, bucket), service `persistImport` / `listHistorique` |
| `verify-import-ui.mjs` | Composants UI présents et câblés dans `DataImport.tsx`, non-régression import balance |

## Recette manuelle

1. **Sélectionner un EPLE** dans le sélecteur. La zone de dépôt s'active.
2. **Déposer une balance Op@le** (`Balance_*.xlsx`) → détectée automatiquement, UAI extrait, lignes comptées.
3. **Déposer un SDE et un SDR** de la même période → la validation croisée affiche Σ C6 ↔ Mandats et Σ C7 ↔ Ordres.
4. **Cliquer « Importer & archiver »** → le fichier original est uploadé dans le bucket `imports-archive`, une ligne `imports_historique` est créée.
5. **Réimporter le même type/période** → le précédent passe en statut `ecrase` (vérifiable dans l'onglet Historique).
6. **Déposer un export SIECLE** → la mention RGPD bloque l'import jusqu'à acceptation explicite de la case attestation.
7. **Onglet Historique** → téléchargement du fichier original archivé via URL signée 5 min.

## Critères d'acceptation

- ✅ Aucune régression sur l'import balance qui fonctionnait
- ✅ 9 types couverts (balance, SDE, SDR, grand livre, état tiers, SIECLE élèves, bourses, régies, paie)
- ✅ Versioning : ancien import marqué `ecrase`, jamais supprimé
- ✅ Archivage : fichier original conservé, URL signée à la demande
- ✅ RGPD SIECLE : mention bloquante avec finalité, base légale, conservation, destinataires, droits
- ✅ Validation croisée : tolérance 0,01 € ; écarts affichés avec hint pédagogique
- ✅ RLS : un membre d'un EPLE ne voit que les imports de son établissement