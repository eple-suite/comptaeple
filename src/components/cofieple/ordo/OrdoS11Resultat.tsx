import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard, EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';

export function OrdoS11Resultat() {
  const { R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_resultat_affectation`, '');

  if (!R || !safe) return <EmptyState msg="Données requises." />;

  const domaines = R.domaines ?? {};
  const domainesList = Object.values(domaines).filter(d => d.chargesReel > 0 || d.produitsReel > 0);
  const resultatsParService = domainesList.map(d => ({
    name: `D${d.code}`,
    value: d.solde,
    fill: d.solde >= 0 ? 'hsl(160,45%,45%)' : 'hsl(0,72%,55%)',
  }));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S11" title="Résultat et affectation" withNarration />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Résultat comptable" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📊" />
          <KPICard label="CAF / IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} />
          <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" />
          <KPICard label="Réserves SRH" value={formatEur(R.reservesSRH)} color="blue" icon="🍽️" />
        </div>

        {resultatsParService.length > 1 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">📊 Résultat par domaine</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resultatsParService} layout="vertical" barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={50} fontSize={10} />
                <Tooltip formatter={(v: number) => [formatEur(v), 'Solde']} />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar isAnimationActive={false} dataKey="value" radius={[0, 4, 4, 0]}>
                  {resultatsParService.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {safe.prelevementsReserves.totalPrelevements > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-xs">
            <p className="font-bold text-warning mb-1">💰 Prélèvements sur fonds de roulement</p>
            <p>Total prélevé : <strong>{formatEur(safe.prelevementsReserves.totalPrelevements)}</strong></p>
            {safe.prelevementsReserves.prelevementsInvestissement > 0 && (
              <p>→ Investissement : {formatEur(safe.prelevementsReserves.prelevementsInvestissement)}</p>
            )}
            {safe.prelevementsReserves.prelevementsFonctionnement > 0 && (
              <p>→ Fonctionnement : {formatEur(safe.prelevementsReserves.prelevementsFonctionnement)}</p>
            )}
          </div>
        )}

        <CommentaireBox label="Affectation du résultat" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
