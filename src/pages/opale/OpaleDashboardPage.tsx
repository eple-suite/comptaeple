import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { OPALE_MODULES_LABELS, type OpaleFiche } from "@/lib/opale/types";

export default function OpaleDashboardPage() {
  const [fiches, setFiches] = useState<OpaleFiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [nbQuestions, setNbQuestions] = useState(0);
  const [nbReponses, setNbReponses] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: f }, { count: nq }, { count: nr }] = await Promise.all([
        supabase.from("opale_fiches").select("*").limit(1000),
        supabase.from("opale_questions").select("*", { count: "exact", head: true }),
        supabase.from("opale_reponses").select("*", { count: "exact", head: true }),
      ]);
      if (f) setFiches(f as unknown as OpaleFiche[]);
      setNbQuestions(nq ?? 0);
      setNbReponses(nr ?? 0);
      setLoading(false);
    })();
  }, []);

  const kpi = useMemo(() => {
    const publiees = fiches.filter((f) => f.statut_publication === "publiee");
    const consultations = publiees.reduce((s, f) => s + f.nb_consultations, 0);
    const utiles = publiees.reduce((s, f) => s + f.nb_utiles, 0);
    const total = publiees.reduce((s, f) => s + f.nb_utiles + f.nb_pas_utiles, 0);
    const tauxUtilite = total > 0 ? Math.round((utiles * 100) / total) : 0;
    const obsoletes = publiees.filter((f) => f.statut_actualite === "obsolete").length;
    return {
      total: fiches.length,
      publiees: publiees.length,
      brouillons: fiches.filter((f) => f.statut_publication === "brouillon").length,
      enValidation: fiches.filter((f) => f.statut_publication === "soumise" || f.statut_publication === "en_validation").length,
      consultations,
      tauxUtilite,
      obsoletes,
    };
  }, [fiches]);

  const parModule = useMemo(() => {
    const map = new Map<string, number>();
    fiches.forEach((f) => map.set(f.module_opale, (map.get(f.module_opale) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [fiches]);

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
      </Button>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Tableau de bord académique</h1>
        <p className="text-muted-foreground">Vue consolidée de l'activité de la plateforme AIDE Op@le.</p>
      </header>

      {loading ? <p>Chargement…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Fiches publiées" value={kpi.publiees} />
            <Kpi label="Brouillons" value={kpi.brouillons} />
            <Kpi label="En attente modération" value={kpi.enValidation} />
            <Kpi label="Fiches obsolètes" value={kpi.obsoletes} highlight={kpi.obsoletes > 0} />
            <Kpi label="Consultations cumulées" value={kpi.consultations} />
            <Kpi label="Taux d'utilité moyen" value={`${kpi.tauxUtilite}%`} />
            <Kpi label="Questions forum" value={nbQuestions} />
            <Kpi label="Réponses forum" value={nbReponses} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Répartition par module Op@le</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {parModule.map(([m, n]) => {
                const pct = kpi.total > 0 ? Math.round((n * 100) / kpi.total) : 0;
                return (
                  <div key={m} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{OPALE_MODULES_LABELS[m as keyof typeof OPALE_MODULES_LABELS]}</span>
                      <span className="text-muted-foreground">{n} fiche(s) · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {parModule.length === 0 && <p className="text-sm text-muted-foreground">Pas encore de fiches.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${highlight ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}