import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useCallback } from "react";

export interface EstablishmentBranding {
  id?: string;
  establishment_id: string;
  logo_url: string | null;
  full_name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  footer_text: string;
  signataire_ordonnateur: string;
  signataire_agent_comptable: string;
  primary_color: string;
}

const EMPTY_BRANDING = (estId: string): EstablishmentBranding => ({
  establishment_id: estId,
  logo_url: null,
  full_name: "",
  address: "",
  postal_code: "",
  city: "",
  phone: "",
  email: "",
  footer_text: "",
  signataire_ordonnateur: "",
  signataire_agent_comptable: "",
  primary_color: "#254478",
});

export function useEstablishmentBranding() {
  const { selectedEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const estId = selectedEstablishment?.id || null;

  const { data: branding, isLoading } = useQuery({
    queryKey: ["establishment-branding", estId],
    queryFn: async (): Promise<EstablishmentBranding> => {
      if (!estId) return EMPTY_BRANDING("");
      const { data, error } = await supabase
        .from("establishment_branding")
        .select("*")
        .eq("establishment_id", estId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // fallback: use establishment fields if no branding row yet
        return {
          ...EMPTY_BRANDING(estId),
          full_name: selectedEstablishment?.name || "",
          city: selectedEstablishment?.city || "",
          signataire_ordonnateur: selectedEstablishment?.ordonnateur || "",
          signataire_agent_comptable: selectedEstablishment?.agent_comptable || "",
        };
      }
      return data as EstablishmentBranding;
    },
    enabled: !!estId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<EstablishmentBranding>) => {
      if (!estId) throw new Error("Aucun établissement sélectionné");
      const row = {
        establishment_id: estId,
        logo_url: payload.logo_url ?? branding?.logo_url ?? null,
        full_name: payload.full_name ?? branding?.full_name ?? "",
        address: payload.address ?? branding?.address ?? "",
        postal_code: payload.postal_code ?? branding?.postal_code ?? "",
        city: payload.city ?? branding?.city ?? "",
        phone: payload.phone ?? branding?.phone ?? "",
        email: payload.email ?? branding?.email ?? "",
        footer_text: payload.footer_text ?? branding?.footer_text ?? "",
        signataire_ordonnateur: payload.signataire_ordonnateur ?? branding?.signataire_ordonnateur ?? "",
        signataire_agent_comptable: payload.signataire_agent_comptable ?? branding?.signataire_agent_comptable ?? "",
        primary_color: payload.primary_color ?? branding?.primary_color ?? "#254478",
      };
      const { error } = await supabase
        .from("establishment_branding")
        .upsert(row, { onConflict: "establishment_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishment-branding", estId] });
    },
  });

  const uploadLogo = useCallback(
    async (file: File): Promise<string> => {
      if (!estId) throw new Error("Aucun établissement");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${estId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("establishment-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("establishment-logos").getPublicUrl(path);
      await saveMutation.mutateAsync({ logo_url: data.publicUrl });
      return data.publicUrl;
    },
    [estId, saveMutation]
  );

  return {
    branding: branding || (estId ? EMPTY_BRANDING(estId) : null),
    isLoading,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    uploadLogo,
  };
}
