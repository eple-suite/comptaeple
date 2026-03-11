// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Historique pluriannuel N à N-4
// Données réelles depuis cofieple_exercises
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { formatCurrency } from '@/lib/mockData';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

interface ExRow {
  exercice: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  jours_autonomie: number;
  caf: number;
  resultat_budgetaire: number;
  reserves: number;
}

export function FdrHistorique() {
  const { selectedEstablishment } = useEstablishment();
  const [data, setData] = useState<ExRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEstablishment) { setLoading(false); return; }
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { setLoading(false); return; }

      const { data: rows } = await supabase
        .from('cofieple_exercises')
        .select('exercice, fdr, bfr, tresorerie, jours_autonomie, caf, resultat_budgetaire, reserves')
        .eq('uai', selectedEstablishment.uai)
        .eq('user_id', session.session.user.id)
        .eq('type_budget', 'principal')
        .order('exercice', { ascending: true })
        .limit(5);

      if (rows) {
        setData(rows.map(r => ({
          exercice: r.exercice,
          fdr: Number(r.fdr),
          bfr: Number(r.bfr),
          tresorerie: Number(r.tresorerie),
          jours_autonomie: Number(r.jours_autonomie),
          caf: Number(r.caf),
          resultat_budgetaire: Number(r.resultat_budgetaire),
          reserves: Number(r.reserves),
        })));
      }
      setLoading(false);
    })();
  }, [selectedEstablishment]);

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>;

  if (data.length < 2) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold">Pas encore d'historique pluriannuel</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sauvegardez les exercices via le module « Compte Financier » (onglet N à N-4) pour voir les tendances ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    exercice: String(d.exercice),
    FDR: d.fdr, BFR: d.bfr, Trésorerie: d.tresorerie,
  }));

  const indicators = [
    { label: 'FDR', key: 'fdr' as keyof ExRow },
    { label: 'BFR', key: 'bfr' as keyof ExRow },
    { label: 'Trésorerie', key: 'tresorerie' as keyof ExRow },
    { label: 'Jours autonomie', key: 'jours_autonomie' as keyof ExRow },
    { label: 'CAF/IAF', key: 'caf' as keyof ExRow },
    { label: 'Résultat', key: 'resultat_budgetaire' as keyof ExRow },
    { label: 'Réserves', key: 'reserves' as keyof ExRow },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tendance FDR / BFR / Trésorerie (N à N-4)</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="FDR" stroke="hsl(215, 70%, 50%)" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="BFR" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Trésorerie" stroke="hsl(160, 45%, 45%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Variation pluriannuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-2.5 text-left font-semibold">Indicateur</th>
                {data.map(d => <th key={d.exercice} className="px-3 py-2.5 text-right font-semibold">{d.exercice}</th>)}
                <th className="px-3 py-2.5 text-center font-semibold">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {indicators.map(row => {
                const vals = data.map(d => Number(d[row.key]));
                const last = vals[vals.length - 1];
                const prev = vals[vals.length - 2];
                const trend = last > prev ? 'up' : last < prev ? 'down' : 'stable';
                const isCurrency = row.key !== 'jours_autonomie';
                return (
                  <tr key={row.key} className="hover:bg-muted/50">
                    <td className="px-4 py-2 font-semibold text-muted-foreground">{row.label}</td>
                    {data.map(d => (
                      <td key={d.exercice} className="px-3 py-2 text-right font-mono">
                        {isCurrency ? formatCurrency(Number(d[row.key])) : `${Math.round(Number(d[row.key]))} j.`}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      {trend === 'up' ? <TrendingUp className="h-4 w-4 text-success mx-auto" /> :
                       trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive mx-auto" /> :
                       <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
