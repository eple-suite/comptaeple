import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useCallback, useEffect, useState } from "react";

const LOGO_BUCKET = "establishment-logos";
const SIGNED_URL_TTL = 60 * 60; // 1h

export interface EstablishmentBranding {
  id?: string;
  establishment_id: string;
  /** Stored value: either a storage path (e.g. "<estId>/logo-...png") or a legacy public URL */
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

/** Extract a storage path from either a raw path or a legacy public URL */
function extractStoragePath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  // Legacy: full public URL .../object/public/establishment-logos/<path>
  const marker = `/object/public/${LOGO_BUCKET}/`;
  const idx = stored.indexOf(marker);
  if (idx !== -1) return stored.substring(idx + marker.length);
  // If it already looks like a path (no protocol), return as-is
  if (!/^https?:\/\//i.test(stored)) return stored;
  return null;
}

export function useEstablishmentBranding() {
  const { selectedEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const estId = selectedEstablishment?.id || null;
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);

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

  // Generate a signed URL whenever the stored logo path changes
  useEffect(() => {
    let cancelled = false;
    async function sign() {
      const path = extractStoragePath(branding?.logo_url);
      if (!path) {
        setLogoSignedUrl(null);
        return;
      }
      const { data, error } = await supabase.storage
        .from(LOGO_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (cancelled) return;
      if (error) {
        setLogoSignedUrl(null);
        return;
      }
      setLogoSignedUrl(data?.signedUrl || null);
    }
    sign();
    return () => {
      cancelled = true;
    };
  }, [branding?.logo_url]);

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
        .from(LOGO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Store the storage path (private bucket); display uses signed URLs.
      await saveMutation.mutateAsync({ logo_url: path });
      return path;
    },
    [estId, saveMutation]
  );

  return {
    branding: branding || (estId ? EMPTY_BRANDING(estId) : null),
    /** Temporary signed URL for displaying the logo (null if no logo) */
    logoUrl: logoSignedUrl,
    isLoading,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    uploadLogo,
  };
}
