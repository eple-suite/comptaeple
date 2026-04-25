import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReponseHist {
  id: string;
  campagne_id: string;
  establishment_id: string;
  donnees: Record<string, unknown>;
  soumise_le: string | null;
}
interface Campagne { id: string; intitule: string; type_enquete: string; periode_concernee: string | null; }

function asNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function tendance(serie: number[]): "hausse" | "baisse" | "stable" {
  if (serie.length < 2) return "stable";
  const first = serie[0];
  const last = serie[serie.length - 1];
  if (first === 0) return last > 0 ? "hausse" : "stable";
  const variation = (last - first) / Math.abs(first);
  if (variation > 0.05) return "hausse";
  if (variation < -0.05) return "baisse";
  return "stable";
}

export default function HistoriquePluriannuelPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [reponses, setReponses] = useState<ReponseHist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("enquetes_campagnes").select("id, intitule, type_enquete, periode_concernee"),
      supabase.from("enquetes_reponses_eple").select("id, campagne_id, establishment_id, donnees, soumise_le")
        .not("soumise_le", "is", null),
    ]).then(([c, r]) => {
      setCampagnes((c.data ?? []) as Campagne[]);
      setReponses(((r.data ?? []) as unknown) as ReponseHist[]);
      setLoading(false);
    });
  }, []);

  const synthese = useMemo(() => {
    const parType = new Map<string, Map<string, number>>(); // type → période → cumul
    for (const r of reponses) {
      const c = campagnes.find((x) => x.id === r.campagne_id);
      if (!c || !c.periode_concernee) continue;
      const cumul = Object.values(r.donnees).reduce<number>((acc, v) => acc + asNumber(v), 0);
      if (!parType.has(c.type_enquete)) parType.set(c.type_enquete, new Map());
      const cur = parType.get(c.type_enquete)!;
      cur.set(c.periode_concernee, (cur.get(c.periode_concernee) ?? 0) + cumul);
    }
    return Array.from(parType.entries()).map(([type, periodes]) => {
      const sorted = Array.from(periodes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const valeurs = sorted.map(([, v]) => v);
      return { type, sorted, tendance: tendance(valeurs) };
    });
  }, [campagnes, reponses]);

  if (loading) return <div className="p-6 text-muted-foreground">Chargement…</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={History}
        title="Historique pluriannuel des enquêtes"
        description="Comparaison N à N-3 par type d'enquête, détection des trajectoires."
      />

      {synthese.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">
          Aucune donnée historique disponible. Les réponses soumises apparaîtront ici par périodes.
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Synthèse par type d'enquête</CardTitle>
            <CardDescription>Cumul des données numériques par période concernée.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Périodes</TableHead>
                  <TableHead>Sparkline</TableHead>
                  <TableHead>Tendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {synthese.map((s) => {
                  const max = Math.max(...s.sorted.map(([, v]) => v), 1);
                  return (
                    <TableRow key={s.type}>
                      <TableCell className="font-medium">{s.type}</TableCell>
                      <TableCell className="text-xs">
                        {s.sorted.map(([p, v]) => `${p}: ${v.toFixed(0)}`).join(" | ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-end gap-1 h-8">
                          {s.sorted.map(([p, v]) => (
                            <div key={p} className="bg-primary/60 w-3 rounded-t"
                              style={{ height: `${(v / max) * 100}%` }} title={`${p}: ${v.toFixed(2)}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.tendance === "hausse" && <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" />Hausse</Badge>}
                        {s.tendance === "baisse" && <Badge variant="default"><TrendingDown className="h-3 w-3 mr-1" />Baisse</Badge>}
                        {s.tendance === "stable" && <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Stable</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}