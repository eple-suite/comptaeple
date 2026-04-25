/**
 * Types partagés des modules « Rentrée » (Prompt N°10) :
 *  - Passation SGEPLE
 *  - Accréditation chefs d'établissement
 *  - Habilitations Op@le
 *  - Document récapitulatif rectorat
 *  - Vue rectorat observateur
 */

export type StatutPassation = "programmee" | "en_cours" | "cloturee" | "abandonnee";

export interface InventaireItem {
  cle: string;
  libelle: string;
  fait: boolean;
  observation?: string;
}

export interface PassationSgeple {
  id: string;
  establishment_id: string;
  sgeple_sortant_id: string | null;
  sgeple_entrant_id: string | null;
  date_effective_passation: string | null;
  date_dernier_jour_sortant: string | null;
  date_premier_jour_entrant: string | null;
  statut: StatutPassation;
  inventaire_outils: InventaireItem[];
  inventaire_dossiers: InventaireItem[];
  dossiers_en_cours: { ref: string; module: string; statut: string }[];
  habilitations_a_revoquer: { agent_id: string; profil: string }[];
  habilitations_a_creer: { agent_id: string; profil: string; sphere: "ordonnateur" | "comptable" }[];
  pv_passation_url: string | null;
  attestation_remise_url: string | null;
  validee_par_ac: string | null;
  validee_par_ordo: string | null;
  signature_sortant_at: string | null;
  signature_entrant_at: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export type StatutAccreditation =
  | "en_attente"
  | "pieces_recues_partielles"
  | "completes"
  | "valide_par_ac"
  | "transmis_drfip"
  | "expire";

export interface AccreditationChef {
  id: string;
  establishment_id: string;
  chef_etablissement_id: string | null;
  chef_etablissement_nom: string | null;
  date_prise_fonction: string | null;
  date_arrete_affectation: string | null;
  numero_arrete: string | null;
  arrete_affectation_pdf_url: string | null;
  piece_identite_pdf_url: string | null;
  piece_identite_chiffree: boolean;
  accreditation_drfip_pdf_url: string | null;
  specimen_signature_url: string | null;
  delegations_signature: { ref: string; objet: string; date: string }[];
  coordonnees_pro: { telephone?: string; email?: string };
  statut: StatutAccreditation;
  date_validation_ac: string | null;
  ac_validateur_id: string | null;
  date_transmission_drfip: string | null;
  bordereau_drfip_url: string | null;
  date_expiration_conservation: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export type SphereOpale = "ordonnateur" | "comptable";

export const PROFILS_OPALE_ORDONNATEUR = [
  "ADMIN_ETAB",
  "ORDONNATEUR",
  "GESTIONNAIRE",
  "VALIDEUR_ENGAGEMENT",
  "VALIDEUR_RECETTE",
  "SAISIE_BUDGET",
  "SAISIE_DEPENSE",
  "SAISIE_RECETTE",
  "CONSULTATION_ORDO",
] as const;

export const PROFILS_OPALE_COMPTABLE = [
  "AGENT_COMPTABLE",
  "FONDE_POUVOIR",
  "VALIDEUR_PRISE_EN_CHARGE",
  "VALIDEUR_PAIEMENT",
  "SAISIE_RECOUVREMENT",
  "REGISSEUR",
  "CONSULTATION_COMPTA",
] as const;

export type ProfilOpaleOrdo = (typeof PROFILS_OPALE_ORDONNATEUR)[number];
export type ProfilOpaleCompta = (typeof PROFILS_OPALE_COMPTABLE)[number];
export type ProfilOpale = ProfilOpaleOrdo | ProfilOpaleCompta;

export type StatutHabilitation =
  | "en_attente_signature"
  | "active"
  | "a_revoquer"
  | "revoquee"
  | "archivee";

export interface HabilitationOpale {
  id: string;
  establishment_id: string;
  agent_id: string | null;
  agent_nom: string | null;
  sphere: SphereOpale;
  profil_opale: ProfilOpale;
  perimetre_eple_ids: string[];
  date_demande: string;
  date_activation_souhaitee: string | null;
  date_activation_effective: string | null;
  date_revocation_prevue: string | null;
  date_revocation_effective: string | null;
  motif_demande: string | null;
  motif_revocation: string | null;
  acte_url: string | null;
  statut: StatutHabilitation;
  signe_par_ordonnateur_id: string | null;
  date_signature_ordonnateur: string | null;
  signe_par_ac_id: string | null;
  date_signature_ac: string | null;
  consulte_par_rectorat: { user_id: string; at: string }[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Inventaires standards rappelés par le wizard de passation. */
export const INVENTAIRE_OUTILS_DEFAUT: InventaireItem[] = [
  { cle: "chorus", libelle: "Chorus Pro (transfert utilisateur principal)", fait: false },
  { cle: "opale", libelle: "Op@le (révocation sortant + habilitation entrant)", fait: false },
  { cle: "siecle", libelle: "SIECLE / BEE", fait: false },
  { cle: "gfegfc", libelle: "GFE / GFC", fait: false },
  { cle: "arena", libelle: "ARENA / boîte mail / site web / ENT", fait: false },
  { cle: "pronote", libelle: "PRONOTE / téléservices", fait: false },
];

export const INVENTAIRE_DOSSIERS_DEFAUT: InventaireItem[] = [
  { cle: "compta_cours", libelle: "Dossiers comptables en cours (factures, marchés, voyages)", fait: false },
  { cle: "archives", libelle: "Archives papier", fait: false },
  { cle: "coffre", libelle: "Coffre / valeurs", fait: false },
  { cle: "regie", libelle: "Régie (caisse + chéquier + RIB)", fait: false },
  { cle: "cachets", libelle: "Cachets et tampons", fait: false },
  { cle: "cles", libelle: "Clés et badges", fait: false },
  { cle: "rh", libelle: "Dossiers RH BIATSS", fait: false },
  { cle: "fs", libelle: "Dossiers fonds sociaux", fait: false },
  { cle: "contentieux", libelle: "Contentieux en cours", fait: false },
];

/** Pièces obligatoires pour l'accréditation. */
export const PIECES_ACCREDITATION = [
  { cle: "arrete_affectation_pdf_url", libelle: "Arrêté d'affectation rectoral", obligatoire: true },
  { cle: "piece_identite_pdf_url", libelle: "Copie pièce d'identité (chiffrée RGPD)", obligatoire: true },
  { cle: "accreditation_drfip_pdf_url", libelle: "Accréditation DRFiP/DDFiP", obligatoire: true },
  { cle: "specimen_signature_url", libelle: "Spécimen de signature", obligatoire: true },
] as const;

/** Verdict global d'accréditation. */
export function diagnostiquerAccreditation(a: Pick<AccreditationChef,
  "arrete_affectation_pdf_url" | "piece_identite_pdf_url" | "accreditation_drfip_pdf_url" | "specimen_signature_url" | "statut">): {
  complete: boolean;
  manquantes: string[];
  bloque_signature: boolean;
} {
  const manquantes: string[] = [];
  if (!a.arrete_affectation_pdf_url) manquantes.push("Arrêté d'affectation");
  if (!a.piece_identite_pdf_url) manquantes.push("Pièce d'identité");
  if (!a.accreditation_drfip_pdf_url) manquantes.push("Accréditation DRFiP");
  if (!a.specimen_signature_url) manquantes.push("Spécimen de signature");
  const complete = manquantes.length === 0;
  // Blocage des actes d'ordonnancement tant que l'arrêté est absent.
  const bloque_signature = manquantes.includes("Arrêté d'affectation") || a.statut === "en_attente";
  return { complete, manquantes, bloque_signature };
}