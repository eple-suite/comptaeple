#!/usr/bin/env bun
/**
 * Recette — Habilitations Op@le (livrable 3).
 * Vérifie séparation stricte sphère ordonnateur / comptable (GBCP art. 9).
 */
import { readFileSync, existsSync } from "node:fs";

const errors: string[] = [];
const path = "src/pages/rentree/HabilitationsOpalePage.tsx";

if (!existsSync(path)) {
  console.error("❌ Habilitations Op@le — page manquante");
  process.exit(1);
}
const src = readFileSync(path, "utf8");

if (!/sphère|sphere/i.test(src)) errors.push("Notion de 'sphère' absente");
if (!/ordonnateur/i.test(src)) errors.push("Sphère ordonnateur non mentionnée");
if (!/comptable/i.test(src)) errors.push("Sphère comptable non mentionnée");
if (!/GBCP|art\.?\s*9|2012-?1246/i.test(src)) errors.push("Référence GBCP art. 9 / décret 2012-1246 absente");
if (!/s[ée]paration/i.test(src)) errors.push("Mot-clé 'séparation' absent (séparation ordo/comptable)");

if (errors.length) {
  console.error("❌ Habilitations Op@le — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Habilitations Op@le — OK (séparation des sphères respectée)");
process.exit(0);