import XLSX from 'xlsx';
import { readFileSync } from 'fs';
const wb = XLSX.read(readFileSync('/tmp/w105973251.xlsx'));
const sheet = wb.Sheets['Donnees'];
console.log('!ref initial:', sheet['!ref']);
console.log('Nb keys:', Object.keys(sheet).length);
const cellKeys = Object.keys(sheet).filter(k => /^[A-Z]+\d+$/.test(k));
console.log('Nb cell keys:', cellKeys.length);
let maxR = 0, maxC = 0, minR = 1e9, minC = 1e9;
for (const k of cellKeys) {
  const c = XLSX.utils.decode_cell(k);
  if (c.r > maxR) maxR = c.r;
  if (c.c > maxC) maxC = c.c;
  if (c.r < minR) minR = c.r;
  if (c.c < minC) minC = c.c;
}
console.log('Vraie plage:', `${XLSX.utils.encode_cell({r:minR,c:minC})}:${XLSX.utils.encode_cell({r:maxR,c:maxC})}`);
sheet['!ref'] = `A1:${XLSX.utils.encode_cell({r:maxR,c:maxC})}`;
const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:null, blankrows:false});
console.log('Lignes après repair:', rows.length);
console.log('Ligne 3 (en-têtes):', rows[2]?.slice(0,12));
console.log('Ligne 4 (1er compte):', rows[3]?.slice(0,12));
console.log('Ligne 91 (dernier compte):', rows[90]?.slice(0,12));
