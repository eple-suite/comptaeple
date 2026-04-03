import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

export function OrdoS5Pilotage() {
  const { etab, R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_pilotage`, '');

  if (!R) return <EmptyState msg="Données requises pour le pilotage budgétaire." />;

  const hasN1 = (R.totalChargesSdeN1 ?? 0) > 0;
  const pilotageData = [
    { label: 'Charges totales', bi: R.totalChargesPrev, be: R.totalChargesSde },
    { label: 'Produits totaux', bi: R.totalProduitsPrev, be: R.totalProduitsSdr },
    { label: 'Résultat', bi: R.totalProduitsPrev - R.totalChargesPrev, be: R.resultatBudgetaire },
  ];

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S5" title="Pilotage budgétaire" />

        {/* Tableau budget initial vs exécuté */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead><tr className="bg-slate-700 text-white">
              <th className="p-2 text-left">Agrégat</th>
              <th className="p-2 text-right">Budget initial</th>
              <th className="p-2 text-right">Budget exécuté</th>
              <th className="p-2 text-right">Écart</th>
              <th className="p-2 text-right">Écart %</th>
            </tr></thead>
            <tbody>
              {pilotageData.map(row => {
                const ecart = row.be - row.bi;
                const pct = row.bi !== 0 ? (ecart / Math.abs(row.bi)) * 100 : 0;
                return (
                  <tr key={row.label} className="border-t">
                    <td className="p-2 font-semibold">{row.label}</td>
                    <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.bi)}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatEur(row.be)}</td>
                    <td className={`p-2 text-right font-mono ${ecart >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{ecart >= 0 ? '+' : ''}{formatEur(ecart)}</td>
                    <td className={`p-2 text-right font-mono ${ecart >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Graphique consommation crédits */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold mb-2">📊 Taux de consommation des crédits</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pilotageData.map(d => ({
              name: d.label,
              Prévu: d.bi,
              Réalisé: d.be,
            }))} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatEur(v), '']} />
              <Bar isAnimationActive={false} dataKey="Prévu" fill="hsl(var(--muted))" opacity={0.5} radius={[2, 2, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="Réalisé" fill="hsl(215,70%,50%)" radius={[2, 2, 0, 0]} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution N/N-1 */}
        {hasN1 && (
          <div className="overflow-x-auto">
            <p className="text-xs text-muted-foreground font-semibold mb-2">📈 Évolution N / N-1</p>
            <table className="w-full text-xs border">
              <thead><tr className="bg-slate-700 text-white">
                <th className="p-2 text-left">Agrégat</th>
                <th className="p-2 text-right">N ({etab.exercice})</th>
                <th className="p-2 text-right">N-1 ({etab.exercice - 1})</th>
                <th className="p-2 text-right">Variation</th>
                <th className="p-2 text-right">%</th>
              </tr></thead>
              <tbody>
                {[
                  { label: 'Dépenses réalisées', vN: R.totalChargesSde, vN1: R.totalChargesSdeN1 },
                  { label: 'Recettes réalisées', vN: R.totalProduitsSdr, vN1: R.totalProduitsSdrN1 },
                  { label: 'Résultat budgétaire', vN: R.resultatBudgetaire, vN1: R.resultatBudgetaireN1 },
                ].map(row => {
                  const v = row.vN - (row.vN1 ?? 0);
                  const pct = (row.vN1 ?? 0) !== 0 ? (v / Math.abs(row.vN1 ?? 1)) * 100 : 0;
                  return (
                    <tr key={row.label} className="border-t">
                      <td className="p-2 font-semibold">{row.label}</td>
                      <td className="p-2 text-right font-mono">{formatEur(row.vN)}</td>
                      <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.vN1 ?? 0)}</td>
                      <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{v >= 0 ? '+' : ''}{formatEur(v)}</td>
                      <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <CommentaireBox label="Pilotage et prévisions" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
