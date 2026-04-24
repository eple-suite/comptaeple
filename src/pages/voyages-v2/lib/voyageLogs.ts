// ════════════════════════════════════════════════════════════════
// Journalisation événements règle 8 € — table `logs`
// ────────────────────────────────────────────────────────────────
// RLS : auth.uid() = user_id ET (uai NULL OU rattaché). On cible
// donc l'uai de l'établissement courant.
// ════════════════════════════════════════════════════════════════
import { supabase } from "@/integrations/supabase/client";

export type Regle8LogAction =
  | "voyage_regle8_bloquant"
  | "voyage_regle8_don_tacite_assume"
  | "voyage_regle8_don_tacite_retire";

export interface Regle8LogPayload {
  action: Regle8LogAction;
  user_id: string;
  uai?: string | null;
  voyage_id?: string | null;
  voyage_libelle?: string;
  reste_a_charge_par_eleve?: number;
  cout_par_eleve?: number;
  participation_par_eleve?: number;
  nb_eleves?: number;
  step?: number;
  contexte?: string; // ex: "tentative_finalisation", "toggle_checkbox"
  reference_legale?: string;
}

/**
 * Insère une entrée dans `logs`. Best-effort : ne lève jamais,
 * ne bloque jamais le flux applicatif. Toute erreur est consignée
 * dans la console pour audit développeur.
 */
export async function logRegle8Event(payload: Regle8LogPayload): Promise<void> {
  try {
    if (!payload.user_id) return;
    const { action, user_id, uai, ...details } = payload;
    const { error } = await supabase.from("logs").insert({
      user_id,
      uai: uai || null,
      action,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        module: "voyages-v2",
        regle: "LF n° 66-948 du 22/12/1966 art. 21 — règle des 8 €",
      },
    });
    if (error) {
      // Pas de toast : l'événement métier ne doit pas être pollué
      // par un échec de logging.
      console.warn("[logRegle8Event] insertion logs impossible:", error.message);
    }
  } catch (e: any) {
    console.warn("[logRegle8Event] exception:", e?.message || e);
  }
}

/** Récupère l'UAI d'un établissement (cache léger en mémoire). */
const uaiCache = new Map<string, string | null>();
export async function getEtablissementUai(establishmentId: string | null | undefined): Promise<string | null> {
  if (!establishmentId) return null;
  if (uaiCache.has(establishmentId)) return uaiCache.get(establishmentId)!;
  try {
    const { data, error } = await supabase
      .from("establishments")
      .select("uai")
      .eq("id", establishmentId)
      .maybeSingle();
    const uai = error || !data?.uai ? null : String(data.uai);
    uaiCache.set(establishmentId, uai);
    return uai;
  } catch {
    return null;
  }
}
