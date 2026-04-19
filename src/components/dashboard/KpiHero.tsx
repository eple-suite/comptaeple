import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiHeroProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  trend?: { value: number; direction: "up" | "down" | "flat"; label?: string };
  tone?: "primary" | "success" | "warning" | "destructive" | "neutral";
  delay?: number;
  onClick?: () => void;
}

const toneClasses = {
  primary: {
    accent: "from-primary/20 to-primary/5",
    icon: "text-primary bg-primary/10",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--primary)/0.4)]",
  },
  success: {
    accent: "from-success/20 to-success/5",
    icon: "text-success bg-success/10",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--success)/0.4)]",
  },
  warning: {
    accent: "from-warning/20 to-warning/5",
    icon: "text-warning bg-warning/10",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--warning)/0.4)]",
  },
  destructive: {
    accent: "from-destructive/20 to-destructive/5",
    icon: "text-destructive bg-destructive/10",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--destructive)/0.4)]",
  },
  neutral: {
    accent: "from-muted/40 to-muted/10",
    icon: "text-foreground bg-muted",
    glow: "",
  },
};

export function KpiHero({ label, value, sublabel, icon: Icon, trend, tone = "primary", delay = 0, onClick }: KpiHeroProps) {
  const t = toneClasses[tone];
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const trendColor = trend?.direction === "up" ? "text-success" : trend?.direction === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.19, 1, 0.22, 1] }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left p-5 hover-lift focus-ring",
        "transition-all duration-300 w-full"
      )}
    >
      {/* Gradient accent — top */}
      <div className={cn("absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-60 pointer-events-none", t.accent)} />

      <div className="relative flex items-start justify-between mb-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", t.icon, t.glow)}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="tabular-nums">{trend.value > 0 ? "+" : ""}{trend.value.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
        <p className="text-3xl font-display font-bold text-foreground tabular-nums leading-none mb-1">
          {value}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground mt-2">{sublabel}</p>}
        {trend?.label && <p className="text-[10px] text-muted-foreground mt-1">{trend.label}</p>}
      </div>

      {/* Hover indicator */}
      {onClick && (
        <ArrowUpRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
      )}
    </motion.button>
  );
}
