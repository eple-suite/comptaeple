// Reference data for SATD module — Barèmes 2026, DDFiP complets (EssatedeSCO), Banques, Réglementation exhaustive

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
    salaire: 6.50,
    banque: 6.50 + 100,
    huissier: 250 + 6.50,
  };

  const coutEstime = couts[typeSaisie] || 0;
  const ratio = montantCreance > 0 ? coutEstime / montantCreance : Infinity;

  let avis: AnalyseProportionnalite["avis"];
  let message: string;
  let recommandation: string;

  if (typeSaisie === "huissier" && montantCreance < 250) {
    avis = "deconseille";
    message = `Les frais d'huissier (~${coutEstime.toFixed(0)} €) dépassent le montant de la créance (${montantCreance.toFixed(2)} €).`;
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
// DDFiP — 110 DDFiP (Source: EssatedeSCO 2.0.5 — données officielles)
// Pour la saisie sur traitement des fonctionnaires
// ═══════════════════════════════════════════════════════════

export const DDFIP_LISTE = [
  { code: "01", nom: "DDFiP - Ain", adresse: "11 boulevard Maréchal-Leclerc, BP 40423", cp: "01012", ville: "BOURG-EN-BRESSE Cedex" },
  { code: "02", nom: "DDFiP - Aisne", adresse: "28 rue Saint-Martin", cp: "02025", ville: "LAON Cedex" },
  { code: "03", nom: "DDFiP - Allier", adresse: "9 avenue Victor Hugo", cp: "03016", ville: "MOULINS Cedex" },
  { code: "04", nom: "DDFiP - Alpes-de-Haute-Provence", adresse: "51 avenue du 8 Mai 1945", cp: "04017", ville: "DIGNE-LES-BAINS Cedex" },
  { code: "05", nom: "DDFiP - Hautes-Alpes", adresse: "Cours Ladoucette, BP 104", cp: "05007", ville: "GAP Cedex" },
  { code: "06", nom: "DDFiP - Alpes-Maritimes", adresse: "15 bis rue Delille", cp: "06073", ville: "NICE Cedex 1" },
  { code: "07", nom: "DDFiP - Ardèche", adresse: "11 avenue du Vanel, BP 714", cp: "07007", ville: "PRIVAS Cedex" },
  { code: "08", nom: "DDFiP - Ardennes", adresse: "50 avenue d'Arches, CS 60005", cp: "08011", ville: "CHARLEVILLE-MEZIERES Cedex" },
  { code: "09", nom: "DDFiP - Ariège", adresse: "55 cours Gabriel-Fauré, BP 86", cp: "09007", ville: "FOIX Cedex" },
  { code: "10", nom: "DDFiP - Aube", adresse: "22 boulevard Gambetta", cp: "10000", ville: "TROYES Cedex" },
  { code: "11", nom: "DDFiP - Aude", adresse: "Cité Administrative, 1 place Gaston-Jourdanne", cp: "11833", ville: "CARCASSONNE Cedex" },
  { code: "12", nom: "DDFiP - Aveyron", adresse: "2 place d'Armes, CS 53513", cp: "12035", ville: "RODEZ Cedex 9" },
  { code: "13", nom: "DDFiP - Bouches-du-Rhône", adresse: "16 rue Borde", cp: "13357", ville: "MARSEILLE Cedex 20" },
  { code: "14", nom: "DDFiP - Calvados", adresse: "7 boulevard Bertrand", cp: "14034", ville: "CAEN Cedex" },
  { code: "15", nom: "DDFiP - Cantal", adresse: "39 rue des Carmes", cp: "15012", ville: "AURILLAC Cedex" },
  { code: "16", nom: "DDFiP - Charente", adresse: "3 rue Pierre-Labachot, CS 12222", cp: "16022", ville: "ANGOULÊME Cedex" },
  { code: "17", nom: "DDFiP - Charente-Maritime", adresse: "24 avenue de Fétilly, BP 40587", cp: "17021", ville: "LA ROCHELLE Cedex 1" },
  { code: "18", nom: "DDFiP - Cher", adresse: "2 boulevard Lahitolle", cp: "18021", ville: "BOURGES Cedex" },
  { code: "19", nom: "DDFiP - Corrèze", adresse: "15 avenue Henri-de-Bournazel, BP 239", cp: "19012", ville: "TULLE Cedex" },
  { code: "2A", nom: "DDFiP - Corse-du-Sud", adresse: "2 avenue de la Grande-Armée, BP 410", cp: "20191", ville: "AJACCIO Cedex" },
  { code: "2B", nom: "DDFiP - Haute-Corse", adresse: "Square Saint-Victor, BP 110", cp: "20291", ville: "BASTIA Cedex" },
  { code: "21", nom: "DDFiP - Côte-d'Or", adresse: "1 bis place de la Banque", cp: "21042", ville: "DIJON Cedex" },
  { code: "22", nom: "DDFiP - Côtes d'Armor", adresse: "17 rue de la Gare", cp: "22023", ville: "SAINT-BRIEUC Cedex 1" },
  { code: "23", nom: "DDFiP - Creuse", adresse: "2 boulevard Saint-Pardoux, BP 149", cp: "23011", ville: "GUERET Cedex" },
  { code: "24", nom: "DDFiP - Dordogne", adresse: "15 rue du 26è-Régiment-d'Infanterie, CS 61000", cp: "24053", ville: "PERIGUEUX Cedex" },
  { code: "25", nom: "DDFiP - Doubs", adresse: "63 quai Veil-Picard", cp: "25030", ville: "BESANCON Cedex" },
  { code: "26", nom: "DDFiP - Drôme", adresse: "20 avenue du Président-Herriot, BP 1002", cp: "26015", ville: "VALENCE Cedex" },
  { code: "27", nom: "DDFiP - Eure", adresse: "Cité administrative, Boulevard Georges-Chauvin", cp: "27023", ville: "EVREUX Cedex" },
  { code: "28", nom: "DDFiP - Eure-et-Loir", adresse: "Cité administrative, 3 place de la République", cp: "28019", ville: "CHARTRES Cedex" },
  { code: "29", nom: "DDFiP - Finistère", adresse: "Le Sterenn, 7 A allée Couchouren, CS 91709", cp: "29107", ville: "QUIMPER Cedex" },
  { code: "30", nom: "DDFiP - Gard", adresse: "22 avenue Carnot", cp: "30943", ville: "NÎMES Cedex" },
  { code: "31", nom: "DDFiP - Haute-Garonne", adresse: "34 rue des Lois", cp: "31039", ville: "TOULOUSE Cedex 9" },
  { code: "32", nom: "DDFiP - Gers", adresse: "2 place Jean-David, CS 70352", cp: "32010", ville: "AUCH Cedex" },
  { code: "33", nom: "DDFiP - Gironde", adresse: "24 rue François-de-Sourdis, BP 908", cp: "33060", ville: "BORDEAUX Cedex" },
  { code: "34", nom: "DDFiP - Hérault", adresse: "334 allée Henri-II-de-Montmorency", cp: "34954", ville: "MONTPELLIER Cedex 2" },
  { code: "35", nom: "DDFiP - Ille-et-Vilaine", adresse: "Cité administrative, Avenue Janvier, BP 72102", cp: "35021", ville: "RENNES Cedex 9" },
  { code: "36", nom: "DDFiP - Indre", adresse: "10 rue Albert-1er, BP 595", cp: "36019", ville: "CHÂTEAUROUX Cedex" },
  { code: "37", nom: "DDFiP - Indre-et-Loire", adresse: "94 boulevard Béranger, CS 33228", cp: "37032", ville: "TOURS Cedex 1" },
  { code: "38", nom: "DDFiP - Isère", adresse: "8 rue de Belgrade", cp: "38022", ville: "GRENOBLE Cedex" },
  { code: "39", nom: "DDFiP - Jura", adresse: "8 avenue Thurel, BP 640", cp: "39021", ville: "LONS-LE-SAUNIER Cedex" },
  { code: "40", nom: "DDFiP - Landes", adresse: "23 rue Armand-Dulamon, BP 309", cp: "40011", ville: "MONT-DE-MARSAN Cedex" },
  { code: "41", nom: "DDFiP - Loir-et-Cher", adresse: "10 rue Louis-Bodin, CS 50001", cp: "41026", ville: "BLOIS Cedex" },
  { code: "42", nom: "DDFiP - Loire", adresse: "11 rue Mi-Carême, BP 20502", cp: "42007", ville: "SAINT-ETIENNE Cedex 1" },
  { code: "43", nom: "DDFiP - Haute-Loire", adresse: "17 rue des Moulins, BP 10351", cp: "43012", ville: "LE-PUY-EN-VELAY Cedex" },
  { code: "44", nom: "DDFiP - Loire-Atlantique", adresse: "4 quai de Versailles, BP 93503", cp: "44035", ville: "NANTES Cedex 1" },
  { code: "45", nom: "DDFiP - Loiret", adresse: "4 place du Martroi, BP 2435", cp: "45032", ville: "ORLEANS Cedex 1" },
  { code: "46", nom: "DDFiP - Lot", adresse: "190 rue du Président-Wilson", cp: "46000", ville: "CAHORS" },
  { code: "47", nom: "DDFiP - Lot-et-Garonne", adresse: "1 place des Jacobins, BP 70016", cp: "47916", ville: "AGEN Cedex 9" },
  { code: "48", nom: "DDFiP - Lozère", adresse: "1 ter boulevard Lucien-Arnault, BP 131", cp: "48005", ville: "MENDE Cedex" },
  { code: "49", nom: "DDFiP - Maine-et-Loire", adresse: "1 rue Talot, BP 84112", cp: "49041", ville: "ANGERS Cedex 01" },
  { code: "50", nom: "DDFiP - Manche", adresse: "Cité administrative, Place de la Préfecture, BP 225", cp: "50015", ville: "SAINT-LÔ Cedex" },
  { code: "51", nom: "DDFiP - Marne", adresse: "12 rue Sainte-Marguerite", cp: "51022", ville: "CHÂLONS-EN-CHAMPAGNE Cedex" },
  { code: "52", nom: "DDFiP - Haute-Marne", adresse: "5 rue de Lorraine, CS 10523", cp: "52011", ville: "CHAUMONT Cedex" },
  { code: "53", nom: "DDFiP - Mayenne", adresse: "24 allée de Cambrai, BP 1439", cp: "53014", ville: "LAVAL Cedex" },
  { code: "54", nom: "DDFiP - Meurthe-et-Moselle", adresse: "50 rue des Ponts, CS 60069", cp: "54036", ville: "NANCY Cedex" },
  { code: "55", nom: "DDFiP - Meuse", adresse: "17 rue du Général-de-Gaulle", cp: "55000", ville: "BAR-LE-DUC" },
  { code: "56", nom: "DDFiP - Morbihan", adresse: "35 boulevard de la Paix, BP 510", cp: "56019", ville: "VANNES Cedex" },
  { code: "57", nom: "DDFiP - Moselle", adresse: "1 rue François de Curel, BP 41054", cp: "57036", ville: "METZ Cedex 1" },
  { code: "58", nom: "DDFiP - Nièvre", adresse: "12 rue Henri-Barbusse, BP 28", cp: "58019", ville: "NEVERS Cedex" },
  { code: "59", nom: "DDFiP - Nord", adresse: "82 avenue Président-Kennedy, BP 70689", cp: "59033", ville: "LILLE Cedex" },
  { code: "60", nom: "DDFiP - Oise", adresse: "2 rue Molière, BP 80323", cp: "60021", ville: "BEAUVAIS Cedex" },
  { code: "61", nom: "DDFiP - Orne", adresse: "29 rue du Pont-Neuf, BP 344", cp: "61014", ville: "ALENCON Cedex" },
  { code: "62", nom: "DDFiP - Pas-de-Calais", adresse: "5 rue du Docteur-Brassart, BP 30015", cp: "62034", ville: "ARRAS Cedex" },
  { code: "63", nom: "DDFiP - Puy-de-Dôme", adresse: "2 rue Gilbert-Morel", cp: "63033", ville: "CLERMONT-FERRAND Cedex 1" },
  { code: "64", nom: "DDFiP - Pyrénées-Atlantiques", adresse: "8 place d'Espagne", cp: "64019", ville: "PAU Cedex" },
  { code: "65", nom: "DDFiP - Hautes-Pyrénées", adresse: "4 chemin de l'Ormeau, BP 1346", cp: "65013", ville: "TARBES Cedex" },
  { code: "66", nom: "DDFiP - Pyrénées-Orientales", adresse: "Square Arago, BP 950", cp: "66950", ville: "PERPIGNAN Cedex" },
  { code: "67", nom: "DDFiP - Bas-Rhin", adresse: "4 place de la République, CS 51002", cp: "67070", ville: "STRASBOURG Cedex" },
  { code: "68", nom: "DDFiP - Haut-Rhin", adresse: "6 rue Bruat, BP 60449", cp: "68020", ville: "COLMAR Cedex" },
  { code: "69", nom: "DDFiP - Rhône", adresse: "3, rue de la Charité", cp: "69002", ville: "LYON" },
  { code: "70", nom: "DDFiP - Haute-Saône", adresse: "8 place Pierre-Renet, BP 399", cp: "70014", ville: "VESOUL Cedex" },
  { code: "71", nom: "DDFiP - Saône-et-Loire", adresse: "29 rue Lamartine", cp: "71017", ville: "MÂCON Cedex" },
  { code: "72", nom: "DDFiP - Sarthe", adresse: "23 place des Comtes-du-Maine", cp: "72000", ville: "LE MANS" },
  { code: "73", nom: "DDFiP - Savoie", adresse: "5 rue Jean Girard-Madoux", cp: "73011", ville: "CHAMBERY Cedex" },
  { code: "74", nom: "DDFiP - Haute-Savoie", adresse: "18 rue de la Gare, BP 330", cp: "74008", ville: "ANNECY Cedex" },
  { code: "75", nom: "DDFiP - Paris", adresse: "94 rue Réaumur", cp: "75104", ville: "PARIS Cedex 02" },
  { code: "76", nom: "DDFiP - Seine-Maritime", adresse: "21 quai Jean-Moulin", cp: "76037", ville: "ROUEN Cedex" },
  { code: "77", nom: "DDFiP - Seine-et-Marne", adresse: "38 avenue Thiers", cp: "77011", ville: "MELUN Cedex" },
  { code: "78", nom: "DDFiP - Yvelines", adresse: "16 avenue de Saint-Cloud", cp: "78018", ville: "VERSAILLES Cedex" },
  { code: "79", nom: "DDFiP - Deux-Sèvres", adresse: "44 rue d'Alsace-Lorraine, BP 19149", cp: "79061", ville: "NIORT Cedex" },
  { code: "80", nom: "DDFiP - Somme", adresse: "22 rue de l'Amiral-Courbet, CS 12613", cp: "80026", ville: "AMIENS Cedex" },
  { code: "81", nom: "DDFiP - Tarn", adresse: "18 avenue Charles-de-Gaulle, CS 80002", cp: "81013", ville: "ALBI Cedex 9" },
  { code: "82", nom: "DDFiP - Tarn-et-Garonne", adresse: "10 avenue Marcel-Guerret, BP 757", cp: "82013", ville: "MONTAUBAN Cedex" },
  { code: "83", nom: "DDFiP - Var", adresse: "274 avenue de la République", cp: "83070", ville: "TOULON Cedex" },
  { code: "84", nom: "DDFiP - Vaucluse", adresse: "3 avenue de la Synagogue, BP 201", cp: "84011", ville: "AVIGNON Cedex 1" },
  { code: "85", nom: "DDFiP - Vendée", adresse: "3 rue Haxo, CS 70523", cp: "85017", ville: "LA-ROCHE-SUR-YON Cedex" },
  { code: "86", nom: "DDFiP - Vienne", adresse: "7 rue du Petit-Bonneveau, BP 505", cp: "86020", ville: "POITIERS Cedex" },
  { code: "87", nom: "DDFiP - Haute-Vienne", adresse: "2 avenue Garibaldi", cp: "87031", ville: "LIMOGES Cedex" },
  { code: "88", nom: "DDFiP - Vosges", adresse: "6 place du Général-de-Gaulle, CS 60529", cp: "88021", ville: "EPINAL Cedex" },
  { code: "89", nom: "DDFiP - Yonne", adresse: "1 rue de Preuilly", cp: "89010", ville: "AUXERRE Cedex" },
  { code: "90", nom: "DDFiP - Territoire de Belfort", adresse: "11 avenue de la Gare", cp: "90020", ville: "BELFORT Cedex" },
  { code: "91", nom: "DDFiP - Essonne", adresse: "Centre administratif, Bd de France", cp: "91012", ville: "EVRY Cedex" },
  { code: "92", nom: "DDFiP - Hauts-de-Seine", adresse: "167-177 avenue Joliot-Curie", cp: "92013", ville: "NANTERRE Cedex" },
  { code: "93", nom: "DDFiP - Seine-Saint-Denis", adresse: "1 place du Front-Populaire", cp: "93206", ville: "SAINT-DENIS Cedex" },
  { code: "94", nom: "DDFiP - Val-de-Marne", adresse: "1 place du Général-Pierre-Billotte", cp: "94046", ville: "CRETEIL Cedex" },
  { code: "95", nom: "DDFiP - Val-d'Oise", adresse: "5 avenue Bernard-Hirsch, BP 80324", cp: "95027", ville: "CERGY-PONTOISE Cedex" },
  // Outre-mer
  { code: "971", nom: "DDFiP - Guadeloupe", adresse: "Rue Achille René-Boisneuf", cp: "97100", ville: "BASSE-TERRE" },
  { code: "972", nom: "DDFiP - Martinique", adresse: "8 rue Victor Sévère", cp: "97200", ville: "FORT-DE-FRANCE" },
  { code: "973", nom: "DDFiP - Guyane", adresse: "8 rue Schoelcher", cp: "97300", ville: "CAYENNE" },
  { code: "974", nom: "DDFiP - La Réunion", adresse: "12 rue Mgr de Beaumont", cp: "97400", ville: "SAINT-DENIS" },
  { code: "976", nom: "DDFiP - Mayotte", adresse: "BP 68", cp: "97600", ville: "MAMOUDZOU" },
  // Corse already in main list as 2A/2B
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
  { nom: "Hello Bank", bic: "BNPAFRPP", adresseSaisies: "TSA 93005, 75318 Paris Cedex 09 (via BNP Paribas)" },
  { nom: "Monabanq", bic: "CMCIFRPP", adresseSaisies: "59, avenue Pierre Mendès France, 75013 Paris" },
  { nom: "Orange Bank", bic: "CCFRFRPP", adresseSaisies: "67 rue Robespierre, 93558 Montreuil Cedex" },
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
    { reference: "Art. L. 262-1 à L. 262-5 du Livre des procédures fiscales (LPF)", objet: "Fondement juridique de la SATD", detail: "Permet à tout comptable public de procéder à une saisie sur les sommes détenues par un tiers pour le compte du débiteur." },
    { reference: "Art. R. 262-1 et suivants du LPF", objet: "Modalités d'application de la SATD", detail: "Forme de la notification, délais, obligations du tiers détenteur." },
    { reference: "Art. L. 1617-5 du CGCT", objet: "Recouvrement des produits des collectivités et EPLE", detail: "Phase amiable obligatoire, autorisation de l'ordonnateur, avis avant poursuites." },
    { reference: "Circulaire MEN MENF2023860C du 8 octobre 2020 (BO n°41)", objet: "Circulaire d'application SATD pour les EPLE", detail: "Précise les modalités d'utilisation de la SATD par les agents comptables des EPLE." },
    { reference: "Note de service BOFIP-GCP-19-0010 du 27 février 2019", objet: "Mise en œuvre de la SATD par les comptables publics", detail: "Guide détaillé de la procédure : notification, tiers, délais, contestation." },
    { reference: "Décret n° 2012-1246 du 7 novembre 2012", objet: "Décret relatif à la gestion budgétaire et comptable publique", detail: "Définit les obligations du comptable en matière de recouvrement." },
    { reference: "Instruction codificatrice M9-6 (OP@LE)", objet: "Instruction comptable des EPLE", detail: "Cadre comptable du recouvrement, comptes 411, 416, 491." },
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
    { type: "Agent comptable EPLE", detail: "Auto-SATD sur bourse scolaire." },
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
      "La notification doit être faite par RAR",
      "Si le compte est insuffisant, la SATD porte sur le solde disponible",
    ],
    warnings: [
      "La SATD bloque TOUS les comptes du débiteur pendant 15 jours ouvrables",
      "Des frais bancaires (max 10% du montant, plafonné à 100 €) sont facturés au débiteur",
      "Les comptes joints sont saisissables pour la totalité sauf preuve contraire",
      "Les néo-banques (N26, Revolut) nécessitent une notification à l'étranger",
    ],
    references: [
      "Art. L. 262-1 du LPF — SATD sur fonds détenus par un tiers",
      "Art. L. 162-2 du Code des procédures civiles d'exécution — Blocage des comptes",
      "Art. R. 3252-38 du Code du travail — SBI",
    ],
  },
  tiers_employeur: {
    title: "SATD sur salaire/pension",
    tips: [
      "Méthode privilégiée : respecte les quotités saisissables et est sans frais bancaires",
      "L'employeur doit verser dans les 30 jours suivant la notification",
      "La SATD prime sur les autres saisies (sauf pensions alimentaires)",
      "Pour un fonctionnaire d'État, adressez la SATD à la DDFiP qui verse le traitement",
      "La saisie se poursuit automatiquement chaque mois jusqu'à extinction de la dette",
    ],
    warnings: [
      "Respectez scrupuleusement les quotités saisissables (art. R.3252-2 C. travail)",
      "L'employeur qui ne verse pas peut être condamné à payer lui-même",
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
      "La réponse FICOBA vous indique la banque et le numéro de compte",
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
      "Préparez un mémoire en défense complet avec toutes les pièces",
      "Conservez scrupuleusement tous les AR et preuves de notification",
    ],
    warnings: [
      "Le JEX vérifiera la régularité de CHAQUE étape de la procédure",
      "Un vice de procédure annule la SATD",
      "Le débiteur peut demander la suspension au juge",
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
      "Applicable aussi aux bourses versées dans les EPLE rattachés",
      "Contactez le collègue agent comptable de l'autre EPLE préalablement",
    ],
    warnings: [
      "La procédure complète (relances, avis, autorisation) reste obligatoire",
      "Documentez soigneusement la démarche — vous êtes à la fois créancier et tiers",
    ],
    references: [
      "Art. L. 262-1 du LPF",
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
      "L'admission en non-valeur n'éteint pas la créance — elle peut être reprise si le débiteur redevient solvable",
    ],
    references: [
      "Instruction M9-6 — Admission en non-valeur",
      "Décret n° 2012-1246 art. 60 — Responsabilité du comptable",
    ],
  },
};
