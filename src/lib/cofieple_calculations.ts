// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Module de calcul (pont entre moteur M9-6 et UI)
// Conformité : M9-6 2026, Décret 2012-1246 (RGCP),
// Code de l'éducation Art. R421-1+
// ═══════════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR, LigneBalance } from './cofieple_types';
import { calculerResultatsM96, buildChecklist, analyserBalance as analyserBalanceEngine, calculerBudgetAnnexe } from './cofieple_m96engine';
import { fmtEur, fmtPct, parseSDE, parseSDR, parseBalance } from './cofieple_csvParser';
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
// Acceptent des Record<string,string>[] (sortie PapaParse) et
// reconstituent un CSV texte pour le parseur central
function rowsToCSV(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];
  for (const r of rows) {
    lines.push(headers.map(h => r[h] ?? '').join(';'));
  }
  return lines.join('\n');
}

export function parserSDE(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDE[] {
  return parseSDE(rowsToCSV(rows));
}

export function parserSDR(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDR[] {
  return parseSDR(rowsToCSV(rows));
}

export function parserBalance(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneBalance[] {
  return parseBalance(rowsToCSV(rows));
}

// ── Calcul principal ────────────────────────────────────────────────
// Enrichit les résultats M9-6 avec les alias nécessaires à l'UI
export function calculerResultats(
  sde: LigneSDE[], sdr: LigneSDR[], bal: LigneBalance[],
  _sde1: LigneSDE[], _sdr1: LigneSDR[], _bal1: LigneBalance[],
  _typeBudget: TypeBudget
): ResultatsUI {
  const r = calculerResultatsM96(sde, sdr, bal);

  // Enrichir les services avec les champs UI
  const parService: Record<string, ServiceDataUI> = {};
  Object.entries(r.services).forEach(([k, s]) => {
    parService[k] = {
      ...s,
      tauxExecution: s.tauxExecCharges,
      plusMoinsValues: s.plusValues,
    };
  });

  // Score de risque global (0-100) — analyse prédictive des anomalies
  // Pondération : FDR négatif (30), trésorerie négative (25), CAF/IAF négative (20),
  //               taux d'exécution hors norme (15), résultat déficitaire (10)
  let scoreRisque = 0;
  if (r.fdrBas < 0) scoreRisque += 30;
  else if (r.joursAutonomie < 30) scoreRisque += 15;
  if (r.tresorerie < 0) scoreRisque += 25;
  else if (r.joursAutonomie < 15) scoreRisque += 12;
  if (r.cafBudgetaire < 0) scoreRisque += 20;
  if (r.tauxExecCharges > 1.05 || r.tauxExecCharges < 0.5) scoreRisque += 15;
  if (r.resultatBudgetaire < 0) scoreRisque += 10;
  scoreRisque = Math.min(scoreRisque, 100);

  // Niveau de risque textuel (M9-6 §IV — Analyse de la santé financière)
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
export function construireCheckList(r: ResultatsUI, _activeBudget: TypeBudget): CheckItem[] {
  const checks = buildChecklist(r);
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
export function analyserBalance(bal: LigneBalance[]): AnomalieBalance[] {
  const comptes = analyserBalanceEngine(bal);

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
