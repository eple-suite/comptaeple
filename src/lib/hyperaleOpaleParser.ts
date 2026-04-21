/**
 * Parseur de fichiers Op@le (CSV / XLSX) pour HYPER@LE.
 * Normalise les colonnes, valide les données et retourne un tableau propre.
 */
import * as XLSX from 'xlsx';
import { parseCsvFile, selectLargestWorkbookSheet, selectWorkbookSheetByHeaders } from './opaleWorkbook';

export interface OpaleRow {
  uai: string;
  annee: number;
  nom?: string;
  fdr: number;
  caf: number;
  tresorerie: number;
  reserves: number;
  drfn?: number;
  resultatComptable?: number;
  tauxExecCharges?: number;
  tauxExecProduits?: number;
}

export interface ParseResult {
  success: boolean;
  data: OpaleRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
}

const REQUIRED_COLUMNS = ['uai', 'annee', 'fdr', 'caf', 'tresorerie', 'reserves'] as const;

const COLUMN_ALIASES: Record<string, string> = {
  'uai': 'uai',
  'code_uai': 'uai',
  'rne': 'uai',
  'annee': 'annee',
  'année': 'annee',
  'exercice': 'annee',
  'year': 'annee',
  'fdr': 'fdr',
  'fonds_de_roulement': 'fdr',
  'fonds de roulement': 'fdr',
  'caf': 'caf',
  'capacite_autofinancement': 'caf',
  'capacité autofinancement': 'caf',
  'tresorerie': 'tresorerie',
  'trésorerie': 'tresorerie',
  'treasury': 'tresorerie',
  'reserves': 'reserves',
  'réserves': 'reserves',
  'nom': 'nom',
  'nom_etablissement': 'nom',
  'nom etablissement': 'nom',
  'etablissement': 'nom',
  'établissement': 'nom',
  'drfn': 'drfn',
  'resultat_comptable': 'resultatComptable',
  'résultat comptable': 'resultatComptable',
  'resultat comptable': 'resultatComptable',
  'taux_exec_charges': 'tauxExecCharges',
  'taux exec charges': 'tauxExecCharges',
  'taux_exec_produits': 'tauxExecProduits',
  'taux exec produits': 'tauxExecProduits',
};

function normalizeColumnName(col: string): string {
  const cleaned = col.trim().toLowerCase()
    .replace(/[_\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a');
  // Try direct alias match first
  if (COLUMN_ALIASES[cleaned]) return COLUMN_ALIASES[cleaned];
  // Try original lowercase
  if (COLUMN_ALIASES[col.trim().toLowerCase()]) return COLUMN_ALIASES[col.trim().toLowerCase()];
  return cleaned;
}

function toNumber(val: unknown): number | null {
  if (val == null || val === '') return null;
  const s = String(val).replace(/\s/g, '').replace(',', '.');
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function parseRows(rawRows: Record<string, unknown>[]): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawRows || rawRows.length === 0) {
    return { success: false, data: [], errors: ['Aucune donnée exploitable trouvée.'], warnings, rowCount: 0 };
  }

  // Normalize column names
  const firstRow = rawRows[0];
  const columnMap: Record<string, string> = {};
  for (const key of Object.keys(firstRow)) {
    columnMap[key] = normalizeColumnName(key);
  }

  // Check required columns
  const normalizedCols = new Set(Object.values(columnMap));
  const missing = REQUIRED_COLUMNS.filter(c => !normalizedCols.has(c));
  if (missing.length > 0) {
    return {
      success: false,
      data: [],
      errors: [`Colonnes obligatoires manquantes : ${missing.join(', ')}.`],
      warnings,
      rowCount: 0,
    };
  }

  const data: OpaleRow[] = [];
  let skipped = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const normalized: Record<string, unknown> = {};
    for (const [origKey, normKey] of Object.entries(columnMap)) {
      normalized[normKey] = raw[origKey];
    }

    const uai = String(normalized.uai || '').trim().toUpperCase();
    const annee = toNumber(normalized.annee);
    const fdr = toNumber(normalized.fdr);
    const caf = toNumber(normalized.caf);
    const tresorerie = toNumber(normalized.tresorerie);
    const reserves = toNumber(normalized.reserves);

    if (!uai || annee == null || fdr == null || caf == null || tresorerie == null || reserves == null) {
      skipped++;
      continue;
    }

    const row: OpaleRow = { uai, annee, fdr, caf, tresorerie, reserves };
    if (normalized.nom) row.nom = String(normalized.nom).trim();
    if (normalized.drfn != null) row.drfn = toNumber(normalized.drfn) ?? undefined;
    if (normalized.resultatComptable != null) row.resultatComptable = toNumber(normalized.resultatComptable) ?? undefined;
    if (normalized.tauxExecCharges != null) row.tauxExecCharges = toNumber(normalized.tauxExecCharges) ?? undefined;
    if (normalized.tauxExecProduits != null) row.tauxExecProduits = toNumber(normalized.tauxExecProduits) ?? undefined;

    data.push(row);
  }

  if (skipped > 0) {
    warnings.push(`${skipped} ligne(s) ignorée(s) (données incomplètes).`);
  }

  if (data.length === 0) {
    return { success: false, data: [], errors: ['Aucune donnée exploitable trouvée.'], warnings, rowCount: 0 };
  }

  return { success: true, data, errors, warnings, rowCount: data.length };
}

export async function parseOpaleFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'txt') {
    try {
      const rows = await parseCsvFile(file);
      return parseRows(rows as Record<string, unknown>[]);
    } catch {
      return { success: false, data: [], errors: ['Impossible de lire le fichier CSV.'], warnings: [], rowCount: 0 };
    }
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const candidate = selectWorkbookSheetByHeaders(workbook, {
        requiredHeaders: [...REQUIRED_COLUMNS],
        maxHeaderScanRows: 8,
        minMatches: REQUIRED_COLUMNS.length,
      }) ?? selectLargestWorkbookSheet(workbook);

      if (!candidate) {
        return { success: false, data: [], errors: ['Le fichier Excel ne contient aucune feuille.'], warnings: [], rowCount: 0 };
      }
      return parseRows(candidate.records as Record<string, unknown>[]);
    } catch {
      return { success: false, data: [], errors: ['Impossible de lire le fichier Excel.'], warnings: [], rowCount: 0 };
    }
  }

  return { success: false, data: [], errors: ['Format de fichier non reconnu. Formats acceptés : CSV, XLSX.'], warnings: [], rowCount: 0 };
}
