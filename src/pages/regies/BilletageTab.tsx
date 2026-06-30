import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import { useRegiesStore } from "@/lib/regies/store";
import { archiverPdf } from "@/lib/documents/archiver";
import autoTable from "jspdf-autotable";

const DENOMINATIONS = [
  { label: "500 €", value: 500 },
  { label: "200 €", value: 200 },
  { label: "100 €", value: 100 },
  { label: "50 €", value: 50 },
  { label: "20 €", value: 20 },
  { label: "10 €", value: 10 },
  { label: "5 €", value: 5 },
  { label: "2 €", value: 2 },
  { label: "1 €", value: 1 },
  { label: "0,50 €", value: 0.5 },
  { label: "0,20 €", value: 0.2 },
  { label: "0,10 €", value: 0.1 },
  { label: "0,05 €", value: 0.05 },
  { label: "0,02 €", value: 0.02 },
  { label: "0,01 €", value: 0.01 },
];

const BilletageTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const soldeTheorique = useRegiesStore(s => s.soldeTheorique);
  const setSoldeTheorique = useRegiesStore(s => s.setSoldeTheorique);
  const quantities = useRegiesStore(s => s.quantities);
  const setQuantities = useRegiesStore(s => s.setQuantities);
  const explicationsEcart = useRegiesStore(s => s.explicationsEcart);
  const setExplicationsEcart = useRegiesStore(s => s.setExplicationsEcart);

  const soldePhysique = useMemo(
    () => DENOMINATIONS.reduce((sum, d) => sum + d.value * (quantities[d.value] || 0), 0),
    [quantities]
  );

  const ecart = +(soldePhysique - soldeTheorique).toFixed(2);
  const hasEcart = Math.abs(ecart) >= 0.01;

  const setQty = (val: number, qty: string) => {
    setQuantities({ ...quantities, [val]: Number(qty) || 0 });
  };

  const generatePVCaisse = (print = false) => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Procès-Verbal d'Arrêté de Caisse",
      subtitle: `${est?.name || "Établissement"} — ${est?.uai || ""}`,
    });

    const y = 48;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Établissement : ${est?.name || "___________"}`, 14, y);
    doc.text(`UAI : ${est?.uai || "___________"}    Op@le : ${est?.opale_number || "___________"}`, 14, y + 6);
    doc.text(`Date du contrôle : ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 12);

    autoTable(doc, {
      startY: y + 20,
      head: [["Dénomination", "Quantité", "Sous-total"]],
      body: DENOMINATIONS.filter(d => (quantities[d.value] || 0) > 0).map(d => [
        d.label,
        String(quantities[d.value] || 0),
        formatCurrency(d.value * (quantities[d.value] || 0)),
      ]),
      foot: [["TOTAL PHYSIQUE", "", formatCurrency(soldePhysique)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });

    const tblY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Solde théorique (journal de caisse) : ${formatCurrency(soldeTheorique)}`, 14, tblY);
    doc.text(`Solde physique (billetage) : ${formatCurrency(soldePhysique)}`, 14, tblY + 7);

    if (hasEcart) {
      doc.setTextColor(200, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`ÉCART CONSTATÉ : ${formatCurrency(ecart)}`, 14, tblY + 16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      if (explicationsEcart) {
        doc.text(`Explications : ${explicationsEcart}`, 14, tblY + 24);
      }
    } else {
      doc.setTextColor(0, 128, 0);
      doc.setFont("helvetica", "bold");
      doc.text("AUCUN ÉCART — Caisse concordante", 14, tblY + 16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
    }

    const sigY = tblY + (hasEcart ? 40 : 30);
    doc.setFontSize(9);
    doc.text(`Fait à ${est?.city || "___________"}, le ${new Date().toLocaleDateString("fr-FR")}`, 14, sigY);
    doc.text("Le Mandataire / Régisseur", 14, sigY + 12);
    doc.text("Signature : ____________________", 14, sigY + 20);
    doc.text("L'Agent Comptable", 120, sigY + 12);
    doc.text("Signature : ____________________", 120, sigY + 20);
    doc.setFontSize(7);
    doc.text("Réf. : M9.6 — Recueil des régies 2023 — Décret 2012-1246 art. 22 et 23", 14, sigY + 34);

    const fileName = `PV_caisse_${new Date().toISOString().split("T")[0]}.pdf`;
    void archiverPdf(doc, { type: "pv_caisse", titre: `PV d'arrêté de caisse — ${est?.name ?? "Établissement"}`, fileName, etablissementId: est?.id, etablissementNom: est?.name });
    if (print) printPDF(doc);
    else savePDF(doc, fileName);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Status banner */}
      {hasEcart ? (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Écart détecté : {formatCurrency(ecart)}</p>
              <p className="text-xs text-muted-foreground">Un PV d'arrêté de caisse doit être établi et les écarts expliqués.</p>
            </div>
          </CardContent>
        </Card>
      ) : soldePhysique > 0 ? (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Caisse concordante — Aucun écart</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Billetage grid */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Décompte physique
              <Badge variant="outline" className="text-[9px]">Billets & Pièces</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dénomination</TableHead>
                  <TableHead className="w-24 text-center">Quantité</TableHead>
                  <TableHead className="text-right">Sous-total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DENOMINATIONS.map(d => (
                  <TableRow key={d.value}>
                    <TableCell className="font-mono text-sm">{d.label}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-center w-20 mx-auto"
                        value={quantities[d.value] || ""}
                        onChange={e => setQty(d.value, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(quantities[d.value] || 0) > 0 ? formatCurrency(d.value * (quantities[d.value] || 0)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">TOTAL PHYSIQUE</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(soldePhysique)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Comparison */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparaison théorique / physique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Solde théorique (journal de caisse)</Label>
                <Input type="number" step="0.01" value={soldeTheorique} onChange={e => setSoldeTheorique(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Théorique</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(soldeTheorique)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Physique</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(soldePhysique)}</p>
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${hasEcart ? "bg-destructive/10 border border-destructive/30" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"}`}>
                <p className="text-xs text-muted-foreground">Écart</p>
                <p className={`text-2xl font-bold font-mono ${hasEcart ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {formatCurrency(ecart)}
                </p>
              </div>
              {hasEcart && (
                <div>
                  <Label>Explications de l'écart</Label>
                  <Input value={explicationsEcart} onChange={e => setExplicationsEcart(e.target.value)} placeholder="Motif de la différence constatée..." />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => generatePVCaisse(true)}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer PV
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => generatePVCaisse(false)}>
              <Download className="h-3.5 w-3.5 mr-1" /> PV PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilletageTab;
