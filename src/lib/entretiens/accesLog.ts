/**
 * Helper RGPD : trace les consultations de CREP.
 * À appeler à chaque ouverture / téléchargement / export.
 */
import { supabase } from "@/integrations/supabase/client";

export type TypeAccesEntretien =
  | "lecture"
  | "telechargement"
  | "export_esteve"
  | "export_pdf"
  | "generation_pdf";

export async function logAccesEntretien(
  entretienId: string,
  type: TypeAccesEntretien,
  note?: string,
): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("entretiens_acces_log").insert({
      entretien_id: entretienId,
      consultant_user_id: u.user.id,
      type_acces: type,
      notes: note ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    });
  } catch (e) {
    // Log silencieux — ne doit jamais bloquer l'expérience utilisateur
    console.warn("logAccesEntretien failed", e);
  }
}