/**
 * Parseur de fiche de poste → ventilation automatique vers les rubriques C1-C4.
 *
 * Heuristique réglementaire (décret 2010-888, circulaire MENH1310955C) :
 *  - C1 résultats        : mots-clés liés aux objectifs, livrables, suivi, reporting
 *  - C2 compétences tech : outils (Op@le, SIECLE, GFE…), réglementations, rédaction, langues
 *  - C3 qualités persos  : relations, équipe, écoute, accueil, discrétion, déontologie
 *  - C4 encadrement      : management, équipe, projet, délégation, supervision
 */

import type { RubriqueC, CompetenceNiveau } from "./types";

export interface CritereInjecte {
  source: "missions_principales" | "activites" | "competences_requises" | "intitule";
  rubrique: RubriqueC;
  texte: string;
  /** Texte original abrégé pour l'aperçu */
  extrait: string;
  /** Score de confiance heuristique 0-1 (nb de mots-clés détectés). */
  confiance: number;
  /** Inclus par défaut dans la grille finale. */
  selectionne: boolean;
}

const KEYWORDS: Record<RubriqueC, RegExp[]> = {
  C1_resultats: [
    /\bobjectif/i, /\blivrabl/i, /\brésultat/i, /\bproductivit/i, /\bdélai/i,
    /\bproduct/i, /\bautonom/i, /\binitiativ/i, /\bsuivi\b/i, /\breporting/i,
    /\bperforman/i, /\bqualité du travail/i, /\bréalis/i, /\bélabor/i,
  ],
  C2_competences_techniques: [
    /\bop@?le\b/i, /\bsiecle/i, /\bgfe\b/i, /\bgfc\b/i, /\bsofi\b/i, /\bdems\b/i,
    /\bcomptab/i, /\bbudget/i, /\bmarché public/i, /\bgbcp/i, /\binstruction (codificatrice|m9-?6)/i,
    /\brédact/i, /\bmaîtri/i, /\binformatiqu/i, /\bbureautiqu/i, /\boutil/i,
    /\bréglementai/i, /\bjuridiqu/i, /\bnorme/i, /\bcode (de l'éducation|général)/i,
    /\blangue/i, /\banglais/i, /\bcréole/i, /\bexcel\b/i, /\bsuite (office|libre)/i,
    /\btechniqu/i, /\bprocédur/i, /\bpolyvalen/i,
  ],
  C3_qualites_personnelles: [
    /\baccueil/i, /\busager/i, /\bpublic/i, /\béquipe/i, /\bcollabor/i, /\bcoopér/i,
    /\bécout/i, /\brelationnel/i, /\bdiscrétion/i, /\bdéontolog/i, /\bservice public/i,
    /\badaptat/i, /\bréactiv/i, /\bponctualit/i, /\bassidu/i, /\bstress/i,
    /\bnégoci/i, /\bsens (du|de)/i, /\bimplic/i, /\bengag/i,
  ],
  C4_encadrement: [
    /\bencadr/i, /\bmanage/i, /\béquip/i, /\bdélég/i, /\banim(at|er) /i,
    /\bpilot/i, /\bsupervis/i, /\bconduit(e|re) de projet/i, /\bproje[tx]/i,
    /\bfix(er|ation des) objectif/i, /\bresponsabilité/i, /\bcoordin/i,
    /\btuteur|tutorat/i, /\bformat(ion|er) (de|des) (agent|stagiaire)/i,
  ],
};

/** Sépare un bloc de texte en items (lignes, puces, points-virgules). */
export function splitItems(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[\n;•·\-–—]\s*|(?<=\.)\s+(?=[A-ZÉÈÀÔ])/g)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4 && l.length <= 220);
}

/** Évalue à quelle rubrique un item appartient (rubrique gagnante + score). */
export function classifyItem(item: string): { rubrique: RubriqueC; confiance: number; rubriqueScores: Record<RubriqueC, number> } {
  const scores = {
    C1_resultats: 0,
    C2_competences_techniques: 0,
    C3_qualites_personnelles: 0,
    C4_encadrement: 0,
  } as Record<RubriqueC, number>;

  (Object.keys(KEYWORDS) as RubriqueC[]).forEach((r) => {
    KEYWORDS[r].forEach((re) => {
      if (re.test(item)) scores[r]++;
    });
  });

  let best: RubriqueC = "C2_competences_techniques";
  let bestScore = -1;
  (Object.keys(scores) as RubriqueC[]).forEach((r) => {
    if (scores[r] > bestScore) { best = r; bestScore = scores[r]; }
  });

  const total = bestScore;
  const confiance = total === 0 ? 0.2 : Math.min(1, 0.4 + total * 0.2);
  return { rubrique: best, confiance, rubriqueScores: scores };
}

/** Tronque pour l'aperçu UI. */
function abr(s: string, max = 100): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

export interface FichePosteSnapshot {
  intitule?: string;
  missions_principales?: string | null;
  activites?: string | null;
  competences_requises?: string | null;
}

/** Analyse complète : retourne tous les critères injectables avec leur classification. */
export function analyserFichePoste(fp: FichePosteSnapshot): CritereInjecte[] {
  const out: CritereInjecte[] = [];

  const sources: Array<[CritereInjecte["source"], string | null | undefined]> = [
    ["missions_principales", fp.missions_principales],
    ["activites", fp.activites],
    ["competences_requises", fp.competences_requises],
  ];

  for (const [src, raw] of sources) {
    const items = splitItems(raw);
    for (const it of items) {
      const { rubrique, confiance } = classifyItem(it);
      out.push({
        source: src,
        rubrique,
        texte: it,
        extrait: abr(it),
        confiance,
        selectionne: confiance >= 0.4, // par défaut on coche ceux avec ≥ 1 mot-clé
      });
    }
  }

  // Limite raisonnable : max 4 par rubrique pour ne pas inonder la grille
  const parRubrique = new Map<RubriqueC, CritereInjecte[]>();
  out.forEach((c) => {
    const list = parRubrique.get(c.rubrique) ?? [];
    list.push(c);
    parRubrique.set(c.rubrique, list);
  });
  const limited: CritereInjecte[] = [];
  parRubrique.forEach((list) => {
    list.sort((a, b) => b.confiance - a.confiance);
    list.slice(0, 4).forEach((c) => limited.push(c));
    list.slice(4).forEach((c) => limited.push({ ...c, selectionne: false }));
  });
  return limited;
}

/** Convertit la sélection finale en compétences ajoutées à la grille pré-remplie. */
export function appliquerSelection(
  injectes: CritereInjecte[]
): Record<RubriqueC, { critere: string; niveau: CompetenceNiveau; commentaire: string }[]> {
  const out: Record<RubriqueC, { critere: string; niveau: CompetenceNiveau; commentaire: string }[]> = {
    C1_resultats: [],
    C2_competences_techniques: [],
    C3_qualites_personnelles: [],
    C4_encadrement: [],
  };
  injectes.filter((c) => c.selectionne).forEach((c) => {
    out[c.rubrique].push({
      critere: `[Fiche de poste] ${c.texte}`,
      niveau: "satisfaisant",
      commentaire: "",
    });
  });
  return out;
}

export const SOURCE_LABELS: Record<CritereInjecte["source"], string> = {
  missions_principales: "Missions principales",
  activites: "Activités",
  competences_requises: "Compétences requises",
  intitule: "Intitulé",
};