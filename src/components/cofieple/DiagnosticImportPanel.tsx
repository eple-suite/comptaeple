// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Panneau « 🔍 Diagnostic d'import » SDE / SDR
// Toujours accessible (prod + dev), repliable, lecture seule.
// Affiche : fichier, onglets évalués + scores + onglet retenu,
// ligne d'en-tête, mapping colonnes, nb lignes parsées, 3 premières
// lignes, comptes ignorés (avec raison).
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SheetPickDiagnostic } from './ImportSection';

export interface DiagnosticImportEntry {
  slotKey: string;
  slotLabel: string;
  fileName: string;
  rowsCount: number;
  diag?: SheetPickDiagnostic;
  /** Mapping colonneIndex → cleCanonique (pour SDE/SDR). */
  mapping?: Record<string, number>;
  /** 3 premières lignes parsées (ou échantillon). */
  sample?: Array<Record<string, unknown>>;
  /** Comptes ignorés et raison. */
  ignored?: Array<{ compte: string; raison: string }>;
}

interface Props {
  entries: DiagnosticImportEntry[];
}

export function DiagnosticImportPanel({ entries }: Props) {
  const [open, setOpen] = useState(false);
  if (!entries.length) return null;
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <CardTitle className="text-sm flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Search className="h-4 w-4" />
          🔍 Diagnostic d'import ({entries.length} fichier{entries.length > 1 ? 's' : ''})
          <Badge variant="outline" className="ml-2 text-[10px]">repliable</Badge>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 pt-2">
          {entries.map((e) => (
            <div key={e.slotKey} className="border rounded-md p-3 bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground">{e.slotLabel}</Badge>
                <span className="font-mono truncate">{e.fileName}</span>
                <Badge variant="outline">{e.rowsCount} lignes parsées</Badge>
                {e.diag && (
                  <Badge variant="outline">
                    Onglet retenu : « {e.diag.sheetName} »
                    {e.diag.score != null && ` · score ${e.diag.score}`}
                  </Badge>
                )}
              </div>

              {e.diag && e.diag.candidates.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Onglets évalués :</div>
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border px-2 py-0.5 text-left">Onglet</th>
                        <th className="border px-2 py-0.5 text-left">Score</th>
                        <th className="border px-2 py-0.5 text-left">Raison / motif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.diag.candidates.map((c) => (
                        <tr key={c.sheetName} className={c.sheetName === e.diag!.sheetName ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : ''}>
                          <td className="border px-2 py-0.5 font-mono">{c.sheetName}</td>
                          <td className="border px-2 py-0.5">{c.score ?? '—'}</td>
                          <td className="border px-2 py-0.5">{c.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {e.mapping && Object.keys(e.mapping).length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Mapping colonnes (clé canonique → index Excel) :</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(e.mapping).map(([k, v]) => (
                      <Badge key={k} variant={v >= 0 ? 'outline' : 'destructive'} className="text-[10px] font-mono">
                        {k}: {v >= 0 ? `col ${v}` : '∅ absent'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {e.sample && e.sample.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">3 premières lignes parsées :</div>
                  <div className="overflow-x-auto">
                    <table className="text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          {Object.keys(e.sample[0]).slice(0, 12).map((k) => (
                            <th key={k} className="border px-1.5 py-0.5 text-left font-mono">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {e.sample.slice(0, 3).map((row, i) => (
                          <tr key={i}>
                            {Object.keys(e.sample![0]).slice(0, 12).map((k) => (
                              <td key={k} className="border px-1.5 py-0.5 font-mono max-w-[140px] truncate">
                                {typeof row[k] === 'number'
                                  ? (row[k] as number).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                                  : String(row[k] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {e.ignored && e.ignored.length > 0 && (
                <details className="text-[11px]">
                  <summary className="cursor-pointer font-semibold">
                    {e.ignored.length} ligne(s) ignorée(s)
                  </summary>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 max-h-40 overflow-auto">
                    {e.ignored.slice(0, 50).map((it, i) => (
                      <li key={i}><span className="font-mono">{it.compte || '∅'}</span> — {it.raison}</li>
                    ))}
                    {e.ignored.length > 50 && <li>… ({e.ignored.length - 50} de plus)</li>}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}