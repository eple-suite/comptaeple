import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-card border border-border",
  primary: "bg-card border border-primary/20",
  success: "bg-card border border-success/20",
  warning: "bg-card border border-warning/20",
  destructive: "bg-card border border-destructive/20",
};

const accentBar = {
  default: "bg-muted-foreground/30",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const iconBg = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function KpiCard({ title, value, subtitle, trend, icon: Icon, variant = "default" }: KpiCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? "text-success" : trend && trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group",
        variantStyles[variant]
      )}
    >
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px]", accentBar[variant])} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold font-display tracking-tight truncate">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground leading-snug">{subtitle}</p>}
        </div>
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ml-3 transition-transform duration-300 group-hover:scale-110",
          iconBg[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1.5 mt-3 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend > 0 ? "+" : ""}{trend}% vs N-1</span>
        </div>
      )}
    </motion.div>
  );
}
