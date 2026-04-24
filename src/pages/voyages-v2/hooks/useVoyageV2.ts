// ════════════════════════════════════════════════════════════════
// Hook CRUD voyages-v2 — persistance Supabase + draft local
// ════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Voyage, VoyageRecette, VoyageDepense } from "../types";

export type VoyageDraft = Partial<Voyage> & { wizard_step: number };

const EMPTY_DRAFT: VoyageDraft = {
  reference_interne: "",
  libelle: "",
  destination_ville: "",
  destination_pays: "France",
  type_sortie: "voyage_nuitees",
  caractere: "facultatif",
  type_projet: "cle_en_main",
  date_depart: null,
  date_retour: null,
  nombre_nuitees: 0,
  classes_concernees: [],
  nb_eleves_prevus: 0,
  nb_accompagnateurs_prevus: 0,
  responsable_pedago_nom: "",
  lien_projet_etablissement: "",
  rattachement_adage: false,
  statut: "projet",
  date_ca_principe: null,
  numero_acte_ca_principe: "",
  date_ca_budget: null,
  numero_acte_ca_budget: "",
  montant_total_ht: 0,
  montant_total_ttc: 0,
  devise: "EUR",
  conditions_annulation: [],
  erasmus_subvention_notifiee: 0,
  erasmus_avance_recue: 0,
  erasmus_taux_cofi: 0,
  tags_pedago: [],
  wizard_step: 1,
  wizard_completed: false,
};

export function useVoyageDraft(initial?: Partial<Voyage>) {
  const [draft, setDraft] = useState<VoyageDraft>({ ...EMPTY_DRAFT, ...initial });

  const update = useCallback(<K extends keyof VoyageDraft>(key: K, value: VoyageDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMany = useCallback((patch: Partial<VoyageDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setDraft({ ...EMPTY_DRAFT }), []);

  return { draft, update, updateMany, reset, setDraft };
}

export interface SaveOptions {
  establishment_id: string;
  user_id: string;
  voyageId?: string;
  recettes?: Partial<VoyageRecette>[];
  depenses?: Partial<VoyageDepense>[];
}

/**
 * Sauvegarde le voyage en base. Crée si voyageId absent, sinon met à jour.
 * Retourne l'id du voyage sauvegardé, ou null si échec.
 */
export async function saveVoyage(draft: VoyageDraft, opts: SaveOptions): Promise<string | null> {
  try {
    const payload: any = {
      establishment_id: opts.establishment_id,
      user_id: opts.user_id,
      reference_interne: draft.reference_interne || autoReference(),
      libelle: draft.libelle || "Voyage sans titre",
      destination_ville: draft.destination_ville || "",
      destination_pays: draft.destination_pays || "France",
      type_sortie: draft.type_sortie || "voyage_nuitees",
      caractere: draft.caractere || "facultatif",
      type_projet: draft.type_projet || "cle_en_main",
      date_depart: draft.date_depart || null,
      date_retour: draft.date_retour || null,
      nombre_nuitees: Number(draft.nombre_nuitees) || 0,
      classes_concernees: draft.classes_concernees || [],
      nb_eleves_prevus: Number(draft.nb_eleves_prevus) || 0,
      nb_accompagnateurs_prevus: Number(draft.nb_accompagnateurs_prevus) || 0,
      responsable_pedago_nom: draft.responsable_pedago_nom || "",
      lien_projet_etablissement: draft.lien_projet_etablissement || "",
      rattachement_adage: !!draft.rattachement_adage,
      statut: draft.statut || "projet",
      date_ca_autorisation: draft.date_ca_autorisation || null,
      numero_acte_ca: draft.numero_acte_ca ?? null,
      date_ca_principe: draft.date_ca_principe || null,
      numero_acte_ca_principe: draft.numero_acte_ca_principe ?? null,
      date_ca_budget: draft.date_ca_budget || null,
      numero_acte_ca_budget: draft.numero_acte_ca_budget ?? null,
      montant_total_ht: Number(draft.montant_total_ht) || 0,
      montant_total_ttc: Number(draft.montant_total_ttc) || 0,
      devise: draft.devise || "EUR",
      agence_nom: draft.agence_nom ?? null,
      agence_siret: draft.agence_siret ?? null,
      agence_garantie: draft.agence_garantie ?? null,
      conditions_annulation: draft.conditions_annulation || [],
      erasmus_type: draft.erasmus_type ?? null,
      erasmus_convention_ref: draft.erasmus_convention_ref ?? null,
      erasmus_subvention_notifiee: Number(draft.erasmus_subvention_notifiee) || 0,
      erasmus_avance_recue: Number(draft.erasmus_avance_recue) || 0,
      erasmus_periode_debut: draft.erasmus_periode_debut || null,
      erasmus_periode_fin: draft.erasmus_periode_fin || null,
      erasmus_taux_cofi: Number(draft.erasmus_taux_cofi) || 0,
      tags_pedago: draft.tags_pedago || [],
      wizard_step: Number(draft.wizard_step) || 1,
      wizard_completed: !!draft.wizard_completed,
    };

    let voyageId = opts.voyageId;
    if (voyageId) {
      const { error } = await supabase.from("vs_voyages").update(payload).eq("id", voyageId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("vs_voyages")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      voyageId = data?.id;
    }

    if (!voyageId) throw new Error("Impossible de récupérer l'ID du voyage");

    // Recettes : remplacement intégral si fourni
    if (opts.recettes && opts.recettes.length > 0) {
      await supabase.from("vs_recettes").delete().eq("voyage_id", voyageId);
      const rows = opts.recettes
        .filter((r) => (r.libelle || "").trim().length > 0)
        .map((r) => ({
          voyage_id: voyageId!,
          libelle: r.libelle!,
          nature: r.nature || "famille",
          montant: Number(r.montant) || 0,
          statut_financeur: r.statut_financeur || "hypothese",
          imputation_compte: r.imputation_compte || "",
          observations: r.observations || "",
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("vs_recettes").insert(rows);
        if (error) throw error;
      }
    }

    // Dépenses : remplacement intégral si fourni
    if (opts.depenses && opts.depenses.length > 0) {
      await supabase.from("vs_depenses").delete().eq("voyage_id", voyageId);
      const rows = opts.depenses
        .filter((d) => (d.libelle || "").trim().length > 0)
        .map((d) => ({
          voyage_id: voyageId!,
          poste: d.poste || "transport",
          libelle: d.libelle!,
          fournisseur: d.fournisseur || "",
          montant_ht: Number(d.montant_ht) || 0,
          taux_tva: Number(d.taux_tva) || 0,
          montant_ttc: Number(d.montant_ttc) || Number(d.montant_ht) || 0,
          compte_charge: d.compte_charge || "",
          est_accompagnateur: !!d.est_accompagnateur,
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("vs_depenses").insert(rows);
        if (error) throw error;
      }
    }

    return voyageId;
  } catch (err: any) {
    console.error("[saveVoyage] error", err);
    toast.error(`Sauvegarde impossible : ${err?.message || "erreur inconnue"}`);
    return null;
  }
}

function autoReference(): string {
  const now = new Date();
  return `VS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
}

/** Liste les voyages d'un établissement. */
export function useVoyagesList(establishmentId: string | null) {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!establishmentId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("vs_voyages")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[useVoyagesList]", error);
      toast.error("Impossible de charger les voyages");
    } else {
      setVoyages((data || []) as unknown as Voyage[]);
    }
    setLoading(false);
  }, [establishmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { voyages, loading, refresh };
}