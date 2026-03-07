import { useState } from "react";
import { motion } from "framer-motion";
import { Bus, Plus, Users, Euro, CalendarDays, MapPin, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";

interface Voyage {
  id: string;
  destination: string;
  dateDepart: string;
  dateRetour: string;
  nbEleves: number;
  budgetTotal: number;
  participationFamilles: number;
  subventions: number;
  chargeEtablissement: number;
  statut: "planifie" | "valide" | "realise" | "annule";
}

const initialVoyages: Voyage[] = [
  {
    id: "1", destination: "Londres", dateDepart: "2024-03-15", dateRetour: "2024-03-20",
    nbEleves: 35, budgetTotal: 18500, participationFamilles: 10500, subventions: 5000,
    chargeEtablissement: 3000, statut: "realise",
  },
  {
    id: "2", destination: "Barcelone", dateDepart: "2024-05-10", dateRetour: "2024-05-14",
    nbEleves: 28, budgetTotal: 14200, participationFamilles: 8400, subventions: 3500,
    chargeEtablissement: 2300, statut: "valide",
  },
  {
    id: "3", destination: "Berlin", dateDepart: "2024-06-01", dateRetour: "2024-06-05",
    nbEleves: 30, budgetTotal: 16000, participationFamilles: 9000, subventions: 4000,
    chargeEtablissement: 3000, statut: "planifie",
  },
];

const statutConfig = {
  planifie: { label: "Planifié", class: "bg-info/10 text-info border-0" },
  valide: { label: "Validé", class: "bg-success/10 text-success border-0" },
  realise: { label: "Réalisé", class: "bg-muted text-muted-foreground border-0" },
  annule: { label: "Annulé", class: "bg-destructive/10 text-destructive border-0" },
};

const Voyages = () => {
  const [voyages, setVoyages] = useState<Voyage[]>(initialVoyages);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ destination: "", dateDepart: "", dateRetour: "", nbEleves: "", budgetTotal: "", participationFamilles: "", subventions: "" });

  const totaux = voyages.reduce(
    (acc, v) => ({
      budget: acc.budget + v.budgetTotal,
      familles: acc.familles + v.participationFamilles,
      subventions: acc.subventions + v.subventions,
      charge: acc.charge + v.chargeEtablissement,
      eleves: acc.eleves + v.nbEleves,
    }),
    { budget: 0, familles: 0, subventions: 0, charge: 0, eleves: 0 }
  );

  const handleAdd = () => {
    const budget = Number(form.budgetTotal);
    const familles = Number(form.participationFamilles);
    const subv = Number(form.subventions);
    const newVoyage: Voyage = {
      id: Date.now().toString(),
      destination: form.destination,
      dateDepart: form.dateDepart,
      dateRetour: form.dateRetour,
      nbEleves: Number(form.nbEleves),
      budgetTotal: budget,
      participationFamilles: familles,
      subventions: subv,
      chargeEtablissement: budget - familles - subv,
      statut: "planifie",
    };
    setVoyages([...voyages, newVoyage]);
    setOpen(false);
    setForm({ destination: "", dateDepart: "", dateRetour: "", nbEleves: "", budgetTotal: "", participationFamilles: "", subventions: "" });
  };

  const handleDelete = (id: string) => setVoyages(voyages.filter((v) => v.id !== id));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Voyages scolaires</h1>
            <p className="text-sm text-muted-foreground mt-1">Budget, participations et subventions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouveau voyage</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajouter un voyage</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Ex: Londres" /></div>
                  <div><Label>Nb élèves</Label><Input type="number" value={form.nbEleves} onChange={(e) => setForm({ ...form, nbEleves: e.target.value })} /></div>
                  <div><Label>Date départ</Label><Input type="date" value={form.dateDepart} onChange={(e) => setForm({ ...form, dateDepart: e.target.value })} /></div>
                  <div><Label>Date retour</Label><Input type="date" value={form.dateRetour} onChange={(e) => setForm({ ...form, dateRetour: e.target.value })} /></div>
                  <div><Label>Budget total (€)</Label><Input type="number" value={form.budgetTotal} onChange={(e) => setForm({ ...form, budgetTotal: e.target.value })} /></div>
                  <div><Label>Participation familles (€)</Label><Input type="number" value={form.participationFamilles} onChange={(e) => setForm({ ...form, participationFamilles: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Subventions (€)</Label><Input type="number" value={form.subventions} onChange={(e) => setForm({ ...form, subventions: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Ajouter</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Budget total" value={formatCurrency(totaux.budget)} icon={Euro} variant="primary" />
        <KpiCard title="Part familles" value={formatCurrency(totaux.familles)} subtitle={`${((totaux.familles / totaux.budget) * 100).toFixed(0)}% du budget`} icon={Users} variant="success" />
        <KpiCard title="Subventions" value={formatCurrency(totaux.subventions)} icon={CalendarDays} variant="default" />
        <KpiCard title="Charge établissement" value={formatCurrency(totaux.charge)} icon={Bus} variant="warning" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Liste des voyages ({voyages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destination</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Élèves</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Familles</TableHead>
                <TableHead className="text-right">Subventions</TableHead>
                <TableHead className="text-right">Charge étab.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voyages.map((v) => {
                const couverture = ((v.participationFamilles + v.subventions) / v.budgetTotal) * 100;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium"><MapPin className="h-3 w-3 inline mr-1 text-muted-foreground" />{v.destination}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.dateDepart} → {v.dateRetour}</TableCell>
                    <TableCell className="text-center">{v.nbEleves}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(v.budgetTotal)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(v.participationFamilles)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(v.subventions)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(v.chargeEtablissement)}</TableCell>
                    <TableCell><Badge variant="secondary" className={`text-[10px] ${statutConfig[v.statut].class}`}>{statutConfig[v.statut].label}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
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

      {voyages.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Couverture budgétaire par voyage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {voyages.map((v) => {
              const couverture = ((v.participationFamilles + v.subventions) / v.budgetTotal) * 100;
              return (
                <div key={v.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{v.destination}</span>
                    <span className="text-muted-foreground">{couverture.toFixed(0)}% couvert</span>
                  </div>
                  <Progress value={couverture} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Voyages;
