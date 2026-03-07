import { useState } from "react";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import {
  mockIndicators,
  mockEvolutionData,
  mockPrelevementFDR,
  mockDettes,
  mockTresoreriePropreData,
  formatCurrency,
} from "@/lib/mockData";
import { Wallet, ArrowDownUp, Landmark, ShieldCheck, Banknote, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, formatFn }: any) => {
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(215,25%,35%)" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11}>
      {name}: {formatFn ? formatFn(value) : value}
    </text>
  );
};

const WorkingCapital = () => {
  const [montantPrelevement, setMontantPrelevement] = useState(mockPrelevementFDR.montantPrelevement);
  const [prelevementsAutorises, setPrelevementsAutorises] = useState(mockPrelevementFDR.prelevementsAutorises);

  const fdrApres = mockIndicators.fdr - montantPrelevement;
  const chargeFonctionnementJour = mockIndicators.fdr / mockIndicators.joursFonctionnement;
  const joursApres = Math.round(fdrApres / chargeFonctionnementJour);

  // Trésorerie propre
  const totalDettes = mockDettes.subventions + mockDettes.reliquatsSubventions + mockDettes.avancesEleves + mockDettes.avancesCommensaux;
  const tresoreriePropre = mockIndicators.tresorerie - totalDettes;

  // Pie data
  const pieAvant = [
    { name: "FDR mobilisable", value: mockIndicators.fdr, fill: "hsl(215, 70%, 45%)" },
    { name: "BFR", value: mockIndicators.bfr, fill: "hsl(38, 92%, 50%)" },
  ];

  const pieApres = [
    { name: "FDR résiduel", value: Math.max(fdrApres, 0), fill: "hsl(160, 45%, 45%)" },
    { name: "Prélèvement", value: montantPrelevement, fill: "hsl(0, 70%, 55%)" },
    { name: "BFR", value: mockIndicators.bfr, fill: "hsl(38, 92%, 50%)" },
  ];

  const isPrelevementViable = joursApres >= 30;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Fonds de roulement</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyse FDR / BFR / Trésorerie / Autonomie financière — Exercice 2023</p>
        </div>
      </motion.div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="FDR" value={formatCurrency(mockIndicators.fdr)} trend={3.3} icon={Wallet} variant="primary" />
        <KpiCard title="BFR" value={formatCurrency(mockIndicators.bfr)} trend={4.6} icon={ArrowDownUp} variant="warning" />
        <KpiCard title="Trésorerie nette" value={formatCurrency(mockIndicators.tresorerie)} trend={2.7} icon={Landmark} variant="success" />
        <KpiCard title="Trésorerie propre" value={formatCurrency(tresoreriePropre)} subtitle="Autonomie financière" icon={ShieldCheck} variant={tresoreriePropre > 0 ? "success" : "warning"} />
      </div>

      {/* Autonomie financière — détail */}
      <Card className="shadow-card border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Autonomie financière (Trésorerie propre)</CardTitle>
            <Badge variant={tresoreriePropre > 0 ? "default" : "destructive"} className="text-xs">
              {tresoreriePropre > 0 ? "Positive" : "Négative"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Trésorerie propre = Trésorerie nette − Dettes (subventions + reliquats + avances élèves & commensaux)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trésorerie nette</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(mockIndicators.tresorerie)}</p>
            </div>
            <div className="flex items-center justify-center text-xl text-muted-foreground font-bold">−</div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total dettes</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totalDettes)}</p>
              <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                <p>Subventions : {formatCurrency(mockDettes.subventions)}</p>
                <p>Reliquats : {formatCurrency(mockDettes.reliquatsSubventions)}</p>
                <p>Avances élèves : {formatCurrency(mockDettes.avancesEleves)}</p>
                <p>Avances commensaux : {formatCurrency(mockDettes.avancesCommensaux)}</p>
              </div>
            </div>
            <div className="flex items-center justify-center text-xl text-muted-foreground font-bold">=</div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trésorerie propre</p>
              <p className={`text-lg font-bold ${tresoreriePropre > 0 ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(tresoreriePropre)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Équilibre financier */}
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
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(mockIndicators.bfr + mockIndicators.tresorerie)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ ANALYSE DU PRÉLÈVEMENT — Modèle Académie de Marseille ═══════════════ */}
      <Card className="shadow-card border-2 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Analyse du prélèvement sur Fonds de Roulement
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Modèle rectorat — Document d'aide à la décision pour autorisation de prélèvement
              </p>
            </div>
            <Badge variant="outline" className="text-xs">Exercice 2023</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Montant du prélèvement demandé
              </Label>
              <Input
                type="number"
                value={montantPrelevement}
                onChange={(e) => setMontantPrelevement(Number(e.target.value))}
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prélèvements déjà autorisés (exercice en cours)
              </Label>
              <Input
                type="number"
                value={prelevementsAutorises}
                onChange={(e) => setPrelevementsAutorises(Number(e.target.value))}
                className="text-lg font-bold"
              />
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-[10px] text-muted-foreground uppercase">FDR initial</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(mockIndicators.fdr)}</p>
            </div>
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
              <p className="text-[10px] text-muted-foreground uppercase">Prélèvement demandé</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(montantPrelevement)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-[10px] text-muted-foreground uppercase">FDR résiduel</p>
              <p className={`text-lg font-bold ${fdrApres > 0 ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(fdrApres)}
              </p>
            </div>
            <div className={`rounded-lg p-3 border ${isPrelevementViable ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-destructive/5 border-destructive/10"}`}>
              <p className="text-[10px] text-muted-foreground uppercase">Jours après prélèv.</p>
              <p className={`text-lg font-bold ${isPrelevementViable ? "text-green-600" : "text-destructive"}`}>
                {joursApres} j
              </p>
              <p className="text-[9px] text-muted-foreground">Seuil : 30 j</p>
            </div>
          </div>

          {prelevementsAutorises > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>{formatCurrency(prelevementsAutorises)}</strong> de prélèvements déjà autorisés dans l'exercice en cours.
                Total cumulé si accordé : <strong>{formatCurrency(prelevementsAutorises + montantPrelevement)}</strong>
              </p>
            </div>
          )}

          <Separator />

          {/* Double camembert — Modèle Marseille */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-center">
              Représentation graphique — Avant / Après prélèvement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Avant */}
              <div className="text-center">
                <Badge variant="outline" className="mb-2 text-xs">AVANT prélèvement</Badge>
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <Pie
                      data={pieAvant}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}\n${formatCurrency(value)}`}
                      labelLine
                    >
                      {pieAvant.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </RPieChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-1">
                  FDR : {formatCurrency(mockIndicators.fdr)} — {mockIndicators.joursFonctionnement} jours
                </p>
              </div>

              {/* Après */}
              <div className="text-center">
                <Badge variant={isPrelevementViable ? "default" : "destructive"} className="mb-2 text-xs">
                  APRÈS prélèvement
                </Badge>
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <Pie
                      data={pieApres}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}\n${formatCurrency(value)}`}
                      labelLine
                    >
                      {pieApres.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </RPieChart>
                </ResponsiveContainer>
                <p className={`text-xs mt-1 ${isPrelevementViable ? "text-muted-foreground" : "text-destructive font-semibold"}`}>
                  FDR résiduel : {formatCurrency(fdrApres)} — {joursApres} jours
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Avis / Diagnostic automatique */}
          <div className={`p-4 rounded-lg border-l-4 ${isPrelevementViable ? "border-l-green-500 bg-green-50 dark:bg-green-950/20" : "border-l-destructive bg-destructive/5"}`}>
            <h4 className="text-sm font-bold mb-2">
              {isPrelevementViable ? "✅ Avis favorable" : "⚠️ Avis réservé"}
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {isPrelevementViable ? (
                <>
                  <p>Le prélèvement de <strong className="text-foreground">{formatCurrency(montantPrelevement)}</strong> laisse un FDR résiduel de <strong className="text-foreground">{formatCurrency(fdrApres)}</strong> couvrant <strong className="text-foreground">{joursApres} jours</strong> de fonctionnement (seuil minimal : 30 jours).</p>
                  <p>La trésorerie propre de l'établissement s'élève à <strong className="text-foreground">{formatCurrency(tresoreriePropre)}</strong>, confirmant une autonomie financière suffisante.</p>
                </>
              ) : (
                <>
                  <p>Le prélèvement de <strong className="text-foreground">{formatCurrency(montantPrelevement)}</strong> ramènerait le FDR à <strong className="text-destructive">{formatCurrency(fdrApres)}</strong>, soit seulement <strong className="text-destructive">{joursApres} jours</strong> de fonctionnement (en-dessous du seuil de 30 jours).</p>
                  <p>Il est recommandé de <strong>réduire le montant du prélèvement</strong> ou de <strong>différer l'opération</strong> afin de préserver l'équilibre financier.</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Évolution pluriannuelle */}
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

      {/* Diagnostic global */}
      <Card className="shadow-card border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Diagnostic global</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✅ Le fonds de roulement est <strong className="text-foreground">positif</strong> à {formatCurrency(mockIndicators.fdr)}, couvrant <strong className="text-foreground">{mockIndicators.joursFonctionnement} jours</strong> de fonctionnement.</p>
          <p>✅ La trésorerie nette est positive à {formatCurrency(mockIndicators.tresorerie)}.</p>
          <p>{tresoreriePropre > 0 ? "✅" : "⚠️"} La trésorerie propre (autonomie financière) est de <strong className="text-foreground">{formatCurrency(tresoreriePropre)}</strong> après déduction des dettes ({formatCurrency(totalDettes)}).</p>
          <p>⚠️ Le BFR progresse de +4.6%, surveiller l'évolution des créances sur usagers.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingCapital;
