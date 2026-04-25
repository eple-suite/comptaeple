import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  active: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}

export function ModeDemoBadge({ active, onToggle, isAdmin }: Props) {
  if (!isAdmin && !active) return null;
  if (!active) {
    return (
      <Button size="sm" variant="outline" onClick={onToggle} className="h-7 text-xs gap-1.5">
        <Sparkles className="h-3 w-3" /> Mode démo rectorat
      </Button>
    );
  }
  return (
    <div className="rounded-lg border-2 border-warning bg-warning/10 px-3 py-1.5 flex items-center gap-2 text-warning">
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="text-xs font-bold uppercase tracking-wider">Mode démonstration — Données fictives</span>
      <Button size="sm" variant="ghost" onClick={onToggle} className="h-6 px-2 text-warning hover:bg-warning/20">
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
