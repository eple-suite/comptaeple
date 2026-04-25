#!/usr/bin/env node
// Recette 3 — Générateur d'arrêtés (13 types) + RGP 2022-408
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";

const ACTE_LABEL = {
  nomination_regisseur_recettes: "Arrêté de nomination de régisseur de recettes",
  nomination_regisseur_avances: "Arrêté de nomination de régisseur d'avances",
  nomination_suppleant_regie: "Arrêté de nomination de suppléant de régie",
  nomination_mandataire: "Arrêté de nomination de mandataire",
  arrete_constitutif_regie: "Arrêté constitutif de régie",
  arrete_abrogation_regie: "Arrêté d'abrogation de régie",
  delegation_signature_ordo: "Décision de délégation de signature de l'ordonnateur",
  delegation_signature_ac: "Décision de délégation de signature de l'agent comptable",
  abrogation_delegation: "Décision d'abrogation de délégation de signature",
  engagement_ac: "Acte d'engagement de l'agent comptable",
  pv_installation_ac: "Procès-verbal d'installation d'agent comptable",
  pv_remise_service_ac: "Procès-verbal de remise de service entre agents comptables",
  lettre_mission_cicf: "Lettre de mission du correspondant CICF",
};
const MENTION_RGP = "ordonnance n° 2022-408 du 23 mars 2022";
const needsRgpMention = (t) => t.startsWith("nomination_regisseur") || t === "arrete_constitutif_regie" || t === "engagement_ac" || t === "pv_installation_ac";

function buildVisas(type) {
  const v = ["Code de l'éducation", "décret n° 2012-1246"];
  if (type.startsWith("nomination_regisseur") || type === "arrete_constitutif_regie" || type === "arrete_abrogation_regie") {
    v.push("décret n° 2008-227", "instruction codificatrice n° 06-031-A-B-M");
  }
  return v;
}

function buildHtml(ctx) {
  const titre = ACTE_LABEL[ctx.type];
  if (!titre) throw new Error("Type d'acte inconnu : " + ctx.type);
  const visas = buildVisas(ctx.type).map((v) => `<p>Vu ${v}</p>`).join("");
  const mention = needsRgpMention(ctx.type) ? `<div class="rgp">${MENTION_RGP}</div>` : "";
  return `<!doctype html><html><body><h1>${titre}</h1><section>${visas}</section>${mention}<div>Fait le ${ctx.dateSignature}</div></body></html>`;
}

function sha256(s) { return createHash("sha256").update(s).digest("hex"); }

let pass = 0, fail = 0;
function t(n, fn) { try { fn(); console.log("  ✓", n); pass++; } catch (e) { console.error("  ✗", n, "—", e.message); fail++; } }

console.log("\n=== Recette ACTES ADMINISTRATIFS ===");

t("13 types d'actes définis", () => {
  assert.equal(Object.keys(ACTE_LABEL).length, 13);
});

t("Génération d'un arrêté de régisseur de recettes", () => {
  const html = buildHtml({ type: "nomination_regisseur_recettes", dateSignature: "2026-04-25" });
  assert.ok(html.includes("régisseur de recettes"));
  assert.ok(html.includes("instruction codificatrice n° 06-031-A-B-M"));
  assert.ok(html.includes(MENTION_RGP), "Mention RGP 2022-408 obligatoire");
});

t("Délégation ordonnateur sans mention RGP", () => {
  const html = buildHtml({ type: "delegation_signature_ordo", dateSignature: "2026-04-25" });
  assert.ok(!html.includes(MENTION_RGP), "Pas de mention RGP sur les délégations");
});

t("Engagement AC inclut la mention RGP", () => {
  const html = buildHtml({ type: "engagement_ac", dateSignature: "2026-04-25" });
  assert.ok(html.includes(MENTION_RGP));
});

t("PV d'installation AC inclut la mention RGP", () => {
  const html = buildHtml({ type: "pv_installation_ac", dateSignature: "2026-04-25" });
  assert.ok(html.includes(MENTION_RGP));
});

t("Hash SHA-256 stable et de longueur 64", () => {
  const html = buildHtml({ type: "lettre_mission_cicf", dateSignature: "2026-04-25" });
  const h = sha256(html);
  assert.equal(h.length, 64);
  assert.equal(sha256(html), h, "Hash déterministe");
});

t("Type inconnu lève une erreur", () => {
  assert.throws(() => buildHtml({ type: "inconnu", dateSignature: "2026-04-25" }));
});

t("Tous les types peuvent être générés", () => {
  for (const type of Object.keys(ACTE_LABEL)) {
    const h = buildHtml({ type, dateSignature: "2026-04-25" });
    assert.ok(h.length > 50, "HTML non vide pour " + type);
  }
});

console.log(`\nRésultat ACTES : ${pass} OK / ${fail} KO`);
process.exit(fail === 0 ? 0 : 1);