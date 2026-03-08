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

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export const formatPercent = (value: number) => `${value.toFixed(1)} %`;
