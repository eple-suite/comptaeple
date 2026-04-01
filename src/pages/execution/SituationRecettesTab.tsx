// ═══════════════════════════════════════════════════════════════
// SITUATION DES RECETTES (SDR)
// Ref. : M9-6 Tome 2 — §2.2 Exécution des recettes
// ═══════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import type { LigneSDR } from "@/lib/cofieple_types";
import { getLeafSdrRows, getEtsSdrRow } from "@/lib/executionRowFilters";

interface ServiceRecetteAggregate {
  service: string;
  previsions: number;
  droitsConstates: number;
  realise: number;
  enCours: number;
  plusValues: number;
  lignes: LigneSDR[];
}

const SituationRecettesTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdrRows = useCofiepleStore(s => s.sdr[activeBudget]) as LigneSDR[];
  const etab = useCofiepleStore(s => s.etablissement);

  const hasData = sdrRows && sdrRows.length > 0;

  // ══ FILTRE FEUILLES UNIQUEMENT ══
  const leafRows = useMemo(() => getLeafSdrRows(sdrRows || []), [sdrRows]);

  const serviceAggregates = useMemo<ServiceRecetteAggregate[]>(() => {
    if (!hasData || leafRows.length === 0) return [];
    const map = new Map<string, ServiceRecetteAggregate>();
    for (const row of leafRows) {
      const svc = row.service || 'INCONNU';
      let agg = map.get(svc);
      if (!agg) {
        agg = { service: svc, previsions: 0, droitsConstates: 0, realise: 0, enCours: 0, plusValues: 0, lignes: [] };
        map.set(svc, agg);
      }
      agg.previsions += row.budget || 0;
      agg.droitsConstates += row.aor || 0;
      agg.realise += row.realise || 0;
      agg.enCours += row.encours || 0;
      agg.plusValues += row.plusValues || 0;
      agg.lignes.push(row);
    }
    return Array.from(map.values());
  }, [leafRows, hasData]);

  const droitsSansTitre = useMemo(() => {
    if (!hasData) return [];
    return leafRows.filter(r => (r.budget || 0) > 100 && (r.aor || 0) === 0 && (r.realise || 0) === 0);
  }, [leafRows, hasData]);

  // ══ TOTAUX : préférer le niveau ETS ══
  const totaux = useMemo(() => {
    const etsRow = getEtsSdrRow(sdrRows || []);
    if (etsRow) {
      return {
        previsions: etsRow.budget,
        droitsConstates: etsRow.aor,
        realise: etsRow.realise,
        enCours: etsRow.encours,
        plusValues: etsRow.plusValues,
      };
    }
    const t = { previsions: 0, droitsConstates: 0, realise: 0, enCours: 0, plusValues: 0 };
    for (const s of serviceAggregates) {
      t.previsions += s.previsions;
      t.droitsConstates += s.droitsConstates;
      t.realise += s.realise;
      t.enCours += s.enCours;
      t.plusValues += s.plusValues;
    }
    return t;
  }, [sdrRows, serviceAggregates]);

  const generatePDF = () => {
    const doc = createStyledPDF({
      title: "Situation des recettes (SDR)",
      subtitle: `${etab.nom || selectedEstablishment?.name || "Établissement"} — Exercice ${etab.exercice}`,
    });
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text("Ref. : M9-6 Tome 2 — §2.2 Exécution des recettes — Liquidation, titres de recettes, recouvrement", 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Service", "Prévisions", "Titres émis (AOR)", "Encaissé", "En cours", "Plus-values"]],
      body: serviceAggregates.map(s => [
        s.service,
        formatCurrency(s.previsions),
        formatCurrency(s.droitsConstates),
        formatCurrency(s.realise),
        formatCurrency(s.enCours),
        formatCurrency(s.plusValues),
      ]),
      foot: [["TOTAL", formatCurrency(totaux.previsions), formatCurrency(totaux.droitsConstates), formatCurrency(totaux.realise), formatCurrency(totaux.enCours), formatCurrency(totaux.plusValues)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      styles: { fontSize: 7.5 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
      margin: { left: 10, right: 10 },
    });

    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    doc.text("L'Agent comptable", 14, y + 12);
    doc.text("Signature : ____________________", 14, y + 20);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).", 14, y + 32);
    savePDF(doc, `sdr_m96_${etab.exercice}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!hasData) {
    return (
      <div className="mt-4">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Aucune situation des recettes (SDR) importée
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Importez l'export Op@le « Situation des recettes » depuis le module Compte Financier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {droitsSansTitre.length > 0 ? (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {droitsSansTitre.length} ligne{droitsSansTitre.length > 1 ? "s" : ""} avec prévisions sans titre de recettes émis
              </p>
              <p className="text-xs text-muted-foreground">
                Des droits sont prévus mais aucun titre n'a été émis (M9-6 Tome 2 — §2.2.2)
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
              Toutes les prévisions de recettes ont fait l'objet d'un titre de recettes
            </p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Références M9-6 :</strong> Tome 2 — §2.2 Exécution des recettes : 
            liquidation et constatation des droits (§2.2.1), émission et contenu des titres de recettes (§2.2.2), 
            prise en charge par l'agent comptable (§2.2.3), contrôles de l'agent comptable (§2.2.4), 
            recouvrement amiable et contentieux (§2.2.5).
          </p>
        </CardContent>
      </Card>

      {serviceAggregates.map(svc => {
        const tauxRecouvrement = svc.droitsConstates > 0 ? (svc.realise / svc.droitsConstates) * 100 : 0;
        const lignesSansTitre = svc.lignes.filter(l => (l.budget || 0) > 0 && (l.aor || 0) === 0 && (l.realise || 0) === 0);
        return (
          <Card key={svc.service} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{svc.service}</Badge>
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Recouvrement : {tauxRecouvrement.toFixed(0)}% des titres émis
                </span>
                {lignesSansTitre.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[9px]">
                    {lignesSansTitre.length} sans titre
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
                    <TableHead className="text-right">Prévisions</TableHead>
                    <TableHead className="text-right">Titres émis (AOR)</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                    <TableHead className="text-right">En cours</TableHead>
                    <TableHead className="text-right">Plus-values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {svc.lignes.map((l, idx) => {
                    const sansTitre = (l.budget || 0) > 0 && (l.aor || 0) === 0 && (l.realise || 0) === 0;
                    return (
                      <TableRow key={idx} className={sansTitre ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                        <TableCell className="text-xs">{l.domaine}</TableCell>
                        <TableCell className="font-mono text-xs">{l.activite}</TableCell>
                        <TableCell className="font-mono text-xs">{l.compte}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.budget)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.aor)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.realise)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.encours)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(l.plusValues)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total {svc.service}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.previsions)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.droitsConstates)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.realise)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.enCours)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(svc.plusValues)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      <Card className="shadow-card bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Prévisions</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.previsions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Titres émis (AOR)</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.droitsConstates)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Encaissé</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.realise)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En cours</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.enCours)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plus-values</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(totaux.plusValues)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground italic text-center">
        Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).
        Aucun calcul prospectif, prévisionnel ou statistique n'est effectué car non prévu par l'instruction.
      </p>
    </div>
  );
};

export default SituationRecettesTab;
