// Service typé — alertes transverses (amélioration #3, support #15).
import { supabase } from "@/integrations/supabase/client";
import type { AlerteTransverse } from "@/lib/cockpit/types";

/** Alertes ouvertes du groupement (consolidées), des plus récentes. */
export async function listAlertesOuvertes(): Promise<AlerteTransverse[]> {
  const { data, error } = await supabase
    .from("alertes_transverses")
    .select("*")
    .eq("statut", "ouverte")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AlerteTransverse[];
}
