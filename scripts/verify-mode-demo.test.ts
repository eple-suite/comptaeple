import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const modeDemo = resolve(root, "src/components/cockpit/ModeDemoBadge.tsx");

describe("Mode démonstration rectorat", () => {
  it("composant ModeDemoBadge présent", () => {
    expect(existsSync(modeDemo)).toBe(true);
  });
  it("badge affiche bien la mention démonstration / fictives", () => {
    const c = readFileSync(modeDemo, "utf8").toLowerCase();
    expect(c).toMatch(/d[ée]mo|fictiv/);
  });
});