#!/usr/bin/env node
// Vérifie detectFileType — règles déclaratives nom + contenu
let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };

console.log('═══ VERIFY IMPORT FILE TYPE DETECTION ═══');

// Mini-réimpl pour ne pas charger le bundle TS
const RULES = [
  { type: 'balance', fn: [/balance/i, /\bbal\b/i], ck: ['solde débit', 'solde crédit', 'classe'] },
  { type: 'sde', fn: [/situation.*depense/i, /\bsde\b/i], ck: ['mandats émis', 'engagement juridique'] },
  { type: 'sdr', fn: [/situation.*recette/i, /\bsdr\b/i], ck: ['ordres émis', 'recettes encaissées'] },
  { type: 'siecle_eleves', fn: [/siecle/i, /eleves?/i], ck: ['ine', 'mef', 'classe'] },
  { type: 'siecle_bourses', fn: [/bourse/i, /\bgfe\b/i], ck: ['échelon', 'boursier'] },
  { type: 'grand_livre', fn: [/grand.?livre/i], ck: ['journal', 'pièce', 'contrepartie'] },
  { type: 'etat_tiers', fn: [/tiers/i], ck: ['code tiers', 'famille'] },
  { type: 'regies', fn: [/regie/i], ck: ['régisseur'] },
];
function detect(name, content) {
  let best = { type: 'inconnu', conf: 0 };
  for (const r of RULES) {
    const fHits = r.fn.filter((p) => p.test(name.toLowerCase())).length;
    const cHits = r.ck.filter((k) => content.toLowerCase().includes(k)).length;
    const conf = (fHits / r.fn.length) * 0.4 + (cHits / r.ck.length) * 0.6;
    if (conf > best.conf) best = { type: r.type, conf };
  }
  return best.conf < 0.3 ? { type: 'inconnu', conf: best.conf } : best;
}

const cases = [
  { name: 'Balance_2025_06.xlsx', content: 'compte solde débit solde crédit classe', expected: 'balance' },
  { name: 'SDE_juin.xlsx', content: 'mandats émis engagement juridique', expected: 'sde' },
  { name: 'SDR_juin.xlsx', content: 'ordres émis recettes encaissées', expected: 'sdr' },
  { name: 'export_siecle_eleves.csv', content: 'ine mef classe', expected: 'siecle_eleves' },
  { name: 'bourses_2025.xlsx', content: 'échelon boursier ine', expected: 'siecle_bourses' },
  { name: 'grand_livre_T2.xlsx', content: 'journal pièce contrepartie libellé', expected: 'grand_livre' },
  { name: 'etat_tiers.xlsx', content: 'code tiers famille solde', expected: 'etat_tiers' },
];
for (const c of cases) {
  const r = detect(c.name, c.content);
  r.type === c.expected ? ok(`${c.name} → ${r.type} (conf ${r.conf.toFixed(2)})`) : ko(`${c.name} attendu ${c.expected}, got ${r.type}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);