#!/usr/bin/env node
// Vérifie présence des fonctions clés pièce 14 + REPROFI AC.
import fs from 'node:fs';
const eng = fs.readFileSync('src/lib/compteFinancier/bilanFinancierEngine.ts', 'utf-8');
const rep = fs.readFileSync('src/lib/compteFinancier/reprofiIndicateursEngine.ts', 'utf-8');
const required = [
  ['calculerFR', eng], ['fr_haut', eng], ['fr_bas', eng], ['ecart', eng],
  ['calculerBFR', eng], ['calculerTN', eng], ['joursBase360', eng],
  ['calculerAutonomie', eng], ['calculerFRMobilisable', eng],
  ['calculerCAF', eng], ['calculerVariationFR', eng],
  ['calculerReserves', rep], ['reservesGenerales', rep], ['reservesSRH', rep],
  ['reservesTaxeApprent', rep], ['reservesAffectees', rep], ['reservesAutres', rep],
  ['calculerVetuste', rep], ['calculerDGP', rep], ['calculerEndettement', rep],
  ['calculerLiquidite', rep], ['calculerIndependance', rep],
];
const missing = required.filter(([k, src]) => !src.includes(k));
if (missing.length > 0) { console.error('❌ manquants:', missing.map(m => m[0])); process.exit(1); }
console.log(`✅ Pièce 14 enrichie : ${required.length}/${required.length} éléments présents`);
console.log('   FR haut/bas/écart, FR mobilisable, 5 rubriques réserves, ratios REPROFI');
process.exit(0);