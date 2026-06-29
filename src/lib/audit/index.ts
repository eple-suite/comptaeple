// Module Audit complet EPLE — point d'entrée unique (mutualisé, aucun doublon).
export * from "./types";
export {
  DOMAINES, CONTROLES, controlesPourBudget, domaineLabel,
} from "./referentiel";
export {
  criticite, critMeta, scoreMission, cartographie, planActionsAuto, constatAuto,
} from "./engine";
export { useAuditStore } from "./store";
export { genererRapportAudit, genererLettreObservations } from "./rapport";
