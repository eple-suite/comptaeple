import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Voyage, CATEGORIES_PRESTATIONS, calculerPointMort } from "./types";
import { validerEquilibreBudgetaire, calculerParticipationEquilibre, calculerCoutParParticipant } from "@/lib/voyageBudgetEngine";
import { formatCurrency } from "@/lib/mockData";
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Scale, Banknote } from "lucide-react";

interface Props {
  voyage: Voyage;
}

const BAR_COLORS = [
  "bg-primary", "bg-accent", "bg-warning", "bg-success", "bg-muted-foreground/60", "bg-muted-foreground/30",
];

export const VoyageBudgetWidget = ({ voyage }: Props) => {
  const v = voyage;
  const regieAvances = (v as any).regieAvances || 0;
  const totalDepenses = v.transport + v.hebergement + v.restauration + v.activites + v.assurance + v.divers + regieAvances;
  const totalRecettes = v.participationFamilles + v.subventions + v.autofinancement;
  const pm = useMemo(() => calculerPointMort(v), [v]);

  // Validation budgétaire stricte
  const budgetData = useMemo(() => ({
    nbEleves: v.nbEleves,
    nbAccompagnateurs: v.nbAccompagnateurs,
    participationFamilles: v.participationFamilles,
    subventionCollectivite: v.subventionCollectivite,
    subventionEtat: v.subventionEtat,
    subventionAutre: v.subventionAutre,
    autofinancement: v.autofinancement,
    transport: v.transport,
    hebergement: v.hebergement,
    restauration: v.restauration,
    activites: v.activites,
    assurance: v.assurance,
    divers: v.divers,
    regieAvances,
  }), [v, regieAvances]);

  const validation = useMemo(() => validerEquilibreBudgetaire(budgetData), [budgetData]);
  const participationSuggestion = useMemo(() => calculerParticipationEquilibre(budgetData), [budgetData]);
  const coutParticipant = useMemo(() => calculerCoutParParticipant(budgetData), [budgetData]);

  const postes = [
    ...CATEGORIES_PRESTATIONS.map((cat, i) => ({
      label: cat.label, icon: cat.icon,
      montant: (v as any)[cat.key] || 0, color: BAR_COLORS[i],
    })),
    ...(regieAvances > 0 ? [{ label: "Régie d'avances", icon: "💳", montant: regieAvances, color: "bg-primary/40" }] : []),
  ].filter(p => p.montant > 0);

  const totalPostes = postes.reduce((s, p) => s + p.montant, 0);

  // Version statut
  const versionStatut = (v as any).versionStatut || "brouillon";

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Budget prévisionnel</CardTitle>
          <Badge variant="secondary" className={`text-[10px] border-0 ${
            versionStatut === "valide" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}>
            {versionStatut === "valide" ? "✅ Validé (comptable)" : "📝 Brouillon (enseignant)"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertes d'équilibre budgétaire */}
        {validation.erreurs.length > 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-xs font-semibold">Blocage budgétaire</AlertTitle>
            <AlertDescription className="text-xs">
              {validation.erreurs.map((e, i) => <p key={i}>{e}</p>)}
              {participationSuggestion > 0 && (
                <p className="mt-1 font-semibold">
                  💡 Suggestion : ajuster la participation à {formatCurrency(participationSuggestion)} / élève
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
        {validation.avertissements.length > 0 && validation.erreurs.length === 0 && (
          <Alert className="py-2 border-warning/50 bg-warning/5">
            <Scale className="h-4 w-4 text-warning" />
            <AlertTitle className="text-xs font-semibold text-warning">Attention</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              {validation.avertissements.map((a, i) => <p key={i}>{a}</p>)}
            </AlertDescription>
          </Alert>
        )}
        {validation.equilibre && (
          <Alert className="py-2 border-success/50 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-xs font-semibold text-success">Budget équilibré</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Recettes = Dépenses — Conforme à la réglementation.
            </AlertDescription>
          </Alert>
        )}

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
          <span className={`font-mono font-bold ${validation.equilibre ? "text-success" : validation.solde > 0 ? "text-destructive" : "text-warning"}`}>
            {formatCurrency(validation.solde)}
          </span>
        </div>

        {/* Régie d'avances */}
        {regieAvances > 0 && (
          <div className="flex items-center gap-2 bg-accent/50 rounded-lg p-2.5 text-xs">
            <Banknote className="h-4 w-4 text-primary" />
            <div>
              <span className="font-semibold">Régie d'avances : {formatCurrency(regieAvances)}</span>
              <span className="text-muted-foreground ml-1">(Décrets n°2019-798 / n°2020-922)</span>
            </div>
          </div>
        )}

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

        {/* Participation suggestion */}
        {!validation.equilibre && participationSuggestion > 0 && v.nbEleves > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-xs">
            <p className="font-semibold text-primary">💡 Participation suggérée pour l'équilibre :</p>
            <p className="font-mono font-bold text-primary text-sm mt-0.5">
              {formatCurrency(participationSuggestion)} / élève × {v.nbEleves} = {formatCurrency(participationSuggestion * v.nbEleves)}
            </p>
          </div>
        )}

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
