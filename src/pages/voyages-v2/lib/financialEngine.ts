// ════════════════════════════════════════════════════════════════
// Moteur financier — Voyages scolaires v2
// Conforme M9-6 / GBCP / circulaire MENE2407159C / loi 66-948 art.21
// ════════════════════════════════════════════════════════════════

import type {
  VoyageRecette,
  VoyageDepense,
  Voyage,
  NatureRecette,
  PosteDepense,
} from "../types";

export interface BudgetSnapshot {
  totalRecettes: number;
  totalRecettesSecurisees: number; // statut = notifiee
  totalDepenses: number;
  totalDepensesTTC: number;
  solde: number; // recettes - dépenses
  soldeSecurise: number; // recettes notifiées - dépenses
  partFamilles: number;
  partSubventions: number;
  partAutres: number;
  pctFamilles: number; // 0..100
  pctSubventions: number;
  coutParEleve: number;
  participationParEleve: number;
  pointMortEleves: number; // nb élèves min pour équilibre
  equilibre: "excedent" | "equilibre" | "deficit";
  alertes: AlerteFinanciere[];
}

export interface AlerteFinanciere {
  niveau: "info" | "warning" | "critical";
  code: string;
  message: string;
  recommandation?: string;
}

const TOLERANCE_EQUILIBRE = 0.5; // ±0,50 € considéré équilibré

/**
 * Calcule un instantané financier complet d'un voyage.
 * Robuste : tolère des tableaux vides ou des montants nuls.
 */
export function snapshotVoyage(
  voyage: Pick<Voyage, "nb_eleves_prevus">,
  recettes: VoyageRecette[] = [],
  depenses: VoyageDepense[] = [],
): BudgetSnapshot {
  const safeRecettes = Array.isArray(recettes) ? recettes : [];
  const safeDepenses = Array.isArray(depenses) ? depenses : [];
  const nbEleves = Math.max(0, Number(voyage.nb_eleves_prevus) || 0);

  const totalRecettes = safeRecettes.reduce((s, r) => s + (Number(r.montant) || 0), 0);
  const totalRecettesSecurisees = safeRecettes
    .filter((r) => r.statut_financeur === "notifiee")
    .reduce((s, r) => s + (Number(r.montant) || 0), 0);

  const totalDepenses = safeDepenses.reduce((s, d) => s + (Number(d.montant_ht) || 0), 0);
  const totalDepensesTTC = safeDepenses.reduce((s, d) => s + (Number(d.montant_ttc) || Number(d.montant_ht) || 0), 0);

  const partFamilles = sumByNature(safeRecettes, ["famille", "ancv"]);
  const partSubventions = sumByNature(safeRecettes, [
    "subv_region", "subv_dep", "subv_commune", "subv_etat", "subv_autre", "erasmus",
  ]);
  const partAutres = totalRecettes - partFamilles - partSubventions;

  const pctFamilles = totalRecettes > 0 ? (partFamilles / totalRecettes) * 100 : 0;
  const pctSubventions = totalRecettes > 0 ? (partSubventions / totalRecettes) * 100 : 0;

  const coutParEleve = nbEleves > 0 ? totalDepensesTTC / nbEleves : 0;
  const participationParEleve = nbEleves > 0 ? partFamilles / nbEleves : 0;

  // Point mort : combien d'élèves faut-il pour couvrir les dépenses,
  // sachant le ticket moyen famille (s'il existe).
  const pointMortEleves =
    participationParEleve > 0
      ? Math.ceil((totalDepensesTTC - partSubventions - partAutres) / participationParEleve)
      : 0;

  const solde = totalRecettes - totalDepensesTTC;
  const soldeSecurise = totalRecettesSecurisees - totalDepensesTTC;

  let equilibre: BudgetSnapshot["equilibre"] = "equilibre";
  if (solde > TOLERANCE_EQUILIBRE) equilibre = "excedent";
  else if (solde < -TOLERANCE_EQUILIBRE) equilibre = "deficit";

  const alertes = evaluerAlertes({
    solde,
    soldeSecurise,
    totalRecettes,
    totalRecettesSecurisees,
    totalDepensesTTC,
    nbEleves,
    coutParEleve,
    participationParEleve,
    pctFamilles,
  });

  return {
    totalRecettes,
    totalRecettesSecurisees,
    totalDepenses,
    totalDepensesTTC,
    solde,
    soldeSecurise,
    partFamilles,
    partSubventions,
    partAutres,
    pctFamilles,
    pctSubventions,
    coutParEleve,
    participationParEleve,
    pointMortEleves,
    equilibre,
    alertes,
  };
}

function sumByNature(recettes: VoyageRecette[], natures: NatureRecette[]): number {
  const set = new Set(natures);
  return recettes
    .filter((r) => set.has(r.nature))
    .reduce((s, r) => s + (Number(r.montant) || 0), 0);
}

function evaluerAlertes(ctx: {
  solde: number;
  soldeSecurise: number;
  totalRecettes: number;
  totalRecettesSecurisees: number;
  totalDepensesTTC: number;
  nbEleves: number;
  coutParEleve: number;
  participationParEleve: number;
  pctFamilles: number;
}): AlerteFinanciere[] {
  const out: AlerteFinanciere[] = [];

  if (ctx.totalDepensesTTC > 0 && ctx.solde < -TOLERANCE_EQUILIBRE) {
    out.push({
      niveau: "critical",
      code: "BUDGET_DEFICIT",
      message: `Budget en déficit de ${formatEuro(Math.abs(ctx.solde))}.`,
      recommandation: "Revoir la part familles ou solliciter une subvention complémentaire avant le vote du CA.",
    });
  }

  if (ctx.totalRecettes > 0 && ctx.soldeSecurise < 0 && ctx.solde >= 0) {
    out.push({
      niveau: "warning",
      code: "RECETTES_NON_SECURISEES",
      message: `Le voyage ne tient à l'équilibre qu'avec des recettes non notifiées.`,
      recommandation: "Confirmer les subventions / participations avant départ.",
    });
  }

  if (ctx.pctFamilles > 80 && ctx.totalRecettes > 0) {
    out.push({
      niveau: "warning",
      code: "FAMILLES_DOMINANT",
      message: `Les familles financent ${ctx.pctFamilles.toFixed(0)}% du voyage.`,
      recommandation: "Rechercher des cofinancements (Région, FSE, taxe d'apprentissage, dons).",
    });
  }

  if (ctx.nbEleves === 0) {
    out.push({
      niveau: "info",
      code: "EFFECTIF_INCONNU",
      message: "Effectif élèves non renseigné — coût par élève non calculable.",
    });
  }

  if (ctx.participationParEleve > 0 && ctx.participationParEleve > 800) {
    out.push({
      niveau: "warning",
      code: "TICKET_FAMILLE_ELEVE",
      message: `Participation famille de ${formatEuro(ctx.participationParEleve)} par élève.`,
      recommandation: "Vérifier l'accessibilité financière (fonds sociaux, ANCV, échelonnement).",
    });
  }

  return out;
}

export function formatEuro(n: number): string {
  if (!Number.isFinite(n)) return "0,00 €";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/** Suggère un compte M9-6 pour un poste de dépense (fallback safe). */
export function compteSuggereDepense(poste: PosteDepense | string): string {
  const map: Record<string, string> = {
    transport: "C/6245",
    hebergement: "C/6258",
    restauration: "C/6256",
    activites: "C/6257",
    assurance: "C/616",
    admin: "C/6228",
    fournitures: "C/6068",
    divers: "C/6288",
    accompagnateurs: "C/6256",
  };
  return map[poste] || "C/6288";
}

/** Suggère un compte M9-6 pour une nature de recette (fallback safe). */
export function compteSuggereRecette(nature: NatureRecette | string): string {
  const map: Record<string, string> = {
    famille: "C/70881",
    subv_region: "C/7442",
    subv_dep: "C/7443",
    subv_commune: "C/7448",
    subv_etat: "C/7411",
    subv_autre: "C/7488",
    don_fse: "C/7588",
    taxe_apprentissage: "C/7482",
    ressources_propres: "C/7588",
    erasmus: "C/74189",
    ancv: "C/70881",
    don_tacite: "C/7588",
  };
  return map[nature] || "C/7588";
}