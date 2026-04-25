#!/usr/bin/env bun
/**
 * Recette routing — pages "rentrée" et "Liens utiles".
 * Vérifie que App.tsx déclare et importe les 6 nouvelles routes.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/App.tsx", "utf8");
const errors: string[] = [];

const expectedImports = [
  "PassationSgeplePage",
  "AccreditationOrdoPage",
  "HabilitationsOpalePage",
  "HabilitationsRecapPage",
  "VueRectoratPage",
  "LiensUtilesPage",
];
const expectedRoutes = [
  "/rentree/passation-sgeple",
  "/rentree/accreditation",
  "/rentree/habilitations-opale",
  "/rentree/habilitations-recap",
  "/rentree/vue-rectorat",
  "/liens-utiles",
];

for (const name of expectedImports) {
  if (!new RegExp(`import\\s+${name}\\s+from`).test(src)) {
    errors.push(`Import manquant : ${name}`);
  }
}
for (const path of expectedRoutes) {
  if (!src.includes(`path="${path}"`)) {
    errors.push(`Route manquante : ${path}`);
  }
}

if (errors.length) {
  console.error("❌ Routing rentrée — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Routing rentrée — OK (6 routes, 6 imports)");
process.exit(0);