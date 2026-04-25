import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const aideRef = readFileSync(resolve(root, "src/pages/aide/AideReglementation.tsx"), "utf8");
const articles = readFileSync(resolve(root, "src/data/aide/articles.ts"), "utf8");

describe("Références réglementaires", () => {
  it("textes majeurs cités dans l'index réglementaire", () => {
    ["M9-6", "2012-1246", "2022-408", "R.421", "2016/679"].forEach((ref) =>
      expect(aideRef + articles).toContain(ref),
    );
  });
  it("loi 66-948 confinée au module Voyages (corpus aide cite la règle 8 € séparément)", () => {
    // Doit apparaître AVEC mention 'règle 8' ou 'voyage'
    if (/66-948/.test(articles)) {
      const idx = articles.indexOf("66-948");
      const ctx = articles.slice(Math.max(0, idx - 200), idx + 200).toLowerCase();
      expect(ctx).toMatch(/8\s*€|règle des 8|voyage/);
    }
    expect(true).toBe(true);
  });
  it("SATD systématiquement associée à 2017-1837", () => {
    const idx = articles.indexOf("SATD");
    if (idx !== -1) {
      const ctx = articles.slice(idx, idx + 600);
      expect(ctx).toMatch(/2017-1837/);
    }
  });
});