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
}

export interface LigneSDR {
  rne: string; exercice: number; service: string; domaine: string;
  activite: string; compte: string; budget: number; engage: number;
  aor: number; realise: number; encours: number; plusValues: number;
  extourne: string;
  budgetScope?: BudgetScope; codeAnnexe?: string;
}

export interface LigneBalance {
  compte: string; intituleReduit: string; type: string;
  antDbt: number; antCrd: number; dbt: number; crd: number;
  solDbt: number; solCrd: number;
  poste: string; classe: string; ssClasse: string; ssSsClasse: string;
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
  joursFdr: number;                    // FDR / (charges expl / 365)
  joursTresorerie: number;             // Trésorerie / (charges expl / 365)
  fdrPartEncaissee: number;            // Trésorerie libre dans le FDR
  fdrPartNonEncaissee: number;         // Créances dans le FDR
  fdrPctEncaissee: number;             // % encaissée
  fdrPctNonEncaissee: number;          // % non encaissée
  tmcap: number;                       // Taux moyen charges à payer (dettes fournisseurs / charges)
  tmnr: number;                        // Taux moyen non-recouvrement (créances impayées / recettes)
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
    autonomieFinanciere: number;      // Trésorerie libre
    depotsCautions: number;           // Compte 165/275
    reglementsEnAttente: number;      // Comptes 511/5117
    avancesRecues: number;            // Avances familles/tiers
    reliquatsSubventions: number;     // Reliquats sub non consommées
    tresorerieSpecifique: number;     // Trésorerie fléchée
  };
  fdrMobilisable: number;             // FDR - stocks - créances anciennes - 416
  resultatN1: number;                 // Résultat N-1 (comptes 120/129)
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
