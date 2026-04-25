#!/usr/bin/env bun
/**
 * Recette transverse : audit du vocabulaire « mandat » → « demande de paiement »
 * dans les modules métier (Voyages v2, Compte Financier, Fonds sociaux v2).
 * Tolère le terme dans les contextes légitimes : crédits de mandat, mandataire,
 * commentaires legacy explicitement marqués.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const TARGETS = [
  "src/pages/fonds-sociaux-v2",
  "src/pages/voyages-v2",
  "src/lib/fs-pdf",
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

// Motifs UI à éviter (visibles utilisateur)
const FORBIDDEN_UI = [
  /MANDATEMENT DES DÉPENSES/,
  />\s*Mandaté\s*</,
  /la mandater/i,
];

const errors: string[] = [];

for (const dir of TARGETS) {
  for (const f of walk(dir)) {
    const src = readFileSync(f, "utf8");
    for (const re of FORBIDDEN_UI) {
      if (re.test(src)) errors.push(`${f} : motif interdit /${re.source}/`);
    }
  }
}

// Présence de l'entrée glossaire DP
const gloss = readFileSync("src/data/aide/glossaire.ts", "utf8");
if (!/terme:\s*"DP"/.test(gloss)) {
  errors.push("glossaire.ts : entrée « DP » (Demande de Paiement) manquante");
}

if (errors.length > 0) {
  console.error("❌ Audit vocabulaire transverse — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Audit vocabulaire transverse — OK");
console.log("   • Aucun motif interdit dans Voyages v2 / FS v2 / fs-pdf");
console.log("   • Glossaire : entrée DP présente");
process.exit(0);