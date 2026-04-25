/**
 * Circuit réglementaire des signatures CREP/CREF.
 *
 * Ordre imposé par le décret 2010-888 (art. 4) :
 *   1. N+1 signe (clôture de la rédaction)
 *   2. Communication à l'agent
 *   3. Observations éventuelles de l'agent
 *   4. Visa et observations N+2
 *   5. Notification finale + signature agent (prise de connaissance)
 *   6. Versement au dossier
 *
 * La signature agent est BLOQUÉE tant que N+1 et N+2 n'ont pas signé
 * (règle réglementaire — appliquée aussi côté base via trigger).
 */

import type { EntretienStatut } from "./types";

export interface SignaturesEtat {
  n1_at: string | null;
  agent_at: string | null;
  n2_at: string | null;
}

export type CircuitAction =
  | "signer_n1"
  | "notifier_agent"
  | "saisir_observations_agent"
  | "viser_n2"
  | "signer_agent"
  | "finaliser"
  | "archiver"
  | "demander_revision";

export interface CircuitStep {
  action: CircuitAction;
  label: string;
  description: string;
  done: boolean;
  blocked: boolean;
  blocked_reason?: string;
}

/** Renvoie l'étape suivante attendue dans le circuit. */
export function nextStatut(current: EntretienStatut): EntretienStatut | null {
  const flow: EntretienStatut[] = [
    "brouillon",
    "convocation_envoyee",
    "entretien_realise",
    "redaction_n1",
    "en_attente_signature_n1",
    "notifie_agent_pour_observations",
    "en_attente_signature_agent",
    "en_attente_visa_n2",
    "finalise",
    "archive",
  ];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

/**
 * Vérifie qu'une signature agent est autorisée.
 * @returns null si OK, sinon message d'erreur explicatif.
 */
export function checkSignatureAgentAutorisee(
  signatures: SignaturesEtat,
): string | null {
  if (!signatures.n1_at) {
    return "Signature agent bloquée : le supérieur hiérarchique direct (N+1) doit signer d'abord (décret 2010-888 art. 4).";
  }
  if (!signatures.n2_at) {
    return "Signature agent bloquée : l'autorité hiérarchique (N+2) doit viser le compte rendu avant la signature de l'agent.";
  }
  return null;
}

/** Délai légal de demande de révision (15 jours francs après notification). */
export const DELAI_REVISION_JOURS = 15;

/** Vérifie qu'une demande de révision est encore recevable. */
export function reviewWindowOpen(
  notification_agent_at: string | null,
  now: Date = new Date(),
): boolean {
  if (!notification_agent_at) return false;
  const notif = new Date(notification_agent_at);
  const diffMs = now.getTime() - notif.getTime();
  const diffJours = diffMs / (1000 * 60 * 60 * 24);
  return diffJours >= 0 && diffJours <= DELAI_REVISION_JOURS;
}

/** Calcule l'état des étapes pour l'UI. */
export function getCircuitSteps(
  statut: EntretienStatut,
  signatures: SignaturesEtat,
): CircuitStep[] {
  const sigBlock = checkSignatureAgentAutorisee(signatures);
  return [
    {
      action: "signer_n1",
      label: "1. Signature N+1",
      description: "Le supérieur hiérarchique direct signe la rédaction du CREP.",
      done: !!signatures.n1_at,
      blocked: false,
    },
    {
      action: "notifier_agent",
      label: "2. Notification à l'agent",
      description: "Communication formelle du compte rendu à l'agent évalué.",
      done: statut === "notifie_agent_pour_observations" ||
        statut === "en_attente_signature_agent" ||
        statut === "en_attente_visa_n2" ||
        statut === "finalise",
      blocked: !signatures.n1_at,
      blocked_reason: !signatures.n1_at ? "N+1 doit signer d'abord" : undefined,
    },
    {
      action: "saisir_observations_agent",
      label: "3. Observations de l'agent (facultatif)",
      description: "L'agent peut consigner ses observations dans la zone dédiée.",
      done: false,
      blocked: !signatures.n1_at,
    },
    {
      action: "viser_n2",
      label: "4. Visa N+2",
      description: "L'autorité hiérarchique vise le compte rendu.",
      done: !!signatures.n2_at,
      blocked: !signatures.n1_at,
      blocked_reason: !signatures.n1_at ? "N+1 doit signer d'abord" : undefined,
    },
    {
      action: "signer_agent",
      label: "5. Signature de l'agent (prise de connaissance)",
      description: "Cette signature ne vaut pas accord — elle atteste de la prise de connaissance.",
      done: !!signatures.agent_at,
      blocked: !!sigBlock,
      blocked_reason: sigBlock ?? undefined,
    },
    {
      action: "finaliser",
      label: "6. Finalisation et versement au dossier",
      description: "Versement au dossier administratif de l'agent.",
      done: statut === "finalise" || statut === "archive",
      blocked: !signatures.agent_at,
      blocked_reason: !signatures.agent_at ? "Signature agent requise" : undefined,
    },
  ];
}