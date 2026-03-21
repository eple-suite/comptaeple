// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Store global (Zustand + Immer)
// Gestion d'état du module Compte Financier EPLE
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LigneSDE, LigneSDR, LigneBalance } from '@/lib/cofieple_types';
import type {
  CofiepleState, EtablissementUI, TypeBudget, BudgetConfig,
  ResultatsUI, CheckItem, AnomalieBalance, BudgetProfile, ImportedFileData,
} from '@/lib/cofieple_storeTypes';
import {
  calculerResultats, consolider, construireCheckList, analyserBalance,
} from '@/lib/cofieple_calculations';

const BUDGETS_VIDES = () => ({
  principal: [] as any[],
  annexe_greta: [] as any[],
  annexe_cfa: [] as any[],
  annexe_autre: [] as any[],
});

const ETAB_INITIAL: EtablissementUI = {
  uai: '', nom: '', type: 'lycee',
  adresse: '', codePostal: '', commune: '',
  academie: '', regionAcademique: '', departement: '',
  ordonnateur: '', agentComptable: '',
  exercice: new Date().getFullYear() - 1,
  dateArrete: '',
};

// ── Helpers BudgetProfile ────────────────────────────────────────────
const PROFILES_KEY = 'cockpit_budget_profiles';

function loadProfiles(): BudgetProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProfiles(profiles: BudgetProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function makeProfileId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_FICHIERS = (): BudgetProfile['fichiers'] => ({
  depensesN: null, depensesN1: null,
  recettesN: null, recettesN1: null,
  balanceN: null, balanceN1: null,
});

type Store = CofiepleState & {
  setEtablissement: (etab: Partial<EtablissementUI>) => void;
  addBudgetAnnexe: (config: BudgetConfig) => void;
  removeBudgetAnnexe: (type: TypeBudget) => void;
  setSDE: (data: LigneSDE[], type: TypeBudget) => void;
  setSDE1: (data: LigneSDE[], type: TypeBudget) => void;
  setSDR: (data: LigneSDR[], type: TypeBudget) => void;
  setSDR1: (data: LigneSDR[], type: TypeBudget) => void;
  setBalance: (data: LigneBalance[], type: TypeBudget) => void;
  setBalance1: (data: LigneBalance[], type: TypeBudget) => void;
  setFichierCharge: (key: string, val: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveBudget: (b: TypeBudget) => void;
  setUAILoading: (v: boolean) => void;
  setUAIError: (e: string | null) => void;
  lancerAnalyse: () => void;
  setAnalysisRunning: (v: boolean) => void;
  resetAll: () => void;
  // ── Budget Profiles ─────────────────────────────────────────────
  budgetProfiles: BudgetProfile[];
  createBudgetProfile: (nom: string, type: TypeBudget, uai?: string, exercice?: string) => BudgetProfile;
  updateBudgetProfile: (id: string, patch: Partial<Omit<BudgetProfile, 'id' | 'createdAt'>>) => void;
  deleteBudgetProfile: (id: string) => void;
  setBudgetProfileFichier: (profileId: string, fileKey: keyof BudgetProfile['fichiers'], data: ImportedFileData) => void;
  setBudgetProfileCompte185: (profileId: string, solde: number) => void;
  getBudgetProfile: (id: string) => BudgetProfile | undefined;
  getBudgetProfilesByType: (type: TypeBudget) => BudgetProfile[];
};

export const useCofiepleStore = create<Store>()(
  persist(
    immer((set, get) => ({
      etablissement: ETAB_INITIAL,
      budgets: [{ type: 'principal' as TypeBudget, libelle: 'Budget principal' }],
      sde: BUDGETS_VIDES(),
      sde1: BUDGETS_VIDES(),
      sdr: BUDGETS_VIDES(),
      sdr1: BUDGETS_VIDES(),
      balance: BUDGETS_VIDES(),
      balance1: BUDGETS_VIDES(),
      fichierCharge: {},
      resultats: { principal: null, annexe_greta: null, annexe_cfa: null, annexe_autre: null },
      resultatsConsolides: null,
      checkItems: [],
      anomaliesBalance: [],
      activeTab: 'accueil',
      activeBudget: 'principal' as TypeBudget,
      uaiLoading: false,
      uaiError: null,
      analysisRunning: false,

      setEtablissement: (etab) =>
        set(state => { Object.assign(state.etablissement, etab); }),

      addBudgetAnnexe: (config) =>
        set(state => {
          const exists = state.budgets.find(b => b.type === config.type);
          if (!exists) state.budgets.push(config);
        }),

      removeBudgetAnnexe: (type) =>
        set(state => {
          state.budgets = state.budgets.filter(b => b.type !== type || b.type === 'principal');
        }),

      setSDE: (data, type) =>
        set(state => { state.sde[type] = data; state.fichierCharge[`sde_${type}`] = true; }),

      setSDE1: (data, type) =>
        set(state => { state.sde1[type] = data; state.fichierCharge[`sde1_${type}`] = true; }),

      setSDR: (data, type) =>
        set(state => { state.sdr[type] = data; state.fichierCharge[`sdr_${type}`] = true; }),

      setSDR1: (data, type) =>
        set(state => { state.sdr1[type] = data; state.fichierCharge[`sdr1_${type}`] = true; }),

      setBalance: (data, type) =>
        set(state => { state.balance[type] = data; state.fichierCharge[`bal_${type}`] = true; }),

      setBalance1: (data, type) =>
        set(state => { state.balance1[type] = data; state.fichierCharge[`bal1_${type}`] = true; }),

      setFichierCharge: (key, val) =>
        set(state => { state.fichierCharge[key] = val; }),

      setActiveTab: (tab) => set(state => { state.activeTab = tab; }),
      setActiveBudget: (b) => set(state => { state.activeBudget = b; }),
      setUAILoading: (v) => set(state => { state.uaiLoading = v; }),
      setUAIError: (e) => set(state => { state.uaiError = e; }),
      setAnalysisRunning: (v) => set(state => { state.analysisRunning = v; }),

      lancerAnalyse: () => {
        set(state => { state.analysisRunning = true; });
        const S = get();
        const newResultats: Record<TypeBudget, ResultatsUI | null> = {
          principal: null, annexe_greta: null, annexe_cfa: null, annexe_autre: null,
        };

        for (const budget of S.budgets) {
          const bt = budget.type;
          const sde = S.sde[bt] || [];
          const sdr = S.sdr[bt] || [];
          const bal = S.balance[bt] || [];
          if (sde.length > 0 || sdr.length > 0 || bal.length > 0) {
            newResultats[bt] = calculerResultats(sde, sdr, bal, S.sde1[bt] || [], S.sdr1[bt] || [], S.balance1[bt] || [], bt);
          }
        }

        const bp = newResultats.principal;
        const annexes = [newResultats.annexe_greta, newResultats.annexe_cfa, newResultats.annexe_autre].filter(Boolean) as ResultatsUI[];
        const consolide = bp && annexes.length > 0 ? consolider(bp, annexes) : null;
        const activeBudget = S.activeBudget;
        const resultatsActifs = newResultats[activeBudget];
        const balanceActive = S.balance[activeBudget] || [];
        const checkItems = resultatsActifs ? construireCheckList(resultatsActifs, activeBudget, balanceActive) : [];
        const anomaliesBalance = analyserBalance(balanceActive);

        set(state => {
          state.resultats = newResultats;
          state.resultatsConsolides = consolide;
          state.checkItems = checkItems;
          state.anomaliesBalance = anomaliesBalance;
          state.analysisRunning = false;
        });
      },

      resetAll: () =>
        set(state => {
          Object.assign(state.etablissement, ETAB_INITIAL);
          state.budgets = [{ type: 'principal' as TypeBudget, libelle: 'Budget principal' }];
          state.sde = BUDGETS_VIDES();
          state.sde1 = BUDGETS_VIDES();
          state.sdr = BUDGETS_VIDES();
          state.sdr1 = BUDGETS_VIDES();
          state.balance = BUDGETS_VIDES();
          state.balance1 = BUDGETS_VIDES();
          state.fichierCharge = {};
          state.resultats = { principal: null, annexe_greta: null, annexe_cfa: null, annexe_autre: null };
          state.resultatsConsolides = null;
          state.checkItems = [];
          state.anomaliesBalance = [];
          state.activeTab = 'accueil';
          state.uaiError = null;
        }),
    })),
    {
      name: 'cofieple-store',
      partialize: (state) => ({
        etablissement: state.etablissement,
        budgets: state.budgets,
        sde: state.sde,
        sde1: state.sde1,
        sdr: state.sdr,
        sdr1: state.sdr1,
        balance: state.balance,
        balance1: state.balance1,
        fichierCharge: state.fichierCharge,
        resultats: state.resultats,
        resultatsConsolides: state.resultatsConsolides,
        checkItems: state.checkItems,
        anomaliesBalance: state.anomaliesBalance,
        activeBudget: state.activeBudget,
      }),
    }
  )
);
