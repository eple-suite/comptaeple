import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Marche, MarcheJalon, MarcheLot, FournisseurMarche, FamilleAchat, SeuilCcp } from "../types";

// ───── Seuils CCP ───────────────────────────────────────────────
export function useSeuilsCcp() {
  return useQuery({
    queryKey: ["mp-seuils-ccp"],
    queryFn: async (): Promise<SeuilCcp[]> => {
      const { data, error } = await supabase
        .from("mp_seuils_ccp")
        .select("*")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return (data || []) as SeuilCcp[];
    },
  });
}

// ───── Familles d'achat ─────────────────────────────────────────
export function useFamilles() {
  return useQuery({
    queryKey: ["mp-familles"],
    queryFn: async (): Promise<FamilleAchat[]> => {
      const { data, error } = await supabase
        .from("mp_familles_achat")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return (data || []) as FamilleAchat[];
    },
  });
}

// ───── Fournisseurs ─────────────────────────────────────────────
export function useFournisseurs() {
  const { selectedEstablishment } = useEstablishment();
  const estId = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["mp-fournisseurs", estId],
    queryFn: async (): Promise<FournisseurMarche[]> => {
      if (!estId) return [];
      const { data, error } = await supabase
        .from("mp_fournisseurs")
        .select("*")
        .eq("establishment_id", estId)
        .order("raison_sociale");
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        familles_principales: Array.isArray(r.familles_principales) ? r.familles_principales : [],
      })) as FournisseurMarche[];
    },
    enabled: !!estId,
  });
}

export function useUpsertFournisseur() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  return useMutation({
    mutationFn: async (payload: Partial<FournisseurMarche> & { id?: string }) => {
      if (!selectedEstablishment?.id || !user) throw new Error("Aucun établissement");
      const row: any = {
        ...payload,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
      };
      if (payload.id) {
        const { error } = await supabase.from("mp_fournisseurs").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mp_fournisseurs").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mp-fournisseurs"] }),
  });
}

export function useDeleteFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mp_fournisseurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mp-fournisseurs"] }),
  });
}

// ───── Marchés ──────────────────────────────────────────────────
export function useMarches() {
  const { selectedEstablishment } = useEstablishment();
  const estId = selectedEstablishment?.id;
  return useQuery({
    queryKey: ["mp-marches", estId],
    queryFn: async (): Promise<Marche[]> => {
      if (!estId) return [];
      const { data, error } = await supabase
        .from("mp_marches")
        .select("*")
        .eq("establishment_id", estId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        criteres: Array.isArray(r.criteres) ? r.criteres : [],
        checklist_validation: r.checklist_validation || {},
        historique: Array.isArray(r.historique) ? r.historique : [],
      })) as Marche[];
    },
    enabled: !!estId,
  });
}

export function useMarche(id: string | undefined) {
  return useQuery({
    queryKey: ["mp-marche", id],
    queryFn: async (): Promise<Marche | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("mp_marches").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as any;
      return {
        ...r,
        criteres: Array.isArray(r.criteres) ? r.criteres : [],
        checklist_validation: r.checklist_validation || {},
        historique: Array.isArray(r.historique) ? r.historique : [],
      } as Marche;
    },
    enabled: !!id,
  });
}

export function useCreateMarche() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  return useMutation({
    mutationFn: async (payload: Partial<Marche>): Promise<string> => {
      if (!selectedEstablishment?.id || !user) throw new Error("Aucun établissement");
      const row: any = {
        ...payload,
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
        criteres: payload.criteres || [],
        checklist_validation: payload.checklist_validation || {},
        historique: payload.historique || [],
      };
      const { data, error } = await supabase.from("mp_marches").insert(row).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mp-marches"] }),
  });
}

export function useUpdateMarche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Marche> }) => {
      const { error } = await supabase.from("mp_marches").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["mp-marches"] });
      qc.invalidateQueries({ queryKey: ["mp-marche", v.id] });
    },
  });
}

export function useDeleteMarche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mp_marches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mp-marches"] }),
  });
}

// ───── Jalons ───────────────────────────────────────────────────
export function useJalons(marcheId: string | undefined) {
  return useQuery({
    queryKey: ["mp-jalons", marcheId],
    queryFn: async (): Promise<MarcheJalon[]> => {
      if (!marcheId) return [];
      const { data, error } = await supabase
        .from("mp_marches_jalons")
        .select("*")
        .eq("marche_id", marcheId)
        .order("ordre");
      if (error) throw error;
      return (data || []) as MarcheJalon[];
    },
    enabled: !!marcheId,
  });
}

export function useReplaceJalons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ marcheId, jalons }: { marcheId: string; jalons: Omit<MarcheJalon, "id" | "marche_id">[] }) => {
      await supabase.from("mp_marches_jalons").delete().eq("marche_id", marcheId);
      if (jalons.length > 0) {
        const rows = jalons.map((j) => ({ ...j, marche_id: marcheId }));
        const { error } = await supabase.from("mp_marches_jalons").insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["mp-jalons", v.marcheId] }),
  });
}

// ───── Lots ─────────────────────────────────────────────────────
export function useLots(marcheId: string | undefined) {
  return useQuery({
    queryKey: ["mp-lots", marcheId],
    queryFn: async (): Promise<MarcheLot[]> => {
      if (!marcheId) return [];
      const { data, error } = await supabase
        .from("mp_marches_lots")
        .select("*")
        .eq("marche_id", marcheId)
        .order("numero");
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        criteres: Array.isArray(r.criteres) ? r.criteres : [],
      })) as MarcheLot[];
    },
    enabled: !!marcheId,
  });
}
