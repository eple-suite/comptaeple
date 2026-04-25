#!/usr/bin/env node
/**
 * verify-balance-anomalies.mjs — recette du moteur d'anomalies M9-6.
 * Couvre : 411X créditeur (RGP), 515900 créditeur (conforme), 467/47X
 * en clôture, 443110 débiteur, sens normal vs réel.
 * Exit 0 = succès.
 */
import { analyserBalance, statsAnomalies } from '../src/lib/balance/anomaliesEngine.ts';
import { REFERENTIEL_FALLBACK } from '../src/lib/balance/referentielFallback.ts';

const C = { g: '\x1b[32m', r: '\x1b[31m', b: '\x1b[1m', x: '\x1b[0m' };
let ok = 0, ko = 0;
const t = (label, cond) => { if (cond) { console.log(`  ${C.g}✓${C.x} ${label}`); ok++; } else { console.log(`  ${C.r}✗${C.x} ${label}`); ko++; } };

console.log(`${C.b}━━━ Recette balance anomalies M9-6 ━━━${C.x}`);

// Cas 1 : 411300 créditeur (trop-perçu famille) → critique RGP
let res = analyserBalance(
  [{ compte: '411300', libelle: 'Familles internat', debit: 0, credit: 4.30, solde: -4.30 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('411300 créditeur → 1 alerte critique RGP', res.length === 1 && res[0].niveau === 'critique' && res[0].regle === 'rgp');

// Cas 2 : 515900 créditeur (conforme) → aucune alerte
res = analyserBalance(
  [{ compte: '515900', libelle: 'Trésor placement', debit: 0, credit: 159883.26, solde: -159883.26 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('515900 créditeur conforme → 0 alerte', res.length === 0);

// Cas 3 : 515900 débiteur → critique
res = analyserBalance(
  [{ compte: '515900', libelle: 'Trésor placement', debit: 1000, credit: 0, solde: 1000 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('515900 débiteur → critique trésorerie', res.length === 1 && res[0].niveau === 'critique' && res[0].regle === 'tresorerie');

// Cas 4 : 467 non nul EN CLÔTURE → critique
res = analyserBalance(
  [{ compte: '467000', libelle: 'Comptes attente', debit: 0, credit: 1250, solde: -1250 }],
  REFERENTIEL_FALLBACK, { periode: 'cloture' });
t('467 non nul en clôture → critique', res.some((a) => a.niveau === 'critique' && a.regle === 'cloture'));

// Cas 5 : 471 non nul EN CLÔTURE → critique
res = analyserBalance(
  [{ compte: '471000', libelle: 'Recettes à classer', debit: 500, credit: 0, solde: 500 }],
  REFERENTIEL_FALLBACK, { periode: 'cloture' });
t('471 non nul en clôture → critique', res.some((a) => a.niveau === 'critique' && a.regle === 'cloture'));

// Cas 6 : 471 non nul EN COURS → conforme (variable)
res = analyserBalance(
  [{ compte: '471000', libelle: 'Recettes à classer', debit: 500, credit: 0, solde: 500 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('471 non nul en cours d\'exercice → conforme', res.length === 0);

// Cas 7 : 443110 débiteur → critique bourses
res = analyserBalance(
  [{ compte: '443110', libelle: 'Bourses', debit: 1000, credit: 0, solde: 1000 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('443110 débiteur → critique bourses', res.some((a) => a.niveau === 'critique' && a.regle === 'bourses'));

// Cas 8 : 531 créditeur → critique caisse
res = analyserBalance(
  [{ compte: '531000', libelle: 'Caisse', debit: 0, credit: 100, solde: -100 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('531 créditeur → critique caisse', res.some((a) => a.niveau === 'critique' && a.regle === 'caisse'));

// Cas 9 : 281100 débiteur (amort. terrains) → critique sens
res = analyserBalance(
  [{ compte: '281100', libelle: 'Amort. terrains', debit: 1000, credit: 0, solde: 1000 }],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('281100 amortissement débiteur → critique sens', res.some((a) => a.niveau === 'critique' && a.regle === 'sens'));

// Cas 10 : Stats agrégées
res = analyserBalance(
  [
    { compte: '411300', libelle: 'Familles', debit: 0, credit: 4, solde: -4 },
    { compte: '515100', libelle: 'Trésor', debit: 0, credit: 100, solde: -100 },
    { compte: '515900', libelle: 'Placement', debit: 1000, credit: 0, solde: 1000 },
  ],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
const s = statsAnomalies(res);
t('Stats agrégées : 3 critiques, score >= 60', s.critiques === 3 && s.scoreRisque >= 60);

// Cas 11 : balance saine → 0 alerte
res = analyserBalance(
  [
    { compte: '411200', libelle: 'Familles DP', debit: 25521, credit: 0, solde: 25521 },
    { compte: '515100', libelle: 'Trésor', debit: 496301, credit: 0, solde: 496301 },
    { compte: '515900', libelle: 'Placement', debit: 0, credit: 159883, solde: -159883 },
    { compte: '531000', libelle: 'Caisse', debit: 100, credit: 0, solde: 100 },
  ],
  REFERENTIEL_FALLBACK, { periode: 'cours' });
t('Balance saine → 0 alerte', res.length === 0);

console.log(`\n${C.b}Total : ${ok} OK, ${ko} KO${C.x}`);
process.exit(ko === 0 ? 0 : 1);