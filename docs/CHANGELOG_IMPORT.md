# Changelog — Plateforme d'import

## 2026-04-25 — Refonte industrielle de l'ingestion

### Ajouts
- **Librairie partagée `src/lib/import/`** factorisant tout le parsing :
  - `textUtils.ts` — `parseFrenchNumber`, `parseFrenchDate`, `detectEncoding`, `decodeBuffer`, `sha256Hex`, `isValidINE`, `isValidUAI`
  - `sheetUtils.ts` — `scoreSheetByHeaders`, `selectBestSheet` (généralise la logique balance)
  - `fileTypeDetector.ts` — `detectFileType` (9 types) + `IMPORT_TYPE_LABELS`
  - `crossValidation.ts` — `runCrossChecks`, `summarizeChecks`
  - `importService.ts` — `persistImport`, `listHistorique`, `getArchivedFileUrl`
  - Réexports compat (`repairSheetRange`, `detectSeparator`, `stripBOM`, `parseCsvText`, `selectOpaleBalanceSheet`, `findUaiInMatrix`)
- **Parsers spécialisés** : `parseGrandLivre`, `parseEtatTiers`, `parseSiecleCsv`, `parseSiecleWorkbook`, `parseBourses`, `parseRegies` + mention RGPD `RGPD_SIECLE_MENTION`
- **Migration BDD** : table `imports_historique` (versioning 10 ans), enums `import_file_type` / `import_status`, trigger `imports_historique_archive_previous` (marque les versions précédentes comme `ecrase`), bucket privé `imports-archive` avec RLS par EPLE
- **Composants UI** : `DropZoneMulti`, `CrossValidationPanel`, `HistoriqueImports`, `RgpdSiecleNotice`
- **Refonte page `/import`** :
  - Drop multi-fichiers avec détection automatique du type
  - Aperçu pré-import (type, UAI détecté, lignes, totaux, anomalies) avec sélecteur manuel de type
  - Validation croisée inter-fichiers (Σ classe 6 ↔ SDE, Σ classe 7 ↔ SDR, Σ C/411X ↔ tiers, Σ C/443110 ↔ bourses) avec tolérance 0,01 €
  - Onglet « Historique » avec téléchargement des fichiers originaux archivés
  - Mention RGPD bloquante avant tout import SIECLE / bourses (art. 6.1.e RGPD)

### Préservation
- Aucune régression sur l'import balance Op@le (`selectOpaleBalanceSheet`, `repairSheetRange`, scoring d'onglet)
- Réutilisation des parsers SDE/SDR existants (`selectOpaleSdeSdrSheet`, `parseSdeRows`, `parseSdrRows`)
- `cofieple_import_logs` conservé pour le journal d'audit COFIEPLE

### Recette
6 scripts `scripts/verify-import-*.mjs` — tous **exit 0** :
`shared-lib`, `textutils`, `detection`, `crosscheck`, `historique`, `ui`

### Conformité
M9-6, GBCP 2012-1246, Code éducation, RGPD (art. 6.1.e — mission de service public, conservation année scolaire + 1 an).