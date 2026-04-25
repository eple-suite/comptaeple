#!/usr/bin/env node
/**
 * Vérifie la cohérence du moteur de recherche du Mode d'emploi.
 * Évalue les fichiers source (statique) — exit 0 = OK.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const checks = [];
const fail = (l, w) => checks.push({ ok: false, l, w });
const pass = (l, i = "") => checks.push({ ok: true, l, i });

try {
  const search = read("src/lib/aide/search.ts");

  // 1. Présence des 4 types
  for (const k of ["article", "glossaire", "faq", "modele"]) {
    if (!search.includes(`"${k}"`)) fail(`Type de hit "${k}"`, "absent");
    else pass(`Type de hit "${k}"`);
  }

  // 2. Fonction de scoring
  if (!search.includes("function scoreText")) fail("Fonction scoreText", "absente");
  else pass("Fonction scoreText");

  // 3. Tri par score
  if (!search.includes("hits.sort")) fail("Tri des résultats", "absent");
  else pass("Tri des résultats");

  // 4. Filtre par module
  if (!search.includes("moduleFilter")) fail("Filtre par module", "absent");
  else pass("Filtre par module");

  // 5. Limite de résultats
  if (!search.includes("limit")) fail("Limite de résultats", "absente");
  else pass("Limite de résultats");

  // 6. Helpers
  for (const fn of ["getArticleBySlug", "articlesByModule", "statsAide", "searchAide"]) {
    if (!search.includes(`function ${fn}`) && !search.includes(`export function ${fn}`)) {
      fail(`Helper ${fn}`, "absent");
    } else pass(`Helper ${fn}`);
  }

  // 7. Pages aide consomment la recherche
  const accueil = read("src/pages/aide/AideAccueil.tsx");
  if (!accueil.includes("searchAide")) fail("AideAccueil utilise searchAide", "absent");
  else pass("AideAccueil utilise searchAide");
  if (!accueil.includes("statsAide")) fail("AideAccueil utilise statsAide", "absent");
  else pass("AideAccueil utilise statsAide");

} catch (e) {
  console.error("[FATAL]", e.message);
  process.exit(1);
}

console.log("\n=== Mode d'emploi — Recherche ===");
for (const c of checks) {
  console.log(`  ${c.ok ? "✓" : "✗"} ${c.l}${c.w ? " — " + c.w : ""}${c.i ? " (" + c.i + ")" : ""}`);
}
const ko = checks.filter((c) => !c.ok).length;
console.log(`\nRésultat : ${checks.length - ko} OK / ${ko} KO`);
process.exit(ko > 0 ? 1 : 0);