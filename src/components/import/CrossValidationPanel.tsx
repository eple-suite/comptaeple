// ═══════════════════════════════════════════════════════════════
// Tableau de cohérence inter-fichiers
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CrossCheckResult } from '@/lib/import';

interface CrossValidationPanelProps {
  results: CrossCheckResult[];
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export function CrossValidationPanel({ results }: CrossValidationPanelProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground text-center">
          Importez au moins 2 fichiers compatibles (balance + SDE/SDR/tiers/bourses) pour activer la validation croisée.
        </CardContent>
      </Card>
    );
  }

  const ok = results.filter((r) => r.ok).length;
  const ko = results.length - ok;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Validation croisée inter-fichiers</span>
          <span className="flex gap-2">
            <Badge className="bg-emerald-600 text-white text-xs">{ok} ✓</Badge>
            {ko > 0 && <Badge className="bg-warning text-warning-foreground text-xs">{ko} ⚠</Badge>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.map((r) => (
          <div
            key={r.id}
            className={`p-3 rounded-md border text-xs ${r.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-warning/40 bg-warning/5'}`}
          >
            <div className="flex items-start gap-2">
              {r.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.label}</p>
                <p className="text-muted-foreground mt-0.5">
                  Attendu : {fmtEur(r.expected)} • Constaté : {fmtEur(r.actual)} •
                  Écart : <span className={r.ok ? '' : 'font-semibold text-warning'}>{fmtEur(r.ecart)}</span>
                </p>
                {!r.ok && r.hint && (
                  <p className="text-muted-foreground mt-1 italic">{r.hint}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}