#!/usr/bin/env tsx
/**
 * Vérifie la disponibilité du squelette du PDF officiel de réponse rectorat.
 * Contrôles statiques sur le hub et la nomenclature, qui doivent référencer
 * les sections obligatoires (en-tête institutionnel, signatures AC + ordonnateur,
 * mention non-déspécialisation).
 */
import fs from "node:fs";

const hub = fs.readFileSync("src/pages/enquetes-rectorat/EnquetesHubPage.tsx", "utf8");
const nomenclature = fs.readFileSync("src/pages/enquetes-rectorat/NomenclaturePage.tsx", "utf8");
const types = fs.readFileSync("src/lib/enquetes-rectorat/types.ts", "utf8");

let fails = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); fails++; }
}

check("Hub référence M9-6 tome 3", hub.includes("M9-6"));
check("Nomenclature affiche sens normal du solde", nomenclature.includes("sens_solde_normal"));
check("Nomenclature affiche colonne déspécialisation", nomenclature.includes("Déspéc"));
check("Bandeau non-déspécialisation présent", nomenclature.includes("NON DÉSPÉCIALISABLE"));
check("Type ControleDespecialisation exposé", types.includes("ControleDespecialisation"));
check("Référence circulaire MENE1704160C citée dans le hub", hub.includes("MENE1704160C"));
check("Signataires AC + ordonnateur prévus dans la table",
  fs.readdirSync("supabase/migrations")
    .map((f) => fs.readFileSync(`supabase/migrations/${f}`, "utf8")).join("")
    .match(/signataire_ac[\s\S]{0,200}signataire_ordo/));

if (fails > 0) {
  console.error(`\n${fails} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("\n✓ Squelette PDF officiel conforme.");
process.exit(0);