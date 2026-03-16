/**
 * Base de connaissances M9-6 — Instruction codificatrice du 19 janvier 2026
 * Référence complète pour le chatbot et l'ensemble de l'application EPLE.
 *
 * Structure : 4 Tomes + Annexes
 * - Tome 1 : L'EPLE — acteurs et environnement
 * - Tome 2 : Le budget et son exécution
 * - Tome 3 : Le cadre comptable
 * - Tome 4 : Le compte financier
 * - Annexes : Planches comptables (1-26) + textes de référence
 */

// ──────────────────────────────────────────────────────────
// TOME 1 — ACTEURS ET ENVIRONNEMENT
// ──────────────────────────────────────────────────────────

export const ACTEURS_EPLE = {
  conseil_administration: {
    role: "Autorité délibérante — adopte budget, DBM, compte financier, tarifs, ANV",
    textes: ["L421-4 Code éducation", "R421-20", "R421-25", "R421-69"],
    composition: "Tripartite : administration + personnels + usagers (24 ou 30 membres)",
    quorum: "Majorité des membres en exercice ; 2e convocation sous 5-8 jours sans quorum",
    attributions_decisionnelles: [
      "Adoption budget, DBM, compte financier",
      "Tarifs ventes et prestations (sauf restauration = collectivité)",
      "Admission en non-valeur (peut fixer seuil de délégation à l'ordonnateur)",
      "Accord passation conventions et contrats",
      "Programmation et financement des voyages scolaires",
      "Transactions, dons et legs, acquisitions/aliénations",
    ],
  },
  chef_etablissement: {
    role: "Ordonnateur des recettes et des dépenses",
    textes: ["R421-9 Code éducation"],
    fonctions: [
      "Prépare et exécute délibérations du CA",
      "Transmet les actes (Dem'Act)",
      "Ordonnance recettes et dépenses",
      "Peut réquisitionner le comptable en cas de suspension de paiement",
    ],
  },
  adjoint_gestionnaire: {
    role: "Gestion matérielle, financière et administrative sous autorité du chef d'établissement",
    fonctions: [
      "Bons de commande (contresigne avec ordonnateur sauf délégation)",
      "Contrôle réception fournitures, service fait",
      "Préparation ordonnancement recettes/dépenses",
      "Situation mensuelle recettes/dépenses",
      "Comptabilité matières et stocks",
      "Inventaire général des immobilisations",
      "Mise en œuvre plan maîtrise risques financiers",
    ],
  },
  agent_comptable: {
    role: "Comptable public — responsable trésorerie, comptabilité générale, contrôle interne",
    textes: ["R421-62 à R421-65 Code éducation", "Art. 18 décret GBCP 2012-1246"],
    nomination: "Par le recteur, catégorie A, prestation de serment obligatoire",
    fonctions: [
      "Prise en charge et recouvrement des recettes",
      "Paiement des dépenses après contrôles",
      "Garde des fonds et valeurs",
      "Conservation pièces justificatives",
      "Tenue comptabilité du poste",
      "Contrôle comptabilité matière",
      "Pilotage CIC au sein du groupement",
    ],
    controles_payeur: [
      "Qualité de l'ordonnateur",
      "Disponibilité des crédits",
      "Exacte imputation budgétaire et comptable",
      "Validité de la créance (pièces justificatives, service fait, prescription)",
    ],
    procedure_signalement: "En cas d'anomalie, l'AC signale à l'ordonnateur avant suspension",
  },
  regisseurs: {
    role: "Mandataires du comptable pour encaissement/paiement limités",
    textes: ["Décret 2019-798", "Décret 2020-922", "Arrêté 13 août 2020"],
  },
} as const;

export const CONTROLES = {
  controle_actes: {
    budgetaires: "Transmission aux autorités de contrôle (préfet, collectivité, rectorat)",
    delais: "15 jours pour transmission, 30 jours pour contrôle de légalité",
  },
  controles_externes: [
    "IGESR — contrôle pédagogique et administratif",
    "DRFiP/DDFiP — contrôle comptable",
    "CRC — contrôle de gestion et contrôle budgétaire",
    "Cour des comptes — juridiction d'appel",
  ],
  responsabilite_gestionnaires_publics: {
    texte: "RGP — remplace la RPP depuis 2023 (sauf outre-mer art. 73 Constitution)",
    justiciables: "Ordonnateurs et comptables",
    infractions: "Insuffisance dans contrôles, retards, irrégularités",
    sanctions: "Amendes prononcées par la chambre du contentieux de la Cour des comptes",
  },
} as const;

// ──────────────────────────────────────────────────────────
// TOME 2 — BUDGET ET EXÉCUTION
// ──────────────────────────────────────────────────────────

export const PRINCIPES_BUDGETAIRES = {
  annualite: "Exercice du 1er janvier au 31 décembre",
  unite: "Budget unique (budget principal + budgets annexes éventuels)",
  universalite: {
    non_contraction: "Recettes et dépenses retracées séparément, sans contraction",
    non_affectation: "Sauf ressources sous conditions d'emploi",
  },
  specialite: "Crédits affectés à un service et un domaine",
  sincerite: "Évaluation sincère des recettes et dépenses",
  equilibre: {
    fonctionnement: "Section de fonctionnement : résultat prévisionnel + CAF/IAF",
    investissement: "Section des opérations en capital",
  },
} as const;

export const STRUCTURE_BUDGET = {
  sections: ["Fonctionnement", "Opérations en capital (investissement)"],
  services: {
    service_general: "Activité principale de l'EPLE",
    services_speciaux: [
      "SRH — Service de restauration et d'hébergement",
      "Bourses nationales",
      "Enseignement technique",
      "Budgets annexes (formation continue, GRETA...)",
    ],
  },
  nomenclature: {
    fonctionnement: "Par domaine et activité — comptes de classe 6 (charges) et 7 (produits)",
    investissement: "Comptes de classe 1 (capitaux) et 2 (immobilisations)",
  },
} as const;

export const EXECUTION_RECETTES = {
  phases: ["Liquidation (constatation des droits)", "Émission titre de recettes", "Prise en charge par l'AC", "Recouvrement"],
  titre_recettes: {
    contenu: "Formule exécutoire, mentions obligatoires, imputation",
    prescription_assiette: "4 ans (délai de droit commun)",
  },
  moyens_encaissement: [
    "Espèces", "Chèques bancaires", "Virement", "Prélèvement SEPA (ICS)",
    "Carte bancaire", "PayFiP", "Chèques vacances", "Tickets restaurant",
    "Carte services (porte-monnaie électronique)",
  ],
  recouvrement: {
    amiable: "Avis des sommes à payer, relances",
    contentieux: {
      satd: "Saisie administrative à tiers détenteur (SATD) — titre exécutoire obligatoire",
      commissaire_justice: "Mesures d'exécution forcée par voie de commissaire de justice",
      saisie_remunerations: "L3252-1 à L3252-7 Code du travail, L212-1 à L212-16 CPCE",
      saisie_comptes: "Saisie attribution sur comptes bancaires",
    },
    procedures_particulieres: [
      "Recouvrement sur personnes morales de droit public",
      "Procédures collectives (sauvegarde, redressement, liquidation)",
      "Surendettement des particuliers",
      "Recouvrement à l'étranger",
    ],
    transaction: "Accord amiable sous conditions (art. 2044 Code civil) — vote CA",
    anv: "Admission en non-valeur — vote CA (ou ordonnateur si seuil délégué)",
    remise_gracieuse: "Différente de l'ANV — décision de l'ordonnateur",
  },
} as const;

export const EXECUTION_DEPENSES = {
  phases: [
    "Engagement (juridique + budgétaire)",
    "Liquidation (service fait + pièces justificatives)",
    "Ordonnancement (mandatement)",
    "Paiement par l'agent comptable",
  ],
  engagement: {
    juridique: "Acte par lequel l'EPLE crée ou constate une obligation",
    budgetaire: "Réservation de crédits — contrôle de disponibilité",
    periode: "Du 1er janvier (ou date d'exécutoire du budget) au 31 décembre",
  },
  liquidation: {
    service_fait: "Certification obligatoire avant paiement (sauf dérogations réglementaires)",
    pieces_justificatives: "Production obligatoire — dématérialisation possible",
  },
  ordonnancement: {
    periode: "N : 1er janvier au 31 décembre | N+1 : période d'inventaire",
    mandatement_office: "Par le préfet en cas de carence de l'ordonnateur (loi n°80-539)",
  },
  controles_ac: {
    qualite_ordonnateur: true,
    disponibilite_credits: true,
    exacte_imputation: true,
    validite_creance: true,
    suspension: "L'AC peut suspendre le paiement — l'ordonnateur peut réquisitionner",
  },
  delai_global_paiement: "30 jours (marchés publics) — intérêts moratoires si dépassement",
  moyens_paiement: ["Virement (obligatoire au-delà de certains seuils)", "Prélèvement", "Chèque", "Espèces", "Carte bancaire", "Carte d'achat"],
} as const;

// ──────────────────────────────────────────────────────────
// TOME 2 — PASSIFS, ACTIFS, OPÉRATIONS SPÉCIFIQUES
// ──────────────────────────────────────────────────────────

export const REGLES_EVALUATION = {
  passifs: {
    definition: "Obligation actuelle résultant d'un événement passé dont l'extinction nécessitera une sortie de ressources",
    provisions: "Compte 15 — risques et charges probables, évaluation fiable",
    dettes: "Comptes 40, 42, 43, 44, 46 — charges à payer (CAP) + produits constatés d'avance (PCA)",
  },
  actifs: {
    definition: "Élément identifiable du patrimoine ayant une valeur économique positive",
    immobilisations: {
      incorporelles: "Compte 20 (logiciels, licences, brevets)",
      corporelles: "Compte 21 (terrains, constructions, matériel)",
      en_cours: "Compte 23",
      financieres: "Comptes 26, 27 (participations, dépôts, cautionnements)",
    },
    amortissements: {
      fonds_propres: "Dotation 6811 / Amortissement 28 — durées selon nature du bien",
      financement_externe: "Reprise financement 1049/1349 parallèle à l'amortissement 28",
    },
    stocks: "Comptes 31-33 — évaluation à l'entrée, inventaire, dépréciation compte 39",
  },
} as const;

export const OPERATIONS_SPECIFIQUES = {
  tresorerie: {
    unite_caisse: "Principe d'unité de caisse — tous les fonds sur un seul compte Trésor (5151)",
    placements: {
      budgetaires: "Immobilisations financières (classe 2)",
      tresorerie: "VMP compte 50 — placements autorisés sous conditions prudentielles",
    },
  },
  voyages_scolaires: "Section 2.5.2 — gestion budgétaire voyages et mobilité élèves",
  objets_confectionnes: "Sections 2.5.3 — matière d'œuvre, prestations de service, stocks",
  valeurs_inactives: "Compte 86 — tickets, carnets, bons divers (comptabilité classe 8)",
  periode_inventaire: {
    calendrier: "Janvier N+1 — opérations de régularisation avant clôture",
    operations: [
      "Charges à payer (CAP) — compte 408x, 428x, 438x, 448x, 468x",
      "Produits à recevoir (PAR) — comptes 418x, 428x, 448x, 468x",
      "Charges constatées d'avance (CCA) — compte 486",
      "Produits constatés d'avance (PCA) — compte 487",
      "Amortissements — dotation 6811, reprise financement",
      "Dépréciations — comptes 29, 39, 49, 59",
      "Provisions — compte 15",
      "Variation des stocks — compte 603",
    ],
  },
} as const;

// ──────────────────────────────────────────────────────────
// TOME 3 — CADRE COMPTABLE
// ──────────────────────────────────────────────────────────

export const PRINCIPES_COMPTABLES = [
  "Régularité — conformité aux règles et procédures",
  "Sincérité — application de bonne foi des règles",
  "Image fidèle — représentation fidèle du patrimoine et de la situation financière",
  "Permanence des méthodes — continuité d'application",
  "Continuité d'exploitation — présomption de pérennité",
  "Spécialisation des exercices — rattachement des charges et produits",
  "Non-compensation — pas de compensation entre actif/passif, charges/produits",
  "Prudence — prise en compte des risques et dépréciations",
  "Intangibilité du bilan d'ouverture — bilan N = bilan N-1 clôturé",
] as const;

export const PLAN_COMPTABLE_M96 = {
  classe_1: {
    intitule: "Comptes de capitaux",
    comptes_cles: {
      "10": "Financements d'actifs et réserves",
      "101": "Financements non rattachés – État",
      "104": "Financements rattachés à des actifs – État",
      "106": "Réserves (1064 réserves SRH, 1068 excédents capitalisés)",
      "11": "Report à nouveau",
      "12": "Résultat de l'exercice (excédent ou déficit)",
      "13": "Financement de l'actif par des tiers autres que l'État",
      "131": "Financements non rattachés (tiers)",
      "134": "Financements rattachés à des actifs (tiers)",
      "15": "Provisions pour risques et charges (151 risques, 157 gros entretien, 158 CET)",
      "16": "Emprunts et dettes assimilées (165 dépôts reçus, 167 conditions particulières)",
      "18": "Compte de liaison (185 opérations de trésorerie)",
    },
  },
  classe_2: {
    intitule: "Comptes d'immobilisations",
    comptes_cles: {
      "20": "Immobilisations incorporelles (205 logiciels)",
      "21": "Immobilisations corporelles (211-218 : terrains, constructions, matériel, collections)",
      "23": "Immobilisations en cours (231, 232, 237, 238)",
      "26": "Participations (261, 266)",
      "27": "Autres immobilisations financières (271/272 titres, 275 dépôts versés, 276 créances)",
      "28": "Amortissement des immobilisations (280, 281)",
      "29": "Dépréciations des immobilisations",
    },
  },
  classe_3: {
    intitule: "Comptes de stocks et en-cours",
    comptes_cles: {
      "31": "Matières premières",
      "32": "Autres approvisionnements",
      "33": "En-cours de production",
      "39": "Dépréciations des stocks",
    },
  },
  classe_4: {
    intitule: "Comptes de tiers",
    comptes_cles: {
      "40": "Fournisseurs (401 ordinaires, 404 immobilisations, 408 factures non parvenues, 409 débiteurs)",
      "41": "Clients (411 restauration/hébergement, 412 autres prestations, 4122 voyages scolaires, 416 douteux, 419 créditeurs)",
      "42": "Personnel (421 rémunérations, 425 avances, 427 oppositions, 428 CAP/PAR, 429 déficits/débets)",
      "43": "Sécurité sociale et organismes sociaux",
      "44": "État et collectivités publiques (441 subventions à recevoir, 442 PAS, 443 opérations part., 445 TVA, 448 CAP/PAR)",
      "46": "Débiteurs et créditeurs divers (461 déficits RGP, 462 cessions, 463 titres à recouvrer, 466 mandats à payer, 467 divers)",
      "47": "Comptes transitoires (471 recettes à classer, 472 dépenses avant ordonnancement)",
      "48": "Comptes de régularisation (486 CCA, 487 PCA)",
      "49": "Dépréciations des comptes de tiers (491)",
    },
  },
  classe_5: {
    intitule: "Comptes financiers",
    comptes_cles: {
      "50": "Valeurs mobilières de placement (506, 507, 508)",
      "51": "Banques (511 valeurs à l'encaissement, 5113 chèques vacances, 5115 CB, 5116 prélèvements, 5117 effets impayés, 5151 Trésor)",
      "53": "Caisse (531)",
      "54": "Régies (543 dépenses, 545 recettes, 548 avances menues dépenses)",
      "58": "Virements internes",
      "59": "Dépréciations des comptes financiers",
    },
  },
  classe_6: {
    intitule: "Comptes de charges",
    comptes_cles: {
      "60": "Achats et variation de stocks (601/602 approvisionnements, 603 variation, 606 non stockés, 609 RRR)",
      "61": "Services extérieurs (611 sous-traitance, 612 crédit-bail, 613 locations, 615 entretien, 616 assurance)",
      "62": "Autres services extérieurs (621 personnel ext., 622 honoraires, 624 transports, 625 déplacements, 627 frais bancaires)",
      "63": "Impôts et taxes (631/633 sur rémunérations, 635/637 autres)",
      "64": "Charges de personnel (641/642/644 rémunérations et charges)",
      "65": "Autres charges de gestion courante (654 pertes créances irrécouvrables, 656 VNC cédées, 657 subventions, 6583 annulation titres ant., 6584 déficits RGP)",
      "66": "Charges financières (666 pertes de change, 667 pertes VMP)",
      "68": "Dotations amortissements, dépréciations, provisions (681 exploitation, 686 financières)",
    },
  },
  classe_7: {
    intitule: "Comptes de produits",
    comptes_cles: {
      "70": "Ventes (706 prestations hébergement/restauration, 707 ventes marchandises, 708 autres)",
      "71": "Production stockée",
      "72": "Production immobilisée",
      "74": "Subventions d'exploitation (741 État, 744 collectivités, 747 autres publiques, 748 privées)",
      "75": "Autres produits de gestion courante (751 redevances, 756 cessions actif, 758 divers)",
      "76": "Produits financiers (761-764 participations, 765 escomptes, 767 produits VMP)",
      "78": "Reprises sur amortissements, dépréciations, provisions (781 exploitation, 786 financières)",
    },
  },
  classe_8: {
    intitule: "Comptes spéciaux",
    comptes_cles: {
      "80": "Engagements hors bilan (801/802 comptabilité des engagements, 809 contrepartie)",
      "86": "Valeurs inactives (tickets, carnets, bons)",
      "89": "Bilan (890 bilan d'ouverture)",
    },
  },
} as const;

// ──────────────────────────────────────────────────────────
// TOME 4 — COMPTE FINANCIER
// ──────────────────────────────────────────────────────────

export const COMPTE_FINANCIER = {
  definition: "Document de synthèse annuel retraçant l'ensemble des opérations budgétaires et comptables de l'exercice",
  preparation: {
    arrete_ecritures: "Arrêté des comptes de bilan + comptes de charges et produits",
    balance_definitive: "Établissement de la balance définitive après régularisations",
  },
  contenu: {
    pieces: [
      "Compte de résultat (charges classe 6 / produits classe 7)",
      "Bilan (actif classes 2-5 / passif classes 1, 4, 5)",
      "Balance générale des comptes",
      "Développement des charges et produits par service",
      "Tableau de concordance budgétaire",
    ],
    compte_rendu_gestion: "Rapport de l'agent comptable sur sa gestion",
    annexe: {
      sections: [
        "1. Faits caractéristiques de l'exercice",
        "2. Principes, règles et méthodes comptables",
        "3. Notes sur l'actif immobilisé et les amortissements",
        "4. Notes sur les stocks",
        "5. Notes sur les créances",
        "6. Notes sur les dettes",
        "7. Notes sur les financements",
        "8. Notes sur les provisions",
        "9. Notes sur les charges",
        "10. Notes sur les produits",
        "11. Autres informations (engagements hors bilan, événements post-clôture)",
      ],
    },
  },
  arret_transmission: {
    arret: "Vote du CA avant le 30 juin N+1",
    transmission: "Aux autorités de tutelle (rectorat, collectivité, préfecture)",
    production: "Conservation et archivage",
  },
} as const;

export const INDICATEURS_FINANCIERS = {
  resultat: {
    determination: "Produits classe 7 − Charges classe 6 = Excédent ou Déficit (compte 12)",
    affectation: "Vote du CA — vers réserves (1068) ou report à nouveau (11)",
  },
  caf_iaf: {
    definition: "Capacité d'autofinancement : excédent de ressources internes dégagé par l'activité",
    calcul: "Résultat + Dotations amort/dépréc/provisions (68) − Reprises (78) − Produits cessions (756) + VNC cédées (656) − Quote-part financement virée au résultat (1049/1349)",
    interpretation: {
      caf_positive: "L'établissement dégage un autofinancement",
      iaf: "Insuffisance : l'activité courante ne couvre pas les charges non décaissables",
    },
  },
  frng: {
    definition: "Fonds de roulement net global = Ressources stables − Emplois stables",
    calcul_haut_bilan: "Capitaux propres (10+11+12+13+15) + Dettes financières (16) − Actif immobilisé net (2 − 28 − 29)",
    calcul_bas_bilan: "Actif circulant (3+4+5) − Dettes CT (40+42+43+44+46+47+48)",
    interpretation: "Marge de sécurité financière ; > 30 jours de charges recommandé",
  },
  bfr: {
    definition: "Besoin en fonds de roulement = Créances + Stocks − Dettes d'exploitation",
    calcul: "(Comptes 3 + 40 débiteurs + 41 + 42 débiteurs + 44 débiteurs + 46 débiteurs + 486) − (40 créditeurs + 42 créditeurs + 43 + 44 créditeurs + 46 créditeurs + 487)",
  },
  tresorerie: {
    definition: "Trésorerie nette = FRNG − BFR = Disponibilités − Dettes financières CT",
    comptes: "50 + 51 + 53 + 54 − 16 CT − 519",
  },
  jours_autonomie: {
    calcul: "(FDR / Charges annuelles de fonctionnement) × 365",
    seuil: "30 jours minimum recommandé — en dessous, alerte financière",
  },
  cofi_pilotage: "Base de report d'informations — ancien Cofi-pilotage, maintenant intégré Op@le",
} as const;

// ──────────────────────────────────────────────────────────
// ANNEXES — PLANCHES COMPTABLES
// ──────────────────────────────────────────────────────────

export const PLANCHES_COMPTABLES = [
  { numero: 1, titre: "Dépenses — schéma d'écritures" },
  { numero: 2, titre: "Recettes — schéma d'écritures" },
  { numero: 3, titre: "Affectation du résultat en N+1" },
  { numero: 4, titre: "Biens acquis sur financement externe" },
  { numero: 5, titre: "Biens acquis sur fonds propres" },
  { numero: 6, titre: "Charges à payer / Immobilisations à payer" },
  { numero: 7, titre: "Produits à recevoir" },
  { numero: 8, titre: "Charges et produits constatés d'avance" },
  { numero: 9, titre: "Dépenses avant ordonnancement / Encaissements" },
  { numero: 10, titre: "Provisions et dépréciations" },
  { numero: 11, titre: "Opérations pour compte de tiers" },
  { numero: 12, titre: "Régie de recettes" },
  { numero: "12bis", titre: "Régie d'avances" },
  { numero: 13, titre: "Évolution des stocks et en-cours" },
  { numero: 14, titre: "Avances et acomptes" },
  { numero: 15, titre: "Valeurs inactives" },
  { numero: 16, titre: "Comptes de liaison budgets annexes" },
  { numero: 17, titre: "Encaissements CB et commissions bancaires" },
  { numero: 18, titre: "Comptabilisation des financements" },
  { numero: 19, titre: "Production immobilisée" },
  { numero: 20, titre: "Paye à façon (AED)" },
  { numero: 21, titre: "Paye" },
  { numero: 22, titre: "RRR obtenues" },
  { numero: 23, titre: "RRR accordées" },
  { numero: 24, titre: "Engagements hors bilan — Crédit-bail" },
  { numero: 25, titre: "Responsabilité des gestionnaires publics (RGP)" },
  { numero: 26, titre: "Différences de conversion en devises" },
] as const;

// ──────────────────────────────────────────────────────────
// OPÉRATIONS OPALE
// ──────────────────────────────────────────────────────────

export const TERMINOLOGIE_OPALE = {
  remplacement: "Op@le remplace GFC et COFI depuis 2024-2025",
  concepts: {
    demande_paiement: "Anciennement 'mandat' — document ordonnançant la dépense",
    demande_versement: "Document ordonnançant une opération comptable non budgétaire (à l'initiative de l'ordonnateur ou de l'AC)",
    demande_comptabilisation: "Écriture comptable passée par l'agent comptable",
    encaissement_sans_operation: "Recettes encaissées directement sans titre préalable (ex: intérêts)",
    titre_recette: "Ordre de recette émis par l'ordonnateur",
    ordre_recette: "Synonyme fonctionnel du titre de recette dans Op@le",
    service_fait: "Certification de la réalisation de la prestation avant paiement",
  },
  services_ap: ["ALO (Activités Locales)", "AED (Assistants d'Éducation)", "VIE (Vie Scolaire)", "ENS (Enseignement)"],
} as const;

// ──────────────────────────────────────────────────────────
// TEXTES DE RÉFÉRENCE
// ──────────────────────────────────────────────────────────

export const TEXTES_REFERENCE = {
  m96: "Instruction codificatrice M9-6 du 19 janvier 2026 (remplace version précédente)",
  gbcp: "Décret n° 2012-1246 du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique",
  code_education: "Articles L421-1 et suivants, R421-1 et suivants",
  code_commande_publique: {
    dispense_fournitures: "< 40 000 € HT (60 000 € HT à compter du 01/04/2026)",
    publicite_obligatoire: "≥ 90 000 € HT (BOAMP/JOUE selon seuil)",
    seuil_europeen_fcs: "216 000 € HT",
    dispense_travaux: "< 100 000 € HT",
    seuil_europeen_travaux: "5 404 000 € HT",
    source: "Décret n°2025-1386 du 29/12/2025",
  },
  regies: ["Décret n° 2019-798 du 26 juillet 2019", "Décret n° 2020-922 du 29 juillet 2020", "Arrêté du 13 août 2020"],
  voyages_scolaires: "Circulaire du 16 juillet 2024 + Guide Eduscol décembre 2025",
  rgp: "Ordonnance n° 2022-408 du 23 mars 2022 — Responsabilité des gestionnaires publics",
  collectivites: "Code général des collectivités territoriales",
  propriete_publique: "Code général de la propriété des personnes publiques",
  juridictions_financieres: "Code des juridictions financières",
} as const;
