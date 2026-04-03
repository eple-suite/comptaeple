import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

export function OrdoS9ActivitesPeda() {
  const { etab, R, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_activites_peda`, '');

  if (!R) return <EmptyState msg="Données requises." />;

  const domaines = R.domaines ?? {};
  // AP domains typically D1, D2, D3
  const apDomaines = Object.values(domaines).filter(d => ['1', '2', '3'].includes(d.code) && d.chargesReel > 0);
  const totalAP = apDomaines.reduce((s, d) => s + d.chargesReel, 0);
  const colors = ['hsl(215,70%,50%)', 'hsl(160,45%,45%)', 'hsl(38,92%,50%)', 'hsl(280,50%,50%)', 'hsl(340,65%,50%)'];

  const pieData = apDomaines.map((d, i) => ({
    name: d.libelle.length > 20 ? d.libelle.slice(0, 20) + '…' : d.libelle,
    value: d.chargesReel,
    fill: colors[i % colors.length],
  }));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S9" title="Activités pédagogiques" />

        {apDomaines.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border">
                <thead><tr className="bg-slate-700 text-white">
                  <th className="p-2 text-left">Domaine</th>
                  <th className="p-2 text-right">Crédits</th>
                  <th className="p-2 text-right">Dépenses</th>
                  <th className="p-2 text-right">Taux exéc.</th>
                </tr></thead>
                <tbody>
                  {apDomaines.map(d => (
                    <tr key={d.code} className="border-t">
                      <td className="p-2 font-semibold">{d.libelle}</td>
                      <td className="p-2 text-right font-mono">{formatEur(d.chargesPrev)}</td>
                      <td className="p-2 text-right font-mono font-bold">{formatEur(d.chargesReel)}</td>
                      <td className="p-2 text-right">
                        <span className={`font-semibold ${d.tauxExecCharges >= 0.85 ? 'text-emerald-600' : 'text-warning'}`}>
                          {(d.tauxExecCharges * 100).toFixed(1)} %
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800 text-white font-bold">
                    <td className="p-2">TOTAL AP</td>
                    <td className="p-2 text-right font-mono">{formatEur(apDomaines.reduce((s, d) => s + d.chargesPrev, 0))}</td>
                    <td className="p-2 text-right font-mono">{formatEur(totalAP)}</td>
                    <td className="p-2 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {pieData.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-2">🥧 Répartition crédits AP</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie isAnimationActive={false} data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={9}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-4">
            Aucune donnée AP détectée dans les domaines d'exécution.
          </div>
        )}

        <CommentaireBox label="Activités pédagogiques" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
