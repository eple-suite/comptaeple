// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Module de calcul (pont entre moteur M9-6 et UI)
// Conformité : M9-6 2026, Décret 2012-1246 (RGCP),
// Code de l'éducation Art. R421-1+
// ═══════════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR, LigneBalance } from './cofieple_types';
import { calculerResultatsM96, buildChecklist, analyserBalance as analyserBalanceEngine, calculerBudgetAnnexe } from './cofieple_m96engine';
import { fmtEur, fmtPct, parseSDE, parseSDR, parseBalance, detectBudgetType } from './cofieple_csvParser';
import type {
  TypeBudget, ResultatsUI, CheckItem, AnomalieBalance,
  ServiceDataUI, IndicateursBA,
} from './cofieple_storeTypes';

// ── Re-exports utilitaires ───────────────────────────────────────────
export const formatEur = fmtEur;
export const formatPct = fmtPct;

// ── Parseurs ────────────────────────────────────────────────────────
// Re-export direct depuis cofieple_csvParser — pas de duplication
export { parseSDE, parseSDR, parseBalance } from './cofieple_csvParser';

// Wrappers nommés pour compatibilité avec les composants
// Acceptent des Record<string,string>[] (sortie PapaParse/XLSX) et
// reconstituent un CSV texte pour le parseur central.
// Utilise ';' comme séparateur et normalise les en-têtes.
function rowsToCSV(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];
  for (const r of rows) {
    lines.push(headers.map(h => {
      const val = r[h] ?? '';
      // Escape semicolons in values
      return String(val).includes(';') ? `"${val}"` : String(val);
    }).join(';'));
  }
  return lines.join('\n');
}

/** Normalize a header: lowercase, remove accents, trim */
function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Find a value in a row by trying multiple possible column names (accent-insensitive) */
function findCol(row: Record<string, string>, ...names: string[]): string {
  // Try exact match first
  for (const n of names) {
    if (n in row) return String(row[n] ?? '');
  }
  // Try normalized match
  const normalizedNames = names.map(normalizeHeader);
  for (const [key, val] of Object.entries(row)) {
    const nk = normalizeHeader(key);
    if (normalizedNames.includes(nk)) return String(val ?? '');
    // Partial match (startsWith)
    for (const nn of normalizedNames) {
      if (nk.startsWith(nn) || nn.startsWith(nk)) return String(val ?? '');
    }
  }
  return '';
}

function toNumDirect(v: string): number {
  if (!v || v === '') return 0;
  let s = String(v).trim().replace(/[\s\u00A0]/g, '');
  if (!s) return 0;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }

  s = s.replace(/[^0-9,.-]/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    if (/,-?\d{3}$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
  } else if (hasDot) {
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) s = s.replace(/\./g, '');
    else if (/\.\d{3}$/.test(s)) s = s.replace('.', '');
  }

  const parsed = parseFloat(s);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

export function parserSDE(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDE[] {
  // Try direct row parsing first; fallback to CSV reconversion
  if (rows.length === 0) return [];
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  // Check if we can find expected columns directly
  const hasDirectCols = keys.some(k => {
    const nk = normalizeHeader(k);
    return nk.includes('service') || nk.includes('compte') || nk.includes('budget');
  });
  if (hasDirectCols) {
    return rows.map(r => ({
      rne: findCol(r, 'RNE', 'rne'),
      exercice: Math.round(toNumDirect(findCol(r, 'exercice', 'Exercice'))) || new Date().getFullYear(),
      service: findCol(r, 'service', 'Service'),
      domaine: findCol(r, 'domaine', 'Domaine'),
      activite: findCol(r, 'activités', 'activite', 'Activité', 'activites'),
      compte: findCol(r, 'compte', 'Compte').replace(/\s.*/, '').substring(0, 6),
      budget: toNumDirect(findCol(r, 'budget', 'Budget', 'BUDGET', 'Prévisions', 'previsions', 'prévisions', 'Crédits ouverts', 'credits ouverts', 'Credits ouverts')),
      engage: toNumDirect(findCol(r, 'engagé', 'engage', 'Engagé', 'Engage', 'ENGAGE')),
      realise: toNumDirect(findCol(r, 'réalisé', 'realise', 'Réalisé', 'Realise', 'REALISE', 'mandaté', 'Mandaté', 'mandate', 'Mandate', 'MANDATE', 'liquidé', 'Liquidé')),
      encours: toNumDirect(findCol(r, 'en cours', 'encours', 'En cours')),
      disponible: toNumDirect(findCol(r, 'disponible', 'Disponible')),
      ext: findCol(r, 'EXT', 'ext'),
    })).filter(r => r.service !== '' || r.compte !== '');
  }
  return parseSDE(rowsToCSV(rows));
}

export function parserSDR(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDR[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const hasDirectCols = keys.some(k => {
    const nk = normalizeHeader(k);
    return nk.includes('service') || nk.includes('compte') || nk.includes('budget');
  });
  if (hasDirectCols) {
    return rows.map(r => ({
      rne: findCol(r, 'RNE', 'rne'),
      exercice: Math.round(toNumDirect(findCol(r, 'exercice', 'Exercice'))) || new Date().getFullYear(),
      service: findCol(r, 'service', 'Service'),
      domaine: findCol(r, 'domaine', 'Domaine'),
      activite: findCol(r, 'activités', 'activite', 'Activité', 'activites'),
      compte: findCol(r, 'compte', 'Compte').replace(/\s.*/, '').substring(0, 6),
      budget: toNumDirect(findCol(r, 'budget', 'Budget', 'BUDGET', 'Prévisions', 'previsions', 'prévisions', 'Crédits ouverts', 'credits ouverts')),
      engage: toNumDirect(findCol(r, 'engagé', 'engage', 'Engagé', 'Engage', 'ENGAGE')),
      aor: toNumDirect(findCol(r, 'aor', 'AOR', 'émis', 'Émis', 'emis', 'Emis')),
      realise: toNumDirect(findCol(r, 'réalisé', 'realise', 'Réalisé', 'Realise', 'REALISE', 'aor', 'AOR', 'émis', 'Émis', 'emis', 'Emis', 'titré', 'Titré')),
      encours: toNumDirect(findCol(r, 'en cours', 'encours', 'En cours')),
      plusValues: toNumDirect(findCol(r, '+values/-values', 'plusValues', '+values')),
      extourne: findCol(r, 'EXTOURNE', 'extourne') || 'N',
    })).filter(r => r.service !== '' || r.compte !== '');
  }
  return parseSDR(rowsToCSV(rows));
}

export function parserBalance(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneBalance[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const hasDirectCols = keys.some(k => {
    const nk = normalizeHeader(k);
    return nk.includes('compte') || nk.includes('solde') || nk.includes('debit') || nk.includes('credit');
  });
  if (hasDirectCols) {
    return rows
      .filter(r => {
        const compteSource = findCol(r, 'Compte', 'compte', 'Compte et intitulé', 'Compte et intitule');
        return compteSource && /^\d/.test(compteSource) && compteSource.length >= 3;
      })
      .map(r => {
        const compteSource = findCol(r, 'Compte', 'compte', 'Compte et intitulé', 'Compte et intitule');
        const compte = compteSource.replace(/[^0-9]/g, '').substring(0, 9);
        const intituleDepuisCompte = compteSource.replace(/^\s*\d+\s*-\s*/, '').trim();
        const intituleExplicite = findCol(
          r,
          'Intitulé réduit du compte',
          'intitule',
          'Libellé',
          'Intitule reduit du compte',
          'Compte et intitulé',
          'Compte et intitule',
        ).replace(/^\s*\d+\s*-\s*/, '').trim();

        return {
          compte,
          intituleReduit: intituleExplicite || intituleDepuisCompte || compte,
          type: findCol(r, 'Type', 'type'),
          antDbt: toNumDirect(findCol(r, 'Montant débit antérieur', 'Montant debit anterieur', 'antDbt')),
          antCrd: toNumDirect(findCol(r, 'Montant crédit antérieur', 'Montant credit anterieur', 'antCrd')),
          dbt: toNumDirect(findCol(r, 'Montant débit', 'Montant debit', 'dbt')),
          crd: toNumDirect(findCol(r, 'Montant crédit', 'Montant credit', 'crd')),
          solDbt: toNumDirect(findCol(r, 'Solde débit', 'Solde debit', 'solDbt')),
          solCrd: toNumDirect(findCol(r, 'Solde crédit', 'Solde credit', 'solCrd')),
          poste: findCol(r, 'Poste', 'poste'),
          classe: compte.charAt(0),
          ssClasse: compte.substring(0, 2),
          ssSsClasse: compte.substring(0, 3),
          etablissement: findCol(r, 'Etablissement', 'etablissement'),
        };
      })
      .filter(r => r.compte !== '');
  }
  return parseBalance(rowsToCSV(rows));
}

// ── Calcul principal ────────────────────────────────────────────────
// Enrichit les résultats M9-6 avec les alias nécessaires à l'UI
export function calculerResultats(
  sde: LigneSDE[], sdr: LigneSDR[], bal: LigneBalance[],
  sde1: LigneSDE[], sdr1: LigneSDR[], _bal1: LigneBalance[],
  _typeBudget: TypeBudget
): ResultatsUI {
  // Detect if this is an annexe budget based on balance data
  const isAnnexe = _typeBudget !== 'principal' || (bal.length > 0 && detectBudgetType(bal).isAnnexe);
  const r = calculerResultatsM96(sde, sdr, bal, { isAnnexe });

  // ── Fallback Balance classes 6/7 quand SDE/SDR à zéro ───────────
  // Si les totaux SDE ou SDR sont nuls mais que la balance contient
  // des mouvements sur les classes 6 (charges) et 7 (produits),
  // on utilise ces derniers comme valeurs de secours pour éviter
  // un rapport entièrement à zéro.
  if (bal.length > 0) {
    const sumBalField = (test: (c: string) => boolean, field: 'dbt' | 'crd' | 'solDbt' | 'solCrd') =>
      bal.filter(b => test(b.compte)).reduce((s, b) => s + ((b[field] as number) || 0), 0);

    const dbtCl6 = sumBalField(c => c.charAt(0) === '6', 'dbt');
    const crdCl6 = sumBalField(c => c.charAt(0) === '6', 'crd');
    const crdCl7 = sumBalField(c => c.charAt(0) === '7', 'crd');
    const dbtCl7 = sumBalField(c => c.charAt(0) === '7', 'dbt');
    const chargesBalance = dbtCl6 - crdCl6;
    const produitsBalance = crdCl7 - dbtCl7;

    if (r.totalChargesSde === 0 && chargesBalance > 0) {
      r.totalChargesSde = chargesBalance;
    }
    if (r.totalProduitsSdr === 0 && produitsBalance > 0) {
      r.totalProduitsSdr = produitsBalance;
    }
    // Fallback pour le budget initial (prévisions) : si les prévisions sont
    // à zéro mais que les réalisés existent, utiliser les réalisés comme proxy.
    // Cela permet d'afficher des valeurs cohérentes dans le §12 et partout
    // où totalChargesPrev / totalProduitsPrev sont utilisés.
    if (r.totalChargesPrev === 0 && r.totalChargesSde > 0) {
      r.totalChargesPrev = r.totalChargesSde;
    }
    if (r.totalProduitsPrev === 0 && r.totalProduitsSdr > 0) {
      r.totalProduitsPrev = r.totalProduitsSdr;
    }
    // Recalcul des taux d'exécution
    if (r.totalChargesPrev > 0) {
      r.tauxExecCharges = r.totalChargesSde / r.totalChargesPrev;
    }
    if (r.totalProduitsPrev > 0) {
      r.tauxExecProduits = r.totalProduitsSdr / r.totalProduitsPrev;
    }
    // Recalcul du résultat budgétaire
    r.resultatBudgetaire = r.totalProduitsSdr - r.totalChargesSde;
  }

  // ── Populate N-1 from imported SDE-1/SDR-1 ──────────────────────
  const totalChargesSdeN1 = sde1.reduce((s, row) => s + row.realise, 0);
  const totalProduitsSdrN1 = sdr1.reduce((s, row) => s + row.realise, 0);
  const resultatBudgetaireN1 = totalProduitsSdrN1 - totalChargesSdeN1;

  // Update domaines with N-1 data from sde1/sdr1
  const buildDomKey = (d: string) => (d || '').charAt(0) || '0';
  if (sde1.length > 0 || sdr1.length > 0) {
    sde1.forEach(row => {
      const dk = buildDomKey(row.domaine);
      if (r.domaines[dk]) r.domaines[dk].chargesReelN1 += row.realise;
    });
    sdr1.forEach(row => {
      const dk = buildDomKey(row.domaine);
      if (r.domaines[dk]) r.domaines[dk].produitsReelN1 += row.realise;
    });
    Object.values(r.domaines).forEach(d => {
      d.variationCharges = d.chargesReel - d.chargesReelN1;
      d.pctVariationCharges = d.chargesReelN1 > 0 ? (d.variationCharges / d.chargesReelN1) * 100 : 0;
      d.variationProduits = d.produitsReel - d.produitsReelN1;
      d.pctVariationProduits = d.produitsReelN1 > 0 ? (d.variationProduits / d.produitsReelN1) * 100 : 0;
    });
  }

  // Override N-1 values with imported data
  r.totalChargesSdeN1 = totalChargesSdeN1;
  r.totalProduitsSdrN1 = totalProduitsSdrN1;
  r.resultatBudgetaireN1 = resultatBudgetaireN1;

  // CAF budgétaire N-1 = Résultat N-1 + Charges OO SDE N-1 - Produits OO SDR N-1
  if (sde1.length > 0 || sdr1.length > 0) {
    const chargesOrdre_SDE_N1 = sde1.filter(row => /^(68|675)/.test(row.compte)).reduce((s, row) => s + row.realise, 0);
    const produitsOrdre_SDR_N1 = sdr1.filter(row => /^(78|775|776|777)/.test(row.compte)).reduce((s, row) => s + row.realise, 0);
    r.cafBudgetaireN1 = resultatBudgetaireN1 + chargesOrdre_SDE_N1 - produitsOrdre_SDR_N1;
  }

  // Enrichir les services avec les champs UI
  const parService: Record<string, ServiceDataUI> = {};
  Object.entries(r.services).forEach(([k, s]) => {
    parService[k] = {
      ...s,
      tauxExecution: s.tauxExecCharges,
      plusMoinsValues: s.plusValues,
    };
  });

  // Score de risque global (0-100)
  let scoreRisque = 0;
  if (r.fdrBas < 0) scoreRisque += 30;
  else if (r.joursAutonomie < 30) scoreRisque += 15;
  if (r.tresorerie < 0) scoreRisque += 25;
  else if (r.joursAutonomie < 15) scoreRisque += 12;
  if (r.cafBudgetaire < 0) scoreRisque += 20;
  if (r.tauxExecCharges > 1.05 || r.tauxExecCharges < 0.5) scoreRisque += 15;
  if (r.resultatBudgetaire < 0) scoreRisque += 10;
  scoreRisque = Math.min(scoreRisque, 100);

  const niveauRisque: 'faible' | 'modéré' | 'élevé' | 'critique' =
    scoreRisque <= 15 ? 'faible' :
    scoreRisque <= 40 ? 'modéré' :
    scoreRisque <= 70 ? 'élevé' : 'critique';

  return {
    ...r,
    totalChargesReel: r.totalChargesSde,
    totalProduitsReel: r.totalProduitsSdr,
    plusMoinsValues: r.totalProduitsSdr - r.totalProduitsPrev,
    reliquatsCharges: r.totalChargesPrev - r.totalChargesSde,
    tresorerieNette: r.tresorerie,
    varFdrDepuisCaf: r.varFdrCaf,
    varBfrComptable: r.varBfrSoustractive,
    totalFluxTresorerie: r.fluxNetsTresorerie,
    parService,
    scoreRisque,
    niveauRisque,
  };
}

// ── Consolidation BP + BA ───────────────────────────────────────────
// M9-6 2026 Titre III § III.4 — Élimination des flux internes (cpte 185)
export function consolider(bp: ResultatsUI, annexes: ResultatsUI[]): ResultatsUI {
  const totalChargesReel = bp.totalChargesReel + annexes.reduce((s, a) => s + a.totalChargesReel, 0);
  const totalProduitsReel = bp.totalProduitsReel + annexes.reduce((s, a) => s + a.totalProduitsReel, 0);

  // Élimination des flux internes via compte 185
  // Les quote-parts de frais généraux (BP → BA) et reversements (BA → BP)
  // apparaissent des deux côtés et doivent être neutralisés
  const fluxInternes185BP = bp.reserves; // Approximation — en production, utiliser le solde réel du 185
  const fluxInternesElimines = 0; // Sera calculé précisément quand les balances BP et BA sont disponibles

  return {
    ...bp,
    totalChargesReel,
    totalProduitsReel,
    totalChargesSde: totalChargesReel,
    totalProduitsSdr: totalProduitsReel,
    resultatBudgetaire: totalProduitsReel - totalChargesReel,
    fdrComptable: bp.fdrComptable + annexes.reduce((s, a) => s + (a.fdrComptable || 0), 0),
    tresorerieNette: bp.tresorerieNette + annexes.reduce((s, a) => s + (a.tresorerieNette || 0), 0),
    tresorerie: bp.tresorerie + annexes.reduce((s, a) => s + (a.tresorerie || 0), 0),
    bfr: bp.bfr + annexes.reduce((s, a) => s + (a.bfr || 0), 0),
    indicateursBA: {
      soldeComptes185: 0,
      comptes185Dbt: 0,
      comptes185Crd: 0,
      fluxInternesElimines,
    },
  };
}

// ── Checklist M9-6 ──────────────────────────────────────────────────
// 15 vérifications réglementaires — M9-6 §§ II, III, IV
// Points bloquants identifiés conformément au Décret 2012-1246 art. 195-199
export function construireCheckList(r: ResultatsUI, _activeBudget: TypeBudget, bal?: LigneBalance[], sde?: any[], sdr?: any[]): CheckItem[] {
  const isAnnexe = _activeBudget !== 'principal';
  const hasSDE = (sde && sde.length > 0) || r.totalChargesSde !== 0;
  const hasSDR = (sdr && sdr.length > 0) || r.totalProduitsSdr !== 0;
  const checks = buildChecklist(r, { isAnnexe, bal, hasSDE, hasSDR });
  return checks.map(c => ({
    id: c.id,
    titre: c.titre,
    regleM96: c.ref,
    variable1Label: c.v1Label,
    variable1: c.v1,
    variable2Label: c.v2Label,
    variable2: c.v2,
    ecart: c.ecart,
    statut: c.statut === 'bloq' ? 'bloquant' as const :
            c.statut === 'err' ? 'erreur' as const :
            c.statut === 'warn' ? 'warn' as const : 'ok' as const,
    bloquant: c.bloquant,
    piste: c.piste,
  }));
}

// ── Analyse des soldes anormaux ──────────────────────────────────────
// Conformément à la M9-6 2026 Plan comptable EPLE
// Sens normal : Classe 1 créditeur (sauf 119), Classe 2 débiteur (sauf 28/29),
// Classe 3 débiteur (sauf 39), Classe 4 variable, Classe 5 débiteur (sauf 519),
// Classe 6 débiteur, Classe 7 créditeur
export function analyserBalance(bal: LigneBalance[], options?: { hasAnnexe?: boolean }): AnomalieBalance[] {
  const comptes = analyserBalanceEngine(bal, options);

  // Comptes critiques dont l'anomalie est bloquante pour le compte financier
  // (provoquent un déséquilibre FDR, BFR ou un résultat faussé)
  const comptesCritiques = new Set([
    '120', '129', '512', '515', '531', // résultat & trésorerie (DFT, caisse)
    '401', '411', '421', // fournisseurs, familles/redevables, personnel
    '4411', '4412', // subventions État / collectivités territoriales
    '185', // comptes de liaison BP/BA
  ]);

  return comptes.map(c => {
    const isCritique = comptesCritiques.has(c.compte.substring(0, 3)) ||
                       comptesCritiques.has(c.compte.substring(0, 4));
    const sensLabel = c.sensNormal === 'debiteur' ? 'débiteur' :
                      c.sensNormal === 'crediteur' ? 'créditeur' :
                      c.sensNormal === 'mixte' ? 'mixte' : 'nul';
    let conseqM96 = '';
    if (c.anomalie) {
      if (c.compte.startsWith('5')) {
        conseqM96 = 'Trésorerie négative — Obligation de signalement au comptable supérieur (RGCP art. 28, M9-6 § IV.2)';
      } else if (c.compte.startsWith('185')) {
        conseqM96 = 'Déséquilibre des comptes de liaison BP/BA — M9-6 § III.4.2';
      } else if (c.compte.startsWith('1')) {
        conseqM96 = 'Impact direct sur le FDR — Vérifier le bilan de l\'EPLE (M9-6 § IV.1)';
      } else if (c.compte.startsWith('4')) {
        conseqM96 = 'Impact sur le BFR — Vérifier la concordance ordonnateur/agent comptable (M9-6 § II)';
      } else if (c.compte.startsWith('6') || c.compte.startsWith('7')) {
        conseqM96 = 'Impact sur le résultat de l\'exercice — Vérifier les opérations d\'ordre et écritures de fin d\'exercice';
      } else if (c.compte.startsWith('2')) {
        conseqM96 = 'Impact sur les immobilisations — Vérifier l\'inventaire physique et les dotations aux amortissements (M9-6 § III.3)';
      } else if (c.compte.startsWith('3')) {
        conseqM96 = 'Impact sur les stocks — Vérifier la variation de stocks et l\'inventaire physique (M9-6 § III.3)';
      } else {
        conseqM96 = c.commentaire || 'Solde anormal — Plan comptable M9-6 EPLE';
      }
    }

    return {
      compte: c.compte,
      intitule: c.intitule,
      classe: c.classe,
      sensAttendu: sensLabel,
      solDbt: c.solDbt,
      solCrd: c.solCrd,
      anomalie: c.anomalie,
      gravite: c.anomalie && isCritique ? 'bloquant' as const :
               c.anomalie ? 'anomalie' as const : 'normal' as const,
      conseqM96,
    };
  });
}
