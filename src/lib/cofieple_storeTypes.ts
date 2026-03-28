// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Types additionnels pour le Store et les composants UI
// Complète cofieple_types.ts avec les interfaces spécifiques à l'UI
// Conformité : M9-6 2026, Décret 2012-1246 (RGCP)
// ═══════════════════════════════════════════════════════════════════

import type { ResultatsM96, VerificationM96, CompteBalance, ServiceData, LigneSDE, LigneSDR, LigneBalance } from './cofieple_types';

// ── Types de budget ──────────────────────────────────────────────────
export type TypeBudget = 'principal' | 'annexe_greta' | 'annexe_cfa' | 'annexe_autre';

export interface BudgetConfig {
  type: TypeBudget;
  libelle: string;
}

// ── Données importées par fichier ───────────────────────────────────
export interface ImportedFileData {
  fileName: string;
  rowCount: number;
  importedAt: string;         // ISO date
}

// ── Profil Budget (persisté séparément) ─────────────────────────────
export interface BudgetProfile {
  id: string;                 // uuid
  nom: string;                // ex : "Lycée Charles Coeffin — Budget Principal"
  type: TypeBudget;
  uai?: string;
  exercice: string;           // "2024"
  fichiers: {
    depensesN: ImportedFileData | null;
    depensesN1: ImportedFileData | null;
    recettesN: ImportedFileData | null;
    recettesN1: ImportedFileData | null;
    balanceN: ImportedFileData | null;
    balanceN1: ImportedFileData | null;
  };
  compte185Solde?: number;    // pour la vérification croisée
  createdAt: string;          // ISO date
  updatedAt: string;          // ISO date
}

// ── Établissement étendu pour l'UI ──────────────────────────────────
export interface EtablissementUI {
  uai: string;
  nom: string;
  type: string;
  adresse: string;
  codePostal: string;
  commune: string;
  academie: string;
  regionAcademique: string;
  departement?: string;
  telephone?: string;
  ordonnateur: string;
  agentComptable: string;
  secretaireGeneral?: string;
  nomAgenceComptable?: string;
  exercice: number;
  dateArrete: string;
  tmcapSeuilAlerte?: number; // Seuil configurable (%) pour distinguer clôture normale vs retard fournisseurs
}

// ── Résultats enrichis pour l'UI ────────────────────────────────────
// Adapte ResultatsM96 avec des noms plus explicites pour les composants
export interface ResultatsUI extends ResultatsM96 {
  // Alias pour les composants
  totalChargesReel: number;
  totalProduitsReel: number;
  plusMoinsValues: number;        // Plus ou moins-values de recettes vs prévisions
  reliquatsCharges: number;      // Crédits non consommés (charges)
  tresorerieNette: number;       // Solde net classe 5
  varFdrDepuisCaf: number;       // Variation FDR à partir de la CAF/IAF
  varBfrComptable: number;       // Variation BFR soustractive
  totalFluxTresorerie: number;   // Flux nets de trésorerie
  parService: Record<string, ServiceDataUI>;
  indicateursBA?: IndicateursBA;
  // Analyse prédictive (dépassement REPROFI)
  scoreRisque?: number;          // 0-100, score de risque global
  niveauRisque?: 'faible' | 'modéré' | 'élevé' | 'critique';
}

export interface ServiceDataUI extends ServiceData {
  tauxExecution: number;
  plusMoinsValues: number;       // Plus ou moins-values de recettes
}

export interface IndicateursBA {
  soldeComptes185: number;       // Solde net des comptes de liaison 185
  comptes185Dbt: number;
  comptes185Crd: number;
  fluxInternesElimines: number;  // Montant des flux internes neutralisés
  // GRETA spécifique
  chiffreAffairesFc?: number;    // Chiffre d'affaires formation continue
  chargesPersonnelFc?: number;
  chargesDirectesFc?: number;
  subventionsPubliquesFc?: number;
  excedentBrut?: number;
  margeBrute?: number;
  tauxCouvertureChargesFc?: number;
}

// ── Check-list pour l'UI ────────────────────────────────────────────
export interface CheckItem {
  id: string;
  titre: string;
  regleM96: string;              // Référence réglementaire (M9-6, RGCP)
  variable1Label: string;
  variable1: number;
  variable2Label: string;
  variable2: number;
  ecart: number;
  statut: 'ok' | 'warn' | 'erreur' | 'bloquant';
  bloquant: boolean;
  piste: string;                 // Piste de correction
}

// ── Anomalie balance pour l'UI ──────────────────────────────────────
export interface AnomalieBalance {
  compte: string;
  intitule: string;
  classe: string;
  sensAttendu: string;           // Sens normal du solde (M9-6 Plan comptable)
  solDbt: number;
  solCrd: number;
  anomalie: boolean;
  gravite: 'normal' | 'anomalie' | 'bloquant';
  conseqM96: string;             // Conséquence réglementaire
}

// ── État global COFIEPLE ────────────────────────────────────────────
export interface CofiepleState {
  etablissement: EtablissementUI;
  budgets: BudgetConfig[];
  sde: Record<TypeBudget, any[]>;
  sde1: Record<TypeBudget, any[]>;
  sdr: Record<TypeBudget, any[]>;
  sdr1: Record<TypeBudget, any[]>;
  balance: Record<TypeBudget, any[]>;
  balance1: Record<TypeBudget, any[]>;
  fichierCharge: Record<string, boolean>;
  resultats: Record<TypeBudget, ResultatsUI | null>;
  resultatsConsolides: ResultatsUI | null;
  checkItems: CheckItem[];
  anomaliesBalance: AnomalieBalance[];
  activeTab: string;
  activeBudget: TypeBudget;
  uaiLoading: boolean;
  uaiError: string | null;
  analysisRunning: boolean;
}
