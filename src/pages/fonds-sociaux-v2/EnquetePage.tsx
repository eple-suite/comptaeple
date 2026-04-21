// ═══════════════════════════════════════════════════════════════
// Tableau de bord Enquête Rectorat DGESCO (Q1 → Q17 + R1 → R16)
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, AlertTriangle, CheckCircle2, Info, BarChart3, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useEleves, useDecisions, useCommissions, useSubventions, useReliquats } from "./useFsData";
import { currentAnneeScolaire, NATURE_AIDE_LABELS, type NatureAide } from "./fsv2Types";
import { computeEnqueteKpis, validateEnquete, type Severity } from "@/lib/enquete-rectorat/validation";

function fmtEur(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }
function fmtPct(n: number) { return `${n.toFixed(1)} %`; }

const SEVERITY_ICON: Record<Severity, JSX.Element> = {
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-secondary-foreground" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

const SEVERITY_BADGE: Record<Severity, "destructive" | "secondary" | "outline"> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

export default function EnquetePage() {
  const [annee, setAnnee] = useState(currentAnneeScolaire());
  const { data: eleves = [] } = useEleves();
  const { data: decisions = [] } = useDecisions();
  const { data: commissions = [] } = useCommissions();
  const { data: subventions = [] } = useSubventions();
  const { data: reliquats = [] } = useReliquats();

  const kpis = useMemo(() =>
    computeEnqueteKpis({ anneeScolaire: annee, eleves, decisions, commissions, subventions, reliquats }),
    [annee, eleves, decisions, commissions, subventions, reliquats]);

  const issues = useMemo(() =>
    validateEnquete({ anneeScolaire: annee, eleves, decisions, commissions, subventions, reliquats }, kpis),
    [annee, eleves, decisions, commissions, subventions, reliquats, kpis]);

  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  function handleExportCsv() {
    const rows: string[] = [];
    rows.push(`Enquête Rectorat DGESCO — Fonds sociaux ${annee}`);
    rows.push("");
    rows.push("Indicateur;Valeur");
    rows.push(`Q1 — Total demandes;${kpis.q1_total_demandes}`);
    rows.push(`Q2 — Aides accordées;${kpis.q2_total_aides_accordees}`);
    rows.push(`Q3 — Montant total versé;${kpis.q3_montant_total_verse.toFixed(2)} €`);
    rows.push(`Q4 — Montant moyen;${kpis.q4_montant_moyen.toFixed(2)} €`);
    rows.push(`Q5 — Élèves aidés;${kpis.q5_eleves_aides}`);
    rows.push(`Q11 — Subventions Rectorat reçues;${kpis.q11_subv_rectorat_recue.toFixed(2)} €`);
    rows.push(`Q12 — Reliquats ouverture;${kpis.q12_reliquats_ouverture.toFixed(2)} €`);
    rows.push(`Q13 — Taux de consommation;${kpis.q13_taux_consommation.toFixed(1)} %`);
    rows.push(`Q14 — Nombre de commissions;${kpis.q14_nb_commissions}`);
    rows.push(`Q15 — Élèves boursiers aidés;${kpis.q15_nb_eleves_boursiers_aides}`);
    rows.push(`Q16 — Aides d'urgence;${kpis.q16_nb_aides_urgence}`);
    rows.push(`Q17 — Élèves total établissement;${kpis.q17_eleves_total_etablissement}`);
    rows.push("");
    rows.push("Q10 — Répartition par nature");
    rows.push("Nature;Nombre;Montant");
    Object.entries(kpis.q10_repartition_nature).forEach(([n, v]) => {
      rows.push(`${NATURE_AIDE_LABELS[n as NatureAide] ?? n};${v.count};${v.montant.toFixed(2)}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `enquete-rectorat-${annee}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild><Link to="/fonds-sociaux/v2"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-display">Tableau de bord — Enquête Rectorat DGESCO</h1>
          <p className="text-sm text-muted-foreground">Préparation enquête fonds sociaux — Q1 à Q17, validation R1 → R16.</p>
        </div>
        <Select value={annee} onValueChange={setAnnee}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={currentAnneeScolaire()}>{currentAnneeScolaire()}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      {/* Synthèse contrôles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Erreurs</div>
          <div className="text-2xl font-bold text-destructive">{errors.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Avertissements</div>
          <div className="text-2xl font-bold">{warnings.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Informations</div>
          <div className="text-2xl font-bold text-primary">{infos.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Statut global</div>
          <div className="text-2xl font-bold">
            {errors.length === 0
              ? <span className="text-primary inline-flex items-center gap-1"><CheckCircle2 className="h-5 w-5" /> Conforme</span>
              : <span className="text-destructive">À corriger</span>}
          </div>
        </CardContent></Card>
      </div>

      {/* KPIs */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Indicateurs Q1 → Q17</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["q1q5", "q10", "q11q13"]} className="w-full">
            <AccordionItem value="q1q5">
              <AccordionTrigger>Q1 → Q5 — Volumes & montants</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <Kpi label="Q1 — Demandes" value={String(kpis.q1_total_demandes)} />
                  <Kpi label="Q2 — Aides accordées" value={String(kpis.q2_total_aides_accordees)} />
                  <Kpi label="Q3 — Montant versé" value={fmtEur(kpis.q3_montant_total_verse)} />
                  <Kpi label="Q4 — Montant moyen" value={fmtEur(kpis.q4_montant_moyen)} />
                  <Kpi label="Q5 — Élèves aidés" value={String(kpis.q5_eleves_aides)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6q9">
              <AccordionTrigger>Q6 → Q9 — Répartitions structurelles</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <RepartCard title="Q6 — Par voie" data={kpis.q6_repartition_voie} />
                  <RepartCard title="Q7 — Par type de fonds" data={kpis.q7_repartition_type_fonds} />
                  <RepartCard title="Q8 — Modalité de versement" data={kpis.q8_repartition_modalite} />
                  <RepartCard title="Q9 — Modalité d'attribution" data={kpis.q9_repartition_attribution} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q10">
              <AccordionTrigger>Q10 — Répartition par nature d'aide (DGESCO)</AccordionTrigger>
              <AccordionContent>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2">Nature</th><th className="text-right">Nombre</th><th className="text-right">Montant</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(kpis.q10_repartition_nature).map(([n, v]) => (
                      <tr key={n} className="border-b">
                        <td className="py-2">{NATURE_AIDE_LABELS[n as NatureAide]}</td>
                        <td className="text-right">{v.count}</td>
                        <td className="text-right font-medium">{fmtEur(v.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q11q13">
              <AccordionTrigger>Q11 → Q13 — Financement & consommation</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Kpi label="Q11 — Subv. Rectorat reçues" value={fmtEur(kpis.q11_subv_rectorat_recue)} />
                  <Kpi label="Q12 — Reliquats d'ouverture" value={fmtEur(kpis.q12_reliquats_ouverture)} />
                  <Kpi label="Q13 — Taux de consommation" value={fmtPct(kpis.q13_taux_consommation)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q14q17">
              <AccordionTrigger>Q14 → Q17 — Gouvernance & contexte</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Kpi label="Q14 — Commissions" value={String(kpis.q14_nb_commissions)} />
                  <Kpi label="Q15 — Boursiers aidés" value={String(kpis.q15_nb_eleves_boursiers_aides)} />
                  <Kpi label="Q16 — Aides d'urgence" value={String(kpis.q16_nb_aides_urgence)} />
                  <Kpi label="Q17 — Élèves total" value={String(kpis.q17_eleves_total_etablissement)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contrôles R1 → R16 */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contrôles de cohérence (R1 → R16)</CardTitle></CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="p-6 text-center text-primary inline-flex items-center justify-center gap-2 w-full">
              <CheckCircle2 className="h-5 w-5" /> Aucune anomalie détectée. Données prêtes pour transmission au Rectorat.
            </div>
          ) : (
            <ul className="divide-y">
              {issues.map((i, idx) => (
                <li key={idx} className="py-3 flex items-start gap-3">
                  {SEVERITY_ICON[i.severity]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={SEVERITY_BADGE[i.severity]} className="text-[10px]">{i.code}</Badge>
                      <span className="text-sm font-medium">{i.message}</span>
                    </div>
                    {i.hint && <p className="text-xs text-muted-foreground mt-1">{i.hint}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border bg-muted/20">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function RepartCard({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((s, n) => s + n, 0);
  return (
    <div className="p-3 rounded-lg border">
      <div className="text-xs font-medium mb-2">{title}</div>
      {total === 0 ? <div className="text-xs text-muted-foreground italic">Aucune donnée</div> : (
        <div className="space-y-1">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v} <span className="text-muted-foreground">({total ? Math.round(v / total * 100) : 0} %)</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}