// Types métier de la plateforme académique AIDE Op@le

export const OPALE_MODULES = [
  "comptabilite_generale",
  "comptabilite_budgetaire",
  "depense",
  "recette",
  "tresorerie",
  "paie",
  "immobilisations",
  "integration_pes",
  "inventaire",
  "restitutions",
  "parametrage",
  "habilitations",
  "autre",
] as const;
export type OpaleModule = (typeof OPALE_MODULES)[number];

export const OPALE_MODULES_LABELS: Record<OpaleModule, string> = {
  comptabilite_generale: "Comptabilité générale",
  comptabilite_budgetaire: "Comptabilité budgétaire",
  depense: "Dépense",
  recette: "Recette",
  tresorerie: "Trésorerie",
  paie: "Paie",
  immobilisations: "Immobilisations",
  integration_pes: "Intégration PES",
  inventaire: "Inventaire",
  restitutions: "Restitutions",
  parametrage: "Paramétrage",
  habilitations: "Habilitations",
  autre: "Autre",
};

export const OPALE_TYPES_CONTENU = [
  "procedure",
  "blocage_resolu",
  "astuce",
  "contournement",
  "parametrage",
  "question_reponse",
] as const;
export type OpaleTypeContenu = (typeof OPALE_TYPES_CONTENU)[number];

export const OPALE_TYPES_LABELS: Record<OpaleTypeContenu, string> = {
  procedure: "Procédure",
  blocage_resolu: "Blocage résolu",
  astuce: "Astuce",
  contournement: "Contournement",
  parametrage: "Paramétrage",
  question_reponse: "Q/R",
};

export type OpaleStatutActualite = "valide" | "a_verifier" | "obsolete" | "en_revision";
export type OpaleStatutPublication =
  | "brouillon"
  | "soumise"
  | "en_validation"
  | "publiee"
  | "rejetee"
  | "archivee";
export type OpaleVisibilite = "prive_groupement" | "academique" | "national_si_partage";

export interface OpaleEtapeProcedure {
  numero: number;
  description: string;
  capture_url?: string | null;
  vigilance?: string | null;
}

export interface OpalePieceJointe {
  id: string;
  nom: string;
  url: string;
  type: "image" | "fichier" | "video";
  anonymise?: boolean;
}

export interface OpaleFiche {
  id: string;
  titre: string;
  slug: string;
  auteur_id: string;
  groupement_origine_id: string | null;
  module_opale: OpaleModule;
  sous_theme: string | null;
  type_contenu: OpaleTypeContenu;
  symptome_observe: string | null;
  contexte_apparition: string | null;
  cause_identifiee: string | null;
  procedure_resolution: OpaleEtapeProcedure[];
  pieces_jointes: OpalePieceJointe[];
  version_opale_concernee: string;
  date_constatation: string | null;
  statut_actualite: OpaleStatutActualite;
  date_derniere_verification: string | null;
  verifie_par_id: string | null;
  periodicite_reverification_mois: number;
  statut_publication: OpaleStatutPublication;
  visibilite: OpaleVisibilite;
  modere_par_id: string | null;
  date_moderation: string | null;
  motif_rejet: string | null;
  nb_consultations: number;
  nb_utiles: number;
  nb_pas_utiles: number;
  taux_utilite_pct: number;
  tags: string[];
  liens_fiches_associees: string[];
  references_documentation_officielle: string | null;
  date_creation: string;
  date_publication: string | null;
  date_maj: string;
  notes_internes: string | null;
}

export const STATUT_ACTUALITE_LABELS: Record<OpaleStatutActualite, { label: string; color: string }> = {
  valide: { label: "À jour", color: "bg-success/15 text-success border-success/30" },
  a_verifier: { label: "À vérifier", color: "bg-warning/15 text-warning border-warning/30" },
  obsolete: { label: "Obsolète", color: "bg-destructive/15 text-destructive border-destructive/30" },
  en_revision: { label: "En révision", color: "bg-muted text-muted-foreground border-border" },
};

export const STATUT_PUBLICATION_LABELS: Record<OpaleStatutPublication, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  en_validation: "En validation",
  publiee: "Publiée",
  rejetee: "Rejetée",
  archivee: "Archivée",
};

export const VISIBILITE_LABELS: Record<OpaleVisibilite, string> = {
  prive_groupement: "Privé groupement",
  academique: "Académique",
  national_si_partage: "National",
};