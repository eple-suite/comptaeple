/**
 * Recette — référentiel fiches de poste BIATSS (REFERENS / RIFSEEP).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PAGE = resolve("src/pages/entretiens/FichesPostePage.tsx");

describe("Fiches de poste — module Entretiens", () => {
  it("la page CRUD existe", () => {
    expect(existsSync(PAGE)).toBe(true);
  });
  it("la page mentionne au moins un référentiel ministériel", () => {
    const src = readFileSync(PAGE, "utf-8");
    expect(/REFERENS|RIFSEEP|AENES|ITRF/.test(src)).toBe(true);
  });
});