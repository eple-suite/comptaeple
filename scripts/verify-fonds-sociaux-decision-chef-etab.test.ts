#!/usr/bin/env bun
/**
 * Recette n°8 — Gabarit Décision du chef d'établissement (Fonds sociaux v2)
 *
 * Vérifie que le PDF de décision individuelle respecte la circulaire
 * n° 2017-122 du 22-08-2017 et le Code de justice administrative :
 *   • Visa de la délibération du CA (numéro + date) — paramétrable
 *   • Visa de l'avis de la commission fonds sociaux daté
 *   • Visa de la circulaire 2017-122
 *   • Bandeau « Voies et délais de recours » (art. R.421-1 CJA)
 *   • Tribunal administratif paramétrable (défaut : Basse-Terre — Guadeloupe)
 *   • Procédure d'urgence (§ II.4) supportée si pas d'avis commission
 *   • Mention « Extinction de créance famille » conditionnelle
 *   • Type de fonds via TYPE_FONDS_LABELS (4 fonds : FS / FSL / FSC_COL / FSC)
 */
import { readFileSync } from "node:fs";

const pdf = readFileSync("src/lib/fs-pdf/decisionPdf.ts", "utf8");
const types = readFileSync("src/pages/fonds-sociaux-v2/fsv2Types.ts", "utf8");
const errors: string[] = [];

function must(label: string, cond: boolean) {
  if (!cond) errors.push(label);
}

// 1) Export du gabarit
must(
  "generateDecisionChefEtablissementPdf exporté",
  /export function generateDecisionChefEtablissementPdf\b/.test(pdf),
);

// 2) Visas réglementaires
must("Visa circulaire 2017-122 du 22-08-2017", /2017-?122.*22-?08-?2017/.test(pdf));
must(
  "Visa délibération CA paramétrable (numero + date)",
  /numeroDeliberationCa/.test(pdf) && /dateDeliberationCa/.test(pdf),
);
must(
  "Visa avis commission daté",
  /dateAvisCommission/.test(pdf) && /avis de la commission/i.test(pdf),
);
must(
  "Procédure d'urgence (§ II.4) en repli sans commission",
  /urgence.*2017-?122.*II\.?4/i.test(pdf),
);

// 3) Voies et délais de recours — Code de justice administrative
must(
  "Bandeau voies et délais de recours présent",
  /voies et délais de recours/i.test(pdf),
);
must("Référence art. R.421-1 CJA", /R\.?\s*421-1/.test(pdf));
must(
  "Tribunal administratif paramétrable (défaut Basse-Terre)",
  /tribunalAdministratif/.test(pdf) && /Basse-?Terre/.test(pdf),
);

// 4) Vocabulaire Op@le DP (correctif 2)
must(
  "Titre PDF pièce comptable = DEMANDE DE PAIEMENT (Op@le)",
  /DEMANDE DE PAIEMENT.*Op@le|Op@le.*DEMANDE DE PAIEMENT/i.test(pdf),
);
must(
  "Aucun « mandat administratif » résiduel dans la notification famille",
  !/par mandat administratif/i.test(pdf),
);

// 5) Extinction de créance famille (compte 411200)
must(
  "Mention « Extinction créance » présente (conditionnelle)",
  /[Ee]xtinction.*cr[ée]ance/.test(pdf),
);
must(
  "Compte 411200 référencé (créance famille)",
  /411200/.test(pdf) || /COMPTE_CREANCE_DP_FAMILLE/.test(pdf),
);

// 6) Quatre fonds via labels typés
must("Import / usage de TYPE_FONDS_LABELS", /TYPE_FONDS_LABELS/.test(pdf));
for (const code of ["FS", "FSL", "FSC_COL", "FSC"]) {
  must(
    `TYPE_FONDS_LABELS contient le code « ${code} »`,
    new RegExp(`(^|[\\s,{])${code}\\s*:`, "m").test(types),
  );
}

if (errors.length > 0) {
  console.error("❌ Recette décision chef d'établissement — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette décision chef d'établissement — OK");
console.log("   • Visas CA + commission + circulaire 2017-122 présents");
console.log("   • Voies et délais de recours (art. R.421-1 CJA, TA paramétrable)");
console.log("   • Vocabulaire DP Op@le + compte 411200 conformes");
console.log("   • 4 fonds (FS / FSL / FSC_COL / FSC) typés");
process.exit(0);