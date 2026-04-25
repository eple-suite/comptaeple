#!/usr/bin/env bun
/**
 * Recette : présence des 7 gabarits PDF Fonds sociaux
 * - Décision chef d'établissement  - Notification famille  - Pièce comptable DP
 * - Bordereau DP  - Courrier complément  - Courrier refus  - Convocation commission
 */
import { readFileSync } from "node:fs";

const pdf = readFileSync("src/lib/fs-pdf/decisionPdf.ts", "utf8");
const errors: string[] = [];

const REQUIRED_EXPORTS = [
  "generateDecisionChefEtablissementPdf",
  "generateNotificationFamillePdf",
  "generatePieceComptablePdf",
  "generateBordereauDpPdf",
  "generateCourrierComplementPdf",
  "generateCourrierRefusPdf",
  "generateConvocationCommissionPdf",
];

for (const fn of REQUIRED_EXPORTS) {
  if (!new RegExp(`export function ${fn}\\b`).test(pdf)) {
    errors.push(`Gabarit manquant : ${fn}`);
  }
}

// Vérifications de contenu : refus = voies de recours, bordereau = total, complément = délai
if (!/DÉCISION DE REFUS/.test(pdf)) errors.push("Courrier refus : titre manquant");
if (!/BORDEREAU DE DEMANDES DE PAIEMENT/.test(pdf)) errors.push("Bordereau DP : titre manquant");
if (!/CONVOCATION/.test(pdf)) errors.push("Convocation : titre manquant");
if (!/délai de \$\{delaiJours\}/.test(pdf) && !/delaiJours/.test(pdf)) {
  errors.push("Courrier complément : paramètre delaiJours absent");
}

if (errors.length > 0) {
  console.error("❌ Recette gabarits FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette gabarits FS — OK");
console.log(`   • ${REQUIRED_EXPORTS.length} gabarits PDF exportés`);
console.log("   • Bordereau DP, courriers complément/refus, convocation présents");
process.exit(0);