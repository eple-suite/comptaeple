import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onStart: () => void;
  onDismiss: () => void;
}

export function PremierUsageBanner({ onStart, onDismiss }: Props) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">Bienvenue sur votre cockpit AC.</span>
          <span className="text-muted-foreground"> Premier usage ? Lancez le tour guidé en 7 étapes.</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onStart} className="h-7 text-xs">Tour guidé</Button>
        <Button size="sm" variant="ghost" onClick={() => { setClosed(true); onDismiss(); }} className="h-7 text-xs">
          Plus tard <X className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
