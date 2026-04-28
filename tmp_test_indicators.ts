// Polyfill import.meta.env for node
(globalThis as any).importMetaEnv = { VITE_SUPABASE_URL: 'http://x', VITE_SUPABASE_PUBLISHABLE_KEY: 'x' };
process.env.VITE_SUPABASE_URL = 'http://x';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'x';
import * as XLSX from 'xlsx';
import { calculerResultatsM96 } from '/dev-server/src/lib/cofieple_m96engine';
// Bypass cofieple_calculations (which pulls supabase via sensNormalOverrides) — use minimal parsers inline
import { buildRowsFromSheetMatrix, normalizeRowsForOpaleImport, normalizeColumnName } from '/dev-server/src/lib/opaleImportUtils';
import { enrichParsedSdeRow, enrichParsedSdrRow } from '/dev-server/src/lib/opaleExecutionHierarchy';

function pickSheet(wb: XLSX.WorkBook, kind: 'sde'|'sdr'|'bal'): string {
  const names = wb.SheetNames;
  if (kind === 'bal') return names.find(n => normalizeColumnName(n).includes('balance')) ?? names[0];
  return names.find(n => normalizeColumnName(n).includes('ecbu')) ?? names[0];
}

function rowsFromWorkbook(path: string, kind: 'sde'|'sdr'|'bal') {
  const wb = XLSX.readFile(path, { cellDates: false, raw: false });
  const sheetName = pickSheet(wb, kind);
  const ws = wb.Sheets[sheetName];
  if (ws['!ref']) {
    let maxRow = 0;
    for (const key of Object.keys(ws)) {
      const m = key.match(/^[A-Z]+(\d+)$/);
      if (m) maxRow = Math.max(maxRow, parseInt(m[1], 10));
    }
    const ref = ws['!ref'].match(/^([A-Z]+\d+):([A-Z]+)(\d+)$/);
    if (ref && maxRow > parseInt(ref[3], 10)) ws['!ref'] = `${ref[1]}:${ref[2]}${maxRow}`;
  }
  const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '', raw: false });
  return normalizeRowsForOpaleImport(buildRowsFromSheetMatrix(matrix));
}

const sde  = parserSDE(rowsFromWorkbook('/dev-server/tmp_uploads/sde-2.xlsx', 'sde'), 'principal');
const sdr  = parserSDR(rowsFromWorkbook('/dev-server/tmp_uploads/sdr-2.xlsx', 'sdr'), 'principal');
const bal  = parserBalance(rowsFromWorkbook('/dev-server/tmp_uploads/balance.xlsx', 'bal'), 'principal');

const r = calculerResultatsM96(sde, sdr, bal);

const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

console.log('=== RÉSULTATS ATTENDUS vs OBTENUS ===');
console.log(`Taux exec dépenses : ${(r.tauxExecCharges*100).toFixed(2)}%  (att. 57.57%)`);
console.log(`Taux exec recettes : ${(r.tauxExecProduits*100).toFixed(2)}% (att. 62.14%)`);
console.log(`CAF                : ${fmt(r.cafBudgetaire)} € (att. +35 361,12)`);
console.log(`CAF comptable      : ${fmt(r.cafComptable)} €`);
console.log(`Résultat comptable : ${fmt(r.resultatComptable)} € (att. +21 429,61)`);
console.log(`BFR                : ${fmt(r.bfr)} € (att. -280 741,48)`);
console.log(`FDR par le bas     : ${fmt(r.fdrBas)} € (att. 369 461,87)`);
console.log(`FDR par le haut    : ${fmt(r.fdrHaut)} €`);
console.log(`Écart FDR          : ${fmt(r.fdrHaut - r.fdrBas)} € (att. 0)`);
console.log(`Trésorerie         : ${fmt(r.tresorerie)} € (att. 650 203,35)`);
console.log(`Réserves           : ${fmt(r.reserves)} € (att. 385 299,77)`);
console.log(`TMcap              : ${r.tmcap.toFixed(2)} % (att. 0.00)`);
console.log(`TMnr               : ${r.tmnr.toFixed(2)} % (att. 8.04)`);
console.log(`Jours FDR          : ${r.joursFdr.toFixed(2)} (att. 217.12)`);
console.log(`Jours TN           : ${r.joursTresorerie.toFixed(2)} (att. 382.11)`);
console.log(`Charges décaissables: ${fmt(r.drfn)} € (att. 612 586,06)`);
