import { useMemo } from "react";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { mockIndicators, formatCurrency, formatPercent } from "@/lib/mockData";
import { Wallet, ArrowDownUp, Landmark, CalendarDays, TrendingUp, Receipt, BarChart3, Users, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { GaugeChart } from "@/components/GaugeChart";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";

const Indicators = () => {
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const resultats = useCofiepleStore(s => s.resultats);
  const r = resultats[activeBudget];

  // Indicateurs réels M9-6 si données importées, sinon mock
  const live = useMemo(() => {
    if (!r) return mockIndicators;
    const chargesInvest = r.chargesNature ? Object.entries(r.chargesNature).filter(([k]) => /^(20|21|23)/.test(k)).reduce((s, [, v]) => s + v, 0) : 0;
    const chargesFonct = r.totalChargesSde - chargesInvest;
    const poidsCharges = r.totalProduitsReel > 0 ? (r.totalChargesReel / r.totalProduitsReel) * 100 : 0;
    // Part SRH: charges du service SRH / total
    const srhService = r.services?.['SRH'];
    const poidsSRH = srhService && r.totalChargesReel > 0 ? (srhService.chargesReel / r.totalChargesReel) * 100 : 0;
    return {
      fdr: r.fdrComptable,
      bfr: r.bfr,
      tresorerie: r.tresorerie,
      joursFonctionnement: Math.round(r.joursFdr),
      tauxRecouvrement: r.tmnr != null ? Math.max(0, 100 - r.tmnr) : 0,
      resultatExercice: r.resultatBudgetaire,
      poidsCharges,
      poidsSRH,
    };
  }, [r]);

  const hasRealData = !!r;

  const indicators = [
    { title: "Fonds de roulement (FDR)", value: formatCurrency(live.fdr), raw: live.fdr, icon: Wallet, variant: "primary" as const, formula: "Ressources stables - Emplois stables" },
    { title: "Besoin en fonds de roulement (BFR)", value: formatCurrency(live.bfr), raw: live.bfr, icon: ArrowDownUp, variant: "warning" as const, formula: "Actif circulant - Dettes CT" },
    { title: "Trésorerie nette", value: formatCurrency(live.tresorerie), raw: live.tresorerie, icon: Landmark, variant: "success" as const, formula: "FDR - BFR" },
    { title: "Jours de fonctionnement", value: `${live.joursFonctionnement} jours`, raw: live.joursFonctionnement, icon: CalendarDays, variant: "success" as const, formula: "FDR / (Charges fonct. / 365)" },
    { title: "Taux de recouvrement", value: formatPercent(live.tauxRecouvrement), raw: live.tauxRecouvrement, icon: TrendingUp, variant: "success" as const, formula: "100% - TMnr" },
    { title: "Résultat de l'exercice", value: formatCurrency(live.resultatExercice), raw: live.resultatExercice, icon: Receipt, variant: live.resultatExercice >= 0 ? "primary" as const : "warning" as const, formula: "Produits SDR - Charges SDE" },
    { title: "Poids des charges", value: formatPercent(live.poidsCharges), raw: live.poidsCharges, icon: BarChart3, variant: "default" as const, formula: "Charges / Total produits" },
    { title: "Part du SRH", value: formatPercent(live.poidsSRH), raw: live.poidsSRH, icon: Users, variant: "warning" as const, formula: "Charges SRH / Total charges" },
  ];

  // M9-6 extended indicators
  const extendedIndicators = useMemo(() => {
    if (!r) return [];
    return [
      { label: "CAF budgétaire", value: formatCurrency(r.cafBudgetaire), formula: "Résultat + Ch. OO(SDE) - Pr. OO(SDR)" },
      { label: "CAF comptable", value: formatCurrency(r.cafComptable), formula: "Résultat + Dot. amort. - Reprises" },
      { label: "FDR mobilisable", value: formatCurrency(r.fdrMobilisable), formula: "FDR - Stocks - Créances anc." },
      { label: "TMcap", value: formatPercent(r.tmcap), formula: "Dettes fourn. / Total SDE × 100" },
      { label: "TMnr", value: formatPercent(r.tmnr), formula: "Créances Cl.4 / Total SDR × 100" },
      { label: "Jours FDR", value: `${r.joursFdr.toFixed(2)} j`, formula: "(FDR × 365) / DRFN" },
      { label: "Jours trésorerie", value: `${r.joursTresorerie.toFixed(2)} j`, formula: "(Trésorerie × 365) / DRFN" },
      { label: "Variation FDR budg.", value: formatCurrency(r.varFdrCaf), formula: "CAF - Emplois d'investissement" },
    ];
  }, [r]);

  const radarData = [
    { subject: "FDR (j)", value: Math.min(live.joursFonctionnement, 100), fullMark: 100 },
    { subject: "Recouvr.", value: live.tauxRecouvrement, fullMark: 100 },
    { subject: "Trésorerie", value: Math.min((live.tresorerie / 300000) * 100, 100), fullMark: 100 },
    { subject: "Résultat", value: Math.min(Math.max((live.resultatExercice / 50000) * 100, 0), 100), fullMark: 100 },
    { subject: "Maîtrise ch.", value: Math.max(100 - live.poidsCharges, 0), fullMark: 100 },
    { subject: "SRH maîtrisé", value: Math.max(100 - live.poidsSRH, 0), fullMark: 100 },
  ];

  const barComparison = [
    { name: "FDR", valeur: live.fdr, seuil: 175000, fill: live.fdr >= 175000 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
    { name: "BFR", valeur: live.bfr, seuil: live.fdr, fill: live.bfr < live.fdr ? "hsl(var(--success))" : "hsl(var(--destructive))" },
    { name: "Trésorerie", valeur: live.tresorerie, seuil: 50000, fill: live.tresorerie >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
  ];

  const exportIndicatorsPDF = (print = false) => {
    const doc = createStyledPDF({ title: "Indicateurs financiers M9-6", subtitle: `Exercice ${hasRealData ? 'N' : '2023'} — Indicateurs réglementaires${hasRealData ? '' : ' (données de démonstration)'}` });
    autoTable(doc, {
      startY: 48,
      head: [["Indicateur", "Valeur", "Formule"]],
      body: indicators.map(i => [i.title, i.value, i.formula]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
    });
    const y1 = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: y1,
      head: [["Indicateur", "Valeur", "Seuil", "Statut"]],
      body: barComparison.map(b => [b.name, formatCurrency(b.valeur), formatCurrency(b.seuil), b.valeur >= b.seuil ? "✅ Conforme" : "⚠️ Sous seuil"]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
    });
    if (print) printPDF(doc); else savePDF(doc, `Indicateurs_M96_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Indicateurs financiers M9-6</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasRealData ? 'Indicateurs calculés à partir des données importées — Modèle officiel M9-6' : 'Données de démonstration — Importez SDE/SDR/Balance pour obtenir vos indicateurs réels'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => exportIndicatorsPDF(true)}>
            <Printer className="h-4 w-4 mr-1" /> Imprimer
          </Button>
          <Button size="sm" className="gradient-primary border-0 shadow-primary rounded-lg" onClick={() => exportIndicatorsPDF(false)}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {!hasRealData && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning-foreground">
          <strong>Mode démonstration :</strong> Les indicateurs affichés sont des données fictives. 
          Pour afficher vos indicateurs réels M9-6, importez vos fichiers SDE, SDR et Balance dans le module <em>Compte Financier</em>.
        </div>
      )}

      {/* Gauges row */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tableau de bord synthétique — Bilan de santé financière (M9-6)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6">
            <GaugeChart value={live.joursFonctionnement} max={90} label="Jours FDR" unit=" j" thresholds={{ ok: 30, warning: 15 }} />
            <GaugeChart value={live.tauxRecouvrement} max={100} label="Recouvrement" unit="%" thresholds={{ ok: 95, warning: 80 }} />
            <GaugeChart value={live.poidsCharges} max={100} label="Poids charges" unit="%" thresholds={{ ok: 85, warning: 95 }} />
            <GaugeChart value={live.poidsSRH} max={100} label="Part SRH" unit="%" thresholds={{ ok: 70, warning: 85 }} />
          </div>
        </CardContent>
      </Card>

      {/* M9-6 Extended Indicators (only with real data) */}
      {hasRealData && extendedIndicators.length > 0 && (
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-2 bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,20%)] rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-white">Indicateurs M9-6 — Bilan de santé financière</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {extendedIndicators.map((ind) => (
                <div key={ind.label} className="p-3 rounded-lg border bg-card">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{ind.label}</p>
                  <p className="text-lg font-bold font-display mt-1">{ind.value}</p>
                  <Badge variant="outline" className="text-[9px] font-mono mt-1">{ind.formula}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Radar + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Profil radar de l'établissement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Radar name="Performance" dataKey="value" stroke="hsl(215, 70%, 45%)" fill="hsl(215, 70%, 45%)" fillOpacity={0.35} strokeWidth={2} />
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Comparaison aux seuils réglementaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="valeur" name="Valeur" radius={[4, 4, 0, 0]}>
                  {barComparison.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map((ind, i) => (
          <motion.div
            key={ind.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{ind.title}</p>
                    <p className="text-2xl font-bold font-display mt-1">{ind.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    ind.variant === "primary" ? "bg-primary/10 text-primary" :
                    ind.variant === "success" ? "bg-success/10 text-success" :
                    ind.variant === "warning" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <ind.icon className="h-5 w-5" />
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">{ind.formula}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Indicators;
