// ════════════════════════════════════════════════════════════════
// Étape Rétroplanning — Calendrier J-180 → J+120 + alertes
// ════════════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  Plane,
  PlaneLanding,
} from "lucide-react";
import {
  genererJalons,
  alertesJalons,
  CATEGORIE_LABELS,
  CATEGORIE_COLORS,
  PRIORITE_COLORS,
  STATUT_COLORS,
  STATUT_LABELS,
  type JalonInstance,
  type JalonStatut,
  type JalonCategorie,
} from "../lib/retroplanningEngine";
import type { VoyageDraft } from "../hooks/useVoyageV2";

interface Props {
  draft: VoyageDraft;
  jalonsState: Record<string, { statut: JalonStatut }>;
  setJalonsState: (s: Record<string, { statut: JalonStatut }>) => void;
}

export function StepRetroplanning({ draft, jalonsState, setJalonsState }: Props) {
  const [filtreCat, setFiltreCat] = useState<JalonCategorie | "all">("all");

  const jalons = useMemo(
    () =>
      genererJalons(draft.date_depart, draft.date_retour, {
        type_projet: draft.type_projet,
        caractere: draft.caractere,
        type_sortie: draft.type_sortie,
        destination_pays: draft.destination_pays,
        nombre_nuitees: draft.nombre_nuitees,
        montant_total_ttc: draft.montant_total_ttc,
      }, jalonsState),
    [draft, jalonsState],
  );

  const alertes = useMemo(() => alertesJalons(jalons), [jalons]);
  const filtres = filtreCat === "all" ? jalons : jalons.filter((j) => j.categorie === filtreCat);

  const stats = useMemo(() => {
    const total = jalons.length;
    const faits = jalons.filter((j) => j.statut === "fait").length;
    const retards = jalons.filter((j) => j.statut === "retard").length;
    return { total, faits, retards, progression: total > 0 ? Math.round((faits / total) * 100) : 0 };
  }, [jalons]);

  const updateStatut = (code: string, statut: JalonStatut) => {
    setJalonsState({ ...jalonsState, [code]: { statut } });
  };

  if (!draft.date_depart) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Date de départ requise</AlertTitle>
        <AlertDescription>
          Renseignez d'abord la date de départ à l'étape 3 pour générer le rétroplanning.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête : KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={CalendarClock} label="Jalons générés" value={String(stats.total)} tone="primary" />
        <KpiTile icon={CheckCircle2} label="Réalisés" value={`${stats.faits} (${stats.progression}%)`} tone="success" />
        <KpiTile icon={AlertTriangle} label="En retard" value={String(stats.retards)} tone={stats.retards > 0 ? "destructive" : "muted"} />
        <KpiTile icon={Clock} label="Alertes actives" value={String(alertes.length)} tone={alertes.length > 0 ? "warning" : "muted"} />
      </div>

      {/* Alertes critiques */}
      {alertes.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs">{alertes.length} jalon(s) requièrent votre attention</AlertTitle>
          <AlertDescription className="text-xs">
            {alertes.slice(0, 3).map((a) => a.libelle).join(" · ")}
            {alertes.length > 3 && ` · +${alertes.length - 3}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtre par catégorie */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Filtrer :</span>
        <Select value={filtreCat} onValueChange={(v) => setFiltreCat(v as any)}>
          <SelectTrigger className="h-8 w-[220px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {Object.entries(CATEGORIE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[10px]">{filtres.length} jalon(s)</Badge>
      </div>

      {/* Timeline visuelle */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-3 text-[11px] font-semibold">
          <Plane className="h-3.5 w-3.5 text-primary" />
          <span>Départ : {draft.date_depart || "—"}</span>
          <span className="text-muted-foreground">→</span>
          <PlaneLanding className="h-3.5 w-3.5 text-primary" />
          <span>Retour : {draft.date_retour || "—"}</span>
        </div>
        <ScrollArea className="h-[420px]">
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-[120px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-1 py-2">
              {filtres.map((j) => (
                <JalonRow key={j.code} jalon={j} onChange={(s) => updateStatut(j.code, s)} />
              ))}
              {filtres.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Aucun jalon dans cette catégorie.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </Card>

      <p className="text-[10px] text-muted-foreground">
        Sources : Circulaire MENE2407159C du 16-7-2024 · Code éducation R.421-20 · Décret GBCP 2012-1246 · CCP 2026 · Loi 66-948 art. 21.
      </p>
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────
function JalonRow({ jalon, onChange }: { jalon: JalonInstance; onChange: (s: JalonStatut) => void }) {
  const isPast = jalon.joursRestants < 0;
  const offsetLabel = jalon.joursRestants === 0
    ? "Aujourd'hui"
    : jalon.joursRestants > 0
    ? `J-${jalon.joursRestants}`
    : `J+${Math.abs(jalon.joursRestants)}`;

  return (
    <div className="flex items-start gap-3 px-4 py-2 hover:bg-muted/30 transition-colors group">
      {/* Date + offset */}
      <div className="w-[110px] shrink-0 text-right">
        <p className="text-[11px] font-mono font-semibold">{jalon.date_prevue}</p>
        <p className={`text-[10px] ${isPast && jalon.statut !== "fait" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {offsetLabel}
        </p>
      </div>

      {/* Pastille catégorie */}
      <div className="relative shrink-0 mt-1">
        <div className={`h-3 w-3 rounded-full border-2 ${
          jalon.statut === "fait"
            ? "bg-emerald-500 border-emerald-600"
            : jalon.statut === "retard"
            ? "bg-destructive border-destructive animate-pulse"
            : jalon.priorite === "bloquant"
            ? "bg-destructive/40 border-destructive"
            : "bg-background border-primary"
        }`} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold leading-tight">{jalon.libelle}</p>
          <Badge className={`text-[9px] uppercase tracking-wide shrink-0 ${PRIORITE_COLORS[jalon.priorite]}`}>
            {jalon.priorite}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">{jalon.description}</p>
        <div className="flex items-center flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[9px] ${CATEGORIE_COLORS[jalon.categorie]}`}>
            {CATEGORIE_LABELS[jalon.categorie]}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{jalon.responsable}</span>
          {jalon.base_legale && (
            <span className="text-[9px] text-muted-foreground italic">· {jalon.base_legale}</span>
          )}
        </div>
      </div>

      {/* Statut */}
      <Select value={jalon.statut} onValueChange={(v) => onChange(v as JalonStatut)}>
        <SelectTrigger className={`h-7 w-[110px] text-[10px] shrink-0 ${STATUT_COLORS[jalon.statut]}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUT_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KpiTile({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string; tone: "primary" | "success" | "warning" | "destructive" | "muted" }) {
  const cls = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    success: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    warning: "border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300",
    destructive: "border-destructive/40 bg-destructive/5 text-destructive",
    muted: "border-border bg-muted/30 text-muted-foreground",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[10px] uppercase tracking-wide font-semibold">{label}</p>
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
