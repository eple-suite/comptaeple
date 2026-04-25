#!/usr/bin/env node
/**
 * Recette — Wizard de création d'entretien (7 étapes).
 *
 * Vérifie :
 *  - Calcul de l'année scolaire courante
 *  - Période d'observation par défaut (1er sept. → 31 août)
 *  - Validation par étape (agent obligatoire, délai 8j convocation, dates cohérentes)
 *  - Pré-remplissage des compétences depuis fiche de poste
 *
 * Sortie : exit 0 si toutes assertions passent.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("ts-node/esm", pathToFileURL("./"));

let pass = 0, fail = 0;
const ok = (label) => { pass++; console.log(`✅ ${label}`); };
const ko = (label, detail) => { fail++; console.log(`❌ ${label} — ${detail}`); };
const eq = (a, b, label) => a === b ? ok(label) : ko(label, `attendu "${b}", reçu "${a}"`);

const mod = await import("../src/lib/entretiens/wizard.ts");
const types = await import("../src/lib/entretiens/types.ts");
const {
  currentAnneeScolaire,
  defaultPeriodeObservation,
  validateStep,
  buildCompetencesFromFichePoste,
  EMPTY_WIZARD_STATE,
  WIZARD_STEPS,
} = mod;
const { SOUS_CRITERES_REGLEMENTAIRES } = types;

console.log("\n=== Recette — Wizard Entretiens (7 étapes) ===\n");

/* 1. Année scolaire */
eq(currentAnneeScolaire(new Date("2025-03-15")), "2024-2025", "Année scolaire avant septembre");
eq(currentAnneeScolaire(new Date("2025-09-01")), "2025-2026", "Année scolaire à partir de septembre");
eq(currentAnneeScolaire(new Date("2025-08-31")), "2024-2025", "Année scolaire fin août");

/* 2. Période par défaut */
const p = defaultPeriodeObservation("2024-2025");
eq(p.debut, "2024-09-01", "Période début");
eq(p.fin, "2025-08-31", "Période fin");

/* 3. Étapes définies */
eq(WIZARD_STEPS.length, 7, "Wizard composé de 7 étapes");

/* 4. Validation étape 1 — agent obligatoire */
const e1 = validateStep(1, { ...EMPTY_WIZARD_STATE });
e1.length > 0 ? ok("Étape 1 bloque sans agent") : ko("Étape 1 bloque sans agent", "aucune erreur retournée");
const e1ok = validateStep(1, { ...EMPTY_WIZARD_STATE, agent_id: "uuid-1" });
eq(e1ok.length, 0, "Étape 1 OK avec agent");

/* 5. Validation étape 2 — période cohérente */
const e2bad = validateStep(2, { ...EMPTY_WIZARD_STATE, campagne_annee: "2024-2025", periode_debut: "2025-09-01", periode_fin: "2024-09-01" });
e2bad.some((x) => /précéder/i.test(x)) ? ok("Étape 2 détecte dates incohérentes") : ko("Étape 2 détecte dates incohérentes", e2bad.join(" / "));

/* 6. Validation étape 3 — délai 8j */
const e3short = validateStep(3, {
  ...EMPTY_WIZARD_STATE,
  date_convocation: "2025-04-20",
  date_entretien: "2025-04-22",
  lieu: "Bureau",
});
e3short.some((x) => /8 jours/i.test(x)) ? ok("Étape 3 détecte délai < 8 jours") : ko("Étape 3 détecte délai < 8 jours", e3short.join(" / "));
const e3ok = validateStep(3, {
  ...EMPTY_WIZARD_STATE,
  date_convocation: "2025-04-01",
  date_entretien: "2025-04-15",
  lieu: "Bureau du SG",
});
eq(e3ok.length, 0, "Étape 3 OK avec délai conforme");

/* 7. Pré-remplissage compétences */
const grille = buildCompetencesFromFichePoste(SOUS_CRITERES_REGLEMENTAIRES, "Maîtrise Op@le ; Connaissance GBCP ; Encadrement");
eq(grille.C1_resultats.length, SOUS_CRITERES_REGLEMENTAIRES.C1_resultats.length, "Grille C1 pré-remplie");
grille.C2_competences_techniques.some((c) => c.critere.includes("[Fiche de poste]"))
  ? ok("Compétences spécifiques fiche de poste injectées en C2")
  : ko("Compétences spécifiques fiche de poste injectées en C2", "aucun critère [Fiche de poste]");
const grilleVide = buildCompetencesFromFichePoste(SOUS_CRITERES_REGLEMENTAIRES, null);
eq(grilleVide.C2_competences_techniques.length, SOUS_CRITERES_REGLEMENTAIRES.C2_competences_techniques.length, "Grille fonctionne sans fiche de poste");

console.log(`\n=== ${pass} ✅ / ${fail} ❌ ===\n`);
process.exit(fail > 0 ? 1 : 0);