#!/usr/bin/env bun
/**
 * Recette n°8 — Routing & navigation Fonds sociaux v2
 *
 * Vérifie que toutes les pages du module sont :
 *   • importées dans App.tsx
 *   • montées sur une route /fonds-sociaux/v2/...
 *   • accessibles depuis FondsSociauxV2Home (tuiles)
 * Et que la route legacy /fonds-sociaux redirige vers /fonds-sociaux/v2.
 */
import { readFileSync, statSync } from "node:fs";

const app = readFileSync("src/App.tsx", "utf8");
const home = readFileSync("src/pages/fonds-sociaux-v2/FondsSociauxV2Home.tsx", "utf8");
const errors: string[] = [];

function must(label: string, cond: boolean) {
  if (!cond) errors.push(label);
}

const PAGES: { file: string; route: string; component: string }[] = [
  { file: "FondsSociauxV2Home.tsx",      route: "/fonds-sociaux/v2",                 component: "FondsSociauxV2Home" },
  { file: "ElevesPage.tsx",              route: "/fonds-sociaux/v2/eleves",          component: "ElevesPage" },
  { file: "DecisionsPage.tsx",           route: "/fonds-sociaux/v2/decisions",       component: "DecisionsPage" },
  { file: "CommissionsPage.tsx",         route: "/fonds-sociaux/v2/commissions",     component: "CommissionsPage" },
  { file: "EnquetePage.tsx",             route: "/fonds-sociaux/v2/enquete",         component: "EnquetePage" },
  { file: "TableauBordPage.tsx",         route: "/fonds-sociaux/v2/tableau-bord",    component: "TableauBordPage" },
  { file: "GroupementConsolidePage.tsx", route: "/fonds-sociaux/v2/groupement",      component: "GroupementConsolidePage" },
  { file: "RgpdJournalPage.tsx",         route: "/fonds-sociaux/v2/rgpd",            component: "RgpdJournalPage" },
];

// 1) Chaque page existe sur disque
for (const p of PAGES) {
  try { statSync(`src/pages/fonds-sociaux-v2/${p.file}`); }
  catch { errors.push(`Fichier manquant : src/pages/fonds-sociaux-v2/${p.file}`); }
}

// 2) Chaque page est importée + routée dans App.tsx
for (const p of PAGES) {
  const importRe = new RegExp(`import\\s+${p.component}\\s+from\\s+"\\./pages/fonds-sociaux-v2/`);
  must(`Import de ${p.component} dans App.tsx`, importRe.test(app));
  const routeRe = new RegExp(`path="${p.route.replace(/\//g, "\\/")}"\\s+element=\\{<${p.component}\\s*/?\\s*>\\s*\\}`);
  must(`Route ${p.route} -> <${p.component}/>`, routeRe.test(app));
}

// 3) Redirection legacy /fonds-sociaux -> /fonds-sociaux/v2
must(
  "Redirection /fonds-sociaux -> /fonds-sociaux/v2",
  /path="\/fonds-sociaux"\s+element=\{<Navigate\s+to="\/fonds-sociaux\/v2"/.test(app),
);

// 4) Tuiles présentes dans le Home pour les pages métier
const TUILES = [
  { route: "/fonds-sociaux/v2/eleves",       libellePart: "Élèves" },
  { route: "/fonds-sociaux/v2/decisions",    libellePart: "Décisions" },
  { route: "/fonds-sociaux/v2/commissions",  libellePart: "Commission" },
  { route: "/fonds-sociaux/v2/enquete",      libellePart: "Enquête" },
  { route: "/fonds-sociaux/v2/tableau-bord", libellePart: "Tableau" },
  { route: "/fonds-sociaux/v2/groupement",   libellePart: "Groupement" },
  { route: "/fonds-sociaux/v2/rgpd",         libellePart: "RGPD" },
];
for (const t of TUILES) {
  must(`Tuile vers ${t.route}`, home.includes(t.route));
  must(`Libellé contient « ${t.libellePart} »`, new RegExp(t.libellePart, "i").test(home));
}

if (errors.length > 0) {
  console.error("❌ Recette routing FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}
console.log("✅ Recette routing FS — OK");
console.log(`   • ${PAGES.length} pages présentes, importées et routées`);
console.log("   • Redirection legacy active (/fonds-sociaux → v2)");
console.log(`   • ${TUILES.length} tuiles d'accès depuis l'accueil`);
process.exit(0);