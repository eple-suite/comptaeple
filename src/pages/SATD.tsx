import { useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Plus, Trash2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";

interface Satd {
  id: string;
  reference: string;
  debiteur: string;
  montantInitial: number;
  montantPreleve: number;
  dateReception: string;
  dateEcheance: string;
  statut: "en_cours" | "termine" | "suspendu";
  organisme: string;
}

const initialSatd: Satd[] = [
  { id: "1", reference: "SATD-2024-001", debiteur: "Agent A", montantInitial: 2500, montantPreleve: 1500, dateReception: "2024-01-10", dateEcheance: "2024-06-30", statut: "en_cours", organisme: "DGFIP" },
  { id: "2", reference: "SATD-2024-002", debiteur: "Agent B", montantInitial: 800, montantPreleve: 800, dateReception: "2023-11-15", dateEcheance: "2024-03-15", statut: "termine", organisme: "URSSAF" },
  { id: "3", reference: "SATD-2024-003", debiteur: "Fournisseur C", montantInitial: 3200, montantPreleve: 0, dateReception: "2024-02-20", dateEcheance: "2024-08-20", statut: "suspendu", organisme: "Trésor Public" },
];

const statutConfig = {
  en_cours: { label: "En cours", class: "bg-warning/10 text-warning border-0", icon: Clock },
  termine: { label: "Terminé", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  suspendu: { label: "Suspendu", class: "bg-destructive/10 text-destructive border-0", icon: AlertTriangle },
};

const SATD = () => {
  const [satds, setSatds] = useState<Satd[]>(initialSatd);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reference: "", debiteur: "", montantInitial: "", dateReception: "", dateEcheance: "", organisme: "" });

  const totalInitial = satds.reduce((s, a) => s + a.montantInitial, 0);
  const totalPreleve = satds.reduce((s, a) => s + a.montantPreleve, 0);
  const enCours = satds.filter((s) => s.statut === "en_cours").length;

  const handleAdd = () => {
    setSatds([...satds, {
      id: Date.now().toString(), ...form, montantInitial: Number(form.montantInitial),
      montantPreleve: 0, statut: "en_cours",
    }]);
    setOpen(false);
    setForm({ reference: "", debiteur: "", montantInitial: "", dateReception: "", dateEcheance: "", organisme: "" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">SATD</h1>
            <p className="text-sm text-muted-foreground mt-1">Saisies Administratives à Tiers Détenteur</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle SATD</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enregistrer une SATD</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Référence</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="SATD-2024-XXX" /></div>
                  <div><Label>Débiteur</Label><Input value={form.debiteur} onChange={(e) => setForm({ ...form, debiteur: e.target.value })} /></div>
                  <div><Label>Montant initial (€)</Label><Input type="number" value={form.montantInitial} onChange={(e) => setForm({ ...form, montantInitial: e.target.value })} /></div>
                  <div><Label>Organisme</Label><Input value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} /></div>
                  <div><Label>Date réception</Label><Input type="date" value={form.dateReception} onChange={(e) => setForm({ ...form, dateReception: e.target.value })} /></div>
                  <div><Label>Date échéance</Label><Input type="date" value={form.dateEcheance} onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Montant total" value={formatCurrency(totalInitial)} icon={Gavel} variant="primary" />
        <KpiCard title="Déjà prélevé" value={formatCurrency(totalPreleve)} subtitle={`${((totalPreleve / totalInitial) * 100).toFixed(0)}%`} icon={CheckCircle2} variant="success" />
        <KpiCard title="SATD en cours" value={`${enCours}`} icon={AlertTriangle} variant="warning" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Registre des SATD</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Débiteur</TableHead>
                <TableHead>Organisme</TableHead>
                <TableHead>Réception</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Prélevé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {satds.map((s) => {
                const StatusIcon = statutConfig[s.statut].icon;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{s.reference}</TableCell>
                    <TableCell className="font-medium">{s.debiteur}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.organisme}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.dateReception}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.dateEcheance}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantInitial)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantPreleve)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${statutConfig[s.statut].class}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />{statutConfig[s.statut].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSatds(satds.filter((x) => x.id !== s.id))} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SATD;
