// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Annexe Comptable « Mode Preuve & Analyse Juridique »
// Destination : Rectorat (Dém'act) + Juge des comptes (Infocentre)
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
  TrendingUp, AlertTriangle, Activity, Landmark, Scale, BookOpen,
  ArrowRight, Info, Lightbulb, BarChart3, CheckCircle2, Search,
  Shield, Eye, Table2, ArrowDown, ArrowUp, Minus, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart,
  ReferenceLine
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
interface AnnexeTexts {
  presentation: string; execution: string; patrimoine: string;
  srh: string; perspectives: string;
  restesARecouvrer: string; reserves: string; tresorerie: string;
}

interface ContexteQualif {
  changementOrdonnateur: string; changementGestionnaire: string;
  mouvementsAgence: string; evenementsMarquants: string;
  travauxImportants: string; reformesPedagogiques: string; difficultes: string;
}

// ── Onglets « Preuve & Contrôle » ────────────────────────────
const ANNEXE_TABS = [
  { id: 'activite', label: 'Activité & Contexte', icon: <Activity className="h-4 w-4" /> },
  { id: 'equilibre', label: 'Équilibre Financier', icon: <Scale className="h-4 w-4" /> },
  { id: 'patrimoine', label: 'Patrimoine & Tiers', icon: <Landmark className="h-4 w-4" /> },
  { id: 'etats', label: 'États Réglementaires', icon: <Table2 className="h-4 w-4" /> },
  { id: 'pisteAudit', label: 'Piste d\'Audit', icon: <Search className="h-4 w-4" /> },
  { id: 'perspectives', label: 'Perspectives', icon: <Sparkles className="h-4 w-4" /> },
] as const;

const ALL_SECTIONS = ['presentation', 'execution', 'patrimoine', 'srh', 'perspectives', 'restesARecouvrer', 'reserves', 'tresorerie'] as const;

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  presentation: { label: 'I. Présentation générale', icon: <Building className="h-4 w-4" /> },
  execution: { label: 'II. Exécution budgétaire', icon: <TrendingUp className="h-4 w-4" /> },
  patrimoine: { label: 'III. Situation patrimoniale', icon: <FileText className="h-4 w-4" /> },
  srh: { label: 'IV. SRH & Viabilisation', icon: <Users className="h-4 w-4" /> },
  perspectives: { label: 'V. Perspectives', icon: <Sparkles className="h-4 w-4" /> },
  restesARecouvrer: { label: 'Note : Restes à recouvrer (Cl. 4)', icon: <Search className="h-4 w-4" /> },
  reserves: { label: 'Note : Utilisation des réserves', icon: <Landmark className="h-4 w-4" /> },
  tresorerie: { label: 'Note : Trésorerie & Unité de caisse', icon: <Shield className="h-4 w-4" /> },
};

const COLORS = {
  primary: 'hsl(215, 70%, 45%)', success: 'hsl(160, 45%, 45%)',
  warning: 'hsl(38, 92%, 50%)', purple: 'hsl(280, 50%, 50%)',
  danger: 'hsl(0, 70%, 50%)', muted: 'hsl(215, 15%, 70%)',
  teal: 'hsl(185, 60%, 40%)', indigo: 'hsl(240, 50%, 55%)',
};

const DONUT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.danger, COLORS.teal, COLORS.indigo, COLORS.muted];

export function AnnexeComptableSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const budgets = useCofiepleStore(s => s.budgets);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const R = resultats[activeBudget];

  const [activeAnnexeTab, setActiveAnnexeTab] = useState('activite');
  const [texts, setTexts] = useState<AnnexeTexts>({
    presentation: '', execution: '', patrimoine: '', srh: '', perspectives: '',
    restesARecouvrer: '', reserves: '', tresorerie: '',
  });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [contexte, setContexte] = useState<ContexteQualif>({
    changementOrdonnateur: '', changementGestionnaire: '', mouvementsAgence: '',
    evenementsMarquants: '', travauxImportants: '', reformesPedagogiques: '', difficultes: '',
  });
  const [indicators, setIndicators] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedEtab, setSelectedEtab] = useState<string>('principal');
  const [drilldownCompte, setDrilldownCompte] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'isolé' | 'consolidé'>('isolé');

  const completedSections = useMemo(() => {
    return Object.values(texts).filter(t => t.length > 0).length;
  }, [texts]);
  const progressPct = Math.round((completedSections / ALL_SECTIONS.length) * 100);

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

  // ── Balance drill-down ─────────────────────────────────────
  const balanceData = useMemo(() => balance[activeBudget] || [], [balance, activeBudget]);

  const getComptesForPrefix = useCallback((prefix: string) => {
    return balanceData.filter((b: any) => b.compte?.startsWith(prefix)).map((b: any) => ({
      compte: b.compte, intitule: b.intituleReduit || b.intitule || '',
      debit: b.dbt || 0, credit: b.crd || 0,
      soldeDebit: b.solDbt || 0, soldeCredit: b.solCrd || 0,
      soldeNet: (b.solDbt || 0) - (b.solCrd || 0),
    }));
  }, [balanceData]);

  // ── Regulatory tables from balance ─────────────────────────
  const amortissementsTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.startsWith('28'))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        antDbt: b.antDbt || 0, antCrd: b.antCrd || 0,
        dbt: b.dbt || 0, crd: b.crd || 0,
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        isAtypical: (b.solDbt || 0) > 0, // Amortissements should be crediteurs
      }));
  }, [balanceData]);

  const provisionsTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.startsWith('14') || b.compte?.startsWith('15') || b.compte?.startsWith('39') || b.compte?.startsWith('49'))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        antCrd: b.antCrd || 0, dotation: b.crd || 0, reprise: b.dbt || 0,
        solCrd: b.solCrd || 0,
        isAtypical: (b.solDbt || 0) > (b.solCrd || 0),
      }));
  }, [balanceData]);

  const creancesTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.charAt(0) === '4' && (b.solDbt || 0) > 0)
      .sort((a: any, b: any) => (b.solDbt || 0) - (a.solDbt || 0))
      .slice(0, 20)
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        antDbt: b.antDbt || 0,
        isAncien: (b.antDbt || 0) > 0 && (b.dbt || 0) === 0, // créance ancienne non mouvementée
        isAtypical: b.compte?.startsWith('416'), // Créances douteuses
      }));
  }, [balanceData]);

  const dettesTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.charAt(0) === '4' && (b.solCrd || 0) > 0)
      .sort((a: any, b: any) => (b.solCrd || 0) - (a.solCrd || 0))
      .slice(0, 20)
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        isAtypical: (b.antCrd || 0) > 0 && (b.crd || 0) === 0,
      }));
  }, [balanceData]);

  async function genererSection(sectionId: string) {
    if (!R) return;
    setLoadingSection(sectionId);
    try {
      const balanceSummary = {
        cl4Debiteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solDbt || 0) > 0)
          .reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
        cl4Crediteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solCrd || 0) > 0)
          .reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
        cl5Solde: balanceData.filter((b: any) => b.compte?.charAt(0) === '5')
          .reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0),
        creancesDouteuses416: balanceData.filter((b: any) => b.compte?.startsWith('416'))
          .reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
        provisions: balanceData.filter((b: any) => b.compte?.startsWith('49'))
          .reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
      };

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
            totalImmo: R.totalImmo, totalAmortissements: R.totalAmortissements,
          },
          balanceSummary,
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
    for (const s of ALL_SECTIONS) {
      await genererSection(s);
    }
  }

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer l'annexe comptable réglementaire (M9-6 § V.3)." />;

  // ── Waterfall chart data (N-1 → N) ────────────────────────
  const prevYear = history.length >= 2 ? history[1] : null;
  const waterfallData = prevYear ? buildWaterfallData(prevYear, R) : [];

  const waterfallTresoData = prevYear ? [
    { name: `Tréso N-1`, value: prevYear.tresorerie, cumul: prevYear.tresorerie, type: 'base' },
    { name: 'Δ FDR', value: R.fdrComptable - (prevYear.fdr || 0), cumul: prevYear.tresorerie + (R.fdrComptable - (prevYear.fdr || 0)), type: (R.fdrComptable - (prevYear.fdr || 0)) >= 0 ? 'positive' : 'negative' },
    { name: 'Δ BFR', value: -((R.bfr || 0) - (prevYear.bfr || 0)), cumul: prevYear.tresorerie + (R.fdrComptable - (prevYear.fdr || 0)) - ((R.bfr || 0) - (prevYear.bfr || 0)), type: -((R.bfr || 0) - (prevYear.bfr || 0)) >= 0 ? 'positive' : 'negative' },
    { name: `Tréso N`, value: R.tresorerieNette, cumul: R.tresorerieNette, type: 'total' },
  ] : [];

  // Computed chart data
  const trendData = history.length > 0
    ? [...history].reverse().map(h => ({
        exercice: h.exercice, FDR: h.fdr, BFR: h.bfr, Trésorerie: h.tresorerie, CAF: h.caf,
      }))
    : [];

  const chargesData = Object.entries(R.parService).map(([svc, d]: [string, any], i) => ({
    name: d.libelle || svc, value: d.chargesReel || 0, fill: DONUT_COLORS[i % DONUT_COLORS.length],
  })).filter(d => d.value > 0);

  const hasMultipleBudgets = budgets.length > 1;

  // ── Alert flags for atypical items ─────────────────────────
  const alerts: { level: 'bloq' | 'warn' | 'info'; text: string; ref: string }[] = [];
  if (R.joursAutonomie < 30) alerts.push({ level: 'bloq', text: `Autonomie financière : ${Math.round(R.joursAutonomie)} jours (< 30 j)`, ref: 'M9-6 § IV.2' });
  if (R.fdrComptable < 0) alerts.push({ level: 'bloq', text: `FRNG négatif : ${formatEur(R.fdrComptable)}`, ref: 'M9-6 § III.1' });
  if (R.tauxExecCharges > 0 && R.tauxExecCharges < 0.80) alerts.push({ level: 'warn', text: `Taux exécution charges : ${(R.tauxExecCharges * 100).toFixed(1)}% (< 80%)`, ref: 'RGCP Art. 24' });
  const creancesDouteuses = balanceData.filter((b: any) => b.compte?.startsWith('416')).reduce((s: number, b: any) => s + (b.solDbt || 0), 0);
  if (creancesDouteuses > 0) alerts.push({ level: 'warn', text: `Créances douteuses (416) : ${formatEur(creancesDouteuses)}`, ref: 'M9-6 § V.4' });

  return (
    <div className="space-y-4">
      {/* ═══ HEADER — Mode Audit ═══ */}
      <div className="rounded-xl border-2 border-border bg-card p-5 print:border-0">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-primary/50 text-primary">
                Dém'act / Infocentre
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-muted-foreground/30">
                M9-6 2026
              </Badge>
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Annexe au Compte Financier
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {etab.nom || 'Établissement'} — RNE {etab.uai} — Exercice {etab.exercice}
            </p>
            <p className="text-xs text-muted-foreground">
              Instruction M9-6 du 12/02/2026 — Décret n°2012-1246 (RGCP)
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <Button onClick={genererTout} disabled={!!loadingSection} className="gap-2 font-bold">
              {loadingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Générer toutes les notes (IA)
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2 text-xs">
              <Printer className="h-3 w-3" /> Export PDF (Dém'act)
            </Button>
          </div>
        </div>

        {/* Progress + Alerts summary */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold shrink-0">Complétude</span>
          <Progress value={progressPct} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-mono shrink-0">{completedSections}/{ALL_SECTIONS.length}</span>
          {completedSections === ALL_SECTIONS.length && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        {alerts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((a, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${
                a.level === 'bloq' ? 'border-destructive/50 text-destructive bg-destructive/5' :
                a.level === 'warn' ? 'border-warning/50 text-warning bg-warning/5' :
                'border-primary/50 text-primary bg-primary/5'
              }`}>
                {a.level === 'bloq' ? '🚫' : '⚠️'} {a.text} — {a.ref}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Multi-establishment + view mode */}
      {hasMultipleBudgets && (
        <Card className="border-primary/20">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold">Vision :</span>
            <Button variant={viewMode === 'isolé' ? 'default' : 'outline'} size="sm"
              onClick={() => setViewMode('isolé')} className="text-xs">
              Isolée (Dém'act)
            </Button>
            <Button variant={viewMode === 'consolidé' ? 'default' : 'outline'} size="sm"
              onClick={() => setViewMode('consolidé')} className="text-xs">
              Consolidée (AC)
            </Button>
            <div className="border-l border-border pl-3 ml-2 flex gap-2">
              {budgets.map(b => (
                <Button key={b.type} variant={selectedEtab === b.type ? 'secondary' : 'ghost'} size="sm"
                  onClick={() => setSelectedEtab(b.type)} className="text-xs">
                  {b.libelle}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ ONGLETS ═══ */}
      <Tabs value={activeAnnexeTab} onValueChange={setActiveAnnexeTab} className="space-y-4">
        <TabsList className="w-full h-auto flex-wrap bg-muted/30 p-1 rounded-lg gap-1">
          {ANNEXE_TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="flex-1 min-w-[120px] gap-1.5 text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ TAB 1: ACTIVITÉ & CONTEXTE ═══ */}
        <TabsContent value="activite" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Résultat" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📊" sub="Comptable" isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Cpte 1068" isText />
            <KPICard label="Autonomie" value={`${Math.round(R.joursAutonomie)} j`} color={R.joursAutonomie >= 30 ? 'green' : 'red'} icon="⏱️" sub={R.joursAutonomie >= 30 ? '≥ 30 j' : '< 30 j ⚠️'} isText />
            <KPICard label="CAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
          </div>

          {/* Contexte qualitatif */}
          <Card>
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Contexte & Justifications de ruptures
                <Badge variant="outline" className="ml-auto text-xs">Saisie libre</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Ces éléments justifient les ruptures de séries statistiques auprès du contrôleur rectoral et du juge.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ContextField label="Changement d'ordonnateur" value={contexte.changementOrdonnateur}
                  onChange={v => setContexte(p => ({ ...p, changementOrdonnateur: v }))} placeholder="Date et identité…" />
                <ContextField label="Changement de gestionnaire" value={contexte.changementGestionnaire}
                  onChange={v => setContexte(p => ({ ...p, changementGestionnaire: v }))} placeholder="Date et identité…" />
                <ContextField label="Mouvements agence comptable" value={contexte.mouvementsAgence}
                  onChange={v => setContexte(p => ({ ...p, mouvementsAgence: v }))} placeholder="Mutations, arrivées…" />
                <ContextField label="Événements marquants" value={contexte.evenementsMarquants}
                  onChange={v => setContexte(p => ({ ...p, evenementsMarquants: v }))} placeholder="Fusion, ouverture section…" />
                <ContextField label="Travaux importants" value={contexte.travauxImportants}
                  onChange={v => setContexte(p => ({ ...p, travauxImportants: v }))} placeholder="Nature, montant, impact…" />
                <ContextField label="Réformes pédagogiques" value={contexte.reformesPedagogiques}
                  onChange={v => setContexte(p => ({ ...p, reformesPedagogiques: v }))} placeholder="Impact budgétaire…" />
                <ContextField label="Difficultés" value={contexte.difficultes}
                  onChange={v => setContexte(p => ({ ...p, difficultes: v }))} className="lg:col-span-2" placeholder="Logistiques, sinistres…" />
              </div>
            </CardContent>
          </Card>

          <NarrativeSection sectionId="presentation" text={texts.presentation}
            onTextChange={v => setTexts(p => ({ ...p, presentation: v }))}
            onGenerate={() => genererSection('presentation')} loading={loadingSection === 'presentation'} />

          {indicators && indicators.effectif_eleves > 0 && (
            <Card>
              <CardHeader className="py-3 bg-muted/10">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Données hors-comptables
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ContextBadge label="Élèves" value={indicators.effectif_eleves} />
                  <ContextBadge label="DP" value={indicators.effectif_dp} />
                  <ContextBadge label="Internes" value={indicators.effectif_internes} />
                  <ContextBadge label="Boursiers" value={indicators.effectif_boursiers}
                    suffix={indicators.effectif_eleves > 0 ? ` (${((indicators.effectif_boursiers / indicators.effectif_eleves) * 100).toFixed(1)}%)` : ''} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB 2: ÉQUILIBRE FINANCIER ═══ */}
        <TabsContent value="equilibre" className="space-y-5 mt-0">
          {/* Waterfall : Variation FRNG N-1 → N */}
          {waterfallData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Graphique en cascade — Variation du FRNG (N-1 → N)
                  <Badge variant="outline" className="ml-auto text-[10px]">Waterfall Chart</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                    <Bar dataKey="invisible" stackId="stack" fill="transparent" />
                    <Bar dataKey="display" stackId="stack" radius={[3, 3, 0, 0]}>
                      {waterfallData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.type === 'total' || entry.type === 'base' ? COLORS.primary : entry.value >= 0 ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Waterfall : Variation Trésorerie */}
          {waterfallTresoData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Cascade — Variation de la Trésorerie (N-1 → N)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={waterfallTresoData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {waterfallTresoData.map((entry, i) => (
                        <Cell key={i} fill={entry.type === 'base' || entry.type === 'total' ? COLORS.primary : entry.type === 'positive' ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Taux d'exécution + charges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Taux d'exécution
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-around p-4">
                <GaugeSimple label="Dépenses" value={Math.round((R.tauxExecCharges || 0) * 100)} color={COLORS.primary} />
                <GaugeSimple label="Recettes" value={Math.round((R.tauxExecProduits || 0) * 100)} color={COLORS.success} />
              </CardContent>
            </Card>
            {chargesData.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Structure des charges par service
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chargesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={45} outerRadius={80} fontSize={9}
                        label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`}>
                        {chargesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          <NarrativeSection sectionId="execution" text={texts.execution}
            onTextChange={v => setTexts(p => ({ ...p, execution: v }))}
            onGenerate={() => genererSection('execution')} loading={loadingSection === 'execution'} />
        </TabsContent>

        {/* ═══ TAB 3: PATRIMOINE & TIERS ═══ */}
        <TabsContent value="patrimoine" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="FRNG" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color={R.bfr <= 0 ? 'green' : 'amber'} icon="⚖️" sub="Besoin fonds roulement" isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} j`} isText />
            <KPICard label="Immo nettes" value={formatEur(R.totalImmo - R.totalAmortissements)} color="blue" icon="🏗️" sub="Valeur nette" isText />
          </div>

          {/* 5-year trends */}
          {trendData.length > 1 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Évolution pluriannuelle — FRNG, BFR, Trésorerie, CAF
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gFDR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="exercice" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="FDR" stroke={COLORS.primary} fill="url(#gFDR)" strokeWidth={2.5} dot={{ r: 4 }} name="FRNG" />
                    <Line type="monotone" dataKey="Trésorerie" stroke={COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="BFR" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="CAF" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI notes on receivables, reserves, treasury */}
          <NarrativeSection sectionId="restesARecouvrer" text={texts.restesARecouvrer}
            onTextChange={v => setTexts(p => ({ ...p, restesARecouvrer: v }))}
            onGenerate={() => genererSection('restesARecouvrer')} loading={loadingSection === 'restesARecouvrer'} />
          <NarrativeSection sectionId="reserves" text={texts.reserves}
            onTextChange={v => setTexts(p => ({ ...p, reserves: v }))}
            onGenerate={() => genererSection('reserves')} loading={loadingSection === 'reserves'} />
          <NarrativeSection sectionId="tresorerie" text={texts.tresorerie}
            onTextChange={v => setTexts(p => ({ ...p, tresorerie: v }))}
            onGenerate={() => genererSection('tresorerie')} loading={loadingSection === 'tresorerie'} />

          <NarrativeSection sectionId="patrimoine" text={texts.patrimoine}
            onTextChange={v => setTexts(p => ({ ...p, patrimoine: v }))}
            onGenerate={() => genererSection('patrimoine')} loading={loadingSection === 'patrimoine'} />
        </TabsContent>

        {/* ═══ TAB 4: ÉTATS RÉGLEMENTAIRES ═══ */}
        <TabsContent value="etats" className="space-y-5 mt-0">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Les soldes atypiques sont surlignés. Cliquez sur un compte pour voir les écritures sources.
          </div>

          {/* Tableau des amortissements */}
          <RegulatoryTable
            title="État des amortissements (Comptes 28*)"
            refM96="M9-6 § V.3.a"
            columns={['Compte', 'Intitulé', 'Solde ant.', 'Dotations', 'Reprises', 'Solde final']}
            rows={amortissementsTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.antCrd), formatEur(r.crd), formatEur(r.dbt), formatEur(r.solCrd)],
              isAtypical: r.isAtypical,
              compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte}
            totalLabel="Total amortissements"
            totalValue={formatEur(R.totalAmortissements)}
          />

          {/* État des provisions */}
          <RegulatoryTable
            title="État des provisions (Comptes 14*, 15*, 39*, 49*)"
            refM96="M9-6 § V.3.b"
            columns={['Compte', 'Intitulé', 'Solde ant.', 'Dotation', 'Reprise', 'Solde final']}
            rows={provisionsTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.antCrd), formatEur(r.dotation), formatEur(r.reprise), formatEur(r.solCrd)],
              isAtypical: r.isAtypical,
              compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte}
          />

          {/* État des créances (Cl. 4 débitrices) */}
          <RegulatoryTable
            title="État des créances (Classe 4 — soldes débiteurs)"
            refM96="M9-6 § V.3.c"
            columns={['Compte', 'Intitulé', 'Solde Dbt', 'Ancien ?', 'Observation']}
            rows={creancesTable.map(r => ({
              cells: [
                r.compte, r.intitule, formatEur(r.solDbt),
                r.isAncien ? '⚠️ Ancien' : '—',
                r.isAtypical ? '🔴 Douteux (416)' : r.isAncien ? 'Non mouvementé' : '',
              ],
              isAtypical: r.isAtypical || r.isAncien,
              compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte}
          />

          {/* État des dettes (Cl. 4 créditrices) */}
          <RegulatoryTable
            title="État des dettes (Classe 4 — soldes créditeurs)"
            refM96="M9-6 § V.3.d"
            columns={['Compte', 'Intitulé', 'Solde Crd', 'Observation']}
            rows={dettesTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.solCrd), r.isAtypical ? '⚠️ Non mouvementé' : ''],
              isAtypical: r.isAtypical,
              compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte}
          />
        </TabsContent>

        {/* ═══ TAB 5: PISTE D'AUDIT ═══ */}
        <TabsContent value="pisteAudit" className="space-y-5 mt-0">
          <Card>
            <CardHeader className="py-3 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" />
                Drill-down — Écritures comptables sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Label className="text-xs shrink-0">Compte :</Label>
                <Input
                  value={drilldownCompte || ''}
                  onChange={e => setDrilldownCompte(e.target.value || null)}
                  placeholder="Saisissez un n° de compte (ex: 411, 512, 416…)"
                  className="max-w-xs text-sm font-mono"
                />
                {drilldownCompte && (
                  <Button variant="ghost" size="sm" onClick={() => setDrilldownCompte(null)} className="text-xs">
                    Effacer
                  </Button>
                )}
              </div>

              {drilldownCompte && (
                <DrilldownTable comptes={getComptesForPrefix(drilldownCompte)} prefix={drilldownCompte} />
              )}

              {!drilldownCompte && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Saisissez un préfixe de compte ou cliquez sur un compte dans les États Réglementaires.</p>
                  <p className="text-xs mt-1">Raccourcis : 411 (familles), 416 (douteux), 512 (banque), 531 (caisse)</p>
                </div>
              )}
            </CardContent>
          </Card>

          <NarrativeSection sectionId="srh" text={texts.srh}
            onTextChange={v => setTexts(p => ({ ...p, srh: v }))}
            onGenerate={() => genererSection('srh')} loading={loadingSection === 'srh'} />
        </TabsContent>

        {/* ═══ TAB 6: PERSPECTIVES ═══ */}
        <TabsContent value="perspectives" className="space-y-5 mt-0">
          <NarrativeSection sectionId="perspectives" text={texts.perspectives}
            onTextChange={v => setTexts(p => ({ ...p, perspectives: v }))}
            onGenerate={() => genererSection('perspectives')} loading={loadingSection === 'perspectives'} />
        </TabsContent>
      </Tabs>

      {/* ═══ SIGNATURES ═══ */}
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
// WATERFALL DATA BUILDER
// ═══════════════════════════════════════════════════════════════
function buildWaterfallData(prevYear: any, R: any) {
  const fdrN1 = prevYear.fdr || 0;
  const fdrN = R.fdrComptable || 0;
  const items = [
    { name: `FRNG N-1`, value: fdrN1, type: 'base' },
    { name: 'CAF/IAF', value: R.cafBudgetaire || 0, type: (R.cafBudgetaire || 0) >= 0 ? 'positive' : 'negative' },
    { name: 'Investissements', value: -(R.totalImmo || 0) * 0.1, type: 'negative' }, // approximation
    { name: 'Financement reçu', value: Math.max(0, fdrN - fdrN1 - (R.cafBudgetaire || 0) + (R.totalImmo || 0) * 0.1), type: 'positive' },
    { name: `FRNG N`, value: fdrN, type: 'total' },
  ];

  let cumul = 0;
  return items.map(item => {
    if (item.type === 'base' || item.type === 'total') {
      const result = { ...item, invisible: 0, display: item.value };
      cumul = item.value;
      return result;
    }
    const invisible = item.value >= 0 ? cumul : cumul + item.value;
    const display = Math.abs(item.value);
    cumul += item.value;
    return { ...item, invisible: Math.max(0, invisible), display };
  });
}

// ═══════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════

function NarrativeSection({ sectionId, text, onTextChange, onGenerate, loading }: {
  sectionId: string; text: string; onTextChange: (v: string) => void;
  onGenerate: () => void; loading: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const meta = SECTION_META[sectionId];

  return (
    <Card>
      <CardHeader className="py-3 flex-row items-center gap-2 bg-muted/10">
        <div className="flex items-center gap-2 flex-1">
          {meta?.icon}
          <CardTitle className="text-sm font-bold">{meta?.label}</CardTitle>
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
              className="text-sm min-h-[120px] bg-muted/5 leading-relaxed" />
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="bg-muted/5 rounded-lg p-6 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Cliquez sur <strong>Générer</strong> pour que l'IA rédige cette note explicative.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegulatoryTable({ title, refM96, columns, rows, onDrilldown, totalLabel, totalValue }: {
  title: string; refM96: string;
  columns: string[];
  rows: { cells: string[]; isAtypical: boolean; compte: string }[];
  onDrilldown: (compte: string) => void;
  totalLabel?: string; totalValue?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Table2 className="h-4 w-4" />
          {title}
          <Badge variant="outline" className="ml-auto text-[10px]">{refM96}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {columns.map((c, i) => (
                  <th key={i} className="py-2 px-3 text-left font-bold text-muted-foreground uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}
                  onClick={() => onDrilldown(row.compte)}
                  className={`border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors ${
                    row.isAtypical ? 'bg-destructive/5 font-semibold' : ''
                  }`}
                  title={`Cliquer pour voir les écritures du compte ${row.compte}`}
                >
                  {row.cells.map((cell, j) => (
                    <td key={j} className={`py-2 px-3 ${j >= 2 ? 'font-mono text-right' : ''}`}>
                      {j === 0 ? (
                        <span className="flex items-center gap-1">
                          {row.isAtypical && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                          <span className="font-mono">{cell}</span>
                        </span>
                      ) : cell}
                    </td>
                  ))}
                </tr>
              ))}
              {totalLabel && (
                <tr className="bg-muted/30 font-bold border-t-2 border-border">
                  <td colSpan={columns.length - 1} className="py-2 px-3">{totalLabel}</td>
                  <td className="py-2 px-3 font-mono text-right">{totalValue}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DrilldownTable({ comptes, prefix }: { comptes: any[]; prefix: string }) {
  if (comptes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Aucune écriture trouvée pour le préfixe <span className="font-mono font-bold">{prefix}*</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="py-2 px-3 text-left font-bold">Compte</th>
            <th className="py-2 px-3 text-left font-bold">Intitulé</th>
            <th className="py-2 px-3 text-right font-bold">Débit</th>
            <th className="py-2 px-3 text-right font-bold">Crédit</th>
            <th className="py-2 px-3 text-right font-bold">Solde Dbt</th>
            <th className="py-2 px-3 text-right font-bold">Solde Crd</th>
            <th className="py-2 px-3 text-right font-bold">Solde Net</th>
          </tr>
        </thead>
        <tbody>
          {comptes.map((c, i) => (
            <tr key={i} className={`border-b border-border/50 ${Math.abs(c.soldeNet) > 0 && c.soldeNet < 0 ? '' : ''}`}>
              <td className="py-1.5 px-3 font-mono">{c.compte}</td>
              <td className="py-1.5 px-3 truncate max-w-[200px]">{c.intitule}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.debit ? formatEur(c.debit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.credit ? formatEur(c.credit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.soldeDebit ? formatEur(c.soldeDebit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.soldeCredit ? formatEur(c.soldeCredit) : '—'}</td>
              <td className={`py-1.5 px-3 text-right font-mono font-bold ${c.soldeNet >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatEur(c.soldeNet)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/20 font-bold border-t-2 border-border">
            <td colSpan={2} className="py-2 px-3">Total {prefix}*</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s, c) => s + c.debit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s, c) => s + c.credit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s, c) => s + c.soldeDebit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s, c) => s + c.soldeCredit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono font-bold">{formatEur(comptes.reduce((s, c) => s + c.soldeNet, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function GaugeSimple({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${value * 2.64} ${264 - value * 2.64}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black font-mono">{value}%</span>
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
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
    <div className="bg-muted/20 rounded-lg p-2.5 border border-border/50">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className="font-bold font-mono">{value}{suffix}</div>
    </div>
  );
}
