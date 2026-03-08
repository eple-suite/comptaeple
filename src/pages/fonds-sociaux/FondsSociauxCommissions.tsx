import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/mockData";
import { Commission, DemandeAide, STATUT_CONFIG, TYPE_LABELS, NATURES_AIDE } from "./types";
import { Calendar, Users, Plus, FileText, CheckCircle2, XCircle, Eye, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  commissions: Commission[];
  demandes: DemandeAide[];
  onUpdateCommission: (c: Commission) => void;
  onAddCommission: (c: Commission) => void;
  onUpdateDemande: (d: DemandeAide) => void;
}

const statutCommissionConfig: Record<string, { label: string; color: string }> = {
  planifiee: { label: "Planifiée", color: "bg-muted/60 text-muted-foreground border-0" },
  convoquee: { label: "Convoquée", color: "bg-accent/20 text-accent-foreground border-0" },
  tenue: { label: "Tenue", color: "bg-primary/10 text-primary border-0" },
  cloturee: { label: "Clôturée", color: "bg-success/10 text-success border-0" },
};

export default function FondsSociauxCommissions({ commissions, demandes, onUpdateCommission, onAddCommission, onUpdateDemande }: Props) {
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState<"ordinaire" | "extraordinaire">("ordinaire");

  const dossiersForCommission = (cId: string) => demandes.filter(d => d.commissionId === cId);

  const handleAddCommission = () => {
    const c: Commission = {
      id: `c${Date.now()}`, date: newDate, type: newType,
      membres: ["CE", "Gestionnaire", "AS", "CPE", "Infirmière"],
      statut: "planifiee", pvRedige: false, nbDossiers: 0, nbAccordes: 0, nbRefuses: 0, montantTotal: 0, observations: "",
    };
    onAddCommission(c);
    setOpenNew(false);
    setNewDate("");
  };

  const genererConvocation = (commission: Commission) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CONVOCATION — Commission Sociale", 20, 25);
    doc.setFontSize(10);
    doc.text(`Commission ${commission.type} du ${new Date(commission.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, 20, 35);
    doc.text("Membres convoqués :", 20, 50);
    commission.membres.forEach((m, i) => doc.text(`• ${m}`, 25, 58 + i * 6));

    const dossiers = dossiersForCommission(commission.id);
    if (dossiers.length > 0) {
      doc.text(`Ordre du jour : ${dossiers.length} dossier(s) à examiner`, 20, 58 + commission.membres.length * 6 + 10);
      autoTable(doc, {
        startY: 58 + commission.membres.length * 6 + 18,
        head: [["N°", "Élève", "Classe", "Type", "Nature", "Montant demandé"]],
        body: dossiers.map((d, i) => [
          String(i + 1), `${d.eleve.nom} ${d.eleve.prenom}`, d.eleve.classe,
          d.type, NATURES_AIDE[d.nature] || d.nature, `${d.montantDemande.toFixed(2)} €`,
        ]),
        styles: { fontSize: 8 },
      });
    }
    doc.save(`convocation_commission_${commission.date}.pdf`);
  };

  const genererPV = (commission: Commission) => {
    const doc = new jsPDF();
    const dossiers = dossiersForCommission(commission.id);

    doc.setFontSize(16);
    doc.text("PROCÈS-VERBAL — Commission Sociale", 20, 25);
    doc.setFontSize(10);
    doc.text(`Commission ${commission.type} du ${new Date(commission.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, 20, 35);
    doc.text(`Membres présents : ${commission.membres.join(", ")}`, 20, 45);
    doc.text(`Dossiers examinés : ${dossiers.length}`, 20, 55);

    autoTable(doc, {
      startY: 65,
      head: [["Élève", "Classe", "Type", "Nature", "Demandé", "Accordé", "Décision"]],
      body: dossiers.map(d => [
        `${d.eleve.nom} ${d.eleve.prenom}`, d.eleve.classe, d.type,
        NATURES_AIDE[d.nature] || d.nature,
        `${d.montantDemande.toFixed(2)} €`,
        d.montantAccorde > 0 ? `${d.montantAccorde.toFixed(2)} €` : "—",
        STATUT_CONFIG[d.statut]?.label || d.statut,
      ]),
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    const accordes = dossiers.filter(d => d.statut === "accorde" || d.statut === "verse");
    const totalAccorde = accordes.reduce((s, d) => s + d.montantAccorde, 0);

    doc.text(`Total accordé : ${totalAccorde.toFixed(2)} € pour ${accordes.length} dossier(s)`, 20, finalY + 10);
    if (commission.observations) {
      doc.text(`Observations : ${commission.observations}`, 20, finalY + 20);
    }

    doc.save(`pv_commission_${commission.date}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Commissions sociales ({commissions.length})</h3>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><Plus className="h-3.5 w-3.5 mr-1" /> Planifier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Planifier une commission</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Date</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
              <div><Label>Type</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaire">Ordinaire</SelectItem>
                    <SelectItem value="extraordinaire">Extraordinaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddCommission} className="w-full gradient-primary border-0">Planifier</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commissions.sort((a, b) => b.date.localeCompare(a.date)).map(c => {
          const dossiers = dossiersForCommission(c.id);
          const accordes = dossiers.filter(d => d.statut === "accorde" || d.statut === "verse");
          const refuses = dossiers.filter(d => d.statut === "refuse");
          const total = accordes.reduce((s, d) => s + d.montantAccorde, 0);

          return (
            <Card key={c.id} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setSelectedCommission(c)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${statutCommissionConfig[c.statut].color}`}>
                    {statutCommissionConfig[c.statut].label}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Users className="h-3 w-3" /> {c.membres.length} membres • {c.type}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{dossiers.length}</p>
                    <p className="text-[10px] text-muted-foreground">Dossiers</p>
                  </div>
                  <div className="bg-success/5 rounded-lg p-2">
                    <p className="text-lg font-bold text-success">{accordes.length}</p>
                    <p className="text-[10px] text-muted-foreground">Accordés</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{formatCurrency(total)}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                </div>

                {c.observations && <p className="text-xs text-muted-foreground mt-3 italic">"{c.observations}"</p>}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); genererConvocation(c); }}>
                    <FileText className="h-3 w-3 mr-1" /> Convocation
                  </Button>
                  {(c.statut === "tenue" || c.statut === "cloturee") && (
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); genererPV(c); }}>
                      <FileText className="h-3 w-3 mr-1" /> PV
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Détail commission sélectionnée */}
      {selectedCommission && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Dossiers — Commission du {new Date(selectedCommission.date).toLocaleDateString("fr-FR")}
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setSelectedCommission(null)} className="text-xs">Fermer</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Situation</TableHead>
                  <TableHead className="text-right">Demandé</TableHead>
                  <TableHead className="text-right">Accordé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossiersForCommission(selectedCommission.id).map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.eleve.nom} {d.eleve.prenom}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.eleve.classe}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{d.type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{NATURES_AIDE[d.nature] || d.nature}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={d.eleve.situationFamiliale}>{d.eleve.situationFamiliale}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(d.montantDemande)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{d.montantAccorde > 0 ? formatCurrency(d.montantAccorde) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[d.statut].color}`}>
                        {STATUT_CONFIG[d.statut].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(d.statut === "instruction" || d.statut === "commission") && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-success" onClick={() => onUpdateDemande({ ...d, statut: "accorde", montantAccorde: d.montantDemande })}>
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />Acc.
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive" onClick={() => onUpdateDemande({ ...d, statut: "refuse", montantAccorde: 0 })}>
                            <XCircle className="h-3 w-3 mr-0.5" />Ref.
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
