#!/usr/bin/env tsx
/**
 * Vérifie l'extension du rôle observateur_rectoral et la vue rectorat enquêtes.
 * - Le rôle 'observateur_rectoral' est ajouté à app_role
 * - Les RLS des tables enquetes_campagnes et enquetes_reponses_eple incluent ce rôle en lecture
 * - La page Vue Rectorat existe
 */
import fs from "node:fs";

const files = fs.readdirSync("supabase/migrations");
const allSql = files.map((f) => fs.readFileSync(`supabase/migrations/${f}`, "utf8")).join("\n");

let fails = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); fails++; }
}

check("Rôle observateur_rectoral ajouté",
  allSql.includes("'observateur_rectoral'"));
check("Politique lecture campagnes inclut observateur_rectoral",
  /enquetes_campagnes[\s\S]{0,2000}observateur_rectoral/.test(allSql));
check("Politique lecture réponses inclut observateur_rectoral",
  /enquetes_reponses_eple[\s\S]{0,2000}observateur_rectoral/.test(allSql));
check("Page Vue Rectorat enquêtes existe",
  fs.existsSync("src/pages/enquetes-rectorat/VueRectoratEnquetesPage.tsx"));
check("Route /enquetes-rectorat/vue-rectorat câblée",
  fs.readFileSync("src/App.tsx", "utf8").includes("/enquetes-rectorat/vue-rectorat"));

if (fails > 0) {
  console.error(`\n${fails} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("\n✓ Vue rectorat opérationnelle.");
process.exit(0);