import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/mockData";
import { Budget, TYPE_LABELS, DemandeAide } from "./types";
import { Euro, AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  budgets: Budget[];
  demandes: DemandeAide[];
}

export default function FondsSociauxBudget({ budgets, demandes }: Props) {
  const totalDispo = budgets.reduce((s, b) => s + b.totalDisponible, 0);
  const totalVerse = budgets.reduce((s, b) => s + b.verse, 0);
  const totalEngage = budgets.reduce((s, b) => s + b.engage, 0);
  const totalReste = budgets.reduce((s, b) => s + b.reste, 0);
  const tauxConsommation = totalDispo > 0 ? ((totalVerse + totalEngage) / totalDispo) * 100 : 0;

  const pieData = budgets.map((b, i) => ({
    name: b.type,
    value: b.totalDisponible,
    fill: ["hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(280, 60%, 55%)", "hsl(38, 92%, 50%)"][i],
  }));

  // Prévision de consommation par trimestre
  const consommationParTrimestre = useMemo(() => {
    const trims: Record<string, number> = { T1: 0, T2: 0, T3: 0 };
    demandes.filter(d => d.statut === "verse" || d.statut === "accorde").forEach(d => {
      if (d.trimestre !== "annuel") trims[d.trimestre] = (trims[d.trimestre] || 0) + d.montantAccorde;
      else { trims.T1 += d.montantAccorde / 3; trims.T2 += d.montantAccorde / 3; trims.T3 += d.montantAccorde / 3; }
    });
    return Object.entries(trims).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [demandes]);

  return (
    <div className="space-y-6">
      {/* Synthèse budgétaire */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1"><Wallet className="h-3.5 w-3.5" /> Crédits disponibles</div>
            <p className="text-xl font-bold font-display">{formatCurrency(totalDispo)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Dotations + reports N-1</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1"><Euro className="h-3.5 w-3.5" /> Total versé</div>
            <p className="text-xl font-bold font-display text-success">{formatCurrency(totalVerse)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Mandats émis</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1"><TrendingUp className="h-3.5 w-3.5" /> Engagé non versé</div>
            <p className="text-xl font-bold font-display text-warning">{formatCurrency(totalEngage - totalVerse)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Décisions en attente de mandat</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-accent">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1"><Wallet className="h-3.5 w-3.5" /> Solde disponible</div>
            <p className="text-xl font-bold font-display">{formatCurrency(totalReste)}</p>
            <Progress value={100 - tauxConsommation} className="mt-2 h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{tauxConsommation.toFixed(0)}% consommé</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau détaillé */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Suivi des crédits par type de fonds</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonds</TableHead>
                  <TableHead className="text-right">Dotation initiale</TableHead>
                  <TableHead className="text-right">Compléments</TableHead>
                  <TableHead className="text-right">Report N-1</TableHead>
                  <TableHead className="text-right font-semibold">Total dispo</TableHead>
                  <TableHead className="text-right">Versé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead>Conso.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map(b => {
                  const pct = b.totalDisponible > 0 ? ((b.verse + (b.engage - b.verse)) / b.totalDisponible) * 100 : 0;
                  const alert = pct > 80;
                  return (
                    <TableRow key={b.type}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-semibold">{b.type}</Badge>
                          <span className="text-xs text-muted-foreground hidden lg:inline">{TYPE_LABELS[b.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(b.dotationInitiale)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{b.dotationComplementaire > 0 ? `+${formatCurrency(b.dotationComplementaire)}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{b.reportAnneePrecedente > 0 ? `+${formatCurrency(b.reportAnneePrecedente)}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(b.totalDisponible)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">{formatCurrency(b.verse)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(b.reste)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="w-16 h-1.5" />
                          <span className="text-xs font-mono">{pct.toFixed(0)}%</span>
                          {alert && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Total */}
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(budgets.reduce((s, b) => s + b.dotationInitiale, 0))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(budgets.reduce((s, b) => s + b.dotationComplementaire, 0))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(budgets.reduce((s, b) => s + b.reportAnneePrecedente, 0))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totalDispo)}</TableCell>
                  <TableCell className="text-right font-mono text-success">{formatCurrency(totalVerse)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totalReste)}</TableCell>
                  <TableCell>
                    <span className="text-xs font-mono">{tauxConsommation.toFixed(0)}%</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Répartition graphique */}
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition des dotations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Consommation par trimestre</p>
              {consommationParTrimestre.map(t => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.name}</span>
                  <span className="font-mono font-medium">{formatCurrency(t.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes budgétaires */}
      {budgets.some(b => b.totalDisponible > 0 && ((b.verse + (b.engage - b.verse)) / b.totalDisponible) > 0.75) && (
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Alertes budgétaires</p>
                {budgets.filter(b => b.totalDisponible > 0 && ((b.verse + (b.engage - b.verse)) / b.totalDisponible) > 0.75).map(b => {
                  const pct = ((b.verse + (b.engage - b.verse)) / b.totalDisponible) * 100;
                  return (
                    <p key={b.type} className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{TYPE_LABELS[b.type]}</strong> : {pct.toFixed(0)}% consommé — reste {formatCurrency(b.reste)}.
                      {pct > 90 ? " ⚠️ Demander une dotation complémentaire au rectorat." : " Surveiller la consommation au prochain trimestre."}
                    </p>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
