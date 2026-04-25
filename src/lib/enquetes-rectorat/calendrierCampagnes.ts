/**
 * Calendrier pré-chargé des campagnes d'enquêtes rectorat type.
 * Échéances annuelles type, pour pré-configuration des campagnes.
 * Sources : circulaires académiques récurrentes, M9-6 tome 3, calendrier réglementaire EPLE.
 */

export interface EcheanceCampagneType {
  id: string;
  mois: number; // 1-12
  intitule: string;
  type_enquete: string;
  description: string;
  reference_reglementaire?: string;
  jour_echeance?: number;
}

export const CALENDRIER_CAMPAGNES_RECTORAT: EcheanceCampagneType[] = [
  // Mars
  { id: "tax-app", mois: 3, intitule: "Taxe d'apprentissage — déclaration N-1",
    type_enquete: "taxe_apprentissage",
    description: "Déclaration des sommes perçues au titre de la taxe d'apprentissage.",
    reference_reglementaire: "Code travail L.6241-2" },
  { id: "bilan-fc", mois: 3, intitule: "Bilan formation continue",
    type_enquete: "formation_continue",
    description: "Bilan d'activité formation continue (GRETA / CFA)." },
  // Avril-Mai
  { id: "compte-fin", mois: 5, intitule: "Compte financier N-1 (transmission rectorat)",
    type_enquete: "compte_financier",
    description: "Transmission obligatoire du compte financier au rectorat.",
    reference_reglementaire: "Code éducation R.421-77",
    jour_echeance: 31 },
  { id: "bilan-anv", mois: 5, intitule: "Bilan ANV (admissions en non-valeur)",
    type_enquete: "anv",
    description: "Bilan des admissions en non-valeur prononcées sur l'exercice." },
  // Juin
  { id: "effectifs-prev", mois: 6, intitule: "Effectifs prévisionnels rentrée",
    type_enquete: "effectifs",
    description: "Effectifs prévisionnels par division pour la rentrée à venir." },
  { id: "prep-budg", mois: 6, intitule: "Préparation budgétaire N+1",
    type_enquete: "budget_prep",
    description: "Éléments de cadrage budgétaire pour l'exercice à venir." },
  // Septembre
  { id: "habilit-opale", mois: 9, intitule: "Habilitations Op@le (rentrée)",
    type_enquete: "habilitations",
    description: "Mise à jour des habilitations Op@le suite à mouvements de personnels.",
    reference_reglementaire: "GBCP 2012-1246" },
  { id: "etat-regies", mois: 9, intitule: "État des régies",
    type_enquete: "regies",
    description: "État des régies actives, régisseurs et sous-régisseurs." },
  { id: "effectifs-cons", mois: 9, intitule: "Effectifs constatés rentrée",
    type_enquete: "effectifs",
    description: "Effectifs constatés par division au jour de la rentrée." },
  { id: "fs-modalites", mois: 9, intitule: "Modalités fonds sociaux votées",
    type_enquete: "fonds_sociaux",
    description: "Modalités d'attribution des fonds sociaux votées en CA." },
  // Octobre-Novembre
  { id: "reliquats-etat", mois: 10, intitule: "Reliquats subventions État (BOP 141, 230, 214)",
    type_enquete: "reliquats",
    description: "Reliquats sur les subventions État de l'exercice précédent.",
    reference_reglementaire: "M9-6 tome 3 / Note DAF A3" },
  { id: "reliquats-coll", mois: 11, intitule: "Reliquats collectivités (Région / Département)",
    type_enquete: "reliquats",
    description: "Reliquats sur les dotations Région et Département." },
  { id: "bourses-trim", mois: 11, intitule: "Bourses — versements trimestriels",
    type_enquete: "bourses",
    description: "Bilan des versements de bourses (rapprochement SIECLE / Op@le).",
    reference_reglementaire: "Circulaire MENE1704160C 17/02/2017" },
  // Décembre
  { id: "inventaire", mois: 12, intitule: "Inventaire physique",
    type_enquete: "inventaire",
    description: "Inventaire physique annuel des immobilisations.",
    reference_reglementaire: "M9-6 tome 3" },
  { id: "fin-exercice", mois: 12, intitule: "Enquêtes spécifiques fin d'exercice",
    type_enquete: "fin_exercice",
    description: "Enquêtes ad-hoc fin d'exercice (cyber, continuité, etc.)." },
];

export const MOIS_LABELS = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Retourne les campagnes regroupées par mois. */
export function groupCampagnesParMois(): Map<number, EcheanceCampagneType[]> {
  const map = new Map<number, EcheanceCampagneType[]>();
  for (const c of CALENDRIER_CAMPAGNES_RECTORAT) {
    if (!map.has(c.mois)) map.set(c.mois, []);
    map.get(c.mois)!.push(c);
  }
  return map;
}