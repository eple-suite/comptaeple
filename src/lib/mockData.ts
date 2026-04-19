export const mockIndicators = {
  fdr: 245832,
  bfr: 78450,
  tresorerie: 167382,
  joursFonctionnement: 42,
  tauxRecouvrement: 94.2,
  resultatExercice: 15230,
  poidsCharges: 78.5,
  poidsSRH: 62.3,
};

// Données pour le calcul de la trésorerie propre (autonomie financière)
export const mockDettes = {
  subventions: 45000,         // Subventions reçues non consommées
  reliquatsSubventions: 12300, // Reliquats de subventions
  avancesEleves: 18500,        // Avances des élèves
  avancesCommensaux: 4200,     // Avances des commensaux
};

// Éléments de fragilité du FDR — à soustraire pour obtenir le FDR mobilisable
export const mockFragiliteFDR = {
  stocks: 33000,               // Classe 3 — Stocks
  creancesAnciennes: 8200,     // Créances > 1 an (hors 416)
  compte416: 3200,             // Compte 416000 — Créances douteuses
};

export const mockTresoreriePropreData = {
  tresorerieBrute: 167382,
  totalDettes: 45000 + 12300 + 18500 + 4200, // 80000
  tresoreriePropre: 167382 - (45000 + 12300 + 18500 + 4200), // 87382
};

// Données pour le prélèvement sur FDR (modèle Marseille)
export const mockPrelevementFDR = {
  fdrAvantPrelevement: 245832,
  montantPrelevement: 35000,
  prelevementsAutorises: 15000, // Prélèvements déjà autorisés dans l'exercice
  fdrApresPrelevement: 245832 - 35000,
  // Répartition avant prélèvement
  repartitionAvant: [
    { name: "FDR mobilisable", value: 245832, fill: "hsl(215, 70%, 45%)" },
    { name: "BFR", value: 78450, fill: "hsl(38, 92%, 50%)" },
  ],
  // Répartition après prélèvement
  repartitionApres: [
    { name: "FDR résiduel", value: 245832 - 35000, fill: "hsl(160, 45%, 45%)" },
    { name: "Prélèvement demandé", value: 35000, fill: "hsl(0, 70%, 55%)" },
    { name: "BFR", value: 78450, fill: "hsl(38, 92%, 50%)" },
  ],
  // Jours de fonctionnement après prélèvement
  joursFonctionnementApres: 36,
};

export const mockEvolutionData = [
  { year: "2019", fdr: 210000, bfr: 65000, tresorerie: 145000 },
  { year: "2020", fdr: 198000, bfr: 72000, tresorerie: 126000 },
  { year: "2021", fdr: 225000, bfr: 68000, tresorerie: 157000 },
  { year: "2022", fdr: 238000, bfr: 75000, tresorerie: 163000 },
  { year: "2023", fdr: 245832, bfr: 78450, tresorerie: 167382 },
];

export const mockBalanceData = [
  { classe: "Classe 1", label: "Comptes de capitaux", debit: 0, credit: 1250000, solde: -1250000 },
  { classe: "Classe 2", label: "Immobilisations", debit: 850000, credit: 120000, solde: 730000 },
  { classe: "Classe 3", label: "Stocks", debit: 45000, credit: 12000, solde: 33000 },
  { classe: "Classe 4", label: "Comptes de tiers", debit: 320000, credit: 285000, solde: 35000 },
  { classe: "Classe 5", label: "Comptes financiers", debit: 580000, credit: 412618, solde: 167382 },
  { classe: "Classe 6", label: "Charges", debit: 1850000, credit: 25000, solde: 1825000 },
  { classe: "Classe 7", label: "Produits", debit: 15000, credit: 1855230, solde: -1840230 },
];

export const mockTresorerieDetail = [
  { compte: "515100", label: "Dépôt au Trésor", montant: 158420 },
  { compte: "531000", label: "Caisse", montant: 2350 },
  { compte: "511000", label: "Valeurs à encaisser", montant: 6612 },
];

export const mockCreancesData = [
  { type: "Usagers (411)", montant: 12500, anciennete: "< 1 an" },
  { type: "Douteuses (416)", montant: 3200, anciennete: "> 1 an" },
  { type: "Subventions (441)", montant: 45000, anciennete: "< 6 mois" },
  { type: "Bourses (443110)", montant: 8700, anciennete: "< 3 mois" },
];

export const mockRepartitionCharges = [
  { name: "Personnel", value: 62.3, fill: "hsl(215, 70%, 45%)" },
  { name: "Fonctionnement", value: 18.2, fill: "hsl(160, 45%, 45%)" },
  { name: "Restauration", value: 12.5, fill: "hsl(38, 92%, 50%)" },
  { name: "Investissement", value: 7.0, fill: "hsl(215, 25%, 60%)" },
];

// ─── Données supplémentaires — Bilan de santé financière ───

// Confrontation subventions (sous condition d'emploi)
export const mockConfrontationSubventions = [
  { convention: "Bourse nationale", recettes: 315000, depenses: 312000, solde: 3000, statut: "ok" },
  { convention: "Subvention Région fonct.", recettes: 165230, depenses: 158000, solde: 7230, statut: "ok" },
  { convention: "Subvention Région invest.", recettes: 42000, depenses: 42000, solde: 0, statut: "ok" },
  { convention: "Taxe d'apprentissage", recettes: 18500, depenses: 16200, solde: 2300, statut: "ok" },
  { convention: "Subvention État (PRM)", recettes: 8700, depenses: 9100, solde: -400, statut: "attention" },
  { convention: "Convention partenariat", recettes: 5000, depenses: 3200, solde: 1800, statut: "ok" },
];

// Reste à recouvrer (RAR)
export const mockRAR = [
  { nature: "Familles (411)", montant: 12500, exercice: "N", anciennete: "< 6 mois" },
  { nature: "Familles (411)", montant: 3800, exercice: "N-1", anciennete: "6-12 mois" },
  { nature: "Familles (411)", montant: 1200, exercice: "N-2", anciennete: "> 12 mois" },
  { nature: "Collectivités (441)", montant: 45000, exercice: "N", anciennete: "< 3 mois" },
  { nature: "État / bourses (443)", montant: 8700, exercice: "N", anciennete: "< 3 mois" },
  { nature: "Créances douteuses (416)", montant: 3200, exercice: "N-2", anciennete: "> 12 mois" },
];

// Provisions
export const mockProvisions = [
  { compte: "151800", libelle: "Provisions pour risques", montantDebut: 5200, dotation: 2000, reprise: 0, montantFin: 7200 },
  { compte: "158100", libelle: "Provisions pour charges (litiges)", montantDebut: 3500, dotation: 0, reprise: 3500, montantFin: 0 },
  { compte: "491000", libelle: "Dépréciation créances douteuses", montantDebut: 2800, dotation: 1500, reprise: 800, montantFin: 3500 },
];

// Charges à payer / Produits à recevoir
export const mockChargesAPayer = [
  { compte: "408100", libelle: "Fournisseurs — Factures non parvenues", montant: 12300 },
  { compte: "428600", libelle: "Personnel — Charges à payer", montant: 4500 },
  { compte: "438600", libelle: "Organismes sociaux — Charges à payer", montant: 2100 },
  { compte: "448600", libelle: "État — Charges à payer", montant: 1800 },
];

export const mockProduitsARecevoir = [
  { compte: "418700", libelle: "Clients — Produits non encore facturés", montant: 8200 },
  { compte: "448700", libelle: "État — Produits à recevoir", montant: 5100 },
  { compte: "441870", libelle: "Collectivités — Produits à recevoir", montant: 3800 },
];

// Coût repas SRH détaillé
export const mockCoutRepasSRH = {
  nbRepasEleves: 142000,
  nbRepasCommensaux: 18500,
  nbRepasTotal: 160500,
  chargesAlimentaires: 375000,
  chargesPersonnel: 280000,
  chargesFluides: 42000,
  chargesEntretien: 15000,
  totalChargesSRH: 712000,
  recettesSRH: 842000,
  coutDenreeParRepas: 2.34,
  coutCompletParRepas: 4.44,
  prixMoyenFacture: 5.25,
  margeBrute: 842000 - 712000,
};

// Délais moyens de paiement / recouvrement
export const mockDelais = {
  delaiPaiementFournisseurs: 22, // jours
  delaiRecouvrementCreances: 35, // jours
  delaiPaiementN1: 28,
  delaiRecouvrementN1: 42,
};

// Capacité d'investissement
export const mockCapaciteInvestissement = {
  cafNette: 22230,
  remboursementEmprunts: 0,
  capaciteInvestissement: 22230,
  investissementsRealises: 183000,
  investissementsFinancesSubventions: 162000,
  investissementsAutofinances: 21000,
};

// Ratios de solvabilité
export const mockSolvabilite = {
  capitauxPropres: 1250000,
  totalDettesLT: 0,
  totalBilan: 2845000,
  ratioEndettement: 0,
  ratioSolvabiliteGenerale: 1250000 / 2845000 * 100,
};

// Analyse comptes de tiers
export const mockComptesTiers = [
  { compte: "411", libelle: "Familles", debit: 320000, credit: 307500, solde: 12500 },
  { compte: "416", libelle: "Créances douteuses", debit: 3200, credit: 0, solde: 3200 },
  { compte: "401", libelle: "Fournisseurs", debit: 1780000, credit: 1792300, solde: -12300 },
  { compte: "421", libelle: "Personnel", debit: 712000, credit: 716500, solde: -4500 },
  { compte: "441", libelle: "Collectivités", debit: 15000, credit: 60000, solde: -45000 },
  { compte: "443", libelle: "État (bourses)", debit: 305000, credit: 313700, solde: -8700 },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value).replace(/[\u202F\u00A0]/g, ' ');

export const formatPercent = (value: number) => `${value.toFixed(1)} %`;
