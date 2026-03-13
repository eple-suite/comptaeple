import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

interface LigneCredit {
  chapitre: string;
  libelle: string;
  creditOuvert: number;
  engage: number;
  mandatePaye: number;
}

const mockCredits: LigneCredit[] = [
  { chapitre: "A1", libelle: "Activités pédagogiques", creditOuvert: 45000, engage: 38000, mandatePaye: 32000 },
  { chapitre: "A2", libelle: "Viabilisation", creditOuvert: 85000, engage: 82000, mandatePaye: 78000 },
  { chapitre: "B", libelle: "Bourses nationales", creditOuvert: 120000, engage: 115000, mandatePaye: 110000 },
  { chapitre: "C", libelle: "Restauration / Hébergement", creditOuvert: 280000, engage: 195000, mandatePaye: 180000 },
  { chapitre: "G", libelle: "Personnels rémunérés", creditOuvert: 55000, engage: 50500, mandatePaye: 48000 },
  { chapitre: "J", libelle: "Opérations en capital", creditOuvert: 30000, engage: 28000, mandatePaye: 25000 },
  { chapitre: "N", libelle: "SRH", creditOuvert: 15000, engage: 8000, mandatePaye: 6000 },
  { chapitre: "R", libelle: "Voyages et sorties", creditOuvert: 35000, engage: 34500, mandatePaye: 30000 },
];

const AlertesCreditsTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [credits] = useState<LigneCredit[]>(mockCredits);

  const enriched = useMemo(() => credits.map(c => {
    const disponible = c.creditOuvert - c.engage;
    const tauxConso = c.creditOuvert > 0 ? (c.engage / c.creditOuvert) * 100 : 0;
    const niveau: "ok" | "warning" | "danger" = tauxConso >= 95 ? "danger" : tauxConso >= 80 ? "warning" : "ok";
    const dbmNecessaire = disponible < 0 ? Math.abs(disponible) : 0;
    return { ...c, disponible, tauxConso, niveau, dbmNecessaire };
  }), [credits]);

  const alertes = enriched.filter(c => c.niveau !== "ok");
  const totalDBM = enriched.reduce((s, c) => s + c.dbmNecessaire, 0);

  const generatePDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Alertes Insuffisance de Crédits",
      subtitle: `${est?.name || "Établissement"} — Exercice ${new Date().getFullYear()}`,
    });
    autoTable(doc, {
      startY: 46,
      head: [["Chap.", "Libellé", "Crédits ouverts", "Engagé", "Disponible", "Taux", "DBM nécessaire"]],
      body: enriched.map(c => [
        c.chapitre, c.libelle,
        formatCurrency(c.creditOuvert), formatCurrency(c.engage),
        formatCurrency(c.disponible), `${c.tauxConso.toFixed(0)}%`,
        c.dbmNecessaire > 0 ? formatCurrency(c.dbmNecessaire) : "—",
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "center" }, 6: { halign: "right" } },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = parseFloat(data.cell.raw);
          if (val >= 95) data.cell.styles.textColor = [200, 0, 0];
          else if (val >= 80) data.cell.styles.textColor = [200, 120, 0];
        }
      },
    });
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(0);
    if (totalDBM > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(`Total DBM nécessaire estimé : ${formatCurrency(totalDBM)}`, 14, y);
      doc.setFont("helvetica", "normal");
    }
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 10);
    doc.text("L'Agent comptable", 14, y + 22);
    doc.text("Signature : ____________________", 14, y + 30);
    doc.setFontSize(7);
    doc.text("Réf. : M9.6 — Décret 2012-1246 — Code de l'éducation", 14, y + 42);
    savePDF(doc, `alertes_credits_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Alert banner */}
      {alertes.length > 0 ? (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {alertes.length} chapitre{alertes.length > 1 ? "s" : ""} en tension budgétaire
              </p>
              {totalDBM > 0 && <p className="text-xs text-muted-foreground">DBM nécessaire estimé : {formatCurrency(totalDBM)}</p>}
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Rapport PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Aucune insuffisance de crédits détectée</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suivi des crédits par chapitre</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chap.</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Crédits ouverts</TableHead>
                <TableHead className="text-right">Engagé</TableHead>
                <TableHead className="text-right">Mandaté</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="w-32">Consommation</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.map(c => (
                <TableRow key={c.chapitre} className={c.niveau === "danger" ? "bg-destructive/5" : c.niveau === "warning" ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                  <TableCell className="font-mono font-bold">{c.chapitre}</TableCell>
                  <TableCell>{c.libelle}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(c.creditOuvert)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(c.engage)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(c.mandatePaye)}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${c.disponible < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(c.disponible)}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1">
                          <Progress
                            value={Math.min(c.tauxConso, 100)}
                            className={`h-2 ${c.niveau === "danger" ? "[&>div]:bg-destructive" : c.niveau === "warning" ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                          />
                          <span className="text-[10px] text-muted-foreground">{c.tauxConso.toFixed(0)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{c.tauxConso.toFixed(1)}% consommé</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {c.niveau === "danger" ? (
                      <Badge variant="destructive" className="text-[9px]">⚠ Insuffisant</Badge>
                    ) : c.niveau === "warning" ? (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[9px]">Attention</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-emerald-600">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertesCreditsTab;
