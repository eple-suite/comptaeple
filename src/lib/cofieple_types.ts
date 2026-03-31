// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Types M9-6 2026 + Budgets Annexes (GRETA/CFA/SRH)
// ═══════════════════════════════════════════════════════════════════

export interface Etablissement {
  uai: string;
  nom: string;
  type: 'lycee' | 'lycee_pro' | 'college' | 'legt' | 'erea' | 'autre';
  adresse: string;
  codePostal: string;
  commune: string;
  academie: string;
  region: string;
  departement: string;
  telephone?: string;
  ordonnateur: string;
  agentComptable: string;
  exercice: number;
  dateArrete: string;
  budgetsAnnexes: BudgetAnnexeConfig[];
}

export interface BudgetAnnexeConfig {
  id: string;
  type: 'GRETA' | 'CFA' | 'SRH' | 'INTERNAT' | 'AUTRE';
  libelle: string;
  actif: boolean;
  description: string;
  baseReglementaire: string;
}

export type BudgetScope = 'principal' | 'annexe';

export interface LigneSDE {
  rne: string; exercice: number; service: string; domaine: string;
  activite: string; compte: string; budget: number; engage: number;
  realise: number; encours: number; disponible: number; ext: string;
  budgetScope?: BudgetScope; codeAnnexe?: string;
  aggregationLevel?: import('./opaleExecutionHierarchy').AggregationLevel;
  serviceCode?: string; rawLabel?: string; isSummary?: boolean;
}

export interface LigneSDR {
  rne: string; exercice: number; service: string; domaine: string;
  activite: string; compte: string; budget: number; engage: number;
  aor: number; realise: number; encours: number; plusValues: number;
  extourne: string;
  budgetScope?: BudgetScope; codeAnnexe?: string;
  aggregationLevel?: import('./opaleExecutionHierarchy').AggregationLevel;
  serviceCode?: string; rawLabel?: string; isSummary?: boolean;
}

export interface LigneBalance {
  compte: string; intituleReduit: string; type: string;
  antDbt: number; antCrd: number; dbt: number; crd: number;
  solDbt: number; solCrd: number;
  poste: string; classe: string; ssClasse: string; ssSsClasse: string;
  aggregateClass?: string;
  isAggregate?: boolean;
  etablissement?: string;
  budgetScope?: BudgetScope; codeAnnexe?: string;
}

export interface DonneesImportees {
  sde: LigneSDE[]; sde1: LigneSDE[];
  sdr: LigneSDR[]; sdr1: LigneSDR[];
  bal: LigneBalance[];
  loaded: Record<string, boolean>;
}

export interface ServiceData {
  libelle: string; chargesPrev: number; chargesReel: number;
  reliquats: number; tauxExecCharges: number; produitsPrev: number;
  produitsReel: number; plusValues: number; tauxExecProduits: number;
  solde: number;
}

export interface PrelevementsReserves {
  totalPrelevements: number;         // Total mvt débiteurs sur 106*
  prelevementsInvestissement: number; // Part allant à la section d'investissement (classe 2)
  prelevementsFonctionnement: number; // Part pour fonctionnement exceptionnel
  detailParCompte: { compte: string; intitule: string; montant: number }[];
  variationReserves: number;         // Solde N - Solde N-1 (négatif = diminution)
  ecartFrngVsPrelevements: number;   // Écart cohérence : varFDR vs prélèvements
  coherent: boolean;                 // true si écart < seuil
}

export interface DomaineData {
  code: string; libelle: string;
  chargesPrev: number; chargesReel: number; reliquats: number; tauxExecCharges: number;
  produitsPrev: number; produitsReel: number; plusValues: number; tauxExecProduits: number;
  solde: number;
  // N-1
  chargesReelN1: number; produitsReelN1: number;
  variationCharges: number; variationProduits: number;
  pctVariationCharges: number; pctVariationProduits: number;
}

export interface OperationsOrdre {
  dotationsAmort: number;       // 68 → charges non décaissables
  reprisesAmort: number;        // 78 → produits non encaissables
  vncCessions: number;          // 675 → VNC cessions
  produitsCessions: number;     // 775/776/777 → produits de cessions
  neutralisationSubInv: number; // 139 → neutralisation subventions
  totalChargesOO: number;
  totalProduitsOO: number;
  soldeOO: number;
}

export interface ResultatsM96 {
  resultatBudgetaire: number; resultatComptable: number;
  excedent: number; deficit: number;
  cafBudgetaire: number; cafComptable: number;
  chargesNonDecaissables: number; produitsNonEncaissables: number;
  fdrHaut: number; fdrBas: number; fdrComptable: number;
  varFdrHaut: number; varFdrBas: number; varFdrCaf: number;
  varFdrTableauFinancement: number; structurationFdr: number;
  bfr: number; varBfrSynthetique: number; varBfrSoustractive: number;
  varBfrTableauFinancement: number;
  tresorerie: number; varTresorerieComptable: number;
  varTresorerieTableauFinancement: number;
  structurationTresorerie: number; fluxNetsTresorerie: number;
  totalChargesSde: number; totalChargesPrev: number;
  totalProduitsSdr: number; totalProduitsPrev: number;
  totalChargesBalance: number; totalProduitsBalance: number;
  chargesFonctionnement: number;  // Charges fonct. hors investissement (SDE ou balance Cl.6)
  drfn: number;                   // Dépenses Réelles de Fonctionnement Nettes (hors amort 681xxx)
  totalChargesRef: number;        // Dénominateur de référence charges (SDE ou balance)
  totalProduitsRef: number;       // Dénominateur de référence produits (SDR ou balance)
  reserves: number; reservesSsSpeciaux: number; reservesSRH: number;
  totalImmo: number; totalAmortissements: number; valeurNette: number;
  services: Record<string, ServiceData>;
  chargesNature: Record<string, number>;
  produitsOrigine: Record<string, number>;
  ressourcesPropres: number; recettesAutogenerees: number;
  tauxExecCharges: number; tauxExecProduits: number;
  joursAutonomie: number; ratioFdrBfr: number;
  prelevementsReserves: PrelevementsReserves;
  // REPROFI indicators
  joursFdr: number;
  joursTresorerie: number;
  fdrPartEncaissee: number;
  fdrPartNonEncaissee: number;
  fdrPctEncaissee: number;
  fdrPctNonEncaissee: number;
  tmcap: number;
  tmnr: number;
  creancesEtat: number;
  creancesCollectivite: number;
  creancesFamilles: number;
  creancesAutres: number;
  totalCreances: number;
  dettesFournisseurs: number;
  dettesEtat: number;
  dettesCollectivite: number;
  dettesAutres: number;
  totalDettes: number;
  reliquatsSubventions: number;
  patrimoineOriginesFondsPropres: number;
  patrimoineOriginesSubventions: number;
  patrimoineOriginesPctFP: number;
  patrimoineOriginesPctSub: number;
  variationPatrimoine: number;
  tresoComposition: {
    autonomieFinanciere: number;
    depotsCautions: number;
    reglementsEnAttente: number;
    avancesRecues: number;
    reliquatsSubventions: number;
    tresorerieSpecifique: number;
  };
  fdrMobilisable: number;
  resultatN1: number;
  // Domaines D1-D9
  domaines: Record<string, DomaineData>;
  // Opérations d'ordre
  operationsOrdre: OperationsOrdre;
  // DGP / DGR
  dgpJours: number;  // Délai global de paiement
  dgrJours: number;  // Délai global de recouvrement
  // Ratios M9-6
  ratioLiquiditeGenerale: number;
  ratioLiquiditeReduite: number;
  ratioLiquiditeImmediate: number;
  ratioAutonomieFinanciere: number;
  ratioSolvabilite: number;
  ratioEndettement: number;
  ratioChargesPersonnel: number;
  ratioInvestissement: number;
  ratioRecettesPropres: number;
  ratioCouvertureCharges: number;
  // N-1 comparisons from imported data
  totalChargesSdeN1: number;
  totalProduitsSdrN1: number;
  resultatBudgetaireN1: number;
  fdrComptableN1: number;
  bfrN1: number;
  tresorerieN1: number;
  cafBudgetaireN1: number;
  reservesN1Solde: number;
}

export interface ResultatsBudgetAnnexe {
  id: string;
  type: BudgetAnnexeConfig['type'];
  libelle: string;
  resultatBA: number; cafBA: number;
  fdrBA: number; bfrBA: number; tresoBA: number;
  chargesBA: number; produitsBA: number;
  chargesPrevBA: number; produitsPrevBA: number;
  tauxExecChargesBA: number; tauxExecProduitsBA: number;
  avancesBPversBA: number;
  compte185BP: number; compte185BA: number; equilibreCompte185: boolean;
  qpFraisGeneraux: number; qpFraisGenerauxPrev: number;
  reversementsBA: number;
  servicesByBA: Record<string, ServiceData>;
  anomalies: AnomalieBA[];
}

export interface AnomalieBA {
  type: 'blocant' | 'anomalie' | 'attention';
  code: string;
  message: string;
  valeur?: number;
  piste?: string;
  ref?: string;
}

export type StatutVerification = 'ok' | 'warn' | 'err' | 'bloq';

export interface VerificationM96 {
  id: string; titre: string; ref: string;
  v1Label: string; v1: number;
  v2Label: string; v2: number;
  ecart: number; statut: StatutVerification;
  bloquant: boolean; piste: string;
}

export type SensNormal = 'debiteur' | 'crediteur' | 'nul' | 'mixte';

export interface CompteBalance {
  compte: string; intitule: string; classe: string;
  sensNormal: SensNormal; solDbt: number; solCrd: number;
  anomalie: boolean;
  typeAnomalie?: 'anormalement_debiteur' | 'anormalement_crediteur';
  commentaire?: string; budgetScope?: BudgetScope;
}

export type OngletId =
  | 'accueil' | 'import' | 'checklist' | 'superviseur'
  | 'synthese' | 'tableaux' | 'budget_annexe'
  | 'rapport_ordo' | 'rapport_ac' | 'diaporama';

export interface UAIRecord {
  identifiant_de_l_etablissement: string;
  nom_etablissement: string;
  type_etablissement: string;
  libelle_nature: string;
  adresse_1?: string; adresse_2?: string;
  code_postal: string; nom_commune: string;
  libelle_academie: string;
  libelle_region_academique?: string;
  libelle_region?: string;
  nom_departement?: string;
  libelle_departement?: string;
  telephone?: string;
}
