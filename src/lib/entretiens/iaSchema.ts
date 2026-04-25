/**
 * Validateur du JSON retourné par l'edge function de répartition IA.
 * Garantit que la réponse Claude est exploitable avant injection en base.
 */

import type { IaRepartitionResponse, RubriqueC } from "./types";

const RUBRIQUES: RubriqueC[] = [
  "C1_resultats",
  "C2_competences_techniques",
  "C3_qualites_personnelles",
  "C4_encadrement",
];

const NIVEAUX_VALIDES = new Set([
  "excellent",
  "tres_bon",
  "satisfaisant",
  "a_developper",
  "insuffisant",
  "sans_objet",
]);

const CONFIANCE_VALIDES = new Set(["eleve", "moyen", "faible"]);
const ATTEINTE_VALIDES = new Set([
  "atteint",
  "partiellement_atteint",
  "non_atteint",
  "sans_objet",
]);
const CATEGORIES_VALIDES = new Set(["T1", "T2", "T3"]);
const PRIORITES_VALIDES = new Set(["haute", "moyenne", "basse"]);
const FONDEMENTS_VALIDES = new Set(["agent", "evaluateur", "consensuelle"]);

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  data?: IaRepartitionResponse;
}

export function validateIaResponse(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Réponse non-objet"] };
  }
  const r = raw as Record<string, unknown>;

  // competences
  if (!r.competences || typeof r.competences !== "object") {
    errors.push("`competences` manquant");
  } else {
    const comp = r.competences as Record<string, unknown>;
    for (const rub of RUBRIQUES) {
      if (!comp[rub]) {
        errors.push(`Rubrique manquante : ${rub}`);
        continue;
      }
      const sect = comp[rub] as Record<string, unknown>;
      if (typeof sect.synthese !== "string") {
        errors.push(`${rub}.synthese manquant`);
      }
      if (!Array.isArray(sect.sous_criteres)) {
        errors.push(`${rub}.sous_criteres manquant`);
      } else {
        sect.sous_criteres.forEach((sc: any, i: number) => {
          if (typeof sc.critere !== "string") errors.push(`${rub}[${i}].critere manquant`);
          if (sc.niveau && !NIVEAUX_VALIDES.has(sc.niveau)) {
            errors.push(`${rub}[${i}].niveau invalide : ${sc.niveau}`);
          }
          if (sc.confiance && !CONFIANCE_VALIDES.has(sc.confiance)) {
            errors.push(`${rub}[${i}].confiance invalide : ${sc.confiance}`);
          }
        });
      }
    }
  }

  // objectifs_passes
  if (!Array.isArray(r.objectifs_passes)) {
    errors.push("`objectifs_passes` doit être un tableau");
  } else {
    r.objectifs_passes.forEach((op: any, i: number) => {
      if (typeof op.libelle !== "string") errors.push(`objectifs_passes[${i}].libelle manquant`);
      if (op.atteinte && !ATTEINTE_VALIDES.has(op.atteinte)) {
        errors.push(`objectifs_passes[${i}].atteinte invalide`);
      }
    });
  }

  // appreciation_generale
  if (typeof r.appreciation_generale !== "string") {
    errors.push("`appreciation_generale` doit être une chaîne");
  }

  // perspectives
  if (typeof r.perspectives !== "string") {
    errors.push("`perspectives` doit être une chaîne");
  }

  // formation
  if (!r.formation || typeof r.formation !== "object") {
    errors.push("`formation` manquant");
  } else {
    const f = r.formation as Record<string, unknown>;
    if (!Array.isArray(f.demandes)) {
      errors.push("`formation.demandes` doit être un tableau");
    } else {
      f.demandes.forEach((d: any, i: number) => {
        if (d.categorie && !CATEGORIES_VALIDES.has(d.categorie)) {
          errors.push(`formation.demandes[${i}].categorie invalide`);
        }
        if (d.priorite && !PRIORITES_VALIDES.has(d.priorite)) {
          errors.push(`formation.demandes[${i}].priorite invalide`);
        }
        if (d.fondement && !FONDEMENTS_VALIDES.has(d.fondement)) {
          errors.push(`formation.demandes[${i}].fondement invalide`);
        }
      });
    }
  }

  // elements_a_retirer
  if (!Array.isArray(r.elements_a_retirer)) {
    errors.push("`elements_a_retirer` doit être un tableau");
  }

  // score_completude
  if (typeof r.score_completude !== "number" || r.score_completude < 0 || r.score_completude > 1) {
    errors.push("`score_completude` doit être un nombre entre 0 et 1");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, errors: [], data: raw as IaRepartitionResponse };
}

/** Calcule le score de complétude à partir des sous-critères renseignés. */
export function computeCompletenessScore(data: IaRepartitionResponse): number {
  let totalChamps = 0;
  let renseignes = 0;

  for (const rub of RUBRIQUES) {
    const sect = data.competences?.[rub];
    if (!sect) continue;
    sect.sous_criteres.forEach((sc) => {
      totalChamps++;
      if (sc.niveau && sc.niveau !== "sans_objet" && sc.commentaire?.trim()) {
        renseignes++;
      }
    });
  }
  totalChamps += 4; // appréciation, perspectives, objectifs futurs, formation
  if (data.appreciation_generale?.trim()) renseignes++;
  if (data.perspectives?.trim()) renseignes++;
  if (data.objectifs_futurs_suggeres?.length > 0) renseignes++;
  if (data.formation?.demandes?.length > 0 || data.formation?.bilan_periode?.length > 0) {
    renseignes++;
  }

  return totalChamps === 0 ? 0 : Math.round((renseignes / totalChamps) * 100) / 100;
}