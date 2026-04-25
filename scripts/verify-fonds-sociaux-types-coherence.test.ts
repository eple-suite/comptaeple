#!/usr/bin/env bun
/**
 * Recette n°5 — Cohérence des types métier Fonds sociaux v2
 *
 * Vérifie que les types/constantes critiques restent alignés sur la
 * réglementation (circulaire 2017-122, M9-6 tome 3, Op@le 2024) :
 *   • TypeFonds couvre FS / FSL / FSC_COL / FSC
 *   • StatutDecision couvre le circuit Op@le DP (decide → demande_paiement_emise
 *     → prise_en_charge → paye, plus refusee/complement_demande/annule)
 *   • Les statuts legacy (mandate / paye historique) sont marqués comme tels
 *   • CODE_ACTIVITE_DEFAULT couvre tous les TypeFonds
 *   • TYPE_FONDS_LABELS couvre tous les TypeFonds
 *   • STATUT_DECISION_LABELS couvre tous les StatutDecision
 *   • COMPTE_CREANCE_DP_FAMILLE = 411200 (jamais 4116XX)
 *   • NATURES_Q10 couvre les 8 natures attendues par la DGESCO
 *   • FsDecision expose date_demande_paiement / numero_demande_paiement
 *     (et plus date_mandatement / numero_mandat)
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/fonds-sociaux-v2/fsv2Types.ts", "utf8");
const errors: string[] = [];

function must(label: string, cond: boolean) {
  if (!cond) errors.push(label);
}

// 1) Types fondamentaux
must("TypeFonds doit inclure FSL", /TypeFonds[^=]*=[^;]*"FSL"/.test(src));
must("TypeFonds doit inclure FSC_COL", /"FSC_COL"/.test(src));
must("TypeFonds doit inclure FSC", /\|\s*"FSC"\s*[;|]/.test(src) || /"FSC"\s*;/.test(src));
must("TypeFonds doit conserver FS (rétro-compat)", /"FS"/.test(src));

// 2) Circuit Op@le DP
for (const s of ["brouillon", "decide", "demande_paiement_emise", "prise_en_charge", "paye", "refusee", "complement_demande", "annule"]) {
  must(`StatutDecision doit inclure « ${s} »`, new RegExp(`"${s}"`).test(src));
}

// 3) Legacy "mandate" doit rester mais explicitement marqué
must("Statut « mandate » doit être marqué legacy", /"mandate".*\/\/.*legacy/i.test(src));

// 4) Constantes obligatoires
must("COMPTE_CREANCE_DP_FAMILLE = 411200", /COMPTE_CREANCE_DP_FAMILLE\s*=\s*"411200"/.test(src));
must("Pas de 4116XX dans les types", !/\b4116[0-9]{2}\b/.test(src.replace(/411200/g, "")));

// 5) Mappings exhaustifs
for (const k of ["FS", "FSL", "FSC_COL", "FSC"]) {
  must(`CODE_ACTIVITE_DEFAULT doit couvrir ${k}`, new RegExp(`CODE_ACTIVITE_DEFAULT[^}]*${k}\\s*:`).test(src));
  must(`TYPE_FONDS_LABELS doit couvrir ${k}`, new RegExp(`TYPE_FONDS_LABELS[^}]*${k}\\s*:`).test(src));
}
for (const s of ["brouillon", "decide", "demande_paiement_emise", "prise_en_charge", "paye", "refusee", "complement_demande", "annule", "mandate"]) {
  must(`STATUT_DECISION_LABELS doit couvrir ${s}`, new RegExp(`STATUT_DECISION_LABELS[^}]*${s}\\s*:`).test(src));
}

// 6) Q10 DGESCO — 8 natures
const q10Match = src.match(/NATURES_Q10[^=]*=\s*\[([^\]]+)\]/);
must("NATURES_Q10 trouvable", !!q10Match);
if (q10Match) {
  const items = q10Match[1].split(",").map(x => x.trim()).filter(Boolean);
  must(`NATURES_Q10 doit contenir 8 natures (trouvé ${items.length})`, items.length === 8);
}

// 7) FsDecision : champs DP renommés présents, anciens absents
must("FsDecision doit exposer date_demande_paiement", /date_demande_paiement\s*:\s*string/.test(src));
must("FsDecision doit exposer numero_demande_paiement", /numero_demande_paiement\s*:\s*string/.test(src));
must("FsDecision ne doit PLUS exposer date_mandatement (sauf rétro-compat marquée)", !/date_mandatement\s*:/.test(src));
must("FsDecision ne doit PLUS exposer numero_mandat (sauf rétro-compat marquée)", !/numero_mandat\s*:/.test(src));

// 8) Helpers attendus
must("Helper buildNumeroDecision exporté", /export function buildNumeroDecision/.test(src));
must("Helper currentAnneeScolaire exporté", /export function currentAnneeScolaire/.test(src));
must("Helper defaultTypeFondsForNature exporté", /export function defaultTypeFondsForNature/.test(src));

if (errors.length > 0) {
  console.error("❌ Recette types FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette types FS — OK");
console.log("   • TypeFonds / StatutDecision exhaustifs (Op@le DP)");
console.log("   • Mappings labels couvrent toutes les valeurs");
console.log("   • Compte 411200 unique (aucun 4116XX résiduel)");
console.log("   • 8 natures Q10 DGESCO présentes");
console.log("   • Champs DP renommés conformes");
process.exit(0);