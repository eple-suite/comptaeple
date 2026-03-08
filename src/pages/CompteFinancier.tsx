import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, ChevronRight, Download, Maximize2,
  FileBarChart, CheckCircle2, AlertTriangle, ShieldCheck,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  mockIndicators, mockDettes, mockFragiliteFDR,
  mockTresorerieDetail, mockCreancesData, mockRepartitionCharges,
  formatCurrency, formatPercent,
} from "@/lib/mockData";
import {
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RPieChart, Pie, Cell, ReferenceLine, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart,
} from "recharts";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { GaugeChart } from "@/components/GaugeChart";
import { WaterfallChart } from "@/components/WaterfallChart";
import { BalanceScale } from "@/components/BalanceScale";
import { ThermometerChart } from "@/components/ThermometerChart";
import { HistoricalDataPanel, defaultCurrentYear, defaultHistoricalData, type YearlyFinancialData } from "@/components/HistoricalDataPanel";

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

/* ─────────── SLIDES ─────────── */
interface Slide { id: string; section: "exec" | "sante"; title: string; subtitle?: string; }

const slides: Slide[] = [
  // Exécution budgétaire (12 slides — 2 new evolution slides)
  { id: "exec-title", section: "exec", title: "EXÉCUTION BUDGÉTAIRE", subtitle: "Analyse de l'exécution du budget de l'exercice 2023" },
  { id: "exec-synthese", section: "exec", title: "Synthèse de l'exécution", subtitle: "Recettes et dépenses — Vue d'ensemble" },
  { id: "exec-recettes", section: "exec", title: "Exécution des recettes", subtitle: "Par service et nature" },
  { id: "exec-depenses", section: "exec", title: "Exécution des dépenses", subtitle: "Par service et nature" },
  { id: "exec-taux", section: "exec", title: "Taux d'exécution", subtitle: "Comparaison prévisions / réalisations" },
  { id: "exec-repartition-dep", section: "exec", title: "Répartition des dépenses", subtitle: "Structure des charges par nature" },
  { id: "exec-repartition-rec", section: "exec", title: "Répartition des recettes", subtitle: "Origine des ressources" },
  { id: "exec-srh", section: "exec", title: "Focus SRH", subtitle: "Service de restauration et d'hébergement" },
  { id: "exec-evolution-budget", section: "exec", title: "📈 Évolution Recettes / Dépenses", subtitle: "Tendances pluriannuelles du budget (N à N-4)" },
  { id: "exec-evolution-solde", section: "exec", title: "📈 Évolution du solde budgétaire", subtitle: "Résultat de l'exécution sur 5 exercices" },
  { id: "exec-evolution", section: "exec", title: "Évolution FDR / BFR / Trésorerie", subtitle: "Tendances sur 5 exercices" },
  { id: "exec-solde", section: "exec", title: "Solde budgétaire", subtitle: "Résultat de l'exécution budgétaire" },

  // Santé financière (20 slides — 4 new evolution slides)
  { id: "sante-title", section: "sante", title: "SANTÉ FINANCIÈRE", subtitle: "Diagnostic financier de l'établissement — Exercice 2023" },
  { id: "sante-balance", section: "sante", title: "Équilibre financier", subtitle: "Produits vs Charges — Résultat de l'exercice" },
  { id: "sante-caf", section: "sante", title: "Capacité d'autofinancement", subtitle: "Du résultat à la CAF : amortissements et neutralisations" },
  { id: "sante-caf-evolution", section: "sante", title: "📈 Évolution CAF & Résultat", subtitle: "Tendance pluriannuelle de la CAF et du résultat" },
  { id: "sante-fdr", section: "sante", title: "Fonds de roulement (FDR)", subtitle: "Ressources stables vs emplois stables" },
  { id: "sante-fdr-mobilisable", section: "sante", title: "FDR mobilisable", subtitle: "Déduction des éléments de fragilité" },
  { id: "sante-fdr-jours", section: "sante", title: "Jours de fonctionnement", subtitle: "Combien de jours l'établissement peut fonctionner ?" },
  { id: "sante-evolution-fdr", section: "sante", title: "📈 Évolution du FDR en jours", subtitle: "Seuil de 30 jours de fonctionnement sur 5 ans" },
  { id: "sante-bfr", section: "sante", title: "Besoin en fonds de roulement", subtitle: "Le FDR couvre-t-il le BFR ?" },
  { id: "sante-tresorerie", section: "sante", title: "Trésorerie nette", subtitle: "Composition de la trésorerie" },
  { id: "sante-treso-propre", section: "sante", title: "Trésorerie propre", subtitle: "L'autonomie financière réelle" },
  { id: "sante-evolution-treso", section: "sante", title: "📈 Évolution Trésorerie", subtitle: "Trésorerie brute vs propre sur 5 ans" },
  { id: "sante-dettes", section: "sante", title: "Dettes à court terme", subtitle: "Ce qui n'appartient pas à l'établissement" },
  { id: "sante-creances", section: "sante", title: "Créances & Recouvrement", subtitle: "Âge des créances et taux de recouvrement" },
  { id: "sante-evolution-recouvrement", section: "sante", title: "📈 Évolution du recouvrement", subtitle: "Taux de recouvrement et poids des charges sur 5 ans" },
  { id: "sante-charges", section: "sante", title: "Structure des charges", subtitle: "Rigidité et répartition" },
  { id: "sante-patrimoine", section: "sante", title: "Patrimoine & Immobilisations", subtitle: "Vétusté et politique d'amortissement" },
  { id: "sante-radar", section: "sante", title: "Profil REPROFI de l'établissement", subtitle: "Synthèse radar multi-critères" },
  { id: "sante-evolution-radar", section: "sante", title: "📈 Évolution du profil REPROFI", subtitle: "Comparaison N vs N-1 en radar" },
  { id: "sante-diagnostic", section: "sante", title: "Diagnostic global", subtitle: "Synthèse, points forts, vigilances et recommandations" },
];

/* ─────────── Helper: trend badge ─────────── */
const TrendBadge = ({ current, previous, unit = "€", inverse = false }: { current: number; previous: number; unit?: string; inverse?: boolean }) => {
  const diff = current - previous;
  const pct = previous !== 0 ? ((diff / Math.abs(previous)) * 100) : 0;
  const isPositive = inverse ? diff < 0 : diff > 0;
  return (
    <Badge className={`text-[9px] border-0 ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </Badge>
  );
};

/* ─────────── COMPONENT ─────────── */
const CompteFinancier = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Historical data state
  const initialAllYears = useMemo(() => {
    return [defaultCurrentYear, ...defaultHistoricalData].sort((a, b) => a.year - b.year);
  }, []);
  const [allYearsData, setAllYearsData] = useState<YearlyFinancialData[]>(initialAllYears);

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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "Escape" && isFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Derived evolution data from user-editable historical data
  const evolutionData = useMemo(() => allYearsData.map(d => ({
    year: String(d.year),
    fdr: d.fdr,
    bfr: d.bfr,
    tresorerie: d.tresorerie,
    caf: d.caf,
    cafNette: d.cafNette,
    resultat: d.resultat,
    totalRecettes: d.totalRecettes,
    totalDepenses: d.totalDepenses,
    solde: d.totalRecettes - d.totalDepenses,
    joursFDR: d.joursFDR,
    tauxRecouvrement: d.tauxRecouvrement,
    tresoreriePropre: d.tresoreriePropre,
    poidsCharges: d.poidsCharges,
    poidsSRH: d.poidsSRH,
    dotationAmortissements: d.dotationAmortissements,
    neutralisations: d.neutralisations,
  })), [allYearsData]);

  const currentYearEvo = evolutionData[evolutionData.length - 1];
  const previousYearEvo = evolutionData.length > 1 ? evolutionData[evolutionData.length - 2] : currentYearEvo;

  // Radar data for N-1 comparison
  const radarN1 = useMemo(() => {
    if (evolutionData.length < 2) return null;
    const prev = evolutionData[evolutionData.length - 2];
    return [
      { subject: "FDR (j)", value: Math.min(prev.joursFDR / 90 * 100, 100), fullMark: 100 },
      { subject: "CAF", value: Math.min(prev.caf / 100000 * 100, 100), fullMark: 100 },
      { subject: "Recouvrement", value: prev.tauxRecouvrement, fullMark: 100 },
      { subject: "Autonomie fin.", value: prev.tresoreriePropre > 0 && prev.tresorerie > 0 ? (prev.tresoreriePropre / prev.tresorerie * 100) : 0, fullMark: 100 },
      { subject: "Exec. recettes", value: tauxExecutionRecettes, fullMark: 100 },
      { subject: "Exec. dépenses", value: tauxExecutionDepenses, fullMark: 100 },
      { subject: "Maîtrise charges", value: Math.max(100 - prev.poidsCharges, 0), fullMark: 100 },
    ];
  }, [evolutionData]);

  const exportPDF = () => {
    const doc = createStyledPDF({ title: "Compte financier — Rapport REPROFI", subtitle: "Exercice 2023 — Instruction M9.6" });
    const m = 14;
    let y = 48;
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
            <BalanceScale leftLabel="Recettes réalisées" leftValue={totalRecettes} rightLabel="Dépenses réalisées" rightValue={totalDepenses} leftColor="hsl(var(--success))" rightColor="hsl(var(--destructive))" title="Balance recettes / dépenses" />
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
                  💡 <strong>Un taux d'exécution &gt; 90%</strong> est considéré comme satisfaisant.
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
            <BalanceScale leftLabel="Recettes SRH" leftValue={842000} rightLabel="Dépenses SRH" rightValue={712000 + 375000} leftColor="hsl(var(--success))" rightColor="hsl(var(--destructive))" title="Équilibre du SRH" />
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Service de restauration et d'hébergement</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Recettes SRH</span><span className="font-medium text-success">{formatCurrency(842000)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Charges personnel SRH</span><span className="font-medium">{formatCurrency(712000)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Charges alimentation</span><span className="font-medium">{formatCurrency(375000)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Poids SRH / charges totales</span><span className="font-medium">{formatPercent(mockIndicators.poidsSRH)}</span></div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  💡 Le SRH représente <strong>{formatPercent(mockIndicators.poidsSRH)}</strong> des charges totales.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      /* ═══ NEW: Evolution Recettes / Dépenses ═══ */
      case "exec-evolution-budget":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="totalRecettes" name="Recettes" fill="hsl(var(--success))" fillOpacity={0.15} stroke="hsl(var(--success))" strokeWidth={2} />
                  <Area type="monotone" dataKey="totalDepenses" name="Dépenses" fill="hsl(var(--destructive))" fillOpacity={0.15} stroke="hsl(var(--destructive))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Tendance budgétaire</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Recettes</span>
                    <TrendBadge current={currentYearEvo.totalRecettes} previous={previousYearEvo.totalRecettes} />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Dépenses</span>
                    <TrendBadge current={currentYearEvo.totalDepenses} previous={previousYearEvo.totalDepenses} inverse />
                  </div>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Ce graphique montre l'évolution des <strong>recettes et dépenses</strong> sur les 5 derniers exercices.
                  Les données sont modifiables via le panneau « Données des exercices antérieurs ».
                </p>
              </CardContent>
            </Card>
          </div>
        );

      /* ═══ NEW: Evolution Solde budgétaire ═══ */
      case "exec-evolution-solde":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: "Équilibre", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="solde" name="Solde budgétaire" radius={[4, 4, 0, 0]}>
                    {evolutionData.map((d, i) => (
                      <Cell key={i} fill={d.solde >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="resultat" name="Résultat comptable" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Analyse des soldes</p>
                {evolutionData.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-border/30 py-1">
                    <span className="font-medium">{d.year}</span>
                    <span className={d.solde >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                      {formatCurrency(d.solde)}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  💡 Le <strong>solde budgétaire</strong> (recettes − dépenses) et le <strong>résultat comptable</strong> (produits − charges) 
                  peuvent différer en raison des opérations d'ordre.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "exec-evolution":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={evolutionData} barGap={4}>
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
            <BalanceScale leftLabel="Total recettes" leftValue={totalRecettes} rightLabel="Total dépenses" rightValue={totalDepenses} leftColor="hsl(var(--success))" rightColor="hsl(var(--destructive))" title="Résultat de l'exécution budgétaire" />
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
              <ThermometerChart value={mockIndicators.joursFonctionnement} max={90} label="Jours FDR" format="days" thresholds={{ danger: 15, warning: 30, ok: 45 }} />
              <ThermometerChart value={ratioAutonomie} max={100} label="Autonomie fin." format="percent" thresholds={{ danger: 20, warning: 50, ok: 70 }} />
              <ThermometerChart value={mockIndicators.tauxRecouvrement} max={100} label="Recouvrement" format="percent" thresholds={{ danger: 80, warning: 90, ok: 95 }} />
            </div>
          </div>
        );

      case "sante-balance":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale leftLabel="Produits (cl. 7)" leftValue={1855230} rightLabel="Charges (cl. 6)" rightValue={1840000} leftColor="hsl(var(--success))" rightColor="hsl(var(--destructive))" title="Le résultat est-il excédentaire ou déficitaire ?" />
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
                </p>
              </CardContent>
            </Card>
          </div>
        );

      /* ═══ NEW: CAF Evolution ═══ */
      case "sante-caf-evolution":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
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
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Tendance CAF</p>
                <div className="space-y-2">
                  {evolutionData.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs border-b border-border/30 py-1">
                      <span>{d.year}</span>
                      <div className="flex gap-2">
                        <span className="text-primary font-mono">{formatCurrency(d.caf)}</span>
                        <span className={d.resultat >= 0 ? "text-success" : "text-destructive"} style={{ fontSize: 9 }}>
                          R: {formatCurrency(d.resultat)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">CAF N/N-1 :</span>
                  <TrendBadge current={currentYearEvo.caf} previous={previousYearEvo.caf} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 La CAF doit rester <strong>positive sur la durée</strong> pour assurer le renouvellement des immobilisations.
                  Un résultat négatif n'empêche pas une CAF positive grâce aux amortissements.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-fdr":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale leftLabel="Ressources stables (cl. 1)" leftValue={1250000} rightLabel="Emplois stables (cl. 2)" rightValue={1250000 - mockIndicators.fdr} leftColor="hsl(var(--primary))" rightColor="hsl(38, 92%, 50%)" title="Le FDR : l'excédent des ressources stables" />
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
                  💡 Le FDR est <strong>le matelas de sécurité</strong> de l'établissement.
                </p>
                <Badge className="bg-success/10 text-success border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> FDR positif : {mockIndicators.joursFonctionnement} jours
                </Badge>
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
                <p className="text-sm font-semibold">Du FDR brut au FDR mobilisable</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>FDR brut : {formatCurrency(mockIndicators.fdr)}</p>
                  <p className="text-destructive">(−) Stocks (cl. 3) : {formatCurrency(mockFragiliteFDR.stocks)}</p>
                  <p className="text-destructive">(−) Créances anciennes : {formatCurrency(mockFragiliteFDR.creancesAnciennes)}</p>
                  <p className="text-destructive">(−) Cpt 416 (douteuses) : {formatCurrency(mockFragiliteFDR.compte416)}</p>
                  <Separator />
                  <p className="font-bold text-sm">= FDR mobilisable : {formatCurrency(fdrMobilisable)}</p>
                </div>
                <p className="text-xs text-muted-foreground">💡 Le FDR mobilisable représente la part réellement disponible.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-fdr-jours":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col items-center gap-4">
              <GaugeChart value={mockIndicators.joursFonctionnement} max={90} label="Jours de FDR brut" unit=" j." thresholds={{ ok: 45, warning: 30 }} size="lg" />
              <GaugeChart value={joursMobilisable} max={90} label="Jours de FDR mobilisable" unit=" j." thresholds={{ ok: 45, warning: 30 }} size="lg" />
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Combien de jours l'établissement peut-il fonctionner ?</p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p>FDR : {formatCurrency(mockIndicators.fdr)} ÷ charge/jour ({formatCurrency(Math.round(chargeFonctionnementJour))})</p>
                  <p className="font-bold">= {mockIndicators.joursFonctionnement} jours de fonctionnement</p>
                  <Separator />
                  <p>FDR mobilisable : {formatCurrency(fdrMobilisable)}</p>
                  <p className="font-bold">= {joursMobilisable} jours mobilisables</p>
                </div>
                <p className="text-xs text-muted-foreground">💡 Le seuil réglementaire est de <strong>30 jours minimum</strong>.</p>
              </CardContent>
            </Card>
          </div>
        );

      /* ═══ NEW: Evolution FDR en jours ═══ */
      case "sante-evolution-fdr":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="5 3" label={{ value: "Seuil 30 j.", fontSize: 9, fill: "hsl(var(--destructive))" }} />
                  <ReferenceLine y={60} stroke="hsl(var(--success))" strokeDasharray="5 3" label={{ value: "Confort 60 j.", fontSize: 9, fill: "hsl(var(--success))" }} />
                  <Area type="monotone" dataKey="joursFDR" name="Jours de FDR" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={3} />
                  <Bar dataKey="joursFDR" name="Jours" fill="hsl(var(--primary))" fillOpacity={0.5} radius={[4, 4, 0, 0]}>
                    {evolutionData.map((d, i) => (
                      <Cell key={i} fill={d.joursFDR < 30 ? "hsl(var(--destructive))" : d.joursFDR < 45 ? "hsl(var(--warning))" : "hsl(var(--success))"} fillOpacity={0.6} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Évolution des jours de FDR</p>
                {evolutionData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-border/30 py-1">
                    <span>{d.year}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{d.joursFDR} j.</span>
                      <div className={`w-2 h-2 rounded-full ${d.joursFDR < 30 ? "bg-destructive" : d.joursFDR < 45 ? "bg-warning" : "bg-success"}`} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  💡 Le seuil minimal est de <strong>30 jours</strong>. Entre 30 et 60 jours, la situation est correcte.
                  Au-delà de 90 jours, le FDR est jugé excessif.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-bfr":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceScale leftLabel="FDR" leftValue={mockIndicators.fdr} rightLabel="BFR" rightValue={mockIndicators.bfr} leftColor="hsl(var(--primary))" rightColor="hsl(var(--warning))" title="Le FDR couvre-t-il le BFR ?" />
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
                  💡 Le <strong>BFR</strong> représente le financement nécessaire pour le cycle d'exploitation courant.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "sante-tresorerie":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span>TOTAL trésorerie</span><span className="text-success">{formatCurrency(mockIndicators.tresorerie)}</span>
                </div>
              </CardContent>
            </Card>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={mockTresorerieDetail.map((t, i) => ({ name: t.label, value: t.montant, fill: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"][i] }))}
                    dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {mockTresorerieDetail.map((_, i) => <Cell key={i} fill={["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"][i]} />)}
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
                </div>
                <GaugeChart value={ratioAutonomie} max={100} label="Autonomie financière" unit="%" thresholds={{ ok: 50, warning: 30 }} size="md" />
              </CardContent>
            </Card>
          </div>
        );

      /* ═══ NEW: Evolution Trésorerie ═══ */
      case "sante-evolution-treso":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="tresorerie" name="Trésorerie brute" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Area type="monotone" dataKey="tresoreriePropre" name="Trésorerie propre" fill="hsl(var(--success))" fillOpacity={0.2} stroke="hsl(var(--success))" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Tendance trésorerie</p>
                {evolutionData.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-border/30 py-1">
                    <span>{d.year}</span>
                    <div className="flex gap-2">
                      <span className="text-primary font-mono">{formatCurrency(d.tresorerie)}</span>
                      <span className="text-success font-mono" style={{ fontSize: 9 }}>{formatCurrency(d.tresoreriePropre)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">Tréso propre N/N-1 :</span>
                  <TrendBadge current={currentYearEvo.tresoreriePropre} previous={previousYearEvo.tresoreriePropre} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 L'écart entre trésorerie brute et propre représente les <strong>fonds qui ne vous appartiennent pas</strong>.
                </p>
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
                    <div className="flex-1 flex justify-between text-sm"><span>{d.name}</span><span className="font-medium">{formatCurrency(d.value)}</span></div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-bold"><span>Total dettes CT</span><span className="text-destructive">{formatCurrency(totalDettes)}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Ces sommes sont dans la trésorerie mais <strong>ne sont pas disponibles</strong>.
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
                    💡 Les créances de plus de 12 mois doivent faire l'objet d'un examen pour <strong>admission en non-valeur</strong>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      /* ═══ NEW: Evolution recouvrement & charges ═══ */
      case "sante-evolution-recouvrement":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[80, 100]} unit="%" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[50, 100]} unit="%" />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={95} stroke="hsl(var(--success))" strokeDasharray="5 3" label={{ value: "Cible 95%", fontSize: 9, fill: "hsl(var(--success))" }} />
                  <Line yAxisId="left" type="monotone" dataKey="tauxRecouvrement" name="Taux de recouvrement (%)" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
                  <Bar yAxisId="right" dataKey="poidsCharges" name="Poids des charges (%)" fill="hsl(var(--warning))" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="poidsSRH" name="Poids SRH (%)" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Ratios clés pluriannuels</p>
                {evolutionData.map((d, i) => (
                  <div key={i} className="text-xs border-b border-border/30 py-1.5 space-y-0.5">
                    <div className="flex justify-between font-medium"><span>{d.year}</span></div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Recouvrement</span><span className={d.tauxRecouvrement >= 95 ? "text-success" : "text-warning"}>{d.tauxRecouvrement.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Charges</span><span>{d.poidsCharges.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  💡 Un <strong>taux de recouvrement &gt; 95%</strong> est l'objectif. La rigidité des charges doit être surveillée.
                </p>
              </CardContent>
            </Card>
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
                  💡 Un <strong>ratio de rigidité élevé</strong> signifie peu de marge de manœuvre pour réduire les charges.
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
                  💡 Un <strong>taux de vétusté &gt; 70%</strong> signale un patrimoine vieillissant.
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
                  <div className="flex justify-between text-xs mb-1"><span>{r.subject}</span><span className="font-medium">{r.value.toFixed(0)}%</span></div>
                  <Progress value={r.value} className="h-2" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">💡 Plus la surface est grande, meilleure est la situation financière.</p>
            </div>
          </div>
        );

      /* ═══ NEW: Radar N vs N-1 ═══ */
      case "sante-evolution-radar":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarPerformance.map((r, i) => ({
                  ...r,
                  valueN1: radarN1 ? radarN1[i].value : 0,
                }))}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Radar name={`${currentYearEvo.year} (N)`} dataKey="value" stroke="hsl(215, 70%, 45%)" fill="hsl(215, 70%, 45%)" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name={`${previousYearEvo.year} (N-1)`} dataKey="valueN1" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 3" />
                  <Legend />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(0)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Comparaison N / N-1</p>
                {radarPerformance.map((r, i) => {
                  const prev = radarN1 ? radarN1[i].value : 0;
                  const diff = r.value - prev;
                  return (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-border/30 py-1">
                      <span className="text-muted-foreground">{r.subject}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{r.value.toFixed(0)}%</span>
                        <Badge className={`text-[8px] border-0 px-1 ${diff >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(0)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  💡 Le radar superposé permet de visualiser l'<strong>évolution de chaque dimension</strong> de la santé financière.
                  La zone bleue (N) doit idéalement être plus grande que la zone orange (N-1).
                </p>
              </CardContent>
            </Card>
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

      {/* Historical data input panel */}
      <HistoricalDataPanel
        onDataChange={setAllYearsData}
        currentYearData={defaultCurrentYear}
      />

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

      {/* Slide strip */}
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
