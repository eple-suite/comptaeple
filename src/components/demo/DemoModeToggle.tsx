// ════════════════════════════════════════════════════════════════
// Bouton de bascule du mode démonstration (sidebar)
// ════════════════════════════════════════════════════════════════
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/contexts/DemoModeContext";

interface Props {
  collapsed?: boolean;
}

export function DemoModeToggle({ collapsed }: Props) {
  const { isDemoMode, toggle } = useDemoMode();
  return (
    <Button
      size="sm"
      variant={isDemoMode ? "default" : "outline"}
      onClick={toggle}
      className={`w-full justify-start gap-2 ${isDemoMode ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : ""}`}
      title={isDemoMode ? "Désactiver le mode démonstration" : "Activer le mode démonstration"}
    >
      <Sparkles className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="text-xs">{isDemoMode ? "Mode démo actif" : "Mode démonstration"}</span>
      )}
    </Button>
  );
}