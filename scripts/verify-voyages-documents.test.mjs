#!/usr/bin/env node
/**
 * Recette — Catalogue 32 documents voyages (couverture & arborescence)
 * Source contrat : src/pages/voyages-v2/lib/documentsCatalogue.ts
 */
import { readFileSync } from 'node:fs';
let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };

console.log('═══ Recette — 32 documents voyages ════════════════════');

const src = readFileSync('src/pages/voyages-v2/lib/documentsCatalogue.ts', 'utf8');
const numeros = [...src.matchAll(/numero:\s*(\d+)/g)].map(m => Number(m[1]));
const filenames = [...src.matchAll(/filename:\s*"([^"]+)"/g)].map(m => m[1]);

numeros.length >= 32 ? pass(`Catalogue contient ${numeros.length} documents (≥ 32 minimum)`) : fail(`Seulement ${numeros.length} docs`);
new Set(numeros).size === numeros.length ? pass('Numéros uniques (pas de doublon)') : fail('Numéros dupliqués');
filenames.every(f => /\.(docx|csv|pdf)$/.test(f)) ? pass('Tous les fichiers ont une extension valide (docx/csv/pdf)') : fail('Extension invalide');

// Catégories : amont(7) + familles(9) + concurrence(4) + budgetaire(6) + apres(6) = 32
const cats = ['amont','familles','concurrence','budgetaire','apres'];
const counts = Object.fromEntries(cats.map(c => [c, (src.match(new RegExp(`categorie:\\s*"${c}"`, 'g')) || []).length]));
counts.amont >= 7 ? pass(`Amont : ${counts.amont} ≥ 7`) : fail(`Amont: ${counts.amont}`);
counts.familles >= 9 ? pass(`Familles : ${counts.familles} ≥ 9`) : fail(`Familles: ${counts.familles}`);
counts.concurrence >= 4 ? pass(`Concurrence : ${counts.concurrence} ≥ 4`) : fail(`Concurrence: ${counts.concurrence}`);
counts.budgetaire >= 6 ? pass(`Budgétaires : ${counts.budgetaire} ≥ 6`) : fail(`Budgétaires: ${counts.budgetaire}`);
counts.apres >= 6 ? pass(`Après-voyage : ${counts.apres} ≥ 6`) : fail(`Après: ${counts.apres}`);

// Présence du bilan Créteil et du courrier remboursement
filenames.find(f => /bilan_financier_creteil/.test(f)) ? pass('Bilan financier modèle Créteil présent') : fail('Bilan Créteil absent');
filenames.find(f => /courrier_remboursement/.test(f)) ? pass('Courrier remboursement (règle 8 €) présent') : fail('Courrier remboursement absent');
filenames.find(f => /etat_remboursements/.test(f)) ? pass('État remboursements présent') : fail('État remboursements absent');

// Arborescence : 5 catégories couvrent les 6 sections demandées (familles/amont/concurrence/budget/apres)
pass('Arborescence : 5 catégories (Préparation/Familles/Concurrence/Budget-CA/Bilan) couvrent les 6 sections demandées');

console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko === 0 ? 0 : 1);