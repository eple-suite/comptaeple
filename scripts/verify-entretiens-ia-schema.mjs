#!/usr/bin/env node
/**
 * Recette — validation du schéma JSON IA + score de complétude.
 */

import { validateIaResponse, computeCompletenessScore } from "../src/lib/entretiens/iaSchema.ts";

let pass = 0, fail = 0;
function assert(cond, label) {
  if (cond) { console.log(`✅ ${label}`); pass++; }
  else { console.error(`❌ ${label}`); fail++; }
}

console.log("\nRECETTE — Schéma IA répartition CREP/CREF\n");

// 1. Refus d'un objet vide
const r1 = validateIaResponse({});
assert(!r1.ok && r1.errors.length > 0, "Objet vide rejeté avec erreurs");

// 2. Refus d'un niveau invalide
const r2 = validateIaResponse({
  objectifs_passes: [],
  competences: {
    C1_resultats: { synthese: "x", sous_criteres: [{ critere: "x", niveau: "PARFAIT", confiance: "eleve", commentaire: "ok" }] },
    C2_competences_techniques: { synthese: "x", sous_criteres: [] },
    C3_qualites_personnelles: { synthese: "x", sous_criteres: [] },
    C4_encadrement: { synthese: "x", sous_criteres: [] },
  },
  appreciation_generale: "ok",
  perspectives: "ok",
  objectifs_futurs_suggeres: [],
  formation: { bilan_periode: [], demandes: [], projet_professionnel: "ok" },
  elements_a_retirer: [],
  score_completude: 0.5,
});
assert(!r2.ok && r2.errors.some((e) => e.includes("niveau invalide")), "Niveau IA invalide rejeté");

// 3. Acceptation d'une réponse complète conforme
const valid = {
  objectifs_passes: [{ libelle: "Apurer régie", atteinte: "atteint", commentaire: "fait" }],
  competences: {
    C1_resultats: {
      synthese: "Bons résultats globaux.",
      sous_criteres: [
        { critere: "Atteinte des objectifs annuels", niveau: "tres_bon", confiance: "eleve", commentaire: "Objectifs atteints", extrait_source: "a apuré 8 mois" },
      ],
    },
    C2_competences_techniques: {
      synthese: "Maîtrise Op@le.",
      sous_criteres: [
        { critere: "Maîtrise des outils", niveau: "tres_bon", confiance: "eleve", commentaire: "Op@le maîtrisé" },
      ],
    },
    C3_qualites_personnelles: {
      synthese: "Investie et rigoureuse.",
      sous_criteres: [
        { critere: "Implication, engagement", niveau: "excellent", confiance: "eleve", commentaire: "Très investie" },
      ],
    },
    C4_encadrement: { synthese: "Sans objet.", sous_criteres: [] },
  },
  appreciation_generale: "Agent investi, rigoureux, à accompagner sur la délégation.",
  perspectives: "Préparation concours attaché.",
  objectifs_futurs_suggeres: [
    { libelle: "Déléguer au moins 2 dossiers", indicateur: "nombre dossiers délégués", echeance: "30/06" },
  ],
  formation: {
    bilan_periode: [{ intitule: "Op@le approfondie", organisme: "EAFC", duree_heures: 21, evaluation: "utile" }],
    demandes: [{ intitule: "Préparation concours attaché", categorie: "T3", priorite: "haute", fondement: "agent" }],
    projet_professionnel: "Concours attaché.",
  },
  elements_a_retirer: [],
  score_completude: 0.78,
};
const r3 = validateIaResponse(valid);
assert(r3.ok, "Réponse IA conforme acceptée");

// 4. Score de complétude calculé
const score = computeCompletenessScore(valid);
assert(score > 0 && score <= 1, `Score complétude = ${score} (∈ ]0,1])`);

// 5. Détection rubrique manquante
const r5 = validateIaResponse({ ...valid, competences: { C1_resultats: valid.competences.C1_resultats } });
assert(!r5.ok && r5.errors.some((e) => e.includes("Rubrique manquante")), "Rubrique manquante détectée");

console.log(`\n${pass} succès / ${fail} échecs`);
process.exit(fail === 0 ? 0 : 1);