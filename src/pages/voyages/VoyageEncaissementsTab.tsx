/**
 * Onglet Encaissements — Campagnes de collecte
 * Gestion des campagnes d'encaissement par voyage, suivi des versements,
 * état par élève, génération de bordereaux de remise.
 */
import { useState, useMemo } from "react";
import { Euro, Plus, CalendarDays, CheckCircle2, XCircle, Download, Printer, Clock, CreditCard, Banknote, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Voyage, Eleve, Paiement, MODES_PAIEMENT } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { toast } from "sonner";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";

interface CampagneEncaissement {
  id: string;
  numero: number;
  dateCampagne: string;
  dateEcheance: string;
  montantAttendu: number;
  libelle: string;
  statut: "planifiee" | "en_cours" | "cloturee";
}

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

export const VoyageEncaissementsTab = ({ voyage, onUpdateVoyage }: Props) => {
  const [campagnes, setCampagnes] = useState<CampagneEncaissement[]>(() => {
    // Générer des campagnes depuis l'échéancier existant
    return voyage.echeances.map((e, i) => ({
      id: `camp-${i}`,
      numero: i + 1,
      dateCampagne: e.date,
      dateEcheance: e.date,
      montantAttendu: Math.round(voyage.participationFamilles * e.pourcentage / 100),
      libelle: `Versement n°${i + 1} — ${e.pourcentage}%`,
      statut: "en_cours" as const,
    }));
  });

  const [showNewCampagne, setShowNewCampagne] = useState(false);
  const [newCampagne, setNewCampagne] = useState({ dateCampagne: "", dateEcheance: "", montantAttendu: 0, libelle: "" });
  const [selectedCampagneId, setSelectedCampagneId] = useState<string | null>(campagnes[0]?.id || null);
  const [showQuickPay, setShowQuickPay] = useState<string | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState("");
  const [quickPayMode, setQuickPayMode] = useState<Paiement["mode"]>("cheque");

  const stats = useMemo(() => {
    const totalDu = voyage.eleves.reduce((s, e) => s + e.participationDue, 0);
    const totalRecu = voyage.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    const nbSoldes = voyage.eleves.filter(e => e.paiements.reduce((s, p) => s + p.montant, 0) >= e.participationDue).length;
    const nbImpayes = voyage.eleves.filter(e => e.paiements.length === 0).length;
    const byMode = voyage.eleves.flatMap(e => e.paiements).reduce((acc, p) => {
      acc[p.mode] = (acc[p.mode] || 0) + p.montant;
      return acc;
    }, {} as Record<string, number>);
    return { totalDu, totalRecu, reste: totalDu - totalRecu, nbSoldes, nbImpayes, tauxRecouvrement: totalDu > 0 ? (totalRecu / totalDu) * 100 : 0, byMode };
  }, [voyage.eleves]);

  // État par élève pour la campagne sélectionnée
  const eleveStates = useMemo(() => {
    return voyage.eleves.map(e => {
      const totalPaye = e.paiements.reduce((s, p) => s + p.montant, 0);
      const reste = e.participationDue - totalPaye;
      const statut = totalPaye >= e.participationDue ? "solde" : totalPaye > 0 ? "partiel" : "impaye";
      const lastPaiement = e.paiements.length > 0 ? e.paiements[e.paiements.length - 1] : null;
      return { ...e, totalPaye, reste, statut, lastPaiement };
    });
  }, [voyage.eleves]);

  const handleAddCampagne = () => {
    if (!newCampagne.dateCampagne || newCampagne.montantAttendu <= 0) return;
    const nc: CampagneEncaissement = {
      id: `camp-${Date.now()}`,
      numero: campagnes.length + 1,
      ...newCampagne,
      statut: "planifiee",
    };
    setCampagnes([...campagnes, nc]);
    setNewCampagne({ dateCampagne: "", dateEcheance: "", montantAttendu: 0, libelle: "" });
    setShowNewCampagne(false);
    toast.success(`Campagne n°${nc.numero} créée`);
  };

  const handleQuickPay = (eleveId: string) => {
    const amount = parseFloat(quickPayAmount);
    if (isNaN(amount) || amount <= 0) return;
    const updatedEleves = voyage.eleves.map(e => {
      if (e.id !== eleveId) return e;
      const newPaiement: Paiement = {
        id: `p-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        montant: amount,
        mode: quickPayMode,
        reference: `V${selectedCampagneId?.replace("camp-", "")}-${Date.now().toString(36).toUpperCase()}`,
        encaisse: false,
      };
      return { ...e, paiements: [...e.paiements, newPaiement] };
    });
    onUpdateVoyage({ ...voyage, eleves: updatedEleves });
    setShowQuickPay(null);
    setQuickPayAmount("");
    toast.success("Encaissement enregistré");
  };

  const generateBordereauPDF = () => {
    const doc = createStyledPDF({ title: "Bordereau de remise", subtitle: `${voyage.intitule || voyage.destination} — ${voyage.classe}` });
    const nonEncaisses = voyage.eleves.flatMap(e =>
      e.paiements.filter(p => !p.encaisse).map(p => ({
        eleve: `${e.nom} ${e.prenom}`,
        ...p,
      }))
    );
    autoTable(doc, {
      startY: 52,
      head: [["Élève", "Date", "Montant", "Mode", "Référence"]],
      body: nonEncaisses.map(p => [p.eleve, p.date, formatCurrency(p.montant), MODES_PAIEMENT[p.mode], p.reference]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      foot: [["", "", formatCurrency(nonEncaisses.reduce((s, p) => s + p.montant, 0)), "", ""]],
      footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8 },
    });
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text(`Total à encaisser : ${formatCurrency(nonEncaisses.reduce((s, p) => s + p.montant, 0))}`, 14, y);
    doc.text(`Nombre de pièces : ${nonEncaisses.length}`, 14, y + 5);
    doc.text(`Date du bordereau : ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 10);
    doc.text("Signature du régisseur :", 14, y + 25);
    doc.line(14, y + 35, 80, y + 35);
    savePDF(doc, `Bordereau_${voyage.destination}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Bordereau de remise généré");
  };

  const modeIcons: Record<string, typeof Euro> = {
    cheque: CreditCard,
    virement: ArrowUpRight,
    especes: Banknote,
    prelevement: ArrowUpRight,
    en_ligne: CreditCard,
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total collecté</p>
            <p className="text-xl font-bold font-mono text-success">{formatCurrency(stats.totalRecu)}</p>
            <Progress value={stats.tauxRecouvrement} className="h-1.5 mt-2 [&>div]:bg-success" />
            <p className="text-[10px] text-muted-foreground mt-1">{stats.tauxRecouvrement.toFixed(0)}% du total dû</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Reste à percevoir</p>
            <p className={`text-xl font-bold font-mono ${stats.reste > 0 ? "text-warning" : "text-success"}`}>{formatCurrency(stats.reste)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Soldés</p>
            <p className="text-xl font-bold text-success">{stats.nbSoldes}<span className="text-sm text-muted-foreground">/{voyage.eleves.length}</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Aucun paiement</p>
            <p className={`text-xl font-bold ${stats.nbImpayes > 0 ? "text-destructive" : "text-success"}`}>{stats.nbImpayes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par mode de paiement */}
      {Object.keys(stats.byMode).length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Répartition par mode de paiement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {Object.entries(stats.byMode).map(([mode, montant]) => {
              const Icon = modeIcons[mode] || Euro;
              return (
                <div key={mode} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">{MODES_PAIEMENT[mode as Paiement["mode"]] || mode}</p>
                    <p className="text-sm font-bold font-mono">{formatCurrency(montant)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Campagnes d'encaissement */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Campagnes d'encaissement
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generateBordereauPDF}>
              <Download className="h-3.5 w-3.5 mr-1" /> Bordereau
            </Button>
            <Dialog open={showNewCampagne} onOpenChange={setShowNewCampagne}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Campagne</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle campagne d'encaissement</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Date campagne</Label><Input type="date" value={newCampagne.dateCampagne} onChange={e => setNewCampagne(p => ({ ...p, dateCampagne: e.target.value }))} /></div>
                    <div><Label className="text-xs">Date échéance</Label><Input type="date" value={newCampagne.dateEcheance} onChange={e => setNewCampagne(p => ({ ...p, dateEcheance: e.target.value }))} /></div>
                  </div>
                  <div><Label className="text-xs">Montant attendu (€)</Label><Input type="number" value={newCampagne.montantAttendu || ""} onChange={e => setNewCampagne(p => ({ ...p, montantAttendu: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label className="text-xs">Libellé</Label><Input value={newCampagne.libelle} onChange={e => setNewCampagne(p => ({ ...p, libelle: e.target.value }))} placeholder="Ex: Versement n°2 — 40%" /></div>
                  <Button onClick={handleAddCampagne}>Créer la campagne</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {campagnes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune campagne définie. Créez un échéancier dans l'assistant de création ou ajoutez une campagne manuellement.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {campagnes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampagneId(c.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border transition-colors text-left ${selectedCampagneId === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={c.statut === "cloturee" ? "default" : c.statut === "en_cours" ? "secondary" : "outline"} className="text-[10px]">
                      {c.statut === "cloturee" ? "Clôturée" : c.statut === "en_cours" ? "En cours" : "Planifiée"}
                    </Badge>
                    <span className="text-xs font-semibold">Versement n°{c.numero}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.libelle}</p>
                  <p className="text-sm font-bold font-mono">{formatCurrency(c.montantAttendu)}</p>
                  <p className="text-[10px] text-muted-foreground">Échéance : {c.dateEcheance || "—"}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau état par élève */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">État des paiements par élève</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Dernier paiement</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eleveStates.map(e => (
                <TableRow key={e.id} className={e.statut === "impaye" ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium text-sm">{e.nom} {e.prenom}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.classe}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(e.participationDue)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(e.totalPaye)}</TableCell>
                  <TableCell className={`text-right font-mono text-sm font-semibold ${e.reste > 0 ? "text-destructive" : "text-success"}`}>{formatCurrency(e.reste)}</TableCell>
                  <TableCell className="text-center">
                    {e.statut === "solde" && <Badge className="bg-success/10 text-success border-0 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Soldé</Badge>}
                    {e.statut === "partiel" && <Badge className="bg-warning/10 text-warning border-0 text-[10px]"><Clock className="h-3 w-3 mr-1" />Partiel</Badge>}
                    {e.statut === "impaye" && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Impayé</Badge>}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {e.lastPaiement ? `${e.lastPaiement.date} — ${formatCurrency(e.lastPaiement.montant)}` : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {e.reste > 0 && (
                      <Dialog open={showQuickPay === e.id} onOpenChange={open => { setShowQuickPay(open ? e.id : null); if (!open) setQuickPayAmount(""); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-[10px]">
                            <Euro className="h-3 w-3 mr-1" /> Encaisser
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle className="text-sm">Encaissement — {e.nom} {e.prenom}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-3">
                            <p className="text-xs text-muted-foreground">Reste dû : <span className="font-bold text-foreground">{formatCurrency(e.reste)}</span></p>
                            <div><Label className="text-xs">Montant</Label><Input type="number" value={quickPayAmount} onChange={ev => setQuickPayAmount(ev.target.value)} placeholder={String(e.reste)} /></div>
                            <div>
                              <Label className="text-xs">Mode</Label>
                              <Select value={quickPayMode} onValueChange={v => setQuickPayMode(v as Paiement["mode"])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(MODES_PAIEMENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <Button onClick={() => handleQuickPay(e.id)} className="w-full">Valider l'encaissement</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
