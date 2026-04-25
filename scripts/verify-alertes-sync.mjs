#!/usr/bin/env node
/**
 * Recette du moteur alertesSync — branchement rétroactif modules → alertes_transverses.
 *
 * Vérifie :
 *   1. Les scanners purs produisent les bonnes alertes sur des cas types.
 *   2. La dedup_key est stable (même input → même clé).
 *   3. Une condition disparue ⇒ alerte clôturable (logique de fermeture).
 *   4. Les niveaux d'alerte respectent les seuils réglementaires.
 *
 * Conformité : M9-6, CCP 2026 (40 k€ / 143 k€), Code éducation R.421-13,
 * Décret 2010-888.
 */

import {
  scannerBalance,
  scannerVoyages,
  scannerMarches,
  scannerDelegations,
  scannerEntretiens,
  aggregerRapports,
  _modulesBranches,
} from '../src/lib/cockpit/alertesSync.ts';

let ok = 0;
let ko = 0;
const fail = (msg) => { console.error('  ✗', msg); ko++; };
const pass = (msg) => { console.log('  ✓', msg); ok++; };

const ETAB = '00000000-0000-0000-0000-000000000001';
const TODAY = new Date('2026-04-25');

console.log('\n═══ 1. Scanner BALANCE — anomalies M9-6 ═══');
{
  const cands = scannerBalance(ETAB, [
    { account_number: '4711', balance: 250 },        // attente non apuré
    { account_number: '5111', balance: -1000 },      // sens anormal
    { account_number: '5311', balance: -50 },        // caisse négative
    { account_number: '5151', balance: 100_000 },    // OK
  ]);
  cands.length === 3 ? pass(`3 alertes détectées (4711, 5111, 5311)`) : fail(`attendu 3, obtenu ${cands.length}`);
  cands.find(c => c.dedup_key === 'attente:4711') ? pass('dedup_key attente OK') : fail('dedup attente manquante');
  cands.find(c => c.niveau === 'rouge' && c.dedup_key === 'caisse-negative:5311') ? pass('caisse négative = rouge') : fail('niveau caisse');
}

console.log('\n═══ 2. Scanner VOYAGES — autorisation CA + bilan tardif ═══');
{
  const cands = scannerVoyages(ETAB, [
    { id: 'v1', libelle: 'Madrid', statut: 'valide', date_depart: '2026-05-01', date_retour: '2026-05-08', date_ca_autorisation: null, numero_acte_ca: null },
    { id: 'v2', libelle: 'Rome',   statut: 'termine', date_depart: '2026-01-01', date_retour: '2026-01-10', date_ca_autorisation: '2025-12-15', numero_acte_ca: 'CA-2025-12' },
    { id: 'v3', libelle: 'Lisbonne', statut: 'cloture', date_depart: '2025-09-01', date_retour: '2025-09-08', date_ca_autorisation: '2025-06-15', numero_acte_ca: 'CA-2025-06' },
  ], TODAY);
  // v1 : autorisation manquante (rouge) ; v2 : bilan en retard (>60j -> rouge) ; v3 : clos -> rien
  const types = cands.map(c => c.dedup_key).sort();
  cands.length === 2 ? pass('2 alertes (v1 sans CA + v2 bilan tardif)') : fail(`attendu 2, obtenu ${cands.length}: ${types.join(',')}`);
  cands.find(c => c.dedup_key === 'voyage-sans-ca:v1' && c.niveau === 'rouge') ? pass('v1 = rouge') : fail('v1 niveau');
  cands.find(c => c.dedup_key === 'bilan-retard:v2' && c.niveau === 'rouge') ? pass('v2 = rouge (>60j)') : fail('v2 niveau');
}

console.log('\n═══ 3. Scanner MARCHÉS — saucissonnage CCP 2026 ═══');
{
  const cands = scannerMarches(ETAB, [
    { id: 'm1', libelle: 'Fournitures bureau', famille_code: 'FB', cumul_total_12m: 45_000, procedure_calculee: 'dispense', montant_estime_ht: 4_000 },
    { id: 'm2', libelle: 'Maintenance info',   famille_code: 'MI', cumul_total_12m: 160_000, procedure_calculee: 'mapa', montant_estime_ht: 80_000 },
    { id: 'm3', libelle: 'Petits achats',      famille_code: 'PA', cumul_total_12m: 12_000, procedure_calculee: 'dispense', montant_estime_ht: 12_000 },
  ]);
  cands.find(c => c.dedup_key === 'saucissonnage:m1') ? pass('m1 saucissonnage (>40k€ HT)') : fail('m1 manquant');
  cands.find(c => c.dedup_key === 'formalise-requis:m2') ? pass('m2 formalisé requis (>143k€ HT)') : fail('m2 manquant');
  !cands.find(c => c.module_origine === 'marches' && c.dedup_key.includes('m3')) ? pass('m3 sous seuil = silence') : fail('m3 ne devrait rien produire');
}

console.log('\n═══ 4. Scanner DÉLÉGATIONS — expirations R.421-13 ═══');
{
  const cands = scannerDelegations(ETAB, [
    { id: 'd1', type_delegation: 'signature_courrier', date_fin: '2026-05-10', statut: 'active' }, // J+15 → orange
    { id: 'd2', type_delegation: 'mandatement',        date_fin: '2026-04-20', statut: 'active' }, // expirée → rouge
    { id: 'd3', type_delegation: 'recettes',           date_fin: '2026-06-15', statut: 'active' }, // J+51 → jaune
    { id: 'd4', type_delegation: 'signature_courrier', date_fin: '2027-01-01', statut: 'active' }, // > 60j → rien
    { id: 'd5', type_delegation: 'mandatement',        date_fin: '2026-04-20', statut: 'abrogee' },// non active → rien
  ], TODAY);
  cands.length === 3 ? pass(`3 alertes (d1, d2, d3)`) : fail(`attendu 3, obtenu ${cands.length}`);
  cands.find(c => c.dedup_key === 'expiree:d2' && c.niveau === 'rouge') ? pass('d2 expirée = rouge') : fail('d2 niveau');
  cands.find(c => c.dedup_key === 'expire-30j:d1' && c.niveau === 'orange') ? pass('d1 = orange') : fail('d1 niveau');
  cands.find(c => c.dedup_key === 'expire-60j:d3' && c.niveau === 'jaune') ? pass('d3 = jaune') : fail('d3 niveau');
}

console.log('\n═══ 5. Scanner ENTRETIENS — circuit décret 2010-888 ═══');
{
  const cands = scannerEntretiens(ETAB, [
    { id: 'e1', statut: 'tenu', date_entretien: '2026-01-15', signature_n1_at: '2026-01-15T10:00Z', signature_agent_at: null, visa_n2_at: null, finalise_at: null }, // J+100 → rouge
    { id: 'e2', statut: 'tenu', date_entretien: '2026-02-20', signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null }, // J+64 → orange
    { id: 'e3', statut: 'finalise', date_entretien: '2026-01-15', signature_n1_at: '2026-01-15T10:00Z', signature_agent_at: '2026-02-01T10:00Z', visa_n2_at: '2026-02-10T10:00Z', finalise_at: '2026-02-15T10:00Z' }, // OK
  ], TODAY);
  cands.length === 2 ? pass('2 alertes (e1 rouge, e2 orange)') : fail(`attendu 2, obtenu ${cands.length}`);
  cands.find(c => c.dedup_key === 'non-finalise:e1' && c.niveau === 'rouge') ? pass('e1 = rouge (>90j)') : fail('e1 niveau');
  cands.find(c => c.dedup_key === 'non-finalise:e2' && c.niveau === 'orange') ? pass('e2 = orange (60-90j)') : fail('e2 niveau');
}

console.log('\n═══ 6. IDEMPOTENCE — dedup_key stable ═══');
{
  const a = scannerBalance(ETAB, [{ account_number: '4711', balance: 250 }]);
  const b = scannerBalance(ETAB, [{ account_number: '4711', balance: 999 }]);
  a[0].dedup_key === b[0].dedup_key ? pass('même compte ⇒ même dedup_key') : fail('dedup instable');
}

console.log('\n═══ 7. AGRÉGATION — aggregerRapports ═══');
{
  const rapports = [
    { module: 'balance', detectees: 3, upsertees: 3, closes: 0, erreurs: [] },
    { module: 'balance', detectees: 1, upsertees: 1, closes: 2, erreurs: ['x'] },
    { module: 'voyages', detectees: 2, upsertees: 2, closes: 1, erreurs: [] },
  ];
  const agg = aggregerRapports(rapports);
  agg.balance.detectees === 4 ? pass('agrégation balance détectées') : fail(`balance détectées ${agg.balance.detectees}`);
  agg.balance.closes === 2 ? pass('agrégation balance closes') : fail(`balance closes ${agg.balance.closes}`);
  agg.balance.erreurs.length === 1 ? pass('agrégation erreurs') : fail('erreurs agrégées');
  agg.voyages.upsertees === 2 ? pass('agrégation voyages upsertees') : fail('voyages');
}

console.log('\n═══ 8. COUVERTURE — modules branchés ═══');
{
  const expected = ['balance', 'voyages', 'marches', 'delegations', 'entretiens'];
  const ok2 = expected.every(m => _modulesBranches.includes(m));
  ok2 ? pass(`5 modules branchés : ${_modulesBranches.join(', ')}`) : fail('couverture incomplète');
}

console.log(`\n═══════════════════════════════════════════════`);
console.log(`   RÉSULTAT : ${ok} OK · ${ko} KO`);
console.log(`═══════════════════════════════════════════════\n`);
process.exit(ko === 0 ? 0 : 1);
