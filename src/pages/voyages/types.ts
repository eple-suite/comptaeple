export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  regime: "externe" | "demi-pensionnaire" | "interne";
  responsable1: string;
  emailResponsable: string;
  telResponsable: string;
  participationDue: number;
  paiements: Paiement[];
  autorisationParentale: boolean;
  ficheSanitaire: boolean;
  assuranceRC: boolean;
  passeport: boolean;
  dateInscription: string;
}

export interface Paiement {
  id: string;
  date: string;
  montant: number;
  mode: "cheque" | "virement" | "especes" | "prelevement" | "en_ligne";
  reference: string;
  encaisse: boolean;
}

export interface DocumentVoyage {
  id: string;
  nom: string;
  obligatoire: boolean;
  recu: boolean;
  dateReception?: string;
}

export interface Voyage {
  id: string;
  destination: string;
  pays: string;
  dateDepart: string;
  dateRetour: string;
  nbEleves: number;
  nbAccompagnateurs: number;
  budgetTotal: number;
  participationFamilles: number;
  subventions: number;
  chargeEtablissement: number;
  statut: "projet" | "vote_ca" | "planifie" | "valide" | "realise" | "annule" | "bilan";
  // Ventilation par nature de prestation (marchés publics)
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  divers: number;
  professeur: string;
  classe: string;
  objectifPedagogique: string;
  // Financement détaillé
  subventionCollectivite: number;
  subventionEtat: number;
  subventionAutre: number;
  autofinancement: number;
  // Participants
  eleves: Eleve[];
  // Dates clés
  dateVoteCA: string;
  dateLimiteInscription: string;
  // Echeancier paiements familles
  echeances: { date: string; pourcentage: number }[];
  // Notes
  observations: string;
}

export const STATUT_CONFIG: Record<Voyage["statut"], { label: string; class: string; step: number }> = {
  projet: { label: "Projet", class: "bg-muted text-muted-foreground border-0", step: 0 },
  vote_ca: { label: "Voté en CA", class: "bg-info/10 text-info border-0", step: 1 },
  planifie: { label: "Planifié", class: "bg-info/10 text-info border-0", step: 2 },
  valide: { label: "Validé", class: "bg-success/10 text-success border-0", step: 3 },
  realise: { label: "Réalisé", class: "bg-success/10 text-success border-0", step: 4 },
  bilan: { label: "Bilan", class: "bg-primary/10 text-primary border-0", step: 5 },
  annule: { label: "Annulé", class: "bg-destructive/10 text-destructive border-0", step: -1 },
};

// Seuils marchés publics (HT) — Code de la commande publique 2024
export const SEUILS = {
  SANS_PUBLICITE: 40000,
  PROCEDURE_ADAPTEE: 90000,
  SEUIL_EUROPEEN: 221000,
};

export const CATEGORIES_PRESTATIONS = [
  { key: "transport" as const, label: "Transport", icon: "🚌", description: "Location autocars, billets avion/train, transferts" },
  { key: "hebergement" as const, label: "Hébergement", icon: "🏨", description: "Hôtel, auberge de jeunesse, famille d'accueil" },
  { key: "restauration" as const, label: "Restauration", icon: "🍽️", description: "Repas, pique-niques, petit-déjeuners" },
  { key: "activites" as const, label: "Activités / Visites", icon: "🎭", description: "Entrées musées, spectacles, guides" },
  { key: "assurance" as const, label: "Assurance", icon: "🛡️", description: "Assurance annulation, rapatriement" },
  { key: "divers" as const, label: "Divers", icon: "📦", description: "Péages, parkings, pourboires, imprévus" },
] as const;

export type CatKey = typeof CATEGORIES_PRESTATIONS[number]["key"];

export const MODES_PAIEMENT: Record<Paiement["mode"], string> = {
  cheque: "Chèque",
  virement: "Virement",
  especes: "Espèces",
  prelevement: "Prélèvement",
  en_ligne: "Paiement en ligne",
};

export const DOCUMENTS_OBLIGATOIRES = [
  "Autorisation parentale signée",
  "Fiche sanitaire de liaison",
  "Attestation d'assurance RC",
  "Copie pièce d'identité / passeport",
  "Carte européenne d'assurance maladie",
];

// Données mock réalistes
const makeEleves = (n: number, classe: string, participation: number): Eleve[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `e${Date.now()}-${i}`,
    nom: ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "Andre", "Mercier", "Dupont", "Lambert", "Bonnet", "Francois", "Martinez", "Legrand", "Garnier", "Faure", "Rousseau", "Blanc", "Guerin", "Muller"][i % 35],
    prenom: ["Emma", "Lucas", "Léa", "Hugo", "Chloé", "Nathan", "Inès", "Louis", "Manon", "Ethan", "Jade", "Gabriel", "Louise", "Raphaël", "Alice", "Arthur", "Lina", "Jules", "Mila", "Adam", "Sarah", "Noah", "Eva", "Tom", "Camille", "Théo", "Anna", "Léo", "Clara", "Mathis", "Rose", "Enzo", "Zoé", "Paul", "Ambre"][i % 35],
    classe,
    regime: i % 3 === 0 ? "interne" : i % 3 === 1 ? "demi-pensionnaire" : "externe",
    responsable1: `M. ou Mme ${["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau"][i % 10]}`,
    emailResponsable: `parent${i + 1}@email.fr`,
    telResponsable: `06 ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")} ${String(30 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}`,
    participationDue: participation,
    paiements: i < n * 0.7 ? [
      { id: `p${i}-1`, date: "2024-01-15", montant: participation * 0.5, mode: "cheque" as const, reference: `CHQ-${1000 + i}`, encaisse: true },
      ...(i < n * 0.4 ? [{ id: `p${i}-2`, date: "2024-02-15", montant: participation * 0.5, mode: "virement" as const, reference: `VIR-${2000 + i}`, encaisse: true }] : []),
    ] : [],
    autorisationParentale: i < n * 0.85,
    ficheSanitaire: i < n * 0.75,
    assuranceRC: i < n * 0.9,
    passeport: i < n * 0.8,
    dateInscription: `2024-0${1 + (i % 2)}-${String(10 + i).padStart(2, "0")}`,
  }));

export const initialVoyages: Voyage[] = [
  {
    id: "1", destination: "Londres", pays: "Royaume-Uni",
    dateDepart: "2024-03-15", dateRetour: "2024-03-20",
    nbEleves: 35, nbAccompagnateurs: 4, budgetTotal: 18500,
    participationFamilles: 10500, subventions: 5000, chargeEtablissement: 3000,
    statut: "realise",
    transport: 8200, hebergement: 5500, restauration: 2800, activites: 1500, assurance: 500, divers: 0,
    professeur: "M. Dupont", classe: "2nde A",
    objectifPedagogique: "Immersion linguistique et découverte culturelle de Londres",
    subventionCollectivite: 3000, subventionEtat: 1500, subventionAutre: 500, autofinancement: 0,
    eleves: makeEleves(35, "2nde A", 300),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-01-15",
    echeances: [
      { date: "2024-01-15", pourcentage: 50 },
      { date: "2024-02-15", pourcentage: 50 },
    ],
    observations: "Voyage réalisé sans incident. Bilan très positif.",
  },
  {
    id: "2", destination: "Barcelone", pays: "Espagne",
    dateDepart: "2024-05-10", dateRetour: "2024-05-14",
    nbEleves: 28, nbAccompagnateurs: 3, budgetTotal: 14200,
    participationFamilles: 8400, subventions: 3500, chargeEtablissement: 2300,
    statut: "valide",
    transport: 6500, hebergement: 4200, restauration: 1800, activites: 1200, assurance: 500, divers: 0,
    professeur: "Mme Martin", classe: "1ère S",
    objectifPedagogique: "Découverte architecturale et linguistique — Gaudí et modernisme catalan",
    subventionCollectivite: 2000, subventionEtat: 1000, subventionAutre: 500, autofinancement: 0,
    eleves: makeEleves(28, "1ère S", 300),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-03-01",
    echeances: [
      { date: "2024-03-01", pourcentage: 30 },
      { date: "2024-04-01", pourcentage: 40 },
      { date: "2024-05-01", pourcentage: 30 },
    ],
    observations: "",
  },
  {
    id: "3", destination: "Berlin", pays: "Allemagne",
    dateDepart: "2024-06-01", dateRetour: "2024-06-05",
    nbEleves: 30, nbAccompagnateurs: 3, budgetTotal: 16000,
    participationFamilles: 9000, subventions: 4000, chargeEtablissement: 3000,
    statut: "planifie",
    transport: 7000, hebergement: 4800, restauration: 2200, activites: 1500, assurance: 500, divers: 0,
    professeur: "M. Lefèvre", classe: "Terminale L",
    objectifPedagogique: "Mémoire et histoire contemporaine — Mur de Berlin, Bundestag",
    subventionCollectivite: 2500, subventionEtat: 1000, subventionAutre: 500, autofinancement: 0,
    eleves: makeEleves(30, "Terminale L", 300),
    dateVoteCA: "2024-02-10", dateLimiteInscription: "2024-04-01",
    echeances: [
      { date: "2024-04-01", pourcentage: 50 },
      { date: "2024-05-15", pourcentage: 50 },
    ],
    observations: "",
  },
  {
    id: "4", destination: "Rome", pays: "Italie",
    dateDepart: "2024-04-20", dateRetour: "2024-04-25",
    nbEleves: 32, nbAccompagnateurs: 4, budgetTotal: 17800,
    participationFamilles: 10200, subventions: 4800, chargeEtablissement: 2800,
    statut: "valide",
    transport: 7800, hebergement: 5200, restauration: 2600, activites: 1700, assurance: 500, divers: 0,
    professeur: "Mme Rossi", classe: "2nde C",
    objectifPedagogique: "Latin et civilisation romaine — Forum, Colisée, Vatican",
    subventionCollectivite: 3000, subventionEtat: 1200, subventionAutre: 600, autofinancement: 0,
    eleves: makeEleves(32, "2nde C", 318.75),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-02-15",
    echeances: [
      { date: "2024-02-15", pourcentage: 40 },
      { date: "2024-03-15", pourcentage: 60 },
    ],
    observations: "",
  },
];

export function getRecommandation(total: number, categorie: string, formatCurrency: (n: number) => string): {
  niveau: "ok" | "warning" | "danger" | "critical";
  texte: string;
  action: string;
  base_legale: string;
} {
  if (total >= SEUILS.SEUIL_EUROPEEN) {
    return {
      niveau: "critical",
      texte: `Le cumul annuel "${categorie}" atteint ${formatCurrency(total)} HT et dépasse le seuil européen de ${formatCurrency(SEUILS.SEUIL_EUROPEEN)} HT.`,
      action: `Ce marché doit faire l'objet d'une procédure formalisée (appel d'offres ouvert ou restreint) avec publication au JOUE. Préparez un DCE complet (AAPC, RC, CCAP, CCTP, BPU). Délai minimum : 35 jours. Contactez le service juridique de la collectivité de rattachement.`,
      base_legale: "Art. L2124-2 et R2124-2 du Code de la commande publique — Seuil européen fournitures et services (221 000 € HT au 01/01/2024)",
    };
  }
  if (total >= SEUILS.PROCEDURE_ADAPTEE) {
    return {
      niveau: "danger",
      texte: `Le cumul annuel "${categorie}" atteint ${formatCurrency(total)} HT et dépasse le seuil de procédure adaptée de ${formatCurrency(SEUILS.PROCEDURE_ADAPTEE)} HT.`,
      action: `Ce marché doit faire l'objet d'une procédure adaptée (MAPA) avec publicité obligatoire. Rédigez un cahier des charges (CCTP), définissez les critères de sélection pondérés, publiez sur la plateforme de dématérialisation de votre collectivité (profil acheteur). Délai recommandé : 21 jours minimum.`,
      base_legale: "Art. R2123-1 du Code de la commande publique — Procédure adaptée au-dessus de 90 000 € HT",
    };
  }
  if (total >= SEUILS.SANS_PUBLICITE) {
    return {
      niveau: "warning",
      texte: `Le cumul annuel "${categorie}" atteint ${formatCurrency(total)} HT et dépasse le seuil de mise en concurrence de ${formatCurrency(SEUILS.SANS_PUBLICITE)} HT.`,
      action: `Vous devez solliciter au minimum 3 devis comparables, établir une grille d'analyse multicritères (prix, qualité, délais) et conserver l'ensemble des pièces justificatives. La négociation est possible. Formalisez le choix dans un rapport de présentation.`,
      base_legale: "Art. R2122-8 du Code de la commande publique — Marchés sans publicité ni mise en concurrence en dessous de 40 000 € HT",
    };
  }
  return {
    niveau: "ok",
    texte: `Le cumul annuel "${categorie}" est de ${formatCurrency(total)} HT, sous le seuil de ${formatCurrency(SEUILS.SANS_PUBLICITE)} HT.`,
    action: `Achat libre sans formalité obligatoire. Bonne pratique : conservez les devis et factures, respectez le principe de bonne gestion des deniers publics.`,
    base_legale: "Art. R2122-8 du Code de la commande publique",
  };
}
