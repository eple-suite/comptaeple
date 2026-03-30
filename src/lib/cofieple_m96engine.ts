// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Moteur de calcul M9-6 2026
// Instruction codificatrice M9-6 du 12 février 2026
// Décret n°2012-1246 du 7 novembre 2012 (RGCP)
// Code de l'éducation Art. R421-1 et suivants
// ═══════════════════════════════════════════════════════════════════

import type {
  LigneSDE, LigneSDR, LigneBalance, ResultatsM96,
  ServiceData, VerificationM96, CompteBalance,
  SensNormal, StatutVerification, ResultatsBudgetAnnexe, AnomalieBA,
  DomaineData, OperationsOrdre,
} from './cofieple_types';
import {
  deriveSdeExecutionTotals, deriveSdrExecutionTotals,
  getChargeRateBase, getProductRateBase,
} from './opaleExecutionHierarchy';

// Tolérance d'arrondi comptable : 1 € (standard EPLE, cohérent avec Op@le)
// Les écarts < 1 € entre budgétaire et comptable sont normaux (arrondis, centimes)
const EPS = 1.00;

// ── Helpers ──────────────────────────────────────────────────────────
function sumBal(bal: LigneBalance[], test: (c: string) => boolean, field: keyof LigneBalance): number {
  return bal.filter(b => test(b.compte)).reduce((s, b) => s + ((b[field] as number) || 0), 0);
}
function extractService(ligne: string): string {
  return (ligne.split(/[-–]/)[0].replace(/[^A-Z0-9]/gi, '') || 'AUTRE').substring(0, 6).trim();
}

// ═══════════════════════════════════════════════════════════════════
// CALCUL PRINCIPAL M9-6 2026
// Supporte Budget Principal ET Budget Annexe (GRETA/CFA/SRH)
// ═══════════════════════════════════════════════════════════════════
export interface CalculOptions {
  isAnnexe?: boolean; // true = budget annexe → TN via C/185000
}

export function calculerResultatsM96(
  sde: LigneSDE[], sdr: LigneSDR[], bal: LigneBalance[],
  options: CalculOptions = {}
): ResultatsM96 {
  const { isAnnexe = false } = options;

  // ── Totaux SDE/SDR — Hiérarchie Op@le ───────────────────────────────
  // Utilise le moteur de hiérarchie pour isoler la ligne globale
  // et éviter les doubles comptes (global + services + détail)
  const sdeExec = deriveSdeExecutionTotals(sde);
  const sdrExec = deriveSdrExecutionTotals(sdr);

  // Lignes de détail uniquement (avec un numéro de compte) pour les calculs comptables
  const sdeDetail = sde.filter(r => r.compte && r.aggregationLevel !== 'global' && r.aggregationLevel !== 'section' && r.aggregationLevel !== 'service');
  const sdrDetail = sdr.filter(r => r.compte && r.aggregationLevel !== 'global' && r.aggregationLevel !== 'section' && r.aggregationLevel !== 'service');
  // Fallback : si pas de lignes de détail enrichies, utiliser toutes les lignes avec un compte
  const sdeForAccounting = sdeDetail.length > 0 ? sdeDetail : sde.filter(r => !!r.compte);
  const sdrForAccounting = sdrDetail.length > 0 ? sdrDetail : sdr.filter(r => !!r.compte);

  const totalChargesSde  = sdeExec.totalRealise;
  const totalProduitsSdr = sdrExec.totalRealise;
  const totalChargesPrev = sdeExec.totalBudget;
  const totalProduitsPrev= sdrExec.totalBudget;
  const resultatBudgetaire = totalProduitsSdr - totalChargesSde;

  // ── Résultat comptable ─────────────────────────────────────────────
  // IMPORTANT: Les comptes 120/129 contiennent le résultat de N-1 (non encore affecté).
  // Le résultat de l'exercice N se calcule à partir des mouvements de l'exercice
  // sur les classes 6 (charges) et 7 (produits) dans la balance.
  const excedent120 = sumBal(bal, c => c.startsWith('120'), 'solCrd');
  const deficit129  = sumBal(bal, c => c.startsWith('129'), 'solDbt');
  // Résultat N-1 (pour information, conservé séparément)
  const resultatN1 = excedent120 - deficit129;

  // ── Totaux balance classes 6/7 ─────────────────────────────────────
  const dbtCl6 = sumBal(bal, c => c.charAt(0) === '6', 'dbt');
  const crdCl6 = sumBal(bal, c => c.charAt(0) === '6', 'crd');
  const dbtCl7 = sumBal(bal, c => c.charAt(0) === '7', 'dbt');
  const crdCl7 = sumBal(bal, c => c.charAt(0) === '7', 'crd');

  // Résultat comptable N = Produits N (classe 7) - Charges N (classe 6)
  // Calculé à partir des mouvements de la balance (pas des comptes 120/129 qui contiennent N-1)
  const totalChargesBalance = dbtCl6 - crdCl6;
  const totalProduitsBalance = crdCl7 - dbtCl7;
  const resultatComptable = totalProduitsBalance - totalChargesBalance;
  const excedent = resultatComptable >= 0 ? resultatComptable : 0;
  const deficit = resultatComptable < 0 ? -resultatComptable : 0;

  // ── CAF comptable (M9-6 § IV.3) ───────────────────────────────────
  const dbt675 = sumBal(bal, c => c.startsWith('675'), 'dbt');
  const crd675 = sumBal(bal, c => c.startsWith('675'), 'crd');
  const dbt68  = sumBal(bal, c => c.startsWith('68'),  'dbt');
  const crd68  = sumBal(bal, c => c.startsWith('68'),  'crd');
  const dbt78  = sumBal(bal, c => c.startsWith('78'),  'dbt');
  const crd78  = sumBal(bal, c => c.startsWith('78'),  'crd');
  const dbt775 = sumBal(bal, c => c.startsWith('775'), 'dbt');
  const crd775 = sumBal(bal, c => c.startsWith('775'), 'crd');
  const dbt776 = sumBal(bal, c => c.startsWith('776'), 'dbt');
  const crd776 = sumBal(bal, c => c.startsWith('776'), 'crd');
  const dbt777 = sumBal(bal, c => c.startsWith('777'), 'dbt');
  const crd777 = sumBal(bal, c => c.startsWith('777'), 'crd');

  // CAF comptable = Résultat comptable + Charges non décaissables - Produits non encaissables
  // Charges non décaissables : dotations amortissements/provisions (68), VNC cessions (675)
  // Produits non encaissables : reprises amort/prov (78), produits de cessions (775/776/777)
  const chargesNonDecaissables = (dbt68 - crd68) + (dbt675 - crd675);
  const produitsNonEncaissables = (crd78 - dbt78) + (crd775 - dbt775) + (crd776 - dbt776) + (crd777 - dbt777);
  const cafComptable = resultatComptable + chargesNonDecaissables - produitsNonEncaissables;

  // ── CAF budgétaire (M9-6 § IV.3 / REPROFI — Bilan de santé financière)
  // REPROFI standard : CAF = Produits encaissables − Charges décaissables
  //   Charges décaissables = Total SDE − Charges d'ordre SDE (cpt 68* + 675*)
  //   Produits encaissables = Total SDR − Produits d'ordre SDR (cpt 78* + 775* + 776* + 777*)
  // Équivalent : CAF = Résultat budgétaire + Charges OO(SDE) − Produits OO(SDR)
  const chargesOrdre_SDE = sde.filter(r => /^(68|675)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const produitsOrdre_SDR = sdr.filter(r => /^(78|775|776|777)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const cafBudgetaire = resultatBudgetaire + chargesOrdre_SDE - produitsOrdre_SDR;

  // Charges d'investissement (SDE classe 2) — conservé pour d'autres calculs
  const chInvSde = sde.filter(r => /^(20|21|23|26|27)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const finProdSdr = sdr.filter(r => /^(10|13)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);

  // ── FDR par le haut (ressources permanentes - emplois permanents) ──
  const solCrdCl1     = sumBal(bal, c => c.charAt(0) === '1', 'solCrd');
  const solCrdCl2     = sumBal(bal, c => c.charAt(0) === '2', 'solCrd');
  const solCrd39      = sumBal(bal, c => c.startsWith('39'), 'solCrd');
  const solCrd49      = sumBal(bal, c => c.startsWith('49'), 'solCrd');
  const solCrd59      = sumBal(bal, c => c.startsWith('59'), 'solCrd');
  const solDbtCl1Hors = sumBal(bal, c => c.charAt(0) === '1' && !['181','185','186','187'].includes(c.substring(0, 3)), 'solDbt');
  const solDbtCl2     = sumBal(bal, c => c.charAt(0) === '2', 'solDbt');
  const solCrd185     = sumBal(bal, c => c.startsWith('185'), 'solCrd');
  const fdrHaut = solCrdCl1 + solCrdCl2 + solCrd39 + solCrd49 + solCrd59 - solDbtCl1Hors - solDbtCl2 - solCrd185;

  // ── FDR par le bas (actif circulant net - passif circulant) ────────
  const solDbtCl3       = sumBal(bal, c => c.charAt(0) === '3', 'solDbt');
  const solDbtCl4plus   = sumBal(bal, c => c.charAt(0) === '4' || ['181','185','186','187'].includes(c.substring(0, 3)), 'solDbt');
  const solDbtCl5       = sumBal(bal, c => c.charAt(0) === '5', 'solDbt');
  const solCrdCl4       = sumBal(bal, c => c.charAt(0) === '4', 'solCrd');
  const solCrdCl5       = sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
  const solCrdCl18      = sumBal(bal, c => c.startsWith('18'), 'solCrd');
  const fdrBas    = solDbtCl3 + solDbtCl4plus + solDbtCl5 - solCrdCl4 - solCrdCl5 - solCrdCl18 + solCrd49 + solCrd59;
  const fdrComptable = fdrBas;

  // ── Variations FDR (bilantiel BE→BF) ──────────────────────────────
  const antCrdCl1     = sumBal(bal, c => c.charAt(0) === '1', 'antCrd');
  const antCrdCl2     = sumBal(bal, c => c.charAt(0) === '2', 'antCrd');
  const antCrd39      = sumBal(bal, c => c.startsWith('39'), 'antCrd');
  const antCrd49      = sumBal(bal, c => c.startsWith('49'), 'antCrd');
  const antCrd59      = sumBal(bal, c => c.startsWith('59'), 'antCrd');
  const antDbtCl1Hors = sumBal(bal, c => c.charAt(0) === '1' && !['181','185','186','187'].includes(c.substring(0, 3)), 'antDbt');
  const antDbtCl2     = sumBal(bal, c => c.charAt(0) === '2', 'antDbt');
  const antCrd185     = sumBal(bal, c => c.startsWith('185'), 'antCrd');
  const fdrHautBE = antCrdCl1 + antCrdCl2 + antCrd39 + antCrd49 + antCrd59 - antDbtCl1Hors - antDbtCl2 - antCrd185;
  const varFdrHaut = fdrHaut - fdrHautBE;

  const antDbtCl3 = sumBal(bal, c => c.charAt(0) === '3', 'antDbt');
  const antDbtCl4 = sumBal(bal, c => c.charAt(0) === '4', 'antDbt');
  const antDbtCl5 = sumBal(bal, c => c.charAt(0) === '5', 'antDbt');
  const antCrdCl4 = sumBal(bal, c => c.charAt(0) === '4', 'antCrd');
  const antCrdCl5 = sumBal(bal, c => c.charAt(0) === '5', 'antCrd');
  const antCrdCl18= sumBal(bal, c => c.startsWith('18'), 'antCrd');
  const fdrBasBE  = antDbtCl3 + antDbtCl4 + antDbtCl5 - antCrdCl4 - antCrdCl5 - antCrdCl18 + antCrd49 + antCrd59;
  const varFdrBas = fdrBas - fdrBasBE;
  const varFdrCaf = cafBudgetaire;

  // ── BFR ────────────────────────────────────────────────────────────
  const solDbtCl4only = sumBal(bal, c => c.charAt(0) === '4', 'solDbt');
  const bfr = solDbtCl3 + solDbtCl4only - solCrdCl4;
  const bfrBE = antDbtCl3 + antDbtCl4 - antCrdCl4;
  const varBfrSynthetique  = bfr - bfrBE;
  const varBfrSoustractive = varFdrBas - (solDbtCl5 - solCrdCl5 - antDbtCl5 + antCrdCl5);

  // ── Trésorerie ─────────────────────────────────────────────────────
  // Budget Principal : TN = solde net classe 5 (C/515100 = dépôt au Trésor)
  // Budget Annexe : TN = C/185000 solde débiteur (trésorerie virtuelle via BP support)
  //                 Pas de C/515100, le Trésor est porté par le budget principal
  let tresorerie: number;
  if (isAnnexe) {
    // Pour un budget annexe : trésorerie = C/185000 solde débiteur
    const solDbt185 = sumBal(bal, c => c.startsWith('185'), 'solDbt');
    const solCrd185fromCl5 = sumBal(bal, c => c.startsWith('185'), 'solCrd');
    tresorerie = solDbt185 - solCrd185fromCl5;
  } else {
    tresorerie = solDbtCl5 - solCrdCl5;
  }
  const tresorerieClassique = solDbtCl5 - solCrdCl5; // toujours calculée pour vérification
  const antTresoClassique = antDbtCl5 - antCrdCl5;
  let tresorerieAnt: number;
  if (isAnnexe) {
    const antDbt185 = sumBal(bal, c => c.startsWith('185'), 'antDbt');
    const antCrd185val = sumBal(bal, c => c.startsWith('185'), 'antCrd');
    tresorerieAnt = antDbt185 - antCrd185val;
  } else {
    tresorerieAnt = antTresoClassique;
  }
  const varTresorerieComptable = tresorerie - tresorerieAnt;
  const varTresorerieTableauFinancement = varFdrBas - varBfrSynthetique;
  const fluxNetsTresorerie = varFdrCaf - varBfrSynthetique;
  const structurationTresorerie = bfr + tresorerie;
  const structurationFdr = fdrBasBE + varFdrBas;

  // ── Réserves ───────────────────────────────────────────────────────
  const reserves = sumBal(bal, c => c.startsWith('1068'), 'solCrd');
  const reservesSsSpeciaux = sumBal(bal, c => c === '106840', 'solCrd');
  const reservesSRH = sumBal(bal, c => c === '106870', 'solCrd');

  // ── Prélèvements sur réserves (mvt débiteurs classe 106) ──────────
  // Un prélèvement = mouvement au débit du compte 106 durant l'exercice
  const comptes106 = bal.filter(b => b.compte.startsWith('106'));
  const totalPrelevements106 = comptes106.reduce((s, b) => s + (b.dbt || 0), 0);
  const detailPrelevements = comptes106
    .filter(b => (b.dbt || 0) > 0)
    .map(b => ({ compte: b.compte, intitule: b.intituleReduit, montant: b.dbt || 0 }));

  // Distinction investissement vs fonctionnement :
  // - Investissement = prélèvements finançant des acquisitions (classe 2 au SDE)
  // - Fonctionnement = le reste (dépenses exceptionnelles de fonctionnement)
  const investSDE = sde.filter(r => /^(20|21|23|26|27)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const prelevementsInvestissement = Math.min(totalPrelevements106, investSDE);
  const prelevementsFonctionnement = totalPrelevements106 - prelevementsInvestissement;

  // Variation des réserves N vs N-1
  const reservesN = sumBal(bal, c => c.startsWith('106'), 'solCrd');
  const reservesN1 = sumBal(bal, c => c.startsWith('106'), 'antCrd');
  const variationReserves = reservesN - reservesN1;

  // Contrôle de cohérence : la variation du FRNG devrait correspondre aux prélèvements
  // (aux ajustements comptables près)
  const ecartFrngVsPrelevements = Math.abs(variationReserves + totalPrelevements106);
  const coherentPrelevements = ecartFrngVsPrelevements < 100; // seuil de tolérance 100€

  // ── Immobilisations ────────────────────────────────────────────────
  const totalImmo = sumBal(bal, c => c.charAt(0) === '2' && !c.startsWith('28') && !c.startsWith('29'), 'solDbt');
  const totalAmortissements = sumBal(bal, c => c.startsWith('28'), 'solCrd');
  const valeurNette = totalImmo - totalAmortissements;

  // ── Patrimoine antérieur (pour variation) ─────────────────────────
  const totalImmoN1 = sumBal(bal, c => c.charAt(0) === '2' && !c.startsWith('28') && !c.startsWith('29'), 'antDbt');
  const totalAmortN1 = sumBal(bal, c => c.startsWith('28'), 'antCrd');
  const valeurNetteN1 = totalImmoN1 - totalAmortN1;
  const variationPatrimoine = valeurNette - valeurNetteN1;

  // ── Origines de financement patrimoine ────────────────────────────
  const subInvestissement = sumBal(bal, c => c.startsWith('13'), 'solCrd') - sumBal(bal, c => c.startsWith('139'), 'solCrd');
  const patrimoineOriginesSubventions = subInvestissement;
  const patrimoineOriginesFondsPropres = valeurNette - subInvestissement;
  const patrimoineOriginesPctFP = valeurNette > 0 ? (patrimoineOriginesFondsPropres / valeurNette) * 100 : 0;
  const patrimoineOriginesPctSub = valeurNette > 0 ? (patrimoineOriginesSubventions / valeurNette) * 100 : 0;

  // ── Services ───────────────────────────────────────────────────────
  const services: Record<string, ServiceData> = {};
  sde.forEach(r => {
    const k = extractService(r.service);
    if (!services[k]) services[k] = { libelle: r.service.split(/[-–]/)[0].trim(), chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0, produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0 };
    services[k].chargesPrev += r.budget;
    services[k].chargesReel += r.realise;
  });
  sdr.forEach(r => {
    const k = extractService(r.service);
    if (!services[k]) services[k] = { libelle: r.service.split(/[-–]/)[0].trim(), chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0, produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0 };
    services[k].produitsPrev += r.budget;
    services[k].produitsReel += r.realise;
  });
  Object.values(services).forEach(s => {
    s.reliquats = s.chargesPrev - s.chargesReel;
    s.tauxExecCharges = s.chargesPrev > 0 ? s.chargesReel / s.chargesPrev : 0;
    s.plusValues = s.produitsReel - s.produitsPrev;
    s.tauxExecProduits = s.produitsPrev > 0 ? s.produitsReel / s.produitsPrev : 0;
    s.solde = s.produitsReel - s.chargesReel;
  });

  // ── Nature charges/produits ────────────────────────────────────────
  const chargesNature: Record<string, number> = {};
  sde.forEach(r => {
    const nat = r.compte.substring(0, 3);
    chargesNature[nat] = (chargesNature[nat] || 0) + r.realise;
  });
  const produitsOrigine: Record<string, number> = {};
  sdr.forEach(r => {
    const nat = r.compte.substring(0, 3);
    produitsOrigine[nat] = (produitsOrigine[nat] || 0) + r.realise;
  });

  const tauxExecCharges  = totalChargesPrev > 0 ? totalChargesSde / totalChargesPrev : 0;
  const tauxExecProduits = totalProduitsPrev > 0 ? totalProduitsSdr / totalProduitsPrev : 0;

  // ── Charges de fonctionnement (hors investissement) ────────────────
  // Le dénominateur REPROFI utilise uniquement les charges de fonctionnement,
  // c'est-à-dire le total SDE moins les charges d'investissement (classe 2)
  // FALLBACK : si pas de SDE importée, utiliser la balance classe 6
  // (charges comptabilisées) hors charges d'investissement comptabilisées
  const chargesFonctSDE = totalChargesSde - chInvSde;
  const chargesBalanceCl6 = totalChargesBalance; // dbt6 - crd6 (mouvements exercice)
  const chInvBalance = sumBal(bal, c => c.charAt(0) === '2' && !c.startsWith('28') && !c.startsWith('29'), 'dbt')
    - sumBal(bal, c => c.charAt(0) === '2' && !c.startsWith('28') && !c.startsWith('29'), 'crd');
  const chargesFonctBalance = chargesBalanceCl6 > 0 ? chargesBalanceCl6 : 0;
  // Priorité SDE, sinon balance classe 6
  const chargesFonctionnement = chargesFonctSDE > 0 ? chargesFonctSDE : chargesFonctBalance;
  // Dénominateur total charges pour TMcap/TMnr : SDE si dispo, sinon balance
  const totalChargesRef = totalChargesSde > 0 ? totalChargesSde : (chargesBalanceCl6 > 0 ? chargesBalanceCl6 : 0);
  const totalProduitsRef = totalProduitsSdr > 0 ? totalProduitsSdr : (totalProduitsBalance > 0 ? totalProduitsBalance : 0);

  // ── Jours d'autonomie financière (REPROFI) ─────────────────────────
  // = FDR / charges quotidiennes de fonctionnement
  // REPROFI utilise le FDR (pas la trésorerie) car il mesure la capacité
  // de l'établissement à faire face à ses charges sans recettes nouvelles
  const chargesFonctQuotidiennes = chargesFonctionnement / 365;
  const joursAutonomie   = chargesFonctQuotidiennes > 0 ? (fdrComptable / chargesFonctQuotidiennes) : 0;
  const ratioFdrBfr      = bfr !== 0 ? fdrBas / bfr : 0;

  // Ressources propres : SDE/SDR si dispo, sinon balance classe 7
  const ressourcesPropres = sdr.length > 0
    ? sdr.filter(r => /^7[0-6]/.test(r.compte)).reduce((s, r) => s + r.realise, 0)
    : sumBal(bal, c => /^7[0-6]/.test(c), 'crd') - sumBal(bal, c => /^7[0-6]/.test(c), 'dbt');
  const recettesAutogenerees = sdr.length > 0
    ? sdr.filter(r => /^7[0-3]/.test(r.compte)).reduce((s, r) => s + r.realise, 0)
    : sumBal(bal, c => /^7[0-3]/.test(c), 'crd') - sumBal(bal, c => /^7[0-3]/.test(c), 'dbt');

  // ── REPROFI — Jours FDR et Trésorerie ─────────────────────────────
  // Dénominateur = charges de fonctionnement quotidiennes (hors investissement)
  const joursFdr = chargesFonctQuotidiennes > 0 ? fdrComptable / chargesFonctQuotidiennes : 0;
  const joursTresorerie = chargesFonctQuotidiennes > 0 ? tresorerie / chargesFonctQuotidiennes : 0;

  // ── REPROFI — Composition FDR (encaissé / non encaissé) ───────────
  const fdrPartEncaissee = Math.max(0, tresorerie > 0 ? Math.min(tresorerie, fdrComptable) : 0);
  const fdrPartNonEncaissee = fdrComptable - fdrPartEncaissee;
  const fdrPctEncaissee = fdrComptable > 0 ? (fdrPartEncaissee / fdrComptable) * 100 : 0;
  const fdrPctNonEncaissee = fdrComptable > 0 ? (fdrPartNonEncaissee / fdrComptable) * 100 : 0;

  // ── REPROFI — TMcap (Taux moyen charges à payer) ──────────────────
  // Part impayée des charges = dettes fournisseurs / charges réalisées
  // Dénominateur : SDE si dispo, sinon balance classe 6
  const dettesFournisseurs = sumBal(bal, c => c.startsWith('401') || c.startsWith('408'), 'solCrd');
  const tmcap = totalChargesRef > 0 ? (dettesFournisseurs / totalChargesRef) * 100 : 0;

  // ── REPROFI — TMnr (Taux moyen de non-recouvrement) ───────────────
  // Part non recouvrée = créances cl4 débit / recettes réalisées
  // Dénominateur : SDR si dispo, sinon balance classe 7
  const totalCreancesCl4 = sumBal(bal, c => c.charAt(0) === '4', 'solDbt');
  const tmnr = totalProduitsRef > 0 ? (totalCreancesCl4 / totalProduitsRef) * 100 : 0;

  // ── REPROFI — Créances par origine ────────────────────────────────
  const creancesEtat = sumBal(bal, c => c.startsWith('4411') || c.startsWith('4431') || c.startsWith('4432') || c.startsWith('4438'), 'solDbt');
  const creancesCollectivite = sumBal(bal, c => c.startsWith('4412') || c.startsWith('4413'), 'solDbt');
  const creancesFamilles = sumBal(bal, c => c.startsWith('411') || c.startsWith('412') || c.startsWith('413'), 'solDbt');
  const creancesAutres = totalCreancesCl4 - creancesEtat - creancesCollectivite - creancesFamilles;
  const totalCreances = totalCreancesCl4;

  // ── REPROFI — Dettes par type ─────────────────────────────────────
  const dettesEtat = sumBal(bal, c => c.startsWith('4411') || c.startsWith('4431') || c.startsWith('4432') || c.startsWith('4438'), 'solCrd');
  const dettesCollectivite = sumBal(bal, c => c.startsWith('4412') || c.startsWith('4413'), 'solCrd');
  const dettesAutresCl4 = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') - dettesFournisseurs - dettesEtat - dettesCollectivite;
  const totalDettes = sumBal(bal, c => c.charAt(0) === '4', 'solCrd');

  // ── REPROFI — Reliquats de subventions ────────────────────────────
  const reliquatsSubventions = sumBal(bal, c => c.startsWith('441') || c.startsWith('443') || c.startsWith('468'), 'solCrd');

  // ── REPROFI — Composition trésorerie ──────────────────────────────
  const depotsCautions = sumBal(bal, c => c.startsWith('165') || c.startsWith('275'), 'solDbt');
  const reglementsEnAttente = sumBal(bal, c => c.startsWith('511') || c.startsWith('5117'), 'solDbt');
  const tresorerieSpecifique = 0; // placeholder
  const autonomieFinanciere = tresorerie - reliquatsSubventions - depotsCautions - reglementsEnAttente;
  const avancesRecues = totalDettes - dettesFournisseurs - dettesEtat - dettesCollectivite;

  // ── REPROFI — FDR mobilisable ─────────────────────────────────────
  const stocks = sumBal(bal, c => c.charAt(0) === '3', 'solDbt');
  const creancesAnciennes = sumBal(bal, c => c.startsWith('416'), 'solDbt');
  const fdrMobilisable = fdrComptable - stocks - creancesAnciennes;

  // ── Domaines D1-D9 (exécution budgétaire par domaine) ───────────
  const DOMAINE_LABELS: Record<string, string> = {
    '0': 'D0 — Activités pédagogiques',
    '1': 'D1 — Activités pédagogiques',
    '2': 'D2 — Vie de l\'élève',
    '3': 'D3 — Viabilisation',
    '4': 'D4 — Entretien',
    '5': 'D5 — Restauration / Hébergement',
    '6': 'D6 — Administration générale',
    '7': 'D7 — Opérations en capital',
    '8': 'D8 — Opérations spécifiques',
    '9': 'D9 — Opérations pour compte de tiers',
  };
  const domaines: Record<string, DomaineData> = {};
  const buildDomKey = (d: string) => (d || '').charAt(0) || '0';

  sde.forEach(r => {
    const dk = buildDomKey(r.domaine);
    if (!domaines[dk]) domaines[dk] = {
      code: dk, libelle: DOMAINE_LABELS[dk] || `D${dk}`,
      chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0,
      produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0,
      chargesReelN1: 0, produitsReelN1: 0,
      variationCharges: 0, variationProduits: 0, pctVariationCharges: 0, pctVariationProduits: 0,
    };
    domaines[dk].chargesPrev += r.budget;
    domaines[dk].chargesReel += r.realise;
  });
  sdr.forEach(r => {
    const dk = buildDomKey(r.domaine);
    if (!domaines[dk]) domaines[dk] = {
      code: dk, libelle: DOMAINE_LABELS[dk] || `D${dk}`,
      chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0,
      produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0,
      chargesReelN1: 0, produitsReelN1: 0,
      variationCharges: 0, variationProduits: 0, pctVariationCharges: 0, pctVariationProduits: 0,
    };
    domaines[dk].produitsPrev += r.budget;
    domaines[dk].produitsReel += r.realise;
  });
  Object.values(domaines).forEach(d => {
    d.reliquats = d.chargesPrev - d.chargesReel;
    d.tauxExecCharges = d.chargesPrev > 0 ? d.chargesReel / d.chargesPrev : 0;
    d.plusValues = d.produitsReel - d.produitsPrev;
    d.tauxExecProduits = d.produitsPrev > 0 ? d.produitsReel / d.produitsPrev : 0;
    d.solde = d.produitsReel - d.chargesReel;
    d.variationCharges = d.chargesReel - d.chargesReelN1;
    d.pctVariationCharges = d.chargesReelN1 > 0 ? (d.variationCharges / d.chargesReelN1) * 100 : 0;
    d.variationProduits = d.produitsReel - d.produitsReelN1;
    d.pctVariationProduits = d.produitsReelN1 > 0 ? (d.variationProduits / d.produitsReelN1) * 100 : 0;
  });

  // ── Opérations d'ordre ────────────────────────────────────────────
  const dotationsAmort = dbt68 - crd68;
  const reprisesAmort = crd78 - dbt78;
  const vncCessions = dbt675 - crd675;
  const produitsCessions = (crd775 - dbt775) + (crd776 - dbt776) + (crd777 - dbt777);
  const neutralisationSubInv = sumBal(bal, c => c.startsWith('139'), 'dbt') - sumBal(bal, c => c.startsWith('139'), 'crd');
  const totalChargesOO = dotationsAmort + vncCessions;
  const totalProduitsOO = reprisesAmort + produitsCessions + neutralisationSubInv;
  const operationsOrdre: OperationsOrdre = {
    dotationsAmort, reprisesAmort, vncCessions, produitsCessions,
    neutralisationSubInv, totalChargesOO, totalProduitsOO,
    soldeOO: totalProduitsOO - totalChargesOO,
  };

  // ── DGP / DGR (Délai global de paiement / recouvrement) ──────────
  // Utilise totalChargesRef/totalProduitsRef pour fallback balance
  const dgpJours = totalChargesRef > 0 ? (dettesFournisseurs / totalChargesRef) * 365 : 0;
  const dgrJours = totalProduitsRef > 0 ? (totalCreancesCl4 / totalProduitsRef) * 365 : 0;

  // ── 12 Ratios M9-6 ────────────────────────────────────────────────
  const actifCirculant = solDbtCl3 + solDbtCl4only + solDbtCl5;
  const passifCirculant = solCrdCl4 + solCrdCl5;
  const ratioLiquiditeGenerale = passifCirculant > 0 ? actifCirculant / passifCirculant : 0;
  const ratioLiquiditeReduite = passifCirculant > 0 ? (solDbtCl4only + solDbtCl5) / passifCirculant : 0;
  const ratioLiquiditeImmediate = passifCirculant > 0 ? solDbtCl5 / passifCirculant : 0;
  const ratioAutonomieFinanciere = totalProduitsRef > 0 ? ressourcesPropres / totalProduitsRef : 0;
  const capitauxPropres = sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solCrd')
    - sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solDbt');
  const totalPassif = capitauxPropres + totalDettes + sumBal(bal, c => c.startsWith('15'), 'solCrd');
  const ratioSolvabilite = totalPassif > 0 ? capitauxPropres / totalPassif : 0;
  const totalEndettement = totalDettes + sumBal(bal, c => c.startsWith('16'), 'solCrd');
  const ratioEndettement = capitauxPropres > 0 ? totalEndettement / capitauxPropres : 0;
  // Charges de personnel : SDE si dispo, sinon balance compte 64
  const chargesPersonnel = sde.length > 0
    ? sde.filter(r => r.compte.startsWith('64')).reduce((s, r) => s + r.realise, 0)
    : sumBal(bal, c => c.startsWith('64'), 'dbt') - sumBal(bal, c => c.startsWith('64'), 'crd');
  const ratioChargesPersonnel = totalChargesRef > 0 ? chargesPersonnel / totalChargesRef : 0;
  const investissementsRealises = sde.length > 0
    ? sde.filter(r => /^(20|21|23)/.test(r.compte)).reduce((s, r) => s + r.realise, 0)
    : chInvBalance > 0 ? chInvBalance : 0;
  const ratioInvestissement = totalChargesRef > 0 ? investissementsRealises / totalChargesRef : 0;
  const ratioRecettesPropres = totalProduitsRef > 0 ? recettesAutogenerees / totalProduitsRef : 0;
  const ratioCouvertureCharges = totalChargesRef > 0 ? fdrComptable / totalChargesRef : 0;

  // ── N-1 placeholders (populated from sde1/sdr1/bal1 in calculerResultats) ──
  const totalChargesSdeN1 = 0;
  const totalProduitsSdrN1 = 0;
  const resultatBudgetaireN1 = 0;
  const fdrComptableN1 = fdrBasBE;
  const bfrN1 = bfrBE;
  const tresorerieN1 = antDbtCl5 - antCrdCl5;
  const cafBudgetaireN1 = 0;
  const reservesN1Solde = reservesN1;

  return {
    resultatBudgetaire, resultatComptable, excedent, deficit,
    cafBudgetaire, cafComptable,
    chargesNonDecaissables, produitsNonEncaissables,
    fdrHaut, fdrBas, fdrComptable,
    varFdrHaut, varFdrBas, varFdrCaf, varFdrTableauFinancement: varFdrBas, structurationFdr,
    bfr, varBfrSynthetique, varBfrSoustractive, varBfrTableauFinancement: varBfrSynthetique,
    tresorerie, varTresorerieComptable, varTresorerieTableauFinancement, structurationTresorerie, fluxNetsTresorerie,
    totalChargesSde, totalChargesPrev, totalProduitsSdr, totalProduitsPrev,
    totalChargesBalance, totalProduitsBalance,
    chargesFonctionnement, totalChargesRef, totalProduitsRef,
    reserves, reservesSsSpeciaux, reservesSRH,
    totalImmo, totalAmortissements, valeurNette,
    services, chargesNature, produitsOrigine,
    ressourcesPropres, recettesAutogenerees,
    tauxExecCharges, tauxExecProduits, joursAutonomie, ratioFdrBfr,
    prelevementsReserves: {
      totalPrelevements: totalPrelevements106,
      prelevementsInvestissement,
      prelevementsFonctionnement,
      detailParCompte: detailPrelevements,
      variationReserves,
      ecartFrngVsPrelevements,
      coherent: coherentPrelevements,
    },
    joursFdr, joursTresorerie,
    fdrPartEncaissee, fdrPartNonEncaissee, fdrPctEncaissee, fdrPctNonEncaissee,
    tmcap, tmnr,
    creancesEtat, creancesCollectivite, creancesFamilles, creancesAutres, totalCreances,
    dettesFournisseurs, dettesEtat, dettesCollectivite, dettesAutres: dettesAutresCl4, totalDettes,
    reliquatsSubventions,
    patrimoineOriginesFondsPropres, patrimoineOriginesSubventions,
    patrimoineOriginesPctFP, patrimoineOriginesPctSub,
    variationPatrimoine,
    tresoComposition: {
      autonomieFinanciere, depotsCautions, reglementsEnAttente,
      avancesRecues, reliquatsSubventions, tresorerieSpecifique,
    },
    fdrMobilisable, resultatN1,
    // New fields
    domaines, operationsOrdre,
    dgpJours, dgrJours,
    ratioLiquiditeGenerale, ratioLiquiditeReduite, ratioLiquiditeImmediate,
    ratioAutonomieFinanciere, ratioSolvabilite, ratioEndettement,
    ratioChargesPersonnel, ratioInvestissement, ratioRecettesPropres, ratioCouvertureCharges,
    totalChargesSdeN1, totalProduitsSdrN1, resultatBudgetaireN1,
    fdrComptableN1, bfrN1, tresorerieN1, cafBudgetaireN1, reservesN1Solde,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHECK-LIST M9-6 — 15+ vérifications (adaptées Budget Principal / Annexe)
// ═══════════════════════════════════════════════════════════════════
export function buildChecklist(r: ResultatsM96, options: { isAnnexe?: boolean; bal?: LigneBalance[]; hasSDE?: boolean; hasSDR?: boolean } = {}): VerificationM96[] {
  const { isAnnexe = false, bal = [] } = options;
  // Detect if SDE/SDR data is actually present (non-zero totals)
  const hasBudgetaryData = (r.totalChargesSde !== 0 || r.totalProduitsSdr !== 0);
  const checks: VerificationM96[] = [];
  function add(id: string, titre: string, ref: string, v1Label: string, v1: number, v2Label: string, v2: number, bloquant: boolean, piste: string, tolerance?: number) {
    const ecart = v1 - v2;
    const seuil = tolerance ?? EPS;
    const ok = Math.abs(ecart) < seuil;
    let statut: StatutVerification = 'ok';
    if (!ok) statut = bloquant ? 'bloq' : Math.abs(ecart) > 500 ? 'err' : 'warn';
    checks.push({ id, titre, ref, v1Label, v1, v2Label, v2, ecart, statut, bloquant: bloquant && !ok, piste });
  }

  // ── Vérifications budgétaires (SEULEMENT si SDE/SDR importées) ──────
  if (hasBudgetaryData) {
    // L'écart résultat budgétaire / comptable est NORMAL et expliqué par les opérations d'ordre
    // Ce n'est PAS un point bloquant — c'est un contrôle de cohérence informatif
    // Tolérance = solde des OO (dotations amort + reprises), arrondi à 1€ près
    const ecartAttenduOO = Math.abs(r.operationsOrdre?.soldeOO ?? 0);
    const toleranceRbRc = Math.max(100, ecartAttenduOO + 10);
    add('rb_rc','Résultat budgétaire vs Résultat comptable (écart = OO)','M9-6 § III.2 / RGCP art.24','Résultat budgétaire',r.resultatBudgetaire,'Résultat comptable',r.resultatComptable,false,
      "L'écart entre résultat budgétaire et comptable est normal : il correspond aux opérations d'ordre (dotations aux amortissements, reprises, cessions). Vérifier que l'écart = solde des OO.", toleranceRbRc);
    add('caf_budg_compt','CAF/IAF budgétaire ≠ CAF/IAF comptable','M9-6 § IV.3','CAF/IAF budgétaire',r.cafBudgetaire,'CAF/IAF comptable',r.cafComptable,false,
      "Vérifier la concordance comptabilité générale / auxiliaire. Contrôler les dotations aux amortissements (68) et reprises (78).", toleranceRbRc);
    // SDE/SDR ↔ Balance (tolérance 100€ pour écritures directes et OO)
    add('charges_sde_bal','Total charges SDE vs Total classe 6 balance','M9-6 § II — Rapprochement Ordo/AC','Total charges nettes SDE (N)',r.totalChargesSde,'Total charges classe 6 balance',r.totalChargesBalance,false,
      "Vérifier les écritures directes comptables et les opérations d'ordre non transitées par l'ordonnateur.", 100);
    add('produits_sdr_bal','Total produits SDR vs Total classe 7 balance','M9-6 § II — Rapprochement Ordo/AC','Total produits nets SDR (N)',r.totalProduitsSdr,'Total produits classe 7 balance',r.totalProduitsBalance,false,
      "Vérifier les titres de recettes émis et les écritures directes comptables.", 100);
  }

  // ── Vérifications bilantielles (toujours, basées sur la balance) ────
  // FDR par le haut vs par le bas — POINT BLOQUANT
  // Tolérance 10€ (les comptes 18x peuvent créer de petits écarts de centimes)
  add('fdr_haut_bas','FDR par le haut ≠ FDR par le bas','M9-6 § IV.1 — POINT BLOQUANT','FDR par le haut (ressources permanentes)',r.fdrHaut,'FDR par le bas (actif circulant)',r.fdrBas,true,
    "POINT BLOQUANT au compte financier. Déséquilibre du bilan. Rechercher les comptes de classe 1 ou 2 anormaux.", 10);
  // Variation FDR haut vs bas
  add('var_fdr_haut_bas','Variation FDR haut ≠ Variation FDR bas','M9-6 § IV.1 Tableau financement','Variation FDR par le haut',r.varFdrHaut,'Variation FDR par le bas',r.varFdrBas,false,
    "Vérifier les mouvements d'investissement (classe 2), les financements reçus (classe 1) et les cessions d'actifs (675/775).", 10);
  // Structuration FDR = BFR + Tréso
  add('struct_fdr','Structuration FDR ≠ FDR comptable','M9-6 § IV.2','Total structuration FDR (BFR + Tréso)',r.structurationFdr,'FDR comptable',r.fdrComptable,true,
    "Vérifier la décomposition du FDR en BFR + Trésorerie. Des comptes de tiers anormaux peuvent provoquer ce déséquilibre.", 10);
  // Variation BFR
  add('var_bfr_synth_soustr','Variation BFR synthétique ≠ Variation BFR soustractive','M9-6 § IV.2 — BFR','Variation BFR synthétique (BF - BE)',r.varBfrSynthetique,'Variation BFR soustractive',r.varBfrSoustractive,false,
    "Des comptes de tiers anormalement débiteurs ou créditeurs peuvent causer ce type d'anomalie. Vérifier les comptes 40X et 41X.", 10);
  // Structuration trésorerie
  add('struct_trso','Structuration trésorerie ≠ Trésorerie','M9-6 § IV.2','Total structuration trésorerie',r.structurationTresorerie,'Trésorerie',r.tresorerie,false,
    "Des comptes de tiers anormaux peuvent provoquer ce déséquilibre.", 10);
  // Flux nets de trésorerie vs variation comptable
  add('flux_trso','Flux nets de trésorerie ≠ Variation trésorerie comptable','M9-6 § IV.3 Tableau des flux','Total flux nets de trésorerie',r.fluxNetsTresorerie,'Variation trésorerie comptable',r.varTresorerieComptable,false,
    "Vérifier les flux d'investissement et la variation du BFR.", 10);
  // Variation trésorerie TF vs comptable
  add('var_trso_tf','Variation trésorerie TF ≠ Variation trésorerie comptable','M9-6 § IV.3','Variation trésorerie tableau financement',r.varTresorerieTableauFinancement,'Variation trésorerie comptable',r.varTresorerieComptable,false,
    "Vérifier la cohérence du tableau de financement.", 10);
  // Variation FDR depuis CAF vs variation FDR par le bas (seulement si données budgétaires)
  if (hasBudgetaryData) {
    add('var_fdr_caf_bas','Variation FDR (CAF) ≠ Variation FDR par le bas','M9-6 § IV.3','Variation FDR à partir de la CAF',r.varFdrCaf,'Variation FDR par le bas',r.varFdrBas,false,
      "Vérifier les subventions d'investissement reçues (13X), les acquisitions d'immobilisations (21X/23X) et les cessions.", 100);
  }

  // ── Vérifications spécifiques BUDGET ANNEXE ──────────────────────
  if (isAnnexe && bal.length > 0) {
    // Cohérence TN : FDR - BFR doit = C/185000 solde débiteur
    const solDbt185 = sumBal(bal, c => c.startsWith('185'), 'solDbt');
    const solCrd185 = sumBal(bal, c => c.startsWith('185'), 'solCrd');
    const tn185 = solDbt185 - solCrd185;
    const tnCalcule = r.fdrBas - r.bfr;
    add('ba_tn_coherence',
      'TN (FDR−BFR) ≠ C/185000 — Incohérence budget annexe',
      'M9-6 § Budget annexe — POINT BLOQUANT',
      'TN calculée (FDR − BFR)', tnCalcule,
      'C/185000 solde débiteur', tn185,
      true,
      "POINT BLOQUANT budget annexe : la trésorerie calculée (FDR − BFR) doit correspondre au solde débiteur du compte de liaison 185000. Vérifier les comptes de tiers et le compte de liaison avec le budget principal."
    );

    // Vérification absence C/515100 (pas de Trésor pour un annexe)
    const solDbt515 = sumBal(bal, c => c.startsWith('515100'), 'solDbt');
    const solCrd515 = sumBal(bal, c => c.startsWith('515100'), 'solCrd');
    if (solDbt515 > 0 || solCrd515 > 0) {
      add('ba_515100_present',
        'C/515100 présent dans un budget annexe',
        'M9-6 — Structure budget annexe',
        'Solde C/515100', solDbt515 - solCrd515,
        'Attendu pour annexe', 0,
        false,
        "Un budget annexe ne devrait pas avoir de compte au Trésor (515100). Ce compte est porté par le budget principal support. Vérifier l'export Op@le."
      );
    }

    // Vérification C/185000 doit être débiteur (créances sur le BP)
    if (tn185 < 0) {
      add('ba_185_crediteur',
        'C/185000 créditeur — Budget annexe en dette envers le BP',
        'M9-6 — Comptes de liaison',
        'Solde C/185000', tn185,
        'Seuil minimum', 0,
        false,
        "Le compte de liaison 185000 est créditeur, ce qui signifie que le budget annexe doit de l'argent au budget principal. Situation à surveiller."
      );
    }
  }

  return checks;
}

// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// SUPERVISEUR — Sens des soldes M9-6 Plan comptable EPLE
// Référence : Instruction codificatrice M9-6 du 19/01/2026
// ═══════════════════════════════════════════════════════════════════
//
// RÈGLE FONDAMENTALE M9-6 :
// - Les comptes d'actif (immobilisations brutes, stocks, créances, trésorerie) = DÉBITEUR
// - Les comptes de passif (capitaux, dettes, provisions) = CRÉDITEUR
// - Les comptes d'amortissements (28x) et dépréciations (29x, 39x, 49x, 59x) = CRÉDITEUR
//   car ils viennent en diminution de l'actif (ce sont des comptes de passif correcteur)
// - Les comptes de charges (classe 6) = DÉBITEUR
// - Les comptes de produits (classe 7) = CRÉDITEUR
// - Les comptes de classe 8 = MIXTE (engagements hors bilan)

function getSensNormal(compte: string): SensNormal {
  const c = compte.replace(/\s/g, '');
  const cl = c.charAt(0);
  const r2 = c.substring(0, 2); // racine 2 chiffres
  const r3 = c.substring(0, 3); // racine 3 chiffres

  // ─── CLASSE 1 : Capitaux propres et financement ───
  // Normalement CRÉDITEUR sauf :
  // - 119 : Report à nouveau déficitaire → DÉBITEUR
  // - 129 : Résultat de l'exercice (déficit) → DÉBITEUR
  // - 139 : Quote-part virée au CdR (neutralisation subv. invest.) → DÉBITEUR
  // - 169 : Primes de remboursement des obligations → DÉBITEUR
  // - 181/185/186/187/188/189 : Comptes de liaison → MIXTE
  if (cl === '1') {
    if (r3 === '119' || r3 === '129' || r3 === '139' || r3 === '169') return 'debiteur';
    if (r2 === '18') return 'mixte'; // comptes de liaison
    return 'crediteur';
  }

  // ─── CLASSE 2 : Immobilisations ───
  // - 20x, 21x, 22x, 23x, 24x, 25x, 26x, 27x : immobilisations brutes → DÉBITEUR
  // - 28x : Amortissements des immobilisations → CRÉDITEUR (passif correcteur)
  // - 29x : Dépréciations des immobilisations → CRÉDITEUR (passif correcteur)
  if (cl === '2') {
    if (r2 === '28' || r2 === '29') return 'crediteur';
    return 'debiteur';
  }

  // ─── CLASSE 3 : Stocks ───
  // - 31x, 32x, 33x, 35x, 37x : stocks → DÉBITEUR
  // - 39x : Dépréciations des stocks → CRÉDITEUR (passif correcteur)
  if (cl === '3') {
    if (r2 === '39') return 'crediteur';
    return 'debiteur';
  }

  // ─── CLASSE 4 : Comptes de tiers ───
  // Règles M9-6 détaillées par compte (EPLE / Op@le)
  if (cl === '4') {
    // Fournisseurs → CRÉDITEUR (dettes)
    if (r2 === '40') {
      // Sauf 409 avances fournisseurs → DÉBITEUR
      if (r3 === '409') return 'debiteur';
      return 'crediteur';
    }

    // Familles/redevables : créances à recouvrer → DÉBITEUR
    if (r3 === '411' || r3 === '412' || r3 === '413' || r3 === '414' || r3 === '415') return 'debiteur';
    // Créances douteuses → DÉBITEUR
    if (r3 === '416') return 'debiteur';
    // Comptes transitoires d'encaissement → DÉBITEUR
    if (r3 === '418') return 'debiteur';
    // Dépréciation des comptes de tiers → CRÉDITEUR (passif correcteur)
    if (r2 === '49') return 'crediteur';

    // Personnel → CRÉDITEUR (dettes envers personnel)
    if (r2 === '42') return 'crediteur';

    // Organismes sociaux → CRÉDITEUR (charges sociales dues)
    // ATTENTION : en EPLE, le compte 43 est souvent "Organismes sociaux" → CRÉDITEUR
    if (r2 === '43') return 'crediteur';

    // État et collectivités — M9-6 comptes 441xxx
    // 4411xx : Subventions État à recevoir → MIXTE (avance=créditeur, créance=débiteur)
    // 4412xx : Subventions Collectivité à recevoir → MIXTE
    if (c.startsWith('4411')) return 'mixte';
    if (c.startsWith('4412')) return 'mixte';

    // Opérations particulières État — M9-6 comptes 443xxx / 44311-44312
    // 44311 / 443110 : Bourses — Crédit à répartir → CRÉDITEUR (avances État reçues)
    // 44313 / 443130 : Aides sociales État → CRÉDITEUR
    // 44312 / 443120 : Bourses — Part familles (excédent à rembourser) → DÉBITEUR
    // 4432 / 443200 : Primes et indemnités État → CRÉDITEUR
    // 4438 / 443800 : Fonds sociaux État → CRÉDITEUR
    if (c.startsWith('44311') || c.startsWith('443110')) return 'crediteur';
    if (c.startsWith('44313') || c.startsWith('443130')) return 'crediteur';
    if (c.startsWith('44312') || c.startsWith('443120')) return 'debiteur';
    if (c.startsWith('4432') || c.startsWith('443200')) return 'crediteur';
    if (c.startsWith('4438') || c.startsWith('443800')) return 'crediteur';
    // Generic 443 (État opérations particulières) → CRÉDITEUR par défaut
    if (r3 === '443') return 'crediteur';
    // 444 : État — Impôts sur bénéfices → CRÉDITEUR
    if (r3 === '444') return 'crediteur';

    // Comptes de liaison interne → MIXTE
    if (r3 === '451' || r3 === '452' || r3 === '455' || r3 === '456' || r3 === '457' || r3 === '458') return 'mixte';

    // Débiteurs/créditeurs divers
    if (r3 === '462') return 'debiteur'; // créances sur cessions
    if (r3 === '463') return 'debiteur'; // ordres de reversement
    if (r3 === '464') return 'crediteur'; // dettes sur acquisitions
    if (r3 === '465') return 'crediteur'; // créditeurs divers
    if (r3 === '467') return 'mixte'; // débiteurs/créditeurs divers
    if (r3 === '468') return 'mixte'; // produits à répartir (bourses)

    // Comptes transitoires / d'attente → MIXTE
    if (r2 === '47') return 'mixte';
    if (r2 === '48') return 'mixte'; // charges/produits constatés d'avance

    // Par défaut en classe 4 → MIXTE
    return 'mixte';
  }

  // ─── CLASSE 5 : Financier ───
  // - 50x, 51x, 53x, 54x, 58x : trésorerie active → DÉBITEUR
  // - 519 : Concours bancaires courants → CRÉDITEUR
  // - 59x : Dépréciations des comptes financiers → CRÉDITEUR
  if (cl === '5') {
    if (r3 === '519') return 'crediteur';
    if (r2 === '59') return 'crediteur';
    return 'debiteur';
  }

  // ─── CLASSE 6 : Charges → DÉBITEUR ───
  if (cl === '6') return 'debiteur';

  // ─── CLASSE 7 : Produits → CRÉDITEUR ───
  if (cl === '7') return 'crediteur';

  // ─── CLASSE 8 : Comptes spéciaux (engagements hors bilan) → MIXTE ───
  if (cl === '8') return 'mixte';

  return 'debiteur';
}

export function analyserBalance(bal: LigneBalance[], options?: { hasAnnexe?: boolean }): CompteBalance[] {
  const hasAnnexe = options?.hasAnnexe ?? false;

  return bal.filter(b => b.compte && b.compte.length >= 3).map(b => {
    const sensNormal = getSensNormal(b.compte);
    // Use NET balance to determine actual sense — not raw columns
    // An aggregated account can have both solDbt and solCrd > 0 (sub-accounts)
    const soldeNet = (b.solDbt || 0) - (b.solCrd || 0);
    const soldeNul = Math.abs(soldeNet) < 0.01;

    // Skip account 185000 analysis when no budget annexe exists
    const is185 = b.compte.startsWith('185');
    if (is185 && !hasAnnexe) {
      return { compte: b.compte, intitule: b.intituleReduit, classe: b.classe, sensNormal: 'mixte' as SensNormal, solDbt: b.solDbt, solCrd: b.solCrd, anomalie: false, typeAnomalie: undefined, commentaire: '', budgetScope: b.budgetScope };
    }

    let anomalie = false;
    let typeAnomalie: CompteBalance['typeAnomalie'] = undefined;
    let commentaire = '';
    if (!soldeNul && sensNormal !== 'mixte') {
      // A "debiteur" account is anomalous only if its NET balance is credit (< 0)
      if (sensNormal === 'debiteur' && soldeNet < -0.01) {
        anomalie = true; typeAnomalie = 'anormalement_crediteur';
        commentaire = 'Solde créditeur anormal pour un compte de nature débitrice (M9-6 Plan comptable EPLE).';
      // A "crediteur" account is anomalous only if its NET balance is debit (> 0)
      } else if (sensNormal === 'crediteur' && soldeNet > 0.01) {
        anomalie = true; typeAnomalie = 'anormalement_debiteur';
        commentaire = 'Solde débiteur anormal pour un compte de nature créditrice (M9-6 Plan comptable EPLE).';
      }
    }
    return { compte: b.compte, intitule: b.intituleReduit, classe: b.classe, sensNormal, solDbt: b.solDbt, solCrd: b.solCrd, anomalie, typeAnomalie, commentaire, budgetScope: b.budgetScope };
  });
}

// ═══════════════════════════════════════════════════════════════════
// BUDGET ANNEXE — Calculs GRETA/CFA/SRH
// M9-6 Titre III § III.4 + Code Éducation Art. D423-1 et suivants
// ═══════════════════════════════════════════════════════════════════
export function calculerBudgetAnnexe(
  id: string,
  type: ResultatsBudgetAnnexe['type'],
  libelle: string,
  sdeBA: LigneSDE[],
  sdrBA: LigneSDR[],
  balBA: LigneBalance[],
  balBP: LigneBalance[]
): ResultatsBudgetAnnexe {
  const chargesBA  = sdeBA.reduce((s, r) => s + r.realise, 0);
  const produitsBA = sdrBA.reduce((s, r) => s + r.realise, 0);
  const chargesPrevBA  = sdeBA.reduce((s, r) => s + r.budget, 0);
  const produitsPrevBA = sdrBA.reduce((s, r) => s + r.budget, 0);
  const tauxExecChargesBA  = chargesPrevBA > 0 ? chargesBA / chargesPrevBA : 0;
  const tauxExecProduitsBA = produitsPrevBA > 0 ? produitsBA / produitsPrevBA : 0;

  const resultatBA = produitsBA - chargesBA;
  const excedentBA = sumBal(balBA, c => c.startsWith('120'), 'solCrd');
  const deficitBA  = sumBal(balBA, c => c.startsWith('129'), 'solDbt');
  const cafBA = resultatBA + sumBal(balBA, c => c.startsWith('68'), 'dbt') - sumBal(balBA, c => c.startsWith('78'), 'crd');

  // FDR Budget Annexe
  const solCrdCl1BA = sumBal(balBA, c => c.charAt(0) === '1', 'solCrd');
  const solCrdCl2BA = sumBal(balBA, c => c.charAt(0) === '2', 'solCrd');
  const solDbtCl1BAHors = sumBal(balBA, c => c.charAt(0) === '1' && !['185'].includes(c.substring(0,3)), 'solDbt');
  const solDbtCl2BA = sumBal(balBA, c => c.charAt(0) === '2', 'solDbt');
  const fdrBA = solCrdCl1BA + solCrdCl2BA - solDbtCl1BAHors - solDbtCl2BA;

  // BFR Budget Annexe
  const bfrBA = sumBal(balBA, c => c.charAt(0) === '3' || c.charAt(0) === '4', 'solDbt')
    - sumBal(balBA, c => c.charAt(0) === '4', 'solCrd');

  // Trésorerie Budget Annexe
  const tresoBA = sumBal(balBA, c => c.charAt(0) === '5', 'solDbt')
    - sumBal(balBA, c => c.charAt(0) === '5', 'solCrd');

  // Compte 185 — Liaison BP/BA (M9-6 § III.4.2 Comptes de liaisons)
  // Le compte 185 enregistre les avances et prêts entre BP et BA
  // RÈGLE : Le solde du compte 185 côté BP doit être l'exact opposé du solde côté BA
  const compte185BP = sumBal(balBP, c => c.startsWith('185'), 'solDbt') - sumBal(balBP, c => c.startsWith('185'), 'solCrd');
  const compte185BA = sumBal(balBA, c => c.startsWith('185'), 'solDbt') - sumBal(balBA, c => c.startsWith('185'), 'solCrd');
  const equilibreCompte185 = Math.abs(compte185BP + compte185BA) < EPS;
  const avancesBPversBA = compte185BP;

  // Quote-part frais généraux (M9-6 § III.4.3)
  // Le BP facture au BA sa part des charges communes (électricité, entretien, administration)
  // Enregistrée en charge chez le BA (6XXX) et en produit chez le BP (7088 ou 708)
  const qpFraisGeneraux = sdeBA.filter(r => /^(621|622|623|624|625|611|612|613|614|615)/.test(r.compte) && r.domaine.includes('QP')).reduce((s, r) => s + r.realise, 0);
  const qpFraisGenerauxPrev = sdeBA.filter(r => /^(621|622|623|624|625|611|612|613|614|615)/.test(r.compte) && r.domaine.includes('QP')).reduce((s, r) => s + r.budget, 0);

  // Reversements BA → BP (M9-6 § III.4.4)
  const reversementsBA = sdrBA.filter(r => /^(756|757|758)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);

  // Services du Budget Annexe
  const servicesByBA: Record<string, ServiceData> = {};
  sdeBA.forEach(r => {
    const k = extractService(r.service);
    if (!servicesByBA[k]) servicesByBA[k] = { libelle: r.service.split(/[-–]/)[0].trim(), chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0, produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0 };
    servicesByBA[k].chargesPrev += r.budget;
    servicesByBA[k].chargesReel += r.realise;
  });
  sdrBA.forEach(r => {
    const k = extractService(r.service);
    if (!servicesByBA[k]) servicesByBA[k] = { libelle: r.service.split(/[-–]/)[0].trim(), chargesPrev: 0, chargesReel: 0, reliquats: 0, tauxExecCharges: 0, produitsPrev: 0, produitsReel: 0, plusValues: 0, tauxExecProduits: 0, solde: 0 };
    servicesByBA[k].produitsPrev += r.budget;
    servicesByBA[k].produitsReel += r.realise;
  });
  Object.values(servicesByBA).forEach(s => {
    s.reliquats = s.chargesPrev - s.chargesReel;
    s.tauxExecCharges = s.chargesPrev > 0 ? s.chargesReel / s.chargesPrev : 0;
    s.plusValues = s.produitsReel - s.produitsPrev;
    s.tauxExecProduits = s.produitsPrev > 0 ? s.produitsReel / s.produitsPrev : 0;
    s.solde = s.produitsReel - s.chargesReel;
  });

  // Anomalies spécifiques Budget Annexe
  const anomalies: AnomalieBA[] = [];

  if (!equilibreCompte185) {
    anomalies.push({
      type: 'blocant',
      code: 'BA_185',
      message: `Déséquilibre du compte 185 (compte de liaison BP/BA) : BP = ${compte185BP.toFixed(2)} €, BA = ${compte185BA.toFixed(2)} €. Écart : ${(compte185BP + compte185BA).toFixed(2)} €`,
      valeur: compte185BP + compte185BA,
      piste: "Le solde du compte 185 côté budget principal doit être l'exact opposé du solde côté budget annexe (M9-6 § III.4.2). Vérifier les virements de trésorerie et les avances entre budgets.",
      ref: 'M9-6 § III.4.2 — Comptes de liaison entre budgets'
    });
  }

  if (fdrBA < 0) {
    anomalies.push({
      type: 'anomalie',
      code: 'BA_FDR',
      message: `Fonds de roulement négatif du budget annexe : ${fdrBA.toFixed(2)} €`,
      valeur: fdrBA,
      piste: "Un FDR négatif du budget annexe peut nécessiter une avance du budget principal. Vérifier la soutenabilité financière du budget annexe.",
      ref: 'M9-6 § IV.1 / Code Éducation Art. D423-1'
    });
  }

  if (tresoBA < 0) {
    anomalies.push({
      type: 'blocant',
      code: 'BA_TRSO',
      message: `Trésorerie négative du budget annexe : ${tresoBA.toFixed(2)} €`,
      valeur: tresoBA,
      piste: "Une trésorerie négative du budget annexe doit être couverte par une avance du budget principal (compte 185). Vérifier le solde du compte 185.",
      ref: 'M9-6 § IV.2 — Trésorerie budget annexe / RGCP art. 28'
    });
  }

  if (Math.abs(qpFraisGeneraux) < 1 && chargesBA > 10000) {
    anomalies.push({
      type: 'attention',
      code: 'BA_QPFG',
      message: `Aucune quote-part de frais généraux détectée pour le ${libelle}`,
      piste: "Le budget annexe devrait normalement supporter une quote-part des charges communes du budget principal (loyer locaux, chauffage, entretien, administration). Vérifier l'existence et la cohérence des facturations internes (M9-6 § III.4.3).",
      ref: 'M9-6 § III.4.3 — Quote-parts de charges communes'
    });
  }

  // Vérification résultat affecté (N-1 doit apparaître en réserves ou RAN)
  const ranCreditBA = sumBal(balBA, c => c.startsWith('110'), 'solCrd');
  const ranDebitBA  = sumBal(balBA, c => c.startsWith('119'), 'solDbt');
  const reservesBA  = sumBal(balBA, c => c.startsWith('106'), 'solCrd');
  const resultatAffecte = (ranCreditBA + ranDebitBA + reservesBA) > 0 || (excedentBA === 0 && deficitBA === 0);

  if (!resultatAffecte && (excedentBA > 0 || deficitBA > 0)) {
    anomalies.push({
      type: 'attention',
      code: 'BA_AFF',
      message: 'Le résultat du budget annexe de l\'exercice précédent ne semble pas avoir été affecté',
      piste: "Le résultat du budget annexe doit faire l'objet d'une affectation lors du vote du budget (M9-6 § III.2.4). L'excédent va en réserves (106) ou en report à nouveau créditeur (110). Le déficit est en report à nouveau débiteur (119).",
      ref: 'M9-6 § III.2.4 — Affectation du résultat'
    });
  }

  // Spécifique GRETA
  if (type === 'GRETA') {
    const prodFormation = sdrBA.filter(r => /^70[6-8]/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
    if (prodFormation === 0) {
      anomalies.push({
        type: 'attention',
        code: 'GRETA_PROD',
        message: 'Aucun produit de formation (compte 706/707/708) détecté pour le GRETA',
        piste: "Le GRETA doit enregistrer ses produits de formation continue en compte 706 (Prestations de services). Vérifier les imputations.",
        ref: 'M9-6 Plan comptable EPLE — Compte 706 / Arrêté du 12/04/2007'
      });
    }
    const subvGRETA = sdrBA.filter(r => /^74/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
    if (subvGRETA > produitsBA * 0.5) {
      anomalies.push({
        type: 'attention',
        code: 'GRETA_SUBV',
        message: `Les subventions représentent ${(subvGRETA / produitsBA * 100).toFixed(1)}% des produits du GRETA (> 50%)`,
        piste: "Un GRETA financé majoritairement par des subventions doit vérifier sa conformité aux règles de la formation professionnelle continue (Code du travail Art. L6341-1 et suivants).",
        ref: 'Code du travail Art. L6341-1 / Arrêté du 12/04/2007'
      });
    }
  }

  // Spécifique CFA
  if (type === 'CFA') {
    const taxeApp = sdrBA.filter(r => /^748/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
    if (taxeApp === 0) {
      anomalies.push({
        type: 'attention',
        code: 'CFA_TA',
        message: 'Aucune taxe d\'apprentissage (compte 748) détectée pour le CFA',
        piste: "Le CFA doit recevoir une quote-part de la taxe d'apprentissage (compte 748100). Vérifier les conventions de financement avec les OPCO et la Région.",
        ref: 'Code du travail Art. L6241-1 / M9-6 Compte 748'
      });
    }
  }

  return {
    id, type, libelle,
    resultatBA: excedentBA - deficitBA,
    cafBA, fdrBA, bfrBA, tresoBA,
    chargesBA, produitsBA, chargesPrevBA, produitsPrevBA,
    tauxExecChargesBA, tauxExecProduitsBA,
    avancesBPversBA, compte185BP, compte185BA, equilibreCompte185,
    qpFraisGeneraux, qpFraisGenerauxPrev, reversementsBA,
    servicesByBA, anomalies,
  };
}
