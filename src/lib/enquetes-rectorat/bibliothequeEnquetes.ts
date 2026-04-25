/**
 * Bibliothèque d'enquêtes pré-configurées (chantier 5).
 * 11 modèles d'enquêtes type, prêts à instancier en campagne.
 * Sources : circulaires académiques récurrentes, M9-6 tome 3, MENE1704160C.
 */

export interface ChampEnquete {
  id: string;
  libelle: string;
  type: "texte" | "nombre" | "montant" | "date" | "boolean" | "compte" | "select";
  obligatoire: boolean;
  options?: string[];
  aide?: string;
  compte_lie?: string;
}

export interface ModeleEnquete {
  id: string;
  intitule: string;
  type_enquete: string;
  periode_type: "annuelle" | "trimestrielle" | "ponctuelle";
  description: string;
  reference_reglementaire?: string;
  champs: ChampEnquete[];
  delai_jours_defaut: number;
}

export const BIBLIOTHEQUE_ENQUETES: ModeleEnquete[] = [
  {
    id: "rel-bop-141",
    intitule: "Reliquats BOP 141 (collège)",
    type_enquete: "reliquats",
    periode_type: "annuelle",
    description: "Reliquats sur subventions État BOP 141 — enseignement scolaire public 2nd degré.",
    reference_reglementaire: "M9-6 tome 3 / Note DAF A3",
    delai_jours_defaut: 30,
    champs: [
      { id: "montant_initial", libelle: "Subvention initiale (€)", type: "montant", obligatoire: true, compte_lie: "44181X" },
      { id: "montant_engage", libelle: "Montant engagé (€)", type: "montant", obligatoire: true },
      { id: "montant_reliquat", libelle: "Reliquat constaté (€)", type: "montant", obligatoire: true },
      { id: "action_proposee", libelle: "Action proposée", type: "select", obligatoire: true,
        options: ["reaffectation", "despecialisation", "reversement_familles", "restitution_rectorat", "report_exercice_suivant"] },
      { id: "justification", libelle: "Justification", type: "texte", obligatoire: true },
    ],
  },
  {
    id: "rel-bop-230",
    intitule: "Reliquats BOP 230 (vie de l'élève)",
    type_enquete: "reliquats",
    periode_type: "annuelle",
    description: "Reliquats BOP 230 — fonds sociaux, AED, dispositifs d'inclusion.",
    reference_reglementaire: "M9-6 tome 3",
    delai_jours_defaut: 30,
    champs: [
      { id: "montant_initial", libelle: "Dotation initiale (€)", type: "montant", obligatoire: true },
      { id: "montant_consomme", libelle: "Consommé (€)", type: "montant", obligatoire: true },
      { id: "reliquat", libelle: "Reliquat (€)", type: "montant", obligatoire: true },
      { id: "destination", libelle: "Destination du reliquat", type: "texte", obligatoire: true },
    ],
  },
  {
    id: "rel-bop-214",
    intitule: "Reliquats BOP 214 (soutien)",
    type_enquete: "reliquats",
    periode_type: "annuelle",
    description: "Reliquats BOP 214 — programme support.",
    reference_reglementaire: "M9-6 tome 3",
    delai_jours_defaut: 30,
    champs: [
      { id: "montant_initial", libelle: "Dotation initiale (€)", type: "montant", obligatoire: true },
      { id: "reliquat", libelle: "Reliquat (€)", type: "montant", obligatoire: true },
    ],
  },
  {
    id: "bourses-trim-1",
    intitule: "Bourses 2nd degré — versement T1",
    type_enquete: "bourses",
    periode_type: "trimestrielle",
    description: "Bilan des versements de bourses du trimestre 1, rapprochement SIECLE.",
    reference_reglementaire: "Circulaire MENE1704160C 17/02/2017",
    delai_jours_defaut: 21,
    champs: [
      { id: "nb_boursiers_siecle", libelle: "Nb boursiers SIECLE", type: "nombre", obligatoire: true },
      { id: "nb_paiements_opale", libelle: "Nb paiements Op@le", type: "nombre", obligatoire: true },
      { id: "montant_verse", libelle: "Montant versé (€)", type: "montant", obligatoire: true, compte_lie: "443110" },
      { id: "ecarts_constates", libelle: "Écarts constatés", type: "texte", obligatoire: false },
    ],
  },
  {
    id: "tax-app-decl",
    intitule: "Déclaration taxe d'apprentissage",
    type_enquete: "taxe_apprentissage",
    periode_type: "annuelle",
    description: "Déclaration des sommes perçues au titre de la taxe d'apprentissage (art. L.6241-2 Code travail).",
    reference_reglementaire: "Code travail L.6241-2",
    delai_jours_defaut: 45,
    champs: [
      { id: "montant_percu", libelle: "Montant perçu N-1 (€)", type: "montant", obligatoire: true, compte_lie: "44312" },
      { id: "nb_entreprises", libelle: "Nb d'entreprises versantes", type: "nombre", obligatoire: false },
      { id: "affectation", libelle: "Affectation détaillée", type: "texte", obligatoire: true },
    ],
  },
  {
    id: "fs-modalites",
    intitule: "Modalités fonds sociaux votées",
    type_enquete: "fonds_sociaux",
    periode_type: "annuelle",
    description: "Modalités d'attribution des fonds sociaux votées par le CA — circulaire fonds sociaux.",
    delai_jours_defaut: 30,
    champs: [
      { id: "date_ca", libelle: "Date du CA", type: "date", obligatoire: true },
      { id: "plafond_aide", libelle: "Plafond unitaire (€)", type: "montant", obligatoire: true },
      { id: "criteres", libelle: "Critères principaux", type: "texte", obligatoire: true },
      { id: "commission_etablie", libelle: "Commission FSE constituée", type: "boolean", obligatoire: true },
    ],
  },
  {
    id: "habilit-opale",
    intitule: "Habilitations Op@le rentrée",
    type_enquete: "habilitations",
    periode_type: "annuelle",
    description: "État des habilitations Op@le suite mouvements de personnels (GBCP).",
    reference_reglementaire: "GBCP 2012-1246",
    delai_jours_defaut: 21,
    champs: [
      { id: "nb_ordo", libelle: "Nb ordonnateurs (chef + adjoint)", type: "nombre", obligatoire: true },
      { id: "nb_agc_compta", libelle: "Nb agents comptables habilités", type: "nombre", obligatoire: true },
      { id: "nb_gestionnaires", libelle: "Nb SGEPLE / adjoint-gestionnaire", type: "nombre", obligatoire: true },
      { id: "delegations_signees", libelle: "Délégations de signature signées", type: "boolean", obligatoire: true },
    ],
  },
  {
    id: "regies-etat",
    intitule: "État des régies",
    type_enquete: "regies",
    periode_type: "annuelle",
    description: "État des régies de recettes et d'avances actives au sein de l'EPLE.",
    reference_reglementaire: "Décret 2008-227",
    delai_jours_defaut: 21,
    champs: [
      { id: "nb_regies_recettes", libelle: "Régies recettes actives", type: "nombre", obligatoire: true },
      { id: "nb_regies_avances", libelle: "Régies avances actives", type: "nombre", obligatoire: true },
      { id: "regisseurs_assermentes", libelle: "Régisseurs assermentés", type: "boolean", obligatoire: true },
    ],
  },
  {
    id: "anv-bilan",
    intitule: "Bilan ANV (admissions en non-valeur)",
    type_enquete: "anv",
    periode_type: "annuelle",
    description: "Bilan des admissions en non-valeur prononcées au cours de l'exercice.",
    delai_jours_defaut: 30,
    champs: [
      { id: "nb_anv", libelle: "Nb d'ANV prononcées", type: "nombre", obligatoire: true },
      { id: "montant_anv", libelle: "Montant total ANV (€)", type: "montant", obligatoire: true },
      { id: "motifs_principaux", libelle: "Motifs principaux", type: "texte", obligatoire: true },
    ],
  },
  {
    id: "effectifs-rentree",
    intitule: "Effectifs rentrée",
    type_enquete: "effectifs",
    periode_type: "annuelle",
    description: "Effectifs constatés par division au jour de la rentrée.",
    delai_jours_defaut: 14,
    champs: [
      { id: "nb_total", libelle: "Effectif total constaté", type: "nombre", obligatoire: true },
      { id: "nb_demi_pension", libelle: "Demi-pensionnaires", type: "nombre", obligatoire: true },
      { id: "nb_internes", libelle: "Internes", type: "nombre", obligatoire: false },
    ],
  },
  {
    id: "inventaire-physique",
    intitule: "Inventaire physique annuel",
    type_enquete: "inventaire",
    periode_type: "annuelle",
    description: "Inventaire physique des immobilisations selon M9-6 tome 3.",
    reference_reglementaire: "M9-6 tome 3",
    delai_jours_defaut: 60,
    champs: [
      { id: "date_inventaire", libelle: "Date inventaire", type: "date", obligatoire: true },
      { id: "nb_biens", libelle: "Nb de biens recensés", type: "nombre", obligatoire: true },
      { id: "ecarts_constates", libelle: "Écarts constatés", type: "texte", obligatoire: false },
      { id: "valeur_brute", libelle: "Valeur brute totale (€)", type: "montant", obligatoire: true },
    ],
  },
];

export function getModele(id: string): ModeleEnquete | undefined {
  return BIBLIOTHEQUE_ENQUETES.find((m) => m.id === id);
}