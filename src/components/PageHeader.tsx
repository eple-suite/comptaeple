import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEstablishment } from "@/contexts/EstablishmentContext";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  showEstablishment?: boolean;
  badge?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" };
  children?: React.ReactNode; // right-side actions
}

export function PageHeader({ icon: Icon, title, description, showEstablishment = true, badge, children }: PageHeaderProps) {
  const { selectedEstablishment } = useEstablishment();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start justify-between gap-4"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-display tracking-tight">{title}</h1>
              {badge && <Badge variant={badge.variant || "outline"} className="text-[10px]">{badge.label}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
              {showEstablishment && selectedEstablishment && (
                <span className="ml-1.5">
                  — <strong className="text-foreground/80">{selectedEstablishment.name}</strong>
                  <Badge variant="outline" className="ml-1.5 text-[9px] align-middle">{selectedEstablishment.uai}</Badge>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </motion.div>
  );
}
