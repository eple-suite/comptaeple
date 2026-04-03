// Shared hook for Ordonnateur section data access
import { useState, useEffect } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { supabase } from '@/integrations/supabase/client';

export interface ExtraIndicators {
  effectif_eleves: number; effectif_dp: number; effectif_internes: number;
  effectif_externes: number; effectif_boursiers: number; effectif_personnel: number;
  montant_fonds_social: number; nb_repas_servis: number; nb_repas_commensaux: number;
  cout_denrees_repas: number; etp_ressources_propres: number; surface_batiments: number;
  prix_moyen_repas: number | null; tarif_internat: number | null;
  taux_occupation_internat: number | null; taux_passage: number | null;
  taux_reussite_bac: number | null;
  conso_eau: number | null; conso_electricite: number | null; conso_gaz: number | null;
}

export function useExtraIndicators() {
  const etab = useCofiepleStore(s => s.etablissement);
  const [ind, setInd] = useState<ExtraIndicators | null>(null);
  useEffect(() => {
    if (!etab.uai) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_extra_indicators')
          .select('*')
          .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', session.session.user.id)
          .maybeSingle();
        if (data) setInd(data as unknown as ExtraIndicators);
      } catch {}
    })();
  }, [etab.uai, etab.exercice]);
  return ind;
}

export function useOrdoData() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const ind = useExtraIndicators();
  const pKey = `cofieple_rapport_ordo_${etab.uai}_${etab.exercice}`;

  const safe = R ? {
    joursFdr: R.joursFdr ?? 0,
    joursTresorerie: R.joursTresorerie ?? 0,
    tmcap: R.tmcap ?? 0,
    tmnr: R.tmnr ?? 0,
    dgpJours: R.dgpJours ?? 0,
    dgrJours: R.dgrJours ?? 0,
    fdrMobilisable: R.fdrMobilisable ?? 0,
    fdrPartEncaissee: R.fdrPartEncaissee ?? 0,
    fdrPartNonEncaissee: R.fdrPartNonEncaissee ?? 0,
    fdrPctEncaissee: R.fdrPctEncaissee ?? 0,
    cafComptable: R.cafComptable ?? 0,
    ratioLiquiditeGenerale: R.ratioLiquiditeGenerale ?? 0,
    ratioAutonomieFinanciere: R.ratioAutonomieFinanciere ?? 0,
    ratioSolvabilite: R.ratioSolvabilite ?? 0,
    ratioCouvertureCharges: R.ratioCouvertureCharges ?? 0,
    ratioChargesPersonnel: R.ratioChargesPersonnel ?? 0,
    prelevementsReserves: R.prelevementsReserves ?? { totalPrelevements: 0, prelevementsInvestissement: 0, prelevementsFonctionnement: 0, variationReserves: 0 },
    totalCreances: R.totalCreances ?? 0,
    totalDettes: R.totalDettes ?? 0,
    creancesEtat: R.creancesEtat ?? 0,
    creancesCollectivite: R.creancesCollectivite ?? 0,
    creancesFamilles: R.creancesFamilles ?? 0,
    creancesAutres: R.creancesAutres ?? 0,
    reliquatsSubventions: R.reliquatsSubventions ?? 0,
    valeurNette: R.valeurNette ?? 0,
    tresoComposition: R.tresoComposition ?? { autonomieFinanciere: 0, depotsCautions: 0, reglementsEnAttente: 0, reliquatsSubventions: 0 },
  } : null;

  return { etab, R, ind, safe, pKey, activeBudget };
}
