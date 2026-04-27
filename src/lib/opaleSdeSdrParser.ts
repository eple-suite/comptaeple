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

// ─── Spécification chirurgicale Op@le (export GPE réel) ───────────────
// Découverte forensique : l'onglet "Donnees" porte les VRAIES données
// avec un mapping POSITIONNEL fixe quel que soit le libellé d'en-tête
// (Op@le nomme génériquement « Montant colonne 1..5 » en ligne 2).
//
// Indices 0-based des colonnes utiles (vérifiés sur SDE/SDR Op@le 2025) :
const OPALE_POS = {
  CODE_OPALE: 0,    // A  — Code Op@le établissement (P04481)
  SERVICE: 10,      // K  — Service budgétaire (AP/VE/ALO/SRH/OPC)
  LIBELLE_SVC: 11,  // L
  DOMAINE: 13,      // N
  ACTIVITE: 16,     // Q
  COMPTE: 37,       // AL — Compte par nature (6XXXXX/7XXXXX)
  LIBELLE_CPT: 38,  // AM
  MONTANT_1: 63,    // BL — Budget / Prévision
  MONTANT_2: 64,    // BM — Engagé
  MONTANT_3: 65,    // BN — Réalisé / Ordres de recettes
  MONTANT_4: 66,    // BO — En cours / Recettes notifiées
  MONTANT_5: 67,    // BP — Disponible / +-values
  UAI: 77,          // BZ — UAI éducation nationale
  // L3, colonnes CD-CH : libellés humains des 5 montants
  HUMAN_LABELS_ROW: 2, // ligne d'index 2 (3e ligne, 0-based)
  HUMAN_LABEL_BUDGET: 81,   // CD
  HUMAN_LABEL_ENGAGE: 82,   // CE
  HUMAN_LABEL_REALISE: 83,  // CF
  HUMAN_LABEL_ENCOURS: 84,  // CG
  HUMAN_LABEL_DISPO: 85,    // CH
} as const;

/** Détecte si un onglet présente la signature positionnelle Op@le brute :
 *  ligne 2 (index 1) contient « Montant colonne 1..5 » aux indices BL-BP. */
function hasOpalePositionalSignature(matrix: SheetCell[][]): boolean {
  if (matrix.length < 4) return false;
  const headerRow = matrix[1] ?? [];
  let hits = 0;
  for (let col = OPALE_POS.MONTANT_1; col <= OPALE_POS.MONTANT_5; col += 1) {
    const cell = normalizeColumnName(String(headerRow[col] ?? ''));
    if (cell.startsWith('montant colonne')) hits += 1;
  }
  return hits >= 3;
}

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
  const expectedClass = kind === 'sde' ? '6' : '7';

  type Scored = {
    sheetName: string;
    score: number;
    headerRowIndex: number;
    headers: string[];
    matrix: SheetCell[][];
    positional: boolean;
    reason: string;
  };
  const scored: Scored[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    repairWorksheetRange(sheet);
    const matrix = XLSX.utils.sheet_to_json<SheetCell[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: true,
    });

    const nameNorm = normalizeColumnName(sheetName);
    let score = 0;
    const reasons: string[] = [];

    // ── Bonus : nom d'onglet « Donnees » / « Data » ──────────────────
    if (/^(donnee|donnees|données|data|ecbu detail)$/i.test(nameNorm) ||
        nameNorm === 'donnees' || nameNorm === 'donnee' || nameNorm === 'data') {
      score += 100;
      reasons.push('+100 nom=Donnees');
    }

    // ── Pénalité : noms d'onglet TCD récap ───────────────────────────
    if (/^(ecbu|balance|tcd|tableau croise|synthese|recapitulatif)$/i.test(nameNorm)) {
      score -= 200;
      reasons.push('-200 nom=TCD');
    }

    // ── Bonus volumétrie ─────────────────────────────────────────────
    const nonEmptyRows = matrix.filter((r) => (r ?? []).some((c) => c != null && String(c).trim() !== '')).length;
    const maxCols = matrix.reduce((m, r) => Math.max(m, (r ?? []).length), 0);
    if (nonEmptyRows > 50) { score += 50; reasons.push(`+50 (${nonEmptyRows} lignes)`); }
    if (maxCols > 30) { score += 30; reasons.push(`+30 (${maxCols} colonnes)`); }
    if (nonEmptyRows <= 10) { score -= 5; reasons.push(`-5 (≤10 lignes)`); }

    // ── Bonus lignes ≥5 valeurs numériques non nulles ────────────────
    let richDataRows = 0;
    for (const r of matrix) {
      let n = 0;
      for (const c of r ?? []) {
        if (typeof c === 'number' && c !== 0) n += 1;
        else if (typeof c === 'string' && /^-?[\d\s\u00A0]*[.,]?\d+$/.test(c.trim()) && parseFloat(c.replace(',', '.')) !== 0) n += 1;
      }
      if (n >= 5) richDataRows += 1;
    }
    score += richDataRows;
    if (richDataRows) reasons.push(`+${richDataRows} (lignes riches)`);

    // ── Pénalités TCD : « Somme de Montant », « Total général », « (vide) » ──
    let pSomme = 0, pTotal = 0, pVide = 0;
    for (const r of matrix.slice(0, 30)) {
      for (const c of r ?? []) {
        const s = normalizeColumnName(String(c ?? ''));
        if (s.startsWith('somme de montant') || s.startsWith('somme de ')) pSomme += 1;
        else if (s === 'total general') pTotal += 1;
        else if (s === '(vide)' || s === 'vide') pVide += 1;
      }
    }
    score -= pSomme * 50;
    score -= pTotal * 50;
    score -= pVide * 30;
    if (pSomme) reasons.push(`-${pSomme * 50} (Somme de…)`);
    if (pTotal) reasons.push(`-${pTotal * 50} (Total général)`);
    if (pVide) reasons.push(`-${pVide * 30} ((vide))`);

    // ── Détection signature positionnelle Op@le (BL-BP « Montant colonne ») ──
    const positional = hasOpalePositionalSignature(matrix);
    if (positional) { score += 80; reasons.push('+80 signature positionnelle Op@le'); }

    // ── Détection en-têtes canoniques (voie alternative) ─────────────
    let bestRow = -1;
    let bestMatches = 0;
    for (let i = 0; i < Math.min(matrix.length, 12); i += 1) {
      const row = matrix[i] ?? [];
      const norm = row.map((c) => normalizeColumnName(String(c ?? '')));
      if (isTCDRow(row)) continue;
      const matches = canonical.filter((c) =>
        norm.some((h) => h === normalizeColumnName(c) || h.startsWith(normalizeColumnName(c))),
      ).length;
      if (matches > bestMatches) { bestMatches = matches; bestRow = i; }
    }
    if (bestMatches > 0) { score += bestMatches * 5; reasons.push(`+${bestMatches * 5} en-têtes canoniques`); }

    // Pour la voie positionnelle, l'index d'en-têtes effectif est la ligne 1 (0-based).
    // Pour la voie canonique, c'est bestRow.
    const headerRowIndex = positional ? 1 : bestRow;

    // ── Comptage lignes valides (compte commençant par classe attendue) ──
    let validRows = 0;
    if (positional) {
      for (let i = 2; i < matrix.length; i += 1) {
        const r = matrix[i] ?? [];
        const compte = String(r[OPALE_POS.COMPTE] ?? '').replace(/[^0-9]/g, '');
        if (compte.length >= 3 && compte.startsWith(expectedClass)) validRows += 1;
      }
    } else if (bestRow >= 0) {
      const headers = matrix[bestRow].map((c) => normalizeColumnName(String(c ?? '')));
      const compteIdx = findHeaderIndex(headers, 'compte');
      if (compteIdx !== -1) {
        for (let i = bestRow + 1; i < matrix.length; i += 1) {
          const r = matrix[i] ?? [];
          const compte = String(r[compteIdx] ?? '').replace(/[^0-9]/g, '');
          if (compte.length >= 3 && compte.startsWith(expectedClass)) validRows += 1;
        }
      }
    }
    if (validRows) { score += validRows; reasons.push(`+${validRows} comptes ${expectedClass}XXXXX`); }

    const headers = headerRowIndex >= 0
      ? (matrix[headerRowIndex] ?? []).map((c) => String(c ?? ''))
      : [];

    scored.push({
      sheetName,
      score,
      headerRowIndex,
      headers,
      matrix,
      positional,
      reason: reasons.join(' · ') || '—',
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const winner = scored.find((s) => s.score > 0 && s.headerRowIndex >= 0) ?? null;
  if (!winner) return null;

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

// ─── Parsing positionnel Op@le (spec chirurgicale) ────────────────────

/** Parse SDE/SDR via mapping POSITIONNEL fixe (colonnes K, AL, BL-BP).
 *  À utiliser dès qu'on détecte la signature « Montant colonne N » en L2.
 *  Cette voie est insensible aux libellés d'en-têtes Op@le génériques. */
export function parseSdeRowsPositional(matrix: SheetCell[][]): SdeRow[] {
  const rows: SdeRow[] = [];
  for (let i = 2; i < matrix.length; i += 1) {
    const r = matrix[i] ?? [];
    const codeOpale = String(r[OPALE_POS.CODE_OPALE] ?? '').trim();
    if (!codeOpale || /^total/i.test(codeOpale)) continue;
    const service = String(r[OPALE_POS.SERVICE] ?? '').trim();
    if (!service) continue;
    const compte = String(r[OPALE_POS.COMPTE] ?? '').replace(/[^0-9]/g, '');
    if (compte.length < 3 || !compte.startsWith('6')) continue;

    const oi = toNum(r[OPALE_POS.MONTANT_1]);
    const ec = toNum(r[OPALE_POS.MONTANT_2]);
    const realise = toNum(r[OPALE_POS.MONTANT_3]);
    const enCours = toNum(r[OPALE_POS.MONTANT_4]);
    const dispo = toNum(r[OPALE_POS.MONTANT_5]);

    if (oi === 0 && ec === 0 && realise === 0 && enCours === 0 && dispo === 0) continue;

    rows.push({
      service,
      activite: String(r[OPALE_POS.ACTIVITE] ?? '').trim(),
      natureAnalytique: '',
      domaine: String(r[OPALE_POS.DOMAINE] ?? '').trim(),
      compte,
      libelle: String(r[OPALE_POS.LIBELLE_CPT] ?? '').trim(),
      oi,
      dbm: 0,
      ot: oi, // budget total = colonne BL « Budget »
      engagementsJuridiques: ec,
      engagementsComptables: ec,
      liquidations: realise,
      mandats: realise,
      disponible: dispo || (oi - ec),
    });
  }
  return rows;
}

/** Idem pour SDR (compte commençant par 7, montant 5 = +/- value). */
export function parseSdrRowsPositional(matrix: SheetCell[][]): SdrRow[] {
  const rows: SdrRow[] = [];
  for (let i = 2; i < matrix.length; i += 1) {
    const r = matrix[i] ?? [];
    const codeOpale = String(r[OPALE_POS.CODE_OPALE] ?? '').trim();
    if (!codeOpale || /^total/i.test(codeOpale)) continue;
    const service = String(r[OPALE_POS.SERVICE] ?? '').trim();
    if (!service) continue;
    const compte = String(r[OPALE_POS.COMPTE] ?? '').replace(/[^0-9]/g, '');
    if (compte.length < 3 || !compte.startsWith('7')) continue;

    const pi = toNum(r[OPALE_POS.MONTANT_1]);
    const engage = toNum(r[OPALE_POS.MONTANT_2]);
    const realise = toNum(r[OPALE_POS.MONTANT_3]);
    const notif = toNum(r[OPALE_POS.MONTANT_4]);
    const pmv = toNum(r[OPALE_POS.MONTANT_5]);

    if (pi === 0 && engage === 0 && realise === 0 && notif === 0 && pmv === 0) continue;

    rows.push({
      service,
      activite: String(r[OPALE_POS.ACTIVITE] ?? '').trim(),
      compte,
      libelle: String(r[OPALE_POS.LIBELLE_CPT] ?? '').trim(),
      pi,
      dbm: 0,
      pt: pi,
      ordresRecettes: realise,
      recettesNotifiees: notif,
      recettesEncaissees: realise,
      resteARecouvrer: pmv,
    });
  }
  return rows;
}

/** Helper exporté : détection positionnelle pour les consommateurs. */
export function isOpalePositionalMatrix(matrix: SheetCell[][]): boolean {
  return hasOpalePositionalSignature(matrix);
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
  // Voie positionnelle Op@le (BL-BP « Montant colonne 1..5 »)
  if (hasOpalePositionalSignature(selection.matrix)) {
    return parseSdeRowsPositional(selection.matrix);
  }
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
  if (hasOpalePositionalSignature(selection.matrix)) {
    return parseSdrRowsPositional(selection.matrix);
  }
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

// ─── Adaptateur pour rows déjà normalisés (clé/valeur) ────────────────
//
// Permet de brancher le moteur de taux sur l'import existant
// (ImportSection) sans avoir besoin de retraiter le workbook XLSX.
// Les rows passés ici proviennent de Papa.parse / sheet_to_json après
// normalizeRowsForOpaleImport — leurs clés sont les en-têtes Op@le.

function pickField(row: Record<string, unknown>, normHeaders: string[], aliasKey: keyof typeof HEADER_ALIASES): number {
  const idx = findHeaderIndex(normHeaders, aliasKey);
  if (idx === -1) return 0;
  const key = Object.keys(row)[idx];
  if (!key) return 0;
  const raw = String(row[key] ?? '').trim().replace(/\s/g, '').replace(',', '.');
  const n = Number(raw.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function pickFieldStr(row: Record<string, unknown>, normHeaders: string[], aliasKey: keyof typeof HEADER_ALIASES): string {
  const idx = findHeaderIndex(normHeaders, aliasKey);
  if (idx === -1) return '';
  const key = Object.keys(row)[idx];
  if (!key) return '';
  return String(row[key] ?? '').trim();
}

/** Reconstruit des SdeRow[] à partir des rows normalisés clé/valeur. */
export function buildSdeRowsFromRecords(rows: Record<string, unknown>[]): SdeRow[] {
  if (!rows.length) return [];
  const normHeaders = Object.keys(rows[0]).map((h) => normalizeColumnName(h));
  return rows
    .map((r): SdeRow => {
      const oi = pickField(r, normHeaders, 'oi');
      const dbm = pickField(r, normHeaders, 'dbm');
      const otFile = pickField(r, normHeaders, 'ot');
      const ec = pickField(r, normHeaders, 'engagements_comptables') || pickField(r, normHeaders, 'engagements_juridiques');
      const dispoFile = pickField(r, normHeaders, 'disponible');
      const ot = otFile || (oi + dbm);
      return {
        service: pickFieldStr(r, normHeaders, 'service'),
        activite: pickFieldStr(r, normHeaders, 'activite'),
        natureAnalytique: pickFieldStr(r, normHeaders, 'nature_analytique'),
        domaine: pickFieldStr(r, normHeaders, 'domaine'),
        compte: pickFieldStr(r, normHeaders, 'compte').replace(/^C\//i, '').trim(),
        libelle: pickFieldStr(r, normHeaders, 'libelle'),
        oi, dbm, ot,
        engagementsJuridiques: pickField(r, normHeaders, 'engagements_juridiques'),
        engagementsComptables: ec,
        liquidations: pickField(r, normHeaders, 'liquidations'),
        mandats: pickField(r, normHeaders, 'mandats'),
        disponible: dispoFile || (ot - ec),
      };
    })
    .filter((r) => r.compte && /^\d/.test(r.compte));
}

/** Reconstruit des SdrRow[] à partir des rows normalisés clé/valeur. */
export function buildSdrRowsFromRecords(rows: Record<string, unknown>[]): SdrRow[] {
  if (!rows.length) return [];
  const normHeaders = Object.keys(rows[0]).map((h) => normalizeColumnName(h));
  return rows
    .map((r): SdrRow => {
      const pi = pickField(r, normHeaders, 'pi');
      const dbm = pickField(r, normHeaders, 'dbm');
      const ptFile = pickField(r, normHeaders, 'pt');
      const ordres = pickField(r, normHeaders, 'ordres_recettes');
      const enc = pickField(r, normHeaders, 'recettes_encaissees');
      const rar = pickField(r, normHeaders, 'reste_a_recouvrer');
      return {
        service: pickFieldStr(r, normHeaders, 'service'),
        activite: pickFieldStr(r, normHeaders, 'activite'),
        compte: pickFieldStr(r, normHeaders, 'compte').replace(/^C\//i, '').trim(),
        libelle: pickFieldStr(r, normHeaders, 'libelle'),
        pi, dbm,
        pt: ptFile || (pi + dbm),
        ordresRecettes: ordres,
        recettesNotifiees: pickField(r, normHeaders, 'recettes_notifiees'),
        recettesEncaissees: enc,
        resteARecouvrer: rar || (ordres - enc),
      };
    })
    .filter((r) => r.compte && /^\d/.test(r.compte));
}

/** Calcule directement les taux depuis des rows clé/valeur (fast path import). */
export function computeTauxDepensesFromRecords(rows: Record<string, unknown>[]) {
  return calculerTauxDepenses(buildSdeRowsFromRecords(rows));
}

export function computeTauxRecettesFromRecords(rows: Record<string, unknown>[]) {
  return calculerTauxRecettes(buildSdrRowsFromRecords(rows));
}