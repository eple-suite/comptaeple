/**
 * Décret GBCP n° 2012-1246 du 7 novembre 2012
 * relatif à la gestion budgétaire et comptable publique
 * 
 * Extraits structurés des articles applicables aux EPLE
 * Source : Légifrance, version consolidée au 16 mars 2026
 */

export const GBCP_PRINCIPES_FONDAMENTAUX = {
  titre: "Titre Ier — Principes fondamentaux (art. 7 à 62)",
  
  cadre_budgetaire: {
    art_7: "Le budget est l'acte par lequel sont prévues et autorisées les recettes et les dépenses.",
    art_8: "Les opérations relatives à l'exécution du budget relèvent exclusivement des ordonnateurs et des comptables publics.",
    art_9: "Les fonctions d'ordonnateur et de comptable public sont incompatibles. Les conjoints des ordonnateurs ne peuvent être comptables des personnes morales auprès desquelles ces ordonnateurs exercent leurs fonctions.",
  },

  ordonnateurs: {
    art_10: "Les ordonnateurs prescrivent l'exécution des recettes et des dépenses. Ils peuvent déléguer leur signature et se faire suppléer. Ils sont accrédités auprès des comptables publics assignataires.",
    art_11: "Les ordonnateurs constatent les droits et obligations, liquident les recettes et émettent les ordres de recouvrer. Ils engagent, liquident et ordonnancent les dépenses. Ils transmettent au comptable les ordres assortis des pièces justificatives et des certifications.",
    art_12: "Les ordonnateurs encourent une responsabilité à raison de l'exercice de leurs attributions et des certifications qu'ils délivrent.",
  },

  comptables: {
    art_13: "Les comptables publics sont des agents de droit public ayant la charge exclusive de manier les fonds et de tenir les comptes.",
    art_14: "Un même poste comptable est confié à un seul comptable public. À leur première installation, les comptables prêtent serment.",
    art_16: "Les comptables publics peuvent désigner des mandataires ayant qualité pour agir en leur nom et sous leur responsabilité.",
    art_17: "Les comptables publics sont personnellement et pécuniairement responsables des actes et contrôles qui leur incombent (art. 60 loi 23/02/1963).",
    art_18: {
      description: "Dans le poste comptable qu'il dirige, le comptable public est seul chargé de :",
      attributions: [
        "1° Tenue de la comptabilité générale",
        "2° Tenue de la comptabilité budgétaire (sous réserve compétences ordonnateur)",
        "3° Comptabilisation des valeurs inactives",
        "4° Prise en charge des ordres de recouvrer et de payer",
        "5° Recouvrement des ordres de recouvrer et créances",
        "6° Encaissement des droits au comptant et recettes",
        "7° Paiement des dépenses",
        "8° Suite à donner aux oppositions à paiement",
        "9° Garde et conservation des fonds et valeurs",
        "10° Maniement des fonds et mouvements de comptes",
        "11° Conservation des pièces justificatives et documents de comptabilité",
      ],
    },
    art_19: {
      description: "Contrôles du comptable public :",
      controles_recettes: [
        "a) Régularité de l'autorisation de percevoir la recette",
        "b) Mise en recouvrement des créances, régularité des réductions/annulations",
      ],
      controles_depenses: [
        "a) Qualité de l'ordonnateur",
        "b) Exacte imputation des dépenses (spécialité des crédits)",
        "c) Disponibilité des crédits",
        "d) Validité de la dette (art. 20)",
        "e) Caractère libératoire du paiement",
      ],
    },
    art_20: {
      description: "Contrôle de la validité de la dette :",
      elements: [
        "1° Justification du service fait",
        "2° Exactitude de la liquidation",
        "3° Intervention des contrôles préalables prescrits",
        "4° Existence du visa ou avis préalable du contrôleur budgétaire",
        "5° Production des pièces justificatives",
        "6° Application des règles de prescription et de déchéance",
      ],
    },
    art_21: "Les comptables procèdent à la reddition des comptes à la clôture de chaque exercice.",
    art_22: "Des régisseurs peuvent être chargés pour le compte des comptables d'opérations d'encaissement ou de paiement.",
  },

  operations_recettes: {
    art_23: "Les recettes comprennent les produits des impositions, les produits résultant de conventions ou décisions de justice et les autres produits autorisés.",
    art_24: "Les recettes sont liquidées avant d'être recouvrées. La liquidation détermine le montant de la dette des redevables. Les recettes sont liquidées pour leur montant intégral, sans contraction avec les dépenses.",
    art_25: "Le règlement est fait par tout moyen ou instrument de paiement prévu par le code monétaire et financier.",
    art_28: "L'ordre de recouvrer fonde l'action de recouvrement. Il a force exécutoire (art. L. 252 A LPF). Le comptable muni d'un titre exécutoire peut poursuivre l'exécution forcée.",
  },

  operations_depenses: {
    art_29: "Les opérations de dépenses sont successivement : l'engagement, la liquidation, le cas échéant l'ordonnancement, ainsi que le paiement.",
    art_30: "L'engagement est l'acte juridique par lequel une personne morale crée ou constate à son encontre une obligation de laquelle résultera une dépense. L'engagement respecte l'objet et les limites de l'autorisation budgétaire.",
    art_31: "La liquidation consiste à vérifier la réalité de la dette et arrêter le montant de la dépense : 1° certification du service fait ; 2° détermination du montant.",
    art_32: "L'ordonnancement est l'ordre donné par l'ordonnateur au comptable de payer une dépense.",
    art_33: "Le paiement est l'acte par lequel la personne morale se libère de sa dette. Le paiement ne peut intervenir avant l'échéance, l'exécution du service, ou la décision d'attribution.",
    art_38: "Suspension de paiement et réquisition : lorsque le comptable constate des irrégularités, il suspend le paiement et en informe l'ordonnateur. Celui-ci peut requérir par écrit le comptable de payer.",
    art_42: "Le comptable peut exercer les contrôles de manière hiérarchisée, en fonction des risques (contrôle hiérarchisé de la dépense — CHD / contrôle allégé en partenariat — CAP).",
  },

  operations_tresorerie: {
    art_43: "Constituent des opérations de trésorerie : mouvements de numéraire, valeurs mobilisables, comptes de dépôts et comptes courants.",
    art_47: "Les personnes morales sont tenues de déposer leurs fonds au Trésor.",
    art_48: "La caisse d'un poste comptable est unique. Un poste comptable peut disposer d'un ou plusieurs comptes de disponibilités.",
  },

  justification: {
    art_50: "Les opérations doivent être justifiées par des pièces prévues dans des nomenclatures établies par arrêté.",
    art_51: "L'établissement, la conservation et la transmission des documents peuvent être effectués sous forme dématérialisée.",
  },

  comptabilites: {
    art_53: "La comptabilité publique permet de : 1° saisir, classer, enregistrer les opérations ; 2° présenter des états financiers reflétant une image fidèle ; 3° contribuer au calcul du coût des actions.",
    art_55: "La comptabilité publique comporte une comptabilité générale et une comptabilité budgétaire. En outre, il peut être tenu une comptabilité analytique.",
    art_56: "La comptabilité générale retrace l'ensemble des mouvements affectant le patrimoine, la situation financière et le résultat. Elle est fondée sur le principe de la constatation des droits et obligations.",
    art_57: {
      description: "Qualité des comptes — objectifs :",
      objectifs: [
        "1° Conformité aux règles et procédures en vigueur",
        "2° Méthodes permanentes, comparabilité entre exercices",
        "3° Appréhension de tous les événements de gestion (prudence)",
        "4° Bon rattachement des opérations à l'exercice",
        "5° Exhaustivité, évaluation séparée, sans compensation",
        "6° Écritures fiables, intelligibles, pertinentes — image fidèle",
      ],
    },
    art_58: "La comptabilité budgétaire retrace l'ouverture et la consommation des autorisations d'engager et de payer, ainsi que l'enregistrement des recettes autorisées.",
    art_60: "Le comptable assure la comptabilisation des valeurs inactives (formules, titres, tickets, timbres, vignettes, valeurs confiées, objets en dépôt).",
  },
};

export const GBCP_ORGANISMES = {
  titre: "Titre III — Les organismes (art. 174 à 229) — applicable aux EPLE",

  agent_comptable: {
    art_188: "Le comptable public porte le titre d'agent comptable. Il existe au sein de chaque organisme un poste comptable dirigé par un agent comptable principal, chef des services de la comptabilité. L'AC peut exercer des fonctions de chef des services financiers et effectuer, par dérogation à l'art. 9, des tâches relevant de l'ordonnateur.",
    art_190: "Des régisseurs de recettes et d'avances peuvent être nommés par l'ordonnateur avec l'agrément de l'agent comptable. L'AC assiste avec voix consultative aux séances de l'organe délibérant.",
    art_191: "L'AC s'assure du respect des principes comptables et de la qualité du contrôle interne comptable. Lorsqu'il constate une irrégularité, il en informe l'ordonnateur.",
  },

  recettes: {
    art_192: "L'ordre de recouvrer est adressé aux redevables par l'ordonnateur ou l'AC. Tout ordre de recouvrer donne lieu à une phase de recouvrement amiable. En cas d'échec, l'AC décide l'engagement du recouvrement contentieux. L'exécution forcée peut être suspendue sur ordre écrit de l'ordonnateur.",
    art_193: {
      description: "Sur délibération de l'organe délibérant après avis de l'AC, les créances peuvent faire l'objet de :",
      cas: [
        "1° Remise gracieuse en cas de gêne du débiteur",
        "2° Remise gracieuse des intérêts moratoires",
        "3° Admission en non-valeur (créance irrécouvrable)",
        "4° Rabais, remises, ristournes à fins commerciales",
      ],
    },
  },

  depenses: {
    art_194: "L'ordonnateur a seul qualité pour procéder à l'engagement des dépenses. L'autorisation préalable de l'organe délibérant est requise : 1° acquisitions immobilières au-delà d'un seuil ; 2° autres contrats au-delà d'un montant déterminé.",
    art_195: {
      description: "Réquisition de l'AC :",
      regle: "Lorsque l'ordonnateur a requis l'AC de payer (art. 38), celui-ci défère à la réquisition et en informe le ministre chargé du budget.",
      exceptions: [
        "1° Indisponibilité des crédits",
        "2° Absence de justification du service fait",
        "3° Caractère non libératoire du règlement",
        "4° Défaut de saisine ou refus de visa du contrôleur budgétaire",
        "5° Manque de fonds disponibles",
      ],
    },
  },

  compte_financier: {
    art_211: {
      description: "Le compte financier comprend :",
      elements: [
        "1° États retraçant les autorisations budgétaires et leur exécution",
        "2° Tableau présentant l'équilibre financier tel qu'exécuté",
        "3° États financiers annuels (bilan, compte de résultat, annexe)",
        "4° Balance des comptes des valeurs inactives",
      ],
    },
    art_212: "Le compte financier est établi par l'AC à la fin de chaque exercice. Il est visé par l'ordonnateur. Il est soumis à l'organe délibérant qui l'arrête, après avoir entendu l'AC, avant l'expiration du 2e mois suivant la clôture. Il est accompagné d'un rapport de gestion.",
    art_213: "Le compte financier arrêté est soumis à l'approbation des autorités de tutelle. À défaut de décision dans un délai d'un mois, il est réputé approuvé.",
    art_214: "Dans les deux mois suivant l'arrêt, l'AC adresse au juge des comptes : le compte financier, le rapport de gestion, les délibérations budget/CF, les pièces de réquisition.",
  },

  controle_interne: {
    art_215: "Dans chaque organisme est mis en place un dispositif de contrôle interne budgétaire (CIB) et de contrôle interne comptable (CIC). Le CIB maîtrise les risques de qualité de la comptabilité budgétaire et de soutenabilité. Le CIC maîtrise les risques de qualité des comptes.",
    art_216: "L'audit interne budgétaire et comptable donne une assurance raisonnable sur le degré de maîtrise des opérations. L'organe délibérant arrête un programme d'audit.",
    art_219: "Le contrôle de la gestion de l'AC est assuré par le directeur général ou les directeurs régionaux des finances publiques. Les AC sont soumis aux vérifications de l'IGF.",
  },
};

export const GBCP_CHAMP_APPLICATION = {
  art_1: {
    description: "Le décret GBCP est applicable notamment aux :",
    entites: [
      "1° L'État",
      "2° Les collectivités territoriales, leurs établissements publics, les EPLE, les EPLEFPA, les EPLEMA",
      "3° Les établissements publics de santé",
      "4° Les autres personnes morales de droit public (liste par arrêté)",
      "5° Certaines personnes morales de droit privé",
      "6° Les personnes morales de droit public hors administrations publiques",
    ],
  },
  art_4: "Les dispositions des titres II et III ne s'appliquent pas aux personnes morales mentionnées aux 2° (collectivités, EPLE) et 3° de l'article 1er. → Les EPLE relèvent du Titre Ier (principes fondamentaux) et de leur réglementation propre (Code de l'éducation).",
};
