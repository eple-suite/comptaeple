// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Module de calcul (pont entre moteur M9-6 et UI)
// Assure la conformité : M9-6 2026, Décret 2012-1246 (RGCP),
// Code de l'éducation Art. R421-1+
// ═══════════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR, LigneBalance } from './cofieple_types';
import { calculerResultatsM96, buildChecklist, analyserBalance as analyserBalanceEngine, calculerBudgetAnnexe } from './cofieple_m96engine';
import { fmtEur, fmtPct } from './cofieple_csvParser';
import type {
  TypeBudget, ResultatsUI, CheckItem, AnomalieBalance,
  ServiceDataUI, IndicateursBA,
} from './cofieple_storeTypes';

// ── Re-exports utilitaires ───────────────────────────────────────────
export const formatEur = fmtEur;
export const formatPct = fmtPct;

// ── Parseurs ────────────────────────────────────────────────────────
// Re-export des parseurs CSV Op@le
export { parseSDE, parseSDR, parseBalance } from './cofieple_csvParser';

// Wrappers nommés pour compatibilité avec les composants originaux
export function parserSDE(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDE[] {
  // Reconstruit le texte CSV à partir des rows pour le parseur existant
  // Alternative : utiliser directement les rows parsées par PapaParse
  return rows.map(r => {
    const toNum = (v: unknown): number => {
      if (v == null || v === '') return 0;
      const s = String(v).replace(/\s/g, '').replace(',', '.');
      return parseFloat(s) || 0;
    };
    const toStr = (v: unknown): string => String(v ?? '').trim();
    const compte = toStr(r['compte'] || r['Compte'] || '').replace(/\s.*/, '').substring(0, 6);
    return {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget'] || r['BUDGET']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé']),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé']),
      encours: toNum(r['en cours'] || r['encours'] || '0'),
      disponible: toNum(r['disponible'] || r['Disponible'] || '0'),
      ext: toStr(r['EXT'] || r['ext'] || ''),
    };
  }).filter(r => r.service !== '' || r.compte !== '');
}

export function parserSDR(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneSDR[] {
  return rows.map(r => {
    const toNum = (v: unknown): number => {
      if (v == null || v === '') return 0;
      const s = String(v).replace(/\s/g, '').replace(',', '.');
      return parseFloat(s) || 0;
    };
    const toStr = (v: unknown): string => String(v ?? '').trim();
    const compte = toStr(r['compte'] || r['Compte'] || '').replace(/\s.*/, '').substring(0, 6);
    return {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé']),
      aor: toNum(r['aor'] || r['AOR'] || '0'),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé'] || r['aor'] || '0'),
      encours: toNum(r['en cours'] || r['encours'] || '0'),
      plusValues: toNum(r['+values/-values'] || r['plusValues'] || '0'),
      extourne: toStr(r['EXTOURNE'] || r['extourne'] || 'N'),
    };
  }).filter(r => r.service !== '' || r.compte !== '');
}

export function parserBalance(rows: Record<string, string>[], _typeBudget: TypeBudget): LigneBalance[] {
  return rows
    .filter(r => {
      const compte = String(r['Compte'] || r['compte'] || '').trim();
      return compte && /^\d/.test(compte) && compte.length >= 3;
    })
    .map(r => {
      const toNum = (v: unknown): number => {
        if (v == null || v === '') return 0;
        const s = String(v).replace(/\s/g, '').replace(',', '.');
        return parseFloat(s) || 0;
      };
      const compte = String(r['Compte'] || r['compte'] || '').trim().replace(/[^0-9]/g, '').substring(0, 9);
      const classe = compte.charAt(0);
      return {
        compte,
        intituleReduit: String(r['Intitulé réduit du compte'] || r['intitule'] || r['Libellé'] || compte).trim(),
        type: String(r['Type'] || '').trim(),
        antDbt: toNum(r['Montant débit antérieur'] || r['antDbt'] || '0'),
        antCrd: toNum(r['Montant crédit antérieur'] || r['antCrd'] || '0'),
        dbt: toNum(r['Montant débit'] || r['dbt'] || '0'),
        crd: toNum(r['Montant crédit'] || r['crd'] || '0'),
        solDbt: toNum(r['Solde débit'] || r['solDbt'] || '0'),
        solCrd: toNum(r['Solde crédit'] || r['solCrd'] || '0'),
        poste: String(r['Poste'] || r['poste'] || '').trim(),
        classe,
        ssClasse: compte.substring(0, 2),
        ssSsClasse: compte.substring(0, 3),
        etablissement: String(r['Etablissement'] || r['etablissement'] || '').trim(),
      };
    })
    .filter(r => r.compte !== '');
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
  };
}

// ── Consolidation BP + BA ───────────────────────────────────────────
// M9-6 2026 Titre III § III.4 — Élimination des flux internes (cpte 185)
export function consolider(bp: ResultatsUI, annexes: ResultatsUI[]): ResultatsUI {
  const totalChargesReel = bp.totalChargesReel + annexes.reduce((s, a) => s + a.totalChargesReel, 0);
  const totalProduitsReel = bp.totalProduitsReel + annexes.reduce((s, a) => s + a.totalProduitsReel, 0);

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
    indicateursBA: {
      soldeComptes185: 0,
      comptes185Dbt: 0,
      comptes185Crd: 0,
      fluxInternesElimines: 0,
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
// Sens normal : Classe 1 créditeur (sauf 119), Classe 2 débiteur (sauf 28),
// Classe 3 débiteur, Classe 4 variable, Classe 5 débiteur (jamais négatif!),
// Classe 6 débiteur, Classe 7 créditeur
export function analyserBalance(bal: LigneBalance[]): AnomalieBalance[] {
  const comptes = analyserBalanceEngine(bal);

  // Comptes critiques dont l'anomalie est bloquante pour le compte financier
  // (provoquent un déséquilibre FDR ou un résultat faussé)
  const comptesCritiques = new Set([
    '120', '129', '512', '515', '531', // résultat & trésorerie
    '401', '411', '421', // fournisseurs, clients, personnel
    '4411', '4412', // subventions État / collectivités
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
        conseqM96 = 'Trésorerie négative — Obligation de signalement au comptable supérieur (RGCP art. 28)';
      } else if (c.compte.startsWith('1')) {
        conseqM96 = 'Impact direct sur le FDR — Vérifier le bilan (M9-6 § IV.1)';
      } else if (c.compte.startsWith('4')) {
        conseqM96 = 'Impact sur le BFR — Vérifier la concordance ordonnateur/comptable (M9-6 § II)';
      } else if (c.compte.startsWith('6') || c.compte.startsWith('7')) {
        conseqM96 = 'Impact sur le résultat — Vérifier les écritures de fin d\'exercice';
      } else {
        conseqM96 = c.commentaire || 'Solde anormal M9-6';
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
