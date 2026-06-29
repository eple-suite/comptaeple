// Couche services typée (amélioration #3) : tous les accès à la table `agents`
// passent par ici plutôt que par des appels supabase.from dispersés.
// Les erreurs sont normalisées (throw Error) pour être gérées par React Query.

import { supabase } from "@/integrations/supabase/client";

export interface AgentRow {
  id: string;
  nom: string;
  prenom: string;
  corps: string | null;
  grade: string | null;
  role_principal: string | null;
  fonction: string | null;
  statut: string | null;
  date_entree_etablissement: string | null;
  actif: boolean;
  email_professionnel?: string | null;
  telephone_professionnel?: string | null;
  date_naissance?: string | null;
  echelon?: number | null;
  indice_majore?: number | null;
  quotite_travail?: number | null;
  roles_secondaires?: string[] | null;
  administration_origine?: string | null;
  establishment_id: string;
  photo_url?: string | null;
  matricule_education_nationale?: string | null;
  notes_rh?: string | null;
  civilite?: "mme" | "m" | null;
}

/** Liste des agents d'un établissement, triés par nom. */
export async function listAgents(establishmentId: string): Promise<AgentRow[]> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("establishment_id", establishmentId)
    .order("nom");
  if (error) throw new Error(error.message);
  return (data ?? []) as AgentRow[];
}
