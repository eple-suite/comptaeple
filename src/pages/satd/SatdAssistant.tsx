import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, AlertTriangle, BookOpen, ExternalLink, AlertCircle } from "lucide-react";
import { ASSISTANT_ADVICE } from "./SatdReferenceData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: string;
}

export default function SatdAssistant({ open, onOpenChange, context }: Props) {
  const advice = ASSISTANT_ADVICE[context] || ASSISTANT_ADVICE.creation_satd;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant SATD Pro — {advice.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bonnes pratiques */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success font-semibold text-sm mb-2">
              <CheckCircle className="h-4 w-4" />
              Bonnes pratiques
            </div>
            <ul className="space-y-1.5">
              {advice.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 mt-0.5 text-success flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Points d'attention */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-warning font-semibold text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Points d'attention
            </div>
            <ul className="space-y-1.5">
              {advice.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <AlertCircle className="h-3 w-3 mt-0.5 text-warning flex-shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Références */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
              <BookOpen className="h-4 w-4" />
              Références réglementaires
            </div>
            <ul className="space-y-1.5">
              {advice.references.map((ref, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <ExternalLink className="h-3 w-3 text-primary flex-shrink-0" />
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
