// ═══════════════════════════════════════════════════════════════
// Types métier — Module Voyages scolaires (chantier 1)
// Conformes : MENE2407159C, M9-6, GBCP, CCP 2026, LF 66-948 art. 21
// ═══════════════════════════════════════════════════════════════

export type TypeSortie = "sortie_jour" | "sortie_repas" | "voyage_1nuit" | "voyage_nuitees";
export type CaractereVoyage = "obligatoire" | "facultatif";
export type TypeProjet = "cle_en_main" | "prestataires_separes" | "erasmus_porteur" | "erasmus_partenaire";
export type StatutVoyage = "projet" | "autorise_ca" | "en_cours" | "execute" | "bilan_ca" | "clos" | "annule";

export type StatutFinanceur = "notifiee" | "demandee" | "promesse" | "hypothese";
export type NatureRecette =
  | "famille" | "subv_region" | "subv_dep" | "subv_commune" | "subv_etat"
  | "subv_autre" | "don_fse" | "taxe_apprentissage" | "ressources_propres"
  | "erasmus" | "ancv" | "don_tacite";

export type PosteDepense =
  | "transport" | "hebergement" | "restauration" | "activites" | "assurance"
  | "admin" | "fournitures" | "divers" | "accompagnateurs";

export type StatutInscription = "inscrit" | "confirme" | "desiste" | "present" | "rembourse";

export interface Voyage {
  id: string;
  establishment_id: string;
  user_id: string;
  reference_interne: string;
  libelle: string;
  destination_ville: string;
  destination_pays: string;
  type_sortie: TypeSortie;
  caractere: CaractereVoyage;
  type_projet: TypeProjet;
  date_depart: string | null;
  date_retour: string | null;
  nombre_nuitees: number;
  classes_concernees: string[];
  nb_eleves_prevus: number;
  nb_accompagnateurs_prevus: number;
  responsable_pedago_id: string | null;
  responsable_pedago_nom: string;
  lien_projet_etablissement: string;
  rattachement_adage: boolean;
  statut: StatutVoyage;
  date_ca_autorisation: string | null;
  numero_acte_ca: string | null;
  // Deux délibérations CA distinctes (R.421-20 Code éducation)
  // Vote n°1 : autorisation de principe (programmation, contributions)
  date_ca_principe: string | null;
  numero_acte_ca_principe: string | null;
  // Vote n°2 : approbation du budget définitif (post mise en concurrence)
  date_ca_budget: string | null;
  numero_acte_ca_budget: string | null;
  montant_total_ht: number;
  montant_total_ttc: number;
  devise: string;
  agence_nom: string | null;
  agence_siret: string | null;
  agence_garantie: string | null;
  conditions_annulation: any[];
  erasmus_type: string | null;
  erasmus_convention_ref: string | null;
  erasmus_subvention_notifiee: number;
  erasmus_avance_recue: number;
  erasmus_periode_debut: string | null;
  erasmus_periode_fin: string | null;
  erasmus_taux_cofi: number;
  regie_avances_id: string | null;
  regie_recettes_id: string | null;
  caf_dispositif: string | null;
  tags_pedago: string[];
  wizard_step: number;
  wizard_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoyageRecette {
  id: string;
  voyage_id: string;
  libelle: string;
  nature: NatureRecette;
  montant: number;
  statut_financeur: StatutFinanceur;
  imputation_compte: string;
  titre_recette_num: string | null;
  statut_encaissement: string;
  pj_url: string | null;
  observations: string;
  created_at: string;
}

export interface VoyageDepense {
  id: string;
  voyage_id: string;
  poste: PosteDepense;
  libelle: string;
  fournisseur: string;
  montant_ht: number;
  taux_tva: number;
  montant_ttc: number;
  compte_charge: string;
  bon_commande: string | null;
  devis_url: string | null;
  facture_url: string | null;
  service_fait_date: string | null;
  statut_paiement: string;
  est_accompagnateur: boolean;
  created_at: string;
}

export interface VoyageParticipant {
  id: string;
  voyage_id: string;
  ine: string | null;
  numero_interne: string | null;
  nom: string;
  prenom: string;
  sexe: string | null;
  date_naissance: string | null;
  classe: string;
  mef: string | null;
  regime: string | null;
  boursier: boolean;
  echelon_bourse: number | null;
  responsables: any[];
  statut_inscription: StatutInscription;
  participation_theorique: number;
  participation_reelle: number;
  bourse_deduite: number;
  fonds_social: number;
  aide_fse: number;
  reste_a_payer: number;
  mode_paiement: string | null;
  date_paiement: string | null;
  quittance_ref: string | null;
}

export const TYPE_PROJET_LABELS: Record<TypeProjet, string> = {
  cle_en_main: "Clé en main (agence)",
  prestataires_separes: "Prestataires séparés",
  erasmus_porteur: "Erasmus+ porteur",
  erasmus_partenaire: "Erasmus+ partenaire",
};

export const STATUT_VOYAGE_LABELS: Record<StatutVoyage, string> = {
  projet: "En projet",
  autorise_ca: "Autorisé en CA",
  en_cours: "En cours",
  execute: "Exécuté",
  bilan_ca: "Bilan voté en CA",
  clos: "Clos",
  annule: "Annulé",
};

export const STATUT_FINANCEUR_LABELS: Record<StatutFinanceur, string> = {
  notifiee: "Notifiée (sécurisée)",
  demandee: "Demandée (en attente)",
  promesse: "Promesse (à sécuriser)",
  hypothese: "Hypothèse",
};

export const STATUT_FINANCEUR_COLORS: Record<StatutFinanceur, string> = {
  notifiee: "bg-emerald-100 text-emerald-900 border-emerald-300",
  demandee: "bg-orange-100 text-orange-900 border-orange-300",
  promesse: "bg-yellow-100 text-yellow-900 border-yellow-300",
  hypothese: "bg-muted text-muted-foreground border-border",
};

export const POSTE_DEPENSE_LABELS: Record<PosteDepense, string> = {
  transport: "Transport (aller + retour + local)",
  hebergement: "Hébergement",
  restauration: "Restauration",
  activites: "Activités et visites",
  assurance: "Assurance (annul./assistance/RC)",
  admin: "Documents administratifs (passeports, visas)",
  fournitures: "Fournitures pédagogiques",
  divers: "Frais divers",
  accompagnateurs: "Coût des accompagnateurs (réservé)",
};

export const NATURE_RECETTE_LABELS: Record<NatureRecette, string> = {
  famille: "Participation des familles",
  subv_region: "Subvention Région",
  subv_dep: "Subvention Département",
  subv_commune: "Subvention Commune",
  subv_etat: "Subvention État / Rectorat",
  subv_autre: "Subvention autre (fondations…)",
  don_fse: "Don FSE / coopérative / parents",
  taxe_apprentissage: "Taxe d'apprentissage",
  ressources_propres: "Ressources propres EPLE",
  erasmus: "Subvention Erasmus+",
  ancv: "Chèques-vacances ANCV",
  don_tacite: "Don tacite (post-bilan < 8 €)",
};

/** Imputation comptable M9-6 proposée selon nature de recette */
export const NATURE_RECETTE_IMPUTATION: Record<NatureRecette, string> = {
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

export const POSTE_DEPENSE_COMPTE: Record<PosteDepense, string> = {
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
