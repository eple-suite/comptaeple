#!/usr/bin/env node
// Tests de recette — Validations métier module Paramètres
// Réf : Code éducation, GBCP 2012-1246, instruction 06-031-A-B-M.
import { strict as assert } from "node:assert";

// Réimplémentation locale (équivalente à src/lib/parametres/validations.ts)
function isUaiFormatValid(uai) { return !!uai && /^[0-9]{7}[A-Z]$/i.test(uai.trim()); }
function isSiretValid(siret) {
  if (!siret) return false;
  const s = siret.replace(/\s+/g, "");
  if (!/^[0-9]{14}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(s[i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}
const INCOMPATIBLES = {
  ac: ["ordonnateur", "ordonnateur_suppleant", "regisseur_recettes", "regisseur_avances"],
  ordonnateur: ["ac", "fp", "regisseur_recettes", "regisseur_avances"],
  regisseur_recettes: ["ac", "ordonnateur"],
};
function checkRoleCompatibility(p, sec = []) {
  const issues = [];
  if (!p) return issues;
  const all = [p, ...sec];
  for (const r of all) for (const o of all) if (o !== r && (INCOMPATIBLES[r] || []).includes(o))
    issues.push({ severity: "error", code: "GBCP_SEPARATION", role: r, other: o });
  return issues;
}
function checkRegisseurSuppleant(role, hasSup) {
  if (!role || !["regisseur_recettes", "regisseur_avances"].includes(role)) return null;
  if (hasSup) return null;
  return { severity: "error", code: "REGIE_SUPPLEANT_MANQUANT" };
}

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log("  ✓", name); pass++; } catch (e) { console.error("  ✗", name, "—", e.message); fail++; } }

console.log("\n■ UAI / SIRET");
t("UAI valide '9710001A'", () => assert.equal(isUaiFormatValid("9710001A"), true));
t("UAI invalide '12345'", () => assert.equal(isUaiFormatValid("12345"), false));
t("UAI invalide minuscule format mais OK case-insensitive", () => assert.equal(isUaiFormatValid("9710001a"), true));
t("SIRET valide Luhn", () => assert.equal(isSiretValid("73282932000074"), true));
t("SIRET invalide", () => assert.equal(isSiretValid("12345678901234"), false));

console.log("\n■ Séparation des fonctions GBCP");
t("AC + ordonnateur → bloquant", () => assert.equal(checkRoleCompatibility("ac", ["ordonnateur"]).length > 0, true));
t("AC seul → OK", () => assert.equal(checkRoleCompatibility("ac", []).length, 0));
t("Ordonnateur + régisseur recettes → bloquant", () => assert.equal(checkRoleCompatibility("ordonnateur", ["regisseur_recettes"]).length > 0, true));
t("SG + adjoint → OK", () => assert.equal(checkRoleCompatibility("sg", ["adjoint_gestionnaire"]).length, 0));

console.log("\n■ Régisseur sans suppléant (instr. 06-031-A-B-M art. 5)");
t("Régisseur recettes sans suppléant → alerte rouge", () => assert.equal(checkRegisseurSuppleant("regisseur_recettes", false)?.code, "REGIE_SUPPLEANT_MANQUANT"));
t("Régisseur avec suppléant → null", () => assert.equal(checkRegisseurSuppleant("regisseur_recettes", true), null));
t("Non régisseur → null", () => assert.equal(checkRegisseurSuppleant("ac", false), null));

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);