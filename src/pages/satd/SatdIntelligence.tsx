import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/mockData";
import { Satd, TiersDetenteur, STATUT_SATD_CONFIG, TYPE_DEBITEUR_LABELS } from "./types";
import { analyserProportionnalite } from "./SatdReferenceData";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import useCofiepleStore from "@/store/useCofiepleStore";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Shield, Target, Zap,
  BarChart3, Calendar, ArrowRight, Sparkles, Clock, CheckCircle2, XCircle,
  Lightbulb, Activity, PieChart,
} from "lucide-react";
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, Legend } from "recharts";

interface Props {
  satds: Satd[];
  tiers: TiersDetenteur[];
  onOpenAssistant: (ctx: string) => void;
}

// Risk scoring engine
function scoreDossier(s: Satd): { score: number; level: "critique" | "eleve" | "moyen" | "faible"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Prescription risk
  const now = Date.now();
  const prescDate = new Date(s.datePrescription).getTime();
  const moisRestants = (prescDate - now) / (30 * 24 * 60 * 60 * 1000);
  if (moisRestants < 3) { score += 40; factors.push("Prescription < 3 mois"); }
  else if (moisRestants < 6) { score += 25; factors.push("Prescription < 6 mois"); }
  else if (moisRestants < 12) { score += 10; factors.push("Prescription < 12 mois"); }

  // Amount risk
  const restant = s.montantGlobal - s.montantPreleve;
  if (restant > 2000) { score += 15; factors.push(`Enjeu financier élevé (${formatCurrency(restant)})`); }
  else if (restant > 500) { score += 5; }

  // Stagnation
  if (s.prelevements.length === 0 && s.statut === "en_cours") {
    score += 20; factors.push("Aucun prélèvement reçu malgré statut en cours");
  }

  // Contestation
  if (s.statut === "conteste") { score += 25; factors.push("Dossier contesté — risque procédural"); }
  if (s.statut === "suspendu") { score += 15; factors.push("Procédure suspendue"); }

  // No tiers assigned
  if (!s.tiersDetenteurId && s.statut !== "termine") { score += 10; factors.push("Aucun tiers détenteur assigné"); }

  // Long duration without resolution
  const ageJours = (now - new Date(s.dateCreation).getTime()) / (24 * 60 * 60 * 1000);
  if (ageJours > 365 && s.statut !== "termine") { score += 10; factors.push(`Dossier ancien (${Math.round(ageJours / 30)} mois)`); }

  // No autorisation yet but past avis stage
  if (!s.autorisationOrdonnateur && s.etapes.some(e => e.type === "avis_poursuites")) {
    score += 10; factors.push("Autorisation ordonnateur en attente");
  }

  const level = score >= 60 ? "critique" : score >= 35 ? "eleve" : score >= 15 ? "moyen" : "faible";
  return { score: Math.min(100, score), level, factors };
}

const RISK_COLORS = {
  critique: "hsl(0, 72%, 51%)",
  eleve: "hsl(38, 92%, 50%)",
  moyen: "hsl(215, 70%, 55%)",
  faible: "hsl(142, 60%, 45%)",
};

const RISK_LABELS = {
  critique: "Critique",
  eleve: "Élevé",
  moyen: "Moyen",
  faible: "Faible",
};

export default function SatdIntelligence({ satds, tiers, onOpenAssistant }: Props) {
  const { selectedEstablishment } = useEstablishment();
  const { resultats } = useCofiepleStore();

  // === Cross-module data ===
  const fdrData = resultats?.principal;
  const fdrMobilisable = fdrData ? (fdrData.fdrComptable - (fdrData.stocks || 0)) : null;
  const joursFdr = fdrData?.joursFdr ?? null;

  // === Scoring all dossiers ===
  const scoredSatds = useMemo(() =>
    satds
      .filter(s => s.statut !== "termine" && s.statut !== "prescrit" && s.statut !== "irrecouv")
      .map(s => ({ ...s, risk: scoreDossier(s) }))
      .sort((a, b) => b.risk.score - a.risk.score),
    [satds]
  );

  // === KPIs ===
  const totalInitial = satds.reduce((s, a) => s + a.montantGlobal, 0);
  const totalPreleve = satds.reduce((s, a) => s + a.montantPreleve, 0);
  const totalRestant = totalInitial - totalPreleve;
  const tauxRecouvrement = totalInitial > 0 ? (totalPreleve / totalInitial) * 100 : 0;

  // === Risk distribution ===
  const riskDistribution = useMemo(() => {
    const counts = { critique: 0, eleve: 0, moyen: 0, faible: 0 };
    scoredSatds.forEach(s => { counts[s.risk.level]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({
      name: RISK_LABELS[k as keyof typeof RISK_LABELS],
      value: v,
      fill: RISK_COLORS[k as keyof typeof RISK_COLORS],
    }));
  }, [scoredSatds]);

  // === Monthly forecast ===
  const monthlyForecast = useMemo(() => {
    if (satds.length === 0) return [];
    const avgMonthly = satds.reduce((s, a) => {
      if (a.prelevements.length === 0) return s;
      const months = new Set(a.prelevements.map(p => p.date.substring(0, 7))).size;
      return s + (a.montantPreleve / Math.max(months, 1));
    }, 0);
    const months = [];
    let cumule = totalPreleve;
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      cumule += avgMonthly;
      months.push({
        mois: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        prevision: Math.min(cumule, totalInitial),
        objectif: totalInitial,
      });
    }
    return months;
  }, [satds, totalPreleve, totalInitial]);

  // === Strategy recommendations ===
  const strategies = useMemo(() => {
    const recs: { icon: typeof Brain; title: string; detail: string; priority: "haute" | "moyenne" | "info"; action?: string }[] = [];

    const critiques = scoredSatds.filter(s => s.risk.level === "critique");
    if (critiques.length > 0) {
      recs.push({
        icon: AlertTriangle,
        title: `${critiques.length} dossier(s) à risque critique`,
        detail: `Prescription imminente ou blocage procédural. Action immédiate requise pour : ${critiques.map(s => s.reference).join(", ")}`,
        priority: "haute",
        action: "contestation",
      });
    }

    const sansPrelevement = satds.filter(s => s.statut === "en_cours" && s.prelevements.length === 0);
    if (sansPrelevement.length > 0) {
      recs.push({
        icon: Clock,
        title: `${sansPrelevement.length} SATD en cours sans prélèvement`,
        detail: "Relancez les tiers détenteurs. Ils ont l'obligation de verser dans les 30 jours.",
        priority: "haute",
      });
    }

    // Cross-module: FDR link
    if (fdrMobilisable !== null && totalRestant > 0) {
      const pctFdr = (totalRestant / Math.abs(fdrMobilisable)) * 100;
      if (pctFdr > 20) {
        recs.push({
          icon: TrendingUp,
          title: "Impact significatif sur le fonds de roulement",
          detail: `Le reste à recouvrer (${formatCurrency(totalRestant)}) représente ${pctFdr.toFixed(0)}% du FDR mobilisable. Intensifiez les poursuites pour améliorer la trésorerie.`,
          priority: "haute",
        });
      }
    }

    if (joursFdr !== null && joursFdr < 30 && totalRestant > 500) {
      recs.push({
        icon: Shield,
        title: "Autonomie financière insuffisante + créances impayées",
        detail: `${Math.round(joursFdr)} jours d'autonomie (seuil : 30). Le recouvrement forcé est d'autant plus nécessaire pour sécuriser la trésorerie.`,
        priority: "haute",
      });
    }

    const sansTiers = satds.filter(s => !s.tiersDetenteurId && s.statut !== "termine" && s.statut !== "prescrit");
    if (sansTiers.length > 0) {
      recs.push({
        icon: Target,
        title: `${sansTiers.length} dossier(s) sans tiers détenteur`,
        detail: "Lancez des demandes FICOBA pour identifier les comptes bancaires des débiteurs.",
        priority: "moyenne",
        action: "ficoba",
      });
    }

    const compte416 = satds.filter(s => s.compte416 && s.statut !== "termine");
    if (compte416.length > 0) {
      recs.push({
        icon: Activity,
        title: `${compte416.length} créance(s) douteuse(s) (compte 416) active(s)`,
        detail: "Vérifiez la provision pour dépréciation (compte 491) dans votre balance. Ces créances impactent le résultat comptable.",
        priority: "moyenne",
      });
    }

    if (tauxRecouvrement > 80) {
      recs.push({
        icon: CheckCircle2,
        title: "Excellent taux de recouvrement",
        detail: `${tauxRecouvrement.toFixed(0)}% recouvré. Performance au-dessus de la moyenne nationale (~65% pour les EPLE).`,
        priority: "info",
      });
    }

    return recs;
  }, [scoredSatds, satds, fdrMobilisable, joursFdr, totalRestant, tauxRecouvrement]);

  // === Proportionality analysis ===
  const proportionalityIssues = useMemo(() => {
    return satds
      .filter(s => s.statut !== "termine" && s.statut !== "prescrit")
      .map(s => {
        const restant = s.montantGlobal - s.montantPreleve;
        const analysis = analyserProportionnalite(restant, "salaire");
        return { ...s, proportionality: analysis };
      })
      .filter(s => s.proportionality.avis !== "favorable");
  }, [satds]);

  return (
    <div className="space-y-6">
      {/* === AI-Powered Risk Overview === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk gauge */}
        <Card className="shadow-card lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Score de risque global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RePie>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {riskDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2">
              {riskDistribution.map(r => (
                <div key={r.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: r.fill }} />
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cross-module synthesis */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" /> Synthèse inter-modules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Créances totales</p>
                <p className="font-mono text-lg font-bold">{formatCurrency(totalInitial)}</p>
              </div>
              <div className="bg-success/10 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Recouvré</p>
                <p className="font-mono text-lg font-bold text-success">{formatCurrency(totalPreleve)}</p>
                <p className="text-[10px] text-success">{tauxRecouvrement.toFixed(0)}%</p>
              </div>
              <div className="bg-warning/10 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Reste à recouvrer</p>
                <p className="font-mono text-lg font-bold text-warning">{formatCurrency(totalRestant)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">FDR mobilisable</p>
                {fdrMobilisable !== null ? (
                  <>
                    <p className="font-mono text-lg font-bold">{formatCurrency(fdrMobilisable)}</p>
                    <p className="text-[10px] text-muted-foreground">{joursFdr ? `${Math.round(joursFdr)} j d'autonomie` : ""}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Importez vos données comptables</p>
                )}
              </div>
            </div>

            {/* Impact on balance */}
            {fdrMobilisable !== null && totalRestant > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">Impact sur la santé financière</span>
                </div>
                <p className="text-muted-foreground">
                  Le recouvrement de {formatCurrency(totalRestant)} améliorerait le FDR de{" "}
                  <strong className="text-foreground">{((totalRestant / Math.abs(fdrMobilisable)) * 100).toFixed(1)}%</strong>
                  {joursFdr ? ` et ajouterait environ ${Math.round(totalRestant / ((fdrMobilisable / (joursFdr || 1))))} jours d'autonomie` : ""}.
                </p>
              </div>
            )}

            {/* Recouvrement forecast */}
            {monthlyForecast.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Prévision de recouvrement (12 mois)
                </p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={monthlyForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mois" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="prevision" fill="hsl(142, 60%, 45%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === Strategy Recommendations === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" /> Recommandations stratégiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">✅ Aucune action urgente identifiée. Continuez le suivi régulier.</p>
          ) : (
            strategies.map((rec, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${
                  rec.priority === "haute" ? "bg-destructive/5 border-destructive/20" :
                  rec.priority === "moyenne" ? "bg-warning/5 border-warning/20" :
                  "bg-success/5 border-success/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <rec.icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                    rec.priority === "haute" ? "text-destructive" :
                    rec.priority === "moyenne" ? "text-warning" :
                    "text-success"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{rec.title}</p>
                      <Badge variant="outline" className={`text-[9px] ${
                        rec.priority === "haute" ? "border-destructive text-destructive" :
                        rec.priority === "moyenne" ? "border-warning text-warning" :
                        "border-success text-success"
                      }`}>{rec.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                  </div>
                  {rec.action && (
                    <Button size="sm" variant="ghost" className="text-xs h-7 shrink-0" onClick={() => onOpenAssistant(rec.action!)}>
                      <Sparkles className="h-3 w-3 mr-1" /> Aide IA
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* === Risk Ranking === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-destructive" /> Classement par risque — Dossiers actifs ({scoredSatds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {scoredSatds.map(s => {
              const restant = s.montantGlobal - s.montantPreleve;
              const prescDate = new Date(s.datePrescription);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  {/* Risk indicator */}
                  <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: RISK_COLORS[s.risk.level] }}
                    >
                      {s.risk.score}
                    </div>
                    <span className="text-[9px] font-semibold" style={{ color: RISK_COLORS[s.risk.level] }}>
                      {RISK_LABELS[s.risk.level]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{s.reference}</span>
                      <Badge variant="secondary" className={`text-[9px] ${STATUT_SATD_CONFIG[s.statut].color}`}>
                        {STATUT_SATD_CONFIG[s.statut].label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{s.debiteur}</p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>Reste : <strong className="text-warning">{formatCurrency(restant)}</strong></span>
                      <span>•</span>
                      <span>Prescription : <strong className={prescDate <= new Date(Date.now() + 180 * 86400000) ? "text-destructive" : ""}>{prescDate.toLocaleDateString("fr-FR")}</strong></span>
                    </div>
                    {/* Risk factors */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.risk.factors.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-20 shrink-0 text-center">
                    <Progress value={(s.montantPreleve / s.montantGlobal) * 100} className="h-2" />
                    <span className="text-[10px] text-muted-foreground">{((s.montantPreleve / s.montantGlobal) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
            {scoredSatds.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">🎉 Aucun dossier actif — toutes les procédures sont soldées ou clôturées.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proportionality alerts */}
      {proportionalityIssues.length > 0 && (
        <Card className="shadow-card border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" /> Alertes proportionnalité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proportionalityIssues.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-xs p-2 rounded bg-warning/5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold">{s.reference}</span> — {s.debiteur} ({formatCurrency(s.montantGlobal - s.montantPreleve)} restant)
                  <p className="text-muted-foreground">{s.proportionality.recommandation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
