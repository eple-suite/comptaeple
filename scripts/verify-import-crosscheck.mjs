#!/usr/bin/env node
// Vérifie la logique de validation croisée balance / SDE / SDR / tiers / bourses
let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };

console.log('═══ VERIFY IMPORT CROSS-CHECK ═══');

const TOL = 0.011; // marge anti-flottant (0,01 € + arrondi)
function check(id, label, expected, actual) {
  const ecart = Math.abs(expected - actual);
  return { id, label, expected, actual, ecart, ok: ecart <= TOL };
}
function run({ balance, sde, sdr, tiers, bourses }) {
  const r = [];
  if (balance && sde) r.push(check('balance_sde', 'Σ C6 ≈ Σ Mandats', balance.classe6, sde.mandatsEmis));
  if (balance && sdr) r.push(check('balance_sdr', 'Σ C7 ≈ Σ Ordres', balance.classe7, sdr.ordresEmis));
  if (balance && tiers) r.push(check('balance_tiers', 'Σ C411 ≈ Σ Familles', balance.c411, tiers.totalFamilles));
  if (balance && bourses) r.push(check('balance_bourses', 'Σ C443110 ≈ Σ Bourses', balance.c443110, bourses.totalDu));
  return r;
}

// Cas idéal — tout équilibré
let res = run({
  balance: { classe6: 1000.00, classe7: 1500.00, c411: 250.00, c443110: 50.00 },
  sde: { mandatsEmis: 1000.00 }, sdr: { ordresEmis: 1500.00 },
  tiers: { totalFamilles: 250.00 }, bourses: { totalDu: 50.00 },
});
res.length === 4 ? ok('4 contrôles produits') : ko(`attendu 4, got ${res.length}`);
res.every((r) => r.ok) ? ok('tous équilibrés') : ko('certains non équilibrés alors qu\'ils devraient l\'être');

// Cas écart > tolérance
res = run({
  balance: { classe6: 1000.00, classe7: 0, c411: 0, c443110: 0 },
  sde: { mandatsEmis: 999.50 },
});
res[0].ok ? ko('écart 0,50 € détecté comme OK (KO attendu)') : ok('écart 0,50 € correctement signalé');

// Cas tolérance limite (1 centime exactement)
res = run({
  balance: { classe6: 100.00, classe7: 0, c411: 0, c443110: 0 },
  sde: { mandatsEmis: 100.01 },
});
res[0].ok ? ok('écart 0,01 € accepté (tolérance)') : ko('tolérance 0,01 € non respectée');

// Cas un seul fichier : pas de check
res = run({ balance: { classe6: 100, classe7: 0, c411: 0, c443110: 0 } });
res.length === 0 ? ok('aucun contrôle si fichier isolé') : ko('contrôle généré à tort');

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);