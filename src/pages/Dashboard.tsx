import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Landmark, CalendarDays, BarChart3, PieChart, Receipt, Users, Download, AlertTriangle, CheckCircle2, ShieldAlert, Info } from "lucide-react";
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
import { validerBalance, REGLES_VALIDATION, ENQUETES_RECTORALES, OUTILS_AC } from "@/lib/regulatoryKnowledge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// Données de validation comptable (depuis la balance détaillée)
const detailedForValidation = [
  { numero: "102", libelle: "Dotation", debit: 0, credit: 850000, solde: -850000 },
  { numero: "106", libelle: "Réserves", debit: 0, credit: 185000, solde: -185000 },
  { numero: "515", libelle: "Compte au Trésor", debit: 575000, credit: 416580, solde: 158420 },
  { numero: "531", libelle: "Caisse", debit: 5000, credit: 2650, solde: 2350 },
  { numero: "4411", libelle: "Subventions État", debit: 165230, credit: 165230, solde: 0 },
  { numero: "4412", libelle: "Collectivité — Subventions", debit: 0, credit: 0, solde: 0 },
  { numero: "44311", libelle: "Bourses — Crédit à répartir", debit: 305000, credit: 313700, solde: -8700 },
  { numero: "4112", libelle: "Familles — DP", debit: 245000, credit: 237500, solde: 7500 },
  { numero: "416", libelle: "Créances douteuses", debit: 3200, credit: 0, solde: 3200 },
];

const Dashboard = () => {
  const alertes = useMemo(() => validerBalance(detailedForValidation), []);
  const alertesBloquantes = alertes.filter(a => a.gravite === "bloquant");
  const alertesMajeures = alertes.filter(a => a.gravite === "majeur");

  // Prochaines enquêtes rectorales
  const now = new Date();
  const moisActuel = now.getMonth(); // 0-11
  const prochaines = ENQUETES_RECTORALES.filter(e => {
    const moisMap: Record<string, number[]> = {
      "Février-Mars": [1, 2], "Janvier": [0], "Octobre et Mars": [2, 9],
      "Annuelle (janvier)": [0], "Annuelle (mars)": [2], "Juillet et Décembre": [6, 11],
    };
    const mois = moisMap[e.periode];
    if (!mois) return true; // trimestrielles → toujours afficher
    return mois.some(m => Math.abs(m - moisActuel) <= 1 || Math.abs(m - moisActuel) >= 11);
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Exercice {new Date().getFullYear() - 1} — Vue d'ensemble financière</p>
        </div>
        <Button size="sm" onClick={() => generateFinancialReport()} className="gradient-primary border-0">
          <Download className="h-4 w-4 mr-1" /> Rapport PDF
        </Button>
      </motion.div>

      {/* Alertes comptables automatiques */}
      {alertesBloquantes.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{alertesBloquantes.length} alerte{alertesBloquantes.length > 1 ? "s" : ""} bloquante{alertesBloquantes.length > 1 ? "s" : ""}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
              {alertesBloquantes.map(a => (
                <li key={a.id}><strong>{a.titre}</strong> — {a.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {alertesMajeures.length > 0 && (
        <Alert className="border-warning/50 bg-warning/5">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">{alertesMajeures.length} point{alertesMajeures.length > 1 ? "s" : ""} d'attention</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
              {alertesMajeures.map(a => (
                <li key={a.id}><strong>{a.titre}</strong> — {a.action}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {alertes.length === 0 && (
        <Alert className="border-success/50 bg-success/5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validation comptable OK</AlertTitle>
          <AlertDescription className="text-xs">Aucune anomalie détectée sur la balance — le compte financier est conforme.</AlertDescription>
        </Alert>
      )}

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

      {/* Enquêtes rectorales à venir */}
      {prochaines.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Enquêtes rectorales à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {prochaines.map((e, i) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-semibold">{e.nom}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{e.periode} — {e.destinataire}</p>
                  <p className="text-[10px] mt-1">{e.description.slice(0, 100)}...</p>
                  {e.obligatoire && <Badge variant="outline" className="mt-1 text-[9px]">Obligatoire</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outils de l'agent comptable */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Outils de référence AC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {OUTILS_AC.map(o => (
              <Badge key={o.nom} variant="outline" className="text-xs py-1 px-2.5">
                {o.nom}
                <span className="ml-1 text-[9px] text-muted-foreground">— {o.description.slice(0, 40)}...</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
