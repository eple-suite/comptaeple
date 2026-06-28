import { useState } from "react";
import { Stamp, FileText, Plus, Pencil, Trash2, Layers, Wallet, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  useValeursInactivesStore, nouvelleValeur, TYPE_VALEUR_LABELS,
  stockTheorique, valeurStock, totalRegistre, dernierEcart, genererPvValeursInactives,
  type ValeurInactive, type TypeValeur,
} from "@/lib/valeurs-inactives";

const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const today = () => new Date().toISOString().split("T")[0];

export default function ValeursInactivesPage() {
  const { selectedEstablishment } = useEstablishment();
  const { valeurs, mouvements, controles, upsertValeur, removeValeur, ajouterMouvement, ajouterControle } = useValeursInactivesStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<ValeurInactive | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Formulaire mouvement (par valeur dépliée)
  const [mvtSens, setMvtSens] = useState<"entree" | "sortie">("entree");
  const [mvtQte, setMvtQte] = useState(0);
  const [mvtDate, setMvtDate] = useState(today());
  const [mvtMotif, setMvtMotif] = useState("");

  // Formulaire contrôle AC
  const [ctrlDate, setCtrlDate] = useState(today());
  const [ctrlAgent, setCtrlAgent] = useState("");
  const [ctrlStock, setCtrlStock] = useState(0);
  const [ctrlObs, setCtrlObs] = useState("");

  const etabNom = selectedEstablishment?.name ?? "Établissement";
  const total = totalRegistre(valeurs, mouvements);

  const ouvrirNouveau = () => { setEdit(nouvelleValeur(selectedEstablishment?.id)); setDialogOpen(true); };
  const ouvrirEdition = (v: ValeurInactive) => { setEdit({ ...v }); setDialogOpen(true); };
  const enregistrer = () => { if (edit) { upsertValeur(edit); setDialogOpen(false); setEdit(null); } };

  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  const ajouterMvt = (valeurId: string) => {
    if (mvtQte <= 0) return;
    ajouterMouvement({ valeurId, sens: mvtSens, quantite: mvtQte, date: mvtDate, motif: mvtMotif || undefined });
    setMvtQte(0); setMvtMotif("");
  };

  const ajouterCtrl = (valeurId: string) => {
    ajouterControle({
      etablissementId: selectedEstablishment?.id, valeurId, date: ctrlDate,
      agent: ctrlAgent || undefined, stockConstate: ctrlStock, observation: ctrlObs || undefined,
    });
    setCtrlAgent(""); setCtrlStock(0); setCtrlObs("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Stamp}
        title="Valeurs inactives — registre P503"
        description="Timbres, tickets, cartes — contrôle de l'agent comptable (M9-6)"
      >
        <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg"
          onClick={() => genererPvValeursInactives(valeurs, mouvements, controles, etabNom)}>
          <FileText className="h-3.5 w-3.5 mr-1" /> PV / Registre (PDF)
        </Button>
        <Button size="sm" className="h-8 text-xs rounded-lg" onClick={ouvrirNouveau}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle valeur
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="Valeurs au registre" value={`${valeurs.length}`} icon={Layers} variant="primary" />
        <KpiCard title="Valeur totale du registre" value={eur(total)} icon={Wallet} variant="success" />
      </div>

      {valeurs.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Stamp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Aucune valeur inactive enregistrée</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Enregistrez les timbres, tickets et cartes détenus par l'agence comptable pour suivre les entrées/sorties et tracer les contrôles.
            </p>
            <Button size="sm" className="mt-1" onClick={ouvrirNouveau}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle valeur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Valeur unitaire</TableHead>
                  <TableHead className="text-right">Stock théorique</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-center">Dernier écart</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valeurs.map((v) => {
                  const stock = stockTheorique(v.id, mouvements);
                  const ecart = dernierEcart(v.id, mouvements, controles);
                  const isOpen = expanded === v.id;
                  const mvtsV = mouvements.filter((m) => m.valeurId === v.id).slice().sort((a, b) => b.date.localeCompare(a.date));
                  const ctrlsV = controles.filter((c) => c.valeurId === v.id).slice().sort((a, b) => b.date.localeCompare(a.date));
                  return (
                    <>
                      <TableRow key={v.id} className="group">
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggle(v.id)} title="Détails">
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs font-medium cursor-pointer" onClick={() => toggle(v.id)}>{v.designation || "—"}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{TYPE_VALEUR_LABELS[v.type]}</Badge></TableCell>
                        <TableCell className="text-xs text-right font-mono">{eur(v.valeurUnitaire)}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{stock}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{eur(valeurStock(v, mouvements))}</TableCell>
                        <TableCell className="text-center">
                          {ecart === null ? (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          ) : ecart === 0 ? (
                            <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">0</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-0">{ecart > 0 ? "+" : ""}{ecart}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Éditer" onClick={() => ouvrirEdition(v)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Supprimer" onClick={() => removeValeur(v.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow key={`${v.id}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-3">
                              {/* Mouvements */}
                              <div className="space-y-3">
                                <p className="text-xs font-semibold flex items-center gap-1.5">
                                  <ArrowDownToLine className="h-3.5 w-3.5 text-primary" /> Mouvements
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Sens</Label>
                                    <Select value={mvtSens} onValueChange={(val: "entree" | "sortie") => setMvtSens(val)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="entree">Entrée</SelectItem>
                                        <SelectItem value="sortie">Sortie</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Quantité</Label>
                                    <Input type="number" min={0} className="h-8 text-xs" value={mvtQte} onChange={(e) => setMvtQte(parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Date</Label>
                                    <Input type="date" className="h-8 text-xs" value={mvtDate} onChange={(e) => setMvtDate(e.target.value)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Motif</Label>
                                    <Input className="h-8 text-xs" value={mvtMotif} onChange={(e) => setMvtMotif(e.target.value)} placeholder="Ex. Acquisition" />
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => ajouterMvt(v.id)} disabled={mvtQte <= 0}>
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter le mouvement
                                </Button>
                                <div className="space-y-1.5">
                                  {mvtsV.length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground">Aucun mouvement.</p>
                                  ) : mvtsV.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-1.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {m.sens === "entree"
                                          ? <ArrowDownToLine className="h-3.5 w-3.5 text-success shrink-0" />
                                          : <ArrowUpFromLine className="h-3.5 w-3.5 text-destructive shrink-0" />}
                                        <span className="text-xs font-mono">{m.sens === "entree" ? "+" : "−"}{m.quantite}</span>
                                        <span className="text-[11px] text-muted-foreground truncate">{m.motif || ""}</span>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground shrink-0">{new Date(m.date).toLocaleDateString("fr-FR")}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Contrôle AC */}
                              <div className="space-y-3">
                                <p className="text-xs font-semibold flex items-center gap-1.5">
                                  <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Contrôle de l'agent comptable
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Date</Label>
                                    <Input type="date" className="h-8 text-xs" value={ctrlDate} onChange={(e) => setCtrlDate(e.target.value)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Agent</Label>
                                    <Input className="h-8 text-xs" value={ctrlAgent} onChange={(e) => setCtrlAgent(e.target.value)} placeholder="Agent comptable" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Stock constaté</Label>
                                    <Input type="number" min={0} className="h-8 text-xs" value={ctrlStock} onChange={(e) => setCtrlStock(parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Observation</Label>
                                    <Input className="h-8 text-xs" value={ctrlObs} onChange={(e) => setCtrlObs(e.target.value)} placeholder="Constat" />
                                  </div>
                                </div>
                                {(() => {
                                  const e = ctrlStock - stock;
                                  return (
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${e === 0 ? "text-success" : "text-destructive"}`}>
                                      {e === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                                      Écart = {e > 0 ? "+" : ""}{e} (constaté {ctrlStock} − théorique {stock})
                                    </div>
                                  );
                                })()}
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => ajouterCtrl(v.id)}>
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Enregistrer le contrôle
                                </Button>
                                <div className="space-y-1.5">
                                  {ctrlsV.length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground">Aucun contrôle.</p>
                                  ) : ctrlsV.map((c) => {
                                    const e = c.stockConstate - stockTheorique(v.id, mouvements);
                                    return (
                                      <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-1.5">
                                        <div className="min-w-0">
                                          <p className="text-xs">{c.agent || "Agent comptable"} — constaté {c.stockConstate}</p>
                                          {c.observation && <p className="text-[11px] text-muted-foreground truncate">{c.observation}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Badge variant="secondary" className={`text-[10px] border-0 ${e === 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                            {e > 0 ? "+" : ""}{e}
                                          </Badge>
                                          <span className="text-[11px] text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stamp className="h-4 w-4 text-primary" />
              {edit && valeurs.some((v) => v.id === edit.id) ? "Éditer la valeur" : "Nouvelle valeur"}
            </DialogTitle>
            <DialogDescription>Timbre, ticket ou carte détenu par l'agence comptable.</DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={edit.type} onValueChange={(v: TypeValeur) => setEdit({ ...edit, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_VALEUR_LABELS) as [TypeValeur, string][]).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Désignation</Label>
                <Input value={edit.designation} onChange={(e) => setEdit({ ...edit, designation: e.target.value })} placeholder="Ex. Timbre fiscal 4,80 €" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valeur unitaire (€)</Label>
                <Input type="number" min={0} step="0.01" value={edit.valeurUnitaire}
                  onChange={(e) => setEdit({ ...edit, valeurUnitaire: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={!edit?.designation}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
