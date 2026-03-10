// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Tableau de bord "One-Page" (santé financière EPLE)
// Affichage instantané dès que les résultats sont disponibles
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  historique?: { exercice: number; fdr: number; bfr: number; tresorerie: number; caf: number; resultat: number; joursAutonomie: number; scoreRisque: number }[];
}

export function DashboardOnePage({ historique = [] }: Props) {
  const resultats = useCofiepleStore(s => s.resultats);
  const etab = useCofiepleStore(s => s.etablissement);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const R = resultats.principal;

  if (!R) return null;

  const fdr = R.fdrComptable;
  const bfr = R.bfr;
  const treso = R.tresorerieNette;
  const caf = R.cafBudgetaire;
  const jours = R.joursAutonomie;
  const score = R.scoreRisque || 0;
  const niveau = R.niveauRisque || 'faible';

  // Radar chart data
  const radarData = [
    { subject: 'FDR', value: Math.min(fdr > 0 ? 80 : fdr === 0 ? 50 : 20, 100), fullMark: 100 },
    { subject: 'Trésorerie', value: Math.min(jours >= 30 ? 90 : jours >= 15 ? 60 : 20, 100), fullMark: 100 },
    { subject: 'CAF', value: Math.min(caf > 0 ? 85 : caf === 0 ? 50 : 15, 100), fullMark: 100 },
    { subject: 'Exéc. dépenses', value: Math.min(R.tauxExecCharges * 100, 100), fullMark: 100 },
    { subject: 'Exéc. recettes', value: Math.min(R.tauxExecProduits * 100, 100), fullMark: 100 },
    { subject: 'Réserves', value: Math.min(R.reserves > 0 ? 80 : 30, 100), fullMark: 100 },
  ];

  // Structure chart
  const structureData = [
    { name: 'FDR', value: fdr, fill: fdr >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
    { name: 'BFR', value: bfr, fill: bfr <= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(38, 92%, 50%)' },
    { name: 'Tréso', value: treso, fill: treso >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
  ];

  // Historique + current
  const trendData = [
    ...historique.map(h => ({ exercice: String(h.exercice), FDR: h.fdr, BFR: h.bfr, Trésorerie: h.tresorerie, CAF: h.caf })),
    { exercice: String(etab.exercice), FDR: fdr, BFR: bfr, Trésorerie: treso, CAF: caf },
  ];

  // Détection anomalies pluriannuelles
  const anomaliesTrend: string[] = [];
  if (historique.length > 0) {
    const prev = historique[historique.length - 1];
    if (prev.caf > 0 && caf < 0) anomaliesTrend.push('⚠️ Passage de CAF à IAF — Variation critique de l\'autofinancement');
    if (prev.fdr > 0 && fdr < 0) anomaliesTrend.push('⚠️ FDR devenu négatif — Alerte structurelle');
    if (prev.caf > 0 && caf > 0 && (prev.caf - caf) / prev.caf > 0.2) anomaliesTrend.push(`⚠️ Chute de la CAF de ${((prev.caf - caf) / prev.caf * 100).toFixed(0)}% — Commentaire requis pour l'annexe`);
    if (prev.tresorerie > 0 && treso < 0) anomaliesTrend.push('🚫 Trésorerie devenue négative — Signalement obligatoire');
    if (prev.joursAutonomie >= 30 && jours < 30) anomaliesTrend.push(`⚠️ Jours d'autonomie passés sous le seuil de 30 jours (${Math.round(jours)} j.)`);
  }

  const niveauColors: Record<string, string> = {
    faible: 'bg-emerald-600 text-white',
    modéré: 'bg-warning text-warning-foreground',
    élevé: 'bg-orange-600 text-white',
    critique: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Score de risque global */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <GaugeKPI label="Score de risque" value={`${100 - score}/100`} sub={niveau}
          color={score <= 15 ? 'green' : score <= 40 ? 'amber' : score <= 70 ? 'red' : 'red'} />
        <GaugeKPI label="FDR" value={formatEur(fdr)}
          sub={fdr >= 0 ? 'Positif ✓' : 'Négatif ✗'}
          color={fdr >= 0 ? 'green' : 'red'}
          trend={historique.length > 0 ? (fdr > historique[historique.length - 1].fdr ? 'up' : fdr < historique[historique.length - 1].fdr ? 'down' : 'stable') : undefined} />
        <GaugeKPI label="BFR" value={formatEur(bfr)}
          sub={bfr <= 0 ? 'Négatif ✓' : 'À couvrir'}
          color={bfr <= 0 ? 'green' : bfr < fdr ? 'amber' : 'red'} />
        <GaugeKPI label="Trésorerie" value={formatEur(treso)}
          sub={`${Math.round(jours)} jours`}
          color={jours >= 30 ? 'green' : jours > 0 ? 'amber' : 'red'}
          trend={historique.length > 0 ? (treso > historique[historique.length - 1].tresorerie ? 'up' : treso < historique[historique.length - 1].tresorerie ? 'down' : 'stable') : undefined} />
        <GaugeKPI label="CAF/IAF" value={formatEur(caf)}
          sub={caf >= 0 ? 'Autofinancement' : 'Insuffisance'}
          color={caf > 0 ? 'green' : caf === 0 ? 'amber' : 'red'}
          trend={historique.length > 0 ? (caf > historique[historique.length - 1].caf ? 'up' : caf < historique[historique.length - 1].caf ? 'down' : 'stable') : undefined} />
        <GaugeKPI label="Résultat" value={formatEur(R.resultatBudgetaire)}
          sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'}
          color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} />
      </div>

      {/* Alertes tendancielles */}
      {anomaliesTrend.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes pluriannuelles — Variations atypiques détectées
            </div>
            {anomaliesTrend.map((a, i) => (
              <div key={i} className="text-xs text-foreground py-1">{a}</div>
            ))}
            <p className="text-xs text-muted-foreground mt-2 italic">
              Ces variations nécessitent un commentaire dans l'annexe du rapport de gestion (M9-6 § V).
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar santé */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Santé financière
              <Badge className={`ml-auto ${niveauColors[niveau]}`}>{niveau}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Structure FDR/BFR/Tréso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Structure financière
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={structureData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), 'Montant']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {structureData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendance pluriannuelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tendance {trendData.length > 1 ? `${trendData[0].exercice}–${trendData[trendData.length - 1].exercice}` : etab.exercice}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Line type="monotone" dataKey="FDR" stroke="hsl(215, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Trésorerie" stroke="hsl(160, 45%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="CAF" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs italic text-center">
                Sauvegardez les exercices précédents pour voir la tendance pluriannuelle (N à N-4)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setActiveTab('controles')}>
          <Shield className="h-3.5 w-3.5 mr-1.5" /> Contrôles automatiques
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('tableaux')}>
          <Activity className="h-3.5 w-3.5 mr-1.5" /> Tableaux détaillés
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('rapport_ordo')}>
          <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Rapport ordonnateur
        </Button>
      </div>
    </div>
  );
}

function GaugeKPI({ label, value, sub, color, trend }: {
  label: string; value: string; sub: string;
  color: 'green' | 'red' | 'amber';
  trend?: 'up' | 'down' | 'stable';
}) {
  const borderColors: Record<string, string> = {
    green: 'border-l-emerald-500',
    red: 'border-l-destructive',
    amber: 'border-l-warning',
  };
  const textColors: Record<string, string> = {
    green: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-destructive',
    amber: 'text-warning',
  };
  return (
    <Card className={`border-l-4 ${borderColors[color]}`}>
      <CardContent className="p-3">
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
          {label}
          {trend && (
            trend === 'up' ? <TrendingUp className="h-3 w-3 text-emerald-500" /> :
            trend === 'down' ? <TrendingDown className="h-3 w-3 text-destructive" /> :
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <div className={`text-base font-black font-mono ${textColors[color]}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
