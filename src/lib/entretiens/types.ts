/**
 * Module Entretiens professionnels — types métier.
 *
 * Conformité :
 *  - Décret 2010-888 du 28/07/2010 (appréciation valeur professionnelle)
 *  - Décret 86-83 du 17/01/1986 (agents contractuels)
 *  - Circulaire MENH1310955C (BO n°22 du 30/05/2013)
 *  - Annexes C9 (CREP) et C9 bis (CREF)
 *  - Modèles académie de la Guadeloupe
 */

export type EntretienStatut =
  | "brouillon"
  | "convocation_envoyee"
  | "entretien_realise"
  | "redaction_n1"
  | "en_attente_signature_n1"
  | "notifie_agent_pour_observations"
  | "en_attente_signature_agent"
  | "en_attente_visa_n2"
  | "finalise"
  | "archive"
  | "recours_en_cours"
  | "revision_demandee";

export type AgentCategorie = "A" | "B" | "C";
export type AgentStatut =
  | "titulaire"
  | "contractuel_cdd"
  | "contractuel_cdi"
  | "detache"
  | "mis_a_disposition";
export type AgentFiliere =
  | "AENES"
  | "ITRF"
  | "Bibliotheques"
  | "SAENES"
  | "Medico_sociale"
  | "Autre";
export type EntretienMode = "presentiel" | "visio" | "hybride";

export type ObjectifAtteinte =
  | "atteint"
  | "partiellement_atteint"
  | "non_atteint"
  | "sans_objet";

export type CompetenceNiveau =
  | "excellent"
  | "tres_bon"
  | "satisfaisant"
  | "a_developper"
  | "insuffisant"
  | "sans_objet";

export type CompetenceConfiance = "eleve" | "moyen" | "faible";

export type FormationCategorie = "T1" | "T2" | "T3";
export type FormationPriorite = "haute" | "moyenne" | "basse";
export type FormationFondement = "agent" | "evaluateur" | "consensuelle";

export type RubriqueC =
  | "C1_resultats"
  | "C2_competences_techniques"
  | "C3_qualites_personnelles"
  | "C4_encadrement";

export interface Agent {
  id: string;
  establishment_id: string;
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  email?: string | null;
  corps?: string | null;
  grade?: string | null;
  echelon?: number | null;
  indice?: number | null;
  categorie?: AgentCategorie | null;
  filiere?: AgentFiliere | null;
  statut: AgentStatut;
  administration_origine?: string | null;
  date_entree_corps?: string | null;
  date_entree_etablissement?: string | null;
  date_derniere_promotion?: string | null;
  service?: string | null;
  fonction?: string | null;
  quotite_travail?: number | null;
  fiche_poste_id?: string | null;
  n1_user_id?: string | null;
  n2_user_id?: string | null;
  actif: boolean;
  notes_rh?: string | null;
}

export interface EntretienProfessionnel {
  id: string;
  establishment_id: string;
  agent_evalue_id: string;
  evaluateur_user_id: string;
  autorite_n2_user_id?: string | null;
  campagne_annee: string;
  periode_debut?: string | null;
  periode_fin?: string | null;
  statut: EntretienStatut;
  date_convocation?: string | null;
  date_entretien?: string | null;
  duree_entretien_min?: number | null;
  lieu?: string | null;
  mode?: EntretienMode | null;
  texte_libre_appreciation?: string | null;
  texte_libre_formation?: string | null;
  ia_response_json?: IaRepartitionResponse | null;
  ia_score_completude?: number | null;
  appreciation_generale?: string | null;
  perspectives?: string | null;
  signature_n1_at?: string | null;
  observations_agent?: string | null;
  signature_agent_at?: string | null;
  visa_n2_at?: string | null;
  observations_n2?: string | null;
  finalise_at?: string | null;
  pdf_crep_url?: string | null;
  pdf_cref_url?: string | null;
}

export interface SousCritere {
  critere: string;
  niveau: CompetenceNiveau;
  confiance: CompetenceConfiance;
  commentaire: string;
  extrait_source?: string;
}

export interface RubriqueRepartition {
  synthese: string;
  sous_criteres: SousCritere[];
}

export interface ObjectifPasseIA {
  libelle: string;
  atteinte: ObjectifAtteinte;
  commentaire: string;
}

export interface ObjectifFuturIA {
  libelle: string;
  indicateur: string;
  echeance: string;
}

export interface DemandeFormationIA {
  intitule: string;
  categorie: FormationCategorie;
  priorite: FormationPriorite;
  fondement: FormationFondement;
  extrait_source?: string;
}

export interface BilanFormationIA {
  intitule: string;
  organisme?: string;
  duree_heures?: number;
  evaluation?: "utile" | "partiellement_utile" | "non_utile";
  reinvestissement?: string;
}

export interface ElementARetirer {
  extrait: string;
  motif: string;
}

/** Schéma JSON strict retourné par l'edge function de répartition IA. */
export interface IaRepartitionResponse {
  objectifs_passes: ObjectifPasseIA[];
  competences: {
    C1_resultats: RubriqueRepartition;
    C2_competences_techniques: RubriqueRepartition;
    C3_qualites_personnelles: RubriqueRepartition;
    C4_encadrement: RubriqueRepartition;
  };
  appreciation_generale: string;
  perspectives: string;
  objectifs_futurs_suggeres: ObjectifFuturIA[];
  formation: {
    bilan_periode: BilanFormationIA[];
    demandes: DemandeFormationIA[];
    projet_professionnel: string;
  };
  elements_a_retirer: ElementARetirer[];
  score_completude: number;
}

/* Libellés UI — barème officiel */
export const NIVEAUX_LABELS: Record<CompetenceNiveau, string> = {
  excellent: "Excellent",
  tres_bon: "Très bon",
  satisfaisant: "Satisfaisant",
  a_developper: "À développer",
  insuffisant: "Insuffisant",
  sans_objet: "Sans objet",
};

export const STATUT_LABELS: Record<EntretienStatut, string> = {
  brouillon: "Brouillon",
  convocation_envoyee: "Convocation envoyée",
  entretien_realise: "Entretien réalisé",
  redaction_n1: "Rédaction N+1",
  en_attente_signature_n1: "Attente signature N+1",
  notifie_agent_pour_observations: "Notifié à l'agent",
  en_attente_signature_agent: "Attente signature agent",
  en_attente_visa_n2: "Attente visa N+2",
  finalise: "Finalisé",
  archive: "Archivé",
  recours_en_cours: "Recours en cours",
  revision_demandee: "Révision demandée",
};

export const RUBRIQUES_C_LABELS: Record<RubriqueC, string> = {
  C1_resultats: "C.1 — Résultats professionnels",
  C2_competences_techniques: "C.2 — Compétences professionnelles et techniques",
  C3_qualites_personnelles: "C.3 — Qualités personnelles et relationnelles",
  C4_encadrement: "C.4 — Aptitude à l'encadrement / conduite de projets",
};

export const CATEGORIES_FORMATION_LABELS: Record<FormationCategorie, string> = {
  T1: "T1 — Adaptation immédiate au poste",
  T2: "T2 — Adaptation à l'évolution prévisible des métiers",
  T3: "T3 — Développement des qualifications (CPF mobilisable)",
};

/** Sous-critères réglementaires (article 3 décret 2010-888, circulaire MENH1310955C). */
export const SOUS_CRITERES_REGLEMENTAIRES: Record<RubriqueC, string[]> = {
  C1_resultats: [
    "Atteinte des objectifs annuels",
    "Qualité du travail produit",
    "Quantité et productivité",
    "Respect des délais",
    "Initiative et autonomie",
  ],
  C2_competences_techniques: [
    "Connaissances professionnelles (réglementaires, techniques, métier)",
    "Maîtrise des outils (informatique, applications métier — Op@le, SIECLE, GFE…)",
    "Compétences rédactionnelles",
    "Capacité à se tenir informé des évolutions",
    "Polyvalence",
  ],
  C3_qualites_personnelles: [
    "Sens du service public, déontologie, discrétion",
    "Aptitude à travailler en équipe",
    "Qualités relationnelles avec les usagers",
    "Capacité d'adaptation",
    "Capacité d'écoute, de négociation",
    "Réactivité",
    "Implication, engagement",
    "Ponctualité, assiduité",
    "Capacité à gérer le stress",
  ],
  C4_encadrement: [
    "Animation d'équipe",
    "Délégation",
    "Capacité à fixer des objectifs",
    "Conduite de projet",
    "Pilotage et reporting",
  ],
};