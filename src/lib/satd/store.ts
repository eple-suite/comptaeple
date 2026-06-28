// SATD (saisie administrative à tiers détenteur) — persistance locale (localStorage).
// Données sensibles (débiteurs, créances) → restent côté client (RGPD).
// Couvre le registre SATD + tiers détenteurs (page SATD) ainsi que les onglets
// isolés Relances amiables et Surendettement. Les setters reproduisent la
// signature de useState (valeur ou updater) pour remplacer les useState sans
// toucher aux call-sites (certains utilisent la forme fonctionnelle setX(prev => …)).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockSatds, mockTiers, type Satd, type TiersDetenteur } from "@/pages/satd/types";

// ───────── Onglet Relances amiables ─────────
export type TypeRelance = "amiable1" | "amiable2" | "mise_en_demeure" | "poursuite_forcee";
export type StatutRelance = "envoyee" | "repondue" | "sans_reponse" | "huissier" | "mainlevee";
export interface Relance {
  id: string;
  debiteur: string;
  montant: number;
  type: TypeRelance;
  statut: StatutRelance;
  dateEnvoi: string;
  reference: string;
}
const mockRelances: Relance[] = [
  { id: "r1", debiteur: "DUPONT Marie", montant: 450, type: "amiable1", statut: "sans_reponse", dateEnvoi: "2026-01-15", reference: "REL-2026-001" },
  { id: "r2", debiteur: "MARTIN Jean", montant: 1200, type: "mise_en_demeure", statut: "envoyee", dateEnvoi: "2026-02-20", reference: "REL-2026-002" },
  { id: "r3", debiteur: "BERNARD Sophie", montant: 320, type: "amiable2", statut: "repondue", dateEnvoi: "2026-02-10", reference: "REL-2026-003" },
];

// ───────── Onglet Surendettement ─────────
export type StatutSurendettement = "declaration" | "recevable" | "plan_conventionnel" | "plan_impose" | "retablissement" | "cloture";
export interface DossierSurendettement {
  id: string;
  debiteur: string;
  montantCreance: number;
  dateDeclaration: string;
  commission: string;
  reference: string;
  statut: StatutSurendettement;
  observations: string;
}
const mockDossiers: DossierSurendettement[] = [
  { id: "s1", debiteur: "LEROY Alain", montantCreance: 850, dateDeclaration: "2026-01-10", commission: "Banque de France — Commission de surendettement de Paris", reference: "SUR-2026-001", statut: "recevable", observations: "Dossier déclaré recevable le 15/02/2026" },
  { id: "s2", debiteur: "PETIT Nathalie", montantCreance: 1200, dateDeclaration: "2025-11-05", commission: "Banque de France — Commission de surendettement de Lyon", reference: "SUR-2025-003", statut: "plan_conventionnel", observations: "Plan de 24 mois accepté" },
];

type Updater<T> = T | ((prev: T) => T);
const resolve = <T,>(arg: Updater<T>, prev: T): T =>
  typeof arg === "function" ? (arg as (p: T) => T)(prev) : arg;

interface SatdState {
  satds: Satd[];
  setSatds: (arg: Updater<Satd[]>) => void;
  tiersDetenteurs: TiersDetenteur[];
  setTiersDetenteurs: (arg: Updater<TiersDetenteur[]>) => void;
  relances: Relance[];
  setRelances: (arg: Updater<Relance[]>) => void;
  dossiers: DossierSurendettement[];
  setDossiers: (arg: Updater<DossierSurendettement[]>) => void;
}

export const useSatdStore = create<SatdState>()(
  persist(
    (set, get) => ({
      satds: mockSatds,
      setSatds: (arg) => set({ satds: resolve(arg, get().satds) }),
      tiersDetenteurs: mockTiers,
      setTiersDetenteurs: (arg) => set({ tiersDetenteurs: resolve(arg, get().tiersDetenteurs) }),
      relances: mockRelances,
      setRelances: (arg) => set({ relances: resolve(arg, get().relances) }),
      dossiers: mockDossiers,
      setDossiers: (arg) => set({ dossiers: resolve(arg, get().dossiers) }),
    }),
    { name: "satd_v1" },
  ),
);
