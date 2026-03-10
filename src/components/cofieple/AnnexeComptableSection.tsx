// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Annexe Comptable « Magazine Institutionnel »
// Navigation par onglets thématiques + DataViz interactives
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Loader2, Printer, FileText, Users, Building, Sparkles,
  TrendingUp, AlertTriangle, ChevronDown, ChevronRight, Activity,
  Landmark, Scale, Wallet, BookOpen, ArrowRight, Info, Lightbulb,
  BarChart3, PieChart as PieChartIcon, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart,
  RadialBarChart, RadialBar
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
interface AnnexeTexts {
  presentation: string; execution: string;
  patrimoine: string; srh: string; perspectives: string;
}

interface ContexteQualif {
  changementOrdonnateur: string; changementGestionnaire: string;
  mouvementsAgence: string; evenementsMarquants: string;
  travauxImportants: string; reformesPedagogiques: string; difficultes: string;
}

// ── Onglets thématiques ──────────────────────────────────────
const ANNEXE_TABS = [
  { id: 'activite', label: 'Activité & Contexte', icon: <Activity className="h-4 w-4" />, sections: ['presentation'] },
  { id: 'equilibre', label: 'Équilibre Financier', icon: <Scale className="h-4 w-4" />, sections: ['execution'] },
  { id: 'patrimoine', label: 'Patrimoine & Tiers', icon: <Landmark className="h-4 w-4" />, sections: ['patrimoine'] },
  { id: 'viabilisation', label: 'SRH & Viabilisation', icon: <Users className="h-4 w-4" />, sections: ['srh'] },
  { id: 'perspectives', label: 'Perspectives', icon: <Sparkles className="h-4 w-4" />, sections: ['perspectives'] },
] as const;

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  presentation: { label: 'I. Présentation générale', icon: <Building className="h-4 w-4" /> },
  execution: { label: 'II. Exécution budgétaire', icon: <TrendingUp className="h-4 w-4" /> },
  patrimoine: { label: 'III. Situation patrimoniale', icon: <FileText className="h-4 w-4" /> },
  srh: { label: 'IV. SRH & Viabilisation', icon: <Users className="h-4 w-4" /> },
  perspectives: { label: 'V. Perspectives', icon: <Sparkles className="h-4 w-4" /> },
};

const COLORS = {
  primary: 'hsl(215, 70%, 45%)',
  success: 'hsl(160, 45%, 45%)',
  warning: 'hsl(38, 92%, 50%)',
  purple: 'hsl(280, 50%, 50%)',
  danger: 'hsl(0, 70%, 50%)',
  muted: 'hsl(215, 15%, 70%)',
  teal: 'hsl(185, 60%, 40%)',
  indigo: 'hsl(240, 50%, 55%)',
};

const DONUT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.danger, COLORS.teal, COLORS.indigo, COLORS.muted];

export function AnnexeComptableSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const budgets = useCofiepleStore(s => s.budgets);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  const [activeAnnexeTab, setActiveAnnexeTab] = useState('activite');
  const [texts, setTexts] = useState<AnnexeTexts>({
    presentation: '', execution: '', patrimoine: '', srh: '', perspectives: '',
  });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [contexte, setContexte] = useState<ContexteQualif>({
    changementOrdonnateur: '', changementGestionnaire: '', mouvementsAgence: '',
    evenementsMarquants: '', travauxImportants: '', reformesPedagogiques: '', difficultes: '',
  });
  const [indicators, setIndicators] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedEtab, setSelectedEtab] = useState<string>('principal');

  // Reading progress
  const completedSections = useMemo(() => {
    return Object.values(texts).filter(t => t.length > 0).length;
  }, [texts]);
  const progressPct = Math.round((completedSections / 5) * 100);

  // Load indicators and history
  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const uid = session.session.user.id;
        const [indRes, histRes] = await Promise.all([
          supabase.from('cofieple_extra_indicators').select('*')
            .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', uid).maybeSingle(),
          supabase.from('cofieple_exercises').select('*')
            .eq('uai', etab.uai).eq('user_id', uid)
            .order('exercice', { ascending: false }).limit(5),
        ]);
        if (indRes.data) setIndicators(indRes.data);
        if (histRes.data) setHistory(histRes.data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  const buildContextString = useCallback(() => {
    return Object.entries(contexte)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          changementOrdonnateur: 'Changement d\'ordonnateur',
          changementGestionnaire: 'Changement de gestionnaire',
          mouvementsAgence: 'Mouvements agence comptable',
          evenementsMarquants: 'Événements marquants',
          travauxImportants: 'Travaux importants',
          reformesPedagogiques: 'Réformes pédagogiques',
          difficultes: 'Difficultés logistiques',
        };
        return `${labels[k] || k} : ${v}`;
      }).join(' | ');
  }, [contexte]);

  async function genererSection(sectionId: string) {
    if (!R) return;
    setLoadingSection(sectionId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-annexe', {
        body: {
          section: sectionId, etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable, bfr: R.bfr, tresorerieNette: R.tresorerieNette,
            cafBudgetaire: R.cafBudgetaire, cafComptable: R.cafComptable,
            totalChargesReel: R.totalChargesReel, totalProduitsReel: R.totalProduitsReel,
            totalChargesPrev: R.totalChargesPrev, totalProduitsPrev: R.totalProduitsPrev,
            tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
            joursAutonomie: R.joursAutonomie, reserves: R.reserves,
          },
          indicateurs: indicators, historique: history, contexte: buildContextString(),
        },
      });
      if (error) throw error;
      setTexts(prev => ({ ...prev, [sectionId]: data?.text || '' }));
      toast.success(`Section "${SECTION_META[sectionId]?.label}" générée`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération IA');
    }
    setLoadingSection(null);
  }

  async function genererTout() {
    for (const s of Object.keys(SECTION_META)) {
      await genererSection(s);
    }
  }

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer l'annexe comptable réglementaire (M9-6 § V.3)." />;

  // ── Computed chart data ────────────────────────────────────
  const recettesData = Object.entries(R.parService).map(([svc, d]: [string, any], i) => ({
    name: d.libelle || svc, value: d.produitsReel || 0, fill: DONUT_COLORS[i % DONUT_COLORS.length],
  })).filter(d => d.value > 0);

  const chargesData = Object.entries(R.parService).map(([svc, d]: [string, any], i) => ({
    name: d.libelle || svc, value: d.chargesReel || 0, fill: DONUT_COLORS[i % DONUT_COLORS.length],
  })).filter(d => d.value > 0);

  const depensesBarData = Object.entries(R.parService).map(([svc, d]: [string, any]) => ({
    name: d.libelle || svc, charges: d.chargesReel || 0, previsions: d.chargesPrev || 0,
  }));

  const trendData = history.length > 0
    ? [...history].reverse().map(h => ({
        exercice: h.exercice, FDR: h.fdr, BFR: h.bfr, Trésorerie: h.tresorerie, CAF: h.caf,
      }))
    : [];

  // Subventions vs Ressources propres
  const dependanceData = [
    { name: 'Subventions', value: (R.totalProduitsReel || 0) - (R.ressourcesPropres || 0), fill: COLORS.primary },
    { name: 'Ressources propres', value: R.ressourcesPropres || 0, fill: COLORS.success },
  ].filter(d => d.value > 0);

  // Résultat comptable → Réserves infographic
  const reservesFlowData = [
    { label: 'Résultat comptable', value: R.resultatComptable, icon: '📊' },
    { label: 'Réserves antérieures', value: (R.reserves || 0) - R.resultatComptable, icon: '🏛️' },
    { label: 'Réserves nouvelles', value: R.reserves, icon: '💰' },
  ];

  // Taux d'exécution radial
  const execRadialData = [
    { name: 'Charges', value: Math.round((R.tauxExecCharges || 0) * 100), fill: COLORS.primary },
    { name: 'Produits', value: Math.round((R.tauxExecProduits || 0) * 100), fill: COLORS.success },
  ];

  const hasMultipleBudgets = budgets.length > 1;

  // ── Callout insights ───────────────────────────────────────
  const callouts: { type: 'info' | 'warning' | 'success'; text: string }[] = [];
  
  if (R.joursAutonomie < 30) {
    callouts.push({ type: 'warning', text: `⚠️ L'autonomie financière est de ${Math.round(R.joursAutonomie)} jours, soit en-deçà du seuil prudentiel de 30 jours. Une vigilance accrue est recommandée.` });
  } else if (R.joursAutonomie > 90) {
    callouts.push({ type: 'info', text: `💡 Le saviez-vous ? Avec ${Math.round(R.joursAutonomie)} jours d'autonomie, l'établissement dispose d'une marge confortable qui pourrait être mobilisée pour des projets d'investissement.` });
  }
  
  if (R.tauxExecCharges > 0 && R.tauxExecCharges < 0.85) {
    callouts.push({ type: 'info', text: `📉 Le taux d'exécution des dépenses (${(R.tauxExecCharges * 100).toFixed(1)}%) révèle des crédits non consommés significatifs. Cela peut indiquer un calibrage budgétaire perfectible.` });
  }
  
  if (history.length >= 2) {
    const prev = history[1];
    if (prev && R.fdrComptable && prev.fdr) {
      const varFdr = ((R.fdrComptable - prev.fdr) / Math.abs(prev.fdr)) * 100;
      if (Math.abs(varFdr) > 15) {
        callouts.push({
          type: varFdr > 0 ? 'success' : 'warning',
          text: `📊 Le fonds de roulement a ${varFdr > 0 ? 'progressé' : 'diminué'} de ${Math.abs(varFdr).toFixed(0)}% par rapport à N-1, ${varFdr > 0 ? 'sécurisant la capacité d\'investissement' : 'nécessitant une attention particulière sur les prochains exercices'}.`,
        });
      }
    }
  }

  if (indicators?.conso_electricite > 0 && indicators?.surface_batiments > 0) {
    const ratio = indicators.conso_electricite / indicators.surface_batiments;
    if (ratio > 50) {
      callouts.push({ type: 'warning', text: `🔌 Le ratio de consommation électrique (${ratio.toFixed(0)} €/m²) dépasse les standards. L'efficacité énergétique du bâti mérite une attention particulière.` });
    }
  }

  return (
    <div className="space-y-4">
      {/* ═══ HEADER MAGAZINE ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 print:bg-white print:text-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(215,70%,45%,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-6 w-6 text-warning" />
                <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px] uppercase tracking-widest">
                  Document réglementaire M9-6
                </Badge>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Annexe au Compte Financier
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {etab.nom || 'Établissement'} — RNE {etab.uai} — Exercice {etab.exercice}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Instruction codificatrice M9-6 du 12/02/2026 — Décret n°2012-1246 (RGCP)
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <Button onClick={genererTout} disabled={!!loadingSection}
                className="bg-warning text-warning-foreground hover:bg-warning/90 gap-2 font-bold shadow-lg">
                {loadingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Générer toute l'annexe (IA)
              </Button>
              <Button variant="outline" onClick={() => window.print()}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2 text-xs">
                <Printer className="h-3 w-3" /> Imprimer / PDF
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">Progression</span>
            <Progress value={progressPct} className="flex-1 h-2 bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono shrink-0">{completedSections}/5 sections</span>
            {completedSections === 5 && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </div>
        </div>
      </div>

      {/* Multi-establishment selector */}
      {hasMultipleBudgets && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold">Établissement / Budget :</span>
            {budgets.map(b => (
              <Button key={b.type} variant={selectedEtab === b.type ? 'default' : 'outline'} size="sm"
                onClick={() => setSelectedEtab(b.type)} className="text-xs">
                {b.libelle}
              </Button>
            ))}
            <Badge variant="outline" className="text-xs ml-auto">
              Groupement comptable — Annexe déclinée par établissement
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ═══ ONGLETS THÉMATIQUES ═══ */}
      <Tabs value={activeAnnexeTab} onValueChange={setActiveAnnexeTab} className="space-y-4">
        <TabsList className="w-full h-auto flex-wrap bg-muted/50 p-1 rounded-xl gap-1">
          {ANNEXE_TABS.map(tab => {
            const tabSections = tab.sections;
            const isComplete = tabSections.every(s => texts[s as keyof AnnexeTexts]?.length > 0);
            return (
              <TabsTrigger key={tab.id} value={tab.id}
                className="flex-1 min-w-[140px] gap-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 relative">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {isComplete && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ═══ TAB 1: ACTIVITÉ & CONTEXTE ═══ */}
        <TabsContent value="activite" className="space-y-6 mt-0">
          {/* Callouts */}
          {callouts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {callouts.slice(0, 2).map((c, i) => (
                <Callout key={i} type={c.type} text={c.text} />
              ))}
            </div>
          )}

          {/* KPI hero cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Résultat" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📊" sub="Résultat comptable" isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
            <KPICard label="Élèves" value={indicators?.effectif_eleves?.toLocaleString('fr-FR') || '—'} color="purple" icon="🎓" sub={indicators?.effectif_dp ? `dont ${indicators.effectif_dp} DP` : ''} isText />
            <KPICard label="Autonomie" value={`${Math.round(R.joursAutonomie)} j`} color={R.joursAutonomie >= 30 ? 'green' : 'red'} icon="⏱️" sub={R.joursAutonomie >= 30 ? 'Seuil respecté' : 'Sous le seuil'} isText />
          </div>

          {/* Contexte qualitatif */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 py-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Contexte & Événements marquants
                <Badge variant="outline" className="ml-auto border-warning/50 text-warning text-xs">Saisie qualitative</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Ces éléments sont intégrés par l'IA dans la rédaction narrative de chaque section.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ContextField label="Changement d'ordonnateur" value={contexte.changementOrdonnateur}
                  onChange={v => setContexte(p => ({ ...p, changementOrdonnateur: v }))}
                  placeholder="Ex: Mme Dupont a succédé à M. Martin le 01/09/2025…" />
                <ContextField label="Changement de gestionnaire" value={contexte.changementGestionnaire}
                  onChange={v => setContexte(p => ({ ...p, changementGestionnaire: v }))}
                  placeholder="Ex: Nouveau gestionnaire depuis la rentrée 2025…" />
                <ContextField label="Mouvements agence comptable" value={contexte.mouvementsAgence}
                  onChange={v => setContexte(p => ({ ...p, mouvementsAgence: v }))}
                  placeholder="Ex: Mutation d'un fondé de pouvoir…" />
                <ContextField label="Événements marquants" value={contexte.evenementsMarquants}
                  onChange={v => setContexte(p => ({ ...p, evenementsMarquants: v }))}
                  placeholder="Ex: Fusion de sections, ouverture BTS…" />
                <ContextField label="Travaux importants" value={contexte.travauxImportants}
                  onChange={v => setContexte(p => ({ ...p, travauxImportants: v }))}
                  placeholder="Ex: Rénovation du self-service…" />
                <ContextField label="Réformes pédagogiques" value={contexte.reformesPedagogiques}
                  onChange={v => setContexte(p => ({ ...p, reformesPedagogiques: v }))}
                  placeholder="Ex: Réforme du lycée professionnel…" />
                <ContextField label="Difficultés logistiques" value={contexte.difficultes}
                  onChange={v => setContexte(p => ({ ...p, difficultes: v }))} className="lg:col-span-2"
                  placeholder="Ex: Problème de chauffage, dégât des eaux…" />
              </div>
            </CardContent>
          </Card>

          {/* Section narrative: Présentation */}
          <NarrativeSection sectionId="presentation" text={texts.presentation}
            onTextChange={v => setTexts(p => ({ ...p, presentation: v }))}
            onGenerate={() => genererSection('presentation')} loading={loadingSection === 'presentation'} />

          {/* Indicateurs hors-comptables intégrés */}
          {indicators && indicators.effectif_eleves > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="py-3 bg-muted/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Données de contexte hors-comptables
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <ContextBadge label="Élèves" value={indicators.effectif_eleves} />
                  <ContextBadge label="Demi-pensionnaires" value={indicators.effectif_dp} />
                  <ContextBadge label="Internes" value={indicators.effectif_internes} />
                  <ContextBadge label="Boursiers" value={indicators.effectif_boursiers}
                    suffix={indicators.effectif_eleves > 0 ? ` (${((indicators.effectif_boursiers / indicators.effectif_eleves) * 100).toFixed(1)}%)` : ''} />
                  {indicators.nb_repas_servis > 0 && <ContextBadge label="Repas/an" value={indicators.nb_repas_servis?.toLocaleString('fr-FR')} />}
                  {indicators.cout_denrees_repas > 0 && <ContextBadge label="Coût denrées/repas" value={`${indicators.cout_denrees_repas?.toFixed(2)} €`} />}
                  {indicators.surface_batiments > 0 && <ContextBadge label="Surface bâtiments" value={`${indicators.surface_batiments?.toLocaleString('fr-FR')} m²`} />}
                  {indicators.etp_ressources_propres > 0 && <ContextBadge label="ETP ress. propres" value={indicators.etp_ressources_propres} />}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB 2: ÉQUILIBRE FINANCIER ═══ */}
        <TabsContent value="equilibre" className="space-y-6 mt-0">
          {/* Callouts financiers */}
          {callouts.filter(c => c.text.includes('fonds') || c.text.includes('exécution')).map((c, i) => (
            <Callout key={i} type={c.type} text={c.text} />
          ))}

          {/* Taux d'exécution visuel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Taux d'exécution budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-4">
                <GaugeSimple label="Dépenses" value={Math.round((R.tauxExecCharges || 0) * 100)} color={COLORS.primary} />
                <GaugeSimple label="Recettes" value={Math.round((R.tauxExecProduits || 0) * 100)} color={COLORS.success} />
              </CardContent>
            </Card>

            {/* Donut : Répartition des charges */}
            {chargesData.length > 0 && (
              <Card className="lg:col-span-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <PieChartIcon className="h-3 w-3" /> Répartition des charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={chargesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85}
                        label={({ name, percent }) => `${name.substring(0, 12)}… ${(percent * 100).toFixed(0)}%`}
                        labelLine={true} fontSize={9}>
                        {chargesData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Donut : Dépendance subventions vs RP */}
            {dependanceData.length > 0 && (
              <Card className="lg:col-span-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <PieChartIcon className="h-3 w-3" /> Subventions vs Ressources propres
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dependanceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true} fontSize={9}>
                        {dependanceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bar chart : exécution par service */}
          {depensesBarData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Exécution des dépenses par service — Prévisions vs Réalisé
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={depensesBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <Legend />
                    <Bar dataKey="previsions" fill="hsl(215, 70%, 75%)" name="Prévisions" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="charges" fill={COLORS.primary} name="Réalisé" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Infographie : passage résultat → réserves */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" /> Infographie — Du résultat comptable aux réserves
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {reservesFlowData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`rounded-xl p-4 text-center min-w-[140px] ${
                      i === 2 ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/30 border border-border'
                    }`}>
                      <span className="text-2xl block mb-1">{item.icon}</span>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{item.label}</div>
                      <div className={`font-black font-mono text-lg mt-1 ${item.value >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatEur(item.value)}
                      </div>
                    </div>
                    {i < reservesFlowData.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section narrative: Exécution */}
          <NarrativeSection sectionId="execution" text={texts.execution}
            onTextChange={v => setTexts(p => ({ ...p, execution: v }))}
            onGenerate={() => genererSection('execution')} loading={loadingSection === 'execution'} />
        </TabsContent>

        {/* ═══ TAB 3: PATRIMOINE & TIERS ═══ */}
        <TabsContent value="patrimoine" className="space-y-6 mt-0">
          {/* KPI patrimoine */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="FRNG" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color={R.bfr <= 0 ? 'green' : 'amber'} icon="⚖️" sub="Besoin en fonds de roulement" isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} jours d'autonomie`} isText />
            <KPICard label="CAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
          </div>

          {/* Courbes 5 ans : FRNG et Trésorerie */}
          {trendData.length > 1 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Évolution sur 5 ans — FRNG, BFR, Trésorerie, CAF
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gradFDR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradTreso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="exercice" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="FDR" stroke={COLORS.primary} fill="url(#gradFDR)" strokeWidth={2.5} dot={{ r: 4 }} name="FRNG" />
                    <Area type="monotone" dataKey="Trésorerie" stroke={COLORS.success} fill="url(#gradTreso)" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="BFR" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="CAF" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Callout patrimoine */}
          {callouts.filter(c => c.text.includes('fonds') || c.text.includes('FRNG')).map((c, i) => (
            <Callout key={i} type={c.type} text={c.text} />
          ))}

          {/* Immobilisations & Amortissements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Immobilisations</div>
                <div className="space-y-2">
                  <PatrimoineRow label="Immobilisations brutes" value={R.totalImmo} />
                  <PatrimoineRow label="Amortissements cumulés" value={-R.totalAmortissements} />
                  <div className="border-t border-border pt-2">
                    <PatrimoineRow label="Valeur nette comptable" value={R.totalImmo - R.totalAmortissements} highlight />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Structure financière</div>
                <div className="space-y-2">
                  <PatrimoineRow label="Ressources stables (haut bilan)" value={R.fdrHaut} />
                  <PatrimoineRow label="Emplois stables (immobilisations)" value={R.fdrBas} />
                  <div className="border-t border-border pt-2">
                    <PatrimoineRow label="FRNG = Ressources − Emplois" value={R.fdrComptable} highlight />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section narrative: Patrimoine */}
          <NarrativeSection sectionId="patrimoine" text={texts.patrimoine}
            onTextChange={v => setTexts(p => ({ ...p, patrimoine: v }))}
            onGenerate={() => genererSection('patrimoine')} loading={loadingSection === 'patrimoine'} />
        </TabsContent>

        {/* ═══ TAB 4: SRH & VIABILISATION ═══ */}
        <TabsContent value="viabilisation" className="space-y-6 mt-0">
          {callouts.filter(c => c.text.includes('énergie') || c.text.includes('électrique')).map((c, i) => (
            <Callout key={i} type={c.type} text={c.text} />
          ))}

          {indicators && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {indicators.nb_repas_servis > 0 && (
                <KPICard label="Repas servis" value={indicators.nb_repas_servis?.toLocaleString('fr-FR')} color="blue" icon="🍽️" sub="Élèves & commensaux" isText />
              )}
              {indicators.cout_denrees_repas > 0 && (
                <KPICard label="Coût denrées" value={`${indicators.cout_denrees_repas?.toFixed(2)} €`} color="amber" icon="🥗" sub="Par repas" isText />
              )}
              {indicators.surface_batiments > 0 && (
                <KPICard label="Surface" value={`${indicators.surface_batiments?.toLocaleString('fr-FR')} m²`} color="purple" icon="🏗️" sub="Bâtiments" isText />
              )}
              {indicators.effectif_personnel > 0 && (
                <KPICard label="Personnel" value={indicators.effectif_personnel} color="green" icon="👥" sub="Effectif total" isText />
              )}
            </div>
          )}

          {/* Viabilisation bar chart if fluid data exists */}
          {indicators && indicators.surface_batiments > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ratios de viabilisation (€/m²)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {indicators.conso_electricite > 0 && (
                    <ViabilisationGauge label="Électricité" value={indicators.conso_electricite / indicators.surface_batiments}
                      unit="€/m²" max={80} color={COLORS.warning} />
                  )}
                  {indicators.conso_gaz > 0 && (
                    <ViabilisationGauge label="Gaz" value={indicators.conso_gaz / indicators.surface_batiments}
                      unit="€/m²" max={60} color={COLORS.danger} />
                  )}
                  {indicators.conso_eau > 0 && (
                    <ViabilisationGauge label="Eau" value={indicators.conso_eau / indicators.surface_batiments}
                      unit="€/m²" max={20} color={COLORS.primary} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section narrative: SRH */}
          <NarrativeSection sectionId="srh" text={texts.srh}
            onTextChange={v => setTexts(p => ({ ...p, srh: v }))}
            onGenerate={() => genererSection('srh')} loading={loadingSection === 'srh'} />
        </TabsContent>

        {/* ═══ TAB 5: PERSPECTIVES ═══ */}
        <TabsContent value="perspectives" className="space-y-6 mt-0">
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <Sparkles className="h-8 w-8 text-warning shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm mb-1">Synthèse prospective</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cette section conclut l'annexe par une analyse des perspectives pour les prochains exercices.
                    L'IA intègre les tendances pluriannuelles et le contexte de l'établissement pour formuler
                    des recommandations argumentées.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <NarrativeSection sectionId="perspectives" text={texts.perspectives}
            onTextChange={v => setTexts(p => ({ ...p, perspectives: v }))}
            onGenerate={() => genererSection('perspectives')} loading={loadingSection === 'perspectives'} />
        </TabsContent>
      </Tabs>

      {/* ═══ SIGNATURES (print) ═══ */}
      <Card className="print:shadow-none print:border-0 mt-6">
        <CardContent className="p-8">
          <div className="flex justify-between text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground text-sm">L'ordonnateur</strong>
              <div className="mt-12">{etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-center">
              <p>Fait à {etab.commune || '………………'},</p>
              <p>le ……… / ……… / {etab.exercice + 1}</p>
            </div>
            <div className="text-right">
              <strong className="block text-foreground text-sm">L'agent comptable</strong>
              <div className="mt-12">{etab.agentComptable || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════

function Callout({ type, text }: { type: 'info' | 'warning' | 'success'; text: string }) {
  const styles = {
    info: 'bg-primary/5 border-primary/30 text-primary',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  };
  const icons = {
    info: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
  };

  return (
    <div className={`rounded-xl border-2 p-4 flex items-start gap-3 ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm leading-relaxed font-medium">{text}</p>
    </div>
  );
}

function NarrativeSection({ sectionId, text, onTextChange, onGenerate, loading }: {
  sectionId: string; text: string; onTextChange: (v: string) => void;
  onGenerate: () => void; loading: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const meta = SECTION_META[sectionId];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 flex-row items-center gap-2 bg-muted/20">
        <div className="flex items-center gap-2 flex-1">
          {meta?.icon}
          <CardTitle className="text-sm font-black uppercase tracking-wide">{meta?.label}</CardTitle>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onGenerate} disabled={loading} className="text-xs h-7 gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
            {loading ? 'IA…' : 'Générer'}
          </Button>
          {text && (
            <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)} className="text-xs h-7">
              {editMode ? 'Aperçu' : 'Modifier'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {text ? (
          editMode ? (
            <Textarea value={text} onChange={e => onTextChange(e.target.value)}
              className="text-sm min-h-[120px] bg-muted/10 leading-relaxed" />
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="bg-muted/10 rounded-lg p-6 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Cliquez sur <strong>Générer</strong> pour que l'IA rédige cette section à partir des données du moteur M9-6.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GaugeSimple({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center w-full">
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${value * 2.64} ${264 - value * 2.64}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black font-mono">{value}%</span>
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ViabilisationGauge({ label, value, unit, max, color }: {
  label: string; value: number; unit: string; max: number; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="bg-muted/20 rounded-xl p-4 text-center">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-black font-mono" style={{ color }}>{value.toFixed(1)}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function PatrimoineRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs ${highlight ? 'font-bold text-sm' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ml-2 ${value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
        {formatEur(value)}
      </span>
    </div>
  );
}

function ContextField({ label, value, onChange, placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 text-sm" />
    </div>
  );
}

function ContextBadge({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2.5">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className="font-bold font-mono">{value}{suffix}</div>
    </div>
  );
}
