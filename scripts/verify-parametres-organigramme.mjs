#!/usr/bin/env node
// Recette 2 — Organigramme fonctionnel CICF (3 sphères)
// Réf : GBCP 2012-1246 art. 78 et 86, CICF M9-6.
import { strict as assert } from "node:assert";

const ROLE_TO_SPHERE = {
  ordonnateur: "ordo", ordonnateur_suppleant: "ordo", sg: "ordo",
  adjoint_gestionnaire: "ordo", assistant_gestion: "ordo",
  correspondant_cicf: "ordo", magasinier: "ordo",
  ac: "ac", fp: "ac", regisseur_recettes: "ac", regisseur_avances: "ac",
  suppleant_regie: "ac", archiviste_comptable: "ac",
  chef_cuisine: "ope", secretaire_intendance: "ope", gestionnaire_materiel: "ope",
  responsable_cfa: "ope", responsable_greta: "ope", autre: "ope",
};
const getSphere = (r) => ROLE_TO_SPHERE[r] ?? "ope";

function groupBySphere(agents) {
  const out = { ordo: [], ac: [], ope: [] };
  for (const a of agents) out[getSphere(a.role_principal)].push(a);
  return out;
}

function buildSvg({ groupementNom, agents }) {
  const grouped = groupBySphere(agents);
  const cards = [];
  for (const sphere of ["ordo", "ac", "ope"]) {
    for (const a of grouped[sphere]) {
      cards.push(`<rect class="card-${sphere}" data-agent="${a.id}"/>`);
    }
  }
  return `<svg><title>${groupementNom}</title>${cards.join("")}</svg>`;
}

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); console.log("  ✓", name); pass++; } catch (e) { console.error("  ✗", name, "—", e.message); fail++; } }

console.log("\n=== Recette ORGANIGRAMME ===");

t("Sphère ordonnateur englobe SG, AG, ordonnateur, CICF", () => {
  assert.equal(getSphere("ordonnateur"), "ordo");
  assert.equal(getSphere("sg"), "ordo");
  assert.equal(getSphere("adjoint_gestionnaire"), "ordo");
  assert.equal(getSphere("correspondant_cicf"), "ordo");
});

t("Sphère AC englobe AC, FP, régisseurs et suppléants", () => {
  assert.equal(getSphere("ac"), "ac");
  assert.equal(getSphere("fp"), "ac");
  assert.equal(getSphere("regisseur_recettes"), "ac");
  assert.equal(getSphere("regisseur_avances"), "ac");
  assert.equal(getSphere("suppleant_regie"), "ac");
});

t("Sphère opérationnelle pour métiers techniques", () => {
  assert.equal(getSphere("chef_cuisine"), "ope");
  assert.equal(getSphere("secretaire_intendance"), "ope");
  assert.equal(getSphere("autre"), "ope");
  assert.equal(getSphere(null), "ope");
});

t("groupBySphere répartit correctement", () => {
  const g = groupBySphere([
    { id: "1", role_principal: "ac" },
    { id: "2", role_principal: "ordonnateur" },
    { id: "3", role_principal: "chef_cuisine" },
    { id: "4", role_principal: "fp" },
  ]);
  assert.equal(g.ac.length, 2);
  assert.equal(g.ordo.length, 1);
  assert.equal(g.ope.length, 1);
});

t("SVG généré contient le nom du groupement et chaque agent", () => {
  const svg = buildSvg({ groupementNom: "Groupement-971-001", agents: [
    { id: "a1", role_principal: "ac" }, { id: "a2", role_principal: "ordonnateur" },
  ]});
  assert.ok(svg.includes("Groupement-971-001"));
  assert.ok(svg.includes("a1"));
  assert.ok(svg.includes("a2"));
});

t("Aucun agent → SVG construit sans erreur", () => {
  const svg = buildSvg({ groupementNom: "Vide", agents: [] });
  assert.ok(svg.includes("Vide"));
});

t("Conformité GBCP : un AC + un Ordonnateur sur deux sphères distinctes", () => {
  const g = groupBySphere([
    { id: "ac1", role_principal: "ac" },
    { id: "ord1", role_principal: "ordonnateur" },
  ]);
  assert.equal(g.ac.length, 1);
  assert.equal(g.ordo.length, 1);
  // séparation des fonctions matérialisée visuellement
  assert.notDeepEqual(g.ac, g.ordo);
});

console.log(`\nRésultat ORGANIGRAMME : ${pass} OK / ${fail} KO`);
process.exit(fail === 0 ? 0 : 1);