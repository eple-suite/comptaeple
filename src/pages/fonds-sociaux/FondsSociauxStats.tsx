import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mockData";
import { DemandeAide, Budget, Commission, TYPE_LABELS, NATURES_AIDE } from "./types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from "recharts";

interface Props {
  demandes: DemandeAide[];
  budgets: Budget[];
  commissions: Commission[];
}

export default function FondsSociauxStats({ demandes, budgets, commissions }: Props) {
  const accordes = demandes.filter(d => d.statut === "accorde" || d.statut === "verse");
  const totalVerse = accordes.reduce((s, d) => s + d.montantAccorde, 0);
  const nbBeneficiaires = new Set(accordes.map(d => d.eleveId)).size;

  const repartitionType = useMemo(() => [
    { name: "FSL", value: accordes.filter(d => d.type === "FSL").reduce((s, d) => s + d.montantAccorde, 0), fill: "hsl(215, 70%, 45%)" },
    { name: "FSC", value: accordes.filter(d => d.type === "FSC").reduce((s, d) => s + d.montantAccorde, 0), fill: "hsl(160, 45%, 45%)" },
    { name: "FSE", value: accordes.filter(d => d.type === "FSE").reduce((s, d) => s + d.montantAccorde, 0), fill: "hsl(280, 60%, 55%)" },
    { name: "Autre", value: accordes.filter(d => d.type === "autre").reduce((s, d) => s + d.montantAccorde, 0), fill: "hsl(38, 92%, 50%)" },
  ].filter(r => r.value > 0), [accordes]);

  const repartitionNature = useMemo(() => {
    const natures: Record<string, number> = {};
    accordes.forEach(d => {
      const k = NATURES_AIDE[d.nature] || d.nature;
      natures[k] = (natures[k] || 0) + d.montantAccorde;
    });
    return Object.entries(natures).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [accordes]);

  const repartitionRegime = useMemo(() => {
    const labels: Record<string, string> = { interne: "Internes", dp: "Demi-pensionnaires", externe: "Externes" };
    const r: Record<string, number> = {};
    accordes.forEach(d => { const k = labels[d.eleve.regime]; r[k] = (r[k] || 0) + 1; });
    return Object.entries(r).map(([name, value]) => ({ name, value }));
  }, [accordes]);

  const repartitionBourse = useMemo(() => {
    const b = accordes.filter(d => d.eleve.boursier).length;
    const nb = accordes.length - b;
    return [
      { name: "Boursiers", value: b, fill: "hsl(215, 70%, 45%)" },
      { name: "Non boursiers", value: nb, fill: "hsl(38, 92%, 50%)" },
    ].filter(r => r.value > 0);
  }, [accordes]);

  const evolutionMensuelle = useMemo(() => {
    const mois: Record<string, number> = {};
    accordes.forEach(d => {
      const m = d.dateDepot.substring(0, 7);
      mois[m] = (mois[m] || 0) + d.montantAccorde;
    });
    return Object.entries(mois).sort().map(([name, value]) => ({
      name: new Date(name + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      value,
    }));
  }, [accordes]);

  const tauxAcceptation = demandes.length > 0 ? ((accordes.length / demandes.length) * 100) : 0;
  const montantMoyen = nbBeneficiaires > 0 ? totalVerse / nbBeneficiaires : 0;

  return (
    <div className="space-y-6">
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition par type de fonds</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={repartitionType} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {repartitionType.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Répartition par nature d'aide</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={repartitionNature} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="hsl(215, 70%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Évolution mensuelle des aides</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="value" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Par régime</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={repartitionRegime} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {repartitionRegime.map((_, i) => <Cell key={i} fill={["hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(38, 92%, 50%)"][i % 3]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Boursiers / Non boursiers</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={repartitionBourse} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {repartitionBourse.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Synthèse CA */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Synthèse pour le Conseil d'Administration</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
          <p>Au titre de l'année scolaire en cours, <strong className="text-foreground">{demandes.length} demandes</strong> d'aides sociales ont été instruites par la commission sociale de l'établissement, réunie à <strong className="text-foreground">{commissions.filter(c => c.statut === "cloturee" || c.statut === "tenue").length} reprises</strong>.</p>
          <p><strong className="text-foreground">{accordes.length} demandes ont été acceptées</strong> au bénéfice de <strong className="text-foreground">{nbBeneficiaires} élèves</strong>, pour un montant total de <strong className="text-success">{formatCurrency(totalVerse)}</strong>. Le taux d'acceptation s'établit à <strong className="text-foreground">{tauxAcceptation.toFixed(0)}%</strong> et le montant moyen par bénéficiaire à <strong className="text-foreground">{formatCurrency(montantMoyen)}</strong>.</p>
          <p>Les aides se répartissent principalement sur : {repartitionNature.slice(0, 3).map(n => `${n.name} (${formatCurrency(n.value)})`).join(", ")}.</p>
          {demandes.some(d => d.statut === "instruction" || d.statut === "commission") && (
            <p><strong className="text-warning">{demandes.filter(d => d.statut === "instruction" || d.statut === "commission").length} dossier(s)</strong> sont en cours d'instruction pour un montant demandé de <strong className="text-warning">{formatCurrency(demandes.filter(d => d.statut === "instruction" || d.statut === "commission").reduce((s, d) => s + d.montantDemande, 0))}</strong>.</p>
          )}
          <p>Le taux de consommation global des crédits de fonds sociaux s'élève à <strong className="text-foreground">{budgets.reduce((s, b) => s + b.totalDisponible, 0) > 0 ? ((budgets.reduce((s, b) => s + b.verse, 0) / budgets.reduce((s, b) => s + b.totalDisponible, 0)) * 100).toFixed(0) : 0}%</strong>. Le solde disponible est de <strong className="text-foreground">{formatCurrency(budgets.reduce((s, b) => s + b.reste, 0))}</strong>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
