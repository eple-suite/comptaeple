import { usePersistedText, usePersistedState } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { EmptyState } from '../SharedComponents';

interface ViabilisationData {
  eau: number; electricite: number; gaz: number; fuel: number; bois: number; autres: number;
}

export function OrdoS8Viabilisation() {
  const { pKey, ind } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_viabilisation`, '');
  const [viab, setViab] = usePersistedState<ViabilisationData>(`${pKey}_viabilisation`, {
    eau: ind?.conso_eau ?? 0, electricite: ind?.conso_electricite ?? 0,
    gaz: ind?.conso_gaz ?? 0, fuel: 0, bois: 0, autres: 0,
  });

  const total = viab.eau + viab.electricite + viab.gaz + viab.fuel + viab.bois + viab.autres;
  const chartData = [
    { name: 'Eau', value: viab.eau, fill: 'hsl(200,70%,50%)' },
    { name: 'Électricité', value: viab.electricite, fill: 'hsl(38,92%,50%)' },
    { name: 'Gaz', value: viab.gaz, fill: 'hsl(0,70%,55%)' },
    { name: 'Fuel', value: viab.fuel, fill: 'hsl(30,60%,40%)' },
    { name: 'Bois', value: viab.bois, fill: 'hsl(120,40%,40%)' },
    { name: 'Autres', value: viab.autres, fill: 'hsl(220,10%,60%)' },
  ].filter(d => d.value > 0);

  const updateField = (field: keyof ViabilisationData, val: string) => {
    setViab(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S8" title="Viabilisation et énergie" />

        <p className="text-xs text-muted-foreground">Saisissez les montants annuels de charges de viabilisation (en €).</p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {(['eau', 'electricite', 'gaz', 'fuel', 'bois', 'autres'] as const).map(field => (
            <div key={field}>
              <Label className="text-xs capitalize">{field === 'electricite' ? 'Électricité' : field}</Label>
              <Input type="number" value={viab[field] || ''} onChange={e => updateField(field, e.target.value)} className="mt-1" placeholder="0" />
            </div>
          ))}
        </div>

        {total > 0 && (
          <>
            <div className="text-sm font-bold">Total viabilisation : {formatEur(total)}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                <Bar isAnimationActive={false} dataKey="value" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        <CommentaireBox label="Politique énergétique et maintenance" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
