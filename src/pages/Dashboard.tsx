import { motion } from "framer-motion";
import { Wallet, TrendingUp, Landmark, CalendarDays, BarChart3, PieChart, Receipt, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateFinancialReport } from "@/lib/pdfGenerator";
import { KpiCard } from "@/components/KpiCard";
import {
  mockIndicators,
  mockEvolutionData,
  mockRepartitionCharges,
  mockTresorerieDetail,
  formatCurrency,
  formatPercent,
} from "@/lib/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Exercice 2023 — Vue d'ensemble financière</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Fonds de roulement"
          value={formatCurrency(mockIndicators.fdr)}
          trend={3.3}
          icon={Wallet}
          variant="primary"
        />
        <KpiCard
          title="Trésorerie nette"
          value={formatCurrency(mockIndicators.tresorerie)}
          trend={2.7}
          icon={Landmark}
          variant="success"
        />
        <KpiCard
          title="Jours de fonctionnement"
          value={`${mockIndicators.joursFonctionnement} j`}
          subtitle="Seuil recommandé : 30j"
          icon={CalendarDays}
          variant={mockIndicators.joursFonctionnement >= 30 ? "success" : "warning"}
        />
        <KpiCard
          title="Taux de recouvrement"
          value={formatPercent(mockIndicators.tauxRecouvrement)}
          trend={1.2}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Résultat de l'exercice"
          value={formatCurrency(mockIndicators.resultatExercice)}
          icon={Receipt}
          variant="primary"
        />
        <KpiCard
          title="Poids des charges"
          value={formatPercent(mockIndicators.poidsCharges)}
          icon={BarChart3}
          variant="default"
        />
        <KpiCard
          title="Part du SRH"
          value={formatPercent(mockIndicators.poidsSRH)}
          subtitle="Service Restauration & Hébergement"
          icon={Users}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution pluriannuelle */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Évolution pluriannuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                <XAxis dataKey="year" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="fdr" name="FDR" stroke="hsl(215,70%,45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tresorerie" name="Trésorerie" stroke="hsl(160,45%,45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bfr" name="BFR" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des charges */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition des charges</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RPieChart>
                <Pie
                  data={mockRepartitionCharges}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {mockRepartitionCharges.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} %`} />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trésorerie détail */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Détail de la trésorerie (Classe 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockTresorerieDetail} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <YAxis type="category" dataKey="label" width={150} fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="montant" fill="hsl(215,70%,45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
