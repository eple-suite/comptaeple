// Démonstrateur Section B — B.3 Taux de réalisation du budget
import { useMemo } from 'react';
import { OrdoFicheIndicateur, FicheRow } from '../OrdoFicheIndicateur';
import { getFicheById } from '../catalog';
import { useOrdoData } from '../../useOrdoData';

export function FicheB3TauxRealisation() {
  const fiche = getFicheById('ordo_b3')!;
  const { R } = useOrdoData();

  const rows: FicheRow[] = useMemo(() => {
    if (!R) return [];
    const tauxN1Charges = R.totalChargesPrev > 0 && R.totalChargesSdeN1 > 0
      ? (R.totalChargesSdeN1 / R.totalChargesPrev) * 100 : null;
    const tauxN1Produits = R.totalProduitsPrev > 0 && R.totalProduitsSdrN1 > 0
      ? (R.totalProduitsSdrN1 / R.totalProduitsPrev) * 100 : null;
    return [
      { label: 'Charges — Prévision', unite: 'eur', n_1: R.totalChargesPrev || null, n: R.totalChargesPrev },
      { label: 'Charges — Réalisation', unite: 'eur', n_1: R.totalChargesSdeN1 || null, n: R.totalChargesSde },
      { label: 'Taux de réalisation charges', unite: 'pct', n_1: tauxN1Charges, n: R.tauxExecCharges * 100, highlight: true },
      { label: 'Produits — Prévision', unite: 'eur', n_1: R.totalProduitsPrev || null, n: R.totalProduitsPrev },
      { label: 'Produits — Réalisation', unite: 'eur', n_1: R.totalProduitsSdrN1 || null, n: R.totalProduitsSdr },
      { label: 'Taux de réalisation produits', unite: 'pct', n_1: tauxN1Produits, n: R.tauxExecProduits * 100, highlight: true },
    ];
  }, [R]);

  const chartData = useMemo(() => {
    if (!R) return [];
    return [
      { name: 'Charges', Prévu: R.totalChargesPrev, Réalisé: R.totalChargesSde },
      { name: 'Produits', Prévu: R.totalProduitsPrev, Réalisé: R.totalProduitsSdr },
    ];
  }, [R]);

  return (
    <OrdoFicheIndicateur
      fiche={fiche}
      rows={rows}
      chartData={chartData}
      chartSeries={[
        { key: 'Prévu', label: 'Prévu' },
        { key: 'Réalisé', label: 'Réalisé' },
      ]}
      hasData={!!R}
      emptyMessage="Importez les fichiers SDE/SDR pour calculer les taux de réalisation."
    />
  );
}