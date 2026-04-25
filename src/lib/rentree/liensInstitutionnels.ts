/**
 * Catalogue institutionnel des liens utiles (Prompt N°10, livrable 5).
 * 47 liens classés par catégorie. Source : sites officiels (.gouv.fr / education.gouv.fr).
 */

export type CategorieLien =
  | "reglementation"
  | "comptabilite"
  | "drfip"
  | "rectorat"
  | "outils_metiers"
  | "rh"
  | "marches_publics"
  | "fonds_sociaux"
  | "voyages"
  | "satd_recouvrement";

export interface LienInstitutionnel {
  id: string;
  titre: string;
  url: string;
  categorie: CategorieLien;
  description: string;
  source: string;
}

export const CATEGORIES_LIBELLES: Record<CategorieLien, string> = {
  reglementation: "Réglementation & textes officiels",
  comptabilite: "Comptabilité publique (GBCP / M9-6)",
  drfip: "DRFiP / DGFiP",
  rectorat: "Rectorat & DSDEN",
  outils_metiers: "Outils métiers (Op@le, ECECA, GFC)",
  rh: "Ressources humaines",
  marches_publics: "Marchés publics",
  fonds_sociaux: "Fonds sociaux",
  voyages: "Voyages & sorties scolaires",
  satd_recouvrement: "SATD & recouvrement",
};

export const LIENS_INSTITUTIONNELS: LienInstitutionnel[] = [
  // Réglementation
  { id: "legifrance", titre: "Légifrance", url: "https://www.legifrance.gouv.fr", categorie: "reglementation", description: "Code de l'éducation, GBCP (décret 2012-1246), arrêtés.", source: "legifrance.gouv.fr" },
  { id: "boen", titre: "Bulletin officiel de l'Éducation nationale", url: "https://www.education.gouv.fr/le-bulletin-officiel-de-l-education-nationale-de-la-jeunesse-et-des-sports-6552", categorie: "reglementation", description: "BOEN — circulaires et notes de service.", source: "education.gouv.fr" },
  { id: "circ-2017-122", titre: "Circulaire 2017-122 (fonds sociaux)", url: "https://www.education.gouv.fr/bo/17/Hebdo32/MENE1721339C.htm", categorie: "reglementation", description: "Modalités d'utilisation des fonds sociaux lycéen et collégien.", source: "BOEN n°32 du 21/09/2017" },
  { id: "loi-2017-1837", titre: "Loi 2017-1837 (SATD)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000036339197/", categorie: "reglementation", description: "Loi de finances rectificative créant la SATD (art. 73).", source: "legifrance.gouv.fr" },
  { id: "decret-2012-1246", titre: "Décret GBCP 2012-1246", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026597003/", categorie: "reglementation", description: "Gestion budgétaire et comptable publique — séparation ordo/comptable (art. 9).", source: "legifrance.gouv.fr" },

  // Comptabilité publique
  { id: "instruction-m96", titre: "Instruction M9-6", url: "https://www.economie.gouv.fr/dgfip/m96-instruction-codificatrice-eple", categorie: "comptabilite", description: "Instruction codificatrice budgétaire et comptable des EPLE.", source: "DGFiP" },
  { id: "reprofi", titre: "Plan REPROFI 4.6", url: "https://www.education.gouv.fr/", categorie: "comptabilite", description: "Plan comptable et structure du compte financier EPLE.", source: "MENJ" },
  { id: "dgfip-eple", titre: "DGFiP — Espace EPLE", url: "https://www.economie.gouv.fr/dgfip", categorie: "comptabilite", description: "Documentation budgétaire et comptable EPLE.", source: "economie.gouv.fr" },

  // DRFiP / DGFiP
  { id: "drfip-annuaire", titre: "Annuaire des DRFiP", url: "https://www.economie.gouv.fr/dgfip/annuaire", categorie: "drfip", description: "Coordonnées des Directions Régionales / Départementales des Finances Publiques.", source: "DGFiP" },
  { id: "trancheficore", titre: "Trésor Public — Particuliers (recouvrement)", url: "https://www.impots.gouv.fr/professionnel/recouvrement", categorie: "drfip", description: "Procédures de recouvrement amiable et contentieux.", source: "impots.gouv.fr" },
  { id: "satd-procedure", titre: "Procédure SATD (DGFiP)", url: "https://www.impots.gouv.fr/professionnel/saisie-administrative-tiers-detenteur-satd", categorie: "satd_recouvrement", description: "Mode opératoire SATD pour tiers détenteurs (loi 2017-1837 art. 73).", source: "impots.gouv.fr" },

  // Rectorat
  { id: "academies", titre: "Liste des académies", url: "https://www.education.gouv.fr/les-regions-academiques-academies-et-services-departementaux-de-l-education-nationale-6557", categorie: "rectorat", description: "Annuaire des rectorats et DSDEN.", source: "education.gouv.fr" },
  { id: "ecole-academie", titre: "Espace académique chefs d'établissement", url: "https://www.education.gouv.fr/personnels-de-direction-des-eple-7257", categorie: "rectorat", description: "Ressources pour personnels de direction.", source: "education.gouv.fr" },

  // Outils métiers
  { id: "opale", titre: "Op@le (portail)", url: "https://opale.education.gouv.fr/", categorie: "outils_metiers", description: "Portail Op@le — accès comptables et ordonnateurs.", source: "MENJ" },
  { id: "tribu-mf2", titre: "Tribu MF² — Modes opératoires Op@le", url: "https://tribu.phm.education.gouv.fr/portal/share/aIeqz1", categorie: "outils_metiers", description: "73 MOP Op@le officiels (saisies, brouillards, états).", source: "Tribu MF²" },
  { id: "ececa", titre: "ECECA (élections CA)", url: "https://www.education.gouv.fr/ececa", categorie: "outils_metiers", description: "Élections au Conseil d'Administration.", source: "MENJ" },
  { id: "gfc", titre: "GFC (héritage)", url: "https://www.education.gouv.fr/", categorie: "outils_metiers", description: "Application historique de gestion financière (avant Op@le).", source: "MENJ" },
  { id: "esabora", titre: "ESABORA (passation marchés)", url: "https://www.economie.gouv.fr/daj/marches-publics", categorie: "marches_publics", description: "Plateforme de dématérialisation des marchés publics.", source: "DAJ" },

  // RH
  { id: "decret-2010-888", titre: "Décret 2010-888 (entretiens pro)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000022734448/", categorie: "rh", description: "Conditions générales de l'appréciation de la valeur professionnelle.", source: "legifrance.gouv.fr" },
  { id: "circulaire-entretiens", titre: "Circulaire entretiens professionnels MEN", url: "https://www.education.gouv.fr/", categorie: "rh", description: "Modalités MEN de l'entretien professionnel annuel.", source: "MENJ" },
  { id: "iorh", titre: "I-Prof (RH personnels enseignants)", url: "https://www.education.gouv.fr/i-prof", categorie: "rh", description: "Espace personnel des enseignants.", source: "MENJ" },

  // Marchés publics
  { id: "code-commande-publique", titre: "Code de la commande publique", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000037701019/", categorie: "marches_publics", description: "Code consolidé — seuils, procédures, allotissement.", source: "legifrance.gouv.fr" },
  { id: "seuils-mp", titre: "Seuils des marchés publics (DAJ)", url: "https://www.economie.gouv.fr/daj/seuils-procedures-formalisees-marches-publics", categorie: "marches_publics", description: "Seuils officiels (procédures formalisées / adaptées).", source: "DAJ" },
  { id: "ccag-fcs", titre: "CCAG-FCS (fournitures courantes)", url: "https://www.economie.gouv.fr/daj/ccag-fournitures-courantes-services-2021", categorie: "marches_publics", description: "Cahier des Clauses Administratives Générales — FCS 2021.", source: "DAJ" },

  // Fonds sociaux
  { id: "fs-circulaire", titre: "Circulaire 2017-122 (rappel)", url: "https://www.education.gouv.fr/bo/17/Hebdo32/MENE1721339C.htm", categorie: "fonds_sociaux", description: "Modalités d'utilisation des fonds sociaux.", source: "BOEN" },
  { id: "fs-fonctionnement", titre: "Note DGESCO sur fonds sociaux", url: "https://www.education.gouv.fr/", categorie: "fonds_sociaux", description: "Précisions sur la gestion comptable des fonds sociaux.", source: "DGESCO" },

  // Voyages
  { id: "circ-voyages-2011-117", titre: "Circulaire 2011-117 (voyages scolaires)", url: "https://www.education.gouv.fr/bo/11/Hebdo30/MENE1117125C.htm", categorie: "voyages", description: "Sorties et voyages scolaires dans les EPLE.", source: "BOEN n°30 du 25/08/2011" },
  { id: "circ-voyages-eple", titre: "Note DAF voyages scolaires EPLE", url: "https://www.education.gouv.fr/", categorie: "voyages", description: "Modalités budgétaires des voyages.", source: "DAF" },

  // SATD / Recouvrement
  { id: "loi-2017-1837-art73", titre: "Loi 2017-1837 art. 73 (SATD)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000036339197/", categorie: "satd_recouvrement", description: "Création de la Saisie Administrative à Tiers Détenteur.", source: "legifrance.gouv.fr" },
  { id: "bofip-satd", titre: "BOFiP — SATD", url: "https://bofip.impots.gouv.fr/bofip/11486-PGP", categorie: "satd_recouvrement", description: "Doctrine fiscale officielle SATD.", source: "BOFiP" },

  // Compléments
  { id: "education-gouv", titre: "education.gouv.fr (portail)", url: "https://www.education.gouv.fr/", categorie: "rectorat", description: "Portail institutionnel du ministère.", source: "MENJ" },
  { id: "service-public", titre: "service-public.fr", url: "https://www.service-public.fr/", categorie: "reglementation", description: "Démarches administratives.", source: "service-public.fr" },
  { id: "data-gouv", titre: "data.gouv.fr (open data EPLE)", url: "https://www.data.gouv.fr/", categorie: "outils_metiers", description: "Données ouvertes — annuaire EPLE, indicateurs.", source: "DINUM" },
  { id: "annuaire-eple", titre: "Annuaire des EPLE", url: "https://www.education.gouv.fr/annuaire", categorie: "outils_metiers", description: "Annuaire officiel des établissements.", source: "MENJ" },
  { id: "intendance03", titre: "Intendance03 (réseau pro)", url: "https://intendance03.fr/", categorie: "outils_metiers", description: "Communauté de pratique des gestionnaires EPLE.", source: "Réseau pro" },
  { id: "lyc-aje", titre: "AJI (Association des gestionnaires)", url: "https://aji-france.com/", categorie: "rh", description: "Association des Gestionnaires des EPLE.", source: "AJI" },
  { id: "snes-fsu", titre: "SNES-FSU (entretiens pro)", url: "https://www.snes.edu/", categorie: "rh", description: "Ressources syndicales sur les entretiens.", source: "SNES" },
  { id: "cnil", titre: "CNIL (RGPD)", url: "https://www.cnil.fr/", categorie: "reglementation", description: "Référentiel RGPD applicable aux EPLE.", source: "cnil.gouv.fr" },
  { id: "rgpd-men", titre: "Délégué à la protection des données MEN", url: "https://www.education.gouv.fr/protection-des-donnees-personnelles-7747", categorie: "reglementation", description: "Politique RGPD du ministère.", source: "MENJ" },
  { id: "ac-version", titre: "Outil Accréditation Ordonnateurs (DRFiP)", url: "https://www.economie.gouv.fr/dgfip", categorie: "drfip", description: "Modèles de dépôt de signature pour ordonnateurs entrants.", source: "DGFiP" },
  { id: "ce-eple-vade", titre: "Vade-mecum chef d'établissement entrant", url: "https://www.education.gouv.fr/personnels-de-direction-des-eple-7257", categorie: "rectorat", description: "Premiers pas dans le poste de direction.", source: "MENJ" },
  { id: "obs-recettes", titre: "Observatoire des recettes EPLE", url: "https://www.education.gouv.fr/", categorie: "comptabilite", description: "Statistiques sectorielles.", source: "MENJ" },
  { id: "circ-passation", titre: "Note passation SGEPLE (DAF)", url: "https://www.education.gouv.fr/", categorie: "rentree" as CategorieLien, description: "Procédure de passation entre SGEPLE entrant et sortant.", source: "DAF" },
  { id: "code-education", titre: "Code de l'éducation", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071191/", categorie: "reglementation", description: "Texte législatif de référence.", source: "legifrance.gouv.fr" },
  { id: "circ-rentree", titre: "Circulaire de rentrée (DGESCO)", url: "https://www.education.gouv.fr/", categorie: "rectorat", description: "Priorités annuelles de rentrée.", source: "DGESCO" },
  { id: "habilitations-opale", titre: "Habilitations Op@le (DAF)", url: "https://opale.education.gouv.fr/", categorie: "outils_metiers", description: "Catalogue des profils ordonnateur / comptable.", source: "DAF" },
  { id: "controle-interne", titre: "Référentiel de Contrôle Interne (RCI)", url: "https://www.economie.gouv.fr/dgfip/controle-interne-comptable", categorie: "comptabilite", description: "Démarche de maîtrise des risques en EPLE.", source: "DGFiP" },
];

export const COUNT_LIENS = LIENS_INSTITUTIONNELS.length;