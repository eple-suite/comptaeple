#!/usr/bin/env -S npx tsx
import * as fs from "fs";
const src = fs.readFileSync("src/pages/marches/docs/pieces.ts", "utf-8");
const exports = (src.match(/export async function generate\w+/g) || []);
const noms = exports.map(e => e.replace("export async function ", ""));
console.log("Pièces disponibles :", noms.join(", "));
let ok = true;
const expect = (l: string, c: boolean) => { console.log((c ? "✓ " : "✗ ") + l); if (!c) ok = false; };
expect("Au moins 15 générateurs", noms.length >= 15);
for (const must of ["generateFicheBesoin","generateRC","generateCCAP","generateCCTP",
  "generateAE","generateRapportAnalyse","generateDecisionAttribution",
  "generateLettreNotification","generateLettreRejet","generatePvReception",
  "generateNoteTracabilite","generateDUME","generateDC4",
  "generateConventionGroupement","generateRAR"]) {
  expect("Présent : " + must, noms.includes(must));
}
process.exit(ok ? 0 : 1);
