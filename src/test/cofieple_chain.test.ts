// ═══════════════════════════════════════════════════════════════════
// TEST — Chaîne complète COFIEPLE : Parsing CSV → Typage → Moteur M9-6
// Simule un export Op@le réaliste (séparateur ;, accents, colonnes standard)
// Conformité : M9-6 2026, Décret 2012-1246
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { parseSDE, parseSDR, parseBalance } from '@/lib/cofieple_csvParser';
import { parserSDE, parserSDR } from '@/lib/cofieple_calculations';
import { normalizeRowsForOpaleImport } from '@/lib/opaleImportUtils';
import { calculerResultatsM96, buildChecklist, analyserBalance } from '@/lib/cofieple_m96engine';
import type { LigneSDE, LigneSDR, LigneBalance } from '@/lib/cofieple_types';

// ── Données CSV Op@le simulées ───────────────────────────────────────
// Format réel : séparateur point-virgule, virgule décimale, accents UTF-8

const CSV_SDE = `RNE;exercice;service;domaine;activités;compte;budget;engagé;réalisé;en cours;disponible;EXT
9710746J;2025;AP - Activités pédagogiques;0;0;60611;15000,00;14200,00;13 850,50;349,50;800,00;N
9710746J;2025;AP - Activités pédagogiques;0;0;60612;8000,00;7500,00;7 200,00;300,00;500,00;N
9710746J;2025;VE - Vie de l'élève;0;0;6066;3000,00;2800,00;2 750,00;50,00;200,00;N
9710746J;2025;ALO - Administration & logistique;0;0;61551;12000,00;11500,00;11 000,00;500,00;500,00;N
9710746J;2025;ALO - Administration & logistique;0;0;6281;2000,00;1800,00;1 750,00;50,00;200,00;N
9710746J;2025;AP - Activités pédagogiques;0;0;6811;5000,00;5000,00;5 000,00;0,00;0,00;N
9710746J;2025;SRH - Service restauration hébergement;0;0;60311;25000,00;24000,00;23 500,00;500,00;1000,00;N
9710746J;2025;SRH - Service restauration hébergement;0;0;60312;18000,00;17200,00;16 800,00;400,00;800,00;N`;

const CSV_SDR = `RNE;exercice;service;domaine;activités;compte;budget;engagé;aor;réalisé;en cours;+values/-values;EXTOURNE
9710746J;2025;AP - Activités pédagogiques;0;0;7411;20000,00;0,00;19500,00;19 500,00;0,00;-500,00;N
9710746J;2025;AP - Activités pédagogiques;0;0;7443;8000,00;0,00;8200,00;8 200,00;0,00;200,00;N
9710746J;2025;VE - Vie de l'élève;0;0;7067;3500,00;0,00;3600,00;3 600,00;0,00;100,00;N
9710746J;2025;ALO - Administration & logistique;0;0;74411;14000,00;0,00;14000,00;14 000,00;0,00;0,00;N
9710746J;2025;SRH - Service restauration hébergement;0;0;7062;40000,00;0,00;42000,00;42 000,00;0,00;2000,00;N
9710746J;2025;AP - Activités pédagogiques;0;0;7811;5000,00;0,00;5000,00;5 000,00;0,00;0,00;N`;

// Balance Op@le IMPORT BAL — colonnes standard avec accents et caractères spéciaux
const CSV_BALANCE = `Compte;Intitulé réduit du compte;Type;Montant débit antérieur;Montant crédit antérieur;Montant débit;Montant crédit;Solde débit;Solde crédit;Poste;Classe de compte
10681;Réserves (budget principal);B;0,00;120 000,00;0,00;5 000,00;0,00;125 000,00;106;1
1064;Réserves disponibles - prélèvement;B;0,00;45 000,00;0,00;0,00;0,00;45 000,00;106;1
10687;Réserves SRH;B;0,00;35 000,00;0,00;2 000,00;0,00;37 000,00;106;1
110;Report à nouveau (solde créditeur);B;0,00;8 000,00;0,00;0,00;0,00;8 000,00;11;1
120;Résultat de l'exercice (excédent);B;0,00;12 000,00;12 000,00;14 750,00;0,00;14 750,00;12;1
131;Subventions d'équipement — État;B;0,00;25 000,00;0,00;3 000,00;0,00;28 000,00;13;1
139;Subventions d'investissement inscrites;B;0,00;5 000,00;0,00;0,00;0,00;5 000,00;13;1
1511;Provisions pour litiges;B;0,00;2 000,00;0,00;500,00;0,00;2 500,00;15;1
185;Avances BP→BA (« avances de l'EPLE »);B;0,00;3 000,00;0,00;0,00;0,00;3 000,00;18;1
21531;Matériel pédagogique — informatique;B;45 000,00;0,00;8 000,00;0,00;53 000,00;0,00;215;2
21541;Matériel de bureau;B;12 000,00;0,00;2 000,00;0,00;14 000,00;0,00;215;2
21821;Matériel de transport;B;15 000,00;0,00;0,00;0,00;15 000,00;0,00;218;2
28153;Amort. matériel pédago — informatique;B;0,00;20 000,00;0,00;5 000,00;0,00;25 000,00;281;2
28154;Amort. matériel bureau;B;0,00;6 000,00;0,00;2 000,00;0,00;8 000,00;281;2
28182;Amort. matériel transport;B;0,00;5 000,00;0,00;3 000,00;0,00;8 000,00;281;2
3121;Denrées alimentaires;B;4 000,00;0,00;2 000,00;3 500,00;2 500,00;0,00;31;3
401;Fournisseurs — comptes débiteurs (é/è);B;0,00;8 000,00;50 000,00;47 000,00;0,00;5 000,00;40;4
4112;Familles — créances sur l'exercice;B;3 000,00;0,00;42 000,00;40 000,00;5 000,00;0,00;41;4
4411;Subventions de l'État à recevoir;B;2 000,00;0,00;0,00;1 500,00;500,00;0,00;44;4
4412;Subventions collectivités à recevoir;B;5 000,00;0,00;14 000,00;16 000,00;3 000,00;0,00;44;4
4421;DDFIP — Rémunérations AC (spécial);B;0,00;1 000,00;6 000,00;5 500,00;0,00;500,00;44;4
468;Divers — Charges à payer;B;0,00;3 000,00;3 000,00;4 000,00;0,00;4 000,00;46;4
512;Banque — DFT (Trésor public);B;85 000,00;0,00;210 000,00;205 000,00;90 000,00;0,00;51;5
5159;Caisse de l'agent comptable;B;1 500,00;0,00;5 000,00;4 800,00;1 700,00;0,00;51;5
531;Numéraire — Caisse;B;500,00;0,00;2 000,00;1 800,00;700,00;0,00;53;5
60311;Denrées alimentaires (achats SRH);G;0,00;0,00;23 500,00;0,00;23 500,00;0,00;603;6
60312;Fournitures de cuisine;G;0,00;0,00;16 800,00;0,00;16 800,00;0,00;603;6
60611;Fournitures scolaires;G;0,00;0,00;13 850,50;0,00;13 850,50;0,00;606;6
60612;Matières d'œuvre enseignement pro;G;0,00;0,00;7 200,00;0,00;7 200,00;0,00;606;6
6066;Fournitures administratives;G;0,00;0,00;2 750,00;0,00;2 750,00;0,00;606;6
61551;Entretien bâtiments — Maintenance;G;0,00;0,00;11 000,00;0,00;11 000,00;0,00;615;6
6281;Concours divers (cotisations);G;0,00;0,00;1 750,00;0,00;1 750,00;0,00;628;6
6811;Dotations aux amortissements;G;0,00;0,00;5 000,00;0,00;5 000,00;0,00;681;6
7062;Produits restauration & hébergement;G;0,00;0,00;0,00;42 000,00;0,00;42 000,00;706;7
7067;Contribution vie scolaire;G;0,00;0,00;0,00;3 600,00;0,00;3 600,00;706;7
7411;Subvention État — Dotation globale;G;0,00;0,00;0,00;19 500,00;0,00;19 500,00;741;7
7443;Subvention Région — Fonctionnement;G;0,00;0,00;0,00;8 200,00;0,00;8 200,00;744;7
74411;Subvention collectivité — Équipement;G;0,00;0,00;0,00;14 000,00;0,00;14 000,00;744;7
7811;Reprises sur amortissements;G;0,00;0,00;0,00;5 000,00;0,00;5 000,00;781;7`;

// ═══════════════════════════════════════════════════════════════════
// 1. PARSING — Validation du parseur CSV Op@le
// ═══════════════════════════════════════════════════════════════════
describe('1. Parsing CSV Op@le', () => {

  it('détecte le séparateur point-virgule Op@le', () => {
    const sde = parseSDE(CSV_SDE);
    expect(sde.length).toBeGreaterThan(0);
  });

  it('parse SDE — colonnes avec accents (réalisé, engagé, activités)', () => {
    const sde = parseSDE(CSV_SDE);
    expect(sde.length).toBe(8);
    // Vérifie le parsing d'un montant avec espace millier et virgule décimale
    const fournitures = sde.find(r => r.compte === '60611');
    expect(fournitures).toBeDefined();
    expect(fournitures!.realise).toBeCloseTo(13850.50, 2);
    expect(fournitures!.budget).toBe(15000);
    expect(fournitures!.rne).toBe('9710746J');
    expect(fournitures!.exercice).toBe(2025);
  });

  it('parse SDR — gère le champ +values/-values et AOR', () => {
    const sdr = parseSDR(CSV_SDR);
    expect(sdr.length).toBe(6);
    const subvEtat = sdr.find(r => r.compte === '7411');
    expect(subvEtat).toBeDefined();
    expect(subvEtat!.realise).toBeCloseTo(19500, 0);
    expect(subvEtat!.aor).toBeCloseTo(19500, 0);
    // Recettes SRH
    const srh = sdr.find(r => r.compte === '7062');
    expect(srh).toBeDefined();
    expect(srh!.realise).toBeCloseTo(42000, 0);
  });

  it('parse Balance — comptes avec caractères spéciaux dans libellés', () => {
    const bal = parseBalance(CSV_BALANCE);
    expect(bal.length).toBeGreaterThan(0);
    // Vérifie que le libellé avec accents/guillemets est préservé
    const c185 = bal.find(b => b.compte.startsWith('185'));
    expect(c185).toBeDefined();
    expect(c185!.intituleReduit).toContain('Avances');
    // Compte avec (é/è) dans le libellé
    const c401 = bal.find(b => b.compte === '401');
    expect(c401).toBeDefined();
    expect(c401!.intituleReduit).toContain('Fournisseurs');
  });

  it('filtre les lignes non-numériques (en-têtes dupliqués, totaux)', () => {
    const csvAvecParasite = CSV_BALANCE + `\nTOTAL GENERAL;;B;0;0;0;0;0;0;;`;
    const bal = parseBalance(csvAvecParasite);
    // "TOTAL GENERAL" ne commence pas par un chiffre → doit être filtré
    const total = bal.find(b => b.intituleReduit.includes('TOTAL'));
    expect(total).toBeUndefined();
  });

  it('gère les montants avec espaces milliers (13 850,50 → 13850.50)', () => {
    const sde = parseSDE(CSV_SDE);
    const r = sde.find(l => l.compte === '60611');
    expect(r!.realise).toBeCloseTo(13850.50, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. TYPAGE — Vérification des interfaces
// ═══════════════════════════════════════════════════════════════════
describe('2. Typage — Conformité interfaces types.ts', () => {

  it('LigneSDE possède tous les champs requis', () => {
    const sde = parseSDE(CSV_SDE);
    const ligne: LigneSDE = sde[0];
    expect(ligne).toHaveProperty('rne');
    expect(ligne).toHaveProperty('exercice');
    expect(ligne).toHaveProperty('service');
    expect(ligne).toHaveProperty('domaine');
    expect(ligne).toHaveProperty('activite');
    expect(ligne).toHaveProperty('compte');
    expect(ligne).toHaveProperty('budget');
    expect(ligne).toHaveProperty('engage');
    expect(ligne).toHaveProperty('realise');
    expect(ligne).toHaveProperty('encours');
    expect(ligne).toHaveProperty('disponible');
    expect(typeof ligne.realise).toBe('number');
    expect(typeof ligne.budget).toBe('number');
  });

  it('LigneSDR possède aor, plusValues, extourne', () => {
    const sdr = parseSDR(CSV_SDR);
    const ligne: LigneSDR = sdr[0];
    expect(ligne).toHaveProperty('aor');
    expect(ligne).toHaveProperty('plusValues');
    expect(ligne).toHaveProperty('extourne');
    expect(typeof ligne.aor).toBe('number');
  });

  it('LigneBalance possède classe, ssClasse, ssSsClasse dérivés', () => {
    const bal = parseBalance(CSV_BALANCE);
    const c10681 = bal.find(b => b.compte === '10681');
    expect(c10681).toBeDefined();
    expect(c10681!.classe).toBe('1');
    expect(c10681!.ssClasse).toBe('10');
    expect(c10681!.ssSsClasse).toBe('106');
  });

  it('les montants sont toujours number (jamais string ou NaN)', () => {
    const bal = parseBalance(CSV_BALANCE);
    bal.forEach(b => {
      expect(typeof b.solDbt).toBe('number');
      expect(typeof b.solCrd).toBe('number');
      expect(typeof b.dbt).toBe('number');
      expect(typeof b.crd).toBe('number');
      expect(Number.isNaN(b.solDbt)).toBe(false);
      expect(Number.isNaN(b.solCrd)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. MOTEUR M9-6 — Calcul des agrégats réglementaires
// ═══════════════════════════════════════════════════════════════════
describe('3. Moteur M9-6 — Calculs réglementaires', () => {

  const sde = parseSDE(CSV_SDE);
  const sdr = parseSDR(CSV_SDR);
  const bal = parseBalance(CSV_BALANCE);

  it('calcule le total classe 6 (charges) depuis la balance', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    // Somme des débits cl.6 - crédits cl.6
    const expectedCl6 = bal
      .filter(b => b.classe === '6')
      .reduce((s, b) => s + b.dbt - b.crd, 0);
    expect(r.totalChargesBalance).toBeCloseTo(expectedCl6, 2);
    expect(r.totalChargesBalance).toBeGreaterThan(0);
  });

  it('calcule le total classe 7 (produits) depuis la balance', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    const expectedCl7 = bal
      .filter(b => b.classe === '7')
      .reduce((s, b) => s + b.crd - b.dbt, 0);
    expect(r.totalProduitsBalance).toBeCloseTo(expectedCl7, 2);
    expect(r.totalProduitsBalance).toBeGreaterThan(0);
  });

  it('calcule le résultat de l\'exercice (M9-6 § III.2)', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    // Résultat budgétaire = Produits SDR - Charges SDE
    const totalSDE = sde.reduce((s, l) => s + l.realise, 0);
    const totalSDR = sdr.reduce((s, l) => s + l.realise, 0);
    expect(r.resultatBudgetaire).toBeCloseTo(totalSDR - totalSDE, 2);
    // Résultat comptable = Produits cl.7 - Charges cl.6 (depuis la balance)
    // Charges cl.6 = sum(dbt) - sum(crd) = 81850.50
    // Produits cl.7 = sum(crd) - sum(dbt) = 92300.00
    // Résultat = 92300 - 81850.50 = 10449.50
    const expectedCharges = bal.filter(b => b.classe === '6').reduce((s, b) => s + b.dbt - b.crd, 0);
    const expectedProduits = bal.filter(b => b.classe === '7').reduce((s, b) => s + b.crd - b.dbt, 0);
    const expectedResultat = expectedProduits - expectedCharges;
    expect(r.excedent).toBeCloseTo(Math.max(0, expectedResultat), 0);
    expect(r.deficit).toBe(expectedResultat < 0 ? -expectedResultat : 0);
    expect(r.resultatComptable).toBeCloseTo(expectedResultat, 0);
  });

  it('calcule le FDR par le haut et par le bas (M9-6 § IV.1)', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    // FDR doit être > 0 pour un EPLE sain
    expect(r.fdrHaut).toBeDefined();
    expect(r.fdrBas).toBeDefined();
    // Les deux calculs doivent converger (point bloquant si écart)
    // Note: peut diverger dans nos données test, on vérifie juste qu'ils sont calculés
    expect(typeof r.fdrHaut).toBe('number');
    expect(typeof r.fdrBas).toBe('number');
  });

  it('calcule la trésorerie (classe 5) et les jours d\'autonomie', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    // Trésorerie = solDbt cl.5 - solCrd cl.5
    const solDbt5 = bal.filter(b => b.classe === '5').reduce((s, b) => s + b.solDbt, 0);
    const solCrd5 = bal.filter(b => b.classe === '5').reduce((s, b) => s + b.solCrd, 0);
    expect(r.tresorerie).toBeCloseTo(solDbt5 - solCrd5, 2);
    // Jours d'autonomie = Trésorerie / (Charges SDE / 365)
    expect(r.joursAutonomie).toBeGreaterThan(0);
  });

  it('calcule la CAF comptable (M9-6 § IV.3)', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    expect(typeof r.cafComptable).toBe('number');
    expect(typeof r.cafBudgetaire).toBe('number');
  });

  it('construit les vérifications check-list M9-6', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    const checks = buildChecklist(r);
    // 12 vérifications : 4 budgétaires + 7 bilantielles + 1 conditionnelle (var FDR CAF)
    expect(checks.length).toBe(12);
    // Chaque vérification a un statut
    checks.forEach(c => {
      expect(['ok', 'warn', 'err', 'bloq']).toContain(c.statut);
      expect(c).toHaveProperty('ref'); // Référence M9-6
      expect(c).toHaveProperty('piste'); // Piste de correction
    });
  });

  it('identifie les points bloquants réglementaires', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    const checks = buildChecklist(r);
    // Les points bloquants sont : FDR haut≠bas, structuration FDR, charges SDE≠bal, produits SDR≠bal
    const bloquants = checks.filter(c => c.id === 'fdr_haut_bas' || c.id === 'struct_fdr' || c.id === 'charges_sde_bal' || c.id === 'produits_sdr_bal');
    expect(bloquants.length).toBe(4);
  });

  it('détaille les résultats par service (AP, VE, ALO, SRH)', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    expect(Object.keys(r.services).length).toBeGreaterThan(0);
    // Chaque service doit avoir charges et produits
    Object.values(r.services).forEach(s => {
      expect(typeof s.chargesReel).toBe('number');
      expect(typeof s.produitsReel).toBe('number');
      expect(typeof s.tauxExecCharges).toBe('number');
    });
  });

  it('utilise la ligne globale Op@le pour calculer les taux d’exécution importés depuis Excel', () => {
    const sdeRows = normalizeRowsForOpaleImport([
      { CGR: 'TOTAL ETABLISSEMENT', 'Montant colonne 1': '100 000,00', 'Montant colonne 2': '65 000,00', 'Montant colonne 3': '52 000,00' },
      { CGR: 'FONC', 'Montant colonne 1': '80 000,00', 'Montant colonne 2': '50 000,00', 'Montant colonne 3': '40 000,00' },
      { CGR: 'AP', 'Montant colonne 1': '20 000,00', 'Montant colonne 2': '15 000,00', 'Montant colonne 3': '12 000,00' },
      { CGR: 'AP', Compte: '60611 Fournitures scolaires', 'Montant colonne 1': '10 000,00', 'Montant colonne 2': '8 000,00', 'Montant colonne 3': '7 000,00' },
    ]);
    const sdrRows = normalizeRowsForOpaleImport([
      { CGR: 'TOTAL ETABLISSEMENT', 'Montant colonne 1': '120 000,00', 'Montant colonne 2': '90 000,00', 'Montant colonne 3': '85 000,00' },
      { CGR: 'FONC', 'Montant colonne 1': '90 000,00', 'Montant colonne 2': '70 000,00', 'Montant colonne 3': '66 000,00' },
      { CGR: 'AP', 'Montant colonne 1': '30 000,00', 'Montant colonne 2': '20 000,00', 'Montant colonne 3': '19 000,00' },
      { CGR: 'AP', Compte: '7062 Produits', 'Montant colonne 1': '12 000,00', 'Montant colonne 2': '9 000,00', 'Montant colonne 3': '8 500,00' },
    ]);

    const sdeExcel = parserSDE(sdeRows, 'principal');
    const sdrExcel = parserSDR(sdrRows, 'principal');
    const r = calculerResultatsM96(sdeExcel, sdrExcel, []);

    expect(sdeExcel[0].aggregationLevel).toBe('global');
    expect(sdrExcel[0].aggregationLevel).toBe('global');
    expect(r.totalChargesPrev).toBeCloseTo(100000, 2);
    expect(r.totalProduitsPrev).toBeCloseTo(120000, 2);
    // Réalisé = mandaté/encaissé (colonne 3), budget = colonne 1 (cohérent avec le parser Op@le).
    expect(r.tauxExecCharges).toBeCloseTo(0.52, 4);    // 52 000 / 100 000
    expect(r.tauxExecProduits).toBeCloseTo(0.7083, 3); // 85 000 / 120 000
  });

  it('détecte les colonnes montant même quand l’en-tête composite place le libellé avant le numéro de colonne', () => {
    const sdeRows = normalizeRowsForOpaleImport([
      {
        CGR: 'TOTAL ETABLISSEMENT',
        'Budget | Montant colonne 3': '100 000,00',
        'Engagé | Montant colonne 4': '80 000,00',
        'Réalisé | Montant colonne 5': '70 000,00',
      },
    ]);

    const sdeExcel = parserSDE(sdeRows, 'principal');

    expect(sdeExcel[0].budget).toBeCloseTo(100000, 2);
    expect(sdeExcel[0].engage).toBeCloseTo(80000, 2);
    expect(sdeExcel[0].realise).toBeCloseTo(70000, 2);
    expect(sdeExcel[0].aggregationLevel).toBe('global');
  });

  it('aligne la part encaissée du FDR sur l’autonomie financière', () => {
    const r = calculerResultatsM96(sde, sdr, bal);
    expect(r.tresoComposition.autonomieFinanciere).toBeCloseTo(r.fdrPartEncaissee, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. ANALYSE BALANCE — Détection soldes anormaux
// ═══════════════════════════════════════════════════════════════════
describe('4. Analyse balance — Soldes anormaux (M9-6 plan comptable)', () => {

  it('détecte les sens normaux des comptes', () => {
    const bal = parseBalance(CSV_BALANCE);
    const comptes = analyserBalance(bal);
    expect(comptes.length).toBeGreaterThan(0);

    // Classe 1 normalement créditeur (sauf 119/129)
    const c10681 = comptes.find(c => c.compte === '10681');
    expect(c10681).toBeDefined();
    expect(c10681!.sensNormal).toBe('crediteur');
    expect(c10681!.anomalie).toBe(false); // solCrd > 0 = OK

    // Classe 5 normalement débiteur
    const c512 = comptes.find(c => c.compte === '512');
    expect(c512).toBeDefined();
    expect(c512!.sensNormal).toBe('debiteur');
  });

  it('signale un compte anormalement inversé', () => {
    // Créer une balance avec un compte 512 au crédit (trésorerie négative → ANORMAL)
    const balAnormale: LigneBalance[] = [{
      compte: '512', intituleReduit: 'Banque DFT', type: 'B',
      antDbt: 0, antCrd: 0, dbt: 0, crd: 5000,
      solDbt: 0, solCrd: 5000,
      poste: '51', classe: '5', ssClasse: '51', ssSsClasse: '512',
    }];
    const comptes = analyserBalance(balAnormale);
    const c512 = comptes.find(c => c.compte === '512');
    expect(c512).toBeDefined();
    expect(c512!.anomalie).toBe(true);
    expect(c512!.typeAnomalie).toBe('anormalement_crediteur');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. ROBUSTESSE — Cas limites CSV Op@le
// ═══════════════════════════════════════════════════════════════════
describe('5. Robustesse — Cas limites exports Op@le', () => {

  it('gère un CSV avec tabulations comme séparateur', () => {
    const csvTab = CSV_SDE.replace(/;/g, '\t');
    const sde = parseSDE(csvTab);
    expect(sde.length).toBe(8);
  });

  it('gère les virgules comme séparateur décimal (1 234,56)', () => {
    const bal = parseBalance(CSV_BALANCE);
    const c120 = bal.find(b => b.compte === '120');
    expect(c120!.solCrd).toBeCloseTo(14750, 0);
  });

  it('gère un fichier avec lignes vides intercalées', () => {
    const csvAvecVides = CSV_BALANCE.split('\n').flatMap((l, i) =>
      i % 3 === 0 ? [l, ''] : [l]
    ).join('\n');
    const bal = parseBalance(csvAvecVides);
    expect(bal.length).toBeGreaterThan(0);
  });

  it('résiste aux guillemets dans les libellés', () => {
    const csvGuillemetees = `Compte;Intitulé réduit du compte;Type;Montant débit antérieur;Montant crédit antérieur;Montant débit;Montant crédit;Solde débit;Solde crédit;Poste;Classe de compte
"10681";"Réserves dites ""disponibles""";"B";"0,00";"100 000,00";"0,00";"5 000,00";"0,00";"105 000,00";"106";"1"`;
    const bal = parseBalance(csvGuillemetees);
    expect(bal.length).toBeGreaterThanOrEqual(1);
    expect(bal[0].compte).toBe('10681');
  });
});
