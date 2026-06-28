// Plan de contrôle interne (CIC) — store persistant (localStorage, RGPD).
// Remplace les données mock : les contrôles survivent au refresh, sont créés/
// édités/clôturés, et se consolident sur le groupement. Une migration
// (plan_controle / controle_realise) est fournie pour la consolidation serveur.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FrequenceControle = "quotidien" | "hebdomadaire" | "mensuel" | "trimestriel" | "annuel";
export type StatutControle = "conforme" | "anomalie" | "en_cours" | "non_realise";
export type RisqueControle = "faible" | "moyen" | "eleve" | "critique";

export interface PointControle {
  id: string;
  processus: string;          // P1 — Recettes … P9 — Bourses
  action: string;
  frequence: FrequenceControle;
  responsable: string;
  statut: StatutControle;
  dateControle: string;       // ISO (vide si non réalisé)
  observation: string;
  risque: RisqueControle;
  etablissementId?: string;
}

export const PROCESSUS = [
  "P1 — Recettes", "P2 — Dépenses", "P3 — Trésorerie", "P4 — Régies",
  "P5 — Patrimoine / Inventaire", "P6 — Stocks", "P7 — Comptes de tiers",
  "P8 — États financiers", "P9 — Bourses & Aides sociales",
] as const;

export const FREQUENCES: FrequenceControle[] = ["quotidien", "hebdomadaire", "mensuel", "trimestriel", "annuel"];

const uid = () => `ci-${Math.floor(Math.random() * 1e9).toString(36)}`;
export const nouveauControle = (): PointControle => ({
  id: uid(), processus: PROCESSUS[0], action: "", frequence: "mensuel",
  responsable: "", statut: "non_realise", dateControle: "", observation: "", risque: "moyen",
});

// Les contrôles initiaux (exemples de plan de contrôle CIC) sont injectés par
// la page au premier lancement si le store est vide (seedSiVide).
interface State {
  controles: PointControle[];
  objectifHebdo: number;            // objectif paramétrable (≥ 5 / semaine / agent)
  seedSiVide: (initiaux: PointControle[]) => void;
  upsert: (c: PointControle) => void;
  remove: (id: string) => void;
  setObjectif: (n: number) => void;
}

export const useControleInterneStore = create<State>()(
  persist(
    (set, get) => ({
      controles: [],
      objectifHebdo: 5,
      seedSiVide: (initiaux) => { if (get().controles.length === 0) set({ controles: initiaux }); },
      upsert: (c) => set((s) => {
        const i = s.controles.findIndex((x) => x.id === c.id);
        return { controles: i >= 0 ? s.controles.map((x) => (x.id === c.id ? c : x)) : [...s.controles, c] };
      }),
      remove: (id) => set((s) => ({ controles: s.controles.filter((c) => c.id !== id) })),
      setObjectif: (n) => set({ objectifHebdo: Math.max(1, n) }),
    }),
    { name: "controle_interne_plan_v1" },
  ),
);

// ───────── Cadence / planificateur ─────────

const debutSemaine = (d: Date) => { const x = new Date(d); const j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j); x.setHours(0, 0, 0, 0); return x; };

export interface CadenceHebdo { faits: number; attendus: number; objectif: number; conforme: boolean; }

/** Contrôles réalisés cette semaine vs objectif. */
export function cadenceSemaine(controles: PointControle[], objectif: number, maintenant = new Date()): CadenceHebdo {
  const lundi = debutSemaine(maintenant);
  const faits = controles.filter((c) => c.dateControle && new Date(c.dateControle) >= lundi && c.statut !== "non_realise").length;
  return { faits, attendus: objectif, objectif, conforme: faits >= objectif };
}

/** Contrôles non réalisés / en retard (à relancer). */
export function controlesEnRetard(controles: PointControle[]): PointControle[] {
  return controles.filter((c) => c.statut === "non_realise" || (c.statut === "en_cours" && !c.dateControle));
}
