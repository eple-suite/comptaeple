import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, Users, Euro, FileText, Search, CheckCircle2, Clock, XCircle, Eye, AlertTriangle, Wallet, Calendar, ChevronDown, ChevronUp, Download, Printer } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import {
  DemandeAide, Commission, Budget, Eleve,
  mockDemandes, mockCommissions, mockBudgets, mockEleves,
  NATURES_AIDE, TYPE_LABELS, STATUT_CONFIG, PIECES_REQUISES,
} from "./fonds-sociaux/types";
import FondsSociauxBudget from "./fonds-sociaux/FondsSociauxBudget";
import FondsSociauxCommissions from "./fonds-sociaux/FondsSociauxCommissions";
import FondsSociauxDocuments from "./fonds-sociaux/FondsSociauxDocuments";
import FondsSociauxStats from "./fonds-sociaux/FondsSociauxStats";
import FondsSociauxProcedure from "./fonds-sociaux/FondsSociauxProcedure";

const FondsSociaux = () => {
  const [demandes, setDemandes] = useState<DemandeAide[]>(mockDemandes);
  const [commissions, setCommissions] = useState<Commission[]>(mockCommissions);
  const [budgets] = useState<Budget[]>(mockBudgets);
  const [open, setOpen] = useState(false);
  const [detailDemande, setDetailDemande] = useState<DemandeAide | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterTrimestre, setFilterTrimestre] = useState("all");
  const [search, setSearch] = useState("");

  // Form state
  const [form, setForm] = useState({
    eleveId: "", type: "FSL" as DemandeAide["type"], nature: "restauration",
    montantDemande: "", dateDepot: "", dateLimite: "", commissionId: "",
    motifDetaille: "", commentaireAS: "", commentaireGestion: "",
    trimestre: "T1" as DemandeAide["trimestre"], serviceRestauration: false,
    piecesFournies: [] as string[],
  });

  const filtered = useMemo(() => {
    return demandes.filter(d => {
      if (filterType !== "all" && d.type !== filterType) return false;
      if (filterStatut !== "all" && d.statut !== filterStatut) return false;
      if (filterTrimestre !== "all" && d.trimestre !== filterTrimestre) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!d.eleve.nom.toLowerCase().includes(s) && !d.eleve.prenom.toLowerCase().includes(s) && !d.motifDetaille.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [demandes, filterType, filterStatut, filterTrimestre, search]);

  // KPIs
  const accordes = demandes.filter(d => d.statut === "accorde" || d.statut === "verse");
  const totalVerse = accordes.reduce((s, d) => s + d.montantAccorde, 0);
  const enInstruction = demandes.filter(d => d.statut === "instruction" || d.statut === "commission");
  const totalEnAttente = enInstruction.reduce((s, d) => s + d.montantDemande, 0);
  const nbBeneficiaires = new Set(accordes.map(d => d.eleveId)).size;
  const tauxAcceptation = demandes.length > 0 ? ((accordes.length / demandes.length) * 100) : 0;
  const montantMoyen = nbBeneficiaires > 0 ? totalVerse / nbBeneficiaires : 0;
  const totalDispo = budgets.reduce((s, b) => s + b.totalDisponible, 0);
  const totalReste = budgets.reduce((s, b) => s + b.reste, 0);

  const handleAdd = () => {
    const eleve = mockEleves.find(e => e.id === form.eleveId);
    if (!eleve) return;
    const newDemande: DemandeAide = {
      id: `d${Date.now()}`, eleveId: form.eleveId, eleve,
      type: form.type, nature: form.nature,
      montantDemande: Number(form.montantDemande), montantAccorde: 0,
      dateDepot: form.dateDepot || new Date().toISOString().split("T")[0],
      dateLimite: form.dateLimite, commissionId: form.commissionId,
      statut: "instruction", motifDetaille: form.motifDetaille, motifRefus: "",
      piecesFournies: form.piecesFournies, piecesManquantes: PIECES_REQUISES.filter(p => !form.piecesFournies.includes(p)),
      commentaireAS: form.commentaireAS, commentaireGestion: form.commentaireGestion,
      numeroDecision: "", dateVersement: "", mandatRef: "",
      serviceRestauration: form.serviceRestauration, trimestre: form.trimestre,
    };
    setDemandes([...demandes, newDemande]);
    setOpen(false);
    setForm({ eleveId: "", type: "FSL", nature: "restauration", montantDemande: "", dateDepot: "", dateLimite: "", commissionId: "", motifDetaille: "", commentaireAS: "", commentaireGestion: "", trimestre: "T1", serviceRestauration: false, piecesFournies: [] });
  };

  const handleUpdateDemande = (updated: DemandeAide) => {
    setDemandes(demandes.map(d => d.id === updated.id ? updated : d));
  };

  const handleChangeStatut = (id: string, newStatut: DemandeAide["statut"]) => {
    setDemandes(demandes.map(d => {
      if (d.id !== id) return d;
      const numDecision = newStatut === "accorde" || newStatut === "verse"
        ? `${d.type}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`
        : d.numeroDecision;
      return {
        ...d, statut: newStatut, numeroDecision: numDecision,
        montantAccorde: newStatut === "accorde" || newStatut === "verse" ? d.montantDemande : 0,
        dateVersement: newStatut === "verse" ? new Date().toISOString().split("T")[0] : d.dateVersement,
      };
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Fonds sociaux</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestion complète des aides — FSL, FSC, FSE, aides exceptionnelles CE</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "Fonds sociaux — État des demandes", subtitle: `${demandes.length} demandes — Exercice ${new Date().getFullYear()}` });
              autoTable(doc, {
                startY: 48,
                head: [["Élève", "Type", "Nature", "Demandé", "Accordé", "Statut"]],
                body: demandes.map(d => [`${d.eleve.nom} ${d.eleve.prenom}`, d.type, d.nature, formatCurrency(d.montantDemande), formatCurrency(d.montantAccorde), STATUT_CONFIG[d.statut]?.label || d.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 244, 248] },
                margin: { left: 10, right: 10 },
                columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
                styles: { fontSize: 8 },
              });
              const y = (doc as any).lastAutoTable.finalY + 8;
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              doc.text(`Total versé : ${formatCurrency(totalVerse)} — En attente : ${formatCurrency(totalEnAttente)} — ${nbBeneficiaires} bénéficiaires — Budget restant : ${formatCurrency(totalReste)}`, 14, y, { maxWidth: 180 });
              savePDF(doc, `Fonds_sociaux_${new Date().toISOString().split("T")[0]}.pdf`);
            }}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const doc = createStyledPDF({ title: "Fonds sociaux — État des demandes", subtitle: `${demandes.length} demandes — Exercice ${new Date().getFullYear()}` });
              autoTable(doc, {
                startY: 48,
                head: [["Élève", "Type", "Nature", "Demandé", "Accordé", "Statut"]],
                body: demandes.map(d => [`${d.eleve.nom} ${d.eleve.prenom}`, d.type, d.nature, formatCurrency(d.montantDemande), formatCurrency(d.montantAccorde), STATUT_CONFIG[d.statut]?.label || d.statut]),
                headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 244, 248] },
                margin: { left: 10, right: 10 },
                styles: { fontSize: 8 },
              });
              printPDF(doc);
            }}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Nouvelle demande</Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Enregistrer une demande d'aide sociale</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Élève */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Élève</Label>
                    <Select value={form.eleveId} onValueChange={v => setForm({ ...form, eleveId: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un élève..." /></SelectTrigger>
                      <SelectContent>
                        {mockEleves.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nom} {e.prenom} — {e.classe} ({e.regime === "dp" ? "DP" : e.regime === "interne" ? "INT" : "EXT"})
                            {e.boursier ? ` • Bourse éch.${e.echelonBourse}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.eleveId && (() => {
                    const el = mockEleves.find(e => e.id === form.eleveId);
                    if (!el) return null;
                    return (
                      <div className="col-span-2 bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                        <p><strong>Situation :</strong> {el.situationFamiliale}</p>
                        <p><strong>Responsable :</strong> {el.responsableLegal} — {el.telephone}</p>
                        <p><strong>QF :</strong> {el.quotientFamilial} {el.boursier ? `• Boursier échelon ${el.echelonBourse}` : "• Non boursier"}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Type et nature */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Type de fonds</Label>
                    <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nature de l'aide</Label>
                    <Select value={form.nature} onValueChange={v => setForm({ ...form, nature: v, serviceRestauration: v === "restauration" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(NATURES_AIDE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Trimestre</Label>
                    <Select value={form.trimestre} onValueChange={(v: any) => setForm({ ...form, trimestre: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T1">Trimestre 1</SelectItem>
                        <SelectItem value="T2">Trimestre 2</SelectItem>
                        <SelectItem value="T3">Trimestre 3</SelectItem>
                        <SelectItem value="annuel">Année entière</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Montant et dates */}
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Montant demandé (€)</Label><Input type="number" value={form.montantDemande} onChange={e => setForm({ ...form, montantDemande: e.target.value })} /></div>
                  <div><Label>Date dépôt</Label><Input type="date" value={form.dateDepot} onChange={e => setForm({ ...form, dateDepot: e.target.value })} /></div>
                  <div>
                    <Label>Commission prévue</Label>
                    <Select value={form.commissionId} onValueChange={v => setForm({ ...form, commissionId: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        {commissions.filter(c => c.statut === "planifiee" || c.statut === "convoquee").map(c => (
                          <SelectItem key={c.id} value={c.id}>{new Date(c.date).toLocaleDateString("fr-FR")} ({c.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Motif */}
                <div><Label>Motif détaillé</Label><Textarea value={form.motifDetaille} onChange={e => setForm({ ...form, motifDetaille: e.target.value })} rows={2} placeholder="Décrivez la situation et le besoin..." /></div>
                <div><Label>Observation AS / CPE</Label><Input value={form.commentaireAS} onChange={e => setForm({ ...form, commentaireAS: e.target.value })} placeholder="Avis de l'assistante sociale ou du CPE" /></div>

                {/* Pièces */}
                <div>
                  <Label className="mb-2 block">Pièces fournies</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PIECES_REQUISES.map(p => (
                      <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={form.piecesFournies.includes(p)}
                          onCheckedChange={(checked) => {
                            setForm({
                              ...form,
                              piecesFournies: checked ? [...form.piecesFournies, p] : form.piecesFournies.filter(x => x !== p),
                            });
                          }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                  {form.piecesFournies.length < 3 && (
                    <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Dossier incomplet — {PIECES_REQUISES.length - form.piecesFournies.length} pièce(s) manquante(s)
                    </p>
                  )}
                </div>

                <Button onClick={handleAdd} disabled={!form.eleveId || !form.montantDemande} className="w-full gradient-primary border-0">
                  Enregistrer la demande
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total versé" value={formatCurrency(totalVerse)} icon={Euro} variant="success" />
        <KpiCard title="En instruction" value={`${enInstruction.length} dossier(s)`} subtitle={formatCurrency(totalEnAttente)} icon={Clock} variant="warning" />
        <KpiCard title="Bénéficiaires" value={`${nbBeneficiaires}`} icon={Users} variant="primary" />
        <KpiCard title="Taux acceptation" value={`${tauxAcceptation.toFixed(0)}%`} icon={CheckCircle2} variant="success" />
        <KpiCard title="Aide moyenne" value={formatCurrency(montantMoyen)} icon={Heart} variant="primary" />
        <KpiCard title="Crédits restants" value={formatCurrency(totalReste)} subtitle={`sur ${formatCurrency(totalDispo)}`} icon={Wallet} variant="default" />
      </div>

      <Tabs defaultValue="dossiers">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dossiers">Dossiers ({filtered.length})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
          <TabsTrigger value="budget">Suivi budgétaire</TabsTrigger>
          <TabsTrigger value="procedure">📋 Procédure & Barème</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        {/* === DOSSIERS === */}
        <TabsContent value="dossiers" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un élève ou motif..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {Object.keys(TYPE_LABELS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(STATUT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTrimestre} onValueChange={setFilterTrimestre}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous trim.</SelectItem>
                <SelectItem value="T1">T1</SelectItem>
                <SelectItem value="T2">T2</SelectItem>
                <SelectItem value="T3">T3</SelectItem>
                <SelectItem value="annuel">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° décision</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Trim.</TableHead>
                    <TableHead className="text-right">Demandé</TableHead>
                    <TableHead className="text-right">Accordé</TableHead>
                    <TableHead>Pièces</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailDemande(d)}>
                      <TableCell className="font-mono text-xs text-primary font-semibold">{d.numeroDecision || "—"}</TableCell>
                      <TableCell className="font-medium text-sm">{d.eleve.nom} {d.eleve.prenom}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.eleve.classe}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{d.type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{NATURES_AIDE[d.nature]?.split(" ")[0] || d.nature}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.trimestre}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(d.montantDemande)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{d.montantAccorde > 0 ? formatCurrency(d.montantAccorde) : "—"}</TableCell>
                      <TableCell>
                        {d.piecesManquantes.length > 0 ? (
                          <Badge variant="secondary" className="text-[9px] bg-warning/10 text-warning border-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{d.piecesManquantes.length} manq.
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] bg-success/10 text-success border-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Complet
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[d.statut].color}`}>
                          {STATUT_CONFIG[d.statut].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {d.statut === "instruction" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-success" onClick={() => handleChangeStatut(d.id, "accorde")}>
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                          {d.statut === "instruction" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive" onClick={() => handleChangeStatut(d.id, "refuse")}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {d.statut === "accorde" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-success" onClick={() => handleChangeStatut(d.id, "verse")}>
                              <Euro className="h-3 w-3 mr-0.5" />Verser
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDemandes(demandes.filter(x => x.id !== d.id))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === COMMISSIONS === */}
        <TabsContent value="commissions" className="mt-4">
          <FondsSociauxCommissions
            commissions={commissions}
            demandes={demandes}
            onUpdateCommission={c => setCommissions(commissions.map(x => x.id === c.id ? c : x))}
            onAddCommission={c => setCommissions([...commissions, c])}
            onUpdateDemande={handleUpdateDemande}
          />
        </TabsContent>

        {/* === BUDGET === */}
        <TabsContent value="budget" className="mt-4">
          <FondsSociauxBudget budgets={budgets} demandes={demandes} />
        </TabsContent>

        {/* === PROCEDURE === */}
        <TabsContent value="procedure" className="mt-4">
          <FondsSociauxProcedure demandes={demandes} />
        </TabsContent>

        {/* === DOCUMENTS === */}
        <TabsContent value="documents" className="mt-4">
          <FondsSociauxDocuments demandes={demandes} commissions={commissions} budgets={budgets} />
        </TabsContent>

        {/* === STATISTIQUES === */}
        <TabsContent value="statistiques" className="mt-4">
          <FondsSociauxStats demandes={demandes} budgets={budgets} commissions={commissions} />
        </TabsContent>
      </Tabs>

      {/* Détail dossier en Dialog */}
      <Dialog open={!!detailDemande} onOpenChange={() => setDetailDemande(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailDemande && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Dossier {detailDemande.numeroDecision || detailDemande.id}
                  <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[detailDemande.statut].color}`}>
                    {STATUT_CONFIG[detailDemande.statut].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Élève */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Élève</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>{detailDemande.eleve.prenom} {detailDemande.eleve.nom}</strong></p>
                      <p>{detailDemande.eleve.classe} — {detailDemande.eleve.regime === "dp" ? "Demi-pensionnaire" : detailDemande.eleve.regime === "interne" ? "Interne" : "Externe"}</p>
                      <p className="text-muted-foreground">{detailDemande.eleve.situationFamiliale}</p>
                      <p className="text-muted-foreground">QF : {detailDemande.eleve.quotientFamilial} {detailDemande.eleve.boursier ? `• Boursier éch.${detailDemande.eleve.echelonBourse}` : ""}</p>
                      <p className="text-muted-foreground">{detailDemande.eleve.responsableLegal}</p>
                      <p className="text-muted-foreground">{detailDemande.eleve.telephone} — {detailDemande.eleve.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Demande */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Demande</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Type :</strong> {TYPE_LABELS[detailDemande.type]}</p>
                      <p><strong>Nature :</strong> {NATURES_AIDE[detailDemande.nature]}</p>
                      <p><strong>Trimestre :</strong> {detailDemande.trimestre}</p>
                      <p><strong>Dépôt :</strong> {new Date(detailDemande.dateDepot).toLocaleDateString("fr-FR")}</p>
                      <p><strong>Demandé :</strong> {formatCurrency(detailDemande.montantDemande)}</p>
                      <p><strong>Accordé :</strong> {detailDemande.montantAccorde > 0 ? formatCurrency(detailDemande.montantAccorde) : "—"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2"><strong>Motif :</strong> {detailDemande.motifDetaille}</p>
                    {detailDemande.motifRefus && <p className="text-sm text-destructive mt-1"><strong>Motif refus :</strong> {detailDemande.motifRefus}</p>}
                  </CardContent>
                </Card>

                {/* Pièces */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pièces du dossier</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {PIECES_REQUISES.map(p => (
                        <div key={p} className="flex items-center gap-2 text-xs">
                          {detailDemande.piecesFournies.includes(p) ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className={detailDemande.piecesFournies.includes(p) ? "" : "text-destructive"}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Observations */}
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Observations</h4>
                    {detailDemande.commentaireAS && <p className="text-sm"><strong>AS / CPE :</strong> {detailDemande.commentaireAS}</p>}
                    {detailDemande.commentaireGestion && <p className="text-sm"><strong>Gestion :</strong> {detailDemande.commentaireGestion}</p>}
                    {detailDemande.mandatRef && <p className="text-sm"><strong>Mandat :</strong> {detailDemande.mandatRef}</p>}
                    {detailDemande.dateVersement && <p className="text-sm"><strong>Date versement :</strong> {new Date(detailDemande.dateVersement).toLocaleDateString("fr-FR")}</p>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FondsSociaux;
