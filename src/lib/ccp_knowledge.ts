/**
 * Code de la commande publique — Base de connaissances EPLE
 * Source : Code de la commande publique (version consolidée au 16/03/2026, Légifrance)
 * Décret n°2025-1386 du 29/12/2025 (seuils 2026)
 *
 * Ce fichier ne contient que les dispositions pertinentes pour les EPLE
 * (établissements publics locaux d'enseignement), qui sont des pouvoirs
 * adjudicateurs soumis aux règles de la commande publique.
 */

export const CCP_KNOWLEDGE = {
  meta: {
    source: "Code de la commande publique (Légifrance)",
    version: "16 mars 2026",
    decretSeuils: "Décret n°2025-1386 du 29/12/2025",
  },

  /**
   * SEUILS 2026 applicables aux EPLE (pouvoirs adjudicateurs)
   * Les EPLE relèvent de l'article L1211-1 CCP (pouvoirs adjudicateurs).
   */
  seuils2026: {
    fournituresServices: {
      dispense: {
        montantHT: 40_000,
        montantHTApres01042026: 60_000,
        dateBasculement: "2026-04-01",
        base: "R2122-8 CCP (modifié par décret n°2025-1386)",
        description:
          "Marchés dispensés de publicité et de mise en concurrence en raison de leur montant",
        note: "Seuil relevé à 60 000 € HT à compter du 1er avril 2026",
      },
      publiciteBoamp: {
        montantHT: 90_000,
        base: "R2131-12 CCP",
        description:
          "Publicité au BOAMP ou dans un JAL pour les marchés en procédure adaptée",
      },
      seuilEuropeen: {
        montantHT: 216_000,
        base: "R2124-1 CCP (avis JOUE 2025/3363)",
        description: "Seuil de procédure formalisée (fournitures et services)",
        periodicite: "Révisé tous les 2 ans par la Commission européenne",
      },
    },
    travaux: {
      dispense: {
        montantHT: 100_000,
        base: "R2122-8 CCP",
        description: "Marchés de travaux dispensés de publicité et mise en concurrence",
        note: "Seuil pérennisé à 100 000 € HT",
      },
      seuilEuropeen: {
        montantHT: 5_404_000,
        base: "R2124-1 CCP",
        description: "Seuil de procédure formalisée (travaux)",
      },
    },
  },

  /**
   * PRINCIPES FONDAMENTAUX (Partie législative)
   */
  principes: {
    egaliteTraitement: {
      article: "L3 CCP",
      contenu:
        "Les acheteurs et les autorités concédantes respectent le principe d'égalité de traitement des candidats et des soumissionnaires.",
    },
    liberteAcces: {
      article: "L3 CCP",
      contenu:
        "La commande publique garantit la liberté d'accès, l'égalité de traitement des candidats et la transparence des procédures.",
    },
    definitionBesoin: {
      article: "L2111-1 CCP",
      contenu:
        "La nature et l'étendue des besoins à satisfaire sont déterminées avec précision avant le lancement de la consultation, en prenant en compte des objectifs de développement durable.",
    },
    allotissement: {
      article: "L2113-10 CCP",
      contenu:
        "Les marchés sont passés en lots séparés, sauf si leur objet ne permet pas l'identification de prestations distinctes.",
    },
  },

  /**
   * PROCÉDURES DE PASSATION pertinentes pour les EPLE
   */
  procedures: {
    sansPubliciteNiMiseEnConcurrence: {
      articles: "R2122-1 à R2122-11 CCP",
      description:
        "Marchés pouvant être passés sans publicité ni mise en concurrence préalables",
      casEPLE: [
        "Montant inférieur au seuil de dispense (R2122-8)",
        "Urgence impérieuse (R2122-1)",
        "Fournisseur unique pour raisons techniques ou artistiques (R2122-3)",
        "Prestations similaires (R2122-7)",
      ],
    },
    procedureAdaptee: {
      articles: "R2123-1 à R2123-7 CCP",
      description: "MAPA — procédure la plus courante pour les EPLE",
      seuilInferieur: "Seuil européen (216 000 € HT fournitures/services)",
      regles: [
        "L'acheteur définit librement les modalités de la procédure (R2123-4)",
        "Obligation de publicité adaptée au montant et à l'objet (R2131-12)",
        "Pas de formalisme imposé sous le seuil de dispense",
        "Au-delà de 90 000 € HT : publicité BOAMP ou JAL obligatoire",
      ],
    },
    procedureFormalisee: {
      articles: "R2124-1 à R2124-6 CCP",
      description:
        "Appel d'offres, procédure avec négociation ou dialogue compétitif",
      seuilSuperieur: "Au-delà du seuil européen",
      note: "Rare en EPLE sauf marchés de travaux importants ou groupements de commandes",
    },
  },

  /**
   * COMPUTATION DES SEUILS
   */
  calculSeuils: {
    articles: "R2121-1 à R2121-9 CCP",
    regles: [
      "La valeur estimée est calculée sur la base du montant total HT du besoin, y compris les options et reconductions (R2121-1)",
      "Pour les fournitures et services : valeur totale des lots de même nature sur la durée du marché (R2121-5 à R2121-7)",
      "Interdiction de scinder un besoin pour échapper aux seuils (R2121-4)",
      "Pour les accords-cadres : valeur maximale estimée (R2121-8)",
    ],
    bonnesPratiques: [
      "Les « 3 devis » ne sont PAS une obligation légale mais une bonne pratique de mise en concurrence recommandée par les autorités de tutelle",
      "L'EPLE doit évaluer sincèrement ses besoins sur l'année civile pour déterminer la procédure applicable",
      "Le cumul des achats de même nature (code CPV) détermine le seuil applicable",
    ],
  },

  /**
   * EXÉCUTION DES MARCHÉS
   */
  execution: {
    avances: {
      article: "L2191-2 CCP, R2191-3 à R2191-19 CCP",
      description:
        "Avance obligatoire ≥ 20% pour marchés > 50 000 € HT et PME (décret 2025-1386)",
      note: "Les EPLE sont soumis au délai global de paiement de 30 jours (L2192-10 CCP)",
    },
    delaiPaiement: {
      article: "L2192-10 à L2192-15 CCP",
      delai: 30,
      unite: "jours",
      description: "Délai global de paiement applicable aux EPLE",
      consequence:
        "Intérêts moratoires de plein droit + indemnité forfaitaire de 40 € (L2192-13 CCP)",
    },
    soustraitance: {
      articles: "L2193-1 à L2193-14 CCP",
      description:
        "Acceptation du sous-traitant et agrément des conditions de paiement par l'EPLE",
      paiementDirect:
        "Obligatoire au-delà de 600 € TTC (L2193-11 CCP)",
    },
    modification: {
      articles: "L2194-1 à L2194-3 CCP, R2194-1 à R2194-9 CCP",
      description: "Conditions de modification d'un marché en cours d'exécution",
    },
  },

  /**
   * RÈGLES SPÉCIFIQUES AUX EPLE
   */
  reglesEPLE: {
    pouvoirAdjudicateur: {
      article: "L1211-1 CCP",
      description:
        "Les EPLE sont des pouvoirs adjudicateurs en tant que personnes morales de droit public",
    },
    competenceCA: {
      description:
        "Le CA autorise le chef d'établissement à signer les marchés (R421-20 Code éducation)",
      note: "Le CA peut déléguer au chef d'établissement la passation des MAPA sous un certain seuil",
    },
    groupementsCommandes: {
      article: "L2113-6 à L2113-8 CCP",
      description:
        "Les EPLE peuvent constituer des groupements de commandes avec d'autres acheteurs publics",
      avantage: "Mutualisation des besoins pour obtenir de meilleures conditions",
    },
    centralesAchat: {
      article: "L2113-2 à L2113-5 CCP",
      description:
        "Les EPLE peuvent recourir aux centrales d'achat (UGAP, régionales…)",
      note: "Dispense de mise en concurrence pour l'EPLE qui passe par une centrale",
    },
  },

  /**
   * CONTENTIEUX ET RECOURS
   */
  contentieux: {
    referePrécontractuel: {
      article: "L551-1 CJA",
      description:
        "Recours en urgence avant la signature du marché pour violation des obligations de publicité et mise en concurrence",
    },
    refereContractuel: {
      article: "L551-13 CJA",
      description: "Recours après la signature du marché",
    },
    recoursTiers: {
      article: "CE, Tarn-et-Garonne, 4 avril 2014",
      description:
        "Tout tiers lésé peut contester la validité d'un contrat administratif dans un délai de 2 mois",
    },
  },
};

/**
 * Fonction utilitaire : détermine le seuil de dispense applicable à une date donnée
 */
export function getSeuilDispenseFournitures(date: Date = new Date()): number {
  const basculement = new Date("2026-04-01");
  return date >= basculement ? 60_000 : 40_000;
}

/**
 * Fonction utilitaire : détermine la procédure applicable pour un montant donné
 */
export function getProcedureApplicable(
  montantHT: number,
  type: "fournitures_services" | "travaux" = "fournitures_services",
  date: Date = new Date()
): {
  procedure: string;
  publicite: string;
  articles: string;
} {
  if (type === "travaux") {
    if (montantHT < 100_000) {
      return {
        procedure: "Dispense de publicité et mise en concurrence",
        publicite: "Aucune obligation (bonne pratique : mise en concurrence)",
        articles: "R2122-8 CCP",
      };
    }
    if (montantHT < 5_404_000) {
      return {
        procedure: "Procédure adaptée (MAPA)",
        publicite: "Publicité adaptée au montant",
        articles: "R2123-1 CCP",
      };
    }
    return {
      procedure: "Procédure formalisée (appel d'offres)",
      publicite: "JOUE + BOAMP",
      articles: "R2124-1 CCP",
    };
  }

  // Fournitures et services
  const seuilDispense = getSeuilDispenseFournitures(date);
  if (montantHT < seuilDispense) {
    return {
      procedure: "Dispense de publicité et mise en concurrence",
      publicite: "Aucune obligation (bonne pratique : mise en concurrence)",
      articles: "R2122-8 CCP",
    };
  }
  if (montantHT < 90_000) {
    return {
      procedure: "Procédure adaptée (MAPA)",
      publicite: "Publicité adaptée (profil acheteur conseillé)",
      articles: "R2123-1 CCP",
    };
  }
  if (montantHT < 216_000) {
    return {
      procedure: "Procédure adaptée (MAPA)",
      publicite: "Publicité BOAMP ou JAL obligatoire",
      articles: "R2123-1, R2131-12 CCP",
    };
  }
  return {
    procedure: "Procédure formalisée (appel d'offres)",
    publicite: "JOUE + BOAMP",
    articles: "R2124-1 CCP",
  };
}
