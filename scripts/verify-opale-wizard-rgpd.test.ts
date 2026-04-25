import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const wizard = readFileSync(resolve(__dirname, "../src/pages/opale/OpaleWizardFiche.tsx"), "utf8");

describe("Op@le — Wizard 7 étapes & blocage RGPD", () => {
  it("appelle le détecteur d'éléments sensibles avant publication", () => {
    expect(wizard).toMatch(/detecterElementsSensibles|contientElementsSensibles/);
  });

  it("impose la version Op@le (champ obligatoire)", () => {
    expect(wizard.toLowerCase()).toMatch(/version_opale|version op@le|version opale/);
  });

  it("propose une auto-évaluation RGPD avant publication", () => {
    expect(wizard.toLowerCase()).toMatch(/rgpd|anonymis/);
  });

  it("supporte au moins 7 étapes (stepper)", () => {
    // On compte les sous-titres d'étape ou indices de step utilisés dans le composant
    const matches = wizard.match(/[Éé]tape\s*\d|step\s*[:=]/gi) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(7);
  });

  it("appelle le journal d'accès lors de la soumission ou publication", () => {
    expect(wizard).toMatch(/logOpaleAcces|opale_acces_log/);
  });
});