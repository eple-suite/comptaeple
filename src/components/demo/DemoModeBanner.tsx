// ════════════════════════════════════════════════════════════════
// Bandeau global affiché en haut de l'app quand le mode démo est actif
// ════════════════════════════════════════════════════════════════
import { Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { DEMO_ETABLISSEMENT, getDemoHint } from "@/lib/demo/fixtures";

export function DemoModeBanner() {
  const { isDemoMode, disable } = useDemoMode();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const hint = getDemoHint(location.pathname);

  return (
    <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 text-white shadow-md">
      <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-2 text-xs">
        <Sparkles className="h-4 w-4 shrink-0" />
        <Badge variant="outline" className="bg-white/15 border-white/40 text-white text-[10px]">
          MODE DÉMONSTRATION
        </Badge>
        <span className="font-medium">
          {DEMO_ETABLISSEMENT.nom} ({DEMO_ETABLISSEMENT.uai}) — données fictives, aucune écriture en base.
        </span>
        {hint && (
          <span className="hidden md:inline text-white/90 truncate max-w-[420px]">
            • {hint.titre} : {hint.pitch}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-white hover:bg-white/15 text-[11px]"
            onClick={() => navigate("/demo")}
          >
            Pilotage démo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-white hover:bg-white/15 text-[11px]"
            onClick={disable}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Désactiver
          </Button>
        </div>
      </div>
    </div>
  );
}