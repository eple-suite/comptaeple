// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Section Import CSV Op@le
// Formats attendus : SDE, SDR, Balance (IMPORT BAL)
// Conformité : M9-6 2026 — Extraction Op@le standard
// Verrou de sécurité : concordance UAI/Op@le fichier ↔ établissement
// Détection automatique du type de budget (principal/annexe)
// ═══════════════════════════════════════════════════════════════

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Info, Upload, Play, Loader2, CheckCircle2, XCircle, RefreshCw, ShieldAlert, ShieldCheck, AlertTriangle, FileSearch, Sparkles, ListRestart } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { parserSDE, parserSDR, parserBalance } from '@/lib/cofieple_calculations';
import { findColumnIndex, normalizeColumnName, normalizeRowsForOpaleImport } from '@/lib/opaleImportUtils';
import { getWorkbookSheetCandidates, selectWorkbookSheetByHeaders } from '@/lib/opaleWorkbook';
import { detectBudgetType } from '@/lib/cofieple_csvParser';
import {
  selectOpaleSdeSdrSheet,
  computeTauxDepensesFromRecords,
  computeTauxRecettesFromRecords,
  buildSdeRowsFromRecords,
  verifierCoherenceOuvertures,
} from '@/lib/opaleSdeSdrParser';
import type { TypeBudget } from '@/lib/cofieple_storeTypes';
import { toast } from 'sonner';
import { ImportDebug } from './ImportDebug';
import { DiagnosticImportPanel, type DiagnosticImportEntry } from './DiagnosticImportPanel';

interface FileSlot {
  key: string; label: string; sublabel: string;
  type: 'sde' | 'sde1' | 'sdr' | 'sdr1' | 'bal' | 'bal1';
  typeBudget: TypeBudget; colonnes: string; obligatoire: boolean;
}

function getSlots(budgets: { type: TypeBudget; libelle: string }[]): FileSlot[] {
  const slots: FileSlot[] = [];
  for (const b of budgets) {
    const bt = b.type;
    const suffix = bt === 'principal' ? '' : ` (${b.libelle})`;
    slots.push(
      { key: `sde_${bt}`, label: `SDE${suffix}`, sublabel: 'Situation des dépenses — exercice N', type: 'sde', typeBudget: bt, obligatoire: true, colonnes: 'service, domaine, activité, compte, budget, réalisé, disponible' },
      { key: `sde1_${bt}`, label: `SDE N-1${suffix}`, sublabel: 'Situation des dépenses — exercice N-1', type: 'sde1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à SDE (exercice précédent)' },
      { key: `sdr_${bt}`, label: `SDR${suffix}`, sublabel: 'Situation des recettes — exercice N', type: 'sdr', typeBudget: bt, obligatoire: true, colonnes: 'service, domaine, activité, compte, budget, aor, réalisé' },
      { key: `sdr1_${bt}`, label: `SDR N-1${suffix}`, sublabel: 'Situation des recettes — exercice N-1', type: 'sdr1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à SDR (exercice précédent)' },
      { key: `bal_${bt}`, label: `Balance${suffix}`, sublabel: 'IMPORT BAL Op@le — exercice N', type: 'bal', typeBudget: bt, obligatoire: true, colonnes: 'Compte, Intitulé, Débit/Crédit antérieur, Débit/Crédit, Solde débit/crédit' },
      { key: `bal1_${bt}`, label: `Balance N-1${suffix}`, sublabel: 'IMPORT BAL — exercice N-1', type: 'bal1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à Balance (exercice précédent)' },
    );
  }
  return slots;
}

/** Extrait l'identifiant UAI/RNE présent dans les données CSV */
function extractCsvIdentifier(rows: Record<string, string>[]): { uai: string | null; opale: string | null } {
  let uai: string | null = null;
  let opale: string | null = null;
  for (const row of rows.slice(0, 20)) {
    for (const [key, val] of Object.entries(row)) {
      const v = String(val || '').trim().toUpperCase();
      const k = normalizeColumnName(key);
      if (!uai && (k.includes('rne') || k.includes('uai') || k.includes('etablissement'))) {
        if (/^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      }
      if (!opale && (k.includes('opale') || k.includes('op@le') || k.includes('identifiant'))) {
        if (/^P\d{5}$/.test(v)) opale = v;
      }
      if (!uai && /^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      if (!opale && /^P\d{5}$/.test(v)) opale = v;
    }
    if (uai) break;
  }
  return { uai, opale };
}

/** Convertit une valeur Op@le en exercice, uniquement si elle porte une vraie date/période. */
function extractYearFromDateLikeValue(value: unknown): number | null {
  const isValidYear = (year: number | null | undefined): year is number => !!year && year >= 2000 && year <= 2099;

  if (value instanceof Date) {
    const y = value.getFullYear();
    return isValidYear(y) ? y : null;
  }

  const v = String(value ?? '').trim();
  if (!v) return null;

  const fullDate = v.match(/\b\d{1,2}[/-]\d{1,2}[/-](20\d{2})\b/);
  if (fullDate) {
    const y = parseInt(fullDate[1], 10);
    return isValidYear(y) ? y : null;
  }

  const monthYear = v.match(/\b\d{1,2}[/-](20\d{2})\b/);
  if (monthYear) {
    const y = parseInt(monthYear[1], 10);
    return isValidYear(y) ? y : null;
  }

  const yearOnly = v.match(/^\s*(20\d{2})\s*$/);
  if (yearOnly) {
    const y = parseInt(yearOnly[1], 10);
    return isValidYear(y) ? y : null;
  }

  return null;
}

/** Extrait l'exercice depuis la balance uniquement, via la cellule AE4 (ligne 4, colonne AE) de l'onglet Donnees. */
function extractExerciceFromBalanceSheet(sheet?: XLSX.WorkSheet): number | null {
  if (!sheet) return null;
  const cell = sheet[XLSX.utils.encode_cell({ r: 3, c: 30 })];
  const formatted = extractYearFromDateLikeValue(cell?.w ?? null);
  if (formatted) return formatted;
  if (typeof cell?.v === 'number') {
    const decoded = XLSX.SSF.parse_date_code(cell.v);
    if (decoded?.y) return extractYearFromDateLikeValue(String(decoded.y));
  }
  return extractYearFromDateLikeValue(cell?.v ?? null);
}

/** Extrait l'exercice depuis une balance CSV/normalisée, sans jamais scanner les montants. */
function extractExerciceFromBalanceRows(rows: Record<string, string>[], sheetMeta?: string | null): number | null {
  const isValidYear = (year: number | null | undefined): year is number => !!year && year >= 2000 && year <= 2099;


  const isEditionOrPrintContext = (text: string): boolean => {
    const t = normalizeColumnName(text);
    return (
      t.includes('edite') ||
      t.includes('edition') ||
      t.includes('imprime') ||
      t.includes('date') ||
      t.includes('job') ||
      t.includes('utilisateur')
    );
  };

  const previewRows = rows.slice(0, 25);
  const entries = previewRows.flatMap((row) => Object.entries(row));

  // 1) Strong signals: "Période de début/fin" key-value pairs
  let periodStart: number | null = null;
  let periodEnd: number | null = null;
  for (const [key, val] of entries) {
    const k = normalizeColumnName(key);
    if (!k.includes('periode')) continue;
    const y = extractYearFromDateLikeValue(String(val || ''));
    if (!isValidYear(y)) continue;
    if (k.includes('fin')) periodEnd = y;
    if (k.includes('debut')) periodStart = y;
  }
  if (isValidYear(periodEnd)) return periodEnd;
  if (isValidYear(periodStart)) return periodStart;

  // 2) Text-level period detection (e.g. "du 01/2025 au 12/2025")
  const allTextRaw = `${sheetMeta || ''} ${previewRows
    .slice(0, 10)
    .map((r) => Object.entries(r).map(([k, v]) => `${k} ${v}`).join(' '))
    .join(' ')}`;
  const allText = normalizeColumnName(allTextRaw);

  const periodPatterns: RegExp[] = [
    /du\s+\d{1,2}[/-]\d{4}\s+au\s+\d{1,2}[/-](20\d{2})/i,
    /du\s+\d{1,2}[/-]\d{1,2}[/-]\d{4}\s+au\s+\d{1,2}[/-]\d{1,2}[/-](20\d{2})/i,
    /periode\s+de\s+debut\s*:?\s*\d{1,2}[/-](20\d{2}).{0,80}?periode\s+de\s+fin\s*:?\s*\d{1,2}[/-](20\d{2})/i,
    /periode\s+de\s+fin\s*:?\s*(?:\d{1,2}[/-])?(20\d{2})/i,
  ];

  for (const pattern of periodPatterns) {
    const m = allText.match(pattern);
    if (!m) continue;
    const candidate = parseInt(m[m.length - 1], 10);
    if (isValidYear(candidate)) return candidate;
  }

  // 3) Explicit exercice/année field (only standalone year accepted)
  for (const [key, val] of entries) {
    const k = normalizeColumnName(key);
    const v = String(val || '').trim();
    if (!k.includes('exercice') && !k.includes('annee')) continue;
    const yearOnly = v.match(/^\s*(20\d{2})\s*$/);
    if (!yearOnly) continue;
    const y = parseInt(yearOnly[1], 10);
    if (isValidYear(y)) return y;
  }

  // 4) Balance only: end-of-exercise dates. No generic year fallback: amounts like 2 081,25 € must never become an exercise.
  for (const [key, val] of entries) {
    const k = normalizeColumnName(key);
    if (k.includes('fin') && k.includes('exercice') && !isEditionOrPrintContext(k)) {
      const y = extractYearFromDateLikeValue(String(val || ''));
      if (isValidYear(y)) return y;
    }
  }

  return null;
}

/** Détecte le type de document à partir de ses colonnes (matching souple) */
function detectDocumentType(headers: string[], sheetTitle?: string | null): 'sde' | 'sdr' | 'bal' | null {
  const has = (...aliases: string[]) => findColumnIndex(headers, aliases) !== -1;

  const scores = { sde: 0, sdr: 0, bal: 0 };

  // ── Strong signal from ECBU sheet title ──
  if (sheetTitle) {
    const t = normalizeColumnName(sheetTitle);
    if (t.includes('depense')) scores.sde += 15;
    if (t.includes('recette')) scores.sdr += 15;
    if (t.includes('balance')) scores.bal += 15;
  }

  // ── Shared SDE/SDR columns (don't differentiate) ──
  if (has('service', 'cgr de niveau 3', 'cgr et intitule reduit 3')) { scores.sde += 2; scores.sdr += 2; }
  if (has('domaine', 'cgr de niveau 4', 'cgr et intitule reduit 4')) { scores.sde += 2; scores.sdr += 2; }
  if (has('budget')) { scores.sde += 2; scores.sdr += 2; }
  if (has('realise', 'réalisé', 'realise comptable')) { scores.sde += 1; scores.sdr += 1; }
  if (has('engage', 'engagé')) { scores.sde += 1; scores.sdr += 1; }

  // ── SDE-exclusive indicators ──
  if (has('disponible')) scores.sde += 4;

  // ── SDR-exclusive indicators ──
  if (has('aor', 'extourne', '+values', 'plus values', '+/- value', '+values/-values')) scores.sdr += 5;

  // ── "en cours" appears in both SDE and SDR, slight SDE lean only ──
  if (has('en cours', 'encours')) { scores.sde += 1; scores.sdr += 1; }

  // ── Balance indicators (Op@le pivot + DBF/IMPORT BAL formats) ──
  if (has('compte', 'compte et intitule', 'compte et intitulé', 'cgcompte')) scores.bal += 2;
  if (has('debit', 'débit', 'cgbedeb', 'cgopdeb', 'cgtedeb')) scores.bal += 2;
  if (has('credit', 'crédit', 'cgbecred', 'cgopcred', 'cgtecred')) scores.bal += 2;
  if (has('solde', 'cgsldeb', 'cgslcred')) scores.bal += 2;
  if (has('anterieur', 'antérieur', 'poste', 'montant', 'cglibelle')) scores.bal += 1;
  // DBF balance has EXERCICE + CGETAB columns — strong signal
  if (has('exercice') && has('cgetab')) scores.bal += 6;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = sorted[0];

  if (bestScore < 3) return null;
  return bestType as 'sde' | 'sdr' | 'bal';
}

/** Extract document title from ECBU or first sheet (e.g. "SITUATION DES RECETTES") */
function extractWorkbookTitle(wb: XLSX.WorkBook): string | null {
  for (const sn of wb.SheetNames) {
    if (normalizeColumnName(sn).includes('donnee')) continue; // skip data sheet
    const ws = wb.Sheets[sn];
    // Scan first 5 rows for a title string
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 10; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })];
        if (cell && typeof cell.v === 'string') {
          const v = cell.v.trim();
          if (/situation\s+des\s+(depenses|recettes|dépenses)/i.test(v) || /balance\s+comptable/i.test(v)) {
            return v;
          }
        }
      }
    }
  }
  return null;
}

/** Extract raw metadata text from ECBU/first sheet for exercise detection */
function extractWorkbookMeta(wb: XLSX.WorkBook): string {
  const parts: string[] = [];
  for (const sn of wb.SheetNames) {
    const isDataSheet = normalizeColumnName(sn).includes('donnee');
    const ws = wb.Sheets[sn];
    const maxRows = isDataSheet ? 4 : 8;
    const maxCols = isDataSheet ? 24 : 16;
    for (let r = 1; r <= maxRows; r++) {
      for (let c = 1; c <= maxCols; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })];
        if (cell && cell.v != null) parts.push(String(cell.v));
      }
    }
  }
  return parts.join(' ');
}

/** Diagnostic du choix de l'onglet effectué pour SDE/SDR/Balance.
 *  Permet à l'UI d'afficher l'onglet retenu et d'offrir un re-choix
 *  manuel en cas de fallback (heuristique de scoring legacy). */
export interface SheetPickDiagnostic {
  /** Onglet effectivement utilisé pour l'import. */
  sheetName: string;
  /** `canonique` = parser SDE/SDR officiel; `balance-headers` = sélecteur balance par en-têtes;
   *  `fallback` = scoring legacy lorsque les sélecteurs canoniques échouent;
   *  `forced` = onglet imposé manuellement par l'utilisateur. */
  mode: 'canonique' | 'balance-headers' | 'fallback' | 'forced';
  score: number | null;
  /** Exercice comptable extrait de façon fiable quand le format le permet (balance : AE4). */
  detectedExercice?: number | null;
  /** Source/cellule où l'exercice a été lu (ex. « AE4 » pour les balances). */
  detectedExerciceSource?: string | null;
  /** Règle exacte appliquée pour parser l'onglet retenu
   *  (ex. « Mapping POSITIONNEL Op@le K/AL/BL-BP », « En-têtes canoniques SDE/SDR »,
   *  « Sélecteur Balance par en-têtes (Compte/Débit/Crédit) »…). */
  appliedRule?: string;
  /** Index 0-based de la ligne d'en-têtes effectivement utilisée. */
  headerRowIndex?: number | null;
  /** Liste exhaustive des onglets évalués (pour la boîte « Reprendre sélection »). */
  candidates: Array<{
    sheetName: string;
    score: number | null;
    reason: string;
    /** Mode de détection envisagé pour cette feuille (positionnel, en-têtes, TCD…). */
    detectionMode?: string;
  }>;
}

function pickBestWorkbookRows(
  wb: XLSX.WorkBook,
  slotType: string,
  forcedSheetName?: string,
): { rows: Record<string, string>[]; title: string | null; meta: string; diag: SheetPickDiagnostic } {
  const expectedType = slotType.replace('1', '');
  const title = extractWorkbookTitle(wb);
  const meta = extractWorkbookMeta(wb);

  // ── Forçage manuel (bouton « Reprendre sélection ») ────────────────
  if (forcedSheetName && wb.Sheets[forcedSheetName]) {
    const records = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[forcedSheetName], { defval: '' });
    const rows = normalizeRowsForOpaleImport(records);
    return {
      rows,
      title: title || forcedSheetName,
      meta,
      diag: {
        sheetName: forcedSheetName,
        mode: 'forced',
        score: null,
          detectedExercice: expectedType === 'bal' ? extractExerciceFromBalanceSheet(wb.Sheets[forcedSheetName]) : null,
        candidates: wb.SheetNames.map((n) => ({ sheetName: n, score: null, reason: n === forcedSheetName ? 'imposé manuellement' : '' })),
      },
    };
  }

  if (expectedType === 'bal') {
    const balanceSheet = selectWorkbookSheetByHeaders(wb, {
      requiredHeaders: [
        'Compte',
        'Montant débit antérieur',
        'Montant crédit antérieur',
        'Montant débit',
        'Montant crédit',
        'Solde débit',
        'Solde crédit',
        'Classe de compte',
      ],
      forbiddenHeaderPatterns: [/^__empty/i, /^unnamed:/i, /^somme de/i, /^total general/i, /^total général/i],
      maxHeaderScanRows: 8,
      minMatches: 5,
    });

    if (balanceSheet) {
      return {
        rows: normalizeRowsForOpaleImport(balanceSheet.records),
        title,
        meta,
        diag: {
          sheetName: balanceSheet.sheetName,
          mode: 'balance-headers',
          score: null,
          detectedExercice: extractExerciceFromBalanceSheet(wb.Sheets[balanceSheet.sheetName]),
          candidates: wb.SheetNames.map((n) => ({ sheetName: n, score: null, reason: n === balanceSheet.sheetName ? 'sélecteur balance par en-têtes' : '' })),
        },
      };
    }
  }

  // ── Fast path SDE/SDR : sélecteur canonique « Donnees » (Chantier 1) ──
  // Rejette automatiquement les onglets TCD (« Situation… ») et choisit
  // l'onglet brut Op@le. Si la sélection est concluante, on convertit la
  // matrice en rows clé/valeur compatibles avec le parser CSV existant.
  if (expectedType === 'sde' || expectedType === 'sdr') {
    const selection = selectOpaleSdeSdrSheet(wb, expectedType);
    if (selection) {
      const headerRow = selection.matrix[selection.headerRowIndex] ?? [];
      const headers = headerRow.map((c, i) => {
        const v = String(c ?? '').trim();
        return v || `__empty_${i}`;
      });
      const dataRows: Record<string, string>[] = [];
      for (let i = selection.headerRowIndex + 1; i < selection.matrix.length; i += 1) {
        const r = selection.matrix[i] ?? [];
        const obj: Record<string, string> = {};
        let hasContent = false;
        for (let c = 0; c < headers.length; c += 1) {
          const v = r[c] == null ? '' : String(r[c]);
          obj[headers[c]] = v;
          if (v.trim()) hasContent = true;
        }
        if (hasContent) dataRows.push(obj);
      }
      if (dataRows.length > 0) {
        console.log(
          `[IMPORT-CANONIQUE] ${expectedType.toUpperCase()} → onglet « ${selection.sheetName} » ` +
          `(score ${selection.score}, ligne d'en-tête ${selection.headerRowIndex + 1}, ${dataRows.length} lignes)`
        );
        return {
          rows: normalizeRowsForOpaleImport(dataRows),
          title: title || selection.sheetName,
          meta,
          diag: {
            sheetName: selection.sheetName,
            mode: 'canonique',
            score: selection.score,
            candidates: selection.scoredSheets.map((s) => ({ sheetName: s.sheetName, score: s.score, reason: s.reason })),
          },
        };
      }
    }
    // sinon → fallback sur la logique de scoring historique ci-dessous
  }

  let bestRows: Record<string, string>[] = [];
  let bestScore = -Infinity;
  let bestSheet = '';
  const fallbackCandidates: Array<{ sheetName: string; score: number | null; reason: string }> = [];

  const getPreferredSheetScore = (sheetName: string, expected: string): number => {
    const normalized = normalizeColumnName(sheetName);
    let score = 0;

    // ⚠ CORRECTION CHIRURGICALE Op@le : l'onglet « ECBU » est un TCD
    // récapitulatif (6-10 lignes vides ou à zéro). Les vraies données
    // sont dans « Donnees ». On pénalise donc ECBU et on privilégie
    // Donnees pour SDE/SDR.
    if ((expected === 'sde' || expected === 'sdr') && normalized.includes('ecbu')) score -= 200;
    if ((expected === 'sde' || expected === 'sdr') && normalized.includes('donnee')) score += 50;
    if (expected === 'bal' && normalized.includes('donnee')) score += 30;
    if (expected === 'bal' && normalized.includes('balance')) score -= 10;

    return score;
  };

  for (const candidate of getWorkbookSheetCandidates(wb)) {
    const { sheetName } = candidate;
    const rows = normalizeRowsForOpaleImport(candidate.records);
    if (!rows.length) {
      fallbackCandidates.push({ sheetName, score: 0, reason: 'aucune donnée' });
      continue;
    }
    const headers = Object.keys(rows[0] || {});
    const detected = detectDocumentType(headers, title);

    const preferredSheetBoost = getPreferredSheetScore(sheetName, expectedType);

    let score = 0;
    score += Math.min(rows.length, 200) / 40;
    if (detected) score += 6;
    if (detected === expectedType) score += 20;
    score += preferredSheetBoost;
    if (headers.some((h) => normalizeColumnName(h).startsWith('montant colonne'))) score += 6;

    fallbackCandidates.push({
      sheetName,
      score: Math.round(score * 10) / 10,
      reason: `${rows.length} lignes${detected ? `, type détecté : ${detected}` : ', type indéterminé'}`,
    });

    // Fast path: if we hit the canonical Op@le summary sheet for this slot and
    // the detected structure matches, select it immediately.
    if (preferredSheetBoost >= 30 && detected === expectedType) {
      return {
        rows,
        title,
        meta,
        diag: {
          sheetName,
          mode: 'fallback',
          score: Math.round(score * 10) / 10,
          detectedExercice: expectedType === 'bal' ? extractExerciceFromBalanceSheet(wb.Sheets[sheetName]) : null,
          candidates: fallbackCandidates,
        },
      };
    }

    if (score > bestScore) {
      bestScore = score;
      bestRows = rows;
      bestSheet = sheetName;
    }
  }

  return {
    rows: bestRows,
    title,
    meta,
    diag: {
      sheetName: bestSheet || (wb.SheetNames[0] ?? ''),
      mode: 'fallback',
      score: bestScore === -Infinity ? null : Math.round(bestScore * 10) / 10,
      detectedExercice: expectedType === 'bal' && bestSheet ? extractExerciceFromBalanceSheet(wb.Sheets[bestSheet]) : null,
      candidates: fallbackCandidates,
    },
  };
}

/** Vérifie que les colonnes du fichier correspondent au type de slot attendu */
function validateColumns(headers: string[], slotType: string, sheetTitle?: string | null): { ok: boolean; detected: string | null; message?: string } {
  const baseType = slotType.replace('1', ''); // sde1 → sde
  const detected = detectDocumentType(headers, sheetTitle);
  if (!detected) {
    return { ok: false, detected: null, message: `Structure de colonnes non reconnue. Le fichier ne correspond à aucun format Op@le connu (SDE, SDR, Balance).` };
  }
  if (detected !== baseType) {
    const labels: Record<string, string> = { sde: 'Situation des Dépenses (SDE)', sdr: 'Situation des Recettes (SDR)', bal: 'Balance (IMPORT BAL)' };
    return {
      ok: false, detected,
      message: `Ce fichier semble être une ${labels[detected] || detected}, mais vous l'importez dans l'emplacement ${labels[baseType] || baseType}.`,
    };
  }
  return { ok: true, detected };
}

interface TripleLockResult {
  ok: boolean;
  type: 'opale' | 'exercice' | 'colonnes' | null;
  title?: string;
  message?: string;
  details?: string;
}

/** Triple verrou de sécurité : Op@le + Exercice + Nature du flux */
function tripleLockCheck(
  rows: Record<string, string>[],
  headers: string[],
  slotType: string,
  selectedUai: string,
  selectedOpale: string,
  exerciceTravail: number,
  sheetTitle?: string | null,
  sheetMeta?: string | null,
  detectedExercice?: number | null,
): TripleLockResult {
  const baseType = slotType.replace('1', '');
  // ── VERROU 1 : Code Op@le / UAI ──
  const { uai: fileUai, opale: fileOpale } = extractCsvIdentifier(rows);
  if (fileUai && selectedUai && fileUai !== selectedUai.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Concordance d’établissement',
      message: `Le fichier importé appartient à l'établissement UAI ${fileUai}, alors que vous travaillez sur ${selectedUai}. Veuillez vérifier votre export Op@le.`,
      details: 'Veuillez vérifier que vous avez sélectionné le bon établissement ou que votre export Op@le correspond.',
    };
  }
  if (fileOpale && selectedOpale && fileOpale !== selectedOpale.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Concordance d’établissement',
      message: `Le fichier importé appartient à l'établissement Op@le ${fileOpale}, alors que vous travaillez sur ${selectedOpale}. Veuillez vérifier votre export Op@le.`,
      details: "Veuillez vérifier votre export Op@le ou l\u2019identifiant technique de l\u2019établissement.",
    };
  }

  // ── VERROU 2 : Exercice comptable ──
  const fileExercice = baseType === 'bal'
    ? (detectedExercice ?? extractExerciceFromBalanceRows(rows, sheetMeta))
    : null;
  if (fileExercice && exerciceTravail) {
    const isN1Slot = slotType.endsWith('1');
    const expectedYear = isN1Slot ? exerciceTravail - 1 : exerciceTravail;
    if (fileExercice !== expectedYear) {
      return {
        ok: false, type: 'exercice',
        title: 'Erreur de concordance — Exercice comptable',
        message: `Vous tentez d'importer un fichier de l'exercice ${fileExercice} alors que vous travaillez sur l'exercice ${exerciceTravail}${isN1Slot ? ` (N-1 attendu : ${expectedYear})` : ''}.`,
        details: `L'exercice du fichier (${fileExercice}) ne correspond pas à l'exercice de travail. Veuillez vérifier votre export Op@le.`,
      };
    }
  }

  // ── VERROU 3 : Nature du flux (colonnes) ──
  const colCheck = validateColumns(headers, slotType, sheetTitle);
  if (!colCheck.ok) {
    return {
      ok: false, type: 'colonnes',
      title: 'Erreur de concordance — Type de document',
      message: colCheck.message || 'Format de colonnes non reconnu.',
      details: `Colonnes détectées : ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '…' : ''}`,
    };
  }

  return { ok: true, type: null };
}


export function ImportSection() {
  const budgets = useCofiepleStore(s => s.budgets);
  const fichierCharge = useCofiepleStore(s => s.fichierCharge);
  const setSDE = useCofiepleStore(s => s.setSDE);
  const setSDE1 = useCofiepleStore(s => s.setSDE1);
  const setSDR = useCofiepleStore(s => s.setSDR);
  const setSDR1 = useCofiepleStore(s => s.setSDR1);
  const setBalance = useCofiepleStore(s => s.setBalance);
  const setBalance1 = useCofiepleStore(s => s.setBalance1);
  const lancerAnalyse = useCofiepleStore(s => s.lancerAnalyse);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const analysisRunning = useCofiepleStore(s => s.analysisRunning);
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  const exerciceTravail = useCofiepleStore(s => s.etablissement.exercice);

  const [fileStats, setFileStats] = useState<Record<string, { rows: number; name: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [securityBlocks, setSecurityBlocks] = useState<Record<string, string>>({});
  const [lockAlert, setLockAlert] = useState<TripleLockResult & { slotLabel?: string } | null>(null);
  /** Diagnostic du choix d'onglet par slot (SDE/SDR/Balance Excel). */
  const [sheetDiag, setSheetDiag] = useState<Record<string, SheetPickDiagnostic>>({});
  /** Diagnostic enrichi par slot (mapping, échantillon, comptes ignorés) — affiché dans le panneau dédié. */
  const [diagEntries, setDiagEntries] = useState<Record<string, DiagnosticImportEntry>>({});
  /** Workbooks XLSX gardés en mémoire par slot, pour permettre une
   *  re-sélection manuelle de l'onglet sans re-uploader le fichier. */
  const workbooksRef = useRef<Record<string, { wb: XLSX.WorkBook; fileName: string }>>({});
  /** Slot dont l'utilisateur a ouvert le dialogue « Reprendre sélection ». */
  const [reSelectSlot, setReSelectSlot] = useState<FileSlot | null>(null);

  const slots = getSlots(budgets);
  const obligatoires = slots.filter(s => s.obligatoire);
  const nbObligCharge = obligatoires.filter(s => fichierCharge[s.key]).length;
  const canAnalyse = nbObligCharge >= 3;

  /** Consigne une tentative d'import dans le journal d'audit */
  async function logImport(params: {
    fileName: string; fileType: string; budgetType: string; rowsCount: number;
    result: string; rejectReason?: string;
    fileUai?: string | null; fileOpale?: string | null; fileExercice?: number | null; fileTypeDetected?: string | null;
  }) {
    if (!user || !selectedEstablishment) return;
    try {
      await supabase.from('cofieple_import_logs').insert({
        user_id: user.id,
        uai: selectedEstablishment.uai,
        opale_number: selectedEstablishment.opale_number || '',
        exercice: exerciceTravail,
        file_name: params.fileName,
        file_type: params.fileType,
        budget_type: params.budgetType,
        rows_count: params.rowsCount,
        result: params.result,
        reject_reason: params.rejectReason || null,
        file_uai_detected: params.fileUai || null,
        file_opale_detected: params.fileOpale || null,
        file_exercice_detected: params.fileExercice ?? null,
        file_type_detected: params.fileTypeDetected || null,
      });
    } catch (e) {
      console.error('Erreur journalisation import:', e);
    }
  }

  function processImportedRows(
    rawRows: Record<string, string>[],
    fileName: string,
    slot: FileSlot,
    sheetTitle?: string | null,
    sheetMeta?: string | null,
    diag?: SheetPickDiagnostic,
  ) {
    if (diag) {
      setSheetDiag((prev) => ({ ...prev, [slot.key]: diag }));
      // Toast informatif : onglet retenu + mode (canonique vs fallback)
      const modeLabel: Record<SheetPickDiagnostic['mode'], string> = {
        canonique: '✅ Sélection canonique',
        'balance-headers': '✅ Sélection par en-têtes',
        fallback: '⚠️ Sélection heuristique (fallback)',
        forced: '🔧 Sélection manuelle',
      };
      const description = `Onglet retenu : « ${diag.sheetName} »` +
        (diag.score != null ? ` (score ${diag.score})` : '') +
        (diag.candidates.length > 1 ? ` · ${diag.candidates.length} onglets évalués` : '');
      if (diag.mode === 'canonique' || diag.mode === 'balance-headers' || diag.mode === 'forced') {
        toast.success(`${modeLabel[diag.mode]} — ${slot.label}`, { description, duration: 6000 });
      } else {
        toast.warning(`${modeLabel[diag.mode]} — ${slot.label}`, {
          description: `${description}. Cliquez sur « Reprendre sélection » si un autre onglet est plus approprié.`,
          duration: 9000,
        });
      }
    }

    // ── DIAGNOSTIC: dump raw Excel rows before normalization ──
    if (rawRows.length > 0) {
      const rawKeys = Object.keys(rawRows[0]);
      console.log(`[IMPORT-DIAG] ${slot.type} RAW headers (${rawKeys.length}):`, rawKeys);
      // Find first row with numeric data
      const sampleWithData = rawRows.find(r => rawKeys.some(k => {
        const v = String(r[k] ?? '').trim();
        return v !== '' && v !== '0' && /\d/.test(v) && !/^(20\d{2}|N)$/.test(v);
      }));
      console.log(`[IMPORT-DIAG] ${slot.type} RAW sample (first with data):`, sampleWithData ? JSON.stringify(sampleWithData) : 'NONE FOUND');
      console.log(`[IMPORT-DIAG] ${slot.type} RAW row[0]:`, JSON.stringify(rawRows[0]));
      if (rawRows.length > 5) console.log(`[IMPORT-DIAG] ${slot.type} RAW row[5]:`, JSON.stringify(rawRows[5]));
    }

    const rows = normalizeRowsForOpaleImport(rawRows);

    if (rows.length > 0) {
      const normKeys = Object.keys(rows[0]);
      console.log(`[IMPORT-DIAG] ${slot.type} NORMALIZED headers (${normKeys.length}):`, normKeys);
      const normSample = rows.find(r => normKeys.some(k => {
        const v = String(r[k] ?? '').trim();
        return v !== '' && v !== '0' && /\d/.test(v) && !/^(20\d{2}|N)$/.test(v);
      }));
      console.log(`[IMPORT-DIAG] ${slot.type} NORMALIZED sample:`, normSample ? JSON.stringify(normSample) : 'NONE');
    }

    if (!rows || rows.length === 0) {
      setErrors(prev => ({ ...prev, [slot.key]: 'Fichier vide ou format non reconnu' }));
      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: 0, result: 'error', rejectReason: 'Fichier vide ou format non reconnu' });
      return;
    }

    const headers = Object.keys(rows[0] || {});
    const { uai: csvUai, opale: csvOpale } = extractCsvIdentifier(rows);
    const baseType = slot.type.replace('1', '');
    const csvExercice = baseType === 'bal'
      ? (diag?.detectedExercice ?? extractExerciceFromBalanceRows(rows, sheetMeta))
      : null;
    const csvDocType = detectDocumentType(headers, sheetTitle);

    // ── TRIPLE VERROU DE SÉCURITÉ ──
    if (selectedEstablishment) {
      const lock = tripleLockCheck(rows, headers, slot.type, selectedEstablishment.uai, selectedEstablishment.opale_number || '', exerciceTravail, sheetTitle, sheetMeta, csvExercice);
      if (!lock.ok) {
        const resultCode = lock.type === 'opale' ? 'blocked_opale' : lock.type === 'exercice' ? 'blocked_exercice' : 'blocked_colonnes';
        setSecurityBlocks(prev => ({ ...prev, [slot.key]: lock.message || 'Import bloqué' }));
        setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
        setLockAlert({ ...lock, slotLabel: slot.label });
        logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: resultCode, rejectReason: lock.message, fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
        return;
      }
      setSecurityBlocks(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
    }

    setFileStats(prev => ({ ...prev, [slot.key]: { rows: rows.length, name: fileName } }));
    setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
    try {
      if (slot.type === 'sde') setSDE(parserSDE(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sde1') setSDE1(parserSDE(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sdr') setSDR(parserSDR(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sdr1') setSDR1(parserSDR(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'bal') {
        const parsed = parserBalance(rows, slot.typeBudget);
        setBalance(parsed, slot.typeBudget);
        // ── Détection automatique du type de budget ──
        const detection = detectBudgetType(parsed);
        const typeLabels: Record<string, string> = {
          PRINCIPAL: 'Budget principal',
          ANNEXE_GRETA: 'Budget annexe GRETA',
          ANNEXE_CFA: 'Budget annexe CFA',
          ANNEXE_SRH: 'Budget annexe SRH',
          ANNEXE_AUTRE: 'Budget annexe (autre)',
        };
        const icon = detection.isAnnexe ? '📎' : '🏛️';
        toast.info(`${icon} Type détecté : ${typeLabels[detection.type]}`, {
          description: detection.details,
          duration: 6000,
        });
        if (detection.isAnnexe && slot.typeBudget === 'principal') {
          toast.warning('⚠️ Ce fichier semble être un budget annexe', {
            description: `Vous l'importez dans l'emplacement "Budget principal". Vérifiez que c'est correct ou utilisez l'emplacement budget annexe approprié.`,
            duration: 10000,
          });
        }
        if (!detection.isAnnexe && slot.typeBudget !== 'principal') {
          toast.warning('⚠️ Ce fichier semble être un budget principal', {
            description: `Vous l'importez dans un emplacement "Budget annexe". Le compte 515100 (Trésor) est présent.`,
            duration: 10000,
          });
        }

        // ── Détection compte 185000 — Liaison inter-budgets (M9-6 §5.3.2) ──
        const lignes185 = parsed.filter((b: any) => String(b.compte || '').startsWith('185'));
        const totalDbt185 = lignes185.reduce((s: number, b: any) => s + (Number(b.solDbt) || 0), 0);
        const totalCrd185 = lignes185.reduce((s: number, b: any) => s + (Number(b.solCrd) || 0), 0);
        const solde185 = totalDbt185 - totalCrd185; // >0 = débiteur (annexe), <0 = créditeur (support)
        const TOLERANCE = 1; // €

        if (Math.abs(solde185) > TOLERANCE) {
          if (slot.typeBudget !== 'principal' && solde185 > TOLERANCE) {
            // Annexe : compte 185 doit être débiteur — vérifier la réciprocité avec le support
            const balPrincipal = useCofiepleStore.getState().balance.principal || [];
            if (balPrincipal.length > 0) {
              const lignes185BP = balPrincipal.filter((b: any) => String(b.compte || '').startsWith('185'));
              const crdBP = lignes185BP.reduce((s: number, b: any) => s + (Number(b.solCrd) || 0), 0);
              const dbtBP = lignes185BP.reduce((s: number, b: any) => s + (Number(b.solDbt) || 0), 0);
              const soldeBP = crdBP - dbtBP; // >0 = créditeur attendu côté support
              const ecart = Math.abs(solde185 - soldeBP);
              if (ecart > TOLERANCE) {
                toast.warning('⚠️ Liaison inter-budgets non équilibrée (C/185)', {
                  description: `Débit C/185 annexe : ${solde185.toFixed(2)} € — Crédit C/185 support : ${soldeBP.toFixed(2)} € — Écart : ${ecart.toFixed(2)} € (M9-6 §5.3.2 : tolérance ≤ 1 €).`,
                  duration: 12000,
                });
              } else {
                toast.success('✅ Liaison inter-budgets équilibrée (C/185)', {
                  description: `Débit annexe ↔ Crédit support concordants (${solde185.toFixed(2)} €).`,
                  duration: 6000,
                });
              }
            } else {
              toast.info('🔗 Compte 185 débiteur détecté (budget annexe)', {
                description: `Solde débiteur C/185 : ${solde185.toFixed(2)} €. Importez la balance du budget principal pour vérifier la réciprocité (M9-6 §5.3.2).`,
                duration: 10000,
              });
            }
          } else if (slot.typeBudget === 'principal' && solde185 < -TOLERANCE) {
            // Principal : compte 185 doit être créditeur — alerter si annexe non rattachée
            toast.info('🔗 Compte 185 créditeur détecté (budget principal)', {
              description: `Crédit C/185 : ${Math.abs(solde185).toFixed(2)} € — un budget annexe (CFA/GRETA/SRH) doit être rattaché et présenter un débit équivalent (M9-6 §5.3.2).`,
              duration: 10000,
            });
          } else if (slot.typeBudget === 'principal' && solde185 > TOLERANCE) {
            toast.warning('⚠️ Compte 185 anormalement débiteur sur le budget principal', {
              description: `Solde débiteur ${solde185.toFixed(2)} € sur C/185 du BP — sens inhabituel, vérifier les écritures de liaison (M9-6 §5.3.2).`,
              duration: 10000,
            });
          } else if (slot.typeBudget !== 'principal' && solde185 < -TOLERANCE) {
            toast.warning('⚠️ Compte 185 anormalement créditeur sur le budget annexe', {
              description: `Solde créditeur ${Math.abs(solde185).toFixed(2)} € sur C/185 de l'annexe — sens inhabituel (attendu : débiteur).`,
              duration: 10000,
            });
          }
        }
      }
      else if (slot.type === 'bal1') setBalance1(parserBalance(rows, slot.typeBudget), slot.typeBudget);

      // ── Calcul des taux d'exécution réglementaires (M9-6 / GBCP) ──
      // Affiche immédiatement à l'utilisateur les taux consolidés,
      // sans attendre l'analyse complète. Sécurisé par try/catch :
      // un échec ici ne doit pas faire échouer l'import lui-même.
      try {
        if (slot.type === 'sde' || slot.type === 'sde1') {
          const taux = computeTauxDepensesFromRecords(rows);
          const c = taux.consolide;
          const fmt = (n: number) => `${n.toFixed(1)} %`;
          const exerciceLabel = slot.type === 'sde1' ? `${exerciceTravail - 1} (N-1)` : `${exerciceTravail}`;
          toast.success(`📊 Taux d'exécution dépenses ${exerciceLabel} — ${slot.label}`, {
            description:
              `Engagement : ${fmt(c.tauxEngagement)} · ` +
              `Liquidation : ${fmt(c.tauxLiquidation)} · ` +
              `Mandatement : ${fmt(c.tauxMandatement)} · ` +
              `Disponible : ${fmt(c.tauxDisponibilite)} ` +
              `(OT consolidées : ${c.ot.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €)`,
            duration: 9000,
          });
          // Cohérence OI + DBM = OT
          const sdeRows = buildSdeRowsFromRecords(rows);
          const coh = verifierCoherenceOuvertures(sdeRows);
          if (!coh.ok && coh.ecarts.length > 0) {
            toast.warning(`⚠️ Cohérence OI + DBM ≠ OT (${coh.ecarts.length} ligne(s))`, {
              description: `Premier écart : compte ${coh.ecarts[0].compte} → ${coh.ecarts[0].ecart.toFixed(2)} €.`,
              duration: 10000,
            });
          }
          console.log(`[TAUX-SDE] ${slot.label}`, c, `services:`, taux.parService.length);
          // Diagnostic enrichi pour le panneau « 🔍 Diagnostic d'import »
          const ignored: Array<{ compte: string; raison: string }> = [];
          for (const r of rawRows) {
            const compteRaw = String((r as Record<string, unknown>)['compte'] ?? '').trim();
            const compte = compteRaw.replace(/^C\//i, '').replace(/[^0-9]/g, '');
            if (!compte) ignored.push({ compte: compteRaw, raison: 'compte vide ou non numérique' });
            else if (!compte.startsWith('6')) ignored.push({ compte, raison: 'préfixe ≠ 6 (hors classe dépenses)' });
          }
          setDiagEntries(prev => ({
            ...prev,
            [slot.key]: {
              slotKey: slot.key, slotLabel: slot.label, fileName,
              rowsCount: sdeRows.length, diag,
              mapping: { service: 0, activite: 1, compte: 2, oi: 3, dbm: 4, ot: 5, engagementsComptables: 6, mandats: 7, liquidations: 8 },
              sample: sdeRows.slice(0, 3) as unknown as Record<string, unknown>[],
              ignored,
            },
          }));
        } else if (slot.type === 'sdr' || slot.type === 'sdr1') {
          const taux = computeTauxRecettesFromRecords(rows);
          const c = taux.consolide;
          const fmt = (n: number) => `${n.toFixed(1)} %`;
          const exerciceLabel = slot.type === 'sdr1' ? `${exerciceTravail - 1} (N-1)` : `${exerciceTravail}`;
          toast.success(`📈 Taux d'exécution recettes ${exerciceLabel} — ${slot.label}`, {
            description:
              `Exécution recettes : ${fmt(c.tauxExecutionRecettes)} · ` +
              `Recouvrement : ${fmt(c.tauxRecouvrement)} ` +
              `(PT consolidées : ${c.pt.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € · ` +
              `Reste à recouvrer : ${c.resteARecouvrer.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €)`,
            duration: 9000,
          });
          console.log(`[TAUX-SDR] ${slot.label}`, c, `services:`, taux.parService.length);
          const ignored: Array<{ compte: string; raison: string }> = [];
          for (const r of rawRows) {
            const compteRaw = String((r as Record<string, unknown>)['compte'] ?? '').trim();
            const compte = compteRaw.replace(/^C\//i, '').replace(/[^0-9]/g, '');
            if (!compte) ignored.push({ compte: compteRaw, raison: 'compte vide ou non numérique' });
            else if (!compte.startsWith('7')) ignored.push({ compte, raison: 'préfixe ≠ 7 (hors classe recettes)' });
          }
          setDiagEntries(prev => ({
            ...prev,
            [slot.key]: {
              slotKey: slot.key, slotLabel: slot.label, fileName,
              rowsCount: rows.length, diag,
              mapping: { service: 0, activite: 1, compte: 2, pi: 3, dbm: 4, pt: 5, ordresRecettes: 6, recettesEncaissees: 7, resteARecouvrer: 8 },
              sample: rows.slice(0, 3) as unknown as Record<string, unknown>[],
              ignored,
            },
          }));
        }
      } catch (tauxErr) {
        console.warn('[TAUX] Calcul des taux indisponible :', tauxErr);
      }

      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: 'success', fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [slot.key]: err.message || 'Erreur de parsing' }));
      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: 'error', rejectReason: err.message, fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: FileSlot) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    // ── Excel files (.xlsx, .xls) ──
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: 'array' });
          // Conserve le workbook en mémoire pour autoriser une re-sélection manuelle
          workbooksRef.current[slot.key] = { wb, fileName: file.name };
          const { rows, title, meta, diag } = pickBestWorkbookRows(wb, slot.type);
          processImportedRows(rows, file.name, slot, title, meta, diag);
        } catch (err: any) {
          setErrors(prev => ({ ...prev, [slot.key]: `Erreur Excel : ${err.message || 'Format non reconnu'}` }));
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
      return;
    }

    // ── CSV / TXT files ──
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        // CSV : un seul « onglet », pas de re-sélection possible
        delete workbooksRef.current[slot.key];
        setSheetDiag((prev) => { const n = { ...prev }; delete n[slot.key]; return n; });
        processImportedRows(results.data as Record<string, string>[], file.name, slot);
      },
      error: (err) => { setErrors(prev => ({ ...prev, [slot.key]: err.message })); },
    });
    e.target.value = '';
  }

  /** Re-sélectionne manuellement un onglet pour un slot SDE/SDR/Balance déjà chargé. */
  function reSelectSheet(slot: FileSlot, sheetName: string) {
    const entry = workbooksRef.current[slot.key];
    if (!entry) {
      toast.error('Workbook indisponible — veuillez recharger le fichier.');
      return;
    }
    try {
      const { rows, title, meta, diag } = pickBestWorkbookRows(entry.wb, slot.type, sheetName);
      if (!rows || rows.length === 0) {
        toast.error(`L'onglet « ${sheetName} » est vide ou ne peut pas être lu.`);
        return;
      }
      processImportedRows(rows, entry.fileName, slot, title, meta, diag);
      setReSelectSlot(null);
    } catch (err: any) {
      toast.error(`Erreur lors du changement d'onglet : ${err?.message || err}`);
    }
  }


  const budgetSlots = budgets.map(b => ({ budget: b, slots: slots.filter(s => s.typeBudget === b.type) }));

  const lockTypeIcons: Record<string, string> = { opale: '🏫', exercice: '📅', colonnes: '📊' };

  return (
    <div className="space-y-5">
      {/* Dialog d'alerte triple verrou */}
      <Dialog open={!!lockAlert} onOpenChange={() => setLockAlert(null)}>
        <DialogContent className="border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {lockAlert?.title || 'Import bloqué'}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">{lockAlert?.type ? lockTypeIcons[lockAlert.type] : '🔒'}</span>
                <p className="text-sm font-medium text-foreground">{lockAlert?.message}</p>
              </div>
              {lockAlert?.details && (
                <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">{lockAlert.details}</p>
              )}
              {lockAlert?.slotLabel && (
                <p className="text-xs text-muted-foreground">Emplacement : <strong>{lockAlert.slotLabel}</strong></p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3 mt-3">
                <AlertTriangle className="h-3 w-3" />
                Ce contrôle protège la responsabilité de l\u2019agent comptable.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="destructive" size="sm">Compris</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog « Reprendre sélection d'onglet » ─────────────────── */}
      <Dialog open={!!reSelectSlot} onOpenChange={(o) => !o && setReSelectSlot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              Reprendre la sélection d'onglet
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p className="text-sm text-foreground">
                Emplacement : <strong>{reSelectSlot?.label}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Le parser canonique n'a pas pu identifier l'onglet « Donnees » avec certitude. Choisissez
                manuellement ci-dessous l'onglet qui contient les lignes brutes Op@le (et non un tableau
                croisé dynamique « Situation… »). Les onglets sont triés par score décroissant.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {reSelectSlot && (sheetDiag[reSelectSlot.key]?.candidates ?? [])
              .slice()
              .sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity))
              .map((cand) => {
                const isCurrent = sheetDiag[reSelectSlot!.key]?.sheetName === cand.sheetName;
                return (
                  <button
                    key={cand.sheetName}
                    onClick={() => reSelectSheet(reSelectSlot!, cand.sheetName)}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:border-primary hover:bg-primary/5 ${
                      isCurrent ? 'border-emerald-500 bg-emerald-500/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-sm truncate">{cand.sheetName}</span>
                          {isCurrent && (
                            <Badge className="bg-emerald-600 text-white text-[10px]">actuel</Badge>
                          )}
                          {cand.score != null && (
                            <Badge variant="outline" className="text-[10px] tabular-nums">
                              score : {cand.score}
                            </Badge>
                          )}
                        </div>
                        {cand.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{cand.reason}</p>
                        )}
                      </div>
                      <Sparkles className="h-4 w-4 text-primary opacity-60 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            {reSelectSlot && (!sheetDiag[reSelectSlot.key] || sheetDiag[reSelectSlot.key].candidates.length === 0) && (
              <p className="text-sm text-muted-foreground italic p-4 text-center">
                Aucun candidat évalué — rechargez le fichier Excel d'abord.
              </p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Annuler</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bandeau de sécurité triple verrou */}
      {selectedEstablishment ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Verrou de sécurité adaptatif actif</strong> — Balance : 3 critères ; SDE/SDR : établissement + nature du flux, l'exercice venant du contexte de travail.
              <br />Critères contrôlés :
              <span className="font-semibold"> 1) Code Op@le/UAI</span>,
              <span className="font-semibold"> 2) Exercice comptable ({exerciceTravail}, balance uniquement)</span>,
              <span className="font-semibold"> 3) Nature du flux</span>.
              <br />
              Établissement : <span className="font-mono font-semibold text-primary">{selectedEstablishment.uai}</span>
              {selectedEstablishment.opale_number && (
                <> · Op@le <span className="font-mono font-semibold">{selectedEstablishment.opale_number}</span></>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs text-destructive">
              <strong>Aucun établissement sélectionné</strong> — Sélectionnez un établissement dans le menu principal
              avant d\u2019importer des fichiers. Le verrou de sécurité ne peut pas fonctionner sans référence.
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs">
            Importez les fichiers <strong>CSV ou Excel</strong> extraits depuis <strong>Op@le</strong>. Les fichiers{' '}
            <strong>SDE, SDR et Balance</strong> sont obligatoires. Les fichiers N-1 permettent les comparaisons
            inter-exercices. Pour les budgets annexes (GRETA/CFA), importez leurs fichiers dédiés.
          </div>
        </CardContent>
      </Card>

      {budgetSlots.map(({ budget, slots: bSlots }) => (
        <Card key={budget.type}>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {budget.libelle || budget.type}
              {budget.type !== 'principal' && <Badge className="bg-warning text-warning-foreground">BUDGET ANNEXE</Badge>}
              <span className="ml-auto text-slate-400 text-xs">
                {bSlots.filter(s => fichierCharge[s.key]).length} / {bSlots.length} fichiers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {bSlots.map(slot => (
              <ImportBox key={slot.key} slot={slot} loaded={!!fichierCharge[slot.key]}
                stat={fileStats[slot.key]} error={errors[slot.key]}
                securityBlock={securityBlocks[slot.key]}
                diag={sheetDiag[slot.key]}
                canReSelect={!!workbooksRef.current[slot.key]}
                onReSelect={() => setReSelectSlot(slot)}
                onFile={e => handleFile(e, slot)} />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold">{nbObligCharge} / {obligatoires.length} fichiers obligatoires chargés</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {canAnalyse ? "Prêt à lancer l\u2019analyse" : 'Chargez au minimum SDE, SDR et Balance du budget principal'}
            </div>
            <Progress value={(nbObligCharge / obligatoires.length) * 100} className="mt-2 w-48 h-2" />
          </div>
          <Button onClick={() => { lancerAnalyse(); toast.success('Analyse M9-6 terminée ✅', { description: `Analyse effectuée à ${new Date().toLocaleTimeString('fr-FR')}` }); setActiveTab('vue_ensemble'); }} disabled={!canAnalyse || analysisRunning} size="lg">
            {analysisRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyse en cours…</> : <><Play className="h-4 w-4 mr-2" />Lancer l\u2019analyse M9-6</>}
          </Button>
        </CardContent>
      </Card>

      {/* Debug panel — dev only */}
      <ImportDebug />

      {/* Panneau diagnostic d'import (toujours accessible, repliable) */}
      <DiagnosticImportPanel entries={Object.values(diagEntries)} />
    </div>
  );
}

function ImportBox({ slot, loaded, stat, error, securityBlock, diag, canReSelect, onReSelect, onFile }: {
  slot: FileSlot; loaded: boolean; stat?: { rows: number; name: string }; error?: string;
  securityBlock?: string;
  diag?: SheetPickDiagnostic;
  canReSelect?: boolean;
  onReSelect?: () => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const diagModeStyle: Record<SheetPickDiagnostic['mode'], { cls: string; label: string; icon: React.ReactNode }> = {
    canonique: { cls: 'bg-emerald-600 text-white', label: 'canonique', icon: <CheckCircle2 className="h-3 w-3" /> },
    'balance-headers': { cls: 'bg-emerald-600 text-white', label: 'en-têtes', icon: <CheckCircle2 className="h-3 w-3" /> },
    fallback: { cls: 'bg-warning text-warning-foreground', label: 'fallback', icon: <AlertTriangle className="h-3 w-3" /> },
    forced: { cls: 'bg-primary text-primary-foreground', label: 'manuel', icon: <Sparkles className="h-3 w-3" /> },
  };
  return (
    <label className={`relative block border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all group ${
      securityBlock ? 'border-destructive bg-destructive/5 border-solid' :
      error ? 'border-destructive bg-destructive/5' :
      loaded ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-solid' :
      'border-border bg-muted/30 hover:border-primary hover:bg-primary/5'
    }`} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={onFile} />
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">
          {securityBlock ? <ShieldAlert className="h-6 w-6 text-destructive" /> :
           error ? <XCircle className="h-6 w-6 text-destructive" /> :
           loaded ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> :
           <Upload className="h-6 w-6 text-muted-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm">{slot.label}</span>
            {!slot.obligatoire && <span className="text-xs text-muted-foreground italic">optionnel</span>}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{slot.sublabel}</div>
          {securityBlock && (
            <div className="text-xs text-destructive font-semibold bg-destructive/10 rounded p-2 mb-1">
              {securityBlock}
            </div>
          )}
          {loaded && stat && <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">{stat.rows} lignes — {stat.name}</div>}
          {loaded && diag && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={`${diagModeStyle[diag.mode].cls} text-[10px] font-bold inline-flex items-center gap-1`}>
                  {diagModeStyle[diag.mode].icon}
                  {diagModeStyle[diag.mode].label}
                </Badge>
                <span className="text-[11px] text-muted-foreground truncate" title={diag.sheetName}>
                  Onglet : <span className="font-mono font-semibold text-foreground">« {diag.sheetName} »</span>
                  {diag.score != null && <span className="opacity-70"> · score {diag.score}</span>}
                </span>
              </div>
              {(diag.mode === 'fallback' || diag.candidates.length > 1) && canReSelect && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReSelect?.(); }}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-1 transition-colors ${
                    diag.mode === 'fallback'
                      ? 'bg-warning/15 text-warning hover:bg-warning/25'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                  title="Choisir manuellement un autre onglet"
                >
                  <ListRestart className="h-3 w-3" />
                  Reprendre sélection ({diag.candidates.length} onglet{diag.candidates.length > 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}
          {error && <div className="text-xs text-destructive font-semibold">{error}</div>}
          {!loaded && !error && !securityBlock && <div className="text-xs text-muted-foreground italic">CSV ou Excel — Cliquer pour charger</div>}
          {loaded && !securityBlock && <div className="text-xs text-primary font-semibold mt-1">Cliquer ici pour remplacer ce fichier</div>}
          <div className="mt-2 text-xs text-muted-foreground"><strong>Colonnes :</strong> {slot.colonnes}</div>
        </div>
      </div>
      {(loaded || securityBlock) && (
        <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={e => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }} title="Remplacer">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}
