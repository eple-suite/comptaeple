// ════════════════════════════════════════════════════════════════
// Moteur de rétroplanning Voyage v2 — J-180 → J+120
// Conforme circulaire MENE2407159C, GBCP, code éducation R.421-20
// ════════════════════════════════════════════════════════════════

export type JalonStatut = "a_faire" | "en_cours" | "fait" | "retard" | "non_applicable";
export type JalonPriorite = "bloquant" | "majeur" | "important" | "info";
export type JalonCategorie =
  | "pedago"
  | "ca"
  | "marche"
  | "famille"
  | "compta"
  | "rh"
  | "securite"
  | "transport"
  | "post_voyage";

export interface JalonModele {
  code: string;
  libelle: string;
  /** Nombre de jours par rapport au départ (négatif = avant, positif = après retour) */
  offsetJours: number;
  /** Référence : "depart" ou "retour" */
  reference: "depart" | "retour";
  categorie: JalonCategorie;
  priorite: JalonPriorite;
  responsable: string;
  description: string;
  base_legale?: string;
  /** Conditions d'applicabilité optionnelles */
  applicableSi?: (ctx: JalonContext) => boolean;
}

export interface JalonContext {
  type_projet?: string;
  caractere?: string;
  type_sortie?: string;
  destination_pays?: string;
  nombre_nuitees?: number;
  montant_total_ttc?: number;
}

export interface JalonInstance {
  code: string;
  libelle: string;
  date_prevue: string; // ISO yyyy-mm-dd
  joursRestants: number; // négatif = en retard
  categorie: JalonCategorie;
  priorite: JalonPriorite;
  responsable: string;
  description: string;
  base_legale?: string;
  statut: JalonStatut;
}

// ─── Catalogue officiel des jalons (J-180 → J+120) ───────────────
export const JALONS_MODELES: JalonModele[] = [
  // ═══ AVANT LE VOYAGE (J-180 → J-1) ═══
  {
    code: "J-180_PROJET",
    libelle: "Émission du projet pédagogique",
    offsetJours: -180, reference: "depart",
    categorie: "pedago", priorite: "majeur",
    responsable: "Chef d'établissement / Équipe pédagogique",
    description: "Validation du principe du voyage par le chef d'établissement, rédaction de la note d'intention.",
    base_legale: "Code éducation R.421-20",
  },
  {
    code: "J-150_BUDGET",
    libelle: "Budget prévisionnel détaillé",
    offsetJours: -150, reference: "depart",
    categorie: "compta", priorite: "majeur",
    responsable: "Agent comptable / Gestionnaire",
    description: "Élaboration du budget prévisionnel, identification des recettes et dépenses, analyse de l'équilibre financier.",
    base_legale: "GBCP décret 2012-1246",
  },
  {
    code: "J-120_DEVIS",
    libelle: "Recueil des devis (3 mini si > 40 k€)",
    offsetJours: -120, reference: "depart",
    categorie: "marche", priorite: "majeur",
    responsable: "Gestionnaire matériel",
    description: "Mise en concurrence : 3 devis comparatifs au minimum si seuil MAPA franchi.",
    base_legale: "CCP 2026 art. R.2122-8",
    applicableSi: (ctx) => (ctx.montant_total_ttc || 0) >= 40000,
  },
  {
    code: "J-120_DEVIS_LIGHT",
    libelle: "Recueil de devis (procédure adaptée)",
    offsetJours: -120, reference: "depart",
    categorie: "marche", priorite: "important",
    responsable: "Gestionnaire matériel",
    description: "Demande de devis comparatifs même en dessous du seuil pour bonne gestion.",
    applicableSi: (ctx) => (ctx.montant_total_ttc || 0) < 40000,
  },
  {
    code: "J-90_INFO_FAM",
    libelle: "Information préalable des familles",
    offsetJours: -90, reference: "depart",
    categorie: "famille", priorite: "majeur",
    responsable: "Professeur principal / Responsable",
    description: "Réunion d'information : projet, coût prévisionnel, modalités de paiement, dispositif fonds social.",
    base_legale: "Circulaire MENE2407159C",
  },
  {
    code: "J-90_CA_AUTORISATION",
    libelle: "Délibération du CA — autorisation",
    offsetJours: -90, reference: "depart",
    categorie: "ca", priorite: "bloquant",
    responsable: "Chef d'établissement",
    description: "Inscription à l'ordre du jour du CA : autorisation du voyage, approbation du budget, fixation de la participation des familles.",
    base_legale: "Code éducation R.421-20 + L.421-23",
  },
  {
    code: "J-75_SUBVENTIONS",
    libelle: "Demandes de subventions (Région, Dpt, FSE)",
    offsetJours: -75, reference: "depart",
    categorie: "compta", priorite: "important",
    responsable: "Gestionnaire",
    description: "Dépôt des demandes auprès des collectivités, FSE, fondations. Joindre PV du CA.",
  },
  {
    code: "J-75_ERASMUS_CONV",
    libelle: "Signature convention Erasmus+ / acompte",
    offsetJours: -75, reference: "depart",
    categorie: "compta", priorite: "majeur",
    responsable: "Coordonnateur Erasmus+",
    description: "Signature de la convention de subvention Erasmus+, demande d'avance (généralement 80 %).",
    applicableSi: (ctx) => (ctx.type_projet || "").startsWith("erasmus"),
  },
  {
    code: "J-60_INSCRIPTIONS",
    libelle: "Ouverture des inscriptions familles",
    offsetJours: -60, reference: "depart",
    categorie: "famille", priorite: "majeur",
    responsable: "Vie scolaire",
    description: "Distribution autorisations parentales, fiches sanitaires, échéancier de paiement.",
  },
  {
    code: "J-60_RESERVATION",
    libelle: "Réservation transport / hébergement",
    offsetJours: -60, reference: "depart",
    categorie: "transport", priorite: "majeur",
    responsable: "Gestionnaire matériel",
    description: "Engagement juridique avec l'agence ou les prestataires. Vérifier garantie financière (loi 92-645).",
  },
  {
    code: "J-45_ACCOMPAGNATEURS",
    libelle: "Désignation officielle des accompagnateurs",
    offsetJours: -45, reference: "depart",
    categorie: "rh", priorite: "majeur",
    responsable: "Chef d'établissement",
    description: "Arrêté nominatif de désignation. Vérification ratio circulaire 2024 : 1/12 collège, 1/15 lycée.",
    base_legale: "Circulaire MENE2407159C §2.2",
  },
  {
    code: "J-45_ASSURANCE",
    libelle: "Souscription assurance annulation/RC",
    offsetJours: -45, reference: "depart",
    categorie: "securite", priorite: "majeur",
    responsable: "Gestionnaire",
    description: "Vérifier RC professionnelle, assurance individuelle accident, assistance rapatriement.",
  },
  {
    code: "J-30_FONDS_SOC",
    libelle: "Examen fonds social — aides familles",
    offsetJours: -30, reference: "depart",
    categorie: "famille", priorite: "important",
    responsable: "Commission fonds social",
    description: "Identification des familles en difficulté, attribution d'aides ponctuelles.",
  },
  {
    code: "J-30_DOCUMENTS",
    libelle: "Vérification documents identité / passeport",
    offsetJours: -30, reference: "depart",
    categorie: "securite", priorite: "bloquant",
    responsable: "Vie scolaire",
    description: "Recensement CNI / passeports / autorisation sortie territoire (AST). Visa si pays hors UE.",
    applicableSi: (ctx) => {
      const p = (ctx.destination_pays || "").toLowerCase();
      return p !== "" && p !== "france";
    },
  },
  {
    code: "J-21_DECLARATION",
    libelle: "Déclaration DSDEN / IA-DASEN (sortie hors région)",
    offsetJours: -21, reference: "depart",
    categorie: "pedago", priorite: "majeur",
    responsable: "Chef d'établissement",
    description: "Déclaration obligatoire pour tout voyage avec nuitée ou hors département (selon académie).",
    base_legale: "Circulaire MENE2407159C §1.4",
    applicableSi: (ctx) => (ctx.nombre_nuitees || 0) >= 1,
  },
  {
    code: "J-15_SOLDE",
    libelle: "Solde des participations familles",
    offsetJours: -15, reference: "depart",
    categorie: "famille", priorite: "majeur",
    responsable: "Agent comptable",
    description: "Date limite de versement du solde. Relances ciblées des retardataires.",
  },
  {
    code: "J-10_LISTING",
    libelle: "Édition listing définitif participants",
    offsetJours: -10, reference: "depart",
    categorie: "pedago", priorite: "majeur",
    responsable: "Vie scolaire",
    description: "Listing nominatif (élèves + accompagnateurs), fiches sanitaires, contacts d'urgence 24/7.",
  },
  {
    code: "J-7_REGIE",
    libelle: "Constitution régie d'avances (frais sur place)",
    offsetJours: -7, reference: "depart",
    categorie: "compta", priorite: "important",
    responsable: "Agent comptable",
    description: "Arrêté de constitution de régie d'avances temporaire pour les dépenses de bouche/transport local.",
    base_legale: "Décret 2012-1246 art. 22",
  },
  {
    code: "J-3_BRIEFING",
    libelle: "Briefing accompagnateurs + parents",
    offsetJours: -3, reference: "depart",
    categorie: "pedago", priorite: "majeur",
    responsable: "Responsable pédagogique",
    description: "Rappel consignes sécurité, n° d'urgence, protocole en cas d'incident.",
  },
  // ═══ APRÈS LE VOYAGE (J+1 → J+120) ═══
  {
    code: "J+5_REGIE_CLOTURE",
    libelle: "Reddition régie d'avances",
    offsetJours: 5, reference: "retour",
    categorie: "compta", priorite: "majeur",
    responsable: "Régisseur",
    description: "Justification des dépenses sur place, restitution du solde non utilisé.",
    base_legale: "Décret 2012-1246",
  },
  {
    code: "J+15_FACTURES",
    libelle: "Réception et liquidation factures",
    offsetJours: 15, reference: "retour",
    categorie: "compta", priorite: "majeur",
    responsable: "Agent comptable",
    description: "Vérification du service fait, émission des demandes de paiement (DP Op@le) définitives.",
  },
  {
    code: "J+30_BILAN_PEDA",
    libelle: "Bilan pédagogique du voyage",
    offsetJours: 30, reference: "retour",
    categorie: "post_voyage", priorite: "important",
    responsable: "Responsable pédagogique",
    description: "Restitution aux élèves, exposition, présentation au CA. Évaluation des objectifs pédagogiques.",
  },
  {
    code: "J+60_BILAN_FIN",
    libelle: "Bilan financier détaillé",
    offsetJours: 60, reference: "retour",
    categorie: "compta", priorite: "majeur",
    responsable: "Agent comptable",
    description: "Production du bilan : recettes/dépenses réelles vs prévues, écarts justifiés.",
    base_legale: "M9-6",
  },
  {
    code: "J+90_REMBOURSEMENT",
    libelle: "Remboursement aux familles si excédent > 8 €",
    offsetJours: 90, reference: "retour",
    categorie: "famille", priorite: "majeur",
    responsable: "Agent comptable",
    description: "Application de la règle des 8 € : remboursement obligatoire au-delà, don tacite en deçà (modèle Créteil).",
    base_legale: "Loi 66-948 art. 21 + jurisprudence Créteil",
  },
  {
    code: "J+90_BILAN_CA",
    libelle: "Présentation du bilan en CA",
    offsetJours: 90, reference: "retour",
    categorie: "ca", priorite: "bloquant",
    responsable: "Chef d'établissement",
    description: "Vote du bilan financier en Conseil d'administration, clôture comptable du projet.",
    base_legale: "Code éducation R.421-20",
  },
  {
    code: "J+120_ARCHIVAGE",
    libelle: "Archivage du dossier complet",
    offsetJours: 120, reference: "retour",
    categorie: "post_voyage", priorite: "info",
    responsable: "Secrétariat de gestion",
    description: "Constitution dossier d'archive : PV CA, conventions, factures, bilan, listing — durée 10 ans.",
  },
];

/**
 * Génère les jalons applicables à un voyage selon son contexte.
 */
export function genererJalons(
  dateDepart: string | null | undefined,
  dateRetour: string | null | undefined,
  ctx: JalonContext = {},
  jalonsExistants?: Record<string, { statut: JalonStatut; date_prevue?: string }>,
): JalonInstance[] {
  if (!dateDepart) return [];
  const depart = new Date(dateDepart);
  const retour = dateRetour ? new Date(dateRetour) : depart;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return JALONS_MODELES
    .filter((m) => !m.applicableSi || m.applicableSi(ctx))
    .map((m) => {
      const ref = m.reference === "depart" ? depart : retour;
      const prevue = new Date(ref);
      prevue.setDate(prevue.getDate() + m.offsetJours);
      const dateIso = prevue.toISOString().slice(0, 10);

      const existing = jalonsExistants?.[m.code];
      const datePrev = existing?.date_prevue || dateIso;
      const dPrev = new Date(datePrev);
      const joursRestants = Math.floor((dPrev.getTime() - today.getTime()) / 86400000);

      let statut: JalonStatut = existing?.statut || "a_faire";
      if (statut === "a_faire" && joursRestants < 0) statut = "retard";

      return {
        code: m.code,
        libelle: m.libelle,
        date_prevue: datePrev,
        joursRestants,
        categorie: m.categorie,
        priorite: m.priorite,
        responsable: m.responsable,
        description: m.description,
        base_legale: m.base_legale,
        statut,
      };
    })
    .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue));
}

/** Liste les jalons critiques (retard ou imminents bloquants/majeurs). */
export function alertesJalons(jalons: JalonInstance[]): JalonInstance[] {
  return jalons.filter((j) => {
    if (j.statut === "fait" || j.statut === "non_applicable") return false;
    if (j.statut === "retard") return true;
    if ((j.priorite === "bloquant" || j.priorite === "majeur") && j.joursRestants <= 14 && j.joursRestants >= 0)
      return true;
    return false;
  });
}

export const CATEGORIE_LABELS: Record<JalonCategorie, string> = {
  pedago: "Pédagogique",
  ca: "Conseil d'administration",
  marche: "Marchés / Achats",
  famille: "Familles",
  compta: "Comptabilité",
  rh: "Ressources humaines",
  securite: "Sécurité / Documents",
  transport: "Transport / Hébergement",
  post_voyage: "Post-voyage",
};

export const CATEGORIE_COLORS: Record<JalonCategorie, string> = {
  pedago: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/30 dark:text-blue-100",
  ca: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/30 dark:text-purple-100",
  marche: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/30 dark:text-amber-100",
  famille: "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/30 dark:text-pink-100",
  compta: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-100",
  rh: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/30 dark:text-indigo-100",
  securite: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950/30 dark:text-red-100",
  transport: "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/30 dark:text-cyan-100",
  post_voyage: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100",
};

export const PRIORITE_COLORS: Record<JalonPriorite, string> = {
  bloquant: "bg-destructive text-destructive-foreground",
  majeur: "bg-orange-500 text-white",
  important: "bg-yellow-400 text-yellow-950",
  info: "bg-muted text-muted-foreground",
};

export const STATUT_COLORS: Record<JalonStatut, string> = {
  a_faire: "bg-muted text-muted-foreground border-border",
  en_cours: "bg-blue-100 text-blue-900 border-blue-300",
  fait: "bg-emerald-100 text-emerald-900 border-emerald-300",
  retard: "bg-destructive/10 text-destructive border-destructive/40",
  non_applicable: "bg-muted/50 text-muted-foreground line-through",
};

export const STATUT_LABELS: Record<JalonStatut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
  retard: "En retard",
  non_applicable: "N/A",
};
