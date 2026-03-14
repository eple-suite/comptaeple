import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Landmark, CalendarDays, BarChart3, PieChart, Receipt, Users, Download, AlertTriangle, CheckCircle2, ShieldAlert, Info, Activity, ArrowRight } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Dashboard = () => {
  const alertes = useMemo(() => validerBalance(detailedForValidation), []);
  const alertesBloquantes = alertes.filter(a => a.gravite === "bloquant");
  const alertesMajeures = alertes.filter(a => a.gravite === "majeur");

  // Prochaines enquêtes rectorales
  const now = new Date();
  const moisActuel = now.getMonth();
  const prochaines = ENQUETES_RECTORALES.filter(e => {
    const moisMap: Record<string, number[]> = {
      "Février-Mars": [1, 2], "Janvier": [0], "Octobre et Mars": [2, 9],
      "Annuelle (janvier)": [0], "Annuelle (mars)": [2], "Juillet et Décembre": [6, 11],
    };
    const mois = moisMap[e.periode];
    if (!mois) return true;
    return mois.some(m => Math.abs(m - moisActuel) <= 1 || Math.abs(m - moisActuel) >= 11);
  }).slice(0, 3);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Tableau de bord</h1>
              <p className="text-sm text-muted-foreground">
                Exercice {new Date().getFullYear() - 1} — Vue d'ensemble financière
              </p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => generateFinancialReport()}
          className="gradient-primary border-0 shadow-primary hover:shadow-lg transition-shadow"
        >
          <Download className="h-4 w-4 mr-1.5" /> Rapport PDF
        </Button>
      </motion.div>

      {/* Alertes comptables automatiques */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-3"
      >
        {alertesBloquantes.length > 0 && (
          <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/5">
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
          <Alert className="rounded-xl border-warning/30 bg-warning/5">
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
          <Alert className="rounded-xl border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Validation comptable OK</AlertTitle>
            <AlertDescription className="text-xs">Aucune anomalie détectée sur la balance — le compte financier est conforme.</AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* KPIs — Primary row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={staggerItem}>
          <KpiCard title="Fonds de roulement" value={formatCurrency(mockIndicators.fdr)} trend={3.3} icon={Wallet} variant="primary" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Trésorerie nette" value={formatCurrency(mockIndicators.tresorerie)} trend={2.7} icon={Landmark} variant="success" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Jours de fonctionnement" value={`${mockIndicators.joursFonctionnement} j`} subtitle="Seuil recommandé : 30j" icon={CalendarDays} variant={mockIndicators.joursFonctionnement >= 30 ? "success" : "warning"} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Taux de recouvrement" value={formatPercent(mockIndicators.tauxRecouvrement)} trend={1.2} icon={TrendingUp} variant="success" />
        </motion.div>
      </motion.div>

      {/* KPIs — Secondary row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={staggerItem}>
          <KpiCard title="Résultat de l'exercice" value={formatCurrency(mockIndicators.resultatExercice)} icon={Receipt} variant="primary" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Poids des charges" value={formatPercent(mockIndicators.poidsCharges)} icon={BarChart3} variant="default" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Part du SRH" value={formatPercent(mockIndicators.poidsSRH)} subtitle="Service Restauration & Hébergement" icon={Users} variant="warning" />
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Evolution pluriannuelle */}
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Évolution pluriannuelle</CardTitle>
                <CardDescription className="text-[11px]">FDR, Trésorerie et BFR sur 5 ans</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" vertical={false} />
                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(220,13%,90%)',
                    boxShadow: '0 4px 12px hsl(220 25% 12% / 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="fdr" name="FDR" stroke="hsl(220,65%,48%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(220,65%,48%)' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="tresorerie" name="Trésorerie" stroke="hsl(158,42%,42%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(158,42%,42%)' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="bfr" name="BFR" stroke="hsl(38,92%,50%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(38,92%,50%)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des charges */}
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <PieChart className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Répartition des charges</CardTitle>
                <CardDescription className="text-[11px]">Distribution par catégorie</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height={280}>
              <RPieChart>
                <Pie
                  data={mockRepartitionCharges}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  style={{ fontSize: '11px' }}
                >
                  {mockRepartitionCharges.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} %`} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220,13%,90%)', fontSize: '12px' }} />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trésorerie détail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Détail de la trésorerie (Classe 5)</CardTitle>
                <CardDescription className="text-[11px]">Comptes au Trésor, caisse et valeurs mobilières</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockTresorerieDetail} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" horizontal={false} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={150} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220,13%,90%)', fontSize: '12px' }} />
                <Bar dataKey="montant" fill="hsl(220,65%,48%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enquêtes rectorales à venir */}
      {prochaines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="shadow-card rounded-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <Info className="h-4 w-4 text-info" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Enquêtes rectorales à venir</CardTitle>
                  <CardDescription className="text-[11px]">Échéances proches</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {prochaines.map((e, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-semibold leading-snug">{e.nom}</p>
                      {e.obligatoire && <Badge variant="outline" className="text-[9px] shrink-0 ml-2">Obligatoire</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{e.periode} — {e.destinataire}</p>
                    <p className="text-[10px] mt-2 text-muted-foreground leading-relaxed">{e.description.slice(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Outils de l'agent comptable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="shadow-card rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-semibold">Outils de référence AC</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {OUTILS_AC.map(o => (
                <Badge key={o.nom} variant="outline" className="text-xs py-1.5 px-3 rounded-lg hover:bg-accent transition-colors cursor-default">
                  {o.nom}
                  <span className="ml-1.5 text-[9px] text-muted-foreground">— {o.description.slice(0, 40)}...</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
