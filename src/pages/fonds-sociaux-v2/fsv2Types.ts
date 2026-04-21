// ═══════════════════════════════════════════════════════════════
// Module Action sociale & Enquête Rectorat (v2)
// Types partagés — additif, n'interfère pas avec fonds-sociaux/types.ts
// ═══════════════════════════════════════════════════════════════

export type Voie = "GT" | "PRO" | "1er_degre";
export type TypeFonds = "FS" | "FSC";
export type StatutDecision = "brouillon" | "decide" | "mandate" | "paye" | "annule";
export type ModaliteAttribution = "commission" | "urgence";
export type ModaliteVersement = "aide_directe" | "organisme_tiers";

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
  FS: "16FS",
  FSC: "16FSC",
};

/** Type de fonds par défaut suggéré pour une nature donnée */
export function defaultTypeFondsForNature(n: NatureAide): TypeFonds {
  return n === "restauration" ? "FSC" : "FS";
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
  date_mandatement: string | null;
  numero_mandat: string | null;
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