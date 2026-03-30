// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Zone de debug d'import (dev uniquement)
// Affiche les 3 premières lignes parsées de chaque fichier importé
// ═══════════════════════════════════════════════════════════════

import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function DebugTable({ label, data }: { label: string; data: any[] }) {
  if (!data || data.length === 0) return (
    <div className="text-xs text-muted-foreground">
      <strong>{label}</strong> : aucune donnée
    </div>
  );

  const sample = data.slice(0, 3);
  const keys = Object.keys(sample[0] || {}).filter(k => !['aggregationLevel', 'serviceCode', 'rawLabel', 'isSummary', 'budgetScope', 'codeAnnexe'].includes(k));
  const totalBudget = data.reduce((s: number, r: any) => s + (r.budget || 0), 0);
  const totalRealise = data.reduce((s: number, r: any) => s + (r.realise || 0), 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <strong className="text-xs">{label}</strong>
        <Badge variant="outline" className="text-[10px]">{data.length} lignes</Badge>
        {totalBudget > 0 && <Badge className="bg-primary/10 text-primary text-[10px]">Budget: {totalBudget.toFixed(0)} €</Badge>}
        {totalRealise > 0 && <Badge className="bg-emerald-600/10 text-emerald-600 text-[10px]">Réalisé: {totalRealise.toFixed(0)} €</Badge>}
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] border-collapse w-full">
          <thead>
            <tr>
              {keys.slice(0, 8).map(k => (
                <th key={k} className="border border-border px-1 py-0.5 bg-muted text-left font-mono">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((row, i) => (
              <tr key={i}>
                {keys.slice(0, 8).map(k => (
                  <td key={k} className="border border-border px-1 py-0.5 font-mono max-w-[120px] truncate">
                    {typeof row[k] === 'number' ? row[k].toFixed(2) : String(row[k] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ImportDebug() {
  // Only show in development
  if (import.meta.env.PROD) return null;

  const sde = useCofiepleStore(s => s.sde.principal);
  const sdr = useCofiepleStore(s => s.sdr.principal);
  const bal = useCofiepleStore(s => s.balance.principal);
  const sde1 = useCofiepleStore(s => s.sde1.principal);
  const sdr1 = useCofiepleStore(s => s.sdr1.principal);
  const bal1 = useCofiepleStore(s => s.balance1.principal);

  const hasAny = [sde, sdr, bal, sde1, sdr1, bal1].some(d => d && d.length > 0);
  if (!hasAny) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-2">
          🔍 Debug Import — Données parsées (3 premières lignes)
          <Badge variant="outline" className="text-[10px]">DEV</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <DebugTable label="SDE N" data={sde} />
        <DebugTable label="SDR N" data={sdr} />
        <DebugTable label="Balance N" data={bal} />
        <DebugTable label="SDE N-1" data={sde1} />
        <DebugTable label="SDR N-1" data={sdr1} />
        <DebugTable label="Balance N-1" data={bal1} />
      </CardContent>
    </Card>
  );
}
