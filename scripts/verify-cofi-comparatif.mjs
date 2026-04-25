#!/usr/bin/env node
// Vérifie la présence de la couche pluriannuelle (N à N-4).
import fs from 'node:fs';
const plu = fs.readFileSync('src/components/cofieple/PluriannuelSection.tsx', 'utf-8');
const checks = [
  ['saisie pluriannuelle N-4', /N-?4|n_4|annee_n4/i.test(plu)],
  ['comparatif multi-exercices', /N-?1.*N-?2|exercice/i.test(plu)],
];
const failed = checks.filter(c => !c[1]);
if (failed.length > 0) { console.error('❌ manquants:', failed.map(c => c[0])); process.exit(1); }
console.log(`✅ Comparatif inter-exercices : ${checks.length}/${checks.length} vérifications`);
process.exit(0);