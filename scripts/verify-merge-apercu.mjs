#!/usr/bin/env node
/**
 * Recette : fusion intelligente d'aperçu (préservation des choix utilisateur).
 */
import { mergeApercuPreservant, critereKey } from "../src/lib/entretiens/mergeApercu.ts";

let pass = 0, fail = 0;
const t = (n, c) => { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n}`); } };

console.log("\n🧪 Recette — Fusion d'aperçu préservant les choix\n");

const c = (source, rubrique, extrait, selectionne, confiance = 0.6) => ({
  source, rubrique, extrait, selectionne, confiance,
});

// 1. clé stable insensible casse/espaces
t("critereKey insensible aux espaces", critereKey(c("activites", "C2_competences_techniques", "  Gestion   Op@le ", true)) === critereKey(c("activites", "C2_competences_techniques", "Gestion Op@le", false)));
t("critereKey insensible à la casse", critereKey(c("activites", "C2_competences_techniques", "Gestion OP@LE", true)) === critereKey(c("activites", "C2_competences_techniques", "gestion op@le", false)));

// 2. Préservation d'un choix décoché
{
  const ancien = [c("activites", "C2_competences_techniques", "Gestion Op@le", false, 0.8)];
  const frais  = [c("activites", "C2_competences_techniques", "Gestion Op@le", true, 0.9)];
  const r = mergeApercuPreservant(ancien, frais);
  t("Choix décoché préservé après ré-analyse", r.fusionnes[0].selectionne === false);
  t("Confiance rafraîchie depuis la nouvelle analyse", r.fusionnes[0].confiance === 0.9);
  t("Compteur conserves = 1", r.conserves === 1);
  t("Compteur nouveaux  = 0", r.nouveaux === 0);
}

// 3. Préservation d'un choix coché
{
  const ancien = [c("missions_principales", "C1_resultats", "Pilotage budgétaire", true)];
  const frais  = [c("missions_principales", "C1_resultats", "Pilotage budgétaire", false)];
  const r = mergeApercuPreservant(ancien, frais);
  t("Choix coché préservé même si le défaut était 'décoché'", r.fusionnes[0].selectionne === true);
}

// 4. Nouveauté détectée
{
  const ancien = [c("activites", "C2_competences_techniques", "Gestion Op@le", false)];
  const frais  = [
    c("activites", "C2_competences_techniques", "Gestion Op@le", true),
    c("competences_requises", "C3_qualites_personnelles", "Sens de l'écoute", true),
  ];
  const r = mergeApercuPreservant(ancien, frais);
  t("Nouveau critère ajouté", r.fusionnes.length === 2);
  t("Nouveau critère conserve son selectionne par défaut", r.fusionnes.find((x) => x.extrait === "Sens de l'écoute").selectionne === true);
  t("Compteur nouveaux = 1", r.nouveaux === 1);
  t("Compteur conserves = 1", r.conserves === 1);
  t("Aucun obsolete", r.obsoletes === 0);
}

// 5. Obsolescence (critère supprimé de la fiche)
{
  const ancien = [
    c("activites", "C2_competences_techniques", "Tâche supprimée", true),
    c("missions_principales", "C1_resultats", "Pilotage budgétaire", true),
  ];
  const frais  = [c("missions_principales", "C1_resultats", "Pilotage budgétaire", false)];
  const r = mergeApercuPreservant(ancien, frais);
  t("Critère obsolète retiré", r.fusionnes.length === 1);
  t("Compteur obsoletes = 1", r.obsoletes === 1);
  t("Pilotage budgétaire reste coché", r.fusionnes[0].selectionne === true);
}

// 6. Aperçu vide → tout est nouveau
{
  const r = mergeApercuPreservant([], [c("activites", "C1_resultats", "X", true)]);
  t("Premier passage : tout est nouveau", r.nouveaux === 1 && r.conserves === 0);
}

console.log(`\n📊 Résultat : ${pass} OK / ${fail} KO\n`);
process.exit(fail === 0 ? 0 : 1);