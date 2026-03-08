import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mockData";
import { Satd, TiersDetenteur, STATUT_SATD_CONFIG, TYPE_DEBITEUR_LABELS } from "./types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { AlertTriangle } from "lucide-react";

interface Props {
  satds: Satd[];
  tiers: TiersDetenteur[];
}

export default function SatdStats({ satds, tiers }: Props) {
  const totalInitial = satds.reduce((s, a) => s + a.montantGlobal, 0);
  const totalPreleve = satds.reduce((s, a) => s + a.montantPreleve, 0);
  const tauxRecouvrement = totalInitial > 0 ? (totalPreleve / totalInitial) * 100 : 0;

  const parStatut = useMemo(() => {
    const fills: Record<string, string> = {
      relance: "hsl(var(--muted-foreground))",
      avis_poursuites: "hsl(38, 92%, 50%)",
      autorisation: "hsl(38, 70%, 60%)",
      emise: "hsl(215, 70%, 45%)",
      en_cours: "hsl(38, 92%, 50%)",
      termine: "hsl(142, 60%, 40%)",
      suspendu: "hsl(var(--muted-foreground))",
      conteste: "hsl(0, 72%, 51%)",
      prescrit: "hsl(0, 50%, 40%)",
      irrecouv: "hsl(var(--muted-foreground))",
    };
    const counts: Record<string, number> = {};
    satds.forEach(s => { counts[s.statut] = (counts[s.statut] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({
      name: STATUT_SATD_CONFIG[k]?.label || k,
      value: v,
      fill: fills[k] || "hsl(215, 70%, 45%)",
    }));
  }, [satds]);

  const parType = useMemo(() => {
    const types: Record<string, number> = {};
    satds.forEach(s => { types[s.typeDebiteur] = (types[s.typeDebiteur] || 0) + s.montantGlobal; });
    return Object.entries(types).map(([k, v]) => ({ name: TYPE_DEBITEUR_LABELS[k] || k, value: v }));
  }, [satds]);

  const timelinePrel = useMemo(() => {
    const months: Record<string, number> = {};
    satds.forEach(s => s.prelevements.forEach(p => {
      const m = p.date.substring(0, 7);
      months[m] = (months[m] || 0) + p.montant;
    }));
    return Object.entries(months).sort().map(([m, v]) => ({
      mois: new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      montant: v,
    }));
  }, [satds]);

  // Prescriptions proches (< 6 mois)
  const prescriptionsProches = useMemo(() => {
    const now = new Date();
    const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    return satds.filter(s => s.statut !== "termine" && s.statut !== "prescrit" && s.statut !== "irrecouv" && new Date(s.datePrescription) <= sixMonths);
  }, [satds]);

  return (
    <div className="space-y-6">
      {/* Alertes prescription */}
      {prescriptionsProches.length > 0 && (
        <Card className="shadow-card border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">⚠️ Alertes prescription</p>
                {prescriptionsProches.map(s => (
                  <p key={s.id} className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{s.reference}</strong> — {s.debiteur} ({formatCurrency(s.montantGlobal - s.montantPreleve)} restant) — 
                    Prescription le <strong className="text-destructive">{new Date(s.datePrescription).toLocaleDateString("fr-FR")}</strong>
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition par statut</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={parStatut} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {parStatut.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Montants par type de débiteur</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={parType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Prélèvements mensuels</CardTitle></CardHeader>
          <CardContent>
            {timelinePrel.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelinePrel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="montant" stroke="hsl(142, 60%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun prélèvement enregistré</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Synthèse pour le compte financier</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
          <p>L'agence comptable a traité <strong className="text-foreground">{satds.length} procédure(s)</strong> de saisie administrative à tiers détenteur pour un montant total de <strong className="text-foreground">{formatCurrency(totalInitial)}</strong>.</p>
          <p><strong className="text-success">{formatCurrency(totalPreleve)}</strong> ont été recouvrés, soit un taux de recouvrement de <strong className="text-foreground">{tauxRecouvrement.toFixed(0)}%</strong>. Le reste à recouvrer s'élève à <strong className="text-warning">{formatCurrency(totalInitial - totalPreleve)}</strong>.</p>
          {satds.filter(s => s.statut === "en_cours").length > 0 && (
            <p><strong className="text-foreground">{satds.filter(s => s.statut === "en_cours").length} procédure(s)</strong> sont actuellement en cours de prélèvement.</p>
          )}
          {satds.filter(s => s.statut === "conteste").length > 0 && (
            <p><strong className="text-destructive">{satds.filter(s => s.statut === "conteste").length} procédure(s)</strong> font l'objet d'une contestation.</p>
          )}
          {prescriptionsProches.length > 0 && (
            <p className="text-destructive font-semibold">⚠️ {prescriptionsProches.length} procédure(s) risquent la prescription dans les 6 prochains mois.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
