import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bus, Plus, Users, Euro, CalendarDays, MapPin, Trash2, Eye, ShieldAlert, Download, ChevronRight, CheckCircle2, XCircle, Landmark, Gift, Printer, AlertTriangle, Target, LayoutGrid, List } from "lucide-react";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { evaluerSeuilsMarchesVoyages } from "@/lib/regulatoryKnowledge";
import { Voyage, initialVoyages, STATUT_CONFIG, CATEGORIES_PRESTATIONS, getRecommandation, calculerPointMort } from "./voyages/types";
import { cumulerSeuils, evaluerSeuilCCP, SEUIL_CCP } from "@/lib/voyageBudgetEngine";
import { VoyageCard } from "./voyages/VoyageCard";
import { VoyageCreationWizard } from "./voyages/VoyageCreationWizard";
import { VoyageBudgetWidget } from "./voyages/VoyageBudgetWidget";
import { VoyageDocumentsChecklist } from "./voyages/VoyageDocumentsChecklist";
import { VoyageElevesTab } from "./voyages/VoyageElevesTab";
import { VoyageMarchesMoniteur } from "./voyages/VoyageMarchesMoniteur";
import { VoyageBilanTab } from "./voyages/VoyageBilanTab";
import { VoyageDocumentsJuridiqueTab } from "./voyages/VoyageDocumentsJuridiqueTab";
import { VoyageActesCATab } from "./voyages/VoyageActesCATab";
import { VoyageSubventionsTab } from "./voyages/VoyageSubventionsTab";
import { VoyageParticipantsTab } from "./voyages/VoyageParticipantsTab";
import { VoyageRecettesTab } from "./voyages/VoyageRecettesTab";

const Voyages = () => {
  const [voyages, setVoyages] = useState<Voyage[]>(initialVoyages);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedVoyageId, setSelectedVoyageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tableau-bord");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  const alertesMarchesPublics = useMemo(() => evaluerSeuilsMarchesVoyages(voyagesActifs), [voyagesActifs]);

  // CCP cumul annuel — bannière permanente
  const seuilsCCP = useMemo(() => {
    const cumuls = cumulerSeuils(voyagesActifs);
    const alertes = Object.entries(cumuls)
      .map(([cat, montant]) => ({ cat, montant, ...evaluerSeuilCCP(montant) }))
      .filter(a => a.niveau !== 'ok');
    const totalGeneral = Object.values(cumuls).reduce((s, v) => s + v, 0);
    return { alertes, totalGeneral, seuilGlobalFranchi: totalGeneral >= SEUIL_CCP.SANS_PUBLICITE };
  }, [voyagesActifs]);

  // Collecte globale familles
  const collecteGlobale = useMemo(() => {
    const totalRecu = voyagesActifs.reduce((s, v) => s + v.eleves.reduce((ss, e) => ss + e.paiements.reduce((sss, p) => sss + p.montant, 0), 0), 0);
    const totalDu = totaux.familles;
    return { totalRecu, totalDu, pct: totalDu > 0 ? (totalRecu / totalDu) * 100 : 0 };
  }, [voyagesActifs, totaux.familles]);

  // Impayés
  const impayes = useMemo(() => {
    return voyagesActifs.reduce((s, v) => s + v.eleves.filter(e => {
      const paye = e.paiements.reduce((ss, p) => ss + p.montant, 0);
      return paye < e.participationDue && paye === 0;
    }).length, 0);
  }, [voyagesActifs]);

  const handleCreateVoyage = (voyage: Voyage) => {
    setVoyages([...voyages, voyage]);
  };

  const handleDelete = (id: string) => setVoyages(voyages.filter(v => v.id !== id));

  const handleUpdateVoyage = (updated: Voyage) => {
    setVoyages(voyages.map(v => v.id === updated.id ? updated : v));
  };

  const handleStatutChange = (id: string, statut: Voyage["statut"]) => {
    setVoyages(voyages.map(v => v.id === id ? { ...v, statut } : v));
  };

  const coutMoyenEleve = totaux.eleves > 0 ? totaux.budget / totaux.eleves : 0;
  const statutSteps = ["projet", "vote_ca", "planifie", "valide", "realise", "bilan"] as const;

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
            <Button className="gradient-primary border-0" onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nouveau voyage
            </Button>
          </div>
        </div>
      </motion.div>

      <VoyageCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreateVoyage={handleCreateVoyage} />

      {/* ═══ BANNIÈRE PERMANENTE CCP — Seuils marchés publics ═══ */}
      {seuilsCCP.alertes.length > 0 && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-bold text-sm">
            ⚖️ ALERTE MARCHÉS PUBLICS — Seuil de procédure formalisée atteint
          </AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>
              Le cumul annuel des prestations ({formatCurrency(seuilsCCP.totalGeneral)} HT) franchit un ou plusieurs seuils du Code de la Commande Publique.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {seuilsCCP.alertes.map(a => (
                <Badge key={a.cat} variant="destructive" className="text-xs">
                  {a.cat} : {formatCurrency(a.montant)} — {a.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs mt-1 font-semibold">
              Préconisation : Allotissement obligatoire ou mise en concurrence spécifique.
              Informez le Secrétaire Général et l'Agent Comptable.
            </p>
          </AlertDescription>
        </Alert>
      )}

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
          {selectedVoyage && <TabsTrigger value="recettes">🏦 Recettes Op@le</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="documents">📄 Documents juridiques</TabsTrigger>}
          {selectedVoyage && <TabsTrigger value="bilan">📋 Bilan financier</TabsTrigger>}
        </TabsList>

        {/* TAB: Tableau de bord */}
        <TabsContent value="tableau-bord" className="space-y-5">
          {/* KPIs enrichis */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <KpiCard title="Voyages actifs" value={String(voyagesActifs.length)} subtitle={`${voyages.length} total`} icon={Bus} variant="primary" />
            <KpiCard title="Budget total" value={formatCurrency(totaux.budget)} icon={Euro} variant="primary" />
            <KpiCard title="Part familles" value={formatCurrency(totaux.familles)} subtitle={totaux.budget > 0 ? `${((totaux.familles / totaux.budget) * 100).toFixed(0)}%` : "—"} icon={Users} variant="success" />
            <KpiCard title="Subventions" value={formatCurrency(totaux.subventions)} icon={Gift} variant="default" />
            <KpiCard title="Charge étab." value={formatCurrency(totaux.charge)} icon={Bus} variant="warning" />
            <KpiCard title="Coût / élève" value={formatCurrency(coutMoyenEleve)} subtitle={`${totaux.eleves} élèves`} icon={Users} variant="primary" />
            <KpiCard title="Conformité" value={`${checklistGlobal.pct.toFixed(0)}%`} subtitle={`${checklistGlobal.done}/${checklistGlobal.total}`} icon={CheckCircle2} variant={checklistGlobal.pct >= 80 ? "success" : "warning"} />
          </div>

          {/* Collecte + Impayés */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4 flex items-center gap-4">
                <ProgressRing value={collecteGlobale.totalRecu} max={collecteGlobale.totalDu} size={56} />
                <div>
                  <p className="text-sm font-semibold">Collecte familles</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(collecteGlobale.totalRecu)} collectés sur {formatCurrency(collecteGlobale.totalDu)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {impayes > 0 && (
              <Card className="shadow-card border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">{impayes} impayé{impayes > 1 ? "s" : ""} nécessitant une action</p>
                    <p className="text-xs text-muted-foreground">Certaines familles n'ont pas réglé leur participation dans les délais.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Alertes marchés publics */}
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

          {/* Toggle vue grille / liste */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Voyages ({voyagesActifs.length})</h2>
            <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
              <Button size="sm" variant={viewMode === "grid" ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant={viewMode === "table" ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => setViewMode("table")}>
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Vue Grille */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voyages.map(v => (
                <VoyageCard
                  key={v.id}
                  voyage={v}
                  onClick={() => { setSelectedVoyageId(v.id); setActiveTab("bilan"); }}
                />
              ))}
            </div>
          ) : (
            /* Vue Table */
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead>Classe / Référent</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead className="text-center">Participants</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-center">Point mort</TableHead>
                      <TableHead className="text-center">Conformité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voyages.map((v) => {
                      const step = STATUT_CONFIG[v.statut].step;
                      const couverture = v.budgetTotal > 0 ? ((v.participationFamilles + v.subventions + v.autofinancement) / v.budgetTotal) * 100 : 0;
                      const checkDone = v.checklist.filter(c => c.fait).length;
                      const checkTotal = v.checklist.length;
                      const checkPct = checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0;
                      const pm = calculerPointMort(v);
                      return (
                        <TableRow key={v.id} className={v.statut === "annule" ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="font-medium text-sm flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {v.intitule || v.destination}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{v.destination}, {v.pays}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{v.classe}</div>
                            <div className="text-[10px] text-muted-foreground">{v.professeur}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.dateDepart} → {v.dateRetour}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold">{v.nbEleves}</span>
                            <span className="text-[10px] text-muted-foreground ml-0.5">+{v.nbAccompagnateurs}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-sm font-semibold">{formatCurrency(v.budgetTotal)}</div>
                            <div className="text-[10px] text-muted-foreground">{couverture.toFixed(0)}% couvert</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`text-xs font-semibold ${pm.estViable ? "text-success" : "text-destructive"}`}>
                              {pm.pointMort} él.
                            </div>
                            <div className="text-[9px] text-muted-foreground">{pm.estViable ? `+${pm.marge}` : pm.marge}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Progress value={checkPct} className={`h-1.5 w-16 ${checkPct >= 100 ? "[&>div]:bg-success" : checkPct >= 50 ? "" : "[&>div]:bg-warning"}`} />
                              <span className="text-[9px] text-muted-foreground">{checkDone}/{checkTotal}</span>
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
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Actes CA" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("actes-ca"); }}>
                                <Landmark className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Participants" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("participants"); }}>
                                <Users className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Bilan" onClick={() => { setSelectedVoyageId(v.id); setActiveTab("bilan"); }}>
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
          )}

          {/* Widgets latéraux quand un voyage est sélectionné */}
          {selectedVoyage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VoyageBudgetWidget voyage={selectedVoyage} />
              <VoyageDocumentsChecklist voyage={selectedVoyage} />
            </div>
          )}

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
                      <span className="font-medium">{v.intitule || v.destination} <span className="text-muted-foreground text-xs">({v.classe})</span></span>
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
          <VoyageMarchesMoniteur voyages={voyages} exercice={new Date().getFullYear()} />
        </TabsContent>

        {/* TAB: Actes CA */}
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

        {/* TAB: Documents juridiques */}
        <TabsContent value="documents">
          {selectedVoyage ? (
            <VoyageDocumentsJuridiqueTab voyage={selectedVoyage} />
          ) : (
            <p className="text-muted-foreground text-sm">Sélectionnez un voyage pour accéder au pack juridique.</p>
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
