import { useMemo } from "react";
import { AlertTriangle, Download, Clock, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface CreanceAging {
  id: string;
  debiteur: string;
  reference: string;
  montant: number;
  dateEmission: string;
  joursRetard: number;
}

const mockCreances: CreanceAging[] = [
  { id: "c1", debiteur: "DUPONT Marie", reference: "TR-2025-045", montant: 450, dateEmission: "2025-06-15", joursRetard: 271 },
  { id: "c2", debiteur: "MARTIN Jean", reference: "TR-2025-089", montant: 1200, dateEmission: "2025-09-01", joursRetard: 193 },
  { id: "c3", debiteur: "DURAND Paul", reference: "TR-2025-112", montant: 320, dateEmission: "2025-10-20", joursRetard: 144 },
  { id: "c4", debiteur: "LEROY Alain", reference: "TR-2025-130", montant: 850, dateEmission: "2025-11-05", joursRetard: 128 },
  { id: "c5", debiteur: "MOREAU Claire", reference: "TR-2026-005", montant: 180, dateEmission: "2026-01-10", joursRetard: 62 },
  { id: "c6", debiteur: "THOMAS Luc", reference: "TR-2026-018", montant: 95, dateEmission: "2026-02-01", joursRetard: 40 },
  { id: "c7", debiteur: "PETIT Nathalie", reference: "TR-2025-078", montant: 620, dateEmission: "2025-08-10", joursRetard: 215 },
  { id: "c8", debiteur: "ROBERT Émilie", reference: "TR-2026-025", montant: 340, dateEmission: "2026-02-15", joursRetard: 26 },
];

const getTrancheAge = (jours: number) => {
  if (jours > 180) return { label: "> 180 jours", color: "destructive" as const, severity: 3 };
  if (jours > 90) return { label: "90-180 jours", color: "default" as const, severity: 2 };
  if (jours > 30) return { label: "30-90 jours", color: "secondary" as const, severity: 1 };
  return { label: "< 30 jours", color: "outline" as const, severity: 0 };
};

const COLORS = ["hsl(var(--primary))", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(var(--muted-foreground))"];

const SatdAlertesCreancesTab = () => {
  const { selectedEstablishment } = useEstablishment();

  const sorted = useMemo(() => [...mockCreances].sort((a, b) => b.joursRetard - a.joursRetard), []);

  const alertes90 = sorted.filter(c => c.joursRetard > 90);
  const alertes180 = sorted.filter(c => c.joursRetard > 180);

  // Pie data
  const pieData = useMemo(() => {
    const tranches = [
      { name: "< 30 j", value: 0 },
      { name: "30-90 j", value: 0 },
      { name: "90-180 j", value: 0 },
      { name: "> 180 j", value: 0 },
    ];
    sorted.forEach(c => {
      if (c.joursRetard > 180) tranches[3].value += c.montant;
      else if (c.joursRetard > 90) tranches[2].value += c.montant;
      else if (c.joursRetard > 30) tranches[1].value += c.montant;
      else tranches[0].value += c.montant;
    });
    return tranches.filter(t => t.value > 0);
  }, [sorted]);

  // Bar chart for monthly forecast
  const forecastData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      // Simple declining forecast
      const expected = sorted.reduce((s, c) => {
        const prob = Math.max(0, 1 - (c.joursRetard + i * 30) / 365);
        return s + c.montant * prob * 0.3;
      }, 0);
      months.push({ name: label, prevision: Math.round(expected) });
    }
    return months;
  }, [sorted]);

  const totalCreances = sorted.reduce((s, c) => s + c.montant, 0);

  const generateAgingPDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "État des Créances — Aging Report",
      subtitle: `${est?.name || "Établissement"} — ${new Date().toLocaleDateString("fr-FR")}`,
    });
    autoTable(doc, {
      startY: 46,
      head: [["Référence", "Débiteur", "Montant", "Date émission", "Jours retard", "Tranche"]],
      body: sorted.map(c => [
        c.reference, c.debiteur, formatCurrency(c.montant),
        new Date(c.dateEmission).toLocaleDateString("fr-FR"),
        String(c.joursRetard),
        getTrancheAge(c.joursRetard).label,
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8 },
      columnStyles: { 2: { halign: "right" }, 4: { halign: "center" } },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = parseInt(data.cell.raw);
          if (val > 180) data.cell.styles.textColor = [200, 0, 0];
          else if (val > 90) data.cell.styles.textColor = [200, 120, 0];
        }
      },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(`Total créances : ${formatCurrency(totalCreances)} — > 90 jours : ${alertes90.length} — > 180 jours : ${alertes180.length}`, 14, y);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 10);
    doc.text("L'Agent comptable — Signature : ____________________", 14, y + 18);
    doc.setFontSize(7);
    doc.text("Réf. : M9.6 — Décret 2012-1246 — Instruction codificatrice recouvrement", 14, y + 28);
    savePDF(doc, `aging_creances_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Alerts */}
      {alertes180.length > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">{alertes180.length} créance{alertes180.length > 1 ? "s" : ""} &gt; 180 jours — Risque de prescription</p>
              <p className="text-xs text-muted-foreground">Montant total : {formatCurrency(alertes180.reduce((s, c) => s + c.montant, 0))}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {alertes90.length > alertes180.length && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/10">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{alertes90.length - alertes180.length} créance{alertes90.length - alertes180.length > 1 ? "s" : ""} entre 90 et 180 jours</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par ancienneté</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Prévision d'encaissement (6 mois)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${v}€`} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="prevision" fill="hsl(var(--primary))" name="Encaissement prévu" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table + export */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={generateAgingPDF}>
          <Download className="h-3.5 w-3.5 mr-1" /> Aging report PDF
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Débiteur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead className="text-center">Jours retard</TableHead>
                <TableHead>Tranche</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(c => {
                const tranche = getTrancheAge(c.joursRetard);
                return (
                  <TableRow key={c.id} className={tranche.severity >= 3 ? "bg-destructive/5" : tranche.severity >= 2 ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                    <TableCell className="font-mono text-xs">{c.reference}</TableCell>
                    <TableCell className="font-medium">{c.debiteur}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(c.montant)}</TableCell>
                    <TableCell className="text-xs">{new Date(c.dateEmission).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className={`text-center font-mono font-bold ${tranche.severity >= 3 ? "text-destructive" : tranche.severity >= 2 ? "text-amber-600" : ""}`}>
                      {c.joursRetard}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tranche.color} className="text-[9px]">{tranche.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatdAlertesCreancesTab;
