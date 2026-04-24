// ════════════════════════════════════════════════════════════════
// Catalogue officiel des 32 documents — Voyages scolaires v2
// Réf : Circulaire MENE2407159C, M9-6, GBCP, CCP 2026, RGP 2022-408
// ════════════════════════════════════════════════════════════════

export type DocCategorie =
  | "amont"          // 7 docs
  | "familles"       // 9 docs
  | "concurrence"    // 4 docs
  | "budgetaire"     // 6 docs
  | "apres"          // 6 docs
  ;

export interface DocumentModele {
  id: string;             // identifiant stable (kebab)
  numero: number;         // 1..32
  categorie: DocCategorie;
  titre: string;
  description: string;
  obligatoire: boolean;
  reference_legale?: string;
  filename: string;       // nom de fichier dans le ZIP
}

export const CATEGORIE_LABEL: Record<DocCategorie, string> = {
  amont: "1 — Amont (autorisations & cadre)",
  familles: "2 — Familles & élèves",
  concurrence: "3 — Mise en concurrence",
  budgetaire: "4 — Budgétaires & comptables",
  apres: "5 — Après le voyage",
};

export const CATALOGUE_32: DocumentModele[] = [
  // ── AMONT (7) ───────────────────────────────────────────────
  { numero: 1, id: "fiche-projet", categorie: "amont", titre: "Fiche projet pédagogique",
    description: "Présentation du projet, objectifs, lien projet d'établissement.",
    obligatoire: true, reference_legale: "Circ. MENE2407159C",
    filename: "01_fiche_projet_pedagogique.docx" },
  { numero: 2, id: "rapport-chef-etab", categorie: "amont", titre: "Rapport du chef d'établissement",
    description: "Rapport présenté au CA en appui de la délibération.",
    obligatoire: true, reference_legale: "Code éducation R.421-20",
    filename: "02_rapport_chef_etablissement.docx" },
  { numero: 3, id: "acte-ca-autorisation", categorie: "amont", titre: "Acte du CA — Autorisation du voyage",
    description: "Délibération du CA autorisant le voyage et son budget.",
    obligatoire: true, reference_legale: "Code éducation L.421-14 & R.421-20",
    filename: "03_acte_CA_autorisation.docx" },
  { numero: 4, id: "charte-voyage", categorie: "amont", titre: "Charte du voyage scolaire",
    description: "Règles de vie, comportement, sanctions.",
    obligatoire: true, filename: "04_charte_voyage.docx" },
  { numero: 5, id: "convention-prestataire", categorie: "amont", titre: "Convention avec le prestataire",
    description: "Contrat agence / prestataires séparés.",
    obligatoire: true, reference_legale: "Code du tourisme L.211-1",
    filename: "05_convention_prestataire.docx" },
  { numero: 6, id: "acte-regie", categorie: "amont", titre: "Acte constitutif de régie",
    description: "Régie d'avances / recettes / mixte (post-RGP).",
    obligatoire: false, reference_legale: "Ord. RGP 2022-408 / Décret 2012-1246",
    filename: "06_acte_constitutif_regie.docx" },
  { numero: 7, id: "arrete-regisseur", categorie: "amont", titre: "Arrêté de nomination du régisseur",
    description: "Désignation du régisseur et du suppléant + indemnité de maniement de fonds.",
    obligatoire: false, reference_legale: "Ord. RGP 2022-408",
    filename: "07_arrete_nomination_regisseur.docx" },

  // ── FAMILLES (9) ─────────────────────────────────────────────
  { numero: 8, id: "info-familles", categorie: "familles", titre: "Information générale aux familles",
    description: "Lettre d'information : programme, prix, échéancier.",
    obligatoire: true, filename: "08_info_generale_familles.docx" },
  { numero: 9, id: "engagement-famille", categorie: "familles", titre: "Formulaire d'engagement de la famille",
    description: "Engagement à payer la participation et acceptation du règlement.",
    obligatoire: true, filename: "09_formulaire_engagement_famille.docx" },
  { numero: 10, id: "cerfa-ast", categorie: "familles", titre: "Autorisation de sortie du territoire (Cerfa AST)",
    description: "Modèle Cerfa n°15646*01 — voyage hors territoire national.",
    obligatoire: false, reference_legale: "Cerfa 15646*01",
    filename: "10_AST_cerfa_15646.docx" },
  { numero: 11, id: "fiche-sanitaire", categorie: "familles", titre: "Fiche sanitaire de liaison",
    description: "État de santé, allergies, traitements, contacts urgence.",
    obligatoire: true, filename: "11_fiche_sanitaire.docx" },
  { numero: 12, id: "autorisation-parentale", categorie: "familles", titre: "Autorisation parentale",
    description: "Autorisation de participer + droit à l'image + soins.",
    obligatoire: true, filename: "12_autorisation_parentale.docx" },
  { numero: 13, id: "echeancier", categorie: "familles", titre: "Échéancier de paiement",
    description: "Calendrier des règlements (acompte, soldes).",
    obligatoire: true, filename: "13_echeancier_paiement.docx" },
  { numero: 14, id: "quittance", categorie: "familles", titre: "Quittance de paiement",
    description: "Reçu de paiement (gabarit unitaire).",
    obligatoire: true, filename: "14_quittance_paiement.docx" },
  { numero: 15, id: "attestation-paiement", categorie: "familles", titre: "Attestation globale de paiement",
    description: "Attestation récapitulative pour la famille.",
    obligatoire: false, filename: "15_attestation_paiement.docx" },
  { numero: 16, id: "courrier-remboursement", categorie: "familles", titre: "Courrier de remboursement individualisé",
    description: "Lettre de remboursement (avec règle 8 € — LF 66-948 art. 21).",
    obligatoire: true, reference_legale: "LF 66-948 art. 21",
    filename: "16_courrier_remboursement.docx" },

  // ── CONCURRENCE (4) ──────────────────────────────────────────
  { numero: 17, id: "cahier-charges", categorie: "concurrence", titre: "Cahier des charges",
    description: "CCTP simplifié pour consultation des prestataires.",
    obligatoire: true, reference_legale: "CCP 2026",
    filename: "17_cahier_des_charges.docx" },
  { numero: 18, id: "lettre-consultation", categorie: "concurrence", titre: "Lettre de consultation",
    description: "Lettre d'invitation à remettre une offre.",
    obligatoire: true, filename: "18_lettre_consultation.docx" },
  { numero: 19, id: "grille-analyse", categorie: "concurrence", titre: "Grille d'analyse des offres",
    description: "Tableau comparatif pondéré des offres reçues.",
    obligatoire: true, filename: "19_grille_analyse_offres.docx" },
  { numero: 20, id: "decision-attribution", categorie: "concurrence", titre: "Décision d'attribution",
    description: "Notification du candidat retenu et lettre aux non-retenus.",
    obligatoire: true, filename: "20_decision_attribution.docx" },

  // ── BUDGÉTAIRES (6) ──────────────────────────────────────────
  { numero: 21, id: "budget-previsionnel", categorie: "budgetaire", titre: "Budget prévisionnel pour le CA",
    description: "Tableau Recettes / Dépenses détaillé avec imputations M9-6.",
    obligatoire: true, reference_legale: "Instruction M9-6",
    filename: "21_budget_previsionnel_CA.docx" },
  { numero: 22, id: "titres-recettes", categorie: "budgetaire", titre: "État des titres de recettes",
    description: "Liste des titres (familles, subventions) à émettre.",
    obligatoire: true, filename: "22_etat_titres_recettes.docx" },
  { numero: 23, id: "bons-commande", categorie: "budgetaire", titre: "Bons de commande",
    description: "Modèles BC pour transport, hébergement, activités.",
    obligatoire: true, filename: "23_bons_de_commande.docx" },
  { numero: 24, id: "etat-liquidation", categorie: "budgetaire", titre: "État de liquidation",
    description: "Service fait + liquidation des dépenses.",
    obligatoire: true, reference_legale: "GBCP 2012-1246",
    filename: "24_etat_liquidation.docx" },
  { numero: 25, id: "tableau-bourses", categorie: "budgetaire", titre: "Tableau de mobilisation des bourses",
    description: "Bourses 2nd degré déduites — Circ. MENE1704160C.",
    obligatoire: false, reference_legale: "Circ. MENE1704160C",
    filename: "25_tableau_bourses.docx" },
  { numero: 26, id: "tableau-fonds-sociaux", categorie: "budgetaire", titre: "Tableau d'affectation des fonds sociaux",
    description: "Aide aux familles via fonds sociaux collège/lycée.",
    obligatoire: false, filename: "26_tableau_fonds_sociaux.docx" },

  // ── APRÈS LE VOYAGE (6) ──────────────────────────────────────
  { numero: 27, id: "pv-reception", categorie: "apres", titre: "PV de réception des prestations",
    description: "Constat de service fait par le chef d'établissement.",
    obligatoire: true, filename: "27_pv_reception.docx" },
  { numero: 28, id: "bilan-financier-creteil", categorie: "apres", titre: "Bilan financier (modèle Créteil)",
    description: "Bilan détaillé recettes/dépenses réelles vs prévisionnel + reliquat.",
    obligatoire: true, reference_legale: "Vademecum Créteil + LF 66-948",
    filename: "28_bilan_financier_creteil.docx" },
  { numero: 29, id: "acte-ca-bilan", categorie: "apres", titre: "Acte du CA — Vote du bilan",
    description: "Délibération CA approuvant le bilan financier.",
    obligatoire: true, filename: "29_acte_CA_bilan.docx" },
  { numero: 30, id: "etat-remboursements", categorie: "apres", titre: "État des remboursements aux familles",
    description: "Tableau individualisé + application règle 8 € (don tacite).",
    obligatoire: true, reference_legale: "LF 66-948 art. 21",
    filename: "30_etat_remboursements.docx" },
  { numero: 31, id: "rapport-pedago-bilan", categorie: "apres", titre: "Rapport pédagogique de bilan",
    description: "Bilan qualitatif rédigé par le responsable du voyage.",
    obligatoire: false, filename: "31_rapport_pedagogique.docx" },
  { numero: 32, id: "fiche-cloture", categorie: "apres", titre: "Fiche de clôture comptable",
    description: "Récapitulatif clôture (titres, mandats, écritures M9-6).",
    obligatoire: true, reference_legale: "Instruction M9-6 tome 3",
    filename: "32_fiche_cloture_comptable.docx" },
];

export const TOTAL_DOCS = CATALOGUE_32.length;

export function docsParCategorie(): Record<DocCategorie, DocumentModele[]> {
  return CATALOGUE_32.reduce((acc, d) => {
    (acc[d.categorie] ||= []).push(d);
    return acc;
  }, {} as Record<DocCategorie, DocumentModele[]>);
}