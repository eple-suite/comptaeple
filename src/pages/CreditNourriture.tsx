import { useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Fuel, Target, AlertTriangle, CheckCircle, TrendingDown, Calendar, Download, Printer, Users, Info, BarChart3, FileSpreadsheet, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend } from "recharts";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import { WordExportButton } from "@/components/WordExportButton";
import autoTable from "jspdf-autotable";
import CreditNourritureImport from "./credit-nourriture/CreditNourritureImport";
import { useCreditNourritureStore } from "@/lib/credit-nourriture/store";

// ═══════ Structure SRH ═══════
interface EffectifsSRH {
  dp: number;       // Demi-pensionnaires
  internes: number;  // Internes
  commensaux: number; // Commensaux (personnels)
  total: number;
}

interface CoutRepas {
  denrees: number;           // Coût denrées alimentaires (compte 60)
  chargesIndirectes: number;  // Personnel, énergie, entretien (charges SRH hors denrées)
  totalCoutRevient: number;
}

const CreditNourriture = () => {
  // --- Paramètres du trimestre (persistés localStorage) ---
  const repasPrevisionnels = useCreditNourritureStore(s => s.repasPrevisionnels);
  const setRepasPrevisionnels = useCreditNourritureStore(s => s.setRepasPrevisionnels);
  const repasServis = useCreditNourritureStore(s => s.repasServis);
  const setRepasServis = useCreditNourritureStore(s => s.setRepasServis);
  const budgetInitial = useCreditNourritureStore(s => s.budgetInitial);
  const setBudgetInitial = useCreditNourritureStore(s => s.setBudgetInitial);
  const depensesRealisees = useCreditNourritureStore(s => s.depensesRealisees);
  const setDepensesRealisees = useCreditNourritureStore(s => s.setDepensesRealisees);

  // --- Effectifs SRH ---
  const effectifsDP = useCreditNourritureStore(s => s.effectifsDP);
  const setEffectifsDP = useCreditNourritureStore(s => s.setEffectifsDP);
  const effectifsInternes = useCreditNourritureStore(s => s.effectifsInternes);
  const setEffectifsInternes = useCreditNourritureStore(s => s.setEffectifsInternes);
  const effectifsCommensaux = useCreditNourritureStore(s => s.effectifsCommensaux);
  const setEffectifsCommensaux = useCreditNourritureStore(s => s.setEffectifsCommensaux);
  const effectifsTotal = effectifsDP + effectifsInternes + effectifsCommensaux;

  // --- Coûts détaillés (denrées vs charges indirectes) ---
  const coutDenrees = useCreditNourritureStore(s => s.coutDenrees); // Achats denrées uniquement (cpt 60)
  const setCoutDenrees = useCreditNourritureStore(s => s.setCoutDenrees);
  const chargesIndirectes = useCreditNourritureStore(s => s.chargesIndirectes); // Personnel SRH, énergie, entretien
  const setChargesIndirectes = useCreditNourritureStore(s => s.setChargesIndirectes);

  // --- Barème académique de référence ---
  const baremeAcademique = { dp: 2.15, interne: 6.10, commensal: 3.80 };

  // --- Coût unitaire constaté ---
  const coutParRepas = repasServis > 0 ? depensesRealisees / repasServis : 0;
  const coutDenreesParRepas = repasServis > 0 ? coutDenrees / repasServis : 0;
  const coutRevientComplet = repasServis > 0 ? (coutDenrees + chargesIndirectes) / repasServis : 0;

  // --- Calcul prix de revient par catégorie (pondéré) ---
  // Internes mangent 3 repas/jour (coefficient 3), DP 1 repas, commensaux 1 repas
  const repasEquivalentsDP = effectifsDP * 1;
  const repasEquivalentsInternes = effectifsInternes * 3;
  const repasEquivalentsCommensaux = effectifsCommensaux * 1;
  const totalRepasEquivalents = repasEquivalentsDP + repasEquivalentsInternes + repasEquivalentsCommensaux;
  const partDP = totalRepasEquivalents > 0 ? repasEquivalentsDP / totalRepasEquivalents : 0;
  const partInternes = totalRepasEquivalents > 0 ? repasEquivalentsInternes / totalRepasEquivalents : 0;
  const partCommensaux = totalRepasEquivalents > 0 ? repasEquivalentsCommensaux / totalRepasEquivalents : 0;

  // --- Calculs clés (la "jauge") ---
  const budgetRestant = budgetInitial - depensesRealisees;
  const repasRestants = repasPrevisionnels - repasServis;
  const budgetNecessaire = repasRestants * coutParRepas;
  const repasFinancables = coutParRepas > 0 ? Math.floor(budgetRestant / coutParRepas) : 0;
  const ecart = budgetRestant - budgetNecessaire;
  const tauxCouverture = budgetNecessaire > 0 ? (budgetRestant / budgetNecessaire) * 100 : 100;
  const tauxConsommation = budgetInitial > 0 ? (depensesRealisees / budgetInitial) * 100 : 0;
  const tauxAvancement = repasPrevisionnels > 0 ? (repasServis / repasPrevisionnels) * 100 : 0;

  const peutFinirTrimestre = ecart >= 0;

  // --- Comparaison barème académique ---
  const ecartBaremeDP = coutDenreesParRepas - baremeAcademique.dp;
  const ecartBaremeInterne = (coutDenreesParRepas * 3) - baremeAcademique.interne;

  const exportPDF = (print = false) => {
    const doc = createStyledPDF({
      orientation: "portrait",
      title: "Crédit nourriture — Service A2 (SRH)",
      subtitle: `EPLE — ${new Date().toLocaleDateString("fr-FR")}`,
    });
    let y = 48;
    const margin = 14;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(peutFinirTrimestre ? "VERDICT : Budget suffisant" : "VERDICT : Budget insuffisant", margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Budget ouvert (SRH — Service A2)", formatCurrency(budgetInitial)],
        ["Dépenses réalisées", formatCurrency(depensesRealisees)],
        ["Budget restant", formatCurrency(budgetRestant)],
        ["Repas prévus (trimestre)", repasPrevisionnels.toLocaleString("fr-FR")],
        ["Repas déjà servis", repasServis.toLocaleString("fr-FR")],
        ["Coût denrées / repas", `${coutDenreesParRepas.toFixed(2)} €`],
        ["Coût de revient complet / repas", `${coutRevientComplet.toFixed(2)} €`],
        ["Barème académique DP", `${baremeAcademique.dp.toFixed(2)} €`],
        ["Écart / barème", `${ecartBaremeDP >= 0 ? "+" : ""}${ecartBaremeDP.toFixed(2)} €`],
        ["Effectifs DP / Internes / Commensaux", `${effectifsDP} / ${effectifsInternes} / ${effectifsCommensaux}`],
        [peutFinirTrimestre ? "Marge prévisionnelle" : "Insuffisance prévisionnelle", formatCurrency(ecart)],
      ],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" } },
    });

    if (print) {
      printPDF(doc);
    } else {
      savePDF(doc, `credit_nourriture_${new Date().toISOString().split("T")[0]}.pdf`);
    }
  };

  // --- Données graphe mensuel ---
  const moisData = useMemo(() => [
    { mois: "Mois 1", repas: 6200, depenses: 30100, denrees: 20500 },
    { mois: "Mois 2", repas: 6500, depenses: 31850, denrees: 21800 },
    { mois: "Mois 3", repas: 5500, depenses: 27550, denrees: 19700 },
    { mois: "Restant", repas: repasRestants, depenses: budgetNecessaire, denrees: repasRestants * coutDenreesParRepas },
  ], [repasRestants, budgetNecessaire, coutDenreesParRepas]);

  // --- Données prix de revient par catégorie ---
  const prixRevientData = useMemo(() => [
    { categorie: "Demi-pensionnaires", effectif: effectifsDP, coutDenrees: coutDenreesParRepas, coutComplet: coutRevientComplet, bareme: baremeAcademique.dp, coefficient: 1 },
    { categorie: "Internes", effectif: effectifsInternes, coutDenrees: coutDenreesParRepas * 3, coutComplet: coutRevientComplet * 3, bareme: baremeAcademique.interne, coefficient: 3 },
    { categorie: "Commensaux", effectif: effectifsCommensaux, coutDenrees: coutDenreesParRepas, coutComplet: coutRevientComplet, bareme: baremeAcademique.commensal, coefficient: 1 },
  ], [effectifsDP, effectifsInternes, effectifsCommensaux, coutDenreesParRepas, coutRevientComplet]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Crédit nourriture — Service A2 (SRH)</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Import auto Op@le • Calendrier scolaire Guadeloupe • Conforme M9-6
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="annuel">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="annuel">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Projection annuelle (import Op@le)
          </TabsTrigger>
          <TabsTrigger value="trimestre">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Saisie trimestrielle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annuel" className="mt-6">
          <CreditNourritureImport />
        </TabsContent>

        <TabsContent value="trimestre" className="mt-6 space-y-6">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => exportPDF(true)}>
              <Printer className="h-4 w-4 mr-1" /> Imprimer
            </Button>
            <Button size="sm" className="gradient-primary border-0 shadow-primary rounded-lg" onClick={() => exportPDF(false)}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <WordExportButton
              title="Crédit nourriture — Service A2 (SRH)"
              subtitle={`Trimestre — ${new Date().toLocaleDateString("fr-FR")}`}
              filename={`credit_nourriture_${new Date().toISOString().split("T")[0]}`}
              sections={[
                { kind: "callout", tone: peutFinirTrimestre ? "success" : "danger", title: peutFinirTrimestre ? "Budget suffisant" : "Budget insuffisant", text: peutFinirTrimestre
                  ? `Au rythme actuel de ${coutParRepas.toFixed(2)} €/repas, le budget couvre les ${repasRestants.toLocaleString("fr-FR")} repas restants. Marge prévisionnelle : ${formatCurrency(ecart)}.`
                  : `Au rythme actuel de ${coutParRepas.toFixed(2)} €/repas, il manque ${formatCurrency(Math.abs(ecart))} pour terminer le trimestre.` },
                { kind: "heading", text: "Indicateurs clés", level: 1 },
                { kind: "kpis", items: [
                  { label: "Budget restant", value: formatCurrency(budgetRestant) },
                  { label: "Coût denrées / repas", value: `${coutDenreesParRepas.toFixed(2)} €`, sub: `Barème acad. : ${baremeAcademique.dp.toFixed(2)} €` },
                  { label: "Coût de revient complet", value: `${coutRevientComplet.toFixed(2)} €` },
                  { label: "Effectif SRH", value: `${effectifsTotal}`, sub: `${effectifsDP} DP / ${effectifsInternes} Int. / ${effectifsCommensaux} Com.` },
                ] },
                { kind: "heading", text: "Synthèse budgétaire", level: 2 },
                { kind: "table", head: ["Indicateur", "Valeur"], columnWidthsPct: [60, 40], rows: [
                  ["Budget ouvert (SRH — Service A2)", formatCurrency(budgetInitial)],
                  ["Dépenses réalisées", formatCurrency(depensesRealisees)],
                  ["Budget restant", formatCurrency(budgetRestant)],
                  ["Repas prévus (trimestre)", repasPrevisionnels.toLocaleString("fr-FR")],
                  ["Repas déjà servis", repasServis.toLocaleString("fr-FR")],
                  ["Coût denrées / repas", `${coutDenreesParRepas.toFixed(2)} €`],
                  ["Coût de revient complet / repas", `${coutRevientComplet.toFixed(2)} €`],
                  ["Barème académique DP", `${baremeAcademique.dp.toFixed(2)} €`],
                  ["Écart / barème", `${ecartBaremeDP >= 0 ? "+" : ""}${ecartBaremeDP.toFixed(2)} €`],
                  [peutFinirTrimestre ? "Marge prévisionnelle" : "Insuffisance prévisionnelle", formatCurrency(ecart)],
                ] },
                { kind: "heading", text: "Prix de revient différencié", level: 2 },
                { kind: "table", head: ["Catégorie", "Effectif", "Coeff.", "Coût denrées/j", "Coût complet/j", "Barème acad."], columnWidthsPct: [25, 15, 10, 17, 17, 16], rows: prixRevientData.map(p => [
                  p.categorie, String(p.effectif), `×${p.coefficient}`, `${p.coutDenrees.toFixed(2)} €`, `${p.coutComplet.toFixed(2)} €`, `${p.bareme.toFixed(2)} €`,
                ]) },
                { kind: "heading", text: "Analyse réglementaire", level: 2 },
                { kind: "bullets", items: [
                  "Service A2 : crédits non fongibles avec les autres services",
                  "Coût denrées (cpt 60) ≠ coût de revient complet (denrées + charges indirectes SRH)",
                  "Coefficient internat : un interne consomme ~3 repas/jour",
                  "Tarif commensaux : doit couvrir au minimum le coût de revient complet",
                  "DBM possible en cas d'insuffisance — soumettre au CA",
                ] },
              ]}
            />
          </div>

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
                  ? `Au rythme actuel de ${coutParRepas.toFixed(2)} €/repas (dont ${coutDenreesParRepas.toFixed(2)} € de denrées), vous pouvez financer ${repasFinancables.toLocaleString("fr-FR")} repas. Marge : ${formatCurrency(ecart)}.`
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
        <KpiCard title="Coût denrées / repas" value={`${coutDenreesParRepas.toFixed(2)} €`} subtitle={`Barème acad. : ${baremeAcademique.dp.toFixed(2)} €`} icon={UtensilsCrossed} variant={ecartBaremeDP <= 0.10 ? "success" : ecartBaremeDP <= 0.30 ? "warning" : "destructive"} />
        <KpiCard title="Coût de revient complet" value={`${coutRevientComplet.toFixed(2)} €`} subtitle="Denrées + charges indirectes" icon={BarChart3} variant="default" />
        <KpiCard title="Effectif SRH" value={effectifsTotal.toString()} subtitle={`${effectifsDP} DP / ${effectifsInternes} Int. / ${effectifsCommensaux} Com.`} icon={Users} variant="default" />
      </div>

      {/* === PRIX DE REVIENT DIFFÉRENCIÉ === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Prix de revient différencié — DP / Internes / Commensaux
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Comparaison avec le barème académique — Coeff. interne = 3 repas/jour
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-center">Effectif</TableHead>
                <TableHead className="text-center">Coeff.</TableHead>
                <TableHead className="text-right">Coût denrées/j</TableHead>
                <TableHead className="text-right">Coût complet/j</TableHead>
                <TableHead className="text-right">Barème acad.</TableHead>
                <TableHead className="text-center">Écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prixRevientData.map(p => {
                const ecart = p.coutDenrees - p.bareme;
                return (
                  <TableRow key={p.categorie}>
                    <TableCell className="font-medium text-sm">{p.categorie}</TableCell>
                    <TableCell className="text-center font-mono">{p.effectif}</TableCell>
                    <TableCell className="text-center font-mono">×{p.coefficient}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{p.coutDenrees.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-mono">{p.coutComplet.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{p.bareme.toFixed(2)} €</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] border-0 ${
                        Math.abs(ecart) <= 0.10 ? "bg-success/10 text-success" :
                        ecart > 0 ? "bg-destructive/10 text-destructive" :
                        "bg-success/10 text-success"
                      }`}>
                        {ecart >= 0 ? "+" : ""}{ecart.toFixed(2)} €
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === DISTINCTION DENRÉES / CHARGES INDIRECTES === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Fuel className="h-4 w-4" /> Jauge budgétaire du trimestre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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

        {/* === PARAMÈTRES ENRICHIS === */}
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
                <Label className="text-xs">Budget ouvert SRH (€)</Label>
                <Input type="number" value={budgetInitial} onChange={(e) => setBudgetInitial(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Dépenses réalisées (€)</Label>
                <Input type="number" value={depensesRealisees} onChange={(e) => setDepensesRealisees(Number(e.target.value))} />
              </div>
            </div>
            <Separator />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Ventilation des coûts</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Coût denrées (cpt 60) (€)</Label>
                <Input type="number" value={coutDenrees} onChange={(e) => setCoutDenrees(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Charges indirectes SRH (€)</Label>
                <Input type="number" value={chargesIndirectes} onChange={(e) => setChargesIndirectes(Number(e.target.value))} />
              </div>
            </div>
            <Separator />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Effectifs SRH</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">DP</Label>
                <Input type="number" value={effectifsDP} onChange={(e) => setEffectifsDP(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Internes</Label>
                <Input type="number" value={effectifsInternes} onChange={(e) => setEffectifsInternes(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Commensaux</Label>
                <Input type="number" value={effectifsCommensaux} onChange={(e) => setEffectifsCommensaux(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === GRAPHE MENSUEL === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Consommation mensuelle — Denrées vs Coût complet</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis yAxisId="euros" orientation="left" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="repas" orientation="right" fontSize={12} />
              <Tooltip formatter={(value: number, name: string) => [
                name === "repas" ? value.toLocaleString("fr-FR") : formatCurrency(value),
                name === "repas" ? "Repas" : name === "denrees" ? "Denrées" : "Dépenses totales"
              ]} />
              <Legend />
              <Bar yAxisId="euros" dataKey="denrees" name="Denrées (cpt 60)" radius={[4, 4, 0, 0]}>
                {moisData.map((_, index) => (
                  <Cell key={index} fill="hsl(160, 45%, 45%)" opacity={index === moisData.length - 1 ? 0.5 : 1} />
                ))}
              </Bar>
              <Bar yAxisId="euros" dataKey="depenses" name="Coût complet" radius={[4, 4, 0, 0]}>
                {moisData.map((_, index) => (
                  <Cell key={index} fill="hsl(38, 92%, 50%)" opacity={index === moisData.length - 1 ? 0.5 : 1} />
                ))}
              </Bar>
              <Bar yAxisId="repas" dataKey="repas" name="Repas" radius={[4, 4, 0, 0]}>
                {moisData.map((_, index) => (
                  <Cell key={index} fill="hsl(215, 70%, 45%)" opacity={index === moisData.length - 1 ? 0.5 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground text-center mt-1">Les barres semi-transparentes représentent la projection</p>
        </CardContent>
      </Card>

      {/* === ANALYSE ENRICHIE === */}
      <Card className={`shadow-card border-l-4 ${peutFinirTrimestre ? "border-l-secondary" : "border-l-destructive"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Analyse prévisionnelle</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>🍽️ <strong className="text-foreground">Coût denrées :</strong> Le coût denrées constaté est de <strong className="text-foreground">{coutDenreesParRepas.toFixed(2)} €/repas</strong> (barème académique : {baremeAcademique.dp.toFixed(2)} €). 
            {ecartBaremeDP <= 0.05 && " ✅ Conforme au barème académique."}
            {ecartBaremeDP > 0.05 && ecartBaremeDP <= 0.30 && ` ⚠️ Écart de +${ecartBaremeDP.toFixed(2)} € par rapport au barème.`}
            {ecartBaremeDP > 0.30 && ` 🔴 Dépassement significatif de +${ecartBaremeDP.toFixed(2)} € — nécessite une analyse des approvisionnements.`}
          </p>
          <p>📊 <strong className="text-foreground">Charges indirectes :</strong> Les charges indirectes SRH (personnel, énergie, entretien) représentent <strong className="text-foreground">{formatCurrency(chargesIndirectes)}</strong>, soit <strong className="text-foreground">{(chargesIndirectes / depensesRealisees * 100).toFixed(1)}%</strong> du coût total. Le coût de revient complet est de <strong className="text-foreground">{coutRevientComplet.toFixed(2)} €/repas</strong>.</p>
          <p>
            {peutFinirTrimestre
              ? `✅ Budget suffisant — marge de ${formatCurrency(ecart)} (${repasFinancables.toLocaleString("fr-FR")} repas finançables pour ${repasRestants.toLocaleString("fr-FR")} à servir).`
              : `⚠️ Il manque ${formatCurrency(Math.abs(ecart))} pour couvrir les ${repasRestants.toLocaleString("fr-FR")} repas restants.`}
          </p>
          {!peutFinirTrimestre && (
            <p>💡 <strong className="text-foreground">Pistes :</strong> Réduire le coût denrées (négociation fournisseurs, groupements d'achat), demander un complément de crédits au CA (DBM), ou ajuster les prévisions.</p>
          )}
          <p>👥 <strong className="text-foreground">Effectifs :</strong> {effectifsDP} demi-pensionnaires, {effectifsInternes} internes (coeff. ×3), {effectifsCommensaux} commensaux. Répartition des repas-équivalents : DP {(partDP * 100).toFixed(0)}% / Int. {(partInternes * 100).toFixed(0)}% / Com. {(partCommensaux * 100).toFixed(0)}%.</p>
        </CardContent>
      </Card>

      {/* === RAPPELS RÉGLEMENTAIRES === */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> Rappels réglementaires — Crédit nourriture
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• <strong className="text-foreground">Service A2 :</strong> Le crédit nourriture est une recette affectée au service de restauration et d'hébergement (SRH). Les crédits sont non fongibles avec les autres services.</p>
          <p>• <strong className="text-foreground">Coût denrées vs coût de revient :</strong> Le coût denrées (compte 60) ne comprend que les achats alimentaires. Le coût de revient complet inclut les charges de personnel SRH, l'énergie et l'entretien.</p>
          <p>• <strong className="text-foreground">Enquête effectifs SRH :</strong> L'enquête effectifs/restauration est transmise à la collectivité et au rectorat en octobre et mars. Elle sert à calculer les dotations et ajuster les tarifs.</p>
          <p>• <strong className="text-foreground">Coefficient internat :</strong> Un interne consomme 3 repas par jour (petit-déjeuner, déjeuner, dîner). Le barème académique interne est environ 3× le barème DP.</p>
          <p>• <strong className="text-foreground">Commensaux :</strong> Le tarif des commensaux doit couvrir au minimum le coût de revient complet du repas (denrées + charges). Un tarif inférieur constitue une subvention déguisée.</p>
          <p>• <strong className="text-foreground">DBM :</strong> En cas d'insuffisance du crédit nourriture, une décision budgétaire modificative (DBM) peut être soumise au CA pour compléter les crédits SRH.</p>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditNourriture;
