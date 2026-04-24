// ════════════════════════════════════════════════════════════════
// Persistance des alertes voyage dans `vs_alertes`
// ────────────────────────────────────────────────────────────────
// Stratégie : à chaque sauvegarde du wizard, on synchronise l'état
// du moteur d'alertes avec la table. Les alertes obsolètes
// (qui n'apparaissent plus dans l'évaluation courante) sont
// marquées `resolue=true`. Les nouvelles sont insérées.
// ════════════════════════════════════════════════════════════════
import { supabase } from "@/integrations/supabase/client";
import type { AlerteVoyage } from "./alertesEngine";

/** Mapping niveau moteur → niveau base (compatible RLS).  */
const NIVEAU_DB: Record<AlerteVoyage["niveau"], string> = {
  rouge: "critique",
  orange: "warning",
  bleu: "info",
  vert: "info",
};

/** Code unique stable basé sur la catégorie + champ concerné. */
function codeStable(a: AlerteVoyage): string {
  return a.champ_concerne ? `${a.categorie}::${a.champ_concerne}` : a.categorie;
}

export interface SyncAlertesResult {
  inserted: number;
  resolved: number;
  skipped: number;
  error?: string;
}

/**
 * Synchronise les alertes courantes avec la table `vs_alertes`.
 * Best-effort : ne lève jamais, retourne un résumé.
 */
export async function syncVoyageAlertes(
  voyageId: string,
  alertes: AlerteVoyage[],
): Promise<SyncAlertesResult> {
  if (!voyageId) return { inserted: 0, resolved: 0, skipped: 0, error: "voyage_id manquant" };
  try {
    // 1. Récupérer les alertes actives existantes
    const { data: existantes, error: errFetch } = await supabase
      .from("vs_alertes")
      .select("id, code")
      .eq("voyage_id", voyageId)
      .eq("resolue", false);
    if (errFetch) {
      console.warn("[syncVoyageAlertes] fetch:", errFetch.message);
      return { inserted: 0, resolved: 0, skipped: 0, error: errFetch.message };
    }

    const codesExistants = new Set((existantes || []).map((e) => e.code));
    const codesActuels = new Set(alertes.map(codeStable));

    // 2. Insertion des nouvelles
    const aInserer = alertes
      .filter((a) => !codesExistants.has(codeStable(a)))
      .map((a) => ({
        voyage_id: voyageId,
        code: codeStable(a),
        niveau: NIVEAU_DB[a.niveau],
        message: a.titre,
        contexte: {
          categorie: a.categorie,
          niveau_moteur: a.niveau,
          bloquant: a.bloquant,
          message_complet: a.message,
          reference_legale: a.reference_legale,
          champ_concerne: a.champ_concerne,
          valeur_observee: a.valeur_observee,
          source: "alertesEngine",
          ts: new Date().toISOString(),
        },
      }));

    let inserted = 0;
    if (aInserer.length > 0) {
      const { error: errIns } = await supabase.from("vs_alertes").insert(aInserer);
      if (errIns) {
        console.warn("[syncVoyageAlertes] insert:", errIns.message);
      } else {
        inserted = aInserer.length;
      }
    }

    // 3. Résolution des alertes obsolètes
    const idsAResoudre = (existantes || [])
      .filter((e) => !codesActuels.has(e.code))
      .map((e) => e.id);

    let resolved = 0;
    if (idsAResoudre.length > 0) {
      const { error: errUpd } = await supabase
        .from("vs_alertes")
        .update({ resolue: true, resolue_at: new Date().toISOString() })
        .in("id", idsAResoudre);
      if (errUpd) {
        console.warn("[syncVoyageAlertes] resolve:", errUpd.message);
      } else {
        resolved = idsAResoudre.length;
      }
    }

    return {
      inserted,
      resolved,
      skipped: alertes.length - inserted,
    };
  } catch (e: any) {
    console.warn("[syncVoyageAlertes] exception:", e?.message || e);
    return { inserted: 0, resolved: 0, skipped: 0, error: e?.message };
  }
}

/** Récupère toutes les alertes actives pour un établissement (sidebar globale). */
export async function fetchAlertesActivesEtablissement(
  establishmentId: string,
): Promise<
  Array<{
    id: string;
    voyage_id: string;
    voyage_libelle: string | null;
    code: string;
    niveau: string;
    message: string;
    contexte: any;
    created_at: string;
  }>
> {
  if (!establishmentId) return [];
  try {
    const { data, error } = await supabase
      .from("vs_alertes")
      .select("id, voyage_id, code, niveau, message, contexte, created_at, vs_voyages!inner(libelle, establishment_id)")
      .eq("resolue", false)
      .eq("vs_voyages.establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.warn("[fetchAlertesActivesEtablissement]", error.message);
      return [];
    }
    return (data || []).map((r: any) => ({
      id: r.id,
      voyage_id: r.voyage_id,
      voyage_libelle: r.vs_voyages?.libelle ?? null,
      code: r.code,
      niveau: r.niveau,
      message: r.message,
      contexte: r.contexte || {},
      created_at: r.created_at,
    }));
  } catch (e: any) {
    console.warn("[fetchAlertesActivesEtablissement] exception:", e?.message || e);
    return [];
  }
}