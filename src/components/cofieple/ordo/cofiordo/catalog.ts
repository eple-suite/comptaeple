// ═══════════════════════════════════════════════════════════════════
// Catalogue REPROFI — Rapport Ordonnateur (M9-6 2026)
// 4 sections (A,B,C,D) → 34 fiches.
// ⚠️ Strict M9-6 : aucun indicateur bilanciel (FDR/BFR/TN/ratios solv.)
//    → ces indicateurs relèvent EXCLUSIVEMENT de l'Agent Comptable.
// ═══════════════════════════════════════════════════════════════════

export type OrdoSectionKey = 'A' | 'B' | 'C' | 'D';

export interface OrdoFicheDef {
  id: string;            // ex: 'ordo_a1'
  numero: string;        // ex: 'A.1'
  section: OrdoSectionKey;
  title: string;         // titre court (menu)
  fullTitle: string;     // titre éditorial
  definition: string;    // définition courte (M9-6)
  meta: string;          // ref M9-6
  service?: string;      // AP / VE / ALO / SRH / OPC (pour section C)
  flux?: 'charges' | 'produits';
  hasChart?: boolean;
  chartHint?: 'bars' | 'lines' | 'donut' | 'stacked';
  hasN1N2?: boolean;     // N-2 / N-1 / N
}

export const ORDO_SECTIONS_REPROFI: { key: OrdoSectionKey; label: string; subtitle: string }[] = [
  { key: 'A', label: 'A. Indicateurs structurels', subtitle: 'Périmètre, services, population, dotation' },
  { key: 'B', label: 'B. Bilan budgétaire', subtitle: 'Pilotage, masses, taux, codes activité, commande publique' },
  { key: 'C', label: 'C. Exécution budgétaire', subtitle: 'Charges & produits par service général (AP, VE, ALO, SRH, OPC)' },
  { key: 'D', label: 'D. Analyse de gestion', subtitle: 'Focus thématiques (financements, dépenses pédago, voyages…)' },
];

export const ORDO_FICHES_REPROFI: OrdoFicheDef[] = [
  // ─── A. INDICATEURS STRUCTURELS ──────────────────────────────────
  { id: 'ordo_a1', numero: 'A.1', section: 'A', title: 'Présentation de la structure',
    fullTitle: "Présentation de la structure de l'établissement",
    definition: "Identité, type d'EPLE, périmètre comptable, autorités de tutelle et caractéristiques générales de l'exercice.",
    meta: 'M9-6 §1.1', hasN1N2: false },
  { id: 'ordo_a2', numero: 'A.2', section: 'A', title: 'Organisation des services',
    fullTitle: "Organisation des services généraux et spéciaux",
    definition: "Liste des services généraux (AP, VE, ALO) et spéciaux (SRH, SBN, OPC) ouverts au budget de l'exercice.",
    meta: 'M9-6 §1.2', hasN1N2: false },
  { id: 'ordo_a3', numero: 'A.3', section: 'A', title: 'Population scolaire',
    fullTitle: "Population scolaire et structure des effectifs",
    definition: "Effectifs élèves (externes, demi-pensionnaires, internes), évolution sur trois exercices.",
    meta: 'M9-6 §1.3', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_a4', numero: 'A.4', section: 'A', title: 'Élèves boursiers',
    fullTitle: "Élèves boursiers et taux de boursiers",
    definition: "Nombre d'élèves boursiers, taux par rapport aux effectifs et évolution pluriannuelle.",
    meta: 'M9-6 §1.4', hasChart: true, chartHint: 'lines', hasN1N2: true },
  { id: 'ordo_a5', numero: 'A.5', section: 'A', title: 'Dotation de fonctionnement',
    fullTitle: "Dotation globale de fonctionnement (DGF) reçue de la collectivité",
    definition: "Montant de la dotation de la collectivité de rattachement et évolution pluriannuelle.",
    meta: 'M9-6 §1.5', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_a6', numero: 'A.6', section: 'A', title: 'Dotation par élève',
    fullTitle: "Dotation de fonctionnement rapportée à l'élève",
    definition: "Ratio DGF / effectifs, à comparer aux moyennes académiques pour apprécier l'effort de la collectivité.",
    meta: 'M9-6 §1.6', hasChart: true, chartHint: 'lines', hasN1N2: true },

  // ─── B. BILAN BUDGÉTAIRE ────────────────────────────────────────
  { id: 'ordo_b1', numero: 'B.1', section: 'B', title: 'Pilotage du budget',
    fullTitle: "Pilotage du budget : DBM, virements et autorisations",
    definition: "Suivi des décisions budgétaires modificatives (DBM), virements de crédits et écarts au budget initial.",
    meta: 'M9-6 §2.1', hasChart: true, chartHint: 'bars', hasN1N2: false },
  { id: 'ordo_b2', numero: 'B.2', section: 'B', title: 'Masses budgétaires',
    fullTitle: "Répartition des masses budgétaires par service",
    definition: "Ventilation prévisionnelle et exécutée des charges et produits par service général et spécial.",
    meta: 'M9-6 §2.2', hasChart: true, chartHint: 'stacked', hasN1N2: true },
  { id: 'ordo_b3', numero: 'B.3', section: 'B', title: 'Taux de réalisation',
    fullTitle: "Taux de réalisation du budget (charges & produits)",
    definition: "Taux d'exécution global et par service, comparé aux exercices antérieurs.",
    meta: 'M9-6 §2.3', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_b4', numero: 'B.4', section: 'B', title: "Codes d'activité 1",
    fullTitle: "Emploi des codes d'activité — partie 1",
    definition: "Analyse des dépenses par codes d'activité paramétrés par l'établissement (1ère partie).",
    meta: 'M9-6 §2.4', hasChart: true, chartHint: 'donut', hasN1N2: false },
  { id: 'ordo_b5', numero: 'B.5', section: 'B', title: "Codes d'activité 2",
    fullTitle: "Emploi des codes d'activité — partie 2",
    definition: "Analyse des dépenses par codes d'activité paramétrés par l'établissement (2ème partie).",
    meta: 'M9-6 §2.4', hasChart: true, chartHint: 'donut', hasN1N2: false },
  { id: 'ordo_b6', numero: 'B.6', section: 'B', title: 'Commande publique',
    fullTitle: "Bilan de la commande publique",
    definition: "Marchés passés, procédures employées, respect des seuils et nomenclature des achats.",
    meta: 'M9-6 §2.5', hasN1N2: false },
  { id: 'ordo_b7', numero: 'B.7', section: 'B', title: 'Objectifs assignés',
    fullTitle: "Réalisation des objectifs assignés à l'ordonnateur",
    definition: "Atteinte des objectifs définis dans la lettre de mission et le contrat d'objectifs académique.",
    meta: 'M9-6 §2.6', hasN1N2: false },

  // ─── C. EXÉCUTION BUDGÉTAIRE (10 fiches : 5 services × charges/produits) ─
  { id: 'ordo_c1', numero: 'C.1', section: 'C', title: 'Charges AP',
    fullTitle: "Charges du service général AP — Activités pédagogiques",
    definition: "Exécution des charges du service AP : enseignement, fournitures pédagogiques, sorties éducatives.",
    meta: 'M9-6 §3.1', service: 'AP', flux: 'charges', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_c2', numero: 'C.2', section: 'C', title: 'Produits AP',
    fullTitle: "Produits du service général AP — Activités pédagogiques",
    definition: "Recettes adossées au service AP : subventions ciblées, contributions des familles.",
    meta: 'M9-6 §3.1', service: 'AP', flux: 'produits', hasChart: true, chartHint: 'donut', hasN1N2: true },
  { id: 'ordo_c3', numero: 'C.3', section: 'C', title: 'Charges VE',
    fullTitle: "Charges du service général VE — Vie de l'élève",
    definition: "Exécution des charges du service VE : fonds sociaux, vie scolaire, santé.",
    meta: 'M9-6 §3.2', service: 'VE', flux: 'charges', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_c4', numero: 'C.4', section: 'C', title: 'Produits VE',
    fullTitle: "Produits du service général VE — Vie de l'élève",
    definition: "Recettes adossées au service VE : bourses, subventions sociales.",
    meta: 'M9-6 §3.2', service: 'VE', flux: 'produits', hasChart: true, chartHint: 'donut', hasN1N2: true },
  { id: 'ordo_c5', numero: 'C.5', section: 'C', title: 'Charges ALO',
    fullTitle: "Charges du service général ALO — Administration et logistique",
    definition: "Exécution des charges ALO : fluides, entretien, maintenance, administration générale.",
    meta: 'M9-6 §3.3', service: 'ALO', flux: 'charges', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_c6', numero: 'C.6', section: 'C', title: 'Produits ALO',
    fullTitle: "Produits du service général ALO — Administration et logistique",
    definition: "Recettes adossées au service ALO : DGF, locations de salles, taxe d'apprentissage.",
    meta: 'M9-6 §3.3', service: 'ALO', flux: 'produits', hasChart: true, chartHint: 'donut', hasN1N2: true },
  { id: 'ordo_c7', numero: 'C.7', section: 'C', title: 'Charges SRH',
    fullTitle: "Charges du service spécial SRH — Restauration & hébergement",
    definition: "Exécution des charges SRH : denrées, personnel logé, fluides cuisine, FARPI/FCSH.",
    meta: 'M9-6 §3.4', service: 'SRH', flux: 'charges', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_c8', numero: 'C.8', section: 'C', title: 'Produits SRH',
    fullTitle: "Produits du service spécial SRH — Restauration & hébergement",
    definition: "Recettes du SRH : pension, demi-pension, commensaux, subventions de la collectivité.",
    meta: 'M9-6 §3.4', service: 'SRH', flux: 'produits', hasChart: true, chartHint: 'donut', hasN1N2: true },
  { id: 'ordo_c9', numero: 'C.9', section: 'C', title: 'Charges OPC',
    fullTitle: "Charges du service OPC — Opérations en capital",
    definition: "Exécution des charges d'investissement et d'opérations en capital (classe 2).",
    meta: 'M9-6 §3.5', service: 'OPC', flux: 'charges', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_c10', numero: 'C.10', section: 'C', title: 'Produits OPC',
    fullTitle: "Produits du service OPC — Opérations en capital",
    definition: "Recettes d'investissement : subventions d'équipement, prélèvements sur fonds de roulement.",
    meta: 'M9-6 §3.5', service: 'OPC', flux: 'produits', hasChart: true, chartHint: 'donut', hasN1N2: true },

  // ─── D. ANALYSE DE GESTION ──────────────────────────────────────
  { id: 'ordo_d1',  numero: 'D.1',  section: 'D', title: 'Focus financements',
    fullTitle: "Focus sur la structure des financements",
    definition: "Origine des recettes : État, collectivité, ressources propres, taxe d'apprentissage.",
    meta: 'M9-6 §4.1', hasChart: true, chartHint: 'donut', hasN1N2: true },
  { id: 'ordo_d2',  numero: 'D.2',  section: 'D', title: 'Dépenses pédagogiques',
    fullTitle: "Focus dépenses pédagogiques",
    definition: "Effort consacré à la pédagogie : fournitures, manuels, équipements, sorties.",
    meta: 'M9-6 §4.2', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_d3',  numero: 'D.3',  section: 'D', title: 'Sorties & voyages',
    fullTitle: "Focus sorties et voyages pédagogiques",
    definition: "Bilan des voyages scolaires et sorties : nombre, élèves concernés, financements.",
    meta: 'M9-6 §4.3', hasChart: true, chartHint: 'bars', hasN1N2: false },
  { id: 'ordo_d4',  numero: 'D.4',  section: 'D', title: 'Formation continue',
    fullTitle: "Focus formation continue (GRETA / convention)",
    definition: "Activité de formation continue : recettes générées, charges affectées, marge.",
    meta: 'M9-6 §4.4', hasChart: true, chartHint: 'lines', hasN1N2: true },
  { id: 'ordo_d5',  numero: 'D.5',  section: 'D', title: 'Bourses nationales',
    fullTitle: "Focus bourses nationales",
    definition: "Bourses versées aux élèves : montants, bénéficiaires, évolution.",
    meta: 'M9-6 §4.5', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_d6',  numero: 'D.6',  section: 'D', title: 'Fonds sociaux',
    fullTitle: "Focus fonds sociaux (lycéen, collégien, restauration)",
    definition: "Aides aux familles et politique sociale : crédits ouverts, consommés, soldes reportés.",
    meta: 'M9-6 §4.6', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_d7',  numero: 'D.7',  section: 'D', title: "Taxe d'apprentissage",
    fullTitle: "Focus taxe d'apprentissage",
    definition: "Recettes de taxe d'apprentissage et leur affectation aux sections éligibles.",
    meta: 'M9-6 §4.7', hasChart: true, chartHint: 'lines', hasN1N2: true },
  { id: 'ordo_d8',  numero: 'D.8',  section: 'D', title: 'Objets confectionnés',
    fullTitle: "Focus objets confectionnés (plateaux techniques)",
    definition: "Activités de production des plateaux techniques : recettes, charges, équilibre.",
    meta: 'M9-6 §4.8', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_d9',  numero: 'D.9',  section: 'D', title: 'Entretien & maintenance',
    fullTitle: "Focus entretien et maintenance des bâtiments",
    definition: "Effort d'entretien : maintenance préventive, réparations, contrats.",
    meta: 'M9-6 §4.9', hasChart: true, chartHint: 'bars', hasN1N2: true },
  { id: 'ordo_d10', numero: 'D.10', section: 'D', title: 'Viabilisation',
    fullTitle: "Focus viabilisation : énergie, eau, fluides",
    definition: "Consommations énergétiques : électricité, gaz, eau ; ratios par m² et par élève.",
    meta: 'M9-6 §4.10', hasChart: true, chartHint: 'lines', hasN1N2: true },
  { id: 'ordo_d11', numero: 'D.11', section: 'D', title: 'Restauration & hébergement',
    fullTitle: "Focus restauration et hébergement (analyse de gestion)",
    definition: "Coût d'un repas, taux de pression, taux d'occupation de l'internat, équilibre pédagogique du SRH.",
    meta: 'M9-6 §4.11', hasChart: true, chartHint: 'bars', hasN1N2: true },
];

export function getFichesBySection(key: OrdoSectionKey): OrdoFicheDef[] {
  return ORDO_FICHES_REPROFI.filter(f => f.section === key);
}

export function getFicheById(id: string): OrdoFicheDef | undefined {
  return ORDO_FICHES_REPROFI.find(f => f.id === id);
}