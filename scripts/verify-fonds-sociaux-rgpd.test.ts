#!/usr/bin/env bun
/**
 * Recette n°6 — Module RGPD Fonds sociaux
 *
 * Vérifie :
 *   • Page RgpdJournalPage présente, avec filtres action / ressource / utilisateur / établissement
 *   • Type FsJournalAccesEntry conforme
 *   • Politique de rétention affichée (5 ans dossiers / 10 ans pièces M9-6)
 *   • Mention « append-only » du journal
 *   • Bouton « Réinitialiser » lorsque des filtres sont actifs
 *   • Multi-établissements géré (filtre par établissement quand >1)
 */
import { readFileSync } from "node:fs";

const page = readFileSync("src/pages/fonds-sociaux-v2/RgpdJournalPage.tsx", "utf8");
const types = readFileSync("src/pages/fonds-sociaux-v2/fsv2Types.ts", "utf8");
const errors: string[] = [];

function must(label: string, cond: boolean) {
  if (!cond) errors.push(label);
}

// 1) Type journal
must("Type FsJournalAccesEntry défini", /export interface FsJournalAccesEntry\b/.test(types));
for (const f of ["user_id", "user_name", "type_ressource", "ressource_id", "action", "details", "ip_adresse", "created_at"]) {
  must(`FsJournalAccesEntry doit exposer « ${f} »`, new RegExp(`\\b${f}\\b\\s*:`).test(types));
}

// 2) Filtres UI
must("Filtre Action présent", /filterAction|Toutes les actions/.test(page));
must("Filtre Ressource présent", /filterResource|Toutes les ressources/.test(page));
must("Filtre Utilisateur présent", /filterUser|Tous les utilisateurs/.test(page));
must("Filtre Établissement présent (multi-EPLE)", /filterEtab|Tous mes établissements/.test(page));
must("Bouton Réinitialiser présent", /Réinitialiser/.test(page));

// 3) Actions tracées
for (const a of ["consultation", "modification", "export_pdf", "suppression"]) {
  must(`Action « ${a} » prise en charge`, new RegExp(`"${a}"`).test(page));
}

// 4) Rétention réglementaire
must("Mention 5 ans (dossiers individuels)", /5\s*ans/.test(page));
must("Mention 10 ans (M9-6)", /10\s*ans|M9-?6/i.test(page));

// 5) Append-only
must("Mention journal inaltérable / append-only", /append-only|inaltérable/i.test(page));

// 6) Requête bornée
must("Requête limitée à 500 entrées", /\.limit\(500\)/.test(page));
must("Tri décroissant par created_at", /order\(\s*"created_at"\s*,\s*\{\s*ascending:\s*false/.test(page));

// 7) Conformité RGPD art. 30
must("Mention RGPD article 30", /art\.?\s*30/i.test(page));

if (errors.length > 0) {
  console.error("❌ Recette RGPD FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette RGPD FS — OK");
console.log("   • 4 filtres (action / ressource / utilisateur / établissement)");
console.log("   • Type FsJournalAccesEntry complet");
console.log("   • Rétention 5 ans dossiers / 10 ans pièces affichée");
console.log("   • Journal append-only · RGPD art. 30");
process.exit(0);