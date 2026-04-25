// ════════════════════════════════════════════════════════════════
// Synchronisation Voyages → alertes_transverses (cockpit)
// Réf : RLS alertes_transverses prêtes (chantier transverse)
// ════════════════════════════════════════════════════════════════
import { supabase } from "@/integrations/supabase/client";
import type { AlerteVoyage } from "./alertesEngine";

const NIVEAU_MAP: Record<string, "rouge" | "orange" | "jaune" | "info"> = {
  rouge: "rouge",
  orange: "orange",
  bleu: "info",
  vert: "info",
};

export interface PushAlerteTransverseInput {
  establishmentId: string;
  voyageId: string;
  voyageLibelle?: string;
  alertes: AlerteVoyage[];
}

export interface PushAlerteResult {
  inserted: number;
  errors: number;
}

/**
 * Pousse les alertes voyage (rouge/orange) vers alertes_transverses
 * pour remontée dans le cockpit transverse. Utilise la dedup_key pour
 * éviter les doublons.
 */
export async function pushVoyageAlertesTransverses(
  input: PushAlerteTransverseInput,
): Promise<PushAlerteResult> {
  const { establishmentId, voyageId, voyageLibelle, alertes } = input;
  let inserted = 0;
  let errors = 0;

  for (const a of alertes) {
    if (a.niveau !== "rouge" && a.niveau !== "orange") continue;
    const dedupKey = `voyage:${voyageId}:${a.categorie}`;
    const payload = {
      module_origine: "voyages",
      establishment_id: establishmentId,
      niveau: NIVEAU_MAP[a.niveau] ?? "info",
      titre: voyageLibelle ? `[${voyageLibelle}] ${a.titre}` : a.titre,
      description: a.message,
      action_url: `/voyages-v2#${voyageId}`,
      reference_reglementaire: a.reference_legale ?? null,
      dedup_key: dedupKey,
      statut: "ouverte",
    };
    const { error } = await supabase
      .from("alertes_transverses")
      .upsert(payload, { onConflict: "module_origine,establishment_id,dedup_key" });
    if (error) errors += 1;
    else inserted += 1;
  }
  return { inserted, errors };
}

/** Variante stub utilisable hors environnement Supabase (tests). */
export function buildAlerteTransversePayloads(input: PushAlerteTransverseInput) {
  return input.alertes
    .filter((a) => a.niveau === "rouge" || a.niveau === "orange")
    .map((a) => ({
      module_origine: "voyages",
      establishment_id: input.establishmentId,
      niveau: NIVEAU_MAP[a.niveau] ?? "info",
      titre: input.voyageLibelle ? `[${input.voyageLibelle}] ${a.titre}` : a.titre,
      description: a.message,
      action_url: `/voyages-v2#${input.voyageId}`,
      reference_reglementaire: a.reference_legale ?? null,
      dedup_key: `voyage:${input.voyageId}:${a.categorie}`,
      statut: "ouverte",
    }));
}