import { useMemo } from "react";
import { Download, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface LignePrevisionnel {
  chapitre: string;
  libelle: string;
  realiseN2: number;
  realiseN1: number;
  budgetN: number;
  estimationN: number;
  previsionN1: number;
  tendance: number; // % variation
}

const mockPrev: LignePrevisionnel[] = [
  { chapitre: "A1", libelle: "Activités pédagogiques", realiseN2: 42000, realiseN1: 43500, budgetN: 45000, estimationN: 44000, previsionN1: 45500, tendance: 3.4 },
  { chapitre: "A2", libelle: "Viabilisation", realiseN2: 78000, realiseN1: 82000, budgetN: 85000, estimationN: 84000, previsionN1: 87000, tendance: 3.6 },
  { chapitre: "B", libelle: "Bourses nationales", realiseN2: 118000, realiseN1: 119000, budgetN: 120000, estimationN: 118500, previsionN1: 120000, tendance: 0.0 },
  { chapitre: "C", libelle: "Restauration / Hébergement", realiseN2: 260000, realiseN1: 272000, budgetN: 280000, estimationN: 275000, previsionN1: 285000, tendance: 1.8 },
  { chapitre: "G", libelle: "Personnels rémunérés", realiseN2: 48000, realiseN1: 52000, budgetN: 55000, estimationN: 53000, previsionN1: 56000, tendance: 1.8 },
  { chapitre: "N", libelle: "SRH", realiseN2: 12000, realiseN1: 13500, budgetN: 15000, estimationN: 14000, previsionN1: 15500, tendance: 3.3 },
  { chapitre: "R", libelle: "Voyages et sorties", realiseN2: 28000, realiseN1: 32000, budgetN: 35000, estimationN: 33000, previsionN1: 34000, tendance: -2.9 },
];

const year = new Date().getFullYear();

const PrevisionnelTab = () => {
  const { selectedEstablishment } = useEstablishment();

  const totaux = useMemo(() => ({
    realiseN2: mockPrev.reduce((s, l) => s + l.realiseN2, 0),
    realiseN1: mockPrev.reduce((s, l) => s + l.realiseN1, 0),
    budgetN: mockPrev.reduce((s, l) => s + l.budgetN, 0),
    estimationN: mockPrev.reduce((s, l) => s + l.estimationN, 0),
    previsionN1: mockPrev.reduce((s, l) => s + l.previsionN1, 0),
  }), []);

  const chartData = mockPrev.map(l => ({
    name: l.chapitre,
    [`Réalisé ${year - 2}`]: l.realiseN2,
    [`Réalisé ${year - 1}`]: l.realiseN1,
    [`Budget ${year}`]: l.budgetN,
    [`Prévision ${year + 1}`]: l.previsionN1,
  }));

  const trendData = mockPrev.map(l => ({
    name: l.chapitre,
    tendance: l.tendance,
  }));

  const generatePDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: `Prévisionnel budgétaire ${year + 1}`,
      subtitle: `${est?.name || "Établissement"} — Projection pluriannuelle`,
    });
    autoTable(doc, {
      startY: 46,
      head: [["Chap.", "Libellé", `Réalisé ${year - 2}`, `Réalisé ${year - 1}`, `Budget ${year}`, `Estimation ${year}`, `Prévision ${year + 1}`, "Δ%"]],
      body: mockPrev.map(l => [
        l.chapitre, l.libelle,
        formatCurrency(l.realiseN2), formatCurrency(l.realiseN1),
        formatCurrency(l.budgetN), formatCurrency(l.estimationN),
        formatCurrency(l.previsionN1), `${l.tendance > 0 ? "+" : ""}${l.tendance.toFixed(1)}%`,
      ]),
      foot: [["", "TOTAUX",
        formatCurrency(totaux.realiseN2), formatCurrency(totaux.realiseN1),
        formatCurrency(totaux.budgetN), formatCurrency(totaux.estimationN),
        formatCurrency(totaux.previsionN1), ""]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      styles: { fontSize: 7.5 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "center" } },
      margin: { left: 10, right: 10 },
    });
    const y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Hypothèses : projection linéaire sur tendance N-2/N-1/N, hors événements exceptionnels.", 14, y);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")} — Transmis à l'Ordonnateur pour préparation du budget ${year + 1}`, 14, y + 7);
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("L'Agent comptable", 14, y + 22);
    doc.text("Signature : ____________________", 14, y + 30);
    doc.text("L'Ordonnateur", 120, y + 22);
    doc.text("Signature : ____________________", 120, y + 30);
    doc.setFontSize(7);
    doc.text("Réf. : M9.6 — Décret 2012-1246 — Code de l'éducation", 14, y + 42);
    savePDF(doc, `previsionnel_${year + 1}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={generatePDF}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
        </Button>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Évolution par chapitre</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={`Réalisé ${year - 2}`} fill="hsl(var(--muted-foreground))" opacity={0.4} />
                <Bar dataKey={`Réalisé ${year - 1}`} fill="hsl(var(--muted-foreground))" opacity={0.7} />
                <Bar dataKey={`Budget ${year}`} fill="hsl(var(--primary))" />
                <Bar dataKey={`Prévision ${year + 1}`} fill="hsl(var(--primary))" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendance (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${v}%`} />
                <RTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="tendance" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Tableau prévisionnel {year + 1}
            <Badge variant="outline" className="text-[9px]">Projection linéaire</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chap.</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Réalisé {year - 2}</TableHead>
                <TableHead className="text-right">Réalisé {year - 1}</TableHead>
                <TableHead className="text-right">Budget {year}</TableHead>
                <TableHead className="text-right">Estimation {year}</TableHead>
                <TableHead className="text-right">Prévision {year + 1}</TableHead>
                <TableHead className="text-center">Δ%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPrev.map(l => (
                <TableRow key={l.chapitre}>
                  <TableCell className="font-mono font-bold">{l.chapitre}</TableCell>
                  <TableCell>{l.libelle}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.realiseN2)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.realiseN1)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(l.budgetN)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(l.estimationN)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(l.previsionN1)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={l.tendance > 2 ? "destructive" : l.tendance < -1 ? "secondary" : "outline"} className="text-[9px]">
                      {l.tendance > 0 ? "+" : ""}{l.tendance.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">TOTAUX</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totaux.realiseN2)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totaux.realiseN1)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totaux.budgetN)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totaux.estimationN)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totaux.previsionN1)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrevisionnelTab;
