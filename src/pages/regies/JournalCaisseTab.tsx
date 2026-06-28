import { useState, useMemo } from "react";
import { Plus, Download, Printer, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import { useRegiesStore } from "@/lib/regies/store";
import autoTable from "jspdf-autotable";

const JournalCaisseTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const lignes = useRegiesStore(s => s.lignes);
  const setLignes = useRegiesStore(s => s.setLignes);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", libelle: "", entree: "", sortie: "" });
  const [filterMonth, setFilterMonth] = useState("all");

  const filtered = useMemo(() => {
    if (filterMonth === "all") return lignes;
    return lignes.filter(l => l.date.substring(0, 7) === filterMonth);
  }, [lignes, filterMonth]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.date.localeCompare(b.date)), [filtered]);

  // Running balance
  const withSolde = useMemo(() => {
    let solde = 0;
    return sorted.map(l => {
      solde += l.entree - l.sortie;
      return { ...l, solde };
    });
  }, [sorted]);

  const totalEntrees = sorted.reduce((s, l) => s + l.entree, 0);
  const totalSorties = sorted.reduce((s, l) => s + l.sortie, 0);
  const soldeFinal = withSolde.length > 0 ? withSolde[withSolde.length - 1].solde : 0;

  const handleAdd = () => {
    const entree = Number(form.entree) || 0;
    const sortie = Number(form.sortie) || 0;
    if (!form.date || !form.libelle || (entree === 0 && sortie === 0)) return;
    setLignes([...lignes, { id: `l${Date.now()}`, date: form.date, libelle: form.libelle, entree, sortie }]);
    setForm({ date: "", libelle: "", entree: "", sortie: "" });
    setOpen(false);
  };

  const handleDelete = (id: string) => setLignes(lignes.filter(l => l.id !== id));

  const generatePDF = (print = false) => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Journal de Caisse",
      subtitle: `${est?.name || "Établissement"} — ${est?.uai || ""}`,
      establishment: `${est?.name || "Cockpit Comptable EPLE"} — ${est?.opale_number || ""}`,
    });
    autoTable(doc, {
      startY: 46,
      head: [["Date", "Libellé", "Entrée", "Sortie", "Solde"]],
      body: withSolde.map(l => [
        new Date(l.date).toLocaleDateString("fr-FR"),
        l.libelle,
        l.entree > 0 ? formatCurrency(l.entree) : "",
        l.sortie > 0 ? formatCurrency(l.sortie) : "",
        formatCurrency(l.solde),
      ]),
      foot: [["TOTAUX", "", formatCurrency(totalEntrees), formatCurrency(totalSorties), formatCurrency(soldeFinal)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
      styles: { fontSize: 8.5 },
      margin: { left: 14, right: 14 },
    });
    const y = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text("Arrêté le présent journal de caisse à la somme de :", 14, y);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(soldeFinal), 14, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`Fait à ${est?.city || "___________"}, le ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 18);
    doc.text("L'Agent comptable", 14, y + 30);
    doc.text("Signature : ____________________", 14, y + 38);
    doc.setFontSize(7);
    doc.text("Réf. : M9.6 — Instruction codificatrice 2026 — Décret 2012-1246", 14, y + 50);

    if (print) printPDF(doc);
    else savePDF(doc, `journal_caisse_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const months = useMemo(() => {
    const set = new Set(lignes.map(l => l.date.substring(0, 7)));
    return Array.from(set).sort();
  }, [lignes]);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Mois" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generatePDF(true)}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
          </Button>
          <Button size="sm" variant="outline" onClick={() => generatePDF(false)}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Plus className="h-3.5 w-3.5 mr-1" /> Écriture</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle écriture de caisse</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Libellé</Label><Input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="Motif de l'opération" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Entrée (€)</Label><Input type="number" step="0.01" min="0" value={form.entree} onChange={e => setForm({ ...form, entree: e.target.value })} /></div>
                  <div><Label>Sortie (€)</Label><Input type="number" step="0.01" min="0" value={form.sortie} onChange={e => setForm({ ...form, sortie: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Total Entrées</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalEntrees)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Total Sorties</p>
          <p className="text-lg font-bold text-destructive">{formatCurrency(totalSorties)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Solde</p>
          <p className={`text-lg font-bold ${soldeFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{formatCurrency(soldeFinal)}</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Entrée</TableHead>
                <TableHead className="text-right">Sortie</TableHead>
                <TableHead className="text-right">Solde</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withSolde.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{new Date(l.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{l.libelle}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">{l.entree > 0 ? formatCurrency(l.entree) : ""}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{l.sortie > 0 ? formatCurrency(l.sortie) : ""}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${l.solde >= 0 ? "" : "text-destructive"}`}>{formatCurrency(l.solde)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(l.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">TOTAUX</TableCell>
                <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalEntrees)}</TableCell>
                <TableCell className="text-right font-mono font-bold text-destructive">{formatCurrency(totalSorties)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(soldeFinal)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalCaisseTab;
