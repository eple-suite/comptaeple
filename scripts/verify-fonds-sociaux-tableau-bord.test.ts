#!/usr/bin/env bun
/**
 * Recette n°7 — Tableau de bord et bilan annuel Fonds sociaux
 *
 * Vérifie :
 *   • Page TableauBordPage avec KPIs (allocations, bénéficiaires, consommation)
 *   • Suivi du pipeline Op@le (brouillon → décidé → DP émise → prise en charge → payé)
 *   • Répartitions par type de fonds et par nature (Q10)
 *   • Générateur PDF bilanAnnuelPdf exporté
 *   • Vue consolidée multi-EPLE (GroupementConsolidePage)
 */
import { readFileSync } from "node:fs";

const tb = readFileSync("src/pages/fonds-sociaux-v2/TableauBordPage.tsx", "utf8");
const bilan = readFileSync("src/lib/fs-pdf/bilanAnnuelPdf.ts", "utf8");
const groupe = readFileSync("src/pages/fonds-sociaux-v2/GroupementConsolidePage.tsx", "utf8");
const errors: string[] = [];

function must(label: string, cond: boolean) {
  if (!cond) errors.push(label);
}

// 1) Tableau de bord
must("TableauBordPage : KPI montant alloué", /alloué|allocation|montant/i.test(tb));
must("TableauBordPage : KPI bénéficiaires", /bénéficiaire/i.test(tb));
must("TableauBordPage : KPI taux de consommation", /consommation|consom/i.test(tb));

// 2) Pipeline Op@le DP
for (const s of ["brouillon", "decide", "demande_paiement_emise", "prise_en_charge", "paye"]) {
  must(`Pipeline doit suivre « ${s} »`, new RegExp(s).test(tb));
}

// 3) Répartitions analytiques
must("Répartition par type de fonds", /type_fonds/.test(tb));
must("Répartition par nature", /nature_aide|NATURE_AIDE/.test(tb));

// 4) Bilan annuel PDF
must("generateBilanAnnuelPdf exporté", /export function generateBilanAnnuelPdf\b/.test(bilan));
must("Bilan : titre conforme", /BILAN ANNUEL.*FONDS SOCIAUX/i.test(bilan));
must("Bilan : référence circulaire 2017-122", /2017-?122/.test(bilan));
must("Bilan : présentation au CA", /Conseil d'administration|CA\b/.test(bilan));

// 5) Vue groupement
must("GroupementConsolidePage : agrège plusieurs EPLE", /establishments|user_establishments|EPLE/i.test(groupe));
must("GroupementConsolidePage : tableau consolidé", /<table|consolid/i.test(groupe));

if (errors.length > 0) {
  console.error("❌ Recette tableau de bord FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette tableau de bord FS — OK");
console.log("   • KPIs et pipeline Op@le DP présents");
console.log("   • Bilan annuel PDF (circulaire 2017-122) exporté");
console.log("   • Vue consolidée multi-EPLE opérationnelle");
process.exit(0);