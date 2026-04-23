// ═══════════════════════════════════════════════════════════════
// Badge de complétude d'une fiche élève (vert/orange/rouge)
// + Popover listant les champs manquants
// ═══════════════════════════════════════════════════════════════

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, XCircle, Pencil } from "lucide-react";
import { evaluerCompletudeEleve } from "./fsEnqueteHelpers";
import type { FsEleve } from "./fsv2Types";

interface Props {
  eleve: FsEleve;
  onEdit?: () => void;
  size?: "sm" | "md";
}

export function ProfilCompletudeBadge({ eleve, onEdit, size = "sm" }: Props) {
  const { pct, missing, level } = evaluerCompletudeEleve(eleve);

  const cls =
    level === "ok"
      ? "bg-success/15 text-success border-success/30"
      : level === "warn"
      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
      : "bg-destructive/15 text-destructive border-destructive/30";

  const Icon = level === "ok" ? CheckCircle2 : level === "warn" ? AlertCircle : XCircle;
  const dim = size === "md" ? "h-7 px-2 text-xs" : "h-6 px-1.5 text-[10px]";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 rounded-full border ${cls} ${dim} font-medium transition-opacity hover:opacity-80`}
          title={`Fiche complétée à ${pct} %`}
        >
          <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
          {pct}%
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-2">
          <div className="text-sm font-semibold">
            Complétude fiche élève — {pct}%
          </div>
          {missing.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Tous les champs critiques pour l'enquête DGESCO sont renseignés.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Champs manquants pour une enquête conforme :
              </p>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {missing.map(m => <li key={m}>{m}</li>)}
              </ul>
              {onEdit && (
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={onEdit}>
                  <Pencil className="h-3 w-3 mr-1" /> Compléter la fiche
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}