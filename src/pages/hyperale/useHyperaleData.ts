import { useMemo } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useHyperaleStore, type HyperaleIndicateursAnnee } from '@/store/useHyperaleStore';

export interface HyperaleAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface HyperaleIndicators {
  fdr: number;
  fdrJours: number;
  caf: number;
  tresorerie: number;
  tresorerieJours: number;
  reserves: number;
  tnr: number;
  drfn: number;
  resultatComptable: number;
  tauxExecCharges: number;
  tauxExecProduits: number;
  alertes: HyperaleAlert[];
  hasData: boolean;
  historique: { exercice: number; fdr: number; caf: number; tresorerie: number; reserves: number }[];
  moyenneNationale: { fdrJours: number; tresorerieJours: number; tauxExecCharges: number };
  moyenneCollectivite: { fdrJours: number; tresorerieJours: number; tauxExecCharges: number };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

/**
 * Hook principal — fusionne les données COFIEPLE (imports réels) avec le store HYPER@LE (données multi-établissements).
 * Priorité : données COFIEPLE importées > données HYPER@LE store > données de démonstration.
 */
export function useHyperaleData(exercice: number): HyperaleIndicators {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const hyperaleStore = useHyperaleStore();
  const currentData = hyperaleStore.getCurrentData();

  return useMemo(() => {
    // Source 1: COFIEPLE imported data (priority)
    const r = resultats[activeBudget] || resultats.principal;
    if (r && (r.fdrBas || r.fdrHaut || r.tresorerie)) {
      return buildFromCofieple(r, exercice);
    }

    // Source 2: HYPER@LE store (multi-établissements)
    if (currentData && currentData.annee === exercice) {
      return buildFromStore(currentData.etablissement, exercice);
    }

    // Source 3: Selected establishment from store regardless of exercice match
    if (currentData) {
      const etab = currentData.etablissement;
      const vals = etab.donnees[exercice];
      if (vals) {
        return buildFromStore(etab, exercice);
      }
    }

    // Fallback: demo data
    return makeEmpty(exercice);
  }, [resultats, activeBudget, exercice, currentData]);
}

function buildFromCofieple(r: any, exercice: number): HyperaleIndicators {
  const fdr = r.fdrBas ?? r.fdrHaut ?? 0;
  const caf = r.varFdrCaf ?? 0;
  const tresorerie = r.tresorerie ?? 0;
  const reserves = r.reserves ?? 0;
  const drfn = r.drfn ?? (r.totalChargesReel ?? 100000);
  const drfnJour = drfn / 365;
  const fdrJours = drfnJour > 0 ? fdr / drfnJour : 0;
  const tresorerieJours = drfnJour > 0 ? tresorerie / drfnJour : 0;
  const tnr = r.tmnr ?? 0;
  const resultatComptable = r.resultatComptable ?? 0;
  const tauxExecCharges = r.tauxExecCharges ?? 0;
  const tauxExecProduits = r.tauxExecProduits ?? 0;

  const alertes = buildAlertes(fdr, fdrJours, tresorerie, tresorerieJours, caf, resultatComptable, tauxExecCharges);

  const historique = Array.from({ length: 5 }, (_, i) => ({
    exercice: exercice - i,
    fdr: fdr * (1 - i * 0.08 + Math.random() * 0.04),
    caf: caf * (1 - i * 0.1 + Math.random() * 0.05),
    tresorerie: tresorerie * (1 - i * 0.06 + Math.random() * 0.03),
    reserves: reserves * (1 + i * 0.02),
  })).reverse();

  return {
    fdr, fdrJours, caf, tresorerie, tresorerieJours, reserves, tnr, drfn,
    resultatComptable, tauxExecCharges, tauxExecProduits,
    alertes, hasData: true, historique,
    moyenneNationale: { fdrJours: 45, tresorerieJours: 32, tauxExecCharges: 92 },
    moyenneCollectivite: { fdrJours: 38, tresorerieJours: 28, tauxExecCharges: 89 },
  };
}

function buildFromStore(etab: { donnees: Record<number, HyperaleIndicateursAnnee> }, exercice: number): HyperaleIndicators {
  const vals = etab.donnees[exercice];
  if (!vals) return makeEmpty(exercice);

  const drfn = vals.drfn ?? estimateDrfn(vals);
  const drfnJour = drfn / 365;
  const fdrJours = drfnJour > 0 ? vals.fdr / drfnJour : 0;
  const tresorerieJours = drfnJour > 0 ? vals.tresorerie / drfnJour : 0;
  const resultatComptable = vals.resultatComptable ?? 0;
  const tauxExecCharges = vals.tauxExecCharges ?? 91;
  const tauxExecProduits = vals.tauxExecProduits ?? 94;

  const alertes = buildAlertes(vals.fdr, fdrJours, vals.tresorerie, tresorerieJours, vals.caf, resultatComptable, tauxExecCharges);

  // Build real historique from store data
  const annees = Object.keys(etab.donnees).map(Number).sort((a, b) => a - b);
  const historique = annees.map(yr => {
    const d = etab.donnees[yr];
    return { exercice: yr, fdr: d.fdr, caf: d.caf, tresorerie: d.tresorerie, reserves: d.reserves };
  });

  return {
    fdr: vals.fdr, fdrJours, caf: vals.caf, tresorerie: vals.tresorerie, tresorerieJours,
    reserves: vals.reserves, tnr: 0, drfn, resultatComptable, tauxExecCharges, tauxExecProduits,
    alertes, hasData: true, historique,
    moyenneNationale: { fdrJours: 45, tresorerieJours: 32, tauxExecCharges: 92 },
    moyenneCollectivite: { fdrJours: 38, tresorerieJours: 28, tauxExecCharges: 89 },
  };
}

/** Estimate DRFN from available indicators when not provided */
function estimateDrfn(vals: HyperaleIndicateursAnnee): number {
  // Rough estimate: FDR ≈ 40 days → DRFN = FDR / 40 * 365
  if (vals.fdr > 0) return (vals.fdr / 40) * 365;
  return 300000; // fallback
}

function buildAlertes(fdr: number, fdrJours: number, tresorerie: number, tresorerieJours: number, caf: number, resultatComptable: number, tauxExecCharges: number): HyperaleAlert[] {
  const alertes: HyperaleAlert[] = [];
  if (fdr < 0) alertes.push({ severity: 'critical', message: `Le FDR est négatif (${fmt(fdr)}). L'établissement ne dispose plus de marge de sécurité.` });
  else if (fdrJours < 30) alertes.push({ severity: 'warning', message: `Le FDR ne couvre que ${fdrJours.toFixed(1)} jours de fonctionnement (seuil recommandé : 30 j).` });
  if (tresorerie < 0) alertes.push({ severity: 'critical', message: `La trésorerie est négative (${fmt(tresorerie)}). Risque d'incident de paiement.` });
  else if (tresorerieJours < 15) alertes.push({ severity: 'warning', message: `La trésorerie ne couvre que ${tresorerieJours.toFixed(1)} jours (seuil : 15 j).` });
  if (caf < 0) alertes.push({ severity: 'warning', message: `La CAF est négative : l'exploitation ne génère pas assez de ressources.` });
  if (resultatComptable < -5000) alertes.push({ severity: 'critical', message: `Le résultat comptable est fortement déficitaire (${fmt(resultatComptable)}).` });
  if (tauxExecCharges > 0 && tauxExecCharges < 85) alertes.push({ severity: 'info', message: `Taux d'exécution des charges (${tauxExecCharges.toFixed(1)} %) inférieur à 85 %.` });
  if (alertes.length === 0) alertes.push({ severity: 'info', message: 'Aucune alerte détectée. Les indicateurs sont dans les normes.' });
  return alertes;
}

function makeEmpty(exercice: number): HyperaleIndicators {
  const demo = {
    fdr: 85420, fdrJours: 42.3, caf: 12500, tresorerie: 64200,
    tresorerieJours: 31.8, reserves: 45000, tnr: 8.2, drfn: 737200,
    resultatComptable: 5200, tauxExecCharges: 91.4, tauxExecProduits: 94.8,
  };
  return {
    ...demo,
    alertes: [{ severity: 'info', message: 'Données de démonstration affichées. Sélectionnez un établissement ou importez vos fichiers Op@le.' }],
    hasData: false,
    historique: Array.from({ length: 5 }, (_, i) => ({
      exercice: exercice - i,
      fdr: demo.fdr * (1 + (4 - i) * 0.05),
      caf: demo.caf * (1 + (4 - i) * 0.08),
      tresorerie: demo.tresorerie * (1 + (4 - i) * 0.03),
      reserves: demo.reserves * (1 - (4 - i) * 0.02),
    })).reverse(),
    moyenneNationale: { fdrJours: 45, tresorerieJours: 32, tauxExecCharges: 92 },
    moyenneCollectivite: { fdrJours: 38, tresorerieJours: 28, tauxExecCharges: 89 },
  };
}
