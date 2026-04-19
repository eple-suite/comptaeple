import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "./Sparkline";

interface KpiPremiumCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  niveau: "excellent" | "satisfaisant" | "surveiller" | "critique";
  variation?: number; // -1..1
  variationLabel?: string;
  sparklineData?: number[];
  delay?: number;
  onClick?: () => void;
}

const NIVEAU = {
  excellent: { color: "hsl(158 42% 42%)", bg: "bg-emerald-500/8", border: "border-emerald-500/30", glow: "hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)]", chip: "Excellent" },
  satisfaisant: { color: "hsl(220 65% 48%)", bg: "bg-primary/5", border: "border-primary/25", glow: "hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.3)]", chip: "Satisfaisant" },
  surveiller: { color: "hsl(38 92% 50%)", bg: "bg-amber-500/8", border: "border-amber-500/30", glow: "hover:shadow-[0_8px_30px_-12px_rgba(245,158,11,0.3)]", chip: "À surveiller" },
  critique: { color: "hsl(0 84% 60%)", bg: "bg-destructive/8", border: "border-destructive/30", glow: "hover:shadow-[0_8px_30px_-12px_rgba(239,68,68,0.3)]", chip: "Critique" },
};

export function KpiPremiumCard({ label, value, sublabel, icon: Icon, niveau, variation, variationLabel, sparklineData, delay = 0, onClick }: KpiPremiumCardProps) {
  const cfg = NIVEAU[niveau];
  const TrendIcon = variation == null ? Minus : variation > 0.001 ? ArrowUpRight : variation < -0.001 ? ArrowDownRight : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      whileHover={{ y: -2 }}
      onClick={onClick}
    >
      <Card className={`relative overflow-hidden border ${cfg.border} ${cfg.bg} ${cfg.glow} transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${cfg.color}15`, color: cfg.color }}>
              {cfg.chip}
            </span>
          </div>

          <div>
            <p className="text-2xl font-display font-bold tabular-nums leading-tight text-foreground">{value}</p>
            {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
          </div>

          {(variation != null || sparklineData) && (
            <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/40">
              {variation != null && (
                <div className="flex items-center gap-1">
                  <TrendIcon className="h-3 w-3" style={{ color: cfg.color }} />
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: cfg.color }}>
                    {variation >= 0 ? "+" : ""}{(variation * 100).toFixed(1)}%
                  </span>
                  {variationLabel && <span className="text-[10px] text-muted-foreground">{variationLabel}</span>}
                </div>
              )}
              {sparklineData && sparklineData.length > 1 && (
                <Sparkline data={sparklineData} color={cfg.color} width={60} height={20} />
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
