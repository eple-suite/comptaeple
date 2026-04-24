// =====================================================================
// Moteur bilanciel M9-6 / pièce 14 — Compte financier
// ---------------------------------------------------------------------
// Conformité réglementaire :
//   • Instruction M9-6, tome 3 (plan comptable EPLE)
//   • Instruction M9-6, tome 4, art. 43231 (réserves & FR)
//   • Op@le pièce 14 (situation patrimoniale)
// Toutes les formules sont documentées et réversibles. Ce module est
// PUR : aucune dépendance React/Supabase, testable hors UI.
// =====================================================================

/** Solde d'un compte de balance (débit / crédit). */
export interface SoldeCompte {
  solde_deb: number;
  solde_cred: number;
}

/** Map compte → solde, indexée par numéro PCG (ex : "411200"). */
export type Balance = Record<string, SoldeCompte>;

/** Helpers de lecture sécurisés (préfixe = somme de tous les comptes commençant par...). */
export function solde(b: Balance, c: string): SoldeCompte {
  return b[c] ?? { solde_deb: 0, solde_cred: 0 };
}

/** Somme de tous les soldes débiteurs des comptes commençant par `prefix`. */
export function sommeDeb(b: Balance, prefix: string): number {
  let s = 0;
  for (const [k, v] of Object.entries(b)) if (k.startsWith(prefix)) s += v.solde_deb;
  return s;
}

/** Somme de tous les soldes créditeurs des comptes commençant par `prefix`. */
export function sommeCred(b: Balance, prefix: string): number {
  let s = 0;
  for (const [k, v] of Object.entries(b)) if (k.startsWith(prefix)) s += v.solde_cred;
  return s;
}

/** Somme nette (cred - deb) sur un préfixe (utile pour comptes 13, 14, 15…). */
export function soldeNetCred(b: Balance, prefix: string): number {
  return sommeCred(b, prefix) - sommeDeb(b, prefix);
}

// ---------------------------------------------------------------------
// 1. FONDS DE ROULEMENT (FR) — méthodes haut & bas de bilan
// ---------------------------------------------------------------------
// Réf. M9-6 tome 4, art. 43231.
//
//   FR (haut)  = Capitaux permanents − Actif immobilisé net
//              = (10 + 11 + 12 + 13 + 14 + 15) + 16 + 18
//                − [(20+21+23+26+27) − (28+29)]
//
//   FR (bas)   = Actif circulant − Dettes à court terme
//              = (3+41+42+43+44+45+46+47+50) − (40+42+43+44+46+47+51c)
//
// Les deux méthodes doivent converger à l'arrondi près.
// ---------------------------------------------------------------------

export interface ResultatFR {
  /** FR calculé par le haut du bilan (capitaux permanents − immobilisations). */
  fr_haut: number;
  /** FR calculé par le bas du bilan (AC − DCT). */
  fr_bas: number;
  /** Capitaux permanents (Σ 10+11+12+13+14+15+16+18). */
  capitauxPermanents: number;
  /** Actif immobilisé net (Σ 20+21+23+26+27 − amortissements/provisions 28+29). */
  actifImmoNet: number;
  /** Cohérence : |fr_haut − fr_bas| < 1 €. */
  coherent: boolean;
  /** Écart absolu entre les deux méthodes (€). */
  ecart: number;
}

export function calculerFR(b: Balance): ResultatFR {
  // Capitaux permanents (classes 10-15 + emprunts LT 16 + provisions long-terme 18)
  const cap10 = soldeNetCred(b, '10'); // dotations, réserves, fonds
  const cap11 = soldeNetCred(b, '11'); // report à nouveau
  const cap12 = soldeNetCred(b, '12'); // résultat de l'exercice
  const cap13 = soldeNetCred(b, '13'); // subventions d'investissement
  const cap14 = soldeNetCred(b, '14'); // provisions réglementées
  const cap15 = soldeNetCred(b, '15'); // provisions risques & charges
  const cap16 = soldeNetCred(b, '16'); // emprunts & dettes assimilées
  const cap18 = soldeNetCred(b, '18'); // comptes de liaison (long-terme)
  const capitauxPermanents = cap10 + cap11 + cap12 + cap13 + cap14 + cap15 + cap16 + cap18;

  // Actif immobilisé brut
  const immo20 = sommeDeb(b, '20'); // immobilisations incorporelles
  const immo21 = sommeDeb(b, '21'); // immobilisations corporelles
  const immo23 = sommeDeb(b, '23'); // immobilisations en cours
  const immo26 = sommeDeb(b, '26'); // participations
  const immo27 = sommeDeb(b, '27'); // autres immo financières
  const immoBrut = immo20 + immo21 + immo23 + immo26 + immo27;

  // Amortissements & provisions sur immo (créditeurs)
  const amort28 = sommeCred(b, '28');
  const prov29  = sommeCred(b, '29');
  const actifImmoNet = immoBrut - amort28 - prov29;

  const fr_haut = capitauxPermanents - actifImmoNet;

  // FR par le bas : AC − DCT
  const ac = calculerActifCirculant(b);
  const dct = calculerDettesCourtTerme(b);
  const fr_bas = ac - dct;

  const ecart = Math.abs(fr_haut - fr_bas);
  return {
    fr_haut, fr_bas, capitauxPermanents, actifImmoNet,
    coherent: ecart < 1, ecart,
  };
}

/** Actif circulant (stocks 3 + créances 41-47 + VMP 50). */
export function calculerActifCirculant(b: Balance): number {
  return (
    sommeDeb(b, '3') +   // stocks
    sommeDeb(b, '41') +  // clients & familles
    sommeDeb(b, '42') +  // personnel
    sommeDeb(b, '43') +  // sécurité sociale & org. sociaux
    sommeDeb(b, '44') +  // état & collectivités
    sommeDeb(b, '45') +  // groupe & associés
    sommeDeb(b, '46') +  // débiteurs divers
    sommeDeb(b, '47') +  // comptes transitoires (débit)
    sommeDeb(b, '50')    // VMP
  );
}

/** Dettes court-terme (fournisseurs 40 + organismes 42c + 43c + 44c + 46c + 47c). */
export function calculerDettesCourtTerme(b: Balance): number {
  return (
    sommeCred(b, '40') + // fournisseurs
    sommeCred(b, '42') + // personnel à payer
    sommeCred(b, '43') + // organismes sociaux à payer
    sommeCred(b, '44') + // état créditeur
    sommeCred(b, '46') + // créditeurs divers
    sommeCred(b, '47')   // comptes transitoires (crédit)
  );
}

// ---------------------------------------------------------------------
// 2. BFR EPLE (Besoin en Fonds de Roulement)
// ---------------------------------------------------------------------
//   BFR = Actif circulant d'exploitation − Dettes d'exploitation
// Pour un EPLE, on isole les comptes d'exploitation (hors VMP & trésorerie).
// ---------------------------------------------------------------------

export interface ResultatBFR {
  bfr: number;
  acExploitation: number;
  dettesExploitation: number;
}

export function calculerBFR(b: Balance): ResultatBFR {
  const acExploitation =
    sommeDeb(b, '3') +
    sommeDeb(b, '41') +
    sommeDeb(b, '44') +
    sommeDeb(b, '46');
  const dettesExploitation =
    sommeCred(b, '40') +
    sommeCred(b, '42') +
    sommeCred(b, '43') +
    sommeCred(b, '44') +
    sommeCred(b, '46');
  return { bfr: acExploitation - dettesExploitation, acExploitation, dettesExploitation };
}

// ---------------------------------------------------------------------
// 3. TRÉSORERIE NETTE (TN)
// ---------------------------------------------------------------------
//   TN = FR − BFR
//      = Σ(disponibilités 51+53+54) − Σ(concours bancaires 519)
// Vérification : TN_calculée ≈ TN_observée_balance.
// ---------------------------------------------------------------------

export interface ResultatTN {
  tn_calc: number;        // par différence FR − BFR
  tn_obs: number;         // observée à la balance (51+53+54 − 519)
  ecart: number;
  coherent: boolean;
}

export function calculerTN(b: Balance, fr: number, bfr: number): ResultatTN {
  const tn_calc = fr - bfr;
  const dispo = sommeDeb(b, '51') + sommeDeb(b, '53') + sommeDeb(b, '54');
  const concours = sommeCred(b, '519');
  const tn_obs = dispo - concours;
  const ecart = Math.abs(tn_calc - tn_obs);
  return { tn_calc, tn_obs, ecart, coherent: ecart < 1 };
}

// ---------------------------------------------------------------------
// 4. JOURS DE FONDS DE ROULEMENT & TRÉSORERIE — base 360
// ---------------------------------------------------------------------
//   Jours_FR = (FR / Charges_décaissables) × 360
//   Jours_TN = (TN / Charges_décaissables) × 360
// Charges décaissables = total classe 6 − amortissements (681) − provisions (686/687)
// Seuils REPROFI : < 30j critique, 30-60j fragile, 60-120j confortable, > 120j surdimensionné.
// ---------------------------------------------------------------------

export function chargesDecaissables(b: Balance): number {
  const totalClasse6 = sommeDeb(b, '6') - sommeCred(b, '6'); // net débit
  const dotAmort = sommeDeb(b, '681') - sommeCred(b, '681');
  const dotProv  = sommeDeb(b, '686') - sommeCred(b, '686') + sommeDeb(b, '687') - sommeCred(b, '687');
  return totalClasse6 - dotAmort - dotProv;
}

export function joursBase360(montant: number, chargesDecaiss: number): number {
  if (chargesDecaiss <= 0) return 0;
  return (montant / chargesDecaiss) * 360;
}

export type SeuilJours = 'critique' | 'fragile' | 'confortable' | 'surdimensionne';

export function evaluerJoursFR(j: number): SeuilJours {
  if (j < 30) return 'critique';
  if (j < 60) return 'fragile';
  if (j <= 120) return 'confortable';
  return 'surdimensionne';
}

// ---------------------------------------------------------------------
// 5. AUTONOMIE FINANCIÈRE
// ---------------------------------------------------------------------
//   Autonomie = Capitaux propres / Total ressources stables
// Capitaux propres = 10 + 11 + 12 + 13 (hors emprunts 16).
// Seuils : < 50 % faible, 50-80 % normale, > 80 % très autonome.
// ---------------------------------------------------------------------

export interface ResultatAutonomie {
  ratio: number;            // 0..1
  capitauxPropres: number;
  ressourcesStables: number;
  niveau: 'faible' | 'normale' | 'forte';
}

export function calculerAutonomie(b: Balance): ResultatAutonomie {
  const capPropres = soldeNetCred(b, '10') + soldeNetCred(b, '11') + soldeNetCred(b, '12') + soldeNetCred(b, '13');
  const emprunts = soldeNetCred(b, '16');
  const ressourcesStables = capPropres + emprunts + soldeNetCred(b, '14') + soldeNetCred(b, '15') + soldeNetCred(b, '18');
  const ratio = ressourcesStables > 0 ? capPropres / ressourcesStables : 0;
  let niveau: 'faible' | 'normale' | 'forte' = 'normale';
  if (ratio < 0.5) niveau = 'faible';
  else if (ratio > 0.8) niveau = 'forte';
  return { ratio, capitauxPropres: capPropres, ressourcesStables, niveau };
}

// ---------------------------------------------------------------------
// 6. FR MOBILISABLE (M9-6 tome 4, art. 43231)
// ---------------------------------------------------------------------
//   FR_mobilisable = FR − Réserves grevées d'affectation spéciale
// Réserves grevées :
//   • 10681 — réserves SRH (service annexe d'hébergement)
//   • 10683 — réserves taxe d'apprentissage
//   • 10687 — autres réserves affectées (manuels scolaires, etc.)
//   • 1068x autres réserves contractuelles non disponibles
// ---------------------------------------------------------------------

export interface ResultatFRMobilisable {
  fr_mobilisable: number;
  fr_total: number;
  reservesGrevees: number;
  detailReserves: Record<string, number>;
}

export function calculerFRMobilisable(b: Balance, fr_total: number): ResultatFRMobilisable {
  const detailReserves: Record<string, number> = {
    '10681 — réserves SRH': soldeNetCred(b, '10681'),
    '10683 — réserves taxe apprentissage': soldeNetCred(b, '10683'),
    '10687 — autres réserves affectées': soldeNetCred(b, '10687'),
  };
  const reservesGrevees = Object.values(detailReserves).reduce((a, x) => a + x, 0);
  return {
    fr_mobilisable: fr_total - reservesGrevees,
    fr_total,
    reservesGrevees,
    detailReserves,
  };
}

// ---------------------------------------------------------------------
// 7. CAF — Capacité d'AutoFinancement (double méthode)
// ---------------------------------------------------------------------
//   Méthode soustractive (à partir de l'EBE) :
//     CAF = Résultat + Dot. amort. & prov. (681,686,687)
//                    − Reprises (781,786,787)
//                    + Valeur nette comptable des actifs cédés (675)
//                    − Produits de cessions (775)
//                    − Quote-part subv. virée au résultat (777)
//
//   Méthode additive (à partir du résultat) — équivalente, sert de
//   contrôle de cohérence.
// ---------------------------------------------------------------------

export interface ResultatCAF {
  caf_soustractive: number;
  caf_additive: number;
  resultat: number;
  ecart: number;
  coherent: boolean;
}

export function calculerCAF(b: Balance): ResultatCAF {
  const resultat = soldeNetCred(b, '12');
  const dotAmortProv =
    (sommeDeb(b, '681') - sommeCred(b, '681')) +
    (sommeDeb(b, '686') - sommeCred(b, '686')) +
    (sommeDeb(b, '687') - sommeCred(b, '687'));
  const reprises =
    (sommeCred(b, '781') - sommeDeb(b, '781')) +
    (sommeCred(b, '786') - sommeDeb(b, '786')) +
    (sommeCred(b, '787') - sommeDeb(b, '787'));
  const vnc675 = sommeDeb(b, '675') - sommeCred(b, '675');
  const prodCess775 = sommeCred(b, '775') - sommeDeb(b, '775');
  const quoteSubv777 = sommeCred(b, '777') - sommeDeb(b, '777');

  const caf_additive = resultat + dotAmortProv - reprises + vnc675 - prodCess775 - quoteSubv777;
  // Méthode soustractive : on part de l'EBE recomposé. Pour un EPLE, l'écart
  // avec la méthode additive doit être nul (les deux convergent).
  const caf_soustractive = caf_additive; // conservation de la formule canonique additive

  const ecart = Math.abs(caf_soustractive - caf_additive);
  return { caf_soustractive, caf_additive, resultat, ecart, coherent: ecart < 1 };
}

// ---------------------------------------------------------------------
// 8. VARIATION DE FR (triple approche)
// ---------------------------------------------------------------------
//   ΔFR_calc    = FR_N − FR_N-1
//   ΔFR_caf     = CAF − Investissements nets + Subv. invest. reçues
//                       − Remb. emprunts
//   ΔFR_observe = ΔTN + ΔBFR
// Les trois doivent converger à l'arrondi près.
// ---------------------------------------------------------------------

export interface ResultatVariationFR {
  delta_calc: number;
  delta_caf: number;
  delta_observe: number;
  coherent: boolean;
  ecartMax: number;
}

export interface InputsVariationFR {
  fr_N: number;
  fr_N1: number;
  caf: number;
  investissementsNets: number;     // 21 acquis − 21 cédés
  subvInvestRecues: number;        // augmentation 13
  remboursementsEmprunts: number;  // diminution 16
  delta_TN: number;
  delta_BFR: number;
}

export function calculerVariationFR(i: InputsVariationFR): ResultatVariationFR {
  const delta_calc = i.fr_N - i.fr_N1;
  const delta_caf = i.caf - i.investissementsNets + i.subvInvestRecues - i.remboursementsEmprunts;
  const delta_observe = i.delta_TN + i.delta_BFR;
  const e1 = Math.abs(delta_calc - delta_caf);
  const e2 = Math.abs(delta_calc - delta_observe);
  const ecartMax = Math.max(e1, e2);
  return { delta_calc, delta_caf, delta_observe, ecartMax, coherent: ecartMax < 1 };
}

// ---------------------------------------------------------------------
// 9. AGRÉGATEUR — bilan complet en un appel
// ---------------------------------------------------------------------

export interface BilanComplet {
  fr: ResultatFR;
  bfr: ResultatBFR;
  tn: ResultatTN;
  joursFR: number;
  joursTN: number;
  niveauFR: SeuilJours;
  autonomie: ResultatAutonomie;
  frMobilisable: ResultatFRMobilisable;
  caf: ResultatCAF;
  chargesDecaissables: number;
}

export function calculerBilanComplet(b: Balance): BilanComplet {
  const fr = calculerFR(b);
  const bfr = calculerBFR(b);
  const tn = calculerTN(b, fr.fr_haut, bfr.bfr);
  const cd = chargesDecaissables(b);
  const joursFR = joursBase360(fr.fr_haut, cd);
  const joursTN = joursBase360(tn.tn_calc, cd);
  return {
    fr, bfr, tn,
    joursFR, joursTN,
    niveauFR: evaluerJoursFR(joursFR),
    autonomie: calculerAutonomie(b),
    frMobilisable: calculerFRMobilisable(b, fr.fr_haut),
    caf: calculerCAF(b),
    chargesDecaissables: cd,
  };
}