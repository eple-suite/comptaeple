import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const banner = readFileSync(
  resolve(__dirname, "../src/components/opale/RappelOfficielBanner.tsx"),
  "utf8",
);
const accueil = readFileSync(resolve(__dirname, "../src/pages/opale/OpaleAccueil.tsx"), "utf8");
const detail = readFileSync(resolve(__dirname, "../src/pages/opale/OpaleFicheDetail.tsx"), "utf8");
const cgu = readFileSync(resolve(__dirname, "../src/pages/opale/OpaleCguPage.tsx"), "utf8");

describe("Op@le — Rappel positionnement (complémentaire à l'assistance officielle)", () => {
  it("le bandeau cite la DAF A3 ou Pléiade", () => {
    expect(banner).toMatch(/DAF A3|Pléiade|Pleiade/i);
  });

  it("le bandeau précise le caractère 'complémentaire'", () => {
    expect(banner.toLowerCase()).toContain("compl");
  });

  it("le bandeau est utilisé sur l'accueil et la fiche détail", () => {
    expect(accueil).toContain("RappelOfficielBanner");
    expect(detail).toContain("RappelOfficielBanner");
  });

  it("les CGU rappellent le positionnement, la licence CC-BY-SA et le RGPD", () => {
    expect(cgu).toMatch(/compl[ée]mentaire/i);
    expect(cgu).toMatch(/CC-?BY-?SA/i);
    expect(cgu).toMatch(/RGPD|UAI|INE/i);
  });
});