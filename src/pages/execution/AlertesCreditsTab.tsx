import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Download, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

/* ─── M9-6 Services & Codes d'activité ─── */

interface LigneExecution {
  service: string;        // AP, VE, ALO, OPC
  serviceLibelle: string;
  codeActivite: string;   // ex: 0APA, 16FS-, 0AMOR
  libelleActivite: string;
  creditOuvert: number;
  engage: number;
  mandatePaye: number;
  moisEcoules: number;    // nb de mois d'exécution écoulés
}

const MOIS_ECOULES = new Date().getMonth(); // 0=jan → mois écoulés depuis début exercice

const mockLignes: LigneExecution[] = [
  // ── AP — Activités Pédagogiques ──
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0APA", libelleActivite: "Enseignement général", creditOuvert: 18000, engage: 15200, mandatePaye: 12800, moisEcoules: MOIS_ECOULES },
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0APB", libelleActivite: "Enseignement technique", creditOuvert: 22000, engage: 20500, mandatePaye: 18000, moisEcoules: MOIS_ECOULES },
  { service: "AP", serviceLibelle: "Activités Pédagogiques", codeActivite: "0CDC", libelleActivite: "CDI / Documentation", creditOuvert: 5000, engage: 3800, mandatePaye: 3200, moisEcoules: MOIS_ECOULES },
  // ── VE — Vie de l'Élève ──
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "16FS-", libelleActivite: "Fonds sociaux", creditOuvert: 6500, engage: 5800, mandatePaye: 5200, moisEcoules: MOIS_ECOULES },
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "0BRS-", libelleActivite: "Bourses", creditOuvert: 120000, engage: 115000, mandatePaye: 110000, moisEcoules: MOIS_ECOULES },
  { service: "VE", serviceLibelle: "Vie de l'Élève", codeActivite: "0VOY-", libelleActivite: "Voyages scolaires", creditOuvert: 35000, engage: 34500, mandatePaye: 30000, moisEcoules: MOIS_ECOULES },
  // ── ALO — Administration et Logistique ──
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0VIA-", libelleActivite: "Viabilisation", creditOuvert: 85000, engage: 82000, mandatePaye: 78000, moisEcoules: MOIS_ECOULES },
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0ENT-", libelleActivite: "Entretien", creditOuvert: 15000, engage: 14200, mandatePaye: 12000, moisEcoules: MOIS_ECOULES },
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0AMOR", libelleActivite: "Amortissements", creditOuvert: 12000, engage: 12000, mandatePaye: 12000, moisEcoules: MOIS_ECOULES },
  { service: "ALO", serviceLibelle: "Administration et Logistique", codeActivite: "0PER-", libelleActivite: "Personnel rémunéré EPLE", creditOuvert: 55000, engage: 50500, mandatePaye: 48000, moisEcoules: MOIS_ECOULES },
  // ── SRH — Service Restauration Hébergement ──
  { service: "SRH", serviceLibelle: "Restauration & Hébergement", codeActivite: "0DEN-", libelleActivite: "Denrées alimentaires", creditOuvert: 180000, engage: 165000, mandatePaye: 150000, moisEcoules: MOIS_ECOULES },
  { service: "SRH", serviceLibelle: "Restauration & Hébergement", codeActivite: "0HEB-", libelleActivite: "Hébergement", creditOuvert: 25000, engage: 18000, mandatePaye: 15000, moisEcoules: MOIS_ECOULES },
  // ── OPC — Opérations en Capital ──
  { service: "OPC", serviceLibelle: "Opérations en Capital", codeActivite: "0INV-", libelleActivite: "Investissements matériels", creditOuvert: 30000, engage: 28000, mandatePaye: 25000, moisEcoules: MOIS_ECOULES },
];

const AlertesCreditsTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [lignes] = useState<LigneExecution[]>(mockLignes);

  const enriched = useMemo(() => lignes.map(l => {
    const disponible = l.creditOuvert - l.engage;
    const tauxConso = l.creditOuvert > 0 ? (l.engage / l.creditOuvert) * 100 : 0;
    const niveau: "ok" | "warning" | "danger" = tauxConso >= 95 ? "danger" : tauxConso >= 80 ? "warning" : "ok";
    // Cadence mensuelle → projection fin d'exercice
    const mois = Math.max(l.moisEcoules, 1);
    const cadenceMensuelle = l.mandatePaye / mois;
    const projectionAnnuelle = cadenceMensuelle * 12;
    const depassementProjecte = projectionAnnuelle > l.creditOuvert;
    const ecartProjection = projectionAnnuelle - l.creditOuvert;
    return { ...l, disponible, tauxConso, niveau, cadenceMensuelle, projectionAnnuelle, depassementProjecte, ecartProjection };
  }), [lignes]);

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

  const alertes = enriched.filter(c => c.niveau !== "ok" || c.depassementProjecte);

  const generatePDF = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Suivi d'exécution budgétaire par service M9-6",
      subtitle: `${est?.name || "Établissement"} — Exercice ${new Date().getFullYear()}`,
    });
    autoTable(doc, {
      startY: 46,
      head: [["Service", "Code", "Libellé", "Crédits ouverts", "Engagé", "Disponible", "Taux", "Cadence/mois", "Projection 12m"]],
      body: enriched.map(c => [
        c.service, c.codeActivite, c.libelleActivite,
        formatCurrency(c.creditOuvert), formatCurrency(c.engage),
        formatCurrency(c.disponible), `${c.tauxConso.toFixed(0)}%`,
        formatCurrency(c.cadenceMensuelle), formatCurrency(c.projectionAnnuelle),
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7 },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "center" }, 7: { halign: "right" }, 8: { halign: "right" } },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 6) {
          const val = parseFloat(data.cell.raw);
          if (val >= 95) data.cell.styles.textColor = [200, 0, 0];
          else if (val >= 80) data.cell.styles.textColor = [200, 120, 0];
        }
      },
    });
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    doc.text("L'Agent comptable", 14, y + 12);
    doc.text("Signature : ____________________", 14, y + 20);
    doc.setFontSize(7);
    doc.text("Réf. : M9-6 2026 — Nomenclature budgétaire par services (AP, VE, ALO, OPC)", 14, y + 32);
    savePDF(doc, `execution_credits_m96_${new Date().toISOString().split("T")[0]}.pdf`);
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
                {alertes.length} ligne{alertes.length > 1 ? "s" : ""} en tension budgétaire
              </p>
              <p className="text-xs text-muted-foreground">
                Dont {enriched.filter(c => c.depassementProjecte).length} dépassement{enriched.filter(c => c.depassementProjecte).length > 1 ? "s" : ""} projeté{enriched.filter(c => c.depassementProjecte).length > 1 ? "s" : ""} au vu de la cadence mensuelle
              </p>
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

      {/* Par service M9-6 */}
      {services.map(([svc, lines]) => {
        const totalCO = lines.reduce((s, l) => s + l.creditOuvert, 0);
        const totalEng = lines.reduce((s, l) => s + l.engage, 0);
        const totalDispo = totalCO - totalEng;
        const tauxGlobal = totalCO > 0 ? (totalEng / totalCO) * 100 : 0;
        return (
          <Card key={svc} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{svc}</Badge>
                {lines[0].serviceLibelle}
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Taux global : {tauxGlobal.toFixed(0)}% — Disponible : {formatCurrency(totalDispo)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code activité</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Crédits ouverts</TableHead>
                    <TableHead className="text-right">Engagé</TableHead>
                    <TableHead className="text-right">Mandaté</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="w-28">Conso.</TableHead>
                    <TableHead className="text-right">Cadence/mois</TableHead>
                    <TableHead className="text-right">Projection 12m</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(c => (
                    <TableRow key={c.codeActivite} className={c.depassementProjecte ? "bg-destructive/5" : c.niveau === "warning" ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-mono font-bold">{c.codeActivite}</TableCell>
                      <TableCell>{c.libelleActivite}</TableCell>
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
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(c.cadenceMensuelle)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${c.depassementProjecte ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {formatCurrency(c.projectionAnnuelle)}
                        {c.depassementProjecte && <Clock className="inline h-3 w-3 ml-1" />}
                      </TableCell>
                      <TableCell>
                        {c.depassementProjecte ? (
                          <Badge variant="destructive" className="text-[9px]">⚠ Dépassement projeté</Badge>
                        ) : c.niveau === "danger" ? (
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
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">Total {svc}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(totalCO)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(totalEng)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(lines.reduce((s, l) => s + l.mandatePaye, 0))}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${totalDispo < 0 ? "text-destructive" : ""}`}>{formatCurrency(totalDispo)}</TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AlertesCreditsTab;
