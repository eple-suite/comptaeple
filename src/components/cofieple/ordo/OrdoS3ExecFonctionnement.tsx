import { useMemo } from 'react';
import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

export function OrdoS3ExecFonctionnement() {
  const { etab, R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_exec_fonct`, '');

  if (!R) return <EmptyState msg="Importez le fichier SDE pour afficher l'exécution des dépenses." />;

  const services = R.services ?? {};
  const servicesList = Object.entries(services).filter(([, s]) => s.chargesReel > 0).sort(([a], [b]) => a.localeCompare(b));

  const depNatureData = useMemo(() => {
    const cn = R.chargesNature ?? {};
    const labels: Record<string, string> = { '60': 'Achats', '61': 'Serv. ext.', '62': 'Autres serv.', '63': 'Impôts', '64': 'Personnel', '65': 'Autres charges', '66': 'Charges fin.', '67': 'Except.', '68': 'Dotations' };
    const colors = ['hsl(215,70%,50%)', 'hsl(160,45%,45%)', 'hsl(38,92%,50%)', 'hsl(0,72%,55%)', 'hsl(280,50%,50%)', 'hsl(190,60%,40%)', 'hsl(340,65%,50%)', 'hsl(120,40%,40%)', 'hsl(30,70%,50%)'];
    return Object.entries(cn).filter(([, v]) => v > 50).sort(([, a], [, b]) => b - a).slice(0, 9).map(([k, v], i) => ({ name: labels[k] || `Cpt ${k}`, value: v, fill: colors[i % colors.length] }));
  }, [R]);

  const tauxMoyen = R.tauxExecCharges;
  const serviceChartData = servicesList.map(([code, s]) => ({
    name: code.length > 12 ? code.slice(0, 12) + '…' : code,
    Budget: s.chargesPrev,
    Réalisé: s.chargesReel,
    taux: s.tauxExecCharges,
  }));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S3" title="Exécution budgétaire — Dépenses de fonctionnement" withNarration />

        {/* Tableau SDE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead><tr className="bg-slate-700 text-white">
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-right">Budget voté</th>
              <th className="p-2 text-right">Mandaté</th>
              <th className="p-2 text-right">Disponible</th>
              <th className="p-2 text-right">Taux exéc.</th>
            </tr></thead>
            <tbody>
              {servicesList.map(([code, s]) => (
                <tr key={code} className="border-t">
                  <td className="p-2 font-semibold">{s.libelle || code}</td>
                  <td className="p-2 text-right font-mono">{formatEur(s.chargesPrev)}</td>
                  <td className="p-2 text-right font-mono font-bold">{formatEur(s.chargesReel)}</td>
                  <td className="p-2 text-right font-mono">{formatEur(s.reliquats)}</td>
                  <td className="p-2 text-right">
                    <span className={`font-semibold ${s.tauxExecCharges >= 0.9 ? 'text-emerald-600' : s.tauxExecCharges >= 0.7 ? 'text-warning' : 'text-destructive'}`}>
                      {(s.tauxExecCharges * 100).toFixed(1)} %
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-800 text-white font-bold">
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalChargesPrev)}</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td>
                <td className="p-2 text-right font-mono">{formatEur(R.totalChargesPrev - R.totalChargesSde)}</td>
                <td className="p-2 text-right">{(R.tauxExecCharges * 100).toFixed(1)} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Répartition crédits par service */}
          {depNatureData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                <PieChartIcon className="h-3 w-3" /> Répartition des crédits par nature
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie isAnimationActive={false} data={depNatureData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine fontSize={9}>
                    {depNatureData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Taux d'exécution par service + ligne moyenne */}
          {serviceChartData.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">📊 Taux d'exécution par service</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={serviceChartData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar isAnimationActive={false} dataKey="Budget" fill="hsl(var(--muted))" opacity={0.5} radius={[2, 2, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="Réalisé" fill="hsl(215,70%,50%)" radius={[2, 2, 0, 0]} />
                  <ReferenceLine y={R.totalChargesPrev * tauxMoyen} stroke="hsl(0,72%,55%)" strokeDasharray="5 5" label={{ value: `Moy. ${(tauxMoyen * 100).toFixed(0)}%`, position: 'right', fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <CommentaireBox label="Commentaires dépenses de fonctionnement" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
