// ═══════════════════════════════════════════════════════════════
// Parser SIECLE — Liste élèves (CSV ou XLSX)
// RGPD : données nominatives mineures + sensibles
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { selectBestSheet } from '../sheetUtils';
import { parseFrenchDate, isValidINE } from '../textUtils';
import { parseCsvText } from '../../opaleWorkbook';

export interface EleveSiecle {
  ine: string;
  numeroInterne: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: Date | null;
  classe: string;
  mef: string;
  regime: string;
  boursier: boolean;
  echelon: string;
  responsable1Nom: string;
  responsable1Tel: string;
}

export interface SiecleParseResult {
  source: 'csv' | 'xlsx';
  eleves: EleveSiecle[];
  ineValides: number;
  ineInvalides: number;
  doublons: number;
}

const COLUMN_HINTS: Record<keyof EleveSiecle, RegExp[]> = {
  ine: [/^ine$/i, /identifiant.*national/i, /^ina$/i],
  numeroInterne: [/numero.*interne/i, /n.*interne/i, /id.*eleve/i],
  nom: [/^nom$/i, /^nom de famille/i],
  prenom: [/^prenom/i, /^pr.nom/i],
  sexe: [/^sexe$/i, /civilit/i],
  dateNaissance: [/date.*naissance/i, /naiss/i],
  classe: [/^classe$/i, /division/i],
  mef: [/^mef$/i, /module.*formation/i],
  regime: [/^r.gime$/i, /regime/i],
  boursier: [/boursier/i],
  echelon: [/.chelon/i],
  responsable1Nom: [/responsable.*1.*nom/i, /resp.*1/i],
  responsable1Tel: [/responsable.*1.*tel/i, /tel.*resp/i],
};

function findColIndex(headers: string[], hints: RegExp[]): number {
  return headers.findIndex((h) => hints.some((rx) => rx.test(h)));
}

function buildEleve(row: Record<string, string>, headers: string[]): EleveSiecle | null {
  const get = (key: keyof EleveSiecle): string => {
    const idx = findColIndex(headers, COLUMN_HINTS[key]);
    if (idx < 0) return '';
    const headerName = headers[idx];
    return String(row[headerName] ?? '').trim();
  };

  const ine = get('ine').toUpperCase();
  const nom = get('nom');
  if (!ine && !nom) return null;

  const boursierStr = get('boursier').toLowerCase();
  return {
    ine,
    numeroInterne: get('numeroInterne'),
    nom,
    prenom: get('prenom'),
    sexe: get('sexe'),
    dateNaissance: parseFrenchDate(get('dateNaissance')),
    classe: get('classe'),
    mef: get('mef'),
    regime: get('regime'),
    boursier: ['oui', 'true', '1', 'o', 'b'].includes(boursierStr),
    echelon: get('echelon'),
    responsable1Nom: get('responsable1Nom'),
    responsable1Tel: get('responsable1Tel'),
  };
}

export function parseSiecleCsv(csvText: string): SiecleParseResult {
  const records = parseCsvText(csvText);
  const headers = records[0] ? Object.keys(records[0]) : [];

  const eleves: EleveSiecle[] = [];
  const seenIne = new Set<string>();
  let ineValides = 0;
  let ineInvalides = 0;
  let doublons = 0;

  for (const row of records) {
    const eleve = buildEleve(row, headers);
    if (!eleve) continue;
    if (eleve.ine) {
      if (isValidINE(eleve.ine)) ineValides += 1;
      else ineInvalides += 1;
      if (seenIne.has(eleve.ine)) {
        doublons += 1;
        continue;
      }
      seenIne.add(eleve.ine);
    }
    eleves.push(eleve);
  }

  return { source: 'csv', eleves, ineValides, ineInvalides, doublons };
}

export function parseSiecleWorkbook(workbook: XLSX.WorkBook): SiecleParseResult {
  const best = selectBestSheet(workbook, {
    requiredHeaders: ['ine', 'nom', 'classe'],
    minMatches: 2,
  });
  if (!best) return { source: 'xlsx', eleves: [], ineValides: 0, ineInvalides: 0, doublons: 0 };

  const headers = best.headers;
  const eleves: EleveSiecle[] = [];
  const seen = new Set<string>();
  let ineValides = 0;
  let ineInvalides = 0;
  let doublons = 0;

  for (let i = best.headerRowIndex + 1; i < best.matrix.length; i += 1) {
    const row = best.matrix[i];
    if (!row) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = String(row[idx] ?? ''); });
    const eleve = buildEleve(obj, headers);
    if (!eleve) continue;
    if (eleve.ine) {
      if (isValidINE(eleve.ine)) ineValides += 1;
      else ineInvalides += 1;
      if (seen.has(eleve.ine)) {
        doublons += 1;
        continue;
      }
      seen.add(eleve.ine);
    }
    eleves.push(eleve);
  }

  return { source: 'xlsx', eleves, ineValides, ineInvalides, doublons };
}

/**
 * Mention RGPD obligatoire affichée avant import SIECLE.
 * Référence : art. 6.1.e RGPD (mission de service public).
 */
export const RGPD_SIECLE_MENTION = {
  finalite:
    "Gestion administrative des élèves dans le cadre des activités de l'EPLE (suivi de scolarité, encaissements de demi-pension, créances familles, bourses).",
  baseLegale: "Mission de service public — art. 6.1.e RGPD",
  conservation:
    "Année scolaire en cours + 1 an après sortie de l'EPLE pour la gestion financière (encaissements, créances, ANV).",
  destinataires:
    "Agents comptables, gestionnaires et chefs d'établissement habilités. Aucun transfert hors UE.",
  droits:
    "Droits d'accès, rectification, opposition à exercer auprès du chef d'établissement responsable du traitement.",
};