// ═══════════════════════════════════════════════════════════════
// Vue consolidée Groupement comptable — Fonds sociaux
// Permet à un AC en charge de plusieurs EPLE d'avoir une vision agrégée
// (l'utilisateur ne voit que les établissements dont il est rattaché).
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Network, AlertCircle, Loader2 } from "lucide-react";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { currentAnneeScolaire, type FsDecision } from "./fsv2Types";

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function GroupementConsolidePage() {
  const { establishments } = useEstablishment();
  const [annee, setAnnee] = useState(currentAnneeScolaire());

  const ids = establishments.map(e => e.id);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["fs_decisions_consolide", ids.join(","), annee],
    enabled: ids.length > 0,
    queryFn: async (): Promise<FsDecision[]> => {
      const { data, error } = await supabase
        .from("fs_decisions")
        .select("*")
        .in("establishment_id", ids)
        .eq("annee_scolaire", annee);
      if (error) throw error;
      return (data ?? []) as unknown as FsDecision[];
    },
  });

  // Agrégation par établissement
  const stats = useMemo(() => {
    const map = new Map<string, {
      etab: typeof establishments[number];
      nbDecisions: number;
      totalAttribue: number;
      totalPaye: number;
      beneficiaires: Set<string>;
      nbRefus: number;
      typeFonds: Record<string, number>;
    }>();
    for (const e of establishments) {
      map.set(e.id, {
        etab: e, nbDecisions: 0, totalAttribue: 0, totalPaye: 0,
        beneficiaires: new Set(), nbRefus: 0, typeFonds: {},
      });
    }
    for (const d of decisions) {
      const s = map.get(d.establishment_id);
      if (!s) continue;
      s.nbDecisions += 1;
      if (d.statut === "refusee") s.nbRefus += 1;
      if (d.statut !== "annule" && d.statut !== "refusee" && d.statut !== "brouillon") {
        s.totalAttribue += Number(d.montant);
        s.beneficiaires.add(d.eleve_id);
        s.typeFonds[d.type_fonds] = (s.typeFonds[d.type_fonds] ?? 0) + Number(d.montant);
      }
      if (d.statut === "paye" || d.statut === "prise_en_charge") {
        s.totalPaye += Number(d.montant);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalAttribue - a.totalAttribue);
  }, [decisions, establishments]);

  const totals = useMemo(() => ({
    decisions: stats.reduce((s, x) => s + x.nbDecisions, 0),
    attribue: stats.reduce((s, x) => s + x.totalAttribue, 0),
    paye: stats.reduce((s, x) => s + x.totalPaye, 0),
    beneficiaires: stats.reduce((s, x) => s + x.beneficiaires.size, 0),
    refus: stats.reduce((s, x) => s + x.nbRefus, 0),
  }), [stats]);

  const annees = Array.from(new Set([annee, ...decisions.map(d => d.annee_scolaire)]))
    .sort().reverse();

  if (establishments.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-display">Vue consolidée — Groupement</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Network className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Aucun établissement rattaché à votre compte.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" /> Vue consolidée — Groupement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agrégation Fonds sociaux sur les <strong>{establishments.length} établissements</strong> rattachés à votre compte.
          </p>
        </div>
        <Select value={annee} onValueChange={setAnnee}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {annees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Totaux groupement */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Totaux groupement {annee}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Tot label="Établissements" value={String(establishments.length)} />
            <Tot label="Décisions" value={String(totals.decisions)} />
            <Tot label="Attribué" value={fmtEur(totals.attribue)} accent />
            <Tot label="Payé" value={fmtEur(totals.paye)} />
            <Tot label="Bénéficiaires" value={String(totals.beneficiaires)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement…
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail par établissement</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b">
                    <th className="p-3 font-semibold">Établissement</th>
                    <th className="p-3 text-right font-semibold">Décisions</th>
                    <th className="p-3 text-right font-semibold">Bénéficiaires</th>
                    <th className="p-3 text-right font-semibold">Attribué</th>
                    <th className="p-3 text-right font-semibold">Payé</th>
                    <th className="p-3 text-right font-semibold">Refus</th>
                    <th className="p-3 font-semibold">Répartition</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.map(s => {
                    const total = s.totalAttribue;
                    return (
                      <tr key={s.etab.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <div className="font-medium">{s.etab.name}</div>
                              <div className="text-xs text-muted-foreground">
                                UAI {s.etab.uai} · {s.etab.city}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">{s.nbDecisions}</td>
                        <td className="p-3 text-right font-mono">{s.beneficiaires.size}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          {total > 0 ? fmtEur(total) : "—"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {s.totalPaye > 0 ? fmtEur(s.totalPaye) : "—"}
                        </td>
                        <td className="p-3 text-right">
                          {s.nbRefus > 0 ? (
                            <Badge variant="outline" className="text-orange-700 border-orange-300">
                              {s.nbRefus}
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(s.typeFonds).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-[10px] font-mono">
                                {k} {fmtEur(v)}
                              </Badge>
                            ))}
                            {Object.keys(s.typeFonds).length === 0 && (
                              <span className="text-xs text-muted-foreground">aucune décision</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 font-bold">
                  <tr>
                    <td className="p-3">TOTAL GROUPEMENT</td>
                    <td className="p-3 text-right font-mono">{totals.decisions}</td>
                    <td className="p-3 text-right font-mono">{totals.beneficiaires}</td>
                    <td className="p-3 text-right font-mono">{fmtEur(totals.attribue)}</td>
                    <td className="p-3 text-right font-mono">{fmtEur(totals.paye)}</td>
                    <td className="p-3 text-right font-mono">{totals.refus}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            Les données affichées sont strictement limitées aux établissements pour lesquels vous disposez
            d'une autorisation explicite (table <code>user_establishments</code>). Aucune donnée nominative
            n'est partagée entre EPLE.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Tot({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}