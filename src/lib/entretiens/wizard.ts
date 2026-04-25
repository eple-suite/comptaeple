/**
 * Wizard de création d'un entretien professionnel — état & helpers.
 *
 * 7 étapes :
 *  1. Agent & fiche de poste
 *  2. Campagne & période d'observation
 *  3. Convocation (date, lieu, mode)
 *  4. Bilan période N-1 (objectifs passés + texte libre)
 *  5. Compétences (4 rubriques C1-C4) — pré-rempli depuis la fiche de poste
 *  6. Objectifs futurs & formation
 *  7. Récapitulatif & création
 */

import type {
  AgentCategorie,
  AgentFiliere,
  EntretienMode,
  RubriqueC,
  ObjectifAtteinte,
  CompetenceNiveau,
  FormationCategorie,
  FormationPriorite,
} from "./types";

export const WIZARD_STEPS = [
  { id: 1, key: "agent", title: "Agent & fiche de poste", description: "Sélectionnez l'agent évalué et sa fiche de poste de référence." },
  { id: 2, key: "campagne", title: "Campagne & période", description: "Campagne en cours et période d'observation à apprécier." },
  { id: 3, key: "convocation", title: "Convocation", description: "Date, lieu et modalité de l'entretien." },
  { id: 4, key: "bilan", title: "Bilan de la période", description: "Objectifs N-1 et texte libre d'appréciation." },
  { id: 5, key: "competences", title: "Compétences", description: "Évaluation des 4 rubriques C1 à C4." },
  { id: 6, key: "futur", title: "Objectifs & formation", description: "Objectifs N+1 et demandes de formation (T1/T2/T3)." },
  { id: 7, key: "recap", title: "Récapitulatif", description: "Vérifiez et créez le brouillon de l'entretien." },
] as const;

export type WizardStepKey = typeof WIZARD_STEPS[number]["key"];

export interface WizardObjectifPasse {
  libelle: string;
  atteinte: ObjectifAtteinte;
  commentaire: string;
}

export interface WizardObjectifFutur {
  libelle: string;
  indicateur: string;
  echeance: string;
}

export interface WizardCompetence {
  critere: string;
  niveau: CompetenceNiveau;
  commentaire: string;
}

export interface WizardFormationDemande {
  intitule: string;
  categorie: FormationCategorie;
  priorite: FormationPriorite;
}

export interface WizardState {
  /* Étape 1 */
  agent_id: string | null;
  fiche_poste_id: string | null;
  agent_snapshot: {
    nom: string;
    prenom: string;
    corps: string | null;
    grade: string | null;
    categorie: AgentCategorie | null;
    filiere: AgentFiliere | null;
    service: string | null;
    fonction: string | null;
    quotite_travail: number | null;
  } | null;
  fiche_poste_snapshot: {
    intitule: string;
    missions_principales: string | null;
    activites: string | null;
    competences_requises: string | null;
  } | null;

  /* Étape 2 */
  campagne_id: string | null;
  campagne_annee: string;
  periode_debut: string;
  periode_fin: string;

  /* Étape 3 */
  date_convocation: string;
  date_entretien: string;
  duree_entretien_min: number;
  lieu: string;
  mode: EntretienMode;

  /* Étape 4 */
  objectifs_passes: WizardObjectifPasse[];
  texte_libre_appreciation: string;

  /* Étape 5 */
  competences: Record<RubriqueC, WizardCompetence[]>;

  /* Étape 6 */
  objectifs_futurs: WizardObjectifFutur[];
  formations_demandes: WizardFormationDemande[];
  texte_libre_formation: string;

  /* Évaluateur */
  evaluateur_user_id: string | null;
  autorite_n2_user_id: string | null;
}

export const EMPTY_WIZARD_STATE: WizardState = {
  agent_id: null,
  fiche_poste_id: null,
  agent_snapshot: null,
  fiche_poste_snapshot: null,
  campagne_id: null,
  campagne_annee: "",
  periode_debut: "",
  periode_fin: "",
  date_convocation: "",
  date_entretien: "",
  duree_entretien_min: 60,
  lieu: "",
  mode: "presentiel",
  objectifs_passes: [],
  texte_libre_appreciation: "",
  competences: {
    C1_resultats: [],
    C2_competences_techniques: [],
    C3_qualites_personnelles: [],
    C4_encadrement: [],
  },
  objectifs_futurs: [],
  formations_demandes: [],
  texte_libre_formation: "",
  evaluateur_user_id: null,
  autorite_n2_user_id: null,
};

/** Année scolaire courante au format "AAAA-AAAA" (bascule au 1er septembre). */
export function currentAnneeScolaire(today: Date = new Date()): string {
  const y = today.getFullYear();
  const m = today.getMonth() + 1; // 1-12
  if (m >= 9) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

/** Période d'observation par défaut : du 1er septembre N-1 au 31 août N. */
export function defaultPeriodeObservation(annee: string): { debut: string; fin: string } {
  const [y1, y2] = annee.split("-").map(Number);
  if (!y1 || !y2) return { debut: "", fin: "" };
  return { debut: `${y1}-09-01`, fin: `${y2}-08-31` };
}

/** Validation par étape — retourne la liste des erreurs (vide si OK). */
export function validateStep(step: number, s: WizardState): string[] {
  const errs: string[] = [];
  switch (step) {
    case 1:
      if (!s.agent_id) errs.push("Sélectionnez l'agent évalué.");
      break;
    case 2:
      if (!s.campagne_annee) errs.push("Indiquez l'année de la campagne.");
      if (!s.periode_debut || !s.periode_fin) errs.push("Indiquez la période d'observation.");
      if (s.periode_debut && s.periode_fin && s.periode_debut > s.periode_fin) {
        errs.push("La date de début doit précéder la date de fin.");
      }
      break;
    case 3:
      if (!s.date_convocation) errs.push("Indiquez la date d'envoi de la convocation.");
      if (!s.date_entretien) errs.push("Indiquez la date prévue de l'entretien.");
      if (s.date_convocation && s.date_entretien) {
        const d1 = new Date(s.date_convocation);
        const d2 = new Date(s.date_entretien);
        const diff = Math.round((+d2 - +d1) / (1000 * 60 * 60 * 24));
        if (diff < 8) errs.push("Délai réglementaire : au moins 8 jours entre la convocation et l'entretien.");
      }
      if (!s.lieu) errs.push("Précisez le lieu (ou la modalité visio).");
      break;
    case 4:
      // Optionnel : autoriser un brouillon vide
      break;
    case 5:
      // Optionnel à ce stade — la grille sera affinée pendant la conduite
      break;
    case 6:
      // Optionnel
      break;
    case 7:
      if (!s.agent_id || !s.campagne_annee) errs.push("État incomplet — revenez aux étapes précédentes.");
      break;
  }
  return errs;
}

/** Pré-remplit la grille de compétences depuis les sous-critères réglementaires + fiche de poste. */
export function buildCompetencesFromFichePoste(
  base: Record<RubriqueC, string[]>,
  ficheCompetencesRequises: string | null | undefined
): Record<RubriqueC, WizardCompetence[]> {
  const out = {} as Record<RubriqueC, WizardCompetence[]>;
  (Object.keys(base) as RubriqueC[]).forEach((k) => {
    out[k] = base[k].map((c) => ({
      critere: c,
      niveau: "satisfaisant" as CompetenceNiveau,
      commentaire: "",
    }));
  });
  if (ficheCompetencesRequises && ficheCompetencesRequises.trim()) {
    // Ajoute jusqu'à 3 compétences spécifiques à la fiche en C2
    const lines = ficheCompetencesRequises
      .split(/[\n;•·]/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 3)
      .slice(0, 3);
    for (const l of lines) {
      out.C2_competences_techniques.push({
        critere: `[Fiche de poste] ${l}`,
        niveau: "satisfaisant",
        commentaire: "",
      });
    }
  }
  return out;
}