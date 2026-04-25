import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(__dirname, "..");
function walk(dir: string, files: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) files.push(p);
  }
  return files;
}
const files = walk(resolve(root, "src/components")).concat(walk(resolve(root, "src/pages")));

describe("Cohérence globale — sources de vérité", () => {
  it("agents : au moins 6 modules consomment la table", () => {
    const hits = files.filter((f) => readFileSync(f, "utf8").includes('from("agents")'));
    expect(hits.length).toBeGreaterThanOrEqual(6);
  });
  it("establishments : table présente côté pages", () => {
    const hits = files.filter((f) => /from\(["']establishments["']\)/.test(readFileSync(f, "utf8")));
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });
  it("comptes_sens_normal : référentiel M9-6 utilisé par Balance et CoFi", () => {
    const lib = readFileSync(resolve(root, "src/lib/balance/referentielLoader.ts"), "utf8");
    expect(lib).toMatch(/comptes_sens_normal/);
  });
  it("alertes_transverses : au moins 3 producteurs", () => {
    const producers = [
      "src/lib/cockpit/alertesSync.ts",
      "src/lib/balance/syncBalanceAlertes.ts",
      "src/pages/voyages-v2/lib/syncVoyageAlertesTransverses.ts",
    ].map((p) => readFileSync(resolve(root, p), "utf8"));
    producers.forEach((c) => expect(c).toMatch(/alertes_transverses/));
  });
});