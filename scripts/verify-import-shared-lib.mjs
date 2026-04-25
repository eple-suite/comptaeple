#!/usr/bin/env node
// Vérifie que la librairie partagée src/lib/import/ existe et expose les API requises
import fs from 'node:fs';
import path from 'node:path';

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };

console.log('═══ VERIFY IMPORT SHARED LIB ═══');

const required = [
  'src/lib/import/index.ts',
  'src/lib/import/textUtils.ts',
  'src/lib/import/sheetUtils.ts',
  'src/lib/import/fileTypeDetector.ts',
  'src/lib/import/crossValidation.ts',
  'src/lib/import/importService.ts',
  'src/lib/import/parsers/grandLivreParser.ts',
  'src/lib/import/parsers/etatTiersParser.ts',
  'src/lib/import/parsers/siecleParser.ts',
  'src/lib/import/parsers/boursesParser.ts',
  'src/lib/import/parsers/regiesParser.ts',
];
for (const f of required) {
  fs.existsSync(f) ? ok(`fichier présent : ${f}`) : ko(`manquant : ${f}`);
}

const idx = fs.readFileSync('src/lib/import/index.ts', 'utf8');
for (const sym of [
  'detectFileType', 'IMPORT_TYPE_LABELS', 'parseFrenchNumber', 'parseFrenchDate',
  'detectEncoding', 'sha256Hex', 'isValidINE', 'isValidUAI',
  'scoreSheetByHeaders', 'selectBestSheet', 'runCrossChecks',
  'parseGrandLivre', 'parseEtatTiers', 'parseSiecleCsv', 'parseSiecleWorkbook',
  'parseBourses', 'parseRegies', 'RGPD_SIECLE_MENTION',
  'repairSheetRange', 'detectSeparator', 'stripBOM',
]) {
  idx.includes(sym) ? ok(`export ${sym}`) : ko(`export manquant : ${sym}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);