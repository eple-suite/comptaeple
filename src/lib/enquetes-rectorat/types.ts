/**
 * Module Enquêtes Rectorat — Types partagés.
 * Chantier 1-9 du livrable Plateforme Académique.
 * Références : M9-6 tome 3, note DAF A3 / DGESCO, circulaire MENE1704160C 17/02/2017,
 * Code éducation L.421-11, GBCP 2012-1246.
 */

export type SensSoldeNormal = "D" | "C" | "nul" | "D_ou_nul" | "C_ou_nul" | "variable";
export type FinanceurType =
  | "etat" | "collectivite" | "ue" | "organisme_public"
  | "organisme_prive" | "dgf" | "famille" | "autre";
export type NiveauAlerte = "critique" | "majeure" | "mineure" | "info";

export interface CompteEnqueteRef {
  id: string;
  compte: string;
  libelle: string;
  racine_famille: string;
  programme_bop: string | null;
  sous_programme: string | null;
  sens_solde_normal: SensSoldeNormal;
  despecialisable: boolean;
  financeur_type: FinanceurType;
  niveau_alerte_si_anormal: NiveauAlerte;
  commentaire_reglementaire: string | null;
  reference_reglementaire: string | null;
  actif: boolean;
}

export type CampagneStatut = "brouillon" | "ouverte" | "clôturée" | "archivée";
export type CampagneOrigine = "rectorat" | "ac" | "systeme";

export interface EnqueteCampagne {
  id: string;
  intitule: string;
  type_enquete: string;
  periode_concernee: string | null;
  date_lancement: string;
  date_echeance: string;
  statut: CampagneStatut;
  perimetre_etablissement_ids: string[];
  cree_par: string | null;
  origine: CampagneOrigine;
  description: string | null;
}

export type ReponseStatut =
  | "non_commencee" | "en_cours" | "soumise" | "validee" | "rejetee";

export interface EnqueteReponseEple {
  id: string;
  campagne_id: string;
  establishment_id: string;
  statut: ReponseStatut;
  donnees: Record<string, unknown>;
  commentaires_ac: string | null;
  commentaires_rectorat: string | null;
  soumise_le: string | null;
  validee_le: string | null;
  signataire_ac: string | null;
  signataire_ordo: string | null;
}

/** Règle métier de non-déspécialisation (DAF A3). */
export type ActionReliquat =
  | "reaffectation"
  | "despecialisation"
  | "reversement_familles"
  | "restitution_rectorat"
  | "report_exercice_suivant";

export interface ControleDespecialisation {
  autorise: boolean;
  motif: string;
  reference: string;
}

/**
 * Vérifie si l'action proposée sur un compte est autorisée.
 * Pour un compte non déspécialisable (443110, 44114 AED, 441914), seuls le reversement
 * familles et la restitution rectorat sont autorisés.
 */
export function controleAction(
  compte: Pick<CompteEnqueteRef, "compte" | "despecialisable" | "libelle">,
  action: ActionReliquat,
): ControleDespecialisation {
  if (compte.despecialisable) {
    return {
      autorise: true,
      motif: `Compte ${compte.compte} déspécialisable, action « ${action} » autorisée.`,
      reference: "M9-6 tome 3",
    };
  }
  // Compte NON déspécialisable
  if (action === "reaffectation" || action === "despecialisation") {
    return {
      autorise: false,
      motif: `Compte ${compte.compte} (${compte.libelle}) NON DÉSPÉCIALISABLE — réaffectation/déspécialisation interdite par la note DAF A3.`,
      reference: "Note DAF A3 / DGESCO",
    };
  }
  if (action === "reversement_familles" || action === "restitution_rectorat") {
    return {
      autorise: true,
      motif: `Action conforme : ${action.replace("_", " ")} autorisée pour le compte non déspécialisable ${compte.compte}.`,
      reference: "DAF A3 / Circulaire MENE1704160C",
    };
  }
  return {
    autorise: false,
    motif: `Action « ${action} » non autorisée par défaut sur compte non déspécialisable.`,
    reference: "DAF A3",
  };
}