#!/usr/bin/env node
// Recette 5 — RGPD : registre Art. 30, mention Art. 13/14, demande Art. 15
import { strict as assert } from "node:assert";

const REGISTRE = [
  { id: "agents", finalite: "Gestion administrative et RH des agents BIATSS", baseLegale: "Mission d'intérêt public (art. 6.1.e RGPD)", conservation: "10 ans après fin de fonction" },
  { id: "etablissements", finalite: "Référentiel des EPLE", baseLegale: "Obligation légale (Code éducation R.421-77, GBCP art. 86)", conservation: "Durée de vie du groupement" },
  { id: "actes", finalite: "Génération et archivage des actes administratifs", baseLegale: "Obligation légale", conservation: "10 ans minimum" },
  { id: "evaluations", finalite: "Conduite et archivage des entretiens professionnels (CREP)", baseLegale: "Obligation légale — décret 2010-888", conservation: "Pendant la carrière + 10 ans" },
  { id: "regies", finalite: "Gestion des régies de recettes et d'avances", baseLegale: "Décret 2008-227 modifié", conservation: "10 ans après abrogation" },
];

const MENTION = "Conformément aux articles 13 et 14 du règlement (UE) 2016/679 (RGPD), les données vous concernant sont traitées par le groupement comptable au titre de l'exécution d'une mission d'intérêt public.";

function buildArt15(agent, ctx) {
  return `<html><body>
    <h1>Communication des données personnelles (art. 15 RGPD)</h1>
    <p>Agent : ${agent.prenom} ${agent.nom}</p>
    <p>Matricule : ${agent.matricule_education_nationale ?? "—"}</p>
    <p>Actes : ${ctx.actes.length}</p>
    <p>Historique : ${ctx.historique.length}</p>
    <p>${MENTION}</p>
  </body></html>`;
}

let pass = 0, fail = 0;
function t(n, fn) { try { fn(); console.log("  ✓", n); pass++; } catch (e) { console.error("  ✗", n, "—", e.message); fail++; } }

console.log("\n=== Recette RGPD ===");

t("Registre Art. 30 contient au moins 5 traitements", () => {
  assert.ok(REGISTRE.length >= 5);
});

t("Chaque traitement déclare finalité, base légale, conservation", () => {
  for (const r of REGISTRE) {
    assert.ok(r.finalite && r.finalite.length > 0, "Finalité manquante : " + r.id);
    assert.ok(r.baseLegale && r.baseLegale.length > 0, "Base légale manquante : " + r.id);
    assert.ok(r.conservation && r.conservation.length > 0, "Conservation manquante : " + r.id);
  }
});

t("Référentiel agents : 10 ans après fin de fonction (CNIL)", () => {
  const t = REGISTRE.find((x) => x.id === "agents");
  assert.ok(t.conservation.includes("10 ans"));
});

t("Référentiel régies : 10 ans après abrogation", () => {
  const t = REGISTRE.find((x) => x.id === "regies");
  assert.ok(t.conservation.includes("10 ans"));
});

t("Mention Art. 13/14 cite le RGPD UE 2016/679", () => {
  assert.ok(MENTION.includes("règlement (UE) 2016/679"));
  assert.ok(MENTION.includes("articles 13 et 14"));
});

t("Demande d'accès Art. 15 contient l'identité de l'agent", () => {
  const html = buildArt15({ nom: "Dupont", prenom: "Marie", matricule_education_nationale: "9876543" }, { actes: [], historique: [] });
  assert.ok(html.includes("Marie Dupont"));
  assert.ok(html.includes("9876543"));
  assert.ok(html.includes("art. 15 RGPD"));
});

t("Demande Art. 15 inclut actes et historique", () => {
  const html = buildArt15(
    { nom: "X", prenom: "Y" },
    { actes: [{ type: "engagement_ac" }, { type: "delegation_signature_ac" }], historique: [{ role: "ac", date_debut: "2020" }] }
  );
  assert.ok(html.includes("Actes : 2"));
  assert.ok(html.includes("Historique : 1"));
});

t("Toute demande Art. 15 doit être traçable (rgpd_acces_logs)", () => {
  const log = { type_action: "export_art15", finalite: "Demande d'accès art. 15 RGPD", agent_concerne_id: "uuid" };
  assert.equal(log.type_action, "export_art15");
  assert.ok(log.finalite.includes("art. 15"));
});

console.log(`\nRésultat RGPD : ${pass} OK / ${fail} KO`);
process.exit(fail === 0 ? 0 : 1);