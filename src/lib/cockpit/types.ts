/**
 * Types unifiés pour le Cockpit Rectoral.
 */

export type NiveauAlerte = 'rouge' | 'orange' | 'jaune' | 'info';
export type StatutAlerte = 'ouverte' | 'close' | 'ignoree';

export interface AlerteTransverse {
  id: string;
  module_origine: string;
  establishment_id: string | null;
  niveau: NiveauAlerte;
  titre: string;
  description: string | null;
  echeance: string | null;
  statut: StatutAlerte;
  action_url: string | null;
  reference_reglementaire: string | null;
  dedup_key: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

export interface KpiCockpitValeur {
  id: string;
  label: string;
  valeur: string;
  valeurNumerique: number;
  sublabel: string;
  tendance?: 'up' | 'down' | 'flat';
  variationPct?: number;
  niveau: NiveauAlerte | 'success';
  formule: string;
  source: string;
  actionUrl?: string;
}

export interface EpleResume {
  id: string;
  uai: string;
  nom: string;
  type: string;
  ordonnateur: string;
  secretaireGeneral: string;
  scoreCICF: number;
  tresorerie: number;
  joursTresorerie: number;
  fdr: number;
  joursFdr: number;
  creances: number;
  anomalies: number;
  echeancesOuvertes: number;
  voyagesEnCours: number;
  marchesEnCours: number;
}

export interface CockpitDataset {
  generationAt: Date;
  groupement: {
    nom: string;
    rectorat: string;
    academie: string;
    siege: string;
    agentComptable: string;
    fondeDePouvoir: string;
    nbEple: number;
    nbEleves: number;
    nbAgents: number;
  };
  eples: EpleResume[];
  kpis: KpiCockpitValeur[];
  alertes: AlerteTransverse[];
}
