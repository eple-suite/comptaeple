// Reference data for SATD module — Barèmes 2026, DDFiP, Banques courantes

export const BAREME_SAISIE_2026 = {
  tranches: [
    { min: 0, max: 373.33, taux: 1 / 20 },       // 5%
    { min: 373.33, max: 726.67, taux: 1 / 10 },   // 10%
    { min: 726.67, max: 1080, taux: 1 / 5 },      // 20%
    { min: 1080, max: 1433.33, taux: 1 / 4 },     // 25%
    { min: 1433.33, max: 1786.67, taux: 1 / 3 },  // 33%
    { min: 1786.67, max: 2146.67, taux: 2 / 3 },  // 66%
    { min: 2146.67, max: Infinity, taux: 1 },      // 100%
  ],
  sbi: 635.71, // Solde Bancaire Insaisissable (RSA personne seule)
  majorationParPersonne: 141, // Majoration par personne à charge
};

export interface QuotiteSaisissable {
  montantBrut: number;
  fractionSaisissable: number;
  montantSaisissable: number;
  details: { tranche: string; taux: number; montant: number }[];
}

export function calculerQuotiteSaisissable(salaire: number, personnesACharge: number): QuotiteSaisissable {
  const charges = personnesACharge;
  let montantSaisissable = 0;
  const details: { tranche: string; taux: number; montant: number }[] = [];

  for (let i = 0; i < BAREME_SAISIE_2026.tranches.length; i++) {
    const tranche = BAREME_SAISIE_2026.tranches[i];
    const min = tranche.min + (charges * BAREME_SAISIE_2026.majorationParPersonne * i / BAREME_SAISIE_2026.tranches.length);
    const max = tranche.max === Infinity
      ? Infinity
      : tranche.max + (charges * BAREME_SAISIE_2026.majorationParPersonne * (i + 1) / BAREME_SAISIE_2026.tranches.length);

    if (salaire > min) {
      const montantDansTranche = Math.min(salaire - min, max - min);
      const saisie = montantDansTranche * tranche.taux;
      montantSaisissable += saisie;
      details.push({
        tranche: max === Infinity ? `> ${min.toFixed(0)} €` : `${min.toFixed(0)} – ${max.toFixed(0)} €`,
        taux: tranche.taux * 100,
        montant: saisie,
      });
    }
  }

  return {
    montantBrut: salaire,
    fractionSaisissable: salaire > 0 ? montantSaisissable / salaire : 0,
    montantSaisissable,
    details: details.filter(d => d.montant > 0),
  };
}

export const DDFIP_LISTE = [
  { code: "971", nom: "DDFiP de la Guadeloupe", adresse: "Rue Achille René-Boisneuf", cp: "97100", ville: "Basse-Terre" },
  { code: "972", nom: "DDFiP de la Martinique", adresse: "8 rue Victor Sévère", cp: "97200", ville: "Fort-de-France" },
  { code: "973", nom: "DDFiP de la Guyane", adresse: "8 rue Schoelcher", cp: "97300", ville: "Cayenne" },
  { code: "974", nom: "DDFiP de La Réunion", adresse: "12 rue Monseigneur de Beaumont", cp: "97400", ville: "Saint-Denis" },
  { code: "01", nom: "DDFiP de l'Ain", adresse: "10 rue du Pavillon", cp: "01000", ville: "Bourg-en-Bresse" },
  { code: "13", nom: "DDFiP des Bouches-du-Rhône", adresse: "16 rue Borde", cp: "13008", ville: "Marseille" },
  { code: "75", nom: "DDFiP de Paris", adresse: "94 rue Réaumur", cp: "75002", ville: "Paris" },
  { code: "69", nom: "DDFiP du Rhône", adresse: "3 rue de la Charité", cp: "69002", ville: "Lyon" },
  { code: "31", nom: "DDFiP de la Haute-Garonne", adresse: "34 rue des Lois", cp: "31000", ville: "Toulouse" },
  { code: "33", nom: "DDFiP de la Gironde", adresse: "24 rue François de Sourdis", cp: "33000", ville: "Bordeaux" },
  { code: "59", nom: "DDFiP du Nord", adresse: "82 rue de Tournai", cp: "59000", ville: "Lille" },
  { code: "44", nom: "DDFiP de Loire-Atlantique", adresse: "5 rue du Château de l'Eraudière", cp: "44000", ville: "Nantes" },
  { code: "67", nom: "DDFiP du Bas-Rhin", adresse: "4 place de la République", cp: "67000", ville: "Strasbourg" },
  { code: "34", nom: "DDFiP de l'Hérault", adresse: "350 rue de Gellone", cp: "34000", ville: "Montpellier" },
  { code: "06", nom: "DDFiP des Alpes-Maritimes", adresse: "Palais des Finances", cp: "06000", ville: "Nice" },
  { code: "83", nom: "DDFiP du Var", adresse: "274 avenue de la République", cp: "83000", ville: "Toulon" },
  { code: "84", nom: "DDFiP du Vaucluse", adresse: "28 rue Henri Fabre", cp: "84000", ville: "Avignon" },
];

export const BANQUES_COURANTES = [
  { nom: "BNP Paribas", bic: "BNPAFRPP" },
  { nom: "Société Générale", bic: "SOGEFRPP" },
  { nom: "Crédit Agricole", bic: "AGRIFRPP" },
  { nom: "Crédit Mutuel", bic: "CMCIFRPP" },
  { nom: "Banque Populaire", bic: "CCBPFRPP" },
  { nom: "Caisse d'Épargne", bic: "CEPAFRPP" },
  { nom: "La Banque Postale", bic: "PSSTFRPP" },
  { nom: "LCL", bic: "CRLYFRPP" },
  { nom: "BRED", bic: "BREDFRPP" },
  { nom: "BPCE", bic: "BPCEFRPP" },
];

export const NATURE_CREANCE_OPTIONS = [
  { value: "demi-pension", label: "Frais de demi-pension" },
  { value: "internat", label: "Frais d'internat" },
  { value: "voyage", label: "Participation voyage scolaire" },
  { value: "autre", label: "Autre créance" },
];

export const ASSISTANT_ADVICE: Record<string, { title: string; tips: string[]; warnings: string[]; references: string[] }> = {
  creation_satd: {
    title: "Création d'une SATD",
    tips: [
      "Vérifiez que toutes les relances amiables ont été effectuées",
      "Assurez-vous que le titre de recette est devenu exécutoire",
      "Privilégiez la SATD sur salaire/pension plutôt que sur compte bancaire",
      "Vérifiez la proportionnalité entre le montant et les frais engagés",
    ],
    warnings: [
      "La SATD ne peut pas être diligentée dans les COM et en Nouvelle-Calédonie",
      "Pour un mineur, la SATD doit être adressée au représentant légal",
      "Le débiteur doit avoir été préalablement informé de sa dette",
    ],
    references: [
      "Art. L. 262 du Livre des procédures fiscales",
      "Circulaire DAF A3 n° 2020-101 du 6 octobre 2020",
      "Note BOFIP-GCP-19-0010 du 27 février 2019",
    ],
  },
  tiers_banque: {
    title: "SATD sur compte bancaire",
    tips: [
      "Utilisez FICOBA pour identifier les comptes du débiteur",
      "Demandez le cantonnement au montant de la créance",
      "Le SBI (635,71 €) reste insaisissable sur le compte",
      "La notification doit être faite par voie dématérialisée via le portail PSAR",
    ],
    warnings: [
      "La SATD bloque TOUS les comptes pendant 15 jours",
      "Attention aux conséquences sur le débiteur (chèques, prélèvements)",
      "Toujours exiger une garantie irrévocable si possible",
    ],
    references: [
      "Guide de mise en œuvre SATD §VI.2",
      "Art. L. 162-2 du Code des procédures civiles d'exécution",
    ],
  },
  tiers_employeur: {
    title: "SATD sur salaire/pension",
    tips: [
      "Méthode privilégiée car elle respecte les quotités légales",
      "L'employeur doit verser dans les 30 jours",
      "La SATD prime sur les autres saisies (sauf pensions alimentaires)",
      "Pour un fonctionnaire, adressez la SATD à la DDFiP",
    ],
    warnings: [
      "Respectez les quotités saisissables (art. R.3252-2 C. travail)",
      "L'employeur peut être condamné s'il ne répond pas",
      "Le débiteur peut contester dans les 2 mois",
    ],
    references: [
      "Guide de mise en œuvre SATD §VI.1",
      "Art. R.3252-1 à R.3252-44 du Code du travail",
    ],
  },
};
