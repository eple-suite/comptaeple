// Store des missions d'audit — persistance locale (localStorage, RGPD).
// Le travail survit au refresh. Une migration Supabase (audit_missions…) est
// fournie pour la consolidation serveur multi-EPLE (à appliquer sur qbhxjaz).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditMission, ControleSaisi, ActionPlan, TypeBudget, StatutMission } from "./types";

const uid = (p: string) => `${p}-${Math.floor(Math.random() * 1e9).toString(36)}`;

interface State {
  missions: AuditMission[];
  creer: (etablissementId: string, etablissementNom: string, budgetType: TypeBudget, campagne: number, auditeur?: string) => string;
  get: (id: string) => AuditMission | undefined;
  parEtablissement: (etablissementId: string) => AuditMission[];
  setControle: (missionId: string, controleId: string, patch: Partial<ControleSaisi>) => void;
  setActions: (missionId: string, actions: ActionPlan[]) => void;
  setStatut: (missionId: string, statut: StatutMission, signature?: { auditeur?: string; visa?: string }) => void;
  remove: (id: string) => void;
}

export const useAuditStore = create<State>()(
  persist(
    (set, get) => ({
      missions: [],
      creer: (etablissementId, etablissementNom, budgetType, campagne, auditeur) => {
        const id = uid("audit");
        const m: AuditMission = {
          id, etablissementId, etablissementNom, budgetType, campagne,
          statut: "en_cours", auditeur, controles: {}, actions: [],
          dateDebut: new Date().toISOString(), majLe: new Date().toISOString(),
        };
        set((s) => ({ missions: [...s.missions, m] }));
        return id;
      },
      get: (id) => get().missions.find((m) => m.id === id),
      parEtablissement: (etablissementId) =>
        get().missions.filter((m) => m.etablissementId === etablissementId).sort((a, b) => b.campagne - a.campagne),
      setControle: (missionId, controleId, patch) => set((s) => ({
        missions: s.missions.map((m) => m.id !== missionId ? m : {
          ...m,
          controles: { ...m.controles, [controleId]: { resultat: "non_evalue", ...m.controles[controleId], ...patch, majLe: new Date().toISOString() } },
          majLe: new Date().toISOString(),
        }),
      })),
      setActions: (missionId, actions) => set((s) => ({
        missions: s.missions.map((m) => m.id === missionId ? { ...m, actions, majLe: new Date().toISOString() } : m),
      })),
      setStatut: (missionId, statut, signature) => set((s) => ({
        missions: s.missions.map((m) => m.id !== missionId ? m : {
          ...m, statut,
          dateCloture: statut === "cloturee" ? new Date().toISOString() : m.dateCloture,
          signatureAuditeur: signature?.auditeur ?? m.signatureAuditeur,
          visaOrdonnateur: signature?.visa ?? m.visaOrdonnateur,
          majLe: new Date().toISOString(),
        }),
      })),
      remove: (id) => set((s) => ({ missions: s.missions.filter((m) => m.id !== id) })),
    }),
    { name: "audit_eple_missions_v1" },
  ),
);
