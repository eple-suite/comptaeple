/**
 * Nomenclature M9-6 (2026) — Référentiel comptable EPLE
 * Sens normal des soldes, classification, interconnexions, anomalies
 */

export interface CompteM96 {
  numero: string;
  libelle: string;
  classe: number;
  sensNormal: "debiteur" | "crediteur";
  categorie: "bilan" | "gestion";
  sousCategorie: string;
  description: string;
  interconnexions?: string[]; // comptes liés
  alerteSoldeAnormal?: string; // message si solde dans le mauvais sens
  sourceFinancement?: "etat" | "collectivite" | "familles" | "propre" | "mixte";
  estSubvention?: boolean;
  imputationRecettes?: boolean;
  imputationDepenses?: boolean;
  sphere?: "ordonnateur" | "comptable" | "les_deux"; // sphère Op@le
}

// ─── Référentiel M9-6 enrichi ───
export const NOMENCLATURE_M96: CompteM96[] = [
  // ═══ CLASSE 1 — CAPITAUX ═══
  {
    numero: "10",
    libelle: "Dotations et fonds globalisés",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Capitaux propres",
    description: "Dotation initiale et complémentaire de l'EPLE",
    alerteSoldeAnormal: "⚠️ Un solde débiteur signifie que l'établissement a un déficit structurel de capitaux propres",
    sourceFinancement: "mixte",
  },
  {
    numero: "102",
    libelle: "Dotation",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Capitaux propres",
    description: "Dotation de l'État ou de la collectivité de rattachement",
    sourceFinancement: "mixte",
    alerteSoldeAnormal: "⚠️ Solde débiteur anormal — la dotation ne peut être négative",
  },
  {
    numero: "106",
    libelle: "Réserves",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Capitaux propres",
    description: "Réserves constituées par affectation de résultats antérieurs",
    alerteSoldeAnormal: "⚠️ Solde débiteur → les réserves ont été entièrement consommées, situation critique",
    sourceFinancement: "propre",
  },
  {
    numero: "110",
    libelle: "Report à nouveau (solde créditeur)",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Capitaux propres",
    description: "Résultat positif non encore affecté",
    sourceFinancement: "propre",
  },
  {
    numero: "119",
    libelle: "Report à nouveau (solde débiteur)",
    classe: 1, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Capitaux propres",
    description: "Déficit antérieur non encore résorbé",
    alerteSoldeAnormal: "Ce compte est normalement débiteur mais attention, un solde élevé indique un déficit persistant",
    sourceFinancement: "propre",
  },
  {
    numero: "12",
    libelle: "Résultat de l'exercice",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Résultat",
    description: "Résultat net de l'exercice (bénéfice ou perte)",
    alerteSoldeAnormal: "Un solde débiteur indique un déficit sur l'exercice",
    sourceFinancement: "propre",
  },
  {
    numero: "13",
    libelle: "Subventions d'investissement",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions",
    description: "Subventions affectées à des investissements (État, Région, Département...)",
    interconnexions: ["21", "23", "28"],
    estSubvention: true,
    sourceFinancement: "mixte",
    alerteSoldeAnormal: "⚠️ Un solde débiteur est impossible — vérifier les écritures",
  },
  {
    numero: "131",
    libelle: "Subventions d'équipement — État",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions investissement",
    description: "Subventions d'investissement versées par l'État",
    estSubvention: true, sourceFinancement: "etat",
    interconnexions: ["21", "139"],
  },
  {
    numero: "132",
    libelle: "Subventions d'équipement — Collectivités",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions investissement",
    description: "Subventions d'investissement versées par les collectivités territoriales",
    estSubvention: true, sourceFinancement: "collectivite",
    interconnexions: ["21", "139"],
  },
  {
    numero: "15",
    libelle: "Provisions pour risques et charges",
    classe: 1, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Provisions",
    description: "Provisions constituées pour couvrir des risques ou charges futures",
    interconnexions: ["681", "781"],
    alerteSoldeAnormal: "⚠️ Un solde débiteur de provision est anormal",
  },

  // ═══ CLASSE 2 — IMMOBILISATIONS ═══
  {
    numero: "20",
    libelle: "Immobilisations incorporelles",
    classe: 2, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Immobilisations",
    description: "Logiciels, licences, brevets",
    interconnexions: ["28", "68"],
    alerteSoldeAnormal: "⚠️ Solde créditeur anormal — une immobilisation ne peut pas être négative",
  },
  {
    numero: "21",
    libelle: "Immobilisations corporelles",
    classe: 2, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Immobilisations",
    description: "Matériel, mobilier, véhicules, agencements",
    interconnexions: ["28", "68", "13"],
    alerteSoldeAnormal: "⚠️ Solde créditeur impossible",
    sourceFinancement: "mixte",
  },
  {
    numero: "23",
    libelle: "Immobilisations en cours",
    classe: 2, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Immobilisations",
    description: "Travaux en cours non encore livrés",
    interconnexions: ["21", "13"],
  },
  {
    numero: "28",
    libelle: "Amortissements des immobilisations",
    classe: 2, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Amortissements",
    description: "Cumul des amortissements — vient en déduction de l'actif brut",
    interconnexions: ["21", "681"],
    alerteSoldeAnormal: "⚠️ Un amortissement débiteur est anormal sauf écriture de sortie d'actif",
  },
  {
    numero: "29",
    libelle: "Dépréciations des immobilisations",
    classe: 2, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Dépréciations",
    description: "Perte de valeur au-delà de l'amortissement normal",
    interconnexions: ["681", "781"],
  },

  // ═══ CLASSE 3 — STOCKS ═══
  {
    numero: "31",
    libelle: "Matières premières et fournitures",
    classe: 3, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Stocks",
    description: "Stocks de denrées alimentaires, fournitures, produits d'entretien",
    interconnexions: ["603"],
    alerteSoldeAnormal: "⚠️ Stock créditeur impossible — vérifier les écritures d'inventaire",
  },
  {
    numero: "39",
    libelle: "Dépréciations de stocks",
    classe: 3, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Dépréciations",
    description: "Provisions pour dépréciation de stocks périmés ou endommagés",
    interconnexions: ["68", "78"],
  },

  // ═══ CLASSE 4 — COMPTES DE TIERS ═══
  {
    numero: "401",
    libelle: "Fournisseurs",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Dettes fournisseurs",
    description: "Dettes envers les fournisseurs",
    alerteSoldeAnormal: "⚠️ Un solde débiteur indique un trop-versé à un fournisseur ou une avance non régularisée",
    imputationDepenses: true,
  },
  {
    numero: "408",
    libelle: "Fournisseurs — Factures non parvenues",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Charges à payer",
    description: "Provisions pour factures attendues mais non reçues en fin d'exercice",
    interconnexions: ["401", "6"],
  },
  {
    numero: "411",
    libelle: "Familles — Redevables",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Créances familles",
    description: "Créances sur les familles (demi-pension, internat, voyages...)",
    interconnexions: ["7"],
    imputationRecettes: true,
    sourceFinancement: "familles",
    alerteSoldeAnormal: "⚠️ Un solde créditeur signifie un trop-perçu des familles à rembourser",
  },
  {
    numero: "4112",
    libelle: "Familles — Demi-pensionnaires",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Créances familles",
    description: "Créances de demi-pension sur les familles. Les titres de recettes y sont imputés au débit, les encaissements au crédit.",
    interconnexions: ["70622", "5"],
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "4113",
    libelle: "Familles — Internes",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Créances familles",
    description: "Créances d'internat sur les familles",
    interconnexions: ["70623", "5"],
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "416",
    libelle: "Créances douteuses ou litigieuses",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Créances douteuses",
    description: "Créances transférées en contentieux (après mise en demeure infructueuse). Reclassement depuis le 411.",
    interconnexions: ["411", "491", "654"],
    alerteSoldeAnormal: "Un solde élevé indique un taux de recouvrement dégradé. Vérifier l'ancienneté des créances.",
    sourceFinancement: "familles",
  },
  {
    numero: "421",
    libelle: "Personnel — Rémunérations dues",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Dettes personnel",
    description: "Salaires et indemnités à verser",
    alerteSoldeAnormal: "⚠️ Un solde débiteur indique un trop-versé au personnel",
    imputationDepenses: true,
  },
  {
    numero: "431",
    libelle: "Sécurité sociale",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Charges sociales",
    description: "Cotisations sociales à payer",
  },
  {
    numero: "441",
    libelle: "Collectivités publiques — Subventions",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions à recevoir",
    description: "Subventions de fonctionnement des collectivités territoriales (Région, Département). Crédit = notification, Débit = encaissement.",
    interconnexions: ["74", "5"],
    estSubvention: true,
    sourceFinancement: "collectivite",
    alerteSoldeAnormal: "⚠️ Un solde débiteur important signifie des subventions notifiées non encore encaissées → relancer la collectivité",
  },
  {
    numero: "4411",
    libelle: "Région — Subvention de fonctionnement",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions collectivités",
    description: "Subvention de fonctionnement de la Région",
    estSubvention: true, sourceFinancement: "collectivite",
    interconnexions: ["7411", "5"],
  },
  {
    numero: "4412",
    libelle: "Département — Subvention de fonctionnement",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions collectivités",
    description: "Subvention de fonctionnement du Département",
    estSubvention: true, sourceFinancement: "collectivite",
    interconnexions: ["7412", "5"],
  },
  {
    numero: "443",
    libelle: "État — Opérations particulières",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions État",
    description: "Opérations pour le compte de l'État : bourses, aides sociales",
    interconnexions: ["74", "5"],
    estSubvention: true,
    sourceFinancement: "etat",
  },
  {
    numero: "44311",
    libelle: "Bourses nationales — Crédit à répartir",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Bourses État",
    description: "Enregistre au crédit les avances de bourses reçues de l'État. Le débit est mouvementé par le 4112/4113 (attribution aux familles).",
    interconnexions: ["4112", "4113", "5"],
    estSubvention: true,
    sourceFinancement: "etat",
    alerteSoldeAnormal: "⚠️ Solde débiteur = plus de bourses distribuées que reçues → vérifier le versement de l'État",
  },
  {
    numero: "44312",
    libelle: "Bourses nationales — Part familles",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Bourses État",
    description: "Part des bourses revenant aux familles (excédent après imputation sur les frais scolaires). Débit = montant à rembourser. Crédit = remboursement effectué.",
    interconnexions: ["44311", "5"],
    sourceFinancement: "etat",
  },
  {
    numero: "4432",
    libelle: "Primes et indemnités État",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Subventions État",
    description: "Primes versées par l'État (prime d'équipement, etc.)",
    estSubvention: true, sourceFinancement: "etat",
  },
  {
    numero: "4438",
    libelle: "Fonds sociaux État",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Fonds sociaux",
    description: "Fonds sociaux (FSE, FSL) reçus de l'État pour aide aux familles en difficulté",
    interconnexions: ["6571", "5"],
    estSubvention: true, sourceFinancement: "etat",
    alerteSoldeAnormal: "⚠️ Un solde débiteur signifie que plus de fonds sociaux ont été distribués que reçus",
  },
  {
    numero: "4486",
    libelle: "État — Charges à payer",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Charges à payer",
    description: "Charges à payer vis-à-vis de l'État en fin d'exercice",
  },
  {
    numero: "4487",
    libelle: "État — Produits à recevoir",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Produits à recevoir",
    description: "Produits à recevoir de l'État en fin d'exercice",
    sourceFinancement: "etat",
  },
  {
    numero: "467",
    libelle: "Autres comptes débiteurs ou créditeurs",
    classe: 4, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Divers",
    description: "Opérations en attente de régularisation",
    alerteSoldeAnormal: "⚠️ Ce compte doit être soldé en fin d'exercice. Un solde persistant indique une anomalie de régularisation.",
  },
  {
    numero: "468",
    libelle: "Charges à payer et produits à recevoir divers",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Régularisation",
    description: "Rattachement des charges et produits à l'exercice",
  },
  {
    numero: "491",
    libelle: "Dépréciation des comptes de redevables",
    classe: 4, sensNormal: "crediteur", categorie: "bilan", sousCategorie: "Dépréciations créances",
    description: "Provision pour créances douteuses (contrepartie du 416). Doit être ajustée chaque année.",
    interconnexions: ["416", "681", "781"],
    alerteSoldeAnormal: "⚠️ Doit être ≤ au solde du 416. Un écart indique un ajustement manquant.",
  },

  // ═══ CLASSE 5 — COMPTES FINANCIERS ═══
  {
    numero: "5",
    libelle: "Comptes financiers",
    classe: 5, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Trésorerie",
    description: "Ensemble des disponibilités et valeurs mobilières de placement",
    alerteSoldeAnormal: "⚠️ Un solde créditeur signifie un découvert — interdit pour un EPLE",
  },
  {
    numero: "511",
    libelle: "Valeurs à l'encaissement",
    classe: 5, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Trésorerie",
    description: "Chèques et virements en cours d'encaissement",
    interconnexions: ["515"],
  },
  {
    numero: "515",
    libelle: "Compte au Trésor",
    classe: 5, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Trésorerie",
    description: "Compte de dépôt au Trésor public — principal compte bancaire de l'EPLE",
    alerteSoldeAnormal: "⚠️ ALERTE CRITIQUE : Un solde créditeur signifie un découvert au Trésor, interdit réglementairement",
    sourceFinancement: "propre",
  },
  {
    numero: "531",
    libelle: "Caisse",
    classe: 5, sensNormal: "debiteur", categorie: "bilan", sousCategorie: "Trésorerie",
    description: "Espèces en caisse. Le solde doit correspondre à l'encaisse physique.",
    alerteSoldeAnormal: "⚠️ Un solde créditeur est impossible — excédent de décaissements sur l'encaisse",
  },

  // ═══ CLASSE 6 — CHARGES ═══
  {
    numero: "60",
    libelle: "Achats et variations de stocks",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Achats",
    description: "Achats de matières, fournitures, denrées alimentaires",
    imputationDepenses: true,
  },
  {
    numero: "603",
    libelle: "Variation des stocks",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Stocks",
    description: "Ajustement de stock en fin d'exercice. Peut être créditeur (déstockage) ou débiteur (stockage).",
    interconnexions: ["31"],
  },
  {
    numero: "61",
    libelle: "Services extérieurs",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Services",
    description: "Sous-traitance, locations, entretien, assurances",
    imputationDepenses: true,
  },
  {
    numero: "62",
    libelle: "Autres services extérieurs",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Services",
    description: "Honoraires, publicité, déplacements, frais postaux",
    imputationDepenses: true,
  },
  {
    numero: "64",
    libelle: "Charges de personnel",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Personnel",
    description: "Rémunérations et charges sociales des personnels contractuels",
    interconnexions: ["421", "431"],
    imputationDepenses: true,
  },
  {
    numero: "65",
    libelle: "Autres charges de gestion courante",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Charges courantes",
    description: "Subventions versées, créances irrécouvrables, etc.",
    imputationDepenses: true,
  },
  {
    numero: "654",
    libelle: "Pertes sur créances irrécouvrables",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Créances perdues",
    description: "Admission en non-valeur des créances irrécouvrables après épuisement des voies de recouvrement",
    interconnexions: ["416", "491"],
  },
  {
    numero: "6571",
    libelle: "Fonds sociaux — Aides versées",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Aides sociales",
    description: "Montant des aides versées aux familles sur les fonds sociaux (FSE, FSL)",
    interconnexions: ["4438"],
    sourceFinancement: "etat",
  },
  {
    numero: "66",
    libelle: "Charges financières",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Charges financières",
    description: "Intérêts sur emprunts (rare en EPLE)",
  },
  {
    numero: "67",
    libelle: "Charges exceptionnelles",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Exceptionnel",
    description: "Charges non récurrentes, pénalités, etc.",
  },
  {
    numero: "68",
    libelle: "Dotations aux amortissements et provisions",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Amortissements",
    description: "Dotations annuelles aux amortissements des immobilisations et aux provisions",
    interconnexions: ["28", "29", "15", "491"],
  },
  {
    numero: "681",
    libelle: "Dotations aux amortissements, dépréciations et provisions — Charges d'exploitation",
    classe: 6, sensNormal: "debiteur", categorie: "gestion", sousCategorie: "Amortissements",
    description: "Dotations d'exploitation",
    interconnexions: ["28", "491", "15"],
  },

  // ═══ CLASSE 7 — PRODUITS ═══
  {
    numero: "70",
    libelle: "Vente de produits et prestations",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Ventes",
    description: "Produits des activités de l'EPLE : restauration, hébergement, etc.",
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "7062",
    libelle: "Prestations de restauration et d'hébergement",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Restauration",
    description: "Recettes de demi-pension et d'internat",
    interconnexions: ["4112", "4113"],
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "70622",
    libelle: "Demi-pension — Élèves",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Restauration",
    description: "Recettes de demi-pension des élèves. Titre de recette → débit 4112, crédit 70622.",
    interconnexions: ["4112"],
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "70623",
    libelle: "Internat — Élèves",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Hébergement",
    description: "Recettes d'internat des élèves",
    interconnexions: ["4113"],
    imputationRecettes: true,
    sourceFinancement: "familles",
  },
  {
    numero: "74",
    libelle: "Subventions d'exploitation",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Subventions fonctionnement",
    description: "Subventions de fonctionnement reçues (État, collectivités, autres)",
    estSubvention: true,
    sourceFinancement: "mixte",
    interconnexions: ["441", "443"],
  },
  {
    numero: "7411",
    libelle: "Subventions — Région",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Subventions collectivités",
    description: "Subventions de fonctionnement de la Région",
    estSubvention: true, sourceFinancement: "collectivite",
    interconnexions: ["4411"],
    imputationRecettes: true,
  },
  {
    numero: "7412",
    libelle: "Subventions — Département",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Subventions collectivités",
    description: "Subventions de fonctionnement du Département",
    estSubvention: true, sourceFinancement: "collectivite",
    interconnexions: ["4412"],
    imputationRecettes: true,
  },
  {
    numero: "7413",
    libelle: "Subventions — Communes et EPCI",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Subventions collectivités",
    description: "Subventions de fonctionnement communales et intercommunales",
    estSubvention: true, sourceFinancement: "collectivite",
    imputationRecettes: true,
  },
  {
    numero: "744",
    libelle: "Subventions — État",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Subventions État",
    description: "Subventions de fonctionnement de l'État",
    estSubvention: true, sourceFinancement: "etat",
    interconnexions: ["443"],
    imputationRecettes: true,
  },
  {
    numero: "78",
    libelle: "Reprises sur amortissements et provisions",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Reprises",
    description: "Reprises sur provisions et dépréciations",
    interconnexions: ["15", "28", "491"],
  },
  {
    numero: "781",
    libelle: "Reprises sur amortissements, dépréciations et provisions — Produits d'exploitation",
    classe: 7, sensNormal: "crediteur", categorie: "gestion", sousCategorie: "Reprises",
    description: "Reprises d'exploitation",
    interconnexions: ["491", "15"],
  },
];

// ─── Helpers d'analyse ───

export type SensAnomalie = "normal" | "attention" | "critique";

export interface AnalyseCompte {
  compte: CompteM96;
  soldeReel: number;
  sensReel: "debiteur" | "crediteur" | "nul";
  anomalie: SensAnomalie;
  messageAnomalie?: string;
  interconnexions: CompteM96[];
}

/**
 * Détecte si un solde est dans le sens normal ou anormal
 */
export function detecterAnomalie(compte: CompteM96, solde: number): { anomalie: SensAnomalie; message?: string } {
  if (solde === 0) return { anomalie: "normal" };
  
  const sensReel = solde > 0 ? "debiteur" : "crediteur";
  
  if (sensReel !== compte.sensNormal) {
    // Quelques exceptions connues
    if (compte.numero === "603") return { anomalie: "normal" }; // Variation stocks peut être dans les 2 sens
    if (compte.numero === "119") return { anomalie: solde > 50000 ? "critique" : "attention", message: "Déficit reporté important" };
    
    return {
      anomalie: Math.abs(solde) > 10000 ? "critique" : "attention",
      message: compte.alerteSoldeAnormal || `Solde ${sensReel} anormal pour le compte ${compte.numero} — attendu ${compte.sensNormal}`,
    };
  }
  return { anomalie: "normal" };
}

/**
 * Trouve un compte M9-6 par numéro (correspondance au plus long préfixe)
 */
export function trouverCompte(numero: string): CompteM96 | undefined {
  const cleaned = numero.replace(/\s/g, "").replace(/0+$/, ""); // enlever les zéros terminaux
  // Chercher la correspondance la plus longue
  let best: CompteM96 | undefined;
  for (const c of NOMENCLATURE_M96) {
    if (numero.startsWith(c.numero) || cleaned.startsWith(c.numero)) {
      if (!best || c.numero.length > best.numero.length) {
        best = c;
      }
    }
  }
  return best;
}

/**
 * Trouve les interconnexions d'un compte
 */
export function trouverInterconnexions(compte: CompteM96): CompteM96[] {
  if (!compte.interconnexions) return [];
  return compte.interconnexions
    .map(num => NOMENCLATURE_M96.find(c => c.numero === num))
    .filter(Boolean) as CompteM96[];
}

/**
 * Classifie les comptes par source de financement
 */
export function classifierParSource(comptes: { numero: string; solde: number }[]): Record<string, number> {
  const result: Record<string, number> = {
    etat: 0, collectivite: 0, familles: 0, propre: 0, mixte: 0, inconnu: 0,
  };
  for (const c of comptes) {
    const ref = trouverCompte(c.numero);
    const src = ref?.sourceFinancement || "inconnu";
    result[src] += Math.abs(c.solde);
  }
  return result;
}

/**
 * Retourne les comptes liés aux subventions
 */
export function comptesSubventions(): CompteM96[] {
  return NOMENCLATURE_M96.filter(c => c.estSubvention);
}

/**
 * Retourne les comptes d'imputation des recettes
 */
export function comptesImputationRecettes(): CompteM96[] {
  return NOMENCLATURE_M96.filter(c => c.imputationRecettes);
}
