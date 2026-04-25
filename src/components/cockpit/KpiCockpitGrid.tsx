import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { KpiCockpitValeur, NiveauAlerte } from "@/lib/cockpit/types";

const NIVEAU_CLASSES: Record<NiveauAlerte | 'success', string> = {
  rouge: 'border-destructive/40 bg-destructive/5 text-destructive',
  orange: 'border-warning/40 bg-warning/5 text-warning',
  jaune: 'border-yellow-400/40 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-500',
  info: 'border-primary/30 bg-primary/5 text-primary',
  success: 'border-success/40 bg-success/5 text-success',
};

function NiveauDot({ niveau }: { niveau: NiveauAlerte | 'success' }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${
    niveau === 'rouge' ? 'bg-destructive' :
    niveau === 'orange' ? 'bg-warning' :
    niveau === 'jaune' ? 'bg-yellow-400' :
    niveau === 'success' ? 'bg-success' :
    'bg-primary'
  }`} />;
}

export function KpiCockpitGrid({ kpis }: { kpis: KpiCockpitValeur[] }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="cockpit-kpi-grid">
      {kpis.map((k, i) => (
        <motion.div
          key={k.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
        >
          <Card
            className={`rounded-xl border ${NIVEAU_CLASSES[k.niveau]} hover-lift cursor-${k.actionUrl ? 'pointer' : 'default'}`}
            onClick={() => k.actionUrl && navigate(k.actionUrl)}
            data-kpi={k.id}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <NiveauDot niveau={k.niveau} />
                    <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/70 leading-tight">{k.label}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1.5 text-foreground">{k.valeur}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{k.sublabel}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground" type="button" aria-label="Détails KPI">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p className="font-semibold mb-1">{k.label}</p>
                      <p className="text-muted-foreground">{k.formule}</p>
                      <p className="text-muted-foreground italic mt-1">Source : {k.source}</p>
                    </TooltipContent>
                  </Tooltip>
                  {k.actionUrl && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
              {k.tendance && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  {k.tendance === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                  {k.tendance === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                  {k.tendance === 'flat' && <Minus className="h-3 w-3" />}
                  <span>vs N-1 {k.variationPct !== undefined ? `(${k.variationPct > 0 ? '+' : ''}${k.variationPct.toFixed(1)} %)` : ''}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
