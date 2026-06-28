// CFA / Apprentissage — NPEC, ressources OPCO, taxe d'apprentissage, équilibre
// du budget annexe. Persistance locale (localStorage). Réf. financement de
// l'apprentissage (NPEC France compétences), taxe d'apprentissage C/7568x.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FormationApprentissage {
  id: string;
  etablissementId?: string;
  intitule: string;
  diplome: string;
  npec: number;              // niveau de prise en charge (€ / apprenti / an)
  nbApprentis: number;
  coutAnnuel?: number;       // coût de la formation (charges directes)
}

export interface ParamsCfa {
  taxeApprentissage: number;   // produits taxe d'apprentissage (C/7568x)
  masseSalarialeApprentis: number;
  autresCharges: number;
  autresProduits: number;
}

const uid = (p: string) => `${p}-${Math.floor(Math.random() * 1e9).toString(36)}`;
export const nouvelleFormation = (etablissementId?: string): FormationApprentissage =>
  ({ id: uid("fa"), etablissementId, intitule: "", diplome: "", npec: 0, nbApprentis: 0 });

interface State {
  formations: FormationApprentissage[];
  params: ParamsCfa;
  upsertFormation: (f: FormationApprentissage) => void;
  removeFormation: (id: string) => void;
  setParams: (p: Partial<ParamsCfa>) => void;
}

export const useCfaStore = create<State>()(
  persist(
    (set) => ({
      formations: [],
      params: { taxeApprentissage: 0, masseSalarialeApprentis: 0, autresCharges: 0, autresProduits: 0 },
      upsertFormation: (f) => set((s) => {
        const i = s.formations.findIndex((x) => x.id === f.id);
        return { formations: i >= 0 ? s.formations.map((x) => (x.id === f.id ? f : x)) : [...s.formations, f] };
      }),
      removeFormation: (id) => set((s) => ({ formations: s.formations.filter((f) => f.id !== id) })),
      setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
    }),
    { name: "cfa_npec_v1" },
  ),
);

// ───────── Calculs ─────────

export const ressourceOpco = (f: FormationApprentissage) => (f.npec || 0) * (f.nbApprentis || 0);

export interface EquilibreCfa {
  nbApprentis: number;
  ressourcesOpco: number;
  taxeApprentissage: number;
  autresProduits: number;
  produitsTotal: number;
  masseSalarialeApprentis: number;
  coutsFormations: number;
  autresCharges: number;
  chargesTotal: number;
  resultat: number;
  coutMoyenApprenti: number;
}

export function equilibreCfa(formations: FormationApprentissage[], params: ParamsCfa): EquilibreCfa {
  const nbApprentis = formations.reduce((s, f) => s + (f.nbApprentis || 0), 0);
  const ressourcesOpco = formations.reduce((s, f) => s + ressourceOpco(f), 0);
  const coutsFormations = formations.reduce((s, f) => s + (f.coutAnnuel || 0), 0);
  const produitsTotal = ressourcesOpco + params.taxeApprentissage + params.autresProduits;
  const chargesTotal = params.masseSalarialeApprentis + coutsFormations + params.autresCharges;
  return {
    nbApprentis, ressourcesOpco, taxeApprentissage: params.taxeApprentissage,
    autresProduits: params.autresProduits, produitsTotal,
    masseSalarialeApprentis: params.masseSalarialeApprentis, coutsFormations,
    autresCharges: params.autresCharges, chargesTotal,
    resultat: produitsTotal - chargesTotal,
    coutMoyenApprenti: nbApprentis ? chargesTotal / nbApprentis : 0,
  };
}
