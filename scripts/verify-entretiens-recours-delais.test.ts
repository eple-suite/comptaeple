/**
 * Recette — délais réglementaires de recours sur entretien professionnel.
 * Vérifie : 15 jours francs (recours hiérarchique) et 1 mois (saisine CAP/CCP).
 */
import { describe, it, expect } from "vitest";
import { calculerDelaisRecours } from "../src/lib/entretiens/machineEtat";

describe("Délais recours — décret 2010-888 art. 6", () => {
  it("recours hiérarchique = J+15", () => {
    const ref = new Date("2025-04-01T10:00:00Z");
    const d = calculerDelaisRecours(ref);
    const expectedJ15 = new Date("2025-04-16T10:00:00Z");
    expect(d.dateLimiteRecoursHierarchique.toISOString()).toBe(expectedJ15.toISOString());
  });
  it("saisine CAP = J+1 mois", () => {
    const ref = new Date("2025-04-01T10:00:00Z");
    const d = calculerDelaisRecours(ref);
    const expectedM1 = new Date("2025-05-01T10:00:00Z");
    expect(d.dateLimiteSaisineCAP.toISOString()).toBe(expectedM1.toISOString());
  });
});