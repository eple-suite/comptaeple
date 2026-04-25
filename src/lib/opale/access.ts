import { supabase } from "@/integrations/supabase/client";

export type OpaleAction =
  | "consultation_fiche"
  | "publication_fiche"
  | "soumission_fiche"
  | "moderation_approbation"
  | "moderation_rejet"
  | "moderation_modifs"
  | "evaluation_utile"
  | "evaluation_pas_utile"
  | "signalement"
  | "suppression_demandee"
  | "export_pdf"
  | "creation_question"
  | "reponse_question";

export async function logOpaleAcces(action: OpaleAction, params: {
  cible_type?: string;
  cible_id?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("opale_acces_log").insert({
      user_id: user?.id ?? null,
      action,
      cible_type: params.cible_type ?? null,
      cible_id: params.cible_id ?? null,
      metadata: (params.metadata ?? {}) as never,
    });
  } catch (e) {
    console.warn("logOpaleAcces", e);
  }
}

export async function logOpaleConsultation(ficheId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("opale_fiches_consultations").insert({
      fiche_id: ficheId,
      user_id: user?.id ?? null,
    });
  } catch (e) {
    console.warn("logOpaleConsultation", e);
  }
}