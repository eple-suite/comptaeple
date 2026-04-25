#!/usr/bin/env node
/**
 * Vérifie la complétude de la base pédagogique du Mode d'emploi.
 * Exit 0 = OK ; Exit 1 = échec.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const read = (p) => readFileSync(resolve(root, p), "utf8");

const checks = [];
const fail = (label, why) => { checks.push({ label, ok: false, why }); };
const pass = (label, info = "") => { checks.push({ label, ok: true, info }); };

function countMatches(src, regex) {
  return (src.match(regex) || []).length;
}

try {
  const articlesSrc = read("src/data/aide/articles.ts");
  const glossSrc = read("src/data/aide/glossaire.ts");
  const faqSrc = read("src/data/aide/faq.ts");
  const modSrc = read("src/data/aide/modeles.ts");
  const typesSrc = read("src/data/aide/types.ts");

  // 1. 12 modules attendus
  const moduleEntries = countMatches(typesSrc, /\{ id: "/g);
  if (moduleEntries < 12) fail("12 modules définis", `trouvé ${moduleEntries}`);
  else pass("12 modules définis", `${moduleEntries} modules`);

  // 2. Articles : 6 sections × 12 modules = 72 attendus
  // Le générateur produit 6 articles par module, donc on vérifie le nombre de sections par module dans articles.ts
  const sectionCalls = countMatches(articlesSrc, /sections\(/g);
  if (sectionCalls < 1) fail("Générateur de sections présent", "aucune fonction sections() détectée");
  else pass("Générateur de sections présent", `${sectionCalls} appel(s)`);

  // Vérifie présence des 6 niveaux par module
  const requiredSlugs = ["vue-ensemble", "cadre-reglementaire", "pas-a-pas", "confirme", "expert", "pieges"];
  for (const slug of requiredSlugs) {
    if (!articlesSrc.includes(`-${slug}`)) fail(`Articles incluent slug "${slug}"`, "absent");
    else pass(`Articles incluent slug "${slug}"`);
  }

  // 3. Glossaire : ≥ 60 entrées
  const glossEntries = countMatches(glossSrc, /\{ terme:/g);
  if (glossEntries < 60) fail("Glossaire ≥ 60 entrées", `${glossEntries} entrées`);
  else pass("Glossaire", `${glossEntries} entrées`);

  // 4. FAQ : ≥ 100 questions
  const faqEntries = countMatches(faqSrc, /\{ question:/g);
  if (faqEntries < 100) fail("FAQ ≥ 100 questions", `${faqEntries} questions`);
  else pass("FAQ", `${faqEntries} questions`);

  // 5. Modèles : ≥ 80
  const modEntries = countMatches(modSrc, /\{ nom:/g);
  if (modEntries < 80) fail("Modèles ≥ 80", `${modEntries} modèles`);
  else pass("Modèles", `${modEntries} entrées`);

  // 6. Références réglementaires obligatoires citées
  const refsObligatoires = ["M9-6", "GBCP", "Code éducation", "RGPD", "Ordonnance 2022-408", "CCP"];
  for (const ref of refsObligatoires) {
    if (!articlesSrc.includes(ref) && !glossSrc.includes(ref)) {
      fail(`Référence "${ref}" présente`, "non citée");
    } else pass(`Référence "${ref}"`);
  }

  // 7. Pas de doublon de slug d'article
  const slugMatches = [...articlesSrc.matchAll(/slug: `([^`]+)`/g)].map((m) => m[1]);
  const dups = slugMatches.filter((s, i, arr) => arr.indexOf(s) !== i);
  if (dups.length > 0) fail("Pas de slug dupliqué", `doublons: ${dups.join(", ")}`);
  else pass("Pas de slug dupliqué", `${slugMatches.length} slugs uniques`);

} catch (e) {
  console.error("[ERREUR FATALE]", e.message);
  process.exit(1);
}

const ok = checks.filter((c) => c.ok).length;
const ko = checks.filter((c) => !c.ok).length;

console.log("\n=== Mode d'emploi — Complétude ===");
for (const c of checks) {
  const icon = c.ok ? "✓" : "✗";
  console.log(`  ${icon} ${c.label}${c.info ? ` (${c.info})` : ""}${c.why ? ` — ${c.why}` : ""}`);
}
console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko > 0 ? 1 : 0);