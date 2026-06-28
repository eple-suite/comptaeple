// Moteur Logements — consommations, décompte de charges, report d'index N→N+1.
import type { Logement, ReleveConso, ConsoCalcul, DecompteCharges, Fluide } from "./types";

export const consoCalcul = (r: ReleveConso): ConsoCalcul => {
  const conso = Math.max(0, (r.indexFinal || 0) - (r.indexInitial || 0));
  return { fluide: r.fluide, conso, montant: conso * (r.prixUnitaire || 0) };
};

/** Décompte annuel : charges réelles (relevés) vs provisions appelées → régularisation. */
export function decompteAnnuel(logement: Logement, releves: ReleveConso[], annee: number): DecompteCharges {
  const details = releves
    .filter((r) => r.logementId === logement.id && r.annee === annee)
    .map(consoCalcul);
  const chargesReelles = details.reduce((s, d) => s + d.montant, 0);
  const provisionsAppelees = (logement.provisionsChargesMensuelles || 0) * 12;
  return { annee, details, chargesReelles, provisionsAppelees, regularisation: chargesReelles - provisionsAppelees };
}

/** Report automatique : l'index final de N devient l'index initial de N+1 (par fluide). */
export function indexInitialReporte(releves: ReleveConso[], logementId: string, fluide: Fluide, annee: number): number | undefined {
  const prec = releves.find((r) => r.logementId === logementId && r.fluide === fluide && r.annee === annee - 1);
  return prec?.indexFinal;
}

/** Années présentes dans les relevés d'un logement (tri décroissant). */
export function anneesReleves(releves: ReleveConso[], logementId: string): number[] {
  return Array.from(new Set(releves.filter((r) => r.logementId === logementId).map((r) => r.annee))).sort((a, b) => b - a);
}

/** Montant d'un titre exécutoire / ordre de recettes (redevance + provisions de charges). */
export function montantTitre(logement: Logement, mois = 12): { redevance: number; charges: number; total: number } {
  const redevance = (logement.redevanceMensuelle || 0) * mois;
  const charges = (logement.provisionsChargesMensuelles || 0) * mois;
  return { redevance, charges, total: redevance + charges };
}
