#!/usr/bin/env tsx
/**
 * Vérifie la cohérence du squelette de rapprochement bourses SIECLE ↔ Op@le.
 * Vérifications statiques (chantier 3 — wizard à étendre) :
 * - Le compte 443110 est bien marqué non-déspécialisable (cas spécial bourses)
 * - Les libellés de programme « bourses 2nd degré » sont bien associés à 443110
 * - La référence circulaire MENE1704160C est présente dans le seed
 */
import fs from "node:fs";

const files = fs.readdirSync("supabase/migrations");
const seed = files
  .map((f) => fs.readFileSync(`supabase/migrations/${f}`, "utf8"))
  .find((c) => c.includes("enquetes_referentiel_comptes") && c.includes("443110"));

if (!seed) {
  console.error("✗ Seed 443110 introuvable.");
  process.exit(1);
}

let fails = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); fails++; }
}

check("443110 marqué non-déspécialisable",
  /\('443110',[^)]*?'C_ou_nul',\s*false/.test(seed));
check("443110 référence MENE1704160C présente",
  seed.includes("MENE1704160C"));
check("443110 sous-programme bourses 2nd degré",
  seed.includes("bourses 2nd degré"));

if (fails > 0) {
  console.error(`\n${fails} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("\n✓ Référentiel bourses prêt pour rapprochement SIECLE.");
process.exit(0);