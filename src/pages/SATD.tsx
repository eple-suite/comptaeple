import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Gavel, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, Euro, FileText, TrendingDown, Search, PauseCircle, Play, Eye, Users, ChevronRight, XCircle, Scale } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import {
  Satd, TiersDetenteur, Creance, EtapeProcedure,
  mockSatds, mockTiers,
  STATUT_SATD_CONFIG, TYPE_DEBITEUR_LABELS, TYPE_TIERS_LABELS, ETAPE_LABELS,
} from "./satd/types";
import SatdDocuments from "./satd/SatdDocuments";
import SatdStats from "./satd/SatdStats";
import SatdProcedure from "./satd/SatdProcedure";

const SATD = () => {
  const [satds, setSatds] = useState<Satd[]>(mockSatds);
  const [tiersDetenteurs, setTiersDetenteurs] = useState<TiersDetenteur[]>(mockTiers);
  const [open, setOpen] = useState(false);
  const [openTiers, setOpenTiers] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [selectedSatd, setSelectedSatd] = useState<Satd | null>(null);
  const [newPrelevement, setNewPrelevement] = useState({ date: "", montant: "", reference: "", mode: "virement" as const });
  const [newEtape, setNewEtape] = useState({ type: "relance1" as EtapeProcedure["type"], date: "", commentaire: "" });

  // Form SATD
  const [form, setForm] = useState({
    debiteur: "", debiteurAdresse: "", debiteurCP: "", debiteurVille: "",
    typeDebiteur: "eleve_famille" as Satd["typeDebiteur"],
    motif: "", observations: "",
    tiersDetenteurId: "", compteBudgetaire: "411200",
    creanceCompte: "4112", creanceLibelle: "", creanceExercice: new Date().getFullYear().toString(),
    creanceMontant: "",
  });

  // Form Tiers
  const [formTiers, setFormTiers] = useState({
    nom: "", type: "employeur_prive" as TiersDetenteur["type"],
    adresse: "", codePostal: "", ville: "",
    siret: "", contact: "", email: "", telephone: "",
  });

  const filtered = useMemo(() => {
    return satds.filter(s => {
      if (filterStatut !== "all" && s.statut !== filterStatut) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.debiteur.toLowerCase().includes(q) && !s.reference.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [satds, filterStatut, search]);

  // KPIs
  const totalInitial = satds.reduce((s, a) => s + a.montantGlobal, 0);
  const totalPreleve = satds.reduce((s, a) => s + a.montantPreleve, 0);
  const totalRestant = totalInitial - totalPreleve;
  const enCours = satds.filter(s => s.statut === "en_cours" || s.statut === "emise").length;
  const contestes = satds.filter(s => s.statut === "conteste").length;
  const tauxRecouvrement = totalInitial > 0 ? (totalPreleve / totalInitial) * 100 : 0;
  const prescriptionsProches = satds.filter(s => {
    if (s.statut === "termine" || s.statut === "prescrit" || s.statut === "irrecouv") return false;
    const d = new Date(s.datePrescription);
    return d <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  }).length;

  const handleAddSatd = () => {
    const count = satds.length + 1;
    const ref = `SATD-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
    const creance: Creance = {
      id: `cr${Date.now()}`, compte: form.creanceCompte, libelle: form.creanceLibelle,
      exercice: Number(form.creanceExercice), montantInitial: Number(form.creanceMontant),
      montantRecouvre: 0, resteARecouvrer: Number(form.creanceMontant),
    };
    const montant = Number(form.creanceMontant);
    const now = new Date().toISOString().split("T")[0];
    const prescription = new Date();
    prescription.setFullYear(prescription.getFullYear() + 4);

    const newSatd: Satd = {
      id: `s${Date.now()}`, reference: ref,
      debiteur: form.debiteur, debiteurAdresse: form.debiteurAdresse,
      debiteurCP: form.debiteurCP, debiteurVille: form.debiteurVille,
      typeDebiteur: form.typeDebiteur,
      creances: [creance], montantTotal: montant, fraisPoursuite: 0, majorations: 0, montantGlobal: montant,
      tiersDetenteurId: form.tiersDetenteurId, tiersDetenteur: null,
      organisme: "Lycée Victor Hugo", compteBudgetaire: form.compteBudgetaire,
      iban: "FR76 1007 1130 0000 0020 0390 156", bic: "TRPUFRP1",
      dateCreation: now, dateReception: "", dateEcheance: "",
      datePrescription: prescription.toISOString().split("T")[0],
      etapes: [{ type: "relance1", date: now, commentaire: "Première relance envoyée", documentGenere: true }],
      statut: "relance", montantPreleve: 0, prelevements: [],
      motif: form.motif, observations: form.observations,
      autorisationOrdonnateur: false, dateAutorisation: "", compte416: false,
    };
    setSatds([...satds, newSatd]);
    setOpen(false);
    setForm({ debiteur: "", debiteurAdresse: "", debiteurCP: "", debiteurVille: "", typeDebiteur: "eleve_famille", motif: "", observations: "", tiersDetenteurId: "", compteBudgetaire: "411200", creanceCompte: "4112", creanceLibelle: "", creanceExercice: new Date().getFullYear().toString(), creanceMontant: "" });
  };

  const handleAddTiers = () => {
    setTiersDetenteurs([...tiersDetenteurs, { id: `t${Date.now()}`, ...formTiers }]);
    setOpenTiers(false);
    setFormTiers({ nom: "", type: "employeur_prive", adresse: "", codePostal: "", ville: "", siret: "", contact: "", email: "", telephone: "" });
  };

  const handleAddPrelevement = () => {
    if (!selectedSatd || !newPrelevement.date || !newPrelevement.montant) return;
    const montant = Number(newPrelevement.montant);
    setSatds(satds.map(s => {
      if (s.id !== selectedSatd.id) return s;
      const updated = {
        ...s,
        prelevements: [...s.prelevements, { date: newPrelevement.date, montant, reference: newPrelevement.reference, mode: newPrelevement.mode }],
        montantPreleve: s.montantPreleve + montant,
        etapes: [...s.etapes, { type: "prelevement" as const, date: newPrelevement.date, commentaire: `${formatCurrency(montant)} — ${newPrelevement.reference}`, documentGenere: false }],
      };
      if (updated.montantPreleve >= updated.montantGlobal) {
        updated.statut = "termine";
        updated.etapes.push({ type: "solde", date: newPrelevement.date, commentaire: "Procédure soldée", documentGenere: false });
      }
      return updated;
    }));
    // Update selected
    const up = satds.find(s => s.id === selectedSatd.id);
    if (up) {
      setSelectedSatd({
        ...up,
        prelevements: [...up.prelevements, { date: newPrelevement.date, montant, reference: newPrelevement.reference, mode: newPrelevement.mode }],
        montantPreleve: up.montantPreleve + montant,
      });
    }
    setNewPrelevement({ date: "", montant: "", reference: "", mode: "virement" });
  };

  const handleAddEtape = () => {
    if (!selectedSatd || !newEtape.date) return;
    const etape: EtapeProcedure = { ...newEtape, documentGenere: false };
    // Determine new statut based on etape
    let newStatut = selectedSatd.statut;
    if (newEtape.type === "avis_poursuites") newStatut = "avis_poursuites";
    if (newEtape.type === "autorisation_ordonnateur") newStatut = "autorisation";
    if (newEtape.type === "satd_emission") newStatut = "emise";
    if (newEtape.type === "satd_reception_ar") newStatut = "en_cours";
    if (newEtape.type === "contestation") newStatut = "conteste";
    if (newEtape.type === "suspension") newStatut = "suspendu";
    if (newEtape.type === "reprise") newStatut = "en_cours";

    setSatds(satds.map(s => s.id === selectedSatd.id ? {
      ...s, etapes: [...s.etapes, etape], statut: newStatut,
      autorisationOrdonnateur: newEtape.type === "autorisation_ordonnateur" ? true : s.autorisationOrdonnateur,
      dateAutorisation: newEtape.type === "autorisation_ordonnateur" ? newEtape.date : s.dateAutorisation,
    } : s));
    setSelectedSatd({
      ...selectedSatd,
      etapes: [...selectedSatd.etapes, etape],
      statut: newStatut,
    });
    setNewEtape({ type: "relance1", date: "", commentaire: "" });
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
            <p className="text-sm text-muted-foreground mt-1">Saisies Administratives à Tiers Détenteur — Procédures de recouvrement forcé</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={openTiers} onOpenChange={setOpenTiers}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Users className="h-3.5 w-3.5 mr-1" /> Tiers</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Ajouter un tiers détenteur</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Nom / Raison sociale</Label><Input value={formTiers.nom} onChange={e => setFormTiers({ ...formTiers, nom: e.target.value })} /></div>
                    <div><Label>Type</Label>
                      <Select value={formTiers.type} onValueChange={(v: any) => setFormTiers({ ...formTiers, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_TIERS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>SIRET</Label><Input value={formTiers.siret} onChange={e => setFormTiers({ ...formTiers, siret: e.target.value })} /></div>
                    <div className="col-span-2"><Label>Adresse</Label><Input value={formTiers.adresse} onChange={e => setFormTiers({ ...formTiers, adresse: e.target.value })} /></div>
                    <div><Label>Code postal</Label><Input value={formTiers.codePostal} onChange={e => setFormTiers({ ...formTiers, codePostal: e.target.value })} /></div>
                    <div><Label>Ville</Label><Input value={formTiers.ville} onChange={e => setFormTiers({ ...formTiers, ville: e.target.value })} /></div>
                    <div><Label>Contact</Label><Input value={formTiers.contact} onChange={e => setFormTiers({ ...formTiers, contact: e.target.value })} /></div>
                    <div><Label>Téléphone</Label><Input value={formTiers.telephone} onChange={e => setFormTiers({ ...formTiers, telephone: e.target.value })} /></div>
                    <div className="col-span-2"><Label>Email</Label><Input value={formTiers.email} onChange={e => setFormTiers({ ...formTiers, email: e.target.value })} /></div>
                  </div>
                  <Button onClick={handleAddTiers} className="w-full gradient-primary border-0">Ajouter le tiers</Button>
                  {tiersDetenteurs.length > 0 && (
                    <div className="mt-4 space-y-1 max-h-[200px] overflow-y-auto">
                      <p className="text-xs font-semibold text-muted-foreground">Tiers enregistrés ({tiersDetenteurs.length})</p>
                      {tiersDetenteurs.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                          <span className="font-medium">{t.nom}</span>
                          <Badge variant="outline" className="text-[9px]">{TYPE_TIERS_LABELS[t.type]}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle procédure</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Engager une procédure de recouvrement</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground bg-warning/10 p-2 rounded flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    Rappel : la SATD ne peut être émise qu'après relances amiables, avis avant poursuites, et autorisation de l'ordonnateur. Les créances doivent être au compte 416.
                  </p>
                  {/* Débiteur */}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Débiteur (nom complet)</Label><Input value={form.debiteur} onChange={e => setForm({ ...form, debiteur: e.target.value })} placeholder="M. / Mme NOM Prénom" /></div>
                    <div><Label>Type de débiteur</Label>
                      <Select value={form.typeDebiteur} onValueChange={(v: any) => setForm({ ...form, typeDebiteur: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_DEBITEUR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label>Adresse</Label><Input value={form.debiteurAdresse} onChange={e => setForm({ ...form, debiteurAdresse: e.target.value })} /></div>
                    <div><Label>Code postal</Label><Input value={form.debiteurCP} onChange={e => setForm({ ...form, debiteurCP: e.target.value })} /></div>
                    <div><Label>Ville</Label><Input value={form.debiteurVille} onChange={e => setForm({ ...form, debiteurVille: e.target.value })} /></div>
                  </div>
                  <Separator />
                  {/* Créance */}
                  <div className="grid grid-cols-4 gap-3">
                    <div><Label>Compte</Label>
                      <Select value={form.creanceCompte} onValueChange={v => setForm({ ...form, creanceCompte: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4112">4112 — Familles</SelectItem>
                          <SelectItem value="4122">4122 — Commensaux</SelectItem>
                          <SelectItem value="416">416 — Créances douteuses</SelectItem>
                          <SelectItem value="421">421 — Agents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Libellé créance</Label><Input value={form.creanceLibelle} onChange={e => setForm({ ...form, creanceLibelle: e.target.value })} placeholder="Restauration 2024 T1" /></div>
                    <div><Label>Exercice</Label><Input value={form.creanceExercice} onChange={e => setForm({ ...form, creanceExercice: e.target.value })} /></div>
                    <div><Label>Montant (€)</Label><Input type="number" value={form.creanceMontant} onChange={e => setForm({ ...form, creanceMontant: e.target.value })} /></div>
                  </div>
                  <Separator />
                  {/* Tiers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tiers détenteur</Label>
                      <Select value={form.tiersDetenteurId} onValueChange={v => setForm({ ...form, tiersDetenteurId: v })}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {tiersDetenteurs.map(t => <SelectItem key={t.id} value={t.id}>{t.nom} ({TYPE_TIERS_LABELS[t.type]})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Compte budgétaire</Label><Input value={form.compteBudgetaire} onChange={e => setForm({ ...form, compteBudgetaire: e.target.value })} /></div>
                  </div>
                  <div><Label>Motif</Label><Input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Impayés restauration 2024" /></div>
                  <div><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} /></div>
                  <Button onClick={handleAddSatd} disabled={!form.debiteur || !form.creanceMontant} className="w-full gradient-primary border-0">Créer la procédure</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total créances" value={formatCurrency(totalInitial)} icon={Gavel} variant="primary" />
        <KpiCard title="Recouvré" value={formatCurrency(totalPreleve)} subtitle={`${tauxRecouvrement.toFixed(0)}%`} icon={CheckCircle2} variant="success" />
        <KpiCard title="Reste à recouvrer" value={formatCurrency(totalRestant)} icon={TrendingDown} variant="warning" />
        <KpiCard title="En cours" value={`${enCours}`} icon={Clock} variant="warning" />
        <KpiCard title="Contestées" value={`${contestes}`} icon={AlertTriangle} variant="destructive" />
        <KpiCard title="Prescriptions ≤6m" value={`${prescriptionsProches}`} icon={Scale} variant={prescriptionsProches > 0 ? "destructive" : "default"} />
      </div>

      <Tabs defaultValue="registre">
        <TabsList className="flex-wrap">
          <TabsTrigger value="registre">Registre ({filtered.length})</TabsTrigger>
          <TabsTrigger value="poursuivre" className="text-destructive">⚖️ Poursuivre un débiteur</TabsTrigger>
          <TabsTrigger value="procedure">📋 Procédure & Guide</TabsTrigger>
          <TabsTrigger value="workflow">Workflow procédure</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        {/* === REGISTRE === */}
        <TabsContent value="registre" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par référence ou débiteur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUT_SATD_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Débiteur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Prélevé</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead>Prescription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => {
                    const pct = s.montantGlobal > 0 ? (s.montantPreleve / s.montantGlobal) * 100 : 0;
                    const prescDate = new Date(s.datePrescription);
                    const prescSoon = prescDate <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) && s.statut !== "termine";
                    return (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedSatd(s)}>
                        <TableCell className="font-mono text-sm font-semibold text-primary">{s.reference}</TableCell>
                        <TableCell className="font-medium text-sm">{s.debiteur}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px]">{TYPE_DEBITEUR_LABELS[s.typeDebiteur]}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={s.motif}>{s.motif}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantGlobal)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(s.montantPreleve)}</TableCell>
                        <TableCell className="min-w-[80px]">
                          <Progress value={pct} className="h-2" />
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs ${prescSoon ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            {prescDate.toLocaleDateString("fr-FR")}
                            {prescSoon && " ⚠️"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${STATUT_SATD_CONFIG[s.statut].color}`}>
                            {STATUT_SATD_CONFIG[s.statut].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {s.statut === "en_cours" && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleChangeStatut(s.id, "suspendu")} title="Suspendre">
                                <PauseCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {s.statut === "suspendu" && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleChangeStatut(s.id, "en_cours")} title="Reprendre">
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setSatds(satds.filter(x => x.id !== s.id))}>
                              <Trash2 className="h-3 w-3" />
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

        {/* === WORKFLOW === */}
        <TabsContent value="workflow" className="space-y-4 mt-4">
          {selectedSatd ? (
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {selectedSatd.reference}
                      <Badge variant="secondary" className={`text-[10px] ${STATUT_SATD_CONFIG[selectedSatd.statut].color}`}>
                        {STATUT_SATD_CONFIG[selectedSatd.statut].label}
                      </Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSatd(null)} className="text-xs">Fermer</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div><span className="text-xs text-muted-foreground">Débiteur</span><p className="font-medium">{selectedSatd.debiteur}</p></div>
                    <div><span className="text-xs text-muted-foreground">Montant total</span><p className="font-mono font-bold">{formatCurrency(selectedSatd.montantGlobal)}</p></div>
                    <div><span className="text-xs text-muted-foreground">Prélevé</span><p className="font-mono font-bold text-success">{formatCurrency(selectedSatd.montantPreleve)}</p></div>
                    <div><span className="text-xs text-muted-foreground">Reste</span><p className="font-mono font-bold text-warning">{formatCurrency(selectedSatd.montantGlobal - selectedSatd.montantPreleve)}</p></div>
                  </div>
                  <Separator className="my-3" />

                  {/* Timeline des étapes */}
                  <p className="text-xs font-semibold mb-3">Historique de la procédure</p>
                  <div className="relative pl-6 space-y-3">
                    {selectedSatd.etapes.map((e, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        {i < selectedSatd.etapes.length - 1 && <div className="absolute -left-[14px] top-4 w-0.5 h-full bg-border" />}
                        <div className="bg-muted/20 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{ETAPE_LABELS[e.type] || e.type}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString("fr-FR")}</span>
                          </div>
                          {e.commentaire && <p className="text-xs text-muted-foreground mt-0.5">{e.commentaire}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ajouter étape */}
                  {selectedSatd.statut !== "termine" && (
                    <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Ajouter une étape</p>
                      <div className="flex gap-2 items-end flex-wrap">
                        <div>
                          <Label className="text-[10px]">Type</Label>
                          <Select value={newEtape.type} onValueChange={(v: any) => setNewEtape({ ...newEtape, type: v })}>
                            <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(ETAPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-[10px]">Date</Label><Input type="date" className="h-8 text-xs w-[140px]" value={newEtape.date} onChange={e => setNewEtape({ ...newEtape, date: e.target.value })} /></div>
                        <div className="flex-1"><Label className="text-[10px]">Commentaire</Label><Input className="h-8 text-xs" value={newEtape.commentaire} onChange={e => setNewEtape({ ...newEtape, commentaire: e.target.value })} /></div>
                        <Button size="sm" onClick={handleAddEtape} className="h-8 gradient-primary border-0 text-xs">Ajouter</Button>
                      </div>
                    </div>
                  )}

                  {/* Prélèvements */}
                  <Separator className="my-4" />
                  <p className="text-xs font-semibold mb-2">Prélèvements ({selectedSatd.prelevements.length})</p>
                  {selectedSatd.prelevements.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSatd.prelevements.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-sm font-mono">{p.reference}</TableCell>
                            <TableCell className="text-sm capitalize">{p.mode}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(p.montant)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {selectedSatd.statut !== "termine" && (
                    <div className="flex gap-2 items-end mt-3 flex-wrap">
                      <div><Label className="text-[10px]">Date</Label><Input type="date" className="h-8 text-xs w-[130px]" value={newPrelevement.date} onChange={e => setNewPrelevement({ ...newPrelevement, date: e.target.value })} /></div>
                      <div><Label className="text-[10px]">Montant</Label><Input type="number" className="h-8 text-xs w-[100px]" value={newPrelevement.montant} onChange={e => setNewPrelevement({ ...newPrelevement, montant: e.target.value })} /></div>
                      <div><Label className="text-[10px]">Réf.</Label><Input className="h-8 text-xs w-[120px]" value={newPrelevement.reference} onChange={e => setNewPrelevement({ ...newPrelevement, reference: e.target.value })} placeholder="VIR-XXX" /></div>
                      <Button size="sm" onClick={handleAddPrelevement} className="h-8 gradient-primary border-0 text-xs">Enregistrer</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Sélectionnez une procédure dans l'onglet <strong>Registre</strong> pour suivre son workflow et ajouter des étapes.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === PROCEDURE === */}
        <TabsContent value="procedure" className="mt-4">
          <SatdProcedure
            satd={selectedSatd}
            onGenerateDocument={(satd, docType) => {
              // Trigger document generation based on type
              const etape: EtapeProcedure = { type: docType as any, date: new Date().toISOString().split("T")[0], commentaire: "Document généré", documentGenere: true };
              // Auto-generate relevant document
            }}
            onAddEtape={(type) => {
              if (!selectedSatd) return;
              const now = new Date().toISOString().split("T")[0];
              const etape: EtapeProcedure = { type: type as any, date: now, commentaire: "", documentGenere: false };
              let newStatut = selectedSatd.statut;
              if (type === "avis_poursuites") newStatut = "avis_poursuites";
              if (type === "autorisation_ordonnateur") newStatut = "autorisation";
              if (type === "satd_emission") newStatut = "emise";
              if (type === "satd_reception_ar") newStatut = "en_cours";
              setSatds(satds.map(s => s.id === selectedSatd.id ? { ...s, etapes: [...s.etapes, etape], statut: newStatut } : s));
              setSelectedSatd({ ...selectedSatd, etapes: [...selectedSatd.etapes, etape], statut: newStatut });
            }}
          />
        </TabsContent>

        {/* === DOCUMENTS === */}
        <TabsContent value="documents" className="mt-4">
          <SatdDocuments satds={satds} tiers={tiersDetenteurs} />
        </TabsContent>

        {/* === STATISTIQUES === */}
        <TabsContent value="statistiques" className="mt-4">
          <SatdStats satds={satds} tiers={tiersDetenteurs} />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog when clicking from registre */}
      <Dialog open={false}>
        <DialogContent />
      </Dialog>
    </div>
  );
};

export default SATD;
