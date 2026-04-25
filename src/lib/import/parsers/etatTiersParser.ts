// ═══════════════════════════════════════════════════════════════
// Parser ÉTAT DES TIERS — soldes par tiers (familles, fournisseurs)
// Comptes 401, 411, 416, 419, 466
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { selectBestSheet } from '../sheetUtils';
import { parseFrenchNumber } from '../textUtils';

export interface SoldeTiers {
  codeTiers: string;
  libelle: string;
  compte: string;
  solde: number;
}

export interface EtatTiersResult {
  sheetName: string;
  lignes: SoldeTiers[];
  totalFamilles: number;   // C/411X
  totalFournisseurs: number; // C/401
  totalAutres: number;
}

const REQUIRED = ['code tiers', 'compte', 'solde'];

export function parseEtatTiers(workbook: XLSX.WorkBook): EtatTiersResult | null {
  const best = selectBestSheet(workbook, {
    requiredHeaders: REQUIRED,
    minMatches: 2,
  });
  if (!best) return null;

  const idx = (token: string): number => {
    return best.headers.findIndex((h) => {
      const n = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return n.includes(token);
    });
  };

  const iCode = idx('code tiers') >= 0 ? idx('code tiers') : idx('tiers');
  const iLib = idx('libelle') >= 0 ? idx('libelle') : idx('nom');
  const iCpt = idx('compte');
  const iSolde = idx('solde');

  const lignes: SoldeTiers[] = [];
  let totalFamilles = 0;
  let totalFournisseurs = 0;
  let totalAutres = 0;

  for (let i = best.headerRowIndex + 1; i < best.matrix.length; i += 1) {
    const row = best.matrix[i];
    if (!row) continue;
    const compte = String(row[iCpt] ?? '').trim();
    if (!/^4[0-9]{2,5}$/.test(compte)) continue;

    const solde = parseFrenchNumber(row[iSolde]) || 0;
    const ligne: SoldeTiers = {
      codeTiers: String(row[iCode] ?? '').trim(),
      libelle: String(row[iLib] ?? '').trim(),
      compte,
      solde,
    };
    lignes.push(ligne);

    if (compte.startsWith('411')) totalFamilles += solde;
    else if (compte.startsWith('401')) totalFournisseurs += solde;
    else totalAutres += solde;
  }

  return {
    sheetName: best.sheetName,
    lignes,
    totalFamilles: Math.round(totalFamilles * 100) / 100,
    totalFournisseurs: Math.round(totalFournisseurs * 100) / 100,
    totalAutres: Math.round(totalAutres * 100) / 100,
  };
}