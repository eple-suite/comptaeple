import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const gloss = readFileSync(resolve(root, "src/data/aide/glossaire.ts"), "utf8");
const actes = readFileSync(resolve(root, "src/lib/parametres/actesGenerator.ts"), "utf8");

describe("Terminologie Op@le", () => {
  it("glossaire contient une entrée historique pour Mandat / Mandatement", () => {
    expect(gloss.toLowerCase()).toMatch(/mandat/);
    expect(gloss.toLowerCase()).toMatch(/demande de paiement|op@le/);
  });
  it("arrêtés régisseurs citent l'ordonnance 2022-408 (RGP) et non 'cautionnement' seul", () => {
    expect(actes).toMatch(/2022-408|RGP/);
    // Si 'cautionnement' apparaît, il doit être accompagné de RGP/2022-408 dans le même fichier
    if (/cautionnement/i.test(actes)) {
      expect(actes).toMatch(/2022-408|indemnité de maniement/);
    }
  });
  it("glossaire SATD = loi 2017-1837 (et pas 1966 seule)", () => {
    expect(gloss).toMatch(/2017-1837/);
    const satdLine = gloss
      .split("\n")
      .find((l) => /terme:\s*"SATD"/.test(l));
    expect(satdLine).toMatch(/2017-1837/);
  });
});