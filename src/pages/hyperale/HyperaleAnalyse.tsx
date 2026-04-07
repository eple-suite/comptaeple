import { useState, useMemo } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { useHyperaleSeuilsStore } from '@/store/useHyperaleSeuilsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHyperaleData } from './useHyperaleData';
import { analyser } from '@/lib/hyperaleAnalyseEngine';
import { comparerBatch, couleurToClass, type ComparateurResult } from '@/lib/hyperaleComparateur';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Landmark, ShieldCheck, Copy, Check,
  AlertTriangle, Lightbulb, Target, FileText, BookOpen, Users, Info,
  ArrowUpRight, ArrowDownRight, Minus, ChevronRight, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`;
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} %`;

/* ─── Helpers ─── */

function CopyBlock({ label, icon: Icon, text }: { label: string; icon: React.ElementType; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Texte copié !');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />{label}
        </span>
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, children, action }: { icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />{children}
      </h3>
      {action}
    </div>
  );
}

/* ─── KPI Card with Comparateur ─── */

interface KpiDef {
  label: string;
  value: number;
  days?: number;
  icon: React.ElementType;
  comp: ComparateurResult;
}

function KpiSummaryCard({ kpi }: { kpi: KpiDef }) {
  const TIcon = kpi.comp.tendance === 'hausse' ? ArrowUpRight : kpi.comp.tendance === 'baisse' ? ArrowDownRight : Minus;

  return (
    <Card className={`${couleurToClass(kpi.comp.couleur, 'border')} ${couleurToClass(kpi.comp.couleur, 'bg')} transition-colors`}>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
          <kpi.icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xl font-black text-foreground">{fmt(kpi.value)}</p>
        {kpi.days != null && <p className="text-xs text-muted-foreground">≈ {kpi.days.toFixed(1)} jours</p>}
        <div className="flex items-center gap-1.5">
          <TIcon className={`h-3.5 w-3.5 ${couleurToClass(kpi.comp.couleur, 'text')}`} />
          <span className={`text-xs font-medium ${couleurToClass(kpi.comp.couleur, 'text')}`}>
            {kpi.comp.variationPourcentage != null ? fmtPct(kpi.comp.variationPourcentage) : '—'}
          </span>
          <span className="text-xs text-muted-foreground">{kpi.comp.variationTexte}</span>
        </div>
        <Badge variant="outline" className={`text-[9px] ${couleurToClass(kpi.comp.couleur, 'text')}`}>
          {kpi.comp.niveau === 'critique' ? 'Critique' : kpi.comp.niveau === 'surveiller' ? 'À surveiller' : 'Satisfaisant'}
        </Badge>
      </CardContent>
    </Card>
  );
}

function PrioriteBadge({ priorite }: { priorite: string }) {
  const cls = priorite === 'haute' ? 'bg-destructive/15 text-destructive' : priorite === 'moyenne' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground';
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{priorite}</Badge>;
}

/* ─── Main Component ─── */

export default function HyperaleAnalyse() {
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const nom = etab.nom || 'l\'établissement';
  const [refreshKey, setRefreshKey] = useState(0);

  // Smart seuils
  const hyperaleEtabs = useHyperaleStore(s => s.etablissements);
  const getSeuils = useHyperaleSeuilsStore(s => s.getSeuils);
  const currentEtab = hyperaleEtabs.find(e => e.uai === etab.uai) || null;
  const seuils = getSeuils(currentEtab);

  const prevYear = data.historique.find(h => h.exercice === exercice - 1);

  // Comparateur batch using smart seuils
  const batch = useMemo(() => comparerBatch({
    fdr: data.fdr,
    caf: data.caf,
    tresorerie: data.tresorerie,
    reserves: data.reserves,
    fdrPrev: prevYear?.fdr ?? null,
    cafPrev: prevYear?.caf ?? null,
    tresPrev: prevYear?.tresorerie ?? null,
    resPrev: prevYear?.reserves ?? null,
    seuils: {
      fdrCritique: seuils.fdr.critique,
      fdrSatisfaisant: seuils.fdr.satisfaisant,
      tresCritique: seuils.tresorerie.critique,
      tresSatisfaisant: seuils.tresorerie.satisfaisant,
      cafCritique: seuils.caf.critique,
      cafSatisfaisant: seuils.caf.satisfaisant,
      resCritique: seuils.reserves.critique,
      resSatisfaisant: seuils.reserves.satisfaisant,
    },
  }), [data, prevYear, seuils]);

  const analyse = useMemo(() => analyser({ nom, exercice, data, seuils }), [nom, exercice, data, seuils, refreshKey]);

  const kpis: KpiDef[] = [
    { label: 'FDR', value: data.fdr, days: data.fdrJours, icon: Wallet, comp: batch.fdr },
    { label: 'CAF', value: data.caf, icon: TrendingUp, comp: batch.caf },
    { label: 'Trésorerie', value: data.tresorerie, days: data.tresorerieJours, icon: Landmark, comp: batch.tresorerie },
    { label: 'Réserves', value: data.reserves, icon: ShieldCheck, comp: batch.reserves },
  ];

  const compData = [
    { label: 'FDR (jours)', etab: Math.round(data.fdrJours * 10) / 10, national: data.moyenneNationale.fdrJours, collectivite: data.moyenneCollectivite.fdrJours },
    { label: 'Tréso. (jours)', etab: Math.round(data.tresorerieJours * 10) / 10, national: data.moyenneNationale.tresorerieJours, collectivite: data.moyenneCollectivite.tresorerieJours },
    { label: 'Exec. charges (%)', etab: Math.round(data.tauxExecCharges * 10) / 10, national: data.moyenneNationale.tauxExecCharges, collectivite: data.moyenneCollectivite.tauxExecCharges },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Analyse complète — {nom}</h2>
          <p className="text-xs text-muted-foreground">Exercice {exercice}</p>
        </div>
        <div className="flex items-center gap-2">
          {!data.hasData && <Badge className="bg-warning/15 text-warning border-warning/30" variant="outline">Données de démonstration</Badge>}
        </div>
      </div>

      {/* Section 1 — KPI Summary */}
      <section>
        <SectionTitle icon={Target}>Résumé des indicateurs clés</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => <KpiSummaryCard key={k.label} kpi={k} />)}
        </div>
        {/* Comparateur messages */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.values(batch.messages).map((msg, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal py-1">{msg}</Badge>
          ))}
        </div>
      </section>

      {/* Section 2 — Charts */}
      <section>
        <SectionTitle icon={ArrowUpRight}>Graphiques principaux</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold text-muted-foreground">Évolution du FDR</CardTitle></CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.fdr }))}>
                  <defs><linearGradient id="fdrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} /><YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Area type="monotone" dataKey="value" name="FDR" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fdrGrad)" dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold text-muted-foreground">CAF : évolution</CardTitle></CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.caf }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} /><YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Bar dataKey="value" name="CAF" radius={[4, 4, 0, 0]}>
                    {data.historique.map((h, i) => <Cell key={i} fill={h.caf >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold text-muted-foreground">Trésorerie : niveau et tendance</CardTitle></CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.tresorerie }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} /><YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="value" name="Trésorerie" stroke="hsl(var(--accent-foreground))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--accent-foreground))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3 — AI Analysis */}
      <section>
        <SectionTitle icon={Lightbulb} action={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setRefreshKey(k => k + 1); toast.success('Analyse mise à jour'); }}>
            <RefreshCw className="h-3.5 w-3.5" /> Mettre à jour l'analyse
          </Button>
        }>Analyse automatique (IA)</SectionTitle>

        <Card className="mb-4 border-primary/20">
          <CardContent className="p-4">
            <ul className="space-y-1.5">
              {analyse.engine.analyseDetaillee.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-destructive/20">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Causes probables</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><ul className="space-y-1.5">{analyse.causes.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-destructive mt-0.5">•</span>{c}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-warning/20">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-warning" /> Conséquences possibles</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><ul className="space-y-1.5">{analyse.consequences.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-warning mt-0.5">•</span>{c}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-orange-400/20">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><Info className="h-4 w-4 text-orange-500" /> Points de vigilance</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><ul className="space-y-1.5">{analyse.vigilance.map((v, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>{v}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Points positifs</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><ul className="space-y-1.5">{analyse.positifs.map((p, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span>{p}</li>)}</ul></CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4 — Comparisons */}
      <section>
        <SectionTitle icon={Target}>Comparaisons</SectionTitle>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Indicateur</th>
                  <th className="text-right py-2 text-xs font-semibold text-primary">Établissement</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Moy. nationale</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Moy. collectivité</th>
                </tr></thead>
                <tbody>{compData.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 font-medium">{row.label}</td>
                    <td className="py-2.5 text-right font-bold text-foreground">{row.etab}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{row.national}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{row.collectivite}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {!data.hasData && <p className="text-xs text-muted-foreground mt-3 italic">Les moyennes affichées sont des valeurs de référence simulées.</p>}
          </CardContent>
        </Card>
      </section>

      {/* Section 5 — Recommendations */}
      <section>
        <SectionTitle icon={ChevronRight}>Recommandations opérationnelles</SectionTitle>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2.5">
              {analyse.recommandationsAvecPriorite.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span className="flex-1">{r.texte}</span>
                  <PrioriteBadge priorite={r.priorite} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Section 6 — Copyable Texts */}
      <section>
        <SectionTitle icon={FileText}>Texte prêt à copier</SectionTitle>
        <div className="space-y-3">
          <CopyBlock label="Résumé exécutif" icon={Info} text={analyse.engine.resume} />
          <CopyBlock label="Annexe du COFI" icon={BookOpen} text={analyse.engine.texteCOFI} />
          <CopyBlock label="Présentation en Conseil d'Administration" icon={Users} text={analyse.engine.texteCA} />
          <CopyBlock label="Note au chef d'établissement" icon={FileText} text={analyse.engine.texteNote} />
        </div>
      </section>
    </div>
  );
}
