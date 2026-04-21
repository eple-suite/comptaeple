#!/usr/bin/env node
import XLSX from 'xlsx';
import { readFileSync } from 'fs';
const [,, filePath] = process.argv;
if (!filePath) { console.error('Usage: node diagnostic-xlsx.mjs <fichier>'); process.exit(2); }
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('═══ DIAGNOSTIC FICHIER ═══');
console.log('Chemin:', filePath);
console.log('Taille:', buf.length, 'octets');
console.log('Onglets:', wb.SheetNames);
console.log('Onglet actif:', wb.SheetNames[wb.Workbook?.Views?.[0]?.activeTab ?? 0]);
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
  console.log(`\n── Onglet "${name}" ──`);
  console.log(`  Plage déclarée: ${sheet['!ref']}`);
  console.log(`  Lignes non vides: ${rows.length}`);
  console.log(`  Colonnes: ${range.e.c + 1}`);
  console.log(`  5 premières lignes:`);
  rows.slice(0, 5).forEach((r, i) => {
    const preview = r.slice(0, 10).map(v => String(v ?? '∅').slice(0, 20)).join(' | ');
    console.log(`    L${i+1}: ${preview}`);
  });
  if (rows.length > 5) {
    console.log(`  ... et ${rows.length - 5} lignes supplémentaires`);
  }
}
