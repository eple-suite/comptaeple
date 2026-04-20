// Démonstrateur Section D — D.1 Focus structure des financements
import { useMemo } from 'react';
import { OrdoFicheIndicateur, FicheRow, FicheChartPoint } from '../OrdoFicheIndicateur';
import { getFicheById } from '../catalog';
import { useOrdoData } from '../../useOrdoData';

function classifyOrigin(po: Record<string, number>) {
  let etat = 0, collectivite = 0, propres = 0, taxeApp = 0, autres = 0;
  Object.entries(po).forEach(([k, v]) => {
    if (['741', '744', '745', '746'].some(p => k.startsWith(p))) etat += v;
    else if (['742', '743', '747'].some(p => k.startsWith(p))) collectivite += v;
    else if (k.startsWith('748')) taxeApp += v;
    else if (['70', '71', '72', '75', '76'].some(p => k.startsWith(p))) propres += v;
    else autres += v;
  });
  return { etat, collectivite, propres, taxeApp, autres };
}

export function FicheD1Financements() {
  const fiche = getFicheById('ordo_d1')!;
  const { R } = useOrdoData();

  const fin = useMemo(() => R ? classifyOrigin(R.produitsOrigine ?? {}) : null, [R]);

  const rows: FicheRow[] = useMemo(() => {
    if (!fin) return [];
    const total = fin.etat + fin.collectivite + fin.propres + fin.taxeApp + fin.autres;
    return [
      { label: 'État', unite: 'eur', n: fin.etat },
      { label: 'Collectivité de rattachement', unite: 'eur', n: fin.collectivite },
      { label: 'Ressources propres', unite: 'eur', n: fin.propres },
      { label: "Taxe d'apprentissage", unite: 'eur', n: fin.taxeApp },
      { label: 'Autres', unite: 'eur', n: fin.autres },
      { label: 'Total des financements', unite: 'eur', n: total, highlight: true },
    ];
  }, [fin]);

  const chartData: FicheChartPoint[] = useMemo(() => {
    if (!fin) return [];
    return [
      { name: 'État', valeur: fin.etat },
      { name: 'Collectivité', valeur: fin.collectivite },
      { name: 'Ress. propres', valeur: fin.propres },
      { name: "Taxe d'apprentissage", valeur: fin.taxeApp },
      { name: 'Autres', valeur: fin.autres },
    ].filter(d => Number(d.valeur) > 0);
  }, [fin]);

  return (
    <OrdoFicheIndicateur
      fiche={fiche}
      rows={rows}
      chartData={chartData}
      chartSeries={[{ key: 'valeur', label: 'Montant' }]}
      hasData={!!fin && (fin.etat + fin.collectivite + fin.propres + fin.taxeApp + fin.autres) > 0}
      emptyMessage="Importez les fichiers SDR pour analyser la structure des financements."
    />
  );
}