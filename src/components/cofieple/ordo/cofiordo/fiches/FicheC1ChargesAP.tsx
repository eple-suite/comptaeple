// Démonstrateur Section C — C.1 Charges service général AP
import { useMemo } from 'react';
import { OrdoFicheIndicateur, FicheRow } from '../OrdoFicheIndicateur';
import { getFicheById } from '../catalog';
import { useOrdoData } from '../../useOrdoData';

export function FicheC1ChargesAP() {
  const fiche = getFicheById('ordo_c1')!;
  const { R } = useOrdoData();

  const sv = R?.services?.['AP'];

  const rows: FicheRow[] = useMemo(() => {
    if (!sv) return [];
    const taux = sv.chargesPrev > 0 ? (sv.chargesReel / sv.chargesPrev) * 100 : null;
    return [
      { label: 'Charges prévues (BI + DBM)', unite: 'eur', n: sv.chargesPrev },
      { label: 'Charges réalisées', unite: 'eur', n: sv.chargesReel, highlight: true },
      { label: 'Reliquats / dépassements', unite: 'eur', n: sv.reliquats },
      { label: "Taux d'exécution", unite: 'pct', n: taux },
    ];
  }, [sv]);

  const chartData = useMemo(() => {
    if (!sv) return [];
    return [
      { name: 'AP', Prévu: sv.chargesPrev, Réalisé: sv.chargesReel },
    ];
  }, [sv]);

  return (
    <OrdoFicheIndicateur
      fiche={fiche}
      rows={rows}
      chartData={chartData}
      chartSeries={[
        { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
        { key: 'Réalisé', label: 'Réalisé', color: 'hsl(0,72%,55%)' },
      ]}
      hasData={!!sv && sv.chargesPrev + sv.chargesReel > 0}
      emptyMessage="Aucune donnée pour le service AP. Vérifiez l'import du SDE."
    />
  );
}