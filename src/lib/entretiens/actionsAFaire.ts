/**
 * Moteur de classement des "Actions à faire" pour le tableau de bord
 * des entretiens professionnels (CREP / CREF).
 *
 * Une action = quelque chose à faire MAINTENANT par un acteur identifié
 * (SG / N+1 / N+2 / Agent) sur un agent évalué donné, avec une urgence
 * calculée à partir des butoirs réglementaires.
 */

export type ActionType =
  | "creer_entretien"      // Aucun entretien existant pour l'agent
  | "planifier_date"       // Entretien créé mais pas encore daté
  | "convoquer"            // Date posée mais convocation manquante (J-8)
  | "conduire_entretien"   // Date imminente / dépassée, entretien non signé
  | "signer_n1"            // En attente signature N+1
  | "signer_agent"         // En attente signature Agent
  | "viser_n2"             // En attente visa N+2
  | "finaliser"            // Tout signé, à finaliser
  | "assigner_n1"          // N+1 non assigné dans le RH
  | "assigner_n2";         // N+2 non assigné dans le RH

export type Urgence = "critique" | "haute" | "moyenne" | "basse";

export interface ActionAgent {
  agentId: string;
  agentNom: string;
  agentPrenom: string;
  etabUai: string;
  type: ActionType;
  acteur: "SG" | "N+1" | "N+2" | "Agent";
  libelle: string;
  detail?: string;
  butoirISO: string | null;
  joursRestants: number | null;
  urgence: Urgence;
  score: number;          // utilisé pour le tri (plus c'est haut, plus c'est urgent)
  href: string;           // bouton "Aller à l'agent"
  entretienId: string | null;
}

export interface AgentLite {
  id: string;
  nom: string;
  prenom: string;
  n1_user_id: string | null;
  n2_user_id: string | null;
  establishment_id: string;
}

export interface EntretienLite {
  id: string;
  agent_evalue_id: string;
  establishment_id: string;
  date_entretien: string | null;
  date_convocation: string | null;
  signature_n1_at: string | null;
  signature_agent_at: string | null;
  visa_n2_at: string | null;
  finalise_at: string | null;
}

export interface CampagneLite {
  establishment_id: string;
  date_butoir_signatures: string | null;
  date_cloture: string | null;
}

export function joursEntre(dateISO: string | null | undefined, today = new Date()): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO + "T00:00:00");
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return Math.round((+d - +t) / 86400000);
}

/** Classe l'urgence selon le nombre de jours restants par rapport au butoir. */
export function urgenceFromJours(j: number | null): Urgence {
  if (j === null) return "moyenne";
  if (j < 0) return "critique";        // butoir dépassé
  if (j <= 3) return "critique";
  if (j <= 10) return "haute";
  if (j <= 30) return "moyenne";
  return "basse";
}

const URGENCE_BASE: Record<Urgence, number> = {
  critique: 1000,
  haute: 500,
  moyenne: 200,
  basse: 50,
};

const TYPE_PRIORITE: Record<ActionType, number> = {
  finaliser: 90,
  viser_n2: 85,
  signer_n1: 80,
  signer_agent: 75,
  conduire_entretien: 70,
  convoquer: 60,
  planifier_date: 50,
  creer_entretien: 40,
  assigner_n1: 30,
  assigner_n2: 30,
};

function scoreAction(urgence: Urgence, type: ActionType, jours: number | null): number {
  const base = URGENCE_BASE[urgence] + TYPE_PRIORITE[type];
  // pénalité pour retard supplémentaire (plus c'est en retard, plus le score monte)
  const retardBonus = jours !== null && jours < 0 ? Math.min(-jours * 5, 200) : 0;
  return base + retardBonus;
}

/**
 * Construit la liste exhaustive des actions à faire à partir de l'état courant.
 * Pure function — aucun appel réseau, testable hors React.
 */
export function buildActionsAFaire(args: {
  agents: AgentLite[];
  entretiens: EntretienLite[];
  campagnes: CampagneLite[];
  uaiByEtabId: Record<string, string>;
  baseHref?: string; // par défaut /entretiens?agent=...
  today?: Date;
}): ActionAgent[] {
  const { agents, entretiens, campagnes, uaiByEtabId, today = new Date() } = args;
  const baseHref = args.baseHref ?? "/entretiens";

  const byAgent = new Map<string, EntretienLite>();
  entretiens.forEach((e) => byAgent.set(e.agent_evalue_id, e));

  const butoirByEtab = new Map<string, string | null>();
  campagnes.forEach((c) => {
    butoirByEtab.set(c.establishment_id, c.date_butoir_signatures ?? c.date_cloture ?? null);
  });

  const out: ActionAgent[] = [];

  for (const a of agents) {
    const e = byAgent.get(a.id);
    const etabUai = uaiByEtabId[a.establishment_id] ?? "—";
    const butoirEtab = butoirByEtab.get(a.establishment_id) ?? null;
    const hrefAgent = `${baseHref}?agent=${a.id}`;

    // Assignations RH manquantes — bloquant en amont
    if (!a.n1_user_id) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "assigner_n1", acteur: "SG",
        libelle: "Assigner un N+1 à l'agent",
        detail: "Un évaluateur N+1 doit être désigné dans la fiche RH avant la conduite de l'entretien.",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "assigner_n1", j),
        href: hrefAgent, entretienId: e?.id ?? null,
      });
      continue; // les autres actions ne s'appliquent pas tant que N+1 manquant
    }
    if (!a.n2_user_id) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "assigner_n2", acteur: "SG",
        libelle: "Assigner un N+2 (autorité hiérarchique) à l'agent",
        detail: "Un visa N+2 est obligatoire pour clôturer le CREP.",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "assigner_n2", j),
        href: hrefAgent, entretienId: e?.id ?? null,
      });
    }

    // Pas d'entretien créé
    if (!e) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "creer_entretien", acteur: "SG",
        libelle: "Créer le CREP de la campagne en cours",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "creer_entretien", j),
        href: `/entretiens/nouveau?agent=${a.id}`, entretienId: null,
      });
      continue;
    }

    // Entretien finalisé : aucune action
    if (e.finalise_at) continue;

    // Tout signé, reste à finaliser
    if (e.signature_n1_at && e.signature_agent_at && e.visa_n2_at && !e.finalise_at) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "finaliser", acteur: "SG",
        libelle: "Finaliser et archiver le CREP",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "finaliser", j),
        href: hrefAgent, entretienId: e.id,
      });
      continue;
    }

    // Visa N+2 attendu
    if (e.signature_agent_at && !e.visa_n2_at) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "viser_n2", acteur: "N+2",
        libelle: "Apposer le visa de l'autorité hiérarchique (N+2)",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "viser_n2", j),
        href: hrefAgent, entretienId: e.id,
      });
      continue;
    }

    // Signature agent attendue
    if (e.signature_n1_at && !e.signature_agent_at) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "signer_agent", acteur: "Agent",
        libelle: "Recueillir la signature de l'agent évalué",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "signer_agent", j),
        href: hrefAgent, entretienId: e.id,
      });
      continue;
    }

    // Signature N+1 attendue (entretien conduit ou date passée)
    if (e.date_entretien && !e.signature_n1_at) {
      const j = joursEntre(e.date_entretien, today);
      const passedOrToday = j !== null && j <= 0;
      if (passedOrToday) {
        const u = urgenceFromJours(j);
        out.push({
          agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
          type: "signer_n1", acteur: "N+1",
          libelle: "Saisir le compte rendu et signer (N+1)",
          detail: "L'entretien doit être consigné puis signé par l'évaluateur N+1.",
          butoirISO: e.date_entretien, joursRestants: j, urgence: u,
          score: scoreAction(u, "signer_n1", j),
          href: hrefAgent, entretienId: e.id,
        });
        continue;
      }
      // Entretien à venir
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "conduire_entretien", acteur: "N+1",
        libelle: "Conduire l'entretien professionnel",
        butoirISO: e.date_entretien, joursRestants: j, urgence: u,
        score: scoreAction(u, "conduire_entretien", j),
        href: hrefAgent, entretienId: e.id,
      });

      // Convocation manquante < 8 jours avant (règle réglementaire)
      if (!e.date_convocation && j !== null && j <= 8 && j >= 0) {
        out.push({
          agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
          type: "convoquer", acteur: "N+1",
          libelle: "Convoquer l'agent (délai réglementaire 8 jours)",
          detail: "La convocation doit être adressée au moins 8 jours avant l'entretien.",
          butoirISO: e.date_entretien, joursRestants: j, urgence: "critique",
          score: scoreAction("critique", "convoquer", j) + 50,
          href: hrefAgent, entretienId: e.id,
        });
      }
      continue;
    }

    // Aucune date d'entretien posée
    if (!e.date_entretien) {
      const j = joursEntre(butoirEtab, today);
      const u = urgenceFromJours(j);
      out.push({
        agentId: a.id, agentNom: a.nom, agentPrenom: a.prenom, etabUai,
        type: "planifier_date", acteur: "N+1",
        libelle: "Planifier la date d'entretien",
        butoirISO: butoirEtab, joursRestants: j, urgence: u,
        score: scoreAction(u, "planifier_date", j),
        href: hrefAgent, entretienId: e.id,
      });
    }
  }

  // Tri : urgence décroissante (score), puis nom agent
  out.sort((a, b) => b.score - a.score || a.agentNom.localeCompare(b.agentNom));
  return out;
}

export const URGENCE_LABELS: Record<Urgence, { label: string; color: string }> = {
  critique: { label: "Critique", color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300" },
  haute: { label: "Haute", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300" },
  moyenne: { label: "Moyenne", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300" },
  basse: { label: "Basse", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300" },
};

export const ACTEUR_COLORS: Record<ActionAgent["acteur"], string> = {
  SG: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  "N+1": "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "N+2": "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  Agent: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
};
