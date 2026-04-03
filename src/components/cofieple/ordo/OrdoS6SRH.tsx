import { usePersistedText, usePersistedState } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Input } from '@/components/ui/input';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ReferenceLine, LineChart, Line, Legend,
} from 'recharts';
import type { LigneSDE, LigneSDR } from '@/lib/cofieple_types';

// ── SRH extraction from raw SDE/SDR using standard CGR roots ──────
interface SRHData {
  detected: boolean;
  totalDepenses: number;
  budgetDepenses: number;
  disponible: number;
  totalRecettes: number;
  budgetRecettes: number;
  resultatSRH: number;
  tauxExecDepenses: number;
  tauxRealRecettes: number;
  detailDepenses: LigneSDE[];
  detailRecettes: LigneSDR[];
}

function extractSRH(sde: LigneSDE[], sdr: LigneSDR[]): SRHData | null {
  // Step 1: Find SRH root line by serviceCode or service label
  const srhDep = sde.find(l =>
    l.serviceCode === 'SRH' ||
    l.service?.trim() === 'SRH - RESTAU ET HEBERG'
  );
  const srhRec = sdr.find(l =>
    l.serviceCode === 'SRH' ||
    l.service?.trim() === 'SRH - RESTAU ET HEBERG'
  );

  if (!srhDep && !srhRec) return null;

  const totalDepenses = srhDep?.realise ?? 0;
  const budgetDepenses = srhDep?.budget ?? 0;
  const disponible = srhDep?.disponible ?? 0;
  const totalRecettes = srhRec?.realise ?? 0;
  const budgetRecettes = srhRec?.budget ?? 0;

  // Step 2: Get child lines (domain level, not account-level detail)
  const enfantsDep = sde.filter(l => {
    const svc = l.service?.trim() ?? '';
    return svc.startsWith('SRH') && svc !== 'SRH - RESTAU ET HEBERG'
      && l.aggregationLevel === 'detail';
  });
  const enfantsRec = sdr.filter(l => {
    const svc = l.service?.trim() ?? '';
    return svc.startsWith('SRH') && svc !== 'SRH - RESTAU ET HEBERG'
      && l.aggregationLevel === 'detail';
  });

  const resultatSRH = totalRecettes - totalDepenses;
  return {
    detected: true,
    totalDepenses, budgetDepenses, disponible,
    totalRecettes, budgetRecettes, resultatSRH,
    tauxExecDepenses: budgetDepenses > 0 ? (totalDepenses / budgetDepenses) * 100 : 0,
    tauxRealRecettes: budgetRecettes > 0 ? (totalRecettes / budgetRecettes) * 100 : 0,
    detailDepenses: enfantsDep,
    detailRecettes: enfantsRec,
  };
}

// ── Historical SRH data interface ─────────────────────────────────
interface HistoriqueSRHExercice {
  annee: number;
  totalRecettes: number;
  totalDepenses: number;
  repasServis: number;
}

const pct = (v: number) => `${v.toFixed(1)} %`;
const fmt = formatEur;

export function OrdoS6SRH() {
  const { etab, R, safe, pKey, ind } = useOrdoData();
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeData = useCofiepleStore(s => s.sde[activeBudget] ?? []);
  const sdrData = useCofiepleStore(s => s.sdr[activeBudget] ?? []);
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_srh`, '');

  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const histKey = `srh_historique_quinquennal_${etab.uai}`;
  const defaultHist: HistoriqueSRHExercice[] = Array.from({ length: 4 }, (_, i) => ({
    annee: exercice - 4 + i,
    totalRecettes: 0, totalDepenses: 0, repasServis: 0,
  }));
  const [historique, setHistorique] = usePersistedState<HistoriqueSRHExercice[]>(histKey, defaultHist);

  // Extract SRH from raw SDE/SDR using generic CGR detection
  const srh = extractSRH(sdeData, sdrData);
  const hasSRHData = srh?.detected || (ind && ind.nb_repas_servis > 0);

  if (!hasSRHData) return (
    <Card><CardContent className="p-6">
      <SectionTitre numero="S6" title="Service de restauration et hébergement (SRH)" />
      <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        ℹ️ Aucune donnée SRH détectée. Si l'établissement dispose d'un SRH, renseignez les indicateurs dans l'onglet <strong>Indicateurs</strong>.
      </div>
    </CardContent></Card>
  );

  const totalDep = srh?.totalDepenses ?? 0;
  const totalRec = srh?.totalRecettes ?? 0;
  const resultat = srh?.resultatSRH ?? 0;

  // Build current year entry for quinquennial chart
  const currentYear: HistoriqueSRHExercice = {
    annee: exercice,
    totalRecettes: totalRec,
    totalDepenses: totalDep,
    repasServis: ind?.nb_repas_servis ?? 0,
  };
  const quinquennalData = [...historique.slice(0, 4), currentYear];

  // Charts
  const execChart = [
    { name: 'Dépenses', value: totalDep, fill: 'hsl(38,92%,50%)' },
    { name: 'Recettes', value: totalRec, fill: 'hsl(160,45%,45%)' },
    { name: 'Résultat', value: resultat, fill: resultat >= 0 ? 'hsl(160,45%,45%)' : 'hsl(0,72%,55%)' },
  ];

  const updateHist = (idx: number, field: keyof HistoriqueSRHExercice, val: string) => {
    const updated = [...historique];
    (updated[idx] as any)[field] = parseFloat(val) || 0;
    setHistorique(updated);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S6" title="Service de restauration et hébergement (SRH)" />

        {/* KPI from CGR root totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Résultat SRH" value={fmt(resultat)} color={resultat >= 0 ? 'green' : 'red'} icon={resultat >= 0 ? '✅' : '⚠️'} />
          <KPICard label="Recettes SRH" value={fmt(totalRec)} color="blue" icon="📈"
            subtitle={srh ? `Réalisation : ${pct(srh.tauxRealRecettes)}` : undefined} />
          <KPICard label="Dépenses SRH" value={fmt(totalDep)} color="amber" icon="📉"
            subtitle={srh && srh.disponible < 0 ? `⚠️ Dépassement : ${fmt(Math.abs(srh.disponible))}` : srh ? `Disponible : ${fmt(srh.disponible)}` : undefined} />
          <KPICard label="Taux exécution" value={srh ? pct(srh.tauxExecDepenses) : '—'} color={srh && srh.tauxExecDepenses > 100 ? 'red' : srh && srh.tauxExecDepenses >= 90 ? 'amber' : 'green'} icon="📊" />
        </div>

        {/* Extra KPIs from manual indicators */}
        {ind && ind.nb_repas_servis > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Repas servis / an" value={ind.nb_repas_servis.toLocaleString('fr-FR')} color="blue" icon="🍽️" />
            {ind.taux_occupation_internat != null && (
              <KPICard label="Taux occupation" value={pct(ind.taux_occupation_internat)} color={ind.taux_occupation_internat >= 80 ? 'green' : 'amber'} icon="🏠" />
            )}
            {ind.cout_denrees_repas != null && ind.cout_denrees_repas > 0 && (
              <KPICard label="Coût moyen / repas" value={`${ind.cout_denrees_repas.toFixed(2)} €`} color="amber" icon="🥘" />
            )}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Execution SRH bar chart */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">📊 Exécution SRH</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={execChart} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar isAnimationActive={false} dataKey="value" radius={[3, 3, 0, 0]}>
                  {execChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quinquennial evolution */}
          {quinquennalData.some(d => d.totalRecettes > 0 || d.totalDepenses > 0) && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">📈 Évolution quinquennale</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={quinquennalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [fmt(v), '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Line isAnimationActive={false} type="monotone" dataKey="totalRecettes" name="Recettes" stroke="hsl(160,45%,45%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line isAnimationActive={false} type="monotone" dataKey="totalDepenses" name="Dépenses" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Detail table — dynamic from child CGR lines */}
        {srh && (srh.detailDepenses.length > 0 || srh.detailRecettes.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {srh.detailDepenses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Détail dépenses SRH</p>
                <div className="border rounded text-xs">
                  <table className="w-full">
                    <thead><tr className="bg-muted/30">
                      <th className="text-left p-1.5">Domaine</th>
                      <th className="text-right p-1.5">Budget</th>
                      <th className="text-right p-1.5">Réalisé</th>
                      <th className="text-right p-1.5">Taux</th>
                    </tr></thead>
                    <tbody>
                      {srh.detailDepenses.map((l, i) => {
                        const libelle = (l.domaine || l.service || '').replace(/^SRH\s+/i, '').replace(/\s*-\s*_$/, '').trim() || `Ligne ${i + 1}`;
                        const taux = l.budget > 0 ? (l.realise / l.budget) * 100 : null;
                        return (
                          <tr key={i} className="border-t border-border/50">
                            <td className="p-1.5">{libelle}</td>
                            <td className="text-right p-1.5">{fmt(l.budget)}</td>
                            <td className="text-right p-1.5">{fmt(l.realise)}</td>
                            <td className="text-right p-1.5">{taux !== null ? pct(taux) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {srh.detailRecettes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Détail recettes SRH</p>
                <div className="border rounded text-xs">
                  <table className="w-full">
                    <thead><tr className="bg-muted/30">
                      <th className="text-left p-1.5">Domaine</th>
                      <th className="text-right p-1.5">Budget</th>
                      <th className="text-right p-1.5">Réalisé</th>
                      <th className="text-right p-1.5">Taux</th>
                    </tr></thead>
                    <tbody>
                      {srh.detailRecettes.map((l, i) => {
                        const libelle = (l.domaine || l.service || '').replace(/^SRH\s+/i, '').replace(/\s*-\s*_$/, '').trim() || `Ligne ${i + 1}`;
                        const taux = l.budget > 0 ? (l.realise / l.budget) * 100 : null;
                        return (
                          <tr key={i} className="border-t border-border/50">
                            <td className="p-1.5">{libelle}</td>
                            <td className="text-right p-1.5">{fmt(l.budget)}</td>
                            <td className="text-right p-1.5">{fmt(l.realise)}</td>
                            <td className="text-right p-1.5">{taux !== null ? pct(taux) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historical 5-year input form */}
        <details className="group">
          <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            📝 Historique SRH — Saisie quinquennale (N-4 à N-1)
          </summary>
          <div className="mt-3 border rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30">
                <th className="p-2 text-left">Exercice</th>
                <th className="p-2 text-right">Recettes (€)</th>
                <th className="p-2 text-right">Dépenses (€)</th>
                <th className="p-2 text-right">Résultat (€)</th>
                <th className="p-2 text-right">Repas servis</th>
                <th className="p-2 text-right">Coût moy./repas</th>
              </tr></thead>
              <tbody>
                {historique.map((h, i) => {
                  const res = h.totalRecettes - h.totalDepenses;
                  const coutMoyen = h.repasServis > 0 ? h.totalDepenses / h.repasServis : 0;
                  return (
                    <tr key={h.annee} className="border-t border-border/50">
                      <td className="p-2 font-medium">{h.annee}</td>
                      <td className="p-2">
                        <Input type="number" className="h-7 text-xs text-right w-28" value={h.totalRecettes || ''} placeholder="0"
                          onChange={e => updateHist(i, 'totalRecettes', e.target.value)} />
                      </td>
                      <td className="p-2">
                        <Input type="number" className="h-7 text-xs text-right w-28" value={h.totalDepenses || ''} placeholder="0"
                          onChange={e => updateHist(i, 'totalDepenses', e.target.value)} />
                      </td>
                      <td className={`p-2 text-right font-medium ${res >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.totalRecettes > 0 || h.totalDepenses > 0 ? fmt(res) : '—'}
                      </td>
                      <td className="p-2">
                        <Input type="number" className="h-7 text-xs text-right w-24" value={h.repasServis || ''} placeholder="0"
                          onChange={e => updateHist(i, 'repasServis', e.target.value)} />
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {coutMoyen > 0 ? `${coutMoyen.toFixed(2)} €` : '—'}
                      </td>
                    </tr>
                  );
                })}
                {/* Current year row — auto-filled from SDE/SDR */}
                <tr className="border-t-2 border-primary/30 bg-primary/5">
                  <td className="p-2 font-bold">{exercice} (N)</td>
                  <td className="p-2 text-right font-medium">{fmt(totalRec)}</td>
                  <td className="p-2 text-right font-medium">{fmt(totalDep)}</td>
                  <td className={`p-2 text-right font-bold ${resultat >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(resultat)}</td>
                  <td className="p-2 text-right">{ind?.nb_repas_servis ? ind.nb_repas_servis.toLocaleString('fr-FR') : '—'}</td>
                  <td className="p-2 text-right text-muted-foreground">
                    {ind?.nb_repas_servis && ind.nb_repas_servis > 0 ? `${(totalDep / ind.nb_repas_servis).toFixed(2)} €` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>

        <div className="text-xs text-muted-foreground bg-muted/10 rounded p-3">
          💡 <strong>Pour le CA :</strong> Le SRH doit être équilibré. Un excédent est affecté aux réserves SRH (c/106870). Un déficit chronique nécessite une révision des tarifs.
        </div>

        <CommentaireBox label="Analyse du service restauration" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
