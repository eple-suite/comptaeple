#!/usr/bin/env node
/**
 * verify-balance-predictif.mjs — recette des 6 projections.
 * Exit 0 = succès.
 */
import { lancerProjections, projectionAttente, projectionErosion } from '../src/lib/balance/predictifEngine.ts';

const C = { g: '\x1b[32m', r: '\x1b[31m', b: '\x1b[1m', x: '\x1b[0m' };
let ok = 0, ko = 0;
const t = (label, cond) => { if (cond) { console.log(`  ${C.g}✓${C.x} ${label}`); ok++; } else { console.log(`  ${C.r}✗${C.x} ${label}`); ko++; } };

console.log(`${C.b}━━━ Recette balance prédictif ━━━${C.x}`);

const mk = (date, attente, tresor) => ({
  date: new Date(date), year: 2026,
  lignes: [
    { compte: '467000', libelle: 'Att', debit: 0, credit: attente, solde: -attente },
    { compte: '515100', libelle: 'Tré', debit: tresor, credit: 0, solde: tresor },
    { compte: '4112', libelle: 'Fam', debit: 1000, credit: 0, solde: 1000 },
    { compte: '7062', libelle: 'DP', debit: 0, credit: 5000, solde: -5000 },
    { compte: '6021', libelle: 'Den', debit: 6000, credit: 0, solde: 6000 },
    { compte: '4411', libelle: 'Sub', debit: 0, credit: 10000, solde: -10000 },
    { compte: '6', libelle: 'Cl6', debit: 3000, credit: 0, solde: 3000 },
    { compte: '7', libelle: 'Cl7', debit: 0, credit: 8000, solde: -8000 },
  ],
});

// Projection attente : croissance détectée
const snapsCroiss = [mk('2026-01-31', 1000, 100000), mk('2026-02-28', 3000, 95000), mk('2026-03-31', 7000, 88000)];
const projAtt = projectionAttente(snapsCroiss);
t('Projection attente détecte croissance', projAtt.niveau === 'rouge' || projAtt.niveau === 'orange');

// Projection érosion : trésorerie en baisse
const projEro = projectionErosion(snapsCroiss, 30000);
t('Projection érosion : niveau actif', projEro.niveau !== 'info');
t('Projection érosion : valeur finie', isFinite(projEro.valeur));

// Lancer toutes les projections
const result = lancerProjections(snapsCroiss, { fonctionnementMensuel: 30000, moisEcoules: 3 });
t('6 projections produites', result.projections.length === 6);
t('Score de risque entre 0 et 100', result.scoreRisque >= 0 && result.scoreRisque <= 100);
t('Top vigilance non vide (cas dégradé)', result.topVigilance.length > 0);

// Cas stable : trésorerie stable, attente nulle → score faible
const snapsStables = [mk('2026-01-31', 0, 100000), mk('2026-02-28', 0, 100000), mk('2026-03-31', 0, 100000)];
const stable = lancerProjections(snapsStables, { fonctionnementMensuel: 30000, moisEcoules: 3 });
t('Cas stable : pas de niveau rouge sur attente', stable.projections.find(p => p.id === 'attente').niveau !== 'rouge');

// Projection résultat exercice
t('Projection résultat exercice présente', result.projections.some(p => p.id === 'resultat_exercice'));
t('Projection SRH présente', result.projections.some(p => p.id === 'desequilibre_srh'));
t('Projection sous-conso subventions présente', result.projections.some(p => p.id === 'sous_conso_subv'));

console.log(`\n${C.b}Total : ${ok} OK, ${ko} KO${C.x}`);
process.exit(ko === 0 ? 0 : 1);