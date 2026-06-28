import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Download, BarChart3, FileText, Plus, Pencil, Trash2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KpiCard } from "@/components/KpiCard";
import { DictationButton } from "@/components/DictationButton";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import autoTable from "jspdf-autotable";
import { createStyledPDF, savePDF, type PDFOrientation } from "@/lib/pdfUtils";
import {
  useControleInterneStore, nouveauControle, cadenceSemaine, controlesEnRetard,
  PROCESSUS, FREQUENCES, type PointControle, type FrequenceControle,
  type StatutControle, type RisqueControle,
} from "@/lib/controle-interne/store";
import { genererPvControle } from "@/lib/controle-interne/pvControle";

const PROCESSUS_CIC = [...PROCESSUS];

const FREQUENCE_LABELS: Record<string, string> = {
  quotidien: "Quotidien",
  hebdomadaire: "Hebdomadaire",
  mensuel: "Mensuel",
  trimestriel: "Trimestriel",
  annuel: "Annuel",
};

const RISQUE_CONFIG: Record<string, { label: string; color: string }> = {
  faible: { label: "Faible", color: "bg-success/10 text-success border-0" },
  moyen: { label: "Moyen", color: "bg-warning/10 text-warning border-0" },
  eleve: { label: "Élevé", color: "bg-destructive/10 text-destructive border-0" },
  critique: { label: "Critique", color: "bg-destructive/20 text-destructive border-0" },
};

const STATUT_CONTROLE: Record<string, { label: string; color: string }> = {
  conforme: { label: "Conforme", color: "bg-success/10 text-success border-0" },
  anomalie: { label: "Anomalie", color: "bg-destructive/10 text-destructive border-0" },
  non_realise: { label: "Non réalisé", color: "bg-muted text-muted-foreground border-0" },
  en_cours: { label: "En cours", color: "bg-warning/10 text-warning border-0" },
};

const CONTROLES_INITIAUX: PointControle[] = [
  { id: "c1", processus: "P1 — Recettes", action: "Rapprochement titres émis / encaissements", frequence: "mensuel", responsable: "Fondé de pouvoir", statut: "conforme", dateControle: "2026-02-28", observation: "Cohérent. Aucun écart.", risque: "moyen" },
  { id: "c2", processus: "P1 — Recettes", action: "Contrôle de l'exhaustivité des OR émis", frequence: "trimestriel", responsable: "Agent comptable", statut: "conforme", dateControle: "2026-01-15", observation: "Tous les OR ont été émis pour les services fait.", risque: "moyen" },
  { id: "c3", processus: "P2 — Dépenses", action: "Vérification pièces justificatives avant mandatement", frequence: "quotidien", responsable: "Fondé de pouvoir", statut: "conforme", dateControle: "2026-03-07", observation: "RAS", risque: "eleve" },
  { id: "c4", processus: "P2 — Dépenses", action: "Contrôle des seuils marchés publics (cumul annuel)", frequence: "mensuel", responsable: "Agent comptable", statut: "anomalie", dateControle: "2026-02-28", observation: "Dépassement du seuil 40k€ sur fournitures informatiques sans MAPA. Signalé à l'ordonnateur.", risque: "critique" },
  { id: "c5", processus: "P3 — Trésorerie", action: "Rapprochement bancaire", frequence: "mensuel", responsable: "Fondé de pouvoir", statut: "conforme", dateControle: "2026-02-28", observation: "Rapprochement effectué. Solde cohérent.", risque: "eleve" },
  { id: "c6", processus: "P4 — Régies", action: "Vérification de l'encaisse du régisseur", frequence: "trimestriel", responsable: "Agent comptable", statut: "en_cours", dateControle: "", observation: "Contrôle prévu semaine 11", risque: "eleve" },
  { id: "c7", processus: "P4 — Régies", action: "PV de vérification de la régie", frequence: "trimestriel", responsable: "Agent comptable", statut: "non_realise", dateControle: "", observation: "Report — absence du régisseur", risque: "eleve" },
  { id: "c8", processus: "P5 — Patrimoine / Inventaire", action: "Rapprochement inventaire physique / comptable", frequence: "annuel", responsable: "Agent comptable", statut: "conforme", dateControle: "2025-12-31", observation: "Inventaire réalisé. 3 biens à sortir.", risque: "moyen" },
  { id: "c9", processus: "P7 — Comptes de tiers", action: "Analyse des comptes 411 / 416 — créances anciennes", frequence: "trimestriel", responsable: "Agent comptable", statut: "anomalie", dateControle: "2026-01-15", observation: "12 créances > 2 ans non provisionnées au 491. Correction en cours.", risque: "critique" },
  { id: "c10", processus: "P7 — Comptes de tiers", action: "Lettrage des comptes fournisseurs (401)", frequence: "mensuel", responsable: "Fondé de pouvoir", statut: "conforme", dateControle: "2026-02-28", observation: "Lettrage effectué. 2 écarts mineurs identifiés et régularisés.", risque: "faible" },
  { id: "c11", processus: "P8 — États financiers", action: "Contrôle de la balance générale (équilibre)", frequence: "mensuel", responsable: "Agent comptable", statut: "conforme", dateControle: "2026-02-28", observation: "Balance équilibrée.", risque: "faible" },
  { id: "c12", processus: "P3 — Trésorerie", action: "Suivi du respect du plan de trésorerie", frequence: "mensuel", responsable: "Agent comptable", statut: "conforme", dateControle: "2026-02-28", observation: "Trésorerie conforme aux prévisions.", risque: "moyen" },
  { id: "c13", processus: "P9 — Bourses & Aides sociales", action: "Contrôle du circuit 44311 → 468100 → 4112/4113 (bourses)", frequence: "trimestriel", responsable: "Agent comptable", statut: "conforme", dateControle: "2026-02-28", observation: "Circuit conforme. Solde 44311 créditeur de 8 700 €, 468100 soldé.", risque: "critique" },
  { id: "c14", processus: "P9 — Bourses & Aides sociales", action: "Rapprochement notifications rectorat / prises en charge bourses", frequence: "trimestriel", responsable: "Fondé de pouvoir", statut: "conforme", dateControle: "2026-01-15", observation: "Montants conformes aux notifications DSDEN.", risque: "eleve" },
  { id: "c15", processus: "P9 — Bourses & Aides sociales", action: "Vérification distinction État (4438) / fonds propres — fonds sociaux", frequence: "trimestriel", responsable: "Agent comptable", statut: "en_cours", dateControle: "", observation: "Contrôle prévu pour mars.", risque: "eleve" },
  { id: "c16", processus: "P2 — Dépenses", action: "Contrôle distinction comptes État (4411/7411) / Collectivité (4412/74121)", frequence: "mensuel", responsable: "Agent comptable", statut: "conforme", dateControle: "2026-02-28", observation: "Aucune confusion détectée. Imputations conformes aux notifications.", risque: "critique" },
  { id: "c17", processus: "P1 — Recettes", action: "Suivi des créances > 4 ans — vérification prescription", frequence: "trimestriel", responsable: "Agent comptable", statut: "anomalie", dateControle: "2026-01-15", observation: "3 créances proches de la prescription 4 ans. SATD à émettre d'urgence.", risque: "critique" },
  { id: "c18", processus: "P5 — Patrimoine / Inventaire", action: "Contrôle amortissements ≤ valeur brute immobilisations (28 ≤ 21)", frequence: "annuel", responsable: "Agent comptable", statut: "conforme", dateControle: "2025-12-31", observation: "Amort. 120 000 € ≤ Immo brutes 820 000 €. Conforme.", risque: "moyen" },
];

const ControleInterne = () => {
  const { controles, objectifHebdo, seedSiVide, upsert, remove, setObjectif } = useControleInterneStore();
  const [filterProcessus, setFilterProcessus] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [pdfOrientation, setPdfOrientation] = useState<PDFOrientation>("landscape");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<PointControle | null>(null);

  useEffect(() => { seedSiVide(CONTROLES_INITIAUX); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ouvrirNouveau = () => { setEdit(nouveauControle()); setDialogOpen(true); };
  const ouvrirEdition = (c: PointControle) => { setEdit({ ...c }); setDialogOpen(true); };
  const enregistrer = () => { if (edit) { upsert(edit); setDialogOpen(false); setEdit(null); } };

  const filtered = filterProcessus === "all" && filterStatut === "all"
    ? controles
    : controles.filter(c =>
      (filterProcessus === "all" || c.processus === filterProcessus) &&
      (filterStatut === "all" || c.statut === filterStatut)
    );

  const conformes = controles.filter(c => c.statut === "conforme").length;
  const anomalies = controles.filter(c => c.statut === "anomalie").length;
  const nonRealises = controles.filter(c => c.statut === "non_realise").length;
  const enCours = controles.filter(c => c.statut === "en_cours").length;
  const tauxConformite = controles.length > 0 ? (conformes / controles.length) * 100 : 0;

  const cadence = cadenceSemaine(controles, objectifHebdo);
  const enRetard = controlesEnRetard(controles);

  // Charts data
  const pieStatut = [
    { name: "Conformes", value: conformes, fill: "hsl(var(--success))" },
    { name: "Anomalies", value: anomalies, fill: "hsl(var(--destructive))" },
    { name: "En cours", value: enCours, fill: "hsl(var(--warning))" },
    { name: "Non réalisés", value: nonRealises, fill: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  const pieRisque = (() => {
    const counts: Record<string, number> = {};
    controles.forEach(c => { counts[c.risque] = (counts[c.risque] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({
      name: RISQUE_CONFIG[k].label,
      value: v,
      fill: k === "faible" ? "hsl(var(--success))" : k === "moyen" ? "hsl(var(--warning))" : "hsl(var(--destructive))",
    }));
  })();

  const radarProcessus = PROCESSUS_CIC.map(p => {
    const items = controles.filter(c => c.processus === p);
    if (items.length === 0) return null;
    const conf = items.filter(c => c.statut === "conforme").length;
    const pct = (conf / items.length) * 100;
    const riskScore = items.reduce((s, c) => s + (c.risque === "critique" ? 4 : c.risque === "eleve" ? 3 : c.risque === "moyen" ? 2 : 1), 0) / items.length;
    return {
      subject: p.replace(/^P\d+ — /, ""),
      conformite: pct,
      risque: riskScore * 25,
    };
  }).filter(Boolean);

  const barProcessus = PROCESSUS_CIC.map(p => {
    const items = controles.filter(c => c.processus === p);
    if (items.length === 0) return null;
    return {
      name: p.replace(/^P\d+ — /, ""),
      conformes: items.filter(c => c.statut === "conforme").length,
      anomalies: items.filter(c => c.statut === "anomalie").length,
      autres: items.filter(c => c.statut !== "conforme" && c.statut !== "anomalie").length,
    };
  }).filter(Boolean);

  const genererPlanControle = () => {
    const doc = createStyledPDF({
      orientation: pdfOrientation,
      title: "Plan de Contrôle Interne Comptable",
      subtitle: "Agence comptable — EPLE",
    });
    let y = 48;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Synthèse", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Points de contrôle", String(controles.length)],
        ["Conformes", `${conformes} (${tauxConformite.toFixed(0)}%)`],
        ["Anomalies détectées", String(anomalies)],
        ["Non réalisés", String(nonRealises)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable?.finalY || 90;
    y += 10;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des contrôles", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Processus", "Action de contrôle", "Fréquence", "Responsable", "Statut", "Date", "Risque", "Observation"]],
      body: controles.map(c => [
        c.processus, c.action, FREQUENCE_LABELS[c.frequence], c.responsable,
        STATUT_CONTROLE[c.statut].label, c.dateControle ? new Date(c.dateControle).toLocaleDateString("fr-FR") : "—",
        RISQUE_CONFIG[c.risque].label, c.observation.substring(0, 60) + (c.observation.length > 60 ? "…" : ""),
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
    });

    savePDF(doc, `plan_controle_interne_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Contrôle interne comptable</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Plan de contrôle &amp; suivi des actions — Référentiel CIC EPLE</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={pdfOrientation} onValueChange={(v: PDFOrientation) => setPdfOrientation(v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Paysage</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={genererPlanControle} className="h-8 text-xs rounded-lg">
            <Download className="h-3.5 w-3.5 mr-1" /> Plan CIC PDF
          </Button>
          <Button size="sm" onClick={ouvrirNouveau} className="h-8 text-xs rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau contrôle
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Taux de conformité" value={`${tauxConformite.toFixed(0)}%`} icon={ShieldCheck} variant={tauxConformite >= 90 ? "success" : tauxConformite >= 70 ? "warning" : "destructive"} />
        <KpiCard title="Conformes" value={`${conformes} / ${controles.length}`} icon={CheckCircle2} variant="success" />
        <KpiCard title="Anomalies" value={`${anomalies}`} icon={AlertTriangle} variant="destructive" />
        <KpiCard title="Non réalisés" value={`${nonRealises}`} icon={Clock} variant="warning" />
      </div>

      {/* Planificateur / cadence hebdomadaire */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Planificateur — cadence hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-sm ${cadence.conforme ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}`}>
                {cadence.faits} / {cadence.objectif} contrôles réalisés cette semaine
              </Badge>
              {cadence.conforme
                ? <span className="text-xs text-success font-medium">Objectif atteint</span>
                : <span className="text-xs text-warning font-medium">Cadence à tenir</span>}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="objectif" className="text-xs text-muted-foreground">Objectif / semaine</Label>
              <Input id="objectif" type="number" min={1} value={objectifHebdo}
                onChange={e => setObjectif(parseInt(e.target.value) || 1)} className="w-20 h-8 text-xs" />
            </div>
          </div>
          <Progress value={Math.min(100, (cadence.faits / Math.max(1, cadence.objectif)) * 100)} className="h-2" />

          {enRetard.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> À réaliser / relancer ({enRetard.length})
              </p>
              <div className="space-y-1.5">
                {enRetard.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border bg-warning/5 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{c.action}</p>
                      <p className="text-[11px] text-muted-foreground">{c.processus} — {c.responsable || "Non affecté"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] ${STATUT_CONTROLE[c.statut].color}`}>{STATUT_CONTROLE[c.statut].label}</Badge>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => ouvrirEdition(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Réaliser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Conformité */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RPieChart>
                <Pie data={pieStatut} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieStatut.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie: Risques */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par niveau de risque</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RPieChart>
                <Pie data={pieRisque} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieRisque.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar: Conformité par processus */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Radar conformité / risque par processus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarProcessus}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                <Radar name="Conformité %" dataKey="conformite" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Risque" dataKey="risque" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.15} strokeWidth={2} />
                <Legend />
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked bar by processus */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Contrôles par processus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barProcessus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="conformes" name="Conformes" stackId="a" fill="hsl(var(--success))" />
                <Bar dataKey="anomalies" name="Anomalies" stackId="a" fill="hsl(var(--destructive))" />
                <Bar dataKey="autres" name="Autres" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conformité par processus (progress bars) */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Conformité par processus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROCESSUS_CIC.map(p => {
            const items = controles.filter(c => c.processus === p);
            if (items.length === 0) return null;
            const conf = items.filter(c => c.statut === "conforme").length;
            const pct = (conf / items.length) * 100;
            return (
              <div key={p}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{p}</span>
                  <span className="font-mono">{conf}/{items.length} — {pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterProcessus} onValueChange={setFilterProcessus}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Processus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les processus</SelectItem>
            {PROCESSUS_CIC.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(STATUT_CONTROLE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processus</TableHead>
                <TableHead>Action de contrôle</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Risque</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Observation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className={`group ${c.statut === "anomalie" ? "bg-destructive/5" : ""}`}>
                  <TableCell className="text-xs font-medium cursor-pointer" onClick={() => ouvrirEdition(c)}>{c.processus}</TableCell>
                  <TableCell className="text-xs cursor-pointer" onClick={() => ouvrirEdition(c)}>{c.action}</TableCell>
                  <TableCell className="text-xs">{FREQUENCE_LABELS[c.frequence]}</TableCell>
                  <TableCell className="text-xs">{c.responsable}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] ${RISQUE_CONFIG[c.risque].color}`}>{RISQUE_CONFIG[c.risque].label}</Badge></TableCell>
                  <TableCell className="text-xs">{c.dateControle ? new Date(c.dateControle).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] ${STATUT_CONTROLE[c.statut].color}`}>{STATUT_CONTROLE[c.statut].label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.observation}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="PV de contrôle" onClick={() => genererPvControle(c)}>
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Éditer" onClick={() => ouvrirEdition(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Supprimer" onClick={() => remove(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {edit && controles.some(c => c.id === edit.id) ? "Éditer le contrôle" : "Nouveau contrôle"}
            </DialogTitle>
            <DialogDescription>Renseignez le point de contrôle interne comptable.</DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Processus</Label>
                <Select value={edit.processus} onValueChange={v => setEdit({ ...edit, processus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROCESSUS_CIC.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Action de contrôle</Label>
                <Input value={edit.action} onChange={e => setEdit({ ...edit, action: e.target.value })} placeholder="Ex. Rapprochement bancaire" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fréquence</Label>
                  <Select value={edit.frequence} onValueChange={(v: FrequenceControle) => setEdit({ ...edit, frequence: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCES.map(f => <SelectItem key={f} value={f}>{FREQUENCE_LABELS[f]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau de risque</Label>
                  <Select value={edit.risque} onValueChange={(v: RisqueControle) => setEdit({ ...edit, risque: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(RISQUE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Responsable</Label>
                <Input value={edit.responsable} onChange={e => setEdit({ ...edit, responsable: e.target.value })} placeholder="Ex. Agent comptable" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Statut</Label>
                  <Select value={edit.statut} onValueChange={(v: StatutControle) => setEdit({ ...edit, statut: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUT_CONTROLE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date du contrôle</Label>
                  <Input type="date" value={edit.dateControle} onChange={e => setEdit({ ...edit, dateControle: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Observation</Label>
                  <DictationButton onAppend={t => setEdit(prev => prev ? { ...prev, observation: (prev.observation ? prev.observation + " " : "") + t } : prev)} size="sm" />
                </div>
                <Textarea value={edit.observation} onChange={e => setEdit({ ...edit, observation: e.target.value })} rows={3} placeholder="Constat, écart, suite donnée…" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={!edit?.action}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ControleInterne;
