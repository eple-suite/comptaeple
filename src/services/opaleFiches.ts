// Couche services typée pour les fiches Op@le (amélioration #3).
import { supabase } from "@/integrations/supabase/client";
import type { OpaleFiche } from "@/lib/opale/types";

/** Fiches publiées (bibliothèque publique), des plus récentes, plafonnées à 200. */
export async function listFichesPubliees(): Promise<OpaleFiche[]> {
  const { data, error } = await supabase
    .from("opale_fiches")
    .select("*")
    .eq("statut_publication", "publiee")
    .order("date_publication", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OpaleFiche[];
}

/** Fiches de l'utilisateur courant (toutes statuts), de la plus récemment modifiée. */
export async function listMesFiches(): Promise<OpaleFiche[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("opale_fiches")
    .select("*")
    .eq("auteur_id", user.id)
    .order("date_maj", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OpaleFiche[];
}
