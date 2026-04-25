#!/usr/bin/env node
import fs from 'node:fs';
const grp = fs.readFileSync('src/components/cofieple/VueGroupement.tsx', 'utf-8');
const page = fs.readFileSync('src/pages/CompteFinancier.tsx', 'utf-8');
const checks = [
  ['agrégation EPLE', grp.includes('cofieple_snapshots')],
  ['heatmap critique', grp.includes('heatColor')],
  ['top 5 risque', grp.includes('top5Risque')],
  ['score risque composite', grp.includes('calculerScoreRisque')],
  ['export PDF consolidé', grp.includes('exportPdf') && grp.includes('autoTable')],
  ['monté dans la page', page.includes('VueGroupement') && page.includes('vue_groupement')],
];
const failed = checks.filter(c => !c[1]);
if (failed.length > 0) { console.error('❌ manquants:', failed.map(c => c[0])); process.exit(1); }
console.log(`✅ Vue groupement : ${checks.length}/${checks.length} vérifications`);
process.exit(0);