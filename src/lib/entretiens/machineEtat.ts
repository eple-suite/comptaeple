/**
 * Machine d'état des CREP — décret 2010-888 art. 4.
 *
 * Règle absolue : la signature de l'agent évalué intervient APRÈS
 * la signature N+1 et le visa N+2.
 *
 * Le verrouillage côté backend est assuré par le trigger PostgreSQL
 * `entretiens_signatures_circuit_check` (déjà actif en BDD).
 * Cette machine d'état documente et valide côté UI.
 */
import type { EntretienStatut } from "./types";

export type Acteur = "evaluateur" | "n1" | "n2" | "agent" | "ac" | "admin";

/**
 * Transitions autorisées : map [from] -> liste de [to, acteurs autorisés, libellé]
 */
export interface TransitionDef {
  to: EntretienStatut;
  acteurs: Acteur[];
  libelle: string;
  conditions?: string[];
}

export const TRANSITIONS: Record<EntretienStatut, TransitionDef[]> = {
  brouillon: [
    { to: "convocation_envoyee", acteurs: ["evaluateur", "n1", "admin"], libelle: "Envoyer convocation" },
  ],
  convocation_envoyee: [
    { to: "entretien_realise", acteurs: ["evaluateur", "n1", "admin"], libelle: "Marquer entretien réalisé" },
  ],
  entretien_realise: [
    { to: "redaction_n1", acteurs: ["evaluateur", "n1", "admin"], libelle: "Démarrer rédaction" },
  ],
  redaction_n1: [
    { to: "en_attente_signature_n1", acteurs: ["evaluateur", "n1", "admin"], libelle: "Finaliser contenu" },
  ],
  en_attente_signature_n1: [
    { to: "notifie_agent_pour_observations", acteurs: ["n1", "admin"], libelle: "Signer N+1 et notifier agent" },
  ],
  notifie_agent_pour_observations: [
    { to: "en_attente_visa_n2", acteurs: ["agent", "admin"], libelle: "Soumettre observations agent" },
  ],
  en_attente_visa_n2: [
    { to: "en_attente_signature_agent", acteurs: ["n2", "admin"], libelle: "Viser N+2" },
  ],
  en_attente_signature_agent: [
    {
      to: "finalise",
      acteurs: ["agent", "admin"],
      libelle: "Signer agent (prise de connaissance)",
      conditions: ["signe_n1_present", "vise_n2_present"],
    },
  ],
  finalise: [
    { to: "archive", acteurs: ["evaluateur", "n1", "ac", "admin"], libelle: "Archiver" },
    { to: "recours_en_cours", acteurs: ["agent", "admin"], libelle: "Saisir recours hiérarchique" },
  ],
  recours_en_cours: [
    { to: "revision_demandee", acteurs: ["n2", "admin"], libelle: "Recours favorable — réviser" },
    { to: "archive", acteurs: ["n2", "admin"], libelle: "Recours défavorable — archiver" },
  ],
  revision_demandee: [
    { to: "redaction_n1", acteurs: ["n1", "admin"], libelle: "Reprendre rédaction" },
  ],
  archive: [],
};

export function transitionAutorisee(
  from: EntretienStatut,
  to: EntretienStatut,
  acteur: Acteur,
): { ok: boolean; raison?: string } {
  const defs = TRANSITIONS[from] || [];
  const def = defs.find((d) => d.to === to);
  if (!def) {
    return {
      ok: false,
      raison: `Transition ${from} → ${to} non prévue par la procédure réglementaire.`,
    };
  }
  if (!def.acteurs.includes(acteur)) {
    return {
      ok: false,
      raison: `Acteur "${acteur}" non habilité. Habilités : ${def.acteurs.join(", ")}.`,
    };
  }
  return { ok: true };
}

/**
 * Calcule les délais réglementaires de recours à partir d'une date de notification finale.
 */
export function calculerDelaisRecours(notifieAt: string | Date) {
  const d = typeof notifieAt === "string" ? new Date(notifieAt) : notifieAt;
  const j15 = new Date(d);
  j15.setDate(j15.getDate() + 15);
  const m1 = new Date(d);
  m1.setMonth(m1.getMonth() + 1);
  const today = new Date();
  const joursRestants15 = Math.ceil((j15.getTime() - today.getTime()) / 86400000);
  const joursRestantsMois = Math.ceil((m1.getTime() - today.getTime()) / 86400000);
  return {
    dateLimiteRecoursHierarchique: j15,
    dateLimiteSaisineCAP: m1,
    joursRestantsRecoursHierarchique: joursRestants15,
    joursRestantsSaisineCAP: joursRestantsMois,
    recoursHierarchiqueEncore: joursRestants15 > 0,
    saisineCAPEncore: joursRestantsMois > 0,
  };
}