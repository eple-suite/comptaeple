import * as XLSX from 'xlsx';
import { buildRowsFromSheetMatrix, normalizeRowsForOpaleImport, normalizeColumnName } from './src/lib/opaleImportUtils';
import { parserSDE, parserSDR, parserBalance, calculerResultats } from './src/lib/cofieple_calculations';

function pickSheet(wb: XLSX.WorkBook, kind: 'sde'|'sdr'|'bal'): string {
  const names = wb.SheetNames;
  const norm = names.map((n) => ({ n, k: normalizeColumnName(n) }));
  if (kind === 'bal') {
    return norm.find((x) => x.k.includes('balance'))?.n ?? names[0];
  }
  return norm.find((x) => x.k.includes('ecbu'))?.n ?? names[0];
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
  const matrix = XLSX.utils.sheet_to_json<(string|number|boolean|null|undefined)[]>(ws, { header: 1, defval: '', raw: false });
  const rows = normalizeRowsForOpaleImport(buildRowsFromSheetMatrix(matrix));
  return { rows, sheetName };
}

const sdeNRaw = rowsFromWorkbook('/dev-server/tmp_uploads/sde-2.xlsx', 'sde');
const sdrNRaw = rowsFromWorkbook('/dev-server/tmp_uploads/sdr-2.xlsx', 'sdr');
const balNRaw = rowsFromWorkbook('/dev-server/tmp_uploads/balance.xlsx', 'bal');
const sdeN1Raw = rowsFromWorkbook('/dev-server/tmp_uploads/sde-1.xlsx', 'sde');
const sdrN1Raw = rowsFromWorkbook('/dev-server/tmp_uploads/sdr-1.xlsx', 'sdr');
const balN1Raw = rowsFromWorkbook('/dev-server/tmp_uploads/balance-1-2.xlsx', 'bal');

const sdeN = parserSDE(sdeNRaw.rows, 'principal');
const sdrN = parserSDR(sdrNRaw.rows, 'principal');
const balN = parserBalance(balNRaw.rows, 'principal');
const sdeN1 = parserSDE(sdeN1Raw.rows, 'principal');
const sdrN1 = parserSDR(sdrN1Raw.rows, 'principal');
const balN1 = parserBalance(balN1Raw.rows, 'principal');

const r = calculerResultats(sdeN, sdrN, balN, sdeN1, sdrN1, balN1, 'principal');

console.log(JSON.stringify({
  sheets: {
    sdeN: sdeNRaw.sheetName,
    sdrN: sdrNRaw.sheetName,
    balN: balNRaw.sheetName,
    sdeN1: sdeN1Raw.sheetName,
    sdrN1: sdrN1Raw.sheetName,
    balN1: balN1Raw.sheetName,
  },
  expectedFromEcbu: {
    depensesRealiseN: 810495.94,
    recettesRealiseN: 793266.68,
    depensesRealiseN1: 853696.88,
    recettesRealiseN1: 937347.28,
  },
  indicators: {
    totalChargesSde: r.totalChargesSde,
    totalProduitsSdr: r.totalProduitsSdr,
    tauxExecChargesPct: r.tauxExecCharges * 100,
    tauxExecProduitsPct: r.tauxExecProduits * 100,
    fdr: r.fdrBas,
    bfr: r.bfr,
    tresorerie: r.tresorerie,
    ratioAutonomieFinanciere: r.ratioAutonomieFinanciere,
    joursAutonomie: r.joursAutonomie,
    n1Charges: r.totalChargesSdeN1,
    n1Produits: r.totalProduitsSdrN1,
  }
}, null, 2));
