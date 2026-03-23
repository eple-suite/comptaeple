// ═══════════════════════════════════════════════════════════════
// SITUATION DES DÉPENSES ENGAGÉES (SDE)
// Ref. : M9-6 Tome 2 — §2.3 Exécution des dépenses
// Principes : spécialité (§2.1.1), engagement, liquidation, ordonnancement
// ═══════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import type { LigneSDE } from "@/lib/cofieple_types";

interface ServiceAggregate {
  service: string;
  creditsOuverts: number;
  engagements: number;
  demandePaiement: number;
  disponible: number;
  lignes: LigneSDE[];
}

const SituationDepensesTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeRows = useCofiepleStore(s => s.sde[activeBudget]) as LigneSDE[];
  const etab = useCofiepleStore(s => s.etablissement);

  const hasData = sdeRows && sdeRows.length > 0;

  // Aggregate by service
  const serviceAggregates = useMemo<ServiceAggregate[]>(() => {
    if (!hasData) return [];
    const map = new Map<string, ServiceAggregate>();
    for (const row of sdeRows) {
      const svc = row.service || 'INCONNU';
      let agg = map.get(svc);
      if (!agg) {
        agg = { service: svc, creditsOuverts: 0, engagements: 0, demandePaiement: 0, disponible: 0, lignes: [] };
        map.set(svc, agg);
      }
      agg.creditsOuverts += row.budget || 0;
      agg.engagements += row.engage || 0;
      agg.demandePaiement += row.realise || 0;
      agg.disponible += row.disponible || 0;
      agg.lignes.push(row);
    }
    return Array.from(map.values());
  }, [sdeRows, hasData]);

  // Detect violations of spécialité (crédits dépassés)
  const creditsDepasses = useMemo(() => {
    if (!hasData) return [];
    return sdeRows.filter(r => (r.disponible ?? 0) < 0);
  }, [sdeRows, hasData]);

  const totaux = useMemo(() => {
    const t = { creditsOuverts: 0, engagements: 0, demandePaiement: 0, disponible: 0 };
    for (const s of serviceAggregates) {
      t.creditsOuverts += s.creditsOuverts;
      t.engagements += s.engagements;
      t.demandePaiement += s.demandePaiement;
      t.disponible += s.disponible;
    }
    return t;
  }, [serviceAggregates]);

  const generatePDF = () => {
    const doc = createStyledPDF({
      title: "Situation des dépenses engagées (SDE)",
      subtitle: `${etab.nom || selectedEstablishment?.name || "Établissement"} — Exercice ${etab.exercice}`,
    });
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text("Ref. : M9-6 Tome 2 — §2.3 Exécution des dépenses — §2.1.1 Principe de spécialité", 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Service", "Crédits ouverts", "Engagements", "Demandes de paiement", "Disponible"]],
      body: serviceAggregates.map(s => [
        s.service,
        formatCurrency(s.creditsOuverts),
        formatCurrency(s.engagements),
        formatCurrency(s.demandePaiement),
        formatCurrency(s.disponible),
      ]),
      foot: [["TOTAL", formatCurrency(totaux.creditsOuverts), formatCurrency(totaux.engagements), formatCurrency(totaux.demandePaiement), formatCurrency(totaux.disponible)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      styles: { fontSize: 7.5 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
      margin: { left: 10, right: 10 },
    });

    if (creditsDepasses.length > 0) {
      const y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(8);
      doc.setTextColor(200, 0, 0);
      doc.text(`ANOMALIE : ${creditsDepasses.length} ligne(s) présentant un dépassement de crédits (violation du principe de spécialité — M9-6 §2.1.1)`, 14, y);
    }

    const y2 = (doc as any).lastAutoTable.finalY + (creditsDepasses.length > 0 ? 20 : 10);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y2);
    doc.text("L'Agent comptable", 14, y2 + 12);
    doc.text("Signature : ____________________", 14, y2 + 20);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).", 14, y2 + 32);
    savePDF(doc, `sde_m96_${etab.exercice}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!hasData) {
    return (
      <div className="mt-4">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Aucune situation des dépenses engagées (SDE) importée
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Importez l'export Op@le « Situation des dépenses engagées » depuis le module Compte Financier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Anomalies banner */}
      {creditsDepasses.length > 0 ? (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {creditsDepasses.length} ligne{creditsDepasses.length > 1 ? "s" : ""} en dépassement de crédits
              </p>
              <p className="text-xs text-muted-foreground">
                Violation du principe de spécialité (M9-6 Tome 2 — §2.1.1) — crédits disponibles négatifs
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
              Aucun dépassement de crédits constaté — principe de spécialité respecté
            </p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regulatory note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Références M9-6 :</strong> Tome 2 — §2.3 Exécution des dépenses : engagement (§2.3.1), 
            liquidation et service fait (§2.3.2), ordonnancement — demande de paiement (§2.3.3), 
            contrôles de l'agent comptable (§2.3.4). Principe de spécialité : §2.1.1.
          </p>
        </CardContent>
      </Card>

      {/* By service */}
      {serviceAggregates.map(svc => {
        const tauxEng = svc.creditsOuverts > 0 ? (svc.engagements / svc.creditsOuverts) * 100 : 0;
        const lignesDepassees = svc.lignes.filter(l => (l.disponible ?? 0) < 0);
        return (
          <Card key={svc.service} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{svc.service}</Badge>
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Engagements : {tauxEng.toFixed(0)}% des crédits — Disponible : {formatCurrency(svc.disponible)}
                </span>
                {lignesDepassees.length > 0 && (
                  <Badge variant="destructive" className="text-[9px]">
                    {lignesDepassees.length} dépassement{lignesDepassees.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domaine</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="text-right">Crédits ouverts</TableHead>
                    <TableHead className="text-right">Engagements</TableHead>
                    <TableHead className="text-right">Demandes de paiement</TableHead>
                    <TableHead className="text-right">En cours</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {svc.lignes.map((l, idx) => {
                    const depasse = (l.disponible ?? 0) < 0;
                    return (
                      <TableRow key={idx} className={depasse ? "bg-destructive/5" : ""}>
                        <TableCell className="text-xs">{l.domaine}</TableCell>
                        <TableCell className="font-mono text-xs">{l.activite}</TableCell>
                        <TableCell className="font-mono text-xs">{l.compte}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.budget)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.engage)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.realise)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.encours)}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${depasse ? "text-destructive" : ""}`}>
                          {formatCurrency(l.disponible)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total {svc.service}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.creditsOuverts)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.engagements)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.demandePaiement)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(svc.lignes.reduce((s, l) => s + (l.encours || 0), 0))}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${svc.disponible < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(svc.disponible)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Grand total */}
      <Card className="shadow-card bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Crédits ouverts</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.creditsOuverts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Engagements</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.engagements)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Demandes de paiement</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.demandePaiement)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponible</p>
              <p className={`text-lg font-bold font-mono ${totaux.disponible < 0 ? "text-destructive" : ""}`}>
                {formatCurrency(totaux.disponible)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mention légale */}
      <p className="text-[10px] text-muted-foreground italic text-center">
        Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).
        Aucun calcul prospectif, prévisionnel ou statistique n'est effectué car non prévu par l'instruction.
      </p>
    </div>
  );
};

export default SituationDepensesTab;
