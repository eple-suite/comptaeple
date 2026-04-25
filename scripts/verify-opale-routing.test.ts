import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve(__dirname, "../src/App.tsx"), "utf8");
const sidebar = readFileSync(resolve(__dirname, "../src/components/AppSidebar.tsx"), "utf8");

const ROUTES_REQUISES = [
  "/ressources/opale",
  "/ressources/opale/bibliotheque",
  "/ressources/opale/nouvelle",
  "/ressources/opale/edition/:id",
  "/ressources/opale/fiche/:slug",
  "/ressources/opale/mes-fiches",
  "/ressources/opale/recherche",
  "/ressources/opale/forum",
  "/ressources/opale/tendances",
  "/ressources/opale/dashboard",
  "/ressources/opale/moderation",
  "/ressources/opale/cgu",
];

describe("Op@le — Routing & navigation", () => {
  ROUTES_REQUISES.forEach((r) => {
    it(`route ${r} câblée dans App.tsx`, () => {
      expect(app).toContain(`path="${r}"`);
    });
  });

  it("les pages réelles sont importées (pas de stubs)", () => {
    expect(app).toMatch(/from "\.\/pages\/opale\/OpaleRecherchePage"/);
    expect(app).toMatch(/from "\.\/pages\/opale\/OpaleModerationPage"/);
    expect(app).toMatch(/from "\.\/pages\/opale\/OpaleForumPage"/);
    expect(app).toMatch(/from "\.\/pages\/opale\/OpaleDashboardPage"/);
    expect(app).not.toContain("OpaleStubPages");
  });

  it("entrée sidebar 'AIDE Op@le' présente dans les Ressources", () => {
    expect(sidebar.toLowerCase()).toMatch(/op@le|opale/);
    expect(sidebar).toContain("/ressources/opale");
  });
});