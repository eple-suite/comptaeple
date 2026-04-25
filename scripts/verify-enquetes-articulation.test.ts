#!/usr/bin/env tsx
/**
 * Vérifie que les modules existants (Balance, Fonds sociaux, Compte financier, Voyages, Marchés)
 * exposent les sources de données nécessaires au pré-remplissage des enquêtes rectorat.
 */
import fs from "node:fs";

const SOURCES = [
  { module: "Balance",         file: "src/lib/balance/referentielTypes.ts" },
  { module: "Fonds sociaux",   file: "src/pages/fonds-sociaux-v2/fsv2Types.ts" },
  { module: "Compte financier",file: "src/pages/CompteFinancier.tsx" },
  { module: "Voyages",         file: "src/pages/voyages-v2/EnquetesRectoratPage.tsx" },
  { module: "Marchés",         file: "src/pages/marches" },
];

let fails = 0;
for (const s of SOURCES) {
  const ok = fs.existsSync(s.file);
  if (ok) console.log(`✓ Source ${s.module} disponible (${s.file})`);
  else { console.error(`✗ Source ${s.module} absente (${s.file})`); fails++; }
}

if (fails > 0) {
  console.error(`\n${fails} source(s) manquante(s).`);
  process.exit(1);
}
console.log("\n✓ Toutes les sources de données pour articulation sont disponibles.");
process.exit(0);