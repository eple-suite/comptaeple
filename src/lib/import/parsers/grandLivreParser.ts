// ═══════════════════════════════════════════════════════════════
// Parser GRAND LIVRE — écritures par compte (Op@le ou autre)
// Volumineux : retourne lignes + agrégats par compte
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { selectBestSheet } from '../sheetUtils';
import { parseFrenchNumber, parseFrenchDate } from '../textUtils';

export interface EcritureGrandLivre {
  date: Date | null;
  journal: string;
  piece: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  contrepartie: string;
}

export interface GrandLivreResult {
  sheetName: string;
  ecritures: EcritureGrandLivre[];
  totalDebit: number;
  totalCredit: number;
  comptes: { compte: string; debit: number; credit: number; solde: number }[];
}

const REQUIRED = ['date', 'compte', 'libelle', 'debit', 'credit'];

export function parseGrandLivre(workbook: XLSX.WorkBook): GrandLivreResult | null {
  const best = selectBestSheet(workbook, {
    requiredHeaders: REQUIRED,
    minMatches: 4,
  });
  if (!best) return null;

  const headerMap = new Map<string, number>();
  best.headers.forEach((h, i) => {
    const norm = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (norm.startsWith('date')) headerMap.set('date', i);
    else if (norm === 'journal' || norm.startsWith('jrn')) headerMap.set('journal', i);
    else if (norm.startsWith('piece') || norm === 'pce' || norm.startsWith('n° pi')) headerMap.set('piece', i);
    else if (norm === 'compte' || norm.startsWith('compte general')) headerMap.set('compte', i);
    else if (norm.startsWith('libelle')) headerMap.set('libelle', i);
    else if (norm === 'debit' || norm.startsWith('debit')) headerMap.set('debit', i);
    else if (norm === 'credit' || norm.startsWith('credit')) headerMap.set('credit', i);
    else if (norm.startsWith('contrepartie')) headerMap.set('contrepartie', i);
  });

  const ecritures: EcritureGrandLivre[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  const comptesAgg = new Map<string, { d: number; c: number }>();

  for (let i = best.headerRowIndex + 1; i < best.matrix.length; i += 1) {
    const row = best.matrix[i];
    if (!row) continue;
    const compte = String(row[headerMap.get('compte') ?? -1] ?? '').trim();
    if (!/^[0-9A-Z]{3,15}$/i.test(compte)) continue;

    const debit = parseFrenchNumber(row[headerMap.get('debit') ?? -1]) || 0;
    const credit = parseFrenchNumber(row[headerMap.get('credit') ?? -1]) || 0;

    ecritures.push({
      date: parseFrenchDate(row[headerMap.get('date') ?? -1]),
      journal: String(row[headerMap.get('journal') ?? -1] ?? '').trim(),
      piece: String(row[headerMap.get('piece') ?? -1] ?? '').trim(),
      compte,
      libelle: String(row[headerMap.get('libelle') ?? -1] ?? '').trim(),
      debit,
      credit,
      contrepartie: String(row[headerMap.get('contrepartie') ?? -1] ?? '').trim(),
    });

    totalDebit += debit;
    totalCredit += credit;
    const agg = comptesAgg.get(compte) ?? { d: 0, c: 0 };
    agg.d += debit;
    agg.c += credit;
    comptesAgg.set(compte, agg);
  }

  const comptes = Array.from(comptesAgg.entries())
    .map(([compte, { d, c }]) => ({ compte, debit: d, credit: c, solde: d - c }))
    .sort((a, b) => a.compte.localeCompare(b.compte));

  return {
    sheetName: best.sheetName,
    ecritures,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    comptes,
  };
}