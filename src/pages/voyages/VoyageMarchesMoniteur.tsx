/**
 * Moniteur Marchés Publics — Alertes seuils CCP avec cumul annuel
 * Mode « Prestation globale » (agence) vs « Gestion directe » (EPLE)
 * Intégration Mobilités Erasmus+ dans les compteurs
 * Conformité M9-6 : validation Agent Comptable
 */
import { useMemo, useState } from "react";
import { ShieldAlert, Scale, CheckCircle2, Info, Gavel, FileText, Plus, Trash2, Globe, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORIES_PRESTATIONS, SEUILS, getRecommandation, ModePassation, MobiliteErasmus } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

interface VoyageData {
  id: string;
  destination: string;
  statut: string;
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  divers: number;
  budget_total?: number;
  budgetTotal?: number;
  modePassation?: ModePassation;
}

interface Props {
  voyages: VoyageData[];
  exercice: number;
  mobilitesErasmus: MobiliteErasmus[];
  onMobilitesChange: (mobilites: MobiliteErasmus[]) => void;
  voyageModes: Record<string, ModePassation>;
  onModeChange: (voyageId: string, mode: ModePassation) => void;
}

const PRECONISATIONS_ALLOTISSEMENT = [
  {
    seuil: "warning",
    titre: "Allotissement par destination",
    description: "Regroupez les prestations identiques (ex: tous les transports) par destination géographique pour obtenir des tarifs compétitifs tout en respectant les seuils.",
    base_legale: "Art. L2113-10 CCP — Principe d'allotissement",
  },
  {
    seuil: "warning",
    titre: "Négociation directe",
    description: "Entre 40 000 et 90 000 € HT, la négociation est permise. Sollicitez 3 devis et négociez les tarifs. Conservez toutes les pièces.",
    base_legale: "Art. R2123-4 CCP — Négociation dans les MAPA",
  },
  {
    seuil: "danger",
    titre: "Groupement de commandes",
    description: "Envisagez un groupement de commandes avec d'autres EPLE de votre bassin pour mutualiser les prestations transport et hébergement.",
    base_legale: "Art. L2113-6 à L2113-8 CCP — Groupement de commandes",
  },
  {
    seuil: "danger",
    titre: "Accord-cadre annuel",
    description: "Si vos voyages sont récurrents, mettez en place un accord-cadre pluriannuel avec un ou plusieurs prestataires pour sécuriser juridiquement vos achats.",
    base_legale: "Art. L2125-1 CCP — Accords-cadres",
  },
];

function evaluerSeuilM96(montant: number): { couleur: string; label: string; classe: string } {
  if (montant >= 40000) return { couleur: "destructive", label: "MAPA obligatoire", classe: "bg-destructive/10 text-destructive" };
  if (montant >= 25000) return { couleur: "warning", label: "Vigilance", classe: "bg-warning/10 text-warning" };
  return { couleur: "success", label: "Conforme", classe: "bg-success/10 text-success" };
}

export const VoyageMarchesMoniteur = ({ voyages, exercice, mobilitesErasmus, onMobilitesChange, voyageModes, onModeChange }: Props) => {
  const voyagesActifs = voyages.filter(v => v.statut !== "annule");
  const [newErasmus, setNewErasmus] = useState(false);
  const [erasmusForm, setErasmusForm] = useState<Partial<MobiliteErasmus>>({});

  // ─── Alertes prestation GLOBALE (agence) : total TTC par voyage ───
  const alertesGlobales = useMemo(() => {
    return voyagesActifs
      .filter(v => (voyageModes[v.id] || v.modePassation || 'directe') === 'globale')
      .map(v => {
        const totalTTC = v.transport + v.hebergement + v.restauration + v.activites + v.assurance;
        const seuil = evaluerSeuilM96(totalTTC);
        return { ...v, totalTTC, ...seuil };
      })
      .filter(v => v.totalTTC >= 40000);
  }, [voyagesActifs, voyageModes]);

  // ─── Erasmus+ cumuls ajoutés aux familles d'achat ───
  const erasmusCumuls = useMemo(() => {
    const transport = mobilitesErasmus.reduce((s, m) => s + m.forfaitVoyage, 0);
    const hebergement = mobilitesErasmus.reduce((s, m) => s + m.forfaitSejour, 0);
    const divers = mobilitesErasmus.reduce((s, m) => s + m.forfaitAppuiOrganisationnel, 0);
    return { transport, hebergement, divers };
  }, [mobilitesErasmus]);

  // ─── Cumul par catégorie (gestion directe + Erasmus+) ───
  const voyagesDirects = voyagesActifs.filter(v => (voyageModes[v.id] || v.modePassation || 'directe') === 'directe');

  const cumulParCategorie = useMemo(() => {
    return CATEGORIES_PRESTATIONS.map(cat => {
      let total = voyagesDirects.reduce((s, v) => s + ((v as any)[cat.key] || 0), 0);
      // Ajouter les forfaits Erasmus+ aux familles correspondantes
      if (cat.key === 'transport') total += erasmusCumuls.transport;
      if (cat.key === 'hebergement') total += erasmusCumuls.hebergement;
      if (cat.key === 'divers') total += erasmusCumuls.divers;

      const reco = getRecommandation(total, cat.label, formatCurrency);
      const detail = voyagesDirects.map(v => ({
        voyage: v.destination,
        montant: (v as any)[cat.key] || 0,
      }));
      // Ajouter le détail Erasmus+
      if (cat.key === 'transport' && erasmusCumuls.transport > 0) detail.push({ voyage: "Erasmus+ (Voyage)", montant: erasmusCumuls.transport });
      if (cat.key === 'hebergement' && erasmusCumuls.hebergement > 0) detail.push({ voyage: "Erasmus+ (Séjour)", montant: erasmusCumuls.hebergement });
      if (cat.key === 'divers' && erasmusCumuls.divers > 0) detail.push({ voyage: "Erasmus+ (Appui org.)", montant: erasmusCumuls.divers });

      return { ...cat, total, ...reco, detail };
    });
  }, [voyagesDirects, erasmusCumuls]);

  const alertes = cumulParCategorie.filter(c => c.niveau !== "ok");
  const totalGeneral = cumulParCategorie.reduce((s, c) => s + c.total, 0);

  const preconisations = useMemo(() => {
    const niveauMax = alertes.length === 0 ? "ok" :
      alertes.some(a => a.niveau === "critical") ? "critical" :
      alertes.some(a => a.niveau === "danger") ? "danger" : "warning";
    return PRECONISATIONS_ALLOTISSEMENT.filter(p => {
      if (niveauMax === "critical" || niveauMax === "danger") return true;
      if (niveauMax === "warning") return p.seuil === "warning";
      return false;
    });
  }, [alertes]);

  const chartData = cumulParCategorie.map(cat => ({ name: cat.label, Cumul: cat.total }));
  const ventilationChart = voyagesDirects.map(v => ({
    name: v.destination,
    Transport: v.transport,
    Hébergement: v.hebergement,
    Restauration: v.restauration,
    Activités: v.activites,
    Assurance: v.assurance,
    Divers: v.divers,
  }));

  const handleAddErasmus = () => {
    if (!erasmusForm.intitule || !erasmusForm.pays) return;
    const mobilite: MobiliteErasmus = {
      id: `erasmus-${Date.now()}`,
      intitule: erasmusForm.intitule || "",
      pays: erasmusForm.pays || "",
      nbParticipants: erasmusForm.nbParticipants || 0,
      forfaitAppuiOrganisationnel: erasmusForm.forfaitAppuiOrganisationnel || 0,
      forfaitVoyage: erasmusForm.forfaitVoyage || 0,
      forfaitSejour: erasmusForm.forfaitSejour || 0,
      dateDebut: erasmusForm.dateDebut || "",
      dateFin: erasmusForm.dateFin || "",
      observations: erasmusForm.observations || "",
    };
    onMobilitesChange([...mobilitesErasmus, mobilite]);
    setErasmusForm({});
    setNewErasmus(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* ═══ 1. SÉLECTEUR MODE PASSATION PAR VOYAGE ═══ */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" /> Mode de passation par voyage
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Sélectionnez le mode d'achat pour chaque voyage. Cela détermine le calcul des seuils.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voyage</TableHead>
                  <TableHead>Mode de passation</TableHead>
                  <TableHead className="text-right">Total prestations</TableHead>
                  <TableHead>Statut M9-6</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voyagesActifs.map(v => {
                  const mode = voyageModes[v.id] || v.modePassation || 'directe';
                  const totalTTC = v.transport + v.hebergement + v.restauration + v.activites + v.assurance;
                  const seuilInfo = mode === 'globale' ? evaluerSeuilM96(totalTTC) : { couleur: "muted", label: "Calcul par famille", classe: "bg-muted text-muted-foreground" };
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">{v.destination}</TableCell>
                      <TableCell>
                        <RadioGroup
                          value={mode}
                          onValueChange={(val) => onModeChange(v.id, val as ModePassation)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="globale" id={`globale-${v.id}`} />
                            <Label htmlFor={`globale-${v.id}`} className="text-xs cursor-pointer">Prestation globale (Agence)</Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="directe" id={`directe-${v.id}`} />
                            <Label htmlFor={`directe-${v.id}`} className="text-xs cursor-pointer">Gestion directe (EPLE)</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(totalTTC)}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className={`text-[10px] border-0 ${seuilInfo.classe}`}>
                              {mode === 'globale' ? (totalTTC >= 40000 ? "🔴" : totalTTC >= 25000 ? "🟠" : "🟢") : "📊"} {seuilInfo.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {mode === 'globale'
                              ? `En prestation globale, le seuil de 40 000 € HT s'applique au montant total TTC du voyage. Au-delà, une procédure MAPA est obligatoire. L'Agent Comptable vérifie la validité de la publicité (M9-6).`
                              : `En gestion directe, le seuil s'applique par famille d'achat cumulée sur l'exercice (tous voyages confondus).`
                            }
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ═══ ALERTES GLOBALES (Agence > 40k) ═══ */}
        {alertesGlobales.length > 0 && (
          <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-bold text-sm">
              🚨 ALERTE BLOQUANTE — Prestation globale &gt; 40 000 € HT
            </AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              {alertesGlobales.map(v => (
                <div key={v.id} className="p-3 bg-background rounded-md border border-destructive/30 space-y-1">
                  <p className="font-semibold">{v.destination} — {formatCurrency(v.totalTTC)} TTC (prestation globale)</p>
                  <p className="text-muted-foreground">
                    Procédure de publicité obligatoire (MAPA). L'Agent Comptable vérifiera la validité de la mise en concurrence
                    avant tout mandatement. <strong>Une fiche « Marché » doit être créée dans Op@le.</strong>
                  </p>
                  <p className="text-[10px] italic text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Instruction M9-6 §4.3.2 — Contrôle de la régularité des engagements juridiques
                  </p>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* ═══ 2. MOBILITÉS ERASMUS+ ═══ */}
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Mobilités Erasmus+ — Intégration aux seuils
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Les forfaits Erasmus+ s'ajoutent aux compteurs des familles d'achat correspondantes (Transport, Hébergement).
              {mobilitesErasmus.length > 0 && (
                <span className="ml-1 font-semibold">
                  Impact : +{formatCurrency(erasmusCumuls.transport)} transport, +{formatCurrency(erasmusCumuls.hebergement)} hébergement
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {mobilitesErasmus.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mobilité</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">Appui org.</TableHead>
                    <TableHead className="text-right">Forfait voyage</TableHead>
                    <TableHead className="text-right">Forfait séjour</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mobilitesErasmus.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">{m.intitule}</TableCell>
                      <TableCell className="text-sm">{m.pays}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(m.forfaitAppuiOrganisationnel)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(m.forfaitVoyage)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(m.forfaitSejour)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatCurrency(m.forfaitAppuiOrganisationnel + m.forfaitVoyage + m.forfaitSejour)}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() =>
                          onMobilitesChange(mobilitesErasmus.filter(x => x.id !== m.id))
                        }>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {newErasmus ? (
              <div className="p-4 rounded-lg border bg-accent/30 space-y-3">
                <p className="text-sm font-semibold">Nouvelle mobilité Erasmus+</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label className="text-xs">Intitulé *</Label><Input value={erasmusForm.intitule || ""} onChange={e => setErasmusForm({ ...erasmusForm, intitule: e.target.value })} placeholder="KA1 Enseignants" className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Pays *</Label><Input value={erasmusForm.pays || ""} onChange={e => setErasmusForm({ ...erasmusForm, pays: e.target.value })} placeholder="Finlande" className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Participants</Label><Input type="number" value={erasmusForm.nbParticipants || ""} onChange={e => setErasmusForm({ ...erasmusForm, nbParticipants: +e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Dates</Label><div className="flex gap-1"><Input type="date" value={erasmusForm.dateDebut || ""} onChange={e => setErasmusForm({ ...erasmusForm, dateDebut: e.target.value })} className="h-8 text-xs" /><Input type="date" value={erasmusForm.dateFin || ""} onChange={e => setErasmusForm({ ...erasmusForm, dateFin: e.target.value })} className="h-8 text-xs" /></div></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Forfait Appui org. (€)</Label><Input type="number" value={erasmusForm.forfaitAppuiOrganisationnel || ""} onChange={e => setErasmusForm({ ...erasmusForm, forfaitAppuiOrganisationnel: +e.target.value })} className="h-8 text-sm" placeholder="350" /></div>
                  <div><Label className="text-xs">Forfait Voyage (€)</Label><Input type="number" value={erasmusForm.forfaitVoyage || ""} onChange={e => setErasmusForm({ ...erasmusForm, forfaitVoyage: +e.target.value })} className="h-8 text-sm" placeholder="275" /></div>
                  <div><Label className="text-xs">Forfait Séjour (€)</Label><Input type="number" value={erasmusForm.forfaitSejour || ""} onChange={e => setErasmusForm({ ...erasmusForm, forfaitSejour: +e.target.value })} className="h-8 text-sm" placeholder="1100" /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddErasmus} disabled={!erasmusForm.intitule || !erasmusForm.pays}>Ajouter</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setNewErasmus(false); setErasmusForm({}); }}>Annuler</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setNewErasmus(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une mobilité Erasmus+
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ═══ BANDEAU D'ALERTE GLOBAL (gestion directe) ═══ */}
        {alertes.length > 0 ? (
          <Alert variant="destructive" className="border-destructive/50">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              {alertes.length} alerte{alertes.length > 1 ? "s" : ""} marchés publics (gestion directe) — Exercice {exercice}
            </AlertTitle>
            <AlertDescription className="text-sm">
              Des cumuls annuels par nature de prestation (voyages + Erasmus+) dépassent les seuils du Code de la Commande Publique.
              Action immédiate requise pour le Secrétaire Général et l'Agent Comptable.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-success/50 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="font-semibold text-success">Conformité marchés publics (gestion directe) — Exercice {exercice}</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              Tous les cumuls par prestation sont sous le seuil de 40 000 € HT. Aucune procédure formalisée requise.
            </AlertDescription>
          </Alert>
        )}

        {/* ═══ 3. CONFORMITÉ M9-6 — Indicateur global ═══ */}
        <Card className="shadow-card border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Conformité M9-6 — Contrôle Agent Comptable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Indicateur Vert/Orange/Rouge par mode */}
              <div className="p-3 rounded-lg border space-y-1">
                <p className="text-xs text-muted-foreground">Prestations globales (agences)</p>
                {(() => {
                  const totalGlobales = voyagesActifs
                    .filter(v => (voyageModes[v.id] || 'directe') === 'globale')
                    .reduce((s, v) => s + v.transport + v.hebergement + v.restauration + v.activites + v.assurance, 0);
                  const info = evaluerSeuilM96(totalGlobales);
                  return (
                    <>
                      <p className="text-lg font-bold font-mono">{formatCurrency(totalGlobales)}</p>
                      <Badge variant="secondary" className={`text-[10px] border-0 ${info.classe}`}>
                        {totalGlobales >= 40000 ? "🔴" : totalGlobales >= 25000 ? "🟠" : "🟢"} {info.label}
                      </Badge>
                    </>
                  );
                })()}
              </div>
              <div className="p-3 rounded-lg border space-y-1">
                <p className="text-xs text-muted-foreground">Gestion directe (cumul + Erasmus+)</p>
                {(() => {
                  const info = evaluerSeuilM96(totalGeneral);
                  return (
                    <>
                      <p className="text-lg font-bold font-mono">{formatCurrency(totalGeneral)}</p>
                      <Badge variant="secondary" className={`text-[10px] border-0 ${info.classe}`}>
                        {totalGeneral >= 40000 ? "🔴" : totalGeneral >= 25000 ? "🟠" : "🟢"} {info.label}
                      </Badge>
                    </>
                  );
                })()}
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                <p className="text-xs text-muted-foreground">Rappel réglementaire</p>
                <p className="text-xs">
                  <strong>Instruction M9-6 :</strong> l'Agent Comptable vérifie la validité de la publicité et de la mise en concurrence 
                  pour tout engagement dépassant <strong>40 000 € HT</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pour les montants &gt; 40 000 € HT, une fiche « Marché » doit être créée dans <strong>Op@le</strong> avant engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ ALERTES DÉTAILLÉES (gestion directe) ═══ */}
        {alertes.length > 0 && (
          <Card className="shadow-card border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> Alertes détaillées — Actions requises
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertes.map(alerte => (
                <div key={alerte.key} className="p-4 rounded-lg bg-background border space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-sm">{alerte.icon} {alerte.label} — {formatCurrency(alerte.total)} HT cumulés</span>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${
                      alerte.niveau === "warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                    }`}>
                      {alerte.niveau === "warning" ? "⚠️ 3 devis min." : alerte.niveau === "danger" ? "🔴 MAPA" : "🚨 Seuil UE"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alerte.texte}</p>
                  <div className="bg-accent/50 p-3 rounded-md">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5" /> Action à mener :
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{alerte.action}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 cursor-help">
                        <Info className="h-3 w-3" /> {alerte.base_legale}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm text-xs">
                      Selon l'instruction M9-6, l'Agent Comptable vérifiera la validité de la publicité
                      pour tout engagement dépassant le seuil de 40 000 € HT. Une fiche Marché Op@le est requise.
                    </TooltipContent>
                  </Tooltip>
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-1">Ventilation par voyage / mobilité :</p>
                    <div className="flex flex-wrap gap-2">
                      {alerte.detail.filter(d => d.montant > 0).map(d => (
                        <Badge key={d.voyage} variant="outline" className="text-[10px] font-mono">
                          {d.voyage} : {formatCurrency(d.montant)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Préconisations */}
        {preconisations.length > 0 && (
          <Card className="shadow-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" /> Préconisations réglementaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preconisations.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-semibold">{p.titre}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-[10px] text-muted-foreground italic">{p.base_legale}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tableau cumul par catégorie */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Cumul annuel par nature — Gestion directe + Erasmus+ — {voyagesDirects.length} voyage{voyagesDirects.length > 1 ? "s" : ""}
              {mobilitesErasmus.length > 0 && <Badge variant="outline" className="text-[10px]">+ {mobilitesErasmus.length} mobilité{mobilitesErasmus.length > 1 ? "s" : ""} Erasmus+</Badge>}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total cumulé : <span className="font-semibold font-mono">{formatCurrency(totalGeneral)} HT</span>
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nature</TableHead>
                  <TableHead className="text-right">Cumul annuel HT</TableHead>
                  <TableHead className="min-w-[140px]">Jauge vs seuil MAPA</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action requise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cumulParCategorie.map(cat => {
                  const pct = Math.min((cat.total / SEUILS.PROCEDURE_ADAPTEE) * 100, 100);
                  return (
                    <TableRow key={cat.key}>
                      <TableCell className="font-medium text-sm">
                        <span className="mr-1">{cat.icon}</span>{cat.label}
                        <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(cat.total)}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Progress value={pct} className={`h-2.5 ${cat.niveau === "ok" ? "" : cat.niveau === "warning" ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`} />
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>0</span>
                            <span>{formatCurrency(SEUILS.SANS_PUBLICITE)}</span>
                            <span>{formatCurrency(SEUILS.PROCEDURE_ADAPTEE)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${
                          cat.niveau === "ok" ? "bg-success/10 text-success" :
                          cat.niveau === "warning" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {cat.niveau === "ok" ? "✅ Conforme" : cat.niveau === "warning" ? "⚠️ 3 devis min." : cat.niveau === "danger" ? "🔴 MAPA" : "🚨 Seuil UE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {cat.action.split(".")[0]}.
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Separator className="my-3" />
            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> &lt; {formatCurrency(SEUILS.SANS_PUBLICITE)} : Achat libre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> {formatCurrency(SEUILS.SANS_PUBLICITE)} — {formatCurrency(SEUILS.PROCEDURE_ADAPTEE)} : 3 devis + grille</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> &gt; {formatCurrency(SEUILS.PROCEDURE_ADAPTEE)} : MAPA avec publicité</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> &gt; {formatCurrency(SEUILS.SEUIL_EUROPEEN)} : Appel d'offres européen</span>
            </div>
          </CardContent>
        </Card>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cumul par prestation vs seuils</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <ReferenceLine x={SEUILS.SANS_PUBLICITE} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: "40k", position: "top", fontSize: 9 }} />
                  <ReferenceLine x={SEUILS.PROCEDURE_ADAPTEE} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "90k", position: "top", fontSize: 9 }} />
                  <Bar dataKey="Cumul" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ventilation par voyage (gestion directe)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ventilationChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Transport" stackId="a" fill="hsl(215, 70%, 45%)" />
                  <Bar dataKey="Hébergement" stackId="a" fill="hsl(160, 45%, 45%)" />
                  <Bar dataKey="Restauration" stackId="a" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="Activités" stackId="a" fill="hsl(280, 60%, 55%)" />
                  <Bar dataKey="Assurance" stackId="a" fill="hsl(215, 25%, 65%)" />
                  <Bar dataKey="Divers" stackId="a" fill="hsl(0, 0%, 75%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};
