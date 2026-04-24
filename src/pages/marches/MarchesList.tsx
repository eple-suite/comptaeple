import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useMarches } from "./hooks/useMarchesData";
import { formatEur } from "./lib/seuilsEngine";
import { STATUT_LABELS, PROCEDURE_LABELS, TYPE_MARCHE_LABELS } from "./types";

export default function MarchesList() {
  const { data: marches = [], isLoading } = useMarches();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Mes marchés</h1>
          <p className="text-sm text-muted-foreground">{marches.length} marché{marches.length > 1 ? "s" : ""} enregistré{marches.length > 1 ? "s" : ""}</p>
        </div>
        <Button asChild><Link to="/marches/nouveau"><Plus className="h-4 w-4 mr-2" /> Nouveau marché</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Liste</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : marches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun marché.</p>
          ) : (
            <div className="space-y-2">
              {marches.map(m => (
                <Link key={m.id} to={`/marches/detail/${m.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium">{m.libelle}</p>
                    <p className="text-xs text-muted-foreground">{m.reference_interne} • {TYPE_MARCHE_LABELS[m.type_marche]} • {PROCEDURE_LABELS[m.procedure_calculee]}</p>
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
    </div>
  );
}
