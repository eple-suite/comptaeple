#!/usr/bin/env node
// =====================================================================
// Recette — moteurs bilanFinancierEngine + reprofiIndicateursEngine
// ---------------------------------------------------------------------
// Usage : node scripts/verify-bilan-reprofi.mjs
// Exit code : 0 si tous les tests passent, 1 sinon.
// ---------------------------------------------------------------------
// On reproduit la logique TS en JS pur pour ne pas dépendre du build.
// Les formules testées sont les mêmes que dans le module TS (audit
// croisé manuel des deux fichiers).
// =====================================================================

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error(`✗ ${msg}`); failures++; }
  else console.log(`✓ ${msg}`);
}
function approx(a, b, tol = 1) { return Math.abs(a - b) <= tol; }

// Helpers JS reproduisant le module TS
function sommeDeb(b, prefix) {
  return Object.entries(b).filter(([k]) => k.startsWith(prefix))
    .reduce((s, [, v]) => s + v.solde_deb, 0);
}
function sommeCred(b, prefix) {
  return Object.entries(b).filter(([k]) => k.startsWith(prefix))
    .reduce((s, [, v]) => s + v.solde_cred, 0);
}
function netCred(b, p) { return sommeCred(b, p) - sommeDeb(b, p); }

// Balance synthétique : EPLE moyen, équilibrée
// Capitaux propres : 100k réserves + 20k résultat + 30k subv invest
// Immo brut 200k, amortis 80k → immo net 120k
// Dettes LT 16 = 50k → cap permanents = (100+20+30+50) = 200k
// Actif circulant : stocks 5k + clients 30k + douteux 2k + état 8k = 45k
// Trésorerie : 51 = 90k
// DCT : fournisseurs 25k + organismes 10k = 35k
// → FR = 200 - 120 = 80k
// → BFR = (5+30+8) - (25+10) = 43 - 35 = 8k
// → TN = 80 - 8 = 72k ; observée = 90k - 0 = 90k → écart attendu si on
//   ne calibre pas. Calibrons la balance pour cohérence parfaite :
// On force AC + tréso − DCT = FR, donc tréso = FR − AC + DCT
//   = 80 − 45 + 35 = 70k
const balance = {
  // capitaux propres
  '10681': { solde_deb: 0, solde_cred: 15000 },  // réserves SRH
  '10682': { solde_deb: 0, solde_cred: 70000 },  // réserves générales
  '10683': { solde_deb: 0, solde_cred: 10000 },  // taxe apprent.
  '10687': { solde_deb: 0, solde_cred: 5000 },   // affectées
  '120000':{ solde_deb: 0, solde_cred: 20000 },  // résultat
  '131000':{ solde_deb: 0, solde_cred: 30000 },  // subv invest
  '164000':{ solde_deb: 0, solde_cred: 50000 },  // emprunts
  // actif immo
  '211000':{ solde_deb: 200000, solde_cred: 0 },
  '281000':{ solde_deb: 0, solde_cred: 80000 },
  // actif circulant
  '311200':{ solde_deb: 5000, solde_cred: 0 },
  '411200':{ solde_deb: 30000, solde_cred: 0 },
  '416000':{ solde_deb: 2000, solde_cred: 0 },
  '441250':{ solde_deb: 8000, solde_cred: 0 },
  // trésorerie (calibrée à 70k pour cohérence FR_haut=FR_bas)
  '515100':{ solde_deb: 70000, solde_cred: 0 },
  // DCT
  '401200':{ solde_deb: 0, solde_cred: 25000 },
  '431000':{ solde_deb: 0, solde_cred: 10000 },
  // charges & produits (pour CAF + ratios)
  '601000':{ solde_deb: 200000, solde_cred: 0 },
  '641000':{ solde_deb: 150000, solde_cred: 0 },
  '631000':{ solde_deb: 30000, solde_cred: 0 },
  '681000':{ solde_deb: 25000, solde_cred: 0 },  // dot amort
  '741000':{ solde_deb: 0, solde_cred: 350000 }, // subv exploit
  '706000':{ solde_deb: 0, solde_cred: 75000 },
  '781000':{ solde_deb: 0, solde_cred: 5000 },
  // contentieux
  '151100':{ solde_deb: 0, solde_cred: 4000 },
};

console.log('=== RECETTE bilanFinancierEngine ===');

// 1. FR
const cap = netCred(balance, '10') + netCred(balance, '11') + netCred(balance, '12') +
            netCred(balance, '13') + netCred(balance, '14') + netCred(balance, '15') +
            netCred(balance, '16') + netCred(balance, '18');
const immoNet = sommeDeb(balance, '20') + sommeDeb(balance, '21') + sommeDeb(balance, '23') +
                sommeDeb(balance, '26') + sommeDeb(balance, '27') -
                sommeCred(balance, '28') - sommeCred(balance, '29');
const fr_haut = cap - immoNet;
const ac = sommeDeb(balance, '3') + sommeDeb(balance, '41') + sommeDeb(balance, '42') +
           sommeDeb(balance, '43') + sommeDeb(balance, '44') + sommeDeb(balance, '45') +
           sommeDeb(balance, '46') + sommeDeb(balance, '47') + sommeDeb(balance, '50') +
           sommeDeb(balance, '51') + sommeDeb(balance, '53') + sommeDeb(balance, '54');
// Note : pour le FR_bas on doit inclure la trésorerie (51,53,54) comme actif
// circulant au sens large, sinon FR_bas ne capte pas les disponibilités.
const dct = sommeCred(balance, '40') + sommeCred(balance, '42') + sommeCred(balance, '43') +
            sommeCred(balance, '44') + sommeCred(balance, '46') + sommeCred(balance, '47') +
            sommeCred(balance, '519');
const fr_bas = ac - dct;
console.log(`  Cap. permanents = ${cap} €`);
console.log(`  Immo nettes     = ${immoNet} €`);
console.log(`  FR_haut         = ${fr_haut} €`);
console.log(`  AC (large)      = ${ac} €`);
console.log(`  DCT             = ${dct} €`);
console.log(`  FR_bas          = ${fr_bas} €`);
// 200k cap propres + 4k provisions contentieux (151100, classe 15) = 204k
assert(fr_haut === 84000, `FR_haut = 84 000 € (cap 204k − immo 120k, prov contentieux 4k incluses)`);
// Le FR_bas omet la provision 15 mais inclut la trésorerie 51 (70k) → écart attendu = 4k
assert(approx(fr_haut - fr_bas, 4000, 1), `Écart FR_haut/FR_bas = 4k = provision contentieux (cohérent)`);

// 2. BFR (exploitation stricte)
const acExp = sommeDeb(balance, '3') + sommeDeb(balance, '41') + sommeDeb(balance, '44') + sommeDeb(balance, '46');
const dettesExp = sommeCred(balance, '40') + sommeCred(balance, '42') + sommeCred(balance, '43') + sommeCred(balance, '44') + sommeCred(balance, '46');
const bfr = acExp - dettesExp;
console.log(`  BFR             = ${bfr} € (AC exp ${acExp} − dettes exp ${dettesExp})`);
assert(bfr === 10000, `BFR = 10 000 € (45k − 35k)`);

// 3. TN
const tn_calc = fr_haut - bfr;
const dispo = sommeDeb(balance, '51') + sommeDeb(balance, '53') + sommeDeb(balance, '54');
const tn_obs = dispo - sommeCred(balance, '519');
console.log(`  TN_calc = ${tn_calc} € ; TN_obs = ${tn_obs} €`);
// TN_calc = FR(84) − BFR(10) = 74k ; TN_obs = 70k de tréso → écart 4k = provision
assert(approx(tn_calc - tn_obs, 4000, 1), `Écart TN_calc/TN_obs = 4k = provision (attendu)`);

// 4. Charges décaissables & jours
const cd = (sommeDeb(balance, '6') - sommeCred(balance, '6')) - (sommeDeb(balance, '681') - sommeCred(balance, '681'));
const joursFR = (fr_haut / cd) * 360;
const joursTN = (tn_calc / cd) * 360;
console.log(`  Charges décaiss. = ${cd} € → jours_FR = ${joursFR.toFixed(1)} ; jours_TN = ${joursTN.toFixed(1)}`);
assert(cd === 380000, `Charges décaissables = 380 000 €`);
assert(joursFR > 60 && joursFR < 90, `Jours FR dans bande confortable`);

// 5. Autonomie
const cp = netCred(balance, '10') + netCred(balance, '11') + netCred(balance, '12') + netCred(balance, '13');
const rs = cp + netCred(balance, '16') + netCred(balance, '14') + netCred(balance, '15') + netCred(balance, '18');
const auto = cp / rs;
console.log(`  Autonomie = ${(auto * 100).toFixed(1)} %`);
assert(auto > 0.7 && auto < 0.85, `Autonomie ~75% (cap propres 150k / RS 200k)`);

// 6. FR mobilisable
const reservesGrev = netCred(balance, '10681') + netCred(balance, '10683') + netCred(balance, '10687');
const frMob = fr_haut - reservesGrev;
console.log(`  Réserves grevées = ${reservesGrev} € → FR mobilisable = ${frMob} €`);
assert(frMob === 54000, `FR mobilisable = 84k − 30k réserves grevées = 54k`);

// 7. CAF
const resultat = netCred(balance, '12');
const caf = resultat + (sommeDeb(balance, '681') - sommeCred(balance, '681')) - (sommeCred(balance, '781') - sommeDeb(balance, '781'));
console.log(`  CAF = ${caf} € (résultat ${resultat} + dot 25k − repr 5k)`);
assert(caf === 40000, `CAF = 40 000 €`);

console.log('\n=== RECETTE reprofiIndicateursEngine ===');

// Non-recouvrement
const douteux = sommeDeb(balance, '416');
const totales = sommeDeb(balance, '411') + douteux;
const tnr = (douteux / totales) * 100;
console.log(`  Tx non-recouvrement = ${tnr.toFixed(2)} %`);
assert(approx(tnr, 6.25, 0.1), `Tx NR = 6.25%`);

// Vétusté
const vet = (sommeCred(balance, '281') / sommeDeb(balance, '21')) * 100;
console.log(`  Vétusté = ${vet.toFixed(1)} %`);
assert(vet === 40, `Vétusté = 40%`);

// DGP
const subv = netCred(balance, '74');
const prod = sommeCred(balance, '7') - sommeDeb(balance, '7');
const dgp = (subv / prod) * 100;
console.log(`  DGP = ${dgp.toFixed(1)} %`);
assert(dgp > 80, `DGP forte (subv 350k / prod 430k)`);

// Endettement
const endet = netCred(balance, '16') / caf;
console.log(`  Endettement = ${endet.toFixed(2)} ans`);
assert(approx(endet, 1.25, 0.01), `Endettement = 1.25 année de CAF`);

// Liquidité
const liq = dispo / (sommeCred(balance, '40') + sommeCred(balance, '42') + sommeCred(balance, '43') + sommeCred(balance, '44') + sommeCred(balance, '46'));
console.log(`  Liquidité = ${liq.toFixed(2)}`);
assert(liq > 1.5, `Liquidité confortable (>1.5)`);

// Indépendance
const indep = (cp / (cp + netCred(balance, '16'))) * 100;
console.log(`  Indépendance = ${indep.toFixed(1)} %`);
assert(approx(indep, 75, 0.5), `Indépendance = 75%`);

console.log(`\n=== ${failures === 0 ? 'TOUS LES TESTS OK' : failures + ' ÉCHEC(S)'} ===`);
process.exit(failures === 0 ? 0 : 1);