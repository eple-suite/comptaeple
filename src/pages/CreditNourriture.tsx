import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Fuel, Target, AlertTriangle, CheckCircle, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

const CreditNourriture = () => {
  // --- Paramètres du trimestre ---
  const [repasPrevisionnels, setRepasPrevisionnels] = useState(28000); // Repas prévus pour le trimestre
  const [repasServis, setRepasServis] = useState(18200);               // Repas déjà servis
  const [budgetInitial, setBudgetInitial] = useState(142000);          // Crédits ouverts (recettes affectées SRH)
  const [depensesRealisees, setDepensesRealisees] = useState(89500);   // Dépenses déjà engagées/mandatées

  // --- Coût unitaire constaté ---
  const coutParRepas = repasServis > 0 ? depensesRealisees / repasServis : 0;

  // --- Calculs clés (la "jauge") ---
  const budgetRestant = budgetInitial - depensesRealisees;
  const repasRestants = repasPrevisionnels - repasServis;
  const budgetNecessaire = repasRestants * coutParRepas;
  const repasFinancables = coutParRepas > 0 ? Math.floor(budgetRestant / coutParRepas) : 0;
  const ecart = budgetRestant - budgetNecessaire; // positif = excédent, négatif = insuffisance
  const tauxCouverture = budgetNecessaire > 0 ? (budgetRestant / budgetNecessaire) * 100 : 100;
  const tauxConsommation = budgetInitial > 0 ? (depensesRealisees / budgetInitial) * 100 : 0;
  const tauxAvancement = repasPrevisionnels > 0 ? (repasServis / repasPrevisionnels) * 100 : 0;

  const peutFinirTrimestre = ecart >= 0;

  // --- Données pour le graphe mensuel ---
  const moisData = useMemo(() => [
    { mois: "Mois 1", repas: 6200, depenses: 30100 },
    { mois: "Mois 2", repas: 6500, depenses: 31850 },
    { mois: "Mois 3", repas: 5500, depenses: 27550 },
    { mois: "Restant", repas: repasRestants, depenses: budgetNecessaire },
  ], [repasRestants, budgetNecessaire]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Crédit nourriture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projection trimestrielle — Puis-je assurer les repas jusqu'à la fin du trimestre ?
        </p>
      </motion.div>

      {/* === VERDICT PRINCIPAL === */}
      <Card className={`shadow-card border-l-4 ${peutFinirTrimestre ? "border-l-secondary" : "border-l-destructive"}`}>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            {peutFinirTrimestre ? (
              <CheckCircle className="h-10 w-10 text-secondary shrink-0" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-destructive shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold font-display">
                {peutFinirTrimestre
                  ? "✅ Le budget est suffisant pour terminer le trimestre"
                  : "⚠️ Budget insuffisant pour couvrir les repas restants"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {peutFinirTrimestre
                  ? `Au rythme actuel de ${coutParRepas.toFixed(2)} €/repas, vous pouvez financer ${repasFinancables.toLocaleString("fr-FR")} repas. Il en reste ${repasRestants.toLocaleString("fr-FR")} à servir. Marge : ${formatCurrency(ecart)}.`
                  : `Au rythme actuel de ${coutParRepas.toFixed(2)} €/repas, il manque ${formatCurrency(Math.abs(ecart))} pour couvrir les ${repasRestants.toLocaleString("fr-FR")} repas restants.`}
              </p>
            </div>
            <Badge variant={peutFinirTrimestre ? "secondary" : "destructive"} className="text-base px-4 py-1 shrink-0">
              {tauxCouverture.toFixed(0)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* === KPI === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Budget restant" value={formatCurrency(budgetRestant)} icon={Fuel} variant={budgetRestant > 0 ? "primary" : "destructive"} />
        <KpiCard title="Coût constaté / repas" value={`${coutParRepas.toFixed(2)} €`} icon={UtensilsCrossed} variant="default" />
        <KpiCard title="Repas encore finançables" value={repasFinancables.toLocaleString("fr-FR")} icon={Target} variant={repasFinancables >= repasRestants ? "success" : "destructive"} />
        <KpiCard title="Repas restants à servir" value={repasRestants.toLocaleString("fr-FR")} icon={Calendar} variant="default" />
      </div>

      {/* === JAUGE DE CARBURANT === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Fuel className="h-4 w-4" /> Jauge budgétaire du trimestre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Budget consommé */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Budget consommé</span>
                <span className="font-mono font-semibold">{tauxConsommation.toFixed(1)}%</span>
              </div>
              <Progress value={tauxConsommation} className="h-3" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Dépensé : {formatCurrency(depensesRealisees)}</span>
                <span>Budget : {formatCurrency(budgetInitial)}</span>
              </div>
            </div>

            {/* Repas servis */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Repas servis</span>
                <span className="font-mono font-semibold">{tauxAvancement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxAvancement} className="h-3" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Servis : {repasServis.toLocaleString("fr-FR")}</span>
                <span>Prévus : {repasPrevisionnels.toLocaleString("fr-FR")}</span>
              </div>
            </div>

            {/* Comparaison visuelle */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget disponible</span>
                <span className="font-mono font-bold">{formatCurrency(budgetRestant)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Coût estimé des repas restants</span>
                <span className="font-mono font-bold">{formatCurrency(budgetNecessaire)}</span>
              </div>
              <hr className="border-border" />
              <div className={`flex justify-between text-sm font-bold ${peutFinirTrimestre ? "text-secondary" : "text-destructive"}`}>
                <span>{peutFinirTrimestre ? "Marge prévisionnelle" : "Insuffisance prévisionnelle"}</span>
                <span className="font-mono">{peutFinirTrimestre ? "+" : ""}{formatCurrency(ecart)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === PARAMÈTRES === */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Paramètres du trimestre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Repas prévus (trimestre)</Label>
                <Input type="number" value={repasPrevisionnels} onChange={(e) => setRepasPrevisionnels(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Repas déjà servis</Label>
                <Input type="number" value={repasServis} onChange={(e) => setRepasServis(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Budget ouvert (€)</Label>
                <Input type="number" value={budgetInitial} onChange={(e) => setBudgetInitial(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Dépenses réalisées (€)</Label>
                <Input type="number" value={depensesRealisees} onChange={(e) => setDepensesRealisees(Number(e.target.value))} />
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Synthèse calculée</p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Coût constaté / repas</span>
                <span className="font-mono font-semibold text-right">{coutParRepas.toFixed(2)} €</span>
                <span className="text-muted-foreground">Repas restants</span>
                <span className="font-mono font-semibold text-right">{repasRestants.toLocaleString("fr-FR")}</span>
                <span className="text-muted-foreground">Budget nécessaire</span>
                <span className="font-mono font-semibold text-right">{formatCurrency(budgetNecessaire)}</span>
                <span className="text-muted-foreground">Repas finançables</span>
                <span className={`font-mono font-semibold text-right ${repasFinancables >= repasRestants ? "text-secondary" : "text-destructive"}`}>
                  {repasFinancables.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === GRAPHE MENSUEL === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Consommation mensuelle vs projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis yAxisId="repas" orientation="left" fontSize={12} />
              <YAxis yAxisId="euros" orientation="right" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number, name: string) => [
                name === "repas" ? value.toLocaleString("fr-FR") : formatCurrency(value),
                name === "repas" ? "Repas" : "Dépenses"
              ]} />
              <Bar yAxisId="repas" dataKey="repas" name="repas" radius={[4, 4, 0, 0]}>
                {moisData.map((entry, index) => (
                  <Cell key={index} fill={index === moisData.length - 1 ? "hsl(215, 70%, 45%)" : "hsl(215, 60%, 65%)"} opacity={index === moisData.length - 1 ? 0.5 : 1} />
                ))}
              </Bar>
              <Bar yAxisId="euros" dataKey="depenses" name="depenses" radius={[4, 4, 0, 0]}>
                {moisData.map((entry, index) => (
                  <Cell key={index} fill={index === moisData.length - 1 ? "hsl(38, 92%, 50%)" : "hsl(38, 80%, 60%)"} opacity={index === moisData.length - 1 ? 0.5 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground text-center mt-1">Les barres semi-transparentes représentent la projection pour le reste du trimestre</p>
        </CardContent>
      </Card>

      {/* === ANALYSE === */}
      <Card className={`shadow-card border-l-4 ${peutFinirTrimestre ? "border-l-secondary" : "border-l-destructive"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Analyse prévisionnelle</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>🚗 <strong className="text-foreground">Analogie :</strong> Votre « réservoir » contient <strong className="text-foreground">{formatCurrency(budgetRestant)}</strong>. Votre « consommation » est de <strong className="text-foreground">{coutParRepas.toFixed(2)} €/repas</strong>. La « distance » restante est de <strong className="text-foreground">{repasRestants.toLocaleString("fr-FR")} repas</strong>.</p>
          <p>
            {peutFinirTrimestre
              ? `✅ Vous pouvez financer ${repasFinancables.toLocaleString("fr-FR")} repas, soit ${(repasFinancables - repasRestants).toLocaleString("fr-FR")} de plus que nécessaire. La marge de sécurité est de ${formatCurrency(ecart)}.`
              : `⚠️ Vous ne pouvez financer que ${repasFinancables.toLocaleString("fr-FR")} repas sur les ${repasRestants.toLocaleString("fr-FR")} restants. Il manque ${formatCurrency(Math.abs(ecart))} pour couvrir le trimestre.`}
          </p>
          {!peutFinirTrimestre && (
            <p>💡 <strong className="text-foreground">Pistes :</strong> Réduire le coût denrées par repas, demander un complément de crédits, ou ajuster le nombre de repas prévisionnels.</p>
          )}
          <p>📊 Le taux de consommation budgétaire est de <strong className="text-foreground">{tauxConsommation.toFixed(1)}%</strong> pour un avancement de <strong className="text-foreground">{tauxAvancement.toFixed(1)}%</strong> des repas.
            {tauxConsommation > tauxAvancement + 5 && " ⚠️ La consommation budgétaire avance plus vite que les repas servis."}
            {tauxConsommation < tauxAvancement - 5 && " ✅ La consommation budgétaire est en avance par rapport aux repas servis, signe de bonne maîtrise."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditNourriture;
