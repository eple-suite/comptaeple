import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  to: string;
  delay?: number;
  tone?: "primary" | "secondary" | "accent";
}

const toneMap = {
  primary: "text-primary bg-primary/10 group-hover:bg-primary/15",
  secondary: "text-secondary bg-secondary/10 group-hover:bg-secondary/15",
  accent: "text-foreground bg-muted group-hover:bg-muted/80",
};

export function QuickAction({ label, description, icon: Icon, to, delay = 0, tone = "primary" }: QuickActionProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() => navigate(to)}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-card-hover",
        "transition-all duration-200 text-left w-full focus-ring"
      )}
    >
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors", toneMap[tone])}>
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}
