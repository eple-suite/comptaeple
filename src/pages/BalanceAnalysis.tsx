import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockBalanceData, formatCurrency } from "@/lib/mockData";
import { 
  NOMENCLATURE_M96, trouverCompte, detecterAnomalie, trouverInterconnexions,
  classifierParSource, comptesSubventions, type CompteM96, type SensAnomalie 
} from "@/lib/m96nomenclature";
import {
  validerBalance, SOLDES_ANORMAUX, COMPTES_COLLECTIVITE, COMPTES_ETAT,
  CIRCUIT_BOURSES, REGLES_VALIDATION, type AlerteComptable,
} from "@/lib/regulatoryKnowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend, Cell,
  PieChart as RPieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Brain, AlertTriangle, CheckCircle2, Info, Link2, Sparkles, Loader2, 
  ArrowRight, ChevronDown, ChevronUp, Search, Filter, Zap, Network, Download, Printer
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { CartographieSoldes } from "@/components/cofieple/CartographieSoldes";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { AnomaliesPanelM96 } from "@/components/balance/AnomaliesPanelM96";

// ─── Enrichir les données balance avec la nomenclature M9-6 ───
interface EnrichedBalanceRow {
  classe: string;
  label: string;
  debit: number;
  credit: number;
  solde: number;
  compteRef?: CompteM96;
  anomalie: SensAnomalie;
  messageAnomalie?: string;
  interconnexions: CompteM96[];
}

function enrichBalance(data: typeof mockBalanceData): EnrichedBalanceRow[] {
  return data.map(row => {
    const classeNum = row.classe.replace("Classe ", "");
    const compteRef = NOMENCLATURE_M96.find(c => c.classe === parseInt(classeNum) && c.numero.length <= 2);
    const anomalyCheck = compteRef ? detecterAnomalie(compteRef, row.solde) : { anomalie: "normal" as SensAnomalie };
    const interconnexions = compteRef ? trouverInterconnexions(compteRef) : [];
    return {
      ...row,
      compteRef,
      anomalie: anomalyCheck.anomalie,
      messageAnomalie: anomalyCheck.message,
      interconnexions,
    };
  });
}

// ─── Données détaillées par sous-compte (simulation réaliste) ───
const detailedAccounts = [
  // Classe 1
  { numero: "102", label: "Dotation", debit: 0, credit: 850000, solde: -850000 },
  { numero: "106", label: "Réserves", debit: 0, credit: 185000, solde: -185000 },
  { numero: "12", label: "Résultat de l'exercice", debit: 0, credit: 15230, solde: -15230 },
  { numero: "131", label: "Subventions investissement — État", debit: 0, credit: 42000, solde: -42000 },
  { numero: "132", label: "Subventions investissement — Collectivités", debit: 0, credit: 120000, solde: -120000 },
  { numero: "15", label: "Provisions pour risques et charges", debit: 0, credit: 37770, solde: -37770 },
  // Classe 2
  { numero: "21", label: "Immobilisations corporelles", debit: 820000, credit: 0, solde: 820000 },
  { numero: "23", label: "Immobilisations en cours", debit: 30000, credit: 0, solde: 30000 },
  { numero: "28", label: "Amortissements", debit: 0, credit: 120000, solde: -120000 },
  // Classe 3
  { numero: "31", label: "Stocks de denrées", debit: 33000, credit: 0, solde: 33000 },
  { numero: "39", label: "Dépréciations de stocks", debit: 0, credit: 2000, solde: -2000 },
  // Classe 4
  { numero: "401", label: "Fournisseurs", debit: 1780000, credit: 1792300, solde: -12300 },
  { numero: "4112", label: "Familles — Demi-pensionnaires", debit: 245000, credit: 237500, solde: 7500 },
  { numero: "4113", label: "Familles — Internes", debit: 75000, credit: 70000, solde: 5000 },
  { numero: "416", label: "Créances douteuses", debit: 3200, credit: 0, solde: 3200 },
  { numero: "421", label: "Personnel — Rémunérations dues", debit: 712000, credit: 716500, solde: -4500 },
  { numero: "4411", label: "État — Subventions à recevoir", debit: 165230, credit: 165230, solde: 0 },
  { numero: "4412", label: "Collectivité de rattachement — Subventions à recevoir", debit: 0, credit: 0, solde: 0 },
  { numero: "441220", label: "DGF — Dotation globale fonctionnement", debit: 0, credit: 0, solde: 0 },
  { numero: "44311", label: "Bourses nationales — Crédit à répartir", debit: 305000, credit: 313700, solde: -8700 },
  { numero: "44312", label: "Bourses nationales — Part familles", debit: 2500, credit: 1800, solde: 700 },
  { numero: "4438", label: "Fonds sociaux État", debit: 8200, credit: 12000, solde: -3800 },
  { numero: "467", label: "Comptes transitoires", debit: 1250, credit: 0, solde: 1250 },
  { numero: "491", label: "Dépréciation créances", debit: 0, credit: 2800, solde: -2800 },
  // Classe 5
  { numero: "515", label: "Compte au Trésor", debit: 575000, credit: 416580, solde: 158420 },
  { numero: "531", label: "Caisse", debit: 5000, credit: 2650, solde: 2350 },
  { numero: "511", label: "Valeurs à encaisser", debit: 6612, credit: 0, solde: 6612 },
  // Classe 6
  { numero: "60", label: "Achats et variations de stocks", debit: 425000, credit: 8000, solde: 417000 },
  { numero: "61", label: "Services extérieurs", debit: 185000, credit: 2000, solde: 183000 },
  { numero: "62", label: "Autres services extérieurs", debit: 142000, credit: 3000, solde: 139000 },
  { numero: "64", label: "Charges de personnel", debit: 845000, credit: 5000, solde: 840000 },
  { numero: "65", label: "Autres charges courantes", debit: 95000, credit: 2000, solde: 93000 },
  { numero: "6571", label: "Fonds sociaux — Aides versées", debit: 8200, credit: 0, solde: 8200 },
  { numero: "68", label: "Dotations amortissements/provisions", debit: 150000, credit: 5000, solde: 145000 },
  // Classe 7
  { numero: "70622", label: "Demi-pension — Élèves", debit: 0, credit: 542000, solde: -542000 },
  { numero: "70623", label: "Internat — Élèves", debit: 0, credit: 185000, solde: -185000 },
  { numero: "7411", label: "Subventions État — Fonctionnement", debit: 0, credit: 612000, solde: -612000 },
  { numero: "74121", label: "Subventions Région — Fonctionnement", debit: 0, credit: 465230, solde: -465230 },
  { numero: "74122", label: "Subventions Département — Fonctionnement", debit: 0, credit: 42000, solde: -42000 },
  { numero: "78", label: "Reprises amort./provisions", debit: 0, credit: 9000, solde: -9000 },
];

// Enrichir les sous-comptes
const enrichedDetailed = detailedAccounts.map(acc => {
  const ref = trouverCompte(acc.numero);
  const anomaly = ref ? detecterAnomalie(ref, acc.solde) : { anomalie: "normal" as SensAnomalie };
  const intercos = ref ? trouverInterconnexions(ref) : [];
  return { ...acc, compteRef: ref, anomalie: anomaly.anomalie, messageAnomalie: anomaly.message, interconnexions: intercos };
});

// ─── Composant principal ───
const BalanceAnalysis = () => {
  const [activeTab, setActiveTab] = useState("vue-globale");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedCompte, setExpandedCompte] = useState<string | null>(null);
  const [filterAnomalie, setFilterAnomalie] = useState<SensAnomalie | "all">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [selectedCompte, setSelectedCompte] = useState<typeof enrichedDetailed[0] | null>(null);

  const enrichedData = useMemo(() => enrichBalance(mockBalanceData), []);
  const totalDebit = mockBalanceData.reduce((s, r) => s + r.debit, 0);
  const totalCredit = mockBalanceData.reduce((s, r) => s + r.credit, 0);

  // Données réelles de balance depuis le store cofieple (avec fallback sur les détails enrichis)
  const storeBalance = useCofiepleStore(s => s.balance);
  const storeBalance1 = useCofiepleStore(s => s.balance1);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const cartoBalanceN = useMemo(() => {
    const real = storeBalance?.[activeBudget] || [];
    if (real.length > 0) return real;
    // Fallback : utiliser les detailedAccounts (mockés) pour rester démo-able
    return enrichedDetailed.map(a => ({
      compte: a.numero, intituleReduit: a.label,
      solDbt: a.debit, solCrd: a.credit,
    }));
  }, [storeBalance, activeBudget]);
  const cartoBalanceN1 = useMemo(() => storeBalance1?.[activeBudget] || [], [storeBalance1, activeBudget]);

  const anomaliesCount = enrichedDetailed.filter(c => c.anomalie !== "normal").length;
  const critiquesCount = enrichedDetailed.filter(c => c.anomalie === "critique").length;

  // Validation réglementaire automatique
  const validationAlertes = useMemo(() => validerBalance(detailedAccounts.map(a => ({ ...a, libelle: a.label }))), []);

  // Sources de financement
  const sourcesData = useMemo(() => {
    const sources = classifierParSource(detailedAccounts.filter(a => {
      const ref = trouverCompte(a.numero);
      return ref?.estSubvention || ref?.sourceFinancement;
    }));
    return Object.entries(sources)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => ({
        name: { etat: "État", collectivite: "Collectivités", familles: "Familles", propre: "Ressources propres", mixte: "Mixte", inconnu: "Non classé" }[k] || k,
        value: v,
        fill: { etat: "hsl(215, 70%, 45%)", collectivite: "hsl(280, 60%, 55%)", familles: "hsl(38, 92%, 50%)", propre: "hsl(160, 45%, 45%)", mixte: "hsl(215, 25%, 65%)", inconnu: "hsl(0, 0%, 60%)" }[k] || "hsl(0,0%,50%)",
      }));
  }, []);

  // Subventions uniquement
  const subventionsData = useMemo(() => {
    return enrichedDetailed
      .filter(a => a.compteRef?.estSubvention)
      .map(a => ({
        name: `${a.numero} ${a.label}`,
        credit: a.credit,
        debit: a.debit,
        solde: a.solde,
        source: a.compteRef?.sourceFinancement,
      }));
  }, []);

  // Filtrage
  const filteredDetailed = useMemo(() => {
    let data = enrichedDetailed;
    if (filterAnomalie !== "all") data = data.filter(c => c.anomalie === filterAnomalie);
    if (filterSource !== "all") data = data.filter(c => c.compteRef?.sourceFinancement === filterSource);
    return data;
  }, [filterAnomalie, filterSource]);

  // ─── Lancer l'analyse IA ───
  const launchAiAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAiAnalysis("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          balanceData: detailedAccounts,
          establishmentName: "Lycée Exemple",
          year: 2023,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Erreur de l'analyse");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiAnalysis(fullText);
            }
          } catch { /* partial */ }
        }
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis("❌ Erreur lors de l'analyse. Veuillez réessayer.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // ─── Treemap data ───
  const treemapData = useMemo(() => {
    return enrichedDetailed
      .filter(a => Math.abs(a.solde) > 1000)
      .map(a => ({
        name: `${a.numero} ${a.label}`,
        size: Math.abs(a.solde),
        fill: a.anomalie === "critique" ? "hsl(0, 70%, 55%)" : a.anomalie === "attention" ? "hsl(38, 92%, 50%)" : a.solde >= 0 ? "hsl(215, 70%, 45%)" : "hsl(160, 45%, 45%)",
      }));
  }, []);

  const anomalieBadge = (a: SensAnomalie) => {
    if (a === "critique") return <Badge variant="destructive" className="text-[10px] animate-pulse">Critique</Badge>;
    if (a === "attention") return <Badge className="text-[10px] bg-warning text-warning-foreground">Attention</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Normal</Badge>;
  };

  const sourceBadge = (src?: string) => {
    if (!src) return null;
    const colors: Record<string, string> = {
      etat: "bg-primary/10 text-primary border-primary/30",
      collectivite: "bg-purple-100 text-purple-700 border-purple-300",
      familles: "bg-warning/10 text-amber-700 border-warning/30",
      propre: "bg-secondary/10 text-secondary border-secondary/30",
    };
    const labels: Record<string, string> = { etat: "État", collectivite: "Collectivité", familles: "Familles", propre: "Propre", mixte: "Mixte" };
    return <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border", colors[src] || "")}>{labels[src] || src}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Analyse intelligente de la balance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Nomenclature M9-6 • Détection d'anomalies • Analyse IA en temps réel</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => {
            const doc = createStyledPDF({ title: "Analyse de la balance comptable", subtitle: "Nomenclature M9-6 — Détail par sous-comptes" });
            autoTable(doc, {
              startY: 48,
              head: [["Compte", "Libellé", "Débits", "Crédits", "Solde", "Anomalie"]],
              body: enrichedDetailed.map(a => [a.numero, a.label, formatCurrency(a.debit), formatCurrency(a.credit), formatCurrency(a.solde), a.anomalie === "critique" ? "⚠️ CRITIQUE" : a.anomalie === "attention" ? "⚠ Attention" : "Normal"]),
              headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
              alternateRowStyles: { fillColor: [240, 244, 248] },
              margin: { left: 10, right: 10 },
              columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
              styles: { fontSize: 8 },
            });
            const y2 = (doc as any).lastAutoTable.finalY + 8;
            if (subventionsData.length > 0) {
              doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 68, 120);
              doc.text("Subventions", 14, y2);
              autoTable(doc, {
                startY: y2 + 4,
                head: [["Compte", "Source", "Crédits", "Débits", "Solde"]],
                body: subventionsData.map(s => [s.name, s.source || "—", formatCurrency(s.credit), formatCurrency(s.debit), formatCurrency(s.solde)]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 8 },
              });
            }
            printPDF(doc);
          }}>
            <Printer className="h-4 w-4 mr-1" /> Imprimer
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const doc = createStyledPDF({ title: "Analyse de la balance comptable", subtitle: "Nomenclature M9-6 — Détail par sous-comptes" });
            autoTable(doc, {
              startY: 48,
              head: [["Compte", "Libellé", "Débits", "Crédits", "Solde", "Anomalie"]],
              body: enrichedDetailed.map(a => [a.numero, a.label, formatCurrency(a.debit), formatCurrency(a.credit), formatCurrency(a.solde), a.anomalie === "critique" ? "CRITIQUE" : a.anomalie === "attention" ? "Attention" : "Normal"]),
              headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
              alternateRowStyles: { fillColor: [240, 244, 248] },
              margin: { left: 10, right: 10 },
              columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
              styles: { fontSize: 8 },
            });
            const y2 = (doc as any).lastAutoTable.finalY + 8;
            if (subventionsData.length > 0) {
              doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 68, 120);
              doc.text("Subventions", 14, y2);
              autoTable(doc, {
                startY: y2 + 4,
                head: [["Compte", "Source", "Crédits", "Débits", "Solde"]],
                body: subventionsData.map(s => [s.name, s.source || "—", formatCurrency(s.credit), formatCurrency(s.debit), formatCurrency(s.solde)]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 8 },
              });
            }
            savePDF(doc, `Balance_M96_${new Date().toISOString().split("T")[0]}.pdf`);
          }}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button onClick={launchAiAnalysis} disabled={isAnalyzing} className="gap-2 shadow-md">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
          </Button>
        </div>
      </div>

      {/* KPI avec anomalies */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="shadow-card text-center p-4">
          <p className="text-xl font-bold font-display text-primary">{formatCurrency(totalDebit)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Total Débits</p>
        </Card>
        <Card className="shadow-card text-center p-4">
          <p className="text-xl font-bold font-display text-secondary">{formatCurrency(totalCredit)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Total Crédits</p>
        </Card>
        <Card className="shadow-card text-center p-4">
          <p className={cn("text-xl font-bold font-display", totalDebit - totalCredit >= 0 ? "text-primary" : "text-secondary")}>
            {formatCurrency(totalDebit - totalCredit)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Solde net</p>
        </Card>
        <Card className={cn("shadow-card text-center p-4", anomaliesCount > 0 && "border-warning/50")}>
          <p className="text-xl font-bold font-display text-warning">{anomaliesCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Anomalies détectées</p>
        </Card>
        <Card className={cn("shadow-card text-center p-4", critiquesCount > 0 && "border-destructive/50 animate-pulse")}>
          <p className="text-xl font-bold font-display text-destructive">{critiquesCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Alertes critiques</p>
        </Card>
      </div>

      {/* Panneau de validation réglementaire */}
      {validationAlertes.length > 0 && (
        <Card className="shadow-card border-warning/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Validation réglementaire automatique — {validationAlertes.length} alerte{validationAlertes.length > 1 ? "s" : ""}
              <span className="text-[10px] font-normal text-muted-foreground ml-2">
                M9-6 • Décret 2012-1246 • Circuit bourses • Distinction État/Collectivité
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {validationAlertes.filter(a => a.gravite === "bloquant").map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-destructive">{a.titre}</p>
                  <p className="text-[10px] text-muted-foreground">{a.message}</p>
                  <p className="text-[10px] text-foreground mt-0.5">→ {a.action}</p>
                </div>
              </div>
            ))}
            {validationAlertes.filter(a => a.gravite === "majeur").map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded bg-warning/5 border border-warning/20">
                <Info className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-warning">{a.titre}</p>
                  <p className="text-[10px] text-muted-foreground">{a.message}</p>
                  <p className="text-[10px] text-foreground mt-0.5">→ {a.action}</p>
                </div>
              </div>
            ))}
            {validationAlertes.filter(a => a.gravite === "info").map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{a.titre}</p>
                  <p className="text-[10px] text-muted-foreground">{a.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="vue-globale" className="gap-1 text-xs"><BarChart className="h-3 w-3" />Vue globale</TabsTrigger>
          <TabsTrigger value="sous-comptes" className="gap-1 text-xs"><Search className="h-3 w-3" />Sous-comptes M9-6</TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Anomalies</TabsTrigger>
          <TabsTrigger value="subventions" className="gap-1 text-xs"><Filter className="h-3 w-3" />Subventions</TabsTrigger>
          <TabsTrigger value="interconnexions" className="gap-1 text-xs"><Network className="h-3 w-3" />Interconnexions</TabsTrigger>
          <TabsTrigger value="ia-analyse" className="gap-1 text-xs"><Brain className="h-3 w-3" />Analyse IA</TabsTrigger>
        </TabsList>

        {/* ═══ VUE GLOBALE ═══ */}
        <TabsContent value="vue-globale" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Débits & Crédits par classe</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockBalanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                    <XAxis dataKey="classe" fontSize={10} tickFormatter={v => v.replace("Classe ", "C")} />
                    <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="debit" name="Débits" fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="credit" name="Crédits" fill="hsl(160,45%,45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sources de financement */}
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sources de financement</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RPieChart>
                    <Pie data={sourcesData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourcesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  </RPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cartographie premium — Treemap hiérarchique par classe M9-6 */}
            <div className="lg:col-span-2">
              <CartographieSoldes balanceN={cartoBalanceN} balanceN1={cartoBalanceN1} />
            </div>
          </div>

          {/* Balance par classe enrichie */}
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Balance par classe — enrichie M9-6</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Débits</TableHead>
                    <TableHead className="text-right">Crédits</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Sens attendu</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedData.map((row) => (
                    <TableRow key={row.classe} className={cn(row.anomalie === "critique" && "bg-destructive/5", row.anomalie === "attention" && "bg-warning/5")}>
                      <TableCell className="font-medium">{row.classe}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.label}
                          {row.compteRef?.sourceFinancement && sourceBadge(row.compteRef.sourceFinancement)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(row.debit)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(row.credit)}</TableCell>
                      <TableCell className={cn("text-right font-mono text-sm font-semibold",
                        row.anomalie === "critique" ? "text-destructive" : row.anomalie === "attention" ? "text-warning" : "text-foreground"
                      )}>
                        {formatCurrency(row.solde)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.compteRef?.sensNormal === "debiteur" ? "📈 Débiteur" : "📉 Créditeur"}
                      </TableCell>
                      <TableCell>{anomalieBadge(row.anomalie)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SOUS-COMPTES M9-6 ═══ */}
        <TabsContent value="sous-comptes" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button variant={filterAnomalie === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterAnomalie("all")}>Tous</Button>
            <Button variant={filterAnomalie === "critique" ? "destructive" : "outline"} size="sm" onClick={() => setFilterAnomalie("critique")}>
              <AlertTriangle className="h-3 w-3 mr-1" />Critiques ({enrichedDetailed.filter(c => c.anomalie === "critique").length})
            </Button>
            <Button variant={filterAnomalie === "attention" ? "default" : "outline"} size="sm" className={filterAnomalie === "attention" ? "bg-warning text-warning-foreground" : ""} onClick={() => setFilterAnomalie("attention")}>
              Attention ({enrichedDetailed.filter(c => c.anomalie === "attention").length})
            </Button>
            <div className="border-l mx-2" />
            <Button variant={filterSource === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterSource("all")}>Toutes sources</Button>
            <Button variant={filterSource === "etat" ? "default" : "outline"} size="sm" onClick={() => setFilterSource("etat")}>État</Button>
            <Button variant={filterSource === "collectivite" ? "default" : "outline"} size="sm" onClick={() => setFilterSource("collectivite")}>Collectivités</Button>
            <Button variant={filterSource === "familles" ? "default" : "outline"} size="sm" onClick={() => setFilterSource("familles")}>Familles</Button>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Compte</TableHead>
                    <TableHead>Libellé M9-6</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Sens attendu</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetailed.map((acc) => (
                    <>
                      <TableRow 
                        key={acc.numero}
                        className={cn(
                          "cursor-pointer transition-colors",
                          acc.anomalie === "critique" && "bg-destructive/5 hover:bg-destructive/10",
                          acc.anomalie === "attention" && "bg-warning/5 hover:bg-warning/10",
                          selectedCompte?.numero === acc.numero && "ring-2 ring-primary/30",
                        )}
                        onClick={() => setSelectedCompte(selectedCompte?.numero === acc.numero ? null : acc)}
                      >
                        <TableCell className="font-mono font-bold text-sm">{acc.numero}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{acc.label}</span>
                            {acc.compteRef?.description && (
                              <Tooltip>
                                <TooltipTrigger><Info className="h-3 w-3 inline ml-1 text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">{acc.compteRef.description}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sourceBadge(acc.compteRef?.sourceFinancement)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(acc.debit)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(acc.credit)}</TableCell>
                        <TableCell className={cn("text-right font-mono text-sm font-semibold",
                          acc.anomalie === "critique" ? "text-destructive" : acc.anomalie === "attention" ? "text-warning" : ""
                        )}>
                          {formatCurrency(acc.solde)}
                        </TableCell>
                        <TableCell className="text-xs">{acc.compteRef?.sensNormal === "debiteur" ? "📈 Débit" : "📉 Crédit"}</TableCell>
                        <TableCell>{anomalieBadge(acc.anomalie)}</TableCell>
                        <TableCell>
                          {selectedCompte?.numero === acc.numero ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {selectedCompte?.numero === acc.numero && (
                          <TableRow key={`${acc.numero}-detail`}>
                            <TableCell colSpan={9} className="p-0">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-4 bg-muted/30 space-y-3">
                                  {acc.messageAnomalie && (
                                    <div className={cn("p-3 rounded-lg text-sm flex items-start gap-2",
                                      acc.anomalie === "critique" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
                                    )}>
                                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                      {acc.messageAnomalie}
                                    </div>
                                  )}
                                  {acc.compteRef?.description && (
                                    <div className="p-3 rounded-lg bg-primary/5 text-sm">
                                      <span className="font-semibold text-primary">📖 M9-6 :</span> {acc.compteRef.description}
                                    </div>
                                  )}
                                  {acc.interconnexions.length > 0 && (
                                    <div className="p-3 rounded-lg bg-secondary/5 text-sm">
                                      <span className="font-semibold text-secondary flex items-center gap-1 mb-1">
                                        <Link2 className="h-3 w-3" /> Comptes interconnectés :
                                      </span>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {acc.interconnexions.map(ic => (
                                          <span key={ic.numero} className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded border text-xs">
                                            <span className="font-mono font-bold">{ic.numero}</span>
                                            <span className="text-muted-foreground">{ic.libelle}</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ANOMALIES ═══ */}
        <TabsContent value="anomalies" className="space-y-4">
          {enrichedDetailed.filter(a => a.anomalie !== "normal").length === 0 ? (
            <Card className="shadow-card p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-secondary mx-auto mb-3" />
              <p className="text-lg font-semibold">Aucune anomalie détectée</p>
              <p className="text-sm text-muted-foreground">Tous les soldes sont conformes au sens attendu M9-6</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrichedDetailed.filter(a => a.anomalie !== "normal").sort((a, b) => (a.anomalie === "critique" ? -1 : 1)).map(acc => (
                <motion.div key={acc.numero} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className={cn("shadow-card border-l-4",
                    acc.anomalie === "critique" ? "border-l-destructive" : "border-l-warning"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg">{acc.numero}</span>
                            <span className="font-semibold">{acc.label}</span>
                            {anomalieBadge(acc.anomalie)}
                            {sourceBadge(acc.compteRef?.sourceFinancement)}
                          </div>
                          <p className="text-sm text-muted-foreground">{acc.messageAnomalie}</p>
                          {acc.compteRef?.description && (
                            <p className="text-xs text-muted-foreground mt-1">📖 {acc.compteRef.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xl font-mono font-bold", acc.anomalie === "critique" ? "text-destructive" : "text-warning")}>
                            {formatCurrency(acc.solde)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Attendu : {acc.compteRef?.sensNormal === "debiteur" ? "Débiteur" : "Créditeur"}
                          </p>
                        </div>
                      </div>
                      {acc.interconnexions.length > 0 && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">Vérifier aussi :</span>
                          {acc.interconnexions.map(ic => (
                            <Badge key={ic.numero} variant="outline" className="text-[10px] font-mono">{ic.numero} {ic.libelle}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ SUBVENTIONS ═══ */}
        <TabsContent value="subventions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition État / Collectivités / Familles</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <Pie data={sourcesData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourcesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  </RPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Comptes de subventions</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subventionsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                    <XAxis type="number" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={150} fontSize={9} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="credit" name="Crédits (reçus)" fill="hsl(160,45%,45%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="debit" name="Débits (utilisés)" fill="hsl(215,70%,45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Focus : Circuit des bourses nationales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap p-4 bg-primary/5 rounded-lg">
                <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                  <p className="font-mono font-bold text-primary">44311</p>
                  <p className="text-[10px] text-muted-foreground">Bourses — Crédit à répartir</p>
                  <p className="font-mono text-sm font-semibold mt-1">{formatCurrency(-8700)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                  <p className="font-mono font-bold text-primary">4112</p>
                  <p className="text-[10px] text-muted-foreground">Familles DP</p>
                  <p className="font-mono text-sm font-semibold mt-1">{formatCurrency(7500)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                  <p className="font-mono font-bold text-secondary">44312</p>
                  <p className="text-[10px] text-muted-foreground">Part familles (remb.)</p>
                  <p className="font-mono text-sm font-semibold mt-1">{formatCurrency(700)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                  <p className="font-mono font-bold">515</p>
                  <p className="text-[10px] text-muted-foreground">Compte au Trésor</p>
                  <p className="font-mono text-sm font-semibold mt-1">{formatCurrency(158420)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Le 44311 reçoit les avances de l'État au crédit. Le débit est mouvementé par imputation sur les comptes familles (4112/4113). 
                Le 44312 représente la part excédentaire à rembourser directement aux familles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INTERCONNEXIONS ═══ */}
        <TabsContent value="interconnexions" className="space-y-4">
          <p className="text-sm text-muted-foreground">Visualisation des liens entre comptes pour éviter les doubles saisies et garantir la cohérence.</p>
          
          {/* Interconnexion groups */}
          {[
            { title: "🏛️ Bourses nationales", comptes: ["44311", "44312", "4112", "4113", "70622", "70623"], color: "primary" },
            { title: "🏗️ Subventions collectivités", comptes: ["4411", "4412", "7411", "7412", "132"], color: "purple-600" },
            { title: "🤝 Fonds sociaux", comptes: ["4438", "6571"], color: "warning" },
            { title: "📊 Amortissements", comptes: ["21", "28", "681"], color: "secondary" },
            { title: "⚠️ Créances douteuses", comptes: ["416", "491", "654", "681"], color: "destructive" },
            { title: "💰 Trésorerie", comptes: ["515", "531", "511"], color: "primary" },
          ].map(group => (
            <Card key={group.title} className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{group.title}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {group.comptes.map((num, i) => {
                    const acc = enrichedDetailed.find(a => a.numero === num);
                    const ref = trouverCompte(num);
                    return (
                      <div key={num} className="flex items-center gap-2">
                        {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        <div className={cn("p-2 rounded-lg border text-center min-w-[100px]",
                          acc?.anomalie === "critique" ? "border-destructive bg-destructive/5" :
                          acc?.anomalie === "attention" ? "border-warning bg-warning/5" :
                          "bg-muted/30"
                        )}>
                          <p className="font-mono font-bold text-sm">{num}</p>
                          <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{ref?.libelle || acc?.label}</p>
                          {acc && <p className="font-mono text-xs font-semibold mt-0.5">{formatCurrency(acc.solde)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ ANALYSE IA ═══ */}
        <TabsContent value="ia-analyse" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Analyse IA de la balance comptable
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!aiAnalysis && !isAnalyzing ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyse IA disponible</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    L'IA va analyser votre balance comptable en profondeur selon la nomenclature M9-6, 
                    détecter les anomalies, vérifier les interconnexions et formuler des préconisations opérationnelles.
                  </p>
                  <Button onClick={launchAiAnalysis} size="lg" className="gap-2">
                    <Brain className="h-5 w-5" />
                    Lancer l'analyse complète
                  </Button>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-primary mb-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Analyse en cours...</span>
                    </div>
                  )}
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BalanceAnalysis;
