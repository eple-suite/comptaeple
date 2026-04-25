// Calcul de score et badges pour la gamification AIDE Op@le
// Référentiel : décision pédagogique académique du 25/04/2026.

export type OpaleBadge =
  | "premier_pas"
  | "contributeur_actif"
  | "expert_module"
  | "redacteur_or"
  | "moderateur_solidaire"
  | "veilleur";

export interface OpaleBadgeDef {
  id: OpaleBadge;
  label: string;
  description: string;
  seuil: number;
}

export const OPALE_BADGES: OpaleBadgeDef[] = [
  { id: "premier_pas", label: "Premier pas", description: "1 fiche publiée", seuil: 1 },
  { id: "contributeur_actif", label: "Contributeur actif", description: "5 fiches publiées", seuil: 5 },
  { id: "redacteur_or", label: "Rédacteur d'or", description: "15 fiches publiées avec utilité ≥ 70%", seuil: 15 },
  { id: "expert_module", label: "Expert module", description: "5 fiches publiées sur un même module Op@le", seuil: 5 },
  { id: "moderateur_solidaire", label: "Modérateur solidaire", description: "10 modérations effectuées", seuil: 10 },
  { id: "veilleur", label: "Veilleur", description: "5 vérifications de fiches à re-vérifier", seuil: 5 },
];

export interface OpaleScoreInput {
  nb_fiches_publiees: number;
  nb_questions_repondues: number;
  nb_evaluations_donnees: number;
  nb_signalements_pertinents: number;
  taux_utilite_moyen_pct: number;
}

/**
 * Score contributeur :
 * - 10 points par fiche publiée
 * - 3 points par réponse forum
 * - 1 point par évaluation
 * - 5 points par signalement pertinent
 * - bonus utilité : taux_utilite_moyen / 10
 */
export function calculerScoreContributeur(s: OpaleScoreInput): number {
  return Math.round(
    s.nb_fiches_publiees * 10 +
      s.nb_questions_repondues * 3 +
      s.nb_evaluations_donnees * 1 +
      s.nb_signalements_pertinents * 5 +
      (s.taux_utilite_moyen_pct || 0) / 10,
  );
}

export function determinerBadges(input: {
  nb_fiches_publiees: number;
  nb_fiches_par_module: Record<string, number>;
  nb_moderations: number;
  nb_verifications: number;
  taux_utilite_moyen_pct: number;
}): OpaleBadge[] {
  const acquis: OpaleBadge[] = [];
  if (input.nb_fiches_publiees >= 1) acquis.push("premier_pas");
  if (input.nb_fiches_publiees >= 5) acquis.push("contributeur_actif");
  if (input.nb_fiches_publiees >= 15 && input.taux_utilite_moyen_pct >= 70) acquis.push("redacteur_or");
  if (Object.values(input.nb_fiches_par_module).some((n) => n >= 5)) acquis.push("expert_module");
  if (input.nb_moderations >= 10) acquis.push("moderateur_solidaire");
  if (input.nb_verifications >= 5) acquis.push("veilleur");
  return acquis;
}

/**
 * Détecte les fiches dont la péremption approche (à re-vérifier dans ≤ 30 jours).
 */
export function fichesAReverifier<T extends {
  date_derniere_verification: string | null;
  periodicite_reverification_mois: number;
  statut_actualite: string;
}>(fiches: T[], now = new Date()): T[] {
  return fiches.filter((f) => {
    if (f.statut_actualite === "obsolete") return true;
    if (!f.date_derniere_verification) return false;
    const last = new Date(f.date_derniere_verification);
    const next = new Date(last);
    next.setMonth(next.getMonth() + (f.periodicite_reverification_mois || 12));
    const diffJours = (next.getTime() - now.getTime()) / 86400000;
    return diffJours <= 30;
  });
}