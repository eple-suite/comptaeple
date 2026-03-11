import { useMemo } from "react";
import { MapPin, Users, CalendarDays, Bus, Plane, Train, Ship, Compass, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Voyage, STATUT_CONFIG, calculerPointMort, TRANSPORT_TYPE_LABELS, TYPE_VOYAGE_LABELS } from "./types";
import { formatCurrency } from "@/lib/mockData";

interface Props {
  voyage: Voyage;
  onClick: () => void;
}

const TRANSPORT_ICONS: Record<string, React.ElementType> = {
  bus: Bus, avion: Plane, train: Train, bateau: Ship, mixte: Compass,
};

export const VoyageCard = ({ voyage, onClick }: Props) => {
  const v = voyage;
  const statutCfg = STATUT_CONFIG[v.statut];

  const joursRestants = useMemo(() => {
    const diff = new Date(v.dateDepart).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }, [v.dateDepart]);

  const collecte = useMemo(() => {
    const totalRecu = v.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    return { totalRecu, pct: v.participationFamilles > 0 ? (totalRecu / v.participationFamilles) * 100 : 0 };
  }, [v.eleves, v.participationFamilles]);

  const pm = useMemo(() => calculerPointMort(v), [v]);

  const couverture = v.budgetTotal > 0
    ? ((v.participationFamilles + v.subventions + v.autofinancement) / v.budgetTotal) * 100
    : 0;

  const checkDone = v.checklist.filter(c => c.fait).length;
  const checkTotal = v.checklist.length;

  const TransportIcon = TRANSPORT_ICONS[v.transportType || v.moyenTransport?.toLowerCase().includes("avion") ? "avion" : "bus"] || Bus;
  const typeLabel = v.typeVoyage ? TYPE_VOYAGE_LABELS[v.typeVoyage] : null;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group border-border/50"
      onClick={onClick}
    >
      {/* Header gradient */}
      <div className="relative h-28 bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden">
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute top-3 left-3">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
            <TransportIcon className="text-white h-5 w-5" />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={`text-[10px] ${statutCfg.class}`}>{statutCfg.label}</Badge>
        </div>
        {joursRestants > 0 && joursRestants <= 60 && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-0.5">
            <span className="text-xs font-bold text-primary">J-{joursRestants}</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-16">
          <h3 className="text-base font-bold text-white truncate">
            {v.intitule || v.destination}
          </h3>
          <div className="flex items-center gap-1.5 text-white/85 text-xs mt-0.5">
            <MapPin className="h-3 w-3" />
            <span>{v.destination}, {v.pays}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-3.5 space-y-3">
        {/* Dates + participants */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>{v.dateDepart} → {v.dateRetour}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="font-semibold text-foreground">{v.nbEleves}</span>+{v.nbAccompagnateurs}
          </div>
        </div>

        {/* Budget & couverture */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(v.budgetTotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Couverture</span>
            <span className={`font-semibold ${couverture >= 100 ? "text-success" : couverture >= 80 ? "text-warning" : "text-destructive"}`}>
              {couverture.toFixed(0)}%
            </span>
          </div>
          <Progress value={Math.min(couverture, 100)} className={`h-1.5 ${couverture >= 100 ? "[&>div]:bg-success" : couverture >= 80 ? "" : "[&>div]:bg-destructive"}`} />
        </div>

        {/* Collecte familles */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Collecte familles</span>
            <span className="font-mono">{formatCurrency(collecte.totalRecu)} / {formatCurrency(v.participationFamilles)}</span>
          </div>
          <Progress value={Math.min(collecte.pct, 100)} className="h-1" />
        </div>

        {/* Point mort + conformité */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px]">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className={pm.estViable ? "text-success" : "text-destructive"}>
              Point mort : {pm.pointMort} élèves {pm.estViable ? `(+${pm.marge})` : `(${pm.marge})`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {checkTotal > 0 && (
              <span className={checkDone === checkTotal ? "text-success" : "text-muted-foreground"}>
                ✓ {checkDone}/{checkTotal}
              </span>
            )}
          </div>
        </div>

        {/* Type + classe */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {typeLabel && <Badge variant="outline" className="text-[9px]">{typeLabel.icon} {typeLabel.label}</Badge>}
          <Badge variant="secondary" className="text-[9px]">{v.classe}</Badge>
          <Badge variant="outline" className="text-[9px]">{v.professeur}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
