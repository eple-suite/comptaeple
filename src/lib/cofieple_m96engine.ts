// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Moteur de calcul M9-6 2026
// Instruction codificatrice M9-6 du 12 février 2026
// Décret n°2012-1246 du 7 novembre 2012 (RGCP)
// Code de l'éducation Art. R421-1 et suivants
// ═══════════════════════════════════════════════════════════════════

import type {
  LigneSDE, LigneSDR, LigneBalance, ResultatsM96,
  ServiceData, VerificationM96, CompteBalance,
  SensNormal, StatutVerification, ResultatsBudgetAnnexe, AnomalieBA
} from './cofieple_types';

const EPS = 0.02;

// ── Helpers ──────────────────────────────────────────────────────────
function sumBal(bal: LigneBalance[], test: (c: string) => boolean, field: keyof LigneBalance): number {
  return bal.filter(b => test(b.compte)).reduce((s, b) => s + ((b[field] as number) || 0), 0);
}
function extractService(ligne: string): string {
  return (ligne.split(/[-–]/)[0].replace(/[^A-Z0-9]/gi, '') || 'AUTRE').substring(0, 6).trim();
}

// ═══════════════════════════════════════════════════════════════════
// CALCUL PRINCIPAL M9-6 2026
// ═══════════════════════════════════════════════════════════════════
export function calculerResultatsM96(
  sde: LigneSDE[], sdr: LigneSDR[], bal: LigneBalance[]
): ResultatsM96 {

  // ── Totaux SDE/SDR ─────────────────────────────────────────────────
  const totalChargesSde  = sde.reduce((s, r) => s + r.realise, 0);
  const totalProduitsSdr = sdr.reduce((s, r) => s + r.realise, 0);
  const totalChargesPrev = sde.reduce((s, r) => s + r.budget, 0);
  const totalProduitsPrev= sdr.reduce((s, r) => s + r.budget, 0);
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

  // ── CAF budgétaire ─────────────────────────────────────────────────
  const chInvSde = sde.filter(r => /^(20|21|23|26|27)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const finProdSdr = sdr.filter(r => /^(101|104|131|134)/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const dotBudg = sde.filter(r => r.compte.startsWith('68')).reduce((s, r) => s + r.realise, 0);
  const reprBudg = sdr.filter(r => r.compte.startsWith('78')).reduce((s, r) => s + r.realise, 0);
  const cafBudgetaire = resultatBudgetaire - chInvSde + finProdSdr + dotBudg - reprBudg;

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
  const tresorerie = solDbtCl5 - solCrdCl5;
  const varTresorerieComptable = tresorerie - (antDbtCl5 - antCrdCl5);
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
  const joursAutonomie   = totalChargesSde > 0 ? (tresorerie / (totalChargesSde / 365)) : 0;
  const ratioFdrBfr      = bfr !== 0 ? fdrBas / bfr : 0;
  const totalChargesBalance = dbtCl6 - crdCl6;
  const totalProduitsBalance = crdCl7 - dbtCl7;
  const ressourcesPropres = sdr.filter(r => /^7[0-6]/.test(r.compte)).reduce((s, r) => s + r.realise, 0);
  const recettesAutogenerees = sdr.filter(r => /^7[0-3]/.test(r.compte)).reduce((s, r) => s + r.realise, 0);

  return {
    resultatBudgetaire, resultatComptable, excedent, deficit,
    cafBudgetaire, cafComptable,
    fdrHaut, fdrBas, fdrComptable,
    varFdrHaut, varFdrBas, varFdrCaf, varFdrTableauFinancement: varFdrBas, structurationFdr,
    bfr, varBfrSynthetique, varBfrSoustractive, varBfrTableauFinancement: varBfrSynthetique,
    tresorerie, varTresorerieComptable, varTresorerieTableauFinancement, structurationTresorerie, fluxNetsTresorerie,
    totalChargesSde, totalChargesPrev, totalProduitsSdr, totalProduitsPrev,
    totalChargesBalance, totalProduitsBalance,
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
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHECK-LIST M9-6 — 15 vérifications
// ═══════════════════════════════════════════════════════════════════
export function buildChecklist(r: ResultatsM96): VerificationM96[] {
  const checks: VerificationM96[] = [];
  function add(id: string, titre: string, ref: string, v1Label: string, v1: number, v2Label: string, v2: number, bloquant: boolean, piste: string) {
    const ecart = v1 - v2;
    const ok = Math.abs(ecart) < EPS;
    let statut: StatutVerification = 'ok';
    if (!ok) statut = bloquant ? 'bloq' : Math.abs(ecart) > 100 ? 'err' : 'warn';
    checks.push({ id, titre, ref, v1Label, v1, v2Label, v2, ecart, statut, bloquant: bloquant && !ok, piste });
  }

  add('rb_rc','Résultat budgétaire ≠ Résultat comptable','M9-6 § III.2 / RGCP art.24','Résultat budgétaire',r.resultatBudgetaire,'Résultat comptable',r.resultatComptable,false,"Vérifier que tous les transferts de l'ordonnateur ont été réceptionnés chez l'agent comptable. Les classes 6 et 7 doivent être soldées par Op@le.");
  add('caf_budg_compt','CAF/IAF budgétaire ≠ CAF/IAF comptable','M9-6 § IV.3','CAF/IAF budgétaire',r.cafBudgetaire,'CAF/IAF comptable',r.cafComptable,false,"Vérifier la concordance comptabilité générale / auxiliaire. Contrôler les dotations aux amortissements (68) et reprises (78).");
  add('fdr_budg_compt','FDR budgétaire ≠ FDR comptable','M9-6 § IV.1','FDR (variation budgétaire)',r.varFdrBas,'FDR comptable',r.fdrComptable,false,"Vérifier les mouvements de classe 1 (financements) et classe 2 (immobilisations).");
  add('fdr_haut_bas','FDR par le haut ≠ FDR par le bas','M9-6 § IV.1 — POINT BLOQUANT','FDR par le haut (ressources permanentes)',r.fdrHaut,'FDR par le bas (actif circulant)',r.fdrBas,true,"POINT BLOQUANT au compte financier. Déséquilibre du bilan. Rechercher les comptes de classe 1 ou 2 anormaux.");
  add('var_fdr_haut_bas','Variation FDR haut ≠ Variation FDR bas','M9-6 § IV.1 Tableau financement','Variation FDR par le haut',r.varFdrHaut,'Variation FDR par le bas',r.varFdrBas,false,"Vérifier les mouvements d'investissement (classe 2), les financements reçus (classe 1) et les cessions d'actifs (675/775).");
  add('var_fdr_caf_bas','Variation FDR (CAF) ≠ Variation FDR par le bas','M9-6 § IV.3','Variation FDR à partir de la CAF',r.varFdrCaf,'Variation FDR par le bas',r.varFdrBas,false,"Vérifier les subventions d'investissement reçues (13X), les acquisitions d'immobilisations (21X/23X) et les cessions.");
  add('var_fdr_tf','Variation FDR tableau financement ≠ FDR comptable','M9-6 § IV.3','Variation FDR tableau financement',r.varFdrTableauFinancement,'Variation FDR comptable',r.varFdrBas,false,'');
  add('struct_fdr','Structuration FDR ≠ FDR comptable','M9-6 § IV.2','Total structuration FDR (BFR + Tréso)',r.structurationFdr,'FDR comptable',r.fdrComptable,true,"Vérifier la décomposition du FDR en BFR + Trésorerie. Des comptes de tiers anormaux peuvent provoquer ce déséquilibre.");
  add('var_bfr_synth_soustr','Variation BFR synthétique ≠ Variation BFR soustractive','M9-6 § IV.2 — BFR','Variation BFR synthétique (BF - BE)',r.varBfrSynthetique,'Variation BFR soustractive',r.varBfrSoustractive,false,"Des comptes de tiers anormalement débiteurs ou créditeurs peuvent causer ce type d'anomalie. Vérifier les comptes 40X et 41X.");
  add('var_bfr_tf','Variation BFR tableau financement ≠ Variation BFR comptable','M9-6 § IV.2','Variation BFR tableau financement',r.varBfrTableauFinancement,'Variation BFR comptable',r.varBfrSoustractive,false,"Des comptes de tiers anormaux peuvent causer ce type d'anomalie.");
  add('struct_trso','Structuration trésorerie ≠ Trésorerie','M9-6 § IV.2','Total structuration trésorerie',r.structurationTresorerie,'Trésorerie (classe 5)',r.tresorerie,false,"Des comptes de tiers anormaux peuvent provoquer ce déséquilibre.");
  add('flux_trso','Flux nets de trésorerie ≠ Variation trésorerie comptable','M9-6 § IV.3 Tableau des flux','Total flux nets de trésorerie',r.fluxNetsTresorerie,'Variation trésorerie comptable',r.varTresorerieComptable,false,'');
  add('var_trso_tf','Variation trésorerie TF ≠ Variation trésorerie comptable','M9-6 § IV.3','Variation trésorerie tableau financement',r.varTresorerieTableauFinancement,'Variation trésorerie comptable',r.varTresorerieComptable,false,'');
  add('charges_sde_bal','Total charges SDE ≠ Total classe 6 balance','M9-6 § II — Rapprochement Ordo/AC — POINT BLOQUANT','Total charges nettes SDE (N)',r.totalChargesSde,'Total charges classe 6 balance',r.totalChargesBalance,true,"POINT BLOQUANT : rapprochement ordonnateur/agent comptable. Vérifier que toutes les demandes de paiement ont été traitées. Contrôler les extournes.");
  add('produits_sdr_bal','Total produits SDR ≠ Total classe 7 balance','M9-6 § II — Rapprochement Ordo/AC — POINT BLOQUANT','Total produits nets SDR (N)',r.totalProduitsSdr,'Total produits classe 7 balance',r.totalProduitsBalance,true,"POINT BLOQUANT : rapprochement ordonnateur/agent comptable. Vérifier les titres de recettes émis et les extournes.");
  return checks;
}

// ═══════════════════════════════════════════════════════════════════
// SUPERVISEUR — Sens des soldes M9-6 Plan comptable EPLE
// ═══════════════════════════════════════════════════════════════════
const SENS_PAR_CLASSE: Record<string, SensNormal> = {
  '1': 'crediteur', '2': 'debiteur', '3': 'debiteur',
  '4': 'mixte', '5': 'debiteur', '6': 'debiteur', '7': 'crediteur',
};
const COMPTES_4_CREDITEURS = new Set(['401','402','403','404','408','409','419','421','422','423','424','425','426','427','428','431','432','437','438','443','444','447','448','451','452','455','456','457','458','463','464','465','467','468','477','478']);
const COMPTES_TOUJOURS_DEBITEURS = new Set(['109','119','129','209','219','229','239','249','259','269','279','289','309','319','329','339','349','359','369','379','389','409']);
const COMPTES_TOUJOURS_CREDITEURS = new Set(['101','104','106','108','110','111','118','130','131','134','138','160','161','162','163','164','165','166','167','168']);

function getSensNormal(compte: string): SensNormal {
  const cl = compte.charAt(0);
  const ss = compte.substring(0, 3);
  if (COMPTES_TOUJOURS_DEBITEURS.has(ss)) return 'debiteur';
  if (COMPTES_TOUJOURS_CREDITEURS.has(ss)) return 'crediteur';
  if (cl === '4') return COMPTES_4_CREDITEURS.has(ss) ? 'crediteur' : 'debiteur';
  // Seuls les concours bancaires (519) sont normalement créditeurs en classe 5
  // Le compte 512 (Banque/DFT) est normalement DÉBITEUR
  if (compte.startsWith('519')) return 'crediteur';
  return SENS_PAR_CLASSE[cl] || 'debiteur';
}

export function analyserBalance(bal: LigneBalance[]): CompteBalance[] {
  return bal.filter(b => b.compte && b.compte.length >= 3).map(b => {
    const sensNormal = getSensNormal(b.compte);
    const hasDbt = b.solDbt > 0;
    const hasCrd = b.solCrd > 0;
    const soldeNul = b.solDbt === 0 && b.solCrd === 0;
    let anomalie = false;
    let typeAnomalie: CompteBalance['typeAnomalie'] = undefined;
    let commentaire = '';
    if (!soldeNul) {
      if (sensNormal === 'debiteur' && hasCrd) {
        anomalie = true; typeAnomalie = 'anormalement_crediteur';
        commentaire = 'Solde créditeur anormal pour un compte de nature débitrice (M9-6 Plan comptable EPLE).';
      } else if (sensNormal === 'crediteur' && hasDbt) {
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
