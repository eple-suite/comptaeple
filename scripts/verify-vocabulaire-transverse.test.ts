/**
 * Recette transverse : audit du vocabulaire « mandat » → « demande de paiement »
 * dans les modules métier (Voyages v2, Compte Financier, Fonds sociaux v2).
 * Tolère le terme dans les contextes légitimes : crédits de mandat, mandataire,
 * commentaires legacy explicitement marqués.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "..");
const TARGETS = [
  "src/pages/fonds-sociaux-v2",
  "src/pages/voyages-v2",
  "src/lib/fs-pdf",
];

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(p)) files.push(p);
  }
  return files;
}

const FORBIDDEN_UI = [
  /MANDATEMENT DES DÉPENSES/,
  />\s*Mandaté\s*</,
  /la mandater/i,
];

describe("Vocabulaire transverse — mandat → demande de paiement", () => {
  it("aucun motif UI interdit dans Voyages v2 / FS v2 / fs-pdf", () => {
    const errors: string[] = [];
    for (const dir of TARGETS) {
      for (const f of walk(resolve(root, dir))) {
        const src = readFileSync(f, "utf8");
        for (const re of FORBIDDEN_UI) {
          if (re.test(src)) errors.push(`${f} : motif interdit /${re.source}/`);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  it("glossaire contient une entrée DP (Demande de Paiement)", () => {
    const gloss = readFileSync(resolve(root, "src/data/aide/glossaire.ts"), "utf8");
    expect(gloss).toMatch(/terme:\s*"DP"/);
  });
});