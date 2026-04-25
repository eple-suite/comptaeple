// ═══════════════════════════════════════════════════════════════
// LIBRAIRIE PARTAGÉE D'INGESTION
// Factorise le parsing utilisé par tous les imports (balance,
// SDE/SDR, grand livre, état tiers, SIECLE, bourses, régies, paie).
// Réexporte l'existant pour éviter toute régression.
// ═══════════════════════════════════════════════════════════════

export * from './textUtils';
export * from './sheetUtils';
export * from './fileTypeDetector';
export * from './crossValidation';

// Réexports de l'existant (compat) — tous les modules d'import
// doivent passer par src/lib/import/ désormais.
export {
  repairWorksheetRange as repairSheetRange,
  getWorksheetMatrix,
  getWorkbookSheetCandidates,
  selectWorkbookSheetByHeaders,
  selectLargestWorkbookSheet,
  selectOpaleBalanceSheet,
  findUaiInMatrix,
  detectCsvDelimiter as detectSeparator,
  parseCsvText,
  parseCsvFile,
  stripUtf8Bom as stripBOM,
} from '../opaleWorkbook';

export type {
  WorkbookSheetCandidate,
  BalanceSheetSelection,
} from '../opaleWorkbook';