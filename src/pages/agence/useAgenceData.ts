import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment, type Establishment } from "@/contexts/EstablishmentContext";

export interface AgenceEpleRow {
  establishment: Establishment;
  exercice: number | null;
  fdr: number;
  bfr: number;
  tresorerie: number;
  caf: number;
  jours_tresorerie: number;
  jours_autonomie: number;
  resultat_comptable: number;
  taux_exec_charges: number;
  taux_exec_produits: number;
  niveau_risque: "faible" | "modere" | "eleve" | "critique" | "inconnu";
  score_risque: number;
  hasData: boolean;
}

export interface AgenceTotaux {
  nbEple: number;
  nbAvecDonnees: number;
  fdrTotal: number;
  tresorerieTotale: number;
  cafTotale: number;
  resultatTotal: number;
  joursTresorerieMoyen: number;
  nbCritiques: number;
  nbEleves: number;
  nbModeres: number;
  nbFaibles: number;
}

function classerRisque(row: { fdr: number; tresorerie: number; jours_tresorerie: number; resultat_comptable: number }): {
  niveau: AgenceEpleRow["niveau_risque"];
  score: number;
} {
  let score = 0;
  if (row.tresorerie < 0) score += 40;
  else if (row.jours_tresorerie < 30) score += 30;
  else if (row.jours_tresorerie < 60) score += 15;
  if (row.fdr < 0) score += 30;
  else if (row.fdr < 50000) score += 15;
  if (row.resultat_comptable < 0) score += 20;
  if (score >= 60) return { niveau: "critique", score };
  if (score >= 35) return { niveau: "eleve", score };
  if (score >= 15) return { niveau: "modere", score };
  return { niveau: "faible", score };
}

export function useAgenceData() {
  const { user } = useAuth();
  const { establishments, isLoading: loadingEtab } = useEstablishment();

  const { data, isLoading } = useQuery({
    queryKey: ["agence-data", user?.id, establishments.map(e => e.id).join(",")],
    enabled: !!user && establishments.length > 0,
    queryFn: async (): Promise<AgenceEpleRow[]> => {
      const uais = establishments.map(e => e.uai);
      const { data: exercises, error } = await supabase
        .from("cofieple_exercises")
        .select("*")
        .in("uai", uais)
        .order("exercice", { ascending: false });
      if (error) throw error;

      // Garder le dernier exercice par UAI (budget principal de préférence)
      const byUai = new Map<string, typeof exercises[0]>();
      for (const ex of exercises || []) {
        const existing = byUai.get(ex.uai);
        if (!existing) {
          byUai.set(ex.uai, ex);
        } else if (ex.type_budget === "principal" && existing.type_budget !== "principal") {
          byUai.set(ex.uai, ex);
        } else if (ex.exercice > existing.exercice && ex.type_budget === existing.type_budget) {
          byUai.set(ex.uai, ex);
        }
      }

      return establishments.map(est => {
        const ex = byUai.get(est.uai);
        if (!ex) {
          return {
            establishment: est,
            exercice: null,
            fdr: 0, bfr: 0, tresorerie: 0, caf: 0,
            jours_tresorerie: 0, jours_autonomie: 0, resultat_comptable: 0,
            taux_exec_charges: 0, taux_exec_produits: 0,
            niveau_risque: "inconnu" as const,
            score_risque: 0,
            hasData: false,
          };
        }
        const { niveau, score } = classerRisque({
          fdr: Number(ex.fdr) || 0,
          tresorerie: Number(ex.tresorerie) || 0,
          jours_tresorerie: Number(ex.jours_tresorerie) || 0,
          resultat_comptable: Number(ex.resultat_comptable) || 0,
        });
        return {
          establishment: est,
          exercice: ex.exercice,
          fdr: Number(ex.fdr) || 0,
          bfr: Number(ex.bfr) || 0,
          tresorerie: Number(ex.tresorerie) || 0,
          caf: Number(ex.caf) || 0,
          jours_tresorerie: Number(ex.jours_tresorerie) || 0,
          jours_autonomie: Number(ex.jours_autonomie) || 0,
          resultat_comptable: Number(ex.resultat_comptable) || 0,
          taux_exec_charges: Number(ex.taux_exec_charges) || 0,
          taux_exec_produits: Number(ex.taux_exec_produits) || 0,
          niveau_risque: niveau,
          score_risque: score,
          hasData: true,
        };
      });
    },
  });

  const rows = data || [];
  const avecDonnees = rows.filter(r => r.hasData);
  const totaux: AgenceTotaux = {
    nbEple: rows.length,
    nbAvecDonnees: avecDonnees.length,
    fdrTotal: avecDonnees.reduce((s, r) => s + r.fdr, 0),
    tresorerieTotale: avecDonnees.reduce((s, r) => s + r.tresorerie, 0),
    cafTotale: avecDonnees.reduce((s, r) => s + r.caf, 0),
    resultatTotal: avecDonnees.reduce((s, r) => s + r.resultat_comptable, 0),
    joursTresorerieMoyen: avecDonnees.length > 0
      ? avecDonnees.reduce((s, r) => s + r.jours_tresorerie, 0) / avecDonnees.length
      : 0,
    nbCritiques: rows.filter(r => r.niveau_risque === "critique").length,
    nbEleves: rows.filter(r => r.niveau_risque === "eleve").length,
    nbModeres: rows.filter(r => r.niveau_risque === "modere").length,
    nbFaibles: rows.filter(r => r.niveau_risque === "faible").length,
  };

  return {
    rows,
    totaux,
    isLoading: loadingEtab || isLoading,
    isEmpty: !loadingEtab && establishments.length === 0,
  };
}
