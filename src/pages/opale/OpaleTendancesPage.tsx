import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, TrendingUp } from "lucide-react";
import { OPALE_MODULES_LABELS, type OpaleFiche } from "@/lib/opale/types";
import { fichesAReverifier } from "@/lib/opale/gamification";

export default function OpaleTendancesPage() {
  const [fiches, setFiches] = useState<OpaleFiche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("opale_fiches")
        .select("*")
        .eq("statut_publication", "publiee")
        .limit(500);
      if (data) setFiches(data as unknown as OpaleFiche[]);
      setLoading(false);
    })();
  }, []);

  const tendances = useMemo(() => {
    const parModule = new Map<string, { nb: number; consultations: number; utilite: number }>();
    fiches.forEach((f) => {
      const cur = parModule.get(f.module_opale) ?? { nb: 0, consultations: 0, utilite: 0 };
      parModule.set(f.module_opale, {
        nb: cur.nb + 1,
        consultations: cur.consultations + f.nb_consultations,
        utilite: cur.utilite + f.taux_utilite_pct,
      });
    });
    return Array.from(parModule.entries())
      .map(([m, v]) => ({ module: m, nb: v.nb, consultations: v.consultations, utiliteMoyenne: Math.round(v.utilite / Math.max(v.nb, 1)) }))
      .sort((a, b) => b.consultations - a.consultations);
  }, [fiches]);

  const aReverif = useMemo(() => fichesAReverifier(fiches), [fiches]);

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
      </Button>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Tendances et alertes</h1>
        <p className="text-muted-foreground">Modules Op@le les plus consultés et fiches à re-vérifier prochainement.</p>
      </header>

      {loading ? <p>Chargement…</p> : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top consultations par module</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tendances.length === 0 && <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
              {tendances.map((t) => (
                <div key={t.module} className="flex items-center justify-between text-sm border-b py-2 last:border-0">
                  <span className="font-medium">{OPALE_MODULES_LABELS[t.module as keyof typeof OPALE_MODULES_LABELS]}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{t.nb} fiches</span>
                    <span>{t.consultations} consultations</span>
                    <Badge variant="outline">Utilité {t.utiliteMoyenne}%</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Fiches à re-vérifier ({aReverif.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {aReverif.length === 0 && <p className="text-sm text-muted-foreground">Aucune fiche à péremption proche 👌</p>}
              {aReverif.slice(0, 20).map((f) => (
                <Link key={f.id} to={`/ressources/opale/fiche/${f.slug}`} className="flex items-center justify-between text-sm border-b py-2 last:border-0 hover:bg-muted/40 px-1 rounded">
                  <span>{f.titre}</span>
                  <span className="text-xs text-muted-foreground">{OPALE_MODULES_LABELS[f.module_opale]}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}