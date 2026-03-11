// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Types & Constantes
// Conforme DAF A3 & M9-6
// ═══════════════════════════════════════════════════════════════

export const SEUIL_CRITIQUE_JOURS = 30;
export const SEUIL_ATTENTION_JOURS = 60;
export const SEUIL_CONFORT_JOURS = 90;

export interface DonneesFinancieres {
  immobilisationsNettes: number;
  dotationsReserves: number;
  reportANouveau: number;
  resultatExercice: number;
  subventionsInvestissement: number;
  provisionsRisques: number;
  emprunts: number;
  stocks: number;
  creancesClients: number;
  autresCreances: number;
  disponibilites: number;
  dettesFournisseurs: number;
  autresDettes: number;
  produitsConstatesAvance: number;
  chargesAnnuelles: number;
  resteAMandater: number;
  commandesNonSoldees: number;
}

export interface Prelevement {
  id: string;
  dateCA: string;
  numeroDBM: string;
  objet: string;
  codeActivite: string;
  montantVote: number;
  montantExecute: number;
  statut: 'vote' | 'en_cours' | 'execute';
}

export interface ResultatAnalyse {
  fondsRoulement: number;
  besoinFondsRoulement: number;
  tresorerieNette: number;
  fondsRoulementMobilisable: number;
  joursfonctionnement: number;
  seuilCritique: number;
  margePrelevement: number;
  ratioLiquidite: number;
  tauxCouvertureBFR: number;
  indicateurSante: 'excellent' | 'bon' | 'attention' | 'critique';
}

export type HealthLevel = 'excellent' | 'bon' | 'attention' | 'critique';

export function calculerAnalyse(donnees: DonneesFinancieres, prelevements: Prelevement[]): ResultatAnalyse {
  const capitauxPermanents =
    donnees.dotationsReserves + donnees.reportANouveau + donnees.resultatExercice +
    donnees.subventionsInvestissement + donnees.provisionsRisques + donnees.emprunts;

  const fondsRoulement = capitauxPermanents - donnees.immobilisationsNettes;

  const actifCirculantHT = donnees.stocks + donnees.creancesClients + donnees.autresCreances;
  const passifCirculantHT = donnees.dettesFournisseurs + donnees.autresDettes + donnees.produitsConstatesAvance;
  const besoinFondsRoulement = actifCirculantHT - passifCirculantHT;
  const tresorerieNette = fondsRoulement - besoinFondsRoulement;

  const engagementsNonSoldes = donnees.resteAMandater + donnees.commandesNonSoldees;
  const fondsRoulementMobilisable = Math.max(0,
    fondsRoulement - donnees.stocks - donnees.creancesClients - donnees.provisionsRisques - engagementsNonSoldes
  );

  const totalPrelevementsVotes = prelevements
    .filter(p => p.statut !== 'execute')
    .reduce((acc, p) => acc + p.montantVote, 0);

  const fdrApresPrelevements = fondsRoulementMobilisable - totalPrelevementsVotes;
  const chargesJournalieres = donnees.chargesAnnuelles / 365;
  const joursfonctionnement = chargesJournalieres > 0 ? fdrApresPrelevements / chargesJournalieres : 0;
  const seuilCritique = chargesJournalieres * SEUIL_CRITIQUE_JOURS;
  const margePrelevement = Math.max(0, fondsRoulementMobilisable - seuilCritique);

  const ratioLiquidite = passifCirculantHT > 0
    ? (donnees.disponibilites + donnees.creancesClients) / passifCirculantHT : 0;
  const tauxCouvertureBFR = besoinFondsRoulement > 0
    ? (fondsRoulement / besoinFondsRoulement) * 100 : 100;

  let indicateurSante: HealthLevel;
  if (joursfonctionnement >= SEUIL_CONFORT_JOURS) indicateurSante = 'excellent';
  else if (joursfonctionnement >= SEUIL_ATTENTION_JOURS) indicateurSante = 'bon';
  else if (joursfonctionnement >= SEUIL_CRITIQUE_JOURS) indicateurSante = 'attention';
  else indicateurSante = 'critique';

  return {
    fondsRoulement, besoinFondsRoulement, tresorerieNette,
    fondsRoulementMobilisable, joursfonctionnement, seuilCritique,
    margePrelevement, ratioLiquidite, tauxCouvertureBFR, indicateurSante,
  };
}
