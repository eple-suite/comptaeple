import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard, EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function OrdoS10Creances() {
  const { R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_creances`, '');

  if (!R || !safe) return <EmptyState msg="Importez la balance pour analyser les créances." />;

  const creancesData = [
    { name: 'Familles', value: safe.creancesFamilles, fill: 'hsl(38,92%,50%)' },
    { name: 'Collectivités', value: safe.creancesCollectivite, fill: 'hsl(160,45%,45%)' },
    { name: 'État', value: safe.creancesEtat, fill: 'hsl(215,70%,50%)' },
    { name: 'Autres', value: safe.creancesAutres, fill: 'hsl(280,50%,50%)' },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S10" title="Analyse des créances et recouvrements" withNarration />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Total créances" value={formatEur(safe.totalCreances)} color={safe.totalCreances > 0 ? 'amber' : 'green'} icon="📋" />
          <KPICard label="TMnr" value={`${safe.tmnr.toFixed(1)} %`} color={safe.tmnr > 5 ? 'red' : safe.tmnr > 3 ? 'amber' : 'green'} icon="📬" sub="Non-recouvrement" />
          <KPICard label="DGR" value={`${safe.dgpJours.toFixed(0)} j`} color={safe.dgpJours > 60 ? 'red' : 'green'} icon="⏱️" sub="Délai recouvrement" />
          <KPICard label="Créances familles" value={formatEur(safe.creancesFamilles)} color={safe.creancesFamilles > 0 ? 'amber' : 'green'} icon="👨‍👩‍👧" />
        </div>

        {creancesData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">🥧 Composition des créances</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie isAnimationActive={false} data={creancesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine fontSize={9}>
                    {creancesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <table className="w-full text-xs border">
                <thead><tr className="bg-muted/50">
                  <th className="p-2 text-left">Catégorie</th>
                  <th className="p-2 text-right">Montant</th>
                  <th className="p-2 text-right">% total</th>
                </tr></thead>
                <tbody>
                  {creancesData.map(d => (
                    <tr key={d.name} className="border-t">
                      <td className="p-2 font-semibold">{d.name}</td>
                      <td className="p-2 text-right font-mono">{formatEur(d.value)}</td>
                      <td className="p-2 text-right font-mono">{safe.totalCreances > 0 ? ((d.value / safe.totalCreances) * 100).toFixed(1) : 0} %</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/20">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right font-mono">{formatEur(safe.totalCreances)}</td>
                    <td className="p-2 text-right">100 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <CommentaireBox label="Politique de recouvrement" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
