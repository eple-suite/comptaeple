/**
 * hyperaleComparateur — Calcul automatique des variations, tendances et niveaux
 * des indicateurs financiers HYPER@LE.
 *
 * Utilisé par : Accueil, Analyse complète, moteur IA, Data Journal.
 */

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface ComparateurInput {
  valeur: number;
  valeurPrecedente: number | null;
  seuilCritique: number;
  seuilSatisfaisant: number;
}

export type Tendance = 'hausse' | 'baisse' | 'stable';
export type Niveau = 'critique' | 'surveiller' | 'satisfaisant';
export type CouleurNiveau = 'red' | 'orange' | 'green';

export interface ComparateurResult {
  variationPourcentage: number | null;
  variationTexte: string;
  tendance: Tendance;
  niveau: Niveau;
  couleur: CouleurNiveau;
}

/* ═══════════════════════════════════════════════════════════
   Logique principale
   ═══════════════════════════════════════════════════════════ */

export function comparer(input: ComparateurInput): ComparateurResult {
  const { valeur, valeurPrecedente, seuilCritique, seuilSatisfaisant } = input;

  // ── Variation ──
  let variationPourcentage: number | null = null;
  let variationTexte = 'pas de référence';
  let tendance: Tendance = 'stable';

  if (valeurPrecedente != null && valeurPrecedente !== 0) {
    variationPourcentage = (valeur - valeurPrecedente) / Math.abs(valeurPrecedente);

    if (variationPourcentage < -0.10) {
      variationTexte = 'baisse significative';
    } else if (variationPourcentage < -0.03) {
      variationTexte = 'baisse modérée';
    } else if (variationPourcentage > 0.10) {
      variationTexte = 'hausse notable';
    } else if (variationPourcentage > 0.03) {
      variationTexte = 'hausse modérée';
    } else {
      variationTexte = 'stable';
    }

    tendance = variationPourcentage < 0 ? 'baisse' : variationPourcentage > 0 ? 'hausse' : 'stable';
  }

  // ── Niveau ──
  let niveau: Niveau;
  if (valeur < seuilCritique) {
    niveau = 'critique';
  } else if (valeur < seuilSatisfaisant) {
    niveau = 'surveiller';
  } else {
    niveau = 'satisfaisant';
  }

  // ── Couleur ──
  const couleur: CouleurNiveau = niveau === 'critique' ? 'red' : niveau === 'surveiller' ? 'orange' : 'green';

  return { variationPourcentage, variationTexte, tendance, niveau, couleur };
}

/* ═══════════════════════════════════════════════════════════
   Helpers — Messages automatiques
   ═══════════════════════════════════════════════════════════ */

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} %`;

const NIVEAU_LABEL: Record<Niveau, string> = {
  critique: 'Niveau critique',
  surveiller: 'Niveau à surveiller',
  satisfaisant: 'Niveau satisfaisant',
};

/**
 * Génère un message pédagogique court.
 * Ex : "FDR en baisse significative (-12,0 %). Niveau à surveiller."
 */
export function messageComparateur(label: string, result: ComparateurResult): string {
  const variation = result.variationPourcentage != null
    ? `${result.variationTexte} (${fmtPct(result.variationPourcentage)})`
    : result.variationTexte;
  return `${label} en ${variation}. ${NIVEAU_LABEL[result.niveau]}.`;
}

/* ═══════════════════════════════════════════════════════════
   Batch — compare les 4 indicateurs principaux d'un coup
   ═══════════════════════════════════════════════════════════ */

export type IndicateurKey = 'fdr' | 'caf' | 'tresorerie' | 'reserves';

export interface BatchInput {
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
    cafCritique?: number;
    cafSatisfaisant?: number;
    resCritique?: number;
    resSatisfaisant?: number;
  };
}

export interface BatchResult {
  fdr: ComparateurResult;
  caf: ComparateurResult;
  tresorerie: ComparateurResult;
  reserves: ComparateurResult;
  messages: Record<IndicateurKey, string>;
}

export function comparerBatch(input: BatchInput): BatchResult {
  const fdr = comparer({
    valeur: input.fdr,
    valeurPrecedente: input.fdrPrev,
    seuilCritique: input.seuils.fdrCritique,
    seuilSatisfaisant: input.seuils.fdrSatisfaisant,
  });

  const caf = comparer({
    valeur: input.caf,
    valeurPrecedente: input.cafPrev,
    seuilCritique: input.seuils.cafCritique ?? -1,
    seuilSatisfaisant: input.seuils.cafSatisfaisant ?? 0,
  });

  const tresorerie = comparer({
    valeur: input.tresorerie,
    valeurPrecedente: input.tresPrev,
    seuilCritique: input.seuils.tresCritique,
    seuilSatisfaisant: input.seuils.tresSatisfaisant,
  });

  const reserves = comparer({
    valeur: input.reserves,
    valeurPrecedente: input.resPrev,
    seuilCritique: input.seuils.resCritique ?? 0,
    seuilSatisfaisant: input.seuils.resSatisfaisant ?? 10000,
  });

  return {
    fdr,
    caf,
    tresorerie,
    reserves,
    messages: {
      fdr: messageComparateur('FDR', fdr),
      caf: messageComparateur('CAF', caf),
      tresorerie: messageComparateur('Trésorerie', tresorerie),
      reserves: messageComparateur('Réserves', reserves),
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   Tailwind-compatible color mapping
   ═══════════════════════════════════════════════════════════ */

export function couleurToClass(couleur: CouleurNiveau, type: 'text' | 'bg' | 'border' = 'text'): string {
  const map: Record<CouleurNiveau, Record<string, string>> = {
    red: { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
    orange: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  };
  return map[couleur][type] || '';
}
