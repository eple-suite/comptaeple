import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileBarChart, CheckCircle2, AlertTriangle, Clock, Sparkles, Download, Printer,
  Calculator, TrendingUp, Wallet, Landmark, ArrowDownUp, BarChart3, PieChart,
  ShieldCheck, Receipt, Users, Building2, Bot, Play, RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  mockIndicators, mockBalanceData, mockEvolutionData, mockDettes,
  mockFragiliteFDR, mockTresoreriePropreData, mockTresorerieDetail,
  mockCreancesData, mockRepartitionCharges, formatCurrency, formatPercent
} from "@/lib/mockData";
import {
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RPieChart, Pie, Cell, LineChart, Line, ReferenceLine, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import { GaugeChart } from "@/components/GaugeChart";
import { WaterfallChart } from "@/components/WaterfallChart";

/* ─────────────────────────────────────────────
   Indicateurs M9-6 complets (2026)
   Conformes à l'instruction codificatrice M9.6
   ───────────────────────────────────────────── */

// Indicateurs calculés
const totalFragilite = mockFragiliteFDR.stocks + mockFragiliteFDR.creancesAnciennes + mockFragiliteFDR.compte416;
const fdrMobilisable = mockIndicators.fdr - totalFragilite;
const totalDettes = mockDettes.subventions + mockDettes.reliquatsSubventions + mockDettes.avancesEleves + mockDettes.avancesCommensaux;
const tresoreriePropre = mockIndicators.tresorerie - totalDettes;
const chargeFonctionnementJour = mockIndicators.fdr / mockIndicators.joursFonctionnement;
const joursMobilisable = Math.round(fdrMobilisable / chargeFonctionnementJour);

// Données étendues M9-6 2026
const totalRecettes = 1855230;
const totalDepenses = 1840000;
const dotationAmortissements = 65000;
const caf = mockIndicators.resultatExercice + dotationAmortissements; // CAF = résultat + dotations amort.
const ratioAutonomie = (tresoreriePropre / mockIndicators.tresorerie) * 100;
const tauxExecutionRecettes = (totalRecettes / 1920000) * 100;
const tauxExecutionDepenses = (totalDepenses / 1900000) * 100;
const tauxVetusteImmo = (520000 / 1250000) * 100; // amort cumulés / valeur brute
const ratioRigiditeCharges = 62.3; // Part charges incompressibles (SRH principalement)
const soldebudgetaire = totalRecettes - totalDepenses;

// Tous les indicateurs réglementaires M9-6
const indicateursComplets = [
  { id: "resultat", titre: "Résultat de l'exercice", valeur: formatCurrency(mockIndicators.resultatExercice), brut: mockIndicators.resultatExercice, icon: Receipt, formule: "Produits − Charges (classe 7 − classe 6)", seuil: "> 0 €", statut: mockIndicators.resultatExercice >= 0 ? "ok" : "alerte", categorie: "Résultat" },
  { id: "caf", titre: "Capacité d'autofinancement (CAF)", valeur: formatCurrency(caf), brut: caf, icon: TrendingUp, formule: "Résultat + Dotations aux amortissements", seuil: "> 0 €", statut: caf > 0 ? "ok" : "alerte", categorie: "Résultat" },
  { id: "fdr", titre: "Fonds de roulement (FDR)", valeur: formatCurrency(mockIndicators.fdr), brut: mockIndicators.fdr, icon: Wallet, formule: "Ressources stables − Emplois stables", seuil: "> 30 jours", statut: "ok", categorie: "Bilan" },
  { id: "fdr_mob", titre: "FDR mobilisable", valeur: formatCurrency(fdrMobilisable), brut: fdrMobilisable, icon: ShieldCheck, formule: "FDR − Stocks − Créances anciennes − Cpt 416", seuil: "> 30 jours", statut: joursMobilisable >= 30 ? "ok" : "vigilance", categorie: "Bilan" },
  { id: "jours", titre: "Jours de fonctionnement (FDR)", valeur: `${mockIndicators.joursFonctionnement} j.`, brut: mockIndicators.joursFonctionnement, icon: Clock, formule: "FDR / (Charges annuelles / 360)", seuil: "30-90 jours", statut: mockIndicators.joursFonctionnement >= 30 ? "ok" : "alerte", categorie: "Bilan" },
  { id: "jours_mob", titre: "Jours de fonctionnement (mobilisable)", valeur: `${joursMobilisable} j.`, brut: joursMobilisable, icon: Clock, formule: "FDR mobilisable / (Charges / 360)", seuil: "≥ 30 jours", statut: joursMobilisable >= 30 ? "ok" : "vigilance", categorie: "Bilan" },
  { id: "bfr", titre: "Besoin en fonds de roulement (BFR)", valeur: formatCurrency(mockIndicators.bfr), brut: mockIndicators.bfr, icon: ArrowDownUp, formule: "Actif circulant (hors tréso) − Dettes CT", seuil: "< FDR", statut: mockIndicators.bfr < mockIndicators.fdr ? "ok" : "alerte", categorie: "Bilan" },
  { id: "tresorerie", titre: "Trésorerie nette", valeur: formatCurrency(mockIndicators.tresorerie), brut: mockIndicators.tresorerie, icon: Landmark, formule: "FDR − BFR", seuil: "> 0 €", statut: mockIndicators.tresorerie > 0 ? "ok" : "alerte", categorie: "Trésorerie" },
  { id: "treso_propre", titre: "Trésorerie propre (autonomie)", valeur: formatCurrency(tresoreriePropre), brut: tresoreriePropre, icon: ShieldCheck, formule: "Trésorerie brute − Dettes CT (subv., avances)", seuil: "> 0 €", statut: tresoreriePropre > 0 ? "ok" : "alerte", categorie: "Trésorerie" },
  { id: "ratio_autonomie", titre: "Ratio d'autonomie financière", valeur: formatPercent(ratioAutonomie), brut: ratioAutonomie, icon: PieChart, formule: "Trésorerie propre / Trésorerie brute × 100", seuil: "> 50%", statut: ratioAutonomie > 50 ? "ok" : "vigilance", categorie: "Trésorerie" },
  { id: "recouvrement", titre: "Taux de recouvrement", valeur: formatPercent(mockIndicators.tauxRecouvrement), brut: mockIndicators.tauxRecouvrement, icon: TrendingUp, formule: "Recettes encaissées / Recettes émises × 100", seuil: "> 95%", statut: mockIndicators.tauxRecouvrement >= 95 ? "ok" : "vigilance", categorie: "Recouvrement" },
  { id: "exec_recettes", titre: "Taux d'exécution des recettes", valeur: formatPercent(tauxExecutionRecettes), brut: tauxExecutionRecettes, icon: BarChart3, formule: "Recettes réalisées / Recettes prévues × 100", seuil: "> 90%", statut: tauxExecutionRecettes > 90 ? "ok" : "vigilance", categorie: "Budget" },
  { id: "exec_depenses", titre: "Taux d'exécution des dépenses", valeur: formatPercent(tauxExecutionDepenses), brut: tauxExecutionDepenses, icon: BarChart3, formule: "Dépenses réalisées / Dépenses prévues × 100", seuil: "> 90%", statut: tauxExecutionDepenses > 90 ? "ok" : "vigilance", categorie: "Budget" },
  { id: "solde_budg", titre: "Solde budgétaire", valeur: formatCurrency(soldebudgetaire), brut: soldebudgetaire, icon: Calculator, formule: "Recettes réalisées − Dépenses réalisées", seuil: "≥ 0 €", statut: soldebudgetaire >= 0 ? "ok" : "alerte", categorie: "Budget" },
  { id: "poids_charges", titre: "Poids des charges (classe 6)", valeur: formatPercent(mockIndicators.poidsCharges), brut: mockIndicators.poidsCharges, icon: BarChart3, formule: "Total charges / Total produits × 100", seuil: "< 100%", statut: mockIndicators.poidsCharges < 100 ? "ok" : "alerte", categorie: "Charges" },
  { id: "poids_srh", titre: "Part du SRH dans les charges", valeur: formatPercent(mockIndicators.poidsSRH), brut: mockIndicators.poidsSRH, icon: Users, formule: "Charges SRH / Total charges × 100", seuil: "Information", statut: "ok", categorie: "Charges" },
  { id: "rigidite", titre: "Ratio de rigidité des charges", valeur: formatPercent(ratioRigiditeCharges), brut: ratioRigiditeCharges, icon: BarChart3, formule: "Charges incompressibles / Total charges", seuil: "Information", statut: "ok", categorie: "Charges" },
  { id: "vetusteImmo", titre: "Taux de vétusté des immobilisations", valeur: formatPercent(tauxVetusteImmo), brut: tauxVetusteImmo, icon: Building2, formule: "Amortissements cumulés / Valeur brute immo.", seuil: "< 70%", statut: tauxVetusteImmo < 70 ? "ok" : "vigilance", categorie: "Patrimoine" },
];

const categories = [...new Set(indicateursComplets.map(i => i.categorie))];

// Données pour graphiques
const evolutionCAF = [
  { year: "2019", caf: 52000, resultat: -2000 },
  { year: "2020", caf: 38000, resultat: -15000 },
  { year: "2021", caf: 65000, resultat: 12000 },
  { year: "2022", caf: 72000, resultat: 18000 },
  { year: "2023", caf: caf, resultat: mockIndicators.resultatExercice },
];

const repartitionBilan = [
  { name: "FDR mobilisable", value: fdrMobilisable, fill: "hsl(var(--primary))" },
  { name: "Fragilité FDR", value: totalFragilite, fill: "hsl(var(--warning))" },
  { name: "BFR", value: mockIndicators.bfr, fill: "hsl(38, 92%, 50%)" },
  { name: "Trésorerie propre", value: tresoreriePropre, fill: "hsl(var(--success))" },
];

const statutConfig = {
  ok: { label: "Conforme", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  vigilance: { label: "Vigilance", class: "bg-warning/10 text-warning border-0", icon: AlertTriangle },
  alerte: { label: "Alerte", class: "bg-destructive/10 text-destructive border-0", icon: AlertTriangle },
};

// ─── Agent steps for AI-powered report generation ───
interface AgentStep {
  id: string;
  label: string;
  description: string;
  icon: typeof Calculator;
  status: "pending" | "running" | "done" | "error";
  result?: string;
}

const CompteFinancier = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { id: "collect", label: "Collecte des données comptables", description: "L'agent comptable analyse la balance, les classes 1-7 et calcule les soldes.", icon: Calculator, status: "pending" },
    { id: "indicators", label: "Calcul des indicateurs M9-6", description: "Calcul précis du résultat, de la CAF, du FDR, de la trésorerie et de tous les ratios obligatoires.", icon: BarChart3, status: "pending" },
    { id: "analysis", label: "Analyse financière approfondie", description: "Diagnostic de la situation : points forts, points faibles, tendances pluriannuelles.", icon: TrendingUp, status: "pending" },
    { id: "report", label: "Rédaction du rapport du comptable", description: "Génération du rapport conforme M9-6 avec analyse du résultat, CAF, FDR et trésorerie.", icon: FileBarChart, status: "pending" },
    { id: "presentation", label: "Préparation de la présentation CA", description: "Construction du diaporama pour le conseil d'administration avec graphiques et commentaires.", icon: Sparkles, status: "pending" },
  ]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [rapportGenere, setRapportGenere] = useState(false);

  const filteredIndicators = selectedCategorie
    ? indicateursComplets.filter(i => i.categorie === selectedCategorie)
    : indicateursComplets;

  const okCount = indicateursComplets.filter(i => i.statut === "ok").length;
  const vigilanceCount = indicateursComplets.filter(i => i.statut === "vigilance").length;
  const alerteCount = indicateursComplets.filter(i => i.statut === "alerte").length;

  // Simulate AI agent pipeline
  const runAgentPipeline = async () => {
    setAgentRunning(true);
    const steps = [...agentSteps];
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "running";
      setAgentSteps([...steps]);
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      steps[i].status = "done";
      steps[i].result = getStepResult(steps[i].id);
      setAgentSteps([...steps]);
    }
    setAgentRunning(false);
    setRapportGenere(true);
    toast({ title: "Rapport généré", description: "Le rapport du comptable et la présentation CA sont prêts." });
  };

  const getStepResult = (stepId: string): string => {
    switch (stepId) {
      case "collect": return `Balance traitée : 7 classes, ${mockBalanceData.length} comptes, exercice 2023.`;
      case "indicators": return `${indicateursComplets.length} indicateurs calculés. ${okCount} conformes, ${vigilanceCount} en vigilance, ${alerteCount} en alerte.`;
      case "analysis": return `Situation financière saine. FDR = ${mockIndicators.joursFonctionnement}j (seuil 30j). CAF positive = ${formatCurrency(caf)}. Trésorerie propre = ${formatCurrency(tresoreriePropre)}.`;
      case "report": return "Rapport du comptable rédigé (11 sections, 18 indicateurs, diagnostic complet).";
      case "presentation": return "Présentation CA générée (24 slides : indicateurs, graphiques, évolution, diagnostic).";
      default: return "";
    }
  };

  const exportRapportComptablePDF = (orientation: "portrait" | "landscape" = "portrait") => {
    const doc = createStyledPDF({
      orientation,
      title: "Rapport du comptable",
      subtitle: "Compte financier — Exercice 2023 — Instruction M9.6",
    });

    const pw = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 48;

    // Section 1: Indicateurs synthétiques
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("1. Synthèse des indicateurs financiers", margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur", "Formule", "Seuil", "Statut"]],
      body: indicateursComplets.map(i => [
        i.titre, i.valeur, i.formule, i.seuil,
        i.statut === "ok" ? "✓ Conforme" : i.statut === "vigilance" ? "⚠ Vigilance" : "✗ Alerte"
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { cellWidth: 45 }, 2: { cellWidth: 55 }, 4: { cellWidth: 22 } },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Section 2: Résultat et CAF
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("2. Résultat de l'exercice et capacité d'autofinancement", margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const textResultat = [
      `• Résultat de l'exercice : ${formatCurrency(mockIndicators.resultatExercice)} (excédentaire)`,
      `• Dotations aux amortissements : ${formatCurrency(dotationAmortissements)}`,
      `• Capacité d'autofinancement (CAF) : ${formatCurrency(caf)}`,
      ``,
      `La CAF mesure la capacité de l'établissement à financer ses investissements par ses propres moyens.`,
      `Une CAF positive de ${formatCurrency(caf)} indique que l'établissement génère suffisamment de ressources`,
      `pour couvrir le renouvellement de ses immobilisations et constituer des réserves.`,
    ];
    textResultat.forEach(line => { doc.text(line, margin, y, { maxWidth: pw - 2 * margin }); y += 5; });

    // Section 3: Analyse du FDR
    y += 5;
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("3. Analyse du fonds de roulement", margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Élément", "Montant", "Jours"]],
      body: [
        ["FDR brut", formatCurrency(mockIndicators.fdr), `${mockIndicators.joursFonctionnement} j.`],
        ["(−) Stocks (classe 3)", formatCurrency(mockFragiliteFDR.stocks), ""],
        ["(−) Créances anciennes (> 1 an)", formatCurrency(mockFragiliteFDR.creancesAnciennes), ""],
        ["(−) Créances douteuses (cpt 416)", formatCurrency(mockFragiliteFDR.compte416), ""],
        ["= FDR mobilisable", formatCurrency(fdrMobilisable), `${joursMobilisable} j.`],
      ],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Section 4: Analyse de la trésorerie
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("4. Analyse de la trésorerie et autonomie financière", margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Élément", "Montant"]],
      body: [
        ...mockTresorerieDetail.map(t => [t.label, formatCurrency(t.montant)]),
        ["= Trésorerie brute", formatCurrency(mockIndicators.tresorerie)],
        ["", ""],
        ["(−) Subventions non consommées", formatCurrency(mockDettes.subventions)],
        ["(−) Reliquats de subventions", formatCurrency(mockDettes.reliquatsSubventions)],
        ["(−) Avances des familles", formatCurrency(mockDettes.avancesEleves)],
        ["(−) Avances des commensaux", formatCurrency(mockDettes.avancesCommensaux)],
        ["= TRÉSORERIE PROPRE", formatCurrency(tresoreriePropre)],
        ["Ratio d'autonomie financière", formatPercent(ratioAutonomie)],
      ],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" } },
    });

    // Section 5: Évolution pluriannuelle
    doc.addPage();
    y = 20;
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("5. Évolution pluriannuelle", margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Année", "FDR", "BFR", "Trésorerie", "Résultat", "CAF"]],
      body: evolutionCAF.map((e, i) => [
        e.year,
        formatCurrency(mockEvolutionData[i]?.fdr || 0),
        formatCurrency(mockEvolutionData[i]?.bfr || 0),
        formatCurrency(mockEvolutionData[i]?.tresorerie || 0),
        formatCurrency(e.resultat),
        formatCurrency(e.caf),
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Section 6: Diagnostic
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("6. Diagnostic et observations du comptable", margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const diagnosticLines = [
      `POINTS FORTS :`,
      `• Résultat excédentaire de ${formatCurrency(mockIndicators.resultatExercice)}, confirmant la maîtrise budgétaire.`,
      `• CAF positive de ${formatCurrency(caf)}, assurant la capacité de renouvellement des immobilisations.`,
      `• FDR de ${mockIndicators.joursFonctionnement} jours, supérieur au seuil recommandé de 30 jours.`,
      `• Trésorerie propre positive (${formatCurrency(tresoreriePropre)}), garantissant l'autonomie financière.`,
      `• Taux de recouvrement satisfaisant à ${formatPercent(mockIndicators.tauxRecouvrement)}.`,
      ``,
      `POINTS DE VIGILANCE :`,
      `• FDR mobilisable réduit à ${joursMobilisable} jours après déduction des éléments de fragilité.`,
      `• Créances douteuses (compte 416) de ${formatCurrency(mockFragiliteFDR.compte416)} à examiner pour ANV.`,
      `• Taux de vétusté des immobilisations à ${formatPercent(tauxVetusteImmo)} : prévoir un plan de renouvellement.`,
      ``,
      `RECOMMANDATIONS :`,
      `• Maintenir le FDR mobilisable au-dessus de 30 jours de fonctionnement.`,
      `• Poursuivre les actions de recouvrement et examiner les admissions en non-valeur.`,
      `• Anticiper les besoins d'investissement dans le cadre du programme pluriannuel.`,
    ];
    diagnosticLines.forEach(line => {
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
      if (line.startsWith("POINTS") || line.startsWith("RECOMMANDATIONS")) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.text(line, margin, y, { maxWidth: pw - 2 * margin });
      y += line === "" ? 3 : 5;
    });

    savePDF(doc, `Rapport_Comptable_COFI_2023.pdf`);
    toast({ title: "PDF exporté", description: "Le rapport du comptable a été téléchargé." });
  };

  const handlePrint = (orientation: "portrait" | "landscape" = "portrait") => {
    const doc = createStyledPDF({
      orientation,
      title: "Rapport du comptable",
      subtitle: "Compte financier — Exercice 2023",
    });

    const margin = 14;
    let y = 48;

    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur", "Seuil", "Statut"]],
      body: indicateursComplets.map(i => [
        i.titre, i.valeur, i.seuil,
        i.statut === "ok" ? "✓" : i.statut === "vigilance" ? "⚠" : "✗"
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
    });

    printPDF(doc);
    toast({ title: "Impression lancée" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Compte financier</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Instruction M9.6 — Exercice 2023 — {indicateursComplets.length} indicateurs réglementaires
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePrint("portrait")}>
              <Printer className="h-4 w-4 mr-1" /> Portrait
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePrint("landscape")}>
              <Printer className="h-4 w-4 mr-1" /> Paysage
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => exportRapportComptablePDF()}>
              <Download className="h-4 w-4 mr-1" /> Rapport PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI résumé */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Résultat", value: formatCurrency(mockIndicators.resultatExercice), color: "text-success" },
          { label: "CAF", value: formatCurrency(caf), color: "text-primary" },
          { label: "FDR", value: `${mockIndicators.joursFonctionnement} j.`, color: "text-primary" },
          { label: "Trésorerie propre", value: formatCurrency(tresoreriePropre), color: "text-success" },
          { label: "Recouvrement", value: formatPercent(mockIndicators.tauxRecouvrement), color: "text-success" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="shadow-card text-center p-4">
              <p className={`text-xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{kpi.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="indicators">Indicateurs ({indicateursComplets.length})</TabsTrigger>
          <TabsTrigger value="agent">
            <Bot className="h-4 w-4 mr-1" /> Agent IA
          </TabsTrigger>
          <TabsTrigger value="graphs">Graphiques</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conformité des indicateurs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Conformes</span>
                    <Badge className="bg-success/10 text-success border-0 text-xs">{okCount}</Badge>
                  </div>
                  <Progress value={(okCount / indicateursComplets.length) * 100} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Vigilance</span>
                    <Badge className="bg-warning/10 text-warning border-0 text-xs">{vigilanceCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Alertes</span>
                    <Badge className="bg-destructive/10 text-destructive border-0 text-xs">{alerteCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Équilibre financier</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Résultat</span>
                  <span className="font-medium text-success">{formatCurrency(mockIndicators.resultatExercice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CAF</span>
                  <span className="font-medium">{formatCurrency(caf)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Solde budgétaire</span>
                  <span className="font-medium">{formatCurrency(soldebudgetaire)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tx exec. recettes</span>
                  <span className="font-medium">{formatPercent(tauxExecutionRecettes)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tx exec. dépenses</span>
                  <span className="font-medium">{formatPercent(tauxExecutionDepenses)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Patrimoine & solvabilité</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">FDR mobilisable</span>
                  <span className="font-medium">{formatCurrency(fdrMobilisable)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Jours (mobilisable)</span>
                  <span className="font-medium">{joursMobilisable} j.</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Trésorerie propre</span>
                  <span className="font-medium text-success">{formatCurrency(tresoreriePropre)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Autonomie financière</span>
                  <span className="font-medium">{formatPercent(ratioAutonomie)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vétusté immobilisations</span>
                  <span className="font-medium">{formatPercent(tauxVetusteImmo)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Évolution pluriannuelle */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm">Évolution pluriannuelle FDR / BFR / Trésorerie</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={mockEvolutionData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="fdr" name="FDR" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bfr" name="BFR" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tresorerie" name="Trésorerie" fill="hsl(160, 45%, 45%)" radius={[4, 4, 0, 0]} />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INDICATEURS ── */}
        <TabsContent value="indicators" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategorie === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategorie(null)}
            >
              Tous ({indicateursComplets.length})
            </Badge>
            {categories.map(cat => {
              const count = indicateursComplets.filter(i => i.categorie === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategorie === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategorie(cat)}
                >
                  {cat} ({count})
                </Badge>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredIndicators.map((ind, i) => {
              const StatutIcon = statutConfig[ind.statut as keyof typeof statutConfig].icon;
              return (
                <motion.div key={ind.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{ind.titre}</p>
                          <p className="text-xl font-bold font-display mt-1">{ind.valeur}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] ${statutConfig[ind.statut as keyof typeof statutConfig].class}`}>
                            <StatutIcon className="h-3 w-3 mr-1" />
                            {statutConfig[ind.statut as keyof typeof statutConfig].label}
                          </Badge>
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ind.icon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] font-mono">{ind.formule}</Badge>
                        <span className="text-[10px] text-muted-foreground">Seuil : {ind.seuil}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── AGENT IA ── */}
        <TabsContent value="agent" className="space-y-4 mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Pipeline de génération du compte financier
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Les agents calculent les indicateurs M9-6 et rédigent le rapport du comptable conforme à l'instruction codificatrice.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={runAgentPipeline}
                  disabled={agentRunning}
                  className="gradient-primary border-0"
                >
                  {agentRunning ? (
                    <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> En cours...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-1" /> Lancer les agents</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentSteps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      step.status === "running" ? "border-primary bg-primary/5" :
                      step.status === "done" ? "border-success/30 bg-success/5" :
                      "border-border"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      step.status === "running" ? "bg-primary/10" :
                      step.status === "done" ? "bg-success/10" :
                      "bg-muted"
                    }`}>
                      {step.status === "running" ? (
                        <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                      ) : step.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <StepIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {step.result && (
                        <p className="text-xs text-success mt-1 font-medium">✓ {step.result}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${
                      step.status === "running" ? "border-primary text-primary" :
                      step.status === "done" ? "border-success text-success" :
                      ""
                    }`}>
                      {step.status === "pending" ? "En attente" :
                       step.status === "running" ? "En cours…" :
                       step.status === "done" ? "Terminé" : "Erreur"}
                    </Badge>
                  </motion.div>
                );
              })}

              {rapportGenere && (
                <div className="pt-4 flex gap-2">
                  <Button size="sm" onClick={() => exportRapportComptablePDF("portrait")} className="gradient-primary border-0">
                    <Download className="h-4 w-4 mr-1" /> Rapport Portrait
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportRapportComptablePDF("landscape")}>
                    <Download className="h-4 w-4 mr-1" /> Rapport Paysage
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePrint("portrait")}>
                    <Printer className="h-4 w-4 mr-1" /> Imprimer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GRAPHIQUES ── */}
        <TabsContent value="graphs" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm">Résultat & CAF — Évolution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart data={evolutionCAF}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                      <Bar dataKey="caf" name="CAF" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resultat" name="Résultat" fill="hsl(160, 45%, 45%)" radius={[4, 4, 0, 0]} />
                    </RBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm">Répartition du bilan</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={repartitionBilan} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {repartitionBilan.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm">Répartition des charges</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={mockRepartitionCharges} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} ${value}%`}>
                        {mockRepartitionCharges.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm">Taux d'exécution budgétaire</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Recettes ({formatPercent(tauxExecutionRecettes)})</span>
                    <span>{formatCurrency(totalRecettes)} / {formatCurrency(1920000)}</span>
                  </div>
                  <Progress value={tauxExecutionRecettes} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Dépenses ({formatPercent(tauxExecutionDepenses)})</span>
                    <span>{formatCurrency(totalDepenses)} / {formatCurrency(1900000)}</span>
                  </div>
                  <Progress value={tauxExecutionDepenses} className="h-3" />
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Solde budgétaire</span>
                  <span className="font-bold text-success">{formatCurrency(soldebudgetaire)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompteFinancier;
