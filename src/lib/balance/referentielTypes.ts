/**
 * Types du référentiel partagé `comptes_sens_normal_ref`.
 * Utilisé par le moteur d'anomalies, la cartographie, le PDF et le sous-onglet
 * Paramètres balance.
 */

export type SensNormal = 'D' | 'C' | 'nul' | 'D_ou_nul' | 'C_ou_nul' | 'variable';
export type NiveauAlerte = 'critique' | 'majeure' | 'mineure' | 'info';
export type TypeCompte =
  | 'capitaux' | 'immo' | 'amort' | 'stock' | 'tiers_client' | 'tiers_fournisseur'
  | 'etat' | 'collectivite' | 'organisme' | 'attente' | 'financier' | 'charge'
  | 'produit' | 'ordre' | 'liaison' | 'personnel' | 'social' | 'ue';

export interface CompteRef {
  compte: string;
  libelle: string;
  classe: number;
  sous_classe: string;
  sens_normal: SensNormal;
  sens_cloture: SensNormal;
  despecialisable: boolean;
  type_compte: TypeCompte;
  niveau_alerte_si_anormal: NiveauAlerte;
  message_alerte: string;
  cause_probable: string;
  action_corrective: string;
  reference_m96: string;
  actif: boolean;
}

export interface BalanceLigne {
  compte: string;
  libelle?: string;
  debit: number;
  credit: number;
  solde: number; // signé : >0 débiteur, <0 créditeur, 0 nul
}

export type Periode = 'cours' | 'cloture';

/** Détecte le sens réel d'un solde signé. */
export function sensReel(solde: number): 'D' | 'C' | 'nul' {
  if (Math.abs(solde) < 0.01) return 'nul';
  return solde > 0 ? 'D' : 'C';
}

/** Vérifie si un sens réel est conforme au sens normal attendu. */
export function sensConforme(reel: 'D' | 'C' | 'nul', attendu: SensNormal): boolean {
  if (attendu === 'variable') return true;
  if (attendu === reel) return true;
  if (attendu === 'D_ou_nul') return reel === 'D' || reel === 'nul';
  if (attendu === 'C_ou_nul') return reel === 'C' || reel === 'nul';
  return false;
}