// ═══════════════════════════════════════════════════════════════
// MODULE 8 — VUE CONSOLIDÉE MULTI-BUDGETS
// Tableau de synthèse après élimination des flux C/185
// + camemberts de répartition (recettes, FDR, personnel)
// M9-6 2026 §III.4 — Consolidation inter-budgets
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';
import type { TypeBudget, ResultatsUI } from '@/lib/cofieple_storeTypes';
import {
  Layers, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = [
  'hsl(215, 70%, 50%)',  // principal - blue
  'hsl(160, 55%, 42%)',  // greta - green
  'hsl(280, 55%, 55%)',  // cfa - purple
  'hsl(38, 92%, 50%)',   // srh - orange
];

const BUDGET_LABELS: Record<TypeBudget, string> = {
  principal: 'Lycée (Principal)',
  annexe_greta: 'GRETA',
  annexe_cfa: 'CFA',
  annexe_autre: 'SRH',
};

const sumBal185 = (bal: any[], side: 'solDbt' | 'solCrd') =>
  bal.filter((b: any) => b.compte?.startsWith('185'))
    .reduce((s: number, b: any) => s + ((b[side] as number) || 0), 0);

interface BudgetRow {
  type: TypeBudget;
  label: string;
  R: ResultatsUI;
  c185Eliminated: number;
}

export function VueConsolidee() {
  const resultats = useCofiepleStore(s => s.resultats);
  const balance = useCofiepleStore(s => s.balance);
  const budgets = useCofiepleStore(s => s.budgets);

  const data = useMemo(() => {
    const rows: BudgetRow[] = [];
    const types: TypeBudget[] = ['principal', 'annexe_greta', 'annexe_cfa', 'annexe_autre'];

    for (const bt of types) {
      const R = resultats[bt];
      if (!R) continue;
      const bal = balance[bt] || [];
      // C/185 to eliminate
      const c185Credit = sumBal185(bal, 'solCrd');
      const c185Debit = sumBal185(bal, 'solDbt');
      const c185Eliminated = bt === 'principal' ? c185Credit : c185Debit;
      rows.push({ type: bt, label: BUDGET_LABELS[bt], R, c185Eliminated });
    }

    if (rows.length < 2 || !rows.find(r => r.type === 'principal')) return null;

    // Elimination checks
    const c185BP = rows.find(r => r.type === 'principal')!.c185Eliminated;
    const c185BA = rows.filter(r => r.type !== 'principal').reduce((s, r) => s + r.c185Eliminated, 0);
    const ecartC185 = Math.abs(c185BP - c185BA);
    const c185Concordant = ecartC185 < 0.02;

    // Consolidated totals (after elimination)
    const totalActif = rows.reduce((s, r) => s + (r.R.totalImmo || 0), 0);
    const totalActifElim = totalActif - c185BP; // remove C/185 from assets
    const fondsPropres = rows.reduce((s, r) => s + (r.R.reserves || 0), 0);
    const fdr = rows.reduce((s, r) => s + (r.R.fdrComptable || 0), 0);
    const bfr = rows.reduce((s, r) => s + (r.R.bfr || 0), 0);
    // TN consolidée = C/515100 du budget principal uniquement
    const tnConsolidee = rows.find(r => r.type === 'principal')!.R.tresorerie;
    const caf = rows.reduce((s, r) => s + (r.R.cafBudgetaire || 0), 0);
    const totalDepenses = rows.reduce((s, r) => s + (r.R.totalChargesSde || 0), 0);
    const totalRecettes = rows.reduce((s, r) => s + (r.R.totalProduitsSdr || 0), 0);
    const resultat = rows.reduce((s, r) => s + (r.R.resultatBudgetaire || 0), 0);

    return {
      rows, c185BP, c185BA, ecartC185, c185Concordant,
      consolidated: { totalActif: totalActifElim, fondsPropres, fdr, bfr, tn: tnConsolidee, caf, totalDepenses, totalRecettes, resultat },
    };
  }, [resultats, balance, budgets]);

  if (!data) {
    return <EmptyState msg="Chargez au moins le budget principal ET un budget annexe pour afficher la vue consolidée." />;
  }

  const { rows, c185BP, c185BA, ecartC185, c185Concordant, consolidated } = data;

  // Chart data
  const recettesData = rows.map((r, i) => ({
    name: r.label, value: Math.abs(r.R.totalProduitsSdr || 0), fill: COLORS[i],
  })).filter(d => d.value > 0);

  const fdrData = rows.map((r, i) => ({
    name: r.label, value: Math.abs(r.R.fdrComptable || 0), fill: COLORS[i],
  })).filter(d => d.value > 0);

  const personnelData = rows.map((r, i) => {
    const charges64 = r.R.chargesNature?.['64'] || 0;
    return { name: r.label, value: Math.abs(charges64), fill: COLORS[i] };
  }).filter(d => d.value > 0);

  const indicateurs = [
    { label: 'Total Actif (€)', values: rows.map(r => r.R.totalImmo || 0), total: consolidated.totalActif, note: 'Σ (élimination C/185)' },
    { label: 'Fonds Propres (€)', values: rows.map(r => r.R.reserves || 0), total: consolidated.fondsPropres },
    { label: 'FDR (€)', values: rows.map(r => r.R.fdrComptable || 0), total: consolidated.fdr },
    { label: 'BFR (€)', values: rows.map(r => r.R.bfr || 0), total: consolidated.bfr },
    { label: 'TN (€)', values: rows.map(r => r.R.tresorerie || 0), total: consolidated.tn, note: 'Via C/515100 principal' },
    { label: 'CAF (€)', values: rows.map(r => r.R.cafBudgetaire || 0), total: consolidated.caf },
    { label: 'Total dépenses (€)', values: rows.map(r => r.R.totalChargesSde || 0), total: consolidated.totalDepenses },
    { label: 'Total recettes (€)', values: rows.map(r => r.R.totalProduitsSdr || 0), total: consolidated.totalRecettes },
    { label: 'Résultat (€)', values: rows.map(r => r.R.resultatBudgetaire || 0), total: consolidated.resultat },
  ];

  return (
    <div className="space-y-4">
      {/* Elimination rules info */}
      <Card className={`border-2 ${c185Concordant ? 'border-emerald-500' : 'border-destructive'}`}>
        <CardHeader className={`${c185Concordant ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-destructive/5'} rounded-t-lg pb-2`}>
          <CardTitle className="text-sm flex items-center gap-2">
            {c185Concordant ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-destructive" />}
            Éliminations inter-budgets (C/185)
            <Badge variant="outline" className="ml-auto text-[10px] font-mono">M9-6 §III.4</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-muted-foreground mb-1">C/185 créditeur (Budget Principal)</div>
              <div className="font-bold text-base">{formatEur(c185BP)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-muted-foreground mb-1">Σ C/185 débiteurs (Annexes)</div>
              <div className="font-bold text-base">{formatEur(c185BA)}</div>
            </div>
            <div className={`rounded-lg p-3 ${c185Concordant ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-destructive/10'}`}>
              <div className="text-muted-foreground mb-1">Écart</div>
              <div className={`font-bold text-base ${c185Concordant ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatEur(ecartC185)} {c185Concordant ? '✅' : '❌'}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground leading-relaxed border-t border-border pt-2 mt-2">
            <strong>Règles d'élimination :</strong><br />
            1. C/185 créditeur du BP et C/185 débiteurs des BA sont retirés du total actif consolidé.<br />
            2. Trésorerie consolidée = C/515100 du budget <strong>principal uniquement</strong> (les BA n'ont pas de C/515100 propre).<br />
            3. Les flux internes (transferts entre budgets) sont neutralisés.
          </div>
        </CardContent>
      </Card>

      {/* Synthesis table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,20%)] rounded-t-lg pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <Layers className="h-5 w-5 text-warning" />
            Tableau de synthèse consolidé
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left px-4 py-2 font-bold">Indicateur</th>
                  {rows.map((r, i) => (
                    <th key={r.type} className="text-right px-4 py-2 font-bold" style={{ color: COLORS[i] }}>
                      {r.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-2 font-black bg-primary/5">TOTAL CONSOLIDÉ</th>
                </tr>
              </thead>
              <tbody>
                {indicateurs.map((ind, idx) => (
                  <tr key={ind.label} className={`border-b ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-2 font-semibold">
                      {ind.label}
                      {ind.note && <span className="block text-[10px] text-muted-foreground font-normal">{ind.note}</span>}
                    </td>
                    {ind.values.map((v, i) => (
                      <td key={i} className={`text-right px-4 py-2 font-mono ${v < 0 ? 'text-destructive' : ''}`}>
                        {formatEur(v)}
                      </td>
                    ))}
                    <td className={`text-right px-4 py-2 font-mono font-bold bg-primary/5 ${ind.total < 0 ? 'text-destructive' : ''}`}>
                      {formatEur(ind.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PieChartCard title="Répartition des recettes" data={recettesData} />
        <PieChartCard title="Répartition du FDR" data={fdrData} />
        <PieChartCard title="Charges de personnel" data={personnelData} />
      </div>

      {/* Deficit warnings */}
      {rows.filter(r => r.type !== 'principal' && r.R.resultatBudgetaire < 0).length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-bold text-destructive">Budget(s) annexe(s) déficitaire(s)</p>
                {rows.filter(r => r.type !== 'principal' && r.R.resultatBudgetaire < 0).map(r => (
                  <p key={r.type} className="text-xs text-muted-foreground">
                    <strong>{r.label}</strong> : résultat = {formatEur(r.R.resultatBudgetaire)}.
                    Ce déficit se reporte sur le budget principal (M9-6 §2.1.2.3.2).
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PieChartCard({ title, data }: { title: string; data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={40} outerRadius={70} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatEur(v)} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
