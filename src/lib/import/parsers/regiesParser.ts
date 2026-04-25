// ═══════════════════════════════════════════════════════════════
// Parser ÉTAT DES RÉGIES — soldes, encaissements, mandats, écarts
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { selectBestSheet } from '../sheetUtils';
import { parseFrenchNumber } from '../textUtils';

export interface RegieLigne {
  regie: string;
  solde: number;
  encaissements: number;
  mandats: number;
  ecart: number;
}

export interface RegiesResult {
  sheetName: string;
  regies: RegieLigne[];
  totalSoldes: number;
}

export function parseRegies(workbook: XLSX.WorkBook): RegiesResult | null {
  const best = selectBestSheet(workbook, {
    requiredHeaders: ['regie', 'solde'],
    minMatches: 1,
  });
  if (!best) return null;

  const idx = (rx: RegExp) => best.headers.findIndex((h) => rx.test(h));
  const iRegie = idx(/regie|regisseur/i);
  const iSolde = idx(/solde/i);
  const iEnc = idx(/encaiss/i);
  const iMand = idx(/mandat/i);

  const regies: RegieLigne[] = [];
  let totalSoldes = 0;

  for (let i = best.headerRowIndex + 1; i < best.matrix.length; i += 1) {
    const row = best.matrix[i];
    if (!row) continue;
    const nom = String(row[iRegie] ?? '').trim();
    if (!nom) continue;
    const solde = parseFrenchNumber(row[iSolde]) || 0;
    const enc = parseFrenchNumber(row[iEnc]) || 0;
    const mand = parseFrenchNumber(row[iMand]) || 0;
    regies.push({ regie: nom, solde, encaissements: enc, mandats: mand, ecart: enc - mand });
    totalSoldes += solde;
  }

  return { sheetName: best.sheetName, regies, totalSoldes: Math.round(totalSoldes * 100) / 100 };
}