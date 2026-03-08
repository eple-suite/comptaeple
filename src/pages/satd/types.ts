export interface TiersDetenteur {
  id: string;
  nom: string;
  type: "employeur_public" | "employeur_prive" | "banque" | "caf" | "cpam" | "retraite" | "pole_emploi" | "msa" | "mutuelle" | "assurance" | "bailleur" | "notaire" | "tresor_public" | "autre";
  adresse: string;
  codePostal: string;
  ville: string;
  siret: string;
  contact: string;
  email: string;
  telephone: string;
}

export interface Creance {
  id: string;
  compte: string; // 4112, 4122, 416
  libelle: string;
  exercice: number;
  montantInitial: number;
  montantRecouvre: number;
  resteARecouvrer: number;
}

export interface Prelevement {
  date: string;
  montant: number;
  reference: string;
  mode: "virement" | "cheque" | "prelevement";
}

export interface EtapeProcedure {
  type: "relance1" | "relance2" | "relance3" | "avis_poursuites" | "autorisation_ordonnateur" | "satd_emission" | "satd_reception_ar" | "prelevement" | "contestation" | "suspension" | "reprise" | "solde" | "mise_en_demeure" | "ficoba" | "huissier";
  date: string;
  commentaire: string;
  documentGenere: boolean;
}

export interface Satd {
  id: string;
  reference: string;
  // Débiteur
  debiteur: string;
  debiteurAdresse: string;
  debiteurCP: string;
  debiteurVille: string;
  typeDebiteur: "agent" | "fournisseur" | "usager" | "eleve_famille" | "autre";
  // Créance
  creances: Creance[];
  montantTotal: number;
  fraisPoursuite: number;
  majorations: number;
  montantGlobal: number; // total + frais + majorations
  // Tiers
  tiersDetenteurId: string;
  tiersDetenteur: TiersDetenteur | null;
  // Organisme créancier (nous)
  organisme: string;
  compteBudgetaire: string;
  iban: string;
  bic: string;
  // Procédure
  dateCreation: string;
  dateReception: string;
  dateEcheance: string;
  datePrescription: string; // 4 ans pour créances publiques
  etapes: EtapeProcedure[];
  statut: "relance" | "avis_poursuites" | "autorisation" | "emise" | "en_cours" | "termine" | "suspendu" | "conteste" | "prescrit" | "irrecouv";
  // Prélèvements
  montantPreleve: number;
  prelevements: Prelevement[];
  // Divers
  motif: string;
  observations: string;
  autorisationOrdonnateur: boolean;
  dateAutorisation: string;
  compte416: boolean; // créance passée en 416
}

export const STATUT_SATD_CONFIG: Record<string, { label: string; color: string }> = {
  relance: { label: "Relance amiable", color: "bg-muted/60 text-muted-foreground border-0" },
  avis_poursuites: { label: "Avis avant poursuites", color: "bg-accent/20 text-accent-foreground border-0" },
  autorisation: { label: "Attente autorisation", color: "bg-warning/10 text-warning border-0" },
  emise: { label: "SATD émise", color: "bg-primary/10 text-primary border-0" },
  en_cours: { label: "En cours", color: "bg-warning/10 text-warning border-0" },
  termine: { label: "Soldé", color: "bg-success/10 text-success border-0" },
  suspendu: { label: "Suspendu", color: "bg-muted text-muted-foreground border-0" },
  conteste: { label: "Contesté", color: "bg-destructive/10 text-destructive border-0" },
  prescrit: { label: "Prescrit", color: "bg-destructive/20 text-destructive border-0" },
  irrecouv: { label: "Irrécouvrable", color: "bg-muted text-muted-foreground border-0" },
};

export const TYPE_TIERS_LABELS: Record<string, string> = {
  employeur_public: "Employeur public",
  employeur_prive: "Employeur privé",
  banque: "Établissement bancaire",
  caf: "CAF",
  cpam: "CPAM / Sécurité sociale",
  retraite: "Caisse de retraite",
  pole_emploi: "France Travail (ex-Pôle emploi)",
  msa: "MSA",
  mutuelle: "Mutuelle / Complémentaire santé",
  assurance: "Compagnie d'assurance",
  bailleur: "Bailleur / Locataire",
  notaire: "Notaire / Huissier",
  tresor_public: "Trésor public / DDFiP",
  autre: "Autre",
};

export const TYPE_DEBITEUR_LABELS: Record<string, string> = {
  agent: "Agent de l'État",
  fournisseur: "Fournisseur",
  usager: "Usager du service public",
  eleve_famille: "Famille d'élève",
  autre: "Autre",
};

export const ETAPE_LABELS: Record<string, string> = {
  relance1: "1ère relance amiable",
  relance2: "2ème relance amiable",
  relance3: "3ème relance amiable",
  avis_poursuites: "Avis avant poursuites",
  autorisation_ordonnateur: "Autorisation de l'ordonnateur",
  satd_emission: "Émission SATD",
  satd_reception_ar: "Réception AR",
  prelevement: "Prélèvement reçu",
  contestation: "Contestation du débiteur",
  suspension: "Suspension de la procédure",
  reprise: "Reprise de la procédure",
  solde: "Solde de la procédure",
  mise_en_demeure: "Mise en demeure",
  ficoba: "Demande FICOBA",
  huissier: "Recours à l'huissier",
};

// Mock data
export const mockTiers: TiersDetenteur[] = [
  // Employeurs publics
  { id: "t1", nom: "Rectorat d'Aix-Marseille — Service paie", type: "employeur_public", adresse: "Place Lucien Paye", codePostal: "13621", ville: "Aix-en-Provence", siret: "17130002700012", contact: "Service gestionnaire paie", email: "drh-paie@ac-aix-marseille.fr", telephone: "04 42 91 70 00" },
  { id: "t1b", nom: "DSDEN des Bouches-du-Rhône — Paie", type: "employeur_public", adresse: "28 bd Charles Nédelec", codePostal: "13231", ville: "Marseille Cedex 01", siret: "17130002700020", contact: "Service RH", email: "", telephone: "04 91 99 66 66" },
  { id: "t1c", nom: "Centre hospitalier de Marseille (AP-HM)", type: "employeur_public", adresse: "80 rue Brochier", codePostal: "13005", ville: "Marseille", siret: "26130000400017", contact: "DRH — Service paie", email: "", telephone: "04 91 38 00 00" },
  { id: "t1d", nom: "Mairie de Marseille — Service RH", type: "employeur_public", adresse: "Place Bargemon", codePostal: "13002", ville: "Marseille", siret: "21130055200018", contact: "Service paie", email: "", telephone: "04 91 55 11 11" },
  { id: "t1e", nom: "Conseil départemental 13 — DRH", type: "employeur_public", adresse: "52 avenue de Saint-Just", codePostal: "13256", ville: "Marseille Cedex 20", siret: "22130001500015", contact: "Service paie", email: "", telephone: "04 13 31 13 13" },
  { id: "t1f", nom: "Région Sud — Service paie", type: "employeur_public", adresse: "27 place Jules Guesde", codePostal: "13481", ville: "Marseille Cedex 20", siret: "23130001600014", contact: "DRH", email: "", telephone: "04 91 57 50 57" },
  { id: "t1g", nom: "Ministère de l'Éducation nationale — DGRH", type: "employeur_public", adresse: "110 rue de Grenelle", codePostal: "75357", ville: "Paris SP 07", siret: "11000601800014", contact: "Bureau des traitements", email: "", telephone: "" },

  // Employeurs privés
  { id: "t5", nom: "Société Onet — Services", type: "employeur_prive", adresse: "36 bd de l'Océan", codePostal: "13009", ville: "Marseille", siret: "50793280200039", contact: "Service RH", email: "rh@onet.fr", telephone: "04 91 17 56 00" },
  { id: "t5b", nom: "Sodexo France", type: "employeur_prive", adresse: "255 quai de la Bataille de Stalingrad", codePostal: "92130", ville: "Issy-les-Moulineaux", siret: "30145613800016", contact: "Service paie", email: "", telephone: "" },
  { id: "t5c", nom: "Carrefour Hypermarché — Marseille Grand Littoral", type: "employeur_prive", adresse: "CC Grand Littoral", codePostal: "13016", ville: "Marseille", siret: "65201440200512", contact: "Service RH", email: "", telephone: "" },
  { id: "t5d", nom: "Amazon France Logistique", type: "employeur_prive", adresse: "ZI Les Arnavaux", codePostal: "13014", ville: "Marseille", siret: "42878504200023", contact: "Service paie", email: "", telephone: "" },

  // Banques
  { id: "t3", nom: "La Banque Postale — Service saisies", type: "banque", adresse: "115 rue de Sèvres", codePostal: "75275", ville: "Paris Cedex 06", siret: "42100000100014", contact: "Service saisies-attributions", email: "saisies@labanquepostale.fr", telephone: "" },
  { id: "t3b", nom: "BNP Paribas — Service saisies", type: "banque", adresse: "TSA 93005", codePostal: "75318", ville: "Paris Cedex 09", siret: "66210476500017", contact: "Pôle saisies", email: "", telephone: "" },
  { id: "t3c", nom: "Crédit Agricole Alpes Provence — Saisies", type: "banque", adresse: "25 chemin des Trois Cyprès", codePostal: "13097", ville: "Aix-en-Provence Cedex 02", siret: "40282791400012", contact: "Service contentieux", email: "", telephone: "04 42 60 44 00" },
  { id: "t3d", nom: "Société Générale — Service saisies", type: "banque", adresse: "TSA 10501", codePostal: "75886", ville: "Paris Cedex 18", siret: "55212022200013", contact: "Service saisies", email: "", telephone: "" },
  { id: "t3e", nom: "Caisse d'Épargne CEPAC — Saisies", type: "banque", adresse: "Place Estrangin Pastré", codePostal: "13006", ville: "Marseille", siret: "77555914000013", contact: "Service saisies", email: "", telephone: "04 91 57 00 00" },
  { id: "t3f", nom: "CIC Lyonnaise de Banque — Saisies", type: "banque", adresse: "TSA 40090", codePostal: "69918", ville: "Lyon Cedex 20", siret: "95450539600013", contact: "Service saisies", email: "", telephone: "" },
  { id: "t3g", nom: "Crédit Mutuel Méditerranéen", type: "banque", adresse: "494 avenue du Prado", codePostal: "13008", ville: "Marseille", siret: "30004807400016", contact: "Service saisies", email: "", telephone: "" },
  { id: "t3h", nom: "Banque Populaire Méditerranée — Saisies", type: "banque", adresse: "245 bd Mireille Lauze", codePostal: "13290", ville: "Aix-en-Provence", siret: "08838710000017", contact: "Service contentieux", email: "", telephone: "" },

  // CAF
  { id: "t4", nom: "CAF des Bouches-du-Rhône", type: "caf", adresse: "29 boulevard de Dunkerque", codePostal: "13002", ville: "Marseille", siret: "78280166900011", contact: "Service contentieux", email: "", telephone: "3230" },
  { id: "t4b", nom: "CAF du Var", type: "caf", adresse: "Rue Émile Ollivier", codePostal: "83083", ville: "Toulon Cedex", siret: "78282953800012", contact: "Service contentieux", email: "", telephone: "3230" },
  { id: "t4c", nom: "CAF du Vaucluse", type: "caf", adresse: "6 rue Saint-Charles", codePostal: "84026", ville: "Avignon Cedex 1", siret: "78285091400010", contact: "Service contentieux", email: "", telephone: "3230" },

  // CPAM
  { id: "t6", nom: "CPAM des Bouches-du-Rhône", type: "cpam", adresse: "56 chemin Joseph Aiguier", codePostal: "13009", ville: "Marseille", siret: "78281038000010", contact: "Service indemnités journalières", email: "", telephone: "3646" },
  { id: "t6b", nom: "CPAM du Var", type: "cpam", adresse: "Avenue du Président Kennedy", codePostal: "83000", ville: "Toulon", siret: "78282953900011", contact: "Service IJ", email: "", telephone: "3646" },

  // Caisses de retraite
  { id: "t7", nom: "CARSAT Sud-Est", type: "retraite", adresse: "35 rue George", codePostal: "13386", ville: "Marseille Cedex 20", siret: "78280229500017", contact: "Service paiement retraites", email: "", telephone: "3960" },
  { id: "t7b", nom: "IRCANTEC", type: "retraite", adresse: "24 rue Louis Gain", codePostal: "49939", ville: "Angers Cedex 9", siret: "77559959400061", contact: "Service pensions", email: "", telephone: "" },
  { id: "t7c", nom: "CNRACL — Caisse de retraite des fonctionnaires", type: "retraite", adresse: "Rue du Vergne", codePostal: "33059", ville: "Bordeaux Cedex", siret: "18003501900015", contact: "Service paiement", email: "", telephone: "" },
  { id: "t7d", nom: "AGIRC-ARRCO — Retraite complémentaire", type: "retraite", adresse: "16 rue Jules César", codePostal: "75592", ville: "Paris Cedex 12", siret: "78462831100015", contact: "Service pensions", email: "", telephone: "0 970 660 660" },

  // France Travail
  { id: "t8", nom: "France Travail (ex-Pôle emploi) — Marseille", type: "pole_emploi", adresse: "28 bd de la Libération", codePostal: "13001", ville: "Marseille", siret: "13000548100016", contact: "Service indemnisation", email: "", telephone: "3949" },
  { id: "t8b", nom: "France Travail (ex-Pôle emploi) — Aix-en-Provence", type: "pole_emploi", adresse: "1 place Martin Luther King", codePostal: "13090", ville: "Aix-en-Provence", siret: "13000548100024", contact: "Service indemnisation", email: "", telephone: "3949" },

  // MSA
  { id: "t9", nom: "MSA Provence Azur", type: "msa", adresse: "152 avenue de Hambourg", codePostal: "13285", ville: "Marseille Cedex 08", siret: "48929490800016", contact: "Service prestations", email: "", telephone: "" },

  // Trésor public / DDFiP
  { id: "t2", nom: "DDFiP des Bouches-du-Rhône", type: "tresor_public", adresse: "16 rue Borde", codePostal: "13008", ville: "Marseille", siret: "", contact: "Service recouvrement / FICOBA", email: "", telephone: "04 91 17 80 00" },
  { id: "t2b", nom: "DRFiP PACA — Trésorerie", type: "tresor_public", adresse: "22 bd Paul Peytral", codePostal: "13282", ville: "Marseille Cedex 06", siret: "", contact: "Service recouvrement", email: "", telephone: "" },

  // Mutuelles
  { id: "t10", nom: "MGEN — Mutuelle Éducation nationale", type: "mutuelle", adresse: "TSA 70731", codePostal: "93507", ville: "Pantin Cedex", siret: "77568536200012", contact: "Service prestations", email: "", telephone: "3676" },

  // Assurances
  { id: "t11", nom: "MAIF — Service sinistres", type: "assurance", adresse: "200 avenue Salvador Allende", codePostal: "79038", ville: "Niort Cedex 9", siret: "77570970201512", contact: "Service indemnisation", email: "", telephone: "05 49 73 87 00" },

  // Notaires
  { id: "t12", nom: "SCP Notaires associés — Me Martin", type: "notaire", adresse: "12 cours Mirabeau", codePostal: "13100", ville: "Aix-en-Provence", siret: "", contact: "Me Martin", email: "", telephone: "" },
];

export const mockSatds: Satd[] = [
  {
    id: "s1", reference: "SATD-2024-001",
    debiteur: "M. DUPONT Jean", debiteurAdresse: "12 rue des Lilas", debiteurCP: "13001", debiteurVille: "Marseille",
    typeDebiteur: "agent",
    creances: [
      { id: "cr1", compte: "4112", libelle: "Restauration 2022-2023", exercice: 2023, montantInitial: 1800, montantRecouvre: 0, resteARecouvrer: 1800 },
      { id: "cr2", compte: "416", libelle: "Restauration 2021-2022 (douteux)", exercice: 2022, montantInitial: 700, montantRecouvre: 0, resteARecouvrer: 700 },
    ],
    montantTotal: 2500, fraisPoursuite: 0, majorations: 0, montantGlobal: 2500,
    tiersDetenteurId: "t1", tiersDetenteur: null,
    organisme: "Lycée Victor Hugo", compteBudgetaire: "421000", iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
    dateCreation: "2024-01-05", dateReception: "2024-01-10", dateEcheance: "2024-06-30",
    datePrescription: "2027-01-05",
    etapes: [
      { type: "relance1", date: "2023-09-15", commentaire: "Courrier simple", documentGenere: true },
      { type: "relance2", date: "2023-11-10", commentaire: "Courrier recommandé", documentGenere: true },
      { type: "avis_poursuites", date: "2023-12-05", commentaire: "Avis envoyé en RAR", documentGenere: true },
      { type: "autorisation_ordonnateur", date: "2024-01-02", commentaire: "Autorisation du CE reçue", documentGenere: false },
      { type: "satd_emission", date: "2024-01-05", commentaire: "3 documents envoyés en RAR", documentGenere: true },
      { type: "satd_reception_ar", date: "2024-01-12", commentaire: "AR reçus des 3 destinataires", documentGenere: false },
      { type: "prelevement", date: "2024-02-15", commentaire: "Prélèvement sur salaire", documentGenere: false },
      { type: "prelevement", date: "2024-03-15", commentaire: "Prélèvement sur salaire", documentGenere: false },
      { type: "prelevement", date: "2024-04-15", commentaire: "Prélèvement sur salaire", documentGenere: false },
    ],
    statut: "en_cours", montantPreleve: 1500,
    prelevements: [
      { date: "2024-02-15", montant: 500, reference: "VIR-FEV-2024", mode: "virement" },
      { date: "2024-03-15", montant: 500, reference: "VIR-MAR-2024", mode: "virement" },
      { date: "2024-04-15", montant: 500, reference: "VIR-AVR-2024", mode: "virement" },
    ],
    motif: "Impayés restauration scolaire — exercices 2022 et 2023",
    observations: "Agent en poste au rectorat. Prélèvement mensuel 500€ sur traitement.",
    autorisationOrdonnateur: true, dateAutorisation: "2024-01-02", compte416: true,
  },
  {
    id: "s2", reference: "SATD-2024-002",
    debiteur: "Mme MARTIN Sophie", debiteurAdresse: "5 avenue Foch", debiteurCP: "13006", debiteurVille: "Marseille",
    typeDebiteur: "eleve_famille",
    creances: [
      { id: "cr3", compte: "4112", libelle: "Restauration 2023-2024 T1", exercice: 2024, montantInitial: 420, montantRecouvre: 0, resteARecouvrer: 420 },
      { id: "cr4", compte: "4112", libelle: "Restauration 2023-2024 T2", exercice: 2024, montantInitial: 380, montantRecouvre: 0, resteARecouvrer: 380 },
    ],
    montantTotal: 800, fraisPoursuite: 0, majorations: 0, montantGlobal: 800,
    tiersDetenteurId: "t5", tiersDetenteur: null,
    organisme: "Lycée Victor Hugo", compteBudgetaire: "411200", iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
    dateCreation: "2024-03-01", dateReception: "", dateEcheance: "",
    datePrescription: "2028-03-01",
    etapes: [
      { type: "relance1", date: "2024-01-15", commentaire: "Courrier simple", documentGenere: true },
      { type: "relance2", date: "2024-02-15", commentaire: "Courrier recommandé", documentGenere: true },
      { type: "avis_poursuites", date: "2024-03-01", commentaire: "Envoi en cours", documentGenere: true },
    ],
    statut: "avis_poursuites", montantPreleve: 0, prelevements: [],
    motif: "Impayés restauration scolaire 2023-2024",
    observations: "Famille ne répond pas aux relances. Employeur identifié.",
    autorisationOrdonnateur: false, dateAutorisation: "", compte416: false,
  },
  {
    id: "s3", reference: "SATD-2023-008",
    debiteur: "M. BERNARD Pierre", debiteurAdresse: "22 bd Michelet", debiteurCP: "13008", debiteurVille: "Marseille",
    typeDebiteur: "agent",
    creances: [
      { id: "cr5", compte: "416", libelle: "Restauration 2020-2021", exercice: 2021, montantInitial: 650, montantRecouvre: 650, resteARecouvrer: 0 },
    ],
    montantTotal: 650, fraisPoursuite: 0, majorations: 0, montantGlobal: 650,
    tiersDetenteurId: "t1", tiersDetenteur: null,
    organisme: "Lycée Victor Hugo", compteBudgetaire: "421000", iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
    dateCreation: "2023-06-10", dateReception: "2023-06-15", dateEcheance: "2023-12-31",
    datePrescription: "2025-06-10",
    etapes: [
      { type: "relance1", date: "2023-01-15", commentaire: "", documentGenere: true },
      { type: "relance2", date: "2023-03-15", commentaire: "", documentGenere: true },
      { type: "avis_poursuites", date: "2023-05-01", commentaire: "", documentGenere: true },
      { type: "autorisation_ordonnateur", date: "2023-06-05", commentaire: "", documentGenere: false },
      { type: "satd_emission", date: "2023-06-10", commentaire: "", documentGenere: true },
      { type: "prelevement", date: "2023-07-15", commentaire: "", documentGenere: false },
      { type: "prelevement", date: "2023-08-15", commentaire: "", documentGenere: false },
      { type: "solde", date: "2023-08-20", commentaire: "Soldé intégralement", documentGenere: false },
    ],
    statut: "termine", montantPreleve: 650,
    prelevements: [
      { date: "2023-07-15", montant: 350, reference: "VIR-JUL-2023", mode: "virement" },
      { date: "2023-08-15", montant: 300, reference: "VIR-AOU-2023", mode: "virement" },
    ],
    motif: "Impayés restauration scolaire 2020-2021",
    observations: "Dossier soldé.", autorisationOrdonnateur: true, dateAutorisation: "2023-06-05", compte416: true,
  },
  {
    id: "s4", reference: "SATD-2024-003",
    debiteur: "Mme GARCIA Maria", debiteurAdresse: "8 rue de la République", debiteurCP: "13002", debiteurVille: "Marseille",
    typeDebiteur: "eleve_famille",
    creances: [
      { id: "cr6", compte: "416", libelle: "Voyage scolaire 2022", exercice: 2022, montantInitial: 320, montantRecouvre: 0, resteARecouvrer: 320 },
    ],
    montantTotal: 320, fraisPoursuite: 0, majorations: 0, montantGlobal: 320,
    tiersDetenteurId: "t4", tiersDetenteur: null,
    organisme: "Lycée Victor Hugo", compteBudgetaire: "411200", iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
    dateCreation: "2024-02-20", dateReception: "2024-02-25", dateEcheance: "2024-08-20",
    datePrescription: "2026-02-20",
    etapes: [
      { type: "relance1", date: "2023-06-15", commentaire: "", documentGenere: true },
      { type: "relance2", date: "2023-09-15", commentaire: "", documentGenere: true },
      { type: "relance3", date: "2023-12-01", commentaire: "", documentGenere: true },
      { type: "avis_poursuites", date: "2024-01-15", commentaire: "", documentGenere: true },
      { type: "autorisation_ordonnateur", date: "2024-02-10", commentaire: "", documentGenere: false },
      { type: "satd_emission", date: "2024-02-20", commentaire: "", documentGenere: true },
      { type: "contestation", date: "2024-03-10", commentaire: "Contestation reçue — conteste le montant", documentGenere: false },
      { type: "suspension", date: "2024-03-15", commentaire: "Suspension en attente arbitrage", documentGenere: false },
    ],
    statut: "conteste", montantPreleve: 0, prelevements: [],
    motif: "Impayé voyage scolaire Barcelone 2022",
    observations: "Débitrice conteste le montant (dit avoir payé 100€ en espèces non comptabilisés). Vérification en cours.",
    autorisationOrdonnateur: true, dateAutorisation: "2024-02-10", compte416: true,
  },
  {
    id: "s5", reference: "SATD-2025-001",
    debiteur: "M. PETIT Jacques", debiteurAdresse: "15 traverse des Oliviers", debiteurCP: "13012", debiteurVille: "Marseille",
    typeDebiteur: "eleve_famille",
    creances: [
      { id: "cr7", compte: "4112", libelle: "Restauration 2024-2025 T1", exercice: 2025, montantInitial: 350, montantRecouvre: 0, resteARecouvrer: 350 },
    ],
    montantTotal: 350, fraisPoursuite: 0, majorations: 0, montantGlobal: 350,
    tiersDetenteurId: "", tiersDetenteur: null,
    organisme: "Lycée Victor Hugo", compteBudgetaire: "411200", iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
    dateCreation: "2025-02-01", dateReception: "", dateEcheance: "",
    datePrescription: "2029-02-01",
    etapes: [
      { type: "relance1", date: "2025-01-10", commentaire: "Courrier simple envoyé", documentGenere: true },
      { type: "relance2", date: "2025-02-01", commentaire: "RAR envoyé", documentGenere: true },
    ],
    statut: "relance", montantPreleve: 0, prelevements: [],
    motif: "Impayé restauration T1 2024-2025",
    observations: "Phase de relance amiable. Pas de réponse du débiteur.",
    autorisationOrdonnateur: false, dateAutorisation: "", compte416: false,
  },
];
