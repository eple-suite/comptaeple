// =====================================================================
// Moteur d'indicateurs REPROFI 4.6 — Compte financier EPLE
// ---------------------------------------------------------------------
// 10 indicateurs additionnels à la triade FR / BFR / TN :
//   1. Réserves (5 rubriques détaillées)
//   2. Taux de non-recouvrement
//   3. Provisions pour contentieux
//   4. Comptes d'attente provisoires (CAP) anormaux
//   5. Vétusté du parc immobilier
//   6. Dépendance générale aux subventions (DGP)
//   7. Poids des charges fixes
//   8. Capacité d'endettement
//   9. Liquidité immédiate
//  10. Indépendance financière
//
// Sources : REPROFI 4.6, M9-6 tome 4 art. 43231, pièce 14 du compte fi.
// Module PUR — testable hors UI.
// =====================================================================

import type { Balance } from './bilanFinancierEngine';
import { sommeDeb, sommeCred, soldeNetCred } from './bilanFinancierEngine';

export type Niveau = 'critique' | 'fragile' | 'normal' | 'confortable' | 'excellent';

export interface IndicateurReprofi {
  code: string;
  libelle: string;
  valeur: number;
  unite: string;
  niveau: Niveau;
  commentaire: string;
  detail?: Record<string, number>;
}

// ---------------------------------------------------------------------
// 1. RÉSERVES — 5 rubriques (M9-6 tome 4, art. 43231)
// ---------------------------------------------------------------------

export interface DetailReserves {
  reservesGenerales: number;       // 10682
  reservesSRH: number;             // 10681 (service annexe d'hébergement)
  reservesTaxeApprent: number;     // 10683
  reservesAffectees: number;       // 10687
  reservesAutres: number;          // 1068x non listés ci-dessus
  total: number;
}

export function calculerReserves(b: Balance): DetailReserves {
  const r10681 = soldeNetCred(b, '10681');
  const r10682 = soldeNetCred(b, '10682');
  const r10683 = soldeNetCred(b, '10683');
  const r10687 = soldeNetCred(b, '10687');
  // toutes les autres 1068x
  let toutesReserves1068 = 0;
  for (const [k, v] of Object.entries(b)) {
    if (k.startsWith('1068')) toutesReserves1068 += v.solde_cred - v.solde_deb;
  }
  const reservesAutres = toutesReserves1068 - r10681 - r10682 - r10683 - r10687;
  return {
    reservesGenerales: r10682,
    reservesSRH: r10681,
    reservesTaxeApprent: r10683,
    reservesAffectees: r10687,
    reservesAutres,
    total: toutesReserves1068,
  };
}

// ---------------------------------------------------------------------
// 2. TAUX DE NON-RECOUVREMENT
// ---------------------------------------------------------------------
//   Tx_NR = Créances douteuses (416) / Créances totales (411+416)
// Seuils : <2% excellent, 2-5% normal, 5-10% fragile, >10% critique.
// ---------------------------------------------------------------------

export function calculerNonRecouvrement(b: Balance): IndicateurReprofi {
  const douteuses = sommeDeb(b, '416');
  const totales = sommeDeb(b, '411') + douteuses;
  const taux = totales > 0 ? (douteuses / totales) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (taux > 10) niveau = 'critique';
  else if (taux > 5) niveau = 'fragile';
  else if (taux < 2) niveau = 'excellent';
  return {
    code: 'NR', libelle: 'Taux de non-recouvrement',
    valeur: taux, unite: '%', niveau,
    commentaire: `Créances douteuses : ${douteuses.toFixed(0)} € / total : ${totales.toFixed(0)} €`,
    detail: { creancesDouteuses: douteuses, creancesTotales: totales },
  };
}

// ---------------------------------------------------------------------
// 3. PROVISIONS POUR CONTENTIEUX
// ---------------------------------------------------------------------
//   Provisions 1511 (litiges) — montant + ratio sur charges totales.
// ---------------------------------------------------------------------

export function calculerContentieux(b: Balance): IndicateurReprofi {
  const prov = soldeNetCred(b, '1511');
  const charges = sommeDeb(b, '6') - sommeCred(b, '6');
  const ratio = charges > 0 ? (prov / charges) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (ratio > 5) niveau = 'critique';
  else if (ratio > 2) niveau = 'fragile';
  else if (ratio === 0) niveau = 'excellent';
  return {
    code: 'CONT', libelle: 'Provisions contentieux / charges',
    valeur: ratio, unite: '%', niveau,
    commentaire: `Provisions litiges : ${prov.toFixed(0)} €`,
    detail: { provisions: prov, charges },
  };
}

// ---------------------------------------------------------------------
// 4. COMPTES D'ATTENTE PROVISOIRES (CAP) anormaux
// ---------------------------------------------------------------------
//   Solde des comptes 47 (transitoires/attente). Doit être proche de 0.
// ---------------------------------------------------------------------

export function calculerCAP(b: Balance): IndicateurReprofi {
  const cap_d = sommeDeb(b, '47');
  const cap_c = sommeCred(b, '47');
  const solde = Math.abs(cap_d - cap_c);
  let niveau: Niveau = 'excellent';
  if (solde > 50000) niveau = 'critique';
  else if (solde > 10000) niveau = 'fragile';
  else if (solde > 1000) niveau = 'normal';
  return {
    code: 'CAP', libelle: 'Comptes d\'attente provisoires',
    valeur: solde, unite: '€', niveau,
    commentaire: 'Solde net des comptes 47 — doit tendre vers 0 en clôture',
    detail: { debit: cap_d, credit: cap_c },
  };
}

// ---------------------------------------------------------------------
// 5. VÉTUSTÉ DU PARC IMMOBILIER
// ---------------------------------------------------------------------
//   Vétusté = Σ amortissements 28 / Σ immobilisations brutes 21
// Seuils : <30% neuf, 30-60% moyen, 60-80% vieillissant, >80% obsolète.
// ---------------------------------------------------------------------

export function calculerVetuste(b: Balance): IndicateurReprofi {
  const brut = sommeDeb(b, '21');
  const amort = sommeCred(b, '281');
  const taux = brut > 0 ? (amort / brut) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (taux > 80) niveau = 'critique';
  else if (taux > 60) niveau = 'fragile';
  else if (taux < 30) niveau = 'excellent';
  return {
    code: 'VETU', libelle: 'Vétusté du parc immobilier',
    valeur: taux, unite: '%', niveau,
    commentaire: `Immobilisations brutes : ${brut.toFixed(0)} € / amortis : ${amort.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// 6. DÉPENDANCE GÉNÉRALE AUX SUBVENTIONS (DGP)
// ---------------------------------------------------------------------
//   DGP = Subventions (74) / Produits totaux (classe 7)
// ---------------------------------------------------------------------

export function calculerDGP(b: Balance): IndicateurReprofi {
  const subv = sommeCred(b, '74') - sommeDeb(b, '74');
  const produits = sommeCred(b, '7') - sommeDeb(b, '7');
  const taux = produits > 0 ? (subv / produits) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (taux > 80) niveau = 'critique';
  else if (taux > 60) niveau = 'fragile';
  return {
    code: 'DGP', libelle: 'Dépendance générale aux subventions',
    valeur: taux, unite: '%', niveau,
    commentaire: `Subventions (74) : ${subv.toFixed(0)} € / Produits totaux : ${produits.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// 7. POIDS DES CHARGES FIXES
// ---------------------------------------------------------------------
//   ChargesFixes = personnel (64) + impôts (63) + dotations (681)
//   Poids = ChargesFixes / Charges totales (6)
// ---------------------------------------------------------------------

export function calculerChargesFixes(b: Balance): IndicateurReprofi {
  const fixes =
    (sommeDeb(b, '64') - sommeCred(b, '64')) +
    (sommeDeb(b, '63') - sommeCred(b, '63')) +
    (sommeDeb(b, '681') - sommeCred(b, '681'));
  const total = sommeDeb(b, '6') - sommeCred(b, '6');
  const taux = total > 0 ? (fixes / total) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (taux > 75) niveau = 'critique';
  else if (taux > 60) niveau = 'fragile';
  return {
    code: 'CHFIX', libelle: 'Poids des charges fixes',
    valeur: taux, unite: '%', niveau,
    commentaire: `Charges fixes : ${fixes.toFixed(0)} € / Total charges : ${total.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// 8. CAPACITÉ D'ENDETTEMENT
// ---------------------------------------------------------------------
//   Endettement = Emprunts (16) / CAF (×100 — exprimé en années)
// Seuils : <2 ans excellent, 2-5 normal, 5-8 fragile, >8 critique.
// ---------------------------------------------------------------------

export function calculerEndettement(b: Balance, caf: number): IndicateurReprofi {
  const dettes = soldeNetCred(b, '16');
  const annees = caf > 0 ? dettes / caf : (dettes > 0 ? 999 : 0);
  let niveau: Niveau = 'excellent';
  if (annees > 8) niveau = 'critique';
  else if (annees > 5) niveau = 'fragile';
  else if (annees > 2) niveau = 'normal';
  return {
    code: 'ENDET', libelle: 'Capacité d\'endettement (années de CAF)',
    valeur: annees, unite: 'années', niveau,
    commentaire: `Dettes financières : ${dettes.toFixed(0)} € / CAF : ${caf.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// 9. LIQUIDITÉ IMMÉDIATE
// ---------------------------------------------------------------------
//   Liquidité = Disponibilités (51+53+54) / Dettes court-terme (40+42c+43c+44c+46c)
// Seuils : <0.8 critique, 0.8-1.2 fragile, 1.2-2 normal, >2 excellent.
// ---------------------------------------------------------------------

export function calculerLiquidite(b: Balance): IndicateurReprofi {
  const dispo = sommeDeb(b, '51') + sommeDeb(b, '53') + sommeDeb(b, '54');
  const dct =
    sommeCred(b, '40') + sommeCred(b, '42') + sommeCred(b, '43') +
    sommeCred(b, '44') + sommeCred(b, '46');
  const ratio = dct > 0 ? dispo / dct : (dispo > 0 ? 999 : 0);
  let niveau: Niveau = 'normal';
  if (ratio < 0.8) niveau = 'critique';
  else if (ratio < 1.2) niveau = 'fragile';
  else if (ratio > 2) niveau = 'excellent';
  return {
    code: 'LIQ', libelle: 'Liquidité immédiate',
    valeur: ratio, unite: 'ratio', niveau,
    commentaire: `Disponibilités : ${dispo.toFixed(0)} € / DCT : ${dct.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// 10. INDÉPENDANCE FINANCIÈRE
// ---------------------------------------------------------------------
//   Indépendance = Capitaux propres / (Capitaux propres + Dettes financières)
// ---------------------------------------------------------------------

export function calculerIndependance(b: Balance): IndicateurReprofi {
  const cp = soldeNetCred(b, '10') + soldeNetCred(b, '11') + soldeNetCred(b, '12') + soldeNetCred(b, '13');
  const df = soldeNetCred(b, '16');
  const denom = cp + df;
  const ratio = denom > 0 ? (cp / denom) * 100 : 0;
  let niveau: Niveau = 'normal';
  if (ratio < 50) niveau = 'critique';
  else if (ratio < 70) niveau = 'fragile';
  else if (ratio > 90) niveau = 'excellent';
  return {
    code: 'INDEP', libelle: 'Indépendance financière',
    valeur: ratio, unite: '%', niveau,
    commentaire: `Capitaux propres : ${cp.toFixed(0)} € / Dettes financières : ${df.toFixed(0)} €`,
  };
}

// ---------------------------------------------------------------------
// AGRÉGATEUR — tous les indicateurs REPROFI en un appel
// ---------------------------------------------------------------------

export interface PanierReprofi {
  reserves: DetailReserves;
  indicateurs: IndicateurReprofi[];
}

export function calculerTousIndicateursReprofi(b: Balance, caf: number): PanierReprofi {
  return {
    reserves: calculerReserves(b),
    indicateurs: [
      calculerNonRecouvrement(b),
      calculerContentieux(b),
      calculerCAP(b),
      calculerVetuste(b),
      calculerDGP(b),
      calculerChargesFixes(b),
      calculerEndettement(b, caf),
      calculerLiquidite(b),
      calculerIndependance(b),
    ],
  };
}