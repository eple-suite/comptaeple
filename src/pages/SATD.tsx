import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Gavel, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, Euro, Calendar, FileText, TrendingDown, Search, PauseCircle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface Prelevement {
  date: string;
  montant: number;
}

interface Satd {
  id: string;
  reference: string;
  debiteur: string;
  typeDebiteur: "agent" | "fournisseur" | "usager" | "autre";
  montantInitial: number;
  montantPreleve: number;
  prelevements: Prelevement[];
  dateReception: string;
  dateEcheance: string;
  statut: "en_cours" | "termine" | "suspendu" | "conteste";
  organisme: string;
  motif: string;
  compteBudgetaire: string;
  observations: string;
}

const initialSatd: Satd[] = [
  {
    id: "1", reference: "SATD-2024-001", debiteur: "Agent A", typeDebiteur: "agent",
    montantInitial: 2500, montantPreleve: 1500,
    prelevements: [{ date: "2024-02-15", montant: 500 }, { date: "2024-03-15", montant: 500 }, { date: "2024-04-15", montant: 500 }],
    dateReception: "2024-01-10", dateEcheance: "2024-06-30", statut: "en_cours",
    organisme: "DGFIP", motif: "Impôt sur le revenu — rôle 2023", compteBudgetaire: "421000",
    observations: "Prélèvement mensuel de 500€",
  },
  {
    id: "2", reference: "SATD-2024-002", debiteur: "Agent B", typeDebiteur: "agent",
    montantInitial: 800, montantPreleve: 800,
    prelevements: [{ date: "2024-01-15", montant: 400 }, { date: "2024-02-15", montant: 400 }],
    dateReception: "2023-11-15", dateEcheance: "2024-03-15", statut: "termine",
    organisme: "URSSAF", motif: "Cotisations sociales", compteBudgetaire: "421000",
    observations: "Soldé",
  },
  {
    id: "3", reference: "SATD-2024-003", debiteur: "Fournisseur C", typeDebiteur: "fournisseur",
    montantInitial: 3200, montantPreleve: 0,
    prelevements: [],
    dateReception: "2024-02-20", dateEcheance: "2024-08-20", statut: "suspendu",
    organisme: "Trésor Public", motif: "Taxe professionnelle", compteBudgetaire: "401000",
    observations: "Suspendu suite à contestation du débiteur",
  },
  {
    id: "4", reference: "SATD-2024-004", debiteur: "Agent D", typeDebiteur: "agent",
    montantInitial: 1200, montantPreleve: 300,
    prelevements: [{ date: "2024-03-15", montant: 300 }],
    dateReception: "2024-03-01", dateEcheance: "2024-09-30", statut: "conteste",
    organisme: "CAF", motif: "Trop-perçu allocation logement", compteBudgetaire: "421000",
    observations: "Contestation en cours auprès de la CAF — maintien du prélèvement",
  },
];

const statutConfig = {
  en_cours: { label: "En cours", class: "bg-warning/10 text-warning border-0", icon: Clock },
  termine: { label: "Soldé", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  suspendu: { label: "Suspendu", class: "bg-muted text-muted-foreground border-0", icon: PauseCircle },
  conteste: { label: "Contesté", class: "bg-destructive/10 text-destructive border-0", icon: AlertTriangle },
};

const SATD = () => {
  const [satds, setSatds] = useState<Satd[]>(initialSatd);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [selectedSatd, setSelectedSatd] = useState<Satd | null>(null);
  const [newPrelevement, setNewPrelevement] = useState({ date: "", montant: "" });
  const [form, setForm] = useState({
    reference: "", debiteur: "", typeDebiteur: "agent" as Satd["typeDebiteur"],
    montantInitial: "", dateReception: "", dateEcheance: "",
    organisme: "", motif: "", compteBudgetaire: "", observations: "",
  });

  const filtered = useMemo(() => {
    return satds.filter(s => {
      if (filterStatut !== "all" && s.statut !== filterStatut) return false;
      if (search && !s.debiteur.toLowerCase().includes(search.toLowerCase()) && !s.reference.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [satds, filterStatut, search]);

  const totalInitial = satds.reduce((s, a) => s + a.montantInitial, 0);
  const totalPreleve = satds.reduce((s, a) => s + a.montantPreleve, 0);
  const totalRestant = totalInitial - totalPreleve;
  const enCours = satds.filter(s => s.statut === "en_cours").length;
  const contestes = satds.filter(s => s.statut === "conteste").length;

  // Timeline des prélèvements pour le graphique
  const timelineData = useMemo(() => {
    const months: Record<string, number> = {};
    satds.forEach(s => {
      s.prelevements.forEach(p => {
        const month = p.date.substring(0, 7);
        months[month] = (months[month] || 0) + p.montant;
      });
    });
    return Object.entries(months).sort().map(([month, montant]) => ({
      mois: month,
      montant,
    }));
  }, [satds]);

  const handleAdd = () => {
    setSatds([...satds, {
      id: Date.now().toString(), ...form, montantInitial: Number(form.montantInitial),
      montantPreleve: 0, prelevements: [], statut: "en_cours",
    }]);
    setOpen(false);
    setForm({ reference: "", debiteur: "", typeDebiteur: "agent", montantInitial: "", dateReception: "", dateEcheance: "", organisme: "", motif: "", compteBudgetaire: "", observations: "" });
  };

  const handleAddPrelevement = () => {
    if (!selectedSatd || !newPrelevement.date || !newPrelevement.montant) return;
    const montant = Number(newPrelevement.montant);
    setSatds(satds.map(s => {
      if (s.id !== selectedSatd.id) return s;
      const updated = {
        ...s,
        prelevements: [...s.prelevements, { date: newPrelevement.date, montant }],
        montantPreleve: s.montantPreleve + montant,
      };
      if (updated.montantPreleve >= updated.montantInitial) updated.statut = "termine";
      return updated;
    }));
    setNewPrelevement({ date: "", montant: "" });
    const updatedSatd = satds.find(s => s.id === selectedSatd.id);
    if (updatedSatd) {
      setSelectedSatd({
        ...updatedSatd,
        prelevements: [...updatedSatd.prelevements, { date: newPrelevement.date, montant }],
        montantPreleve: updatedSatd.montantPreleve + montant,
      });
    }
  };

  const handleChangeStatut = (id: string, statut: Satd["statut"]) => {
    setSatds(satds.map(s => s.id === id ? { ...s, statut } : s));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">SATD</h1>
            <p className="text-sm text-muted-foreground mt-1">Saisies Administratives à Tiers Détenteur — Suivi des prélèvements</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle SATD</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Enregistrer une SATD</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Référence</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="SATD-2024-XXX" /></div>
                  <div><Label>Débiteur</Label><Input value={form.debiteur} onChange={(e) => setForm({ ...form, debiteur: e.target.value })} /></div>
                  <div><Label>Type de débiteur</Label>
                    <Select value={form.typeDebiteur} onValueChange={(v) => setForm({ ...form, typeDebiteur: v as Satd["typeDebiteur"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="fournisseur">Fournisseur</SelectItem>
                        <SelectItem value="usager">Usager</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Montant initial (€)</Label><Input type="number" value={form.montantInitial} onChange={(e) => setForm({ ...form, montantInitial: e.target.value })} /></div>
                  <div><Label>Organisme créancier</Label><Input value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} /></div>
                  <div><Label>Compte budgétaire</Label><Input value={form.compteBudgetaire} onChange={(e) => setForm({ ...form, compteBudgetaire: e.target.value })} placeholder="Ex: 421000" /></div>
                  <div><Label>Date réception</Label><Input type="date" value={form.dateReception} onChange={(e) => setForm({ ...form, dateReception: e.target.value })} /></div>
                  <div><Label>Date échéance</Label><Input type="date" value={form.dateEcheance} onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} /></div>
                  <div />
                  <div className="col-span-3"><Label>Motif</Label><Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Ex: Impôt sur le revenu — rôle 2023" /></div>
                  <div className="col-span-3"><Label>Observations</Label><Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={2} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Montant total" value={formatCurrency(totalInitial)} icon={Gavel} variant="primary" />
        <KpiCard title="Déjà prélevé" value={formatCurrency(totalPreleve)} subtitle={totalInitial > 0 ? `${((totalPreleve / totalInitial) * 100).toFixed(0)}%` : "—"} icon={CheckCircle2} variant="success" />
        <KpiCard title="Reste à prélever" value={formatCurrency(totalRestant)} icon={TrendingDown} variant="warning" />
        <KpiCard title="SATD en cours" value={`${enCours}`} icon={Clock} variant="warning" />
        <KpiCard title="Contestées" value={`${contestes}`} icon={AlertTriangle} variant="default" />
      </div>

      <Tabs defaultValue="registre">
        <TabsList>
          <TabsTrigger value="registre">Registre</TabsTrigger>
          <TabsTrigger value="suivi">Suivi des prélèvements</TabsTrigger>
        </TabsList>

        <TabsContent value="registre" className="space-y-4 mt-4">
          {/* Filtres */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par référence ou débiteur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Soldé</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="conteste">Contesté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Débiteur</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Réception</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Prélevé</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const StatusIcon = statutConfig[s.statut].icon;
                    const pct = s.montantInitial > 0 ? (s.montantPreleve / s.montantInitial) * 100 : 0;
                    return (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedSatd(s)}>
                        <TableCell className="font-mono text-sm font-semibold text-primary">{s.reference}</TableCell>
                        <TableCell className="font-medium">{s.debiteur} <span className="text-xs text-muted-foreground">({s.typeDebiteur})</span></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.organisme}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={s.motif}>{s.motif}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.dateReception}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.dateEcheance}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantInitial)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantPreleve)}</TableCell>
                        <TableCell className="min-w-[80px]">
                          <Progress value={pct} className="h-2" />
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${statutConfig[s.statut].class}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />{statutConfig[s.statut].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {s.statut === "en_cours" && (
                              <Button size="sm" variant="ghost" onClick={() => handleChangeStatut(s.id, "suspendu")} className="h-7 px-2 text-xs" title="Suspendre">
                                <PauseCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {s.statut === "suspendu" && (
                              <Button size="sm" variant="ghost" onClick={() => handleChangeStatut(s.id, "en_cours")} className="h-7 px-2 text-xs" title="Reprendre">
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setSatds(satds.filter(x => x.id !== s.id))} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suivi" className="space-y-4 mt-4">
          {/* Graphique timeline */}
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Prélèvements mensuels (toutes SATD)</CardTitle></CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="montant" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} name="Montant prélevé" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun prélèvement enregistré</p>
              )}
            </CardContent>
          </Card>

          {/* Détail SATD sélectionnée */}
          {selectedSatd ? (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Détail — {selectedSatd.reference}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSatd(null)} className="text-xs">Fermer</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Débiteur</span><p className="font-medium">{selectedSatd.debiteur}</p></div>
                  <div><span className="text-muted-foreground">Organisme</span><p className="font-medium">{selectedSatd.organisme}</p></div>
                  <div><span className="text-muted-foreground">Montant initial</span><p className="font-mono font-semibold">{formatCurrency(selectedSatd.montantInitial)}</p></div>
                  <div><span className="text-muted-foreground">Reste à prélever</span><p className="font-mono font-semibold text-warning">{formatCurrency(selectedSatd.montantInitial - selectedSatd.montantPreleve)}</p></div>
                </div>
                <Separator />
                <p className="text-xs font-semibold">Historique des prélèvements</p>
                {selectedSatd.prelevements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSatd.prelevements.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{p.date}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(p.montant)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun prélèvement enregistré.</p>
                )}
                {selectedSatd.statut !== "termine" && (
                  <div className="flex gap-3 items-end">
                    <div><Label>Date</Label><Input type="date" value={newPrelevement.date} onChange={(e) => setNewPrelevement({ ...newPrelevement, date: e.target.value })} /></div>
                    <div><Label>Montant (€)</Label><Input type="number" value={newPrelevement.montant} onChange={(e) => setNewPrelevement({ ...newPrelevement, montant: e.target.value })} /></div>
                    <Button onClick={handleAddPrelevement} className="gradient-primary border-0">Ajouter</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Cliquez sur une SATD dans l'onglet Registre pour voir le détail et ajouter des prélèvements.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SATD;
