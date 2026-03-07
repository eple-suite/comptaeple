import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { mockIndicators, formatCurrency, formatPercent } from "@/lib/mockData";
import { Wallet, ArrowDownUp, Landmark, CalendarDays, TrendingUp, Receipt, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const indicators = [
  { title: "Fonds de roulement (FDR)", value: formatCurrency(mockIndicators.fdr), icon: Wallet, variant: "primary" as const, formula: "Ressources stables - Emplois stables" },
  { title: "Besoin en fonds de roulement (BFR)", value: formatCurrency(mockIndicators.bfr), icon: ArrowDownUp, variant: "warning" as const, formula: "Actif circulant - Dettes CT" },
  { title: "Trésorerie nette", value: formatCurrency(mockIndicators.tresorerie), icon: Landmark, variant: "success" as const, formula: "FDR - BFR" },
  { title: "Jours de fonctionnement", value: `${mockIndicators.joursFonctionnement} jours`, icon: CalendarDays, variant: "success" as const, formula: "FDR / (Charges annuelles / 360)" },
  { title: "Taux de recouvrement", value: formatPercent(mockIndicators.tauxRecouvrement), icon: TrendingUp, variant: "success" as const, formula: "Recettes encaissées / Recettes émises" },
  { title: "Résultat de l'exercice", value: formatCurrency(mockIndicators.resultatExercice), icon: Receipt, variant: "primary" as const, formula: "Produits - Charges" },
  { title: "Poids des charges", value: formatPercent(mockIndicators.poidsCharges), icon: BarChart3, variant: "default" as const, formula: "Charges / Total produits" },
  { title: "Part du SRH", value: formatPercent(mockIndicators.poidsSRH), icon: Users, variant: "warning" as const, formula: "Charges SRH / Total charges" },
];

const Indicators = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Indicateurs financiers M9-6</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicateurs réglementaires — Exercice 2023</p>
      </motion.div>

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
