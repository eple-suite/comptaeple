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
import { useCofiepleStore } from "@/store/useCofiepleStore";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Dashboard = () => {
  // Utiliser les données réelles de la balance importée (cofieple store)
  const balance = useCofiepleStore(s => s.balance);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balanceData = balance[activeBudget] || [];
  const resultats = useCofiepleStore(s => s.resultats);
  const r = resultats[activeBudget];

  // Indicateurs réels si analyse lancée, sinon mock
  const liveIndicators = useMemo(() => {
    if (!r) return mockIndicators;
    const chargesFonct = r.totalChargesSde - (r.chargesNature ? Object.entries(r.chargesNature).filter(([k]) => /^(20|21|23)/.test(k)).reduce((s, [, v]) => s + v, 0) : 0);
    const poidsCharges = r.totalProduitsReel > 0 ? (r.totalChargesReel / r.totalProduitsReel) * 100 : 0;
    const srhCharges = r.chargesNature ? Object.entries(r.chargesNature).filter(([k]) => k.startsWith('60') || k.startsWith('61')).reduce((s, [, v]) => s + v, 0) : 0;
    const poidsSRH = r.totalChargesReel > 0 ? (srhCharges / r.totalChargesReel) * 100 : 0;
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

  // Construire les comptes pour la validation à partir des données réelles
  const comptesForValidation = useMemo(() => {
    if (!balanceData || balanceData.length === 0) return [];
    // Agréger par compte pour la validation
    const map: Record<string, { debit: number; credit: number; solde: number }> = {};
    balanceData.forEach((b: any) => {
      const key = b.compte || '';
      if (!map[key]) map[key] = { debit: 0, credit: 0, solde: 0 };
      map[key].debit += (b.dbt || 0);
      map[key].credit += (b.crd || 0);
      map[key].solde += ((b.solDbt || 0) - (b.solCrd || 0));
    });
    return Object.entries(map).map(([numero, v]) => ({
      numero,
      libelle: numero,
      debit: v.debit,
      credit: v.credit,
      solde: v.solde,
    }));
  }, [balanceData]);

  const alertes = useMemo(() => {
    if (comptesForValidation.length === 0) return []; // Pas de fausses alertes sans données
    return validerBalance(comptesForValidation);
  }, [comptesForValidation]);
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
          <KpiCard title="Fonds de roulement" value={formatCurrency(liveIndicators.fdr)} icon={Wallet} variant="primary" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Trésorerie nette" value={formatCurrency(liveIndicators.tresorerie)} icon={Landmark} variant="success" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Jours de fonctionnement" value={`${liveIndicators.joursFonctionnement} j`} subtitle="Seuil recommandé : 30j" icon={CalendarDays} variant={liveIndicators.joursFonctionnement >= 30 ? "success" : "warning"} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Taux de recouvrement" value={formatPercent(liveIndicators.tauxRecouvrement)} icon={TrendingUp} variant="success" />
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
          <KpiCard title="Résultat de l'exercice" value={formatCurrency(liveIndicators.resultatExercice)} icon={Receipt} variant={liveIndicators.resultatExercice >= 0 ? "primary" : "warning"} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Poids des charges" value={formatPercent(liveIndicators.poidsCharges)} icon={BarChart3} variant="default" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard title="Part du SRH" value={formatPercent(liveIndicators.poidsSRH)} subtitle="Service Restauration & Hébergement" icon={Users} variant="warning" />
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
              <LineChart data={r ? [{ year: (r as any).exercice || 'N', fdr: r.fdrComptable, tresorerie: r.tresorerie, bfr: r.bfr }] : mockEvolutionData}>
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
                {(() => {
                  const pieData = r && r.services ? Object.entries(r.services).filter(([, s]) => s.chargesReel > 0).map(([k, s], i) => ({
                    name: s.libelle || k, value: Math.round(((s.chargesReel / r.totalChargesReel) * 100) * 10) / 10,
                    fill: `hsl(${(i * 47 + 200) % 360}, 55%, 50%)`
                  })) : mockRepartitionCharges;
                  return (
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`} style={{ fontSize: '11px' }}>
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                  );
                })()}
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
              <BarChart data={r ? [
                { label: "Dépôt au Trésor (515)", montant: r.tresorerie },
                { label: "Créances (Cl.4)", montant: r.totalCreances || 0 },
                { label: "Dettes fournisseurs (401)", montant: r.dettesFournisseurs || 0 },
              ] : mockTresorerieDetail} layout="vertical">
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
