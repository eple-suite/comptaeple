/**
 * Base de connaissances réglementaire pour agents comptables d'EPLE
 * Sources : M9-6 (2026), Décret 2012-1246, Code de la commande publique,
 * Circulaires rectorales, IH2EF, DAF A3, Intendance Zone, Espace EPLE
 */

// ═══════════════════════════════════════════════════════════════
// DÉCRET 2012-1246 — Gestion budgétaire et comptable publique
// ═══════════════════════════════════════════════════════════════

export const DECRET_2012_1246 = {
  reference: "Décret n° 2012-1246 du 7 novembre 2012",
  titre: "Gestion budgétaire et comptable publique (GBCP)",
  articlesClefs: [
    {
      article: "Art. 18",
      contenu: "L'agent comptable est seul chargé de la prise en charge, du recouvrement, du paiement et de la conservation des fonds et valeurs.",
      impact: "Responsabilité exclusive de l'AC sur les opérations comptables",
    },
    {
      article: "Art. 19",
      contenu: "L'agent comptable est tenu d'exercer le contrôle de la validité de la dette (exactitude des calculs de liquidation, production des pièces justificatives, visa du contrôleur budgétaire le cas échéant).",
      impact: "Contrôles obligatoires avant paiement",
    },
    {
      article: "Art. 20",
      contenu: "L'agent comptable est tenu de procéder à la vérification des comptes de disponibilités et à l'exactitude des écritures comptables.",
      impact: "Rapprochement bancaire et vérification des écritures",
    },
    {
      article: "Art. 42",
      contenu: "L'ordonnateur constate les droits et obligations, liquide les recettes et émet les ordres de recouvrer et de payer.",
      impact: "Séparation ordonnateur/comptable",
    },
    {
      article: "Art. 43",
      contenu: "L'agent comptable est chargé du recouvrement des ordres de recettes émis par l'ordonnateur. Il met en œuvre les procédures de recouvrement forcé (SATD).",
      impact: "Obligation de recouvrement et diligences",
    },
    {
      article: "Art. 195-199",
      contenu: "Les EPLE sont soumis aux règles de la comptabilité publique. Le compte financier est arrêté au 31 janvier de l'exercice suivant et soumis au vote du CA.",
      impact: "Calendrier du compte financier",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SOLDES ANORMAUX — Référentiel complet M9-6
// ═══════════════════════════════════════════════════════════════

export interface RegleSoldeAnormal {
  compte: string;
  libelle: string;
  sensNormal: "debiteur" | "crediteur";
  anomalie: string;
  action: string;
  gravite: "critique" | "attention" | "information";
  sourceFinancement?: "etat" | "collectivite" | "familles" | "propre";
}

export const SOLDES_ANORMAUX: RegleSoldeAnormal[] = [
  // ─── CLASSE 1 ───
  { compte: "102", libelle: "Dotation", sensNormal: "crediteur", anomalie: "Solde débiteur = dotation devenue négative, situation impossible", action: "Vérifier les écritures d'affectation du résultat", gravite: "critique" },
  { compte: "106", libelle: "Réserves", sensNormal: "crediteur", anomalie: "Solde débiteur = réserves épuisées, déficit structurel", action: "Alerter le CA et la collectivité", gravite: "critique" },
  { compte: "12", libelle: "Résultat de l'exercice", sensNormal: "crediteur", anomalie: "Solde débiteur = déficit sur l'exercice", action: "Analyser les causes du déficit, plan de redressement", gravite: "attention" },
  { compte: "131", libelle: "Subventions investissement — État", sensNormal: "crediteur", anomalie: "Solde débiteur = subvention État consommée au-delà de la notification", action: "Vérifier les notifications de subventions (DRFIP)", gravite: "critique", sourceFinancement: "etat" },
  { compte: "132", libelle: "Subventions investissement — Collectivités", sensNormal: "crediteur", anomalie: "Solde débiteur = subvention collectivité consommée au-delà de la notification", action: "Vérifier avec la collectivité de rattachement", gravite: "critique", sourceFinancement: "collectivite" },
  { compte: "15", libelle: "Provisions", sensNormal: "crediteur", anomalie: "Solde débiteur = provisions devenues négatives, impossible", action: "Corriger les écritures de dotation/reprise", gravite: "critique" },

  // ─── CLASSE 2 ───
  { compte: "21", libelle: "Immobilisations corporelles", sensNormal: "debiteur", anomalie: "Solde créditeur = amortissements > valeur brute, erreur d'écriture", action: "Vérifier le tableau des amortissements", gravite: "critique" },
  { compte: "28", libelle: "Amortissements", sensNormal: "crediteur", anomalie: "Solde débiteur = amortissements négatifs, erreur", action: "Rapprocher avec les immobilisations (21)", gravite: "critique" },

  // ─── CLASSE 3 ───
  { compte: "31", libelle: "Stocks de denrées", sensNormal: "debiteur", anomalie: "Solde créditeur = stock négatif, erreur d'inventaire", action: "Effectuer un inventaire physique", gravite: "attention" },

  // ─── CLASSE 4 — COMPTES DE TIERS ───
  { compte: "401", libelle: "Fournisseurs", sensNormal: "crediteur", anomalie: "Solde débiteur = avances fournisseurs ou double paiement", action: "Vérifier les avoirs et avances non régularisées", gravite: "attention" },
  { compte: "4112", libelle: "Familles — Demi-pensionnaires", sensNormal: "debiteur", anomalie: "Solde créditeur = familles en avance de paiement", action: "Vérifier les trop-perçus à rembourser", gravite: "information", sourceFinancement: "familles" },
  { compte: "4113", libelle: "Familles — Internes", sensNormal: "debiteur", anomalie: "Solde créditeur = familles en avance de paiement", action: "Vérifier les trop-perçus à rembourser", gravite: "information", sourceFinancement: "familles" },
  { compte: "416", libelle: "Créances douteuses", sensNormal: "debiteur", anomalie: "Solde créditeur = impossible sur un compte de créances", action: "Corriger les écritures de dépréciation", gravite: "critique" },
  { compte: "421", libelle: "Personnel — Rémunérations dues", sensNormal: "crediteur", anomalie: "Solde débiteur = avances au personnel non régularisées", action: "Vérifier les avances et acomptes", gravite: "attention" },

  // ─── Comptes subventions ÉTAT (sphère comptable) ───
  { compte: "4411", libelle: "Subventions État à recevoir", sensNormal: "crediteur", anomalie: "Solde débiteur anormal — l'État n'a pas versé la subvention notifiée", action: "Relancer la DRFIP / le rectorat", gravite: "attention", sourceFinancement: "etat" },
  { compte: "44311", libelle: "Bourses nationales — Crédit à répartir", sensNormal: "crediteur", anomalie: "Solde débiteur = les bourses distribuées dépassent les avances de l'État", action: "Vérifier le circuit 44311 → 468100 → 4112/4113", gravite: "critique", sourceFinancement: "etat" },
  { compte: "44312", libelle: "Bourses nationales — Part familles", sensNormal: "debiteur", anomalie: "Solde créditeur = excédent à rembourser aux familles", action: "Traiter les remboursements d'excédents de bourses", gravite: "attention", sourceFinancement: "etat" },
  { compte: "4432", libelle: "Primes et indemnités État", sensNormal: "crediteur", anomalie: "Solde débiteur = primes versées sans financement", action: "Vérifier les notifications de primes", gravite: "critique", sourceFinancement: "etat" },
  { compte: "4438", libelle: "Fonds sociaux État (FSE, FSL)", sensNormal: "crediteur", anomalie: "Solde débiteur = fonds sociaux consommés au-delà de la dotation", action: "Vérifier les crédits notifiés par le rectorat", gravite: "critique", sourceFinancement: "etat" },
  { compte: "468100", libelle: "Produits à répartir — Bourses", sensNormal: "crediteur", anomalie: "Solde débiteur = répartition des bourses incomplète", action: "Vérifier le circuit de répartition des bourses", gravite: "attention", sourceFinancement: "etat" },

  // ─── Comptes subventions COLLECTIVITÉS (sphère comptable) ───
  { compte: "4412", libelle: "Collectivité — Subventions à recevoir", sensNormal: "crediteur", anomalie: "Solde débiteur = la collectivité n'a pas versé les subventions", action: "Relancer la collectivité de rattachement", gravite: "attention", sourceFinancement: "collectivite" },
  { compte: "441220", libelle: "DGF — Dotation globale fonctionnement", sensNormal: "crediteur", anomalie: "Solde débiteur = DGF consommée au-delà de la notification", action: "Vérifier la notification de DGF avec la collectivité", gravite: "critique", sourceFinancement: "collectivite" },

  // ─── CLASSE 5 ───
  { compte: "515", libelle: "Dépôt au Trésor", sensNormal: "debiteur", anomalie: "Solde créditeur = compte débiteur au Trésor, situation interdite", action: "ALERTE URGENTE : régularisation immédiate avec la DDFiP", gravite: "critique" },
  { compte: "531", libelle: "Caisse", sensNormal: "debiteur", anomalie: "Solde créditeur = caisse négative, impossible", action: "Vérifier les mouvements de caisse et PV de caisse", gravite: "critique" },

  // ─── CLASSE 6 ───
  { compte: "6", libelle: "Charges (toutes)", sensNormal: "debiteur", anomalie: "Solde créditeur = charges négatives (possible si avoirs > charges)", action: "Vérifier les avoirs et les régularisations", gravite: "attention" },

  // ─── CLASSE 7 ───
  { compte: "7411", libelle: "Subventions État fonctionnement", sensNormal: "crediteur", anomalie: "Solde débiteur = subventions État annulées ou remboursées", action: "Vérifier les titres de recettes et notifications", gravite: "critique", sourceFinancement: "etat" },
  { compte: "74121", libelle: "Subventions Région fonctionnement", sensNormal: "crediteur", anomalie: "Solde débiteur = subventions Région annulées", action: "Vérifier avec le service financier de la Région", gravite: "critique", sourceFinancement: "collectivite" },
  { compte: "74122", libelle: "Subventions Département fonctionnement", sensNormal: "crediteur", anomalie: "Solde débiteur = subventions Département annulées", action: "Vérifier avec le service financier du Département", gravite: "critique", sourceFinancement: "collectivite" },
];

// ═══════════════════════════════════════════════════════════════
// DISTINCTION COLLECTIVITÉ / ÉTAT — Comptes réservés
// ═══════════════════════════════════════════════════════════════

export const COMPTES_COLLECTIVITE = {
  description: "Comptes réservés à la collectivité de rattachement (Région pour les lycées, Département pour les collèges)",
  comptable: ["4412", "441220"],
  ordonnateur: ["74121", "74122", "7413"],
  investissement: ["132"],
  alertes: [
    "Ne JAMAIS imputer une recette de la collectivité sur un compte État (4411, 7411)",
    "Ne JAMAIS imputer une subvention État sur un compte collectivité (4412, 74121/74122)",
    "La DGF (441220) est EXCLUSIVEMENT réservée à la collectivité de rattachement",
    "Les subventions d'investissement État → 131, collectivité → 132",
  ],
};

export const COMPTES_ETAT = {
  description: "Comptes réservés à l'État (rectorat, DRFIP, ministère)",
  comptable: ["4411", "44311", "44312", "4432", "4438", "468100"],
  ordonnateur: ["7411"],
  investissement: ["131"],
  alertes: [
    "Les bourses nationales transitent UNIQUEMENT par 44311 → 468100 → 4112/4113",
    "Les fonds sociaux État (FSE/FSL) → 4438 (comptable) — ne pas confondre avec les fonds propres",
    "Les primes et indemnités État → 4432 (comptable)",
    "Les subventions d'investissement État → 131 (et non 132)",
  ],
};

// ═══════════════════════════════════════════════════════════════
// CODE DE LA COMMANDE PUBLIQUE — Seuils 2026
// ═══════════════════════════════════════════════════════════════

export const SEUILS_MARCHES_PUBLICS = {
  reference: "Code de la commande publique (CCP) — Art. R2122-8, R2123-1, R2124-1",
  annee: 2026,
  seuils: [
    {
      nom: "Gré à gré (dispense de publicité)",
      montantHT: 40000,
      description: "Achat direct sans mise en concurrence formelle. Obligation de bon usage des deniers publics.",
      obligations: ["Devoir de bon achat", "Conservation des pièces justificatives"],
    },
    {
      nom: "MAPA simplifié (3 devis)",
      montantMinHT: 40000,
      montantMaxHT: 90000,
      description: "Procédure adaptée simplifiée. 3 devis comparatifs minimum obligatoires.",
      obligations: ["3 devis minimum", "Grille d'analyse des offres", "Notification au retenu et aux évincés"],
    },
    {
      nom: "MAPA avec publicité",
      montantMinHT: 90000,
      montantMaxHT: 221000,
      description: "Procédure adaptée avec publicité obligatoire (JOUE ou JAL ou profil acheteur).",
      obligations: ["Publicité obligatoire", "Dossier de consultation", "PV d'analyse des offres", "Notification", "Rapport de présentation"],
    },
    {
      nom: "Procédure formalisée (appel d'offres)",
      montantMinHT: 221000,
      description: "Appel d'offres ouvert ou restreint. JOUE obligatoire.",
      obligations: ["Publication JOUE", "DCE complet", "Commission d'appel d'offres", "Notification", "Contrôle de légalité"],
    },
  ],
  reglesCumul: {
    description: "ATTENTION : les seuils s'apprécient par catégorie homogène de prestations sur l'année civile. Pour les voyages scolaires, il faut cumuler par nature de prestation (transport, hébergement, etc.) sur l'ensemble des voyages de l'année.",
    exemples: [
      "Si 5 voyages utilisent le même type de transport (autocar) → cumuler tous les montants transport",
      "Si le total transport dépasse 40 000 € HT → obligation de mise en concurrence formelle",
      "L'hébergement et le transport sont des catégories DISTINCTES",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// OUTILS DE L'AGENT COMPTABLE
// ═══════════════════════════════════════════════════════════════

export const OUTILS_AC = [
  {
    nom: "REPROFI",
    description: "Restitution des Profils Financiers — Outil académique d'aide au pilotage financier des EPLE",
    usage: "Analyse comparative inter-établissements, indicateurs financiers, profil radar",
    source: "DAF A3 / Académie",
    lien: "Accessible via le portail académique (intranet)",
    fonctionnalites: [
      "Profil financier sur 5 exercices",
      "Indicateurs réglementaires (FDR, BFR, trésorerie, jours fonctionnement)",
      "Comparaison avec la moyenne académique et nationale",
      "Alertes automatiques sur les seuils",
      "Export pour le compte financier",
    ],
  },
  {
    nom: "Mobilisco",
    description: "Outil de suivi de la mobilité des agents comptables et des fondés de pouvoir",
    usage: "Gestion des affectations, suivi des passations de service",
    source: "DAF A3",
    lien: "Portail DAF A3",
    fonctionnalites: [
      "Suivi des affectations AC/FDP",
      "Planning des passations de service",
      "Documents de passation standardisés",
      "Historique des affectations",
    ],
  },
  {
    nom: "ESSATEDÉ (Essatédé)",
    description: "Outil de suivi des Saisies Administratives à Tiers Détenteur (SATD) pour les EPLE",
    usage: "Suivi du recouvrement forcé, prescription, gestion des SATD",
    source: "Académie / DDFiP",
    lien: "Portail PEPS (dématérialisé depuis 2026)",
    fonctionnalites: [
      "Suivi des créances impayées",
      "Calcul automatique des délais de prescription (4 ans)",
      "Émission dématérialisée des SATD via PEPS",
      "Suivi des retours bancaires et employeurs",
      "Statistiques de recouvrement",
    ],
  },
  {
    nom: "EFFESCO",
    description: "Outil de suivi des effectifs scolaires et de la restauration",
    usage: "Suivi des effectifs DP/internes, calcul du crédit nourriture, prix de revient",
    source: "Académie",
    lien: "Portail académique",
    fonctionnalites: [
      "Suivi quotidien des effectifs restauration",
      "Calcul du coût denrées par repas",
      "Suivi du crédit nourriture (service A2)",
      "Prix de revient différencié DP/internes/commensaux",
      "Comparaison avec le barème académique",
    ],
  },
  {
    nom: "Op@le",
    description: "Progiciel de gestion budgétaire et comptable des EPLE — remplace GFC/COFI",
    usage: "Comptabilité, budget, paye, régies, inventaire",
    source: "MEN / DAF",
    lien: "https://opale.education.fr",
    fonctionnalites: [
      "Budget : saisie DBM, virements, prélèvements sur FDR",
      "Comptabilité : mandatement, titres de recettes, rapprochement bancaire",
      "Paye : conventions, vacations, indemnités",
      "Régies : suivi des régisseurs, plafonds, PV de vérification",
      "Inventaire : immobilisations, amortissements",
      "Recouvrement : lettres de relance, SATD (via PEPS)",
      "Reporting : balance, grand livre, compte financier",
    ],
    tutoriels: [
      { titre: "Prise en main d'Op@le — Module budget", source: "IH2EF", url: "https://www.ih2ef.gouv.fr/" },
      { titre: "Op@le — Mandatement et paiement", source: "Académie de Versailles", url: "https://www.ac-versailles.fr/" },
      { titre: "Op@le — Gestion des régies", source: "Académie de Lyon", url: "https://www.ac-lyon.fr/" },
      { titre: "Op@le — Rapprochement bancaire", source: "Intendance Zone", url: "https://www.intendancezone.net/" },
      { titre: "Op@le — Compte financier", source: "Espace EPLE", url: "https://espaceeple.ac-nantes.fr/" },
      { titre: "Op@le — SATD dématérialisée", source: "DAF A3", url: "https://www.education.gouv.fr/" },
      { titre: "Op@le — Clôture annuelle", source: "Académie de Lille", url: "https://www.ac-lille.fr/" },
      { titre: "Op@le — Import balance CSV", source: "Académie de Bordeaux", url: "https://www.ac-bordeaux.fr/" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ENQUÊTES RECTORALES — Calendrier type
// ═══════════════════════════════════════════════════════════════

export const ENQUETES_RECTORALES = [
  {
    nom: "Enquête financière annuelle (EFA)",
    periode: "Février-Mars",
    description: "Collecte des données financières pour REPROFI. Indicateurs FDR, BFR, trésorerie, charges, produits.",
    destinataire: "DAF A3 / Rectorat",
    obligatoire: true,
    donnees: ["Balance définitive N-1", "Indicateurs financiers", "Effectifs", "Crédit nourriture"],
  },
  {
    nom: "Remontée des créances impayées",
    periode: "Trimestrielle (oct, jan, avr, juil)",
    description: "État des créances de plus de 3 mois. Suivi des diligences de recouvrement.",
    destinataire: "DDFiP / Rectorat",
    obligatoire: true,
    donnees: ["Créances > 3 mois par nature", "Diligences effectuées", "Montants admis en non-valeur"],
  },
  {
    nom: "Contrôle interne comptable — Rapport annuel",
    periode: "Janvier",
    description: "Rapport sur la mise en œuvre du CIC : taux de contrôle, anomalies détectées, plan d'action.",
    destinataire: "DDFiP / Rectorat",
    obligatoire: true,
    donnees: ["Taux de réalisation des contrôles", "Anomalies", "Plan d'action"],
  },
  {
    nom: "Enquête SRH (restauration/hébergement)",
    periode: "Octobre et Mars",
    description: "Effectifs restauration, coût denrées, prix de revient, tarifs appliqués.",
    destinataire: "Collectivité / Rectorat",
    obligatoire: true,
    donnees: ["Effectifs DP/internes/commensaux", "Coût denrées", "Prix de revient", "Tarifs"],
  },
  {
    nom: "Remontée des régies",
    periode: "Annuelle (janvier)",
    description: "État des régies, montants encaissés, PV de vérification, incidents.",
    destinataire: "DDFiP",
    obligatoire: true,
    donnees: ["Liste des régies", "Montants", "PV vérification", "Incidents"],
  },
  {
    nom: "Enquête marchés publics",
    periode: "Annuelle (mars)",
    description: "Recensement des marchés passés, montants par catégorie, respect des seuils.",
    destinataire: "Rectorat / DAF",
    obligatoire: false,
    donnees: ["Marchés > 40k€", "Procédure utilisée", "Montant", "Prestataire"],
  },
  {
    nom: "Enquête bourses — Bilan campagne",
    periode: "Juillet et Décembre",
    description: "Bilan de la campagne de bourses : nombre de bénéficiaires, montants, restes à distribuer.",
    destinataire: "DSDEN / Rectorat",
    obligatoire: true,
    donnees: ["Nombre de boursiers", "Montants versés", "Solde 44311/468100", "Excédents 44312"],
  },
];

// ═══════════════════════════════════════════════════════════════
// CIRCUIT DES BOURSES NATIONALES
// ═══════════════════════════════════════════════════════════════

export const CIRCUIT_BOURSES = {
  description: "Circuit comptable des bourses nationales dans Op@le (M9-6)",
  etapes: [
    { etape: 1, operation: "Avance État", debit: "515 (Trésor)", credit: "44311 (Crédit à répartir)", description: "L'État verse une avance sur bourses" },
    { etape: 2, operation: "Répartition", debit: "44311", credit: "468100 (Produits à répartir)", description: "Le crédit est réparti entre les familles" },
    { etape: 3, operation: "Imputation familles", debit: "468100", credit: "4112/4113 (Créances familles)", description: "Déduction sur les factures des familles" },
    { etape: 4, operation: "Excédent éventuel", debit: "44312 (Part familles)", credit: "515", description: "Remboursement de l'excédent aux familles" },
  ],
  controles: [
    "Le solde de 44311 doit tendre vers zéro en fin d'exercice",
    "468100 est un compte pivot qui doit être soldé après répartition complète",
    "Un solde débiteur sur 44311 = bourses distribuées > avances État → ANOMALIE CRITIQUE",
    "44312 débiteur = excédent à rembourser aux familles",
  ],
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION DES COMPTES — Règles de cohérence
// ═══════════════════════════════════════════════════════════════

export interface RegleValidation {
  id: string;
  titre: string;
  description: string;
  verification: string;
  gravite: "bloquant" | "majeur" | "mineur";
  source: string;
}

export const REGLES_VALIDATION: RegleValidation[] = [
  {
    id: "V01",
    titre: "Équilibre de la balance",
    description: "La balance générale doit être équilibrée : total débits = total crédits",
    verification: "Σ débits = Σ crédits (tolérance 0,01 €)",
    gravite: "bloquant",
    source: "M9-6 — Principes généraux",
  },
  {
    id: "V02",
    titre: "Résultat cohérent",
    description: "Le résultat au compte 12 doit correspondre à la différence classe 7 - classe 6",
    verification: "|Compte 12| = |Σ classe 7 - Σ classe 6| (tolérance 1 €)",
    gravite: "bloquant",
    source: "M9-6 — Classe 1",
  },
  {
    id: "V03",
    titre: "Trésorerie = FDR - BFR",
    description: "L'identité fondamentale FDR - BFR = Trésorerie nette doit être vérifiée",
    verification: "Classe 5 (solde net) = (Classe 1 + Classe 2 solde) - (Classe 3 + Classe 4 solde)",
    gravite: "bloquant",
    source: "Analyse financière EPLE",
  },
  {
    id: "V04",
    titre: "Rapprochement bancaire",
    description: "Le solde du compte 515 doit correspondre au relevé du Trésor au 31/12",
    verification: "Solde 515 comptable = Solde relevé Trésor ± opérations en rapprochement",
    gravite: "bloquant",
    source: "Décret 2012-1246, art. 20",
  },
  {
    id: "V05",
    titre: "Caisse non négative",
    description: "Le compte 531 (caisse) ne peut jamais avoir un solde créditeur",
    verification: "Solde 531 ≥ 0",
    gravite: "bloquant",
    source: "M9-6 — Classe 5",
  },
  {
    id: "V06",
    titre: "Dépôt au Trésor non négatif",
    description: "Le compte 515 ne peut pas être créditeur (découvert interdit pour les EPLE)",
    verification: "Solde 515 ≥ 0",
    gravite: "bloquant",
    source: "M9-6 — Classe 5",
  },
  {
    id: "V07",
    titre: "Cohérence bourses — Circuit 44311/468100",
    description: "Le circuit des bourses doit être complet : avances État = répartitions familles",
    verification: "Solde 44311 + Solde 468100 ≈ 0 en fin d'exercice",
    gravite: "majeur",
    source: "Circulaire bourses nationales",
  },
  {
    id: "V08",
    titre: "Amortissements ≤ Valeur brute immobilisations",
    description: "Le total des amortissements ne peut pas dépasser la valeur brute des immobilisations",
    verification: "|Solde 28| ≤ Solde 21",
    gravite: "bloquant",
    source: "M9-6 — Classe 2",
  },
  {
    id: "V09",
    titre: "Distinction État / Collectivité",
    description: "Les comptes 4411 (État) et 4412 (collectivité) ne doivent pas être confondus",
    verification: "Vérifier que les imputations correspondent aux notifications de chaque financeur",
    gravite: "majeur",
    source: "M9-6 — Classe 4",
  },
  {
    id: "V10",
    titre: "Concordance ordonnateur / comptable",
    description: "Les totaux de la sphère ordonnateur doivent correspondre à ceux de la sphère comptable",
    verification: "Titres de recettes émis (ordonnateur) = Prises en charge (comptable)",
    gravite: "bloquant",
    source: "Décret 2012-1246, art. 42-43",
  },
  {
    id: "V11",
    titre: "FDR en jours ≥ 30 jours",
    description: "Le fonds de roulement doit couvrir au moins 30 jours de fonctionnement",
    verification: "FDR / (charges annuelles / 360) ≥ 30",
    gravite: "majeur",
    source: "Recommandation IH2EF / DAF A3",
  },
  {
    id: "V12",
    titre: "Taux de recouvrement ≥ 95%",
    description: "Le taux de recouvrement des créances doit être supérieur à 95%",
    verification: "Recettes encaissées / Recettes émises ≥ 95%",
    gravite: "mineur",
    source: "Objectif qualité comptable DGFiP",
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER : Valider une balance complète
// ═══════════════════════════════════════════════════════════════

export interface AlerteComptable {
  id: string;
  titre: string;
  message: string;
  gravite: "bloquant" | "majeur" | "mineur" | "info";
  compte?: string;
  source: string;
  action: string;
}

export function validerBalance(comptes: { numero: string; libelle: string; debit: number; credit: number; solde: number }[]): AlerteComptable[] {
  const alertes: AlerteComptable[] = [];

  // V01 — Équilibre
  const totalDebit = comptes.reduce((s, c) => s + c.debit, 0);
  const totalCredit = comptes.reduce((s, c) => s + c.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    alertes.push({
      id: "V01", titre: "Balance déséquilibrée",
      message: `Écart de ${(totalDebit - totalCredit).toFixed(2)} € entre débits et crédits`,
      gravite: "bloquant", source: "M9-6", action: "Corriger les écritures pour rétablir l'équilibre",
    });
  }

  // Soldes anormaux
  for (const c of comptes) {
    const regle = SOLDES_ANORMAUX.find(r => c.numero.startsWith(r.compte));
    if (!regle) continue;

    const sensReel = c.solde > 0 ? "debiteur" : c.solde < 0 ? "crediteur" : null;
    if (sensReel && sensReel !== regle.sensNormal) {
      alertes.push({
        id: `SA-${regle.compte}`, titre: `Solde anormal — ${regle.compte} ${regle.libelle}`,
        message: regle.anomalie,
        gravite: regle.gravite === "critique" ? "bloquant" : regle.gravite === "attention" ? "majeur" : "mineur",
        compte: c.numero, source: "M9-6 / Décret 2012-1246", action: regle.action,
      });
    }
  }

  // V05 — Caisse non négative
  const caisse = comptes.find(c => c.numero.startsWith("531"));
  if (caisse && caisse.solde < 0) {
    alertes.push({
      id: "V05", titre: "Caisse négative",
      message: `Solde caisse : ${caisse.solde.toFixed(2)} € — situation impossible`,
      gravite: "bloquant", compte: "531", source: "M9-6", action: "Vérifier les mouvements de caisse",
    });
  }

  // V06 — Dépôt Trésor non négatif
  const tresor = comptes.find(c => c.numero.startsWith("515"));
  if (tresor && tresor.solde < 0) {
    alertes.push({
      id: "V06", titre: "Découvert au Trésor",
      message: `Solde 515 : ${tresor.solde.toFixed(2)} € — découvert interdit pour les EPLE`,
      gravite: "bloquant", compte: "515", source: "M9-6", action: "Régularisation urgente avec la DDFiP",
    });
  }

  // Distinction État / Collectivité
  const c4411 = comptes.find(c => c.numero === "4411");
  const c4412 = comptes.find(c => c.numero === "4412");
  if (c4411 && c4412) {
    // Vérifier qu'ils existent bien séparément
    alertes.push({
      id: "V09-info", titre: "Distinction État / Collectivité",
      message: `4411 (État) : solde ${c4411.solde.toFixed(2)} € | 4412 (Collectivité) : solde ${c4412.solde.toFixed(2)} €`,
      gravite: "info", source: "M9-6", action: "Vérifier la bonne imputation des recettes par financeur",
    });
  }

  return alertes;
}

// ═══════════════════════════════════════════════════════════════
// HELPER : Évaluer les seuils marchés publics pour les voyages
// ═══════════════════════════════════════════════════════════════

export interface AlerteMarche {
  categorie: string;
  montantCumuleHT: number;
  seuilAtteint: string;
  procedureRequise: string;
  alerte: boolean;
}

export function evaluerSeuilsMarchesVoyages(
  voyages: { transport: number; hebergement: number; restauration: number; activites: number; assurance: number; divers: number }[]
): AlerteMarche[] {
  const cumuls: Record<string, number> = {
    Transport: 0, Hébergement: 0, Restauration: 0, Activités: 0, Assurance: 0, Divers: 0,
  };

  for (const v of voyages) {
    cumuls.Transport += v.transport;
    cumuls.Hébergement += v.hebergement;
    cumuls.Restauration += v.restauration;
    cumuls.Activités += v.activites;
    cumuls.Assurance += v.assurance;
    cumuls.Divers += v.divers;
  }

  const seuils = SEUILS_MARCHES_PUBLICS.seuils;

  return Object.entries(cumuls).map(([cat, montant]) => {
    const montantHT = montant / 1.2; // estimation HT (TVA 20%)
    let seuilAtteint = "Gré à gré";
    let procedureRequise = "Achat libre";
    let alerte = false;

    if (montantHT >= 221000) {
      seuilAtteint = "Procédure formalisée";
      procedureRequise = "Appel d'offres obligatoire (JOUE)";
      alerte = true;
    } else if (montantHT >= 90000) {
      seuilAtteint = "MAPA avec publicité";
      procedureRequise = "Publicité + dossier consultation";
      alerte = true;
    } else if (montantHT >= 40000) {
      seuilAtteint = "MAPA simplifié";
      procedureRequise = "3 devis comparatifs minimum";
      alerte = montantHT >= 35000; // alerte préventive à partir de 35k
    }

    return { categorie: cat, montantCumuleHT: Math.round(montantHT), seuilAtteint, procedureRequise, alerte };
  }).filter(a => a.montantCumuleHT > 0);
}
