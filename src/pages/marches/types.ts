// ═══════════════════════════════════════════════════════════════
// Types métier — Module Marchés publics (CCP 2026)
// ═══════════════════════════════════════════════════════════════

export type TypeMarche = "fournitures" | "services" | "travaux";
export type TypeMarcheSeuil = "fournitures_services" | "travaux" | "fournitures_services_etat";
export type ProcedureCalculee = "dispense" | "mapa" | "mapa_publicite" | "formalisee";
export type StatutMarche =
  | "preparation"
  | "publie"
  | "analyse"
  | "attribue"
  | "notifie"
  | "execution"
  | "solde"
  | "cloture"
  | "resilie";

export interface SeuilCcp {
  id: string;
  date_debut: string; // ISO date
  date_fin: string | null;
  type_marche: TypeMarcheSeuil;
  seuil_dispense: number;
  seuil_mapa_publicite: number | null;
  seuil_formalisee: number;
  seuil_petits_lots: number | null;
  seuil_profil_acheteur: number | null;
  base_legale: string;
  commentaire: string;
}

export interface FamilleAchat {
  id: string;
  code: string;
  libelle: string;
  type_marche: TypeMarche;
  groupe: string;
  ordre: number;
  actif: boolean;
}

export interface FournisseurMarche {
  id: string;
  establishment_id: string;
  raison_sociale: string;
  siret: string | null;
  adresse: string;
  code_postal: string;
  ville: string;
  contact_nom: string;
  contact_email: string;
  contact_tel: string;
  familles_principales: string[];
  notes: string;
  actif: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CritereAttribution {
  libelle: string;
  ponderation: number; // %
  description?: string;
}

export interface ChecklistValidation {
  besoin_clair?: boolean;
  estimation_sourcee?: boolean;
  procedure_coherente?: boolean;
  saucissonnage_verifie?: boolean;
  retroplanning_realiste?: boolean;
  allotissement_documente?: boolean;
  criteres_100?: boolean;
  clause_environnementale?: boolean;
  inscription_budgetaire?: boolean;
  delegation_signature?: boolean;
}

export interface HistoriqueAction {
  date: string;
  user: string;
  action: string;
  detail?: string;
}

export interface Marche {
  id: string;
  establishment_id: string;
  reference_interne: string;
  libelle: string;
  service_demandeur: string;
  demandeur: string;
  date_emission_besoin: string;
  date_livraison_souhaitee: string | null;
  date_engagement: string | null;
  date_notification_cible: string | null;
  type_marche: TypeMarche;
  famille_code: string;
  description: string;
  quantites: string;
  specifications: string;
  contraintes: string;
  exigences_environnementales: string;
  clauses_sociales: string;
  allotissement: boolean;
  justification_lot_unique: string;

  methode_estimation: string;
  montant_estime_ht: number;
  taux_tva: number;
  montant_estime_ttc: number;
  duree_mois: number;
  reconductions_nb: number;
  reconductions_duree_mois: number;
  montant_total_ht: number;

  cumul_meme_famille_12m: number;
  previsionnel_12m_suivants: number;
  cumul_total_12m: number;

  procedure_calculee: ProcedureCalculee;
  base_legale: string;

  criteres: CritereAttribution[];
  methode_notation_prix: string;

  chapitre_budgetaire: string;
  compte_imputation: string;
  code_activite: string;

  statut: StatutMarche;
  fournisseur_attributaire_id: string | null;
  date_attribution: string | null;
  date_notification: string | null;
  date_fin_execution: string | null;
  montant_realise: number;

  checklist_validation: ChecklistValidation;
  historique: HistoriqueAction[];

  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MarcheLot {
  id: string;
  marche_id: string;
  numero: number;
  titre: string;
  description: string;
  montant_estime_ht: number;
  criteres: CritereAttribution[];
  fournisseur_attributaire_id: string | null;
  montant_attribue: number;
}

export interface MarcheJalon {
  id: string;
  marche_id: string;
  ordre: number;
  libelle: string;
  date_prevue: string;
  date_realisee: string | null;
  responsable: string;
  statut: "a_faire" | "en_cours" | "fait" | "en_retard";
  observations: string;
}

// Wizard draft (local, persisté en localStorage)
export type MarcheWizardDraft = Partial<Omit<Marche, "id" | "user_id" | "created_at" | "updated_at">> & {
  _step?: number;
  _updated?: number;
};

export const PROCEDURE_LABELS: Record<ProcedureCalculee, string> = {
  dispense: "Dispense de publicité et mise en concurrence",
  mapa: "Procédure adaptée (MAPA)",
  mapa_publicite: "MAPA avec publicité BOAMP/JAL",
  formalisee: "Procédure formalisée (appel d'offres)",
};

export const STATUT_LABELS: Record<StatutMarche, string> = {
  preparation: "En préparation",
  publie: "Publié",
  analyse: "Analyse des offres",
  attribue: "Attribué",
  notifie: "Notifié",
  execution: "En exécution",
  solde: "Soldé",
  cloture: "Clôturé",
  resilie: "Résilié",
};

export const TYPE_MARCHE_LABELS: Record<TypeMarche, string> = {
  fournitures: "Fournitures",
  services: "Services",
  travaux: "Travaux",
};

export const TVA_GUADELOUPE = [
  { value: 8.5, label: "8,5 % (taux normal Guadeloupe)" },
  { value: 2.1, label: "2,1 % (taux réduit)" },
  { value: 0, label: "0 % (NPR / exonération)" },
  { value: 20, label: "20 % (Métropole)" },
];

export function nextReference(year: number, count: number) {
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}
