// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Jauge circulaire + Barre zonée
// ═══════════════════════════════════════════════════════════════

import { SEUIL_CRITIQUE_JOURS, SEUIL_ATTENTION_JOURS, SEUIL_CONFORT_JOURS } from './types';

export function CircularGauge({ value, max = 120 }: { value: number; max?: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClass =
    value >= SEUIL_CONFORT_JOURS ? 'text-success' :
    value >= SEUIL_ATTENTION_JOURS ? 'text-primary' :
    value >= SEUIL_CRITIQUE_JOURS ? 'text-warning' : 'text-destructive';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2} className="transform -rotate-90">
        <circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/40" />
        <circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(value)}</span>
        <span className="text-xs text-muted-foreground">jours</span>
      </div>
    </div>
  );
}

export function ProgressBarZoned({ value }: { value: number }) {
  const getColor = () => {
    if (value >= SEUIL_CONFORT_JOURS) return 'bg-success';
    if (value >= SEUIL_ATTENTION_JOURS) return 'bg-primary';
    if (value >= SEUIL_CRITIQUE_JOURS) return 'bg-warning';
    return 'bg-destructive';
  };
  const percentage = Math.min((value / 120) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="relative h-3.5 bg-muted rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-destructive/20" style={{ width: `${(30/120)*100}%` }} />
        <div className="absolute inset-y-0 bg-warning/20" style={{ left: `${(30/120)*100}%`, width: `${(30/120)*100}%` }} />
        <div className="absolute inset-y-0 bg-primary/20" style={{ left: `${(60/120)*100}%`, width: `${(30/120)*100}%` }} />
        <div className="absolute inset-y-0 bg-success/20" style={{ left: `${(90/120)*100}%`, right: 0 }} />
        <div className={`absolute inset-y-0 left-0 ${getColor()} rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${(30/120)*100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-destructive font-medium">30j</span>
        <span className="text-warning font-medium">60j</span>
        <span className="text-primary font-medium">90j</span>
        <span>120+</span>
      </div>
    </div>
  );
}
