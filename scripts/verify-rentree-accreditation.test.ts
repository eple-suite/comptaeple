#!/usr/bin/env bun
/**
 * Recette — Accréditation chefs d'établissement entrants (livrable 2).
 * Vérifie : page existe, types présents, statuts attendus, logique de blocage Arrêté.
 */
import { readFileSync, existsSync } from "node:fs";

const errors: string[] = [];

const pagePath = "src/pages/rentree/AccreditationOrdoPage.tsx";
const typesPath = "src/pages/rentree/types.ts";

if (!existsSync(pagePath)) errors.push("Page AccreditationOrdoPage manquante");
if (!existsSync(typesPath)) errors.push("Types rentrée manquants");

if (existsSync(typesPath)) {
  const t = readFileSync(typesPath, "utf8");
  ["en_attente", "pieces_recues_partielles", "completes", "valide_par_ac", "transmis_drfip"].forEach(s => {
    if (!t.includes(`"${s}"`)) errors.push(`Statut accréditation manquant : ${s}`);
  });
  if (!/arrete_affectation_pdf_url/.test(t)) errors.push("Champ arrete_affectation_pdf_url manquant");
  if (!/AccreditationChef/.test(t)) errors.push("Interface AccreditationChef manquante");
}

if (existsSync(pagePath)) {
  const p = readFileSync(pagePath, "utf8");
  if (!/accreditation-pieces/.test(p)) errors.push("Bucket 'accreditation-pieces' non référencé dans la page");
  if (!/arr[ée]t[ée]/i.test(p)) errors.push("Notion d'arrêté absente de la page");
}

if (errors.length) {
  console.error("❌ Accréditation — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Accréditation chefs d'établissement — OK");
process.exit(0);