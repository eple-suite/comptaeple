import { useState } from "react";
import { Download, Plus, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { formatCurrency } from "@/lib/mockData";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

type StatutSurendettement = "declaration" | "recevable" | "plan_conventionnel" | "plan_impose" | "retablissement" | "cloture";

const STATUT_LABELS: Record<StatutSurendettement, { label: string; color: string }> = {
  declaration: { label: "Déclaration", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  recevable: { label: "Recevable", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  plan_conventionnel: { label: "Plan conventionnel", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  plan_impose: { label: "Plan imposé", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  retablissement: { label: "Rétablissement perso.", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  cloture: { label: "Clôturé", color: "bg-muted text-muted-foreground" },
};

interface DossierSurendettement {
  id: string;
  debiteur: string;
  montantCreance: number;
  dateDeclaration: string;
  commission: string;
  reference: string;
  statut: StatutSurendettement;
  observations: string;
}

const mockDossiers: DossierSurendettement[] = [
  { id: "s1", debiteur: "LEROY Alain", montantCreance: 850, dateDeclaration: "2026-01-10", commission: "Banque de France — Commission de surendettement de Paris", reference: "SUR-2026-001", statut: "recevable", observations: "Dossier déclaré recevable le 15/02/2026" },
  { id: "s2", debiteur: "PETIT Nathalie", montantCreance: 1200, dateDeclaration: "2025-11-05", commission: "Banque de France — Commission de surendettement de Lyon", reference: "SUR-2025-003", statut: "plan_conventionnel", observations: "Plan de 24 mois accepté" },
];

const SatdSurendettementTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [dossiers, setDossiers] = useState<DossierSurendettement[]>(mockDossiers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ debiteur: "", montantCreance: "", dateDeclaration: "", commission: "", observations: "" });

  const handleAdd = () => {
    if (!form.debiteur || !form.montantCreance) return;
    setDossiers([...dossiers, {
      id: `s${Date.now()}`,
      debiteur: form.debiteur,
      montantCreance: Number(form.montantCreance),
      dateDeclaration: form.dateDeclaration,
      commission: form.commission,
      reference: `SUR-${new Date().getFullYear()}-${String(dossiers.length + 1).padStart(3, "0")}`,
      statut: "declaration",
      observations: form.observations,
    }]);
    setForm({ debiteur: "", montantCreance: "", dateDeclaration: "", commission: "", observations: "" });
    setOpen(false);
  };

  const genererDeclarationPDF = (d: DossierSurendettement) => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "Déclaration de Créances",
      subtitle: `Commission de surendettement — Réf. ${d.reference}`,
    });
    let y = 50;
    doc.setFontSize(10);
    doc.setTextColor(0);

    // Expediteur
    doc.text(`${est?.name || "___________"}`, 14, y);
    doc.text(`Agent comptable`, 14, y + 5);
    doc.text(`UAI : ${est?.uai || "___________"}`, 14, y + 10);

    // Destinataire
    doc.text(`À : ${d.commission}`, 100, y);

    y += 24;
    doc.setFont("helvetica", "bold");
    doc.text("DÉCLARATION DE CRÉANCES", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
    doc.text(`(Art. L.722-5 du Code de la consommation)`, doc.internal.pageSize.getWidth() / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "normal");

    y += 18;
    doc.text(`Créancier : ${est?.name || "___________"} (EPLE)`, 14, y);
    y += 7;
    doc.text(`Débiteur : ${d.debiteur}`, 14, y);
    y += 7;
    doc.text(`Référence interne : ${d.reference}`, 14, y);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Nature et montant de la créance :", 14, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(`Créance de droit public — Titre de recettes EPLE`, 14, y);
    y += 7;
    doc.text(`Montant : ${formatCurrency(d.montantCreance)}`, 14, y);
    y += 7;
    doc.text(`Caractère : créance privilégiée (créance publique)`, 14, y);

    y += 14;
    doc.text("L'établissement déclare la créance ci-dessus à la Commission de surendettement", 14, y);
    doc.text("et demande son inscription au plan de redressement du débiteur.", 14, y + 6);

    y += 20;
    doc.text(`Fait à ${est?.city || "___________"}, le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    y += 12;
    doc.text("L'Agent comptable", 14, y);
    doc.text("Signature : ____________________", 14, y + 8);

    doc.setFontSize(7);
    doc.text("Réf. : Code de la consommation L.722-5 — M9.6 — Décret 2012-1246", 14, y + 22);
    savePDF(doc, `declaration_creances_${d.reference}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline">{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}</Badge>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><Plus className="h-3.5 w-3.5 mr-1" /> Nouveau dossier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Déclarer une créance (surendettement)</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Débiteur</Label><Input value={form.debiteur} onChange={e => setForm({ ...form, debiteur: e.target.value })} /></div>
              <div><Label>Montant créance (€)</Label><Input type="number" value={form.montantCreance} onChange={e => setForm({ ...form, montantCreance: e.target.value })} /></div>
              <div><Label>Date déclaration</Label><Input type="date" value={form.dateDeclaration} onChange={e => setForm({ ...form, dateDeclaration: e.target.value })} /></div>
              <div><Label>Commission</Label><Input value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} placeholder="Banque de France — Commission de..." /></div>
              <div><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} /></div>
              <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Débiteur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dossiers.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.reference}</TableCell>
                  <TableCell className="font-medium">{d.debiteur}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(d.montantCreance)}</TableCell>
                  <TableCell className="text-xs">{d.dateDeclaration ? new Date(d.dateDeclaration).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] ${STATUT_LABELS[d.statut].color}`}>{STATUT_LABELS[d.statut].label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{d.commission}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => genererDeclarationPDF(d)} title="Déclaration PDF">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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

export default SatdSurendettementTab;
