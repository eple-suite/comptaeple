// Moteur d'audit — criticité, scoring, cartographie, plan d'actions. Source unique.

import type {
  AuditMission, ControleSaisi, Criticite, NiveauRisque, ResultatControle,
  ScoreMission, CartographieEntree, ActionPlan,
} from "./types";
import { CONTROLES, DOMAINES, controlesPourBudget, domaineLabel } from "./referentiel";

const ORDRE_CRIT: Criticite[] = ["conforme", "vigilance", "important", "critique"];

/** Criticité (voyant) à partir du résultat et du niveau de risque du contrôle. */
export function criticite(resultat: ResultatControle, risque: NiveauRisque): Criticite {
  if (resultat === "conforme" || resultat === "non_evalue") return "conforme";
  if (resultat === "non_verifiable") return "vigilance";
  if (resultat === "conforme_reserve") return risque === "critique" || risque === "important" ? "important" : "vigilance";
  // non_conforme : escalade selon le risque
  if (risque === "critique") return "critique";
  if (risque === "important" || risque === "moyen") return "important";
  return "vigilance";
}

const CRIT_META: Record<Criticite, { label: string; emoji: string; classe: string }> = {
  conforme: { label: "Conforme", emoji: "🟢", classe: "text-success" },
  vigilance: { label: "Vigilance", emoji: "🟡", classe: "text-warning" },
  important: { label: "Important", emoji: "🟠", classe: "text-orange-500" },
  critique: { label: "Critique", emoji: "🔴", classe: "text-destructive" },
};
export const critMeta = (c: Criticite) => CRIT_META[c];

const def = (id: string) => CONTROLES.find((x) => x.id === id);

export function scoreMission(mission: AuditMission): ScoreMission {
  const applicables = controlesPourBudget(mission.budgetType);
  const total = applicables.length;
  const parCriticite: Record<Criticite, number> = { conforme: 0, vigilance: 0, important: 0, critique: 0 };
  let evalues = 0, conformes = 0, nonConformes = 0, reserves = 0, nonVerifiables = 0;
  for (const ctrl of applicables) {
    const s = mission.controles[ctrl.id];
    if (!s || s.resultat === "non_evalue") continue;
    evalues++;
    if (s.resultat === "conforme") conformes++;
    else if (s.resultat === "non_conforme") nonConformes++;
    else if (s.resultat === "conforme_reserve") reserves++;
    else if (s.resultat === "non_verifiable") nonVerifiables++;
    parCriticite[criticite(s.resultat, ctrl.risque)]++;
  }
  const applicablesEval = conformes + reserves + nonConformes; // hors non vérifiable
  return {
    total, evalues, conformes, nonConformes, reserves, nonVerifiables,
    tauxConformite: applicablesEval ? (conformes / applicablesEval) * 100 : 0,
    progression: total ? (evalues / total) * 100 : 0,
    parCriticite,
  };
}

/** Cartographie des risques par domaine (pire criticité constatée). */
export function cartographie(mission: AuditMission): CartographieEntree[] {
  const applicables = controlesPourBudget(mission.budgetType);
  const domaines = DOMAINES.filter((d) => applicables.some((ct) => ct.domaineId === d.id));
  return domaines.map((d) => {
    const ctrls = applicables.filter((ct) => ct.domaineId === d.id);
    let pire: Criticite = "conforme";
    let nbAnomalies = 0;
    for (const ct of ctrls) {
      const s = mission.controles[ct.id];
      if (!s || s.resultat === "non_evalue") continue;
      const cr = criticite(s.resultat, ct.risque);
      if (ORDRE_CRIT.indexOf(cr) > ORDRE_CRIT.indexOf(pire)) pire = cr;
      if (s.resultat === "non_conforme" || s.resultat === "conforme_reserve") nbAnomalies++;
    }
    return { domaineId: d.id, libelle: d.libelle, criticite: pire, nbControles: ctrls.length, nbAnomalies };
  });
}

/** Génère le plan d'actions à partir des contrôles non conformes / avec réserve. */
export function planActionsAuto(mission: AuditMission): ActionPlan[] {
  const out: ActionPlan[] = [];
  for (const [id, s] of Object.entries(mission.controles)) {
    if (s.resultat !== "non_conforme" && s.resultat !== "conforme_reserve") continue;
    const d = def(id);
    if (!d) continue;
    out.push({
      id: `act-${id}`,
      controleId: id,
      domaineId: d.domaineId,
      libelle: s.recommandation?.trim() || `Corriger : ${d.intitule}`,
      priorite: d.risque,
      etat: "a_faire",
    });
  }
  return out;
}

/** Constat IA déterministe (assistance, modifiable) pour un contrôle non conforme. */
export function constatAuto(controleId: string, resultat: ResultatControle): string {
  const d = def(controleId);
  if (!d) return "";
  if (resultat === "conforme") return `${d.intitule} : conforme.`;
  const gravite = d.risque === "critique" ? "critique" : d.risque === "important" ? "important" : "à surveiller";
  return `Constat : ${d.intitule.toLowerCase()} — anomalie ${gravite}. ${d.alerteAuto ?? ""} `
    + `Risque : ${d.objectif} Recommandation : mettre en conformité au regard de ${d.fondement.join(", ")}.`;
}

export { domaineLabel };
