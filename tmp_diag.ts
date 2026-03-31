import * as XLSX from 'xlsx';
import { buildRowsFromSheetMatrix, normalizeRowsForOpaleImport, normalizeColumnName } from './src/lib/opaleImportUtils';
import { parserSDE, parserSDR, parserBalance } from './src/lib/cofieple_calculations';
import { deriveSdeExecutionTotals, deriveSdrExecutionTotals } from './src/lib/opaleExecutionHierarchy';

function parseSheet(filePath: string, sheetName: string) {
  const wb = XLSX.readFile(filePath, { cellDates: false, raw: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error('missing');
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
  return rows;
}

function inspectSde(file: string) {
  const wb = XLSX.readFile(file, { cellDates: false, raw: false });
  for (const sn of wb.SheetNames) {
    const rows = parseSheet(file, sn);
    const parsed = parserSDE(rows, 'principal');
    const totals = deriveSdeExecutionTotals(parsed);
    const globalRows = parsed.filter(r => r.aggregationLevel === 'global');
    console.log(`SDE ${sn}: rows=${rows.length} parsed=${parsed.length} totalBudget=${totals.totalBudget.toFixed(2)} totalRealise=${totals.totalRealise.toFixed(2)} totalRate=${totals.totalForRate.toFixed(2)} globals=${globalRows.length}`);
    if (globalRows.length) {
      const top = globalRows.slice().sort((a,b)=>b.budget-a.budget)[0];
      console.log(' top global', { service: top.service, budget: top.budget, engage: top.engage, realise: top.realise, raw: top.rawLabel });
    }
  }
}

function inspectSdr(file: string) {
  const wb = XLSX.readFile(file, { cellDates: false, raw: false });
  for (const sn of wb.SheetNames) {
    const rows = parseSheet(file, sn);
    const parsed = parserSDR(rows, 'principal');
    const totals = deriveSdrExecutionTotals(parsed);
    const globalRows = parsed.filter(r => r.aggregationLevel === 'global');
    console.log(`SDR ${sn}: rows=${rows.length} parsed=${parsed.length} totalBudget=${totals.totalBudget.toFixed(2)} totalRealise=${totals.totalRealise.toFixed(2)} totalRate=${totals.totalForRate.toFixed(2)} globals=${globalRows.length}`);
    if (globalRows.length) {
      const top = globalRows.slice().sort((a,b)=>b.budget-a.budget)[0];
      console.log(' top global', { service: top.service, budget: top.budget, engage: top.engage, aor: top.aor, realise: top.realise, raw: top.rawLabel });
    }
  }
}

function inspectBalance(file: string) {
  const wb = XLSX.readFile(file, { cellDates: false, raw: false });
  for (const sn of wb.SheetNames) {
    const rows = parseSheet(file, sn);
    const parsed = parserBalance(rows, 'principal');
    const agg = parsed.filter(r => r.isAggregate);
    const c1 = agg.find(r => r.aggregateClass === '1');
    const c2 = agg.find(r => r.aggregateClass === '2');
    const c5 = parsed.filter(r => !r.isAggregate && r.compte.startsWith('5')).reduce((s,r)=>s + (r.solDbt-r.solCrd),0);
    console.log(`BAL ${sn}: rows=${rows.length} parsed=${parsed.length} agg=${agg.length} c1=${c1?`${c1.solDbt}/${c1.solCrd}`:'-'} c2=${c2?`${c2.solDbt}/${c2.solCrd}`:'-'} tresoCl5=${c5.toFixed(2)}`);
  }
}

inspectSde('/dev-server/tmp_uploads/sde-2.xlsx');
inspectSdr('/dev-server/tmp_uploads/sdr-2.xlsx');
inspectBalance('/dev-server/tmp_uploads/balance.xlsx');
