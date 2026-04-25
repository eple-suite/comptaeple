// ═══════════════════════════════════════════════════════════════
// Hooks de données pour le module Action sociale v2
// React Query + Supabase, scoped sur l'établissement courant
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import type {
  FsEleve, FsCommission, FsDecision,
  FsSubventionRectorat, FsReliquatOuverture,
  FsDeliberationCa, FsCommissionConvocation, FsJournalAccesEntry,
} from "./fsv2Types";

// ─── ÉLÈVES ────────────────────────────────────────────────────
export function useEleves() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_eleves", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsEleve[]> => {
      const { data, error } = await supabase
        .from("fs_eleves")
        .select("*")
        .eq("establishment_id", eid!)
        .order("nom", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as FsEleve[];
    },
  });
}

export function useUpsertEleve() {
  const qc = useQueryClient();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (e: Partial<FsEleve> & { nom: string; prenom: string }) => {
      if (!selectedEstablishment || !user) throw new Error("Établissement ou utilisateur manquant");
      const payload: any = {
        ...e,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (e.id) {
        const { error } = await supabase.from("fs_eleves").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fs_eleves").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_eleves"] }),
  });
}

export function useDeleteEleve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fs_eleves").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_eleves"] }),
  });
}

// ─── COMMISSIONS ───────────────────────────────────────────────
export function useCommissions() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_commissions", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsCommission[]> => {
      const { data, error } = await supabase
        .from("fs_commissions")
        .select("*")
        .eq("establishment_id", eid!)
        .order("date_commission", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsCommission[];
    },
  });
}

export function useUpsertCommission() {
  const qc = useQueryClient();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: Partial<FsCommission> & { date_commission: string; type: FsCommission["type"] }) => {
      if (!selectedEstablishment || !user) throw new Error("Établissement ou utilisateur manquant");
      const payload: any = {
        ...c,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (c.id) {
        const { error } = await supabase.from("fs_commissions").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fs_commissions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_commissions"] }),
  });
}

// ─── DÉCISIONS ─────────────────────────────────────────────────
export function useDecisions() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_decisions", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsDecision[]> => {
      const { data, error } = await supabase
        .from("fs_decisions")
        .select("*")
        .eq("establishment_id", eid!)
        .order("date_decision", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsDecision[];
    },
  });
}

export function useUpsertDecision() {
  const qc = useQueryClient();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (d: Partial<FsDecision>) => {
      if (!selectedEstablishment || !user) throw new Error("Établissement ou utilisateur manquant");
      const payload: any = {
        ...d,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (d.id) {
        const { error } = await supabase.from("fs_decisions").update(payload).eq("id", d.id);
        if (error) throw error;
        return d.id;
      } else {
        const { data, error } = await supabase.from("fs_decisions").insert(payload).select("id").single();
        if (error) throw error;
        return data!.id as string;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_decisions"] }),
  });
}

// ─── SUBVENTIONS RECTORAT ──────────────────────────────────────
export function useSubventions() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_subv", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsSubventionRectorat[]> => {
      const { data, error } = await supabase
        .from("fs_subventions_rectorat")
        .select("*")
        .eq("establishment_id", eid!)
        .order("date_versement_tresor", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsSubventionRectorat[];
    },
  });
}

export function useReliquats() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_reliq", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsReliquatOuverture[]> => {
      const { data, error } = await supabase
        .from("fs_reliquats_ouverture")
        .select("*")
        .eq("establishment_id", eid!)
        .order("annee_civile", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsReliquatOuverture[];
    },
  });
}