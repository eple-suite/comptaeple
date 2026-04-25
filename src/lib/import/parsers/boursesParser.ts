// ═══════════════════════════════════════════════════════════════
// Parser ÉTAT DES BOURSES (depuis SIECLE / GFE)
// Pour rapprochement C/443110
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { selectBestSheet } from '../sheetUtils';
import { parseFrenchNumber, isValidINE } from '../textUtils';

export interface LigneBourse {
  ine: string;
  eleve: string;
  montantTrimestriel: number;
  statut: string;
}

export interface BoursesResult {
  sheetName: string;
  lignes: LigneBourse[];
  totalDu: number;
  ineValides: number;
}

export function parseBourses(workbook: XLSX.WorkBook): BoursesResult | null {
  const best = selectBestSheet(workbook, {
    requiredHeaders: ['ine', 'montant'],
    minMatches: 1,
  });
  if (!best) return null;

  const idx = (rx: RegExp) => best.headers.findIndex((h) => rx.test(h));
  const iIne = idx(/^ine$/i);
  const iEleve = idx(/eleve|nom/i);
  const iMontant = idx(/montant.*trim|montant/i);
  const iStatut = idx(/statut|etat/i);

  const lignes: LigneBourse[] = [];
  let totalDu = 0;
  let ineValides = 0;

  for (let i = best.headerRowIndex + 1; i < best.matrix.length; i += 1) {
    const row = best.matrix[i];
    if (!row) continue;
    const ine = String(row[iIne] ?? '').trim().toUpperCase();
    const montant = parseFrenchNumber(row[iMontant]) || 0;
    if (!ine && !montant) continue;

    if (ine && isValidINE(ine)) ineValides += 1;
    lignes.push({
      ine,
      eleve: String(row[iEleve] ?? '').trim(),
      montantTrimestriel: montant,
      statut: String(row[iStatut] ?? '').trim(),
    });
    totalDu += montant;
  }

  return {
    sheetName: best.sheetName,
    lignes,
    totalDu: Math.round(totalDu * 100) / 100,
    ineValides,
  };
}