#!/usr/bin/env node
/**
 * Recette — Dashboard campagne entretiens.
 * Vérifie la dérivation du statut global d'un entretien (N+1 / Agent / N+2 / Finalisé).
 */

let pass = 0, fail = 0;
const ok = (l) => { pass++; console.log(`✅ ${l}`); };
const ko = (l, d) => { fail++; console.log(`❌ ${l} — ${d}`); };
const eq = (a, b, l) => a === b ? ok(l) : ko(l, `attendu "${b}", reçu "${a}"`);

/* Réimplémentation locale (TypeScript pas exécuté ici) */
function deriveStatutGlobal(e) {
  if (!e) return "non_commence";
  if (e.finalise_at || e.statut === "finalise" || e.statut === "archive") return "finalise";
  if (e.signature_agent_at && !e.visa_n2_at) return "attente_n2";
  if (e.signature_n1_at && !e.signature_agent_at) return "attente_agent";
  if (!e.signature_n1_at) return "attente_n1";
  return "en_cours";
}

function joursRestants(dateISO) {
  if (!dateISO) return null;
  const d = new Date(dateISO + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((+d - +today) / (1000 * 60 * 60 * 24));
}

console.log("\n=== Recette — Dashboard campagne ===\n");

eq(deriveStatutGlobal(undefined), "non_commence", "Pas d'entretien → non commencé");
eq(deriveStatutGlobal({ statut: "brouillon" }), "attente_n1", "Brouillon sans signature → attente N+1");
eq(deriveStatutGlobal({ statut: "redaction_n1", signature_n1_at: "2025-04-01T00:00:00Z" }), "attente_agent", "Signature N+1 seule → attente agent");
eq(deriveStatutGlobal({ statut: "en_attente_visa_n2", signature_n1_at: "2025-04-01", signature_agent_at: "2025-04-10" }), "attente_n2", "Agent signé → attente N+2");
eq(deriveStatutGlobal({ statut: "finalise", finalise_at: "2025-04-15" }), "finalise", "Entretien finalisé");
eq(deriveStatutGlobal({ statut: "archive" }), "finalise", "Entretien archivé compté finalisé");

const t = new Date(); t.setHours(0,0,0,0);
const inSeven = new Date(t.getTime() + 7 * 86400000).toISOString().slice(0,10);
eq(joursRestants(inSeven), 7, "joursRestants J+7");
eq(joursRestants(null), null, "joursRestants null si pas de date");

console.log(`\n=== ${pass} ✅ / ${fail} ❌ ===\n`);
process.exit(fail > 0 ? 1 : 0);