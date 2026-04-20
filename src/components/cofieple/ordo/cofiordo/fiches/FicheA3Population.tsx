// Démonstrateur Section A — A.3 Population scolaire
import { useMemo } from 'react';
import { OrdoFicheIndicateur, FicheRow } from '../OrdoFicheIndicateur';
import { getFicheById } from '../catalog';
import { useOrdoData } from '../../useOrdoData';

export function FicheA3Population() {
  const fiche = getFicheById('ordo_a3')!;
  const { ind } = useOrdoData();

  const rows: FicheRow[] = useMemo(() => {
    if (!ind) return [];
    // N est la valeur saisie ; N-1 / N-2 vides tant que pas de pluriannuel câblé.
    return [
      { label: 'Effectif total élèves', unite: 'num', n: ind.effectif_eleves },
      { label: '— dont externes', unite: 'num', n: ind.effectif_externes },
      { label: '— dont demi-pensionnaires', unite: 'num', n: ind.effectif_dp },
      { label: '— dont internes', unite: 'num', n: ind.effectif_internes },
      { label: 'Personnel (ETP)', unite: 'num', n: ind.effectif_personnel, highlight: true },
    ];
  }, [ind]);

  const chartData = useMemo(() => {
    if (!ind) return [];
    return [
      { name: 'Externes', valeur: ind.effectif_externes },
      { name: 'Demi-pensionnaires', valeur: ind.effectif_dp },
      { name: 'Internes', valeur: ind.effectif_internes },
    ];
  }, [ind]);

  return (
    <OrdoFicheIndicateur
      fiche={fiche}
      rows={rows}
      chartData={chartData}
      chartSeries={[{ key: 'valeur', label: 'Effectifs' }]}
      hasData={!!ind && ind.effectif_eleves > 0}
      emptyMessage="Renseignez les effectifs dans l'onglet Indicateurs pour activer cette fiche."
    />
  );
}