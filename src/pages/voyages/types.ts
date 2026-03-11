// ─── Types principaux ───

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

// ─── Actes du CA ───

export interface ActeCA {
  id: string;
  type: "programmation" | "financement" | "convention" | "modification" | "bilan";
  libelle: string;
  dateCA: string;
  numeroDeliberation: string;
  adopte: boolean;
  observations: string;
}

// ─── Conventions ───

export interface Convention {
  id: string;
  type: "voyagiste" | "hebergeur" | "transporteur" | "assureur" | "autre";
  prestataire: string;
  objet: string;
  montantHT: number;
  montantTTC: number;
  dateSignature: string;
  dateValiditeDebut: string;
  dateValiditeFin: string;
  referenceMarche: string;
  procedurePassation: "gre_a_gre" | "devis" | "mapa" | "appel_offres";
  signee: boolean;
  notifiee: boolean;
  observations: string;
}

// ─── Accompagnateurs ───

export interface Accompagnateur {
  id: string;
  nom: string;
  prenom: string;
  qualite: "enseignant" | "cpe" | "aed" | "infirmier" | "parent" | "autre";
  fonction: string;
  telephone: string;
  email: string;
  ordreService: boolean;
  autorisationAbsence: boolean;
}

// ─── Subventions & Dons ───

export interface SubventionVoyage {
  id: string;
  type: "collectivite" | "etat" | "association" | "entreprise" | "fse" | "autre";
  organisme: string;
  objet: string;
  montantDemande: number;
  montantAccorde: number;
  montantPercu: number;
  datedemande: string;
  dateNotification: string;
  dateEncaissement: string;
  referenceNotification: string;
  statut: "demande" | "accorde" | "refuse" | "encaisse" | "en_attente";
  promesseDon: boolean;
  observations: string;
}

// ─── Checklist réglementaire ───

export interface ChecklistItem {
  id: string;
  categorie: "ca" | "admin" | "financier" | "pedagogique" | "securite" | "marches";
  libelle: string;
  obligatoire: boolean;
  fait: boolean;
  dateFait?: string;
  responsable: string;
  observations: string;
}

// ─── Mise en concurrence ───

export interface Devis {
  id: string;
  categoriePrestationKey: CatKey;
  prestataire: string;
  montantHT: number;
  montantTTC: number;
  dateReception: string;
  retenu: boolean;
  motifChoix: string;
}

// ─── Voyage principal ───

export type TransportType = 'bus' | 'avion' | 'train' | 'bateau' | 'mixte';
export type TypeVoyage = 'pedagogique' | 'linguistique' | 'sportif' | 'culturel' | 'ski' | 'erasmus';
export type ModePassation = 'globale' | 'directe';

// ─── Mobilités Erasmus+ ───

export interface MobiliteErasmus {
  id: string;
  intitule: string;
  pays: string;
  nbParticipants: number;
  forfaitAppuiOrganisationnel: number;
  forfaitVoyage: number;
  forfaitSejour: number;
  dateDebut: string;
  dateFin: string;
  observations: string;
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
  accompagnateurs: Accompagnateur[];
  // Dates clés
  dateVoteCA: string;
  dateLimiteInscription: string;
  // Echeancier paiements familles
  echeances: { date: string; pourcentage: number }[];
  // Notes
  observations: string;
  // Nouveaux champs
  actesCA: ActeCA[];
  conventions: Convention[];
  subventionsDetail: SubventionVoyage[];
  checklist: ChecklistItem[];
  devis: Devis[];
  // Infos complémentaires
  lieuDepart: string;
  horairesDepart: string;
  horairesRetour: string;
  moyenTransport: string;
  typeHebergement: string;
  contactUrgence: string;
  telUrgence: string;
  // Champs enrichis (fusion VoyagePro 2026)
  transportType?: TransportType;
  typeVoyage?: TypeVoyage;
  intitule?: string;
  codeActiviteGFC?: string;
  dateValidationCA?: string;
  // Mode de passation marchés
  modePassation?: ModePassation;
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

export const QUALITES_ACCOMPAGNATEUR: Record<Accompagnateur["qualite"], string> = {
  enseignant: "Enseignant",
  cpe: "CPE",
  aed: "AED / Assistant d'éducation",
  infirmier: "Infirmier(e)",
  parent: "Parent d'élève",
  autre: "Autre",
};

export const TYPES_SUBVENTION: Record<SubventionVoyage["type"], string> = {
  collectivite: "Collectivité territoriale",
  etat: "État (ministère)",
  association: "Association / FSE",
  entreprise: "Entreprise (mécénat)",
  fse: "Fonds social européen",
  autre: "Autre",
};

export const PROCEDURES_PASSATION: Record<Convention["procedurePassation"], string> = {
  gre_a_gre: "Gré à gré (< 40 000 € HT)",
  devis: "3 devis comparatifs (40 - 90 k€ HT)",
  mapa: "MAPA avec publicité (> 90 k€ HT)",
  appel_offres: "Appel d'offres (> 221 k€ HT)",
};

export const DOCUMENTS_OBLIGATOIRES = [
  "Autorisation parentale signée",
  "Fiche sanitaire de liaison",
  "Attestation d'assurance RC",
  "Copie pièce d'identité / passeport",
  "Carte européenne d'assurance maladie",
];

// ─── Checklist réglementaire par défaut ───

export const CHECKLIST_DEFAUT: Omit<ChecklistItem, "id" | "fait" | "dateFait" | "observations">[] = [
  // CA
  { categorie: "ca", libelle: "Inscription du voyage au programme prévisionnel annuel (vote CA)", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "ca", libelle: "Présentation du budget prévisionnel au CA", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "ca", libelle: "Délibération du CA sur le financement (participation familles)", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "ca", libelle: "Vote du CA sur la convention avec le voyagiste", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "ca", libelle: "Acte du CA portant autorisation de signer la convention", obligatoire: true, responsable: "Secrétaire de séance" },
  // Admin
  { categorie: "admin", libelle: "Autorisation du chef d'établissement (arrêté)", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "admin", libelle: "Déclaration à la DSDEN (formulaire voyage)", obligatoire: true, responsable: "Secrétariat" },
  { categorie: "admin", libelle: "Information préalable de la collectivité de rattachement", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "admin", libelle: "Information des familles (réunion d'information)", obligatoire: false, responsable: "Professeur référent" },
  { categorie: "admin", libelle: "Liste des participants transmise à la DSDEN", obligatoire: true, responsable: "Secrétariat" },
  { categorie: "admin", libelle: "Ordres de service des accompagnateurs", obligatoire: true, responsable: "Chef d'établissement" },
  // Financier
  { categorie: "financier", libelle: "Budget prévisionnel équilibré établi", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Plan de financement validé (familles + subventions + autofinancement)", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Lettres d'engagement financier envoyées aux familles", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Subventions demandées auprès des collectivités", obligatoire: false, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Notifications de subventions reçues", obligatoire: false, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Vérification de l'impact sur le FDR (si avance de trésorerie)", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "financier", libelle: "Bilan financier établi après le voyage", obligatoire: true, responsable: "Gestionnaire" },
  // Pédagogique
  { categorie: "pedagogique", libelle: "Projet pédagogique formalisé et validé", obligatoire: true, responsable: "Professeur référent" },
  { categorie: "pedagogique", libelle: "Lien avec le programme scolaire documenté", obligatoire: true, responsable: "Professeur référent" },
  { categorie: "pedagogique", libelle: "Programme détaillé jour par jour", obligatoire: true, responsable: "Professeur référent" },
  // Sécurité
  { categorie: "securite", libelle: "Fiches sanitaires de liaison collectées", obligatoire: true, responsable: "Infirmier(e)" },
  { categorie: "securite", libelle: "Trousse de premiers secours préparée", obligatoire: true, responsable: "Infirmier(e)" },
  { categorie: "securite", libelle: "Liste des contacts d'urgence (ambassade, SAMU, etc.)", obligatoire: true, responsable: "Professeur référent" },
  { categorie: "securite", libelle: "Protocole de sécurité validé (Vigipirate)", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "securite", libelle: "Assurance de l'établissement vérifiée (garantie voyages)", obligatoire: true, responsable: "Gestionnaire" },
  // Marchés
  { categorie: "marches", libelle: "Vérification des seuils de passation (cumul annuel)", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "marches", libelle: "Mise en concurrence effectuée (si seuil dépassé)", obligatoire: true, responsable: "Gestionnaire" },
  { categorie: "marches", libelle: "Grille d'analyse des offres rédigée et signée", obligatoire: false, responsable: "Gestionnaire" },
  { categorie: "marches", libelle: "Convention / bon de commande signé", obligatoire: true, responsable: "Chef d'établissement" },
  { categorie: "marches", libelle: "Notification au prestataire retenu", obligatoire: true, responsable: "Gestionnaire" },
];

export const CATEGORIES_CHECKLIST: Record<ChecklistItem["categorie"], { label: string; icon: string }> = {
  ca: { label: "Conseil d'administration", icon: "🏛️" },
  admin: { label: "Administratif", icon: "📋" },
  financier: { label: "Financier", icon: "💰" },
  pedagogique: { label: "Pédagogique", icon: "📚" },
  securite: { label: "Sécurité", icon: "🛡️" },
  marches: { label: "Marchés publics", icon: "⚖️" },
};

// ─── Données mock réalistes ───

const makeAccompagnateurs = (n: number): Accompagnateur[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `acc-${Date.now()}-${i}`,
    nom: ["Dupont", "Martin", "Durand", "Bernard"][i % 4],
    prenom: ["Jean", "Marie", "Pierre", "Sophie"][i % 4],
    qualite: (["enseignant", "enseignant", "cpe", "parent"] as Accompagnateur["qualite"][])[i % 4],
    fonction: ["Professeur d'anglais", "Professeur d'histoire", "CPE", "Parent délégué"][i % 4],
    telephone: `06 ${String(50 + i).padStart(2, "0")} ${String(60 + i).padStart(2, "0")} ${String(70 + i).padStart(2, "0")} ${String(80 + i).padStart(2, "0")}`,
    email: `accomp${i + 1}@lycee.fr`,
    ordreService: i < n - 1,
    autorisationAbsence: true,
  }));

const makeActesCA = (destination: string, dateVoteCA: string): ActeCA[] => [
  { id: `acte-1-${destination}`, type: "programmation", libelle: `Inscription du voyage à ${destination} au programme prévisionnel`, dateCA: dateVoteCA, numeroDeliberation: `CA-2023-${Math.floor(Math.random() * 50 + 10)}`, adopte: true, observations: "Adopté à l'unanimité" },
  { id: `acte-2-${destination}`, type: "financement", libelle: `Approbation du budget prévisionnel et de la participation des familles`, dateCA: dateVoteCA, numeroDeliberation: `CA-2023-${Math.floor(Math.random() * 50 + 60)}`, adopte: true, observations: "Participation famille fixée à 300 € par élève" },
  { id: `acte-3-${destination}`, type: "convention", libelle: `Autorisation de signer la convention avec le voyagiste`, dateCA: dateVoteCA, numeroDeliberation: `CA-2024-${Math.floor(Math.random() * 50 + 10)}`, adopte: true, observations: "" },
];

const makeConventions = (v: { destination: string; transport: number; hebergement: number }): Convention[] => [
  { id: `conv-1-${v.destination}`, type: "transporteur", prestataire: "Eurolines SAS", objet: `Transport A/R ${v.destination}`, montantHT: Math.round(v.transport / 1.1), montantTTC: v.transport, dateSignature: "2024-01-20", dateValiditeDebut: "2024-03-14", dateValiditeFin: "2024-03-21", referenceMarche: "BC-2024-001", procedurePassation: v.transport > 40000 ? "devis" : "gre_a_gre", signee: true, notifiee: true, observations: "" },
  { id: `conv-2-${v.destination}`, type: "hebergeur", prestataire: "YHA England & Wales", objet: `Hébergement ${v.destination}`, montantHT: Math.round(v.hebergement / 1.1), montantTTC: v.hebergement, dateSignature: "2024-01-25", dateValiditeDebut: "2024-03-15", dateValiditeFin: "2024-03-20", referenceMarche: "BC-2024-002", procedurePassation: "gre_a_gre", signee: true, notifiee: true, observations: "" },
];

const makeSubventionsDetail = (): SubventionVoyage[] => [
  { id: "sub-1", type: "collectivite", organisme: "Conseil Régional", objet: "Aide aux voyages scolaires", montantDemande: 3000, montantAccorde: 3000, montantPercu: 3000, datedemande: "2023-10-15", dateNotification: "2023-12-20", dateEncaissement: "2024-01-15", referenceNotification: "REG-2024-VS-042", statut: "encaisse", promesseDon: false, observations: "" },
  { id: "sub-2", type: "etat", organisme: "DSDEN — Aide à projets", objet: "Subvention projet pédagogique", montantDemande: 2000, montantAccorde: 1500, montantPercu: 1500, datedemande: "2023-11-01", dateNotification: "2024-01-10", dateEncaissement: "2024-02-05", referenceNotification: "DSDEN-2024-018", statut: "encaisse", promesseDon: false, observations: "" },
  { id: "sub-3", type: "association", organisme: "FSE du lycée", objet: "Participation FSE au voyage", montantDemande: 500, montantAccorde: 500, montantPercu: 500, datedemande: "2023-11-15", dateNotification: "2023-11-20", dateEncaissement: "2024-01-10", referenceNotification: "FSE-2024-003", statut: "encaisse", promesseDon: true, observations: "Don voté en AG du FSE" },
];

const makeChecklist = (): ChecklistItem[] =>
  CHECKLIST_DEFAUT.map((item, i) => ({
    ...item,
    id: `chk-${i}`,
    fait: i < 20,
    dateFait: i < 20 ? "2024-01-15" : undefined,
    observations: "",
  }));

const makeDevis = (): Devis[] => [
  { id: "dev-1", categoriePrestationKey: "transport", prestataire: "Eurolines SAS", montantHT: 7455, montantTTC: 8200, dateReception: "2023-12-01", retenu: true, motifChoix: "Meilleur rapport qualité-prix, expérience scolaire" },
  { id: "dev-2", categoriePrestationKey: "transport", prestataire: "FlixBus Pro", montantHT: 7800, montantTTC: 8580, dateReception: "2023-12-03", retenu: false, motifChoix: "" },
  { id: "dev-3", categoriePrestationKey: "transport", prestataire: "Keolis Voyages", montantHT: 8200, montantTTC: 9020, dateReception: "2023-12-05", retenu: false, motifChoix: "" },
  { id: "dev-4", categoriePrestationKey: "hebergement", prestataire: "YHA England & Wales", montantHT: 5000, montantTTC: 5500, dateReception: "2023-12-01", retenu: true, motifChoix: "Localisation centre-ville, tarif groupe avantageux" },
  { id: "dev-5", categoriePrestationKey: "hebergement", prestataire: "Generator Hostel", montantHT: 5400, montantTTC: 5940, dateReception: "2023-12-02", retenu: false, motifChoix: "" },
];

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
    accompagnateurs: makeAccompagnateurs(4),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-01-15",
    echeances: [
      { date: "2024-01-15", pourcentage: 50 },
      { date: "2024-02-15", pourcentage: 50 },
    ],
    observations: "Voyage réalisé sans incident. Bilan très positif.",
    actesCA: makeActesCA("Londres", "2023-11-15"),
    conventions: makeConventions({ destination: "Londres", transport: 8200, hebergement: 5500 }),
    subventionsDetail: makeSubventionsDetail(),
    checklist: makeChecklist(),
    devis: makeDevis(),
    lieuDepart: "Parking du lycée, 8h00",
    horairesDepart: "08:00",
    horairesRetour: "22:00",
    moyenTransport: "Autocar + Eurotunnel",
    typeHebergement: "Auberge de jeunesse",
    contactUrgence: "M. Dupont (référent)",
    telUrgence: "06 12 34 56 78",
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
    accompagnateurs: makeAccompagnateurs(3),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-03-01",
    echeances: [
      { date: "2024-03-01", pourcentage: 30 },
      { date: "2024-04-01", pourcentage: 40 },
      { date: "2024-05-01", pourcentage: 30 },
    ],
    observations: "",
    actesCA: makeActesCA("Barcelone", "2023-11-15"),
    conventions: makeConventions({ destination: "Barcelone", transport: 6500, hebergement: 4200 }),
    subventionsDetail: [makeSubventionsDetail()[0]],
    checklist: CHECKLIST_DEFAUT.map((item, i) => ({ ...item, id: `chk2-${i}`, fait: i < 15, dateFait: i < 15 ? "2024-02-01" : undefined, observations: "" })),
    devis: [],
    lieuDepart: "Gare SNCF", horairesDepart: "06:30", horairesRetour: "23:00",
    moyenTransport: "TGV + Bus local", typeHebergement: "Hôtel **",
    contactUrgence: "Mme Martin", telUrgence: "06 23 45 67 89",
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
    accompagnateurs: makeAccompagnateurs(3),
    dateVoteCA: "2024-02-10", dateLimiteInscription: "2024-04-01",
    echeances: [
      { date: "2024-04-01", pourcentage: 50 },
      { date: "2024-05-15", pourcentage: 50 },
    ],
    observations: "",
    actesCA: makeActesCA("Berlin", "2024-02-10").map((a, i) => i === 2 ? { ...a, adopte: false, observations: "En attente prochain CA" } : a),
    conventions: [],
    subventionsDetail: [{ id: "sub-berlin-1", type: "collectivite" as const, organisme: "Conseil Régional", objet: "Aide voyages", montantDemande: 2500, montantAccorde: 0, montantPercu: 0, datedemande: "2024-01-15", dateNotification: "", dateEncaissement: "", referenceNotification: "", statut: "en_attente" as const, promesseDon: false, observations: "Dossier déposé" }],
    checklist: CHECKLIST_DEFAUT.map((item, i) => ({ ...item, id: `chk3-${i}`, fait: i < 8, dateFait: i < 8 ? "2024-03-01" : undefined, observations: "" })),
    devis: [],
    lieuDepart: "Aéroport CDG", horairesDepart: "07:00", horairesRetour: "21:00",
    moyenTransport: "Avion", typeHebergement: "Auberge de jeunesse",
    contactUrgence: "M. Lefèvre", telUrgence: "06 34 56 78 90",
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
    accompagnateurs: makeAccompagnateurs(4),
    dateVoteCA: "2023-11-15", dateLimiteInscription: "2024-02-15",
    echeances: [
      { date: "2024-02-15", pourcentage: 40 },
      { date: "2024-03-15", pourcentage: 60 },
    ],
    observations: "",
    actesCA: makeActesCA("Rome", "2023-11-15"),
    conventions: makeConventions({ destination: "Rome", transport: 7800, hebergement: 5200 }),
    subventionsDetail: makeSubventionsDetail().slice(0, 2),
    checklist: CHECKLIST_DEFAUT.map((item, i) => ({ ...item, id: `chk4-${i}`, fait: i < 18, dateFait: i < 18 ? "2024-02-01" : undefined, observations: "" })),
    devis: [],
    lieuDepart: "Gare SNCF", horairesDepart: "05:30", horairesRetour: "22:30",
    moyenTransport: "TGV + Avion", typeHebergement: "Hôtel **",
    contactUrgence: "Mme Rossi", telUrgence: "06 45 67 89 01",
  },
];

// ─── Point mort (seuil de rentabilité) ───

export function calculerPointMort(voyage: Voyage): { pointMort: number; estViable: boolean; marge: number } {
  const coutsFixes = voyage.subventions + voyage.autofinancement;
  const participationParEleve = voyage.nbEleves > 0 ? voyage.participationFamilles / voyage.nbEleves : 0;
  const coutFixeTotal = voyage.budgetTotal - voyage.participationFamilles;
  
  if (participationParEleve <= 0) return { pointMort: 0, estViable: false, marge: 0 };
  
  const chargeNette = coutFixeTotal - coutsFixes;
  const pointMort = Math.ceil(chargeNette / participationParEleve);
  const estViable = voyage.nbEleves >= pointMort;
  const marge = voyage.nbEleves - pointMort;
  
  return { pointMort: Math.max(0, pointMort), estViable, marge };
}

// ─── Types de transport labels ───

export const TRANSPORT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  bus: { label: "Autocar", icon: "🚌" },
  avion: { label: "Avion", icon: "✈️" },
  train: { label: "Train", icon: "🚄" },
  bateau: { label: "Bateau", icon: "🚢" },
  mixte: { label: "Mixte", icon: "🔀" },
};

export const TYPE_VOYAGE_LABELS: Record<string, { label: string; icon: string }> = {
  pedagogique: { label: "Pédagogique", icon: "📚" },
  linguistique: { label: "Linguistique", icon: "🌍" },
  sportif: { label: "Sportif", icon: "⛷️" },
  culturel: { label: "Culturel", icon: "🏛️" },
  ski: { label: "Ski", icon: "🎿" },
  erasmus: { label: "Erasmus+", icon: "⭐" },
};

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
