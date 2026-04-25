/**
 * Recette — circuit de signature CREP/CREF (décret 2010-888 art. 4).
 * Vérifie : transition autorisée, blocage agent avant N+1/N+2, calcul des délais.
 */
import { describe, it, expect } from "vitest";
import { transitionAutorisee, calculerDelaisRecours, TRANSITIONS } from "../src/lib/entretiens/machineEtat";

describe("Machine d'état CREP — décret 2010-888", () => {
  it("autorise N+1 à signer après rédaction", () => {
    const r = transitionAutorisee("en_attente_signature_n1", "notifie_agent_pour_observations", "n1");
    expect(r.ok).toBe(true);
  });

  it("refuse l'agent qui voudrait signer avant N+1/N+2", () => {
    const r = transitionAutorisee("en_attente_signature_n1", "finalise", "agent");
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/non prévue|non habilité/);
  });

  it("autorise la transition recours → archive par N+2", () => {
    const r = transitionAutorisee("recours_en_cours", "archive", "n2");
    expect(r.ok).toBe(true);
  });

  it("refuse une transition non prévue", () => {
    const r = transitionAutorisee("brouillon", "archive", "admin");
    expect(r.ok).toBe(false);
  });

  it("archive est terminal", () => {
    expect(TRANSITIONS.archive.length).toBe(0);
  });
});

describe("Délais recours — circulaire MENH1310955C", () => {
  it("calcule 15 jours francs et 1 mois", () => {
    const today = new Date();
    const d = calculerDelaisRecours(today.toISOString());
    expect(d.joursRestantsRecoursHierarchique).toBeGreaterThanOrEqual(14);
    expect(d.joursRestantsRecoursHierarchique).toBeLessThanOrEqual(15);
    expect(d.recoursHierarchiqueEncore).toBe(true);
    expect(d.saisineCAPEncore).toBe(true);
  });

  it("clôt les délais après 1 mois et 15 jours", () => {
    const past = new Date();
    past.setMonth(past.getMonth() - 2);
    const d = calculerDelaisRecours(past.toISOString());
    expect(d.recoursHierarchiqueEncore).toBe(false);
    expect(d.saisineCAPEncore).toBe(false);
  });
});