import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, Users, Euro, FileText, TrendingUp, Calendar, Search, Filter, CheckCircle2, Clock, XCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

interface Aide {
  id: string;
  beneficiaire: string;
  type: "FSL" | "FSC" | "FSE" | "autre";
  montant: number;
  date: string;
  motif: string;
  statut: "verse" | "en_attente" | "refuse";
  dateCommission: string;
  commentaire: string;
  classe: string;
  regime: "interne" | "dp" | "externe";
  criteresSociaux: string;
  numeroDecision: string;
}

const initialAides: Aide[] = [
  { id: "1", beneficiaire: "Élève A", type: "FSL", montant: 350, date: "2024-01-15", motif: "Restauration — créances impayées", statut: "verse", dateCommission: "2024-01-10", commentaire: "Situation familiale difficile, revenus < seuil", classe: "2nde B", regime: "dp", criteresSociaux: "RSA", numeroDecision: "FSL-2024-001" },
  { id: "2", beneficiaire: "Élève B", type: "FSC", montant: 200, date: "2024-01-20", motif: "Fournitures scolaires", statut: "verse", dateCommission: "2024-01-10", commentaire: "Famille monoparentale", classe: "5ème A", regime: "externe", criteresSociaux: "Famille monoparentale", numeroDecision: "FSC-2024-001" },
  { id: "3", beneficiaire: "Élève C", type: "FSL", montant: 180, date: "2024-02-05", motif: "Transport scolaire", statut: "en_attente", dateCommission: "2024-02-15", commentaire: "Dossier en cours d'instruction", classe: "1ère S", regime: "dp", criteresSociaux: "AAH", numeroDecision: "" },
  { id: "4", beneficiaire: "Élève D", type: "FSE", montant: 450, date: "2024-02-10", motif: "Équipement professionnel (bac pro)", statut: "verse", dateCommission: "2024-02-01", commentaire: "Besoin d'équipement pour stage", classe: "Terminale Pro", regime: "interne", criteresSociaux: "Boursier échelon 5", numeroDecision: "FSE-2024-001" },
  { id: "5", beneficiaire: "Élève E", type: "FSC", montant: 120, date: "2024-03-01", motif: "Sortie pédagogique", statut: "refuse", dateCommission: "2024-02-25", commentaire: "Revenus au-dessus du seuil", classe: "4ème C", regime: "dp", criteresSociaux: "—", numeroDecision: "" },
  { id: "6", beneficiaire: "Élève F", type: "FSL", montant: 280, date: "2024-03-10", motif: "Restauration — trimestre 2", statut: "verse", dateCommission: "2024-03-05", commentaire: "Renouvellement aide T1", classe: "Terminale L", regime: "interne", criteresSociaux: "RSA", numeroDecision: "FSL-2024-002" },
  { id: "7", beneficiaire: "Élève G", type: "autre", montant: 150, date: "2024-03-15", motif: "Aide exceptionnelle — incendie domicile", statut: "verse", dateCommission: "2024-03-12", commentaire: "Aide d'urgence chef d'établissement", classe: "3ème B", regime: "dp", criteresSociaux: "Urgence sociale", numeroDecision: "AEX-2024-001" },
];

const typeLabels: Record<string, string> = {
  FSL: "Fonds Social Lycéen",
  FSC: "Fonds Social Collégien",
  FSE: "Fonds Social pour les Cantines (état)",
  autre: "Aide exceptionnelle",
};

const statutConfig = {
  verse: { label: "Versé", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  en_attente: { label: "En attente", class: "bg-warning/10 text-warning border-0", icon: Clock },
  refuse: { label: "Refusé", class: "bg-destructive/10 text-destructive border-0", icon: XCircle },
};

const FondsSociaux = () => {
  const [aides, setAides] = useState<Aide[]>(initialAides);
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    beneficiaire: "", type: "FSL" as Aide["type"], montant: "", motif: "", date: "",
    dateCommission: "", commentaire: "", classe: "", regime: "dp" as Aide["regime"],
    criteresSociaux: "",
  });

  const filtered = useMemo(() => {
    return aides.filter(a => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterStatut !== "all" && a.statut !== filterStatut) return false;
      if (search && !a.beneficiaire.toLowerCase().includes(search.toLowerCase()) && !a.motif.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [aides, filterType, filterStatut, search]);

  const totalVerse = aides.filter(a => a.statut === "verse").reduce((s, a) => s + a.montant, 0);
  const totalEnAttente = aides.filter(a => a.statut === "en_attente").reduce((s, a) => s + a.montant, 0);
  const totalRefuse = aides.filter(a => a.statut === "refuse").reduce((s, a) => s + a.montant, 0);
  const nbBeneficiaires = new Set(aides.filter(a => a.statut === "verse").map(a => a.beneficiaire)).size;
  const nbDossiers = aides.length;
  const tauxAcceptation = nbDossiers > 0 ? ((aides.filter(a => a.statut === "verse").length / nbDossiers) * 100) : 0;
  const montantMoyen = nbBeneficiaires > 0 ? totalVerse / nbBeneficiaires : 0;

  const repartitionType = [
    { name: "FSL", value: aides.filter(a => a.type === "FSL" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(215, 70%, 45%)" },
    { name: "FSC", value: aides.filter(a => a.type === "FSC" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(160, 45%, 45%)" },
    { name: "FSE", value: aides.filter(a => a.type === "FSE" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(280, 60%, 55%)" },
    { name: "Autre", value: aides.filter(a => a.type === "autre" && a.statut === "verse").reduce((s, a) => s + a.montant, 0), fill: "hsl(38, 92%, 50%)" },
  ].filter(r => r.value > 0);

  const repartitionMotif = useMemo(() => {
    const motifs: Record<string, number> = {};
    aides.filter(a => a.statut === "verse").forEach(a => {
      const cat = a.motif.split("—")[0].trim();
      motifs[cat] = (motifs[cat] || 0) + a.montant;
    });
    return Object.entries(motifs).map(([name, value]) => ({ name, value }));
  }, [aides]);

  const repartitionRegime = useMemo(() => {
    const labels: Record<string, string> = { interne: "Internes", dp: "Demi-pensionnaires", externe: "Externes" };
    const regimes: Record<string, number> = {};
    aides.filter(a => a.statut === "verse").forEach(a => {
      const k = labels[a.regime] || a.regime;
      regimes[k] = (regimes[k] || 0) + 1;
    });
    return Object.entries(regimes).map(([name, value]) => ({ name, value }));
  }, [aides]);

  const handleAdd = () => {
    const count = aides.filter(a => a.type === form.type).length + 1;
    const prefix = form.type === "autre" ? "AEX" : form.type;
    setAides([...aides, {
      id: Date.now().toString(), ...form, montant: Number(form.montant), statut: "en_attente",
      numeroDecision: "",
    }]);
    setOpen(false);
    setForm({ beneficiaire: "", type: "FSL", montant: "", motif: "", date: "", dateCommission: "", commentaire: "", classe: "", regime: "dp", criteresSociaux: "" });
  };

  const handleChangeStatut = (id: string, newStatut: Aide["statut"]) => {
    setAides(aides.map(a => a.id === id ? { ...a, statut: newStatut, numeroDecision: newStatut === "verse" ? `${a.type}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}` : a.numeroDecision } : a));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Fonds sociaux</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestion des aides — FSL, FSC, FSE et aides exceptionnelles</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle demande</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Enregistrer une demande d'aide sociale</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Bénéficiaire</Label><Input value={form.beneficiaire} onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })} /></div>
                  <div><Label>Classe</Label><Input value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} placeholder="Ex: 2nde A" /></div>
                  <div><Label>Régime</Label>
                    <Select value={form.regime} onValueChange={(v) => setForm({ ...form, regime: v as Aide["regime"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interne">Interne</SelectItem>
                        <SelectItem value="dp">Demi-pensionnaire</SelectItem>
                        <SelectItem value="externe">Externe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Type de fonds</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Aide["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FSL">FSL — Fonds Social Lycéen</SelectItem>
                        <SelectItem value="FSC">FSC — Fonds Social Collégien</SelectItem>
                        <SelectItem value="FSE">FSE — Fonds Social pour les Cantines</SelectItem>
                        <SelectItem value="autre">Aide exceptionnelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Montant demandé (€)</Label><Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
                  <div><Label>Critères sociaux</Label><Input value={form.criteresSociaux} onChange={(e) => setForm({ ...form, criteresSociaux: e.target.value })} placeholder="Ex: RSA, boursier..." /></div>
                  <div><Label>Date demande</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div><Label>Date commission</Label><Input type="date" value={form.dateCommission} onChange={(e) => setForm({ ...form, dateCommission: e.target.value })} /></div>
                  <div />
                  <div className="col-span-3"><Label>Motif détaillé</Label><Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Ex: Restauration — créances impayées T2" /></div>
                  <div className="col-span-3"><Label>Commentaire / observations</Label><Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} rows={2} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Enregistrer la demande</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total versé" value={formatCurrency(totalVerse)} icon={Euro} variant="success" />
        <KpiCard title="En attente" value={formatCurrency(totalEnAttente)} icon={Clock} variant="warning" />
        <KpiCard title="Refusé" value={formatCurrency(totalRefuse)} icon={XCircle} variant="default" />
        <KpiCard title="Bénéficiaires" value={`${nbBeneficiaires}`} icon={Users} variant="primary" />
        <KpiCard title="Taux d'acceptation" value={`${tauxAcceptation.toFixed(0)}%`} icon={CheckCircle2} variant="success" />
        <KpiCard title="Aide moyenne" value={formatCurrency(montantMoyen)} icon={Heart} variant="primary" />
      </div>

      <Tabs defaultValue="dossiers">
        <TabsList>
          <TabsTrigger value="dossiers">Dossiers ({filtered.length})</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="dossiers" className="space-y-4 mt-4">
          {/* Filtres */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un bénéficiaire ou motif..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="FSL">FSL</SelectItem>
                <SelectItem value="FSC">FSC</SelectItem>
                <SelectItem value="FSE">FSE</SelectItem>
                <SelectItem value="autre">Aide except.</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="verse">Versé</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° décision</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const StatIcon = statutConfig[a.statut].icon;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs text-primary font-semibold">{a.numeroDecision || "—"}</TableCell>
                        <TableCell className="font-medium">{a.beneficiaire}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.classe}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{a.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={a.motif}>{a.motif}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.dateCommission || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(a.montant)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${statutConfig[a.statut].class}`}>
                            <StatIcon className="h-3 w-3 mr-1" />{statutConfig[a.statut].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {a.statut === "en_attente" && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleChangeStatut(a.id, "verse")} className="h-7 px-2 text-xs text-success hover:text-success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Accepter
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleChangeStatut(a.id, "refuse")} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                                  <XCircle className="h-3 w-3 mr-1" />Refuser
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setAides(aides.filter(x => x.id !== a.id))} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
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

        <TabsContent value="statistiques" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition par type de fonds</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={repartitionType} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                      {repartitionType.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition par motif</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={repartitionMotif} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="hsl(215, 70%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Bénéficiaires par régime</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={repartitionRegime} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {repartitionRegime.map((_, i) => (
                        <Cell key={i} fill={["hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(38, 92%, 50%)"][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Synthèse textuelle pour le CA */}
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Synthèse pour le Conseil d'Administration</CardTitle></CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>Au cours de l'exercice, <strong className="text-foreground">{nbDossiers} demandes</strong> d'aides sociales ont été instruites pour un montant total de <strong className="text-foreground">{formatCurrency(totalVerse + totalEnAttente + totalRefuse)}</strong>.</p>
              <p><strong className="text-foreground">{aides.filter(a => a.statut === "verse").length} demandes ont été acceptées</strong> pour un total de <strong className="text-success">{formatCurrency(totalVerse)}</strong>, soit un taux d'acceptation de <strong className="text-foreground">{tauxAcceptation.toFixed(0)}%</strong>. Le montant moyen par bénéficiaire s'élève à <strong className="text-foreground">{formatCurrency(montantMoyen)}</strong>.</p>
              {totalEnAttente > 0 && <p><strong className="text-warning">{aides.filter(a => a.statut === "en_attente").length} dossier(s)</strong> sont en attente de passage en commission pour un montant de <strong className="text-warning">{formatCurrency(totalEnAttente)}</strong>.</p>}
              {totalRefuse > 0 && <p><strong>{aides.filter(a => a.statut === "refuse").length} demande(s)</strong> ont été refusées ({formatCurrency(totalRefuse)}).</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FondsSociaux;
