import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Plus, FileText, Users, BookOpen, Settings, AlertTriangle, TrendingUp, Library } from "lucide-react";
import { useMarches, useSeuilsCcp, useFournisseurs } from "./hooks/useMarchesData";
import { calculerCumulsParFamille, tauxConcentration } from "./lib/saucissonnageEngine";
import { formatEur } from "./lib/seuilsEngine";
import { STATUT_LABELS, PROCEDURE_LABELS } from "./types";
import { useMemo } from "react";

export default function MarchesDashboard() {
  const { data: marches = [] } = useMarches();
  const { data: seuils = [] } = useSeuilsCcp();
  const { data: fournisseurs = [] } = useFournisseurs();

  const enCours = marches.filter(m => ["preparation","publie","analyse","attribue","notifie","execution"].includes(m.statut));
  const enAnalyse = marches.filter(m => m.statut === "analyse");
  const totalPilote = marches.reduce((s,m) => s + Number(m.montant_total_ht || 0), 0);
  const cumuls = useMemo(() => calculerCumulsParFamille(marches, seuils), [marches, seuils]);
  const alertes = cumuls.filter(c => c.niveau !== "ok");
  const fournNoms = Object.fromEntries(fournisseurs.map(f => [f.id, f.raison_sociale]));
  const concentration = tauxConcentration(marches.filter(m => m.fournisseur_attributaire_id), fournNoms);
  const conformite = marches.length === 0 ? 100 : Math.round(
    (marches.filter(m => Object.values(m.checklist_validation || {}).every(Boolean)).length / marches.length) * 100
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
              <Scale className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">Marchés publics</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Pilotage complet conforme au Code de la commande publique 2026 — décret n° 2025-1386, M9-6, GBCP 2012-1246.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="shadow-primary">
            <Link to="/marches/nouveau"><Plus className="h-4 w-4 mr-2" /> Nouveau marché</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Marchés en cours", value: enCours.length, icon: FileText, color: "text-primary" },
          { label: "En analyse", value: enAnalyse.length, icon: TrendingUp, color: "text-amber-600" },
          { label: "Montant piloté", value: formatEur(totalPilote), icon: Scale, color: "text-emerald-600" },
          { label: "Conformité CCP", value: `${conformite} %`, icon: Library, color: conformite >= 80 ? "text-emerald-600" : "text-amber-600" },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
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
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" /> Anti-saucissonnage (12 mois glissants)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cumuls.length === 0 && <p className="text-sm text-muted-foreground">Aucun marché enregistré pour le moment.</p>}
            {cumuls.slice(0, 6).map(c => (
              <div key={c.famille} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono text-xs">{c.famille}</span>
                <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full ${c.niveau === "critique" ? "bg-destructive" : c.niveau === "alerte" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, c.pctDuSeuil)}%` }}
                  />
                </div>
                <span className="tabular-nums w-24 text-right">{formatEur(c.total12m)}</span>
                <Badge variant={c.niveau === "critique" ? "destructive" : c.niveau === "alerte" ? "secondary" : "outline"}>
                  {Math.round(c.pctDuSeuil)} %
                </Badge>
              </div>
            ))}
            {alertes.length > 0 && (
              <p className="text-xs text-amber-700 mt-2">
                ⚠ {alertes.length} famille{alertes.length > 1 ? "s" : ""} approche{alertes.length > 1 ? "nt" : ""} ou dépasse{alertes.length > 1 ? "nt" : ""} le seuil de dispense.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Concentration fournisseurs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{concentration.total > 0 ? `${Math.round(concentration.top3Pct)} %` : "—"}</p>
            <p className="text-xs text-muted-foreground mb-3">part des 3 plus gros fournisseurs</p>
            <div className="space-y-1">
              {concentration.details.slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate">{d.fournisseur}</span>
                  <span className="tabular-nums text-muted-foreground">{formatEur(d.montant)} ({Math.round(d.pct)} %)</span>
                </div>
              ))}
              {concentration.details.length === 0 && <p className="text-sm text-muted-foreground">Aucun marché attribué.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Marchés récents</CardTitle></CardHeader>
        <CardContent>
          {marches.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Aucun marché enregistré. Créez votre premier marché pour démarrer.</p>
              <Button asChild className="mt-4"><Link to="/marches/nouveau">Créer un marché</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {marches.slice(0, 8).map(m => (
                <Link key={m.id} to={`/marches/detail/${m.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium">{m.libelle}</p>
                    <p className="text-xs text-muted-foreground">{m.reference_interne} • {PROCEDURE_LABELS[m.procedure_calculee]}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-sm">{formatEur(Number(m.montant_total_ht))}</span>
                    <Badge variant="outline">{STATUT_LABELS[m.statut]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { to: "/marches/liste", label: "Tous mes marchés", icon: FileText },
          { to: "/marches/fournisseurs", label: "Fournisseurs", icon: Users },
          { to: "/marches/bibliotheque", label: "Bibliothèque modèles", icon: Library },
          { to: "/marches/mode-emploi", label: "Mode d'emploi", icon: BookOpen },
        ].map((q, i) => (
          <Button key={i} asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to={q.to}>
              <q.icon className="h-4 w-4 mr-2" />
              {q.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
