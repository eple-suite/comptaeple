import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, ChevronRight, Download, Printer, Maximize2,
  FileBarChart, CheckCircle2, AlertTriangle, Clock, TrendingUp, Wallet,
  Landmark, ArrowDownUp, BarChart3, PieChart, ShieldCheck, Receipt,
  Users, Building2, Bot, Play, RefreshCw, Calculator, Sparkles, ChevronsRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  mockIndicators, mockBalanceData, mockEvolutionData, mockDettes,
  mockFragiliteFDR, mockTresoreriePropreData, mockTresorerieDetail,
  mockCreancesData, mockRepartitionCharges, formatCurrency, formatPercent,
  mockPrelevementFDR,
} from "@/lib/mockData";
import {
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RPieChart, Pie, Cell, ReferenceLine, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import { GaugeChart } from "@/components/GaugeChart";
import { WaterfallChart } from "@/components/WaterfallChart";
import { BalanceScale } from "@/components/BalanceScale";
import { ThermometerChart } from "@/components/ThermometerChart";

/* ─────────── Calculs M9-6 ─────────── */
const totalFragilite = mockFragiliteFDR.stocks + mockFragiliteFDR.creancesAnciennes + mockFragiliteFDR.compte416;
const fdrMobilisable = mockIndicators.fdr - totalFragilite;
const totalDettes = mockDettes.subventions + mockDettes.reliquatsSubventions + mockDettes.avancesEleves + mockDettes.avancesCommensaux;
const tresoreriePropre = mockIndicators.tresorerie - totalDettes;
const chargeFonctionnementJour = mockIndicators.fdr / mockIndicators.joursFonctionnement;
const joursMobilisable = Math.round(fdrMobilisable / chargeFonctionnementJour);

const totalRecettes = 1855230;
const totalDepenses = 1840000;
const dotationAmortissements = 65000;
const neutralisationAmortissements = 58000;
const caf = mockIndicators.resultatExercice + dotationAmortissements;
const cafNette = caf - neutralisationAmortissements;
const ratioAutonomie = (tresoreriePropre / mockIndicators.tresorerie) * 100;
const tauxExecutionRecettes = (totalRecettes / 1920000) * 100;
const tauxExecutionDepenses = (totalDepenses / 1900000) * 100;
const tauxVetusteImmo = (520000 / 1250000) * 100;
const ratioRigiditeCharges = 62.3;
const soldebudgetaire = totalRecettes - totalDepenses;

// Budget data
const budgetRecettes = [
  { service: "SRH", prevu: 850000, realise: 842000 },
  { service: "ALO", prevu: 520000, realise: 498000 },
  { service: "Bourses", prevu: 320000, realise: 315000 },
  { service: "Subventions", prevu: 180000, realise: 165230 },
  { service: "Autres", prevu: 50000, realise: 35000 },
];
const budgetDepenses = [
  { service: "Personnel (SRH)", prevu: 720000, realise: 712000 },
  { service: "Alimentation", prevu: 380000, realise: 375000 },
  { service: "Viabilisation", prevu: 185000, realise: 178000 },
  { service: "Entretien", prevu: 165000, realise: 160000 },
  { service: "Enseignement", prevu: 250000, realise: 232000 },
  { service: "Investissement", prevu: 200000, realise: 183000 },
];

// Évolution data
const evolutionCAF = [
  { year: "2019", caf: 52000, resultat: -2000, cafNette: 48000 },
  { year: "2020", caf: 38000, resultat: -15000, cafNette: 32000 },
  { year: "2021", caf: 65000, resultat: 12000, cafNette: 58000 },
  { year: "2022", caf: 72000, resultat: 18000, cafNette: 65000 },
  { year: "2023", caf, resultat: mockIndicators.resultatExercice, cafNette },
];

const repartitionBilan = [
  { name: "FDR mobilisable", value: fdrMobilisable, fill: "hsl(var(--primary))" },
  { name: "Fragilité FDR", value: totalFragilite, fill: "hsl(var(--warning))" },
  { name: "BFR", value: mockIndicators.bfr, fill: "hsl(38, 92%, 50%)" },
  { name: "Trésorerie propre", value: tresoreriePropre, fill: "hsl(var(--success))" },
];

const radarPerformance = [
  { subject: "FDR (j)", value: Math.min(mockIndicators.joursFonctionnement / 90 * 100, 100), fullMark: 100 },
  { subject: "CAF", value: Math.min(caf / 100000 * 100, 100), fullMark: 100 },
  { subject: "Recouvrement", value: mockIndicators.tauxRecouvrement, fullMark: 100 },
  { subject: "Autonomie fin.", value: ratioAutonomie, fullMark: 100 },
  { subject: "Exec. recettes", value: tauxExecutionRecettes, fullMark: 100 },
  { subject: "Exec. dépenses", value: tauxExecutionDepenses, fullMark: 100 },
  { subject: "Maîtrise charges", value: Math.max(100 - mockIndicators.poidsCharges, 0), fullMark: 100 },
];

const waterfallFDR = [
  { name: "FDR brut", value: mockIndicators.fdr, type: "total" as const },
  { name: "(-) Stocks", value: -mockFragiliteFDR.stocks, type: "negative" as const },
  { name: "(-) Créances anc.", value: -mockFragiliteFDR.creancesAnciennes, type: "negative" as const },
  { name: "(-) Cpt 416", value: -mockFragiliteFDR.compte416, type: "negative" as const },
  { name: "= FDR mobilisable", value: fdrMobilisable, type: "total" as const },
];

const waterfallTreso = [
  { name: "Trésorerie brute", value: mockIndicators.tresorerie, type: "total" as const },
  { name: "(-) Subventions", value: -mockDettes.subventions, type: "negative" as const },
  { name: "(-) Reliquats", value: -mockDettes.reliquatsSubventions, type: "negative" as const },
  { name: "(-) Av. élèves", value: -mockDettes.avancesEleves, type: "negative" as const },
  { name: "(-) Av. commens.", value: -mockDettes.avancesCommensaux, type: "negative" as const },
  { name: "= Tréso. propre", value: tresoreriePropre, type: "total" as const },
];

const waterfallCAF = [
  { name: "Résultat", value: mockIndicators.resultatExercice, type: "total" as const },
  { name: "(+) Dot. amort.", value: dotationAmortissements, type: "positive" as const },
  { name: "= CAF brute", value: caf, type: "total" as const },
  { name: "(-) Neutralisations", value: -neutralisationAmortissements, type: "negative" as const },
  { name: "= CAF nette", value: cafNette, type: "total" as const },
];

const dettesTreso = [
  { name: "Subventions non conso.", value: mockDettes.subventions, fill: "hsl(var(--destructive))" },
  { name: "Reliquats subventions", value: mockDettes.reliquatsSubventions, fill: "hsl(var(--warning))" },
  { name: "Avances élèves", value: mockDettes.avancesEleves, fill: "hsl(38, 92%, 50%)" },
  { name: "Avances commensaux", value: mockDettes.avancesCommensaux, fill: "hsl(var(--muted-foreground))" },
];

const creancesAge = [
  { tranche: "< 3 mois", montant: 45200, color: "hsl(var(--success))" },
  { tranche: "3-6 mois", montant: 12300, color: "hsl(var(--warning))" },
  { tranche: "6-12 mois", montant: 8500, color: "hsl(38, 92%, 50%)" },
  { tranche: "> 12 mois", montant: 3200, color: "hsl(var(--destructive))" },
];

const evolutionTreso = mockEvolutionData.map((d, i) => ({
  ...d,
  caf: evolutionCAF[i]?.caf || 0,
  resultat: evolutionCAF[i]?.resultat || 0,
  tresoreriePropre: d.tresorerie - totalDettes + (i * 5000),
}));

/* ─────────── SLIDE DEFINITIONS ─────────── */
interface Slide {
  id: string;
  section: "exec" | "sante";
  title: string;
  subtitle?: string;
}

const slides: Slide[] = [
  // Section 1: Exécution budgétaire (10 slides)
  { id: "exec-title", section: "exec", title: "EXÉCUTION BUDGÉTAIRE", subtitle: "Analyse de l'exécution du budget de l'exercice 2023" },
  { id: "exec-synthese", section: "exec", title: "Synthèse de l'exécution", subtitle: "Recettes et dépenses — Vue d'ensemble" },
  { id: "exec-recettes", section: "exec", title: "Exécution des recettes", subtitle: "Par service et nature" },
  { id: "exec-depenses", section: "exec", title: "Exécution des dépenses", subtitle: "Par service et nature" },
  { id: "exec-taux", section: "exec", title: "Taux d'exécution", subtitle: "Comparaison prévisions / réalisations" },
  { id: "exec-repartition-dep", section: "exec", title: "Répartition des dépenses", subtitle: "Structure des charges par nature" },
  { id: "exec-repartition-rec", section: "exec", title: "Répartition des recettes", subtitle: "Origine des ressources" },
  { id: "exec-srh", section: "exec", title: "Focus SRH", subtitle: "Service de restauration et d'hébergement" },
  { id: "exec-evolution", section: "exec", title: "Évolution pluriannuelle du budget", subtitle: "Tendances sur 5 exercices" },
  { id: "exec-solde", section: "exec", title: "Solde budgétaire", subtitle: "Résultat de l'exécution budgétaire" },

  // Section 2: Santé financière (16 slides)
  { id: "sante-title", section: "sante", title: "SANTÉ FINANCIÈRE", subtitle: "Diagnostic financier de l'établissement — Exercice 2023" },
  { id: "sante-balance", section: "sante", title: "Équilibre financier", subtitle: "Produits vs Charges — Résultat de l'exercice" },
  { id: "sante-caf", section: "sante", title: "Capacité d'autofinancement", subtitle: "Du résultat à la CAF : amortissements et neutralisations" },
  { id: "sante-caf-evolution", section: "sante", title: "Évolution de la CAF", subtitle: "Tendance pluriannuelle de la CAF et du résultat" },
  { id: "sante-fdr", section: "sante", title: "Fonds de roulement (FDR)", subtitle: "Ressources stables vs emplois stables" },
  { id: "sante-fdr-mobilisable", section: "sante", title: "FDR mobilisable", subtitle: "Déduction des éléments de fragilité" },
  { id: "sante-fdr-jours", section: "sante", title: "Jours de fonctionnement", subtitle: "Combien de jours l'établissement peut fonctionner ?" },
  { id: "sante-bfr", section: "sante", title: "Besoin en fonds de roulement", subtitle: "Le FDR couvre-t-il le BFR ?" },
  { id: "sante-tresorerie", section: "sante", title: "Trésorerie nette", subtitle: "Composition de la trésorerie" },
  { id: "sante-treso-propre", section: "sante", title: "Trésorerie propre", subtitle: "L'autonomie financière réelle" },
  { id: "sante-dettes", section: "sante", title: "Dettes à court terme", subtitle: "Ce qui n'appartient pas à l'établissement" },
  { id: "sante-creances", section: "sante", title: "Créances & Recouvrement", subtitle: "Âge des créances et taux de recouvrement" },
  { id: "sante-charges", section: "sante", title: "Structure des charges", subtitle: "Rigidité et répartition" },
  { id: "sante-patrimoine", section: "sante", title: "Patrimoine & Immobilisations", subtitle: "Vétusté et politique d'amortissement" },
  { id: "sante-radar", section: "sante", title: "Profil REPROFI de l'établissement", subtitle: "Synthèse radar multi-critères" },
  { id: "sante-diagnostic", section: "sante", title: "Diagnostic global", subtitle: "Synthèse, points forts, vigilances et recommandations" },
];

/* ─────────── COMPONENT ─────────── */
const CompteFinancier = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slide = slides[currentSlide];
  const execSlides = slides.filter(s => s.section === "exec");
  const santeSlides = slides.filter(s => s.section === "sante");

  const goTo = (idx: number) => setCurrentSlide(Math.max(0, Math.min(slides.length - 1, idx)));
  const next = () => goTo(currentSlide + 1);
  const prev = () => goTo(currentSlide - 1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard nav
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "Escape" && isFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exportPDF = () => {
    const doc = createStyledPDF({ title: "Compte financier — Rapport REPROFI", subtitle: "Exercice 2023 — Instruction M9.6" });
    const pw = doc.internal.pageSize.getWidth();
    const m = 14;
    let y = 48;

    // Indicators table
    doc.setTextColor(37, 68, 120); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Synthèse des indicateurs financiers (M9-6)", m, y); y += 6;
    const allIndicators = [
      ["Résultat de l'exercice", formatCurrency(mockIndicators.resultatExercice), "Produits − Charges", "> 0 €", "✓"],
      ["CAF brute", formatCurrency(caf), "Résultat + Dot. amort.", "> 0 €", "✓"],
      ["CAF nette", formatCurrency(cafNette), "CAF − Neutralisations", "> 0 €", cafNette > 0 ? "✓" : "✗"],
      ["FDR", formatCurrency(mockIndicators.fdr), "Ress. stables − Emplois stables", "> 30 j.", "✓"],
      ["FDR mobilisable", formatCurrency(fdrMobilisable), "FDR − fragilités", "> 30 j.", joursMobilisable >= 30 ? "✓" : "⚠"],
      ["Jours FDR", `${mockIndicators.joursFonctionnement} j.`, "FDR / (charges/360)", "30-90 j.", "✓"],
      ["Trésorerie nette", formatCurrency(mockIndicators.tresorerie), "FDR − BFR", "> 0 €", "✓"],
      ["Trésorerie propre", formatCurrency(tresoreriePropre), "Tréso − dettes CT", "> 0 €", "✓"],
      ["Autonomie financière", formatPercent(ratioAutonomie), "Tréso propre / brute", "> 50%", ratioAutonomie > 50 ? "✓" : "⚠"],
      ["Recouvrement", formatPercent(mockIndicators.tauxRecouvrement), "Encaissé / Émis", "> 95%", "⚠"],
    ];
    autoTable(doc, {
      startY: y, head: [["Indicateur", "Valeur", "Formule", "Seuil", ""]], body: allIndicators,
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 7 },
      bodyStyles: { fontSize: 7 }, alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: m, right: m },
    });
    savePDF(doc, "Compte_Financier_REPROFI_2023.pdf");
    toast({ title: "PDF REPROFI exporté" });
  };

  /* ─── Slide content renderer ─── */
  const renderSlide = () => {
    switch (slide.id) {
      /* ═══ EXEC TITLE ═══ */
      case "exec-title":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileBarChart className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-display text-primary">Exécution budgétaire</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Analyse de l'exécution du budget de l'exercice 2023.<br />
              Recettes, dépenses, taux d'exécution et solde budgétaire.
            </p>
            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{formatCurrency(totalRecettes)}</p>
                <p className="text-xs text-muted-foreground">Recettes réalisées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDepenses)}</p>
                <p className="text-xs text-muted-foreground">Dépenses réalisées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatCurrency(soldebudgetaire)}</p>
                <p className="text-xs text-muted-foreground">Solde budgétaire</p>
              </div>
            </div>
          </div>
        );

      case "exec-synthese":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale
              leftLabel="Recettes réalisées"
              leftValue={totalRecettes}
              rightLabel="Dépenses réalisées"
              rightValue={totalDepenses}
              leftColor="hsl(var(--success))"
              rightColor="hsl(var(--destructive))"
              title="Balance recettes / dépenses"
            />
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Recettes prévues</span><span className="font-medium">{formatCurrency(1920000)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Recettes réalisées</span><span className="font-medium text-success">{formatCurrency(totalRecettes)}</span></div>
                  <Progress value={tauxExecutionRecettes} className="h-3" />
                  <p className="text-xs text-muted-foreground">Taux d'exécution : {formatPercent(tauxExecutionRecettes)}</p>
                  <Separator />
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Dépenses prévues</span><span className="font-medium">{formatCurrency(1900000)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Dépenses réalisées</span><span className="font-medium text-destructive">{formatCurrency(totalDepenses)}</span></div>
                  <Progress value={tauxExecutionDepenses} className="h-3" />
                  <p className="text-xs text-muted-foreground">Taux d'exécution : {formatPercent(tauxExecutionDepenses)}</p>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Solde budgétaire</span>
                    <span className="text-lg font-bold text-success">{formatCurrency(soldebudgetaire)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "exec-recettes":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={budgetRecettes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="service" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="prevu" name="Prévu" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="realise" name="Réalisé" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case "exec-depenses":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={budgetDepenses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="service" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="prevu" name="Prévu" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="realise" name="Réalisé" fill="hsl(var(--destructive))" opacity={0.8} radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case "exec-taux":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-wrap justify-center gap-6">
              <GaugeChart value={tauxExecutionRecettes} max={100} label="Exec. recettes" unit="%" thresholds={{ ok: 90, warning: 75 }} size="lg" />
              <GaugeChart value={tauxExecutionDepenses} max={100} label="Exec. dépenses" unit="%" thresholds={{ ok: 90, warning: 75 }} size="lg" />
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Analyse des taux d'exécution</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Le taux d'exécution des <strong>recettes</strong> s'établit à <strong>{formatPercent(tauxExecutionRecettes)}</strong>, 
                  ce qui traduit une bonne capacité de l'établissement à mobiliser ses ressources. 
                  Le taux d'exécution des <strong>dépenses</strong> est de <strong>{formatPercent(tauxExecutionDepenses)}</strong>, 
                  reflétant une consommation maîtrisée des crédits ouverts.
                </p>
                <Separator />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Un taux d'exécution &gt; 90%</strong> est considéré comme satisfaisant. Un taux inférieur peut 
                  révéler des difficultés d'encaissement ou un budget surévalué.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "exec-repartition-dep":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={mockRepartitionCharges} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3}
                    label={({ name, value }) => `${name} ${value}%`}>
                    {mockRepartitionCharges.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {mockRepartitionCharges.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-medium">{c.value}%</span></div>
                    <Progress value={c.value} className="h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "exec-repartition-rec": {
        const recPie = budgetRecettes.map((r, i) => ({
          name: r.service, value: r.realise,
          fill: ["hsl(var(--success))", "hsl(var(--primary))", "hsl(38, 92%, 50%)", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"][i],
        }));
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={recPie} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {recPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {budgetRecettes.map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm"><span>{r.service}</span><span className="font-medium">{formatCurrency(r.realise)}</span></div>
                  <Progress value={(r.realise / totalRecettes) * 100} className="h-2 mt-1" />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "exec-srh":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale
              leftLabel="Recettes SRH"
              leftValue={842000}
              rightLabel="Dépenses SRH"
              rightValue={712000 + 375000}
              leftColor="hsl(var(--success))"
              rightColor="hsl(var(--destructive))"
              title="Équilibre du SRH"
            />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Service de restauration et d'hébergement</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Recettes SRH</span><span className="font-medium text-success">{formatCurrency(842000)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Charges personnel SRH</span><span className="font-medium">{formatCurrency(712000)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Charges alimentation</span><span className="font-medium">{formatCurrency(375000)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Coût du repas (estimation)</span><span className="font-medium">3,85 €</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Poids SRH / charges totales</span><span className="font-medium">{formatPercent(mockIndicators.poidsSRH)}</span></div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  💡 Le SRH représente <strong>{formatPercent(mockIndicators.poidsSRH)}</strong> des charges totales. 
                  Son équilibre est un enjeu majeur pour la santé financière de l'établissement.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "exec-evolution":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={mockEvolutionData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="fdr" name="FDR" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bfr" name="BFR" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tresorerie" name="Trésorerie" fill="hsl(160, 45%, 45%)" radius={[4, 4, 0, 0]} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        );

      case "exec-solde":
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <BalanceScale
              leftLabel="Total recettes"
              leftValue={totalRecettes}
              rightLabel="Total dépenses"
              rightValue={totalDepenses}
              leftColor="hsl(var(--success))"
              rightColor="hsl(var(--destructive))"
              title="Résultat de l'exécution budgétaire"
            />
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">Solde budgétaire de l'exercice 2023</p>
              <p className="text-4xl font-bold font-display text-success mt-2">{formatCurrency(soldebudgetaire)}</p>
              <Badge className="bg-success/10 text-success border-0 mt-2">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Excédentaire
              </Badge>
            </div>
          </div>
        );

      /* ═══ SANTÉ FINANCIÈRE ═══ */
      case "sante-title":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-3xl font-bold font-display text-secondary">Santé financière</h2>
            <p className="text-muted-foreground text-center max-w-lg">
              Diagnostic complet : résultat, CAF, fonds de roulement, trésorerie, 
              créances, patrimoine. Conforme M9-6 et modèle REPROFI.
            </p>
            <div className="flex gap-6 mt-4">
              <div className="flex flex-col items-center">
                <ThermometerChart value={mockIndicators.joursFonctionnement} max={90} label="Jours FDR" format="days" thresholds={{ danger: 15, warning: 30, ok: 45 }} />
              </div>
              <div className="flex flex-col items-center">
                <ThermometerChart value={ratioAutonomie} max={100} label="Autonomie fin." format="percent" thresholds={{ danger: 20, warning: 50, ok: 70 }} />
              </div>
              <div className="flex flex-col items-center">
                <ThermometerChart value={mockIndicators.tauxRecouvrement} max={100} label="Recouvrement" format="percent" thresholds={{ danger: 80, warning: 90, ok: 95 }} />
              </div>
            </div>
          </div>
        );

      case "sante-balance":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale
              leftLabel="Produits (cl. 7)"
              leftValue={1855230}
              rightLabel="Charges (cl. 6)"
              rightValue={1840000}
              leftColor="hsl(var(--success))"
              rightColor="hsl(var(--destructive))"
              title="Le résultat est-il excédentaire ou déficitaire ?"
            />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-4">
                <p className="text-sm font-semibold">Comment se calcule le résultat ?</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>Total des produits (classe 7) : <span className="text-success font-bold">{formatCurrency(1855230)}</span></p>
                  <p>Total des charges (classe 6) : <span className="text-destructive font-bold">{formatCurrency(1840000)}</span></p>
                  <Separator />
                  <p className="font-bold text-sm">= Résultat : <span className="text-success">{formatCurrency(mockIndicators.resultatExercice)}</span></p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Le résultat mesure l'enrichissement ou l'appauvrissement</strong> de l'établissement sur l'exercice.
                  Un résultat positif signifie que l'établissement a dégagé plus de ressources qu'il n'en a consommé.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-caf":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaterfallChart data={waterfallCAF} height={300} />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Du résultat à la CAF nette</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>Résultat de l'exercice : {formatCurrency(mockIndicators.resultatExercice)}</p>
                  <p className="text-success">(+) Dotations aux amortissements : {formatCurrency(dotationAmortissements)}</p>
                  <p className="font-bold">= CAF brute : {formatCurrency(caf)}</p>
                  <p className="text-destructive">(−) Neutralisations d'amortissements : {formatCurrency(neutralisationAmortissements)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= CAF nette : <span className={cafNette > 0 ? "text-success" : "text-destructive"}>{formatCurrency(cafNette)}</span></p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>La CAF</strong> mesure la capacité de l'établissement à financer ses investissements avec ses propres moyens.
                  Les <strong>neutralisations</strong> correspondent aux amortissements financés par des subventions : 
                  elles ne génèrent pas de trésorerie propre et sont donc soustraites.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>CAF nette {cafNette > 0 ? "positive" : "négative"}</strong> = l'établissement 
                  {cafNette > 0 ? " peut financer le renouvellement de ses immobilisations" : " a besoin de ressources externes pour renouveler ses immobilisations"}.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-caf-evolution":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionCAF}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Bar dataKey="caf" name="CAF brute" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cafNette" name="CAF nette" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="resultat" name="Résultat" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case "sante-fdr":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale
              leftLabel="Ressources stables (cl. 1)"
              leftValue={1250000}
              rightLabel="Emplois stables (cl. 2)"
              rightValue={1250000 - mockIndicators.fdr}
              leftColor="hsl(var(--primary))"
              rightColor="hsl(38, 92%, 50%)"
              title="Le FDR : l'excédent des ressources stables"
            />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Qu'est-ce que le Fonds de Roulement ?</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>Ressources stables (classe 1) : {formatCurrency(1250000)}</p>
                  <p>(−) Emplois stables (classe 2) : {formatCurrency(1250000 - mockIndicators.fdr)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= FDR : <span className="text-primary">{formatCurrency(mockIndicators.fdr)}</span></p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Le FDR est <strong>le matelas de sécurité</strong> de l'établissement. Il représente 
                  l'excédent des ressources à long terme sur les emplois à long terme. Ce surplus 
                  finance le cycle d'exploitation courant.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-success/10 text-success border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {mockIndicators.joursFonctionnement} jours de fonctionnement
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-fdr-mobilisable":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaterfallChart data={waterfallFDR} height={300} />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Le FDR est-il réellement mobilisable ?</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>FDR brut : {formatCurrency(mockIndicators.fdr)}</p>
                  <p className="text-destructive">(−) Stocks (classe 3) : {formatCurrency(mockFragiliteFDR.stocks)}</p>
                  <p className="text-destructive">(−) Créances anciennes : {formatCurrency(mockFragiliteFDR.creancesAnciennes)}</p>
                  <p className="text-destructive">(−) Créances douteuses (416) : {formatCurrency(mockFragiliteFDR.compte416)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= FDR mobilisable : <span className="text-primary">{formatCurrency(fdrMobilisable)}</span> ({joursMobilisable} j.)</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Les <strong>éléments de fragilité</strong> sont des actifs immobilisés dans le FDR : 
                  stocks non liquides, créances dont le recouvrement est incertain. Le FDR mobilisable 
                  représente ce que l'établissement peut réellement utiliser.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-fdr-jours":
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex gap-10 items-end">
              <GaugeChart value={mockIndicators.joursFonctionnement} max={90} label="Jours FDR brut" unit=" j" thresholds={{ ok: 30, warning: 15 }} size="lg" />
              <GaugeChart value={joursMobilisable} max={90} label="Jours FDR mobilisable" unit=" j" thresholds={{ ok: 30, warning: 15 }} size="lg" />
            </div>
            <Card className="shadow-card w-full max-w-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Combien de jours l'établissement peut-il fonctionner ?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Le FDR brut permet <strong>{mockIndicators.joursFonctionnement} jours</strong> de fonctionnement.
                  Après déduction des éléments de fragilité, le FDR mobilisable ne couvre que <strong>{joursMobilisable} jours</strong>.
                </p>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs">
                  <p className="font-mono">Charge journalière = Charges annuelles / 360 = {formatCurrency(Math.round(chargeFonctionnementJour))}</p>
                  <p className="font-mono">Jours FDR = FDR / charge journalière</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  💡 <strong>Seuil recommandé : 30 à 90 jours.</strong> En dessous de 30 jours, l'établissement 
                  est en situation de fragilité. Au-dessus de 90 jours, le FDR est peut-être excessif 
                  et pourrait être mobilisé pour des investissements.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-bfr":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale
              leftLabel="FDR"
              leftValue={mockIndicators.fdr}
              rightLabel="BFR"
              rightValue={mockIndicators.bfr}
              leftColor="hsl(var(--primary))"
              rightColor="hsl(var(--warning))"
              title="Le FDR couvre-t-il le BFR ?"
            />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Trésorerie = FDR − BFR</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>FDR : {formatCurrency(mockIndicators.fdr)}</p>
                  <p>(−) BFR : {formatCurrency(mockIndicators.bfr)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= Trésorerie : <span className="text-success">{formatCurrency(mockIndicators.tresorerie)}</span></p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Le <strong>BFR</strong> (Besoin en Fonds de Roulement) représente le financement nécessaire 
                  pour le cycle d'exploitation courant. Si le FDR est supérieur au BFR, l'établissement 
                  dégage une trésorerie positive.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-tresorerie":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">Composition de la trésorerie</p>
                  {mockTresorerieDetail.map((t, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{t.label} ({t.compte})</span>
                      <span className="font-medium">{formatCurrency(t.montant)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span>TOTAL trésorerie</span>
                    <span className="text-success">{formatCurrency(mockIndicators.tresorerie)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={mockTresorerieDetail.map((t, i) => ({
                      name: t.label, value: t.montant,
                      fill: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"][i],
                    }))}
                    dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockTresorerieDetail.map((_, i) => (
                      <Cell key={i} fill={["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"][i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "sante-treso-propre":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaterfallChart data={waterfallTreso} height={300} />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Trésorerie propre : l'autonomie réelle</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>Trésorerie brute : {formatCurrency(mockIndicators.tresorerie)}</p>
                  <p className="text-destructive">(−) Subventions non consommées : {formatCurrency(mockDettes.subventions)}</p>
                  <p className="text-destructive">(−) Reliquats de subventions : {formatCurrency(mockDettes.reliquatsSubventions)}</p>
                  <p className="text-destructive">(−) Avances des familles : {formatCurrency(mockDettes.avancesEleves)}</p>
                  <p className="text-destructive">(−) Avances des commensaux : {formatCurrency(mockDettes.avancesCommensaux)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= Trésorerie propre : <span className="text-success">{formatCurrency(tresoreriePropre)}</span></p>
                  <p>Ratio d'autonomie : <span className="font-bold">{formatPercent(ratioAutonomie)}</span></p>
                </div>
                <GaugeChart value={ratioAutonomie} max={100} label="Autonomie financière" unit="%" thresholds={{ ok: 50, warning: 30 }} size="md" />
              </CardContent>
            </Card>
          </div>
        );

      case "sante-dettes":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={dettesTreso} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {dettesTreso.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Ce qui n'appartient pas à l'établissement</p>
                {dettesTreso.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <div className="flex-1 flex justify-between text-sm">
                      <span>{d.name}</span><span className="font-medium">{formatCurrency(d.value)}</span>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total dettes CT</span><span className="text-destructive">{formatCurrency(totalDettes)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Ces sommes sont dans la trésorerie mais <strong>ne sont pas disponibles</strong> : 
                  elles devront être restituées ou utilisées selon leur affectation.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-creances":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={creancesAge}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="tranche" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="montant" name="Montant" radius={[4, 4, 0, 0]}>
                    {creancesAge.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <GaugeChart value={mockIndicators.tauxRecouvrement} max={100} label="Taux de recouvrement" unit="%" thresholds={{ ok: 95, warning: 80 }} size="lg" />
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold">Âge des créances</p>
                  {mockCreancesData.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs border-b border-border/50 py-1">
                      <span>{c.type}</span><span className="font-medium">{formatCurrency(c.montant)} ({c.anciennete})</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Les créances de plus de 12 mois doivent faire l'objet d'un examen pour <strong>admission en non-valeur (ANV)</strong>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "sante-charges":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={mockRepartitionCharges} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3}
                    label={({ name, value }) => `${name} ${value}%`}>
                    {mockRepartitionCharges.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Rigidité des charges</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span>Poids des charges / produits</span><span className="font-medium">{formatPercent(mockIndicators.poidsCharges)}</span></div>
                  <Progress value={mockIndicators.poidsCharges} className="h-2" />
                  <div className="flex justify-between text-xs"><span>Part du SRH</span><span className="font-medium">{formatPercent(mockIndicators.poidsSRH)}</span></div>
                  <Progress value={mockIndicators.poidsSRH} className="h-2" />
                  <div className="flex justify-between text-xs"><span>Ratio de rigidité</span><span className="font-medium">{formatPercent(ratioRigiditeCharges)}</span></div>
                  <Progress value={ratioRigiditeCharges} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  💡 Un <strong>ratio de rigidité élevé</strong> signifie que l'établissement a peu de marge de manœuvre 
                  pour réduire ses charges en cas de baisse de recettes.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-patrimoine":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col items-center gap-4">
              <GaugeChart value={tauxVetusteImmo} max={100} label="Taux de vétusté" unit="%" thresholds={{ ok: 30, warning: 50 }} size="lg" />
              <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono w-full max-w-xs space-y-1">
                <p>Valeur brute immobilisations : {formatCurrency(1250000)}</p>
                <p>Amortissements cumulés : {formatCurrency(520000)}</p>
                <Separator />
                <p className="font-bold">Taux de vétusté : {formatPercent(tauxVetusteImmo)}</p>
              </div>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Politique d'amortissement</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span>Dotations de l'exercice</span><span className="font-medium">{formatCurrency(dotationAmortissements)}</span></div>
                  <div className="flex justify-between text-xs"><span>Neutralisations</span><span className="font-medium">{formatCurrency(neutralisationAmortissements)}</span></div>
                  <div className="flex justify-between text-xs"><span>Impact net sur résultat</span><span className="font-medium">{formatCurrency(dotationAmortissements - neutralisationAmortissements)}</span></div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Un <strong>taux de vétusté &gt; 70%</strong> signale un patrimoine vieillissant nécessitant 
                  un plan de renouvellement. Les neutralisations compensent l'impact des amortissements 
                  sur les biens financés par subventions.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-radar":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarPerformance}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="value" stroke="hsl(215, 70%, 45%)" fill="hsl(215, 70%, 45%)" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Profil multi-critères REPROFI</p>
              {radarPerformance.map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{r.subject}</span><span className="font-medium">{r.value.toFixed(0)}%</span>
                  </div>
                  <Progress value={r.value} className="h-2" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                💡 Ce radar offre une vision synthétique. Plus la surface est grande, 
                meilleure est la situation financière.
              </p>
            </div>
          </div>
        );

      case "sante-diagnostic":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Conformes", count: 14, total: 18, color: "text-success", bg: "bg-success/10" },
                { label: "Vigilance", count: 3, total: 18, color: "text-warning", bg: "bg-warning/10" },
                { label: "Alertes", count: 1, total: 18, color: "text-destructive", bg: "bg-destructive/10" },
              ].map((s, i) => (
                <Card key={i} className={`shadow-card ${s.bg} border-0`}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-muted-foreground">{s.label} / {s.total}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-card border-l-4 border-l-success">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-success mb-2">✅ Points forts</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
                    <li>Résultat excédentaire de {formatCurrency(mockIndicators.resultatExercice)}</li>
                    <li>CAF nette positive de {formatCurrency(cafNette)}</li>
                    <li>FDR de {mockIndicators.joursFonctionnement} jours (seuil 30 j.)</li>
                    <li>Trésorerie propre positive ({formatCurrency(tresoreriePropre)})</li>
                    <li>Bonne exécution budgétaire (&gt; 96%)</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-warning mb-2">⚠️ Points de vigilance</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
                    <li>FDR mobilisable réduit à {joursMobilisable} j. après fragilités</li>
                    <li>Créances douteuses (cpt 416) : {formatCurrency(mockFragiliteFDR.compte416)}</li>
                    <li>Taux de recouvrement à {formatPercent(mockIndicators.tauxRecouvrement)} (cible 95%)</li>
                    <li>Vétusté des immobilisations à {formatPercent(tauxVetusteImmo)}</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-primary md:col-span-2">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-primary mb-2">📋 Recommandations</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
                    <li>Maintenir le FDR mobilisable au-dessus de 30 jours de fonctionnement</li>
                    <li>Intensifier les actions de recouvrement et examiner les ANV</li>
                    <li>Anticiper le renouvellement des immobilisations vétustes</li>
                    <li>Optimiser la gestion du SRH pour maintenir l'équilibre du service</li>
                    <li>Poursuivre la politique de constitution de réserves via la CAF nette</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <p className="text-center text-muted-foreground">Slide en cours de construction…</p>;
    }
  };

  const execIdx = slides.findIndex(s => s.section === "exec");
  const santeIdx = slides.findIndex(s => s.section === "sante");

  return (
    <div className="space-y-4" onKeyDown={handleKey} tabIndex={0}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Compte financier — Mode REPROFI</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {slides.length} diapositives • Exercice 2023 • Instruction M9.6
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4 mr-1" /> Plein écran
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Section tabs */}
      <div className="flex gap-2">
        <Button
          variant={slide.section === "exec" ? "default" : "outline"}
          size="sm"
          onClick={() => goTo(execIdx)}
          className={slide.section === "exec" ? "gradient-primary border-0" : ""}
        >
          <FileBarChart className="h-4 w-4 mr-1" /> Exécution budgétaire ({execSlides.length})
        </Button>
        <Button
          variant={slide.section === "sante" ? "default" : "outline"}
          size="sm"
          onClick={() => goTo(santeIdx)}
          className={slide.section === "sante" ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-0" : ""}
        >
          <ShieldCheck className="h-4 w-4 mr-1" /> Santé financière ({santeSlides.length})
        </Button>
      </div>

      {/* Slide viewer */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="text-[9px] mb-1">
                {slide.section === "exec" ? "Exécution budgétaire" : "Santé financière"} — Diapositive {currentSlide + 1}/{slides.length}
              </Badge>
              <CardTitle className="text-lg">{slide.title}</CardTitle>
              {slide.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{slide.subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prev} disabled={currentSlide === 0}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground min-w-[4rem] text-center">
                {currentSlide + 1} / {slides.length}
              </span>
              <Button variant="ghost" size="icon" onClick={next} disabled={currentSlide === slides.length - 1}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {renderSlide()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Slide strip / thumbnails */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
              i === currentSlide
                ? s.section === "exec"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-secondary"
                : "bg-card text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {i + 1}. {s.title.length > 20 ? s.title.slice(0, 20) + "…" : s.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CompteFinancier;
