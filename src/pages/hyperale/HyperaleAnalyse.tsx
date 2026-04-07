import { useState } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHyperaleData } from './useHyperaleData';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Landmark, ShieldCheck, Copy, Check,
  AlertTriangle, Lightbulb, Target, FileText, BookOpen, Users, Info,
  ArrowUpRight, ArrowDownRight, Minus, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`;
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} %`;

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

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />{children}
    </h3>
  );
}

/* ─── Section 1 — KPI Cards ─── */

interface KpiDef {
  label: string;
  value: number;
  prev: number;
  days?: number;
  subtitle: string;
  icon: React.ElementType;
}

function KpiSummaryCard({ kpi }: { kpi: KpiDef }) {
  const delta = kpi.prev !== 0 ? ((kpi.value - kpi.prev) / Math.abs(kpi.prev)) * 100 : 0;
  const isUp = delta > 2;
  const isDown = delta < -2;
  const color = isDown ? 'text-destructive' : isUp ? 'text-green-600' : 'text-muted-foreground';
  const bgColor = isDown ? 'border-destructive/30 bg-destructive/5' : isUp ? 'border-green-500/30 bg-green-500/5' : 'border-border';
  const interpretation = isDown
    ? `${kpi.label} en baisse significative`
    : isUp
      ? `${kpi.label} en hausse`
      : `${kpi.label} stable`;

  return (
    <Card className={`${bgColor} transition-colors`}>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
          <kpi.icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xl font-black text-foreground">{fmt(kpi.value)}</p>
        {kpi.days != null && <p className="text-xs text-muted-foreground">≈ {kpi.days.toFixed(1)} jours</p>}
        <div className="flex items-center gap-1.5">
          {isUp ? <ArrowUpRight className={`h-3.5 w-3.5 ${color}`} /> : isDown ? <ArrowDownRight className={`h-3.5 w-3.5 ${color}`} /> : <Minus className={`h-3.5 w-3.5 ${color}`} />}
          <span className={`text-xs font-medium ${color}`}>{pct(delta)}</span>
          <span className="text-xs text-muted-foreground">vs N-1</span>
        </div>
        <p className="text-xs text-muted-foreground italic">{interpretation}</p>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */

export default function HyperaleAnalyse() {
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const nom = etab.nom || 'l\'établissement';

  // Previous year approximations from historique
  const prevYear = data.historique.find(h => h.exercice === exercice - 1);
  const prevFdr = prevYear?.fdr ?? data.fdr * 0.95;
  const prevCaf = prevYear?.caf ?? data.caf * 0.9;
  const prevTreso = prevYear?.tresorerie ?? data.tresorerie * 0.97;
  const prevReserves = prevYear?.reserves ?? data.reserves * 1.02;

  const kpis: KpiDef[] = [
    { label: 'FDR', value: data.fdr, prev: prevFdr, days: data.fdrJours, subtitle: 'Fonds de roulement', icon: Wallet },
    { label: 'CAF', value: data.caf, prev: prevCaf, subtitle: 'Capacité d\'autofinancement', icon: TrendingUp },
    { label: 'Trésorerie', value: data.tresorerie, prev: prevTreso, days: data.tresorerieJours, subtitle: 'Liquidités disponibles', icon: Landmark },
    { label: 'Réserves', value: data.reserves, prev: prevReserves, subtitle: 'Marges de sécurité', icon: ShieldCheck },
  ];

  // ── Analysis generation ──
  const causes: string[] = [];
  const consequences: string[] = [];
  const vigilance: string[] = [];
  const positifs: string[] = [];

  if (data.fdr < 0) { causes.push('Emplois stables supérieurs aux ressources stables'); consequences.push('Risque d\'incident de paiement à court terme'); }
  if (data.fdrJours < 30) vigilance.push(`Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours — seuil recommandé : 30 jours.`);
  if (data.fdrJours >= 45) positifs.push(`Le FDR couvre ${data.fdrJours.toFixed(1)} jours, supérieur à la moyenne nationale.`);
  if (data.caf < 0) { causes.push('Charges réelles supérieures aux produits réels'); consequences.push('Érosion progressive du fonds de roulement'); }
  if (data.caf > 0) positifs.push('La CAF est positive : l\'établissement dégage des ressources pour investir.');
  if (data.tresorerie < 0) { causes.push('Décalage entre encaissements et décaissements'); consequences.push('Impossibilité de payer les fournisseurs à bonne date'); vigilance.push('Trésorerie négative — risque de rejet de virements.'); }
  if (data.tresorerieJours < 15 && data.tresorerie > 0) vigilance.push(`Trésorerie faible : seulement ${data.tresorerieJours.toFixed(1)} jours de couverture.`);
  if (data.tresorerieJours >= 30) positifs.push('La trésorerie couvre plus de 30 jours, situation confortable.');
  if (data.tauxExecCharges > 0 && data.tauxExecCharges < 85) vigilance.push(`Taux d'exécution des charges à ${data.tauxExecCharges.toFixed(1)} % — inférieur à 85 %.`);
  if (data.tauxExecCharges >= 90) positifs.push(`Taux d'exécution des charges satisfaisant (${data.tauxExecCharges.toFixed(1)} %).`);
  if (data.resultatComptable < -5000) { causes.push('Résultat comptable fortement déficitaire'); consequences.push('Prélèvement probable sur les réserves'); }
  if (data.resultatComptable > 0) positifs.push(`Résultat comptable excédentaire (${fmt(data.resultatComptable)}).`);

  if (causes.length === 0) causes.push('Aucune cause d\'alerte identifiée.');
  if (consequences.length === 0) consequences.push('Aucune conséquence négative anticipée.');
  if (vigilance.length === 0) vigilance.push('Aucun point de vigilance particulier.');
  if (positifs.length === 0) positifs.push('L\'analyse ne met pas en évidence de point positif marquant.');

  // ── Recommendations ──
  const recos: string[] = [];
  if (data.fdrJours < 30) recos.push('Surveiller les charges de fonctionnement et limiter les dépenses non prioritaires.');
  if (data.caf < 0) recos.push('Identifier les postes de charges à optimiser pour restaurer la CAF.');
  if (data.tresorerieJours < 15) recos.push('Anticiper un besoin de trésorerie et accélérer les encaissements.');
  recos.push('Renforcer le suivi des recettes propres et des restes à recouvrer.');
  if (data.tauxExecCharges < 85) recos.push('Analyser les engagements en cours pour améliorer le taux d\'exécution.');
  recos.push('Préparer un plan d\'investissement cohérent avec la capacité d\'autofinancement.');
  const uniqueRecos = [...new Set(recos)].slice(0, 6);

  // ── Texts ──
  const resumeExec = `Au 31/12/${exercice}, ${nom} présente un FDR de ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours), une trésorerie de ${fmt(data.tresorerie)} et une CAF de ${fmt(data.caf)}. ${data.fdr > 0 && data.tresorerie > 0 ? 'La situation financière est globalement saine.' : 'Des points de vigilance sont identifiés.'}`;

  const textCofi = `Le fonds de roulement de ${nom} s'établit à ${fmt(data.fdr)} au 31/12/${exercice}, soit ${data.fdrJours.toFixed(1)} jours de fonctionnement. La trésorerie atteint ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours). La capacité d'autofinancement est de ${fmt(data.caf)}. ${data.caf >= 0 ? 'L\'établissement dégage des ressources suffisantes pour financer ses investissements.' : 'L\'établissement ne génère pas suffisamment de ressources pour son autofinancement.'} Les réserves s'élèvent à ${fmt(data.reserves)}.`;

  const textCA = `Mesdames, Messieurs les membres du Conseil d'Administration,\n\nLe compte financier de l'exercice ${exercice} fait apparaître un fonds de roulement de ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours), une trésorerie de ${fmt(data.tresorerie)} et des réserves de ${fmt(data.reserves)}.\n\n${data.fdr > 0 && data.caf >= 0 ? 'La situation financière de l\'établissement est satisfaisante et permet d\'envisager sereinement les projets à venir.' : 'La situation financière appelle une vigilance particulière sur la maîtrise des charges et le recouvrement des recettes.'}`;

  const textNote = `Monsieur/Madame le Chef d'établissement,\n\nÀ l'issue de l'exercice ${exercice}, les principaux indicateurs financiers de ${nom} sont les suivants :\n- FDR : ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours)\n- CAF : ${fmt(data.caf)}\n- Trésorerie : ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours)\n- Réserves : ${fmt(data.reserves)}\n\n${uniqueRecos.slice(0, 3).map(r => `• ${r}`).join('\n')}`;

  // ── Comparison data ──
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
        {!data.hasData && <Badge className="bg-warning/15 text-warning border-warning/30" variant="outline">Données de démonstration</Badge>}
      </div>

      {/* ── Section 1 — KPI Summary ── */}
      <section>
        <SectionTitle icon={Target}>Résumé des indicateurs clés</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => <KpiSummaryCard key={k.label} kpi={k} />)}
        </div>
      </section>

      {/* ── Section 2 — Charts ── */}
      <section>
        <SectionTitle icon={ArrowUpRight}>Graphiques principaux</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* FDR evolution */}
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground">Évolution du FDR</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.fdr }))}>
                  <defs>
                    <linearGradient id="fdrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Area type="monotone" dataKey="value" name="FDR" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fdrGrad)" dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CAF evolution */}
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground">CAF : évolution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.caf }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Bar dataKey="value" name="CAF" radius={[4, 4, 0, 0]}>
                    {data.historique.map((h, i) => (
                      <Cell key={i} fill={h.caf >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trésorerie */}
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground">Trésorerie : niveau et tendance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.historique.map(h => ({ exercice: h.exercice, value: h.tresorerie }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Exercice ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="value" name="Trésorerie" stroke="hsl(var(--accent-foreground))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--accent-foreground))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 3 — AI Analysis ── */}
      <section>
        <SectionTitle icon={Lightbulb}>Analyse automatique</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-destructive/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Causes probables
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {causes.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-destructive mt-0.5">•</span>{c}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-warning/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-warning" /> Conséquences possibles
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {consequences.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-warning mt-0.5">•</span>{c}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-orange-400/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-500" /> Points de vigilance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {vigilance.map((v, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>{v}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" /> Points positifs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {positifs.map((p, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span>{p}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 4 — Comparisons ── */}
      <section>
        <SectionTitle icon={Target}>Comparaisons</SectionTitle>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Indicateur</th>
                    <th className="text-right py-2 text-xs font-semibold text-primary">Établissement</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Moy. nationale</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Moy. collectivité</th>
                  </tr>
                </thead>
                <tbody>
                  {compData.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{row.label}</td>
                      <td className="py-2.5 text-right font-bold text-foreground">{row.etab}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{row.national}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{row.collectivite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.hasData && (
              <p className="text-xs text-muted-foreground mt-3 italic">
                Les moyennes affichées sont des valeurs de référence simulées. Connectez vos données pour une comparaison réelle.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 5 — Recommendations ── */}
      <section>
        <SectionTitle icon={ChevronRight}>Recommandations opérationnelles</SectionTitle>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2.5">
              {uniqueRecos.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ── Section 6 — Copyable Texts ── */}
      <section>
        <SectionTitle icon={FileText}>Texte prêt à copier</SectionTitle>
        <div className="space-y-3">
          <CopyBlock label="Résumé exécutif" icon={Info} text={resumeExec} />
          <CopyBlock label="Annexe du COFI" icon={BookOpen} text={textCofi} />
          <CopyBlock label="Présentation en Conseil d'Administration" icon={Users} text={textCA} />
          <CopyBlock label="Note au chef d'établissement" icon={FileText} text={textNote} />
        </div>
      </section>
    </div>
  );
}
