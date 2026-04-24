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

// ─── Lecture historique règle 8 € ────────────────────────────────

const REGLE8_ACTIONS: Regle8LogAction[] = [
  "voyage_regle8_bloquant",
  "voyage_regle8_don_tacite_assume",
  "voyage_regle8_don_tacite_retire",
];

export interface Regle8LogEntry {
  id: string;
  created_at: string;
  action: Regle8LogAction;
  user_id: string | null;
  uai: string | null;
  details: Record<string, any>;
}

export interface FetchRegle8LogsOptions {
  /** Filtre sur un voyage précis (recommandé en wizard) */
  voyageId?: string | null;
  /** Filtre sur un UAI précis (sinon : tous ceux visibles par RLS) */
  uai?: string | null;
  /** Limite de résultats (défaut 100) */
  limit?: number;
  /** Si true et voyageId présent : inclure aussi les logs sans voyage_id (sessions hors-voyage) */
  includeOrphans?: boolean;
}

/**
 * Récupère l'historique des événements règle 8 € visibles pour
 * l'utilisateur courant (RLS appliquée par Supabase).
 * Best-effort : retourne [] en cas d'erreur, jamais d'exception.
 */
export async function fetchRegle8Logs(opts: FetchRegle8LogsOptions = {}): Promise<Regle8LogEntry[]> {
  try {
    let q = supabase
      .from("logs")
      .select("id, created_at, action, user_id, uai, details")
      .in("action", REGLE8_ACTIONS)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(500, opts.limit ?? 100)));

    if (opts.uai) q = q.eq("uai", opts.uai);

    const { data, error } = await q;
    if (error) {
      console.warn("[fetchRegle8Logs]", error.message);
      return [];
    }

    let rows = (data || []) as unknown as Regle8LogEntry[];

    if (opts.voyageId) {
      rows = rows.filter((r) => {
        const vid = (r.details as any)?.voyage_id;
        return vid === opts.voyageId || (opts.includeOrphans && (vid === null || vid === undefined));
      });
    }

    return rows;
  } catch (e: any) {
    console.warn("[fetchRegle8Logs] exception:", e?.message || e);
    return [];
  }
}

export const REGLE8_ACTION_LABELS: Record<Regle8LogAction, string> = {
  voyage_regle8_bloquant: "Tentative de finalisation bloquée",
  voyage_regle8_don_tacite_assume: "Don tacite assumé (case cochée)",
  voyage_regle8_don_tacite_retire: "Don tacite retiré (case décochée)",
};
