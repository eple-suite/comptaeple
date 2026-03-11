// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Module Fonds de Roulement Augmenté
// Fusion intelligente : best-of existant + Claude
// Conforme DAF A3 & M9-6 2026
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import {
  mockIndicators, mockEvolutionData, mockDettes,
  mockFragiliteFDR, formatCurrency,
} from "@/lib/mockData";
import {
  Wallet, ArrowDownUp, Landmark, ShieldCheck, PackageMinus,
  Download, AlertTriangle, CheckCircle, Banknote, Info, Sparkles,
  ArrowDown, ArrowUp, Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { generateWorkingCapitalPDF } from "@/lib/pdfWorkingCapital";
import { CircularGauge, ProgressBarZoned } from "./working-capital/FdrGauges";
import { StructureBilan } from "./working-capital/FdrStructureBilan";
import { SimulateurPrelevement } from "./working-capital/FdrSimulateur";
import { TableauPrelevements } from "./working-capital/FdrPrelevements";
import { FdrHistorique } from "./working-capital/FdrHistorique";
import { TableauFinancement } from "./working-capital/FdrTableauFinancement";
import {
  type DonneesFinancieres, type Prelevement, type ResultatAnalyse,
  calculerAnalyse, SEUIL_CRITIQUE_JOURS,
} from "./working-capital/types";
import { useCofiepleStore } from "@/store/useCofiepleStore";

const WorkingCapital = () => {
  const { selectedEstablishment } = useEstablishment();

  // Données financières (mock pour l'instant — sera connecté au m96engine)
  const [donnees] = useState<DonneesFinancieres>({
    immobilisationsNettes: 1250000,
    dotationsReserves: 890000,
    reportANouveau: 125000,
    resultatExercice: 45000,
    subventionsInvestissement: 320000,
    provisionsRisques: 35000,
    emprunts: 0,
    stocks: mockFragiliteFDR.stocks,
    creancesClients: mockFragiliteFDR.creancesAnciennes,
    autresCreances: 15000,
    disponibilites: 285000,
    dettesFournisseurs: 65000,
    autresDettes: 18000,
    produitsConstatesAvance: 95000,
    chargesAnnuelles: 1850000,
    resteAMandater: 12000,
    commandesNonSoldees: 8500,
  });

  const [prelevements, setPrelevements] = useState<Prelevement[]>([
    { id: '1', dateCA: '15/11/2025', numeroDBM: 'DBM n°1', objet: 'Équipement informatique salle multimédia', codeActivite: '0FDISP1', montantVote: 25000, montantExecute: 24850, statut: 'execute' },
    { id: '2', dateCA: '06/02/2026', numeroDBM: 'DBM n°2', objet: 'Rénovation mobilier CDI', codeActivite: '0FDISP2', montantVote: 18000, montantExecute: 0, statut: 'vote' },
  ]);

  const analyse = useMemo(() => calculerAnalyse(donnees, prelevements), [donnees, prelevements]);
  const chargesJournalieres = donnees.chargesAnnuelles / 365;

  // Compat with existing KPI view
  const totalFragilite = mockFragiliteFDR.stocks + mockFragiliteFDR.creancesAnciennes + mockFragiliteFDR.compte416;
  const fdrBrut = mockIndicators.fdr;
  const fdrMobilisable = fdrBrut - totalFragilite;
  const chargeFonctionnementJour = fdrBrut / mockIndicators.joursFonctionnement;
  const joursMobilisable = Math.round(fdrMobilisable / chargeFonctionnementJour);

  // Trésorerie propre
  const totalDettes = mockDettes.subventions + mockDettes.reliquatsSubventions + mockDettes.avancesEleves + mockDettes.avancesCommensaux;
  const tresoreriePropre = mockIndicators.tresorerie - totalDettes;

  // Pie data
  const pieAvant = [
    { name: "FDR mobilisable", value: fdrMobilisable, fill: "hsl(215, 70%, 45%)" },
    { name: "Fragilité", value: totalFragilite, fill: "hsl(280, 50%, 55%)" },
    { name: "BFR", value: mockIndicators.bfr, fill: "hsl(38, 92%, 50%)" },
  ];

  const handleAddPrelevement = () => {
    setPrelevements(prev => [...prev, {
      id: Date.now().toString(),
      dateCA: new Date().toLocaleDateString('fr-FR'),
      numeroDBM: `DBM n°${prev.length + 1}`,
      objet: '', codeActivite: `0FDISP${prev.length + 1}`,
      montantVote: 0, montantExecute: 0, statut: 'vote',
    }]);
  };

  const handleUpdatePrelevement = (id: string, field: keyof Prelevement, value: any) => {
    setPrelevements(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handlePrint = () => {
    generateWorkingCapitalPDF({
      fdr: fdrBrut, bfr: mockIndicators.bfr, tresorerie: mockIndicators.tresorerie,
      joursFonctionnement: mockIndicators.joursFonctionnement,
      tresoreriePropre, totalDettes, dettes: mockDettes,
      fragiliteFDR: mockFragiliteFDR, totalFragilite, fdrMobilisable, joursMobilisable,
      montantPrelevement: 0, prelevementsAutorises: 0,
      fdrApres: fdrMobilisable, joursApres: joursMobilisable,
      isPrelevementViable: true, evolutionData: mockEvolutionData,
    });
  };

  // Health badge
  const healthColor = {
    excellent: 'default' as const, bon: 'secondary' as const,
    attention: 'outline' as const, critique: 'destructive' as const,
  };
  const healthLabel = {
    excellent: '🟢 Excellent', bon: '🔵 Favorable',
    attention: '🟡 Vigilance', critique: '🔴 Critique',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Fonds de roulement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse FDR / BFR / Trésorerie — {selectedEstablishment?.name || 'Sélectionnez un établissement'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={healthColor[analyse.indicateurSante]}>
            {healthLabel[analyse.indicateurSante]}
          </Badge>
          <Button size="sm" onClick={handlePrint} className="gradient-primary border-0">
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="dashboard" className="space-y-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="simulateur">Simulateur</TabsTrigger>
          <TabsTrigger value="prelevements">DBM</TabsTrigger>
          <TabsTrigger value="historique">Historique N à N-4</TabsTrigger>
        </TabsList>

        {/* ═══════ DASHBOARD ═══════ */}
        <TabsContent value="dashboard" className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="FDR brut" value={formatCurrency(fdrBrut)} trend={3.3} icon={Wallet} variant="primary" />
            <KpiCard title="FDR mobilisable" value={formatCurrency(fdrMobilisable)} subtitle={`${joursMobilisable} jours`} icon={PackageMinus} variant="success" />
            <KpiCard title="BFR" value={formatCurrency(mockIndicators.bfr)} trend={4.6} icon={ArrowDownUp} variant="warning" />
            <KpiCard title="Trésorerie nette" value={formatCurrency(mockIndicators.tresorerie)} trend={2.7} icon={Landmark} variant="success" />
            <KpiCard title="Trésorerie propre" value={formatCurrency(tresoreriePropre)} subtitle="Autonomie financière" icon={ShieldCheck} variant={tresoreriePropre > 0 ? "success" : "warning"} />
          </div>

          {/* Jauge + Indicateurs clés */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="flex flex-col items-center justify-center p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Jours de fonctionnement
              </p>
              <CircularGauge value={analyse.joursfonctionnement} />
              <div className="mt-4 w-full">
                <ProgressBarZoned value={analyse.joursfonctionnement} />
              </div>
            </Card>

            <Card className="lg:col-span-2 p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Indicateurs clés
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Fonds de roulement', value: analyse.fondsRoulement, colored: true },
                  { label: 'FDR mobilisable', value: analyse.fondsRoulementMobilisable, colored: true },
                  { label: 'Besoin en FR', value: analyse.besoinFondsRoulement },
                  { label: 'Seuil critique (30j)', value: analyse.seuilCritique },
                  { label: 'Trésorerie nette', value: analyse.tresorerieNette, colored: true },
                  { label: 'Marge de prélèvement', value: analyse.margePrelevement },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className={`font-mono font-semibold text-sm ${item.colored ? (item.value >= 0 ? 'text-success' : 'text-destructive') : ''}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Ratios */}
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Ratio de liquidité</span>
                    <Badge variant={analyse.ratioLiquidite >= 1 ? 'default' : 'destructive'} className="text-[10px]">
                      {analyse.ratioLiquidite.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${analyse.ratioLiquidite >= 1 ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${Math.min(analyse.ratioLiquidite * 50, 100)}%` }} />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Couverture du BFR</span>
                    <Badge variant={analyse.tauxCouvertureBFR >= 100 ? 'default' : 'destructive'} className="text-[10px]">
                      {analyse.tauxCouvertureBFR.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${analyse.tauxCouvertureBFR >= 100 ? 'bg-success' : 'bg-destructive'}`}
                      style={{ width: `${Math.min(analyse.tauxCouvertureBFR, 100)}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* FDR mobilisable — détail fragilité */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">FDR mobilisable (base de décision pour le CA)</CardTitle>
                <Badge variant="secondary" className="text-xs">Base de décision</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                FDR mobilisable = FDR brut − Stocks − Créances anciennes − Compte 416000
              </p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">FDR brut</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(fdrBrut)}</p>
                </div>
                <div className="flex items-center justify-center text-xl text-muted-foreground font-bold">−</div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Éléments de fragilité</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(totalFragilite)}</p>
                  <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                    <p>Stocks : {formatCurrency(mockFragiliteFDR.stocks)}</p>
                    <p>Créances anciennes : {formatCurrency(mockFragiliteFDR.creancesAnciennes)}</p>
                    <p>Cpt 416000 : {formatCurrency(mockFragiliteFDR.compte416)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center text-xl text-muted-foreground font-bold">=</div>
                <div className="bg-success/5 rounded-lg p-3 border border-success/20 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">FDR mobilisable</p>
                  <p className={`text-xl font-bold ${fdrMobilisable > 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(fdrMobilisable)}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">{joursMobilisable} jours de fonctionnement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Autonomie financière */}
          <Card className="border-l-4 border-l-primary">
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
                Trésorerie propre = Trésorerie nette − Dettes (subventions + reliquats + avances)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Trésorerie nette</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(mockIndicators.tresorerie)}</p>
                </div>
                <div className="flex items-center justify-center text-xl text-muted-foreground font-bold">−</div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Total dettes</p>
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
                  <p className="text-[10px] text-muted-foreground uppercase">Trésorerie propre</p>
                  <p className={`text-lg font-bold ${tresoreriePropre > 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(tresoreriePropre)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Structure bilan fonctionnel */}
          <StructureBilan donnees={donnees} analyse={analyse} />

          {/* Équilibre financier */}
          <Card>
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
                  <p className="text-lg font-bold text-primary">{formatCurrency(fdrBrut)}</p>
                </div>
                <div className="flex items-center justify-center text-2xl text-muted-foreground">=</div>
                <div>
                  <p className="text-xs text-muted-foreground">BFR + Tréso</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(mockIndicators.bfr + mockIndicators.tresorerie)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aide contextuelle */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary rounded-xl">
                  <Sparkles className="text-primary-foreground h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Comprendre le Fonds de Roulement Mobilisable</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le FDRm représente la part du fonds de roulement réellement disponible pour financer
                    des investissements ou des dépenses exceptionnelles. Il se calcule en déduisant du FDR
                    les éléments non mobilisables : stocks, créances, provisions et engagements non soldés.
                    Le seuil réglementaire est de 30 jours de fonctionnement (circulaire DAF A3).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ SIMULATEUR ═══════ */}
        <TabsContent value="simulateur" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SimulateurPrelevement analyse={analyse} chargesJournalieres={chargesJournalieres} />

            {/* Camembert FDR */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Répartition du FDR</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <Pie data={pieAvant} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                      paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`} labelLine>
                      {pieAvant.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </RPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostic */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Diagnostic global</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>✅ Le fonds de roulement brut est <strong className="text-foreground">positif</strong> à {formatCurrency(fdrBrut)}, couvrant <strong className="text-foreground">{mockIndicators.joursFonctionnement} jours</strong> de fonctionnement.</p>
              <p>📊 Après déduction des fragilités ({formatCurrency(totalFragilite)}), le <strong className="text-foreground">FDR mobilisable</strong> s'établit à <strong className="text-foreground">{formatCurrency(fdrMobilisable)}</strong> ({joursMobilisable} jours).</p>
              <p>✅ La trésorerie nette est positive à {formatCurrency(mockIndicators.tresorerie)}.</p>
              <p>{tresoreriePropre > 0 ? "✅" : "⚠️"} La trésorerie propre est de <strong className="text-foreground">{formatCurrency(tresoreriePropre)}</strong>.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ DBM ═══════ */}
        <TabsContent value="prelevements">
          <TableauPrelevements
            prelevements={prelevements}
            onAdd={handleAddPrelevement}
            onUpdate={handleUpdatePrelevement}
            onDelete={(id) => setPrelevements(prev => prev.filter(p => p.id !== id))}
          />
        </TabsContent>

        {/* ═══════ HISTORIQUE ═══════ */}
        <TabsContent value="historique">
          <FdrHistorique />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkingCapital;
