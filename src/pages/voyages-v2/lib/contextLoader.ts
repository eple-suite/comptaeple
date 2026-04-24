// ════════════════════════════════════════════════════════════════
// Chargeur DocxBuildContext depuis un voyage RÉEL en base
// ────────────────────────────────────────────────────────────────
// Récupère vs_voyages + vs_recettes + vs_depenses + vs_participants
// et mappe vers le contexte attendu par le générateur 32 docs.
// 100% tolérant aux champs absents (fallback "(à compléter)").
// ════════════════════════════════════════════════════════════════
import { supabase } from "@/integrations/supabase/client";
import type { DocxBuildContext } from "./docxBuilder";

export interface EtablissementBrief {
  id: string;
  name?: string | null;
  uai?: string | null;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  chef_etab?: string | null;
  agent_comptable?: string | null;
}

export interface VoyageBrief {
  id: string;
  libelle: string | null;
  reference_interne: string | null;
  destination_ville: string | null;
  destination_pays: string | null;
  date_depart: string | null;
  date_retour: string | null;
  nb_eleves_prevus: number | null;
  statut: string | null;
  wizard_completed: boolean | null;
  updated_at: string | null;
}

const FALLBACK = "(à compléter)";
const s = (v: any): string => (v === null || v === undefined || v === "" ? FALLBACK : String(v));
const sNullable = (v: any): string | null => (v === null || v === undefined || v === "" ? null : String(v));
const num = (v: any): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Liste les voyages d'un établissement (pour sélection avant génération).
 */
export async function listerVoyagesEtablissement(establishmentId: string): Promise<VoyageBrief[]> {
  if (!establishmentId) return [];
  const { data, error } = await supabase
    .from("vs_voyages")
    .select("id, libelle, reference_interne, destination_ville, destination_pays, date_depart, date_retour, nb_eleves_prevus, statut, wizard_completed, updated_at")
    .eq("establishment_id", establishmentId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[listerVoyagesEtablissement]", error);
    return [];
  }
  return (data || []) as VoyageBrief[];
}

/**
 * Construit un DocxBuildContext complet à partir d'un voyageId réel.
 * Retourne null si le voyage est introuvable.
 */
export async function loadVoyageContext(
  voyageId: string,
  etab: EtablissementBrief,
): Promise<DocxBuildContext | null> {
  if (!voyageId) return null;

  // 1) Voyage
  const { data: voyage, error: errV } = await supabase
    .from("vs_voyages")
    .select("*")
    .eq("id", voyageId)
    .maybeSingle();

  if (errV || !voyage) {
    console.error("[loadVoyageContext] voyage introuvable", errV);
    return null;
  }

  // 2) Recettes / dépenses / participants — en parallèle, tolérant aux erreurs
  const [recRes, depRes, parRes] = await Promise.all([
    supabase.from("vs_recettes").select("*").eq("voyage_id", voyageId),
    supabase.from("vs_depenses").select("*").eq("voyage_id", voyageId),
    supabase.from("vs_participants").select("*").eq("voyage_id", voyageId).then(
      (r: any) => r,
      (e: any) => ({ data: [], error: e }),
    ),
  ]);

  if (recRes.error) console.warn("[loadVoyageContext] recettes:", recRes.error.message);
  if (depRes.error) console.warn("[loadVoyageContext] depenses:", depRes.error.message);

  const recettes = (recRes.data || []).map((r: any) => ({
    libelle: s(r.libelle),
    nature: r.nature || "famille",
    montant: num(r.montant),
    statut_financeur: r.statut_financeur || "hypothese",
    imputation_compte: r.imputation_compte || "",
  }));

  const depenses = (depRes.data || []).map((d: any) => ({
    libelle: s(d.libelle),
    poste: d.poste || "divers",
    fournisseur: d.fournisseur || "",
    montant_ht: num(d.montant_ht),
    montant_ttc: num(d.montant_ttc) || num(d.montant_ht),
    compte_charge: d.compte_charge || "",
    est_accompagnateur: !!d.est_accompagnateur,
  }));

  const participants = ((parRes as any)?.data || []).map((p: any) => ({
    nom: s(p.nom),
    prenom: s(p.prenom),
    classe: p.classe || "",
    boursier: !!p.boursier,
    participation_theorique: num(p.participation_theorique),
    participation_reelle: num(p.participation_reelle),
    reste_a_payer: num(p.reste_a_payer),
  }));

  // 3) Adresse établissement consolidée
  const adresseParts = [etab.address, etab.zip_code, etab.city].filter(Boolean);
  const adresse = adresseParts.length ? adresseParts.join(" ") : undefined;

  const ctx: DocxBuildContext = {
    voyage: {
      libelle: s(voyage.libelle),
      reference_interne: s(voyage.reference_interne),
      destination_ville: s(voyage.destination_ville),
      destination_pays: s(voyage.destination_pays),
      date_depart: voyage.date_depart || null,
      date_retour: voyage.date_retour || null,
      nombre_nuitees: num(voyage.nombre_nuitees),
      type_projet: voyage.type_projet || undefined,
      classes_concernees: Array.isArray(voyage.classes_concernees)
        ? (voyage.classes_concernees as any[]).map((c) => String(c))
        : [],
      nb_eleves_prevus: num(voyage.nb_eleves_prevus),
      nb_accompagnateurs_prevus: num(voyage.nb_accompagnateurs_prevus),
      responsable_pedago_nom: voyage.responsable_pedago_nom || FALLBACK,
      lien_projet_etablissement: voyage.lien_projet_etablissement || "",
      montant_total_ttc: num(voyage.montant_total_ttc),
      devise: voyage.devise || "EUR",
      agence_nom: sNullable(voyage.agence_nom),
      agence_siret: sNullable(voyage.agence_siret),
      agence_garantie: sNullable(voyage.agence_garantie),
      date_ca_autorisation: voyage.date_ca_autorisation || null,
      numero_acte_ca: sNullable(voyage.numero_acte_ca),
      erasmus_convention_ref: sNullable(voyage.erasmus_convention_ref),
      erasmus_subvention_notifiee: num(voyage.erasmus_subvention_notifiee),
    },
    etablissement: {
      nom: etab.name || FALLBACK,
      uai: etab.uai || undefined,
      adresse,
      chef_etab: etab.chef_etab || "Le chef d'établissement",
      agent_comptable: etab.agent_comptable || "L'agent comptable",
    },
    recettes,
    depenses,
    participants,
    meta: {
      date_generation: new Date().toLocaleDateString("fr-FR"),
      auteur: "ComptaEPLE",
    },
  };

  return ctx;
}

export function libelleVoyage(v: VoyageBrief): string {
  const dest = [v.destination_ville, v.destination_pays].filter(Boolean).join(", ");
  const date = v.date_depart ? ` — ${new Date(v.date_depart).toLocaleDateString("fr-FR")}` : "";
  return `${v.libelle || "(sans titre)"}${dest ? ` — ${dest}` : ""}${date}`;
}
