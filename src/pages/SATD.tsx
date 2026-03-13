import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gavel, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, Euro, FileText,
  TrendingDown, Search, PauseCircle, Play, Eye, Users, ChevronRight, XCircle,
  Scale, Download, Printer, Calculator, Sparkles, Bell,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  Satd, TiersDetenteur, Creance, EtapeProcedure,
  mockSatds, mockTiers,
  STATUT_SATD_CONFIG, TYPE_DEBITEUR_LABELS, TYPE_TIERS_LABELS, ETAPE_LABELS,
} from "./satd/types";
import SatdDocuments from "./satd/SatdDocuments";
import SatdStats from "./satd/SatdStats";
import SatdProcedure from "./satd/SatdProcedure";
import SatdFormulaire from "./satd/SatdFormulaire";
import SatdCalculateur from "./satd/SatdCalculateur";
import SatdAssistant from "./satd/SatdAssistant";
import SatdRelancesTab from "./satd/SatdRelancesTab";
import SatdSurendettementTab from "./satd/SatdSurendettementTab";
import SatdAlertesCreancesTab from "./satd/SatdAlertesCreancesTab";

const SATD = () => {
  const { selectedEstablishment } = useEstablishment();
  const [satds, setSatds] = useState<Satd[]>(mockSatds);
  const [tiersDetenteurs, setTiersDetenteurs] = useState<TiersDetenteur[]>(mockTiers);
  const [openFormulaire, setOpenFormulaire] = useState(false);
  const [openTiers, setOpenTiers] = useState(false);
  const [openCalc, setOpenCalc] = useState(false);
  const [openAssistant, setOpenAssistant] = useState(false);
  const [assistantCtx, setAssistantCtx] = useState("creation_satd");
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [selectedSatd, setSelectedSatd] = useState<Satd | null>(null);
  const [newPrelevement, setNewPrelevement] = useState({ date: "", montant: "", reference: "", mode: "virement" as const });
  const [newEtape, setNewEtape] = useState({ type: "relance1" as EtapeProcedure["type"], date: "", commentaire: "" });

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
    setSelectedSatd({ ...selectedSatd, etapes: [...selectedSatd.etapes, etape], statut: newStatut });
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
            <h1 className="text-2xl font-bold font-display">SATD Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saisies Administratives à Tiers Détenteur — Recouvrement forcé
              {selectedEstablishment && (
                <span className="ml-2">
                  — <strong>{selectedEstablishment.name}</strong>
                  <Badge variant="outline" className="ml-1 text-[9px]">{selectedEstablishment.uai}</Badge>
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Outils */}
            <Button size="sm" variant="ghost" onClick={() => setOpenCalc(true)} title="Calculateur quotité">
              <Calculator className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAssistantCtx("creation_satd"); setOpenAssistant(true); }} title="Assistant IA">
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "État des SATD", subtitle: `${satds.length} dossiers — Recouvrement forcé` });
              autoTable(doc, {
                startY: 48,
                head: [["Référence", "Débiteur", "Montant", "Prélevé", "Reste", "Statut"]],
                body: satds.map(s => [s.reference, s.debiteur, formatCurrency(s.montantGlobal), formatCurrency(s.montantPreleve), formatCurrency(s.montantGlobal - s.montantPreleve), STATUT_SATD_CONFIG[s.statut]?.label || s.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 244, 248] },
                margin: { left: 10, right: 10 },
                columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
                styles: { fontSize: 8 },
              });
              const y = (doc as any).lastAutoTable.finalY + 8;
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              doc.text(`Total initial : ${formatCurrency(totalInitial)} — Prélevé : ${formatCurrency(totalPreleve)} — Restant : ${formatCurrency(totalRestant)} — Taux : ${tauxRecouvrement.toFixed(1)}%`, 14, y);
              printPDF(doc);
            }}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "État des SATD", subtitle: `${satds.length} dossiers — Recouvrement forcé` });
              autoTable(doc, {
                startY: 48,
                head: [["Référence", "Débiteur", "Montant", "Prélevé", "Reste", "Statut"]],
                body: satds.map(s => [s.reference, s.debiteur, formatCurrency(s.montantGlobal), formatCurrency(s.montantPreleve), formatCurrency(s.montantGlobal - s.montantPreleve), STATUT_SATD_CONFIG[s.statut]?.label || s.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 244, 248] },
                margin: { left: 10, right: 10 },
                columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
                styles: { fontSize: 8 },
              });
              const y = (doc as any).lastAutoTable.finalY + 8;
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              doc.text(`Total initial : ${formatCurrency(totalInitial)} — Prélevé : ${formatCurrency(totalPreleve)} — Restant : ${formatCurrency(totalRestant)} — Taux : ${tauxRecouvrement.toFixed(1)}%`, 14, y);
              savePDF(doc, `SATD_etat_${new Date().toISOString().split("T")[0]}.pdf`);
            }}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
            {/* Tiers */}
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
            {/* Nouvelle procédure */}
            <Button className="gradient-primary border-0" onClick={() => setOpenFormulaire(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle procédure
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Alertes prescription */}
      {prescriptionsProches > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {prescriptionsProches} procédure{prescriptionsProches > 1 ? "s" : ""} à risque de prescription (≤ 6 mois)
                </p>
                <p className="text-xs text-muted-foreground">Accélérez le recouvrement pour éviter la perte de créances.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <TabsTrigger value="poursuivre" className="text-destructive">⚖️ Poursuivre</TabsTrigger>
          <TabsTrigger value="relances">📧 Relances</TabsTrigger>
          <TabsTrigger value="surendettement">🏦 Surendettement</TabsTrigger>
          <TabsTrigger value="alertes_creances">🔔 Alertes créances</TabsTrigger>
          <TabsTrigger value="procedure">📋 Procédure</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
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

        {/* === POURSUIVRE UN DÉBITEUR === */}
        <TabsContent value="poursuivre" className="space-y-4 mt-4">
          <Card className="shadow-card border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="h-4 w-4 text-destructive" />
                Poursuivre un débiteur — Actions de recouvrement forcé
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Sélectionnez un dossier puis lancez l'action appropriée selon l'avancement.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const poursuivables = satds.filter(s => s.statut !== "termine" && s.statut !== "prescrit" && s.statut !== "irrecouv");
                if (poursuivables.length === 0) return (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun dossier en cours de recouvrement.</p>
                );
                return poursuivables.map(s => {
                  const etapeTypes = s.etapes.map(e => e.type);
                  const hasRelance1 = etapeTypes.includes("relance1");
                  const hasRelance2 = etapeTypes.includes("relance2");
                  const hasAvis = etapeTypes.includes("avis_poursuites");
                  const hasAutorisation = etapeTypes.includes("autorisation_ordonnateur");
                  const hasSatd = etapeTypes.includes("satd_emission");
                  const hasAR = etapeTypes.includes("satd_reception_ar");

                  let nextAction = "";
                  let nextActionKey = "";
                  let nextActionDescription = "";
                  let canPursue = true;
                  let blockedReason = "";

                  if (!hasRelance1) { nextAction = "Envoyer la 1ère relance amiable"; nextActionKey = "relance1"; nextActionDescription = "Courrier simple rappelant la dette."; }
                  else if (!hasRelance2) { nextAction = "Envoyer la 2ème relance (RAR)"; nextActionKey = "relance2"; nextActionDescription = "Courrier recommandé avec AR — preuve obligatoire."; }
                  else if (!hasAvis) { nextAction = "Envoyer l'avis avant poursuites (RAR)"; nextActionKey = "avis_poursuites"; nextActionDescription = "Dernier avertissement. Le débiteur a 30 jours."; }
                  else if (!hasAutorisation) { nextAction = "Demander l'autorisation de l'ordonnateur"; nextActionKey = "autorisation_ordonnateur"; nextActionDescription = "Le CE doit autoriser par écrit la poursuite."; }
                  else if (!s.tiersDetenteurId) { nextAction = "Identifier le tiers détenteur (FICOBA)"; nextActionKey = "ficoba"; nextActionDescription = "Consulter FICOBA via la DDFiP."; canPursue = false; blockedReason = "Aucun tiers assigné."; }
                  else if (!hasSatd) { nextAction = "🚨 ÉMETTRE LA SATD"; nextActionKey = "satd_emission"; nextActionDescription = "3 courriers RAR le MÊME JOUR."; }
                  else if (!hasAR) { nextAction = "Attente AR"; nextActionKey = "satd_reception_ar"; nextActionDescription = "Vérifier les 3 AR."; }
                  else { nextAction = "Suivre les prélèvements"; nextActionKey = "prelevement"; nextActionDescription = "Le tiers a 30 jours pour verser."; }

                  const tiers = tiersDetenteurs.find(t => t.id === s.tiersDetenteurId);
                  const restant = s.montantGlobal - s.montantPreleve;

                  return (
                    <div key={s.id} className="border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">{s.reference}</span>
                            <Badge variant="secondary" className={`text-[10px] ${STATUT_SATD_CONFIG[s.statut].color}`}>{STATUT_SATD_CONFIG[s.statut].label}</Badge>
                          </div>
                          <p className="text-sm font-semibold mt-1">{s.debiteur}</p>
                          <p className="text-xs text-muted-foreground">{s.debiteurAdresse}, {s.debiteurCP} {s.debiteurVille}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Reste à recouvrer</p>
                          <p className="font-mono text-lg font-bold text-destructive">{formatCurrency(restant)}</p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {[
                          { key: "relance1", label: "R1", done: hasRelance1 },
                          { key: "relance2", label: "R2", done: hasRelance2 },
                          { key: "avis", label: "Avis", done: hasAvis },
                          { key: "auto", label: "Autori.", done: hasAutorisation },
                          { key: "satd", label: "SATD", done: hasSatd },
                          { key: "ar", label: "AR", done: hasAR },
                        ].map(st => (
                          <div key={st.key} className={`flex-1 text-center py-1 rounded text-[10px] font-semibold ${st.done ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"}`}>
                            {st.done ? "✓" : ""} {st.label}
                          </div>
                        ))}
                      </div>

                      {tiers ? (
                        <div className="text-xs bg-muted/20 rounded p-2 flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>Tiers : <strong>{tiers.nom}</strong> ({TYPE_TIERS_LABELS[tiers.type]})</span>
                        </div>
                      ) : (
                        <div className="text-xs bg-warning/10 rounded p-2 flex items-center gap-2 text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Aucun tiers assigné</span>
                        </div>
                      )}

                      <div className={`rounded-lg p-3 ${canPursue ? "bg-primary/5 border border-primary/20" : "bg-warning/10 border border-warning/20"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold">{nextAction}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{nextActionDescription}</p>
                        {blockedReason && <p className="text-xs text-warning font-semibold ml-6 mt-1">⚠️ {blockedReason}</p>}
                        <div className="mt-2 ml-6 flex gap-2 flex-wrap">
                          {canPursue && (
                            <Button size="sm" className="text-xs h-7 gradient-primary border-0" onClick={() => {
                              const now = new Date().toISOString().split("T")[0];
                              const etape: EtapeProcedure = { type: nextActionKey as any, date: now, commentaire: `Action : ${nextAction}`, documentGenere: nextActionKey === "satd_emission" };
                              let ns = s.statut;
                              if (nextActionKey === "avis_poursuites") ns = "avis_poursuites";
                              if (nextActionKey === "autorisation_ordonnateur") ns = "autorisation";
                              if (nextActionKey === "satd_emission") ns = "emise";
                              if (nextActionKey === "satd_reception_ar") ns = "en_cours";
                              setSatds(prev => prev.map(x => x.id === s.id ? { ...x, etapes: [...x.etapes, etape], statut: ns, autorisationOrdonnateur: nextActionKey === "autorisation_ordonnateur" ? true : x.autorisationOrdonnateur } : x));
                            }}>
                              <Gavel className="h-3 w-3 mr-1" /> Exécuter
                            </Button>
                          )}
                          {!s.tiersDetenteurId && (
                            <Select onValueChange={v => setSatds(prev => prev.map(x => x.id === s.id ? { ...x, tiersDetenteurId: v } : x))}>
                              <SelectTrigger className="h-7 text-xs w-[250px]"><SelectValue placeholder="Assigner un tiers..." /></SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {tiersDetenteurs.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.nom} — {TYPE_TIERS_LABELS[t.type]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === WORKFLOW === */}
        <TabsContent value="workflow" className="space-y-4 mt-4">
          {selectedSatd ? (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {selectedSatd.reference}
                    <Badge variant="secondary" className={`text-[10px] ${STATUT_SATD_CONFIG[selectedSatd.statut].color}`}>{STATUT_SATD_CONFIG[selectedSatd.statut].label}</Badge>
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

                {selectedSatd.statut !== "termine" && (
                  <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                    <p className="text-xs font-semibold mb-2">Ajouter une étape</p>
                    <div className="flex gap-2 items-end flex-wrap">
                      <div>
                        <Label className="text-[10px]">Type</Label>
                        <Select value={newEtape.type} onValueChange={(v: any) => setNewEtape({ ...newEtape, type: v })}>
                          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(ETAPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-[10px]">Date</Label><Input type="date" className="h-8 text-xs w-[140px]" value={newEtape.date} onChange={e => setNewEtape({ ...newEtape, date: e.target.value })} /></div>
                      <div className="flex-1"><Label className="text-[10px]">Commentaire</Label><Input className="h-8 text-xs" value={newEtape.commentaire} onChange={e => setNewEtape({ ...newEtape, commentaire: e.target.value })} /></div>
                      <Button size="sm" onClick={handleAddEtape} className="h-8 gradient-primary border-0 text-xs">Ajouter</Button>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />
                <p className="text-xs font-semibold mb-2">Prélèvements ({selectedSatd.prelevements.length})</p>
                {selectedSatd.prelevements.length > 0 && (
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Référence</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
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
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Sélectionnez une procédure dans l'onglet <strong>Registre</strong> pour suivre son workflow.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === RELANCES === */}
        <TabsContent value="relances" className="mt-4">
          <SatdRelancesTab />
        </TabsContent>

        {/* === SURENDETTEMENT === */}
        <TabsContent value="surendettement" className="mt-4">
          <SatdSurendettementTab />
        </TabsContent>

        {/* === ALERTES CRÉANCES === */}
        <TabsContent value="alertes_creances" className="mt-4">
          <SatdAlertesCreancesTab />
        </TabsContent>

        {/* === PROCEDURE === */}
        <TabsContent value="procedure" className="mt-4">
          <SatdProcedure
            satd={selectedSatd}
            onGenerateDocument={(satd, docType) => {}}
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

        <TabsContent value="documents" className="mt-4">
          <SatdDocuments satds={satds} tiers={tiersDetenteurs} />
        </TabsContent>

        <TabsContent value="statistiques" className="mt-4">
          <SatdStats satds={satds} tiers={tiersDetenteurs} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SatdFormulaire
        open={openFormulaire}
        onOpenChange={setOpenFormulaire}
        tiersDetenteurs={tiersDetenteurs}
        onCreated={(satd) => setSatds(prev => [...prev, satd])}
        existingCount={satds.length}
      />
      <SatdCalculateur open={openCalc} onOpenChange={setOpenCalc} />
      <SatdAssistant open={openAssistant} onOpenChange={setOpenAssistant} context={assistantCtx} />
    </div>
  );
};

export default SATD;
