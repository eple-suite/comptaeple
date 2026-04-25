#!/usr/bin/env node
// Vérifie que la page DataImport et les composants UI sont câblés
import fs from 'node:fs';

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };

console.log('═══ VERIFY IMPORT UI ═══');

for (const f of [
  'src/components/import/DropZoneMulti.tsx',
  'src/components/import/CrossValidationPanel.tsx',
  'src/components/import/HistoriqueImports.tsx',
  'src/components/import/RgpdSiecleNotice.tsx',
]) {
  fs.existsSync(f) ? ok(`composant : ${f}`) : ko(`manquant : ${f}`);
}

const page = fs.readFileSync('src/pages/DataImport.tsx', 'utf8');
for (const needle of [
  'DropZoneMulti', 'CrossValidationPanel', 'HistoriqueImports',
  'RgpdSiecleNotice', 'persistImport', 'detectFileType',
  'IMPORT_TYPE_LABELS', 'runCrossChecks', 'useEstablishment',
  'parseGrandLivre', 'parseEtatTiers', 'parseSiecleWorkbook',
  'parseSiecleCsv', 'parseBourses', 'parseRegies',
  'selectOpaleSdeSdrSheet', 'parseSdeRows', 'parseSdrRows',
  'selectOpaleBalanceSheet', // non-régression import balance
]) {
  page.includes(needle) ? ok(`page utilise : ${needle}`) : ko(`page n'utilise pas : ${needle}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);