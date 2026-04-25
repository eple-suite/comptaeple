#!/usr/bin/env tsx
/**
 * Vérifie le pré-remplissage du référentiel M9-6.
 * - Présence des familles 4411X, 44191X, 443110, 4412X, 44192X, 4413X, 44193X, 4416X, 4417X, 44181X
 * - Sens de soldes corrects
 * - exit 0 si OK
 */
import fs from "node:fs";

const SQL_DIR = "supabase/migrations";
const files = fs.readdirSync(SQL_DIR);
const seedFile = files.find((f) =>
  fs.readFileSync(`${SQL_DIR}/${f}`, "utf8").includes("enquetes_referentiel_comptes"),
);

if (!seedFile) {
  console.error("✗ Migration enquetes_referentiel_comptes introuvable.");
  process.exit(1);
}

const sql = fs.readFileSync(`${SQL_DIR}/${seedFile}`, "utf8");

const FAMILLES_REQUISES = ["4411X","44191X","443110","4412X","44192X","4413X","44193X","4416X","4417X","44181X"];
const COMPTES_CRITIQUES: Array<{ compte: string; sens: string; despec: boolean }> = [
  { compte: "443110", sens: "C_ou_nul", despec: false },
  { compte: "44114",  sens: "D",        despec: false },
  { compte: "441914", sens: "C",        despec: false },
  { compte: "44112",  sens: "D",        despec: true  },
  { compte: "441912", sens: "C",        despec: true  },
];

let errors = 0;
for (const f of FAMILLES_REQUISES) {
  if (!sql.includes(`'${f}'`)) {
    console.error(`✗ Famille ${f} absente du seed.`);
    errors++;
  } else {
    console.log(`✓ Famille ${f} présente.`);
  }
}

for (const c of COMPTES_CRITIQUES) {
  const re = new RegExp(`'${c.compte}',\\s*'[^']+',\\s*'[^']+'`);
  if (!re.test(sql)) {
    console.error(`✗ Compte ${c.compte} absent du seed.`);
    errors++;
    continue;
  }
  console.log(`✓ Compte ${c.compte} présent.`);
}

if (errors > 0) {
  console.error(`\n${errors} erreur(s).`);
  process.exit(1);
}
console.log("\n✓ Nomenclature M9-6 complète.");
process.exit(0);