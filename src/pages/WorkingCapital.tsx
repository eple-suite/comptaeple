import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { mockIndicators, mockEvolutionData, formatCurrency } from "@/lib/mockData";
import { Wallet, ArrowDownUp, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";

const WorkingCapital = () => {
  const status = mockIndicators.fdr > 0 ? "Positif" : "Négatif";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Fonds de roulement</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyse FDR / BFR / Trésorerie — Exercice 2023</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="FDR" value={formatCurrency(mockIndicators.fdr)} trend={3.3} icon={Wallet} variant="primary" />
        <KpiCard title="BFR" value={formatCurrency(mockIndicators.bfr)} trend={4.6} icon={ArrowDownUp} variant="warning" />
        <KpiCard title="Trésorerie nette" value={formatCurrency(mockIndicators.tresorerie)} trend={2.7} icon={Landmark} variant="success" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Équilibre financier</CardTitle>
            <Badge variant="outline" className="text-xs">FDR = BFR + Trésorerie</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50 text-center">
            <div>
              <p className="text-xs text-muted-foreground">FDR</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(mockIndicators.fdr)}</p>
            </div>
            <div className="flex items-center justify-center text-2xl text-muted-foreground">=</div>
            <div>
              <p className="text-xs text-muted-foreground">BFR + Tréso</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(mockIndicators.bfr + mockIndicators.tresorerie)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Évolution pluriannuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={mockEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(215,25%,50%)" strokeDasharray="3 3" />
              <Bar dataKey="fdr" name="FDR" fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bfr" name="BFR" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tresorerie" name="Trésorerie" fill="hsl(160,45%,45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✅ Le fonds de roulement est <strong className="text-foreground">{status.toLowerCase()}</strong> à {formatCurrency(mockIndicators.fdr)}, couvrant <strong className="text-foreground">{mockIndicators.joursFonctionnement} jours</strong> de fonctionnement.</p>
          <p>✅ La trésorerie nette est positive, assurant la liquidité de l'établissement.</p>
          <p>⚠️ Le BFR progresse de +4.6%, surveiller l'évolution des créances sur usagers.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingCapital;
