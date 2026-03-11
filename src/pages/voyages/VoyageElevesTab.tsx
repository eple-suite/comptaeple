import { useState, useMemo } from "react";
import { Users, Search, CheckCircle2, XCircle, AlertTriangle, FileText, Download, Mail, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Voyage, Eleve, MODES_PAIEMENT } from "./types";
import { calculerResteApayer } from "@/lib/voyageBudgetEngine";
import { formatCurrency } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

export const VoyageElevesTab = ({ voyage, onUpdateVoyage }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "partial" | "unpaid" | "docs_missing">("all");
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);

  const eleves = voyage.eleves;

  const filtered = useMemo(() => {
    let list = eleves;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(s) || e.classe.toLowerCase().includes(s));
    }
    if (filter === "paid") list = list.filter(e => {
      const total = e.paiements.reduce((s, p) => s + p.montant, 0);
      return total >= e.participationDue;
    });
    if (filter === "partial") list = list.filter(e => {
      const total = e.paiements.reduce((s, p) => s + p.montant, 0);
      return total > 0 && total < e.participationDue;
    });
    if (filter === "unpaid") list = list.filter(e => e.paiements.length === 0);
    if (filter === "docs_missing") list = list.filter(e => !e.autorisationParentale || !e.ficheSanitaire || !e.assuranceRC || !e.passeport);
    return list;
  }, [eleves, search, filter]);

  // Stats
  const stats = useMemo(() => {
    const totalDu = eleves.reduce((s, e) => s + e.participationDue, 0);
    const totalEncaisse = eleves.reduce((s, e) => s + e.paiements.filter(p => p.encaisse).reduce((ss, p) => ss + p.montant, 0), 0);
    const totalRecu = eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    const nbSoldes = eleves.filter(e => e.paiements.reduce((s, p) => s + p.montant, 0) >= e.participationDue).length;
    const nbPartiel = eleves.filter(e => { const t = e.paiements.reduce((s, p) => s + p.montant, 0); return t > 0 && t < e.participationDue; }).length;
    const nbImpaye = eleves.filter(e => e.paiements.length === 0).length;
    const docsOk = eleves.filter(e => e.autorisationParentale && e.ficheSanitaire && e.assuranceRC && e.passeport).length;
    return { totalDu, totalEncaisse, totalRecu, nbSoldes, nbPartiel, nbImpaye, docsOk };
  }, [eleves]);

  const tauxRecouvrement = stats.totalDu > 0 ? (stats.totalRecu / stats.totalDu) * 100 : 0;

  const generateLettreEngagement = (eleve: Eleve) => {
    const doc = new jsPDF();
    doc.setFontSize(11);
    doc.text(`${voyage.professeur}`, 20, 30);
    doc.text(`Établissement — Service intendance`, 20, 36);
    doc.text(`Objet : Lettre d'engagement financier — Voyage à ${voyage.destination}`, 20, 55);
    doc.setFontSize(10);
    const y = 70;
    doc.text(`Madame, Monsieur ${eleve.responsable1},`, 20, y);
    doc.text(`Votre enfant ${eleve.prenom} ${eleve.nom} (classe : ${eleve.classe}) est inscrit(e) au`, 20, y + 8);
    doc.text(`voyage scolaire à ${voyage.destination} (${voyage.pays}) du ${voyage.dateDepart} au ${voyage.dateRetour}.`, 20, y + 14);
    doc.text(`La participation demandée aux familles s'élève à ${formatCurrency(eleve.participationDue)}.`, 20, y + 24);
    if (voyage.echeances.length > 0) {
      doc.text(`Échéancier de paiement :`, 20, y + 34);
      voyage.echeances.forEach((ech, i) => {
        const montant = eleve.participationDue * ech.pourcentage / 100;
        doc.text(`  • Échéance ${i + 1} : ${ech.date} — ${formatCurrency(montant)} (${ech.pourcentage}%)`, 25, y + 42 + i * 6);
      });
    }
    const ySign = y + 42 + voyage.echeances.length * 6 + 15;
    doc.text(`En signant ce document, je m'engage à régler la totalité de la participation.`, 20, ySign);
    doc.text(`Date : ___/___/______    Signature du responsable légal :`, 20, ySign + 15);
    doc.save(`lettre_engagement_${eleve.nom}_${eleve.prenom}_${voyage.destination}.pdf`);
  };

  const generateAllLettres = () => {
    eleves.forEach(e => generateLettreEngagement(e));
  };

  const DocIcon = ({ ok }: { ok: boolean }) => ok
    ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
    : <XCircle className="h-3.5 w-3.5 text-destructive" />;

  return (
    <div className="space-y-4">
      {/* Stats élèves */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Inscrits</div>
            <div className="text-xl font-bold font-display">{eleves.length}</div>
            <div className="text-[10px] text-muted-foreground">+ {voyage.nbAccompagnateurs} accomp.</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Recouvrement</div>
            <div className="text-xl font-bold font-display">{tauxRecouvrement.toFixed(0)}%</div>
            <Progress value={tauxRecouvrement} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Encaissé / Dû</div>
            <div className="text-lg font-bold font-mono">{formatCurrency(stats.totalRecu)}</div>
            <div className="text-[10px] text-muted-foreground">sur {formatCurrency(stats.totalDu)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Dossiers complets</div>
            <div className="text-xl font-bold font-display">{stats.docsOk} / {eleves.length}</div>
            <Progress value={eleves.length > 0 ? (stats.docsOk / eleves.length) * 100 : 0} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        {(["all", "paid", "partial", "unpaid", "docs_missing"] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="h-8 text-xs">
            {f === "all" ? `Tous (${eleves.length})` : f === "paid" ? `Soldés (${stats.nbSoldes})` : f === "partial" ? `Partiels (${stats.nbPartiel})` : f === "unpaid" ? `Impayés (${stats.nbImpaye})` : `Docs manquants (${eleves.length - stats.docsOk})`}
          </Button>
        ))}
        <Separator orientation="vertical" className="h-6" />
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={generateAllLettres}>
          <FileText className="h-3 w-3 mr-1" /> Lettres d'engagement
        </Button>
      </div>

      {/* Tableau élèves */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Régime</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right" title="Aide fonds social (déduction auto)">Fonds social</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="text-center">Paiement</TableHead>
                <TableHead className="text-center" title="Autorisation parentale">AP</TableHead>
                <TableHead className="text-center" title="Fiche sanitaire">FS</TableHead>
                <TableHead className="text-center" title="Assurance RC">RC</TableHead>
                <TableHead className="text-center" title="Passeport">ID</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => {
                const paye = e.paiements.reduce((s, p) => s + p.montant, 0);
                const fondsSocial = (e as any).fondsSocial || 0;
                const reste = calculerResteApayer(e.participationDue, paye, fondsSocial);
                const pct = e.participationDue > 0 ? ((paye + fondsSocial) / e.participationDue) * 100 : 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-sm">{e.nom} {e.prenom}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.classe}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] border-0">
                        {e.regime === "interne" ? "INT" : e.regime === "demi-pensionnaire" ? "DP" : "EXT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(e.participationDue)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(paye)}</TableCell>
                    {/* Fonds social deduction */}
                    <TableCell className="text-right font-mono text-xs">
                      {fondsSocial > 0 ? (
                        <span className="text-primary font-semibold">-{formatCurrency(fondsSocial)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs font-semibold ${reste <= 0 ? "text-success" : "text-destructive"}`}>
                      {reste <= 0 ? "Soldé" : formatCurrency(reste)}
                    </TableCell>
                    <TableCell className="min-w-[80px]">
                      <Progress value={Math.min(pct, 100)} className={`h-1.5 ${pct >= 100 ? "[&>div]:bg-success" : pct > 0 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`} />
                    </TableCell>
                    <TableCell className="text-center"><DocIcon ok={e.autorisationParentale} /></TableCell>
                    <TableCell className="text-center"><DocIcon ok={e.ficheSanitaire} /></TableCell>
                    <TableCell className="text-center"><DocIcon ok={e.assuranceRC} /></TableCell>
                    <TableCell className="text-center"><DocIcon ok={e.passeport} /></TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedEleve(e)}>Détail</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{e.prenom} {e.nom} — {e.classe}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Responsable :</span> {e.responsable1}</div>
                              <div><span className="text-muted-foreground">Email :</span> {e.emailResponsable}</div>
                              <div><span className="text-muted-foreground">Tél :</span> {e.telResponsable}</div>
                              <div><span className="text-muted-foreground">Régime :</span> {e.regime}</div>
                            </div>
                            <Separator />
                            <div className="font-semibold">Historique des paiements</div>
                            {e.paiements.length === 0 ? (
                              <p className="text-muted-foreground italic">Aucun paiement enregistré</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Référence</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead>Encaissé</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {e.paiements.map(p => (
                                    <TableRow key={p.id}>
                                      <TableCell className="text-xs">{p.date}</TableCell>
                                      <TableCell className="text-xs">{MODES_PAIEMENT[p.mode]}</TableCell>
                                      <TableCell className="text-xs font-mono">{p.reference}</TableCell>
                                      <TableCell className="text-right text-xs font-mono">{formatCurrency(p.montant)}</TableCell>
                                      <TableCell>{p.encaisse ? <CheckCircle2 className="h-3 w-3 text-success" /> : <AlertTriangle className="h-3 w-3 text-warning" />}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                            {(() => {
                              const totalPaye = e.paiements.reduce((s, p) => s + p.montant, 0);
                              const fondsSoc = (e as any).fondsSocial || 0;
                              const r = calculerResteApayer(e.participationDue, totalPaye, fondsSoc);
                              return (
                                <div className="space-y-1 pt-2">
                                  {fondsSoc > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-primary font-medium">Aide fonds social :</span>
                                      <span className="font-mono font-semibold text-primary">-{formatCurrency(fondsSoc)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm font-semibold">
                                    <span>Reste à payer :</span>
                                    <span className={r <= 0 ? "text-success" : "text-destructive"}>
                                      {r <= 0 ? "Soldé" : formatCurrency(r)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                            <Separator />
                            <Button size="sm" variant="outline" className="w-full" onClick={() => generateLettreEngagement(e)}>
                              <Download className="h-3 w-3 mr-1" /> Lettre d'engagement PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
