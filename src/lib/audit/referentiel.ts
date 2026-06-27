// Référentiel d'audit EPLE — domaines + contrôles (fiches métier).
// Source unique : tous les écrans consomment ce référentiel (aucun doublon).
// Inspiré CIC DGFiP/DRFiP, M9-6, guides académiques. Les budgets annexes
// (GRETA/CFA) ajoutent le contrôle des salaires et des vacations.

import type { DomaineDef, ControleDef } from "./types";

export const DOMAINES: DomaineDef[] = [
  { id: "gouvernance", libelle: "Gouvernance" },
  { id: "comptabilite", libelle: "Comptabilité générale" },
  { id: "depenses", libelle: "Dépenses" },
  { id: "recettes", libelle: "Recettes" },
  { id: "tresorerie", libelle: "Trésorerie" },
  { id: "regies", libelle: "Régies" },
  { id: "fdr", libelle: "Fonds de roulement" },
  { id: "immobilisations", libelle: "Immobilisations" },
  { id: "stocks", libelle: "Stocks" },
  { id: "commande_publique", libelle: "Commande publique" },
  { id: "rh", libelle: "Ressources humaines" },
  { id: "greta", libelle: "GRETA", budgets: ["GRETA"] },
  { id: "cfa", libelle: "CFA / Apprentissage", budgets: ["CFA"] },
  { id: "compte_financier", libelle: "Compte financier" },
];

// Fabrique compacte d'une fiche de contrôle.
const c = (
  id: string, domaineId: string, sousDomaine: string, intitule: string,
  objectif: string, risque: ControleDef["risque"], fondement: string[],
  documentsAttendus: string[], methode: string,
  extra: Partial<ControleDef> = {},
): ControleDef => ({ id, domaineId, sousDomaine, intitule, objectif, risque, fondement, documentsAttendus, methode, ...extra });

export const CONTROLES: ControleDef[] = [
  // ───────── Gouvernance ─────────
  c("gouv-deleg", "gouvernance", "Délégations", "Délégations de signature à jour",
    "Vérifier l'existence et la validité des délégations (ordonnateur, agent comptable).", "important",
    ["Code éduc. R421-13", "GBCP"], ["Actes de délégation", "Publication"],
    "Contrôler la chaîne de délégations, leur publication et leur cohérence avec les habilitations Op@le."),
  c("gouv-sepa", "gouvernance", "Séparation des fonctions", "Séparation ordonnateur / comptable",
    "S'assurer de la stricte séparation des sphères ordonnateur et comptable.", "critique",
    ["GBCP art. 9", "M9-6"], ["Organigramme fonctionnel", "Habilitations Op@le"],
    "Vérifier qu'aucun agent ne cumule des fonctions incompatibles (engagement/paiement)."),
  c("gouv-cic", "gouvernance", "Contrôle interne", "Dispositif de contrôle interne comptable",
    "Vérifier l'existence d'un plan de contrôle interne et son application.", "important",
    ["M9-6 tome 4 §215", "RGP 2022-408"], ["Plan de contrôle", "PV de contrôle"],
    "Examiner la cartographie des risques et la traçabilité des contrôles réalisés."),

  // ───────── Comptabilité générale ─────────
  c("compta-attente", "comptabilite", "Comptes d'attente", "Apurement des comptes d'attente (47)",
    "Vérifier l'absence d'opérations anciennes non régularisées en comptes d'attente.", "important",
    ["M9-6", "GBCP"], ["Balance", "Grand livre comptes 47"],
    "Lister les soldes 47x anciens ; vérifier leur apurement régulier.",
    { alerteAuto: "Soldes de comptes d'attente (47) anciens non régularisés." }),
  c("compta-tiers", "comptabilite", "Comptes de tiers", "Apurement / provisionnement des comptes de tiers",
    "Détecter les comptes de tiers (41/40) anciens non apurés ou non provisionnés (491).", "important",
    ["M9-6", "GBCP"], ["Balance âgée", "Comptes 41/40/491"],
    "Analyser l'ancienneté des créances/dettes ; vérifier les dépréciations (491).",
    { alerteAuto: "Comptes de tiers anciens non apurés / non provisionnés (491)." }),
  c("compta-etat-coll", "comptabilite", "Imputation des financements", "Distinction État / Collectivité",
    "Vérifier la juste imputation des financements État (4411/7411) vs Collectivité (4412/74121).", "moyen",
    ["M9-6", "Op@le — activités 1 État / 2 Collectivité"], ["Notifications", "Balance"],
    "Rapprocher les notifications et l'imputation par activité Op@le.",
    { alerteAuto: "Confusion comptes État (4411/7411) / Collectivité (4412/74121)." }),
  c("compta-rappro", "comptabilite", "Rapprochements", "Cohérence balance / journaux / comptes",
    "Vérifier la cohérence interne des états comptables.", "moyen",
    ["M9-6"], ["Balance", "Journaux", "Compte de gestion"],
    "Rapprocher balance, grand livre et journaux ; détecter les écarts."),

  // ───────── Dépenses ─────────
  c("dep-pj", "depenses", "Pièces justificatives", "Complétude et conformité des PJ",
    "Vérifier la présence et la conformité des pièces justificatives de la dépense.", "important",
    ["GBCP art. 19/20", "Décret PJ", "CCP"], ["Demandes de paiement", "Factures", "Bons"],
    "Échantillonner des demandes de paiement ; contrôler les PJ exigibles (Op@le)."),
  c("dep-sf", "depenses", "Service fait", "Certification du service fait",
    "S'assurer de la certification du service fait avant paiement.", "critique",
    ["GBCP art. 31", "M9-6"], ["Attestation de service fait"],
    "Vérifier l'antériorité et la certification du service fait par l'ordonnateur."),
  c("dep-delai", "depenses", "Délai global de paiement", "Respect du DGP (30 jours)",
    "Mesurer le respect du délai global de paiement et les intérêts moratoires.", "moyen",
    ["Décret 2013-269", "CCP"], ["Journal des demandes de paiement"],
    "Calculer le délai réception → paiement ; détecter les dépassements.",
    { alerteAuto: "Dépassements récurrents du délai global de paiement." }),
  c("dep-chq", "depenses", "Moyens de paiement", "Paiement par virement (et non chèque)",
    "Vérifier que les fournisseurs sont payés par virement.", "moyen",
    ["M9-6", "Instruction trésorerie"], ["États de paiement"],
    "Détecter les paiements fournisseurs par chèque.",
    { alerteAuto: "Fournisseurs payés par chèque au lieu de virement." }),

  // ───────── Recettes ─────────
  c("rec-or", "recettes", "Ordres de recettes", "Émission régulière des ordres de recettes",
    "Vérifier l'émission et le suivi des ordres de recettes.", "moyen",
    ["GBCP", "M9-6"], ["Ordres de recettes", "Titres"],
    "Contrôler la chaîne constatation → liquidation → émission."),
  c("rec-rar", "recettes", "Restes à recouvrer", "Suivi des restes à recouvrer et prescription",
    "Détecter les créances proches de la prescription non poursuivies (SATD à émettre).", "critique",
    ["CGPPP", "M9-6", "Code éduc."], ["Balance âgée des créances", "Relances", "SATD"],
    "Analyser l'ancienneté des RAR ; vérifier les diligences de recouvrement.",
    { alerteAuto: "Créances proches de la prescription non poursuivies (SATD à émettre)." }),
  c("rec-anv", "recettes", "Admissions en non-valeur", "ANV et remises gracieuses régulières",
    "Vérifier la régularité des ANV et remises gracieuses (délibération CA).", "moyen",
    ["M9-6", "Code éduc. R421-20"], ["Délibérations CA", "États ANV"],
    "Contrôler la délibération préalable et la justification des ANV."),
  c("rec-bourses", "recettes", "Bourses", "Circuit comptable des bourses",
    "Vérifier le circuit 44311 → 468 → 411 des bourses nationales.", "important",
    ["M9-6", "Code éduc."], ["Notifications bourses", "Balance comptes 44311/468/411"],
    "Rapprocher notifications et écritures ; détecter les incohérences de circuit.",
    { alerteAuto: "Bourses : circuit 44311 → 468 → 411 incohérent." }),

  // ───────── Trésorerie ─────────
  c("treso-rappro", "tresorerie", "Rapprochements bancaires", "Rapprochement bancaire mensuel",
    "Vérifier la réalisation et la justification des rapprochements bancaires.", "important",
    ["M9-6", "GBCP"], ["États de rapprochement", "Relevés DFT"],
    "Contrôler la périodicité et l'apurement des suspens.",
    { alerteAuto: "Rapprochement bancaire non réalisé / suspens anciens." }),
  c("treso-quotidien", "tresorerie", "Contrôle quotidien", "Contrôle quotidien de trésorerie",
    "S'assurer du suivi quotidien des disponibilités (compte DFT).", "moyen",
    ["M9-6"], ["Journal de trésorerie"],
    "Vérifier la tenue du contrôle quotidien et la position du compte au Trésor."),

  // ───────── Régies ─────────
  c("reg-arrete", "regies", "Création / arrêtés", "Arrêtés de régie et nominations à jour",
    "Vérifier l'existence des arrêtés constitutifs et des actes de nomination.", "important",
    ["Décret 2019-798", "Décret 2020-542", "M9-6"], ["Arrêtés de régie", "Actes de nomination"],
    "Contrôler la conformité des arrêtés et leur mise à jour."),
  c("reg-caution", "regies", "Cautionnement", "Cautionnement du régisseur",
    "Vérifier la constitution du cautionnement selon le montant de l'encaisse.", "moyen",
    ["Arrêté cautionnement", "M9-6"], ["Justificatif de cautionnement"],
    "Rapprocher l'encaisse maximale autorisée et le cautionnement."),
  c("reg-verif", "regies", "Vérifications", "PV de vérification de régie + encaisse",
    "Vérifier les contrôles (dont inopinés) et le respect de l'encaisse maximale.", "critique",
    ["M9-6", "Décret 2019-798"], ["PV de vérification", "Comptes de régie"],
    "Contrôler la périodicité des vérifications et le plafond d'encaisse.",
    { alerteAuto: "Régie sans PV de vérification ou encaisse > maximum autorisé." }),

  // ───────── Fonds de roulement ─────────
  c("fdr-calcul", "fdr", "Calcul / couverture", "Niveau de fonds de roulement (jours)",
    "Apprécier le FdR en jours de fonctionnement et sa soutenabilité.", "moyen",
    ["M9-6 tome 1 §V"], ["Bilan", "Balance"],
    "Calculer FdR / charges décaissables × 365 ; comparer aux seuils prudentiels."),
  c("fdr-prelev", "fdr", "Prélèvements", "Régularité des prélèvements sur FdR",
    "Vérifier que les prélèvements sont justifiés et délibérés.", "moyen",
    ["M9-6", "Code éduc. R421-20"], ["Délibérations CA"],
    "Contrôler la délibération et l'affectation des prélèvements."),

  // ───────── Immobilisations ─────────
  c("immo-inv", "immobilisations", "Inventaire", "Concordance inventaire / comptabilité (21x/28x)",
    "Vérifier la concordance entre l'inventaire physique et les comptes.", "important",
    ["M9-6", "RGP 2022-408"], ["Inventaire", "Balance comptes 21/28"],
    "Rapprocher inventaire et soldes ; contrôler les amortissements.",
    { alerteAuto: "Écarts inventaire / comptabilité des immobilisations (21x/28x)." }),
  c("immo-sorties", "immobilisations", "Sorties", "Sorties d'inventaire / réformes justifiées",
    "Vérifier la régularité des sorties et réformes de biens.", "moyen",
    ["M9-6", "Code éduc."], ["PV de réforme", "Délibérations"],
    "Contrôler l'autorisation et la traçabilité des sorties."),

  // ───────── Stocks ─────────
  c("stock-inv", "stocks", "Inventaire / valorisation", "Inventaire physique et valorisation (CMUP/FIFO)",
    "Vérifier l'inventaire de fin d'exercice et la méthode de valorisation.", "moyen",
    ["M9-6 — comptabilité matières", "RGP 2022-408"], ["Inventaire stocks", "Comptes 31/32/37"],
    "Rapprocher inventaire et comptes ; contrôler la constance de la méthode."),

  // ───────── Commande publique ─────────
  c("cp-seuils", "commande_publique", "Seuils / procédures", "Respect des seuils et procédures",
    "Vérifier la procédure au regard des seuils (saucissonnage).", "critique",
    ["CCP", "Code de la commande publique"], ["Marchés", "Devis", "Publicité"],
    "Analyser les achats par fournisseur/objet ; détecter le fractionnement.",
    { alerteAuto: "Dépassement de seuil CCP sans procédure (saucissonnage)." }),
  c("cp-publicite", "commande_publique", "Publicité / concurrence", "Publicité et mise en concurrence",
    "Vérifier la publicité et la mise en concurrence effectives.", "important",
    ["CCP"], ["Avis de publicité", "Offres", "Rapport de présentation"],
    "Contrôler la traçabilité de la mise en concurrence."),

  // ───────── Ressources humaines (dont salaires/vacations) ─────────
  c("rh-contrats", "rh", "Contrats", "Régularité des contrats et actes RH",
    "Vérifier l'existence et la régularité des contrats des agents.", "moyen",
    ["Décret 86-83", "Code éduc."], ["Contrats", "Arrêtés"],
    "Contrôler la base juridique, la quotité et l'indice."),
  c("rh-salaires", "rh", "Rémunérations / salaires", "Concordance paie / contrats / indices",
    "Contrôler les rémunérations payées au regard des contrats, indices et quotités.", "important",
    ["M9-6", "Décret 86-83", "Op@le paie"], ["Bulletins de paie", "Export OPER@", "Contrats"],
    "Rapprocher les éléments de paie (brut, indice, charges) avec les actes ; détecter les anomalies de taux/net.",
    { alerteAuto: "Rémunération payée incohérente avec le contrat / l'indice." }),
  c("rh-vacations", "rh", "Vacations", "Contrôle des vacations (heures, taux, service fait)",
    "Vérifier les vacations : heures effectuées, taux appliqué, service fait, plafonds.", "important",
    ["M9-6", "Décret 86-83", "Barèmes vacations"], ["États de vacations", "Ordres de mission", "Service fait"],
    "Rapprocher heures déclarées et service fait ; contrôler le taux horaire et les plafonds.",
    { alerteAuto: "Vacations payées sans service fait justifié ou taux non conforme." }),
  c("rh-iffca", "rh", "IFFCA / indemnités", "Régularité des IFFCA et indemnités",
    "Vérifier la base et le calcul des IFFCA / indemnités.", "moyen",
    ["Textes indemnitaires", "M9-6"], ["Décisions", "États de versement"],
    "Contrôler l'enveloppe, les bénéficiaires et le calcul."),

  // ───────── GRETA (budget annexe) ─────────
  c("greta-salaires", "greta", "Salaires / vacations formateurs", "Salaires et vacations des formateurs GRETA",
    "Contrôler les rémunérations et vacations des formateurs (heures, taux, service fait).", "important",
    ["M9-6 budgets annexes", "Décret 86-83", "Convention GRETA"], ["États de paie", "États de vacations", "Service fait"],
    "Rapprocher heures vendues/réalisées et heures payées ; contrôler taux et service fait.",
    { budgets: ["GRETA"], alerteAuto: "Vacations formateurs GRETA sans service fait ou hors barème." }),
  c("greta-conv", "greta", "Conventions", "Conventions de formation et financements",
    "Vérifier les conventions, leur exécution et leur comptabilisation.", "moyen",
    ["M9-6", "Code éduc."], ["Conventions", "Factures", "Bilans pédagogiques"],
    "Rapprocher conventions, produits et charges.", { budgets: ["GRETA"] }),
  c("greta-equilibre", "greta", "Équilibre financier", "Équilibre du budget annexe GRETA",
    "Apprécier l'équilibre charges/produits et le résultat du GRETA.", "important",
    ["M9-6 budgets annexes"], ["Compte de résultat GRETA", "Balance"],
    "Analyser résultat, CAF et couverture des charges.", { budgets: ["GRETA"] }),

  // ───────── CFA (budget annexe) ─────────
  c("cfa-salaires", "cfa", "Salaires / vacations", "Salaires et vacations apprentissage (CFA)",
    "Contrôler les rémunérations et vacations des intervenants du CFA.", "important",
    ["M9-6 budgets annexes", "Décret 86-83"], ["États de paie", "États de vacations", "Service fait"],
    "Rapprocher heures et service fait ; contrôler taux et imputation sur le budget CFA.",
    { budgets: ["CFA"], alerteAuto: "Vacations CFA sans service fait ou taux non conforme." }),
  c("cfa-opco", "cfa", "OPCO / NPEC", "Financement OPCO et niveaux de prise en charge",
    "Vérifier les ressources OPCO et la cohérence des NPEC.", "important",
    ["Code du travail", "Réglementation apprentissage"], ["Conventions OPCO", "NPEC", "Factures"],
    "Rapprocher effectifs apprentis, NPEC et facturation OPCO.", { budgets: ["CFA"] }),
  c("cfa-equilibre", "cfa", "Équilibre budgétaire", "Équilibre du budget annexe CFA",
    "Apprécier l'équilibre du CFA (charges, produits, taxe d'apprentissage C/7568x).", "important",
    ["M9-6 budgets annexes"], ["Compte de résultat CFA", "Balance"],
    "Analyser résultat, ressources OPCO et taxe d'apprentissage.", { budgets: ["CFA"] }),

  // ───────── Compte financier ─────────
  c("cf-annexes", "compte_financier", "Annexes", "Complétude des annexes du compte financier",
    "Vérifier la présence et la cohérence des annexes (P1→P16+, plan CIF).", "important",
    ["M9-6 tome 3", "GBCP"], ["Compte financier", "Annexes"],
    "Contrôler la complétude des pièces et la cohérence des ratios.",
    { alerteAuto: "Annexes du compte financier incomplètes." }),
  c("cf-coherence", "compte_financier", "Cohérence", "Cohérence des données du compte financier",
    "Vérifier la cohérence entre balance, résultat et bilan.", "moyen",
    ["M9-6"], ["Compte financier", "Balance"],
    "Rapprocher les agrégats ; détecter les incohérences."),
];

/** Contrôles applicables à un type de budget (filtre domaines + contrôles). */
export function controlesPourBudget(budget: "EPLE" | "GRETA" | "CFA"): ControleDef[] {
  return CONTROLES.filter((ct) => {
    const dom = DOMAINES.find((d) => d.id === ct.domaineId);
    if (dom?.budgets && !dom.budgets.includes(budget)) return false;
    if (ct.budgets && !ct.budgets.includes(budget)) return false;
    return true;
  });
}

export const domaineLabel = (id: string) => DOMAINES.find((d) => d.id === id)?.libelle ?? id;
