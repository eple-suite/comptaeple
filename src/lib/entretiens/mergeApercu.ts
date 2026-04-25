/**
 * Fusion intelligente d'un aperçu existant (avec choix utilisateur)
 * et d'une nouvelle analyse de la fiche de poste.
 *
 * Objectif : préserver les cases cochées/décochées par l'utilisateur
 * et n'ajouter QUE les nouveautés issues de la ré-analyse.
 */
import type { CritereInjecte } from "./fichePosteParser";

/** Clé d'identification stable d'un critère (insensible aux espaces/casse). */
export function critereKey(c: Pick<CritereInjecte, "source" | "rubrique" | "extrait">): string {
  const e = (c.extrait ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${c.source}|${c.rubrique}|${e}`;
}

export interface MergeReport {
  fusionnes: CritereInjecte[];
  conserves: number;   // critères présents dans l'ancien aperçu et conservés
  nouveaux: number;    // critères présents uniquement dans la nouvelle analyse
  obsoletes: number;   // critères de l'ancien qui n'existent plus (retirés)
}

/**
 * Fusionne un aperçu existant et un aperçu fraîchement analysé.
 * Règle :
 *  - Si un critère existe dans `ancien`, on garde **son `selectionne`** d'origine.
 *  - Sinon, on l'ajoute tel que la nouvelle analyse l'a généré (= nouveauté).
 *  - Les critères de l'ancien qui n'existent plus dans la nouvelle analyse sont
 *    retirés (la fiche a été modifiée et ils ne sont plus pertinents).
 */
export function mergeApercuPreservant(
  ancien: CritereInjecte[],
  frais: CritereInjecte[],
): MergeReport {
  const ancienByKey = new Map<string, CritereInjecte>();
  ancien.forEach((c) => ancienByKey.set(critereKey(c), c));

  const fraisKeys = new Set<string>();
  let conserves = 0;
  let nouveaux = 0;

  const fusionnes: CritereInjecte[] = frais.map((f) => {
    const k = critereKey(f);
    fraisKeys.add(k);
    const a = ancienByKey.get(k);
    if (a) {
      conserves++;
      // On respecte le choix utilisateur précédent, mais on rafraîchit la confiance
      // (issue de la nouvelle analyse) qui peut avoir évolué si le texte a changé.
      return { ...f, selectionne: a.selectionne };
    }
    nouveaux++;
    return f;
  });

  let obsoletes = 0;
  ancienByKey.forEach((_v, k) => {
    if (!fraisKeys.has(k)) obsoletes++;
  });

  return { fusionnes, conserves, nouveaux, obsoletes };
}
