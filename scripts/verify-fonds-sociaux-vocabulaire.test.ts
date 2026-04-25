#!/usr/bin/env bun
/**
 * Recette : vocabulaire « mandat » → « demande de paiement » dans le module Fonds sociaux.
 * Vérifie aussi la présence du compte 411200 et l'absence de 4116XX dans le code FS.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const FS_PATHS = [
  "src/pages/fonds-sociaux-v2",
  "src/lib/fs-pdf",
  "src/lib/enquete-rectorat",
];

function walk(dir: string, files: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(p)) files.push(p);
  }
  return files;
}

const errors: string[] = [];

// 1. Aucune chaîne UI « Mandaté » / « Mandater » / « par mandat » dans les fichiers FS
const FORBIDDEN_UI = [
  /Mandaté(?!e?\s*\(legacy\))/,           // libellé visible
  /par\s+mandat\s+administratif/i,
  /PIÈCE\s+COMPTABLE\s+—\s+MANDAT(?!\s+\(legacy\))/i,
];

for (const dir of FS_PATHS) {
  for (const f of walk(dir)) {
    const src = readFileSync(f, "utf8");
    for (const re of FORBIDDEN_UI) {
      if (re.test(src)) {
        errors.push(`${f} : motif interdit /${re.source}/`);
      }
    }
  }
}

// 2. Compte 411200 référencé dans fsv2Types
const types = readFileSync("src/pages/fonds-sociaux-v2/fsv2Types.ts", "utf8");
if (!/411200/.test(types)) errors.push("fsv2Types.ts : compte 411200 absent");
if (!/COMPTE_CREANCE_DP_FAMILLE/.test(types)) errors.push("fsv2Types.ts : constante COMPTE_CREANCE_DP_FAMILLE absente");

// 3. Pas de 4116XX dans le code fonds-sociaux-v2 (Voyages exclu — 4116 y est légitime)
for (const f of walk("src/pages/fonds-sociaux-v2")) {
  const src = readFileSync(f, "utf8");
  if (/\b4116[0-9x]{2}\b/i.test(src)) errors.push(`${f} : référence 4116XX (devrait être 411200)`);
}

// 4. PDF : nouveau libellé « DEMANDE DE PAIEMENT » présent
const pdf = readFileSync("src/lib/fs-pdf/decisionPdf.ts", "utf8");
if (!/DEMANDE DE PAIEMENT/.test(pdf)) errors.push("decisionPdf.ts : libellé « DEMANDE DE PAIEMENT » absent");
if (!/numero_demande_paiement/.test(pdf)) errors.push("decisionPdf.ts : champ numero_demande_paiement non utilisé");

// 5. Voies de recours présentes dans la décision CE
if (!/voiesDeRecours|Voies et délais de recours/.test(pdf)) {
  errors.push("decisionPdf.ts : voies de recours absentes");
}
if (!/Basse-Terre/.test(pdf)) {
  errors.push("decisionPdf.ts : tribunal administratif (Basse-Terre par défaut) absent");
}

if (errors.length > 0) {
  console.error("❌ Recette FS vocabulaire — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette FS vocabulaire — OK");
console.log("   • Vocabulaire UI : aucun « Mandaté » résiduel");
console.log("   • Compte 411200 + COMPTE_CREANCE_DP_FAMILLE référencés");
console.log("   • PDF : libellé DEMANDE DE PAIEMENT + numero_demande_paiement OK");
console.log("   • Voies et délais de recours (TA Basse-Terre) présents");
process.exit(0);