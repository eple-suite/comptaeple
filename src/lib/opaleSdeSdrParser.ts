// ════════════════════════════════════════════════════════════════════
// Parser canonique SDE / SDR Op@le — Chantier 1 (brief rectorat GPE)
//
// Op@le exporte SDE et SDR avec systématiquement DEUX onglets :
//  • Onglet TCD d'affichage (« Situation… ») — à REJETER
//  • Onglet « Donnees » (en-têtes ligne 3) — données brutes exploitables
//
// Ce module :
//  - répare le !ref corrompu (réutilise repairWorksheetRange)
//  - score chaque onglet selon la grille du brief
//  - retient l'onglet exploitable
//  - calcule les taux d'exécution réglementaires (engagement,
//    liquidation, mandatement, disponibilité, recouvrement)
//
// Sources : MENESR DAF analyse financière EPLE, Op@le pièce 14,
// décret GBCP 2012-1246, instruction M9-6 tome 3.
// ════════════════════════════════════════════════════════════════════
import * as XLSX from 'xlsx';
import { repairWorksheetRange } from './opaleWorkbook';
import { normalizeColumnName } from './opaleImportUtils';

type SheetCell = string | number | boolean | null | undefined;

// ─── Vocabulaire canonique brief ──────────────────────────────────────

/** En-têtes canoniques attendus dans l'onglet « Donnees » SDE */
export const SDE_CANONICAL_HEADERS = [
  'service budgetaire',
  'code activite',
  'compte par nature',
  'ouvertures initiales',
  'dbm',
  'engagements',
  'liquidations',
  'mandats',
] as const;

/** En-têtes canoniques attendus dans l'onglet « Donnees » SDR */
export const SDR_CANONICAL_HEADERS = [
  'service budgetaire',
  'code activite',
  'compte par nature',
  'previsions initiales',
  'dbm',
  'ordres de recettes',
  'recettes encaissees',
] as const;

/** Signatures TCD à pénaliser fortement */
export const TCD_SIGNATURES = [
  'somme de',
  'total general',
  '__empty',
  'unnamed:',
  'etiquettes de lignes',
  'etiquettes de colonnes',
] as const;

/** Synonymes pour mapping des colonnes — Op@le change les libellés selon versions */
const HEADER_ALIASES: Record<string, string[]> = {
  service: ['service budgetaire', 'service', 'sb'],
  activite: ['code activite', 'code d activite', 'activite', 'code'],
  nature_analytique: ['nature analytique', 'nature'],
  domaine: ['domaine fonctionnel', 'domaine'],
  compte: ['compte par nature', 'compte nature', 'compte'],
  libelle: ['libelle compte', 'libelle du compte', 'intitule compte', 'libelle'],
  oi: ['ouvertures initiales', 'ouverture initiale', 'oi', 'budget initial', 'bi'],
  pi: ['previsions initiales', 'prevision initiale', 'pi', 'budget initial', 'bi'],
  dbm: ['dbm', 'dbm de l exercice', 'decisions budgetaires modificatives', 'modifications'],
  ot: ['ouvertures totales', 'ot', 'credits ouverts', 'credits totaux'],
  pt: ['previsions totales', 'pt', 'previsions de recettes totales'],
  engagements_juridiques: ['engagements juridiques', 'ej', 'engagements', 'engages'],
  engagements_comptables: ['engagements comptables', 'ec', 'mandats pris en charge'],
  liquidations: ['liquidations', 'liquide', 'liquides'],
  mandats: ['mandats emis', 'mandats', 'mandates', 'mandatements'],
  disponible: ['disponible', 'restes a engager', 'reste a engager'],
  ordres_recettes: ['ordres de recettes emis', 'ordres de recettes', 'ordres recettes', 'aor', 'titres emis'],
  recettes_notifiees: ['recettes notifiees', 'notifications', 'notifies'],
  recettes_encaissees: ['recettes encaissees', 'encaissements', 'encaisse', 'recouvre'],
  reste_a_recouvrer: ['reste a recouvrer', 'rar', 'reste a emettre'],
};

// ─── Détection ────────────────────────────────────────────────────────

function isTCDRow(row: SheetCell[]): boolean {
  return row.some((cell) => {
    const s = normalizeColumnName(String(cell ?? ''));
    if (!s) return false;
    return TCD_SIGNATURES.some((sig) => s.startsWith(sig) || s.includes(sig));
  });
}

function findHeaderIndex(
  normalized: string[],
  aliasKey: keyof typeof HEADER_ALIASES,
): number {
  const aliases = HEADER_ALIASES[aliasKey];
  for (const alias of aliases) {
    const a = normalizeColumnName(alias);
    const exact = normalized.findIndex((h) => h === a);
    if (exact !== -1) return exact;
  }
  for (const alias of aliases) {
    const a = normalizeColumnName(alias);
    const partial = normalized.findIndex((h) => h.startsWith(a));
    if (partial !== -1) return partial;
  }
  return -1;
}

export type ExecKind = 'sde' | 'sdr';

export interface SdeSdrSelection {
  kind: ExecKind;
  sheetName: string;
  headerRowIndex: number;
  headers: string[];
  matrix: SheetCell[][];
  score: number;
  /** Toutes les feuilles évaluées (debug) */
  scoredSheets: Array<{ sheetName: string; score: number; reason: string }>;
}

/**
 * Sélectionne le meilleur onglet SDE ou SDR d'un workbook Op@le.
 * Retourne null si aucun onglet n'atteint un score suffisant.
 */
export function selectOpaleSdeSdrSheet(
  workbook: XLSX.WorkBook,
  kind: ExecKind,
): SdeSdrSelection | null {
  const canonical = kind === 'sde' ? SDE_CANONICAL_HEADERS : SDR_CANONICAL_HEADERS;
  const scored: Array<{
    sheetName: string;
    score: number;
    headerRowIndex: number;
    headers: string[];
    matrix: SheetCell[][];
    reason: string;
  }> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    repairWorksheetRange(sheet);
    const matrix = XLSX.utils.sheet_to_json<SheetCell[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: true,
    });

    let bestRow = -1;
    let bestMatches = 0;
    let tcdPenalty = 0;

    // Scan jusqu'à 12 lignes d'en-tête possibles (Op@le met parfois ligne 3)
    for (let i = 0; i < Math.min(matrix.length, 12); i += 1) {
      const row = matrix[i] ?? [];
      const norm = row.map((c) => normalizeColumnName(String(c ?? '')));
      const tcd = isTCDRow(row);
      if (tcd) {
        tcdPenalty = -10;
        continue;
      }
      const matches = canonical.filter((c) =>
        norm.some((h) => h === normalizeColumnName(c) || h.startsWith(normalizeColumnName(c))),
      ).length;
      if (matches > bestMatches) {
        bestMatches = matches;
        bestRow = i;
      }
    }

    let score = bestMatches * 5 + tcdPenalty;
    let validRows = 0;

    if (bestRow >= 0) {
      const headers = matrix[bestRow].map((c) => normalizeColumnName(String(c ?? '')));
      const compteIdx = findHeaderIndex(headers, 'compte');
      const serviceIdx = findHeaderIndex(headers, 'service');
      // Compte ligne valide : compte 6XXXXX (SDE) ou 7XXXXX (SDR) + service non vide
      const expectedClass = kind === 'sde' ? '6' : '7';
      if (compteIdx !== -1) {
        for (let i = bestRow + 1; i < matrix.length; i += 1) {
          const r = matrix[i] ?? [];
          const compteRaw = String(r[compteIdx] ?? '').trim().replace(/^C\//i, '');
          const compte = compteRaw.replace(/[^0-9]/g, '');
          const service = serviceIdx !== -1 ? String(r[serviceIdx] ?? '').trim() : '';
          if (compte.length >= 3 && compte.startsWith(expectedClass)) validRows += 1;
          else if (compte.length >= 3 && service && /^[A-Z]{2,4}$/.test(service)) validRows += 1;
        }
      }
      score += validRows;
    }

    // Boost si nom d'onglet contient "donnees"
    const nameNorm = normalizeColumnName(sheetName);
    if (nameNorm.includes('donnee')) score += 5;
    if (nameNorm.includes('situation')) score -= 3; // souvent le TCD

    scored.push({
      sheetName,
      score,
      headerRowIndex: bestRow,
      headers: bestRow >= 0 ? matrix[bestRow].map((c) => String(c ?? '')) : [],
      matrix,
      reason: `${bestMatches}/${canonical.length} en-têtes canoniques, ${validRows} lignes valides${tcdPenalty < 0 ? ', TCD pénalisé' : ''}`,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];
  if (!winner || winner.score < 10 || winner.headerRowIndex < 0) {
    return null;
  }

  return {
    kind,
    sheetName: winner.sheetName,
    headerRowIndex: winner.headerRowIndex,
    headers: winner.headers,
    matrix: winner.matrix,
    score: winner.score,
    scoredSheets: scored.map(({ sheetName, score, reason }) => ({ sheetName, score, reason })),
  };
}

// ─── Parsing ──────────────────────────────────────────────────────────

export interface SdeRow {
  service: string;
  activite: string;
  natureAnalytique: string;
  domaine: string;
  compte: string;
  libelle: string;
  oi: number; // ouvertures initiales
  dbm: number;
  ot: number; // ouvertures totales = oi + dbm (recalculé si absent)
  engagementsJuridiques: number;
  engagementsComptables: number;
  liquidations: number;
  mandats: number;
  disponible: number; // ot - engagements_comptables (recalculé si absent)
}

export interface SdrRow {
  service: string;
  activite: string;
  compte: string;
  libelle: string;
  pi: number;
  dbm: number;
  pt: number;
  ordresRecettes: number;
  recettesNotifiees: number;
  recettesEncaissees: number;
  resteARecouvrer: number;
}

function toNum(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toStr(v: unknown): string {
  return String(v ?? '').trim();
}

/** Parse les lignes de l'onglet SDE retenu */
export function parseSdeRows(selection: SdeSdrSelection): SdeRow[] {
  if (selection.kind !== 'sde') throw new Error('parseSdeRows: selection.kind must be "sde"');
  const headers = selection.matrix[selection.headerRowIndex].map((c) => normalizeColumnName(String(c ?? '')));
  const idx = {
    service: findHeaderIndex(headers, 'service'),
    activite: findHeaderIndex(headers, 'activite'),
    nature: findHeaderIndex(headers, 'nature_analytique'),
    domaine: findHeaderIndex(headers, 'domaine'),
    compte: findHeaderIndex(headers, 'compte'),
    libelle: findHeaderIndex(headers, 'libelle'),
    oi: findHeaderIndex(headers, 'oi'),
    dbm: findHeaderIndex(headers, 'dbm'),
    ot: findHeaderIndex(headers, 'ot'),
    ej: findHeaderIndex(headers, 'engagements_juridiques'),
    ec: findHeaderIndex(headers, 'engagements_comptables'),
    liq: findHeaderIndex(headers, 'liquidations'),
    mandats: findHeaderIndex(headers, 'mandats'),
    dispo: findHeaderIndex(headers, 'disponible'),
  };

  const rows: SdeRow[] = [];
  for (let i = selection.headerRowIndex + 1; i < selection.matrix.length; i += 1) {
    const r = selection.matrix[i] ?? [];
    const compteRaw = toStr(r[idx.compte]).replace(/^C\//i, '');
    const compte = compteRaw.replace(/[^0-9]/g, '');
    if (compte.length < 3) continue;
    if (!compte.startsWith('6')) continue;

    const oi = toNum(r[idx.oi]);
    const dbm = toNum(r[idx.dbm]);
    const otRaw = toNum(r[idx.ot]);
    const ot = otRaw || oi + dbm;
    const ec = toNum(r[idx.ec]);
    const dispoRaw = toNum(r[idx.dispo]);
    const disponible = dispoRaw || ot - ec;

    rows.push({
      service: toStr(r[idx.service]),
      activite: toStr(r[idx.activite]),
      natureAnalytique: toStr(r[idx.nature]),
      domaine: toStr(r[idx.domaine]),
      compte,
      libelle: toStr(r[idx.libelle]),
      oi,
      dbm,
      ot,
      engagementsJuridiques: toNum(r[idx.ej]),
      engagementsComptables: ec,
      liquidations: toNum(r[idx.liq]),
      mandats: toNum(r[idx.mandats]),
      disponible,
    });
  }
  return rows;
}

/** Parse les lignes de l'onglet SDR retenu */
export function parseSdrRows(selection: SdeSdrSelection): SdrRow[] {
  if (selection.kind !== 'sdr') throw new Error('parseSdrRows: selection.kind must be "sdr"');
  const headers = selection.matrix[selection.headerRowIndex].map((c) => normalizeColumnName(String(c ?? '')));
  const idx = {
    service: findHeaderIndex(headers, 'service'),
    activite: findHeaderIndex(headers, 'activite'),
    compte: findHeaderIndex(headers, 'compte'),
    libelle: findHeaderIndex(headers, 'libelle'),
    pi: findHeaderIndex(headers, 'pi'),
    dbm: findHeaderIndex(headers, 'dbm'),
    pt: findHeaderIndex(headers, 'pt'),
    ordres: findHeaderIndex(headers, 'ordres_recettes'),
    notif: findHeaderIndex(headers, 'recettes_notifiees'),
    enc: findHeaderIndex(headers, 'recettes_encaissees'),
    rar: findHeaderIndex(headers, 'reste_a_recouvrer'),
  };

  const rows: SdrRow[] = [];
  for (let i = selection.headerRowIndex + 1; i < selection.matrix.length; i += 1) {
    const r = selection.matrix[i] ?? [];
    const compteRaw = toStr(r[idx.compte]).replace(/^C\//i, '');
    const compte = compteRaw.replace(/[^0-9]/g, '');
    if (compte.length < 3) continue;
    if (!compte.startsWith('7')) continue;

    const pi = toNum(r[idx.pi]);
    const dbm = toNum(r[idx.dbm]);
    const ptRaw = toNum(r[idx.pt]);
    const pt = ptRaw || pi + dbm;
    const ordres = toNum(r[idx.ordres]);
    const enc = toNum(r[idx.enc]);
    const rarRaw = toNum(r[idx.rar]);
    const resteARecouvrer = rarRaw || ordres - enc;

    rows.push({
      service: toStr(r[idx.service]),
      activite: toStr(r[idx.activite]),
      compte,
      libelle: toStr(r[idx.libelle]),
      pi,
      dbm,
      pt,
      ordresRecettes: ordres,
      recettesNotifiees: toNum(r[idx.notif]),
      recettesEncaissees: enc,
      resteARecouvrer,
    });
  }
  return rows;
}

// ─── Calcul des taux d'exécution ──────────────────────────────────────

export interface TauxExecutionDepenses {
  scope: string; // 'consolide' | 'service:AP' | etc.
  ot: number;
  engagementsComptables: number;
  liquidations: number;
  mandats: number;
  disponible: number;
  tauxEngagement: number; // % engagements / ot
  tauxLiquidation: number; // % liquidations / ot
  tauxMandatement: number; // % mandats / ot
  tauxDisponibilite: number; // % disponible / ot
}

export interface TauxExecutionRecettes {
  scope: string;
  pt: number;
  ordresRecettes: number;
  recettesEncaissees: number;
  resteARecouvrer: number;
  tauxExecutionRecettes: number; // % ordres / pt
  tauxRecouvrement: number; // % encaisse / ordres
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return (num / den) * 100;
}

function aggregateSde(rows: SdeRow[], scope: string): TauxExecutionDepenses {
  const a = rows.reduce(
    (acc, r) => ({
      ot: acc.ot + r.ot,
      ec: acc.ec + r.engagementsComptables,
      liq: acc.liq + r.liquidations,
      mandats: acc.mandats + r.mandats,
      dispo: acc.dispo + r.disponible,
    }),
    { ot: 0, ec: 0, liq: 0, mandats: 0, dispo: 0 },
  );
  return {
    scope,
    ot: a.ot,
    engagementsComptables: a.ec,
    liquidations: a.liq,
    mandats: a.mandats,
    disponible: a.dispo,
    tauxEngagement: pct(a.ec, a.ot),
    tauxLiquidation: pct(a.liq, a.ot),
    tauxMandatement: pct(a.mandats, a.ot),
    tauxDisponibilite: pct(a.dispo, a.ot),
  };
}

function aggregateSdr(rows: SdrRow[], scope: string): TauxExecutionRecettes {
  const a = rows.reduce(
    (acc, r) => ({
      pt: acc.pt + r.pt,
      ordres: acc.ordres + r.ordresRecettes,
      enc: acc.enc + r.recettesEncaissees,
      rar: acc.rar + r.resteARecouvrer,
    }),
    { pt: 0, ordres: 0, enc: 0, rar: 0 },
  );
  return {
    scope,
    pt: a.pt,
    ordresRecettes: a.ordres,
    recettesEncaissees: a.enc,
    resteARecouvrer: a.rar,
    tauxExecutionRecettes: pct(a.ordres, a.pt),
    tauxRecouvrement: pct(a.enc, a.ordres),
  };
}

/** Calcule les taux d'exécution dépenses : consolidé + par service + par domaine */
export function calculerTauxDepenses(rows: SdeRow[]): {
  consolide: TauxExecutionDepenses;
  parService: TauxExecutionDepenses[];
  parDomaine: TauxExecutionDepenses[];
  parActivite: TauxExecutionDepenses[];
} {
  const services = Array.from(new Set(rows.map((r) => r.service).filter(Boolean)));
  const domaines = Array.from(new Set(rows.map((r) => r.domaine).filter(Boolean)));
  const activites = Array.from(new Set(rows.map((r) => r.activite).filter(Boolean)));

  return {
    consolide: aggregateSde(rows, 'consolide'),
    parService: services.map((s) => aggregateSde(rows.filter((r) => r.service === s), `service:${s}`)),
    parDomaine: domaines.map((d) => aggregateSde(rows.filter((r) => r.domaine === d), `domaine:${d}`)),
    parActivite: activites.map((a) => aggregateSde(rows.filter((r) => r.activite === a), `activite:${a}`)),
  };
}

/** Calcule les taux d'exécution recettes : consolidé + par service + par activité */
export function calculerTauxRecettes(rows: SdrRow[]): {
  consolide: TauxExecutionRecettes;
  parService: TauxExecutionRecettes[];
  parActivite: TauxExecutionRecettes[];
} {
  const services = Array.from(new Set(rows.map((r) => r.service).filter(Boolean)));
  const activites = Array.from(new Set(rows.map((r) => r.activite).filter(Boolean)));

  return {
    consolide: aggregateSdr(rows, 'consolide'),
    parService: services.map((s) => aggregateSdr(rows.filter((r) => r.service === s), `service:${s}`)),
    parActivite: activites.map((a) => aggregateSdr(rows.filter((r) => r.activite === a), `activite:${a}`)),
  };
}

/** Vérifie la cohérence OI + DBM = OT (tolérance 0,01 €) */
export function verifierCoherenceOuvertures(rows: SdeRow[]): { ok: boolean; ecarts: Array<{ compte: string; ecart: number }> } {
  const ecarts: Array<{ compte: string; ecart: number }> = [];
  for (const r of rows) {
    const ecart = r.ot - (r.oi + r.dbm);
    if (Math.abs(ecart) > 0.01) ecarts.push({ compte: r.compte, ecart });
  }
  return { ok: ecarts.length === 0, ecarts };
}