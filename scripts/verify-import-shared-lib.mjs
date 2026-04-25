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

// Vérifie soit présence dans index.ts, soit dans un fichier source réexporté
const idx = fs.readFileSync('src/lib/import/index.ts', 'utf8');
const sourceFiles = [
  'src/lib/import/textUtils.ts',
  'src/lib/import/sheetUtils.ts',
  'src/lib/import/fileTypeDetector.ts',
  'src/lib/import/crossValidation.ts',
  'src/lib/import/parsers/grandLivreParser.ts',
  'src/lib/import/parsers/etatTiersParser.ts',
  'src/lib/import/parsers/siecleParser.ts',
  'src/lib/import/parsers/boursesParser.ts',
  'src/lib/import/parsers/regiesParser.ts',
].map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const all = idx + '\n' + sourceFiles;
for (const sym of [
  'detectFileType', 'IMPORT_TYPE_LABELS', 'parseFrenchNumber', 'parseFrenchDate',
  'detectEncoding', 'sha256Hex', 'isValidINE', 'isValidUAI',
  'scoreSheetByHeaders', 'selectBestSheet', 'runCrossChecks',
  'parseGrandLivre', 'parseEtatTiers', 'parseSiecleCsv', 'parseSiecleWorkbook',
  'parseBourses', 'parseRegies', 'RGPD_SIECLE_MENTION',
  'repairSheetRange', 'detectSeparator', 'stripBOM',
]) {
  all.includes(`export function ${sym}`) || all.includes(`export const ${sym}`) || all.includes(sym)
    ? ok(`symbole exposé : ${sym}`)
    : ko(`symbole manquant : ${sym}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);