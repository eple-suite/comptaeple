#!/usr/bin/env bun
/**
 * Recette — Calendrier comptable enrichi (Prompt N°10, livrable 1).
 * Vérifie présence des 10 jalons rentrée dans calendrierReglementaire.ts.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/cockpit/calendrierReglementaire.ts", "utf8");
const errors: string[] = [];

const motsCles = [
  /passation.{0,50}sgeple/i,
  /accr[ée]ditation.{0,50}(ordonnateur|chef)/i,
  /habilitation.{0,30}op@?le/i,
  /arr[ée]t[ée].{0,30}affectation/i,
  /d[ée]p[ôo]t.{0,30}signature/i,
  /sphère.{0,30}(ordonnateur|comptable)/i,
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