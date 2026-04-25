#!/usr/bin/env node
/**
 * Recette — Parseur de fiche de poste vers rubriques C1-C4.
 *
 * Vérifie :
 *  - splitItems sépare correctement lignes / puces / phrases
 *  - classifyItem route les bons mots-clés vers C1/C2/C3/C4
 *  - analyserFichePoste limite à 4 sélectionnés par rubrique
 *  - appliquerSelection ne garde que les éléments cochés
 */

let pass = 0, fail = 0;
const ok = (l) => { pass++; console.log(`✅ ${l}`); };
const ko = (l, d) => { fail++; console.log(`❌ ${l} — ${d}`); };
const eq = (a, b, l) => a === b ? ok(l) : ko(l, `attendu "${b}", reçu "${a}"`);
const ge = (a, b, l) => a >= b ? ok(l) : ko(l, `attendu ≥ ${b}, reçu ${a}`);

const mod = await import("../src/lib/entretiens/fichePosteParser.ts");
const { splitItems, classifyItem, analyserFichePoste, appliquerSelection } = mod;

console.log("\n=== Recette — Parseur fiche de poste ===\n");

/* 1. splitItems */
const items = splitItems("Saisie des mandats Op@le.\nSuivi du budget annuel ;\n• Animation de l'équipe");
ge(items.length, 3, "splitItems sépare lignes, puces et points-virgules");

const vide = splitItems(null);
eq(vide.length, 0, "splitItems gère null");

/* 2. classifyItem — C2 (technique Op@le) */
const c2 = classifyItem("Maîtrise du logiciel Op@le et de la GBCP");
eq(c2.rubrique, "C2_competences_techniques", "Op@le + GBCP → C2");
ge(c2.confiance, 0.6, "Op@le + GBCP → confiance ≥ 0.6");

/* 3. classifyItem — C4 (encadrement) */
const c4 = classifyItem("Animation de l'équipe et conduite de projets transverses");
eq(c4.rubrique, "C4_encadrement", "Animation équipe + conduite projet → C4");

/* 4. classifyItem — C3 (qualités) */
const c3 = classifyItem("Accueil des usagers et discrétion professionnelle");
eq(c3.rubrique, "C3_qualites_personnelles", "Accueil + discrétion → C3");

/* 5. classifyItem — C1 (résultats) */
const c1 = classifyItem("Atteinte des objectifs annuels avec respect des délais");
eq(c1.rubrique, "C1_resultats", "Objectifs + délais → C1");

/* 6. classifyItem — fallback faible confiance */
const cf = classifyItem("Texte neutre sans mot-clé spécifique");
eq(cf.confiance < 0.4, true, "Texte neutre → confiance faible (< 0.4)");

/* 7. analyserFichePoste — limite par rubrique */
const fp = {
  intitule: "Adjoint au gestionnaire",
  missions_principales: [
    "Saisie comptable Op@le",
    "Suivi des marchés publics",
    "Rédaction des actes",
    "Maîtrise GBCP",
    "Connaissance code de l'éducation",
    "Polyvalence sur les outils SIECLE",
  ].join("\n"),
  activites: [
    "Animation de l'équipe intendance",
    "Conduite de projets transverses",
    "Délégation aux adjoints",
    "Pilotage des indicateurs",
    "Coordination avec le SG",
    "Tutorat des stagiaires",
  ].join("\n"),
  competences_requises: [
    "Accueil usagers",
    "Discrétion professionnelle",
    "Sens du service public",
    "Réactivité",
    "Capacité d'écoute",
  ].join("\n"),
};
const a = analyserFichePoste(fp);
ge(a.length, 10, "Analyse complète produit ≥ 10 critères");

const c2Sel = a.filter((x) => x.rubrique === "C2_competences_techniques" && x.selectionne).length;
eq(c2Sel <= 4, true, "Au plus 4 critères sélectionnés en C2");
const c4Sel = a.filter((x) => x.rubrique === "C4_encadrement" && x.selectionne).length;
eq(c4Sel <= 4, true, "Au plus 4 critères sélectionnés en C4");

/* 8. appliquerSelection ne garde que les cochés */
const apercuMix = [
  { source: "missions_principales", rubrique: "C2_competences_techniques", texte: "Op@le", extrait: "Op@le", confiance: 0.9, selectionne: true },
  { source: "activites", rubrique: "C4_encadrement", texte: "Pilotage", extrait: "Pilotage", confiance: 0.6, selectionne: false },
];
const applied = appliquerSelection(apercuMix);
eq(applied.C2_competences_techniques.length, 1, "Seul le critère coché est appliqué (C2)");
eq(applied.C4_encadrement.length, 0, "Critère décoché ignoré (C4)");
eq(applied.C2_competences_techniques[0].critere.startsWith("[Fiche de poste]"), true, "Critère injecté préfixé [Fiche de poste]");

console.log(`\n=== ${pass} ✅ / ${fail} ❌ ===\n`);
process.exit(fail > 0 ? 1 : 0);