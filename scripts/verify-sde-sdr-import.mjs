#!/usr/bin/env node
/**
 * verify-sde-sdr-import.mjs
 *
 * Recette autonome de l'import SDE/SDR Op@le, conforme au brief
 * rectorat de Guadeloupe (chantier 1) et au modèle de
 * verify-balance-import.mjs.
 *
 * USAGE :
 *   node scripts/verify-sde-sdr-import.mjs <fichier.xlsx> <sde|sdr>
 *
 * SANS ARGUMENT : exécute des tests internes synthétiques (workbook
 * forgé en mémoire) pour garantir l'exit 0 sans fichier réel.
 *
 * EXIT : 0 succès, 1 échec, 2 erreur d'invocation
 */
import XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const ok = (m) => console.log(`  ${C.green}✓${C.reset} ${m}`);
const ko = (m) => console.log(`  ${C.red}✗${C.reset} ${m}`);
const info = (m) => console.log(`  ${C.cyan}ℹ${C.reset} ${m}`);
const section = (t) => console.log(`\n${C.bold}${C.blue}━━━ ${t} ━━━${C.reset}`);

const TCD_SIGNATURES = [
  'somme de', 'total general', '__empty', 'unnamed:',
  'etiquettes de lignes', 'etiquettes de colonnes',
];

const SDE_HEADERS = [
  'service budgetaire', 'code activite', 'compte par nature',
  'ouvertures initiales', 'dbm', 'engagements', 'liquidations', 'mandats',
];
const SDR_HEADERS = [
  'service budgetaire', 'code activite', 'compte par nature',
  'previsions initiales', 'dbm', 'ordres de recettes', 'recettes encaissees',
];

const HEADER_ALIASES = {
  service: ['service budgetaire', 'service', 'sb'],
  activite: ['code activite', 'code d activite', 'activite', 'code'],
  compte: ['compte par nature', 'compte nature', 'compte'],
  oi: ['ouvertures initiales', 'oi', 'budget initial', 'bi'],
  pi: ['previsions initiales', 'pi', 'budget initial', 'bi'],
  dbm: ['dbm', 'dbm de l exercice', 'modifications'],
  ot: ['ouvertures totales', 'ot', 'credits ouverts', 'credits totaux'],
  pt: ['previsions totales', 'pt'],
  ec: ['engagements comptables', 'ec', 'mandats pris en charge'],
  liq: ['liquidations', 'liquide'],
  mandats: ['mandats emis', 'mandats'],
  ordres: ['ordres de recettes emis', 'ordres de recettes', 'titres emis', 'aor'],
  enc: ['recettes encaissees', 'encaissements', 'encaisse'],
};

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function repairRange(sheet) {
  const keys = Object.keys(sheet).filter((k) => /^[A-Z]+\d+$/.test(k));
  if (!keys.length) return;
  let mr = 0, mc = 0;
  for (const k of keys) {
    const c = XLSX.utils.decode_cell(k);
    if (c.r > mr) mr = c.r;
    if (c.c > mc) mc = c.c;
  }
  sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: mr, c: mc })}`;
}

function findHeaderIdx(headers, key) {
  const aliases = HEADER_ALIASES[key];
  for (const a of aliases) {
    const an = norm(a);
    const i = headers.findIndex((h) => h === an);
    if (i !== -1) return i;
  }
  for (const a of aliases) {
    const an = norm(a);
    const i = headers.findIndex((h) => h.startsWith(an));
    if (i !== -1) return i;
  }
  return -1;
}

function isTcdRow(row) {
  return row.some((c) => {
    const s = norm(c);
    return TCD_SIGNATURES.some((sig) => s.startsWith(sig) || s.includes(sig));
  });
}

function selectSheet(wb, kind) {
  const canonical = kind === 'sde' ? SDE_HEADERS : SDR_HEADERS;
  const expectedClass = kind === 'sde' ? '6' : '7';
  const scored = [];
  for (const sn of wb.SheetNames) {
    const sheet = wb.Sheets[sn];
    repairRange(sheet);
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false, raw: true });
    let bestRow = -1;
    let bestMatches = 0;
    let tcdPenalty = 0;
    for (let i = 0; i < Math.min(matrix.length, 12); i += 1) {
      const row = matrix[i] || [];
      if (isTcdRow(row)) { tcdPenalty = -10; continue; }
      const normd = row.map(norm);
      const m = canonical.filter((c) => normd.some((h) => h === norm(c) || h.startsWith(norm(c)))).length;
      if (m > bestMatches) { bestMatches = m; bestRow = i; }
    }
    let score = bestMatches * 5 + tcdPenalty;
    let validRows = 0;
    if (bestRow >= 0) {
      const headers = matrix[bestRow].map(norm);
      const compteIdx = findHeaderIdx(headers, 'compte');
      if (compteIdx !== -1) {
        for (let i = bestRow + 1; i < matrix.length; i += 1) {
          const r = matrix[i] || [];
          const compte = String(r[compteIdx] ?? '').replace(/^C\//i, '').replace(/[^0-9]/g, '');
          if (compte.length >= 3 && compte.startsWith(expectedClass)) validRows += 1;
        }
      }
      score += validRows;
    }
    const nameN = norm(sn);
    if (nameN.includes('donnee')) score += 5;
    if (nameN.includes('situation')) score -= 3;
    scored.push({ sheetName: sn, score, bestRow, matrix, validRows, bestMatches });
  }
  scored.sort((a, b) => b.score - a.score);
  const w = scored[0];
  if (!w || w.score < 10 || w.bestRow < 0) return { ok: false, scored };
  return { ok: true, ...w, scored };
}

function toNum(v) {
  if (v == null || v === '') return 0;
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseSde(sel) {
  const headers = sel.matrix[sel.bestRow].map(norm);
  const idx = {
    service: findHeaderIdx(headers, 'service'),
    compte: findHeaderIdx(headers, 'compte'),
    oi: findHeaderIdx(headers, 'oi'),
    dbm: findHeaderIdx(headers, 'dbm'),
    ot: findHeaderIdx(headers, 'ot'),
    ec: findHeaderIdx(headers, 'ec'),
    liq: findHeaderIdx(headers, 'liq'),
    mandats: findHeaderIdx(headers, 'mandats'),
  };
  const rows = [];
  for (let i = sel.bestRow + 1; i < sel.matrix.length; i += 1) {
    const r = sel.matrix[i] || [];
    const compte = String(r[idx.compte] ?? '').replace(/^C\//i, '').replace(/[^0-9]/g, '');
    if (compte.length < 3 || !compte.startsWith('6')) continue;
    const oi = toNum(r[idx.oi]);
    const dbm = toNum(r[idx.dbm]);
    const ot = toNum(r[idx.ot]) || oi + dbm;
    rows.push({
      service: String(r[idx.service] ?? '').trim(),
      compte, oi, dbm, ot,
      ec: toNum(r[idx.ec]),
      liq: toNum(r[idx.liq]),
      mandats: toNum(r[idx.mandats]),
    });
  }
  return rows;
}

function parseSdr(sel) {
  const headers = sel.matrix[sel.bestRow].map(norm);
  const idx = {
    service: findHeaderIdx(headers, 'service'),
    compte: findHeaderIdx(headers, 'compte'),
    pi: findHeaderIdx(headers, 'pi'),
    dbm: findHeaderIdx(headers, 'dbm'),
    pt: findHeaderIdx(headers, 'pt'),
    ordres: findHeaderIdx(headers, 'ordres'),
    enc: findHeaderIdx(headers, 'enc'),
  };
  const rows = [];
  for (let i = sel.bestRow + 1; i < sel.matrix.length; i += 1) {
    const r = sel.matrix[i] || [];
    const compte = String(r[idx.compte] ?? '').replace(/^C\//i, '').replace(/[^0-9]/g, '');
    if (compte.length < 3 || !compte.startsWith('7')) continue;
    const pi = toNum(r[idx.pi]);
    const dbm = toNum(r[idx.dbm]);
    const pt = toNum(r[idx.pt]) || pi + dbm;
    const ordres = toNum(r[idx.ordres]);
    rows.push({
      service: String(r[idx.service] ?? '').trim(),
      compte, pi, dbm, pt, ordres,
      enc: toNum(r[idx.enc]),
    });
  }
  return rows;
}

function fmt(n) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function pct(n, d) { return d === 0 ? 0 : (n / d) * 100; }

// ─── Mode tests synthétiques (sans fichier) ────────────────────────────
function buildSyntheticWorkbook() {
  // Onglet 1 = TCD pollué, onglet 2 = "Donnees" avec en-têtes ligne 3
  const tcd = XLSX.utils.aoa_to_sheet([
    ['Étiquettes de lignes', 'Somme de Mandats', 'Total général'],
    ['AP', 12345, 12345],
    ['Total général', 12345, 12345],
  ]);
  const data = XLSX.utils.aoa_to_sheet([
    ['Situation des dépenses 2026 — Lycée Guadeloupe'],
    [],
    ['Service budgétaire', 'Code activité', 'Compte par nature', 'Libellé compte',
     'Ouvertures initiales', 'DBM', 'Ouvertures totales',
     'Engagements juridiques', 'Engagements comptables',
     'Liquidations', 'Mandats émis', 'Disponible'],
    ['AP', '13100', '60611', 'Eau',          1000, 200, 1200,  900,  900,  900,  900, 300],
    ['AP', '13100', '60612', 'Énergie',      5000, 0,   5000, 4500, 4500, 4500, 4500, 500],
    ['VE', '15200', '60622', 'Carburant',    2000, 100, 2100, 1800, 1800, 1800, 1800, 300],
    ['ALO', '17100', '61521', 'Maintenance', 8000, 500, 8500, 7000, 7000, 7000, 7000, 1500],
    ['SRH', '13900', '60623', 'Alimentation',12000,0,   12000,11500, 11500, 11500, 11000, 500],
  ]);
  const sdrData = XLSX.utils.aoa_to_sheet([
    ['Situation des recettes 2026'],
    [],
    ['Service budgétaire', 'Code activité', 'Compte par nature', 'Libellé compte',
     'Prévisions initiales', 'DBM', 'Prévisions totales',
     'Ordres de recettes émis', 'Recettes notifiées', 'Recettes encaissées', 'Reste à recouvrer'],
    ['AP', '13100', '70610', 'Subv région', 10000, 0, 10000, 10000, 10000, 9500, 500],
    ['SRH','13900', '70620', 'Restauration', 18000, 0, 18000, 17500, 17500, 17000, 500],
  ]);
  const wbSde = { SheetNames: ['Situation', 'Donnees'], Sheets: { Situation: tcd, Donnees: data } };
  const wbSdr = { SheetNames: ['Situation', 'Donnees'], Sheets: { Situation: tcd, Donnees: sdrData } };
  return { wbSde, wbSdr };
}

function runSyntheticTests() {
  console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║  RECETTE SDE/SDR — TESTS SYNTHÉTIQUES (sans fichier)     ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);

  let failures = 0;
  const { wbSde, wbSdr } = buildSyntheticWorkbook();

  section('1. Détection onglet SDE (rejet TCD, sélection « Donnees »)');
  const selSde = selectSheet(wbSde, 'sde');
  if (!selSde.ok) { ko('Aucun onglet SDE détecté'); failures += 1; }
  else if (selSde.sheetName !== 'Donnees') {
    ko(`Mauvais onglet retenu : « ${selSde.sheetName} » (attendu : Donnees)`);
    failures += 1;
  } else {
    ok(`Onglet retenu : « ${selSde.sheetName} » (score ${selSde.score})`);
    selSde.scored.forEach((s) => info(`  - ${s.sheetName} : score ${s.score}`));
  }

  section('2. Parsing SDE et cohérence OI + DBM = OT');
  const sdeRows = selSde.ok ? parseSde(selSde) : [];
  if (sdeRows.length !== 5) { ko(`${sdeRows.length} lignes SDE (attendu 5)`); failures += 1; }
  else ok(`${sdeRows.length} lignes SDE parsées`);
  for (const r of sdeRows) {
    const ec = r.ot - (r.oi + r.dbm);
    if (Math.abs(ec) > 0.01) { ko(`Incohérence OI+DBM≠OT compte ${r.compte} (écart ${fmt(ec)})`); failures += 1; }
  }
  if (sdeRows.every((r) => Math.abs(r.ot - (r.oi + r.dbm)) <= 0.01)) ok('Toutes les lignes : OI + DBM = OT');

  section('3. Calcul des taux d\'exécution dépenses (consolidé)');
  const totSde = sdeRows.reduce((a, r) => ({
    ot: a.ot + r.ot, ec: a.ec + r.ec, liq: a.liq + r.liq, mandats: a.mandats + r.mandats,
  }), { ot: 0, ec: 0, liq: 0, mandats: 0 });
  const expectedOT = 1200 + 5000 + 2100 + 8500 + 12000;
  const expectedMandats = 900 + 4500 + 1800 + 7000 + 11000;
  const tauxMandatement = pct(totSde.mandats, totSde.ot);
  if (Math.abs(totSde.ot - expectedOT) > 0.01) { ko(`OT total ${fmt(totSde.ot)} ≠ attendu ${fmt(expectedOT)}`); failures += 1; }
  else ok(`OT total = ${fmt(totSde.ot)}`);
  if (Math.abs(totSde.mandats - expectedMandats) > 0.01) { ko(`Mandats ${fmt(totSde.mandats)} ≠ attendu ${fmt(expectedMandats)}`); failures += 1; }
  else ok(`Mandats émis = ${fmt(totSde.mandats)}`);
  ok(`Taux de mandatement consolidé = ${tauxMandatement.toFixed(2)} %`);

  section('4. Taux par service');
  const services = ['AP', 'VE', 'ALO', 'SRH'];
  for (const s of services) {
    const sub = sdeRows.filter((r) => r.service === s);
    const sot = sub.reduce((a, r) => a + r.ot, 0);
    const sm = sub.reduce((a, r) => a + r.mandats, 0);
    info(`Service ${s.padEnd(4)} : OT=${fmt(sot).padStart(14)}  Mandats=${fmt(sm).padStart(14)}  Taux=${pct(sm, sot).toFixed(2)}%`);
  }
  ok('4 services calculés (AP, VE, ALO, SRH)');

  section('5. Détection onglet SDR + parsing');
  const selSdr = selectSheet(wbSdr, 'sdr');
  if (!selSdr.ok || selSdr.sheetName !== 'Donnees') { ko('SDR : mauvais onglet'); failures += 1; }
  else ok(`SDR onglet retenu : « ${selSdr.sheetName} »`);
  const sdrRows = selSdr.ok ? parseSdr(selSdr) : [];
  if (sdrRows.length !== 2) { ko(`${sdrRows.length} lignes SDR (attendu 2)`); failures += 1; }
  else ok(`${sdrRows.length} lignes SDR parsées`);

  section('6. Taux de recouvrement SDR');
  const totSdr = sdrRows.reduce((a, r) => ({
    pt: a.pt + r.pt, ordres: a.ordres + r.ordres, enc: a.enc + r.enc,
  }), { pt: 0, ordres: 0, enc: 0 });
  const tauxExec = pct(totSdr.ordres, totSdr.pt);
  const tauxRec = pct(totSdr.enc, totSdr.ordres);
  ok(`PT=${fmt(totSdr.pt)}  Ordres=${fmt(totSdr.ordres)}  Encaissé=${fmt(totSdr.enc)}`);
  ok(`Taux d'exécution recettes = ${tauxExec.toFixed(2)} %`);
  ok(`Taux de recouvrement = ${tauxRec.toFixed(2)} %`);

  section('7. Rejet du TCD (signatures interdites)');
  // Forcer l'évaluation du TCD seul
  const wbTcdOnly = { SheetNames: ['Situation'], Sheets: { Situation: wbSde.Sheets.Situation } };
  const selTcd = selectSheet(wbTcdOnly, 'sde');
  if (selTcd.ok) { ko('Le TCD seul a été accepté à tort'); failures += 1; }
  else ok('TCD seul correctement rejeté (score insuffisant)');

  section('RÉSULTAT');
  if (failures === 0) {
    console.log(`${C.bold}${C.green}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.green}║  ✓ RECETTE SDE/SDR RÉUSSIE — 0 critère échoué            ║${C.reset}`);
    console.log(`${C.bold}${C.green}╚══════════════════════════════════════════════════════════╝${C.reset}\n`);
    process.exit(0);
  }
  console.log(`${C.bold}${C.red}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.red}║  ✗ RECETTE ÉCHOUÉE — ${String(failures).padStart(2)} critère(s) échoué(s)             ║${C.reset}`);
  console.log(`${C.bold}${C.red}╚══════════════════════════════════════════════════════════╝${C.reset}\n`);
  process.exit(1);
}

// ─── Mode fichier ────────────────────────────────────────────────────
function runFileMode(filePath, kind) {
  console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║  RECETTE IMPORT ${kind.toUpperCase()} OP@LE                              ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`\nFichier : ${C.bold}${resolve(filePath)}${C.reset}`);

  if (!existsSync(filePath)) {
    console.error(`${C.red}Fichier introuvable${C.reset}`);
    process.exit(2);
  }

  const buf = readFileSync(resolve(filePath));
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });

  let failures = 0;

  section('1. Onglets trouvés');
  wb.SheetNames.forEach((n) => info(`« ${n} »`));

  section(`2. Sélection de l'onglet ${kind.toUpperCase()}`);
  const sel = selectSheet(wb, kind);
  if (!sel.ok) { ko('Aucun onglet exploitable'); failures += 1; sel.scored.forEach((s) => info(`  - ${s.sheetName} : score ${s.score}`)); }
  else { ok(`Onglet retenu : « ${sel.sheetName} » (score ${sel.score})`); sel.scored.forEach((s) => info(`  - ${s.sheetName} : score ${s.score}`)); }

  if (sel.ok) {
    section('3. Parsing');
    const rows = kind === 'sde' ? parseSde(sel) : parseSdr(sel);
    info(`Lignes parsées : ${rows.length}`);
    if (!rows.length) { ko('Aucune ligne valide'); failures += 1; }
    else ok(`${rows.length} lignes valides`);

    if (kind === 'sde' && rows.length) {
      section('4. Cohérence OI + DBM = OT');
      const ecarts = rows.filter((r) => Math.abs(r.ot - (r.oi + r.dbm)) > 0.01);
      if (ecarts.length) { ko(`${ecarts.length} comptes en écart`); failures += 1; }
      else ok('Toutes les lignes : OI + DBM = OT');

      section('5. Taux d\'exécution dépenses');
      const tot = rows.reduce((a, r) => ({ ot: a.ot + r.ot, ec: a.ec + r.ec, mandats: a.mandats + r.mandats, liq: a.liq + r.liq }), { ot: 0, ec: 0, liq: 0, mandats: 0 });
      ok(`OT total : ${fmt(tot.ot)}`);
      ok(`Engagements comptables : ${fmt(tot.ec)} (${pct(tot.ec, tot.ot).toFixed(2)} %)`);
      ok(`Liquidations : ${fmt(tot.liq)} (${pct(tot.liq, tot.ot).toFixed(2)} %)`);
      ok(`Mandats émis : ${fmt(tot.mandats)} (${pct(tot.mandats, tot.ot).toFixed(2)} %)`);

      const services = Array.from(new Set(rows.map((r) => r.service).filter(Boolean)));
      section('6. Taux par service');
      services.forEach((s) => {
        const sub = rows.filter((r) => r.service === s);
        const sot = sub.reduce((a, r) => a + r.ot, 0);
        const sm = sub.reduce((a, r) => a + r.mandats, 0);
        info(`${s.padEnd(6)} : OT=${fmt(sot).padStart(16)}  Mandats=${fmt(sm).padStart(16)}  Taux=${pct(sm, sot).toFixed(2)}%`);
      });
    }

    if (kind === 'sdr' && rows.length) {
      section('4. Taux d\'exécution recettes');
      const tot = rows.reduce((a, r) => ({ pt: a.pt + r.pt, ordres: a.ordres + r.ordres, enc: a.enc + r.enc }), { pt: 0, ordres: 0, enc: 0 });
      ok(`Prévisions totales : ${fmt(tot.pt)}`);
      ok(`Ordres de recettes émis : ${fmt(tot.ordres)} (${pct(tot.ordres, tot.pt).toFixed(2)} % d'exécution)`);
      ok(`Recettes encaissées : ${fmt(tot.enc)} (${pct(tot.enc, tot.ordres).toFixed(2)} % de recouvrement)`);
    }
  }

  section('RÉSULTAT');
  if (failures === 0) {
    console.log(`${C.bold}${C.green}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.green}║  ✓ VALIDATION RÉUSSIE                                    ║${C.reset}`);
    console.log(`${C.bold}${C.green}╚══════════════════════════════════════════════════════════╝${C.reset}\n`);
    process.exit(0);
  }
  console.log(`${C.bold}${C.red}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.red}║  ✗ VALIDATION ÉCHOUÉE                                    ║${C.reset}`);
  console.log(`${C.bold}${C.red}╚══════════════════════════════════════════════════════════╝${C.reset}\n`);
  process.exit(1);
}

// ─── Entry point ──────────────────────────────────────────────────────
const [, , filePath, kindArg] = process.argv;
if (!filePath) {
  // Pas de fichier → exécuter les tests synthétiques (exit 0 garanti si OK)
  runSyntheticTests();
} else {
  const kind = (kindArg || '').toLowerCase();
  if (kind !== 'sde' && kind !== 'sdr') {
    console.error(`${C.red}Usage: node scripts/verify-sde-sdr-import.mjs <fichier.xlsx> <sde|sdr>${C.reset}`);
    process.exit(2);
  }
  const ext = extname(filePath).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xls') {
    console.error(`${C.red}Format non supporté : ${ext}${C.reset}`);
    process.exit(2);
  }
  runFileMode(filePath, kind);
}