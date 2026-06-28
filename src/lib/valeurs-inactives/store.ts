// Valeurs inactives (registre P503) — timbres, tickets, cartes. Persistance
// locale (localStorage, RGPD). Suivi des entrées/sorties, stock théorique,
// contrôle de l'agent comptable, génération de PV. Réf. M9-6 (valeurs inactives).

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TypeValeur = "timbre_fiscal" | "ticket_restauration" | "carte" | "autre";
export const TYPE_VALEUR_LABELS: Record<TypeValeur, string> = {
  timbre_fiscal: "Timbre fiscal", ticket_restauration: "Ticket (restauration)", carte: "Carte / badge", autre: "Autre valeur",
};

export interface ValeurInactive {
  id: string;
  etablissementId?: string;
  type: TypeValeur;
  designation: string;
  valeurUnitaire: number;
  majLe?: string;
}

export interface MouvementVI {
  id: string;
  valeurId: string;
  sens: "entree" | "sortie";
  quantite: number;
  date: string;
  motif?: string;
}

export interface ControleVI {
  id: string;
  etablissementId?: string;
  date: string;
  agent?: string;
  valeurId: string;
  stockConstate: number;
  observation?: string;
}

const uid = (p: string) => `${p}-${Math.floor(Math.random() * 1e9).toString(36)}`;
export const nouvelleValeur = (etablissementId?: string): ValeurInactive =>
  ({ id: uid("vi"), etablissementId, type: "timbre_fiscal", designation: "", valeurUnitaire: 0 });

interface State {
  valeurs: ValeurInactive[];
  mouvements: MouvementVI[];
  controles: ControleVI[];
  upsertValeur: (v: ValeurInactive) => void;
  removeValeur: (id: string) => void;
  ajouterMouvement: (m: Omit<MouvementVI, "id">) => void;
  ajouterControle: (c: Omit<ControleVI, "id">) => void;
}

export const useValeursInactivesStore = create<State>()(
  persist(
    (set) => ({
      valeurs: [], mouvements: [], controles: [],
      upsertValeur: (v) => set((s) => {
        const maj = { ...v, majLe: new Date().toISOString() };
        const i = s.valeurs.findIndex((x) => x.id === v.id);
        return { valeurs: i >= 0 ? s.valeurs.map((x) => (x.id === v.id ? maj : x)) : [...s.valeurs, maj] };
      }),
      removeValeur: (id) => set((s) => ({
        valeurs: s.valeurs.filter((v) => v.id !== id),
        mouvements: s.mouvements.filter((m) => m.valeurId !== id),
      })),
      ajouterMouvement: (m) => set((s) => ({ mouvements: [...s.mouvements, { ...m, id: uid("mvt") }] })),
      ajouterControle: (c) => set((s) => ({ controles: [...s.controles, { ...c, id: uid("ctrl") }] })),
    }),
    { name: "valeurs_inactives_p503_v1" },
  ),
);

// ───────── Calculs registre ─────────

export function stockTheorique(valeurId: string, mouvements: MouvementVI[]): number {
  return mouvements.filter((m) => m.valeurId === valeurId)
    .reduce((s, m) => s + (m.sens === "entree" ? m.quantite : -m.quantite), 0);
}

export function valeurStock(v: ValeurInactive, mouvements: MouvementVI[]): number {
  return stockTheorique(v.id, mouvements) * (v.valeurUnitaire || 0);
}

export function totalRegistre(valeurs: ValeurInactive[], mouvements: MouvementVI[]): number {
  return valeurs.reduce((s, v) => s + valeurStock(v, mouvements), 0);
}

/** Dernier écart constaté (stock constaté − stock théorique) pour une valeur. */
export function dernierEcart(valeurId: string, mouvements: MouvementVI[], controles: ControleVI[]): number | null {
  const c = controles.filter((x) => x.valeurId === valeurId).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!c) return null;
  return c.stockConstate - stockTheorique(valeurId, mouvements);
}
