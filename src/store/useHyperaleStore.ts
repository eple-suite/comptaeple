/**
 * Store HYPER@LE — données multi-établissements
 * Structure indépendante, compatible future API Op@le / import CSV.
 */
import { create } from 'zustand';

/* ─── Types ─── */

export interface HyperaleIndicateursAnnee {
  fdr: number;
  caf: number;
  tresorerie: number;
  reserves: number;
  /** Champs optionnels pour enrichissement futur */
  drfn?: number;
  resultatComptable?: number;
  tauxExecCharges?: number;
  tauxExecProduits?: number;
}

export interface HyperaleEtablissement {
  uai: string;
  nom: string;
  donnees: Record<number, HyperaleIndicateursAnnee>;
}

export interface HyperaleSelection {
  uai: string;
  annee: number;
}

export interface HyperaleCurrentData {
  etablissement: HyperaleEtablissement;
  annee: number;
  valeurs: HyperaleIndicateursAnnee;
  valeursPrecedentes: HyperaleIndicateursAnnee | null;
}

interface HyperaleDataState {
  etablissements: HyperaleEtablissement[];
  selection: HyperaleSelection;

  /** Actions */
  setSelection: (sel: Partial<HyperaleSelection>) => void;
  addEtablissement: (etab: HyperaleEtablissement) => void;
  updateDonnees: (uai: string, annee: number, data: Partial<HyperaleIndicateursAnnee>) => void;

  /** Getter */
  getCurrentData: () => HyperaleCurrentData | null;
  getAnneesDisponibles: () => number[];
}

/* ─── Données de démonstration réalistes ─── */

const DEMO_ETABLISSEMENTS: HyperaleEtablissement[] = [
  {
    uai: '0330089T',
    nom: 'Lycée Polyvalent Jean Monnet - Libourne',
    donnees: {
      2019: { fdr: 132000, caf: 74000, tresorerie: 85000, reserves: 115000 },
      2020: { fdr: 128000, caf: 68000, tresorerie: 79000, reserves: 112000 },
      2021: { fdr: 145000, caf: 82000, tresorerie: 95000, reserves: 120000 },
      2022: { fdr: 138000, caf: 79000, tresorerie: 88000, reserves: 118000 },
      2023: { fdr: 150000, caf: 86000, tresorerie: 102000, reserves: 130000 },
      2024: { fdr: 155000, caf: 89000, tresorerie: 108000, reserves: 135000 },
    },
  },
  {
    uai: '0801853E',
    nom: 'Lycée Polyvalent Jean Racine - Montdidier',
    donnees: {
      2019: { fdr: 105000, caf: 56000, tresorerie: 68000, reserves: 85000 },
      2020: { fdr: 100000, caf: 52000, tresorerie: 65000, reserves: 83000 },
      2021: { fdr: 110000, caf: 60000, tresorerie: 72000, reserves: 90000 },
      2022: { fdr: 98000, caf: 55000, tresorerie: 68000, reserves: 87000 },
      2023: { fdr: 105000, caf: 62000, tresorerie: 75000, reserves: 94000 },
      2024: { fdr: 112000, caf: 65000, tresorerie: 80000, reserves: 96000 },
    },
  },
  {
    uai: '9711181G',
    nom: 'Collège Bois Rada - Sainte Rose',
    donnees: {
      2019: { fdr: 58000, caf: 27000, tresorerie: 38000, reserves: 46000 },
      2020: { fdr: 55000, caf: 24000, tresorerie: 35000, reserves: 44000 },
      2021: { fdr: 65000, caf: 31000, tresorerie: 42000, reserves: 50000 },
      2022: { fdr: 70000, caf: 33000, tresorerie: 45000, reserves: 52000 },
      2023: { fdr: 68000, caf: 29000, tresorerie: 39000, reserves: 48000 },
      2024: { fdr: 62000, caf: 25000, tresorerie: 36000, reserves: 45000 },
    },
  },
];

const CURRENT_YEAR = new Date().getFullYear();

export const useHyperaleStore = create<HyperaleDataState>((set, get) => ({
  etablissements: DEMO_ETABLISSEMENTS,
  selection: { uai: '', annee: CURRENT_YEAR - 1 },

  setSelection: (sel) =>
    set(state => ({ selection: { ...state.selection, ...sel } })),

  addEtablissement: (etab) =>
    set(state => {
      const exists = state.etablissements.some(e => e.uai === etab.uai);
      if (exists) return state;
      return { etablissements: [...state.etablissements, etab] };
    }),

  updateDonnees: (uai, annee, data) =>
    set(state => ({
      etablissements: state.etablissements.map(e =>
        e.uai === uai
          ? { ...e, donnees: { ...e.donnees, [annee]: { ...(e.donnees[annee] || { fdr: 0, caf: 0, tresorerie: 0, reserves: 0 }), ...data } } }
          : e
      ),
    })),

  getCurrentData: () => {
    const { etablissements, selection } = get();
    if (!selection.uai) return null;
    const etab = etablissements.find(e => e.uai === selection.uai);
    if (!etab) return null;
    const valeurs = etab.donnees[selection.annee];
    if (!valeurs) return null;
    const valeursPrecedentes = etab.donnees[selection.annee - 1] || null;
    return { etablissement: etab, annee: selection.annee, valeurs, valeursPrecedentes };
  },

  getAnneesDisponibles: () => {
    const { etablissements, selection } = get();
    if (!selection.uai) {
      // Return full range
      return Array.from({ length: CURRENT_YEAR - 2019 + 1 }, (_, i) => CURRENT_YEAR - i);
    }
    const etab = etablissements.find(e => e.uai === selection.uai);
    if (!etab) return [];
    return Object.keys(etab.donnees).map(Number).sort((a, b) => b - a);
  },
}));
