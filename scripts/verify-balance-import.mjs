#!/usr/bin/env node
/**
 * verify-balance-import.mjs
 *
 * Script de recette autonome pour l'import de balance Op@le.
 * Voir consigne utilisateur — référence absolue.
 *
 * USAGE : node scripts/verify-balance-import.mjs <fichier.xlsx>
 * EXIT  : 0 = succès, 1 = échec, 2 = erreur d'invocation
 */

import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { resolve, extname } from 'path';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const ok = (msg) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const ko = (msg) => console.log(`  ${C.red}✗${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.cyan}ℹ${C.reset} ${msg}`);
const section = (t) => console.log(`\n${C.bold}${C.blue}━━━ ${t} ━━━${C.reset}`);

const EXPECTED = {
  rowCount: 88,
  establishment: '9710040S',
  period: '04/2026',
  totals: {
    debitAnt: 1520443.06, creditAnt: 1520443.06,
    debit: 128349.60, credit: 128349.60,
    soldeDebit: 905011.19, soldeCredit: 905011.19,
  },
  controlAccounts: [
    { compte: '106810', sens: 'C', solde: 260248.89 },
    { compte: '411200', sens: 'D', solde: 25521.35 },
    { compte: '411300', sens: 'C', solde: 4.30 },
    { compte: '515100', sens: 'D', solde: 496301.92 },
    { compte: '515900', sens: 'C', solde: 159883.26 },
    { compte: '531000', sens: 'D', solde: 9948.79 },
    { compte: '466400', sens: 'C', solde: 88776.88 },
    { compte: '443110', sens: 'D', solde: 86969.61 },
  ],
  forbiddenHeaderPatterns: [
    /^__empty/i, /^unnamed:/i, /^somme de/i, /^total général/i,
  ],
};

const EPS = 0.01;

const REQUIRED_HEADERS = [
  'compte', 'montant débit antérieur', 'montant crédit antérieur',
  'montant débit', 'montant crédit', 'solde débit', 'solde crédit',
  'classe de compte',
];

const TCD_SIGNATURES = ['somme de', '__empty', 'unnamed:', 'total général'];

const normalize = (s) => String(s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');

// ─── Réparation !ref (fréquemment corrompu par Op@le) ───────────
function repairSheetRange(sheet) {
  const cellKeys = Object.keys(sheet).filter(k => /^[A-Z]+\d+$/.test(k));
  if (cellKeys.length === 0) return sheet;
  let maxR = 0, maxC = 0;
  for (const k of cellKeys) {
    const c = XLSX.utils.decode_cell(k);
    if (c.r > maxR) maxR = c.r;
    if (c.c > maxC) maxC = c.c;
  }
  sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: maxC })}`;
  return sheet;
}

function isTCDHeader(row) {
  return row.some(cell => {
    const s = normalize(cell);
    return TCD_SIGNATURES.some(sig => s.startsWith(sig) || s.includes(sig));
  });
}

function isValidHeaderRow(row) {
  if (!Array.isArray(row) || row.length === 0) return false;
  if (isTCDHeader(row)) return false;
  const normalized = row.map(normalize);
  const matchCount = REQUIRED_HEADERS.filter(h =>
    normalized.some(cell => cell === h || cell.startsWith(h))
  ).length;
  return matchCount >= 5;
}

function findHeaderRow(sheet) {
  repairSheetRange(sheet);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    if (isValidHeaderRow(rows[i])) return { index: i, rows };
  }
  return null;
}

function parseSheet(sheet, headerInfo) {
  const { index, rows } = headerInfo;
  const headers = rows[index].map(normalize);
  const col = (name) =>
    headers.findIndex(h => h === normalize(name) || h.startsWith(normalize(name)));

  const idx = {
    compte: col('compte'),
    intitule: col('intitulé réduit du compte'),
    mDebAnt: col('montant débit antérieur'),
    mCreAnt: col('montant crédit antérieur'),
    mDeb: col('montant débit'),
    mCre: col('montant crédit'),
    sDeb: col('solde débit'),
    sCre: col('solde crédit'),
    classe: col('classe de compte'),
    etab: col('etablissement'),
    periode: col('période de début'),
  };

  const data = [];
  let establishment = null, period = null;

  for (let i = index + 1; i < rows.length; i++) {
    const r = rows[i];
    const compte = String(r[idx.compte] ?? '').trim();
    const classe = String(r[idx.classe] ?? '').trim();
    if (!/^[0-9A-Z]{3,10}$/i.test(compte)) continue;
    if (!/^[1-8]$/.test(classe)) continue;

    data.push({
      compte,
      intitule: String(r[idx.intitule] ?? ''),
      debitAnt: Number(r[idx.mDebAnt]) || 0,
      creditAnt: Number(r[idx.mCreAnt]) || 0,
      debit: Number(r[idx.mDeb]) || 0,
      credit: Number(r[idx.mCre]) || 0,
      soldeDebit: Number(r[idx.sDeb]) || 0,
      soldeCredit: Number(r[idx.sCre]) || 0,
      classe,
    });
    if (!establishment && r[idx.etab]) establishment = String(r[idx.etab]);
    if (!period && r[idx.periode]) period = String(r[idx.periode]);
  }

  return { data, establishment, period, headerRow: rows[index] };
}

function findBalanceSheet(wb) {
  const candidates = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const header = findHeaderRow(sheet);
    if (!header) continue;
    const parsed = parseSheet(sheet, header);
    if (parsed.data.length > 0) candidates.push({ name, ...parsed });
  }
  candidates.sort((a, b) => b.data.length - a.data.length);
  return candidates[0] || null;
}

const [, , filePath] = process.argv;
if (!filePath) {
  console.error(`${C.red}Usage: node verify-balance-import.mjs <fichier.xlsx>${C.reset}`);
  process.exit(2);
}

console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║  RECETTE IMPORT BALANCE OP@LE — verify-balance-import  ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════╝${C.reset}`);
console.log(`\nFichier testé : ${C.bold}${resolve(filePath)}${C.reset}`);

let wb;
try {
  const buf = readFileSync(resolve(filePath));
  wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
} catch (e) {
  console.error(`${C.red}ERREUR: impossible de lire le fichier: ${e.message}${C.reset}`);
  process.exit(2);
}

section('1. Onglets trouvés');
wb.SheetNames.forEach(n => info(`« ${n} »`));

section('2. Détection de l\'onglet balance');
const result = findBalanceSheet(wb);
let failures = 0;

if (!result) {
  ko('Aucun onglet exploitable détecté');
  console.log(`\n${C.red}${C.bold}VALIDATION ÉCHOUÉE — Import impossible.${C.reset}\n`);
  process.exit(1);
}
ok(`Onglet retenu : « ${result.name} »`);

section('3. Rejet du TCD (colonnes interdites)');
const forbidden = [];
for (const cell of result.headerRow) {
  const s = normalize(cell);
  for (const pat of EXPECTED.forbiddenHeaderPatterns) {
    if (pat.test(s)) forbidden.push(cell);
  }
}
if (forbidden.length > 0) {
  ko(`Colonnes interdites détectées : ${forbidden.join(', ')}`);
  failures++;
} else {
  ok('Aucune colonne fantôme (__EMPTY_, Unnamed:, Somme de, Total général)');
}

section('4. Nombre de lignes');
if (result.data.length === EXPECTED.rowCount) ok(`${result.data.length} lignes (attendu : ${EXPECTED.rowCount})`);
else { ko(`${result.data.length} lignes — attendu : ${EXPECTED.rowCount}`); failures++; }

section('5. Métadonnées');
if (result.establishment === EXPECTED.establishment) ok(`UAI : ${result.establishment}`);
else { ko(`UAI : ${result.establishment ?? 'ABSENT'} — attendu : ${EXPECTED.establishment}`); failures++; }
if (result.period === EXPECTED.period) ok(`Période : ${result.period}`);
else { ko(`Période : ${result.period ?? 'ABSENTE'} — attendue : ${EXPECTED.period}`); failures++; }

section('6. Totaux d\'équilibre');
const T = result.data.reduce((a, r) => ({
  debitAnt: a.debitAnt + r.debitAnt, creditAnt: a.creditAnt + r.creditAnt,
  debit: a.debit + r.debit, credit: a.credit + r.credit,
  soldeDebit: a.soldeDebit + r.soldeDebit, soldeCredit: a.soldeCredit + r.soldeCredit,
}), { debitAnt: 0, creditAnt: 0, debit: 0, credit: 0, soldeDebit: 0, soldeCredit: 0 });

const fmt = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const check = (label, got, expected) => {
  if (Math.abs(got - expected) <= EPS) ok(`${label.padEnd(22)} ${fmt(got).padStart(18)} (attendu ${fmt(expected)})`);
  else { ko(`${label.padEnd(22)} ${fmt(got).padStart(18)} (attendu ${fmt(expected)}, écart ${fmt(got - expected)})`); failures++; }
};
check('Σ Débit antérieur', T.debitAnt, EXPECTED.totals.debitAnt);
check('Σ Crédit antérieur', T.creditAnt, EXPECTED.totals.creditAnt);
check('Σ Débit période', T.debit, EXPECTED.totals.debit);
check('Σ Crédit période', T.credit, EXPECTED.totals.credit);
check('Σ Solde débit', T.soldeDebit, EXPECTED.totals.soldeDebit);
check('Σ Solde crédit', T.soldeCredit, EXPECTED.totals.soldeCredit);

section('7. Équilibre débit/crédit');
const ecartAnt = T.debitAnt - T.creditAnt;
const ecartPer = T.debit - T.credit;
const ecartSld = T.soldeDebit - T.soldeCredit;
if (Math.abs(ecartAnt) <= EPS) ok(`Cumul antérieur équilibré (écart ${fmt(ecartAnt)})`);
else { ko(`Cumul antérieur déséquilibré : ${fmt(ecartAnt)}`); failures++; }
if (Math.abs(ecartPer) <= EPS) ok(`Période équilibrée (écart ${fmt(ecartPer)})`);
else { ko(`Période déséquilibrée : ${fmt(ecartPer)}`); failures++; }
if (Math.abs(ecartSld) <= EPS) ok(`Soldes équilibrés (écart ${fmt(ecartSld)})`);
else { ko(`Soldes déséquilibrés : ${fmt(ecartSld)}`); failures++; }

section('8. Comptes de contrôle');
for (const e of EXPECTED.controlAccounts) {
  const found = result.data.find(r => r.compte === e.compte);
  if (!found) { ko(`Compte ${e.compte} ABSENT`); failures++; continue; }
  const solde = e.sens === 'D' ? found.soldeDebit : found.soldeCredit;
  const autre = e.sens === 'D' ? found.soldeCredit : found.soldeDebit;
  if (Math.abs(solde - e.solde) <= EPS && autre <= EPS) {
    ok(`${e.compte} ${found.intitule.padEnd(22)} sens ${e.sens}  ${fmt(solde).padStart(16)}`);
  } else {
    ko(`${e.compte} ${found.intitule} : sens/solde incorrect (D=${fmt(found.soldeDebit)}, C=${fmt(found.soldeCredit)} — attendu sens ${e.sens} = ${fmt(e.solde)})`);
    failures++;
  }
}

section('RÉSULTAT');
if (failures === 0) {
  console.log(`${C.bold}${C.green}╔════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.green}║  ✓ VALIDATION RÉUSSIE — 0 critère échoué               ║${C.reset}`);
  console.log(`${C.bold}${C.green}╚════════════════════════════════════════════════════════╝${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`${C.bold}${C.red}╔════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.red}║  ✗ VALIDATION ÉCHOUÉE — ${String(failures).padStart(2)} critère(s) échoué(s)        ║${C.reset}`);
  console.log(`${C.bold}${C.red}╚════════════════════════════════════════════════════════╝${C.reset}\n`);
  process.exit(1);
}