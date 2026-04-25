import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Download, Flame, ShieldAlert, TrendingUp, Settings2, BookOpen } from "lucide-react";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useMarches, useSeuilsCcp, useFournisseurs, useFamilles } from "./hooks/useMarchesData";
import {
  calculerCumulsParFamille,
  detecterRepetitionFournisseur,
  heatmapFournisseurFamille,
} from "./lib/saucissonnageEngine";
import { formatEur } from "./lib/seuilsEngine";
import { exportSaucissonnagePdf } from "./lib/exportSaucissonnagePdf";
import { toast } from "sonner";

export default function MarcheAntiSaucissonnage() {
  const { selectedEstablishment } = useEstablishment();
  const { data: marches = [] } = useMarches();
  const { data: seuils = [] } = useSeuilsCcp();
  const { data: fournisseurs = [] } = useFournisseurs();
  const { data: familles = [] } = useFamilles();
  const [exporting, setExporting] = useState(false);

  const fournNoms = useMemo(
    () => Object.fromEntries(fournisseurs.map((f) => [f.id, f.raison_sociale])),
    [fournisseurs]
  );
  const famLibelles = useMemo(
    () => Object.fromEntries(familles.map((f) => [f.code, f.libelle])),
    [familles]
  );

  const cumuls = useMemo(() => calculerCumulsParFamille(marches, seuils), [marches, seuils]);
  const repetitions = useMemo(
    () => detecterRepetitionFournisseur(marches, fournNoms),
    [marches, fournNoms]
  );
  const heatmap = useMemo(
    () => heatmapFournisseurFamille(marches, fournNoms),
    [marches, fournNoms]
  );

  // Pivot heatmap : lignes = fournisseurs, colonnes = familles
  const fournKeys = useMemo(
    () => Array.from(new Set(heatmap.map((h) => h.fournisseur_id))),
    [heatmap]
  );
  const famKeys = useMemo(
    () => Array.from(new Set(heatmap.map((h) => h.famille))),
    [heatmap]
  );
  const cellMap = useMemo(() => {
    const m: Record<string, { total: number; count: number }> = {};
    for (const h of heatmap) m[`${h.fournisseur_id}::${h.famille}`] = { total: h.total_12m, count: h.count };
    return m;
  }, [heatmap]);
  const maxCellTotal = useMemo(() => Math.max(1, ...heatmap.map((h) => h.total_12m)), [heatmap]);

  const cellColor = (total: number): string => {
    if (total === 0) return "bg-muted/30";
    const ratio = total / maxCellTotal;
    if (ratio > 0.66) return "bg-destructive/80 text-destructive-foreground";
    if (ratio > 0.33) return "bg-amber-500/70 text-white";
    if (ratio > 0.1) return "bg-emerald-500/40";
    return "bg-emerald-500/15";
  };

  const top10 = useMemo(() => [...heatmap].slice(0, 10), [heatmap]);
  const alertesRouge = repetitions.filter((r) => r.niveau === "critique");
  const alertesOrange = repetitions.filter((r) => r.niveau === "alerte");

  const handleExport = () => {
    try {
      setExporting(true);
      exportSaucissonnagePdf({
        etablissement: selectedEstablishment?.name || "EPLE",
        uai: selectedEstablishment?.uai,
        cumuls,
        repetitions,
        heatmap,
        famillesLibelles: famLibelles,
      });
      toast.success("Rapport PDF anti-saucissonnage généré");
    } catch (e: any) {
      toast.error("Erreur export PDF : " + (e?.message || "inconnue"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-amber-500/5 to-transparent border border-destructive/20 p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
                  <Link to="/marches"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Marchés</Link>
                </Button>
              </div>
              <h1 className="text-3xl font-display font-bold tracking-tight">Anti-saucissonnage</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                Détection du fractionnement irrégulier de la commande publique — art. L2113-2 CCP, mémo DAJ
                « computation des seuils par famille homogène d'achat ».
              </p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={exporting} size="lg" variant="default">
            <Download className="h-4 w-4 mr-2" /> {exporting ? "Génération…" : "Exporter le rapport PDF"}
          </Button>
        </div>
      </motion.div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Familles dépassement", value: cumuls.filter((c) => c.niveau === "critique").length, icon: Flame, color: "text-destructive" },
          { label: "Familles en alerte", value: cumuls.filter((c) => c.niveau === "alerte").length, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Présomptions rouges", value: alertesRouge.length, icon: ShieldAlert, color: "text-destructive" },
          { label: "Vigilances orange", value: alertesOrange.length, icon: TrendingUp, color: "text-amber-600" },
        ].map((k, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-2xl font-bold mt-1">{k.value}</p>
                </div>
                <k.icon className={`h-8 w-8 ${k.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" /> Heatmap fournisseur × famille (12 mois glissants)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heatmap.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun marché attribué dans les 12 derniers mois.</p>
          ) : (
            <div className="overflow-auto max-h-[480px] border rounded-lg">
              <table className="text-xs w-full border-collapse">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    <th className="text-left px-2 py-2 border-b border-r font-semibold sticky left-0 bg-card z-20 min-w-[180px]">
                      Fournisseur
                    </th>
                    {famKeys.map((f) => (
                      <th key={f} className="text-center px-2 py-2 border-b border-r font-mono font-semibold whitespace-nowrap">
                        <div>{f}</div>
                        <div className="text-[9px] text-muted-foreground font-normal max-w-[80px] truncate" title={famLibelles[f]}>
                          {famLibelles[f] || "—"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fournKeys.map((fid) => (
                    <tr key={fid}>
                      <td className="px-2 py-1.5 border-b border-r sticky left-0 bg-card font-medium z-10 truncate max-w-[180px]">
                        {fournNoms[fid] || "Inconnu"}
                      </td>
                      {famKeys.map((f) => {
                        const cell = cellMap[`${fid}::${f}`];
                        const total = cell?.total || 0;
                        return (
                          <td
                            key={f}
                            className={`text-center px-2 py-1.5 border-b border-r tabular-nums ${cellColor(total)}`}
                            title={cell ? `${formatEur(total)} — ${cell.count} commande(s)` : "—"}
                          >
                            {total > 0 ? formatEur(total) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>Intensité :</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/15 inline-block" /> faible</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/40 inline-block" /> modéré</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/70 inline-block" /> élevé</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-destructive/80 inline-block" /> critique</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 + Alertes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 — Concentration fournisseur × famille</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top10.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              top10.map((c, i) => (
                <div key={`${c.fournisseur_id}-${c.famille}`} className="flex items-center justify-between gap-2 text-sm border-b pb-1.5 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground font-mono w-5 text-right">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.fournisseur_nom}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {c.famille} — {famLibelles[c.famille] || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold tabular-nums">{formatEur(c.total_12m)}</div>
                    <div className="text-[11px] text-muted-foreground">{c.count} cmd</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertes répétition fournisseur (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {repetitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune répétition détectée.</p>
            ) : (
              <>
                {alertesRouge.map((r) => (
                  <div key={`r-${r.fournisseur_id}-${r.famille}`} className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-medium text-sm truncate">{r.fournisseur_nom}</div>
                      <Badge variant="destructive">ROUGE — {r.count} cmd</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {r.famille} — {famLibelles[r.famille] || "—"} · {formatEur(r.total_ht)}
                    </div>
                    <p className="text-xs mt-1 text-destructive">{r.motif}</p>
                  </div>
                ))}
                {alertesOrange.map((r) => (
                  <div key={`o-${r.fournisseur_id}-${r.famille}`} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-medium text-sm truncate">{r.fournisseur_nom}</div>
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                        ORANGE — {r.count} cmd
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {r.famille} — {famLibelles[r.famille] || "—"} · {formatEur(r.total_ht)}
                    </div>
                    <p className="text-xs mt-1 text-amber-700">{r.motif}</p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cumuls par famille */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumuls par famille (12 mois) vs seuil de dispense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cumuls.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun marché enregistré.</p>
          ) : (
            cumuls.map((c) => (
              <div key={c.famille} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs w-16">{c.famille}</span>
                <span className="flex-1 truncate text-muted-foreground text-xs">{famLibelles[c.famille] || "—"}</span>
                <div className="flex-1 h-2.5 rounded bg-muted overflow-hidden max-w-[200px]">
                  <div
                    className={`h-full ${c.niveau === "critique" ? "bg-destructive" : c.niveau === "alerte" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, c.pctDuSeuil)}%` }}
                  />
                </div>
                <span className="tabular-nums w-24 text-right text-xs">{formatEur(c.total12m)}</span>
                <span className="tabular-nums w-20 text-right text-xs text-muted-foreground">/ {formatEur(c.seuilDispense)}</span>
                <Badge variant={c.niveau === "critique" ? "destructive" : c.niveau === "alerte" ? "secondary" : "outline"} className="w-16 justify-center">
                  {Math.round(c.pctDuSeuil)} %
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Seuils CCP utilisés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Seuils CCP utilisés
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Paramètres réglementaires appliqués au calcul (familles homogènes, montants, règles de gradation rouge/orange) avec leur source juridique et la date de versionnement.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Règles rouge / orange */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Règles d'alerte appliquées
            </h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="destructive">ROUGE</Badge>
                  <span className="font-medium text-sm">Critique</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Cumul famille ≥ <strong className="text-foreground">100 %</strong> du seuil de dispense (12 mois glissants)</li>
                  <li>• OU ≥ <strong className="text-foreground">3 commandes</strong> au même fournisseur dans la même famille en 6 mois</li>
                </ul>
                <p className="text-[11px] text-destructive/80 mt-2 font-medium">art. L2113-2 CCP — présomption de saucissonnage</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 border-amber-500/30">ORANGE</Badge>
                  <span className="font-medium text-sm">Vigilance</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Cumul famille ≥ <strong className="text-foreground">70 %</strong> du seuil de dispense</li>
                  <li>• OU <strong className="text-foreground">2 commandes</strong> même fournisseur même famille en 6 mois</li>
                </ul>
                <p className="text-[11px] text-amber-700 mt-2 font-medium">mémo DAJ — computation des seuils par famille homogène</p>
              </div>
            </div>
          </div>

          {/* Tableau des seuils CCP versionnés */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Seuils CCP versionnés
            </h4>
            {seuils.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun seuil paramétré.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-semibold">Type marché</th>
                      <th className="px-3 py-2 font-semibold text-right">Dispense</th>
                      <th className="px-3 py-2 font-semibold text-right">MAPA pub.</th>
                      <th className="px-3 py-2 font-semibold text-right">Formalisée</th>
                      <th className="px-3 py-2 font-semibold">Période d'application</th>
                      <th className="px-3 py-2 font-semibold">Source / base légale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...seuils]
                      .sort((a, b) => (b.date_debut || "").localeCompare(a.date_debut || ""))
                      .map((s) => {
                        const enVigueur =
                          s.date_debut <= todayIso && (!s.date_fin || s.date_fin >= todayIso);
                        return (
                          <tr key={s.id} className="border-t hover:bg-accent/30">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">
                                  {s.type_marche.replace(/_/g, " ")}
                                </span>
                                {enVigueur && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] h-5">
                                    en vigueur
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {formatEur(s.seuil_dispense)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {s.seuil_mapa_publicite ? formatEur(s.seuil_mapa_publicite) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatEur(s.seuil_formalisee)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-foreground">{formatDateFr(s.date_debut)}</div>
                              <div className="text-[11px] text-muted-foreground">
                                → {s.date_fin ? formatDateFr(s.date_fin) : "indéterminée"}
                              </div>
                            </td>
                            <td className="px-3 py-2 max-w-[420px]">
                              <div className="flex items-start gap-1.5">
                                <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <span className="text-muted-foreground leading-snug">
                                  {s.base_legale || "—"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Familles homogènes */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Familles homogènes d'achat actives ({familles.length})
            </h4>
            {familles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune famille paramétrée.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {familles.map((f) => (
                  <Badge
                    key={f.id}
                    variant="outline"
                    className="font-mono text-[11px] py-0.5"
                    title={`${f.libelle} — ${f.type_marche} (${f.groupe})`}
                  >
                    <span className="text-primary mr-1.5">{f.code}</span>
                    <span className="text-foreground/80">{f.libelle}</span>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              Mémo DAJ — la computation des seuils s'effectue par <em>famille homogène</em> sur 12 mois glissants
              (besoins répondant à une même finalité économique).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}