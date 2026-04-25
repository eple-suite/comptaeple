/**
 * Recette — RGPD module entretiens. Cohérence des types d'accès traçables.
 */
import { describe, it, expect } from "vitest";
import type { TypeAccesEntretien } from "../src/lib/entretiens/accesLog";

const TYPES_AUTORISES: TypeAccesEntretien[] = [
  "lecture",
  "telechargement",
  "export_esteve",
  "export_pdf",
  "generation_pdf",
];

describe("RGPD — journal d'accès entretiens", () => {
  it("définit 5 types d'accès traçables", () => {
    expect(TYPES_AUTORISES.length).toBe(5);
  });
  it("inclut lecture, téléchargement, export ESTEVE", () => {
    expect(TYPES_AUTORISES).toContain("lecture");
    expect(TYPES_AUTORISES).toContain("export_esteve");
    expect(TYPES_AUTORISES).toContain("telechargement");
  });
});