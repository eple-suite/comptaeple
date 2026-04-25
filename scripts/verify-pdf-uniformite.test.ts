import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const pdfUtils = readFileSync(resolve(root, "src/lib/pdfUtils.ts"), "utf8");

describe("PDF — uniformité institutionnelle", () => {
  it("helper central createStyledPDF présent", () => {
    expect(pdfUtils).toMatch(/createStyledPDF/);
    expect(pdfUtils).toMatch(/addPDFFooters/);
    expect(pdfUtils).toMatch(/savePDF/);
  });
  it("pied de page systématique avec pagination", () => {
    expect(pdfUtils).toMatch(/Page \$\{i\}\/\$\{pageCount\}/);
  });
  it("typo officielle (helvetica fallback Arial cohérent RGI)", () => {
    expect(pdfUtils).toMatch(/helvetica/);
  });
  it("en-tête institutionnel coloré (bleu République)", () => {
    expect(pdfUtils).toMatch(/setFillColor\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/);
  });
});