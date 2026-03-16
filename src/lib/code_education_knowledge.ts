/**
 * Code de l'éducation — Articles applicables aux EPLE
 * Version en vigueur au 16 mars 2026
 * Source : Légifrance
 * 
 * Livre IV, Titre II : Les collèges et les lycées
 * Chapitre Ier : Organisation et fonctionnement des EPLE (R421-1 à D421-169)
 */

export const CODE_EDUCATION_EPLE = {
  titre: "Code de l'éducation — Livre IV, Titre II — Les collèges et les lycées",
  version: "En vigueur au 16 mars 2026",

  partie_legislative: {
    L421_1: "Les EPLE sont des établissements publics à caractère administratif. Ils sont créés par arrêté du représentant de l'État sur proposition de la collectivité de rattachement.",
    L421_2: "Les EPLE regroupent : 1° les collèges ; 2° les lycées ; 3° les établissements régionaux d'enseignement adapté (EREA) ; 4° les écoles régionales du premier degré.",
    L421_3: "Les EPLE disposent de l'autonomie en matière pédagogique, éducative et administrative. Leur budget, qui comprend une section de fonctionnement et une section d'investissement, est voté et exécuté en équilibre réel.",
    L421_4: "Le conseil d'administration règle par ses délibérations les affaires de l'établissement. Il est composé selon un principe tripartite (24 ou 30 membres).",
    L421_5: "Les actes de l'EPLE relatifs au fonctionnement sont exécutoires quinze jours après leur transmission. Le représentant de l'État, la collectivité de rattachement et le recteur peuvent déférer au tribunal administratif.",
    L421_7: "L'EPLE peut se voir confier la gestion de la restauration et de l'hébergement.",
    L421_10: "L'EPLE est constitué en groupement de service ou en groupement comptable.",
    L421_11: "L'adjoint gestionnaire est membre de l'équipe de direction et contribue à l'action éducative.",
    L421_14: "L'agent comptable, nommé par le recteur, est placé sous l'autorité administrative du chef d'établissement pour les tâches financières.",
    L421_16: "Les EPLE peuvent mutualiser leurs moyens par convention.",
  },

  partie_reglementaire: {
    section_1_dispositions_generales: {
      titre: "Section 1 : Dispositions générales (R421-1 à R421-7)",
      R421_1: "Les EPLE sont des personnes morales de droit public dotées de l'autonomie administrative et financière.",
      R421_2: "Les EPLE comprennent les collèges, lycées d'enseignement général et technologique, lycées professionnels, EREA et écoles régionales du premier degré.",
      R421_3: "Le siège et la catégorie de l'EPLE sont fixés par l'acte de création.",
      R421_4: "L'EPLE est soumis au contrôle de légalité exercé par le préfet et au contrôle budgétaire.",
    },

    section_2_organisation_administrative: {
      titre: "Section 2 : Organisation administrative (R421-8 à R421-56)",

      chef_etablissement: {
        titre: "Sous-section 1 : Le chef d'établissement (R421-8 à R421-13)",
        R421_8: "Le chef d'établissement dirige l'EPLE et en est le représentant de l'État.",
        R421_9: "Le chef d'établissement est ordonnateur des recettes et des dépenses de l'EPLE. À ce titre, il : prépare les travaux du CA, exécute ses délibérations, prescrit l'exécution des recettes, engage et ordonnance les dépenses.",
        R421_10: "Le chef d'établissement est compétent en matière de passation des marchés et conventions.",
        R421_12: "Le chef d'établissement peut déléguer sa signature à l'adjoint, au gestionnaire, au directeur de SEGPA.",
        R421_13: "En cas d'absence du chef d'établissement, l'adjoint le supplée.",
      },

      conseil_administration: {
        titre: "Sous-section 2 : Le conseil d'administration (R421-14 à R421-36)",
        composition: {
          R421_14: "Le CA comprend : le chef d'établissement (président), l'adjoint, le gestionnaire, le CPE le plus ancien, le directeur adjoint chargé de SEGPA, le chef des travaux, un représentant de la collectivité, 3 représentants de la commune, des personnalités qualifiées.",
          R421_15: "Dans les collèges : 24 membres. Dans les lycées : 30 membres.",
          R421_16: "Les représentants élus des personnels, parents et élèves.",
        },
        competences: {
          R421_20: "Le CA fixe les principes de mise en œuvre de l'autonomie pédagogique et éducative. Il adopte : le projet d'établissement, le règlement intérieur, le budget et le compte financier, le rapport de fonctionnement.",
          R421_21: "Le CA donne son accord sur : la passation de conventions, les contrats, l'adhésion à un groupement.",
          R421_22: "Le CA donne son avis sur : les mesures annuelles de créations et suppressions de sections, les principes de choix des manuels scolaires.",
          R421_23: "Le CA est consulté sur les questions relatives à l'hygiène, la santé, la sécurité.",
          R421_24: "Le CA peut, à la majorité des deux tiers, demander l'inscription d'une question à l'ordre du jour.",
        },
        fonctionnement: {
          R421_25: "Le CA se réunit en séance ordinaire à l'initiative du chef d'établissement au moins 3 fois par an.",
        },
      },

      commission_permanente: {
        titre: "Sous-section 3 : La commission permanente (R421-37 à R421-41)",
        R421_37: "La commission permanente est composée du chef d'établissement (président), de l'adjoint, du gestionnaire, d'un représentant de la collectivité et de représentants élus.",
        R421_41: "La commission permanente instruit les questions soumises à l'examen du CA. Elle est saisie obligatoirement des questions relevant du domaine pédagogique.",
      },

      tutelle: {
        titre: "Sous-section 7 : Relations avec les autorités de tutelle (R421-54 à R421-56)",
        R421_54: "Les actes du CA sont transmis au représentant de l'État, à la collectivité de rattachement et au recteur.",
        R421_55: "Le budget doit être transmis dans les 5 jours suivant le vote. Il devient exécutoire 30 jours après transmission, sauf désaccord.",
        R421_56: "Le préfet peut régler le budget en cas de défaut d'adoption ou de désaccord entre les autorités.",
      },
    },

    section_3_organisation_financiere: {
      titre: "Section 3 : Organisation financière (R421-57 à R421-78)",

      budget: {
        R421_57: "Le budget de l'EPLE comprend une section de fonctionnement et une section d'opérations en capital.",
        R421_58: "Le budget est voté par le CA avant le 30 novembre de l'année précédant l'exercice.",
        R421_59: "Le budget est établi en section de fonctionnement par service : service général et services spéciaux.",
        R421_60: "Les services spéciaux comprennent : le service de restauration et d'hébergement (SRH), les bourses, l'enseignement technique, les budgets annexes de formation continue (GRETA), les budgets annexes des centres de formation d'apprentis.",
        R421_61: "Les DBM (décisions budgétaires modificatives) peuvent être adoptées en cours d'exercice.",
      },

      agent_comptable: {
        R421_62: "L'agent comptable est nommé par le recteur parmi les fonctionnaires de catégorie A. Il est responsable de l'établissement dont il assure la comptabilité et des établissements rattachés (groupement comptable). Il a la qualité de comptable public.",
        R421_63: "L'AC a la charge de la comptabilité générale. Il assure le recouvrement des recettes et le paiement des dépenses. Il est responsable de la garde des fonds et valeurs.",
        R421_64: "L'AC est responsable de la tenue de la comptabilité de l'établissement et des établissements rattachés.",
        R421_65: "L'AC vérifie les écritures de ses subordonnés dans les établissements rattachés.",
      },

      execution: {
        R421_66: "Le chef d'établissement est seul compétent pour constater les droits de l'EPLE.",
        R421_67: "Le comptable procède au recouvrement des recettes. En cas de non-recouvrement, il peut engager des poursuites.",
        R421_68: "Les dépenses sont engagées par l'ordonnateur dans la limite des crédits ouverts au budget.",
        R421_69: "L'AC vérifie la régularité des mandats et y donne suite.",
        R421_70: "En cas de suspension de paiement par l'AC, le chef d'établissement peut réquisitionner (sauf cas de l'art. 195 GBCP).",
      },

      compte_financier: {
        R421_77: "Le compte financier est voté par le CA avant le 30 juin de l'année N+1.",
        R421_78: "Le compte financier comporte le compte de résultat, le bilan, la balance générale, le développement par service, les annexes.",
      },
    },
  },

  dispositions_specifiques: {
    groupements_comptables: {
      description: "R421-62 : Un agent comptable peut être commun à plusieurs EPLE (groupement comptable). L'AC du poste principal est responsable de l'ensemble des comptabilités.",
      fonctionnement: "L'AC pilote le contrôle interne comptable (CIC) de tous les établissements du groupement.",
    },
    groupements_services: {
      description: "L421-10 : Les EPLE peuvent constituer des groupements de services pour mutualiser certaines fonctions (ex: service des ressources humaines mutualisé).",
    },
    greta: {
      description: "Les GRETA sont des groupements d'établissements scolaires publics pour la formation continue des adultes. Le budget du GRETA est un budget annexe de l'EPLE support.",
    },
    eplei: {
      description: "Les établissements publics locaux d'enseignement international (EPLEI) sont des EPLE dotés de sections internationales.",
    },
  },
};

export const CODE_EDUCATION_ACTEURS = {
  chef_etablissement: {
    qualite: "Ordonnateur des recettes et des dépenses (R421-9)",
    fonctions: [
      "Présidence du CA et de la commission permanente",
      "Préparation et exécution des délibérations du CA",
      "Prescription de l'exécution des recettes",
      "Engagement et ordonnancement des dépenses",
      "Passation des marchés et conventions",
      "Pouvoir de réquisition du comptable (R421-70)",
    ],
    delegation: "Peut déléguer sa signature à l'adjoint, au gestionnaire, au directeur SEGPA (R421-12)",
  },

  adjoint_gestionnaire: {
    qualite: "Membre de l'équipe de direction (L421-11)",
    fonctions: [
      "Gestion matérielle de l'établissement",
      "Préparation et suivi de l'exécution budgétaire",
      "Gestion des contrats et marchés",
      "Responsabilité des stocks et de l'inventaire",
      "Coordination de la maintenance des bâtiments",
      "Peut recevoir délégation de signature de l'ordonnateur",
    ],
  },

  agent_comptable: {
    qualite: "Comptable public, catégorie A, nommé par le recteur (R421-62)",
    fonctions: [
      "Tenue de la comptabilité générale",
      "Recouvrement des recettes",
      "Paiement des dépenses après contrôles (art. 19-20 GBCP)",
      "Garde et conservation des fonds et valeurs",
      "Responsabilité personnelle et pécuniaire",
      "Pilotage du contrôle interne comptable (CIC)",
      "Établissement du compte financier (R421-77)",
      "Prestation de serment devant la juridiction financière",
    ],
    groupement: "Responsable de la comptabilité de l'établissement siège et des établissements rattachés",
  },

  conseil_administration: {
    qualite: "Organe délibérant de l'EPLE (L421-4, R421-20)",
    competences_decisionnelles: [
      "Adoption du budget et des DBM",
      "Vote du compte financier",
      "Fixation des tarifs (restauration, hébergement, voyages)",
      "Accord sur les conventions et contrats",
      "Admission en non-valeur (ANV) des créances irrécouvrables",
      "Approbation du projet d'établissement",
      "Adoption du règlement intérieur",
      "Accord sur les voyages scolaires et fixation de la participation des familles",
    ],
    composition: "Tripartite : 24 membres (collèges) ou 30 membres (lycées)",
    fonctionnement: "Minimum 3 séances par an. Quorum = majorité des membres.",
  },

  regisseurs: {
    qualite: "Mandataires de l'agent comptable",
    textes: "Décrets n°2019-798, n°2020-922, arrêté du 13/08/2020",
    types: [
      "Régisseur d'avances : encaisse les recettes pour le compte de l'AC",
      "Régisseur de recettes : effectue les paiements pour le compte de l'AC",
      "Régisseur de recettes et d'avances",
    ],
    nomination: "Nommé par l'ordonnateur avec l'agrément de l'agent comptable (R421-66, art. 190 GBCP)",
  },
};
