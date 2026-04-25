#!/usr/bin/env node
/**
 * Recette — circuit signatures CREP/CREF (décret 2010-888 art. 4).
 * Vérifie : signature agent bloquée tant que N+1 et N+2 ne sont pas signataires,
 * fenêtre de révision de 15 jours francs, structure des étapes.
 */

import {
  checkSignatureAgentAutorisee,
  reviewWindowOpen,
  getCircuitSteps,
  nextStatut,
  DELAI_REVISION_JOURS,
} from "../src/lib/entretiens/circuit.ts";

let pass = 0, fail = 0;
function assert(cond, label) {
  if (cond) { console.log(`✅ ${label}`); pass++; }
  else { console.error(`❌ ${label}`); fail++; }
}

console.log("\nRECETTE — Circuit signatures CREP/CREF\n");

// 1. Signature agent bloquée si N+1 manquante
const r1 = checkSignatureAgentAutorisee({ n1_at: null, n2_at: null, agent_at: null });
assert(r1 !== null && r1.includes("N+1"), "Signature agent bloquée si N+1 absente");

// 2. Signature agent bloquée si N+2 manquante (même si N+1 présente)
const r2 = checkSignatureAgentAutorisee({ n1_at: "2025-04-01", n2_at: null, agent_at: null });
assert(r2 !== null && r2.includes("N+2"), "Signature agent bloquée si N+2 absente");

// 3. Signature agent autorisée quand N+1 et N+2 ont signé
const r3 = checkSignatureAgentAutorisee({ n1_at: "2025-04-01", n2_at: "2025-04-05", agent_at: null });
assert(r3 === null, "Signature agent autorisée quand N+1 et N+2 ont signé");

// 4. Fenêtre de révision : ouverte à J+10, fermée à J+20
const now = new Date("2025-04-20T12:00:00Z");
assert(reviewWindowOpen("2025-04-10T12:00:00Z", now) === true, "Révision ouverte à J+10");
assert(reviewWindowOpen("2025-03-30T12:00:00Z", now) === false, "Révision fermée à J+21");
assert(reviewWindowOpen(null, now) === false, "Révision impossible sans notification");

// 5. Délai légal = 15 jours
assert(DELAI_REVISION_JOURS === 15, "Délai légal = 15 jours francs");

// 6. Workflow nextStatut linéaire
assert(nextStatut("brouillon") === "convocation_envoyee", "brouillon → convocation_envoyee");
assert(nextStatut("en_attente_visa_n2") === "finalise", "visa N+2 → finalisé");
assert(nextStatut("archive") === null, "archive est terminal");

// 7. getCircuitSteps : 6 étapes, agent bloqué tant que circuit incomplet
const steps = getCircuitSteps("redaction_n1", { n1_at: null, n2_at: null, agent_at: null });
assert(steps.length === 6, "6 étapes dans le circuit");
const stepAgent = steps.find((s) => s.action === "signer_agent");
assert(stepAgent && stepAgent.blocked === true, "Étape signature agent bloquée");

const stepsOk = getCircuitSteps("en_attente_visa_n2", {
  n1_at: "2025-04-01", n2_at: "2025-04-05", agent_at: null,
});
const stepAgentOk = stepsOk.find((s) => s.action === "signer_agent");
assert(stepAgentOk && stepAgentOk.blocked === false, "Étape signature agent débloquée après N+1 + N+2");

console.log(`\n${pass} succès / ${fail} échecs`);
process.exit(fail === 0 ? 0 : 1);