/**
 * Moteur d'analyse IA interne pour HYPER@LE
 * Produit des analyses financières pédagogiques à partir des indicateurs.
 */

import type { HyperaleIndicators } from '@/pages/hyperale/useHyperaleData';

/* ─── Types ─── */

export interface AnalyseInput {
  nom: string;
  exercice: number;
  data: HyperaleIndicators;
  seuils?: { seuilFdr: number; seuilTresorerie: number };
}

export interface AnalyseSynthetique {
  phrases: string[];
}

export interface AnalyseDetaillee {
  causes: string[];
  consequences: string[];
  vigilance: string[];
  positifs: string[];
}

export interface Recommandation {
  texte: string;
  priorite: 'haute' | 'moyenne' | 'basse';
}

export interface TextesPretACopier {
  resumeExecutif: string;
  cofi: string;
  ca: string;
  noteInterne: string;
}

export interface EvenementDetecte {
  texte: string;
  category: 'fdr' | 'tresorerie' | 'caf' | 'general';
  severity: 'critical' | 'warning' | 'info';
}

export interface AnalyseComplete {
  synthetique: AnalyseSynthetique;
  detaillee: AnalyseDetaillee;
  recommandations: Recommandation[];
  textes: TextesPretACopier;
  evenements: EvenementDetecte[];
}

/* ─── Helpers ─── */

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const pctDelta = (current: number, prev: number) =>
  prev !== 0 ? ((current - prev) / Math.abs(prev)) * 100 : 0;

/* ─── Moteur principal ─── */

export function analyser(input: AnalyseInput): AnalyseComplete {
  const { nom, exercice, data, seuils } = input;
  const seuilFdr = seuils?.seuilFdr ?? 30;
  const seuilTreso = seuils?.seuilTresorerie ?? 15;

  // Données N-1
  const prevYear = data.historique.find(h => h.exercice === exercice - 1);
  const prevFdr = prevYear?.fdr ?? data.fdr * 0.95;
  const prevCaf = prevYear?.caf ?? data.caf * 0.9;
  const prevTreso = prevYear?.tresorerie ?? data.tresorerie * 0.97;

  const deltaFdr = pctDelta(data.fdr, prevFdr);
  const deltaCaf = pctDelta(data.caf, prevCaf);
  const deltaTreso = pctDelta(data.tresorerie, prevTreso);

  // ── Analyse détaillée ──
  const causes: string[] = [];
  const consequences: string[] = [];
  const vigilance: string[] = [];
  const positifs: string[] = [];

  if (data.fdr < 0) {
    causes.push('Emplois stables supérieurs aux ressources stables');
    consequences.push('Risque d\'incident de paiement à court terme');
  }
  if (data.fdrJours < seuilFdr) {
    vigilance.push(`Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours — seuil recommandé : ${seuilFdr} jours.`);
  }
  if (data.fdrJours >= 45) {
    positifs.push(`Le FDR couvre ${data.fdrJours.toFixed(1)} jours, supérieur à la moyenne nationale.`);
  }
  if (data.caf < 0) {
    causes.push('Charges réelles supérieures aux produits réels');
    consequences.push('Érosion progressive du fonds de roulement');
  }
  if (data.caf > 0) {
    positifs.push('La CAF est positive : l\'établissement dégage des ressources pour investir.');
  }
  if (data.tresorerie < 0) {
    causes.push('Décalage entre encaissements et décaissements');
    consequences.push('Impossibilité de payer les fournisseurs à bonne date');
    vigilance.push('Trésorerie négative — risque de rejet de virements.');
  }
  if (data.tresorerieJours < seuilTreso && data.tresorerie > 0) {
    vigilance.push(`Trésorerie faible : seulement ${data.tresorerieJours.toFixed(1)} jours de couverture.`);
  }
  if (data.tresorerieJours >= 30) {
    positifs.push('La trésorerie couvre plus de 30 jours, situation confortable.');
  }
  if (data.tauxExecCharges > 0 && data.tauxExecCharges < 85) {
    vigilance.push(`Taux d'exécution des charges à ${data.tauxExecCharges.toFixed(1)} % — inférieur à 85 %.`);
  }
  if (data.tauxExecCharges >= 90) {
    positifs.push(`Taux d'exécution des charges satisfaisant (${data.tauxExecCharges.toFixed(1)} %).`);
  }
  if (data.resultatComptable < -5000) {
    causes.push('Résultat comptable fortement déficitaire');
    consequences.push('Prélèvement probable sur les réserves');
  }
  if (data.resultatComptable > 0) {
    positifs.push(`Résultat comptable excédentaire (${fmt(data.resultatComptable)}).`);
  }
  if (Math.abs(deltaFdr) > 15) {
    causes.push(`Variation du FDR de ${deltaFdr.toFixed(1)} % par rapport à N-1`);
  }

  // Defaults
  if (causes.length === 0) causes.push('Aucune cause d\'alerte identifiée.');
  if (consequences.length === 0) consequences.push('Aucune conséquence négative anticipée.');
  if (vigilance.length === 0) vigilance.push('Aucun point de vigilance particulier.');
  if (positifs.length === 0) positifs.push('L\'analyse ne met pas en évidence de point positif marquant.');

  // ── Synthèse ──
  const phrases: string[] = [];
  phrases.push(`Au 31/12/${exercice}, ${nom} présente un FDR de ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours).`);
  if (Math.abs(deltaFdr) > 5) {
    phrases.push(`Le FDR est en ${deltaFdr > 0 ? 'hausse' : 'baisse'} de ${Math.abs(deltaFdr).toFixed(1)} % par rapport à l'exercice précédent.`);
  }
  if (data.tresorerieJours < seuilTreso && data.tresorerie > 0) {
    phrases.push('La trésorerie reste positive mais se rapproche du seuil d\'alerte.');
  } else if (data.tresorerie < 0) {
    phrases.push('La trésorerie est négative, situation critique.');
  } else {
    phrases.push(`La trésorerie de ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours) est à un niveau satisfaisant.`);
  }
  if (data.caf >= 0) {
    phrases.push('La CAF positive permet d\'envisager des investissements.');
  } else {
    phrases.push('La CAF négative alerte sur la viabilité de l\'exploitation.');
  }

  // ── Recommandations ──
  const recos: Recommandation[] = [];
  if (data.fdrJours < seuilFdr) {
    recos.push({ texte: 'Surveiller les charges de fonctionnement et limiter les dépenses non prioritaires.', priorite: 'haute' });
  }
  if (data.caf < 0) {
    recos.push({ texte: 'Identifier les postes de charges à optimiser pour restaurer la CAF.', priorite: 'haute' });
  }
  if (data.tresorerieJours < seuilTreso) {
    recos.push({ texte: 'Anticiper un besoin de trésorerie et accélérer les encaissements.', priorite: 'haute' });
  }
  recos.push({ texte: 'Renforcer le suivi des recettes propres et des restes à recouvrer.', priorite: 'moyenne' });
  if (data.tauxExecCharges < 85) {
    recos.push({ texte: 'Analyser les engagements en cours pour améliorer le taux d\'exécution.', priorite: 'moyenne' });
  }
  recos.push({ texte: 'Préparer un plan d\'investissement cohérent avec la capacité d\'autofinancement.', priorite: 'basse' });
  // Deduplicate
  const seen = new Set<string>();
  const uniqueRecos = recos.filter(r => { if (seen.has(r.texte)) return false; seen.add(r.texte); return true; }).slice(0, 6);

  // ── Textes prêts à copier ──
  const sain = data.fdr > 0 && data.tresorerie > 0;

  const resumeExecutif = `Au 31/12/${exercice}, ${nom} présente un FDR de ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours), une trésorerie de ${fmt(data.tresorerie)} et une CAF de ${fmt(data.caf)}. ${sain ? 'La situation financière est globalement saine.' : 'Des points de vigilance sont identifiés.'}`;

  const cofi = `Le fonds de roulement de ${nom} s'établit à ${fmt(data.fdr)} au 31/12/${exercice}, soit ${data.fdrJours.toFixed(1)} jours de fonctionnement. La trésorerie atteint ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours). La capacité d'autofinancement est de ${fmt(data.caf)}. ${data.caf >= 0 ? 'L\'établissement dégage des ressources suffisantes pour financer ses investissements.' : 'L\'établissement ne génère pas suffisamment de ressources pour son autofinancement.'} Les réserves s'élèvent à ${fmt(data.reserves)}.`;

  const ca = `Mesdames, Messieurs les membres du Conseil d'Administration,\n\nLe compte financier de l'exercice ${exercice} fait apparaître un fonds de roulement de ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours), une trésorerie de ${fmt(data.tresorerie)} et des réserves de ${fmt(data.reserves)}.\n\n${sain ? 'La situation financière de l\'établissement est satisfaisante et permet d\'envisager sereinement les projets à venir.' : 'La situation financière appelle une vigilance particulière sur la maîtrise des charges et le recouvrement des recettes.'}`;

  const noteInterne = `Monsieur/Madame le Chef d'établissement,\n\nÀ l'issue de l'exercice ${exercice}, les principaux indicateurs financiers de ${nom} sont les suivants :\n- FDR : ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours)\n- CAF : ${fmt(data.caf)}\n- Trésorerie : ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours)\n- Réserves : ${fmt(data.reserves)}\n\n${uniqueRecos.slice(0, 3).map(r => `• ${r.texte}`).join('\n')}`;

  // ── Événements détectés ──
  const evenements: EvenementDetecte[] = [];
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

  return {
    synthetique: { phrases },
    detaillee: { causes, consequences, vigilance, positifs },
    recommandations: uniqueRecos,
    textes: { resumeExecutif, cofi, ca, noteInterne },
    evenements,
  };
}

/**
 * Génère un contexte structuré pour l'assistant IA (prompt système)
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
${analyse.synthetique.phrases.join('\n')}

Points de vigilance : ${analyse.detaillee.vigilance.join(' / ')}
Points positifs : ${analyse.detaillee.positifs.join(' / ')}
${!data.hasData ? '\n⚠️ Ces données sont simulées (démonstration). Préciser que l\'analyse est indicative.' : ''}`;
}
