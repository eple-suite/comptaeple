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

// Parsers spécialisés (les imports balance/SDE/SDR existants
// continuent d'utiliser leurs modules historiques pour préserver
// la non-régression).
export { parseGrandLivre } from './parsers/grandLivreParser';
export type { EcritureGrandLivre, GrandLivreResult } from './parsers/grandLivreParser';

export { parseEtatTiers } from './parsers/etatTiersParser';
export type { SoldeTiers, EtatTiersResult } from './parsers/etatTiersParser';

export { parseSiecleCsv, parseSiecleWorkbook, RGPD_SIECLE_MENTION } from './parsers/siecleParser';
export type { EleveSiecle, SiecleParseResult } from './parsers/siecleParser';

export { parseBourses } from './parsers/boursesParser';
export type { LigneBourse, BoursesResult } from './parsers/boursesParser';

export { parseRegies } from './parsers/regiesParser';
export type { RegieLigne, RegiesResult } from './parsers/regiesParser';

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