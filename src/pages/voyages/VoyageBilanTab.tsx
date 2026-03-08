import { useMemo } from "react";
import { Euro, TrendingUp, TrendingDown, Download, Users, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Voyage, CATEGORIES_PRESTATIONS } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  voyage: Voyage;
}

const COLORS = ["hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(215, 25%, 65%)", "hsl(0, 0%, 70%)"];

export const VoyageBilanTab = ({ voyage }: Props) => {
  const v = voyage;

  const totalRecettes = v.participationFamilles + v.subventions + v.autofinancement;
  const totalDepenses = v.transport + v.hebergement + v.restauration + v.activites + v.assurance + v.divers;
  const solde = totalRecettes - totalDepenses;
  const coutParEleve = v.nbEleves > 0 ? v.budgetTotal / v.nbEleves : 0;
  const coutParJour = (() => {
    const d1 = new Date(v.dateDepart);
    const d2 = new Date(v.dateRetour);
    const jours = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
    return v.budgetTotal / jours;
  })();

  // Paiements élèves
  const stats = useMemo(() => {
    const totalDu = v.eleves.reduce((s, e) => s + e.participationDue, 0);
    const totalRecu = v.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    const nbSoldes = v.eleves.filter(e => e.paiements.reduce((s, p) => s + p.montant, 0) >= e.participationDue).length;
    return { totalDu, totalRecu, resteARecouvrer: totalDu - totalRecu, nbSoldes, tauxRecouvrement: totalDu > 0 ? (totalRecu / totalDu) * 100 : 0 };
  }, [v.eleves]);

  const depensesPie = CATEGORIES_PRESTATIONS.map((cat, i) => ({
    name: cat.label,
    value: v[cat.key] || 0,
    color: COLORS[i],
  })).filter(d => d.value > 0);

  const recettesPie = [
    { name: "Familles", value: v.participationFamilles, color: "hsl(215, 70%, 45%)" },
    { name: "Collectivité", value: v.subventionCollectivite, color: "hsl(160, 45%, 45%)" },
    { name: "État", value: v.subventionEtat, color: "hsl(38, 92%, 50%)" },
    { name: "Autres subv.", value: v.subventionAutre, color: "hsl(280, 60%, 55%)" },
    { name: "Autofinancement", value: v.autofinancement, color: "hsl(215, 25%, 65%)" },
  ].filter(d => d.value > 0);

  const exportBilanPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bilan financier — Voyage à ${v.destination}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`${v.pays} — Du ${v.dateDepart} au ${v.dateRetour}`, 14, 28);
    doc.text(`Classe : ${v.classe} — Référent : ${v.professeur}`, 14, 34);
    doc.text(`${v.nbEleves} élèves, ${v.nbAccompagnateurs} accompagnateurs`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["RECETTES", "Montant"]],
      body: [
        ["Participation des familles", formatCurrency(v.participationFamilles)],
        ["Subvention collectivité", formatCurrency(v.subventionCollectivite)],
        ["Subvention État", formatCurrency(v.subventionEtat)],
        ["Autres subventions", formatCurrency(v.subventionAutre)],
        ["Autofinancement", formatCurrency(v.autofinancement)],
        ["TOTAL RECETTES", formatCurrency(totalRecettes)],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 98, 255] },
    });

    const y2 = (doc as any).lastAutoTable?.finalY || 100;
    autoTable(doc, {
      startY: y2 + 5,
      head: [["DÉPENSES", "Montant"]],
      body: [
        ...CATEGORIES_PRESTATIONS.map(cat => [cat.label, formatCurrency(v[cat.key] || 0)]),
        ["TOTAL DÉPENSES", formatCurrency(totalDepenses)],
      ],
      theme: "grid",
      headStyles: { fillColor: [220, 53, 69] },
    });

    const y3 = (doc as any).lastAutoTable?.finalY || 170;
    doc.setFontSize(12);
    doc.text(`SOLDE : ${formatCurrency(solde)}`, 14, y3 + 12);
    doc.setFontSize(10);
    doc.text(`Coût par élève : ${formatCurrency(coutParEleve)}`, 14, y3 + 20);
    doc.text(`Recouvrement familles : ${stats.tauxRecouvrement.toFixed(1)}% (${stats.nbSoldes}/${v.eleves.length} soldés)`, 14, y3 + 26);

    doc.save(`bilan_financier_${v.destination}_${v.dateDepart}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Header bilan */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-display">{v.destination} ({v.pays})</h3>
          <p className="text-xs text-muted-foreground">Du {v.dateDepart} au {v.dateRetour} — {v.classe} — {v.professeur}</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportBilanPDF}>
          <Download className="h-3 w-3 mr-1" /> Bilan PDF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Budget total", value: formatCurrency(v.budgetTotal), sub: "" },
          { label: "Recettes", value: formatCurrency(totalRecettes), sub: "" },
          { label: "Dépenses", value: formatCurrency(totalDepenses), sub: "" },
          { label: "Solde", value: formatCurrency(solde), sub: solde >= 0 ? "Excédentaire" : "Déficitaire" },
          { label: "Coût / élève", value: formatCurrency(coutParEleve), sub: `${formatCurrency(coutParJour)}/jour` },
        ].map((k, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`text-lg font-bold font-mono ${k.label === "Solde" ? (solde >= 0 ? "text-success" : "text-destructive") : ""}`}>{k.value}</div>
              {k.sub && <div className="text-[10px] text-muted-foreground">{k.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recettes / Dépenses côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Table>
                  <TableBody>
                    {recettesPie.map(r => (
                      <TableRow key={r.name}>
                        <TableCell className="text-xs">{r.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(r.value)}</TableCell>
                        <TableCell className="text-right text-[10px] text-muted-foreground">
                          {totalRecettes > 0 ? `${((r.value / totalRecettes) * 100).toFixed(0)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-xs">Total</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(totalRecettes)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="w-[120px]">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={recettesPie} dataKey="value" cx="50%" cy="50%" outerRadius={50} strokeWidth={1}>
                      {recettesPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Table>
                  <TableBody>
                    {depensesPie.map(d => (
                      <TableRow key={d.name}>
                        <TableCell className="text-xs">{d.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(d.value)}</TableCell>
                        <TableCell className="text-right text-[10px] text-muted-foreground">
                          {totalDepenses > 0 ? `${((d.value / totalDepenses) * 100).toFixed(0)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-xs">Total</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(totalDepenses)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="w-[120px]">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={depensesPie} dataKey="value" cx="50%" cy="50%" outerRadius={50} strokeWidth={1}>
                      {depensesPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recouvrement familles */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Recouvrement familles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total dû</div>
              <div className="text-lg font-bold font-mono">{formatCurrency(stats.totalDu)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total reçu</div>
              <div className="text-lg font-bold font-mono text-success">{formatCurrency(stats.totalRecu)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reste à recouvrer</div>
              <div className={`text-lg font-bold font-mono ${stats.resteARecouvrer > 0 ? "text-destructive" : "text-success"}`}>
                {stats.resteARecouvrer <= 0 ? "0 €" : formatCurrency(stats.resteARecouvrer)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Taux de recouvrement</div>
              <div className="text-lg font-bold">{stats.tauxRecouvrement.toFixed(1)}%</div>
              <Progress value={stats.tauxRecouvrement} className="h-2 mt-1" />
            </div>
          </div>
          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground">
            {stats.nbSoldes} élèves soldés sur {v.eleves.length} inscrits — {v.eleves.length - stats.nbSoldes} reste(nt) à solder
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
