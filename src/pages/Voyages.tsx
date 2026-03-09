import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bus, Plus, Users, Euro, CalendarDays, MapPin, Trash2, Edit, Eye, ShieldAlert, FileText, Download, ChevronRight, Clock, CheckCircle2, XCircle, Landmark, Gift, Printer, AlertTriangle } from "lucide-react";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { evaluerSeuilsMarchesVoyages, SEUILS_MARCHES_PUBLICS } from "@/lib/regulatoryKnowledge";
import { Voyage, initialVoyages, STATUT_CONFIG, SEUILS, CATEGORIES_PRESTATIONS, CHECKLIST_DEFAUT, getRecommandation } from "./voyages/types";
import { VoyageElevesTab } from "./voyages/VoyageElevesTab";
import { VoyageMarchesTab } from "./voyages/VoyageMarchesTab";
import { VoyageBilanTab } from "./voyages/VoyageBilanTab";
import { VoyageActesCATab } from "./voyages/VoyageActesCATab";
import { VoyageSubventionsTab } from "./voyages/VoyageSubventionsTab";
import { VoyageParticipantsTab } from "./voyages/VoyageParticipantsTab";

const Voyages = () => {
  const [voyages, setVoyages] = useState<Voyage[]>(initialVoyages);
  const [open, setOpen] = useState(false);
  const [selectedVoyageId, setSelectedVoyageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tableau-bord");
  const [form, setForm] = useState({
    destination: "", pays: "", dateDepart: "", dateRetour: "", nbEleves: "", nbAccompagnateurs: "",
    budgetTotal: "", participationFamilles: "", subventions: "",
    transport: "", hebergement: "", restauration: "", activites: "", assurance: "", divers: "",
    professeur: "", classe: "", objectifPedagogique: "",
    subventionCollectivite: "", subventionEtat: "", subventionAutre: "", autofinancement: "",
    dateVoteCA: "", dateLimiteInscription: "", observations: "",
  });

  const voyagesActifs = voyages.filter(v => v.statut !== "annule");
  const selectedVoyage = voyages.find(v => v.id === selectedVoyageId) || null;

  const totaux = useMemo(() => voyagesActifs.reduce(
    (acc, v) => ({
      budget: acc.budget + v.budgetTotal,
      familles: acc.familles + v.participationFamilles,
      subventions: acc.subventions + v.subventions,
      charge: acc.charge + v.chargeEtablissement,
      eleves: acc.eleves + v.nbEleves,
      accomp: acc.accomp + v.nbAccompagnateurs,
    }),
    { budget: 0, familles: 0, subventions: 0, charge: 0, eleves: 0, accomp: 0 }
  ), [voyagesActifs]);

  const alertesCount = useMemo(() => {
    return CATEGORIES_PRESTATIONS.map(cat => {
      const total = voyagesActifs.reduce((s, v) => s + (v[cat.key] || 0), 0);
      return getRecommandation(total, cat.label, formatCurrency);
    }).filter(c => c.niveau !== "ok").length;
  }, [voyagesActifs]);

  // Évaluation des seuils marchés publics (Code de la commande publique)
  const alertesMarchesPublics = useMemo(() => evaluerSeuilsMarchesVoyages(voyagesActifs), [voyagesActifs]);
  const alertesMPCritiques = alertesMarchesPublics.filter(a => a.alerte);

  const handleAdd = () => {
    const budget = Number(form.budgetTotal);
    const familles = Number(form.participationFamilles);
    const subvColl = Number(form.subventionCollectivite) || 0;
    const subvEtat = Number(form.subventionEtat) || 0;
    const subvAutre = Number(form.subventionAutre) || 0;
    const subv = subvColl + subvEtat + subvAutre;
    const autofi = Number(form.autofinancement) || 0;
    const newVoyage: Voyage = {
      id: Date.now().toString(),
      destination: form.destination,
      pays: form.pays,
      dateDepart: form.dateDepart,
      dateRetour: form.dateRetour,
      nbEleves: Number(form.nbEleves),
      nbAccompagnateurs: Number(form.nbAccompagnateurs) || 0,
      budgetTotal: budget,
      participationFamilles: familles,
      subventions: subv,
      chargeEtablissement: budget - familles - subv - autofi,
      statut: "projet",
      transport: Number(form.transport) || 0,
      hebergement: Number(form.hebergement) || 0,
      restauration: Number(form.restauration) || 0,
      activites: Number(form.activites) || 0,
      assurance: Number(form.assurance) || 0,
      divers: Number(form.divers) || 0,
      professeur: form.professeur,
      classe: form.classe,
      objectifPedagogique: form.objectifPedagogique,
      subventionCollectivite: subvColl,
      subventionEtat: subvEtat,
      subventionAutre: subvAutre,
      autofinancement: autofi,
      eleves: [],
      accompagnateurs: [],
      dateVoteCA: form.dateVoteCA,
      dateLimiteInscription: form.dateLimiteInscription,
      echeances: [{ date: form.dateLimiteInscription || form.dateDepart, pourcentage: 100 }],
      observations: form.observations,
      actesCA: [],
      conventions: [],
      subventionsDetail: [],
      checklist: CHECKLIST_DEFAUT.map((item, i) => ({ ...item, id: `chk-new-${i}`, fait: false, observations: "" })),
      devis: [],
      lieuDepart: "",
      horairesDepart: "",
      horairesRetour: "",
      moyenTransport: "",
      typeHebergement: "",
      contactUrgence: "",
      telUrgence: "",
    };
    setVoyages([...voyages, newVoyage]);
    setOpen(false);
    setForm({ destination: "", pays: "", dateDepart: "", dateRetour: "", nbEleves: "", nbAccompagnateurs: "", budgetTotal: "", participationFamilles: "", subventions: "", transport: "", hebergement: "", restauration: "", activites: "", assurance: "", divers: "", professeur: "", classe: "", objectifPedagogique: "", subventionCollectivite: "", subventionEtat: "", subventionAutre: "", autofinancement: "", dateVoteCA: "", dateLimiteInscription: "", observations: "" });
  };

  const handleDelete = (id: string) => setVoyages(voyages.filter(v => v.id !== id));

  const handleUpdateVoyage = (updated: Voyage) => {
    setVoyages(voyages.map(v => v.id === updated.id ? updated : v));
  };

  const handleStatutChange = (id: string, statut: Voyage["statut"]) => {
    setVoyages(voyages.map(v => v.id === id ? { ...v, statut } : v));
  };

  const coutMoyenEleve = totaux.eleves > 0 ? totaux.budget / totaux.eleves : 0;

  // Workflow steps
  const statutSteps = ["projet", "vote_ca", "planifie", "valide", "realise", "bilan"] as const;

  // Checklist global progress
  const checklistGlobal = useMemo(() => {
    const total = voyagesActifs.reduce((s, v) => s + v.checklist.length, 0);
    const done = voyagesActifs.reduce((s, v) => s + v.checklist.filter(c => c.fait).length, 0);
    return { total, done, pct: total > 0 ? (done / total) * 100 : 0 };
  }, [voyagesActifs]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Voyages scolaires</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion complète : actes du CA, participants, subventions, marchés publics, bilan financier
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "Voyages scolaires — Synthèse", subtitle: `${voyagesActifs.length} voyages — Exercice ${new Date().getFullYear()}` });
              autoTable(doc, {
                startY: 48,
                head: [["Destination", "Dates", "Classe", "Élèves", "Budget", "Familles", "Subventions", "Statut"]],
                body: voyagesActifs.map(v => [v.destination, `${v.dateDepart} → ${v.dateRetour}`, v.classe, String(v.nbEleves), formatCurrency(v.budgetTotal), formatCurrency(v.participationFamilles), formatCurrency(v.subventions), v.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 244, 248] },
                margin: { left: 8, right: 8 },
                columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
                styles: { fontSize: 7 },
              });
              const y = (doc as any).lastAutoTable.finalY + 8;
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              doc.text(`Budget total : ${formatCurrency(totaux.budget)} — Familles : ${formatCurrency(totaux.familles)} — Subventions : ${formatCurrency(totaux.subventions)} — ${totaux.eleves} élèves`, 14, y, { maxWidth: 180 });
              savePDF(doc, `Voyages_synthese_${new Date().toISOString().split("T")[0]}.pdf`);
            }}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "Voyages scolaires — Synthèse", subtitle: `${voyagesActifs.length} voyages` });
              autoTable(doc, {
                startY: 48,
                head: [["Destination", "Dates", "Classe", "Élèves", "Budget", "Statut"]],
                body: voyagesActifs.map(v => [v.destination, `${v.dateDepart} → ${v.dateRetour}`, v.classe, String(v.nbEleves), formatCurrency(v.budgetTotal), v.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 8 },
              });
              printPDF(doc);
            }}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouveau voyage</Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Créer un voyage scolaire</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Destination *</Label><Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Ex: Londres" /></div>
                  <div><Label>Pays</Label><Input value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })} placeholder="Ex: Royaume-Uni" /></div>
                  <div><Label>Classe *</Label><Input value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} placeholder="Ex: 2nde A" /></div>
                  <div><Label>Professeur référent *</Label><Input value={form.professeur} onChange={e => setForm({ ...form, professeur: e.target.value })} /></div>
                  <div><Label>Nb élèves</Label><Input type="number" value={form.nbEleves} onChange={e => setForm({ ...form, nbEleves: e.target.value })} /></div>
                  <div><Label>Nb accompagnateurs</Label><Input type="number" value={form.nbAccompagnateurs} onChange={e => setForm({ ...form, nbAccompagnateurs: e.target.value })} /></div>
                  <div><Label>Date départ</Label><Input type="date" value={form.dateDepart} onChange={e => setForm({ ...form, dateDepart: e.target.value })} /></div>
                  <div><Label>Date retour</Label><Input type="date" value={form.dateRetour} onChange={e => setForm({ ...form, dateRetour: e.target.value })} /></div>
                  <div><Label>Date vote CA</Label><Input type="date" value={form.dateVoteCA} onChange={e => setForm({ ...form, dateVoteCA: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Objectif pédagogique</Label>
                  <Textarea value={form.objectifPedagogique} onChange={e => setForm({ ...form, objectifPedagogique: e.target.value })} placeholder="Décrivez l'objectif pédagogique du voyage..." rows={2} />
                </div>
                <Separator />
                <p className="text-xs font-semibold text-foreground">Financement</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Budget total (€) *</Label><Input type="number" value={form.budgetTotal} onChange={e => setForm({ ...form, budgetTotal: e.target.value })} /></div>
                  <div><Label>Participation familles (€)</Label><Input type="number" value={form.participationFamilles} onChange={e => setForm({ ...form, participationFamilles: e.target.value })} /></div>
                  <div><Label>Date limite inscription</Label><Input type="date" value={form.dateLimiteInscription} onChange={e => setForm({ ...form, dateLimiteInscription: e.target.value })} /></div>
                  <div><Label>Subvention collectivité (€)</Label><Input type="number" value={form.subventionCollectivite} onChange={e => setForm({ ...form, subventionCollectivite: e.target.value })} /></div>
                  <div><Label>Subvention État (€)</Label><Input type="number" value={form.subventionEtat} onChange={e => setForm({ ...form, subventionEtat: e.target.value })} /></div>
                  <div><Label>Autres subventions (€)</Label><Input type="number" value={form.subventionAutre} onChange={e => setForm({ ...form, subventionAutre: e.target.value })} /></div>
                  <div><Label>Autofinancement (€)</Label><Input type="number" value={form.autofinancement} onChange={e => setForm({ ...form, autofinancement: e.target.value })} /></div>
                </div>
                <Separator />
                <p className="text-xs font-semibold text-foreground">Ventilation par prestation (marchés publics)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>🚌 Transport (€)</Label><Input type="number" value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })} /></div>
                  <div><Label>🏨 Hébergement (€)</Label><Input type="number" value={form.hebergement} onChange={e => setForm({ ...form, hebergement: e.target.value })} /></div>
                  <div><Label>🍽️ Restauration (€)</Label><Input type="number" value={form.restauration} onChange={e => setForm({ ...form, restauration: e.target.value })} /></div>
                  <div><Label>🎭 Activités (€)</Label><Input type="number" value={form.activites} onChange={e => setForm({ ...form, activites: e.target.value })} /></div>
                  <div><Label>🛡️ Assurance (€)</Label><Input type="number" value={form.assurance} onChange={e => setForm({ ...form, assurance: e.target.value })} /></div>
                  <div><Label>📦 Divers (€)</Label><Input type="number" value={form.divers} onChange={e => setForm({ ...form, divers: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Observations</Label>
                  <Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} />
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0">Créer le voyage</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="tableau-bord">📊 Tableau de bord</TabsTrigger>
          <TabsTrigger value="marches-publics" className="relative">
            ⚖️ Marchés publics
            {alertesCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center rounded-full">{alertesCount}</Badge>
            )}
          </TabsTrigger>
          {selectedVoyage && <TabsTrigger value="actes-ca">🏛️ Actes CA & Conformité</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="participants">👥 Participants</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="eleves">🎒 Élèves & Paiements</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="subventions">💰 Subventions & Dons</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="bilan">📋 Bilan financier</TabsTrigger>}
        </TabsList>

        {/* TAB: Tableau de bord */}
        <TabsContent value="tableau-bord" className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            <KpiCard title="Voyages actifs" value={String(voyagesActifs.length)} subtitle={`${voyages.length} total`} icon={Bus} variant="primary" />
            <KpiCard title="Budget total" value={formatCurrency(totaux.budget)} icon={Euro} variant="primary" />
            <KpiCard title="Part familles" value={formatCurrency(totaux.familles)} subtitle={totaux.budget > 0 ? `${((totaux.familles / totaux.budget) * 100).toFixed(0)}%` : "—"} icon={Users} variant="success" />
            <KpiCard title="Subventions" value={formatCurrency(totaux.subventions)} icon={Gift} variant="default" />
            <KpiCard title="Charge étab." value={formatCurrency(totaux.charge)} icon={Bus} variant="warning" />
            <KpiCard title="Coût / élève" value={formatCurrency(coutMoyenEleve)} subtitle={`${totaux.eleves} élèves`} icon={Users} variant="primary" />
            <KpiCard title="Conformité" value={`${checklistGlobal.pct.toFixed(0)}%`} subtitle={`${checklistGlobal.done}/${checklistGlobal.total}`} icon={CheckCircle2} variant={checklistGlobal.pct >= 80 ? "success" : "warning"} />
          </div>

          {/* Alertes marchés publics résumé */}
          {alertesCount > 0 && (
            <Card className="shadow-card border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setActiveTab("marches-publics")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">{alertesCount} alerte{alertesCount > 1 ? "s" : ""} marchés publics</p>
                    <p className="text-xs text-muted-foreground">Des cumuls par prestation dépassent les seuils réglementaires — cliquez pour voir le détail</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {/* Liste des voyages avec workflow */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Voyages scolaires ({voyages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destination</TableHead>
                    <TableHead>Classe / Référent</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-center">Participants</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-center">Conformité</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voyages.map((v) => {
                    const step = STATUT_CONFIG[v.statut].step;
                    const pctWorkflow = v.statut === "annule" ? 0 : ((step + 1) / statutSteps.length) * 100;
                    const couverture = v.budgetTotal > 0 ? ((v.participationFamilles + v.subventions + v.autofinancement) / v.budgetTotal) * 100 : 0;
                    const checkDone = v.checklist.filter(c => c.fait).length;
                    const checkTotal = v.checklist.length;
                    const checkPct = checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0;
                    return (
                      <TableRow key={v.id} className={v.statut === "annule" ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="font-medium text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {v.destination}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{v.pays}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{v.classe}</div>
                          <div className="text-[10px] text-muted-foreground">{v.professeur}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {v.dateDepart} → {v.dateRetour}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{v.nbEleves}</span>
                          <span className="text-[10px] text-muted-foreground ml-0.5">+{v.nbAccompagnateurs}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-mono text-sm font-semibold">{formatCurrency(v.budgetTotal)}</div>
                          <div className="text-[10px] text-muted-foreground">{couverture.toFixed(0)}% couvert</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <Progress value={checkPct} className={`h-1.5 w-16 ${checkPct >= 100 ? "[&>div]:bg-success" : checkPct >= 50 ? "" : "[&>div]:bg-warning"}`} />
                            <span className="text-[9px] text-muted-foreground">{checkDone}/{checkTotal}</span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Progress value={pctWorkflow} className="h-1.5" />
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            {step >= 0 ? `${step + 1}/${statutSteps.length}` : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={v.statut} onValueChange={(val) => handleStatutChange(v.id, val as Voyage["statut"])}>
                            <SelectTrigger className="h-7 w-[120px] text-[10px]">
                              <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[v.statut].class}`}>
                                {STATUT_CONFIG[v.statut].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Actes CA & Conformité" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("actes-ca"); }}>
                              <Landmark className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Participants & Devis" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("participants"); }}>
                              <Users className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Bilan financier" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("bilan"); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="Supprimer" onClick={() => handleDelete(v.id)}>
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

          {/* Couverture budgétaire */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Couverture budgétaire par voyage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {voyagesActifs.map((v) => {
                const couverture = v.budgetTotal > 0 ? ((v.participationFamilles + v.subventions + v.autofinancement) / v.budgetTotal) * 100 : 0;
                return (
                  <div key={v.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{v.destination} <span className="text-muted-foreground text-xs">({v.classe})</span></span>
                      <span className={couverture >= 100 ? "text-success" : couverture >= 80 ? "text-warning" : "text-destructive"}>
                        {couverture.toFixed(0)}% couvert — reste {formatCurrency(Math.max(0, v.chargeEtablissement))} à charge
                      </span>
                    </div>
                    <Progress value={Math.min(couverture, 100)} className={`h-2 ${couverture >= 100 ? "[&>div]:bg-success" : couverture >= 80 ? "" : "[&>div]:bg-destructive"}`} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Marchés publics */}
        <TabsContent value="marches-publics">
          <VoyageMarchesTab voyages={voyages} />
        </TabsContent>

        {/* TAB: Actes CA & Conformité */}
        <TabsContent value="actes-ca">
          {selectedVoyage ? (
            <VoyageActesCATab voyage={selectedVoyage} onUpdateVoyage={handleUpdateVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage pour voir les actes du CA et la conformité.</p>
          )}
        </TabsContent>

        {/* TAB: Participants */}
        <TabsContent value="participants">
          {selectedVoyage ? (
            <VoyageParticipantsTab voyage={selectedVoyage} onUpdateVoyage={handleUpdateVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage.</p>
          )}
        </TabsContent>

        {/* TAB: Élèves */}
        <TabsContent value="eleves">
          {selectedVoyage ? (
            <VoyageElevesTab voyage={selectedVoyage} onUpdateVoyage={handleUpdateVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage pour voir les élèves.</p>
          )}
        </TabsContent>

        {/* TAB: Subventions */}
        <TabsContent value="subventions">
          {selectedVoyage ? (
            <VoyageSubventionsTab voyage={selectedVoyage} onUpdateVoyage={handleUpdateVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage.</p>
          )}
        </TabsContent>

        {/* TAB: Bilan */}
        <TabsContent value="bilan">
          {selectedVoyage ? (
            <VoyageBilanTab voyage={selectedVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage pour voir le bilan financier.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Voyages;
