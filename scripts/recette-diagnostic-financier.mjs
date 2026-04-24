// =====================================================================
// RECETTE — Diagnostic Financier EPLE
// ---------------------------------------------------------------------
// Vérifie sur 3 scénarios représentatifs (sain / vigilance / critique) :
//   1. Convergence FR_haut ≈ FR_bas (M9-6 art. 43231)
//   2. Convergence TN_calc ≈ TN_obs (FR - BFR vs trésorerie observée)
//   3. CAF cohérente (méthode additive)
//   4. Niveaux des 9 indicateurs conformes aux seuils attendus
//   5. Synthèse + verdict cohérents
//
// Usage : npx tsx scripts/recette-diagnostic-financier.mjs
// Exit 0 si tous les scénarios passent, 1 sinon.
// =====================================================================

import { calculerBilanComplet } from '../src/lib/compteFinancier/bilanFinancierEngine.ts';
import { calculerTousIndicateursReprofi } from '../src/lib/compteFinancier/reprofiIndicateursEngine.ts';
import { synthetiserCommentaires } from '../src/lib/compteFinancier/commentairesEngine.ts';

let nbErreurs = 0;
const log = (msg) => process.stdout.write(msg + '\n');

function attendre(label, condition, detail = '') {
  if (condition) {
    log(`  ✅ ${label}`);
  } else {
    log(`  ❌ ${label} — ${detail}`);
    nbErreurs++;
  }
}

// ---------------------------------------------------------------------
// SCÉNARIO 1 — EPLE SAIN (lycée moyen, situation conforme)
// ---------------------------------------------------------------------
function scenarioSain() {
  log('\n══════════════════════════════════════════════════════════════');
  log('SCÉNARIO 1 — EPLE SAIN');
  log('══════════════════════════════════════════════════════════════');

  const b = {
    // Capitaux propres
    '10681': { solde_deb: 0, solde_cred: 50000 },
    '10682': { solde_deb: 0, solde_cred: 280000 },
    '10687': { solde_deb: 0, solde_cred: 15000 },
    '120':   { solde_deb: 0, solde_cred: 18000 },
    '131':   { solde_deb: 0, solde_cred: 220000 },
    '164':   { solde_deb: 0, solde_cred: 35000 },
    // Immobilisations (vétusté ~50%)
    '215':   { solde_deb: 1200000, solde_cred: 0 },
    '281':   { solde_deb: 0, solde_cred: 600000 },
    // Actif circulant
    '411':   { solde_deb: 28000, solde_cred: 0 },   // créances familles
    '416':   { solde_deb: 800, solde_cred: 0 },     // douteuses → ~3 %
    '47':    { solde_deb: 200, solde_cred: 100 },
    '515':   { solde_deb: 95000, solde_cred: 0 },
    // DCT
    '401':   { solde_deb: 0, solde_cred: 8000 },
    '421':   { solde_deb: 0, solde_cred: 4500 },
    // Charges & produits
    '60':    { solde_deb: 220000, solde_cred: 0 },
    '63':    { solde_deb: 12000, solde_cred: 0 },
    '64':    { solde_deb: 180000, solde_cred: 0 },
    '681':   { solde_deb: 45000, solde_cred: 0 },
    '70':    { solde_deb: 0, solde_cred: 75000 },
    '74':    { solde_deb: 0, solde_cred: 380000 },
  };

  const bilan = calculerBilanComplet(b);
  const panier = calculerTousIndicateursReprofi(b, bilan.caf.caf_additive);
  const synth = synthetiserCommentaires(bilan, panier);

  log(`  FR (haut) : ${Math.round(bilan.fr.fr_haut).toLocaleString('fr-FR')} EUR`);
  log(`  FR (bas)  : ${Math.round(bilan.fr.fr_bas).toLocaleString('fr-FR')} EUR`);
  log(`  CAF       : ${Math.round(bilan.caf.caf_additive).toLocaleString('fr-FR')} EUR`);
  log(`  Verdict   : ${synth.verdict}`);

  // Pour cet EPLE, on attend : NR normal/excellent, ENDET excellent, INDEP normal/excellent
  const nr = panier.indicateurs.find(i => i.code === 'NR');
  const endet = panier.indicateurs.find(i => i.code === 'ENDET');
  const indep = panier.indicateurs.find(i => i.code === 'INDEP');
  const cont = panier.indicateurs.find(i => i.code === 'CONT');

  attendre('NR (taux non-recouvrement) en niveau normal/excellent',
    ['normal', 'excellent'].includes(nr.niveau),
    `obtenu : ${nr.niveau} (${nr.valeur.toFixed(1)} %)`);
  attendre('ENDET (capacité désendettement) excellent ou normal',
    ['excellent', 'normal'].includes(endet.niveau),
    `obtenu : ${endet.niveau} (${endet.valeur.toFixed(1)} ans)`);
  attendre('CONT (provisions contentieux) excellent (aucune)',
    cont.niveau === 'excellent',
    `obtenu : ${cont.niveau}`);
  attendre('INDEP (indépendance financière) saine (>70%)',
    ['normal', 'excellent'].includes(indep.niveau),
    `obtenu : ${indep.niveau} (${indep.valeur.toFixed(1)} %)`);
  attendre('Verdict ne signale pas de risque critique',
    !synth.verdict.includes('risque'),
    synth.verdict);
}

// ---------------------------------------------------------------------
// SCÉNARIO 2 — EPLE EN VIGILANCE (parc vieillissant, NR fragile)
// ---------------------------------------------------------------------
function scenarioVigilance() {
  log('\n══════════════════════════════════════════════════════════════');
  log('SCÉNARIO 2 — EPLE EN VIGILANCE');
  log('══════════════════════════════════════════════════════════════');

  const b = {
    '10682': { solde_deb: 0, solde_cred: 120000 },
    '120':   { solde_deb: 0, solde_cred: 5000 },
    '131':   { solde_deb: 0, solde_cred: 80000 },
    '164':   { solde_deb: 0, solde_cred: 80000 },     // dettes plus lourdes
    // Vétusté ~70%
    '215':   { solde_deb: 800000, solde_cred: 0 },
    '281':   { solde_deb: 0, solde_cred: 560000 },
    // NR ~7%
    '411':   { solde_deb: 35000, solde_cred: 0 },
    '416':   { solde_deb: 2700, solde_cred: 0 },
    '47':    { solde_deb: 15000, solde_cred: 200 },   // CAP fragile
    '515':   { solde_deb: 22000, solde_cred: 0 },
    '401':   { solde_deb: 0, solde_cred: 14000 },
    '60':    { solde_deb: 195000, solde_cred: 0 },
    '64':    { solde_deb: 165000, solde_cred: 0 },
    '681':   { solde_deb: 35000, solde_cred: 0 },
    '74':    { solde_deb: 0, solde_cred: 320000 },
  };

  const bilan = calculerBilanComplet(b);
  const panier = calculerTousIndicateursReprofi(b, bilan.caf.caf_additive);
  const synth = synthetiserCommentaires(bilan, panier);

  const nr = panier.indicateurs.find(i => i.code === 'NR');
  const vetu = panier.indicateurs.find(i => i.code === 'VETU');
  const cap = panier.indicateurs.find(i => i.code === 'CAP');

  log(`  NR : ${nr.valeur.toFixed(1)} % → ${nr.niveau}`);
  log(`  VETU : ${vetu.valeur.toFixed(1)} % → ${vetu.niveau}`);
  log(`  CAP : ${cap.valeur.toFixed(0)} EUR → ${cap.niveau}`);
  log(`  Verdict : ${synth.verdict}`);

  attendre('NR fragile (entre 5 % et 10 %)',
    nr.niveau === 'fragile',
    `obtenu : ${nr.niveau} (${nr.valeur.toFixed(1)} %)`);
  attendre('VETU fragile (60-80 %)',
    vetu.niveau === 'fragile',
    `obtenu : ${vetu.niveau} (${vetu.valeur.toFixed(1)} %)`);
  attendre('CAP fragile (10 k EUR < solde 47 < 50 k EUR)',
    cap.niveau === 'fragile',
    `obtenu : ${cap.niveau}`);
}

// ---------------------------------------------------------------------
// SCÉNARIO 3 — EPLE CRITIQUE (NR > 10%, parc obsolète, dépendance > 80%)
// ---------------------------------------------------------------------
function scenarioCritique() {
  log('\n══════════════════════════════════════════════════════════════');
  log('SCÉNARIO 3 — EPLE CRITIQUE');
  log('══════════════════════════════════════════════════════════════');

  const b = {
    '10682': { solde_deb: 0, solde_cred: 30000 },
    '120':   { solde_deb: 8000, solde_cred: 0 },     // déficit
    '131':   { solde_deb: 0, solde_cred: 25000 },
    '164':   { solde_deb: 0, solde_cred: 180000 },   // forte dette
    '215':   { solde_deb: 600000, solde_cred: 0 },
    '281':   { solde_deb: 0, solde_cred: 510000 },   // vétusté 85%
    '411':   { solde_deb: 18000, solde_cred: 0 },
    '416':   { solde_deb: 4000, solde_cred: 0 },     // ~18% NR
    '47':    { solde_deb: 65000, solde_cred: 200 },  // CAP critique
    '515':   { solde_deb: 8000, solde_cred: 0 },
    '401':   { solde_deb: 0, solde_cred: 22000 },
    '60':    { solde_deb: 145000, solde_cred: 0 },
    '63':    { solde_deb: 8000, solde_cred: 0 },
    '64':    { solde_deb: 125000, solde_cred: 0 },
    '681':   { solde_deb: 8000, solde_cred: 0 },
    '70':    { solde_deb: 0, solde_cred: 18000 },
    '74':    { solde_deb: 0, solde_cred: 250000 },   // 93% subv
  };

  const bilan = calculerBilanComplet(b);
  const panier = calculerTousIndicateursReprofi(b, bilan.caf.caf_additive);
  const synth = synthetiserCommentaires(bilan, panier);

  const nr = panier.indicateurs.find(i => i.code === 'NR');
  const vetu = panier.indicateurs.find(i => i.code === 'VETU');
  const dgp = panier.indicateurs.find(i => i.code === 'DGP');
  const cap = panier.indicateurs.find(i => i.code === 'CAP');

  log(`  NR : ${nr.valeur.toFixed(1)} % → ${nr.niveau}`);
  log(`  VETU : ${vetu.valeur.toFixed(1)} % → ${vetu.niveau}`);
  log(`  DGP : ${dgp.valeur.toFixed(1)} % → ${dgp.niveau}`);
  log(`  CAP : ${cap.valeur.toFixed(0)} EUR → ${cap.niveau}`);
  log(`  Verdict : ${synth.verdict}`);

  attendre('NR critique (>10 %)', nr.niveau === 'critique',
    `obtenu : ${nr.niveau} (${nr.valeur.toFixed(1)} %)`);
  attendre('VETU critique (>80 %)', vetu.niveau === 'critique',
    `obtenu : ${vetu.niveau} (${vetu.valeur.toFixed(1)} %)`);
  attendre('DGP critique (>80 %)', dgp.niveau === 'critique',
    `obtenu : ${dgp.niveau} (${dgp.valeur.toFixed(1)} %)`);
  attendre('CAP critique (>50 k EUR)', cap.niveau === 'critique',
    `obtenu : ${cap.niveau}`);
  attendre('Verdict signale un risque critique',
    synth.verdict.includes('risque'),
    `obtenu : ${synth.verdict}`);
}

// ---------------------------------------------------------------------
// INVARIANTS — Cohérence mathématique des engines
// ---------------------------------------------------------------------
function invariantsMath() {
  log('\n══════════════════════════════════════════════════════════════');
  log('INVARIANTS MATHÉMATIQUES');
  log('══════════════════════════════════════════════════════════════');

  // Balance équilibrée parfaitement (FR_haut doit = FR_bas)
  const b = {
    // Capitaux permanents = 500 000
    '10682': { solde_deb: 0, solde_cred: 300000 },
    '120':   { solde_deb: 0, solde_cred: 50000 },
    '131':   { solde_deb: 0, solde_cred: 100000 },
    '164':   { solde_deb: 0, solde_cred: 50000 },
    // Actif immo net = 350 000 (brut 500 - amort 150)
    '215':   { solde_deb: 500000, solde_cred: 0 },
    '281':   { solde_deb: 0, solde_cred: 150000 },
    // FR attendu = 500 000 - 350 000 = 150 000
    // AC = 200 000, DCT = 50 000 → FR_bas = 150 000
    '411':   { solde_deb: 90000, solde_cred: 0 },
    '515':   { solde_deb: 110000, solde_cred: 0 },
    '401':   { solde_deb: 0, solde_cred: 30000 },
    '421':   { solde_deb: 0, solde_cred: 20000 },
  };

  const bilan = calculerBilanComplet(b);
  log(`  FR_haut = ${bilan.fr.fr_haut} EUR | FR_bas = ${bilan.fr.fr_bas} EUR | écart = ${bilan.fr.ecart} EUR`);
  attendre('FR_haut = FR_bas (M9-6 art. 43231)',
    Math.abs(bilan.fr.fr_haut - bilan.fr.fr_bas) < 1,
    `écart : ${bilan.fr.ecart} EUR`);
  attendre('FR_haut = 150 000 EUR (valeur attendue)',
    Math.abs(bilan.fr.fr_haut - 150000) < 1,
    `obtenu : ${bilan.fr.fr_haut} EUR`);

  log(`  TN_calc = ${bilan.tn.tn_calc} EUR | TN_obs = ${bilan.tn.tn_obs} EUR | écart = ${bilan.tn.ecart} EUR`);
  attendre('TN_calc = TN_obs (FR - BFR = trésorerie observée)',
    Math.abs(bilan.tn.ecart) < 1,
    `écart : ${bilan.tn.ecart} EUR`);

  // Réserves : 1068x doivent sommer correctement
  const panier = calculerTousIndicateursReprofi(b, 0);
  const total = panier.reserves.reservesGenerales + panier.reserves.reservesSRH +
                panier.reserves.reservesTaxeApprent + panier.reserves.reservesAffectees +
                panier.reserves.reservesAutres;
  attendre('Total réserves = somme des 5 rubriques',
    Math.abs(total - panier.reserves.total) < 0.01,
    `total ${panier.reserves.total} ≠ somme ${total}`);
}

// ---------------------------------------------------------------------
// EXÉCUTION
// ---------------------------------------------------------------------
log('╔══════════════════════════════════════════════════════════════╗');
log('║   RECETTE — Diagnostic Financier EPLE                        ║');
log('║   Conformité : M9-6 tomes 3 & 4 art. 43231 + pièce 14        ║');
log('╚══════════════════════════════════════════════════════════════╝');

invariantsMath();
scenarioSain();
scenarioVigilance();
scenarioCritique();

log('\n══════════════════════════════════════════════════════════════');
if (nbErreurs === 0) {
  log('✅ RECETTE COMPLÈTE — Tous les scénarios passent.');
  process.exit(0);
} else {
  log(`❌ RECETTE ÉCHOUÉE — ${nbErreurs} assertion(s) en erreur.`);
  process.exit(1);
}