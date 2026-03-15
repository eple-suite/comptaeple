/**
 * Moteur d'ingénierie budgétaire — Voyages scolaires
 * Règle d'or : Recettes = Dépenses (interdiction de profit sur les familles)
 * Conformité : Code de la Commande Publique + M9.6
 */

export interface BudgetValidation {
  equilibre: boolean;
  solde: number;
  totalRecettes: number;
  totalDepenses: number;
  erreurs: string[];
  avertissements: string[];
  participationSuggestion: number | null;
}

export interface VoyageBudgetData {
  nbEleves: number;
  nbAccompagnateurs?: number;
  participationFamilles: number;
  subventionCollectivite: number;
  subventionEtat: number;
  subventionAutre: number;
  autofinancement: number;
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  divers: number;
  regieAvances?: number;
}

/**
 * Règles M9-6 + Code de la commande publique (seuils 2026) :
 * - auto_balance : recettes_totales == depenses_totales
 * - zero_profit : participation_familles <= cout_reel_voyage
 * - seuil_dispense : 40 000 € HT (60 000 € HT à compter du 01/04/2026 — Décret n°2025-1386)
 * - Circulaire du 16 juillet 2024 (remplace circulaire n°2011-117 du 3 août 2011)
 */
export const LOGIC_M96 = {
  auto_balance: 'recettes_totales == depenses_totales',
  zero_profit: 'participation_familles <= cout_reel_voyage',
  seuil_dispense: 40000, // 60 000 € HT à compter du 01/04/2026
} as const;

/**
 * Calcule l'équilibre budgétaire strict
 * Règle : Total Recettes = Total Dépenses (pas de profit sur familles)
 */
export function validerEquilibreBudgetaire(data: VoyageBudgetData): BudgetValidation {
  const totalSubventions = (data.subventionCollectivite || 0) + (data.subventionEtat || 0) + (data.subventionAutre || 0);
  const totalRecettes = data.participationFamilles + totalSubventions + (data.autofinancement || 0);
  const totalDepenses = data.transport + data.hebergement + data.restauration +
    data.activites + data.assurance + data.divers + (data.regieAvances || 0);

  const solde = totalRecettes - totalDepenses;
  const erreurs: string[] = [];
  const avertissements: string[] = [];

  // Règle 1 : auto_balance — Recettes > Dépenses → profit interdit sur familles
  if (solde > 0.01) {
    erreurs.push(
      `Excédent de ${formatEuro(solde)} : les recettes dépassent les dépenses. ` +
      `Interdiction de réaliser un bénéfice sur la participation des familles (BO n°2 du 13/01/2005).`
    );
  }

  // Règle 2 : auto_balance — Dépenses > Recettes → budget déséquilibré
  if (solde < -0.01) {
    avertissements.push(
      `Déficit de ${formatEuro(Math.abs(solde))} : les dépenses dépassent les recettes. ` +
      `La charge résiduelle doit être imputée sur les fonds propres de l'établissement (FDR).`
    );
  }

  // Règle 3 : zero_profit — participation familles ne peut pas excéder le coût réel
  if (data.participationFamilles > totalDepenses && totalDepenses > 0) {
    erreurs.push(
      `La participation des familles (${formatEuro(data.participationFamilles)}) excède le coût réel du voyage (${formatEuro(totalDepenses)}). ` +
      `Règle M9-6 : zero_profit — aucune marge ne peut être réalisée sur les familles.`
    );
  }

  // Suggestion de participation par élève pour équilibrer
  let participationSuggestion: number | null = null;
  if (data.nbEleves > 0 && totalDepenses > 0) {
    const resteAFinancer = totalDepenses - totalSubventions - (data.autofinancement || 0);
    if (resteAFinancer > 0) {
      participationSuggestion = Math.ceil(resteAFinancer / data.nbEleves * 100) / 100;
    }
  }

  // Vérification régie
  if ((data.regieAvances || 0) > 0 && (data.regieAvances || 0) > totalDepenses * 0.15) {
    avertissements.push(
      `La régie d'avances (${formatEuro(data.regieAvances || 0)}) dépasse 15% du budget total. ` +
      `Vérifiez la conformité avec les décrets n°2019-798 et n°2020-922.`
    );
  }

  return {
    equilibre: Math.abs(solde) < 0.01,
    solde,
    totalRecettes,
    totalDepenses,
    erreurs,
    avertissements,
    participationSuggestion,
  };
}

/**
 * Calcule la participation suggérée par élève pour atteindre l'équilibre
 * Formule : Coût Total / (Nb élèves + Nb accompagnateurs) = Participation individuelle
 */
export function calculerParticipationEquilibre(data: VoyageBudgetData): number {
  const totalSubventions = (data.subventionCollectivite || 0) + (data.subventionEtat || 0) + (data.subventionAutre || 0);
  const totalDepenses = data.transport + data.hebergement + data.restauration +
    data.activites + data.assurance + data.divers + (data.regieAvances || 0);
  const resteAFinancer = totalDepenses - totalSubventions - (data.autofinancement || 0);
  const totalParticipants = (data.nbEleves || 0) + (data.nbAccompagnateurs || 0);
  if (totalParticipants <= 0 || resteAFinancer <= 0) return 0;
  return Math.ceil(resteAFinancer / totalParticipants * 100) / 100;
}

/**
 * Calcule le coût par participant (élèves + accompagnateurs)
 */
export function calculerCoutParParticipant(data: VoyageBudgetData): {
  coutParParticipant: number;
  partFamilles: number;
  partEtablissementAccomp: number;
  totalParticipants: number;
} {
  const totalDepenses = data.transport + data.hebergement + data.restauration +
    data.activites + data.assurance + data.divers + (data.regieAvances || 0);
  const totalParticipants = (data.nbEleves || 0) + (data.nbAccompagnateurs || 0);
  const coutParParticipant = totalParticipants > 0 ? totalDepenses / totalParticipants : 0;
  const partFamilles = data.nbEleves > 0 && data.participationFamilles > 0
    ? data.participationFamilles / data.nbEleves : 0;
  // Part des accompagnateurs prise en charge par l'établissement
  const partEtablissementAccomp = coutParParticipant * (data.nbAccompagnateurs || 0);
  return { coutParParticipant, partFamilles, partEtablissementAccomp, totalParticipants };
}

/**
 * Déduction fonds social : réduit automatiquement le reste à payer d'un élève
 */
export function calculerResteApayer(participationDue: number, totalPaye: number, aideFondsSocial: number): number {
  return Math.max(0, participationDue - totalPaye - aideFondsSocial);
}

/**
 * Cumul annuel par catégorie pour tous les voyages de l'exercice
 */
export function cumulerSeuils(voyages: VoyageBudgetData[]): Record<string, number> {
  return {
    transport: voyages.reduce((s, v) => s + v.transport, 0),
    hebergement: voyages.reduce((s, v) => s + v.hebergement, 0),
    restauration: voyages.reduce((s, v) => s + v.restauration, 0),
    activites: voyages.reduce((s, v) => s + v.activites, 0),
    assurance: voyages.reduce((s, v) => s + v.assurance, 0),
    divers: voyages.reduce((s, v) => s + v.divers, 0),
  };
}

/**
 * Vérifie si un seuil CCP est franchi
 */
export const SEUIL_CCP = {
  SANS_PUBLICITE: 40000,
  MAPA: 90000,
  EUROPEEN: 221000,
};

export function evaluerSeuilCCP(montant: number): { niveau: 'ok' | 'warning' | 'danger' | 'critical'; label: string } {
  if (montant >= SEUIL_CCP.EUROPEEN) return { niveau: 'critical', label: 'Seuil européen dépassé — Appel d\'offres obligatoire' };
  if (montant >= SEUIL_CCP.MAPA) return { niveau: 'danger', label: 'MAPA avec publicité obligatoire' };
  if (montant >= SEUIL_CCP.SANS_PUBLICITE) return { niveau: 'warning', label: '3 devis comparatifs obligatoires' };
  return { niveau: 'ok', label: 'Achat libre' };
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}
