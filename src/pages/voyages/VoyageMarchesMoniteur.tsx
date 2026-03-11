/**
 * Moniteur Marchés Publics — Alertes seuils CCP avec cumul annuel
 * Code de la Commande Publique (CCP) 2024
 * Seuils: 40k€ (3 devis), 90k€ (MAPA), 221k€ (UE)
 */
import { useMemo } from "react";
import { ShieldAlert, Scale, AlertTriangle, CheckCircle2, Info, TrendingUp, Gavel, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CATEGORIES_PRESTATIONS, SEUILS, getRecommandation } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

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
}

interface Props {
  voyages: VoyageData[];
  exercice: number;
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

export const VoyageMarchesMoniteur = ({ voyages, exercice }: Props) => {
  const voyagesActifs = voyages.filter(v => v.statut !== "annule");

  const cumulParCategorie = useMemo(() => {
    return CATEGORIES_PRESTATIONS.map(cat => {
      const total = voyagesActifs.reduce((s, v) => s + ((v as any)[cat.key] || 0), 0);
      const reco = getRecommandation(total, cat.label, formatCurrency);
      const detail = voyagesActifs.map(v => ({
        voyage: v.destination,
        montant: (v as any)[cat.key] || 0,
      }));
      return { ...cat, total, ...reco, detail };
    });
  }, [voyagesActifs]);

  const alertes = cumulParCategorie.filter(c => c.niveau !== "ok");
  const totalGeneral = cumulParCategorie.reduce((s, c) => s + c.total, 0);

  // Préconisations applicables
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

  const chartData = cumulParCategorie.map(cat => ({
    name: cat.label,
    Cumul: cat.total,
  }));

  const ventilationChart = voyagesActifs.map(v => ({
    name: v.destination,
    Transport: v.transport,
    Hébergement: v.hebergement,
    Restauration: v.restauration,
    Activités: v.activites,
    Assurance: v.assurance,
    Divers: v.divers,
  }));

  return (
    <div className="space-y-5">
      {/* Bandeau d'alerte global */}
      {alertes.length > 0 ? (
        <Alert variant="destructive" className="border-destructive/50">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {alertes.length} alerte{alertes.length > 1 ? "s" : ""} marchés publics — Exercice {exercice}
          </AlertTitle>
          <AlertDescription className="text-sm">
            Des cumuls annuels par nature de prestation dépassent les seuils du Code de la Commande Publique.
            Action immédiate requise pour le Secrétaire Général et l'Agent Comptable.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-success/50 bg-success/5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="font-semibold text-success">Conformité marchés publics — Exercice {exercice}</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Tous les cumuls par prestation sont sous le seuil de 40 000 € HT. Aucune procédure formalisée requise.
          </AlertDescription>
        </Alert>
      )}

      {/* Alertes détaillées */}
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
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <Info className="h-3 w-3" /> {alerte.base_legale}
                </p>
                <div className="mt-2">
                  <p className="text-xs font-semibold mb-1">Ventilation par voyage :</p>
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

      {/* Préconisations IA */}
      {preconisations.length > 0 && (
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" /> Préconisations réglementaires
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Conseils basés sur le Code de la Commande Publique pour optimiser vos achats
            </p>
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
            <ShieldAlert className="h-4 w-4 text-primary" /> Cumul annuel par nature de prestation — {voyagesActifs.length} voyage{voyagesActifs.length > 1 ? "s" : ""} actif{voyagesActifs.length > 1 ? "s" : ""}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Total cumulé toutes prestations : <span className="font-semibold font-mono">{formatCurrency(totalGeneral)} HT</span>
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
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <ReferenceLine x={SEUILS.SANS_PUBLICITE} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: "40k", position: "top", fontSize: 9 }} />
                <ReferenceLine x={SEUILS.PROCEDURE_ADAPTEE} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "90k", position: "top", fontSize: 9 }} />
                <Bar dataKey="Cumul" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ventilation par voyage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ventilationChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
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
  );
};
