// ═══════════════════════════════════════════════════════════════════
// OrdoFicheIndicateur — composant générique REPROFI
// Affiche : titre, définition, tableau N-2/N-1/N, graphique, commentaire,
// boutons d'export individuel (PDF/Excel via impression navigateur).
// ⚠️ Aucun indicateur bilanciel ici — strict M9-6 sphère ordonnateur.
// ═══════════════════════════════════════════════════════════════════
import { ReactNode, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import { TextareaElastique } from '@/components/rapport/TextareaElastique';
import { SaveIndicator } from '@/components/SaveIndicator';
import { SectionEditorial } from '@/components/cofieple/premium/SectionEditorial';
import { NarrationIA } from '@/components/cofieple/premium/NarrationIA';
import { usePersistedText } from '@/hooks/usePersistedState';
import { useOrdoData } from '../useOrdoData';
import type { OrdoFicheDef } from './catalog';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

// Format français — euros sans décimales (masses budgétaires)
const fmtEur = (n: number | null | undefined) => {
  if (n == null || !isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
};
const fmtNum = (n: number | null | undefined, digits = 0) => {
  if (n == null || !isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
};
const fmtPct = (n: number | null | undefined) => {
  if (n == null || !isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)} %`;
};

export interface FicheRow {
  label: string;
  unite?: 'eur' | 'num' | 'pct';
  n_2?: number | null;
  n_1?: number | null;
  n?: number | null;
  highlight?: boolean;
}

export interface FicheChartPoint {
  name: string;
  [serie: string]: string | number;
}

export interface OrdoFicheIndicateurProps {
  fiche: OrdoFicheDef;
  rows?: FicheRow[];
  chartData?: FicheChartPoint[];
  chartSeries?: { key: string; label: string; color?: string }[];
  /** Affiche un message si données absentes */
  hasData?: boolean;
  emptyMessage?: string;
  /** Slot enfant libre : encarts, alertes, contenus complémentaires */
  children?: ReactNode;
}

const ACCENT_BY_SECTION: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  A: 'primary', B: 'secondary', C: 'warning', D: 'success',
};

const DEFAULT_COLORS = [
  'hsl(215,70%,50%)',
  'hsl(160,45%,45%)',
  'hsl(38,92%,50%)',
  'hsl(0,72%,55%)',
  'hsl(280,50%,50%)',
  'hsl(190,60%,40%)',
];

function variation(prev?: number | null, curr?: number | null) {
  if (prev == null || curr == null || prev === 0 || !isFinite(prev) || !isFinite(curr)) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function fmtCell(value: number | null | undefined, unite: FicheRow['unite']) {
  if (unite === 'pct') return fmtPct(value);
  if (unite === 'num') return fmtNum(value);
  return fmtEur(value);
}

export function OrdoFicheIndicateur({
  fiche, rows = [], chartData = [], chartSeries = [],
  hasData = true, emptyMessage, children,
}: OrdoFicheIndicateurProps) {
  const { etab, R, ind, pKey } = useOrdoData();
  const accent = ACCENT_BY_SECTION[fiche.section] ?? 'primary';
  const [commentaire, setCommentaire, status, lastSaved] =
    usePersistedText(`${pKey}_reprofi_${fiche.id}`, '');

  const showN2 = rows.some(r => r.n_2 != null);

  const variations = useMemo(
    () => rows.map(r => variation(r.n_1, r.n)),
    [rows]
  );

  const handlePrint = () => window.print();
  const handleExportCsv = () => {
    const headers = ['Indicateur', 'N-2', 'N-1', 'N', 'Variation (%)'];
    const lines = rows.map((r, i) => [
      `"${r.label.replace(/"/g, '""')}"`,
      r.n_2 ?? '', r.n_1 ?? '', r.n ?? '',
      variations[i] != null ? variations[i]!.toFixed(2) : '',
    ].join(';'));
    const csv = [headers.join(';'), ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordo_${fiche.id}_${etab.uai || 'na'}_${etab.exercice}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionEditorial
          kicker={`Section ${fiche.section} · ${fiche.numero} · Ordonnateur`}
          title={fiche.fullTitle}
          lede={fiche.definition}
          meta={fiche.meta}
          accent={accent}
        />

        {/* Actions export — masquées à l'impression */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <Badge variant="outline" className="text-[10px]">
            {fiche.meta}
          </Badge>
          {fiche.service && (
            <Badge variant="secondary" className="text-[10px]">
              Service {fiche.service}{fiche.flux ? ` · ${fiche.flux}` : ''}
            </Badge>
          )}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={rows.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel/CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        {!hasData && (
          <div className="bg-muted/30 border border-border rounded-lg p-4 text-xs text-muted-foreground">
            {emptyMessage ?? "Données indisponibles. Importez les fichiers Op@le ou renseignez les indicateurs extra-comptables pour activer cette fiche."}
          </div>
        )}

        {/* Tableau N-2 / N-1 / N */}
        {hasData && rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Indicateur</th>
                  {showN2 && <th className="text-right px-3 py-2 font-semibold">N-2 ({etab.exercice - 2})</th>}
                  <th className="text-right px-3 py-2 font-semibold">N-1 ({etab.exercice - 1})</th>
                  <th className="text-right px-3 py-2 font-semibold">N ({etab.exercice})</th>
                  <th className="text-right px-3 py-2 font-semibold">Variation N-1→N</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const v = variations[i];
                  const vColor = v == null ? 'text-muted-foreground'
                    : v > 0 ? 'text-emerald-600' : v < 0 ? 'text-destructive' : 'text-muted-foreground';
                  return (
                    <tr key={i} className={`border-t border-border ${r.highlight ? 'bg-warning/10 font-bold' : ''}`}>
                      <td className="px-3 py-2">{r.label}</td>
                      {showN2 && <td className="text-right px-3 py-2 tabular-nums">{fmtCell(r.n_2, r.unite)}</td>}
                      <td className="text-right px-3 py-2 tabular-nums">{fmtCell(r.n_1, r.unite)}</td>
                      <td className="text-right px-3 py-2 tabular-nums font-semibold">{fmtCell(r.n, r.unite)}</td>
                      <td className={`text-right px-3 py-2 tabular-nums ${vColor}`}>{fmtPct(v)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Graphique */}
        {hasData && chartData.length > 0 && chartSeries.length > 0 && (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {fiche.chartHint === 'lines' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip formatter={(v: number) => fmtEur(v)} />
                  <Legend />
                  {chartSeries.map((s, i) => (
                    <Line key={s.key} dataKey={s.key} name={s.label}
                      stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} strokeWidth={2} />
                  ))}
                </LineChart>
              ) : fiche.chartHint === 'donut' ? (
                <PieChart>
                  <Pie data={chartData} dataKey={chartSeries[0].key} nameKey="name"
                    innerRadius={50} outerRadius={90} label={(e) => `${e.name}`}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtEur(v)} />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip formatter={(v: number) => fmtEur(v)} />
                  <Legend />
                  {chartSeries.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.label}
                      fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                      stackId={fiche.chartHint === 'stacked' ? 'a' : undefined} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {children}

        {/* Narration IA contextualisée */}
        <NarrationIA
          sectionId={`ordo_reprofi_${fiche.id}_${etab.uai || 'na'}_${etab.exercice}`}
          title={`Lecture experte — ${fiche.title}`}
          variant="compact"
          context={{
            section: fiche.numero,
            fiche: { id: fiche.id, title: fiche.fullTitle, definition: fiche.definition, meta: fiche.meta, service: fiche.service, flux: fiche.flux },
            etablissement: { nom: etab.nom, uai: etab.uai, exercice: etab.exercice, type: etab.type },
            indicateurs: ind ?? null,
            tableau: rows,
          }}
        />

        {/* Commentaire libre ordonnateur */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              ✎ Commentaire de l'ordonnateur
            </span>
            {status && status !== 'idle' && (
              <SaveIndicator status={status as 'saving' | 'saved'} lastSaved={lastSaved ?? null} />
            )}
          </div>
          <TextareaElastique
            value={commentaire}
            onChange={setCommentaire}
            placeholder="Saisissez votre analyse de gestion sur cet indicateur…"
            minRows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}