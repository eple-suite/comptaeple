// Store Logements de fonction — persistance locale (localStorage, RGPD).
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Logement, ReleveConso, TypeConcession, Fluide } from "./types";

const uid = (p: string) => `${p}-${Math.floor(Math.random() * 1e9).toString(36)}`;

export const nouveauLogement = (etablissementId?: string): Logement => ({
  id: uid("log"), etablissementId, libelle: "", typeConcession: "COP",
  occupantNom: "", dateDebut: new Date().toISOString().slice(0, 10),
  redevanceMensuelle: 0, provisionsChargesMensuelles: 0,
});

export const nouveauReleve = (logementId: string, annee: number, fluide: Fluide): ReleveConso => ({
  id: uid("rel"), logementId, annee, fluide, indexInitial: 0, indexFinal: 0, prixUnitaire: 0,
});

interface State {
  logements: Logement[];
  releves: ReleveConso[];
  upsertLogement: (l: Logement) => void;
  removeLogement: (id: string) => void;
  upsertReleve: (r: ReleveConso) => void;
  removeReleve: (id: string) => void;
  logementsDe: (etablissementId?: string) => Logement[];
}

export const useLogementsStore = create<State>()(
  persist(
    (set, get) => ({
      logements: [],
      releves: [],
      upsertLogement: (l) => set((s) => {
        const maj = { ...l, majLe: new Date().toISOString() };
        const i = s.logements.findIndex((x) => x.id === l.id);
        return { logements: i >= 0 ? s.logements.map((x) => (x.id === l.id ? maj : x)) : [...s.logements, maj] };
      }),
      removeLogement: (id) => set((s) => ({
        logements: s.logements.filter((l) => l.id !== id),
        releves: s.releves.filter((r) => r.logementId !== id),
      })),
      upsertReleve: (r) => set((s) => {
        const i = s.releves.findIndex((x) => x.id === r.id);
        return { releves: i >= 0 ? s.releves.map((x) => (x.id === r.id ? r : x)) : [...s.releves, r] };
      }),
      removeReleve: (id) => set((s) => ({ releves: s.releves.filter((r) => r.id !== id) })),
      logementsDe: (etablissementId) => etablissementId
        ? get().logements.filter((l) => !l.etablissementId || l.etablissementId === etablissementId)
        : get().logements,
    }),
    { name: "logements_fonction_v1" },
  ),
);
