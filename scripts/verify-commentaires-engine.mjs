// Verification script — moteur de commentaires + bloc PDF REPROFI
// Usage : node scripts/verify-commentaires-engine.mjs

import { calculerBilanComplet } from '../src/lib/compteFinancier/bilanFinancierEngine.ts';
import { calculerTousIndicateursReprofi } from '../src/lib/compteFinancier/reprofiIndicateursEngine.ts';
import { synthetiserCommentaires, commenterIndicateur, commenterReserves } from '../src/lib/compteFinancier/commentairesEngine.ts';

// ─── Balance fictive représentative d'un EPLE moyen ──────────────────
const balance = {
  // Capitaux
  '10681': { solde_deb: 0, solde_cred: 45000 },
  '10682': { solde_deb: 0, solde_cred: 320000 },
  '10683': { solde_deb: 0, solde_cred: 12000 },
  '10687': { solde_deb: 0, solde_cred: 8000 },
  '120':   { solde_deb: 0, solde_cred: 25000 },   // résultat
  '131':   { solde_deb: 0, solde_cred: 180000 },  // subv. invest.
  '164':   { solde_deb: 0, solde_cred: 95000 },   // emprunts
  // Immobilisations
  '215':   { solde_deb: 850000, solde_cred: 0 },
  '2815':  { solde_deb: 0, solde_cred: 510000 },  // amortissements
  '281':   { solde_deb: 0, solde_cred: 510000 },  // (pareil)
  // Actif circulant
  '411':   { solde_deb: 38000, solde_cred: 0 },
  '416':   { solde_deb: 4500, solde_cred: 0 },
  '47':    { solde_deb: 1200, solde_cred: 800 },
  '515':   { solde_deb: 142000, solde_cred: 0 },
  // DCT
  '401':   { solde_deb: 0, solde_cred: 12000 },
  '421':   { solde_deb: 0, solde_cred: 6000 },
  // Charges & produits
  '60':    { solde_deb: 280000, solde_cred: 0 },
  '64':    { solde_deb: 320000, solde_cred: 0 },
  '63':    { solde_deb: 18000, solde_cred: 0 },
  '681':   { solde_deb: 60000, solde_cred: 0 },
  '70':    { solde_deb: 0, solde_cred: 95000 },
  '74':    { solde_deb: 0, solde_cred: 580000 },
};

const bilan = calculerBilanComplet(balance);
const panier = calculerTousIndicateursReprofi(balance, bilan.caf.caf_additive);
const synth = synthetiserCommentaires(bilan, panier);

console.log('═══ BILAN ═══');
console.log('FR (haut)         :', Math.round(bilan.fr.fr_haut));
console.log('FR (bas)          :', Math.round(bilan.fr.fr_bas));
console.log('Cohérence FR      :', bilan.fr.coherent ? 'OK' : `KO (écart ${bilan.fr.ecart.toFixed(0)})`);
console.log('BFR               :', Math.round(bilan.bfr.bfr));
console.log('TN                :', Math.round(bilan.tn.tn_calc));
console.log('Jours FR          :', Math.round(bilan.joursFR));
console.log('Niveau FR         :', bilan.niveauFR);
console.log('CAF               :', Math.round(bilan.caf.caf_additive));

console.log('\n═══ INDICATEURS REPROFI ═══');
for (const ind of panier.indicateurs) {
  const valStr = ind.unite === '%' ? `${ind.valeur.toFixed(1)} %` : ind.valeur.toFixed(2);
  console.log(`  [${ind.niveau.padEnd(11)}] ${ind.code.padEnd(6)} ${ind.libelle.padEnd(50)} = ${valStr}`);
}

console.log('\n═══ RESERVES ═══');
console.log(commenterReserves(panier.reserves));

console.log('\n═══ SYNTHESE ═══');
console.log('Verdict :', synth.verdict);
console.log('\nResultat :');
console.log(synth.resultat);
console.log('\nBilan :');
console.log(synth.bilan);
console.log('\nReprofi :');
console.log(synth.reprofi);

console.log('\n═══ COMMENTAIRES INDIVIDUELS (echantillon) ═══');
for (const ind of panier.indicateurs.slice(0, 3)) {
  console.log(`\n• ${ind.code} - ${ind.libelle}`);
  console.log(`  → ${commenterIndicateur(ind)}`);
}

console.log('\n✅ Verification reussie.');