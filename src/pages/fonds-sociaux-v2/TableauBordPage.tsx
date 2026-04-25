// ═══════════════════════════════════════════════════════════════
// Tableau de bord & Bilan annuel — Module Fonds sociaux v2
// KPIs en temps réel + bilan exportable PDF (à présenter au CA de juin)
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, Wallet, AlertCircle, FileBarChart } from "lucide-react";
import { useDecisions, useEleves, useCommissions, useSubventions } from "./useFsData";
import {
  currentAnneeScolaire, NATURE_AIDE_LABELS, TYPE_FONDS_LABELS,
  type NatureAide, type TypeFonds,
} from "./fsv2Types";
import { generateBilanAnnuelPdf } from "@/lib/fs-pdf/bilanAnnuelPdf";
import { downloadBlob } from "@/lib/fs-pdf/decisionPdf";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function TableauBordPage() {
  const { selectedEstablishment } = useEstablishment();
  const { data: decisions = [] } = useDecisions();
  const { data: eleves = [] } = useEleves();
  const { data: commissions = [] } = useCommissions();
  const { data: subventions = [] } = useSubventions();

  const [annee, setAnnee] = useState(currentAnneeScolaire());

  const decisionsAnnee = useMemo(
    () => decisions.filter(d => d.annee_scolaire === annee),
    [decisions, annee],
  );

  // ─── KPIs ────────────────────────────────────────────
  const totalAttribue = decisionsAnnee
    .filter(d => d.statut !== "annule" && d.statut !== "refusee" && d.statut !== "brouillon")
    .reduce((s, d) => s + Number(d.montant), 0);

  const totalPaye = decisionsAnnee
    .filter(d => d.statut === "paye" || d.statut === "prise_en_charge")
    .reduce((s, d) => s + Number(d.montant), 0);

  const totalEnAttente = decisionsAnnee
    .filter(d => d.statut === "decide" || d.statut === "demande_paiement_emise" || d.statut === "complement_demande")
    .reduce((s, d) => s + Number(d.montant), 0);

  const beneficiairesUniques = new Set(
    decisionsAnnee
      .filter(d => d.statut !== "annule" && d.statut !== "refusee" && d.statut !== "brouillon")
      .map(d => d.eleve_id),
  ).size;

  const subventionAnnee = subventions
    .filter(s => s.annee_scolaire === annee)
    .reduce((s, sv) => s + Number(sv.montant), 0);

  const tauxConsommation = subventionAnnee > 0
    ? (totalAttribue / subventionAnnee) * 100
    : 0;

  const reliquat = subventionAnnee - totalAttribue;

  // ─── Répartitions ───────────────────────────────────
  const parTypeFonds = useMemo(() => {
    const m: Record<string, { count: number; total: number }> = {};
    decisionsAnnee.forEach(d => {
      if (d.statut === "annule" || d.statut === "refusee" || d.statut === "brouillon") return;
      const k = d.type_fonds;
      m[k] ??= { count: 0, total: 0 };
      m[k].count += 1;
      m[k].total += Number(d.montant);
    });
    return m;
  }, [decisionsAnnee]);

  const parNature = useMemo(() => {
    const m: Record<string, { count: number; total: number }> = {};
    decisionsAnnee.forEach(d => {
      if (d.statut === "annule" || d.statut === "refusee" || d.statut === "brouillon") return;
      const k = d.nature_aide;
      m[k] ??= { count: 0, total: 0 };
      m[k].count += 1;
      m[k].total += Number(d.montant);
    });
    return m;
  }, [decisionsAnnee]);

  const refus = decisionsAnnee.filter(d => d.statut === "refusee").length;
  const tauxRefus = decisionsAnnee.length > 0
    ? (refus / decisionsAnnee.length) * 100
    : 0;

  // ─── Délai moyen instruction (jours) ───────────────
  const delaiMoyen = useMemo(() => {
    const delais: number[] = [];
    decisionsAnnee.forEach(d => {
      if (!d.date_demande_paiement) return;
      const j = (new Date(d.date_demande_paiement).getTime() - new Date(d.date_decision).getTime()) / 86400000;
      if (j >= 0 && j < 365) delais.push(j);
    });
    return delais.length > 0
      ? Math.round(delais.reduce((s, x) => s + x, 0) / delais.length)
      : null;
  }, [decisionsAnnee]);

  function handleExportBilan() {
    if (!selectedEstablishment) {
      toast.error("Sélectionnez un établissement");
      return;
    }
    try {
      const blob = generateBilanAnnuelPdf({
        etablissementNom: selectedEstablishment.name,
        uai: selectedEstablishment.uai,
        anneeScolaire: annee,
        kpis: {
          totalAttribue, totalPaye, totalEnAttente,
          beneficiairesUniques, subventionAnnee, tauxConsommation,
          reliquat, refus, tauxRefus, delaiMoyen,
          nbCommissions: commissions.filter(c => c.annee_scolaire === annee).length,
          nbDecisions: decisionsAnnee.length,
        },
        parTypeFonds, parNature,
      });
      downloadBlob(blob, `bilan-fs-${annee.replace("-", "_")}.pdf`);
      toast.success("Bilan annuel téléchargé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur génération PDF");
    }
  }

  const annees = Array.from(
    new Set([annee, ...decisions.map(d => d.annee_scolaire)]),
  ).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilotage en temps réel des aides Fonds sociaux et bilan annuel à présenter au CA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={annee} onValueChange={setAnnee}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {annees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleExportBilan}>
            <Download className="h-4 w-4 mr-2" /> Bilan annuel PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Wallet}
          label="Total attribué"
          value={fmtEur(totalAttribue)}
          sub={`${decisionsAnnee.length} décisions`}
          tone="primary"
        />
        <KpiCard
          icon={Users}
          label="Bénéficiaires uniques"
          value={String(beneficiairesUniques)}
          sub={`sur ${eleves.length} élèves`}
          tone="success"
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux de consommation"
          value={`${tauxConsommation.toFixed(1)} %`}
          sub={subventionAnnee > 0 ? `Subv. ${fmtEur(subventionAnnee)}` : "Aucune subvention saisie"}
          tone={tauxConsommation > 90 ? "warning" : tauxConsommation > 50 ? "primary" : "muted"}
        />
        <KpiCard
          icon={AlertCircle}
          label="Reliquat estimé"
          value={fmtEur(reliquat)}
          sub={reliquat < 0 ? "⚠ Dépassement" : "Disponible"}
          tone={reliquat < 0 ? "destructive" : "success"}
        />
      </div>

      {/* Workflow Op@le */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suivi du circuit Op@le</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <StatutMini label="Brouillons" n={decisionsAnnee.filter(d => d.statut === "brouillon").length} color="muted" />
            <StatutMini label="Décidés (à émettre en DP)" n={decisionsAnnee.filter(d => d.statut === "decide").length} color="primary" />
            <StatutMini label="DP émises / prises en charge" n={decisionsAnnee.filter(d => d.statut === "demande_paiement_emise" || d.statut === "prise_en_charge").length} color="warning" />
            <StatutMini label="Payées" n={decisionsAnnee.filter(d => d.statut === "paye").length} color="success" />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Total payé : <strong className="text-foreground">{fmtEur(totalPaye)}</strong> ·
            En attente paiement : <strong className="text-foreground">{fmtEur(totalEnAttente)}</strong>
            {delaiMoyen !== null && <> · Délai moyen instruction → DP : <strong className="text-foreground">{delaiMoyen} jours</strong></>}
          </div>
        </CardContent>
      </Card>

      {/* Répartitions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par type de fonds</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(parTypeFonds).length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune décision pour {annee}.</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(parTypeFonds).map(([k, v]) => (
                  <BarLine
                    key={k}
                    label={TYPE_FONDS_LABELS[k as TypeFonds] ?? k}
                    count={v.count}
                    total={v.total}
                    max={Math.max(...Object.values(parTypeFonds).map(x => x.total))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par nature d'aide</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(parNature).length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune décision pour {annee}.</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(parNature)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([k, v]) => (
                    <BarLine
                      key={k}
                      label={NATURE_AIDE_LABELS[k as NatureAide] ?? k}
                      count={v.count}
                      total={v.total}
                      max={Math.max(...Object.values(parNature).map(x => x.total))}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicateurs qualité */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Indicateurs qualité
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Taux de refus</div>
            <div className="text-2xl font-bold">{tauxRefus.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">{refus} dossier{refus > 1 ? "s" : ""} refusé{refus > 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Commissions tenues</div>
            <div className="text-2xl font-bold">{commissions.filter(c => c.annee_scolaire === annee).length}</div>
            <div className="text-xs text-muted-foreground">Min. recommandé : 3/an (circulaire 2017-122)</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Aide moyenne par bénéficiaire</div>
            <div className="text-2xl font-bold">
              {beneficiairesUniques > 0 ? fmtEur(totalAttribue / beneficiairesUniques) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Plafond CA à respecter</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sous-composants ───────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon: any; label: string; value: string; sub: string;
  tone: "primary" | "success" | "warning" | "destructive" | "muted";
}) {
  const toneClasses: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-orange-500/30 bg-orange-500/5",
    destructive: "border-destructive/30 bg-destructive/5",
    muted: "border-border bg-muted/20",
  };
  const iconTones: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-orange-600 dark:text-orange-400",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  };
  return (
    <Card className={`${toneClasses[tone]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Icon className={`h-4 w-4 ${iconTones[tone]}`} />
          <span>{label}</span>
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function StatutMini({ label, n, color }: { label: string; n: number; color: "muted" | "primary" | "warning" | "success" }) {
  const cls: Record<string, string> = {
    muted: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-orange-600 dark:text-orange-400",
    success: "text-success",
  };
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${cls[color]}`}>{n}</div>
    </div>
  );
}

function BarLine({ label, count, total, max }: { label: string; count: number; total: number; max: number }) {
  const pct = max > 0 ? (total / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium truncate">{label}</span>
        <span className="text-muted-foreground whitespace-nowrap ml-2">
          {count} · {fmtEur(total)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}