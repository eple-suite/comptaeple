#!/usr/bin/env node
/**
 * Recette — Coût accompagnateurs ne peut être réparti sur familles
 * Réf : Circulaire MENE2407159C 16/7/2024 (gratuité service public d'enseignement)
 * Source contrat : src/pages/voyages-v2/lib/alertesEngine.ts (catégorie accompagnateurs_factures_familles)
 */
let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };

function evaluerAccomp(depenses) {
  const out = [];
  const blocant = (depenses || []).some(d => d.est_accompagnateur && d.poste !== 'accompagnateurs');
  if (blocant) {
    out.push({ niveau: 'rouge', bloquant: true, categorie: 'accompagnateurs_factures_familles',
      message: 'Le coût des accompagnateurs ne peut pas être réparti sur les familles (gratuité service public).',
      reference_legale: 'Circulaire MENE2407159C' });
  }
  return out;
}

console.log('═══ Recette — Coût accompagnateurs ════════════════════');

let r = evaluerAccomp([{ libelle: 'Hôtel accomp.', poste: 'hebergement', est_accompagnateur: true, montant_ttc: 1200 }]);
r.find(a => a.bloquant && a.categorie === 'accompagnateurs_factures_familles')
  ? pass('Tentative imputation accompagnateurs sur familles → bloquante')
  : fail('Bloquant attendu');

r = evaluerAccomp([{ libelle: 'Frais accomp.', poste: 'accompagnateurs', est_accompagnateur: true, montant_ttc: 1200 }]);
r.length === 0 ? pass('Ligne accompagnateurs sur poste dédié → OK') : fail('Pas d\'alerte attendue');

console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko === 0 ? 0 : 1);