import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { GaugeChart } from "@/components/GaugeChart";
import { mockIndicators, formatCurrency, formatPercent } from "@/lib/mockData";
import { Wallet, ArrowDownUp, Landmark, CalendarDays, TrendingUp, Receipt, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";

const indicators = [
  { title: "Fonds de roulement (FDR)", value: formatCurrency(mockIndicators.fdr), raw: mockIndicators.fdr, icon: Wallet, variant: "primary" as const, formula: "Ressources stables - Emplois stables" },
  { title: "Besoin en fonds de roulement (BFR)", value: formatCurrency(mockIndicators.bfr), raw: mockIndicators.bfr, icon: ArrowDownUp, variant: "warning" as const, formula: "Actif circulant - Dettes CT" },
  { title: "Trésorerie nette", value: formatCurrency(mockIndicators.tresorerie), raw: mockIndicators.tresorerie, icon: Landmark, variant: "success" as const, formula: "FDR - BFR" },
  { title: "Jours de fonctionnement", value: `${mockIndicators.joursFonctionnement} jours`, raw: mockIndicators.joursFonctionnement, icon: CalendarDays, variant: "success" as const, formula: "FDR / (Charges annuelles / 360)" },
  { title: "Taux de recouvrement", value: formatPercent(mockIndicators.tauxRecouvrement), raw: mockIndicators.tauxRecouvrement, icon: TrendingUp, variant: "success" as const, formula: "Recettes encaissées / Recettes émises" },
  { title: "Résultat de l'exercice", value: formatCurrency(mockIndicators.resultatExercice), raw: mockIndicators.resultatExercice, icon: Receipt, variant: "primary" as const, formula: "Produits - Charges" },
  { title: "Poids des charges", value: formatPercent(mockIndicators.poidsCharges), raw: mockIndicators.poidsCharges, icon: BarChart3, variant: "default" as const, formula: "Charges / Total produits" },
  { title: "Part du SRH", value: formatPercent(mockIndicators.poidsSRH), raw: mockIndicators.poidsSRH, icon: Users, variant: "warning" as const, formula: "Charges SRH / Total charges" },
];

const radarData = [
  { subject: "FDR (j)", value: Math.min(mockIndicators.joursFonctionnement, 100), fullMark: 100 },
  { subject: "Recouvr.", value: mockIndicators.tauxRecouvrement, fullMark: 100 },
  { subject: "Trésorerie", value: Math.min((mockIndicators.tresorerie / 300000) * 100, 100), fullMark: 100 },
  { subject: "Résultat", value: Math.min(Math.max((mockIndicators.resultatExercice / 50000) * 100, 0), 100), fullMark: 100 },
  { subject: "Maîtrise ch.", value: Math.max(100 - mockIndicators.poidsCharges, 0), fullMark: 100 },
  { subject: "SRH maîtrisé", value: Math.max(100 - mockIndicators.poidsSRH, 0), fullMark: 100 },
];

const barComparison = [
  { name: "FDR", valeur: mockIndicators.fdr, seuil: 175000, fill: mockIndicators.fdr >= 175000 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
  { name: "BFR", valeur: mockIndicators.bfr, seuil: mockIndicators.fdr, fill: mockIndicators.bfr < mockIndicators.fdr ? "hsl(var(--success))" : "hsl(var(--destructive))" },
  { name: "Trésorerie", valeur: mockIndicators.tresorerie, seuil: 50000, fill: "hsl(var(--success))" },
];

const Indicators = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Indicateurs financiers M9-6</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicateurs réglementaires — Exercice 2023</p>
      </motion.div>

      {/* Gauges row */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tableau de bord synthétique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6">
            <GaugeChart value={mockIndicators.joursFonctionnement} max={90} label="Jours FDR" unit=" j" thresholds={{ ok: 30, warning: 15 }} />
            <GaugeChart value={mockIndicators.tauxRecouvrement} max={100} label="Recouvrement" unit="%" thresholds={{ ok: 95, warning: 80 }} />
            <GaugeChart value={mockIndicators.poidsCharges} max={100} label="Poids charges" unit="%" thresholds={{ ok: 85, warning: 95 }} />
            <GaugeChart value={mockIndicators.poidsSRH} max={100} label="Part SRH" unit="%" thresholds={{ ok: 70, warning: 85 }} />
          </div>
        </CardContent>
      </Card>

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
