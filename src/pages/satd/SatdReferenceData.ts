// Reference data for SATD module — Barèmes 2026, DDFiP complets, Banques, Réglementation exhaustive

// ═══════════════════════════════════════════════════════════
// BARÈME DES SAISIES SUR RÉMUNÉRATION 2026
// Art. R.3252-2 et suivants du Code du travail
// ═══════════════════════════════════════════════════════════

export const BAREME_SAISIE_2026 = {
  tranches: [
    { min: 0, max: 373.33, taux: 1 / 20 },
    { min: 373.33, max: 726.67, taux: 1 / 10 },
    { min: 726.67, max: 1080, taux: 1 / 5 },
    { min: 1080, max: 1433.33, taux: 1 / 4 },
    { min: 1433.33, max: 1786.67, taux: 1 / 3 },
    { min: 1786.67, max: 2146.67, taux: 2 / 3 },
    { min: 2146.67, max: Infinity, taux: 1 },
  ],
  sbi: 635.71,
  majorationParPersonne: 141,
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

// ═══════════════════════════════════════════════════════════
// ANALYSE DE PROPORTIONNALITÉ
// Principe de proportionnalité — Art. L. 1617-5 CGCT
// ═══════════════════════════════════════════════════════════

export interface AnalyseProportionnalite {
  montantCreance: number;
  coutEstime: number;
  ratio: number;
  avis: "favorable" | "attention" | "deconseille";
  message: string;
  recommandation: string;
}

export function analyserProportionnalite(
  montantCreance: number,
  typeSaisie: "salaire" | "banque" | "huissier"
): AnalyseProportionnalite {
  const couts: Record<string, number> = {
    salaire: 6.50, // Un RAR
    banque: 6.50 + 100, // RAR + frais bancaires max
    huissier: 250 + 6.50, // Frais huissier moyens + RAR
  };

  const coutEstime = couts[typeSaisie] || 0;
  const ratio = montantCreance > 0 ? coutEstime / montantCreance : Infinity;

  let avis: AnalyseProportionnalite["avis"];
  let message: string;
  let recommandation: string;

  if (typeSaisie === "huissier" && montantCreance < 250) {
    avis = "deconseille";
    message = `Les frais d'huissier (~${coutEstime.toFixed(0)} €) dépassent le montant de la créance (${montantCreance.toFixed(2)} €). Disproportion manifeste.`;
    recommandation = "Privilégiez la SATD sur salaire (gratuite hors RAR). Le juge du compte pourrait reprocher un manque de proportionnalité.";
  } else if (typeSaisie === "banque" && montantCreance < 100) {
    avis = "attention";
    message = `La SATD sur compte bancaire entraîne le blocage du compte pendant 15 jours et des frais bancaires pouvant atteindre 100 €.`;
    recommandation = "Pour un montant < 100 €, privilégiez la SATD sur salaire/pension ou un plan d'apurement amiable.";
  } else if (ratio > 0.5) {
    avis = "attention";
    message = `Le coût estimé représente ${(ratio * 100).toFixed(0)}% du montant à recouvrer.`;
    recommandation = "Évaluez l'opportunité de la poursuite au regard du principe de proportionnalité.";
  } else {
    avis = "favorable";
    message = `Rapport coût/créance favorable (${(ratio * 100).toFixed(1)}%). La SATD est gratuite (hors RAR à ~6,50 €).`;
    recommandation = "Procédure proportionnée. Vous pouvez poursuivre en toute sérénité.";
  }

  return { montantCreance, coutEstime, ratio, avis, message, recommandation };
}

// ═══════════════════════════════════════════════════════════
// DDFiP — Liste complète des 101 DDFiP métropolitaines et outre-mer
// Pour la saisie sur traitement des fonctionnaires
// ═══════════════════════════════════════════════════════════

export const DDFIP_LISTE = [
  // Outre-mer
  { code: "971", nom: "DDFiP de la Guadeloupe", adresse: "Rue Achille René-Boisneuf", cp: "97100", ville: "Basse-Terre" },
  { code: "972", nom: "DDFiP de la Martinique", adresse: "8 rue Victor Sévère", cp: "97200", ville: "Fort-de-France" },
  { code: "973", nom: "DDFiP de la Guyane", adresse: "8 rue Schoelcher", cp: "97300", ville: "Cayenne" },
  { code: "974", nom: "DDFiP de La Réunion", adresse: "12 rue Mgr de Beaumont", cp: "97400", ville: "Saint-Denis" },
  { code: "976", nom: "DDFiP de Mayotte", adresse: "BP 68", cp: "97600", ville: "Mamoudzou" },
  // Métropole - liste exhaustive
  { code: "01", nom: "DDFiP de l'Ain", adresse: "10 rue du Pavillon", cp: "01000", ville: "Bourg-en-Bresse" },
  { code: "02", nom: "DDFiP de l'Aisne", adresse: "22 rue Victor Hugo", cp: "02000", ville: "Laon" },
  { code: "03", nom: "DDFiP de l'Allier", adresse: "2 rue Michel de l'Hospital", cp: "03000", ville: "Moulins" },
  { code: "04", nom: "DDFiP des Alpes-de-Haute-Provence", adresse: "Place du Tampinet", cp: "04000", ville: "Digne-les-Bains" },
  { code: "05", nom: "DDFiP des Hautes-Alpes", adresse: "6 rue Capitaine de Bresson", cp: "05000", ville: "Gap" },
  { code: "06", nom: "DDFiP des Alpes-Maritimes", adresse: "Palais des Finances", cp: "06000", ville: "Nice" },
  { code: "07", nom: "DDFiP de l'Ardèche", adresse: "5 avenue de l'Europe", cp: "07000", ville: "Privas" },
  { code: "08", nom: "DDFiP des Ardennes", adresse: "5 rue Pierre Bérégovoy", cp: "08000", ville: "Charleville-Mézières" },
  { code: "09", nom: "DDFiP de l'Ariège", adresse: "9 rue du Lieutenant-Colonel Pélissier", cp: "09000", ville: "Foix" },
  { code: "10", nom: "DDFiP de l'Aube", adresse: "22 boulevard Gambetta", cp: "10000", ville: "Troyes" },
  { code: "11", nom: "DDFiP de l'Aude", adresse: "52 rue Aimé Ramond", cp: "11000", ville: "Carcassonne" },
  { code: "12", nom: "DDFiP de l'Aveyron", adresse: "6 rue de Séguret-Saincric", cp: "12000", ville: "Rodez" },
  { code: "13", nom: "DDFiP des Bouches-du-Rhône", adresse: "16 rue Borde", cp: "13008", ville: "Marseille" },
  { code: "14", nom: "DDFiP du Calvados", adresse: "10 boulevard du Général Vanier", cp: "14000", ville: "Caen" },
  { code: "15", nom: "DDFiP du Cantal", adresse: "6 cours Monthyon", cp: "15000", ville: "Aurillac" },
  { code: "16", nom: "DDFiP de la Charente", adresse: "17 rue Jean Jaurès", cp: "16000", ville: "Angoulême" },
  { code: "17", nom: "DDFiP de la Charente-Maritime", adresse: "9 rue Gargoulleau", cp: "17000", ville: "La Rochelle" },
  { code: "18", nom: "DDFiP du Cher", adresse: "2 rue Victor Hugo", cp: "18000", ville: "Bourges" },
  { code: "19", nom: "DDFiP de la Corrèze", adresse: "15 quai Aristide Briand", cp: "19000", ville: "Tulle" },
  { code: "2A", nom: "DDFiP de la Corse-du-Sud", adresse: "Rue Sergent Casalonga", cp: "20000", ville: "Ajaccio" },
  { code: "2B", nom: "DDFiP de la Haute-Corse", adresse: "Place du Duc", cp: "20200", ville: "Bastia" },
  { code: "21", nom: "DDFiP de la Côte-d'Or", adresse: "1 bis place de la Banque", cp: "21000", ville: "Dijon" },
  { code: "22", nom: "DDFiP des Côtes-d'Armor", adresse: "1 rue du 71e Régiment d'Infanterie", cp: "22000", ville: "Saint-Brieuc" },
  { code: "23", nom: "DDFiP de la Creuse", adresse: "8 avenue Louis Lacrocq", cp: "23000", ville: "Guéret" },
  { code: "24", nom: "DDFiP de la Dordogne", adresse: "24 cours Saint-Georges", cp: "24000", ville: "Périgueux" },
  { code: "25", nom: "DDFiP du Doubs", adresse: "6 rue Charles Nodier", cp: "25000", ville: "Besançon" },
  { code: "26", nom: "DDFiP de la Drôme", adresse: "17 avenue Victor Hugo", cp: "26000", ville: "Valence" },
  { code: "27", nom: "DDFiP de l'Eure", adresse: "3 place de la République", cp: "27000", ville: "Évreux" },
  { code: "28", nom: "DDFiP d'Eure-et-Loir", adresse: "1 place de la République", cp: "28000", ville: "Chartres" },
  { code: "29", nom: "DDFiP du Finistère", adresse: "2 rue Yves Collet", cp: "29200", ville: "Brest" },
  { code: "30", nom: "DDFiP du Gard", adresse: "2 rue Pradier", cp: "30000", ville: "Nîmes" },
  { code: "31", nom: "DDFiP de la Haute-Garonne", adresse: "34 rue des Lois", cp: "31000", ville: "Toulouse" },
  { code: "32", nom: "DDFiP du Gers", adresse: "2 place Jean David", cp: "32000", ville: "Auch" },
  { code: "33", nom: "DDFiP de la Gironde", adresse: "24 rue François de Sourdis", cp: "33000", ville: "Bordeaux" },
  { code: "34", nom: "DDFiP de l'Hérault", adresse: "350 rue de Gellone", cp: "34000", ville: "Montpellier" },
  { code: "35", nom: "DDFiP d'Ille-et-Vilaine", adresse: "2 rue de Châtillon", cp: "35000", ville: "Rennes" },
  { code: "36", nom: "DDFiP de l'Indre", adresse: "4 place de la République", cp: "36000", ville: "Châteauroux" },
  { code: "37", nom: "DDFiP d'Indre-et-Loire", adresse: "10 rue de la Préfecture", cp: "37000", ville: "Tours" },
  { code: "38", nom: "DDFiP de l'Isère", adresse: "8 rue de Belgrade", cp: "38000", ville: "Grenoble" },
  { code: "39", nom: "DDFiP du Jura", adresse: "21 rue de la Préfecture", cp: "39000", ville: "Lons-le-Saunier" },
  { code: "40", nom: "DDFiP des Landes", adresse: "14 rue Victor Hugo", cp: "40000", ville: "Mont-de-Marsan" },
  { code: "41", nom: "DDFiP de Loir-et-Cher", adresse: "Place de la République", cp: "41000", ville: "Blois" },
  { code: "42", nom: "DDFiP de la Loire", adresse: "10 rue Balay", cp: "42000", ville: "Saint-Étienne" },
  { code: "43", nom: "DDFiP de la Haute-Loire", adresse: "2 rue Crozatier", cp: "43000", ville: "Le Puy-en-Velay" },
  { code: "44", nom: "DDFiP de Loire-Atlantique", adresse: "5 rue du Château de l'Eraudière", cp: "44000", ville: "Nantes" },
  { code: "45", nom: "DDFiP du Loiret", adresse: "15 rue d'Escures", cp: "45000", ville: "Orléans" },
  { code: "46", nom: "DDFiP du Lot", adresse: "62 avenue André Breton", cp: "46000", ville: "Cahors" },
  { code: "47", nom: "DDFiP de Lot-et-Garonne", adresse: "4 place Armand Fallières", cp: "47000", ville: "Agen" },
  { code: "48", nom: "DDFiP de la Lozère", adresse: "4 rue de la Rovère", cp: "48000", ville: "Mende" },
  { code: "49", nom: "DDFiP de Maine-et-Loire", adresse: "1 place Michel Debré", cp: "49000", ville: "Angers" },
  { code: "50", nom: "DDFiP de la Manche", adresse: "12 rue de la Poterie", cp: "50000", ville: "Saint-Lô" },
  { code: "51", nom: "DDFiP de la Marne", adresse: "1 bis rue de Jessaint", cp: "51000", ville: "Châlons-en-Champagne" },
  { code: "52", nom: "DDFiP de la Haute-Marne", adresse: "39 rue Victoire de la Marne", cp: "52000", ville: "Chaumont" },
  { code: "53", nom: "DDFiP de la Mayenne", adresse: "14 allée du Vieux Saint-Louis", cp: "53000", ville: "Laval" },
  { code: "54", nom: "DDFiP de Meurthe-et-Moselle", adresse: "52 rue des Ponts", cp: "54000", ville: "Nancy" },
  { code: "55", nom: "DDFiP de la Meuse", adresse: "6 rue du Bourg", cp: "55000", ville: "Bar-le-Duc" },
  { code: "56", nom: "DDFiP du Morbihan", adresse: "13 rue du Château", cp: "56000", ville: "Vannes" },
  { code: "57", nom: "DDFiP de la Moselle", adresse: "1 rue du Pont Moreau", cp: "57000", ville: "Metz" },
  { code: "58", nom: "DDFiP de la Nièvre", adresse: "1 place de la République", cp: "58000", ville: "Nevers" },
  { code: "59", nom: "DDFiP du Nord", adresse: "82 rue de Tournai", cp: "59000", ville: "Lille" },
  { code: "60", nom: "DDFiP de l'Oise", adresse: "1 rue de la République", cp: "60000", ville: "Beauvais" },
  { code: "61", nom: "DDFiP de l'Orne", adresse: "14 rue du Mans", cp: "61000", ville: "Alençon" },
  { code: "62", nom: "DDFiP du Pas-de-Calais", adresse: "Place de la Préfecture", cp: "62000", ville: "Arras" },
  { code: "63", nom: "DDFiP du Puy-de-Dôme", adresse: "10 place Gilbert Gaillard", cp: "63000", ville: "Clermont-Ferrand" },
  { code: "64", nom: "DDFiP des Pyrénées-Atlantiques", adresse: "2 rue Jean-Jacques de Monaix", cp: "64000", ville: "Pau" },
  { code: "65", nom: "DDFiP des Hautes-Pyrénées", adresse: "8 rue Gaston Manent", cp: "65000", ville: "Tarbes" },
  { code: "66", nom: "DDFiP des Pyrénées-Orientales", adresse: "16 rue de la Fusterie", cp: "66000", ville: "Perpignan" },
  { code: "67", nom: "DDFiP du Bas-Rhin", adresse: "4 place de la République", cp: "67000", ville: "Strasbourg" },
  { code: "68", nom: "DDFiP du Haut-Rhin", adresse: "3 rue Fleischhauer", cp: "68000", ville: "Colmar" },
  { code: "69", nom: "DDFiP du Rhône", adresse: "3 rue de la Charité", cp: "69002", ville: "Lyon" },
  { code: "70", nom: "DDFiP de la Haute-Saône", adresse: "24 rue Edouard Belin", cp: "70000", ville: "Vesoul" },
  { code: "71", nom: "DDFiP de Saône-et-Loire", adresse: "49 rue de Lyon", cp: "71000", ville: "Mâcon" },
  { code: "72", nom: "DDFiP de la Sarthe", adresse: "23 rue de l'Étoile", cp: "72000", ville: "Le Mans" },
  { code: "73", nom: "DDFiP de la Savoie", adresse: "Rue Métropole", cp: "73000", ville: "Chambéry" },
  { code: "74", nom: "DDFiP de la Haute-Savoie", adresse: "7 rue de la Poste", cp: "74000", ville: "Annecy" },
  { code: "75", nom: "DDFiP de Paris", adresse: "94 rue Réaumur", cp: "75002", ville: "Paris" },
  { code: "76", nom: "DDFiP de la Seine-Maritime", adresse: "21 quai Jean Moulin", cp: "76000", ville: "Rouen" },
  { code: "77", nom: "DDFiP de Seine-et-Marne", adresse: "Cité administrative", cp: "77000", ville: "Melun" },
  { code: "78", nom: "DDFiP des Yvelines", adresse: "1 rue de Fontenay", cp: "78000", ville: "Versailles" },
  { code: "79", nom: "DDFiP des Deux-Sèvres", adresse: "20 rue de la Gare", cp: "79000", ville: "Niort" },
  { code: "80", nom: "DDFiP de la Somme", adresse: "62 rue des Jacobins", cp: "80000", ville: "Amiens" },
  { code: "81", nom: "DDFiP du Tarn", adresse: "39 Lices Georges Pompidou", cp: "81000", ville: "Albi" },
  { code: "82", nom: "DDFiP de Tarn-et-Garonne", adresse: "2 allée de l'Empereur", cp: "82000", ville: "Montauban" },
  { code: "83", nom: "DDFiP du Var", adresse: "274 avenue de la République", cp: "83000", ville: "Toulon" },
  { code: "84", nom: "DDFiP du Vaucluse", adresse: "28 rue Henri Fabre", cp: "84000", ville: "Avignon" },
  { code: "85", nom: "DDFiP de la Vendée", adresse: "36 bd Aristide Briand", cp: "85000", ville: "La Roche-sur-Yon" },
  { code: "86", nom: "DDFiP de la Vienne", adresse: "3 rue de Bourgogne", cp: "86000", ville: "Poitiers" },
  { code: "87", nom: "DDFiP de la Haute-Vienne", adresse: "25 bd Carnot", cp: "87000", ville: "Limoges" },
  { code: "88", nom: "DDFiP des Vosges", adresse: "8 rue de la Préfecture", cp: "88000", ville: "Épinal" },
  { code: "89", nom: "DDFiP de l'Yonne", adresse: "1 rue de Preuilly", cp: "89000", ville: "Auxerre" },
  { code: "90", nom: "DDFiP du Territoire de Belfort", adresse: "Place de la République", cp: "90000", ville: "Belfort" },
  { code: "91", nom: "DDFiP de l'Essonne", adresse: "Bd de France", cp: "91000", ville: "Évry-Courcouronnes" },
  { code: "92", nom: "DDFiP des Hauts-de-Seine", adresse: "167-177 avenue Joliot Curie", cp: "92000", ville: "Nanterre" },
  { code: "93", nom: "DDFiP de la Seine-Saint-Denis", adresse: "1 place du Front Populaire", cp: "93200", ville: "Saint-Denis" },
  { code: "94", nom: "DDFiP du Val-de-Marne", adresse: "1 place du Général Pierre Billotte", cp: "94000", ville: "Créteil" },
  { code: "95", nom: "DDFiP du Val-d'Oise", adresse: "5 avenue Bernard Hirsch", cp: "95010", ville: "Cergy" },
];

// ═══════════════════════════════════════════════════════════
// BANQUES — Liste exhaustive avec adresses saisies
// ═══════════════════════════════════════════════════════════

export const BANQUES_COURANTES = [
  { nom: "BNP Paribas", bic: "BNPAFRPP", adresseSaisies: "TSA 93005, 75318 Paris Cedex 09" },
  { nom: "Société Générale", bic: "SOGEFRPP", adresseSaisies: "TSA 10501, 75886 Paris Cedex 18" },
  { nom: "Crédit Agricole", bic: "AGRIFRPP", adresseSaisies: "Variable selon caisse régionale" },
  { nom: "Crédit Mutuel", bic: "CMCIFRPP", adresseSaisies: "Variable selon caisse" },
  { nom: "Banque Populaire", bic: "CCBPFRPP", adresseSaisies: "Variable selon banque régionale" },
  { nom: "Caisse d'Épargne", bic: "CEPAFRPP", adresseSaisies: "Variable selon caisse régionale" },
  { nom: "La Banque Postale", bic: "PSSTFRPP", adresseSaisies: "115 rue de Sèvres, 75275 Paris Cedex 06 — Service saisies" },
  { nom: "LCL", bic: "CRLYFRPP", adresseSaisies: "TSA 80020, 69901 Lyon Cedex 20" },
  { nom: "BRED", bic: "BREDFRPP", adresseSaisies: "18 quai de la Rapée, 75012 Paris" },
  { nom: "BPCE (groupe)", bic: "BPCEFRPP", adresseSaisies: "50 avenue Pierre Mendès France, 75013 Paris" },
  { nom: "CIC", bic: "CMCIFRPP", adresseSaisies: "TSA 40090, 69918 Lyon Cedex 20" },
  { nom: "HSBC France", bic: "CCFRFRPP", adresseSaisies: "103 avenue des Champs-Élysées, 75008 Paris" },
  { nom: "Boursorama", bic: "BOUSFRPP", adresseSaisies: "18 quai du Point du Jour, 92100 Boulogne-Billancourt" },
  { nom: "Fortuneo", bic: "FTNOFRP1", adresseSaisies: "Tour Ariane, 92088 Paris La Défense" },
  { nom: "N26", bic: "NTSBDEB1", adresseSaisies: "Voltairestraße 8, 10179 Berlin, Allemagne" },
  { nom: "Revolut", bic: "REVOGB21", adresseSaisies: "7 Westferry Circus, E14 4HD London" },
  { nom: "Nickel", bic: "BNPAFRPP", adresseSaisies: "Service saisies Nickel, TSA 93005, 75318 Paris Cedex 09" },
];

// ═══════════════════════════════════════════════════════════
// NATURES DE CRÉANCES EPLE
// ═══════════════════════════════════════════════════════════

export const NATURE_CREANCE_OPTIONS = [
  { value: "demi-pension", label: "Frais de demi-pension", compte: "4112" },
  { value: "internat", label: "Frais d'internat", compte: "4112" },
  { value: "voyage", label: "Participation voyage scolaire", compte: "4112" },
  { value: "bourse_trop_percue", label: "Bourse trop perçue", compte: "4112" },
  { value: "caution", label: "Caution non restituée", compte: "4118" },
  { value: "cantine_commensaux", label: "Cantine commensaux", compte: "4122" },
  { value: "location_salle", label: "Location de salle", compte: "4128" },
  { value: "agent_trop_percu", label: "Agent — trop-perçu", compte: "421" },
  { value: "fournisseur_avoir", label: "Fournisseur — avoir non réglé", compte: "409" },
  { value: "autre", label: "Autre créance", compte: "468" },
];

// ═══════════════════════════════════════════════════════════
// BASE RÉGLEMENTAIRE COMPLÈTE — Textes de référence SATD EPLE
// ═══════════════════════════════════════════════════════════

export const BASE_REGLEMENTAIRE = {
  textes_fondateurs: [
    {
      reference: "Art. L. 262-1 à L. 262-5 du Livre des procédures fiscales (LPF)",
      objet: "Fondement juridique de la SATD — Procédure de saisie administrative",
      detail: "Permet à tout comptable public de procéder à une saisie sur les sommes détenues par un tiers pour le compte du débiteur.",
    },
    {
      reference: "Art. R. 262-1 et suivants du LPF",
      objet: "Modalités d'application de la SATD",
      detail: "Forme de la notification, délais, obligations du tiers détenteur.",
    },
    {
      reference: "Art. L. 1617-5 du CGCT",
      objet: "Recouvrement des produits des collectivités et EPLE",
      detail: "Phase amiable obligatoire, autorisation de l'ordonnateur, avis avant poursuites.",
    },
    {
      reference: "Circulaire MEN MENF2023860C du 8 octobre 2020 (BO n°41)",
      objet: "Circulaire d'application SATD pour les EPLE",
      detail: "Précise les modalités d'utilisation de la SATD par les agents comptables des EPLE.",
    },
    {
      reference: "Note de service BOFIP-GCP-19-0010 du 27 février 2019",
      objet: "Mise en œuvre de la SATD par les comptables publics",
      detail: "Guide détaillé de la procédure : notification, tiers, délais, contestation.",
    },
    {
      reference: "Décret n° 2012-1246 du 7 novembre 2012",
      objet: "Décret relatif à la gestion budgétaire et comptable publique",
      detail: "Définit les obligations du comptable en matière de recouvrement.",
    },
    {
      reference: "Instruction codificatrice M9-6 (OP@LE)",
      objet: "Instruction comptable des EPLE",
      detail: "Cadre comptable du recouvrement, comptes 411, 416, 491.",
    },
  ],
  delais: {
    relance_amiable: "Dès constatation de l'impayé",
    delai_entre_relances: "30 jours minimum",
    avis_avant_poursuites: "30 jours donnés au débiteur pour régulariser",
    autorisation_ordonnateur: "Après expiration du délai de l'avis",
    emission_satd: "Les 3 documents le même jour",
    versement_tiers: "30 jours maximum après notification",
    contestation_debiteur: "2 mois devant le JEX",
    prescription_creance: "4 ans pour les créances publiques (art. L. 1617-5 CGCT)",
    prescription_interruptive: "La SATD interrompt la prescription",
    sbi_protection: "Le SBI (635,71 €) reste insaisissable sur compte bancaire",
    blocage_compte: "15 jours ouvrables (SATD sur compte bancaire)",
  },
  comptes_comptables: {
    "4112": "Familles — créances de demi-pension, internat, voyages",
    "4118": "Autres créances sur élèves (cautions, etc.)",
    "4122": "Commensaux — créances de cantine",
    "4128": "Autres créances sur personnel et tiers",
    "416": "Créances douteuses ou litigieuses",
    "421": "Personnel — rémunérations dues",
    "491": "Dépréciation des comptes de redevables",
  },
  tiers_possibles: [
    { type: "Employeur public (Rectorat, DDFiP)", detail: "SATD sur traitement. Adresser la SATD à la DDFiP qui verse le traitement du fonctionnaire." },
    { type: "Employeur privé", detail: "SATD sur salaire. Respecter les quotités saisissables." },
    { type: "Établissement bancaire", detail: "SATD sur compte. Attention : blocage 15 jours, SBI préservé." },
    { type: "CAF", detail: "SATD sur prestations familiales. Sous conditions." },
    { type: "France Travail", detail: "SATD sur allocations chômage. Quotité limitée." },
    { type: "Caisse de retraite", detail: "SATD sur pension. Quotité saisissable applicable." },
    { type: "Agent comptable EPLE", detail: "Auto-SATD sur bourse scolaire. Possible si le débiteur perçoit une bourse dans votre établissement ou un autre." },
    { type: "Notaire", detail: "SATD sur fonds détenus par un notaire (vente immobilière, succession)." },
  ],
  auto_satd_bourse: {
    description: "L'agent comptable peut se saisir lui-même en tant que tiers détenteur lorsqu'il détient des fonds pour le compte du débiteur (bourse scolaire notamment).",
    conditions: [
      "Le débiteur est identifié comme bénéficiaire d'une bourse dans le même EPLE ou un EPLE rattaché",
      "La créance est certaine, liquide et exigible",
      "La procédure complète (relances, avis, autorisation) a été respectée",
      "Le montant saisissable est limité au montant de la bourse versée",
    ],
    cas_pratiques: [
      "Élève ayant quitté l'établissement avec une dette de DP → bourse versée dans le nouveau collège",
      "Bourse de lycée versée à une famille ayant un impayé au collège rattaché",
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// ASSISTANT IA — Conseils contextuels
// ═══════════════════════════════════════════════════════════

export const ASSISTANT_ADVICE: Record<string, { title: string; tips: string[]; warnings: string[]; references: string[] }> = {
  creation_satd: {
    title: "Création d'une SATD",
    tips: [
      "Vérifiez que toutes les relances amiables ont été effectuées et documentées (RAR conservé)",
      "Assurez-vous que le titre de recette est devenu exécutoire (délai 30 jours avis avant poursuites écoulé)",
      "Privilégiez la SATD sur salaire/pension plutôt que sur compte bancaire (moins de conséquences pour le débiteur)",
      "Vérifiez la proportionnalité entre le montant et les frais engagés",
      "Consultez FICOBA si vous ne connaissez pas les comptes du débiteur",
      "Pensez à la possibilité d'auto-SATD sur bourse scolaire",
    ],
    warnings: [
      "La SATD ne peut pas être diligentée dans les COM et en Nouvelle-Calédonie",
      "Pour un mineur, la SATD doit être adressée au représentant légal",
      "Le débiteur doit avoir été préalablement informé de sa dette (RAR obligatoire)",
      "L'autorisation de l'ordonnateur est un préalable absolu (art. L. 1617-5 CGCT)",
      "Les 3 documents (tiers, débiteur, bordereau) doivent partir LE MÊME JOUR",
      "La pension alimentaire prime sur la SATD",
    ],
    references: [
      "Art. L. 262-1 à L. 262-5 du Livre des procédures fiscales",
      "Art. L. 1617-5 du Code général des collectivités territoriales",
      "Circulaire MEN MENF2023860C du 8 octobre 2020",
      "Note de service BOFIP-GCP-19-0010 du 27 février 2019",
    ],
  },
  tiers_banque: {
    title: "SATD sur compte bancaire",
    tips: [
      "Utilisez FICOBA pour identifier les comptes du débiteur (demande à la DDFiP)",
      "Demandez le cantonnement au montant de la créance uniquement",
      "Le SBI (635,71 € en 2026) reste insaisissable",
      "Privilégiez la saisie d'un compte épargne plutôt qu'un compte courant si possible",
      "La notification doit être faite par RAR — possibilité de dématérialisation via PSAR si disponible",
      "Si le compte est insuffisant, la SATD porte sur le solde disponible",
    ],
    warnings: [
      "La SATD bloque TOUS les comptes du débiteur dans l'établissement bancaire pendant 15 jours ouvrables",
      "Des frais bancaires (max 10% du montant, plafonné à 100 €) sont facturés au débiteur par sa banque",
      "Attention aux conséquences sociales : chèques et prélèvements rejetés",
      "Les comptes joints sont saisissables pour la totalité sauf preuve contraire",
      "Les néo-banques (N26, Revolut) nécessitent une notification à l'étranger — procédure plus complexe",
    ],
    references: [
      "Art. L. 262-1 du LPF — SATD sur fonds détenus par un tiers",
      "Art. L. 162-2 du Code des procédures civiles d'exécution — Blocage des comptes",
      "Art. R. 3252-38 du Code du travail — SBI",
      "Banque de France — Frais bancaires sur saisie (max 10%, plafonné 100 €)",
    ],
  },
  tiers_employeur: {
    title: "SATD sur salaire/pension",
    tips: [
      "Méthode privilégiée : respecte les quotités saisissables et est sans frais bancaires",
      "L'employeur/organisme doit verser dans les 30 jours suivant la notification",
      "La SATD prime sur les autres saisies (sauf pensions alimentaires)",
      "Pour un fonctionnaire d'État, adressez la SATD à la DDFiP qui verse le traitement",
      "Utilisez le calculateur de quotité pour vérifier le montant saisissable mensuel",
      "La saisie se poursuit automatiquement chaque mois jusqu'à extinction de la dette",
    ],
    warnings: [
      "Respectez scrupuleusement les quotités saisissables (art. R.3252-2 C. travail)",
      "L'employeur qui ne répond pas ou ne verse pas peut être condamné à payer lui-même",
      "Le débiteur peut contester dans les 2 mois devant le JEX",
      "La pension alimentaire du débiteur doit être préservée en priorité",
      "Si le débiteur change d'employeur, une nouvelle SATD est nécessaire",
    ],
    references: [
      "Art. L. 262-1 du LPF — SATD sur rémunérations",
      "Art. R.3252-1 à R.3252-44 du Code du travail — Quotités saisissables",
      "Barème 2026 des saisies sur rémunération",
    ],
  },
  ficoba: {
    title: "Demande FICOBA",
    tips: [
      "FICOBA est le fichier national des comptes bancaires et assimilés",
      "La demande se fait auprès du directeur de la DDFiP du département du débiteur",
      "Le comptable public a un droit de communication automatique (art. L. 151 A du LPF)",
      "Demandez l'ensemble des comptes (courants, épargne, titres) du débiteur",
      "La réponse FICOBA vous indique la banque et le numéro de compte",
      "Privilégiez la saisie des comptes épargne plutôt que courants",
    ],
    warnings: [
      "Délai de réponse variable : 2 à 4 semaines en moyenne",
      "FICOBA ne fournit pas les soldes — seulement l'existence des comptes",
      "Les données FICOBA sont confidentielles — ne pas communiquer au débiteur",
    ],
    references: [
      "Art. L. 151 A du Livre des procédures fiscales — Droit de communication",
      "Art. L. 152-1 du LPF — FICOBA",
    ],
  },
  contestation: {
    title: "Gestion des contestations",
    tips: [
      "Le débiteur dispose de 2 mois pour contester devant le juge de l'exécution (JEX)",
      "La contestation ne suspend PAS automatiquement la SATD",
      "Préparez un mémoire en défense complet avec toutes les pièces de la procédure",
      "Conservez scrupuleusement tous les AR et preuves de notification",
    ],
    warnings: [
      "Le JEX vérifiera la régularité de CHAQUE étape de la procédure",
      "Un vice de procédure (absence d'avis, autorisation manquante) annule la SATD",
      "Le débiteur peut demander la suspension au juge — possibilité d'exécution provisoire",
    ],
    references: [
      "Art. L. 262-5 du LPF — Voies de recours",
      "Art. R. 262-4 du LPF — Compétence du JEX",
    ],
  },
  auto_satd: {
    title: "Auto-SATD sur bourse scolaire",
    tips: [
      "Vous pouvez vous saisir vous-même en tant que tiers détenteur des bourses",
      "Cas fréquent : élève qui change d'établissement en laissant une dette de DP",
      "Applicable aussi aux bourses versées dans les EPLE rattachés à votre agence",
      "Contactez le collègue agent comptable de l'autre EPLE préalablement (courtoisie)",
    ],
    warnings: [
      "La procédure complète (relances, avis, autorisation) reste obligatoire",
      "Documentez soigneusement la démarche — vous êtes à la fois créancier et tiers",
    ],
    references: [
      "Art. L. 262-1 du LPF — Pas de limitation sur l'identité du tiers détenteur",
      "Circulaire MEN MENF2023860C — Application en EPLE",
    ],
  },
  irrecouvrabilite: {
    title: "Irrécouvrabilité et admission en non-valeur",
    tips: [
      "Après échec avéré de la SATD, documentez les diligences effectuées",
      "L'admission en non-valeur relève de la décision de l'ordonnateur",
      "Conservez le dossier complet (preuves de relances, SATD, AR, FICOBA)",
      "La provision pour dépréciation (compte 491) doit avoir été constituée",
      "Le passage en 416 (créances douteuses) est un préalable comptable",
    ],
    warnings: [
      "L'absence de certificat d'irrécouvrabilité ne dégage pas le comptable si les diligences sont insuffisantes",
      "Documentez chaque étape pour pouvoir justifier auprès du juge des comptes",
      "L'admission en non-valeur n'éteint pas la créance — elle peut être reprise si le débiteur redevient solvable",
    ],
    references: [
      "Instruction M9-6 — Admission en non-valeur",
      "Décret n° 2012-1246 art. 60 — Responsabilité du comptable",
    ],
  },
};
