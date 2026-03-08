import { useMemo, useState } from "react";
import { Landmark, CheckCircle2, XCircle, FileSignature, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Voyage, ActeCA, Convention, PROCEDURES_PASSATION, CATEGORIES_CHECKLIST, ChecklistItem } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

const TYPES_ACTE: Record<ActeCA["type"], string> = {
  programmation: "Programmation annuelle",
  financement: "Budget / Financement",
  convention: "Convention prestataire",
  modification: "Modification budgétaire",
  bilan: "Bilan financier",
};

export const VoyageActesCATab = ({ voyage, onUpdateVoyage }: Props) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ actes: true, conventions: true, checklist: true });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Toggle checklist item
  const toggleChecklist = (id: string) => {
    const updated = voyage.checklist.map(c =>
      c.id === id ? { ...c, fait: !c.fait, dateFait: !c.fait ? new Date().toISOString().split("T")[0] : undefined } : c
    );
    onUpdateVoyage({ ...voyage, checklist: updated });
  };

  // Stats checklist
  const checklistStats = useMemo(() => {
    const byCategorie = Object.keys(CATEGORIES_CHECKLIST).map(cat => {
      const items = voyage.checklist.filter(c => c.categorie === cat);
      const done = items.filter(c => c.fait).length;
      return { categorie: cat as ChecklistItem["categorie"], total: items.length, done, pct: items.length > 0 ? (done / items.length) * 100 : 0 };
    });
    const totalItems = voyage.checklist.length;
    const totalDone = voyage.checklist.filter(c => c.fait).length;
    const obligatoires = voyage.checklist.filter(c => c.obligatoire);
    const obligatoiresDone = obligatoires.filter(c => c.fait).length;
    return { byCategorie, totalItems, totalDone, pctTotal: totalItems > 0 ? (totalDone / totalItems) * 100 : 0, obligatoires: obligatoires.length, obligatoiresDone, pctObligatoire: obligatoires.length > 0 ? (obligatoiresDone / obligatoires.length) * 100 : 0 };
  }, [voyage.checklist]);

  const actesAdoptes = voyage.actesCA.filter(a => a.adopte).length;
  const conventionsSignees = voyage.conventions.filter(c => c.signee).length;

  return (
    <div className="space-y-4">
      {/* KPIs conformité */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Actes du CA</div>
            <div className="text-xl font-bold font-display">{actesAdoptes}/{voyage.actesCA.length}</div>
            <div className="text-[10px] text-muted-foreground">adoptés</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Conventions</div>
            <div className="text-xl font-bold font-display">{conventionsSignees}/{voyage.conventions.length}</div>
            <div className="text-[10px] text-muted-foreground">signées</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Checklist totale</div>
            <div className="text-xl font-bold font-display">{checklistStats.pctTotal.toFixed(0)}%</div>
            <Progress value={checklistStats.pctTotal} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Obligations</div>
            <div className={`text-xl font-bold font-display ${checklistStats.pctObligatoire >= 100 ? "text-success" : "text-warning"}`}>
              {checklistStats.obligatoiresDone}/{checklistStats.obligatoires}
            </div>
            <div className="text-[10px] text-muted-foreground">items obligatoires</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Statut global</div>
            <div className="text-xl font-bold font-display">
              {checklistStats.pctObligatoire >= 100 ? (
                <Badge className="bg-success/10 text-success border-0">✅ Conforme</Badge>
              ) : checklistStats.pctObligatoire >= 70 ? (
                <Badge className="bg-warning/10 text-warning border-0">⚠️ En cours</Badge>
              ) : (
                <Badge className="bg-destructive/10 text-destructive border-0">🔴 Incomplet</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actes du CA */}
      <Collapsible open={openSections.actes} onOpenChange={() => toggleSection("actes")}>
        <Card className="shadow-card">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {openSections.actes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Landmark className="h-4 w-4 text-primary" /> Actes du Conseil d'Administration
                <Badge variant="secondary" className="ml-auto text-[10px]">{actesAdoptes}/{voyage.actesCA.length} adoptés</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Date CA</TableHead>
                    <TableHead>N° délibération</TableHead>
                    <TableHead className="text-center">Adopté</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voyage.actesCA.map(acte => (
                    <TableRow key={acte.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{TYPES_ACTE[acte.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px]">{acte.libelle}</TableCell>
                      <TableCell className="text-xs font-mono">{acte.dateCA}</TableCell>
                      <TableCell className="text-xs font-mono">{acte.numeroDeliberation}</TableCell>
                      <TableCell className="text-center">
                        {acte.adopte ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{acte.observations}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {voyage.actesCA.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun acte du CA enregistré</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Conventions */}
      <Collapsible open={openSections.conventions} onOpenChange={() => toggleSection("conventions")}>
        <Card className="shadow-card">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {openSections.conventions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <FileSignature className="h-4 w-4 text-primary" /> Conventions & Marchés
                <Badge variant="secondary" className="ml-auto text-[10px]">{conventionsSignees}/{voyage.conventions.length} signées</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Procédure</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Réf. marché</TableHead>
                    <TableHead className="text-center">Signée</TableHead>
                    <TableHead className="text-center">Notifiée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voyage.conventions.map(conv => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium text-sm">{conv.prestataire}</TableCell>
                      <TableCell className="text-sm">{conv.objet}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {PROCEDURES_PASSATION[conv.procedurePassation]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(conv.montantHT)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(conv.montantTTC)}</TableCell>
                      <TableCell className="text-xs font-mono">{conv.referenceMarche}</TableCell>
                      <TableCell className="text-center">
                        {conv.signee ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {conv.notifiee ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-warning mx-auto" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {voyage.conventions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune convention enregistrée — les conventions seront nécessaires après la mise en concurrence</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Checklist réglementaire */}
      <Collapsible open={openSections.checklist} onOpenChange={() => toggleSection("checklist")}>
        <Card className="shadow-card">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {openSections.checklist ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                📋 Checklist réglementaire
                <Badge variant="secondary" className="ml-auto text-[10px]">{checklistStats.totalDone}/{checklistStats.totalItems} complétés</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Barres de progression par catégorie */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {checklistStats.byCategorie.map(cat => (
                  <div key={cat.categorie} className="space-y-1">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <span>{CATEGORIES_CHECKLIST[cat.categorie].icon}</span>
                      <span className="truncate">{CATEGORIES_CHECKLIST[cat.categorie].label}</span>
                    </div>
                    <Progress value={cat.pct} className={`h-2 ${cat.pct >= 100 ? "[&>div]:bg-success" : cat.pct >= 50 ? "" : "[&>div]:bg-warning"}`} />
                    <div className="text-[10px] text-muted-foreground text-right">{cat.done}/{cat.total}</div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Items par catégorie */}
              {Object.entries(CATEGORIES_CHECKLIST).map(([catKey, catInfo]) => {
                const items = voyage.checklist.filter(c => c.categorie === catKey);
                if (items.length === 0) return null;
                return (
                  <div key={catKey}>
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                      <span>{catInfo.icon}</span> {catInfo.label}
                    </h4>
                    <div className="space-y-1">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${item.fait ? "bg-success/5" : "bg-muted/30 hover:bg-muted/50"}`}
                          onClick={() => toggleChecklist(item.id)}
                        >
                          {item.fait ? (
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          ) : (
                            <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${item.obligatoire ? "border-destructive" : "border-muted-foreground"}`} />
                          )}
                          <span className={`text-sm flex-1 ${item.fait ? "line-through text-muted-foreground" : ""}`}>
                            {item.libelle}
                          </span>
                          {item.obligatoire && !item.fait && (
                            <Badge variant="destructive" className="text-[9px] h-4">Obligatoire</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.responsable}</span>
                          {item.dateFait && (
                            <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{item.dateFait}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
