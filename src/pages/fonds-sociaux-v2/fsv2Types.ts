// ═══════════════════════════════════════════════════════════════
// Module Action sociale & Enquête Rectorat (v2)
// Types partagés — additif, n'interfère pas avec fonds-sociaux/types.ts
// ═══════════════════════════════════════════════════════════════

export type Voie = "GT" | "PRO" | "1er_degre";
/**
 * Trois fonds distincts (circulaire 2017-122 + BOP 230) :
 *  - FSL     : Fonds social lycéen
 *  - FSC_COL : Fonds social collégien
 *  - FSC     : Fonds social pour les cantines
 * "FS" est conservé pour rétro-compatibilité (équivalent FSL).
 */
export type TypeFonds = "FS" | "FSL" | "FSC_COL" | "FSC";
/**
 * Circuit Op@le : Engagement → Demande de paiement (DP) → Prise en charge → Paiement.
 * Op@le ne génère plus de mandats — terminologie alignée.
 * "mandate" et "paye" sont conservés pour rétro-compatibilité du parc existant.
 */
export type StatutDecision =
  | "brouillon"
  | "decide"
  | "demande_paiement_emise"
  | "prise_en_charge"
  | "paye"
  | "refusee"
  | "complement_demande"
  | "annule"
  | "mandate"; // legacy
export type ModaliteAttribution = "commission" | "urgence";
// "extinction_creance" : aide restauration/FSC qui éteint la créance demi-pension
// de la famille (jamais de versement en espèces à la famille — M9-6).
export type ModaliteVersement = "aide_directe" | "organisme_tiers" | "extinction_creance";

export type NatureAide =
  | "restauration"
  | "internat_hebergement"
  | "alimentation_bons_alimentation"
  | "sorties_voyages_periscolaire"
  | "transport_scolaire_carburant"
  | "fournitures_scolaires_materiel"
  | "vetements"
  | "soins_medicaux_hygiene";

export const NATURE_AIDE_LABELS: Record<NatureAide, string> = {
  restauration: "Restauration",
  internat_hebergement: "Internat & hébergement",
  alimentation_bons_alimentation: "Alimentation / bons d'achat",
  sorties_voyages_periscolaire: "Sorties / voyages / périscolaire",
  transport_scolaire_carburant: "Transport scolaire & carburant",
  fournitures_scolaires_materiel: "Fournitures scolaires & matériel",
  vetements: "Vêtements",
  soins_medicaux_hygiene: "Soins médicaux & hygiène",
};

/** Mapping Q10 enquête DGESCO — natures officielles */
export const NATURES_Q10: NatureAide[] = [
  "restauration",
  "internat_hebergement",
  "alimentation_bons_alimentation",
  "sorties_voyages_periscolaire",
  "transport_scolaire_carburant",
  "fournitures_scolaires_materiel",
  "vetements",
  "soins_medicaux_hygiene",
];

/** Code activité Op@le par défaut selon type de fonds */
export const CODE_ACTIVITE_DEFAULT: Record<TypeFonds, string> = {
  FS: "16FSL",      // legacy → assimilé FSL
  FSL: "16FSL",
  FSC_COL: "16FSCOL",
  FSC: "16FSC",
};

/** Libellés humains des trois fonds */
export const TYPE_FONDS_LABELS: Record<TypeFonds, string> = {
  FS: "FS — Fonds social (legacy)",
  FSL: "FSL — Fonds social lycéen",
  FSC_COL: "FSC_COL — Fonds social collégien",
  FSC: "FSC — Fonds social pour les cantines",
};

/** Libellés des statuts décision (Op@le DP) */
export const STATUT_DECISION_LABELS: Record<StatutDecision, string> = {
  brouillon: "Brouillon",
  decide: "Décidé",
  demande_paiement_emise: "Demande de paiement émise",
  prise_en_charge: "Prise en charge comptable",
  paye: "Payé",
  refusee: "Refusée",
  complement_demande: "Complément demandé",
  annule: "Annulé",
  mandate: "Mandaté (legacy)",
};

/** Compte de créance des familles pour la demi-pension — M9-6 tome 3 */
export const COMPTE_CREANCE_DP_FAMILLE = "411200" as const;

/** Type de fonds par défaut suggéré pour une nature donnée (FSL adulte par défaut) */
export function defaultTypeFondsForNature(n: NatureAide): TypeFonds {
  return n === "restauration" ? "FSC" : "FSL";
}

export interface ResponsableLegal {
  nom: string;
  prenom: string;
  lien: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export interface FsEleve {
  id: string;
  establishment_id: string;
  ine: string | null;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  classe: string;
  niveau: string | null;
  voie: Voie;
  filiere: string | null;
  statut_boursier: boolean;
  echelon_bourse: number | null;
  demi_pensionnaire: boolean;
  interne: boolean;
  responsables_legaux: ResponsableLegal[];
  annee_scolaire: string;
  actif: boolean;
}

export interface FsCommission {
  id: string;
  establishment_id: string;
  date_commission: string;
  type: "ordinaire" | "extraordinaire" | "urgence";
  annee_scolaire: string;
  membres_presents: { nom: string; prenom?: string; qualite: string }[];
  dossiers_examines_count: number;
  proces_verbal_url: string | null;
  observations: string;
  /** PV anonymisé (diffusion membres / familles) */
  pv_anonymise_url?: string | null;
  /** PV intégral nominatif (archive établissement) */
  pv_integral_url?: string | null;
  /** Vrai si la convocation a été envoyée */
  convocation_envoyee?: boolean;
}

export interface FsDecision {
  id: string;
  establishment_id: string;
  numero_decision: string;
  eleve_id: string;
  annee_scolaire: string;
  type_fonds: TypeFonds;
  nature_aide: NatureAide;
  modalite_attribution: ModaliteAttribution;
  commission_id: string | null;
  modalite_versement: ModaliteVersement;
  organisme_tiers_nom: string | null;
  organisme_tiers_siret: string | null;
  montant: number;
  code_activite_opale: string;
  compte_imputation_opale: string;
  date_decision: string;
  motif: string;
  pieces_justificatives_urls: string[];
  decision_chef_etablissement_pdf_url: string | null;
  notification_famille_pdf_url: string | null;
  piece_comptable_pdf_url: string | null;
  statut: StatutDecision;
  /** Renommé depuis date_mandatement — Op@le n'émet plus de mandats */
  date_demande_paiement: string | null;
  /** Renommé depuis numero_mandat — n° de la demande de paiement Op@le */
  numero_demande_paiement: string | null;
  /** Aide cantine : true si la décision sert à éteindre la créance famille au C/411200 */
  extinction_creance_dp?: boolean;
  /** Compte d'imputation de la créance famille (défaut : 411200) */
  compte_creance_famille?: string;
  /** Lien vers la délibération CA fixant les modalités d'attribution */
  deliberation_ca_id?: string | null;
  bordereau_dp_url?: string | null;
  courrier_complement_url?: string | null;
  courrier_refus_url?: string | null;
}

/** Délibération CA fixant les modalités d'attribution (circulaire 2017-122 § II.2) */
export interface FsDeliberationCa {
  id: string;
  establishment_id: string;
  numero: string;
  date_ca: string;
  annee_scolaire: string;
  type_fonds: TypeFonds | "TOUS";
  plafond_aide_individuelle: number | null;
  plafond_cumul_annuel: number | null;
  criteres_attribution: string | null;
  pieces_obligatoires: string[] | null;
  pdf_url: string | null;
}

/** Convocation d'une commission */
export interface FsCommissionConvocation {
  id: string;
  establishment_id: string;
  commission_id: string;
  date_envoi: string;
  membres_convoques: { nom: string; prenom?: string; qualite: string; email?: string }[];
  ordre_du_jour: string | null;
  pdf_url: string | null;
}

/** Journal RGPD des accès aux dossiers */
export interface FsJournalAccesEntry {
  id: string;
  establishment_id: string;
  user_id: string;
  user_name: string | null;
  type_ressource: "eleve" | "decision" | "commission" | "pv";
  ressource_id: string;
  action: "consultation" | "modification" | "export_pdf" | "suppression";
  details: Record<string, unknown>;
  ip_adresse: string | null;
  created_at: string;
}

export interface FsSubventionRectorat {
  id: string;
  establishment_id: string;
  date_versement_tresor: string;
  date_notification: string | null;
  montant: number;
  bop: "141" | "230" | "214" | "140";
  compte_imputation: string;
  nature: string;
  libelle_notification: string;
  annee_scolaire: string;
  est_avance_annee_suivante: boolean;
}

export interface FsReliquatOuverture {
  id: string;
  establishment_id: string;
  annee_civile: number;
  bop: string;
  compte: string;
  libelle_dispositif: string;
  montant: number;
  nature: string;
}

/** Calcule l'année scolaire courante au format "2025-2026" */
export function currentAnneeScolaire(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0..11
  // Année scolaire commence en septembre (mois 8)
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/** Génère "FS-2025-001" / "FSC-2025-013" */
export function buildNumeroDecision(
  type: TypeFonds,
  anneeScolaire: string,
  seq: number
): string {
  const yearStart = anneeScolaire.split("-")[0] || String(new Date().getFullYear());
  return `${type}-${yearStart}-${String(seq).padStart(3, "0")}`;
}