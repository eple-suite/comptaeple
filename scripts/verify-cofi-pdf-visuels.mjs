#!/usr/bin/env node
// Vérifie la présence du composant unifié IndicateurAvecVisuel et de l'export 3 PDF.
import fs from 'node:fs';
const ind = fs.readFileSync('src/components/cofieple/IndicateurAvecVisuel.tsx', 'utf-8');
const exp = fs.readFileSync('src/lib/compteFinancier/exportTroisPdf.ts', 'utf-8');
const btn = fs.readFileSync('src/components/cofieple/ExportTroisPdfBouton.tsx', 'utf-8');
const checks = [
  ['composant chiffres+visuel', ind.includes('Chiffres clés') && ind.includes('Visuel')],
  ['page-break-inside avoid (visuel sur même page)', ind.includes('pageBreakInside')],
  ['statuts couleur', ind.includes('STATUT_COLOR')],
  ['commentaire auto + manuel', ind.includes('commentaireAuto') && ind.includes('manuel')],
  ['generateOrdoPdf', exp.includes('generateOrdoPdf')],
  ['generateAcPdf', exp.includes('generateAcPdf')],
  ['generateAnnexePdf', exp.includes('generateAnnexePdf')],
  ['generateZipBundle', exp.includes('generateZipBundle')],
  ['filigrane PROJET', exp.includes('drawWatermark') && exp.includes('PROJET')],
  ['en-tête institutionnel RF/MEN', exp.includes('RÉPUBLIQUE FRANÇAISE') && exp.includes('Éducation nationale')],
  ['bouton UI', btn.includes('Export Compte Financier')],
];
const failed = checks.filter(c => !c[1]);
if (failed.length > 0) { console.error('❌ manquants:', failed.map(c => c[0])); process.exit(1); }
console.log(`✅ PDF visuels intégrés : ${checks.length}/${checks.length} vérifications`);
process.exit(0);