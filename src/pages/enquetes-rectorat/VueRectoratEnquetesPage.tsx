import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Send } from "lucide-react";
import type { EnqueteCampagne, EnqueteReponseEple } from "@/lib/enquetes-rectorat/types";

export default function VueRectoratEnquetesPage() {
  const [campagnes, setCampagnes] = useState<EnqueteCampagne[]>([]);
  const [reponses, setReponses] = useState<EnqueteReponseEple[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: rs }] = await Promise.all([
        supabase.from("enquetes_campagnes" as any).select("*").order("date_echeance", { ascending: false }),
        supabase.from("enquetes_reponses_eple" as any).select("*"),
      ]);
      if (cs) setCampagnes(cs as unknown as EnqueteCampagne[]);
      if (rs) setReponses(rs as unknown as EnqueteReponseEple[]);
      setLoading(false);
    })();
  }, []);

  function statutBadge(s: string) {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      non_commencee: "outline",
      en_cours: "secondary",
      soumise: "default",
      validee: "default",
      rejetee: "destructive",
    };
    return <Badge variant={map[s] ?? "outline"}>{s}</Badge>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Vue Rectorat — Tableau de bord enquêtes"
        description="Consultation académique en lecture seule. Rôle observateur_rectoral. Toute consultation est tracée."
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export consolidé PDF
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}

      {campagnes.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucune campagne d'enquête à afficher pour le moment.
          </CardContent>
        </Card>
      )}

      {campagnes.map((c) => {
        const rs = reponses.filter((r) => r.campagne_id === c.id);
        const conformes = rs.filter((r) => ["soumise", "validee"].includes(r.statut)).length;
        const total = c.perimetre_etablissement_ids.length || rs.length;
        return (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{c.intitule}</span>
                <Badge variant="outline">{c.type_enquete}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Échéance : {c.date_echeance} — {conformes}/{total} EPLE conformes
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {rs.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded p-2 text-sm">
                  <span className="font-mono text-xs">EPLE {r.establishment_id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    {statutBadge(r.statut)}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Détails
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Send className="h-3 w-3 mr-1" />
                      Demander complément
                    </Button>
                  </div>
                </div>
              ))}
              {rs.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Aucune réponse encore enregistrée.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}