// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Store global (Zustand + Immer)
// Gestion d'état du module Compte Financier EPLE
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage, migrateLocalStorageToIDB } from '@/lib/idbStorage';
import { saveFullState, loadAllSnapshots, saveEstablishmentIdentity, loadEstablishmentIdentity } from '@/lib/cofiepleBackendSync';
import type { LigneSDE, LigneSDR, LigneBalance } from '@/lib/cofieple_types';
import type {
  CofiepleState, EtablissementUI, TypeBudget, BudgetConfig,
  ResultatsUI, CheckItem, AnomalieBalance, BudgetProfile, ImportedFileData,
} from '@/lib/cofieple_storeTypes';
import {
  calculerResultats, consolider, construireCheckList, analyserBalance,
} from '@/lib/cofieple_calculations';
import { loadSensNormalOverridesFromSupabase } from '@/lib/cofieple_sensNormalOverrides';

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
  ordonnateur: '', agentComptable: '', secretaireGeneral: '',
  exercice: new Date().getFullYear() - 1,
  dateArrete: '',
  tmcapSeuilAlerte: 15,
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

// ── Per-establishment data persistence ──────────────────────────────
const EST_DATA_PREFIX = 'cofieple_est_';
const ETAB_MANUAL_PREFIX = 'cofieple_etab_manual_';

interface EstablishmentSnapshot {
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
  activeBudget: TypeBudget;
}

function saveEstablishmentSnapshot(estId: string, state: EstablishmentSnapshot) {
  try {
    // Use IndexedDB for large payloads (async, fire-and-forget)
    idbStorage.setItem(`${EST_DATA_PREFIX}${estId}`, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save establishment data:', e);
  }
}

async function loadEstablishmentSnapshot(estId: string): Promise<EstablishmentSnapshot | null> {
  try {
    // Try IndexedDB first, then fallback to localStorage for migration
    const raw = await idbStorage.getItem(`${EST_DATA_PREFIX}${estId}`)
      ?? localStorage.getItem(`${EST_DATA_PREFIX}${estId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveManualEtablissement(estId: string, etablissement: EtablissementUI) {
  try {
    idbStorage.setItem(`${ETAB_MANUAL_PREFIX}${estId}`, JSON.stringify(etablissement));
  } catch (e) {
    console.warn('Failed to save manual establishment data:', e);
  }
}

async function loadManualEtablissement(estId: string): Promise<Partial<EtablissementUI> | null> {
  try {
    const raw = await idbStorage.getItem(`${ETAB_MANUAL_PREFIX}${estId}`)
      ?? localStorage.getItem(`${ETAB_MANUAL_PREFIX}${estId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractSnapshot(state: any): EstablishmentSnapshot {
  return {
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
  };
}

// ── Debounced backend sync ─────────────────────────────────────
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedBackendSync(state: any) {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
      if (!user || !state.etablissement?.uai) return;
      await saveFullState(user.id, state.etablissement.uai, state.etablissement.exercice, {
        budgets: state.budgets,
        sde: state.sde, sde1: state.sde1,
        sdr: state.sdr, sdr1: state.sdr1,
        balance: state.balance, balance1: state.balance1,
        fichierCharge: state.fichierCharge,
        resultats: state.resultats,
        checkItems: state.checkItems,
        anomaliesBalance: state.anomaliesBalance,
        etablissement: state.etablissement,
      });
      console.info('[Backend] Snapshot synced for', state.etablissement.uai);
    } catch (e) {
      console.warn('[Backend] Sync failed:', e);
    }
  }, 2000); // 2s debounce
}

type Store = CofiepleState & {
  currentEstablishmentId: string | null;
  switchEstablishment: (id: string) => Promise<void>;
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
  lastAnalysisAt: string | null;
  resetAll: () => void;
  syncFromBackend: () => Promise<void>;
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
      currentEstablishmentId: null,
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
      lastAnalysisAt: null,
      budgetProfiles: loadProfiles(),

      switchEstablishment: async (id) => {
        const current = get().currentEstablishmentId;
        if (current === id) {
          // Already on this establishment — just load identity from backend
          const identity = await loadEstablishmentIdentity(id);
          if (identity) {
            set(state => {
              if (identity.ordonnateur) state.etablissement.ordonnateur = identity.ordonnateur;
              if (identity.agent_comptable) state.etablissement.agentComptable = identity.agent_comptable;
              if (identity.secretaire_general) state.etablissement.secretaireGeneral = identity.secretaire_general;
            });
          }
          const manual = await loadManualEtablissement(id);
          if (manual) {
            set(state => {
              state.etablissement = { ...state.etablissement, ...manual };
            });
          }
          return;
        }

        // Save current establishment data before switching
        if (current) {
          saveEstablishmentSnapshot(current, extractSnapshot(get()));
        }

        // Try to restore saved data for the target establishment (IDB first)
        const [saved, manual, identity] = await Promise.all([
          loadEstablishmentSnapshot(id),
          loadManualEtablissement(id),
          loadEstablishmentIdentity(id),
        ]);

        if (saved) {
          set(state => {
            state.currentEstablishmentId = id;
            state.etablissement = manual
              ? { ...saved.etablissement, ...manual }
              : saved.etablissement;
            // Apply backend identity over local
            if (identity?.ordonnateur) state.etablissement.ordonnateur = identity.ordonnateur;
            if (identity?.agent_comptable) state.etablissement.agentComptable = identity.agent_comptable;
            if (identity?.secretaire_general) state.etablissement.secretaireGeneral = identity.secretaire_general;
            state.budgets = saved.budgets;
            state.sde = saved.sde;
            state.sde1 = saved.sde1;
            state.sdr = saved.sdr;
            state.sdr1 = saved.sdr1;
            state.balance = saved.balance;
            state.balance1 = saved.balance1;
            state.fichierCharge = saved.fichierCharge;
            state.resultats = saved.resultats;
            state.resultatsConsolides = saved.resultatsConsolides;
            state.checkItems = saved.checkItems;
            state.anomaliesBalance = saved.anomaliesBalance;
            state.activeBudget = saved.activeBudget;
          });
        } else {
          // No local data — set fresh state then try backend
          set(state => {
            state.currentEstablishmentId = id;
            state.etablissement = manual
              ? { ...ETAB_INITIAL, ...manual }
              : { ...ETAB_INITIAL };
            if (identity?.ordonnateur) state.etablissement.ordonnateur = identity.ordonnateur;
            if (identity?.agent_comptable) state.etablissement.agentComptable = identity.agent_comptable;
            if (identity?.secretaire_general) state.etablissement.secretaireGeneral = identity.secretaire_general;
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
            state.activeBudget = 'principal' as TypeBudget;
          });
          // Try to restore from backend (new device scenario)
          setTimeout(() => get().syncFromBackend(), 500);
        }

        // Charger les surcharges « sens normal » paramétrées par l'agent
        // comptable pour cet UAI, afin que le moteur M9-6 les applique
        // EN PRIORITÉ avant ses règles codées en dur.
        const uaiAfterLoad = get().etablissement?.uai;
        if (uaiAfterLoad) {
          loadSensNormalOverridesFromSupabase(uaiAfterLoad)
            .then((n) => {
              if (n > 0) console.log(`[COFIEPLE] ${n} surcharges sens_normal chargées pour ${uaiAfterLoad}`);
              // Re-déclenche l'analyse pour appliquer les overrides
              get().analyserBudget?.();
            })
            .catch((e) => console.warn('[COFIEPLE] sens_normal load failed', e));
        }
      },

      setEtablissement: (etab) => {
        set(state => { Object.assign(state.etablissement, etab); });
        const estId = get().currentEstablishmentId;
        if (estId) {
          const currentState = get();
          saveEstablishmentSnapshot(estId, extractSnapshot(currentState));
          saveManualEtablissement(estId, currentState.etablissement);
          // Sync identity fields to backend
          const identityFields: Record<string, string> = {};
          if (etab.ordonnateur !== undefined) identityFields.ordonnateur = etab.ordonnateur;
          if (etab.agentComptable !== undefined) identityFields.agent_comptable = etab.agentComptable;
          if (etab.secretaireGeneral !== undefined) identityFields.secretaire_general = etab.secretaireGeneral;
          if (Object.keys(identityFields).length > 0) {
            saveEstablishmentIdentity(estId, identityFields);
          }
        }
        debouncedBackendSync(get());
      },

      addBudgetAnnexe: (config) =>
        set(state => {
          const exists = state.budgets.find(b => b.type === config.type);
          if (!exists) state.budgets.push(config);
        }),

      removeBudgetAnnexe: (type) =>
        set(state => {
          state.budgets = state.budgets.filter(b => b.type !== type || b.type === 'principal');
        }),

      setSDE: (data, type) => {
        set(state => { state.sde[type] = data; state.fichierCharge[`sde_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setSDE1: (data, type) => {
        set(state => { state.sde1[type] = data; state.fichierCharge[`sde1_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setSDR: (data, type) => {
        set(state => { state.sdr[type] = data; state.fichierCharge[`sdr_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setSDR1: (data, type) => {
        set(state => { state.sdr1[type] = data; state.fichierCharge[`sdr1_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setBalance: (data, type) => {
        set(state => { state.balance[type] = data; state.fichierCharge[`bal_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setBalance1: (data, type) => {
        set(state => { state.balance1[type] = data; state.fichierCharge[`bal1_${type}`] = true; });
        const estId = get().currentEstablishmentId;
        if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
        debouncedBackendSync(get());
      },

      setFichierCharge: (key, val) =>
        set(state => { state.fichierCharge[key] = val; }),

      setActiveTab: (tab) => set(state => { state.activeTab = tab; }),
      setActiveBudget: (b) => set(state => { state.activeBudget = b; }),
      setUAILoading: (v) => set(state => { state.uaiLoading = v; }),
      setUAIError: (e) => set(state => { state.uaiError = e; }),
      setAnalysisRunning: (v) => set(state => { state.analysisRunning = v; }),

      lancerAnalyse: () => {
        set(state => { state.analysisRunning = true; });
        try {
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
              // Debug: log parsed totals to diagnose budget/realized mapping
              if (sde.length > 0) {
                const totalBudget = sde.reduce((s, r) => s + r.budget, 0);
                const totalRealise = sde.reduce((s, r) => s + r.realise, 0);
                console.log(`[COFIEPLE] SDE ${bt}: ${sde.length} lignes, budget=${totalBudget.toFixed(2)}, réalisé=${totalRealise.toFixed(2)}`);
                if (sde.length <= 3) {
                  console.log('[COFIEPLE] SDE sample:', JSON.stringify(sde.slice(0, 3)));
                } else {
                  console.log('[COFIEPLE] SDE colonnes premier enregistrement:', Object.keys(sde[0]));
                  console.log('[COFIEPLE] SDE sample[0]:', JSON.stringify(sde[0]));
                }
              }
              const result = calculerResultats(sde, sdr, bal, S.sde1[bt] || [], S.sdr1[bt] || [], S.balance1[bt] || [], bt);
              console.log(`[COFIEPLE] Résultat ${bt}: chargesPrev=${result.totalChargesPrev?.toFixed(2)}, chargesSde=${result.totalChargesSde?.toFixed(2)}, tauxExec=${(result.tauxExecCharges * 100).toFixed(1)}%`);
              newResultats[bt] = result;
            }
          }

          const bp = newResultats.principal;
          const annexes = [newResultats.annexe_greta, newResultats.annexe_cfa, newResultats.annexe_autre].filter(Boolean) as ResultatsUI[];
          const consolide = bp && annexes.length > 0 ? consolider(bp, annexes) : null;
          const activeBudget = S.activeBudget;
          const resultatsActifs = newResultats[activeBudget];
          const balanceActive = S.balance[activeBudget] || [];
          const sdeActive = S.sde[activeBudget] || [];
          const sdrActive = S.sdr[activeBudget] || [];
          const checkItems = resultatsActifs ? construireCheckList(resultatsActifs, activeBudget, balanceActive, sdeActive, sdrActive) : [];
          const anomaliesBalance = analyserBalance(balanceActive, {
            hasAnnexe: S.budgets.length > 1,
            uai: S.etablissement?.uai,
          });

          set(state => {
            state.resultats = newResultats;
            state.resultatsConsolides = consolide;
            state.checkItems = checkItems;
          state.anomaliesBalance = anomaliesBalance;
            state.lastAnalysisAt = new Date().toISOString();
          });

          // Auto-save after analysis
          const estId = get().currentEstablishmentId;
          if (estId) saveEstablishmentSnapshot(estId, extractSnapshot(get()));
          debouncedBackendSync(get());
        } catch (error) {
          console.error('[COFIEPLE] Erreur analyse budgetaire:', error);
        } finally {
          set(state => { state.analysisRunning = false; });
        }
      },

      // ── Budget Profiles (persistés sous 'cockpit_budget_profiles') ──
      createBudgetProfile: (nom, type, uai, exercice) => {
        const now = new Date().toISOString();
        const profile: BudgetProfile = {
          id: makeProfileId(),
          nom,
          type,
          uai,
          exercice: exercice ?? String(get().etablissement.exercice),
          fichiers: EMPTY_FICHIERS(),
          createdAt: now,
          updatedAt: now,
        };
        set(state => { state.budgetProfiles.push(profile); });
        saveProfiles(get().budgetProfiles);
        return profile;
      },

      updateBudgetProfile: (id, patch) => {
        set(state => {
          const idx = state.budgetProfiles.findIndex(p => p.id === id);
          if (idx >= 0) {
            Object.assign(state.budgetProfiles[idx], patch, { updatedAt: new Date().toISOString() });
          }
        });
        saveProfiles(get().budgetProfiles);
      },

      deleteBudgetProfile: (id) => {
        set(state => {
          state.budgetProfiles = state.budgetProfiles.filter(p => p.id !== id);
        });
        saveProfiles(get().budgetProfiles);
      },

      setBudgetProfileFichier: (profileId, fileKey, data) => {
        set(state => {
          const p = state.budgetProfiles.find(p => p.id === profileId);
          if (p) {
            p.fichiers[fileKey] = data;
            p.updatedAt = new Date().toISOString();
          }
        });
        saveProfiles(get().budgetProfiles);
      },

      setBudgetProfileCompte185: (profileId, solde) => {
        set(state => {
          const p = state.budgetProfiles.find(p => p.id === profileId);
          if (p) {
            p.compte185Solde = solde;
            p.updatedAt = new Date().toISOString();
          }
        });
        saveProfiles(get().budgetProfiles);
      },

      getBudgetProfile: (id) => get().budgetProfiles.find(p => p.id === id),

      getBudgetProfilesByType: (type) => get().budgetProfiles.filter(p => p.type === type),

      syncFromBackend: async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const state = get();
          const uai = state.etablissement?.uai;
          const exercice = state.etablissement?.exercice;
          if (!uai) return;

          // Load identity from establishments table
          const estId = state.currentEstablishmentId;
          if (estId) {
            const identity = await loadEstablishmentIdentity(estId);
            if (identity) {
              set(s => {
                if (identity.ordonnateur) s.etablissement.ordonnateur = identity.ordonnateur;
                if (identity.agent_comptable) s.etablissement.agentComptable = identity.agent_comptable;
                if (identity.secretaire_general) s.etablissement.secretaireGeneral = identity.secretaire_general;
              });
            }
          }

          // Load snapshots from backend
          const snapshots = await loadAllSnapshots(user.id, uai, exercice);
          const principal = snapshots.principal;
          if (principal) {
            set(s => {
              s.sde.principal = principal.sde || [];
              s.sde1.principal = principal.sde1 || [];
              s.sdr.principal = principal.sdr || [];
              s.sdr1.principal = principal.sdr1 || [];
              s.balance.principal = principal.balance || [];
              s.balance1.principal = principal.balance1 || [];
              Object.assign(s.fichierCharge, principal.fichierCharge || {});
              if (principal.resultats) s.resultats.principal = principal.resultats;
              if (principal.checkItems?.length) s.checkItems = principal.checkItems;
              if (principal.anomaliesBalance?.length) s.anomaliesBalance = principal.anomaliesBalance;
              if (principal.budgets?.length) s.budgets = principal.budgets;
            });
            console.info('[Backend] Restored principal snapshot for', uai);
          }
          // Restore annexes
          for (const bt of ['annexe_greta', 'annexe_cfa', 'annexe_autre'] as TypeBudget[]) {
            const snap = snapshots[bt];
            if (snap) {
              set(s => {
                s.sde[bt] = snap.sde || [];
                s.sde1[bt] = snap.sde1 || [];
                s.sdr[bt] = snap.sdr || [];
                s.sdr1[bt] = snap.sdr1 || [];
                s.balance[bt] = snap.balance || [];
                s.balance1[bt] = snap.balance1 || [];
                Object.assign(s.fichierCharge, snap.fichierCharge || {});
                if (snap.resultats) s.resultats[bt] = snap.resultats;
              });
              console.info('[Backend] Restored', bt, 'snapshot for', uai);
            }
          }
          const restoredState = get();
          const hasImportedData =
            Object.values(restoredState.sde).some(rows => rows.length > 0) ||
            Object.values(restoredState.sdr).some(rows => rows.length > 0) ||
            Object.values(restoredState.balance).some(rows => rows.length > 0);

          if (hasImportedData) {
            restoredState.lancerAnalyse();
          } else if (estId) {
            saveEstablishmentSnapshot(estId, extractSnapshot(restoredState));
          }
        } catch (e) {
          console.warn('[Backend] syncFromBackend failed:', e);
        }
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
          state.budgetProfiles = [];
          saveProfiles([]);
        }),
    })),
    {
      name: 'cofieple-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        currentEstablishmentId: state.currentEstablishmentId,
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
