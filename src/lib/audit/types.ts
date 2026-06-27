// ───────────────────────────────────────────────────────────────────────────
// Module Audit complet EPLE — modèle métier.
// Architecture : Mission → Domaine → Sous-domaine → Contrôle (fiche métier) →
// Résultat → Risque/Criticité → Recommandation → Plan d'actions → Suivi → Clôture.
// Mutualisé : un seul moteur, un seul référentiel, aucun doublon.
// ───────────────────────────────────────────────────────────────────────────

export type TypeBudget = "EPLE" | "GRETA" | "CFA";

export type NiveauRisque = "faible" | "moyen" | "important" | "critique";

export type ResultatControle =
  | "non_evalue" | "conforme" | "conforme_reserve" | "non_conforme" | "non_verifiable";

/** Criticité calculée (voyant) : 🟢 conforme · 🟡 vigilance · 🟠 important · 🔴 critique. */
export type Criticite = "conforme" | "vigilance" | "important" | "critique";

export interface DomaineDef {
  id: string;
  libelle: string;
  /** Restreint le domaine à certains budgets (ex. GRETA/CFA). Absent = tous. */
  budgets?: TypeBudget[];
}

/** Fiche métier d'un contrôle (référentiel, non saisie). */
export interface ControleDef {
  id: string;
  domaineId: string;
  sousDomaine: string;
  intitule: string;
  objectif: string;
  fondement: string[];          // M9-6, GBCP, CCP, Code éduc., circulaires…
  risque: NiveauRisque;
  documentsAttendus: string[];
  methode: string;              // ce qui est vérifié, comment, avec quelles données
  /** Restreint le contrôle à certains budgets (salaires/vacations CFA-GRETA…). */
  budgets?: TypeBudget[];
  /** Règle de détection automatique d'irrégularité (libellé). */
  alerteAuto?: string;
}

// ───────── Saisie d'une mission ─────────

export interface ControleSaisi {
  resultat: ResultatControle;
  observations?: string;
  recommandation?: string;
  pieces?: { nom: string; url?: string }[];
  majLe?: string;
}

export type EtatAction = "a_faire" | "en_cours" | "fait" | "abandonne";

export interface ActionPlan {
  id: string;
  controleId?: string;
  domaineId?: string;
  libelle: string;
  responsable?: string;
  echeance?: string;
  priorite: NiveauRisque;
  etat: EtatAction;
  commentaire?: string;
  dateCloture?: string;
}

export type StatutMission = "preparation" | "en_cours" | "cloturee" | "archivee";

export interface AuditMission {
  id: string;
  etablissementId: string;
  etablissementNom: string;
  budgetType: TypeBudget;
  campagne: number;             // année
  statut: StatutMission;
  auditeur?: string;
  controles: Record<string, ControleSaisi>;
  actions: ActionPlan[];
  dateDebut: string;
  dateCloture?: string;
  signatureAuditeur?: string;
  visaOrdonnateur?: string;
  majLe?: string;
}

// ───────── Résultats agrégés ─────────

export interface ScoreMission {
  total: number;
  evalues: number;
  conformes: number;
  nonConformes: number;
  reserves: number;
  nonVerifiables: number;
  tauxConformite: number;       // conformes / (évalués applicables)
  progression: number;          // évalués / total
  parCriticite: Record<Criticite, number>;
}

export interface CartographieEntree {
  domaineId: string;
  libelle: string;
  criticite: Criticite;
  nbControles: number;
  nbAnomalies: number;
}
