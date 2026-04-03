import { useMemo } from 'react';
import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

export function OrdoS4ExecRecettes() {
  const { etab, R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_exec_recettes`, '');

  if (!R) return <EmptyState msg="Importez le fichier SDR pour afficher les recettes." />;

  const recettesOrigineData = useMemo(() => {
    const po = R.produitsOrigine ?? {};
    let etat = 0, collectivite = 0, propres = 0, taxeApp = 0, autres = 0;
    Object.entries(po).forEach(([k, v]) => {
      if (['741', '744', '745', '746'].some(p => k.startsWith(p))) etat += v;
      else if (['742', '743', '747'].some(p => k.startsWith(p))) collectivite += v;
      else if (k.startsWith('748')) taxeApp += v;
      else if (['70', '71', '72', '75', '76'].some(p => k.startsWith(p))) propres += v;
      else autres += v;
    });
    return [
      { name: 'État', value: etat, fill: 'hsl(215,70%,50%)' },
      { name: 'Collectivité', value: collectivite, fill: 'hsl(160,45%,45%)' },
      { name: 'Taxe apprentissage', value: taxeApp, fill: 'hsl(280,50%,50%)' },
      { name: 'Ress. propres', value: propres, fill: 'hsl(38,92%,50%)' },
      { name: 'Autres', value: autres, fill: 'hsl(340,65%,50%)' },
    ].filter(d => d.value > 0);
  }, [R]);

  const services = R.services ?? {};
  const servicesList = Object.entries(services).filter(([, s]) => s.produitsReel > 0).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S4" title="Exécution budgétaire — Recettes" />

        {/* Tableau SDR */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead><tr className="bg-slate-700 text-white">
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-right">Budget voté</th>
              <th className="p-2 text-right">Réalisé</th>
              <th className="p-2 text-right">Écart</th>
              <th className="p-2 text-right">Taux réal.</th>
            </tr></thead>
            <tbody>
              {servicesList.map(([code, s]) => {
                const ecart = s.produitsReel - s.produitsPrev;
                return (
                  <tr key={code} className="border-t">
                    <td className="p-2 font-semibold">{s.libelle || code}</td>
                    <td className="p-2 text-right font-mono">{formatEur(s.produitsPrev)}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatEur(s.produitsReel)}</td>
                    <td className={`p-2 text-right font-mono ${ecart >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{ecart >= 0 ? '+' : ''}{formatEur(ecart)}</td>
                    <td className="p-2 text-right">
                      <span className={`font-semibold ${s.tauxExecProduits >= 0.9 ? 'text-emerald-600' : s.tauxExecProduits >= 0.7 ? 'text-warning' : 'text-destructive'}`}>
                        {(s.tauxExecProduits * 100).toFixed(1)} %
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-800 text-white font-bold">
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsPrev)}</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr - R.totalProduitsPrev)}</td>
                <td className="p-2 text-right">{(R.tauxExecProduits * 100).toFixed(1)} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 Pie charts — financements */}
        {recettesOrigineData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: 'Financements État', data: recettesOrigineData.filter(d => d.name === 'État' || d.name === 'Taxe apprentissage') },
              { title: 'Financements Collectivités', data: recettesOrigineData.filter(d => d.name === 'Collectivité') },
              { title: 'Produits autogénérés', data: recettesOrigineData.filter(d => d.name === 'Ress. propres' || d.name === 'Autres') },
            ].filter(g => g.data.length > 0).map(group => (
              <div key={group.title}>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <PieChartIcon className="h-3 w-3" /> {group.title}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie isAnimationActive={false} data={group.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={9}>
                      {group.data.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* Global pie if enough categories */}
        {recettesOrigineData.length >= 3 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <PieChartIcon className="h-3 w-3" /> Ventilation globale des recettes
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie isAnimationActive={false} data={recettesOrigineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine fontSize={9}>
                  {recettesOrigineData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <CommentaireBox label="Commentaires recettes" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
