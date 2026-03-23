import { useMemo, useState } from "react";
import { Calculator, Download, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

/*
 * Calcul des amortissements et DBM type 29
 * ──────────────────────────────────────────
 * Amortissements totaux prévisionnels =
 *   Amortissements budgétisés (ligne 0AMOR en ALO)
 *   + Amortissements prévisionnels issus des achats immobilisés (OPC)
 *
 * DBM type 29 = Amortissements totaux − Amortissements budgétisés
 */

interface LigneImmo {
  designation: string;
  compte: string;       // ex: 2154, 2183
  dateAchat: string;
  montantHT: number;
  dureeAmortissement: number; // en années
  annuiteAmortissement: number; // calculé
  dejaAmorti: number;
}

const mockImmos: LigneImmo[] = [
  { designation: "Serveur informatique", compte: "2183", dateAchat: "2024-09-01", montantHT: 12000, dureeAmortissement: 3, annuiteAmortissement: 4000, dejaAmorti: 4000 },
  { designation: "Photocopieur multifonction", compte: "2154", dateAchat: "2025-01-15", montantHT: 8500, dureeAmortissement: 5, annuiteAmortissement: 1700, dejaAmorti: 0 },
  { designation: "Mobilier laboratoire SVT", compte: "2184", dateAchat: "2025-03-01", montantHT: 15000, dureeAmortissement: 10, annuiteAmortissement: 1500, dejaAmorti: 0 },
  { designation: "Véhicule de service", compte: "2182", dateAchat: "2023-06-01", montantHT: 22000, dureeAmortissement: 5, annuiteAmortissement: 4400, dejaAmorti: 8800 },
  { designation: "Matériel vidéo-projection", compte: "2183", dateAchat: "2025-09-01", montantHT: 6000, dureeAmortissement: 3, annuiteAmortissement: 2000, dejaAmorti: 0 },
];

const AmortissementsDBMTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [immos] = useState(mockImmos);
  const [amortBudgetises, setAmortBudgetises] = useState(12000); // ligne 0AMOR en ALO

  const totalAmortPrevisionnels = useMemo(
    () => immos.reduce((s, i) => s + i.annuiteAmortissement, 0),
    [immos]
  );

  const dbm29 = useMemo(
    () => Math.max(totalAmortPrevisionnels - amortBudgetises, 0),
    [totalAmortPrevisionnels, amortBudgetises]
  );

  const totalValeurBrute = immos.reduce((s, i) => s + i.montantHT, 0);
  const totalDejaAmorti = immos.reduce((s, i) => s + i.dejaAmorti, 0);

  const generatePDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Calcul des amortissements — DBM type 29",
      subtitle: `${est?.name || "Établissement"} — Exercice ${new Date().getFullYear()}`,
    });

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Tableau des immobilisations amortissables et calcul de la DBM type 29 (M9-6 §3.2.4).", 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Désignation", "Compte", "Date achat", "Montant HT", "Durée", "Annuité", "Déjà amorti"]],
      body: immos.map(i => [
        i.designation, i.compte, i.dateAchat,
        formatCurrency(i.montantHT), `${i.dureeAmortissement} ans`,
        formatCurrency(i.annuiteAmortissement), formatCurrency(i.dejaAmorti),
      ]),
      foot: [["TOTAL", "", "", formatCurrency(totalValeurBrute), "", formatCurrency(totalAmortPrevisionnels), formatCurrency(totalDejaAmorti)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      styles: { fontSize: 7.5 },
      columnStyles: { 3: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
      margin: { left: 10, right: 10 },
    });

    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Calcul de la DBM type 29 :", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`  Amortissements prévisionnels totaux : ${formatCurrency(totalAmortPrevisionnels)}`, 14, y + 7);
    doc.text(`  Amortissements déjà budgétisés (0AMOR/ALO) : ${formatCurrency(amortBudgetises)}`, 14, y + 14);
    doc.setFont("helvetica", "bold");
    doc.text(`  DBM type 29 à saisir : ${formatCurrency(dbm29)}`, 14, y + 21);
    doc.setFont("helvetica", "normal");
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 34);
    doc.text("L'Agent comptable", 14, y + 46);
    doc.text("Signature : ____________________", 14, y + 54);
    doc.setFontSize(7);
    doc.text("Réf. : M9-6 2026 — Amortissements (C/28x, C/681) — DBM type 29 (crédits évaluatifs)", 14, y + 66);
    savePDF(doc, `amortissements_dbm29_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Résultat DBM */}
      {dbm29 > 0 ? (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                DBM type 29 nécessaire : {formatCurrency(dbm29)}
              </p>
              <p className="text-xs text-muted-foreground">
                Amortissements prévisionnels ({formatCurrency(totalAmortPrevisionnels)}) &gt; budgétisés ({formatCurrency(amortBudgetises)})
              </p>
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Amortissements couverts par les crédits budgétisés — pas de DBM type 29 nécessaire
            </p>
          </CardContent>
        </Card>
      )}

      {/* Explication */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3">
          <div className="flex gap-2 items-start">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Calcul M9-6 :</strong> La DBM type 29 est calculée en comparant les amortissements 
              prévisionnels totaux (issus du tableau des immobilisations, y compris les acquisitions en cours 
              d'exercice au service OPC) avec les crédits déjà budgétisés à la ligne <strong>0AMOR</strong> du 
              service <strong>ALO</strong>. L'écart constitue le montant de la décision budgétaire modificative 
              (crédits évaluatifs, type 29) à saisir dans Op@le.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Paramètre amortissements budgétisés */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="amort-budget" className="text-sm">
              Amortissements budgétisés (ligne 0AMOR / ALO)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="amort-budget"
                type="number"
                value={amortBudgetises}
                onChange={e => setAmortBudgetises(Number(e.target.value) || 0)}
                className="font-mono"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau immobilisations */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Tableau des immobilisations amortissables
            <Badge variant="outline" className="text-[9px] font-mono">C/28x — C/681</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignation</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>Date d'achat</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
                <TableHead className="text-center">Durée</TableHead>
                <TableHead className="text-right">Annuité</TableHead>
                <TableHead className="text-right">Déjà amorti</TableHead>
                <TableHead className="text-right">VNC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {immos.map((i, idx) => {
                const vnc = i.montantHT - i.dejaAmorti;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{i.designation}</TableCell>
                    <TableCell className="font-mono text-xs">{i.compte}</TableCell>
                    <TableCell className="text-xs">{new Date(i.dateAchat).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(i.montantHT)}</TableCell>
                    <TableCell className="text-center text-xs">{i.dureeAmortissement} ans</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(i.annuiteAmortissement)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(i.dejaAmorti)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(vnc)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">TOTAUX</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totalValeurBrute)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totalAmortPrevisionnels)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totalDejaAmorti)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(totalValeurBrute - totalDejaAmorti)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Synthèse calcul */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Synthèse — DBM type 29
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm">Amortissements prévisionnels totaux</span>
              <span className="font-mono font-semibold">{formatCurrency(totalAmortPrevisionnels)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm">Amortissements budgétisés (0AMOR / ALO)</span>
              <span className="font-mono">{formatCurrency(amortBudgetises)}</span>
            </div>
            <div className={`flex justify-between items-center py-2 rounded px-2 ${dbm29 > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
              <span className={`text-sm font-bold ${dbm29 > 0 ? "text-amber-800 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-400"}`}>
                DBM type 29 à saisir
              </span>
              <span className={`font-mono font-bold text-lg ${dbm29 > 0 ? "text-amber-800 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-400"}`}>
                {formatCurrency(dbm29)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmortissementsDBMTab;
