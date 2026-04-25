/**
 * Recette — vue consolidée AC anonymisée.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PAGE = resolve("src/pages/entretiens/VueRectoratEntretiensPage.tsx");

describe("Vue consolidée AC — anonymisation", () => {
  it("la page existe", () => {
    expect(existsSync(PAGE)).toBe(true);
  });
  const src = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
  it("ne sélectionne pas la table agents directement", () => {
    expect(/\.from\(["']agents["']\)/.test(src)).toBe(false);
  });
  it("affiche un avertissement RGPD anonymisation", () => {
    expect(/anonymis|minimisation|RGPD/i.test(src)).toBe(true);
  });
  it("agrège par établissement", () => {
    expect(/establishment_id/.test(src)).toBe(true);
  });
});