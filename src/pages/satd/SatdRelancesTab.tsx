import { useState } from "react";
import { Mail, Download, Clock, CheckCircle2, AlertTriangle, Send } from "lucide-react";
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

type TypeRelance = "amiable1" | "amiable2" | "mise_en_demeure" | "poursuite_forcee";
type StatutRelance = "envoyee" | "repondue" | "sans_reponse" | "huissier" | "mainlevee";

const TYPE_LABELS: Record<TypeRelance, string> = {
  amiable1: "Relance amiable 1",
  amiable2: "Relance amiable 2",
  mise_en_demeure: "Mise en demeure",
  poursuite_forcee: "Poursuite forcée",
};

const STATUT_LABELS: Record<StatutRelance, { label: string; color: string }> = {
  envoyee: { label: "Envoyée", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  repondue: { label: "Répondue", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  sans_reponse: { label: "Sans réponse", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  huissier: { label: "Huissier", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  mainlevee: { label: "Mainlevée", color: "bg-emerald-100 text-emerald-800" },
};

interface Relance {
  id: string;
  debiteur: string;
  montant: number;
  type: TypeRelance;
  statut: StatutRelance;
  dateEnvoi: string;
  reference: string;
}

const mockRelances: Relance[] = [
  { id: "r1", debiteur: "DUPONT Marie", montant: 450, type: "amiable1", statut: "sans_reponse", dateEnvoi: "2026-01-15", reference: "REL-2026-001" },
  { id: "r2", debiteur: "MARTIN Jean", montant: 1200, type: "mise_en_demeure", statut: "envoyee", dateEnvoi: "2026-02-20", reference: "REL-2026-002" },
  { id: "r3", debiteur: "BERNARD Sophie", montant: 320, type: "amiable2", statut: "repondue", dateEnvoi: "2026-02-10", reference: "REL-2026-003" },
];

const SatdRelancesTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [relances, setRelances] = useState<Relance[]>(mockRelances);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ debiteur: "", montant: "", type: "amiable1" as TypeRelance, dateEnvoi: "", reference: "" });

  const handleAdd = () => {
    if (!form.debiteur || !form.montant || !form.dateEnvoi) return;
    setRelances([...relances, {
      id: `r${Date.now()}`,
      debiteur: form.debiteur,
      montant: Number(form.montant),
      type: form.type,
      statut: "envoyee",
      dateEnvoi: form.dateEnvoi,
      reference: form.reference || `REL-${new Date().getFullYear()}-${String(relances.length + 1).padStart(3, "0")}`,
    }]);
    setForm({ debiteur: "", montant: "", type: "amiable1", dateEnvoi: "", reference: "" });
    setOpen(false);
  };

  const genererRelancePDF = (r: Relance) => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: TYPE_LABELS[r.type].toUpperCase(),
      subtitle: `${est?.name || "Établissement"} — Réf. ${r.reference}`,
    });
    let y = 50;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`${est?.name || "___________"}`, 14, y);
    doc.text(`${est?.city || "___________"}`, 14, y + 5);
    doc.text(`UAI : ${est?.uai || "___________"}    Op@le : ${est?.opale_number || "___________"}`, 14, y + 10);

    y += 24;
    doc.text(`Destinataire : ${r.debiteur}`, 120, y);
    doc.text(`Date : ${new Date(r.dateEnvoi).toLocaleDateString("fr-FR")}`, 120, y + 6);

    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text(`Objet : ${TYPE_LABELS[r.type]}`, 14, y);
    doc.setFont("helvetica", "normal");

    y += 10;
    const textes: Record<TypeRelance, string> = {
      amiable1: `Madame, Monsieur,\n\nNous vous informons que votre compte présente un solde débiteur de ${formatCurrency(r.montant)}.\nNous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nÀ défaut de paiement sous 30 jours, nous serons contraints d'engager une procédure de recouvrement forcé conformément aux articles L.252 A et suivants du Livre des procédures fiscales.`,
      amiable2: `Madame, Monsieur,\n\nMalgré notre précédente relance, nous constatons que la somme de ${formatCurrency(r.montant)} reste impayée.\nNous vous accordons un dernier délai de 15 jours pour procéder au règlement.\n\nPassé ce délai, une mise en demeure vous sera adressée.`,
      mise_en_demeure: `Madame, Monsieur,\n\nPar la présente, nous vous mettons en demeure de régler sous 8 jours la somme de ${formatCurrency(r.montant)}.\n\nÀ défaut, une procédure de saisie administrative à tiers détenteur (SATD) sera engagée conformément à l'article L.262 du Livre des procédures fiscales et à l'instruction M9.6.`,
      poursuite_forcee: `Madame, Monsieur,\n\nVos relances étant restées sans effet, nous procédons à l'émission d'une SATD pour un montant de ${formatCurrency(r.montant)}.\n\nCette procédure est conforme au décret n° 2012-1246 et à l'instruction M9.6 en vigueur.`,
    };

    const lines = doc.splitTextToSize(textes[r.type], 170);
    doc.text(lines, 14, y);

    const endY = y + lines.length * 5 + 20;
    doc.text("L'Agent comptable", 14, endY);
    doc.text("Signature : ____________________", 14, endY + 8);
    doc.setFontSize(7);
    doc.text("Réf. : LPF art. L.252 A — M9.6 2026 — Décret 2012-1246", 14, endY + 20);

    savePDF(doc, `relance_${r.reference}_${r.debiteur.replace(/\s/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="outline">{relances.length} relances</Badge>
          <Badge variant="destructive" className="text-[9px]">
            {relances.filter(r => r.statut === "sans_reponse").length} sans réponse
          </Badge>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><Send className="h-3.5 w-3.5 mr-1" /> Nouvelle relance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une relance</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Débiteur</Label><Input value={form.debiteur} onChange={e => setForm({ ...form, debiteur: e.target.value })} /></div>
              <div><Label>Montant (€)</Label><Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v: TypeRelance) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date d'envoi</Label><Input type="date" value={form.dateEnvoi} onChange={e => setForm({ ...form, dateEnvoi: e.target.value })} /></div>
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
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date envoi</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relances.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell className="font-medium">{r.debiteur}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px]">{TYPE_LABELS[r.type]}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(r.montant)}</TableCell>
                  <TableCell className="text-xs">{new Date(r.dateEnvoi).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] ${STATUT_LABELS[r.statut].color}`}>{STATUT_LABELS[r.statut].label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => genererRelancePDF(r)} title="Générer PDF">
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

export default SatdRelancesTab;
