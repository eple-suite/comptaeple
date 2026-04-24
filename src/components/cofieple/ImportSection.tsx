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
import { Info, Upload, Play, Loader2, CheckCircle2, XCircle, RefreshCw, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
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

/** Extrait l'exercice comptable depuis les données CSV.
 *  Priorité : champ exercice > période "du …/YYYY au …/YYYY" > année isolée.
 *  On ignore les dates d'édition (ex. "Edité au : 04/03/2026"). */
function extractExercice(rows: Record<string, string>[], sheetMeta?: string | null): number | null {
  const isValidYear = (year: number | null | undefined): year is number => !!year && year >= 2000 && year <= 2099;

  const extractYearFromValue = (value: string): number | null => {
    const v = String(value || '').trim();
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
  };

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
    const y = extractYearFromValue(String(val || ''));
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

  // 4) Fallback: end-of-exercise dates, then generic year (excluding edition/print metadata)
  for (const [key, val] of entries) {
    const k = normalizeColumnName(key);
    if (k.includes('fin') && k.includes('exercice') && !isEditionOrPrintContext(k)) {
      const y = extractYearFromValue(String(val || ''));
      if (isValidYear(y)) return y;
    }
  }

  for (const [key, val] of entries) {
    if (isEditionOrPrintContext(key) || isEditionOrPrintContext(String(val || ''))) continue;
    const m = String(val || '').match(/\b(20\d{2})\b/);
    if (!m) continue;
    const y = parseInt(m[1], 10);
    if (isValidYear(y)) return y;
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

function pickBestWorkbookRows(wb: XLSX.WorkBook, slotType: string): { rows: Record<string, string>[]; title: string | null; meta: string } {
  const expectedType = slotType.replace('1', '');
  const title = extractWorkbookTitle(wb);
  const meta = extractWorkbookMeta(wb);

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
      return { rows: normalizeRowsForOpaleImport(balanceSheet.records), title, meta };
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
        return { rows: normalizeRowsForOpaleImport(dataRows), title: title || selection.sheetName, meta };
      }
    }
    // sinon → fallback sur la logique de scoring historique ci-dessous
  }

  let bestRows: Record<string, string>[] = [];
  let bestScore = -Infinity;

  const getPreferredSheetScore = (sheetName: string, expected: string): number => {
    const normalized = normalizeColumnName(sheetName);
    let score = 0;

    if ((expected === 'sde' || expected === 'sdr') && normalized.includes('ecbu')) score += 30;
    if (expected === 'bal' && normalized.includes('donnee')) score += 30;
    if (expected === 'bal' && normalized.includes('balance')) score -= 10;

    return score;
  };

  for (const candidate of getWorkbookSheetCandidates(wb)) {
    const { sheetName } = candidate;
    const rows = normalizeRowsForOpaleImport(candidate.records);
    if (!rows.length) continue;
    const headers = Object.keys(rows[0] || {});
    const detected = detectDocumentType(headers, title);

    const preferredSheetBoost = getPreferredSheetScore(sheetName, expectedType);

    // Fast path: if we hit the canonical Op@le summary sheet for this slot and
    // the detected structure matches, select it immediately.
    if (preferredSheetBoost >= 30 && detected === expectedType) {
      return { rows, title, meta };
    }

    let score = 0;
    score += Math.min(rows.length, 200) / 40;
    if (detected) score += 6;
    if (detected === expectedType) score += 20;
    score += preferredSheetBoost;
    if (headers.some((h) => normalizeColumnName(h).startsWith('montant colonne'))) score += 6;

    if (score > bestScore) {
      bestScore = score;
      bestRows = rows;
    }
  }

  return { rows: bestRows, title, meta };
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
): TripleLockResult {
  // ── VERROU 1 : Code Op@le / UAI ──
  const { uai: fileUai, opale: fileOpale } = extractCsvIdentifier(rows);
  if (fileUai && selectedUai && fileUai !== selectedUai.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Erreur de concordance — Établissement',
      message: `Le fichier importé appartient à l'établissement UAI ${fileUai}, mais l'établissement sélectionné est ${selectedUai}.`,
      details: 'Veuillez vérifier que vous avez sélectionné le bon établissement ou que votre export Op@le correspond.',
    };
  }
  if (fileOpale && selectedOpale && fileOpale !== selectedOpale.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Erreur de concordance — Identifiant Op@le',
      message: `Le fichier contient l'identifiant Op@le ${fileOpale}, mais l'établissement sélectionné utilise ${selectedOpale}.`,
      details: "Veuillez vérifier votre export Op@le ou l\u2019identifiant technique de l\u2019établissement.",
    };
  }

  // ── VERROU 2 : Exercice comptable ──
  const fileExercice = extractExercice(rows, sheetMeta);
  if (fileExercice && exerciceTravail && fileExercice !== exerciceTravail) {
    // Allow N-1 files in N-1 slots
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

  function processImportedRows(rawRows: Record<string, string>[], fileName: string, slot: FileSlot, sheetTitle?: string | null, sheetMeta?: string | null) {
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
    const csvExercice = extractExercice(rows, sheetMeta);
    const csvDocType = detectDocumentType(headers, sheetTitle);

    // ── TRIPLE VERROU DE SÉCURITÉ ──
    if (selectedEstablishment) {
      const lock = tripleLockCheck(rows, headers, slot.type, selectedEstablishment.uai, selectedEstablishment.opale_number || '', exerciceTravail, sheetTitle, sheetMeta);
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
          const { rows, title, meta } = pickBestWorkbookRows(wb, slot.type);
          processImportedRows(rows, file.name, slot, title, meta);
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
        processImportedRows(results.data as Record<string, string>[], file.name, slot);
      },
      error: (err) => { setErrors(prev => ({ ...prev, [slot.key]: err.message })); },
    });
    e.target.value = '';
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

      {/* Bandeau de sécurité triple verrou */}
      {selectedEstablishment ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Triple verrou de sécurité actif</strong> — Chaque fichier sera vérifié sur 3 critères :
              <span className="font-semibold"> 1) Code Op@le/UAI</span>,
              <span className="font-semibold"> 2) Exercice comptable ({exerciceTravail})</span>,
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
    </div>
  );
}

function ImportBox({ slot, loaded, stat, error, securityBlock, onFile }: {
  slot: FileSlot; loaded: boolean; stat?: { rows: number; name: string }; error?: string;
  securityBlock?: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
