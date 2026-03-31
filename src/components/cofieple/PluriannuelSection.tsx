// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Analyse pluriannuelle N à N-4
// Tableaux de variation et graphiques de tendance sur 5 ans
// + Saisie manuelle des indicateurs comptables exercices antérieurs
// M9-6 § V — Rapport de gestion pluriannuel
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur, formatPct } from '@/lib/cofieple_calculations';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Save, Loader2, CheckCircle2, History, AlertTriangle, PenLine, BarChart3 } from 'lucide-react';
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
  jours_tresorerie: number;
  tmcap: number;
  tmnr: number;
}

const EMPTY_ROW = (exercice: number): ExerciceData => ({
  exercice, resultat: 0, fdr: 0, bfr: 0, tresorerie: 0, caf: 0,
  jours_autonomie: 0, reserves: 0, score_risque: 0,
  taux_exec_charges: 0, taux_exec_produits: 0,
  total_charges_reel: 0, total_produits_reel: 0,
  jours_tresorerie: 0, tmcap: 0, tmnr: 0,
});

// Pièce 14 indicators
const FIELDS_PIECE14: { key: keyof ExerciceData; label: string; unit: string }[] = [
  { key: 'fdr', label: 'Fonds de roulement', unit: '€' },
  { key: 'jours_autonomie', label: 'Jours de fonds de roulement', unit: 'j.' },
  { key: 'bfr', label: 'Besoin en fonds de roulement', unit: '€' },
  { key: 'tresorerie', label: 'Trésorerie', unit: '€' },
  { key: 'jours_tresorerie', label: 'Jours de trésorerie', unit: 'j.' },
  { key: 'tmcap', label: 'Taux moyen de charge à payer', unit: '%' },
  { key: 'tmnr', label: 'Taux de non recouvrement', unit: '%' },
];

// Pièce 5 indicators
const FIELDS_PIECE5: { key: keyof ExerciceData; label: string; unit: string }[] = [
  { key: 'resultat', label: 'Résultat', unit: '€' },
  { key: 'caf', label: 'CAF / IAF', unit: '€' },
];

export function PluriannuelSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const R = resultats.principal;
  const [historique, setHistorique] = useState<ExerciceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'graphiques' | 'saisie'>('graphiques');

  // Manual entry state for years N-1 to N-4
  const currentYear = etab.exercice || new Date().getFullYear() - 1;
  const pastYears = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1];
  const [manualData, setManualData] = useState<Record<number, ExerciceData>>({});
  const [savingYear, setSavingYear] = useState<number | null>(null);

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
        const mapped: ExerciceData[] = rows.map(r => ({
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
          jours_tresorerie: Number((r as any).jours_tresorerie || 0),
          tmcap: Number((r as any).tmcap || 0),
          tmnr: Number((r as any).tmnr || 0),
        }));
        setHistorique(mapped);
        // Pre-fill manual data from DB
        const manual: Record<number, ExerciceData> = {};
        for (const y of pastYears) {
          const existing = mapped.find(m => m.exercice === y);
          manual[y] = existing || EMPTY_ROW(y);
        }
        setManualData(manual);
      }
    } catch {} finally { setLoading(false); }
  }

  const updateField = useCallback((year: number, key: keyof ExerciceData, value: string) => {
    setManualData(prev => ({
      ...prev,
      [year]: { ...prev[year], [key]: parseFloat(value) || 0 },
    }));
  }, []);

  async function saveManualYear(year: number) {
    if (!etab.uai) return;
    setSavingYear(year);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { toast.error('Connectez-vous'); return; }
      const d = manualData[year];
      if (!d) return;

      const payload = {
        user_id: session.session.user.id,
        uai: etab.uai,
        exercice: year,
        type_budget: 'principal',
        resultat_budgetaire: d.resultat,
        fdr: d.fdr,
        bfr: d.bfr,
        tresorerie: d.tresorerie,
        caf: d.caf,
        jours_autonomie: d.jours_autonomie,
        reserves: d.reserves,
        total_charges_reel: d.total_charges_reel,
        total_produits_reel: d.total_produits_reel,
        taux_exec_charges: d.taux_exec_charges,
        taux_exec_produits: d.taux_exec_produits,
        score_risque: d.score_risque || 0,
        niveau_risque: 'faible',
        total_charges_prev: 0,
        total_produits_prev: 0,
        resultat_comptable: 0,
        reserves_ss_specialite: 0,
        reserves_srh: 0,
        total_immo: 0,
        total_amortissements: 0,
        jours_tresorerie: d.jours_tresorerie,
        tmcap: d.tmcap,
        tmnr: d.tmnr,
      };

      const { error } = await supabase.from('cofieple_exercises').upsert(payload, {
        onConflict: 'user_id,uai,exercice,type_budget',
      });
      if (error) throw error;
      toast.success(`Indicateurs ${year} sauvegardés`);
      await loadHistorique();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally { setSavingYear(null); }
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
      jours_tresorerie: R.joursTresorerie || 0,
      tmcap: R.tmcap || 0,
      tmnr: R.tmnr || 0,
    });
  }
  allData.sort((a, b) => a.exercice - b.exercice);

  // Filter out empty rows (all zeros) for charts
  const significantData = allData.filter(d => d.fdr !== 0 || d.resultat !== 0 || d.tresorerie !== 0 || d.caf !== 0);

  // Detect atypical variations
  const alertes: string[] = [];
  for (let i = 1; i < significantData.length; i++) {
    const prev = significantData[i - 1];
    const curr = significantData[i];
    if (prev.caf > 0 && curr.caf < 0) alertes.push(`${curr.exercice} : Passage de CAF à IAF (${formatEur(prev.caf)} → ${formatEur(curr.caf)})`);
    if (prev.caf > 0 && curr.caf > 0 && (prev.caf - curr.caf) / prev.caf > 0.2)
      alertes.push(`${curr.exercice} : Chute de la CAF de ${((prev.caf - curr.caf) / prev.caf * 100).toFixed(0)}%`);
    if (prev.fdr > 0 && curr.fdr < 0) alertes.push(`${curr.exercice} : FDR devenu négatif`);
    if (prev.tresorerie > 0 && curr.tresorerie < 0) alertes.push(`${curr.exercice} : Trésorerie devenue négative`);
    if (prev.jours_autonomie >= 30 && curr.jours_autonomie < 30)
      alertes.push(`${curr.exercice} : Jours d'autonomie sous le seuil (${Math.round(curr.jours_autonomie)} j.)`);
  }

  const chartData = significantData.map(d => ({
    exercice: String(d.exercice),
    FDR: d.fdr, BFR: d.bfr, Trésorerie: d.tresorerie, CAF: d.caf,
    Résultat: d.resultat, Réserves: d.reserves,
  }));

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement…</div>;

  const hasExistingData = (year: number) => historique.some(h => h.exercice === year && (h.fdr !== 0 || h.resultat !== 0 || h.tresorerie !== 0));

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs flex items-center justify-between gap-4">
          <div>
            <strong>Analyse pluriannuelle N à N-4</strong> — Saisissez les indicateurs des exercices antérieurs
            ou sauvegardez l'exercice courant. Les graphiques et alertes se mettent à jour automatiquement.
          </div>
          {R && (
            <Button onClick={saveCurrentExercice} disabled={saving} size="sm" className="shrink-0 gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder {etab.exercice}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeSubTab} onValueChange={v => setActiveSubTab(v as any)}>
        <TabsList className="mb-3">
          <TabsTrigger value="graphiques" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Graphiques & Tendances</TabsTrigger>
          <TabsTrigger value="saisie" className="gap-1.5"><PenLine className="h-3.5 w-3.5" /> Saisie exercices antérieurs</TabsTrigger>
        </TabsList>

        {/* ═══ ONGLET SAISIE MANUELLE ═══ */}
        <TabsContent value="saisie">
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Saisie des indicateurs comptables — Exercices {pastYears[pastYears.length - 1]} à {pastYears[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold sticky left-0 bg-slate-700 min-w-[180px]">Indicateur</th>
                    {pastYears.map(y => (
                      <th key={y} className="px-3 py-2.5 text-center font-semibold min-w-[140px]">
                        {y}
                        {hasExistingData(y) && <CheckCircle2 className="h-3 w-3 text-emerald-400 inline ml-1" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {FIELDS.map(field => (
                    <tr key={field.key} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-semibold text-muted-foreground sticky left-0 bg-background">
                        {field.label} <span className="text-muted-foreground/50">({field.unit})</span>
                      </td>
                      {pastYears.map(y => (
                        <td key={y} className="px-2 py-1.5">
                          <Input
                            type="number"
                            step={field.unit === '%' ? '0.1' : '1'}
                            className="h-8 text-xs text-right font-mono"
                            value={manualData[y]?.[field.key] || ''}
                            onChange={e => updateField(y, field.key, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="px-3 py-2 sticky left-0 bg-muted/30"></td>
                    {pastYears.map(y => (
                      <td key={y} className="px-2 py-2 text-center">
                        <Button
                          size="sm"
                          variant={hasExistingData(y) ? 'outline' : 'default'}
                          className="gap-1.5 w-full text-xs"
                          disabled={savingYear === y}
                          onClick={() => saveManualYear(y)}
                        >
                          {savingYear === y ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {hasExistingData(y) ? 'Mettre à jour' : 'Sauvegarder'}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Reportez les données du bilan de santé financière Op@le pour chaque exercice antérieur.
            Les graphiques de l'onglet « Graphiques & Tendances » seront mis à jour automatiquement.
          </p>
        </TabsContent>

        {/* ═══ ONGLET GRAPHIQUES ═══ */}
        <TabsContent value="graphiques">
          {/* Alertes */}
          {alertes.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 mb-5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Variations atypiques détectées — Commentaire requis pour le rapport de gestion
                </div>
                {alertes.map((a, i) => <div key={i} className="text-xs py-0.5 text-foreground">• {a}</div>)}
              </CardContent>
            </Card>
          )}

          {significantData.length < 2 ? (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 text-warning mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Pas encore d'historique pluriannuel</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Rendez-vous dans l'onglet « Saisie exercices antérieurs » pour renseigner les indicateurs
                  des exercices passés, ou sauvegardez l'exercice courant.
                </p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveSubTab('saisie')}>
                  <PenLine className="h-3.5 w-3.5" /> Saisir les exercices antérieurs
                </Button>
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

              {/* Graphique réserves */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Évolution des réserves et jours d'autonomie</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={significantData.map(d => ({ exercice: String(d.exercice), Réserves: d.reserves, 'Jours autonomie': d.jours_autonomie }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="eur" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="jours" orientation="right" tick={{ fontSize: 10 }} unit=" j." />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <ReferenceLine yAxisId="jours" y={30} stroke="hsl(0, 84%, 60%)" strokeDasharray="4 4" />
                      <Line yAxisId="eur" type="monotone" dataKey="Réserves" stroke="hsl(280, 60%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="jours" type="monotone" dataKey="Jours autonomie" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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
                        {significantData.map(d => (
                          <th key={d.exercice} className="px-3 py-2.5 text-right font-semibold">{d.exercice}</th>
                        ))}
                        {significantData.length >= 2 && <th className="px-3 py-2.5 text-center font-semibold">Var. N/N-1</th>}
                        {significantData.length >= 2 && <th className="px-3 py-2.5 text-center font-semibold">Tendance</th>}
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
                        const vals = significantData.map(d => Number(d[row.key]));
                        const trend = vals.length >= 2 ? (vals[vals.length - 1] > vals[vals.length - 2] ? 'up' : vals[vals.length - 1] < vals[vals.length - 2] ? 'down' : 'stable') : 'stable';
                        const variation = vals.length >= 2 ? vals[vals.length - 1] - vals[vals.length - 2] : 0;
                        return (
                          <tr key={row.key} className="hover:bg-muted/50">
                            <td className="px-4 py-2 font-semibold text-muted-foreground">{row.label}</td>
                            {significantData.map(d => (
                              <td key={d.exercice} className="px-3 py-2 text-right font-mono">{row.fmt(Number(d[row.key]))}</td>
                            ))}
                            {significantData.length >= 2 && (
                              <td className={`px-3 py-2 text-right font-mono ${variation >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                {variation >= 0 ? '+' : ''}{row.fmt(variation)}
                              </td>
                            )}
                            {significantData.length >= 2 && (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}