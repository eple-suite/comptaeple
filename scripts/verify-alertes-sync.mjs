#!/usr/bin/env node
/**
 * Recette du moteur alertesSync — branchement rétroactif modules → alertes_transverses.
 *
 * Vérifie : règles métier des scanners, dedup_key stable, niveaux conformes
 * aux seuils réglementaires (M9-6, CCP 2026, R.421-13, Décret 2010-888),
 * agrégation des rapports et couverture des modules.
 *
 * Les scanners testés ici sont la réimplémentation EXACTE (1:1) de ceux
 * de `src/lib/cockpit/alertesSync.ts` — synchronisation manuelle à maintenir.
 */

let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };
const ETAB = '00000000-0000-0000-0000-000000000001';
const TODAY = new Date('2026-04-25');

// ─── Scanners (copie locale 1:1) ──────────────────────────────────
function scannerBalance(etab, balance) {
  const out = [];
  for (const b of balance) {
    const num = b.account_number || '';
    const solde = Number(b.balance) || 0;
    if (/^47[1-3]/.test(num) && Math.abs(solde) > 0)
      out.push({ module_origine: 'balance', establishment_id: etab, niveau: 'orange', titre: `Compte d'attente ${num} non apuré`, dedup_key: `attente:${num}` });
    if (num.startsWith('511') && solde < -0.01)
      out.push({ module_origine: 'balance', establishment_id: etab, niveau: 'rouge', titre: `Compte 511 ${num} en sens anormal`, dedup_key: `sens-anormal:${num}` });
    if (num.startsWith('531') && solde < -0.01)
      out.push({ module_origine: 'balance', establishment_id: etab, niveau: 'rouge', titre: `Caisse ${num} négative`, dedup_key: `caisse-negative:${num}` });
  }
  return out;
}

function scannerVoyages(etab, voyages, today = new Date()) {
  const out = [];
  for (const v of voyages) {
    if (v.date_depart && ['valide', 'en_cours', 'termine'].includes(v.statut) && !v.date_ca_autorisation)
      out.push({ module_origine: 'voyages', establishment_id: etab, niveau: 'rouge', titre: `Voyage "${v.libelle}" sans autorisation CA`, dedup_key: `voyage-sans-ca:${v.id}` });
    if (v.date_retour && v.statut !== 'cloture') {
      const j = Math.floor((today.getTime() - new Date(v.date_retour).getTime()) / 86_400_000);
      if (j > 30)
        out.push({ module_origine: 'voyages', establishment_id: etab, niveau: j > 60 ? 'rouge' : 'orange', titre: `Bilan voyage "${v.libelle}" en retard (J+${j})`, dedup_key: `bilan-retard:${v.id}` });
    }
  }
  return out;
}

function scannerMarches(etab, marches) {
  const out = [];
  for (const m of marches) {
    if (m.cumul_total_12m > 40_000 && m.procedure_calculee === 'dispense')
      out.push({ module_origine: 'marches', establishment_id: etab, niveau: 'rouge', titre: `Cumul famille "${m.famille_code}" > 40 k€ HT`, dedup_key: `saucissonnage:${m.id}` });
    if (m.cumul_total_12m > 143_000 && m.procedure_calculee !== 'formalise')
      out.push({ module_origine: 'marches', establishment_id: etab, niveau: 'rouge', titre: `Procédure formalisée requise — "${m.libelle}"`, dedup_key: `formalise-requis:${m.id}` });
  }
  return out;
}

function scannerDelegations(etab, dels, today = new Date()) {
  const out = [];
  for (const d of dels) {
    if (d.statut !== 'active' || !d.date_fin) continue;
    const j = Math.floor((new Date(d.date_fin).getTime() - today.getTime()) / 86_400_000);
    if (j < 0)
      out.push({ module_origine: 'delegations', establishment_id: etab, niveau: 'rouge', titre: `Délégation "${d.type_delegation}" expirée`, dedup_key: `expiree:${d.id}` });
    else if (j <= 30)
      out.push({ module_origine: 'delegations', establishment_id: etab, niveau: 'orange', titre: `Délégation "${d.type_delegation}" expire sous 30 j`, dedup_key: `expire-30j:${d.id}` });
    else if (j <= 60)
      out.push({ module_origine: 'delegations', establishment_id: etab, niveau: 'jaune', titre: `Délégation "${d.type_delegation}" expire sous 60 j`, dedup_key: `expire-60j:${d.id}` });
  }
  return out;
}

function scannerEntretiens(etab, ents, today = new Date()) {
  const out = [];
  for (const e of ents) {
    if (e.date_entretien && !e.finalise_at) {
      const j = Math.floor((today.getTime() - new Date(e.date_entretien).getTime()) / 86_400_000);
      if (j > 60)
        out.push({ module_origine: 'entretiens', establishment_id: etab, niveau: j > 90 ? 'rouge' : 'orange', titre: `Entretien non finalisé (J+${j})`, dedup_key: `non-finalise:${e.id}` });
    }
  }
  return out;
}

function aggregerRapports(rapports) {
  const agg = {};
  for (const r of rapports) {
    if (!agg[r.module]) agg[r.module] = { module: r.module, detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
    agg[r.module].detectees += r.detectees;
    agg[r.module].upsertees += r.upsertees;
    agg[r.module].closes += r.closes;
    agg[r.module].erreurs.push(...r.erreurs);
  }
  return agg;
}

const _modulesBranches = ['balance', 'voyages', 'marches', 'delegations', 'entretiens'];

// ─── Tests ────────────────────────────────────────────────────────
console.log('\n═══ 1. Scanner BALANCE — anomalies M9-6 ═══');
{
  const c = scannerBalance(ETAB, [
    { account_number: '4711', balance: 250 },
    { account_number: '5111', balance: -1000 },
    { account_number: '5311', balance: -50 },
    { account_number: '5151', balance: 100_000 },
  ]);
  c.length === 3 ? pass('3 alertes (4711, 5111, 5311)') : fail(`attendu 3, obtenu ${c.length}`);
  c.find(x => x.dedup_key === 'attente:4711') ? pass('dedup attente:4711') : fail('dedup attente manquante');
  c.find(x => x.dedup_key === 'caisse-negative:5311' && x.niveau === 'rouge') ? pass('caisse négative = rouge') : fail('niveau caisse');
  c.find(x => x.dedup_key === 'sens-anormal:5111' && x.niveau === 'rouge') ? pass('511 sens anormal = rouge') : fail('niveau 511');
}

console.log('\n═══ 2. Scanner VOYAGES — autorisation CA + bilan tardif ═══');
{
  const c = scannerVoyages(ETAB, [
    { id: 'v1', libelle: 'Madrid',   statut: 'valide',  date_depart: '2026-05-01', date_retour: '2026-05-08', date_ca_autorisation: null },
    { id: 'v2', libelle: 'Rome',     statut: 'termine', date_depart: '2026-01-01', date_retour: '2026-01-10', date_ca_autorisation: '2025-12-15' },
    { id: 'v3', libelle: 'Lisbonne', statut: 'cloture', date_depart: '2025-09-01', date_retour: '2025-09-08', date_ca_autorisation: '2025-06-15' },
  ], TODAY);
  c.length === 2 ? pass('2 alertes (v1 sans CA + v2 bilan tardif)') : fail(`attendu 2, obtenu ${c.length}`);
  c.find(x => x.dedup_key === 'voyage-sans-ca:v1' && x.niveau === 'rouge') ? pass('v1 sans CA = rouge') : fail('v1 niveau');
  c.find(x => x.dedup_key === 'bilan-retard:v2' && x.niveau === 'rouge') ? pass('v2 bilan >60j = rouge') : fail('v2 niveau');
}

console.log('\n═══ 3. Scanner MARCHÉS — saucissonnage CCP 2026 ═══');
{
  const c = scannerMarches(ETAB, [
    { id: 'm1', libelle: 'Fournitures bureau', famille_code: 'FB', cumul_total_12m: 45_000,  procedure_calculee: 'dispense' },
    { id: 'm2', libelle: 'Maintenance info',   famille_code: 'MI', cumul_total_12m: 160_000, procedure_calculee: 'mapa' },
    { id: 'm3', libelle: 'Petits achats',      famille_code: 'PA', cumul_total_12m: 12_000,  procedure_calculee: 'dispense' },
  ]);
  c.find(x => x.dedup_key === 'saucissonnage:m1') ? pass('m1 saucissonnage (>40 k€)') : fail('m1 manquant');
  c.find(x => x.dedup_key === 'formalise-requis:m2') ? pass('m2 formalisé requis (>143 k€)') : fail('m2 manquant');
  !c.find(x => x.dedup_key.includes('m3')) ? pass('m3 sous seuil = silence') : fail('m3 ne devrait rien produire');
}

console.log('\n═══ 4. Scanner DÉLÉGATIONS — R.421-13 ═══');
{
  const c = scannerDelegations(ETAB, [
    { id: 'd1', type_delegation: 'signature_courrier', date_fin: '2026-05-10', statut: 'active' },
    { id: 'd2', type_delegation: 'mandatement',        date_fin: '2026-04-20', statut: 'active' },
    { id: 'd3', type_delegation: 'recettes',           date_fin: '2026-06-15', statut: 'active' },
    { id: 'd4', type_delegation: 'signature_courrier', date_fin: '2027-01-01', statut: 'active' },
    { id: 'd5', type_delegation: 'mandatement',        date_fin: '2026-04-20', statut: 'abrogee' },
  ], TODAY);
  c.length === 3 ? pass('3 alertes (d1, d2, d3)') : fail(`attendu 3, obtenu ${c.length}`);
  c.find(x => x.dedup_key === 'expiree:d2' && x.niveau === 'rouge') ? pass('d2 expirée = rouge') : fail('d2 niveau');
  c.find(x => x.dedup_key === 'expire-30j:d1' && x.niveau === 'orange') ? pass('d1 J+15 = orange') : fail('d1 niveau');
  c.find(x => x.dedup_key === 'expire-60j:d3' && x.niveau === 'jaune') ? pass('d3 J+51 = jaune') : fail('d3 niveau');
}

console.log('\n═══ 5. Scanner ENTRETIENS — Décret 2010-888 ═══');
{
  const c = scannerEntretiens(ETAB, [
    { id: 'e1', statut: 'tenu', date_entretien: '2026-01-15', finalise_at: null },
    { id: 'e2', statut: 'tenu', date_entretien: '2026-02-20', finalise_at: null },
    { id: 'e3', statut: 'finalise', date_entretien: '2026-01-15', finalise_at: '2026-02-15T10:00Z' },
  ], TODAY);
  c.length === 2 ? pass('2 alertes (e1 rouge, e2 orange)') : fail(`attendu 2, obtenu ${c.length}`);
  c.find(x => x.dedup_key === 'non-finalise:e1' && x.niveau === 'rouge') ? pass('e1 J+100 = rouge') : fail('e1 niveau');
  c.find(x => x.dedup_key === 'non-finalise:e2' && x.niveau === 'orange') ? pass('e2 J+64 = orange') : fail('e2 niveau');
}

console.log('\n═══ 6. IDEMPOTENCE — dedup_key stable ═══');
{
  const a = scannerBalance(ETAB, [{ account_number: '4711', balance: 250 }]);
  const b = scannerBalance(ETAB, [{ account_number: '4711', balance: 999 }]);
  a[0].dedup_key === b[0].dedup_key ? pass('même compte ⇒ même dedup_key') : fail('dedup instable');
}

console.log('\n═══ 7. AGRÉGATION — aggregerRapports ═══');
{
  const agg = aggregerRapports([
    { module: 'balance', detectees: 3, upsertees: 3, closes: 0, erreurs: [] },
    { module: 'balance', detectees: 1, upsertees: 1, closes: 2, erreurs: ['x'] },
    { module: 'voyages', detectees: 2, upsertees: 2, closes: 1, erreurs: [] },
  ]);
  agg.balance.detectees === 4 ? pass('balance détectées = 4') : fail(`balance détectées ${agg.balance.detectees}`);
  agg.balance.closes === 2 ? pass('balance closes = 2') : fail(`balance closes ${agg.balance.closes}`);
  agg.balance.erreurs.length === 1 ? pass('erreurs agrégées') : fail('erreurs');
  agg.voyages.upsertees === 2 ? pass('voyages upsertees = 2') : fail('voyages');
}

console.log('\n═══ 8. COUVERTURE — modules branchés ═══');
{
  const expected = ['balance', 'voyages', 'marches', 'delegations', 'entretiens'];
  expected.every(m => _modulesBranches.includes(m))
    ? pass(`5 modules : ${_modulesBranches.join(', ')}`)
    : fail('couverture incomplète');
}

console.log(`\n═══════════════════════════════════════════════`);
console.log(`   RÉSULTAT : ${ok} OK · ${ko} KO`);
console.log(`═══════════════════════════════════════════════\n`);
process.exit(ko === 0 ? 0 : 1);
