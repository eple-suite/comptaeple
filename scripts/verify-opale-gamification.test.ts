import { describe, it, expect } from "vitest";
import {
  calculerScoreContributeur,
  determinerBadges,
  fichesAReverifier,
  OPALE_BADGES,
} from "../src/lib/opale/gamification";

describe("Op@le — Gamification", () => {
  it("calcule le score contributeur selon la grille", () => {
    const score = calculerScoreContributeur({
      nb_fiches_publiees: 5,
      nb_questions_repondues: 4,
      nb_evaluations_donnees: 10,
      nb_signalements_pertinents: 2,
      taux_utilite_moyen_pct: 80,
    });
    // 5*10 + 4*3 + 10*1 + 2*5 + 80/10 = 50+12+10+10+8 = 90
    expect(score).toBe(90);
  });

  it("attribue le badge 'premier_pas' dès la 1re fiche", () => {
    const b = determinerBadges({
      nb_fiches_publiees: 1,
      nb_fiches_par_module: { depense: 1 },
      nb_moderations: 0,
      nb_verifications: 0,
      taux_utilite_moyen_pct: 0,
    });
    expect(b).toContain("premier_pas");
    expect(b).not.toContain("contributeur_actif");
  });

  it("attribue 'contributeur_actif' à 5 fiches et 'redacteur_or' à 15+ avec utilité ≥ 70%", () => {
    const b = determinerBadges({
      nb_fiches_publiees: 15,
      nb_fiches_par_module: { depense: 6 },
      nb_moderations: 0,
      nb_verifications: 0,
      taux_utilite_moyen_pct: 75,
    });
    expect(b).toEqual(expect.arrayContaining(["premier_pas", "contributeur_actif", "redacteur_or", "expert_module"]));
  });

  it("le badge 'redacteur_or' nécessite ≥ 70% d'utilité moyenne", () => {
    const b = determinerBadges({
      nb_fiches_publiees: 20,
      nb_fiches_par_module: { depense: 2 },
      nb_moderations: 0,
      nb_verifications: 0,
      taux_utilite_moyen_pct: 60,
    });
    expect(b).not.toContain("redacteur_or");
  });

  it("définit 6 badges avec descriptions", () => {
    expect(OPALE_BADGES.length).toBe(6);
    OPALE_BADGES.forEach((b) => {
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
    });
  });

  it("détecte les fiches obsolètes ou à péremption proche", () => {
    const now = new Date("2026-04-25T12:00:00Z");
    const fiches = [
      { date_derniere_verification: "2025-05-01", periodicite_reverification_mois: 12, statut_actualite: "valide" }, // expire ~01/05/2026 → < 30j ✓
      { date_derniere_verification: "2026-01-01", periodicite_reverification_mois: 12, statut_actualite: "valide" }, // expire 01/01/2027 → trop loin ✗
      { date_derniere_verification: null, periodicite_reverification_mois: 12, statut_actualite: "obsolete" }, // obsolète → ✓
    ];
    const r = fichesAReverifier(fiches, now);
    expect(r.length).toBe(2);
  });
});