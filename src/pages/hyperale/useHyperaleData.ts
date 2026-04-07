import { useMemo } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';

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
  // Historical
  historique: { exercice: number; fdr: number; caf: number; tresorerie: number; reserves: number }[];
  // Comparisons (simulated averages)
  moyenneNationale: { fdrJours: number; tresorerieJours: number; tauxExecCharges: number };
  moyenneCollectivite: { fdrJours: number; tresorerieJours: number; tauxExecCharges: number };
}

export function useHyperaleData(exercice: number): HyperaleIndicators {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);

  return useMemo(() => {
    const r = resultats[activeBudget] || resultats.principal;
    if (!r) {
      return makeEmpty(exercice);
    }

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

    const alertes: HyperaleAlert[] = [];
    if (fdr < 0) alertes.push({ severity: 'critical', message: `Le FDR est négatif (${fmt(fdr)}). L'établissement ne dispose plus de marge de sécurité.` });
    else if (fdrJours < 30) alertes.push({ severity: 'warning', message: `Le FDR ne couvre que ${fdrJours.toFixed(1)} jours de fonctionnement (seuil recommandé : 30 j).` });
    if (tresorerie < 0) alertes.push({ severity: 'critical', message: `La trésorerie est négative (${fmt(tresorerie)}). Risque d'incident de paiement.` });
    else if (tresorerieJours < 15) alertes.push({ severity: 'warning', message: `La trésorerie ne couvre que ${tresorerieJours.toFixed(1)} jours (seuil : 15 j).` });
    if (caf < 0) alertes.push({ severity: 'warning', message: `La CAF est négative : l'exploitation ne génère pas assez de ressources pour financer les investissements.` });
    if (resultatComptable < -5000) alertes.push({ severity: 'critical', message: `Le résultat comptable est fortement déficitaire (${fmt(resultatComptable)}).` });
    if (tauxExecCharges > 0 && tauxExecCharges < 85) alertes.push({ severity: 'info', message: `Le taux d'exécution des charges (${tauxExecCharges.toFixed(1)} %) est inférieur à 85 %. Vérifier les engagements en cours.` });
    if (alertes.length === 0) alertes.push({ severity: 'info', message: 'Aucune alerte détectée. Les indicateurs sont dans les normes.' });

    // Simulated history (decaying from current values)
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
  }, [resultats, activeBudget, exercice]);
}

function makeEmpty(exercice: number): HyperaleIndicators {
  // Provide demo data when no real data is loaded
  const demo = {
    fdr: 85420, fdrJours: 42.3, caf: 12500, tresorerie: 64200,
    tresorerieJours: 31.8, reserves: 45000, tnr: 8.2, drfn: 737200,
    resultatComptable: 5200, tauxExecCharges: 91.4, tauxExecProduits: 94.8,
  };
  return {
    ...demo,
    alertes: [{ severity: 'info', message: 'Données de démonstration affichées. Importez vos fichiers Op@le pour une analyse réelle.' }],
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

function fmt(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}
