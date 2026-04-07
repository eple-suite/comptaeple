/**
 * Store des seuils intelligents HYPER@LE
 * Mode automatique : calcule les seuils à partir de la moyenne des 3 dernières années.
 * Mode manuel : seuils personnalisés par l'utilisateur.
 */
import { create } from 'zustand';
import type { HyperaleEtablissement } from './useHyperaleStore';

export interface SeuilIndicateur {
  satisfaisant: number;
  critique: number;
}

export interface HyperaleSeuils {
  fdr: SeuilIndicateur;
  tresorerie: SeuilIndicateur;
  caf: SeuilIndicateur;
  reserves: SeuilIndicateur;
}

export type IndicateurSeuilKey = keyof HyperaleSeuils;

const DEFAULTS: HyperaleSeuils = {
  fdr: { satisfaisant: 120000, critique: 60000 },
  tresorerie: { satisfaisant: 80000, critique: 40000 },
  caf: { satisfaisant: 70000, critique: 35000 },
  reserves: { satisfaisant: 100000, critique: 50000 },
};

interface SeuilsState {
  automatique: boolean;
  seuilsManuels: HyperaleSeuils;
  setAutomatique: (v: boolean) => void;
  setSeuilManuel: (indicateur: IndicateurSeuilKey, type: 'satisfaisant' | 'critique', value: number) => void;
  getSeuils: (etab: HyperaleEtablissement | null) => HyperaleSeuils;
  getDefaults: () => HyperaleSeuils;
}

/**
 * Calcule les seuils automatiques à partir des 3 dernières années disponibles.
 * satisfaisant = moyenne * 0.9, critique = moyenne * 0.5
 */
function computeAutoSeuils(etab: HyperaleEtablissement | null): HyperaleSeuils {
  if (!etab) return DEFAULTS;

  const annees = Object.keys(etab.donnees).map(Number).sort((a, b) => b - a).slice(0, 3);
  if (annees.length === 0) return DEFAULTS;

  const moyennes = { fdr: 0, caf: 0, tresorerie: 0, reserves: 0 };
  for (const a of annees) {
    const d = etab.donnees[a];
    if (!d) continue;
    moyennes.fdr += d.fdr;
    moyennes.caf += d.caf;
    moyennes.tresorerie += d.tresorerie;
    moyennes.reserves += d.reserves;
  }
  const n = annees.length;
  moyennes.fdr /= n;
  moyennes.caf /= n;
  moyennes.tresorerie /= n;
  moyennes.reserves /= n;

  return {
    fdr: { satisfaisant: Math.round(moyennes.fdr * 0.9), critique: Math.round(moyennes.fdr * 0.5) },
    caf: { satisfaisant: Math.round(moyennes.caf * 0.9), critique: Math.round(moyennes.caf * 0.5) },
    tresorerie: { satisfaisant: Math.round(moyennes.tresorerie * 0.9), critique: Math.round(moyennes.tresorerie * 0.5) },
    reserves: { satisfaisant: Math.round(moyennes.reserves * 0.9), critique: Math.round(moyennes.reserves * 0.5) },
  };
}

export const useHyperaleSeuilsStore = create<SeuilsState>((set, get) => ({
  automatique: true,
  seuilsManuels: DEFAULTS,

  setAutomatique: (v) => set({ automatique: v }),

  setSeuilManuel: (indicateur, type, value) =>
    set(state => ({
      seuilsManuels: {
        ...state.seuilsManuels,
        [indicateur]: { ...state.seuilsManuels[indicateur], [type]: value },
      },
    })),

  getSeuils: (etab) => {
    const { automatique, seuilsManuels } = get();
    if (!automatique) return seuilsManuels;
    return computeAutoSeuils(etab);
  },

  getDefaults: () => DEFAULTS,
}));
