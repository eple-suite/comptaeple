import { useMemo, useState } from "react";
import { Receipt, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

/*
 * Détection des ordres de recette à saisir
 * ─────────────────────────────────────────
 * Principe M9-6 : pour chaque code d'activité au sein d'un même service,
 * les recettes doivent couvrir les dépenses.
 * Si Dépenses > Recettes → il faut saisir un ordre de recette (titre)
 * pour rétablir l'équilibre du code d'activité.
 */

interface LigneActivite {
  service: string;
  serviceLibelle: string;
  codeActivite: string;
  libelleActivite: string;
  depensesEngagees: number;
  recettesTitrees: number;
}

const mockActivites: LigneActivite[] = [
  // ── AP ──
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0APA", libelleActivite: "Enseignement général", depensesEngagees: 15200, recettesTitrees: 15200 },
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0APB", libelleActivite: "Enseignement technique", depensesEngagees: 20500, recettesTitrees: 19000 },
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0CDC", libelleActivite: "CDI / Documentation", depensesEngagees: 3800, recettesTitrees: 3800 },
  // ── VE ──
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "16FS-", libelleActivite: "Fonds sociaux", depensesEngagees: 6500, recettesTitrees: 6000 },
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "0BRS-", libelleActivite: "Bourses", depensesEngagees: 115000, recettesTitrees: 115000 },
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "0VOY-", libelleActivite: "Voyages scolaires", depensesEngagees: 34500, recettesTitrees: 32000 },
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "0ASS-", libelleActivite: "Aide sociale élèves", depensesEngagees: 4200, recettesTitrees: 3500 },
  // ── ALO ──
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0VIA-", libelleActivite: "Viabilisation", depensesEngagees: 82000, recettesTitrees: 82000 },
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0ENT-", libelleActivite: "Entretien", depensesEngagees: 14200, recettesTitrees: 14200 },
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0PER-", libelleActivite: "Personnel rémunéré EPLE", depensesEngagees: 50500, recettesTitrees: 50500 },
  // ── SRH ──
  { service: "SRH", serviceLibelle: "Restauration & Hébergement", codeActivite: "0DEN-", libelleActivite: "Denrées alimentaires", depensesEngagees: 165000, recettesTitrees: 158000 },
  { service: "SRH", serviceLibelle: "Restauration & Hébergement", codeActivite: "0HEB-", libelleActivite: "Hébergement", depensesEngagees: 18000, recettesTitrees: 18000 },
  // ── OPC ──
  { service: "OPC", serviceLibelle: "Opérations en Capital", codeActivite: "0INV-", libelleActivite: "Investissements matériels", depensesEngagees: 28000, recettesTitrees: 28000 },
];

const OrdresRecetteTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [activites] = useState(mockActivites);

  const enriched = useMemo(() => activites.map(a => {
    const ecart = a.depensesEngagees - a.recettesTitrees;
    const ordreRecetteNecessaire = ecart > 0;
    return { ...a, ecart, ordreRecetteNecessaire };
  }), [activites]);

  const aRegulariser = enriched.filter(a => a.ordreRecetteNecessaire);
  const totalOrdres = aRegulariser.reduce((s, a) => s + a.ecart, 0);

  // Group par service
  const services = useMemo(() => {
    const map = new Map<string, typeof enriched>();
    enriched.forEach(l => {
      const arr = map.get(l.service) || [];
      arr.push(l);
      map.set(l.service, arr);
    });
    return Array.from(map.entries());
  }, [enriched]);

  const generatePDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Ordres de recette à saisir",
      subtitle: `${est?.name || "Établissement"} — Exercice ${new Date().getFullYear()}`,
    });

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Comparaison dépenses/recettes par code d'activité et par service (nomenclature M9-6).", 14, 44);
    doc.text("Les écarts positifs (dépenses > recettes) correspondent à des ordres de recette à émettre.", 14, 50);

    autoTable(doc, {
      startY: 56,
      head: [["Service", "Code activité", "Libellé", "Dépenses engagées", "Recettes titrées", "Écart", "Action"]],
      body: enriched.map(a => [
        a.service, a.codeActivite, a.libelleActivite,
        formatCurrency(a.depensesEngagees), formatCurrency(a.recettesTitrees),
        a.ecart > 0 ? formatCurrency(a.ecart) : "—",
        a.ordreRecetteNecessaire ? "OR à saisir" : "Équilibré",
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7.5 },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "center" } },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 6 && data.cell.raw === "OR à saisir") {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(0);
    if (totalOrdres > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(`Total des ordres de recette à saisir : ${formatCurrency(totalOrdres)}`, 14, y);
      doc.setFont("helvetica", "normal");
    }
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 10);
    doc.text("L'Agent comptable", 14, y + 22);
    doc.text("Signature : ____________________", 14, y + 30);
    doc.setFontSize(7);
    doc.text("Réf. : M9-6 2026 — Équilibre dépenses/recettes par code d'activité au sein de chaque service", 14, y + 42);
    savePDF(doc, `ordres_recette_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Banner */}
      {aRegulariser.length > 0 ? (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <Receipt className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {aRegulariser.length} ordre{aRegulariser.length > 1 ? "s" : ""} de recette à saisir pour {formatCurrency(totalOrdres)}
              </p>
              <p className="text-xs text-muted-foreground">
                Écart dépenses &gt; recettes détecté sur {aRegulariser.length} code{aRegulariser.length > 1 ? "s" : ""} d'activité
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
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tous les codes d'activité sont équilibrés</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Principe M9-6 :</strong> Au sein d'un même service (AP, VE, ALO, SRH, OPC), 
            chaque code d'activité doit être équilibré entre dépenses et recettes. 
            Lorsque les dépenses engagées dépassent les recettes titrées, un <strong>ordre de recette</strong> (titre) 
            doit être saisi pour rétablir l'équilibre avant toute DBM.
          </p>
        </CardContent>
      </Card>

      {/* Par service */}
      {services.map(([svc, lines]) => {
        const svcOrdres = lines.filter(l => l.ordreRecetteNecessaire);
        const totalEcart = svcOrdres.reduce((s, l) => s + l.ecart, 0);
        return (
          <Card key={svc} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{svc}</Badge>
                {lines[0].serviceLibelle}
                {svcOrdres.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] ml-2">
                    {svcOrdres.length} OR · {formatCurrency(totalEcart)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code activité</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Dépenses engagées</TableHead>
                    <TableHead className="text-right">Recettes titrées</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>Action requise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(a => (
                    <TableRow key={a.codeActivite} className={a.ordreRecetteNecessaire ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-mono font-bold">{a.codeActivite}</TableCell>
                      <TableCell>{a.libelleActivite}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(a.depensesEngagees)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(a.recettesTitrees)}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${a.ecart > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        {a.ecart > 0 ? formatCurrency(a.ecart) : "—"}
                      </TableCell>
                      <TableCell>
                        {a.ordreRecetteNecessaire ? (
                          <Badge variant="destructive" className="text-[9px]">
                            <Receipt className="h-3 w-3 mr-1" /> Saisir OR de {formatCurrency(a.ecart)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-emerald-600">Équilibré</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {svcOrdres.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold text-destructive">Total OR à saisir — {svc}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-destructive">{formatCurrency(totalEcart)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OrdresRecetteTab;
