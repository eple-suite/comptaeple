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

// ─── DÉLIBÉRATIONS CA ──────────────────────────────────────────
export function useDeliberationsCa() {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_deliberations_ca", eid],
    enabled: !!eid,
    queryFn: async (): Promise<FsDeliberationCa[]> => {
      const { data, error } = await supabase
        .from("fs_deliberations_ca")
        .select("*")
        .eq("establishment_id", eid!)
        .order("date_ca", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsDeliberationCa[];
    },
  });
}

export function useUpsertDeliberationCa() {
  const qc = useQueryClient();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (d: Partial<FsDeliberationCa> & { numero: string; date_ca: string; annee_scolaire: string }) => {
      if (!selectedEstablishment || !user) throw new Error("Établissement ou utilisateur manquant");
      const payload: any = {
        ...d,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (d.id) {
        const { error } = await supabase.from("fs_deliberations_ca").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fs_deliberations_ca").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_deliberations_ca"] }),
  });
}

// ─── CONVOCATIONS COMMISSION ───────────────────────────────────
export function useConvocations(commissionId?: string) {
  const { selectedEstablishment } = useEstablishment();
  const eid = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["fs_commission_convocations", eid, commissionId ?? "all"],
    enabled: !!eid,
    queryFn: async (): Promise<FsCommissionConvocation[]> => {
      let q = supabase.from("fs_commission_convocations").select("*").eq("establishment_id", eid!);
      if (commissionId) q = q.eq("commission_id", commissionId);
      const { data, error } = await q.order("date_envoi", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FsCommissionConvocation[];
    },
  });
}

export function useUpsertConvocation() {
  const qc = useQueryClient();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: Partial<FsCommissionConvocation> & { commission_id: string; date_envoi: string }) => {
      if (!selectedEstablishment || !user) throw new Error("Établissement ou utilisateur manquant");
      const payload: any = {
        ...c,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (c.id) {
        const { error } = await supabase.from("fs_commission_convocations").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fs_commission_convocations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs_commission_convocations"] }),
  });
}

// ─── JOURNAL RGPD (insertion automatique) ──────────────────────
/**
 * Hook pour journaliser un accès, une modification ou un export PDF.
 * Append-only : aucune méthode de mise à jour ou suppression exposée.
 * Conforme RGPD art. 30 — registre des activités de traitement.
 */
export function useLogJournalAcces() {
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  return async (entry: {
    type_ressource: FsJournalAccesEntry["type_ressource"];
    ressource_id: string;
    action: FsJournalAccesEntry["action"];
    details?: Record<string, unknown>;
  }) => {
    if (!selectedEstablishment || !user) return;
    try {
      await supabase.from("fs_journal_acces").insert({
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
        user_name: user.email ?? null,
        type_ressource: entry.type_ressource,
        ressource_id: entry.ressource_id,
        action: entry.action,
        details: entry.details ?? {},
      } as any);
    } catch {
      // Journal best-effort : ne bloque jamais l'action utilisateur
    }
  };
}