// Régies & caisse — persistance locale (localStorage). Couvre les trois onglets :
// journal de caisse, billetage / arrêté de caisse, modèles d'acte de régie.
// Les setters reproduisent la signature de useState (valeur ou updater) afin de
// remplacer les useState des onglets sans toucher aux call-sites.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LigneCaisse {
  id: string;
  date: string;
  libelle: string;
  entree: number;
  sortie: number;
}

export type TypeRegie = "avances_menues" | "recettes" | "avances_voyage" | "temporaire";

const mockLignes: LigneCaisse[] = [
  { id: "1", date: "2026-03-01", libelle: "Report solde février", entree: 245.50, sortie: 0 },
  { id: "2", date: "2026-03-03", libelle: "Vente photocopies", entree: 12.00, sortie: 0 },
  { id: "3", date: "2026-03-05", libelle: "Achat fournitures menues dépenses", entree: 0, sortie: 34.80 },
  { id: "4", date: "2026-03-07", libelle: "Remboursement frais élève", entree: 0, sortie: 15.00 },
  { id: "5", date: "2026-03-10", libelle: "Encaissement cantine jour", entree: 87.50, sortie: 0 },
];

type Updater<T> = T | ((prev: T) => T);
const resolve = <T,>(arg: Updater<T>, prev: T): T =>
  typeof arg === "function" ? (arg as (p: T) => T)(prev) : arg;

interface RegiesState {
  // Journal de caisse
  lignes: LigneCaisse[];
  setLignes: (arg: Updater<LigneCaisse[]>) => void;
  // Billetage / arrêté de caisse
  soldeTheorique: number;
  setSoldeTheorique: (arg: Updater<number>) => void;
  quantities: Record<number, number>;
  setQuantities: (arg: Updater<Record<number, number>>) => void;
  explicationsEcart: string;
  setExplicationsEcart: (arg: Updater<string>) => void;
  // Modèles d'acte de régie
  typeRegie: TypeRegie;
  setTypeRegie: (arg: Updater<TypeRegie>) => void;
  mandataire: string;
  setMandataire: (arg: Updater<string>) => void;
  montantPlafond: string;
  setMontantPlafond: (arg: Updater<string>) => void;
  dateDebut: string;
  setDateDebut: (arg: Updater<string>) => void;
  dateFin: string;
  setDateFin: (arg: Updater<string>) => void;
}

export const useRegiesStore = create<RegiesState>()(
  persist(
    (set, get) => ({
      lignes: mockLignes,
      setLignes: (arg) => set({ lignes: resolve(arg, get().lignes) }),
      soldeTheorique: 295.2,
      setSoldeTheorique: (arg) => set({ soldeTheorique: resolve(arg, get().soldeTheorique) }),
      quantities: {},
      setQuantities: (arg) => set({ quantities: resolve(arg, get().quantities) }),
      explicationsEcart: "",
      setExplicationsEcart: (arg) => set({ explicationsEcart: resolve(arg, get().explicationsEcart) }),
      typeRegie: "avances_menues",
      setTypeRegie: (arg) => set({ typeRegie: resolve(arg, get().typeRegie) }),
      mandataire: "",
      setMandataire: (arg) => set({ mandataire: resolve(arg, get().mandataire) }),
      montantPlafond: "1000",
      setMontantPlafond: (arg) => set({ montantPlafond: resolve(arg, get().montantPlafond) }),
      dateDebut: "",
      setDateDebut: (arg) => set({ dateDebut: resolve(arg, get().dateDebut) }),
      dateFin: "",
      setDateFin: (arg) => set({ dateFin: resolve(arg, get().dateFin) }),
    }),
    { name: "regies_caisse_v1" },
  ),
);
