import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, TrendingUp, Users, Euro } from "lucide-react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Aide {
  id: string;
  beneficiaire: string;
  type: "FSL" | "FSC" | "autre";
  montant: number;
  date: string;
  motif: string;
  statut: "verse" | "en_attente" | "refuse";
}

const initialAides: Aide[] = [
  { id: "1", beneficiaire: "Élève A", type: "FSL", montant: 350, date: "2024-01-15", motif: "Restauration", statut: "verse" },
  { id: "2", beneficiaire: "Élève B", type: "FSC", montant: 200, date: "2024-01-20", motif: "Fournitures", statut: "verse" },
  { id: "3", beneficiaire: "Élève C", type: "FSL", montant: 180, date: "2024-02-05", motif: "Transport", statut: "en_attente" },
  { id: "4", beneficiaire: "Élève D", type: "autre", montant: 150, date: "2024-02-10", motif: "Équipement sportif", statut: "verse" },
  { id: "5", beneficiaire: "Élève E", type: "FSC", montant: 120, date: "2024-03-01", motif: "Sortie pédagogique", statut: "refuse" },
];

const typeLabels = { FSL: "Fonds Social Lycéen", FSC: "Fonds Social Collégien", autre: "Autre aide" };
const statutConfig = {
  verse: { label: "Versé", class: "bg-success/10 text-success border-0" },
  en_attente: { label: "En attente", class: "bg-warning/10 text-warning border-0" },
  refuse: { label: "Refusé", class: "bg-destructive/10 text-destructive border-0" },
};

const FondsSociaux = () => {
  const [aides, setAides] = useState<Aide[]>(initialAides);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ beneficiaire: "", type: "FSL" as Aide["type"], montant: "", motif: "", date: "" });

  const totalVerse = aides.filter((a) => a.statut === "verse").reduce((s, a) => s + a.montant, 0);
  const totalEnAttente = aides.filter((a) => a.statut === "en_attente").reduce((s, a) => s + a.montant, 0);
  const nbBeneficiaires = new Set(aides.filter((a) => a.statut === "verse").map((a) => a.beneficiaire)).size;

  const repartition = [
    { name: "FSL", value: aides.filter((a) => a.type === "FSL" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(215, 70%, 45%)" },
    { name: "FSC", value: aides.filter((a) => a.type === "FSC" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(160, 45%, 45%)" },
    { name: "Autre", value: aides.filter((a) => a.type === "autre" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(38, 92%, 50%)" },
  ].filter((r) => r.value > 0);

  const handleAdd = () => {
    setAides([...aides, { id: Date.now().toString(), ...form, montant: Number(form.montant), statut: "en_attente" }]);
    setOpen(false);
    setForm({ beneficiaire: "", type: "FSL", montant: "", motif: "", date: "" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Fonds sociaux</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi des aides sociales — FSL, FSC et autres</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle aide</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enregistrer une aide</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bénéficiaire</Label><Input value={form.beneficiaire} onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })} /></div>
                  <div><Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Aide["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FSL">FSL</SelectItem>
                        <SelectItem value="FSC">FSC</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Montant (€)</Label><Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
                  <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Motif</Label><Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total versé" value={formatCurrency(totalVerse)} icon={Euro} variant="success" />
        <KpiCard title="En attente" value={formatCurrency(totalEnAttente)} icon={Heart} variant="warning" />
        <KpiCard title="Bénéficiaires" value={`${nbBeneficiaires}`} icon={Users} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Détail des aides ({aides.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aides.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.beneficiaire}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{a.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.motif}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.date}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(a.montant)}</TableCell>
                    <TableCell><Badge variant="secondary" className={`text-[10px] ${statutConfig[a.statut].class}`}>{statutConfig[a.statut].label}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setAides(aides.filter((x) => x.id !== a.id))} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={repartition} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {repartition.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FondsSociaux;
