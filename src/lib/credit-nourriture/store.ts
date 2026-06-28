// Crédit nourriture — persistance locale (localStorage) des paramètres de saisie
// du trimestre (effectifs SRH, repas, budget, coûts denrées / charges indirectes).
// Les setters reproduisent la signature de useState afin de remplacer les useState
// de la page sans toucher aux call-sites. L'onglet d'import de fichier reste, lui,
// volontairement en session (un bilan dérivé d'un fichier n'a pas de sens sans le fichier).

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Updater<T> = T | ((prev: T) => T);
const resolve = <T,>(arg: Updater<T>, prev: T): T =>
  typeof arg === "function" ? (arg as (p: T) => T)(prev) : arg;

interface CreditNourritureState {
  repasPrevisionnels: number;
  setRepasPrevisionnels: (arg: Updater<number>) => void;
  repasServis: number;
  setRepasServis: (arg: Updater<number>) => void;
  budgetInitial: number;
  setBudgetInitial: (arg: Updater<number>) => void;
  depensesRealisees: number;
  setDepensesRealisees: (arg: Updater<number>) => void;
  effectifsDP: number;
  setEffectifsDP: (arg: Updater<number>) => void;
  effectifsInternes: number;
  setEffectifsInternes: (arg: Updater<number>) => void;
  effectifsCommensaux: number;
  setEffectifsCommensaux: (arg: Updater<number>) => void;
  coutDenrees: number;
  setCoutDenrees: (arg: Updater<number>) => void;
  chargesIndirectes: number;
  setChargesIndirectes: (arg: Updater<number>) => void;
}

export const useCreditNourritureStore = create<CreditNourritureState>()(
  persist(
    (set, get) => ({
      repasPrevisionnels: 28000,
      setRepasPrevisionnels: (arg) => set({ repasPrevisionnels: resolve(arg, get().repasPrevisionnels) }),
      repasServis: 18200,
      setRepasServis: (arg) => set({ repasServis: resolve(arg, get().repasServis) }),
      budgetInitial: 142000,
      setBudgetInitial: (arg) => set({ budgetInitial: resolve(arg, get().budgetInitial) }),
      depensesRealisees: 89500,
      setDepensesRealisees: (arg) => set({ depensesRealisees: resolve(arg, get().depensesRealisees) }),
      effectifsDP: 420,
      setEffectifsDP: (arg) => set({ effectifsDP: resolve(arg, get().effectifsDP) }),
      effectifsInternes: 85,
      setEffectifsInternes: (arg) => set({ effectifsInternes: resolve(arg, get().effectifsInternes) }),
      effectifsCommensaux: 35,
      setEffectifsCommensaux: (arg) => set({ effectifsCommensaux: resolve(arg, get().effectifsCommensaux) }),
      coutDenrees: 62000,
      setCoutDenrees: (arg) => set({ coutDenrees: resolve(arg, get().coutDenrees) }),
      chargesIndirectes: 27500,
      setChargesIndirectes: (arg) => set({ chargesIndirectes: resolve(arg, get().chargesIndirectes) }),
    }),
    { name: "credit_nourriture_v1" },
  ),
);
