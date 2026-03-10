// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Analyse pluriannuelle N à N-4
// Tableaux de variation et graphiques de tendance sur 5 ans
// M9-6 § V — Rapport de gestion pluriannuel
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur, formatPct } from '@/lib/cofieple_calculations';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Save, Loader2, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ExerciceData {
  exercice: number;
  resultat: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  caf: number;
  jours_autonomie: number;
  reserves: number;
  score_risque: number;
  taux_exec_charges: number;
  taux_exec_produits: number;
  total_charges_reel: number;
  total_produits_reel: number;
}

export function PluriannuelSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const R = resultats.principal;
  const [historique, setHistorique] = useState<ExerciceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!etab.uai) { setLoading(false); return; }
    loadHistorique();
  }, [etab.uai]);

  async function loadHistorique() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { setLoading(false); return; }

      const { data: rows } = await supabase
        .from('cofieple_exercises')
        .select('*')
        .eq('uai', etab.uai)
        .eq('user_id', session.session.user.id)
        .eq('type_budget', 'principal')
        .order('exercice', { ascending: true })
        .limit(5);

      if (rows) {
        setHistorique(rows.map(r => ({
          exercice: r.exercice,
          resultat: Number(r.resultat_budgetaire),
          fdr: Number(r.fdr),
          bfr: Number(r.bfr),
          tresorerie: Number(r.tresorerie),
          caf: Number(r.caf),
          jours_autonomie: Number(r.jours_autonomie),
          reserves: Number(r.reserves),
          score_risque: r.score_risque || 0,
          taux_exec_charges: Number(r.taux_exec_charges),
          taux_exec_produits: Number(r.taux_exec_produits),
          total_charges_reel: Number(r.total_charges_reel),
          total_produits_reel: Number(r.total_produits_reel),
        })));
      }
    } catch {} finally { setLoading(false); }
  }

  async function saveCurrentExercice() {
    if (!R || !etab.uai) { toast.error('Lancez d\'abord l\'analyse'); return; }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { toast.error('Connectez-vous'); return; }

      const payload = {
        user_id: session.session.user.id,
        uai: etab.uai,
        exercice: etab.exercice,
        type_budget: 'principal',
        total_charges_prev: R.totalChargesPrev,
        total_charges_reel: R.totalChargesReel,
        total_produits_prev: R.totalProduitsPrev,
        total_produits_reel: R.totalProduitsReel,
        resultat_budgetaire: R.resultatBudgetaire,
        resultat_comptable: R.resultatComptable,
        fdr: R.fdrComptable,
        bfr: R.bfr,
        tresorerie: R.tresorerieNette,
        caf: R.cafBudgetaire,
        jours_autonomie: R.joursAutonomie,
        reserves: R.reserves,
        reserves_ss_specialite: R.reservesSsSpeciaux,
        reserves_srh: R.reservesSRH,
        total_immo: R.totalImmo,
        total_amortissements: R.totalAmortissements,
        taux_exec_charges: R.tauxExecCharges,
        taux_exec_produits: R.tauxExecProduits,
        score_risque: R.scoreRisque || 0,
        niveau_risque: R.niveauRisque || 'faible',
      };

      const { error } = await supabase.from('cofieple_exercises').upsert(payload, {
        onConflict: 'user_id,uai,exercice,type_budget',
      });
      if (error) throw error;
      toast.success(`Exercice ${etab.exercice} sauvegardé`);
      await loadHistorique();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally { setSaving(false); }
  }

  // Build complete data with current
  const allData: ExerciceData[] = [...historique.filter(h => h.exercice !== etab.exercice)];
  if (R) {
    allData.push({
      exercice: etab.exercice,
      resultat: R.resultatBudgetaire,
      fdr: R.fdrComptable,
      bfr: R.bfr,
      tresorerie: R.tresorerieNette,
      caf: R.cafBudgetaire,
      jours_autonomie: R.joursAutonomie,
      reserves: R.reserves,
      score_risque: R.scoreRisque || 0,
      taux_exec_charges: R.tauxExecCharges,
      taux_exec_produits: R.tauxExecProduits,
      total_charges_reel: R.totalChargesReel,
      total_produits_reel: R.totalProduitsReel,
    });
  }
  allData.sort((a, b) => a.exercice - b.exercice);

  // Detect atypical variations
  const alertes: string[] = [];
  for (let i = 1; i < allData.length; i++) {
    const prev = allData[i - 1];
    const curr = allData[i];
    if (prev.caf > 0 && curr.caf < 0) alertes.push(`${curr.exercice} : Passage de CAF à IAF (${formatEur(prev.caf)} → ${formatEur(curr.caf)})`);
    if (prev.caf > 0 && curr.caf > 0 && (prev.caf - curr.caf) / prev.caf > 0.2)
      alertes.push(`${curr.exercice} : Chute de la CAF de ${((prev.caf - curr.caf) / prev.caf * 100).toFixed(0)}%`);
    if (prev.fdr > 0 && curr.fdr < 0) alertes.push(`${curr.exercice} : FDR devenu négatif`);
    if (prev.tresorerie > 0 && curr.tresorerie < 0) alertes.push(`${curr.exercice} : Trésorerie devenue négative`);
    if (prev.jours_autonomie >= 30 && curr.jours_autonomie < 30)
      alertes.push(`${curr.exercice} : Jours d'autonomie sous le seuil (${Math.round(curr.jours_autonomie)} j.)`);
  }

  const chartData = allData.map(d => ({
    exercice: String(d.exercice),
    FDR: d.fdr, BFR: d.bfr, Trésorerie: d.tresorerie, CAF: d.caf,
    Résultat: d.resultat, Réserves: d.reserves,
  }));

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs flex items-center justify-between gap-4">
          <div>
            <strong>Analyse pluriannuelle N à N-4</strong> — Sauvegardez l'exercice courant pour alimenter la
            base de comparaison. Les tendances et variations atypiques sont détectées automatiquement (M9-6 § V).
          </div>
          {R && (
            <Button onClick={saveCurrentExercice} disabled={saving} size="sm" className="shrink-0 gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder {etab.exercice}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Alertes */}
      {alertes.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Variations atypiques détectées — Commentaire requis pour le rapport de gestion
            </div>
            {alertes.map((a, i) => <div key={i} className="text-xs py-0.5 text-foreground">• {a}</div>)}
          </CardContent>
        </Card>
      )}

      {allData.length < 2 ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-8 text-center">
            <History className="h-12 w-12 text-warning mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Pas encore d'historique pluriannuel</p>
            <p className="text-xs text-muted-foreground">
              Sauvegardez le résultat de l'exercice courant pour commencer l'historique.
              Analysez les exercices précédents (N-1 à N-4) et sauvegardez-les pour voir les tendances.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Graphiques de tendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Structuration financière (FDR / BFR / Trésorerie)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Résultat et CAF/IAF</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar dataKey="Résultat" fill="hsl(215, 70%, 50%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="CAF" fill="hsl(160, 45%, 45%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tableau de variation */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Tableau de variation pluriannuelle — M9-6 § V
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-4 py-2.5 text-left font-semibold">Indicateur</th>
                    {allData.map(d => (
                      <th key={d.exercice} className="px-3 py-2.5 text-right font-semibold">{d.exercice}</th>
                    ))}
                    {allData.length >= 2 && <th className="px-3 py-2.5 text-center font-semibold">Tendance</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: 'Résultat budgétaire', key: 'resultat' as keyof ExerciceData, fmt: formatEur },
                    { label: 'FDR', key: 'fdr' as keyof ExerciceData, fmt: formatEur },
                    { label: 'BFR', key: 'bfr' as keyof ExerciceData, fmt: formatEur },
                    { label: 'Trésorerie', key: 'tresorerie' as keyof ExerciceData, fmt: formatEur },
                    { label: 'CAF/IAF', key: 'caf' as keyof ExerciceData, fmt: formatEur },
                    { label: 'Jours d\'autonomie', key: 'jours_autonomie' as keyof ExerciceData, fmt: (v: number) => `${Math.round(v)} j.` },
                    { label: 'Réserves', key: 'reserves' as keyof ExerciceData, fmt: formatEur },
                    { label: 'Taux exéc. charges', key: 'taux_exec_charges' as keyof ExerciceData, fmt: (v: number) => `${(v * 100).toFixed(1)} %` },
                    { label: 'Score risque', key: 'score_risque' as keyof ExerciceData, fmt: (v: number) => `${100 - v}/100` },
                  ].map(row => {
                    const vals = allData.map(d => Number(d[row.key]));
                    const trend = vals.length >= 2 ? (vals[vals.length - 1] > vals[vals.length - 2] ? 'up' : vals[vals.length - 1] < vals[vals.length - 2] ? 'down' : 'stable') : 'stable';
                    return (
                      <tr key={row.key} className="hover:bg-muted/50">
                        <td className="px-4 py-2 font-semibold text-muted-foreground">{row.label}</td>
                        {allData.map(d => (
                          <td key={d.exercice} className="px-3 py-2 text-right font-mono">{row.fmt(Number(d[row.key]))}</td>
                        ))}
                        {allData.length >= 2 && (
                          <td className="px-3 py-2 text-center">
                            {trend === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" /> :
                             trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive mx-auto" /> :
                             <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
