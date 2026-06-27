// DictationButton — bouton micro qui dicte dans un champ texte (Web Speech API).
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDictation } from "@/hooks/useDictation";

interface DictationButtonProps {
  onAppend: (texte: string) => void;
  className?: string;
  size?: "sm" | "icon";
}

export function DictationButton({ onAppend, className, size = "icon" }: DictationButtonProps) {
  const { supported, listening, toggle } = useDictation({ onResult: (t) => onAppend(t) });

  if (!supported) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size={size === "icon" ? "icon" : "sm"} disabled className={className}>
            <MicOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Dictée vocale indisponible (utilisez Chrome/Edge).</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant={listening ? "default" : "outline"} size={size === "icon" ? "icon" : "sm"}
          onClick={toggle} className={cn(listening && "animate-pulse", className)}>
          <Mic className="h-4 w-4" />
          {size !== "icon" && <span className="ml-1.5 text-xs">{listening ? "Écoute…" : "Dicter"}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{listening ? "Arrêter la dictée" : "Dicter à la voix"}</TooltipContent>
    </Tooltip>
  );
}
