#!/usr/bin/env node
// Vérifie que le rapport ordonnateur a 4 sections, ≥30 indicateurs,
// et aucun indicateur bilanciel (FR, BFR, TN) côté ordonnateur.
import fs from 'node:fs';
const catalog = fs.readFileSync('src/components/cofieple/ordo/cofiordo/catalog.ts', 'utf-8');
const fiches = (catalog.match(/numero: '[A-D]\.\d+'/g) || []).length;
const sections = ['A', 'B', 'C', 'D'].every(s => catalog.includes(`section: '${s}'`));
// On exclut commentaires/docstrings ; on cible les FICHES (titres, IDs).
const fichesBlock = catalog.split('export const ORDO_FICHES')[1] || '';
const interdits = ['fdr_haut', 'fdr_bas', 'bfr_total', 'tresorerie_nette',
  'calculerFR', 'calculerBFR', 'calculerTN']
  .filter(k => fichesBlock.includes(k));
console.log(`fiches: ${fiches} · sections A/B/C/D: ${sections} · termes bilanciels interdits: ${interdits.length}`);
if (!sections) { console.error('❌ sections manquantes'); process.exit(1); }
if (fiches < 30) { console.error(`❌ ${fiches} fiches < 30`); process.exit(1); }
if (interdits.length > 0) { console.error('❌ indicateurs bilanciels présents:', interdits); process.exit(1); }
console.log('✅ Rapport ordonnateur : 4 sections, ≥30 fiches, séparation stricte respectée');
process.exit(0);