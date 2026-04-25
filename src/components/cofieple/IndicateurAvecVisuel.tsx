// ═══════════════════════════════════════════════════════════════════
// COFI — Composant unifié IndicateurAvecVisuel (chantier 4)
// Mise en page imposée :
//   ┌────────────────────────────────────────────────────┐
//   │ [N°] [Titre]                                        │
//   │ ┌───────────────────────┬────────────────────────┐ │
//   │ │ CHIFFRES CLÉS         │ VISUEL                 │ │
//   │ │ Valeur N              │ [graphique adapté]     │ │
//   │ │ Valeur N-1            │                        │ │
//   │ │ Variation € / %       │                        │ │
//   │ │ Benchmark / seuil     │                        │ │
//   │ │ Statut couleur        │                        │ │
//   │ └───────────────────────┴────────────────────────┘ │
//   │ COMMENTAIRE AUTOMATIQUE (éditable)                  │
//   │ COMMENTAIRE MANUEL (saisie ordo / AC)              │
//   └────────────────────────────────────────────────────┘
//
// Chiffres + visuel sur la MÊME page (page-break-inside: avoid en print).
// Strict design system : tokens HSL semantic, pas de couleurs en dur.
// ═══════════════════════════════════════════════════════════════════
import { ReactNode, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextareaElastique } from '@/components/rapport/TextareaElastique';
import { SaveIndicator } from '@/components/SaveIndicator';
import { usePersistedText } from '@/hooks/usePersistedState';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export type IndicateurStatut = 'excellent' | 'normal' | 'fragile' | 'critique' | 'neutre';
export type IndicateurUnite = 'eur' | 'pct' | 'num' | 'jours' | 'ratio';
export type IndicateurChartType = 'bars' | 'lines' | 'donut' | 'stacked' | 'sparkline';

export interface ChiffreCle {
  label: string;
  valeur: number | string | null;
  unite?: IndicateurUnite;
  highlight?: boolean;
}

export interface ChartPoint {
  name: string;
  [serie: string]: string | number | null;
}

export interface ChartSerie {
  key: string;
  label: string;
  color?: string;
}

export interface IndicateurAvecVisuelProps {
  /** Numéro hiérarchique (ex : "A.3", "AC.5"). */
  numero: string;
  /** Titre court de l'indicateur. */
  titre: string;
  /** Référence réglementaire (M9-6, REPROFI…). */
  reference?: string;
  /** Définition courte affichée sous le titre. */
  definition?: string;
  /** Chiffres clés à afficher en colonne gauche. */
  chiffres: ChiffreCle[];
  /** Variation explicite (€ ou %). */
  variation?: { valeur: number; unite: 'eur' | 'pct' } | null;
  /** Benchmark / seuil pour mise en perspective. */
  benchmark?: { label: string; valeur: number | string; unite?: IndicateurUnite } | null;
  /** Statut couleur (calculé en amont selon les seuils M9-6). */
  statut?: IndicateurStatut;
  /** Données du visuel (recharts-compatible). */
  chartData?: ChartPoint[];
  chartSeries?: ChartSerie[];
  chartType?: IndicateurChartType;
  /** Titre court du visuel (légende). */
  chartTitle?: string;
  /** Commentaire auto pré-rempli (généré par les seuils). */
  commentaireAuto?: string;
  /** Identifiant unique pour persister le commentaire manuel. */
  storageKey: string;
  /** Slot libre pour visuels custom (organigrammes SVG, sankey…). */
  customVisual?: ReactNode;
  /** Empty state si données absentes. */
  emptyMessage?: string;
}

const STATUT_COLOR: Record<IndicateurStatut, string> = {
  excellent: 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30',
  normal:    'bg-primary/10 text-primary border-primary/30',
  fragile:   'bg-warning/15 text-warning border-warning/40',
  critique:  'bg-destructive/15 text-destructive border-destructive/40',
  neutre:    'bg-muted text-muted-foreground border-border',
};

const STATUT_LABEL: Record<IndicateurStatut, string> = {
  excellent: '🟢 Excellent',
  normal:    '🔵 Normal',
  fragile:   '🟠 Vigilance',
  critique:  '🔴 Critique',
  neutre:    '⚪ N/D',
};

const DEFAULT_COLORS = [
  'hsl(215,70%,50%)', 'hsl(160,45%,45%)', 'hsl(38,92%,50%)',
  'hsl(0,72%,55%)',   'hsl(280,50%,50%)', 'hsl(190,60%,40%)',
];

function formatValue(v: number | string | null | undefined, unite?: IndicateurUnite): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (!isFinite(v)) return '—';
  switch (unite) {
    case 'eur':
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    case 'pct':
      return `${v.toFixed(1)} %`;
    case 'jours':
      return `${v.toFixed(0)} j`;
    case 'ratio':
      return v.toFixed(2);
    case 'num':
    default:
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v);
  }
}

function formatVariation(v: { valeur: number; unite: 'eur' | 'pct' } | null | undefined): string {
  if (!v || !isFinite(v.valeur)) return '—';
  const sign = v.valeur > 0 ? '+' : '';
  return v.unite === 'pct'
    ? `${sign}${v.valeur.toFixed(1)} %`
    : `${sign}${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.valeur)}`;
}

export function IndicateurAvecVisuel(props: IndicateurAvecVisuelProps) {
  const {
    numero, titre, reference, definition,
    chiffres, variation, benchmark, statut = 'neutre',
    chartData = [], chartSeries = [], chartType = 'bars', chartTitle,
    commentaireAuto, storageKey, customVisual, emptyMessage,
  } = props;

  const [commentaire, setCommentaire, status, lastSaved] =
    usePersistedText(`${storageKey}_manuel`, '');
  const [autoEdited, setAutoEdited, autoStatus, autoLastSaved] =
    usePersistedText(`${storageKey}_auto`, commentaireAuto ?? '');

  const hasChart = useMemo(
    () => Boolean(customVisual) || (chartData.length > 0 && chartSeries.length > 0),
    [customVisual, chartData, chartSeries],
  );

  const variationColor = useMemo(() => {
    if (!variation || !isFinite(variation.valeur)) return 'text-muted-foreground';
    if (variation.valeur > 0) return 'text-emerald-600';
    if (variation.valeur < 0) return 'text-destructive';
    return 'text-muted-foreground';
  }, [variation]);

  return (
    <Card
      className="cofi-indicateur"
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      <CardContent className="p-5 md:p-6 space-y-4">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-[11px]">{numero}</Badge>
              {reference && (
                <Badge variant="secondary" className="text-[10px]">{reference}</Badge>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUT_COLOR[statut]}`}>
                {STATUT_LABEL[statut]}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">{titre}</h3>
            {definition && (
              <p className="text-xs text-muted-foreground leading-relaxed">{definition}</p>
            )}
          </div>
        </div>

        {/* Grille chiffres / visuel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne CHIFFRES CLÉS */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Chiffres clés
            </div>
            <div className="divide-y divide-border">
              {chiffres.length === 0 && (
                <div className="text-xs text-muted-foreground italic py-2">Aucune donnée disponible.</div>
              )}
              {chiffres.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-baseline justify-between py-1.5 ${c.highlight ? 'font-bold' : ''}`}
                >
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <span className="text-sm tabular-nums text-foreground">
                    {formatValue(c.valeur, c.unite)}
                  </span>
                </div>
              ))}
              {variation && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Variation</span>
                  <span className={`text-sm font-semibold tabular-nums ${variationColor}`}>
                    {formatVariation(variation)}
                  </span>
                </div>
              )}
              {benchmark && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{benchmark.label}</span>
                  <span className="text-sm tabular-nums text-foreground italic">
                    {formatValue(benchmark.valeur, benchmark.unite)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne VISUEL */}
          <div className="rounded-lg border border-border bg-card p-3 min-h-[220px] flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {chartTitle ?? 'Visuel'}
            </div>
            {!hasChart && (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic">
                {emptyMessage ?? 'Visuel non disponible (données insuffisantes).'}
              </div>
            )}
            {customVisual && <div className="flex-1">{customVisual}</div>}
            {!customVisual && chartData.length > 0 && chartSeries.length > 0 && (
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'lines' || chartType === 'sparkline' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      {chartType !== 'sparkline' && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                      {chartSeries.map((s, i) => (
                        <Line key={s.key} dataKey={s.key} name={s.label}
                          stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                          strokeWidth={2} dot={chartType !== 'sparkline'} />
                      ))}
                    </LineChart>
                  ) : chartType === 'donut' ? (
                    <PieChart>
                      <Pie data={chartData} dataKey={chartSeries[0].key} nameKey="name"
                        innerRadius={45} outerRadius={75} label={(e) => String(e.name)}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {chartSeries.map((s, i) => (
                        <Bar key={s.key} dataKey={s.key} name={s.label}
                          fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                          stackId={chartType === 'stacked' ? 'a' : undefined} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Commentaire automatique */}
        {commentaireAuto !== undefined && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Commentaire automatique (éditable)
              </span>
              {autoStatus && <SaveIndicator status={autoStatus} lastSaved={autoLastSaved ?? null} />}
            </div>
            <TextareaElastique
              value={autoEdited}
              onChange={setAutoEdited}
              minRows={2}
              placeholder={commentaireAuto}
            />
          </div>
        )}

        {/* Commentaire manuel */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              ✎ Commentaire manuel (ordonnateur / agent comptable)
            </span>
            {status && <SaveIndicator status={status} lastSaved={lastSaved ?? null} />}
          </div>
          <TextareaElastique
            value={commentaire}
            onChange={setCommentaire}
            placeholder="Saisissez votre analyse libre sur cet indicateur…"
            minRows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}