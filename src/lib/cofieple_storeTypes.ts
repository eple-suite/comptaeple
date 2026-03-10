// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Types additionnels pour le Store et les composants UI
// Complète cofieple_types.ts avec les interfaces spécifiques à l'UI
// ═══════════════════════════════════════════════════════════════════

import type { ResultatsM96, VerificationM96, CompteBalance, ServiceData } from './cofieple_types';

// ── Types de budget ──────────────────────────────────────────────────
export type TypeBudget = 'principal' | 'annexe_greta' | 'annexe_cfa' | 'annexe_autre';

export interface BudgetConfig {
  type: TypeBudget;
  libelle: string;
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
  nomAgenceComptable?: string;
  exercice: number;
  dateArrete: string;
}

// ── Résultats enrichis pour l'UI ────────────────────────────────────
// Adapte ResultatsM96 avec des noms plus explicites pour les composants
export interface ResultatsUI extends ResultatsM96 {
  // Alias pour les composants
  totalChargesReel: number;
  totalProduitsReel: number;
  plusMoinsValues: number;
  reliquatsCharges: number;
  tresorerieNette: number;
  varFdrDepuisCaf: number;
  varBfrComptable: number;
  totalFluxTresorerie: number;
  parService: Record<string, ServiceDataUI>;
  indicateursBA?: IndicateursBA;
}

export interface ServiceDataUI extends ServiceData {
  tauxExecution: number;
  plusMoinsValues: number;
}

export interface IndicateursBA {
  soldeComptes185: number;
  comptes185Dbt: number;
  comptes185Crd: number;
  fluxInternesElimines: number;
  // GRETA spécifique
  chiffreAffairesFc?: number;
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
  regleM96: string;
  variable1Label: string;
  variable1: number;
  variable2Label: string;
  variable2: number;
  ecart: number;
  statut: 'ok' | 'warn' | 'erreur' | 'bloquant';
  bloquant: boolean;
  piste: string;
}

// ── Anomalie balance pour l'UI ──────────────────────────────────────
export interface AnomalieBalance {
  compte: string;
  intitule: string;
  classe: string;
  sensAttendu: string;
  solDbt: number;
  solCrd: number;
  anomalie: boolean;
  gravite: 'normal' | 'anomalie' | 'bloquant';
  conseqM96: string;
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
