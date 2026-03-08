export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  regime: "interne" | "dp" | "externe";
  boursier: boolean;
  echelonBourse: number;
  quotientFamilial: number;
  situationFamiliale: string;
  responsableLegal: string;
  telephone: string;
  email: string;
}

export interface DemandeAide {
  id: string;
  eleveId: string;
  eleve: Eleve;
  type: "FSL" | "FSC" | "FSE" | "autre";
  nature: string; // restauration, transport, fournitures, equipement, sortie, internat, autre
  montantDemande: number;
  montantAccorde: number;
  dateDepot: string;
  dateLimite: string;
  commissionId: string;
  statut: "instruction" | "commission" | "accorde" | "refuse" | "verse" | "annule";
  motifDetaille: string;
  motifRefus: string;
  piecesFournies: string[];
  piecesManquantes: string[];
  commentaireAS: string; // assistante sociale
  commentaireGestion: string;
  numeroDecision: string;
  dateVersement: string;
  mandatRef: string; // référence du mandat comptable
  serviceRestauration: boolean; // demande liée à la restauration
  trimestre: "T1" | "T2" | "T3" | "annuel";
}

export interface Commission {
  id: string;
  date: string;
  type: "ordinaire" | "extraordinaire";
  membres: string[];
  statut: "planifiee" | "convoquee" | "tenue" | "cloturee";
  pvRedige: boolean;
  nbDossiers: number;
  nbAccordes: number;
  nbRefuses: number;
  montantTotal: number;
  observations: string;
}

export interface Budget {
  type: "FSL" | "FSC" | "FSE" | "autre";
  dotationInitiale: number;
  dotationComplementaire: number;
  reportAnneePrecedente: number;
  totalDisponible: number;
  engage: number;
  verse: number;
  reste: number;
}

export const NATURES_AIDE: Record<string, string> = {
  restauration: "Restauration scolaire",
  transport: "Transport scolaire",
  fournitures: "Fournitures scolaires",
  equipement: "Équipement professionnel",
  sortie: "Sorties / voyages scolaires",
  internat: "Frais d'internat",
  vetements: "Vêtements de travail",
  autre: "Autre aide",
};

export const TYPE_LABELS: Record<string, string> = {
  FSL: "Fonds Social Lycéen",
  FSC: "Fonds Social Collégien",
  FSE: "Fonds Social pour les Cantines",
  autre: "Aide exceptionnelle CE",
};

export const PIECES_REQUISES = [
  "Avis d'imposition N-1",
  "Justificatif de domicile",
  "Attestation CAF / QF",
  "RIB du responsable légal",
  "Factures / devis",
  "Certificat de scolarité",
  "Notification MDPH (si applicable)",
  "Attestation RSA (si applicable)",
];

export const STATUT_CONFIG = {
  instruction: { label: "En instruction", color: "bg-muted/60 text-muted-foreground border-0" },
  commission: { label: "En commission", color: "bg-accent/20 text-accent-foreground border-0" },
  accorde: { label: "Accordé", color: "bg-success/10 text-success border-0" },
  refuse: { label: "Refusé", color: "bg-destructive/10 text-destructive border-0" },
  verse: { label: "Versé", color: "bg-success/20 text-success border-0" },
  annule: { label: "Annulé", color: "bg-muted/40 text-muted-foreground border-0" },
};

// Mock data
export const mockEleves: Eleve[] = [
  { id: "e1", nom: "MARTIN", prenom: "Lucas", classe: "2nde B", regime: "dp", boursier: true, echelonBourse: 4, quotientFamilial: 320, situationFamiliale: "Famille monoparentale — mère isolée", responsableLegal: "Mme MARTIN Sophie", telephone: "06 12 34 56 78", email: "s.martin@email.fr" },
  { id: "e2", nom: "BERNARD", prenom: "Emma", classe: "1ère STMG", regime: "interne", boursier: true, echelonBourse: 6, { id: "e2", nom: "BERNARD", prenom: "Emma", classe: "1ère STMG", regime: "interne", boursier: true, echelonBourse: 6, quotientFamilial: 180, situationFamiliale: "Parents séparés — père au RSA", responsableLegal: "M. BERNARD Pierre", telephone: "06 23 45 67 89", email: "p.bernard@email.fr" },, situationFamiliale: "Parents séparés — père au RSA", responsableLegal: "M. BERNARD Pierre", telephone: "06 23 45 67 89", email: "p.bernard@email.fr" },
  { id: "e3", nom: "DUBOIS", prenom: "Léa", classe: "Terminale Pro ASSP", regime: "dp", boursier: true, echelonBourse: 5, quotientFamilial: 250, situationFamiliale: "Famille nombreuse (5 enfants)", responsableLegal: "M. et Mme DUBOIS", telephone: "06 34 56 78 90", email: "dubois.famille@email.fr" },
  { id: "e4", nom: "PETIT", prenom: "Thomas", classe: "5ème A", regime: "dp", boursier: false, echelonBourse: 0, quotientFamilial: 680, situationFamiliale: "Perte d'emploi récente du père", responsableLegal: "M. PETIT Jacques", telephone: "06 45 67 89 01", email: "j.petit@email.fr" },
  { id: "e5", nom: "ROBERT", prenom: "Chloé", classe: "3ème C", regime: "externe", boursier: true, echelonBourse: 3, quotientFamilial: 420, situationFamiliale: "AAH — parent en situation de handicap", responsableLegal: "Mme ROBERT Anne", telephone: "06 56 78 90 12", email: "a.robert@email.fr" },
  { id: "e6", nom: "MOREAU", prenom: "Nathan", classe: "2nde Pro MEI", regime: "interne", boursier: true, echelonBourse: 6, quotientFamilial: 150, situationFamiliale: "Mineur isolé — prise en charge ASE", responsableLegal: "ASE — Référent M. LEGRAND", telephone: "04 91 00 00 00", email: "ase.ref@departement.fr" },
  { id: "e7", nom: "GARCIA", prenom: "Inès", classe: "4ème B", regime: "dp", boursier: true, echelonBourse: 2, quotientFamilial: 520, situationFamiliale: "Décès d'un parent", responsableLegal: "M. GARCIA Miguel", telephone: "06 67 89 01 23", email: "m.garcia@email.fr" },
];

export const mockCommissions: Commission[] = [
  { id: "c1", date: "2024-10-15", type: "ordinaire", membres: ["CE", "Gestionnaire", "AS", "CPE", "Infirmière", "Parent élu 1", "Parent élu 2"], statut: "cloturee", pvRedige: true, nbDossiers: 8, nbAccordes: 6, nbRefuses: 2, montantTotal: 2450, observations: "Commission de rentrée — forte demande restauration" },
  { id: "c2", date: "2024-12-10", type: "ordinaire", membres: ["CE", "Gestionnaire", "AS", "CPE", "Infirmière", "Parent élu 1"], statut: "cloturee", pvRedige: true, nbDossiers: 5, nbAccordes: 4, nbRefuses: 1, montantTotal: 1680, observations: "Demandes T2 restauration + équipements pro" },
  { id: "c3", date: "2025-02-04", type: "ordinaire", membres: ["CE", "Gestionnaire", "AS", "CPE", "Infirmière", "Parent élu 1", "Parent élu 2"], statut: "cloturee", pvRedige: true, nbDossiers: 6, nbAccordes: 5, nbRefuses: 1, montantTotal: 2100, observations: "Nouvelles situations sociales post-Noël" },
  { id: "c4", date: "2025-04-08", type: "ordinaire", membres: ["CE", "Gestionnaire", "AS", "CPE"], statut: "planifiee", pvRedige: false, nbDossiers: 4, nbAccordes: 0, nbRefuses: 0, montantTotal: 0, observations: "" },
];

export const mockDemandes: DemandeAide[] = [
  { id: "d1", eleveId: "e1", eleve: mockEleves[0], type: "FSL", nature: "restauration", montantDemande: 380, montantAccorde: 350, dateDepot: "2024-09-20", dateLimite: "", commissionId: "c1", statut: "verse", motifDetaille: "Créances de restauration T1 — mère isolée au RSA, 2 enfants à charge", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Attestation CAF / QF", "RIB du responsable légal"], piecesManquantes: [], commentaireAS: "Situation suivie depuis N-1. Famille accompagnée par AS secteur.", commentaireGestion: "Mandat émis le 25/10", numeroDecision: "FSL-2024-001", dateVersement: "2024-10-25", mandatRef: "M-2024-0342", serviceRestauration: true, trimestre: "T1" },
  { id: "d2", eleveId: "e2", eleve: mockEleves[1], type: "FSL", nature: "internat", montantDemande: 520, montantAccorde: 480, dateDepot: "2024-09-25", dateLimite: "", commissionId: "c1", statut: "verse", motifDetaille: "Frais d'internat — père au RSA, échelon 6, internat seule solution (éloignement)", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Attestation CAF / QF", "RIB du responsable légal", "Attestation RSA (si applicable)"], piecesManquantes: [], commentaireAS: "Internat indispensable — 2h de transport sinon. Père au RSA activité.", commentaireGestion: "Complément bourse internat", numeroDecision: "FSL-2024-002", dateVersement: "2024-10-25", mandatRef: "M-2024-0343", serviceRestauration: false, trimestre: "T1" },
  { id: "d3", eleveId: "e3", eleve: mockEleves[2], type: "FSL", nature: "equipement", montantDemande: 450, montantAccorde: 420, dateDepot: "2024-11-15", dateLimite: "", commissionId: "c2", statut: "verse", motifDetaille: "Équipement professionnel ASSP — tenues de stage, chaussures de sécurité", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Factures / devis", "Attestation CAF / QF"], piecesManquantes: [], commentaireAS: "Famille nombreuse, 3 enfants scolarisés. Stage obligatoire en janvier.", commentaireGestion: "Achat direct par l'EPLE sur facture fournisseur", numeroDecision: "FSL-2024-003", dateVersement: "2024-12-18", mandatRef: "M-2024-0521", serviceRestauration: false, trimestre: "T1" },
  { id: "d4", eleveId: "e4", eleve: mockEleves[3], type: "FSC", nature: "restauration", montantDemande: 280, montantAccorde: 0, dateDepot: "2024-11-20", dateLimite: "", commissionId: "c2", statut: "refuse", motifDetaille: "Restauration T1+T2 — père en perte d'emploi depuis septembre", motifRefus: "QF supérieur au seuil retenu (680 > 500). Réorientation vers demande de bourse.", piecesFournies: ["Avis d'imposition N-1", "Justificatif de domicile"], piecesManquantes: ["Attestation Pôle Emploi", "Attestation CAF / QF"], commentaireAS: "Situation récente. Père inscrit Pôle Emploi depuis oct. Revoir si situation perdure.", commentaireGestion: "", numeroDecision: "", dateVersement: "", mandatRef: "", serviceRestauration: true, trimestre: "T1" },
  { id: "d5", eleveId: "e5", eleve: mockEleves[4], type: "FSC", nature: "fournitures", montantDemande: 150, montantAccorde: 150, dateDepot: "2025-01-10", dateLimite: "", commissionId: "c3", statut: "verse", motifDetaille: "Fournitures scolaires 2ème semestre + calculatrice scientifique", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Attestation CAF / QF", "RIB du responsable légal", "Factures / devis"], piecesManquantes: [], commentaireAS: "Parent AAH. Aide ponctuelle justifiée.", commentaireGestion: "Versement direct famille", numeroDecision: "FSC-2025-001", dateVersement: "2025-02-12", mandatRef: "M-2025-0089", serviceRestauration: false, trimestre: "T2" },
  { id: "d6", eleveId: "e6", eleve: mockEleves[5], type: "FSL", nature: "internat", montantDemande: 600, montantAccorde: 600, dateDepot: "2024-09-15", dateLimite: "", commissionId: "c1", statut: "verse", motifDetaille: "Prise en charge intégrale internat — mineur isolé étranger, ASE", motifRefus: "", piecesFournies: ["Certificat de scolarité", "Notification MDPH (si applicable)"], piecesManquantes: [], commentaireAS: "MIE pris en charge ASE. Aucune ressource familiale. Urgence sociale.", commentaireGestion: "Convention ASE à vérifier pour remboursement partiel", numeroDecision: "FSL-2024-004", dateVersement: "2024-10-25", mandatRef: "M-2024-0344", serviceRestauration: false, trimestre: "annuel" },
  { id: "d7", eleveId: "e1", eleve: mockEleves[0], type: "FSL", nature: "restauration", montantDemande: 350, montantAccorde: 350, dateDepot: "2025-01-08", dateLimite: "", commissionId: "c3", statut: "verse", motifDetaille: "Renouvellement aide restauration T2 — situation inchangée", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Attestation CAF / QF", "RIB du responsable légal"], piecesManquantes: [], commentaireAS: "Renouvellement. RAS.", commentaireGestion: "Même RIB que T1", numeroDecision: "FSL-2025-001", dateVersement: "2025-02-12", mandatRef: "M-2025-0090", serviceRestauration: true, trimestre: "T2" },
  { id: "d8", eleveId: "e7", eleve: mockEleves[6], type: "FSC", nature: "sortie", montantDemande: 85, montantAccorde: 85, dateDepot: "2025-01-20", dateLimite: "", commissionId: "c3", statut: "accorde", motifDetaille: "Participation sortie pédagogique Avignon — classe entière", motifRefus: "", piecesFournies: ["Avis d'imposition N-1", "Attestation CAF / QF"], piecesManquantes: ["RIB du responsable légal"], commentaireAS: "Décès mère en 2023. Père seul avec 3 enfants.", commentaireGestion: "En attente RIB pour émission mandat", numeroDecision: "FSC-2025-002", dateVersement: "", mandatRef: "", serviceRestauration: false, trimestre: "T2" },
  { id: "d9", eleveId: "e3", eleve: mockEleves[2], type: "FSL", nature: "restauration", montantDemande: 320, montantAccorde: 0, dateDepot: "2025-03-01", dateLimite: "", commissionId: "c4", statut: "instruction", motifDetaille: "Restauration T3 — famille nombreuse, impayé partiel depuis janvier", motifRefus: "", piecesFournies: ["Avis d'imposition N-1"], piecesManquantes: ["Attestation CAF / QF", "RIB du responsable légal"], commentaireAS: "Dossier à compléter pour commission avril", commentaireGestion: "", numeroDecision: "", dateVersement: "", mandatRef: "", serviceRestauration: true, trimestre: "T3" },
  { id: "d10", eleveId: "e6", eleve: mockEleves[5], type: "autre", nature: "vetements", montantDemande: 200, montantAccorde: 200, dateDepot: "2025-01-15", dateLimite: "", commissionId: "c3", statut: "verse", motifDetaille: "Aide exceptionnelle CE — vêtements chauds hiver, MIE sans ressources", motifRefus: "", piecesFournies: ["Certificat de scolarité"], piecesManquantes: [], commentaireAS: "Urgence sociale — pas de manteau", commentaireGestion: "Achat direct sur budget CE", numeroDecision: "AEX-2025-001", dateVersement: "2025-02-05", mandatRef: "M-2025-0072", serviceRestauration: false, trimestre: "T2" },
];

export const mockBudgets: Budget[] = [
  { type: "FSL", dotationInitiale: 8500, dotationComplementaire: 1200, reportAnneePrecedente: 650, totalDisponible: 10350, engage: 2200, verse: 2200, reste: 5950 },
  { type: "FSC", dotationInitiale: 3200, dotationComplementaire: 0, reportAnneePrecedente: 420, totalDisponible: 3620, engage: 235, verse: 150, reste: 3235 },
  { type: "FSE", dotationInitiale: 5000, dotationComplementaire: 800, reportAnneePrecedente: 310, totalDisponible: 6110, engage: 0, verse: 0, reste: 6110 },
  { type: "autre", dotationInitiale: 1500, dotationComplementaire: 0, reportAnneePrecedente: 0, totalDisponible: 1500, engage: 200, verse: 200, reste: 1100 },
];
