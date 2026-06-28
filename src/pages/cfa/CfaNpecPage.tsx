import { useState } from "react";
import {
  GraduationCap, Plus, Pencil, Trash2, Users, Wallet,
  TrendingUp, Scale, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  useCfaStore, nouvelleFormation, ressourceOpco, equilibreCfa,
  type FormationApprentissage, type ParamsCfa,
} from "@/lib/cfa";

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const CfaNpecPage = () => {
  const { selectedEstablishment } = useEstablishment();
  const { formations, params, upsertFormation, removeFormation, setParams } = useCfaStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<FormationApprentissage | null>(null);

  const eq = equilibreCfa(formations, params);

  const ouvrirNouvelle = () => {
    setEdit(nouvelleFormation(selectedEstablishment?.id));
    setDialogOpen(true);
  };
  const ouvrirEdition = (f: FormationApprentissage) => {
    setEdit({ ...f });
    setDialogOpen(true);
  };
  const enregistrer = () => {
    if (edit) {
      upsertFormation(edit);
      setDialogOpen(false);
      setEdit(null);
    }
  };

  const setParam = (k: keyof ParamsCfa, v: string) =>
    setParams({ [k]: parseFloat(v) || 0 });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="CFA — NPEC & ressources d'apprentissage"
        description="Financement OPCO, taxe d'apprentissage (C/7568x), équilibre du budget annexe"
      >
        <Button size="sm" onClick={ouvrirNouvelle} className="h-8 text-xs rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une formation
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Apprentis" value={`${eq.nbApprentis}`} icon={Users} variant="primary" />
        <KpiCard title="Ressources OPCO" value={eur(eq.ressourcesOpco)} icon={Wallet} variant="default" />
        <KpiCard title="Produits totaux" value={eur(eq.produitsTotal)} icon={TrendingUp} variant="default" />
        <KpiCard
          title="Résultat"
          value={eur(eq.resultat)}
          icon={Scale}
          variant={eq.resultat >= 0 ? "success" : "destructive"}
        />
        <KpiCard
          title="Coût moyen / apprenti"
          value={eq.nbApprentis ? eur(eq.coutMoyenApprenti) : "—"}
          icon={GraduationCap}
          variant="default"
        />
      </div>

      {/* Formations */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Formations en apprentissage
          </CardTitle>
          <Button size="sm" variant="outline" onClick={ouvrirNouvelle} className="h-8 text-xs rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une formation
          </Button>
        </CardHeader>
        <CardContent className="pt-2 overflow-x-auto">
          {formations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Aucune formation en apprentissage</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Ajoutez une formation pour calculer les ressources OPCO (NPEC) et l'équilibre du budget annexe.
              </p>
              <Button size="sm" onClick={ouvrirNouvelle} className="h-8 text-xs rounded-lg mt-4">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une formation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Diplôme</TableHead>
                  <TableHead className="text-right">NPEC €/an</TableHead>
                  <TableHead className="text-right">Apprentis</TableHead>
                  <TableHead className="text-right">Coût annuel</TableHead>
                  <TableHead className="text-right">Ressource OPCO</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formations.map((f) => (
                  <TableRow key={f.id} className="group">
                    <TableCell className="text-xs font-medium cursor-pointer" onClick={() => ouvrirEdition(f)}>
                      {f.intitule || <span className="text-muted-foreground italic">Sans intitulé</span>}
                    </TableCell>
                    <TableCell className="text-xs">{f.diplome || "—"}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{eur(f.npec)}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{f.nbApprentis}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{eur(f.coutAnnuel || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0 font-mono">
                        {eur(ressourceOpco(f))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Éditer" onClick={() => ouvrirEdition(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Supprimer" onClick={() => removeFormation(f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paramètres budgétaires */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Paramètres budgétaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Taxe d'apprentissage (C/7568x)</Label>
              <Input type="number" value={params.taxeApprentissage}
                onChange={(e) => setParam("taxeApprentissage", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Masse salariale apprentis</Label>
              <Input type="number" value={params.masseSalarialeApprentis}
                onChange={(e) => setParam("masseSalarialeApprentis", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Autres charges</Label>
              <Input type="number" value={params.autresCharges}
                onChange={(e) => setParam("autresCharges", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Autres produits</Label>
              <Input type="number" value={params.autresProduits}
                onChange={(e) => setParam("autresProduits", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Équilibre — compte de résultat simplifié */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" /> Équilibre du budget annexe
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produits</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-xs">Ressources OPCO (NPEC)</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.ressourcesOpco)}</TableCell>
                <TableCell className="text-xs">Masse salariale apprentis</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.masseSalarialeApprentis)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs">Taxe d'apprentissage</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.taxeApprentissage)}</TableCell>
                <TableCell className="text-xs">Coûts des formations</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.coutsFormations)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs">Autres produits</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.autresProduits)}</TableCell>
                <TableCell className="text-xs">Autres charges</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.autresCharges)}</TableCell>
              </TableRow>
              <TableRow className="border-t-2 font-semibold">
                <TableCell className="text-xs">Total produits</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.produitsTotal)}</TableCell>
                <TableCell className="text-xs">Total charges</TableCell>
                <TableCell className="text-xs text-right font-mono">{eur(eq.chargesTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold" colSpan={2}>Résultat</TableCell>
                <TableCell className="text-right" colSpan={2}>
                  <span className={`text-sm font-bold font-mono ${eq.resultat >= 0 ? "text-success" : "text-destructive"}`}>
                    {eur(eq.resultat)}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              {edit && formations.some((f) => f.id === edit.id) ? "Éditer la formation" : "Nouvelle formation"}
            </DialogTitle>
            <DialogDescription>Renseignez la formation en apprentissage et son financement.</DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Intitulé</Label>
                <Input value={edit.intitule} onChange={(e) => setEdit({ ...edit, intitule: e.target.value })}
                  placeholder="Ex. CAP Cuisine" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Diplôme</Label>
                <Input value={edit.diplome} onChange={(e) => setEdit({ ...edit, diplome: e.target.value })}
                  placeholder="Ex. CAP, BTS, Bac Pro" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">NPEC (€ / apprenti / an)</Label>
                  <Input type="number" value={edit.npec}
                    onChange={(e) => setEdit({ ...edit, npec: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre d'apprentis</Label>
                  <Input type="number" value={edit.nbApprentis}
                    onChange={(e) => setEdit({ ...edit, nbApprentis: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Coût annuel de la formation</Label>
                <Input type="number" value={edit.coutAnnuel ?? 0}
                  onChange={(e) => setEdit({ ...edit, coutAnnuel: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={!edit?.intitule}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CfaNpecPage;
