import { useMemo } from "react";
import type { HyperaleIndicators } from "@/pages/hyperale/useHyperaleData";
import type { Suggestion } from "./SuggestionsPanel";

export interface HyperaleScore {
  scoreSante: number;
  niveauGlobal: "excellent" | "satisfaisant" | "surveiller" | "critique";
  resumeStoryteller: string;
  alertesCount: number;
  suggestions: Suggestion[];
}

/**
 * Compute a global financial health score (0-100) from HYPER@LE indicators.
 * Includes proactive AI-style suggestions based on detected patterns.
 */
export function useHyperaleScore(data: HyperaleIndicators, etabName: string): HyperaleScore {
  return useMemo(() => {
    let score = 50;
    const suggestions: Suggestion[] = [];

    // FDR scoring (max +25)
    if (data.fdr < 0) score -= 20;
    else if (data.fdrJours < 15) score -= 12;
    else if (data.fdrJours < 30) score -= 5;
    else if (data.fdrJours >= 60) score += 18;
    else if (data.fdrJours >= 30) score += 12;

    // Trésorerie scoring (max +20)
    if (data.tresorerie < 0) score -= 15;
    else if (data.tresorerieJours < 10) score -= 8;
    else if (data.tresorerieJours < 20) score -= 3;
    else if (data.tresorerieJours >= 40) score += 15;
    else if (data.tresorerieJours >= 20) score += 8;

    // CAF scoring (max +15)
    if (data.caf < 0) score -= 10;
    else if (data.caf > 50000) score += 12;
    else score += 5;

    // Résultat comptable (max +10)
    if (data.resultatComptable < -5000) score -= 8;
    else if (data.resultatComptable > 5000) score += 8;

    // Taux d'exécution (max +10)
    if (data.tauxExecCharges >= 90 && data.tauxExecCharges <= 98) score += 8;
    else if (data.tauxExecCharges < 80) score -= 5;

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Niveau global
    let niveauGlobal: HyperaleScore["niveauGlobal"];
    if (score >= 75) niveauGlobal = "excellent";
    else if (score >= 55) niveauGlobal = "satisfaisant";
    else if (score >= 35) niveauGlobal = "surveiller";
    else niveauGlobal = "critique";

    // Storyteller summary
    const fmt = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
    let resumeStoryteller = "";
    if (niveauGlobal === "excellent") {
      resumeStoryteller = `${etabName} affiche une situation financière solide : FDR de ${fmt(data.fdr)} (${data.fdrJours.toFixed(0)} j d'autonomie), trésorerie confortable et exploitation excédentaire. Conditions idéales pour engager des projets pluriannuels.`;
    } else if (niveauGlobal === "satisfaisant") {
      resumeStoryteller = `${etabName} dispose d'une assise financière correcte avec ${fmt(data.fdr)} de FDR et ${data.tresorerieJours.toFixed(0)} jours de trésorerie. Quelques optimisations recommandées pour sécuriser durablement la situation.`;
    } else if (niveauGlobal === "surveiller") {
      resumeStoryteller = `Vigilance requise pour ${etabName} : le FDR (${fmt(data.fdr)}) ne couvre que ${data.fdrJours.toFixed(0)} jours et la trésorerie tend à se contracter. Il convient d'anticiper un plan de redressement.`;
    } else {
      resumeStoryteller = `Situation préoccupante pour ${etabName} : FDR à ${fmt(data.fdr)}, trésorerie à ${fmt(data.tresorerie)}. Une action corrective immédiate est nécessaire pour rétablir l'équilibre financier.`;
    }

    // Proactive suggestions
    if (data.fdr < 0 || data.fdrJours < 30) {
      suggestions.push({
        id: "fdr-low",
        label: "Renforcer le fonds de roulement",
        description: `FDR insuffisant (${data.fdrJours.toFixed(0)} j). Consultez l'analyse détaillée pour les leviers.`,
        to: "/hyperale/analyse",
        severity: data.fdr < 0 ? "critical" : "warning",
      });
    }
    if (data.tresorerie < 0 || data.tresorerieJours < 15) {
      suggestions.push({
        id: "treso-low",
        label: "Plan de trésorerie urgent",
        description: `Trésorerie à ${data.tresorerieJours.toFixed(0)} j. Anticipez les échéances de paiement.`,
        to: "/hyperale/analyse",
        severity: data.tresorerie < 0 ? "critical" : "warning",
      });
    }
    if (data.caf < 0) {
      suggestions.push({
        id: "caf-neg",
        label: "Améliorer la CAF",
        description: "L'exploitation ne dégage pas assez de ressources. Demandez à l'IA un diagnostic.",
        to: "/hyperale/assistant",
        severity: "warning",
      });
    }
    if (!data.hasData) {
      suggestions.push({
        id: "no-data",
        label: "Importer une balance Op@le",
        description: "Activez l'analyse réelle en chargeant vos fichiers ECBU/SDE/SDR.",
        to: "/hyperale/import",
        severity: "info",
      });
    }
    if (data.tauxExecCharges > 0 && data.tauxExecCharges < 85) {
      suggestions.push({
        id: "exec-low",
        label: "Taux d'exécution faible",
        description: `Charges exécutées à ${data.tauxExecCharges.toFixed(1)}%. Revoyez les prévisions.`,
        to: "/hyperale/journal",
        severity: "info",
      });
    }
    if (suggestions.length === 0 && data.hasData) {
      suggestions.push({
        id: "ok",
        label: "Approfondir l'analyse",
        description: "Tout va bien. Explorez les comparaisons avec les moyennes nationales.",
        to: "/hyperale/analyse",
        severity: "info",
      });
    }

    return { scoreSante: score, niveauGlobal, resumeStoryteller, alertesCount: data.alertes.filter(a => a.severity !== "info").length, suggestions };
  }, [data, etabName]);
}
