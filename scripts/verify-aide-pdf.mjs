#!/usr/bin/env node
/**
 * Vérifie la chaîne d'export PDF du Mode d'emploi.
 * Audit statique — exit 0 = OK.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const checks = [];
const fail = (l, w) => checks.push({ ok: false, l, w });
const pass = (l) => checks.push({ ok: true, l });

try {
  const pdf = read("src/lib/aide/pdfExport.ts");

  for (const fn of ["exportArticlePdf", "exportModulePdf", "exportGlossairePdf"]) {
    if (!pdf.includes(`export function ${fn}`)) fail(`Export ${fn}`, "absent");
    else pass(`Export ${fn}`);
  }

  if (!pdf.includes("createStyledPDF")) fail("Utilise createStyledPDF (charte commune)", "absent");
  else pass("Utilise createStyledPDF (charte commune)");

  if (!pdf.includes("savePDF")) fail("Utilise savePDF (footers + impression)", "absent");
  else pass("Utilise savePDF (footers + impression)");

  if (!pdf.includes("Académie de Guadeloupe")) fail("En-tête institutionnel Guadeloupe", "absent");
  else pass("En-tête institutionnel Guadeloupe");

  if (!pdf.includes("Sommaire")) fail("Sommaire généré dans guide module", "absent");
  else pass("Sommaire généré dans guide module");

  if (!pdf.includes("M9-6") || !pdf.includes("GBCP")) fail("Mentions réglementaires en pied de garde", "absentes");
  else pass("Mentions réglementaires en pied de garde");

  // Pages utilisent les exports
  const article = read("src/pages/aide/AideArticle.tsx");
  if (!article.includes("exportArticlePdf")) fail("AideArticle déclenche exportArticlePdf", "absent");
  else pass("AideArticle déclenche exportArticlePdf");

  const moduleP = read("src/pages/aide/AideModule.tsx");
  if (!moduleP.includes("exportModulePdf")) fail("AideModule déclenche exportModulePdf", "absent");
  else pass("AideModule déclenche exportModulePdf");

  const gloss = read("src/pages/aide/AideGlossaire.tsx");
  if (!gloss.includes("exportGlossairePdf")) fail("AideGlossaire déclenche exportGlossairePdf", "absent");
  else pass("AideGlossaire déclenche exportGlossairePdf");

} catch (e) {
  console.error("[FATAL]", e.message);
  process.exit(1);
}

console.log("\n=== Mode d'emploi — Export PDF ===");
for (const c of checks) {
  console.log(`  ${c.ok ? "✓" : "✗"} ${c.l}${c.w ? " — " + c.w : ""}`);
}
const ko = checks.filter((c) => !c.ok).length;
console.log(`\nRésultat : ${checks.length - ko} OK / ${ko} KO`);
process.exit(ko > 0 ? 1 : 0);