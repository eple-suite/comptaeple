// =====================================================================
// Moteur de commentaires automatiques — Compte financier EPLE
// ---------------------------------------------------------------------
// Génère des commentaires contextualisés à partir :
//   • des 10 indicateurs réglementaires (niveau + valeur)
//   • du bilan financier (FR / BFR / TN / CAF / Réserves)
//   • des seuils M9-6 tome 4 art. 43231
//
// Deux niveaux de sortie :
//   1. Commentaire individuel par indicateur (template)
//   2. Synthèse globale Ordonnateur / Agent comptable (3 paragraphes)
//
// Module PUR — testable hors UI, utilisable côté PDF & UI.
// =====================================================================

import type { BilanComplet } from './bilanFinancierEngine';
import type {
  IndicateurReprofi,
  PanierReprofi,
  Niveau,
  DetailReserves,
} from './reprofiIndicateursEngine';

// ---------------------------------------------------------------------
// 1. Templates par indicateur × niveau (M9-6 / pratiques EPLE)
// ---------------------------------------------------------------------

const TEMPLATES: Record<string, Partial<Record<Niveau, string>>> = {
  NR: {
    excellent: "Le taux de non-recouvrement (<2 %) traduit une excellente discipline de recouvrement et un suivi rigoureux des familles.",
    normal: "Le taux de non-recouvrement (2-5 %) reste conforme aux usages EPLE ; aucune alerte particulière à ce stade.",
    fragile: "Le taux de non-recouvrement (5-10 %) appelle un renforcement des relances et une coordination accrue avec l'agent comptable.",
    critique: "Le taux de non-recouvrement dépasse 10 % : un plan d'apurement immédiat (SATD, admissions en non-valeur) doit être engagé.",
  },
  CONT: {
    excellent: "Aucune provision pour contentieux n'est constituée — la situation juridique est saine.",
    normal: "Les provisions pour contentieux restent marginales (<2 % des charges), traduisant une faible exposition au risque juridique.",
    fragile: "Les provisions pour contentieux représentent 2 à 5 % des charges : il convient de surveiller l'évolution des litiges.",
    critique: "Les provisions pour contentieux excèdent 5 % des charges : un examen approfondi des dossiers et de leur couverture est requis.",
  },
  CAP: {
    excellent: "Les comptes d'attente provisoires (47) sont quasi-soldés : excellente discipline de clôture.",
    normal: "Le solde des comptes 47 reste maîtrisé (<10 k€) ; il sera apuré en clôture.",
    fragile: "Le solde des comptes 47 (10-50 k€) signale des opérations en attente à régulariser avant la clôture définitive.",
    critique: "Le solde des comptes 47 dépasse 50 k€ : un apurement obligatoire est imposé par l'instruction M9-6 pour éviter de masquer des erreurs.",
  },
  VETU: {
    excellent: "Le parc immobilier est récent (taux de vétusté <30 %) : la capacité d'investissement future est préservée.",
    normal: "Le parc immobilier est en bon état (vétusté 30-60 %) ; le renouvellement des équipements lourds doit être anticipé.",
    fragile: "Le parc immobilier vieillit (vétusté 60-80 %) : un plan pluriannuel d'investissement doit être programmé.",
    critique: "Le parc immobilier est obsolète (>80 % amortis) : risques d'arrêt et coûts de maintenance croissants — programmation d'investissement urgente.",
  },
  DGP: {
    normal: "La dépendance aux subventions reste modérée (<60 %) ; l'établissement conserve une marge d'autonomie de gestion.",
    fragile: "La dépendance aux subventions est forte (60-80 %) : la marge de manœuvre budgétaire est limitée.",
    critique: "La dépendance aux subventions excède 80 % : la collectivité de rattachement pèse de manière déterminante sur l'équilibre.",
  },
  CHFIX: {
    normal: "Le poids des charges fixes (<60 % des charges) confère à la structure une bonne capacité d'absorption des chocs budgétaires.",
    fragile: "Le poids des charges fixes (60-75 %) réduit la flexibilité face aux variations de recettes.",
    critique: "Le poids des charges fixes dépasse 75 % : la structure est très rigide et le pilotage budgétaire restreint.",
  },
  ENDET: {
    excellent: "La capacité de désendettement (<2 années de CAF) est excellente ; aucun risque structurel.",
    normal: "La capacité de désendettement (2-5 années de CAF) est saine et conforme aux normes EPLE.",
    fragile: "La capacité de désendettement (5-8 années) appelle à limiter les nouveaux emprunts.",
    critique: "La capacité de désendettement dépasse 8 années : un plan d'apurement de la dette est requis.",
  },
  LIQ: {
    excellent: "La liquidité immédiate (>2) traduit une très forte capacité à honorer les dettes court-terme.",
    normal: "La liquidité immédiate (1,2-2) reste à un niveau confortable et conforme aux pratiques EPLE.",
    fragile: "La liquidité immédiate (0,8-1,2) signale une tension de trésorerie ponctuelle possible.",
    critique: "La liquidité immédiate (<0,8) traduit un risque immédiat d'incident de paiement — action urgente.",
  },
  INDEP: {
    excellent: "L'indépendance financière (>90 %) traduit une autonomie quasi-totale et une structure très saine.",
    normal: "L'indépendance financière (70-90 %) correspond à un profil EPLE classique et sain.",
    fragile: "L'indépendance financière (50-70 %) traduit un poids significatif de l'endettement.",
    critique: "L'indépendance financière est inférieure à 50 % : la structure est dominée par les dettes — risque structurel.",
  },
};

/** Génère le commentaire textuel d'un indicateur (fallback : commentaire technique du moteur). */
export function commenterIndicateur(ind: IndicateurReprofi): string {
  return TEMPLATES[ind.code]?.[ind.niveau] ?? ind.commentaire;
}

// ---------------------------------------------------------------------
// 2. Commentaire des Réserves (M9-6 tome 4 art. 43231)
// ---------------------------------------------------------------------

export function commenterReserves(r: DetailReserves): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const grevees = r.reservesSRH + r.reservesTaxeApprent + r.reservesAffectees + r.reservesAutres;
  const part = r.total > 0 ? (grevees / r.total) * 100 : 0;
  const lignes: string[] = [];
  lignes.push(
    `Le total des réserves s'élève à ${fmt(r.total)}, dont ${fmt(grevees)} de réserves grevées d'affectation spéciale (${part.toFixed(1)} %).`,
  );
  if (r.reservesSRH !== 0) lignes.push(`• Réserves SRH (10681) : ${fmt(r.reservesSRH)} — affectées au service annexe d'hébergement.`);
  if (r.reservesGenerales !== 0) lignes.push(`• Réserves générales (10682) : ${fmt(r.reservesGenerales)} — mobilisables pour le fonds de roulement.`);
  if (r.reservesTaxeApprent !== 0) lignes.push(`• Taxe d'apprentissage (10683) : ${fmt(r.reservesTaxeApprent)} — emploi réglementé.`);
  if (r.reservesAffectees !== 0) lignes.push(`• Réserves affectées (10687) : ${fmt(r.reservesAffectees)} — usage contraint.`);
  if (Math.abs(r.reservesAutres) > 0.01) lignes.push(`• Autres réserves (1068x) : ${fmt(r.reservesAutres)}.`);
  return lignes.join('\n');
}

// ---------------------------------------------------------------------
// 3. Synthèse globale (Ordonnateur / Agent comptable)
// ---------------------------------------------------------------------

export interface SyntheseCommentaires {
  /** Paragraphe 1 — Résultat & exécution budgétaire. */
  resultat: string;
  /** Paragraphe 2 — Bilan, FR, BFR, Trésorerie. */
  bilan: string;
  /** Paragraphe 3 — Diagnostic Financier (synthèse des 10 indicateurs). */
  reprofi: string;
  /** Verdict global concis (1 phrase) destiné au CA. */
  verdict: string;
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/**
 * Synthèse rédigée à partir du bilan + des 10 indicateurs réglementaires.
 * Utilisé en fallback ou en complément des observations IA.
 */
export function synthetiserCommentaires(
  bilan: BilanComplet,
  panier: PanierReprofi,
): SyntheseCommentaires {
  // Compte par niveau
  const nbCritique = panier.indicateurs.filter(i => i.niveau === 'critique').length;
  const nbFragile = panier.indicateurs.filter(i => i.niveau === 'fragile').length;
  const nbExcellent = panier.indicateurs.filter(i => i.niveau === 'excellent').length;

  // Paragraphe 1 — Bilan financier global
  const resultat = bilan.caf.resultat;
  const sensRes = resultat >= 0 ? 'excédentaire' : 'déficitaire';
  const caf = bilan.caf.caf_additive;
  const sensCaf = caf >= 0 ? 'positive' : 'négative';
  const para1 =
    `L'exercice se solde par un résultat ${sensRes} de ${fmtEur(resultat)}. ` +
    `La capacité d'autofinancement (CAF) s'établit à ${fmtEur(caf)}, ${sensCaf}, ` +
    `traduisant ${caf >= 0 ? "la capacité de l'établissement à dégager des ressources internes" : "une consommation nette de ressources sur l'exercice"}.`;

  // Paragraphe 2 — Bilan / FR / BFR / TN
  const fr = bilan.fr.fr_haut;
  const tn = bilan.tn.tn_calc;
  const bfr = bilan.bfr.bfr;
  const jours = Math.round(bilan.joursFR);
  let etatFR = 'confortable';
  if (jours < 30) etatFR = 'critique';
  else if (jours < 60) etatFR = 'fragile';
  else if (jours > 120) etatFR = 'surdimensionné';
  const para2 =
    `Le fonds de roulement s'élève à ${fmtEur(fr)} (${jours} jours de charges décaissables — niveau ${etatFR}), ` +
    `pour un besoin en fonds de roulement de ${fmtEur(bfr)} et une trésorerie de ${fmtEur(tn)}. ` +
    `Les deux méthodes de calcul du FR convergent à ${fmtEur(bilan.fr.ecart)} près` +
    `${bilan.fr.coherent ? ' (cohérence vérifiée)' : ' — un contrôle complémentaire est recommandé'}.`;

  // Paragraphe 3 — Diagnostic Financier (synthèse 10 indicateurs)
  let synthReprofi: string;
  if (nbCritique === 0 && nbFragile === 0) {
    synthReprofi = `Le diagnostic financier est entièrement favorable : aucun indicateur n'est en alerte, et ${nbExcellent} indicateur(s) sont au niveau excellent.`;
  } else if (nbCritique === 0) {
    synthReprofi = `Le diagnostic financier fait apparaître ${nbFragile} indicateur(s) en vigilance, sans alerte critique. Une surveillance ciblée est recommandée.`;
  } else {
    const codesCrit = panier.indicateurs.filter(i => i.niveau === 'critique').map(i => i.code).join(', ');
    synthReprofi = `Le diagnostic financier identifie ${nbCritique} indicateur(s) en alerte critique (${codesCrit}) et ${nbFragile} en vigilance. Un plan d'action est requis.`;
  }

  // Verdict
  let verdict: string;
  if (nbCritique > 0) {
    verdict = `⚠️ Situation à risque : ${nbCritique} indicateur(s) réglementaire(s) en alerte critique nécessitent une décision du conseil.`;
  } else if (nbFragile > 1) {
    verdict = `🟠 Situation sous vigilance : ${nbFragile} indicateurs fragiles ; ajustements à prévoir.`;
  } else if (resultat < 0 && caf < 0) {
    verdict = `🟠 Situation déficitaire : résultat et CAF négatifs — examen des leviers d'équilibre nécessaire.`;
  } else {
    verdict = `🟢 Situation financière saine et conforme à l'instruction M9-6.`;
  }

  return { resultat: para1, bilan: para2, reprofi: synthReprofi, verdict };
}