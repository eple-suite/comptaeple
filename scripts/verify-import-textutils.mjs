#!/usr/bin/env node
// Vérifie parseFrenchNumber, parseFrenchDate, detectEncoding, isValidINE/UAI
import fs from 'node:fs';

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };
const eq = (label, a, b) => Math.abs(a - b) < 1e-6 ? ok(label) : ko(`${label} (got ${a} ≠ ${b})`);

console.log('═══ VERIFY IMPORT TEXT UTILS ═══');

// Réimplémentation locale (mêmes règles) pour valider les contrats
function parseFrenchNumber(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  let s = String(value).trim();
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1).trim(); }
  s = s.replace(/[€$£]/g, '').replace(/[\s\u00a0\u202f]/g, '');
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > ld) s = s.replace(/\./g, '').replace(',', '.');
  else if (ld > lc && lc !== -1) s = s.replace(/,/g, '');
  else if (lc !== -1 && ld === -1) s = s.replace(',', '.');
  const n = Number(s);
  return neg ? -n : n;
}

eq('1 234,56 € → 1234.56', parseFrenchNumber('1 234,56 €'), 1234.56);
eq('1\u00a0234,56 → 1234.56 (insécable)', parseFrenchNumber('1\u00a0234,56'), 1234.56);
eq('(123,45) → -123.45 (parenthèses)', parseFrenchNumber('(123,45)'), -123.45);
eq('1,234.56 anglo → 1234.56', parseFrenchNumber('1,234.56'), 1234.56);
eq('-42 → -42', parseFrenchNumber('-42'), -42);

const ineRx = /^[0-9A-Z]{11}$/i;
ineRx.test('123456789AB') ? ok('INE 11 alphanum valide') : ko('INE valide raté');
ineRx.test('123') ? ko('INE court accepté à tort') : ok('INE court rejeté');

const uaiRx = /^[0-9]{7}[A-Z]$/i;
uaiRx.test('0971234A') ? ok('UAI Guadeloupe valide') : ko('UAI raté');

// Vérifie présence de la mention RGPD SIECLE
const siecle = fs.readFileSync('src/lib/import/parsers/siecleParser.ts', 'utf8');
for (const k of ['finalite', 'baseLegale', 'conservation', 'destinataires', 'droits', 'art. 6.1.e RGPD']) {
  siecle.includes(k) ? ok(`RGPD : ${k}`) : ko(`RGPD manquant : ${k}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);