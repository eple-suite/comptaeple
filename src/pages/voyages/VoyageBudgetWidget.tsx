import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Voyage, CATEGORIES_PRESTATIONS, calculerPointMort } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  voyage: Voyage;
}

const BAR_COLORS = [
  "bg-primary", "bg-accent", "bg-warning", "bg-success", "bg-muted-foreground/60", "bg-muted-foreground/30",
];

export const VoyageBudgetWidget = ({ voyage }: Props) => {
  const v = voyage;
  const totalDepenses = v.transport + v.hebergement + v.restauration + v.activites + v.assurance + v.divers;
  const totalRecettes = v.participationFamilles + v.subventions + v.autofinancement;
  const solde = totalRecettes - totalDepenses;
  const pm = useMemo(() => calculerPointMort(v), [v]);

  const postes = CATEGORIES_PRESTATIONS.map((cat, i) => ({
    label: cat.label,
    icon: cat.icon,
    montant: (v as any)[cat.key] || 0,
    color: BAR_COLORS[i],
  })).filter(p => p.montant > 0);

  const totalPostes = postes.reduce((s, p) => s + p.montant, 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Budget prévisionnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barres empilées */}
        {totalPostes > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Répartition des dépenses</p>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              {postes.map((p, i) => (
                <div key={i} className={`${p.color} transition-all`} style={{ width: `${(p.montant / totalPostes) * 100}%` }} title={`${p.label}: ${formatCurrency(p.montant)}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {postes.map((p, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]">
                  <div className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-muted-foreground">{p.icon} {p.label}</span>
                  <span className="font-mono font-semibold">{formatCurrency(p.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recettes vs Dépenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-destructive/5 rounded-lg p-3">
            <div className="flex items-center gap-1 text-destructive text-xs mb-0.5">
              <TrendingDown className="h-3 w-3" /> Dépenses
            </div>
            <div className="text-lg font-bold font-mono text-destructive">{formatCurrency(totalDepenses)}</div>
          </div>
          <div className="bg-success/5 rounded-lg p-3">
            <div className="flex items-center gap-1 text-success text-xs mb-0.5">
              <TrendingUp className="h-3 w-3" /> Recettes
            </div>
            <div className="text-lg font-bold font-mono text-success">{formatCurrency(totalRecettes)}</div>
          </div>
        </div>

        {/* Solde */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-2">
          <span className="font-medium">Solde prévisionnel</span>
          <span className={`font-mono font-bold ${solde >= 0 ? "text-success" : "text-destructive"}`}>
            {formatCurrency(solde)}
          </span>
        </div>

        {/* Point mort */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5 text-xs">
          <Target className="h-4 w-4 text-primary" />
          <div>
            <span className="font-semibold">Point mort : {pm.pointMort} élèves</span>
            <span className={`ml-1 ${pm.estViable ? "text-success" : "text-destructive"}`}>
              {pm.estViable ? `✓ Viable (+${pm.marge} marge)` : `✗ Non viable (${pm.marge})`}
            </span>
          </div>
        </div>

        {/* Détail recettes */}
        <div className="space-y-1.5 text-xs">
          {[
            { label: "Familles", value: v.participationFamilles },
            { label: "Collectivité", value: v.subventionCollectivite },
            { label: "État", value: v.subventionEtat },
            { label: "Autres subv.", value: v.subventionAutre },
            { label: "Autofinancement", value: v.autofinancement },
          ].filter(r => r.value > 0).map(r => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-semibold">{formatCurrency(r.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
