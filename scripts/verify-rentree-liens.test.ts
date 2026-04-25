#!/usr/bin/env bun
/**
 * Recette — Liens utiles institutionnels (livrable 5).
 * Vérifie que :
 *  - le catalogue contient au moins 40 liens,
 *  - toutes les URL sont en HTTPS,
 *  - chaque lien a une catégorie valide,
 *  - les sources clés sont présentes (legifrance, education.gouv, dgfip, cnil, opale).
 */
import { LIENS_INSTITUTIONNELS, CATEGORIES_LIBELLES } from "../src/lib/rentree/liensInstitutionnels";

const errors: string[] = [];
const validCats = new Set(Object.keys(CATEGORIES_LIBELLES));

if (LIENS_INSTITUTIONNELS.length < 40) {
  errors.push(`Trop peu de liens (${LIENS_INSTITUTIONNELS.length} < 40)`);
}

for (const l of LIENS_INSTITUTIONNELS) {
  if (!l.url.startsWith("https://")) errors.push(`URL non-HTTPS : ${l.id} (${l.url})`);
  if (!validCats.has(l.categorie)) errors.push(`Catégorie inconnue pour ${l.id} : ${l.categorie}`);
  if (!l.titre || !l.description || !l.source) errors.push(`Champs manquants pour ${l.id}`);
}

const requis = ["legifrance.gouv.fr", "education.gouv.fr", "economie.gouv.fr", "cnil.fr", "opale.education.gouv.fr"];
for (const dom of requis) {
  if (!LIENS_INSTITUTIONNELS.some(l => l.url.includes(dom))) {
    errors.push(`Domaine institutionnel attendu absent : ${dom}`);
  }
}

if (errors.length) {
  console.error("❌ Liens utiles — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log(`✅ Liens utiles — OK (${LIENS_INSTITUTIONNELS.length} liens, ${validCats.size} catégories)`);
process.exit(0);