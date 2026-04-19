import { motion } from "framer-motion";
import { Sparkles, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HyperaleHeroProps {
  etabName: string;
  exercice: number;
  hasData: boolean;
  scoreSante: number; // 0-100
  niveauGlobal: "excellent" | "satisfaisant" | "surveiller" | "critique";
  resumeStoryteller: string;
  alertesCount: number;
}

const NIVEAU_CONFIG = {
  excellent: { label: "Excellente santé", color: "hsl(158 42% 42%)", bg: "from-emerald-500/15", glow: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.4)]" },
  satisfaisant: { label: "Santé satisfaisante", color: "hsl(220 65% 48%)", bg: "from-primary/15", glow: "shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]" },
  surveiller: { label: "À surveiller", color: "hsl(38 92% 50%)", bg: "from-amber-500/15", glow: "shadow-[0_0_60px_-15px_rgba(245,158,11,0.4)]" },
  critique: { label: "Situation critique", color: "hsl(0 84% 60%)", bg: "from-destructive/15", glow: "shadow-[0_0_60px_-15px_rgba(239,68,68,0.4)]" },
};

export function HyperaleHero({ etabName, exercice, hasData, scoreSante, niveauGlobal, resumeStoryteller, alertesCount }: HyperaleHeroProps) {
  const navigate = useNavigate();
  const cfg = NIVEAU_CONFIG[niveauGlobal];
  const dashOffset = 339.292 - (scoreSante / 100) * 339.292; // 2*PI*54

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br ${cfg.bg} via-card to-muted/30 ${cfg.glow}`}
    >
      {/* Ambient decorations */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${cfg.color}30, transparent 70%)` }} />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-[0.12] pointer-events-none" />

      <div className="relative px-6 py-7 md:px-10 md:py-9 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        {/* Left — narrative */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> HYPER@LE · Exercice {exercice}
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold" style={{ borderColor: `${cfg.color}40`, color: cfg.color }}>
              <Activity className="h-3 w-3 mr-1" /> {cfg.label}
            </Badge>
            {alertesCount > 0 && (
              <Badge variant="outline" className="text-[10px] font-semibold border-warning/40 text-warning">
                <AlertCircle className="h-3 w-3 mr-1" /> {alertesCount} alerte{alertesCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground leading-tight">
            Analyse augmentée de <span className="font-serif-accent text-primary">{etabName}</span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {hasData ? resumeStoryteller : "Aucune donnée importée. Commencez par charger une balance Op@le pour activer l'analyse intelligente sur 5 ans."}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" onClick={() => navigate("/hyperale/analyse")} className="gradient-primary border-0 shadow-primary gap-1.5 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" /> Analyse complète
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/hyperale/assistant")} className="gap-1.5 border-border/60">
              <Sparkles className="h-3.5 w-3.5" /> Demander à l'IA
            </Button>
            {!hasData && (
              <Button size="sm" variant="ghost" onClick={() => navigate("/hyperale/import")} className="text-primary hover:bg-primary/10">
                Importer des données →
              </Button>
            )}
          </div>
        </div>

        {/* Right — Health Score Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="relative shrink-0 mx-auto md:mx-0"
        >
          <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              stroke={cfg.color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray="339.292"
              initial={{ strokeDashoffset: 339.292 }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-3xl font-display font-bold tabular-nums"
              style={{ color: cfg.color }}
            >
              {scoreSante}
            </motion.span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Score / 100</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
