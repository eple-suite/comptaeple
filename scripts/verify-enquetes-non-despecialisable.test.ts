#!/usr/bin/env tsx
/**
 * Vérifie la règle de non-déspécialisation (DAF A3) :
 * - Tentative déspécialisation 443110 → blocage
 * - Tentative déspécialisation 44114 (AED) → blocage
 * - Reversement familles ou restitution rectorat → autorisé
 */
import { controleAction } from "../src/lib/enquetes-rectorat/types";

const c443110 = { compte: "443110", despecialisable: false, libelle: "Bourses nationales" };
const c44114  = { compte: "44114",  despecialisable: false, libelle: "AED P230" };
const c441912 = { compte: "441912", despecialisable: true,  libelle: "Reliquat P141" };

let fails = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); fails++; }
}

check("443110 réaffectation BLOQUÉE",        controleAction(c443110, "reaffectation").autorise === false);
check("443110 déspécialisation BLOQUÉE",     controleAction(c443110, "despecialisation").autorise === false);
check("443110 reversement familles AUTORISÉ", controleAction(c443110, "reversement_familles").autorise === true);
check("443110 restitution rectorat AUTORISÉ", controleAction(c443110, "restitution_rectorat").autorise === true);

check("44114 réaffectation BLOQUÉE",         controleAction(c44114, "reaffectation").autorise === false);
check("44114 restitution rectorat AUTORISÉ", controleAction(c44114, "restitution_rectorat").autorise === true);

check("441912 réaffectation AUTORISÉE (déspéc.)", controleAction(c441912, "reaffectation").autorise === true);

if (fails > 0) {
  console.error(`\n${fails} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("\n✓ Règle de non-déspécialisation respectée.");
process.exit(0);