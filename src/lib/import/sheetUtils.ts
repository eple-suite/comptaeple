// ═══════════════════════════════════════════════════════════════
// Sélection d'onglet par scoring d'en-têtes + signatures TCD
// (généralisation de la logique balance déjà en place)
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { repairWorksheetRange, getWorksheetMatrix } from '../opaleWorkbook';
import { normalizeColumnName } from '../opaleImportUtils';

export interface SheetScoreOptions {
  /** En-têtes attendus (au moins minMatches doivent être présents). */
  requiredHeaders: string[];
  /** Signatures qui pénalisent (TCD, sommes, vide). */
  tcdSignatures?: string[];
  /** Profondeur de scan des lignes pour trouver l'en-tête. */
  maxHeaderScanRows?: number;
  /** Nombre minimal d'en-têtes matchés. */
  minMatches?: number;
}

export interface SheetScoreResult {
  sheetName: string;
  headerRowIndex: number;
  headers: string[];
  matrix: (string | number | boolean | null | undefined)[][];
  score: number;
}

const DEFAULT_TCD_SIGNATURES = [
  'somme de',
  '__empty',
  'unnamed:',
  'total général',
  'total general',
  'étiquettes de lignes',
  'etiquettes de lignes',
];

/**
 * Score un onglet selon ses en-têtes et la présence/absence de
 * signatures TCD. Plus le score est élevé, plus l'onglet est un
 * bon candidat « données brutes » (vs synthèse).
 */
export function scoreSheetByHeaders(
  sheet: XLSX.WorkSheet,
  options: SheetScoreOptions,
): { headerRowIndex: number; headers: string[]; score: number } {
  const {
    requiredHeaders,
    tcdSignatures = DEFAULT_TCD_SIGNATURES,
    maxHeaderScanRows = 8,
    minMatches = Math.min(4, requiredHeaders.length),
  } = options;

  repairWorksheetRange(sheet);
  const matrix = getWorksheetMatrix(sheet);

  let bestRow = -1;
  let bestScore = 0;

  for (let i = 0; i < Math.min(matrix.length, maxHeaderScanRows); i += 1) {
    const row = matrix[i] ?? [];
    const norm = row.map((c) => normalizeColumnName(String(c ?? '')));
    const hasTcd = norm.some((h) => tcdSignatures.some((sig) => h.includes(sig)));
    if (hasTcd) continue;

    const matches = requiredHeaders.filter((req) => {
      const target = normalizeColumnName(req);
      return norm.some((h) => h === target || h.startsWith(target));
    }).length;

    if (matches >= minMatches && matches > bestScore) {
      bestScore = matches;
      bestRow = i;
    }
  }

  const headers =
    bestRow >= 0 ? (matrix[bestRow] ?? []).map((c) => String(c ?? '')) : [];

  return {
    headerRowIndex: bestRow,
    headers,
    score: bestScore,
  };
}

/**
 * Sélectionne le meilleur onglet d'un classeur selon le scoring.
 */
export function selectBestSheet(
  workbook: XLSX.WorkBook,
  options: SheetScoreOptions,
): SheetScoreResult | null {
  let best: SheetScoreResult | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const { headerRowIndex, headers, score } = scoreSheetByHeaders(sheet, options);
    if (headerRowIndex < 0) continue;

    const matrix = getWorksheetMatrix(sheet);
    if (!best || score > best.score) {
      best = { sheetName, headerRowIndex, headers, matrix, score };
    }
  }

  return best;
}