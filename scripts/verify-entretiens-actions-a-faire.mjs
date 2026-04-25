#!/usr/bin/env node
/**
 * Recette : moteur "Actions à faire" du tableau de bord entretiens.
 * Vérifie le classement par urgence et la couverture des cas réglementaires.
 */
import { buildActionsAFaire, urgenceFromJours, sortActions, SORT_LABELS } from "../src/lib/entretiens/actionsAFaire.ts";

let pass = 0, fail = 0;
function t(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
}

console.log("\n🧪 Recette — Actions à faire (entretiens)\n");

// 1. urgenceFromJours
t("Urgence critique si butoir dépassé", urgenceFromJours(-2) === "critique");
t("Urgence critique si ≤ 3 jours", urgenceFromJours(2) === "critique");
t("Urgence haute si ≤ 10 jours", urgenceFromJours(7) === "haute");
t("Urgence moyenne si ≤ 30 jours", urgenceFromJours(20) === "moyenne");
t("Urgence basse si > 30 jours", urgenceFromJours(60) === "basse");

const today = new Date("2025-04-01T12:00:00Z");
const uai = { e1: "9710001A" };
const baseAgent = (id, nom, n1 = "u-n1", n2 = "u-n2") => ({
  id, nom, prenom: "Test", n1_user_id: n1, n2_user_id: n2, establishment_id: "e1",
});
const butoir = (date) => [{ establishment_id: "e1", date_butoir_signatures: date, date_cloture: null }];

// 2. Aucun N+1 → action assigner_n1, bloque le reste
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Dupont", null, null)],
    entretiens: [],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("N+1 manquant → 1 action assigner_n1", r.length === 1 && r[0].type === "assigner_n1");
  t("N+1 manquant assigné au SG", r[0].acteur === "SG");
}

// 3. Aucun entretien → creer_entretien
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Dupont")],
    entretiens: [],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Aucun entretien → creer_entretien", r.some((x) => x.type === "creer_entretien"));
  t("Lien création pré-rempli avec agentId", r[0].href.includes("agent=a1"));
}

// 4. Convocation manquante < 8 jours
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Martin")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-04-05", date_convocation: null,
      signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null,
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Convocation manquante détectée", r.some((x) => x.type === "convoquer"));
  t("Convocation = urgence critique", r.find((x) => x.type === "convoquer").urgence === "critique");
}

// 5. Entretien dépassé non signé → signer_n1
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Bernard")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-03-25", date_convocation: "2025-03-15",
      signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null,
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  const a = r.find((x) => x.type === "signer_n1");
  t("Entretien dépassé → signer_n1", !!a);
  t("signer_n1 acteur = N+1", a.acteur === "N+1");
}

// 6. Workflow signatures successives
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Petit")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-03-20", date_convocation: "2025-03-10",
      signature_n1_at: "2025-03-21T10:00:00Z", signature_agent_at: null, visa_n2_at: null, finalise_at: null,
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("N+1 signé → action signer_agent", r.some((x) => x.type === "signer_agent" && x.acteur === "Agent"));
}
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Petit")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-03-20", date_convocation: "2025-03-10",
      signature_n1_at: "2025-03-21T10:00:00Z", signature_agent_at: "2025-03-22T10:00:00Z",
      visa_n2_at: null, finalise_at: null,
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Agent signé → action viser_n2", r.some((x) => x.type === "viser_n2" && x.acteur === "N+2"));
}
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Petit")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-03-20", date_convocation: "2025-03-10",
      signature_n1_at: "2025-03-21T10:00:00Z", signature_agent_at: "2025-03-22T10:00:00Z",
      visa_n2_at: "2025-03-23T10:00:00Z", finalise_at: null,
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Tout signé → action finaliser", r.some((x) => x.type === "finaliser" && x.acteur === "SG"));
}

// 7. Entretien finalisé → 0 action
{
  const r = buildActionsAFaire({
    agents: [baseAgent("a1", "Petit")],
    entretiens: [{
      id: "e-1", agent_evalue_id: "a1", establishment_id: "e1",
      date_entretien: "2025-03-20", date_convocation: "2025-03-10",
      signature_n1_at: "2025-03-21T10:00:00Z", signature_agent_at: "2025-03-22T10:00:00Z",
      visa_n2_at: "2025-03-23T10:00:00Z", finalise_at: "2025-03-25T10:00:00Z",
    }],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Entretien finalisé → aucune action", r.length === 0);
}

// 8. Tri par urgence : critique > haute > moyenne
{
  const r = buildActionsAFaire({
    agents: [
      baseAgent("a1", "Alpha"),    // entretien dans 60 j → basse
      baseAgent("a2", "Beta"),     // entretien dans 2 j non convoqué → critique
      baseAgent("a3", "Gamma"),    // entretien dans 7 j → haute
    ],
    entretiens: [
      { id: "e1", agent_evalue_id: "a1", establishment_id: "e1", date_entretien: "2025-05-31", date_convocation: "2025-05-20", signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null },
      { id: "e2", agent_evalue_id: "a2", establishment_id: "e1", date_entretien: "2025-04-03", date_convocation: null, signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null },
      { id: "e3", agent_evalue_id: "a3", establishment_id: "e1", date_entretien: "2025-04-08", date_convocation: "2025-03-25", signature_n1_at: null, signature_agent_at: null, visa_n2_at: null, finalise_at: null },
    ],
    campagnes: butoir("2025-06-30"),
    uaiByEtabId: uai,
    today,
  });
  t("Tri : la 1re action est critique", r[0].urgence === "critique");
  t("Tri : Beta (J-2 sans convoc) en tête", r[0].agentNom === "Beta");
}

/* ─── Tris configurables ─────────────────────────────────────────────────── */

const mkAction = (agentNom, butoirISO, score, agentPrenom = "X") => ({
  agentId: agentNom, agentNom, agentPrenom, etabUai: "—",
  type: "creer_entretien", acteur: "SG", libelle: "L",
  butoirISO, joursRestants: null, urgence: "moyenne", score,
  href: "/", entretienId: null,
});

t("SORT_LABELS expose les 3 modes", Object.keys(SORT_LABELS).length === 3 && SORT_LABELS.urgence && SORT_LABELS.butoir && SORT_LABELS.nom);

{
  const list = [
    mkAction("Zoé", "2025-05-01", 100),
    mkAction("Adam", "2025-04-10", 200),
    mkAction("Marie", null, 300),
  ];
  const sUrg = sortActions(list, "urgence");
  t("Tri urgence : score décroissant", sUrg[0].agentNom === "Marie" && sUrg[2].agentNom === "Zoé");

  const sBut = sortActions(list, "butoir");
  t("Tri butoir : date la + proche en premier", sBut[0].agentNom === "Adam" && sBut[1].agentNom === "Zoé");
  t("Tri butoir : nulls en dernier", sBut[2].agentNom === "Marie");

  const sNom = sortActions(list, "nom");
  t("Tri nom : ordre alphabétique fr", sNom.map((a) => a.agentNom).join(",") === "Adam,Marie,Zoé");
}

{
  // tie-break sur urgence : à score égal → nom
  const list = [mkAction("Charlie", null, 500), mkAction("Alpha", null, 500)];
  const s = sortActions(list, "urgence");
  t("Tri urgence : tie-break par nom", s[0].agentNom === "Alpha");
}

{
  // immutabilité
  const list = [mkAction("B", "2025-01-01", 100), mkAction("A", "2025-02-01", 200)];
  const ref = list.slice();
  sortActions(list, "nom");
  t("sortActions est immuable", list[0] === ref[0] && list[1] === ref[1]);
}

console.log(`\n📊 Résultat : ${pass} OK / ${fail} KO\n`);
process.exit(fail === 0 ? 0 : 1);