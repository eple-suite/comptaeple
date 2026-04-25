// ═══════════════════════════════════════════════════════════════════
// COFI — Vue consolidée GROUPEMENT (chantier 8)
// Agrégation inter-EPLE pour l'agent comptable de groupement.
//
// Fonctionnalités :
//   • Tableau récapitulatif EPLE × indicateurs clés (FR, TN, jours,
//     créances, anomalies)
//   • Heatmap des indicateurs critiques (vert/orange/rouge)
//   • Top 5 EPLE en risque (score composite)
//   • Comparaison/benchmarking interne
//   • Bouton export PDF consolidé groupement (chantier 9)
//
// Source de données : table `cofieple_snapshots` (snapshot_data.resultats)
// pour chaque (uai, exercice, budget_type='principal') de l'utilisateur.
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import {
  Layers, Loader2, Download, AlertTriangle, TrendingDown, TrendingUp, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ──────────────────────────────────────────────────────────
interface EpleRow {
  uai: string;
  nom: string;
  exercice: number;
  fdr: number | null;
  bfr: number | null;
  treso: number | null;
  joursFdr: number | null;
  joursTreso: number | null;
  creances: number | null;
  reserves: number | null;
  resultat: number | null;
  anomaliesBloq: number;
  anomaliesAlerte: number;
  scoreRisque: number; // 0 (aucun risque) → 100 (risque max)
}

const fmtEur = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number | null | undefined, suffix = '') =>
  n == null || !isFinite(n) ? '—'
    : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)}${suffix}`;

/** Score composite de risque (0-100) — plus élevé = plus risqué. */
function calculerScoreRisque(r: EpleRow): number {
  let score = 0;
  if (r.joursFdr != null && r.joursFdr < 30) score += 25;
  else if (r.joursFdr != null && r.joursFdr < 60) score += 12;
  if (r.joursTreso != null && r.joursTreso < 15) score += 20;
  else if (r.joursTreso != null && r.joursTreso < 30) score += 10;
  if (r.fdr != null && r.fdr < 0) score += 20;
  if (r.treso != null && r.treso < 0) score += 15;
  score += Math.min(r.anomaliesBloq * 8, 20);
  return Math.min(score, 100);
}

function classerRisque(score: number): 'critique' | 'fragile' | 'normal' | 'sain' {
  if (score >= 60) return 'critique';
  if (score >= 35) return 'fragile';
  if (score >= 15) return 'normal';
  return 'sain';
}

function colorClass(level: ReturnType<typeof classerRisque>) {
  return {
    critique: 'bg-destructive/15 text-destructive border-destructive/40',
    fragile:  'bg-warning/15 text-warning border-warning/40',
    normal:   'bg-primary/10 text-primary border-primary/30',
    sain:     'bg-emerald-600/15 text-emerald-700 border-emerald-600/30',
  }[level];
}

function heatColor(value: number | null, thresholds: { critique: number; fragile: number; normal: number }, reverse = false) {
  if (value == null || !isFinite(value)) return 'bg-muted/40 text-muted-foreground';
  const v = reverse ? -value : value;
  const t = reverse
    ? { critique: -thresholds.critique, fragile: -thresholds.fragile, normal: -thresholds.normal }
    : thresholds;
  if (v <= t.critique) return 'bg-destructive/20 text-destructive font-bold';
  if (v <= t.fragile)  return 'bg-warning/20 text-warning font-semibold';
  if (v <= t.normal)   return 'bg-primary/10 text-primary';
  return 'bg-emerald-600/15 text-emerald-700';
}

// ── Composant ──────────────────────────────────────────────────────

export function VueGroupement() {
  const { user } = useAuth();
  const { establishments } = useEstablishment();
  const [rows, setRows] = useState<EpleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercice, setExercice] = useState<number>(new Date().getFullYear() - 1);

  useEffect(() => {
    if (!user?.id || establishments.length === 0) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cofieple_snapshots')
          .select('uai, exercice, snapshot_data')
          .eq('user_id', user.id)
          .eq('budget_type', 'principal')
          .eq('exercice', exercice);
        if (error) throw error;

        const collected: EpleRow[] = [];
        for (const snap of data || []) {
          const sd: any = snap.snapshot_data || {};
          const r = sd.resultats?.principal || sd.resultats || {};
          const etab = establishments.find(e => e.uai === snap.uai);
          const checkItems: any[] = sd.checkItems || [];
          const anomaliesBloq = checkItems.filter(c => c.bloquant).length;
          const anomaliesAlerte = checkItems.filter(c => c.statut !== 'ok' && !c.bloquant).length;

          const partial: EpleRow = {
            uai: snap.uai,
            nom: etab?.name ?? snap.uai,
            exercice: snap.exercice,
            fdr: r.fdrComptable ?? r.fr ?? null,
            bfr: r.bfr ?? null,
            treso: r.tresorerie ?? r.tn ?? null,
            joursFdr: r.joursFdr ?? null,
            joursTreso: r.joursTresorerie ?? null,
            creances: r.totalCreances ?? null,
            reserves: r.reserves ?? null,
            resultat: r.resultatComptable ?? r.resultatBudgetaire ?? null,
            anomaliesBloq, anomaliesAlerte,
            scoreRisque: 0,
          };
          partial.scoreRisque = calculerScoreRisque(partial);
          collected.push(partial);
        }
        collected.sort((a, b) => b.scoreRisque - a.scoreRisque);
        if (!cancelled) setRows(collected);
      } catch (e: any) {
        console.warn('[VueGroupement] load failed', e?.message);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, establishments, exercice]);

  const top5Risque = useMemo(() => rows.slice(0, 5), [rows]);

  const stats = useMemo(() => {
    const valid = rows.filter(r => r.fdr != null);
    const totalFdr = valid.reduce((s, r) => s + (r.fdr || 0), 0);
    const totalTreso = rows.reduce((s, r) => s + (r.treso || 0), 0);
    const moyJoursFdr = valid.length > 0
      ? valid.reduce((s, r) => s + (r.joursFdr || 0), 0) / valid.length : 0;
    const critiques = rows.filter(r => classerRisque(r.scoreRisque) === 'critique').length;
    return { totalFdr, totalTreso, moyJoursFdr, critiques, total: rows.length };
  }, [rows]);

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`VUE CONSOLIDÉE GROUPEMENT — Exercice ${exercice}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`${rows.length} EPLE — ${stats.critiques} en risque critique`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [['UAI', 'Établissement', 'FDR', 'Trésorerie', 'Jours FDR', 'Jours Tréso', 'Créances', 'Anom. bloq.', 'Score risque']],
      body: rows.map(r => [
        r.uai, r.nom, fmtEur(r.fdr), fmtEur(r.treso),
        fmtNum(r.joursFdr, ' j'), fmtNum(r.joursTreso, ' j'),
        fmtEur(r.creances), String(r.anomaliesBloq),
        `${r.scoreRisque}/100 (${classerRisque(r.scoreRisque)})`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 35, 149] },
    });
    doc.save(`groupement_${exercice}.pdf`);
    toast.success('PDF groupement généré');
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Chargement des données groupement…</p>
      </CardContent></Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center space-y-2">
        <Layers className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm font-semibold">Aucun snapshot pour l'exercice {exercice}</p>
        <p className="text-xs text-muted-foreground">
          Importez les données comptables des EPLE du groupement pour activer la vue consolidée.
        </p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête + actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Vue consolidée — Groupement comptable
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {rows.length} EPLE · Exercice {exercice}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={exercice}
                onChange={e => setExercice(parseInt(e.target.value, 10))}
                className="text-xs border border-border rounded-md px-2 py-1.5 bg-background"
              >
                {[0, 1, 2, 3].map(o => {
                  const y = new Date().getFullYear() - 1 - o;
                  return <option key={y} value={y}>Exercice {y}</option>;
                })}
              </select>
              <Button size="sm" onClick={exportPdf}>
                <Download className="h-4 w-4 mr-1.5" />
                PDF consolidé
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">FDR cumulé</div>
            <div className="text-lg font-bold tabular-nums">{fmtEur(stats.totalFdr)}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trésorerie cumulée</div>
            <div className="text-lg font-bold tabular-nums">{fmtEur(stats.totalTreso)}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Jours FDR moyen</div>
            <div className="text-lg font-bold tabular-nums">{fmtNum(stats.moyJoursFdr, ' j')}</div>
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-destructive">EPLE en risque</div>
            <div className="text-lg font-bold tabular-nums text-destructive">
              {stats.critiques} / {stats.total}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 risque */}
      {top5Risque.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Top 5 EPLE — risque le plus élevé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top5Risque.map((r, i) => {
              const cls = classerRisque(r.scoreRisque);
              return (
                <div
                  key={r.uai}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${colorClass(cls)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs">#{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{r.nom}</div>
                      <div className="text-[10px] opacity-75">UAI {r.uai}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>FDR {fmtEur(r.fdr)}</span>
                    <span>·</span>
                    <span>Tréso {fmtEur(r.treso)}</span>
                    <span>·</span>
                    <Badge variant="outline" className="text-[10px]">
                      Score {r.scoreRisque}/100
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Heatmap tableau récap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Heatmap des indicateurs critiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Établissement</th>
                  <th className="text-right px-3 py-2 font-semibold">FDR</th>
                  <th className="text-right px-3 py-2 font-semibold">Trésorerie</th>
                  <th className="text-right px-3 py-2 font-semibold">Jours FDR</th>
                  <th className="text-right px-3 py-2 font-semibold">Jours Tréso</th>
                  <th className="text-right px-3 py-2 font-semibold">Créances</th>
                  <th className="text-right px-3 py-2 font-semibold">Résultat</th>
                  <th className="text-center px-3 py-2 font-semibold">Anom.</th>
                  <th className="text-center px-3 py-2 font-semibold">Risque</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const cls = classerRisque(r.scoreRisque);
                  const trend = r.resultat == null ? <Minus className="h-3 w-3 inline" />
                    : r.resultat > 0 ? <TrendingUp className="h-3 w-3 inline text-emerald-600" />
                    : <TrendingDown className="h-3 w-3 inline text-destructive" />;
                  return (
                    <tr key={r.uai} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                      <td className="px-3 py-2 font-medium">
                        <div className="truncate max-w-[200px]" title={r.nom}>{r.nom}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.uai}</div>
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${heatColor(r.fdr, { critique: 0, fragile: 50000, normal: 200000 })}`}>
                        {fmtEur(r.fdr)}
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${heatColor(r.treso, { critique: 0, fragile: 30000, normal: 100000 })}`}>
                        {fmtEur(r.treso)}
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${heatColor(r.joursFdr, { critique: 30, fragile: 60, normal: 90 })}`}>
                        {fmtNum(r.joursFdr, ' j')}
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${heatColor(r.joursTreso, { critique: 15, fragile: 30, normal: 60 })}`}>
                        {fmtNum(r.joursTreso, ' j')}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{fmtEur(r.creances)}</td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        {trend} {fmtEur(r.resultat)}
                      </td>
                      <td className="text-center px-3 py-2">
                        {r.anomaliesBloq > 0 && (
                          <Badge variant="destructive" className="text-[10px] mr-1">
                            {r.anomaliesBloq}🔴
                          </Badge>
                        )}
                        {r.anomaliesAlerte > 0 && (
                          <Badge variant="outline" className="text-[10px] border-warning text-warning">
                            {r.anomaliesAlerte}🟠
                          </Badge>
                        )}
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass(cls)}`}>
                          {r.scoreRisque}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}