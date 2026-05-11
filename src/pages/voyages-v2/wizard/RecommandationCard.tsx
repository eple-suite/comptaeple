// ════════════════════════════════════════════════════════════════
// Carte de recommandation actionnable issue d'une alerte
// ════════════════════════════════════════════════════════════════
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import type { AlerteVoyage, NiveauAlerte } from "../lib/alertesEngine";
import { getRecommandation } from "../lib/recommandations";

interface Props {
  alerte: AlerteVoyage;
  /** Callback : se rendre sur l'étape du wizard correspondante. */
  onJumpToStep?: (step: number, champ?: string) => void;
}

const TONE: Record<NiveauAlerte, string> = {
  rouge: "border-l-4 border-l-destructive bg-destructive/5",
  orange: "border-l-4 border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20",
  bleu: "border-l-4 border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/20",
  vert: "border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
};

const ICON: Record<NiveauAlerte, any> = {
  rouge: ShieldAlert,
  orange: AlertTriangle,
  bleu: Info,
  vert: CheckCircle2,
};

const NIVEAU_LABEL: Record<NiveauAlerte, string> = {
  rouge: "À traiter en priorité",
  orange: "Vigilance",
  bleu: "Information",
  vert: "OK",
};

export function RecommandationCard({ alerte, onJumpToStep }: Props) {
  const reco = getRecommandation(alerte.categorie);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const Icon = ICON[alerte.niveau];
  const total = reco.checklist.length;
  const done = checked.size;
  const allDone = done === total && total > 0;

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className={`rounded-md p-4 ${TONE[alerte.niveau]} ${allDone ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={alerte.niveau === "rouge" ? "destructive" : "outline"}
              className="text-[10px]"
            >
              {NIVEAU_LABEL[alerte.niveau]}
            </Badge>
            {alerte.bloquant && (
              <Badge variant="destructive" className="text-[10px]">
                Bloquant
              </Badge>
            )}
            <span className="text-sm font-semibold">{alerte.titre}</span>
            {total > 0 && (
              <Badge variant="outline" className="text-[10px] ml-auto">
                {done}/{total} vérifié{done > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">{alerte.message}</p>

          <div className="mt-3 rounded-md bg-background/60 border p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> Action recommandée
            </p>
            <p className="text-sm">{reco.action}</p>

            {reco.checklist.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {reco.checklist.map((item, idx) => {
                  const isChecked = checked.has(idx);
                  return (
                    <li key={idx} className="flex items-start gap-2">
                      <Checkbox
                        id={`${alerte.id}-chk-${idx}`}
                        checked={isChecked}
                        onCheckedChange={() => toggle(idx)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`${alerte.id}-chk-${idx}`}
                        className={`text-xs cursor-pointer leading-snug ${isChecked ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {reco.step && onJumpToStep && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onJumpToStep(reco.step!, alerte.champ_concerne)}
                  className="h-7 text-xs"
                >
                  Aller au champ : {reco.champLabel || `Étape ${reco.step}`}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {alerte.reference_legale && (
                <span className="text-[10px] italic text-muted-foreground self-center">
                  📚 {alerte.reference_legale}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}