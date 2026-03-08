import { useMemo } from "react";
import { Euro, CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Voyage, SubventionVoyage, TYPES_SUBVENTION } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

const STATUT_LABELS: Record<SubventionVoyage["statut"], { label: string; class: string }> = {
  demande: { label: "Demandée", class: "bg-info/10 text-info" },
  en_attente: { label: "En attente", class: "bg-warning/10 text-warning" },
  accorde: { label: "Accordée", class: "bg-success/10 text-success" },
  refuse: { label: "Refusée", class: "bg-destructive/10 text-destructive" },
  encaisse: { label: "Encaissée", class: "bg-success/10 text-success" },
};

const COLORS = ["hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(215, 25%, 65%)", "hsl(0, 70%, 55%)"];

export const VoyageSubventionsTab = ({ voyage, onUpdateVoyage }: Props) => {
  const subs = voyage.subventionsDetail;

  const stats = useMemo(() => {
    const totalDemande = subs.reduce((s, sub) => s + sub.montantDemande, 0);
    const totalAccorde = subs.reduce((s, sub) => s + sub.montantAccorde, 0);
    const totalPercu = subs.reduce((s, sub) => s + sub.montantPercu, 0);
    const resteAPercevoir = totalAccorde - totalPercu;
    const tauxAcceptation = totalDemande > 0 ? (totalAccorde / totalDemande) * 100 : 0;
    const promesses = subs.filter(s => s.promesseDon);
    const totalPromesses = promesses.reduce((s, sub) => s + sub.montantAccorde, 0);
    const nbEncaissees = subs.filter(s => s.statut === "encaisse").length;
    const nbEnAttente = subs.filter(s => s.statut === "en_attente" || s.statut === "demande").length;
    return { totalDemande, totalAccorde, totalPercu, resteAPercevoir, tauxAcceptation, totalPromesses, nbEncaissees, nbEnAttente, promesses };
  }, [subs]);

  // Pie chart data par type
  const pieData = useMemo(() => {
    const byType: Record<string, number> = {};
    subs.forEach(sub => {
      const label = TYPES_SUBVENTION[sub.type];
      byType[label] = (byType[label] || 0) + sub.montantAccorde;
    });
    return Object.entries(byType).filter(([_, v]) => v > 0).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [subs]);

  // Bar chart: demandé vs accordé vs perçu
  const barData = subs.filter(s => s.montantDemande > 0).map(s => ({
    name: s.organisme.length > 15 ? s.organisme.substring(0, 15) + "…" : s.organisme,
    Demandé: s.montantDemande,
    Accordé: s.montantAccorde,
    Perçu: s.montantPercu,
  }));

  // Couverture du budget par les subventions
  const couvertureSubventions = voyage.budgetTotal > 0 ? (stats.totalAccorde / voyage.budgetTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total demandé</div>
            <div className="text-lg font-bold font-mono">{formatCurrency(stats.totalDemande)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total accordé</div>
            <div className="text-lg font-bold font-mono text-success">{formatCurrency(stats.totalAccorde)}</div>
            <div className="text-[10px] text-muted-foreground">{stats.tauxAcceptation.toFixed(0)}% du demandé</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Encaissé</div>
            <div className="text-lg font-bold font-mono">{formatCurrency(stats.totalPercu)}</div>
            <div className="text-[10px] text-muted-foreground">{stats.nbEncaissees} subvention(s)</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Reste à percevoir</div>
            <div className={`text-lg font-bold font-mono ${stats.resteAPercevoir > 0 ? "text-warning" : "text-success"}`}>
              {formatCurrency(stats.resteAPercevoir)}
            </div>
            <div className="text-[10px] text-muted-foreground">{stats.nbEnAttente} en attente</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Couverture budget</div>
            <div className="text-lg font-bold">{couvertureSubventions.toFixed(0)}%</div>
            <Progress value={Math.min(couvertureSubventions, 100)} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Promesses de dons */}
      {stats.promesses.length > 0 && (
        <Card className="shadow-card border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" /> Promesses de dons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.promesses.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-background p-2 rounded-md border">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{p.organisme}</div>
                    <div className="text-xs text-muted-foreground">{p.objet}</div>
                  </div>
                  <div className="text-sm font-mono font-semibold text-primary">{formatCurrency(p.montantAccorde)}</div>
                  <Badge variant="secondary" className={`text-[10px] border-0 ${STATUT_LABELS[p.statut].class}`}>
                    {STATUT_LABELS[p.statut].label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par type de financement</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} strokeWidth={1}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune subvention accordée</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Demandé vs Accordé vs Perçu</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Demandé" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Accordé" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Perçu" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Euro className="h-4 w-4 text-primary" /> Détail des subventions et financements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisme</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="text-right">Demandé</TableHead>
                <TableHead className="text-right">Accordé</TableHead>
                <TableHead className="text-right">Perçu</TableHead>
                <TableHead>Notification</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium text-sm">{sub.organisme}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{TYPES_SUBVENTION[sub.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px]">{sub.objet}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(sub.montantDemande)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(sub.montantAccorde)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {sub.montantPercu > 0 ? (
                      <span className="text-success">{formatCurrency(sub.montantPercu)}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{sub.referenceNotification || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${STATUT_LABELS[sub.statut].class}`}>
                      {sub.statut === "encaisse" && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
                      {sub.statut === "en_attente" && <Clock className="h-3 w-3 mr-0.5" />}
                      {sub.statut === "refuse" && <XCircle className="h-3 w-3 mr-0.5" />}
                      {STATUT_LABELS[sub.statut].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {subs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune subvention enregistrée</p>
          )}
        </CardContent>
      </Card>

      {/* Plan de financement synthétique */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Plan de financement synthétique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold mb-2">Ressources</h4>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs">Participation familles</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(voyage.participationFamilles)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Subventions accordées</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(stats.totalAccorde)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Autofinancement</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(voyage.autofinancement)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-bold">Total ressources</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {formatCurrency(voyage.participationFamilles + stats.totalAccorde + voyage.autofinancement)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-2">Emplois</h4>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs">Budget total voyage</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(voyage.budgetTotal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-bold">Reste à charge établissement</TableCell>
                    <TableCell className={`text-right font-mono text-xs font-bold ${voyage.chargeEtablissement > 0 ? "text-destructive" : "text-success"}`}>
                      {formatCurrency(voyage.chargeEtablissement)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
