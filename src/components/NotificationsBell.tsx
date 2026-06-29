import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlertesOuvertes } from "@/hooks/queries/useAlertes";
import { EmptyState } from "@/components/states";
import type { NiveauAlerte } from "@/lib/cockpit/types";

// Centre de notifications (amélioration #15) : cloche en top bar surfaçant les
// alertes transverses ouvertes du groupement (compte financier, prescription,
// contrôles, anomalies…). Lecture via React Query (cache 60 s).

const DOT: Record<NiveauAlerte, string> = {
  rouge: "bg-destructive",
  orange: "bg-orange-500",
  jaune: "bg-amber-400",
  info: "bg-primary",
};

export function NotificationsBell() {
  const navigate = useNavigate();
  const { data: alertes = [] } = useAlertesOuvertes();
  const count = alertes.length;
  const urgent = alertes.some((a) => a.niveau === "rouge");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg relative" aria-label={`Notifications (${count})`}>
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${urgent ? "bg-destructive" : "bg-primary"}`}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 rounded-xl shadow-elevated">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="text-sm font-semibold">Alertes ouvertes</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {count === 0 ? (
            <div className="p-2">
              <EmptyState title="Aucune alerte ouverte" description="Tout est à jour pour le groupement." />
            </div>
          ) : (
            alertes.map((a) => (
              <button
                key={a.id}
                onClick={() => a.action_url && navigate(a.action_url)}
                className="w-full text-left px-4 py-3 hover:bg-accent/50 border-b last:border-0 flex gap-3 transition-colors"
              >
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${DOT[a.niveau]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{a.titre}</p>
                  {a.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="uppercase tracking-wide">{a.module_origine}</span>
                    {a.echeance && <span>• échéance {new Date(a.echeance).toLocaleDateString("fr-FR")}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
