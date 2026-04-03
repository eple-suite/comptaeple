import { useMemo } from 'react';
import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard, EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Scale, Target } from 'lucide-react';

export function OrdoS2TableauBord() {
  const { etab, R, safe, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_tableau_bord`, '');

  if (!R || !safe) return <EmptyState msg="Importez les données et lancez l'analyse pour afficher le tableau de bord financier." />;

  const execData = [
    { name: 'Dépenses', Prévu: R.totalChargesPrev, Réalisé: R.totalChargesSde, taux: R.tauxExecCharges },
    { name: 'Recettes', Prévu: R.totalProduitsPrev, Réalisé: R.totalProduitsSdr, taux: R.tauxExecProduits },
  ];

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S2" title="Tableau de bord financier" />

        {/* KPI line */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          <KPICard label="Résultat budgétaire" value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="📊" sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'} />
          <KPICard label="CAF / IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} />
          <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub={`${Math.round(safe.joursFdr)} jours`} />
          <KPICard label="Trésorerie" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(safe.joursTresorerie)} jours`} />
          <KPICard label="BFR/DFR" value={formatEur(R.bfr)} color={R.bfr <= 0 ? 'green' : 'amber'} icon="📐" sub={`${Math.round((Math.abs(R.bfr) * 365) / (R.drfn || 1))} jours`} />
          <KPICard label="Tmcap" value={`${safe.tmcap.toFixed(1)} %`} color={safe.tmcap > 15 ? 'red' : safe.tmcap > 10 ? 'amber' : 'green'} icon="⏱️" sub="Charges à payer" />
          <KPICard label="TMnr" value={`${safe.tmnr.toFixed(1)} %`} color={safe.tmnr > 5 ? 'red' : safe.tmnr > 3 ? 'amber' : 'green'} icon="📬" sub="Non-recouvrement" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Balance dépenses/recettes */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <Scale className="h-3 w-3" /> Balance dépenses / recettes
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Dépenses', value: R.totalChargesSde, fill: 'hsl(0,70%,55%)' },
                { name: 'Recettes', value: R.totalProduitsSdr, fill: 'hsl(160,45%,45%)' },
              ]} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                <Bar isAnimationActive={false} dataKey="value" radius={[0, 4, 4, 0]}>
                  <Cell fill="hsl(0,70%,55%)" />
                  <Cell fill="hsl(160,45%,45%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center text-xs mt-2 font-semibold">
              Solde : <span className={R.resultatBudgetaire >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(R.resultatBudgetaire)}</span>
            </div>
          </div>

          {/* Taux d'exécution */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" /> Taux d'exécution budgétaire
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={execData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar isAnimationActive={false} dataKey="Prévu" fill="hsl(215,70%,50%)" opacity={0.4} radius={[2, 2, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="Réalisé" fill="hsl(215,70%,50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-xs mt-2">
              <span>Dépenses : <strong className={R.tauxExecCharges >= 0.85 ? 'text-emerald-600' : 'text-warning'}>{(R.tauxExecCharges * 100).toFixed(1)} %</strong></span>
              <span>Recettes : <strong className={R.tauxExecProduits >= 0.9 ? 'text-emerald-600' : 'text-warning'}>{(R.tauxExecProduits * 100).toFixed(1)} %</strong></span>
            </div>
          </div>
        </div>

        {/* Évolution quinquennale FDR/BFR/Tréso */}
        {(R.fdrComptableN1 > 0 || R.bfrN1 !== 0 || R.tresorerieN1 > 0) && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">📈 Évolution FDR / BFR / Trésorerie (N vs N-1)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: `N-1 (${etab.exercice - 1})`, FDR: R.fdrComptableN1, BFR: R.bfrN1, Trésorerie: R.tresorerieN1 },
                { name: `N (${etab.exercice})`, FDR: R.fdrComptable, BFR: R.bfr, Trésorerie: R.tresorerie },
              ]} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar isAnimationActive={false} dataKey="FDR" fill="#003366" radius={[2, 2, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="BFR" fill="#e74c3c" radius={[2, 2, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="Trésorerie" fill="#27ae60" radius={[2, 2, 0, 0]} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <CommentaireBox label="Analyse financière générale" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
