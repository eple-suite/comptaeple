// ═══════════════════════════════════════════════════════════════
// COHÉRENCE & ÉQUILIBRE BUDGÉTAIRE
// Ref. : M9-6 Tome 2 — §2.1.1 Principes budgétaires
// Croisement SDE / SDR par service et activité
// ═══════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import type { LigneSDE, LigneSDR } from "@/lib/cofieple_types";

interface LigneCoherence {
  service: string;
  activite: string;
  depensesEngagees: number;
  recettesTitrees: number;
  ecart: number;
  titreRecetteNecessaire: boolean;
}

const CoherenceBudgetaireTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeRows = useCofiepleStore(s => s.sde[activeBudget]) as LigneSDE[];
  const sdrRows = useCofiepleStore(s => s.sdr[activeBudget]) as LigneSDR[];
  const etab = useCofiepleStore(s => s.etablissement);

  const hasSDE = sdeRows && sdeRows.length > 0;
  const hasSDR = sdrRows && sdrRows.length > 0;
  const hasData = hasSDE && hasSDR;

  // Cross-reference SDE vs SDR by service + activité
  const lignesCoherence = useMemo<LigneCoherence[]>(() => {
    if (!hasData) return [];

    // Aggregate SDE by service+activite
    const depMap = new Map<string, { service: string; activite: string; total: number }>();
    for (const r of sdeRows) {
      const key = `${r.service}|${r.activite}`;
      const existing = depMap.get(key);
      if (existing) existing.total += r.engage || 0;
      else depMap.set(key, { service: r.service, activite: r.activite, total: r.engage || 0 });
    }

    // Aggregate SDR by service+activite
    const recMap = new Map<string, number>();
    for (const r of sdrRows) {
      const key = `${r.service}|${r.activite}`;
      recMap.set(key, (recMap.get(key) || 0) + (r.aor || 0));
    }

    const result: LigneCoherence[] = [];
    for (const [key, dep] of depMap.entries()) {
      const recettes = recMap.get(key) || 0;
      const ecart = dep.total - recettes;
      result.push({
        service: dep.service,
        activite: dep.activite,
        depensesEngagees: dep.total,
        recettesTitrees: recettes,
        ecart,
        titreRecetteNecessaire: ecart > 0,
      });
    }

    // Add SDR-only entries (recettes without matching depenses)
    for (const [key, montant] of recMap.entries()) {
      if (!depMap.has(key)) {
        const [service, activite] = key.split('|');
        result.push({
          service, activite,
          depensesEngagees: 0, recettesTitrees: montant,
          ecart: -montant, titreRecetteNecessaire: false,
        });
      }
    }

    return result.sort((a, b) => a.service.localeCompare(b.service) || b.ecart - a.ecart);
  }, [sdeRows, sdrRows, hasData]);

  const titresNecessaires = lignesCoherence.filter(l => l.titreRecetteNecessaire);
  const totalTitres = titresNecessaires.reduce((s, l) => s + l.ecart, 0);

  // Group by service
  const serviceGroups = useMemo(() => {
    const map = new Map<string, LigneCoherence[]>();
    for (const l of lignesCoherence) {
      const arr = map.get(l.service) || [];
      arr.push(l);
      map.set(l.service, arr);
    }
    return Array.from(map.entries());
  }, [lignesCoherence]);

  // Equilibre check (M9-6 §2.1.1)
  const totalDepenses = lignesCoherence.reduce((s, l) => s + l.depensesEngagees, 0);
  const totalRecettes = lignesCoherence.reduce((s, l) => s + l.recettesTitrees, 0);
  const equilibreGlobal = Math.abs(totalDepenses - totalRecettes);

  const generatePDF = () => {
    const doc = createStyledPDF({
      title: "Cohérence budgétaire — Croisement SDE / SDR",
      subtitle: `${etab.nom || selectedEstablishment?.name || "Établissement"} — Exercice ${etab.exercice}`,
    });
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text("Ref. : M9-6 Tome 2 — §2.1.1 Principes budgétaires — Équilibre, spécialité, universalité", 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Service", "Activité", "Dépenses engagées", "Recettes titrées", "Écart", "Titre de recettes"]],
      body: lignesCoherence.map(l => [
        l.service, l.activite,
        formatCurrency(l.depensesEngagees), formatCurrency(l.recettesTitrees),
        l.ecart !== 0 ? formatCurrency(l.ecart) : "—",
        l.titreRecetteNecessaire ? `Titre à émettre : ${formatCurrency(l.ecart)}` : "Équilibré",
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 5 && String(data.cell.raw).startsWith("Titre")) {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(0);
    if (totalTitres > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(`Total des titres de recettes à émettre : ${formatCurrency(totalTitres)}`, 14, y);
      doc.setFont("helvetica", "normal");
    }
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 10);
    doc.text("L'Agent comptable", 14, y + 22);
    doc.text("Signature : ____________________", 14, y + 30);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).", 14, y + 42);
    savePDF(doc, `coherence_sde_sdr_${etab.exercice}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!hasData) {
    return (
      <div className="mt-4">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-12 text-center">
            <Scale className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Croisement SDE / SDR impossible
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {!hasSDE && !hasSDR
                ? "Importez les exports Op@le « Situation des dépenses engagées » et « Situation des recettes »."
                : !hasSDE
                  ? "La situation des dépenses engagées (SDE) n'est pas importée."
                  : "La situation des recettes (SDR) n'est pas importée."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Titres à émettre banner */}
      {titresNecessaires.length > 0 ? (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {titresNecessaires.length} titre{titresNecessaires.length > 1 ? "s" : ""} de recettes à émettre pour {formatCurrency(totalTitres)}
              </p>
              <p className="text-xs text-muted-foreground">
                Écart dépenses engagées &gt; recettes titrées constaté au sein du même service et de la même activité
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
              Dépenses et recettes équilibrées par service et activité
            </p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equilibre global */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Principe d'équilibre (M9-6 Tome 2 — §2.1.1) :</strong> Les dépenses engagées et les recettes 
              titrées doivent être rapprochées par service et par activité. Tout écart significatif 
              appelle l'émission d'un titre de recettes par l'ordonnateur.
            </p>
            <div className="text-right ml-4 shrink-0">
              <p className="text-xs text-muted-foreground">Écart global</p>
              <p className={`font-mono font-bold ${equilibreGlobal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatCurrency(equilibreGlobal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Par service */}
      {serviceGroups.map(([svc, lines]) => {
        const svcTitres = lines.filter(l => l.titreRecetteNecessaire);
        const totalEcart = svcTitres.reduce((s, l) => s + l.ecart, 0);
        return (
          <Card key={svc} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{svc}</Badge>
                {svcTitres.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] ml-2">
                    {svcTitres.length} titre{svcTitres.length > 1 ? "s" : ""} · {formatCurrency(totalEcart)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activité</TableHead>
                    <TableHead className="text-right">Dépenses engagées</TableHead>
                    <TableHead className="text-right">Recettes titrées</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>Constatation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, idx) => (
                    <TableRow key={idx} className={l.titreRecetteNecessaire ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-mono text-xs">{l.activite}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(l.depensesEngagees)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(l.recettesTitrees)}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${l.ecart > 0 ? "text-destructive" : l.ecart < 0 ? "text-emerald-600" : ""}`}>
                        {l.ecart !== 0 ? formatCurrency(l.ecart) : "—"}
                      </TableCell>
                      <TableCell>
                        {l.titreRecetteNecessaire ? (
                          <Badge variant="destructive" className="text-[9px]">
                            Titre de recettes à émettre
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-emerald-600">Équilibré</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {svcTitres.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold text-destructive">Total titres à émettre — {svc}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
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

      <p className="text-[10px] text-muted-foreground italic text-center">
        Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).
        Aucun calcul prospectif, prévisionnel ou statistique n'est effectué car non prévu par l'instruction.
      </p>
    </div>
  );
};

export default CoherenceBudgetaireTab;
