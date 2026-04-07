/**
 * hyperaleAIEngine — Moteur d'analyse IA interne pour HYPER@LE
 *
 * Génère des analyses financières pédagogiques, des recommandations
 * et des textes prêts à copier à partir des indicateurs EPLE.
 */

import type { HyperaleIndicators } from '@/pages/hyperale/useHyperaleData';

/* ═══════════════════════════════════════════════════════════
   Types — Entrées / Sorties
   ═══════════════════════════════════════════════════════════ */

export interface AIEngineInput {
  fdr: number;
  caf: number;
  tresorerie: number;
  reserves: number;
  fdrPrev: number | null;
  cafPrev: number | null;
  tresPrev: number | null;
  resPrev: number | null;
  seuils: {
    fdrCritique: number;
    fdrSatisfaisant: number;
    tresCritique: number;
    tresSatisfaisant: number;
  };
}

export interface AIEngineOutput {
  resume: string;
  analyseDetaillee: string[];
  recommandations: string[];
  texteCOFI: string;
  texteCA: string;
  texteNote: string;
}

/** Extended output used internally by HYPER@LE pages */
export interface AnalyseComplete {
  engine: AIEngineOutput;
  causes: string[];
  consequences: string[];
  vigilance: string[];
  positifs: string[];
  recommandationsAvecPriorite: { texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[];
  evenements: { texte: string; category: 'fdr' | 'tresorerie' | 'caf' | 'general'; severity: 'critical' | 'warning' | 'info' }[];
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function computeVariation(current: number, prev: number | null): { pct: number; label: string } {
  if (prev == null || prev === 0) return { pct: 0, label: 'variation non disponible' };
  const p = ((current - prev) / Math.abs(prev)) * 100;
  if (p < -10) return { pct: p, label: 'baisse significative' };
  if (p > 10) return { pct: p, label: 'hausse notable' };
  return { pct: p, label: 'variation modérée' };
}

function evalNiveau(value: number, critique: number, satisfaisant: number): string {
  if (value < critique) return 'niveau critique';
  if (value < satisfaisant) return 'niveau à surveiller';
  return 'niveau satisfaisant';
}

function causeFor(indicator: string, variation: string): string {
  if (indicator === 'fdr' && variation.includes('baisse')) return 'une tension sur le cycle d\'exploitation';
  if (indicator === 'fdr' && variation.includes('hausse')) return 'un renforcement des ressources stables';
  if (indicator === 'caf' && variation.includes('baisse')) return 'une augmentation des charges réelles';
  if (indicator === 'caf' && variation.includes('hausse')) return 'une amélioration de la capacité d\'autofinancement';
  if (indicator === 'tresorerie' && variation.includes('baisse')) return 'un décalage entre encaissements et décaissements';
  if (indicator === 'tresorerie' && variation.includes('hausse')) return 'une accélération des encaissements';
  if (indicator === 'reserves' && variation.includes('baisse')) return 'un prélèvement sur les réserves antérieures';
  if (indicator === 'reserves' && variation.includes('hausse')) return 'une constitution progressive de marges de sécurité';
  return 'des facteurs multiples à analyser';
}

function consequenceFor(indicator: string, niveau: string): string {
  if (indicator === 'tresorerie' && niveau === 'niveau critique') return 'un risque de tension à court terme sur les paiements';
  if (indicator === 'tresorerie' && niveau === 'niveau à surveiller') return 'une vigilance nécessaire sur les décaissements à venir';
  if (indicator === 'tresorerie') return 'un confort suffisant pour les opérations courantes';
  if (indicator === 'fdr' && niveau === 'niveau critique') return 'un risque structurel sur l\'équilibre financier';
  if (indicator === 'fdr' && niveau === 'niveau à surveiller') return 'une attention particulière sur les charges de long terme';
  return 'une situation qui ne nécessite pas d\'action immédiate';
}

function interpretReserves(variation: string): string {
  if (variation.includes('baisse')) return 'une réduction des marges de sécurité';
  if (variation.includes('hausse')) return 'une marge de sécurité confortable';
  return 'une stabilité des marges de sécurité';
}

/* ═══════════════════════════════════════════════════════════
   Moteur principal — AIEngine
   ═══════════════════════════════════════════════════════════ */

export function runAIEngine(input: AIEngineInput): AIEngineOutput {
  const varFdr = computeVariation(input.fdr, input.fdrPrev);
  const varCaf = computeVariation(input.caf, input.cafPrev);
  const varTres = computeVariation(input.tresorerie, input.tresPrev);
  const varRes = computeVariation(input.reserves, input.resPrev);

  const niveauFdr = evalNiveau(input.fdr, input.seuils.fdrCritique, input.seuils.fdrSatisfaisant);
  const niveauTres = evalNiveau(input.tresorerie, input.seuils.tresCritique, input.seuils.tresSatisfaisant);

  const causeFdr = causeFor('fdr', varFdr.label);
  const causeCaf = causeFor('caf', varCaf.label);
  const conseqTres = consequenceFor('tresorerie', niveauTres);
  const conseqFdr = consequenceFor('fdr', niveauFdr);
  const interpRes = interpretReserves(varRes.label);

  // ── Résumé exécutif (3 lignes) ──
  const tendanceFdr = varFdr.label === 'variation non disponible' ? 'stabilité' : varFdr.label;
  const tendanceCaf = varCaf.label === 'variation non disponible' ? 'stabilité' : varCaf.label;
  const tendanceRes = varRes.label === 'variation non disponible' ? 'une stabilité' : `une ${varRes.label}`;

  const resume = `L'établissement présente une ${tendanceFdr} de son fonds de roulement et une ${tendanceCaf} de sa CAF.\nLa trésorerie est actuellement à un ${niveauTres}.\nLes réserves montrent ${tendanceRes}.`;

  // ── Analyse détaillée ──
  const analyseDetaillee: string[] = [
    `Le fonds de roulement est à un ${niveauFdr} (${fmt(input.fdr)}), avec une ${varFdr.label} par rapport à l'année précédente${varFdr.pct !== 0 ? ` (${varFdr.pct > 0 ? '+' : ''}${varFdr.pct.toFixed(1)} %)` : ''}.`,
    `La CAF présente une ${varCaf.label}${varCaf.pct !== 0 ? ` (${varCaf.pct > 0 ? '+' : ''}${varCaf.pct.toFixed(1)} %)` : ''}, ce qui peut s'expliquer par ${causeCaf}.`,
    `La trésorerie est à un ${niveauTres} (${fmt(input.tresorerie)}), ce qui implique ${conseqTres}.`,
    `Les réserves (${fmt(input.reserves)}) montrent une ${varRes.label}, traduisant ${interpRes}.`,
  ];

  // ── Recommandations ──
  const recommandations: string[] = [];
  if (niveauFdr !== 'niveau satisfaisant') {
    recommandations.push('Surveiller les charges de fonctionnement du service général.');
  }
  if (niveauTres !== 'niveau satisfaisant') {
    recommandations.push('Analyser les restes à recouvrer pour améliorer la trésorerie.');
    recommandations.push('Anticiper un besoin de trésorerie au premier trimestre.');
  }
  if (varCaf.label.includes('baisse')) {
    recommandations.push('Renforcer le suivi des dépenses SRH.');
  }
  recommandations.push('Renforcer le suivi des recettes propres et des restes à recouvrer.');
  if (input.caf < 0) {
    recommandations.push('Identifier les postes de charges à optimiser pour restaurer la CAF.');
  }
  recommandations.push('Préparer un plan d\'investissement cohérent avec la capacité d\'autofinancement.');
  // Deduplicate & limit
  const uniqueRecos = [...new Set(recommandations)].slice(0, 6);

  // ── Texte COFI ──
  const texteCOFI = `Le fonds de roulement de l'établissement présente une ${varFdr.label}${varFdr.pct !== 0 ? ` (${varFdr.pct > 0 ? '+' : ''}${varFdr.pct.toFixed(1)} %)` : ''}.\nLa capacité d'autofinancement évolue de manière ${varCaf.label === 'variation non disponible' ? 'stable' : varCaf.label}, traduisant ${causeCaf}.\nLa trésorerie se situe à un ${niveauTres} (${fmt(input.tresorerie)}), ce qui implique ${conseqTres}.\nLes réserves (${fmt(input.reserves)}) montrent une ${varRes.label}, indiquant ${interpRes}.`;

  // ── Texte CA ──
  const texteCA = `Le fonds de roulement évolue de manière ${varFdr.label === 'variation non disponible' ? 'stable' : varFdr.label}, ce qui reflète ${causeFdr}.\nLa CAF ${varCaf.label.includes('hausse') ? 'progresse' : varCaf.label.includes('baisse') ? 'recule' : 'reste stable'}, influencée par ${causeCaf}.\nLa trésorerie reste à un ${niveauTres}, ${niveauTres === 'niveau satisfaisant' ? 'assurant un confort de gestion' : `nécessitant un suivi attentif des flux de trésorerie`}.\nLes réserves montrent une ${varRes.label}, offrant ${interpRes}.`;

  // ── Texte note interne ──
  const texteNote = `Points clés : FDR ${varFdr.label} (${fmt(input.fdr)}), CAF ${varCaf.label} (${fmt(input.caf)}), trésorerie ${niveauTres} (${fmt(input.tresorerie)}), réserves ${varRes.label} (${fmt(input.reserves)}).\nActions recommandées : ${uniqueRecos.slice(0, 3).join(' / ')}.`;

  return { resume, analyseDetaillee, recommandations: uniqueRecos, texteCOFI, texteCA, texteNote };
}

/* ═══════════════════════════════════════════════════════════
   Fonction de haut niveau — intégration HYPER@LE
   Accepte les données du module et produit l'analyse complète.
   ═══════════════════════════════════════════════════════════ */

export interface AnalyseInput {
  nom: string;
  exercice: number;
  data: HyperaleIndicators;
  seuils?: { fdr: { satisfaisant: number; critique: number }; tresorerie: { satisfaisant: number; critique: number }; caf: { satisfaisant: number; critique: number }; reserves: { satisfaisant: number; critique: number } }
    | { seuilFdr: number; seuilTresorerie: number };
}

export function analyser(input: AnalyseInput): AnalyseComplete {
  const { nom, exercice, data, seuils: rawSeuils } = input;

  // Normalize seuils: support both old format (jours) and new format (euros)
  let fdrCritique: number, fdrSatisfaisant: number, tresCritique: number, tresSatisfaisant: number;
  const drfnJour = data.drfn / 365;

  if (rawSeuils && 'fdr' in rawSeuils) {
    // New HyperaleSeuils format (euros)
    fdrCritique = rawSeuils.fdr.critique;
    fdrSatisfaisant = rawSeuils.fdr.satisfaisant;
    tresCritique = rawSeuils.tresorerie.critique;
    tresSatisfaisant = rawSeuils.tresorerie.satisfaisant;
  } else {
    // Legacy format (jours)
    const seuilFdr = rawSeuils?.seuilFdr ?? 30;
    const seuilTreso = rawSeuils?.seuilTresorerie ?? 15;
    fdrCritique = seuilFdr * drfnJour * 0.5;
    fdrSatisfaisant = seuilFdr * drfnJour;
    tresCritique = seuilTreso * drfnJour * 0.5;
    tresSatisfaisant = seuilTreso * drfnJour;
  }

  // Données N-1
  const prevYear = data.historique.find(h => h.exercice === exercice - 1);

  const engineInput: AIEngineInput = {
    fdr: data.fdr,
    caf: data.caf,
    tresorerie: data.tresorerie,
    reserves: data.reserves,
    fdrPrev: prevYear?.fdr ?? null,
    cafPrev: prevYear?.caf ?? null,
    tresPrev: prevYear?.tresorerie ?? null,
    resPrev: prevYear?.reserves ?? null,
    seuils: { fdrCritique, fdrSatisfaisant, tresCritique, tresSatisfaisant },
  };

  const engine = runAIEngine(engineInput);

  // ── Extended analysis (causes / consequences / vigilance / positifs) ──
  const deltaFdr = prevYear ? ((data.fdr - prevYear.fdr) / Math.abs(prevYear.fdr)) * 100 : 0;
  const deltaCaf = prevYear ? ((data.caf - prevYear.caf) / Math.abs(prevYear.caf || 1)) * 100 : 0;
  const deltaTreso = prevYear ? ((data.tresorerie - prevYear.tresorerie) / Math.abs(prevYear.tresorerie || 1)) * 100 : 0;

  const causes: string[] = [];
  const consequences: string[] = [];
  const vigilance: string[] = [];
  const positifs: string[] = [];

  if (data.fdr < 0) { causes.push('Emplois stables supérieurs aux ressources stables'); consequences.push('Risque d\'incident de paiement à court terme'); }
  if (data.fdrJours < seuilFdr) vigilance.push(`Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours — seuil recommandé : ${seuilFdr} jours.`);
  if (data.fdrJours >= 45) positifs.push(`Le FDR couvre ${data.fdrJours.toFixed(1)} jours, supérieur à la moyenne nationale.`);
  if (data.caf < 0) { causes.push('Charges réelles supérieures aux produits réels'); consequences.push('Érosion progressive du fonds de roulement'); }
  if (data.caf > 0) positifs.push('La CAF est positive : l\'établissement dégage des ressources pour investir.');
  if (data.tresorerie < 0) { causes.push('Décalage entre encaissements et décaissements'); consequences.push('Impossibilité de payer les fournisseurs à bonne date'); vigilance.push('Trésorerie négative — risque de rejet de virements.'); }
  if (data.tresorerieJours < seuilTreso && data.tresorerie > 0) vigilance.push(`Trésorerie faible : seulement ${data.tresorerieJours.toFixed(1)} jours de couverture.`);
  if (data.tresorerieJours >= 30) positifs.push('La trésorerie couvre plus de 30 jours, situation confortable.');
  if (data.tauxExecCharges > 0 && data.tauxExecCharges < 85) vigilance.push(`Taux d'exécution des charges à ${data.tauxExecCharges.toFixed(1)} % — inférieur à 85 %.`);
  if (data.tauxExecCharges >= 90) positifs.push(`Taux d'exécution des charges satisfaisant (${data.tauxExecCharges.toFixed(1)} %).`);
  if (data.resultatComptable < -5000) { causes.push('Résultat comptable fortement déficitaire'); consequences.push('Prélèvement probable sur les réserves'); }
  if (data.resultatComptable > 0) positifs.push(`Résultat comptable excédentaire (${fmt(data.resultatComptable)}).`);
  if (Math.abs(deltaFdr) > 15) causes.push(`Variation du FDR de ${deltaFdr.toFixed(1)} % par rapport à N-1`);

  if (causes.length === 0) causes.push('Aucune cause d\'alerte identifiée.');
  if (consequences.length === 0) consequences.push('Aucune conséquence négative anticipée.');
  if (vigilance.length === 0) vigilance.push('Aucun point de vigilance particulier.');
  if (positifs.length === 0) positifs.push('L\'analyse ne met pas en évidence de point positif marquant.');

  // Prioritised recommendations
  const recommandationsAvecPriorite = engine.recommandations.map((texte, i) => ({
    texte,
    priorite: (i < 2 && (data.fdr < 0 || data.tresorerie < 0 || data.caf < 0) ? 'haute' : i < 4 ? 'moyenne' : 'basse') as 'haute' | 'moyenne' | 'basse',
  }));

  // Events
  const evenements: AnalyseComplete['evenements'] = [];
  if (data.fdr < 0) evenements.push({ texte: `FDR négatif : ${fmt(data.fdr)}`, category: 'fdr', severity: 'critical' });
  if (Math.abs(deltaFdr) > 10) evenements.push({ texte: `Variation du FDR de ${deltaFdr > 0 ? '+' : ''}${deltaFdr.toFixed(1)} %`, category: 'fdr', severity: Math.abs(deltaFdr) > 20 ? 'critical' : 'warning' });
  if (data.tresorerie < 0) evenements.push({ texte: `Trésorerie négative : ${fmt(data.tresorerie)}`, category: 'tresorerie', severity: 'critical' });
  if (Math.abs(deltaTreso) > 15) evenements.push({ texte: `Variation de la trésorerie de ${deltaTreso > 0 ? '+' : ''}${deltaTreso.toFixed(1)} %`, category: 'tresorerie', severity: 'warning' });
  if (data.caf < 0) evenements.push({ texte: `CAF négative : ${fmt(data.caf)}`, category: 'caf', severity: 'warning' });
  if (Math.abs(deltaCaf) > 20) evenements.push({ texte: `Variation de la CAF de ${deltaCaf > 0 ? '+' : ''}${deltaCaf.toFixed(1)} %`, category: 'caf', severity: 'warning' });
  if (data.fdrJours < seuilFdr) evenements.push({ texte: `FDR sous le seuil : ${data.fdrJours.toFixed(1)} jours (seuil : ${seuilFdr} j)`, category: 'fdr', severity: 'warning' });
  if (data.tresorerieJours < seuilTreso && data.tresorerie > 0) evenements.push({ texte: `Trésorerie sous le seuil : ${data.tresorerieJours.toFixed(1)} jours (seuil : ${seuilTreso} j)`, category: 'tresorerie', severity: 'warning' });
  if (data.resultatComptable < -5000) evenements.push({ texte: `Résultat comptable fortement déficitaire : ${fmt(data.resultatComptable)}`, category: 'general', severity: 'critical' });
  if (evenements.length === 0) evenements.push({ texte: 'Aucune anomalie détectée. Les indicateurs sont dans les normes.', category: 'general', severity: 'info' });

  return { engine, causes, consequences, vigilance, positifs, recommandationsAvecPriorite, evenements };
}

/**
 * Contexte structuré pour l'assistant IA (prompt système)
 */
export function buildAssistantContext(nom: string, exercice: number, data: HyperaleIndicators, analyse: AnalyseComplete): string {
  return `Données financières de ${nom} (exercice ${exercice}) :
- Fonds de roulement : ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours)
- CAF : ${fmt(data.caf)}
- Trésorerie : ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours)
- Réserves : ${fmt(data.reserves)}
- DRFN : ${fmt(data.drfn)}
- Résultat comptable : ${fmt(data.resultatComptable)}
- Taux d'exécution charges : ${data.tauxExecCharges.toFixed(1)} %
- Taux d'exécution produits : ${data.tauxExecProduits.toFixed(1)} %
- Moyenne nationale FDR : ${data.moyenneNationale.fdrJours} j, trésorerie : ${data.moyenneNationale.tresorerieJours} j

Synthèse automatique :
${analyse.engine.resume}

Analyse détaillée :
${analyse.engine.analyseDetaillee.join('\n')}

Points de vigilance : ${analyse.vigilance.join(' / ')}
Points positifs : ${analyse.positifs.join(' / ')}
${!data.hasData ? '\n⚠️ Ces données sont simulées (démonstration). Préciser que l\'analyse est indicative.' : ''}`;
}
