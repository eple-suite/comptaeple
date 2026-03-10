// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Composants UI partagés (KPICard, EmptyState)
// Design system : shadcn/ui + Tailwind semantic tokens
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({ msg }: { msg: string }) {
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm text-warning-foreground">{msg}</p>
      </CardContent>
    </Card>
  );
}

export function KPICard({
  label, value, color, icon, sub, isText = false,
}: {
  label: string;
  value: string | number;
  color: 'green' | 'red' | 'amber' | 'blue' | 'purple';
  icon?: string;
  sub?: string;
  isText?: boolean;
}) {
  const borderColors: Record<string, string> = {
    green: 'border-l-emerald-500',
    red: 'border-l-destructive',
    amber: 'border-l-warning',
    blue: 'border-l-primary',
    purple: 'border-l-purple-500',
  };
  const textColors: Record<string, string> = {
    green: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-destructive',
    amber: 'text-warning',
    blue: 'text-primary',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <Card className={`border-l-4 ${borderColors[color]}`}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </div>
        <div className={`text-xl font-black font-mono ${textColors[color]}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function FinancialBlock({
  title, color, children,
}: {
  title: string; color: string; children: React.ReactNode;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-primary/5 border-primary/20',
    amber: 'bg-warning/5 border-warning/20',
    emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800',
  };
  const titleColors: Record<string, string> = {
    blue: 'text-primary border-primary/20',
    amber: 'text-warning border-warning/20',
    emerald: 'text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div className={`rounded-xl border p-4 ${bgColors[color] || bgColors.blue}`}>
      <h3 className={`font-bold text-sm mb-3 pb-2 border-b ${titleColors[color] || titleColors.blue}`}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function FinancialRow({ label, value, highlight = false, formatFn }: {
  label: string; value: number; highlight?: boolean; formatFn?: (n: number) => string;
}) {
  const fmt = formatFn || ((n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n));
  return (
    <div className={`flex items-center justify-between text-xs ${highlight ? 'font-bold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ml-2 ${value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'} ${highlight ? 'text-sm' : ''}`}>
        {fmt(value)}
      </span>
    </div>
  );
}
