/**
 * Seuils réglementaires DAF / M9-6 utilisés par les KPI cockpit.
 * Sources :
 *  - M9-6 tome 4 art. 43231 (FDR / jours)
 *  - M9-6 pièce 14 (trésorerie en jours)
 *  - DAF A3 (créances non recouvrées)
 *  - AUDITAC AJI (https://aji-france.com/uploads/media/blog/0001/02/db289db59b0a1fb9fde060be6e92ac2c593f69ff.pdf)
 */
import type { NiveauAlerte } from './types';

export const SEUILS_TRESORERIE_JOURS = { rouge: 15, orange: 30, jaune: 60 };
export const SEUILS_FDR_JOURS = { rouge: 15, orange: 30, jaune: 60, bleu: 120 };
export const SEUILS_CREANCES_PCT = { orange: 3, rouge: 5 };
export const SEUILS_CICF = { rouge: 40, orange: 60, jaune: 75, vert: 90 };

export function niveauTresorerie(jours: number): NiveauAlerte {
  if (jours < SEUILS_TRESORERIE_JOURS.rouge) return 'rouge';
  if (jours < SEUILS_TRESORERIE_JOURS.orange) return 'orange';
  if (jours < SEUILS_TRESORERIE_JOURS.jaune) return 'jaune';
  return 'info';
}

export function niveauFdr(jours: number): NiveauAlerte {
  if (jours < SEUILS_FDR_JOURS.rouge) return 'rouge';
  if (jours < SEUILS_FDR_JOURS.orange) return 'orange';
  if (jours < SEUILS_FDR_JOURS.jaune) return 'jaune';
  if (jours > SEUILS_FDR_JOURS.bleu) return 'info';
  return 'info';
}

export function niveauCreances(pct: number): NiveauAlerte {
  if (pct >= SEUILS_CREANCES_PCT.rouge) return 'rouge';
  if (pct >= SEUILS_CREANCES_PCT.orange) return 'orange';
  return 'info';
}

export function niveauCICF(score: number): NiveauAlerte | 'success' {
  if (score < SEUILS_CICF.rouge) return 'rouge';
  if (score < SEUILS_CICF.orange) return 'orange';
  if (score < SEUILS_CICF.jaune) return 'jaune';
  if (score < SEUILS_CICF.vert) return 'info';
  return 'success';
}

export function niveauEcheance(joursRestants: number): NiveauAlerte {
  if (joursRestants < 7) return 'rouge';
  if (joursRestants < 15) return 'orange';
  if (joursRestants < 30) return 'jaune';
  return 'info';
}
