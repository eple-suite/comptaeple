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

// Vérifications additionnelles : nouveaux livrables enquêtes rectorat
const NOUVEAUX = [
  "src/lib/enquetes-rectorat/bibliothequeEnquetes.ts",
  "src/pages/enquetes-rectorat/BibliothequePage.tsx",
  "src/pages/enquetes-rectorat/WizardReliquatsBopPage.tsx",
  "src/pages/enquetes-rectorat/WizardBoursesSieclePage.tsx",
  "src/pages/enquetes-rectorat/RelancesPage.tsx",
  "src/pages/enquetes-rectorat/HistoriquePluriannuelPage.tsx",
];
for (const f of NOUVEAUX) {
  if (fs.existsSync(f)) console.log(`✓ Livrable présent : ${f}`);
  else { console.error(`✗ Livrable manquant : ${f}`); fails++; }
}
const app = fs.readFileSync("src/App.tsx", "utf8");
const ROUTES = [
  "/enquetes-rectorat/bibliotheque",
  "/enquetes-rectorat/wizard-reliquats",
  "/enquetes-rectorat/bourses-rapprochement",
  "/enquetes-rectorat/relances",
  "/enquetes-rectorat/historique",
];
for (const r of ROUTES) {
  if (app.includes(r)) console.log(`✓ Route câblée : ${r}`);
  else { console.error(`✗ Route absente : ${r}`); fails++; }
}

if (fails > 0) {
  console.error(`\n${fails} source(s) manquante(s).`);
  process.exit(1);
}
console.log("\n✓ Toutes les sources de données pour articulation sont disponibles.");
process.exit(0);