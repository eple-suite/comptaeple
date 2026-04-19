import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Lightbulb, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Suggestion {
  id: string;
  label: string;
  description?: string;
  action?: () => void;
  to?: string;
  severity?: "info" | "warning" | "critical";
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  contextLabel?: string;
}

const SEV_CFG = {
  info: { color: "text-primary", bg: "bg-primary/8 hover:bg-primary/12", dot: "bg-primary" },
  warning: { color: "text-warning", bg: "bg-warning/8 hover:bg-warning/12", dot: "bg-warning" },
  critical: { color: "text-destructive", bg: "bg-destructive/8 hover:bg-destructive/12", dot: "bg-destructive" },
};

export function SuggestionsPanel({ suggestions, contextLabel = "Suggestions IA" }: SuggestionsPanelProps) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  if (!suggestions.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/10 to-secondary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{contextLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{suggestions.length} action{suggestions.length > 1 ? "s" : ""} proactive{suggestions.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-colors" aria-label="Fermer">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Suggestions list */}
            <div className="max-h-80 overflow-y-auto p-2">
              {suggestions.map((s, i) => {
                const cfg = SEV_CFG[s.severity || "info"];
                const handle = () => {
                  if (s.action) s.action();
                  else if (s.to) navigate(s.to);
                };
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={handle}
                    className={cn("w-full text-left rounded-xl p-3 mb-1 transition-all group flex items-start gap-2.5", cfg.bg)}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", cfg.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold leading-tight", cfg.color)}>{s.label}</p>
                      {s.description && <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{s.description}</p>}
                    </div>
                    <ChevronRight className={cn("h-3.5 w-3.5 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", cfg.color)} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            onClick={() => setOpen(true)}
            className="ml-auto flex items-center gap-2 px-3.5 py-2.5 rounded-full gradient-primary text-primary-foreground shadow-primary hover:shadow-lg transition-all"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs font-bold">{suggestions.length}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
