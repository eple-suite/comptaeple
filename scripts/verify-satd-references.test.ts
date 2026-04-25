#!/usr/bin/env bun
/**
 * Recette transverse — références SATD.
 *  - Aucune mention "loi de 1966" associée à la SATD dans le Mode d'emploi.
 *  - Référence "2017-1837" présente où SATD est mentionnée (au moins un fichier d'aide).
 *  - Loi 66-948 art. 21 conservée uniquement dans le module Voyages (règle des 8 €).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, files: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|md)$/.test(p)) files.push(p);
  }
  return files;
}

const errors: string[] = [];
const aideFiles = walk("src/data/aide");

// Règle 1 : aucune association SATD ↔ "1966" dans l'aide
for (const f of aideFiles) {
  const src = readFileSync(f, "utf8");
  // Cherche occurrences proches : SATD et "1966" dans une fenêtre de 200 chars
  const re = /SATD[\s\S]{0,200}1966|1966[\s\S]{0,200}SATD/i;
  if (re.test(src)) {
    errors.push(`${f} : association SATD ↔ "1966" détectée (incorrect — la SATD relève de la loi 2017-1837 art. 73).`);
  }
}

// Règle 2 : au moins un fichier d'aide doit mentionner SATD avec 2017-1837
const allAide = aideFiles.map(f => readFileSync(f, "utf8")).join("\n");
const aideMentionneSatd = /SATD/i.test(allAide);
if (aideMentionneSatd && !/2017[\s-]?1837/.test(allAide)) {
  errors.push("Aide : SATD mentionnée mais référence 2017-1837 absente du corpus.");
}

// Règle 3 : loi 66-948 art. 21 réservée au module Voyages (info)
const voyagesFiles = [...walk("src/pages/voyages-v2"), ...walk("src/pages/voyages")];
const voyagesSrc = voyagesFiles.map(f => readFileSync(f, "utf8")).join("\n");
const refRegle8 = /66[-\s]?948|loi.{0,5}1966/.test(voyagesSrc);
if (!refRegle8) {
  // Non bloquant — informatif uniquement.
  console.log("ℹ️  Note : la référence loi 66-948 (règle 8 €) n'apparaît pas dans Voyages — vérifier si elle est attendue.");
}

if (errors.length > 0) {
  console.error("❌ Audit SATD — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Audit SATD — OK");
console.log("   • Aucune mention SATD ↔ 1966 dans l'aide");
console.log("   • Référence 2017-1837 présente où SATD mentionnée (ou aide ne mentionne pas SATD)");
process.exit(0);