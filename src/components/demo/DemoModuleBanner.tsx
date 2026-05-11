// ════════════════════════════════════════════════════════════════
// Bandeau contextuel par module — visible uniquement en mode démo
// À insérer en haut de chaque page racine de module.
// ════════════════════════════════════════════════════════════════
import { Sparkles, Info } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { getDemoHint, DEMO_POINTS_VIGILANCE } from "@/lib/demo/fixtures";

export function DemoModuleBanner() {
  const { isDemoMode } = useDemoMode();
  const location = useLocation();

  if (!isDemoMode) return null;

  const hint = getDemoHint(location.pathname);
  const vigilance = DEMO_POINTS_VIGILANCE.filter((p) =>
    location.pathname.startsWith(p.route),
  );

  if (!hint && vigilance.length === 0) return null;

  return (
    <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <Sparkles className="h-4 w-4 text-amber-600" />
      <AlertTitle className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
          MODE DÉMONSTRATION
        </Badge>
        <span>{hint?.titre || "Module en mode démo"}</span>
      </AlertTitle>
      <AlertDescription className="text-xs space-y-2 mt-2">
        {hint?.pitch && <p>{hint.pitch}</p>}
        {vigilance.length > 0 && (
          <ul className="space-y-1 mt-2">
            {vigilance.map((v, i) => (
              <li key={i} className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0 text-amber-700" />
                <span>
                  <strong className={v.niveau === "rouge" ? "text-destructive" : "text-amber-700"}>
                    {v.titre}
                  </strong>{" "}
                  — {v.detail}{" "}
                  {v.reference && <em className="text-muted-foreground">({v.reference})</em>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] italic text-muted-foreground">
          Aucune écriture en base. Désactivez le mode démo pour revenir aux données réelles.
        </p>
      </AlertDescription>
    </Alert>
  );
}