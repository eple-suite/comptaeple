import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { buildRowsFromSheetMatrix, normalizeColumnName } from './opaleImportUtils';

type SheetCell = string | number | boolean | null | undefined;

export interface WorkbookSheetCandidate {
  sheetName: string;
  matrix: SheetCell[][];
  records: Record<string, string>[];
}

function getSheetMaxBounds(sheet: XLSX.WorkSheet): { maxRow: number; maxCol: number } {
  let maxRow = 1;
  let maxCol = 1;

  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const cell = XLSX.utils.decode_cell(key);
    maxRow = Math.max(maxRow, cell.r + 1);
    maxCol = Math.max(maxCol, cell.c + 1);
  }

  return { maxRow, maxCol };
}

export function repairWorksheetRange(sheet: XLSX.WorkSheet): void {
  const { maxRow, maxCol } = getSheetMaxBounds(sheet);
  sheet['!ref'] = `A1:${XLSX.utils.encode_col(maxCol - 1)}${maxRow}`;
}

export function getWorksheetMatrix(sheet: XLSX.WorkSheet): SheetCell[][] {
  repairWorksheetRange(sheet);
  return XLSX.utils.sheet_to_json<SheetCell[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
}

export function getWorkbookSheetCandidates(workbook: XLSX.WorkBook): WorkbookSheetCandidate[] {
  return workbook.SheetNames.map((sheetName) => {
    const matrix = getWorksheetMatrix(workbook.Sheets[sheetName]);
    return {
      sheetName,
      matrix,
      records: buildRowsFromSheetMatrix(matrix),
    };
  }).filter((candidate) => candidate.records.length > 0 || candidate.matrix.length > 0);
}

function countHeaderMatches(row: SheetCell[], requiredHeaders: string[]): number {
  const normalized = row.map((cell) => normalizeColumnName(String(cell ?? '')));
  return requiredHeaders.filter((header) => {
    const target = normalizeColumnName(header);
    return normalized.some((cell) => cell === target || cell.startsWith(target));
  }).length;
}

function hasForbiddenHeaders(row: SheetCell[], forbiddenPatterns: RegExp[]): boolean {
  const normalized = row.map((cell) => normalizeColumnName(String(cell ?? '')));
  return normalized.some((cell) => forbiddenPatterns.some((pattern) => pattern.test(cell)));
}

export function selectWorkbookSheetByHeaders(
  workbook: XLSX.WorkBook,
  options: {
    requiredHeaders: string[];
    forbiddenHeaderPatterns?: RegExp[];
    maxHeaderScanRows?: number;
    minMatches?: number;
  },
): WorkbookSheetCandidate | null {
  const {
    requiredHeaders,
    forbiddenHeaderPatterns = [],
    maxHeaderScanRows = 8,
    minMatches = Math.min(5, requiredHeaders.length),
  } = options;

  let best: (WorkbookSheetCandidate & { score: number }) | null = null;

  for (const candidate of getWorkbookSheetCandidates(workbook)) {
    const scanLimit = Math.min(candidate.matrix.length, maxHeaderScanRows);
    for (let i = 0; i < scanLimit; i += 1) {
      const row = candidate.matrix[i] ?? [];
      if (hasForbiddenHeaders(row, forbiddenHeaderPatterns)) continue;
      const matchCount = countHeaderMatches(row, requiredHeaders);
      if (matchCount < minMatches) continue;

      const score = matchCount * 100 + candidate.records.length;
      if (!best || score > best.score) {
        best = { ...candidate, score };
      }
    }
  }

  return best;
}

export function selectLargestWorkbookSheet(workbook: XLSX.WorkBook): WorkbookSheetCandidate | null {
  const candidates = getWorkbookSheetCandidates(workbook);
  if (candidates.length === 0) return null;

  return candidates.reduce((best, candidate) => {
    if (!best) return candidate;
    if (candidate.records.length > best.records.length) return candidate;
    if (candidate.records.length === best.records.length && candidate.matrix.length > best.matrix.length) return candidate;
    return best;
  }, null as WorkbookSheetCandidate | null);
}

export function stripUtf8Bom(text: string): string {
  return text.replace(/^\uFEFF/, '');
}

// ─────────────────────────────────────────────────────────────────
// Sélection d'onglet balance Op@le par scoring (cohérent avec
// scripts/verify-balance-import.mjs).
// ─────────────────────────────────────────────────────────────────

const BALANCE_CANONICAL_HEADERS = [
  'compte', 'montant débit', 'montant crédit', 'solde débit', 'solde crédit', 'classe',
];
const BALANCE_TCD_SIGNATURES = ['somme de', '__empty', 'unnamed:', 'total général', 'étiquettes de lignes'];

export interface BalanceSheetSelection {
  sheetName: string;
  matrix: SheetCell[][];
  headerRowIndex: number;
  headers: string[];
  score: number;
}

export function selectOpaleBalanceSheet(workbook: XLSX.WorkBook): BalanceSheetSelection | null {
  let best: BalanceSheetSelection | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    repairWorksheetRange(sheet);
    const matrix = XLSX.utils.sheet_to_json<SheetCell[]>(sheet, {
      header: 1, defval: null, blankrows: false, raw: true,
    });

    let headerRowIndex = -1;
    let headerScore = 0;
    for (let i = 0; i < Math.min(matrix.length, 8); i += 1) {
      const row = matrix[i] ?? [];
      const norm = row.map((c) => normalizeColumnName(String(c ?? '')));
      const tcd = norm.some((h) => BALANCE_TCD_SIGNATURES.some((s) => h.includes(s)));
      if (tcd) continue;
      const matches = BALANCE_CANONICAL_HEADERS.filter((c) =>
        norm.some((h) => h.startsWith(normalizeColumnName(c))),
      ).length;
      if (matches > headerScore) { headerScore = matches; headerRowIndex = i; }
    }

    let score = headerScore * 5;
    if (headerRowIndex >= 0) {
      const headers = matrix[headerRowIndex].map((c) => normalizeColumnName(String(c ?? '')));
      // pénalité si TCD signatures dans la ligne d'en-tête
      if (headers.some((h) => BALANCE_TCD_SIGNATURES.some((s) => h.includes(s)))) score -= 10;
      // +1 par ligne valide (compte 3-10 chars + classe 1-8)
      const compteIdx = headers.findIndex((h) => h === 'compte');
      const classeIdx = headers.findIndex((h) => h.startsWith('classe'));
      if (compteIdx !== -1 && classeIdx !== -1) {
        for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
          const r = matrix[i] ?? [];
          const compte = String(r[compteIdx] ?? '').trim();
          const classe = String(r[classeIdx] ?? '').trim();
          if (/^[0-9A-Z]{3,10}$/i.test(compte) && /^[1-8]$/.test(classe)) score += 1;
        }
      }
    }

    if (score >= 10 && headerRowIndex >= 0) {
      const headers = (matrix[headerRowIndex] ?? []).map((c) => String(c ?? ''));
      if (!best || score > best.score) {
        best = { sheetName, matrix, headerRowIndex, headers, score };
      }
    }
  }

  return best;
}

/**
 * Cherche un UAI (7 chiffres + 1 lettre) dans toutes les cellules des
 * lignes de données. Op@le ne le place pas toujours dans une colonne
 * dédiée, parfois dans une cellule méta hors-tableau.
 */
export function findUaiInMatrix(matrix: SheetCell[][]): string | null {
  for (const row of matrix) {
    if (!row) continue;
    for (const cell of row) {
      const v = String(cell ?? '').trim();
      if (/^[0-9]{7}[A-Z]$/i.test(v)) return v.toUpperCase();
    }
  }
  return null;
}

export function detectCsvDelimiter(text: string): string {
  const firstLine = stripUtf8Bom(text).split(/\r?\n/, 1)[0] ?? '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons >= commas && semicolons >= tabs && semicolons > 0) return ';';
  if (tabs > semicolons && tabs > commas) return '\t';
  if (commas > 0) return ',';
  return ';';
}

export function parseCsvText(text: string): Record<string, string>[] {
  const cleaned = stripUtf8Bom(text);
  const delimiter = detectCsvDelimiter(cleaned);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header) => stripUtf8Bom(header).trim(),
    transform: (value) => stripUtf8Bom(value).trim(),
  });

  return (result.data ?? []).filter((row) => Object.values(row).some((value) => String(value ?? '').trim() !== ''));
}

export async function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  const text = await file.text();
  return parseCsvText(text);
}