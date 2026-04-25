#!/usr/bin/env bun
/**
 * Recette — Calendrier comptable enrichi (Prompt N°10, livrable 1).
 * Vérifie présence des 10 jalons rentrée dans calendrierReglementaire.ts.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/cockpit/calendrierReglementaire.ts", "utf8");
const errors: string[] = [];

const motsCles = [
  /passation.{0,80}sgeple/i,
  /accr[ée]ditation/i,
  /habilitation/i,
  /arr[ée]t[ée].{0,80}affectation/i,
  /signature/i,
  /sph[èe]re.{0,80}(ordonnateur|comptable)/i,
];

for (const re of motsCles) {
  if (!re.test(src)) errors.push(`Mot-clé manquant dans calendrier : ${re}`);
}

// au moins 8 mentions août/septembre liées à la rentrée
const aoutSeptCount = (src.match(/mois:\s*['"]?(08|09)['"]?|ao[ûu]t|septembre/gi) ?? []).length;
if (aoutSeptCount < 8) errors.push(`Trop peu d'occurrences août/septembre (${aoutSeptCount} < 8)`);

if (errors.length) {
  console.error("❌ Calendrier rentrée — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Calendrier rentrée — OK");
process.exit(0);