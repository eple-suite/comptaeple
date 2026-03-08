import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bus, Plus, Users, Euro, CalendarDays, MapPin, Trash2, AlertTriangle, CheckCircle2, ShieldAlert, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface Voyage {
  id: string;
  destination: string;
  dateDepart: string;
  dateRetour: string;
  nbEleves: number;
  nbAccompagnateurs: number;
  budgetTotal: number;
  participationFamilles: number;
  subventions: number;
  chargeEtablissement: number;
  statut: "planifie" | "valide" | "realise" | "annule";
  // Ventilation par nature de prestation (marchés publics)
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  professeur: string;
  classe: string;
}

const initialVoyages: Voyage[] = [
  {
    id: "1", destination: "Londres", dateDepart: "2024-03-15", dateRetour: "2024-03-20",
    nbEleves: 35, nbAccompagnateurs: 4, budgetTotal: 18500, participationFamilles: 10500, subventions: 5000,
    chargeEtablissement: 3000, statut: "realise",
    transport: 8200, hebergement: 5500, restauration: 2800, activites: 1500, assurance: 500,
    professeur: "M. Dupont", classe: "2nde A",
  },
  {
    id: "2", destination: "Barcelone", dateDepart: "2024-05-10", dateRetour: "2024-05-14",
    nbEleves: 28, nbAccompagnateurs: 3, budgetTotal: 14200, participationFamilles: 8400, subventions: 3500,
    chargeEtablissement: 2300, statut: "valide",
    transport: 6500, hebergement: 4200, restauration: 1800, activites: 1200, assurance: 500,
    professeur: "Mme Martin", classe: "1ère S",
  },
  {
    id: "3", destination: "Berlin", dateDepart: "2024-06-01", dateRetour: "2024-06-05",
    nbEleves: 30, nbAccompagnateurs: 3, budgetTotal: 16000, participationFamilles: 9000, subventions: 4000,
    chargeEtablissement: 3000, statut: "planifie",
    transport: 7000, hebergement: 4800, restauration: 2200, activites: 1500, assurance: 500,
    professeur: "M. Lefèvre", classe: "Terminale L",
  },
  {
    id: "4", destination: "Rome", dateDepart: "2024-04-20", dateRetour: "2024-04-25",
    nbEleves: 32, nbAccompagnateurs: 4, budgetTotal: 17800, participationFamilles: 10200, subventions: 4800,
    chargeEtablissement: 2800, statut: "valide",
    transport: 7800, hebergement: 5200, restauration: 2600, activites: 1700, assurance: 500,
    professeur: "Mme Rossi", classe: "2nde C",
  },
];

const statutConfig = {
  planifie: { label: "Planifié", class: "bg-info/10 text-info border-0" },
  valide: { label: "Validé", class: "bg-success/10 text-success border-0" },
  realise: { label: "Réalisé", class: "bg-muted text-muted-foreground border-0" },
  annule: { label: "Annulé", class: "bg-destructive/10 text-destructive border-0" },
};

// Seuils marchés publics (HT) — code de la commande publique
const SEUILS = {
  SEUIL_GREAEGRE: 40000,    // Mise en concurrence obligatoire
  SEUIL_FORMALISE: 90000,   // Procédure formalisée (appel d'offres)
  SEUIL_EUROPEEN: 215000,   // Seuil européen services
};

const CATEGORIES_PRESTATIONS = [
  { key: "transport", label: "Transport", icon: "🚌" },
  { key: "hebergement", label: "Hébergement", icon: "🏨" },
  { key: "restauration", label: "Restauration", icon: "🍽️" },
  { key: "activites", label: "Activités / Visites", icon: "🎭" },
  { key: "assurance", label: "Assurance", icon: "🛡️" },
] as const;

type CatKey = typeof CATEGORIES_PRESTATIONS[number]["key"];

function getRecommandation(total: number, categorie: string): { niveau: "ok" | "warning" | "danger" | "critical"; texte: string; couleur: string } {
  if (total >= SEUILS.SEUIL_EUROPEEN) {
    return {
      niveau: "critical",
      texte: `⚠️ SEUIL EUROPÉEN DÉPASSÉ — Le cumul ${categorie} (${formatCurrency(total)}) dépasse ${formatCurrency(SEUILS.SEUIL_EUROPEEN)} HT. Ce marché doit faire l'objet d'une procédure formalisée avec publication au JOUE (Journal Officiel de l'Union Européenne). Contactez le service juridique de la collectivité.`,
      couleur: "destructive",
    };
  }
  if (total >= SEUILS.SEUIL_FORMALISE) {
    return {
      niveau: "danger",
      texte: `🔴 PROCÉDURE FORMALISÉE REQUISE — Le cumul ${categorie} (${formatCurrency(total)}) dépasse ${formatCurrency(SEUILS.SEUIL_FORMALISE)} HT. Ce marché doit faire l'objet d'un appel d'offres ou d'une procédure adaptée avec publicité. Préparez un cahier des charges (CCTP) et publiez sur la plateforme de dématérialisation de votre collectivité.`,
      couleur: "destructive",
    };
  }
  if (total >= SEUILS.SEUIL_GREAEGRE) {
    return {
      niveau: "warning",
      texte: `🟠 MISE EN CONCURRENCE OBLIGATOIRE — Le cumul ${categorie} (${formatCurrency(total)}) dépasse ${formatCurrency(SEUILS.SEUIL_GREAEGRE)} HT. Vous devez solliciter au minimum 3 devis et formaliser la consultation. Conservez les pièces justificatives (devis comparatifs, grille d'analyse).`,
      couleur: "warning",
    };
  }
  return {
    niveau: "ok",
    texte: `✅ Sous les seuils — Le cumul ${categorie} (${formatCurrency(total)}) reste inférieur à ${formatCurrency(SEUILS.SEUIL_GREAEGRE)} HT. Achat simple sans formalité particulière, mais la bonne gestion recommande de conserver les justificatifs.`,
    couleur: "success",
  };
}

const Voyages = () => {
  const [voyages, setVoyages] = useState<Voyage[]>(initialVoyages);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    destination: "", dateDepart: "", dateRetour: "", nbEleves: "", nbAccompagnateurs: "",
    budgetTotal: "", participationFamilles: "", subventions: "",
    transport: "", hebergement: "", restauration: "", activites: "", assurance: "",
    professeur: "", classe: "",
  });

  const voyagesActifs = voyages.filter(v => v.statut !== "annule");

  const totaux = voyagesActifs.reduce(
    (acc, v) => ({
      budget: acc.budget + v.budgetTotal,
      familles: acc.familles + v.participationFamilles,
      subventions: acc.subventions + v.subventions,
      charge: acc.charge + v.chargeEtablissement,
      eleves: acc.eleves + v.nbEleves,
    }),
    { budget: 0, familles: 0, subventions: 0, charge: 0, eleves: 0 }
  );

  // Agrégation par nature de prestation pour analyse marchés publics
  const cumulParCategorie = useMemo(() => {
    return CATEGORIES_PRESTATIONS.map(cat => {
      const total = voyagesActifs.reduce((s, v) => s + (v[cat.key] || 0), 0);
      const reco = getRecommandation(total, cat.label);
      return { ...cat, total, ...reco };
    });
  }, [voyagesActifs]);

  const alertesMarches = cumulParCategorie.filter(c => c.niveau !== "ok");

  // Data pour le graphique de ventilation
  const chartData = voyagesActifs.map(v => ({
    name: v.destination,
    Transport: v.transport,
    Hébergement: v.hebergement,
    Restauration: v.restauration,
    Activités: v.activites,
    Assurance: v.assurance,
  }));

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
      nbAccompagnateurs: Number(form.nbAccompagnateurs) || 0,
      budgetTotal: budget,
      participationFamilles: familles,
      subventions: subv,
      chargeEtablissement: budget - familles - subv,
      statut: "planifie",
      transport: Number(form.transport) || 0,
      hebergement: Number(form.hebergement) || 0,
      restauration: Number(form.restauration) || 0,
      activites: Number(form.activites) || 0,
      assurance: Number(form.assurance) || 0,
      professeur: form.professeur,
      classe: form.classe,
    };
    setVoyages([...voyages, newVoyage]);
    setOpen(false);
    setForm({ destination: "", dateDepart: "", dateRetour: "", nbEleves: "", nbAccompagnateurs: "", budgetTotal: "", participationFamilles: "", subventions: "", transport: "", hebergement: "", restauration: "", activites: "", assurance: "", professeur: "", classe: "" });
  };

  const handleDelete = (id: string) => setVoyages(voyages.filter((v) => v.id !== id));

  const coutMoyenEleve = totaux.eleves > 0 ? totaux.budget / totaux.eleves : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Voyages scolaires</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi budgétaire, ventilation par prestation et conformité marchés publics</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouveau voyage</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Ajouter un voyage scolaire</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">Renseignez la ventilation par prestation pour le suivi des seuils de marchés publics.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Ex: Londres" /></div>
                  <div><Label>Professeur référent</Label><Input value={form.professeur} onChange={(e) => setForm({ ...form, professeur: e.target.value })} /></div>
                  <div><Label>Classe</Label><Input value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} placeholder="Ex: 2nde A" /></div>
                  <div><Label>Nb élèves</Label><Input type="number" value={form.nbEleves} onChange={(e) => setForm({ ...form, nbEleves: e.target.value })} /></div>
                  <div><Label>Nb accompagnateurs</Label><Input type="number" value={form.nbAccompagnateurs} onChange={(e) => setForm({ ...form, nbAccompagnateurs: e.target.value })} /></div>
                  <div />
                  <div><Label>Date départ</Label><Input type="date" value={form.dateDepart} onChange={(e) => setForm({ ...form, dateDepart: e.target.value })} /></div>
                  <div><Label>Date retour</Label><Input type="date" value={form.dateRetour} onChange={(e) => setForm({ ...form, dateRetour: e.target.value })} /></div>
                  <div />
                </div>
                <Separator />
                <p className="text-xs font-semibold text-foreground">Financement</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Budget total (€)</Label><Input type="number" value={form.budgetTotal} onChange={(e) => setForm({ ...form, budgetTotal: e.target.value })} /></div>
                  <div><Label>Participation familles (€)</Label><Input type="number" value={form.participationFamilles} onChange={(e) => setForm({ ...form, participationFamilles: e.target.value })} /></div>
                  <div><Label>Subventions (€)</Label><Input type="number" value={form.subventions} onChange={(e) => setForm({ ...form, subventions: e.target.value })} /></div>
                </div>
                <Separator />
                <p className="text-xs font-semibold text-foreground">Ventilation par prestation (marchés publics)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>🚌 Transport (€)</Label><Input type="number" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })} /></div>
                  <div><Label>🏨 Hébergement (€)</Label><Input type="number" value={form.hebergement} onChange={(e) => setForm({ ...form, hebergement: e.target.value })} /></div>
                  <div><Label>🍽️ Restauration (€)</Label><Input type="number" value={form.restauration} onChange={(e) => setForm({ ...form, restauration: e.target.value })} /></div>
                  <div><Label>🎭 Activités (€)</Label><Input type="number" value={form.activites} onChange={(e) => setForm({ ...form, activites: e.target.value })} /></div>
                  <div><Label>🛡️ Assurance (€)</Label><Input type="number" value={form.assurance} onChange={(e) => setForm({ ...form, assurance: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Ajouter le voyage</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Budget total" value={formatCurrency(totaux.budget)} icon={Euro} variant="primary" />
        <KpiCard title="Part familles" value={formatCurrency(totaux.familles)} subtitle={totaux.budget > 0 ? `${((totaux.familles / totaux.budget) * 100).toFixed(0)}%` : "—"} icon={Users} variant="success" />
        <KpiCard title="Subventions" value={formatCurrency(totaux.subventions)} icon={CalendarDays} variant="default" />
        <KpiCard title="Charge établissement" value={formatCurrency(totaux.charge)} icon={Bus} variant="warning" />
        <KpiCard title="Coût moyen / élève" value={formatCurrency(coutMoyenEleve)} subtitle={`${totaux.eleves} élèves`} icon={Users} variant="primary" />
      </div>

      {/* ALERTES MARCHÉS PUBLICS */}
      {alertesMarches.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-card border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> Alertes marchés publics — Seuils dépassés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertesMarches.map(alerte => (
                <div key={alerte.key} className="p-3 rounded-lg bg-background border text-sm leading-relaxed">
                  <span className="font-semibold">{alerte.icon} {alerte.label}</span>
                  <p className="mt-1 text-muted-foreground">{alerte.texte}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* TABLEAU CUMUL PAR CATÉGORIE */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Cumul annuel par nature de prestation (seuils marchés publics)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nature de prestation</TableHead>
                <TableHead className="text-right">Cumul annuel</TableHead>
                <TableHead>Jauge</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Recommandation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cumulParCategorie.map(cat => {
                const pct = Math.min((cat.total / SEUILS.SEUIL_FORMALISE) * 100, 100);
                return (
                  <TableRow key={cat.key}>
                    <TableCell className="font-medium">{cat.icon} {cat.label}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(cat.total)}</TableCell>
                    <TableCell className="min-w-[120px]">
                      <Progress value={pct} className={`h-2 ${cat.niveau === "ok" ? "" : cat.niveau === "warning" ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${
                        cat.niveau === "ok" ? "bg-success/10 text-success border-0" :
                        cat.niveau === "warning" ? "bg-warning/10 text-warning border-0" :
                        "bg-destructive/10 text-destructive border-0"
                      }`}>
                        {cat.niveau === "ok" ? "Conforme" : cat.niveau === "warning" ? "Mise en concurrence" : "Procédure formalisée"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{cat.texte.substring(2).split("—")[0]}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground">
            <span>Seuil mise en concurrence : {formatCurrency(SEUILS.SEUIL_GREAEGRE)} HT</span>
            <span>Seuil procédure formalisée : {formatCurrency(SEUILS.SEUIL_FORMALISE)} HT</span>
            <span>Seuil européen : {formatCurrency(SEUILS.SEUIL_EUROPEEN)} HT</span>
          </div>
        </CardContent>
      </Card>

      {/* GRAPHIQUE VENTILATION */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ventilation par prestation et par voyage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Transport" stackId="a" fill="hsl(215, 70%, 45%)" />
              <Bar dataKey="Hébergement" stackId="a" fill="hsl(160, 45%, 45%)" />
              <Bar dataKey="Restauration" stackId="a" fill="hsl(38, 92%, 50%)" />
              <Bar dataKey="Activités" stackId="a" fill="hsl(280, 60%, 55%)" />
              <Bar dataKey="Assurance" stackId="a" fill="hsl(215, 25%, 65%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* LISTE DES VOYAGES */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Détail des voyages ({voyages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destination</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Référent</TableHead>
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
              {voyages.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium"><MapPin className="h-3 w-3 inline mr-1 text-muted-foreground" />{v.destination}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.classe}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.professeur}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* COUVERTURE BUDGÉTAIRE */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Couverture budgétaire par voyage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {voyages.filter(v => v.statut !== "annule").map((v) => {
            const couverture = v.budgetTotal > 0 ? ((v.participationFamilles + v.subventions) / v.budgetTotal) * 100 : 0;
            return (
              <div key={v.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{v.destination} <span className="text-muted-foreground text-xs">({v.classe})</span></span>
                  <span className={couverture >= 100 ? "text-success" : "text-muted-foreground"}>{couverture.toFixed(0)}% couvert</span>
                </div>
                <Progress value={Math.min(couverture, 100)} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default Voyages;
