import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Download, Printer, BarChart3, FileText, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/KpiCard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createStyledPDF, savePDF, type PDFOrientation } from "@/lib/pdfUtils";

interface PointControle {
  id: string;
  processus: string;
  action: string;
  frequence: "quotidien" | "hebdomadaire" | "mensuel" | "trimestriel" | "annuel";
  responsable: string;
  statut: "conforme" | "anomalie" | "non_realise" | "en_cours";
  dateControle: string;
  observation: string;
  risque: "faible" | "moyen" | "eleve" | "critique";
}

const PROCESSUS_CIC = [
  "P1 — Recettes",
  "P2 — Dépenses",
  "P3 — Trésorerie",
  "P4 — Régies",
  "P5 — Patrimoine / Inventaire",
  "P6 — Paie (conventions)",
  "P7 — Comptes de tiers",
  "P8 — États financiers",
];

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

const mockControles: PointControle[] = [
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
];

const ControleInterne = () => {
  const [controles, setControles] = useState<PointControle[]>(mockControles);
  const [filterProcessus, setFilterProcessus] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [pdfOrientation, setPdfOrientation] = useState<PDFOrientation>("landscape");

  const filtered = filterProcessus === "all" && filterStatut === "all"
    ? controles
    : controles.filter(c =>
      (filterProcessus === "all" || c.processus === filterProcessus) &&
      (filterStatut === "all" || c.statut === filterStatut)
    );

  const conformes = controles.filter(c => c.statut === "conforme").length;
  const anomalies = controles.filter(c => c.statut === "anomalie").length;
  const nonRealises = controles.filter(c => c.statut === "non_realise").length;
  const tauxConformite = controles.length > 0 ? (conformes / controles.length) * 100 : 0;

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Contrôle interne comptable</h1>
            <p className="text-sm text-muted-foreground mt-1">Plan de contrôle & suivi des actions — Référentiel CIC EPLE</p>
          </div>
          <div className="flex gap-2">
            <Select value={pdfOrientation} onValueChange={(v: PDFOrientation) => setPdfOrientation(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Paysage</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={genererPlanControle} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Plan CIC PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Taux de conformité" value={`${tauxConformite.toFixed(0)}%`} icon={ShieldCheck} variant={tauxConformite >= 90 ? "success" : tauxConformite >= 70 ? "warning" : "destructive"} />
        <KpiCard title="Conformes" value={`${conformes} / ${controles.length}`} icon={CheckCircle2} variant="success" />
        <KpiCard title="Anomalies" value={`${anomalies}`} icon={AlertTriangle} variant="destructive" />
        <KpiCard title="Non réalisés" value={`${nonRealises}`} icon={Clock} variant="warning" />
      </div>

      {/* Conformité par processus */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className={c.statut === "anomalie" ? "bg-destructive/5" : ""}>
                  <TableCell className="text-xs font-medium">{c.processus}</TableCell>
                  <TableCell className="text-xs">{c.action}</TableCell>
                  <TableCell className="text-xs">{FREQUENCE_LABELS[c.frequence]}</TableCell>
                  <TableCell className="text-xs">{c.responsable}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] ${RISQUE_CONFIG[c.risque].color}`}>{RISQUE_CONFIG[c.risque].label}</Badge></TableCell>
                  <TableCell className="text-xs">{c.dateControle ? new Date(c.dateControle).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] ${STATUT_CONTROLE[c.statut].color}`}>{STATUT_CONTROLE[c.statut].label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.observation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControleInterne;
