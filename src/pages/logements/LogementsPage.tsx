import { useState, useMemo } from "react";
import { Home, Plus, Pencil, Trash2, FileText, Download, Gauge, Coins, Wallet, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  useLogementsStore, nouveauLogement, nouveauReleve,
  decompteAnnuel, indexInitialReporte, anneesReleves, montantTitre,
  arreteConcession, titreExecutoire, decomptePdf,
  consoCalcul, FLUIDES, FLUIDE_LABELS, CONCESSION_LABELS,
  type TypeConcession, type Logement, type ReleveConso,
} from "@/lib/logements";

const eur = (n: number) => (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const LogementsPage = () => {
  const { selectedEstablishment } = useEstablishment();
  const etabId = selectedEstablishment?.id;
  const etabNom = selectedEstablishment?.name ?? "Établissement";

  const { logements, releves, upsertLogement, removeLogement, upsertReleve, logementsDe } = useLogementsStore();

  const mesLogements = useMemo(() => logementsDe(etabId), [logements, etabId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selId, setSelId] = useState<string | null>(null);
  const selectionne = mesLogements.find((l) => l.id === selId) ?? null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Logement | null>(null);

  // Année courante pour les onglets Consommations / Décompte
  const anneeCourante = new Date().getFullYear();
  const [anneeConso, setAnneeConso] = useState<number>(anneeCourante);
  const [anneeDecompte, setAnneeDecompte] = useState<number>(anneeCourante);

  // KPIs
  const redevanceTotale = mesLogements.reduce((s, l) => s + (l.redevanceMensuelle || 0), 0);
  const provisionsTotales = mesLogements.reduce((s, l) => s + (l.provisionsChargesMensuelles || 0), 0);

  const ouvrirNouveau = () => { setEdit(nouveauLogement(etabId)); setDialogOpen(true); };
  const ouvrirEdition = (l: Logement) => { setEdit({ ...l }); setDialogOpen(true); };
  const enregistrer = () => {
    if (edit && edit.libelle.trim()) { upsertLogement(edit); setSelId(edit.id); setDialogOpen(false); setEdit(null); }
  };
  const supprimer = (id: string) => {
    removeLogement(id);
    if (selId === id) setSelId(null);
  };

  // Années disponibles pour un logement (relevés + année courante)
  const anneesDispo = (logementId: string): number[] => {
    const set = new Set<number>(anneesReleves(releves, logementId));
    set.add(anneeCourante);
    return Array.from(set).sort((a, b) => b - a);
  };

  // Relevé d'un fluide pour l'année (création à la volée si absent)
  const releveDe = (logementId: string, annee: number, fluide: ReleveConso["fluide"]): ReleveConso =>
    releves.find((r) => r.logementId === logementId && r.annee === annee && r.fluide === fluide)
    ?? nouveauReleve(logementId, annee, fluide);

  const majReleve = (r: ReleveConso, champ: "indexInitial" | "indexFinal" | "prixUnitaire", valeur: number) => {
    upsertReleve({ ...r, [champ]: valeur });
  };

  const reporterIndex = (logementId: string, annee: number) => {
    FLUIDES.forEach((fluide) => {
      const reporte = indexInitialReporte(releves, logementId, fluide, annee);
      if (reporte !== undefined) {
        const r = releveDe(logementId, annee, fluide);
        upsertReleve({ ...r, indexInitial: reporte });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Home}
        title="Logements de fonction"
        description="Concessions, redevances et charges — CGPPP / décret 2012-752 / Code éduc. R.216"
      >
        <Button size="sm" onClick={ouvrirNouveau} className="h-8 text-xs rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau logement
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Logements" value={`${mesLogements.length}`} icon={Home} variant="primary" />
        <KpiCard title="Redevance mensuelle totale" value={eur(redevanceTotale)} icon={Coins} variant="success" />
        <KpiCard title="Provisions charges / mois" value={eur(provisionsTotales)} icon={Wallet} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche — liste */}
        <Card className="shadow-card lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Logements de l'établissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mesLogements.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Home className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium">Aucun logement de fonction</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Créez une première concession pour suivre redevances, consommations et décomptes de charges.
                </p>
                <Button size="sm" onClick={ouvrirNouveau} className="h-8 text-xs rounded-lg">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau logement
                </Button>
              </div>
            ) : (
              mesLogements.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelId(l.id)}
                  className={`group rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${selId === l.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.libelle || "Sans libellé"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {l.occupantNom || "Occupant non renseigné"}
                        {l.occupantFonction ? ` — ${l.occupantFonction}` : ""}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px]">{l.typeConcession}</Badge>
                        <span className="text-[11px] text-muted-foreground">{eur(l.redevanceMensuelle)}/mois</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Éditer"
                        onClick={(e) => { e.stopPropagation(); ouvrirEdition(l); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); supprimer(l.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Colonne droite — détail */}
        <Card className="shadow-card lg:col-span-2">
          {!selectionne ? (
            <CardContent className="py-16 text-center">
              <Home className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Sélectionnez un logement</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choisissez un logement dans la liste pour consulter la concession, les consommations et le décompte de charges.
              </p>
            </CardContent>
          ) : (
            <CardContent className="pt-5">
              <Tabs defaultValue="concession">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="concession" className="text-xs">Concession</TabsTrigger>
                  <TabsTrigger value="conso" className="text-xs">Consommations</TabsTrigger>
                  <TabsTrigger value="decompte" className="text-xs">Décompte de charges</TabsTrigger>
                </TabsList>

                {/* Onglet Concession */}
                <TabsContent value="concession" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Logement" value={selectionne.libelle} />
                    <Info label="Type de concession" value={CONCESSION_LABELS[selectionne.typeConcession]} />
                    <Info label="Occupant" value={`${selectionne.occupantNom || "—"}${selectionne.occupantFonction ? ` (${selectionne.occupantFonction})` : ""}`} />
                    <Info label="Surface" value={selectionne.surface ? `${selectionne.surface} m²` : "—"} />
                    <Info label="Adresse" value={selectionne.adresse || "—"} />
                    <Info label="Période" value={`${new Date(selectionne.dateDebut).toLocaleDateString("fr-FR")}${selectionne.dateFin ? ` → ${new Date(selectionne.dateFin).toLocaleDateString("fr-FR")}` : ""}`} />
                    <Info label="Redevance mensuelle" value={eur(selectionne.redevanceMensuelle)} />
                    <Info label="Provisions charges / mois" value={eur(selectionne.provisionsChargesMensuelles)} />
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3">
                    {(() => {
                      const m = montantTitre(selectionne);
                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">Montant annuel à recouvrer (12 mois)</span>
                          <span className="font-mono font-semibold">{eur(m.total)}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg"
                      onClick={() => arreteConcession(selectionne, etabNom)}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> Arrêté de concession (PDF)
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg"
                      onClick={() => titreExecutoire(selectionne, etabNom, 12)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Titre exécutoire (PDF)
                    </Button>
                  </div>
                </TabsContent>

                {/* Onglet Consommations */}
                <TabsContent value="conso" className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Année</Label>
                    <Select value={String(anneeConso)} onValueChange={(v) => setAnneeConso(parseInt(v))}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {anneesDispo(selectionne.id).map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg"
                      onClick={() => setAnneeConso(anneeCourante)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Année courante
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg ml-auto"
                      onClick={() => reporterIndex(selectionne.id, anneeConso)}>
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Reporter les index N-1 → N
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fluide</TableHead>
                          <TableHead>Index initial</TableHead>
                          <TableHead>Index final</TableHead>
                          <TableHead>Prix unitaire</TableHead>
                          <TableHead className="text-right">Conso.</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FLUIDES.map((fluide) => {
                          const r = releveDe(selectionne.id, anneeConso, fluide);
                          const calc = consoCalcul(r);
                          return (
                            <TableRow key={fluide}>
                              <TableCell className="text-xs font-medium">{FLUIDE_LABELS[fluide]}</TableCell>
                              <TableCell>
                                <Input type="number" value={r.indexInitial} className="h-8 w-24 text-xs"
                                  onChange={(e) => majReleve(r, "indexInitial", parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" value={r.indexFinal} className="h-8 w-24 text-xs"
                                  onChange={(e) => majReleve(r, "indexFinal", parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="0.01" value={r.prixUnitaire} className="h-8 w-24 text-xs"
                                  onChange={(e) => majReleve(r, "prixUnitaire", parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell className="text-right text-xs font-mono">{calc.conso.toLocaleString("fr-FR")}</TableCell>
                              <TableCell className="text-right text-xs font-mono">{eur(calc.montant)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Onglet Décompte de charges */}
                <TabsContent value="decompte" className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Année</Label>
                    <Select value={String(anneeDecompte)} onValueChange={(v) => setAnneeDecompte(parseInt(v))}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {anneesDispo(selectionne.id).map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg ml-auto"
                      onClick={() => decomptePdf(selectionne, releves, anneeDecompte, etabNom)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Décompte (PDF)
                    </Button>
                  </div>

                  {(() => {
                    const d = decompteAnnuel(selectionne, releves, anneeDecompte);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fluide</TableHead>
                                <TableHead className="text-right">Consommation</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {d.details.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">
                                    Aucun relevé saisi pour {anneeDecompte}.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                d.details.map((x) => (
                                  <TableRow key={x.fluide}>
                                    <TableCell className="text-xs font-medium">{FLUIDE_LABELS[x.fluide]}</TableCell>
                                    <TableCell className="text-right text-xs font-mono">{x.conso.toLocaleString("fr-FR")}</TableCell>
                                    <TableCell className="text-right text-xs font-mono">{eur(x.montant)}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                          <Ligne label="Charges réelles" value={eur(d.chargesReelles)} />
                          <Ligne label="Provisions appelées" value={eur(d.provisionsAppelees)} />
                          <div className="border-t pt-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium flex items-center gap-1.5">
                                <Gauge className="h-3.5 w-3.5 text-primary" />
                                {d.regularisation >= 0 ? "Solde à recouvrer auprès de l'occupant" : "Solde à restituer à l'occupant"}
                              </span>
                              <Badge variant="secondary" className={`font-mono ${d.regularisation >= 0 ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}`}>
                                {eur(Math.abs(d.regularisation))}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              {edit && logements.some((l) => l.id === edit.id) ? "Éditer le logement" : "Nouveau logement"}
            </DialogTitle>
            <DialogDescription>Concession de logement de fonction — occupant, dates, redevance et provisions.</DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Libellé</Label>
                <Input value={edit.libelle} onChange={(e) => setEdit({ ...edit, libelle: e.target.value })} placeholder="Ex. Logement A — Loge" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input value={edit.adresse ?? ""} onChange={(e) => setEdit({ ...edit, adresse: e.target.value })} placeholder="Adresse du logement" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Surface (m²)</Label>
                  <Input type="number" value={edit.surface ?? ""} onChange={(e) => setEdit({ ...edit, surface: e.target.value === "" ? undefined : parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type de concession</Label>
                  <Select value={edit.typeConcession} onValueChange={(v: TypeConcession) => setEdit({ ...edit, typeConcession: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CONCESSION_LABELS) as [TypeConcession, string][]).map(([k, label]) => (
                        <SelectItem key={k} value={k}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Occupant</Label>
                  <Input value={edit.occupantNom} onChange={(e) => setEdit({ ...edit, occupantNom: e.target.value })} placeholder="Nom de l'occupant" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fonction</Label>
                  <Input value={edit.occupantFonction ?? ""} onChange={(e) => setEdit({ ...edit, occupantFonction: e.target.value })} placeholder="Ex. Gestionnaire" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date de début</Label>
                  <Input type="date" value={edit.dateDebut} onChange={(e) => setEdit({ ...edit, dateDebut: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date de fin</Label>
                  <Input type="date" value={edit.dateFin ?? ""} onChange={(e) => setEdit({ ...edit, dateFin: e.target.value || undefined })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Redevance mensuelle (€)</Label>
                  <Input type="number" step="0.01" value={edit.redevanceMensuelle} onChange={(e) => setEdit({ ...edit, redevanceMensuelle: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Provisions charges / mois (€)</Label>
                  <Input type="number" step="0.01" value={edit.provisionsChargesMensuelles} onChange={(e) => setEdit({ ...edit, provisionsChargesMensuelles: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={!edit?.libelle.trim()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-0.5">
    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const Ligne = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);

export default LogementsPage;
