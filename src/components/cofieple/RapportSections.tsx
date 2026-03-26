// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Rapport Ordonnateur + Rapport Agent Comptable
// Modèle REPROFI 25 pages — M9-6 2026, Décret 2012-1246
// Version enrichie : saisie complémentaire AC, graphiques variés,
// PDF officiel, pas de visa comptable supérieur
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Printer, Loader2, Plus, Trash2, Download, MessageSquare, Scale, PieChart as PieChartIcon, BarChart3, ArrowRight } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import { generateRapportACPdf } from '@/lib/pdfRapportAC';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
  PieChart, Pie,
} from 'recharts';

interface Indicators {
  effectif_eleves: number; effectif_dp: number; effectif_internes: number;
  effectif_externes: number; effectif_boursiers: number; effectif_personnel: number;
  montant_fonds_social: number; nb_repas_servis: number; nb_repas_commensaux: number;
  cout_denrees_repas: number; etp_ressources_propres: number; surface_batiments: number;
}

function useExtraIndicators() {
  const etab = useCofiepleStore(s => s.etablissement);
  const [ind, setInd] = useState<Indicators | null>(null);
  useEffect(() => {
    if (!etab.uai) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_extra_indicators')
          .select('effectif_eleves,effectif_dp,effectif_internes,effectif_externes,effectif_boursiers,effectif_personnel,montant_fonds_social,nb_repas_servis,nb_repas_commensaux,cout_denrees_repas,etp_ressources_propres,surface_batiments')
          .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', session.session.user.id)
          .maybeSingle();
        if (data) setInd(data as Indicators);
      } catch {}
    })();
  }, [etab.uai, etab.exercice]);
  return ind;
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'ORDONNATEUR — M9-6 § V.1
// Enrichi : D1-D9, N/N-1, écarts significatifs, opérations d'ordre
// ═══════════════════════════════════════════════════════════════
export function RapportOrdoSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const ind = useExtraIndicators();
  const [aiText1, setAiText1] = useState('');
  const [aiText3, setAiText3] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'ordonnateur (M9-6 § V.1)." />;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';
  const tauxBoursiers = ind && ind.effectif_eleves > 0 ? ((ind.effectif_boursiers / ind.effectif_eleves) * 100).toFixed(1) : null;
  const hasN1 = (R.totalChargesSdeN1 ?? 0) > 0;
  const oo = R.operationsOrdre ?? { dotationsAmort: 0, reprisesAmort: 0, vncCessions: 0, produitsCessions: 0, neutralisationSubInv: 0, totalChargesOO: 0, totalProduitsOO: 0, soldeOO: 0 };
  const domaines = R.domaines ?? {};
  const domainesList = Object.values(domaines).filter(d => d.chargesReel > 0 || d.produitsReel > 0).sort((a, b) => a.code.localeCompare(b.code));

  async function genererIA() {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'ordonnateur', etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, fdrComptable: R.fdrComptable,
            tresorerieNette: R.tresorerie, cafBudgetaire: R.cafBudgetaire,
            totalChargesReel: R.totalChargesSde, totalProduitsReel: R.totalProduitsSdr,
            joursAutonomie: R.joursAutonomie, reserves: R.reserves,
            tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
            domaines, operationsOrdre: oo,
          },
          indicateurs: ind,
        },
      });
      if (error) throw error;
      const text = data?.text || '';
      const parts = text.split('---');
      setAiText1((parts[0] || '').trim());
      setAiText3((parts[1] || '').trim());
    } catch (e) { console.error(e); }
    setAiLoading(false);
  }

  const domChartData = domainesList.map(d => ({
    name: `D${d.code}`,
    Dépenses: d.chargesReel,
    Recettes: d.produitsReel,
    Solde: d.solde,
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Button onClick={genererIA} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Génération IA…' : 'Générer le texte IA'}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimer / PDF
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto print:shadow-none">
        <CardContent className="p-8">
          <div className="flex justify-between items-start border-b-2 border-foreground pb-4 mb-5">
            <div>
              <h1 className="text-xl font-black tracking-tight">RAPPORT DE L'ORDONNATEUR</h1>
              <p className="text-muted-foreground text-xs mt-0.5">Exercice {etab.exercice} · M9-6 2026 · Op@le</p>
              <p className="text-muted-foreground text-xs">Code de l'Éducation Art. R421-68 — Décret 2012-1246</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <strong className="text-sm block">{etab.nom}</strong>
              <span className="text-primary font-semibold">RNE : {etab.uai}</span><br />
              {etab.adresse}<br />{etab.codePostal} {etab.commune}
            </div>
          </div>

          <div className="bg-slate-800 text-white text-center py-3 rounded-lg mb-5 text-sm font-bold tracking-widest uppercase">
            PRÉSENTATION DU COMPTE FINANCIER — EXERCICE {etab.exercice}
          </div>
          <p className="text-center text-xs text-muted-foreground mb-5">
            Présenté par l'ordonnateur : <strong>{etab.ordonnateur || '—'}</strong> · Arrêté au : {dateArrete}
          </p>

          <SectionTitre numero="1" title="Présentation de l'établissement" />
          {ind && ind.effectif_eleves > 0 && (
            <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <IndicatorBadge icon="🎓" label="Élèves" value={`${ind.effectif_eleves}`} />
              <IndicatorBadge icon="🍽️" label="DP" value={`${ind.effectif_dp}`} />
              <IndicatorBadge icon="🛏️" label="Internes" value={`${ind.effectif_internes}`} />
              <IndicatorBadge icon="📚" label="Boursiers" value={`${ind.effectif_boursiers} (${tauxBoursiers} %)`} />
              {ind.nb_repas_servis > 0 && <IndicatorBadge icon="🍴" label="Repas/an" value={`${ind.nb_repas_servis.toLocaleString('fr-FR')}`} />}
              {ind.effectif_personnel > 0 && <IndicatorBadge icon="👥" label="Personnel" value={`${ind.effectif_personnel} ETP`} />}
              {ind.etp_ressources_propres > 0 && <IndicatorBadge icon="💼" label="ETP ress. propres" value={`${ind.etp_ressources_propres}`} />}
              {ind.surface_batiments > 0 && <IndicatorBadge icon="🏢" label="Surface" value={`${ind.surface_batiments.toLocaleString('fr-FR')} m²`} />}
            </div>
          )}
          <Textarea value={aiText1} onChange={e => setAiText1(e.target.value)}
            placeholder="Cliquez sur 'Générer le texte IA' ou saisissez votre texte ici…" rows={4}
            className="mb-4 bg-muted/30 text-sm" />

          <SectionTitre numero="2" title={`Exécution budgétaire de l'exercice ${etab.exercice}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Crédits ouverts" value={formatEur(R.totalChargesPrev)} color="blue" icon="💸" sub="Budget voté + DBM" isText />
            <KPICard label="Dépenses réalisées" value={formatEur(R.totalChargesSde)} color="amber" icon="✅" sub={`Taux : ${(R.tauxExecCharges * 100).toFixed(1)} %`} isText />
            <KPICard label="Prévisions recettes" value={formatEur(R.totalProduitsPrev)} color="blue" icon="💰" sub="Budget voté + DBM" isText />
            <KPICard label="Recettes réalisées" value={formatEur(R.totalProduitsSdr)} color={R.totalProduitsSdr >= R.totalProduitsPrev ? 'green' : 'red'} icon="✅" sub={`Taux : ${(R.tauxExecProduits * 100).toFixed(1)} %`} isText />
          </div>

          {hasN1 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border">
                <thead><tr className="bg-slate-700 text-white">
                  <th className="p-2 text-left">Agrégat</th>
                  <th className="p-2 text-right">N ({etab.exercice})</th>
                  <th className="p-2 text-right">N-1 ({etab.exercice - 1})</th>
                  <th className="p-2 text-right">Variation</th>
                  <th className="p-2 text-right">%</th>
                </tr></thead>
                <tbody>
                  {[
                    { label: 'Dépenses réalisées', vN: R.totalChargesSde, vN1: R.totalChargesSdeN1 },
                    { label: 'Recettes réalisées', vN: R.totalProduitsSdr, vN1: R.totalProduitsSdrN1 },
                    { label: 'Résultat budgétaire', vN: R.resultatBudgetaire, vN1: R.resultatBudgetaireN1 },
                  ].map(row => {
                    const v = row.vN - (row.vN1 ?? 0);
                    const pct = (row.vN1 ?? 0) > 0 ? (v / (row.vN1 ?? 1)) * 100 : 0;
                    return (
                      <tr key={row.label} className="border-t">
                        <td className="p-2 font-semibold">{row.label}</td>
                        <td className="p-2 text-right font-mono">{formatEur(row.vN)}</td>
                        <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.vN1 ?? 0)}</td>
                        <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{v >= 0 ? '+' : ''}{formatEur(v)}</td>
                        <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)} %</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Résultat budg." value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="📊" sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'} isText />
            <KPICard label="CAF/IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
            <KPICard label="DGP" value={`${Math.round(R.dgpJours ?? 0)} jours`} color={(R.dgpJours ?? 0) > 30 ? 'red' : 'green'} icon="⏱️" sub="Délai global paiement" isText />
            <KPICard label="DGR" value={`${Math.round(R.dgrJours ?? 0)} jours`} color={(R.dgrJours ?? 0) > 60 ? 'red' : 'green'} icon="⏱️" sub="Délai global recouvrement" isText />
          </div>

          {domainesList.length > 0 && (
            <>
              <SectionTitre numero="3" title={`Exécution par domaine — Exercice ${etab.exercice}`} />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead><tr className="bg-slate-700 text-white">
                    <th className="p-2 text-left">Domaine</th>
                    <th className="p-2 text-right">Crédits ouverts</th>
                    <th className="p-2 text-right">Dépenses</th>
                    <th className="p-2 text-right">Taux exéc.</th>
                    <th className="p-2 text-right">Prév. recettes</th>
                    <th className="p-2 text-right">Recettes</th>
                    <th className="p-2 text-right">+/- values</th>
                    <th className="p-2 text-right">Solde</th>
                    {hasN1 && <>
                      <th className="p-2 text-right">Var. dép. %</th>
                      <th className="p-2 text-right">Var. rec. %</th>
                    </>}
                  </tr></thead>
                  <tbody>
                    {domainesList.map(d => {
                      const significant = Math.abs(d.pctVariationCharges) > 10 || Math.abs(d.pctVariationProduits) > 10;
                      return (
                        <tr key={d.code} className={`border-t ${significant ? 'bg-warning/5' : ''}`}>
                          <td className="p-2 font-semibold">{d.libelle}</td>
                          <td className="p-2 text-right font-mono">{formatEur(d.chargesPrev)}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatEur(d.chargesReel)}</td>
                          <td className="p-2 text-right">
                            <span className={`font-semibold ${d.tauxExecCharges >= 0.9 ? 'text-emerald-600' : d.tauxExecCharges >= 0.7 ? 'text-warning' : 'text-destructive'}`}>
                              {(d.tauxExecCharges * 100).toFixed(1)} %
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono">{formatEur(d.produitsPrev)}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatEur(d.produitsReel)}</td>
                          <td className={`p-2 text-right font-mono ${d.plusValues >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {d.plusValues !== 0 ? formatEur(d.plusValues) : '—'}
                          </td>
                          <td className={`p-2 text-right font-mono font-bold ${d.solde >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                            {formatEur(d.solde)}
                          </td>
                          {hasN1 && <>
                            <td className={`p-2 text-right font-mono text-xs ${d.pctVariationCharges > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                              {d.chargesReelN1 > 0 ? `${d.pctVariationCharges >= 0 ? '+' : ''}${d.pctVariationCharges.toFixed(1)} %` : '—'}
                            </td>
                            <td className={`p-2 text-right font-mono text-xs ${d.pctVariationProduits >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {d.produitsReelN1 > 0 ? `${d.pctVariationProduits >= 0 ? '+' : ''}${d.pctVariationProduits.toFixed(1)} %` : '—'}
                            </td>
                          </>}
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-800 text-white font-bold">
                      <td className="p-2">TOTAL</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalChargesPrev)}</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td>
                      <td className="p-2 text-right">{(R.tauxExecCharges * 100).toFixed(1)} %</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsPrev)}</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td>
                      <td className={`p-2 text-right font-mono ${(R.totalProduitsSdr - R.totalProduitsPrev) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatEur(R.totalProduitsSdr - R.totalProduitsPrev)}
                      </td>
                      <td className={`p-2 text-right font-mono ${R.resultatBudgetaire >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatEur(R.resultatBudgetaire)}
                      </td>
                      {hasN1 && <td colSpan={2}></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {domChartData.length > 1 && (
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={domChartData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Dépenses" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Recettes" fill="hsl(160, 45%, 45%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {hasN1 && (() => {
                const ecarts = domainesList.filter(d => Math.abs(d.pctVariationCharges) > 10 || Math.abs(d.pctVariationProduits) > 10);
                if (ecarts.length === 0) return null;
                return (
                  <>
                    <SectionTitre numero="3bis" title="Écarts significatifs N / N-1 (> 10%)" />
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 mb-4 text-xs space-y-2">
                      {ecarts.map(d => (
                        <div key={d.code}>
                          <strong>{d.libelle}</strong> :
                          {Math.abs(d.pctVariationCharges) > 10 && (
                            <span className={d.pctVariationCharges > 0 ? ' text-destructive' : ' text-emerald-600'}>
                              {' '}Dépenses {d.pctVariationCharges > 0 ? '+' : ''}{d.pctVariationCharges.toFixed(1)} % ({formatEur(d.variationCharges)})
                            </span>
                          )}
                          {Math.abs(d.pctVariationProduits) > 10 && (
                            <span className={d.pctVariationProduits >= 0 ? ' text-emerald-600' : ' text-destructive'}>
                              {' '}Recettes {d.pctVariationProduits >= 0 ? '+' : ''}{d.pctVariationProduits.toFixed(1)} % ({formatEur(d.variationProduits)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}

          <SectionTitre numero="4" title="Opérations d'ordre" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Opération</th><th className="p-2 text-right">Charges (OO)</th><th className="p-2 text-right">Produits (OO)</th></tr></thead>
              <tbody>
                <tr className="border-t"><td className="p-2">Dotations aux amortissements (68)</td><td className="p-2 text-right font-mono">{formatEur(oo.dotationsAmort)}</td><td className="p-2 text-right font-mono">—</td></tr>
                <tr className="border-t"><td className="p-2">Reprises sur amortissements et provisions (78)</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.reprisesAmort)}</td></tr>
                <tr className="border-t"><td className="p-2">VNC des éléments cédés (675)</td><td className="p-2 text-right font-mono">{formatEur(oo.vncCessions)}</td><td className="p-2 text-right font-mono">—</td></tr>
                <tr className="border-t"><td className="p-2">Produits de cessions d'éléments d'actif (775/776/777)</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.produitsCessions)}</td></tr>
                <tr className="border-t"><td className="p-2">Neutralisation subventions d'investissement (139)</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.neutralisationSubInv)}</td></tr>
                <tr className="border-t font-bold bg-muted/20">
                  <td className="p-2">TOTAL Opérations d'ordre</td>
                  <td className="p-2 text-right font-mono">{formatEur(oo.totalChargesOO)}</td>
                  <td className="p-2 text-right font-mono">{formatEur(oo.totalProduitsOO)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="p-2">Solde des opérations d'ordre</td>
                  <td className="p-2 text-right font-mono" colSpan={2}>
                    <span className={oo.soldeOO >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(oo.soldeOO)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground mb-4 bg-muted/10 rounded p-3">
            Les opérations d'ordre n'ont aucun impact sur la trésorerie. Elles correspondent aux dotations aux amortissements,
            reprises sur provisions et neutralisations de subventions d'investissement.
          </div>

          {ind && ind.nb_repas_servis > 0 && (
            <>
              <SectionTitre numero="5" title="Service de restauration et d'hébergement (SRH)" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                <IndicatorBadge icon="🍽️" label="Repas élèves" value={ind.nb_repas_servis.toLocaleString('fr-FR')} />
                {ind.nb_repas_commensaux > 0 && <IndicatorBadge icon="🍴" label="Repas commensaux" value={ind.nb_repas_commensaux.toLocaleString('fr-FR')} />}
                {ind.cout_denrees_repas > 0 && <IndicatorBadge icon="€" label="Coût denrées/repas" value={`${ind.cout_denrees_repas.toFixed(2)} €`} />}
              </div>
            </>
          )}

          <SectionTitre numero="6" title="Situation financière et patrimoniale" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub={`${Math.round(R.joursFdr ?? 0)} jours`} isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub={R.bfr < 0 ? 'DFR' : 'BFR'} isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursTresorerie ?? 0)} jours`} isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
          </div>

          {(R.fdrComptableN1 ?? 0) !== 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border">
                <thead><tr className="bg-muted/50"><th className="p-2 text-left">Indicateur</th><th className="p-2 text-right">N</th><th className="p-2 text-right">N-1</th><th className="p-2 text-right">Variation</th></tr></thead>
                <tbody>
                  {[
                    { label: 'FDR', vN: R.fdrComptable, vN1: R.fdrComptableN1 ?? 0 },
                    { label: 'BFR', vN: R.bfr, vN1: R.bfrN1 ?? 0 },
                    { label: 'Trésorerie', vN: R.tresorerie, vN1: R.tresorerieN1 ?? 0 },
                    { label: 'Réserves', vN: R.reserves, vN1: R.reservesN1Solde ?? 0 },
                  ].map(row => (
                    <tr key={row.label} className="border-t">
                      <td className="p-2 font-semibold">{row.label}</td>
                      <td className="p-2 text-right font-mono">{formatEur(row.vN)}</td>
                      <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.vN1)}</td>
                      <td className={`p-2 text-right font-mono font-bold ${(row.vN - row.vN1) >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {(row.vN - row.vN1) >= 0 ? '+' : ''}{formatEur(row.vN - row.vN1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <SectionTitre numero="7" title="Points d'attention et perspectives" />
          <Textarea value={aiText3} onChange={e => setAiText3(e.target.value)}
            placeholder="Cliquez sur 'Générer le texte IA' ou saisissez votre texte ici…" rows={4}
            className="mb-4 bg-muted/30 text-sm" />

          {ind && ind.montant_fonds_social > 0 && (
            <div className="mb-4 bg-muted/30 rounded-lg p-3 text-xs">
              <strong>Fonds social mobilisé :</strong> {formatEur(ind.montant_fonds_social)} — {ind.effectif_boursiers} boursier(s)
            </div>
          )}

          {/* Signatures — Ordonnateur + Secrétaire général */}
          <div className="flex justify-between mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground">L'ordonnateur</strong>
              <div className="mt-8">{etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-right">
              <strong className="block text-foreground">Le secrétaire général</strong>
              <div className="mt-8">……………………</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'AGENT COMPTABLE — Version enrichie
// Saisie complémentaire, graphiques, PDF officiel
// PAS de visa du comptable supérieur
// ═══════════════════════════════════════════════════════════════

interface Prelevement { objet: string; montant: number; dateCA: string; }

export function RapportACSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const ind = useExtraIndicators();
  const [aiObs, setAiObs] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // ── Saisie complémentaire ──────────────────────────────────
  const [prelevements, setPrelevements] = useState<Prelevement[]>([]);
  const [explicationsResultat, setExplicationsResultat] = useState('');
  const [commentaireFDR, setCommentaireFDR] = useState('');
  const [commentaireTresorerie, setCommentaireTresorerie] = useState('');
  const [commentaireCreances, setCommentaireCreances] = useState('');
  const [commentaireGeneral, setCommentaireGeneral] = useState('');

  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_exercises')
          .select('exercice,fdr,bfr,tresorerie,caf,reserves,jours_autonomie,resultat_budgetaire,resultat_comptable')
          .eq('uai', etab.uai).eq('user_id', session.session.user.id)
          .order('exercice', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'agent comptable (M9-6 § V.2)." />;

  const safe = {
    fdrPartEncaissee: R.fdrPartEncaissee ?? 0,
    fdrPartNonEncaissee: R.fdrPartNonEncaissee ?? 0,
    fdrPctEncaissee: R.fdrPctEncaissee ?? 0,
    fdrPctNonEncaissee: R.fdrPctNonEncaissee ?? 0,
    fdrMobilisable: R.fdrMobilisable ?? 0,
    chargesNonDecaissables: R.chargesNonDecaissables ?? 0,
    produitsNonEncaissables: R.produitsNonEncaissables ?? 0,
    cafComptable: R.cafComptable ?? 0,
    varFdrBas: R.varFdrBas ?? 0,
    joursFdr: R.joursFdr ?? 0,
    joursTresorerie: R.joursTresorerie ?? 0,
    tmcap: R.tmcap ?? 0,
    tmnr: R.tmnr ?? 0,
    totalCreances: R.totalCreances ?? 0,
    totalDettes: R.totalDettes ?? 0,
    creancesEtat: R.creancesEtat ?? 0,
    creancesCollectivite: R.creancesCollectivite ?? 0,
    creancesFamilles: R.creancesFamilles ?? 0,
    creancesAutres: R.creancesAutres ?? 0,
    dettesFournisseurs: R.dettesFournisseurs ?? 0,
    dettesEtat: R.dettesEtat ?? 0,
    dettesCollectivite: R.dettesCollectivite ?? 0,
    dettesAutres: R.dettesAutres ?? 0,
    reliquatsSubventions: R.reliquatsSubventions ?? 0,
    valeurNette: R.valeurNette ?? 0,
    variationPatrimoine: R.variationPatrimoine ?? 0,
    patrimoineOriginesFondsPropres: R.patrimoineOriginesFondsPropres ?? 0,
    patrimoineOriginesPctFP: R.patrimoineOriginesPctFP ?? 0,
    patrimoineOriginesSubventions: R.patrimoineOriginesSubventions ?? 0,
    patrimoineOriginesPctSub: R.patrimoineOriginesPctSub ?? 0,
    tresoComposition: R.tresoComposition ?? { autonomieFinanciere: 0, depotsCautions: 0, reglementsEnAttente: 0, reliquatsSubventions: 0 },
    prelevementsReserves: R.prelevementsReserves ?? { totalPrelevements: 0, prelevementsInvestissement: 0, prelevementsFonctionnement: 0, variationReserves: 0 },
    dgpJours: R.dgpJours ?? 0,
    dgrJours: R.dgrJours ?? 0,
    fdrComptableN1: R.fdrComptableN1 ?? 0,
    bfrN1: R.bfrN1 ?? 0,
    tresorerieN1: R.tresorerieN1 ?? 0,
    ratioLiquiditeGenerale: R.ratioLiquiditeGenerale ?? 0,
    ratioLiquiditeReduite: R.ratioLiquiditeReduite ?? 0,
    ratioLiquiditeImmediate: R.ratioLiquiditeImmediate ?? 0,
    ratioAutonomieFinanciere: R.ratioAutonomieFinanciere ?? 0,
    ratioSolvabilite: R.ratioSolvabilite ?? 0,
    ratioEndettement: R.ratioEndettement ?? 0,
    ratioChargesPersonnel: R.ratioChargesPersonnel ?? 0,
    ratioCouvertureCharges: R.ratioCouvertureCharges ?? 0,
  };

  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;

  // ── Derived data ──────────────────────────────────────────
  const totalPrelev = prelevements.reduce((s, p) => s + p.montant, 0);
  const resultatHorsPrelev = R.resultatComptable + totalPrelev;

  // ── Balance scale data (résultat) ─────────────────────────
  const balanceData = [
    { name: 'Dépenses', value: R.totalChargesSde, fill: 'hsl(0, 70%, 55%)' },
    { name: 'Recettes', value: R.totalProduitsSdr, fill: 'hsl(160, 45%, 45%)' },
  ];

  // ── Pie data for trésorerie composition ───────────────────
  const tresoData = useMemo(() => {
    const tc = safe.tresoComposition;
    return [
      { name: 'Autonomie financière', value: Math.abs(tc.autonomieFinanciere), fill: 'hsl(215, 70%, 50%)' },
      { name: 'Dépôts & cautions', value: tc.depotsCautions, fill: 'hsl(160, 45%, 45%)' },
      { name: 'Règlements en attente', value: tc.reglementsEnAttente, fill: 'hsl(38, 92%, 50%)' },
      { name: 'Reliquats subventions', value: tc.reliquatsSubventions, fill: 'hsl(280, 50%, 50%)' },
    ].filter(d => d.value > 0);
  }, [safe.tresoComposition]);

  // ── FDR composition bar data ──────────────────────────────
  const fdrComposData = [
    { name: 'Encaissé', value: safe.fdrPartEncaissee, fill: 'hsl(160, 45%, 45%)' },
    { name: 'Non encaissé', value: safe.fdrPartNonEncaissee, fill: 'hsl(38, 92%, 50%)' },
  ];

  // ── Evolution chart ───────────────────────────────────────
  const hasN1Financial = safe.fdrComptableN1 !== 0 || safe.bfrN1 !== 0 || safe.tresorerieN1 !== 0;
  const evolutionData = hasN1Financial ? [
    { exercice: 'N-1', FDR: safe.fdrComptableN1, BFR: safe.bfrN1, Trésorerie: safe.tresorerieN1 },
    { exercice: 'N', FDR: R.fdrComptable, BFR: R.bfr, Trésorerie: R.tresorerie },
  ] : [];

  // ── Smart analysis text ───────────────────────────────────
  const smartAnalysis = useMemo(() => {
    const parts: string[] = [];
    // Résultat analysis
    if (R.resultatComptable < 0 && totalPrelev > 0) {
      parts.push(`📊 Le déficit de ${formatEur(R.resultatComptable)} s'explique principalement par ${prelevements.length} prélèvement(s) sur fonds de roulement (${formatEur(totalPrelev)}), autorisés par le CA. Sans ces prélèvements, le résultat aurait été ${resultatHorsPrelev >= 0 ? 'excédentaire' : 'déficitaire'} de ${formatEur(Math.abs(resultatHorsPrelev))}.`);
    } else if (R.resultatComptable < 0) {
      parts.push(`📊 Le résultat déficitaire (${formatEur(R.resultatComptable)}) devra être imputé sur les réserves. Après affectation, les réserves s'élèveraient à ${formatEur(R.reserves + R.resultatComptable)}.`);
    }
    // FDR analysis
    if (safe.fdrPctEncaissee > 80) {
      parts.push(`🏦 Le FDR est très largement encaissé (${safe.fdrPctEncaissee.toFixed(0)} %), signe d'une bonne autonomie financière.`);
    } else if (safe.fdrPctEncaissee < 40) {
      parts.push(`⚠️ La part encaissée du FDR est faible (${safe.fdrPctEncaissee.toFixed(0)} %). L'autonomie financière repose en grande partie sur des créances non encore recouvrées.`);
    }
    // Trésorerie
    if (safe.joursTresorerie < 15) {
      parts.push(`🔴 La trésorerie ne couvre que ${Math.round(safe.joursTresorerie)} jours de fonctionnement. Situation tendue.`);
    } else if (safe.joursTresorerie > 90) {
      parts.push(`💚 La trésorerie couvre ${Math.round(safe.joursTresorerie)} jours — marge confortable, possibilité de prélèvement.`);
    }
    // FDR mobilisable
    const joursMobilisable = R.totalChargesSde > 0 ? Math.round(safe.fdrMobilisable / (R.totalChargesSde / 365)) : 0;
    if (joursMobilisable < 30) {
      parts.push(`⚠️ Le FDR mobilisable (${formatEur(safe.fdrMobilisable)}, ${joursMobilisable} jours) est inférieur au seuil recommandé de 30 jours.`);
    }
    return parts;
  }, [R, safe, totalPrelev, prelevements, resultatHorsPrelev]);

  const pct = (v: number, t: number) => t > 0 ? `${((v / t) * 100).toFixed(1)} %` : '—';

  async function genererIA() {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'agent_comptable', etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable, tresorerieNette: R.tresorerie,
            cafComptable: R.cafComptable, cafBudgetaire: R.cafBudgetaire,
            chargesNonDecaissables: R.chargesNonDecaissables,
            produitsNonEncaissables: R.produitsNonEncaissables,
            totalChargesReel: R.totalChargesSde, totalProduitsReel: R.totalProduitsSdr,
            reserves: R.reserves, joursAutonomie: R.joursAutonomie,
            joursFdr: R.joursFdr, joursTresorerie: R.joursTresorerie,
            bfr: R.bfr, tmcap: R.tmcap, tmnr: R.tmnr,
            fdrPctEncaissee: R.fdrPctEncaissee, fdrPctNonEncaissee: R.fdrPctNonEncaissee,
            totalCreances: R.totalCreances, totalDettes: R.totalDettes,
            reliquatsSubventions: R.reliquatsSubventions,
            valeurNette: R.valeurNette, variationPatrimoine: R.variationPatrimoine,
            patrimoineOriginesPctFP: R.patrimoineOriginesPctFP,
            fdrMobilisable: R.fdrMobilisable,
            prelevementsReserves: R.prelevementsReserves,
            dgpJours: R.dgpJours, dgrJours: R.dgrJours,
          },
          anomalies: nbAnom, bloquants: nbBloq, indicateurs: ind, historique: history,
        },
      });
      if (error) throw error;
      setAiObs(data?.text || '');
    } catch (e) { console.error(e); }
    setAiLoading(false);
  }

  function handleExportPdf() {
    try {
      generateRapportACPdf({
        etab, R: { ...R, ...safe } as any,
        saisieComplementaire: {
          prelevements,
          explicationsResultat,
          commentaireFDR,
          commentaireTresorerie,
          commentaireCreances,
          commentaireGeneral,
        },
        aiText: aiObs,
        history,
        nbAnom, nbBloq,
      });
      toast.success('Rapport PDF généré avec succès');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
    }
  }

  function addPrelevement() {
    setPrelevements([...prelevements, { objet: '', montant: 0, dateCA: '' }]);
  }
  function updatePrelevement(i: number, field: keyof Prelevement, value: string | number) {
    const updated = [...prelevements];
    (updated[i] as any)[field] = value;
    setPrelevements(updated);
  }
  function removePrelevement(i: number) {
    setPrelevements(prelevements.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={genererIA} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Génération IA…' : 'Générer les observations IA'}
        </Button>
        <Button variant="default" className="bg-[hsl(215,70%,45%)] hover:bg-[hsl(215,70%,40%)]" onClick={handleExportPdf}>
          <Download className="h-4 w-4 mr-2" /> Rapport PDF officiel
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SAISIE COMPLÉMENTAIRE — Questions à l'agent comptable  */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-warning" />
            Saisie complémentaire de l'agent comptable
            <Badge variant="outline" className="ml-auto text-[10px] border-warning/50 text-warning">Enrichit le rapport</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* Prélèvements sur FDR */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-xs font-bold">Prélèvements sur fonds de roulement autorisés par le CA</Label>
              <Button variant="ghost" size="sm" onClick={addPrelevement} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            {prelevements.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucun prélèvement déclaré — cliquez sur « Ajouter » si l'établissement a prélevé sur son fonds de roulement.</p>
            )}
            {prelevements.map((p, i) => (
              <div key={i} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Objet</Label>
                  <Input value={p.objet} onChange={e => updatePrelevement(i, 'objet', e.target.value)} placeholder="Ex: Acquisition mobilier" className="h-8 text-xs" />
                </div>
                <div className="w-32">
                  <Label className="text-[10px] text-muted-foreground">Montant (€)</Label>
                  <Input type="number" value={p.montant || ''} onChange={e => updatePrelevement(i, 'montant', parseFloat(e.target.value) || 0)} className="h-8 text-xs font-mono" />
                </div>
                <div className="w-32">
                  <Label className="text-[10px] text-muted-foreground">Date du CA</Label>
                  <Input value={p.dateCA} onChange={e => updatePrelevement(i, 'dateCA', e.target.value)} placeholder="01/03/2024" className="h-8 text-xs" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removePrelevement(i)} className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {totalPrelev > 0 && (
              <div className="bg-background rounded-lg p-3 mt-2 text-xs border">
                <p className="font-bold">Total prélevé : <span className="text-destructive">{formatEur(totalPrelev)}</span></p>
                <p className="text-muted-foreground mt-1">
                  Résultat hors prélèvements : <strong className={resultatHorsPrelev >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(resultatHorsPrelev)}</strong>
                  {resultatHorsPrelev >= 0 && ' → Le déficit est structurellement prévisible et résulte des prélèvements autorisés par le CA.'}
                </p>
              </div>
            )}
          </div>

          {/* Explications résultat */}
          <div>
            <Label className="text-xs font-bold">Explications sur le résultat de l'exercice</Label>
            <Textarea value={explicationsResultat} onChange={e => setExplicationsResultat(e.target.value)}
              placeholder="Ex: Le résultat déficitaire s'explique par les prélèvements votés en CA du 12/03/2024 pour l'acquisition de…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>

          {/* Commentaire FDR */}
          <div>
            <Label className="text-xs font-bold">Commentaire sur le fonds de roulement</Label>
            <Textarea value={commentaireFDR} onChange={e => setCommentaireFDR(e.target.value)}
              placeholder="Ex: La part non encaissée élevée s'explique par une créance de l'État en attente de notification…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>

          {/* Commentaire trésorerie */}
          <div>
            <Label className="text-xs font-bold">Commentaire sur la trésorerie</Label>
            <Textarea value={commentaireTresorerie} onChange={e => setCommentaireTresorerie(e.target.value)}
              placeholder="Ex: La trésorerie inclut des reliquats de subventions État pour un montant important…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>

          {/* Commentaire créances */}
          <div>
            <Label className="text-xs font-bold">Commentaire sur les créances</Label>
            <Textarea value={commentaireCreances} onChange={e => setCommentaireCreances(e.target.value)}
              placeholder="Ex: Les créances familles incluent des impayés de restauration faisant l'objet de poursuites…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>

          {/* Commentaire général */}
          <div>
            <Label className="text-xs font-bold">Observations générales</Label>
            <Textarea value={commentaireGeneral} onChange={e => setCommentaireGeneral(e.target.value)}
              placeholder="Toute observation complémentaire de l'agent comptable…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ANALYSE INTELLIGENTE                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      {smartAnalysis.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Analyse automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs leading-relaxed">
              {smartAnalysis.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* RAPPORT VISUEL                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-foreground pb-4 mb-5">
            <div>
              <h1 className="text-xl font-black">RAPPORT FINANCIER DE L'EXERCICE {etab.exercice}</h1>
              <p className="text-muted-foreground text-xs">M9-6 2026 · Décret 2012-1246 art. 195-199</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <strong className="text-sm block">{etab.nom}</strong>
              <span className="text-primary font-semibold">RNE : {etab.uai}</span>
            </div>
          </div>

          <div className="bg-slate-800 text-white text-center py-3 rounded-lg mb-5 text-sm font-bold tracking-widest uppercase">
            RAPPORT DE L'AGENT COMPTABLE — COMPTE FINANCIER {etab.exercice}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-5">
            <span>Ordonnateur : <strong>{etab.ordonnateur || '—'}</strong></span>
            <span>Agent comptable : <strong>{etab.agentComptable || '—'}</strong></span>
          </div>

          {/* §1 Rappel */}
          <SectionTitre numero="1" title="Rappel des dispositions réglementaires" />
          <div className="text-xs leading-relaxed mb-4 bg-muted/30 rounded-lg p-4">
            L'agent comptable informe le conseil d'administration de l'état du patrimoine, des stocks,
            des créances, des reliquats de subventions. Il présente et explique les différents indicateurs
            financiers mentionnés à la pièce 14 du compte financier.
          </div>

          {/* §2 Résultat — Balance graphique */}
          <SectionTitre numero="2" title="Présentation du résultat et de l'autofinancement" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Balance scale chart */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><Scale className="h-3 w-3" /> Balance dépenses / recettes</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={balanceData} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {balanceData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* KPIs */}
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border">
                  <tbody>
                    <tr className="border-b bg-muted/20">
                      <td className="p-2 font-semibold">Charges nettes</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold">Produits nets</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td>
                    </tr>
                    <tr className={`border-b font-bold ${R.resultatComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                      <td className="p-2">RÉSULTAT</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.resultatComptable)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Charges non décaissables</td>
                      <td className="p-2 text-right font-mono">{formatEur(safe.chargesNonDecaissables)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Produits non encaissables</td>
                      <td className="p-2 text-right font-mono">{formatEur(safe.produitsNonEncaissables)}</td>
                    </tr>
                    <tr className={`font-bold ${safe.cafComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                      <td className="p-2">{safe.cafComptable >= 0 ? 'CAF' : 'IAF'}</td>
                      <td className="p-2 text-right font-mono">{formatEur(safe.cafComptable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {totalPrelev > 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs">
                  <p className="font-bold text-warning">⚠ Prélèvements sur FDR : {formatEur(totalPrelev)}</p>
                  <p className="text-muted-foreground mt-1">Résultat hors prélèvements : <strong className={resultatHorsPrelev >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(resultatHorsPrelev)}</strong></p>
                </div>
              )}
            </div>
          </div>
          {explicationsResultat && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-warning">
              {explicationsResultat}
            </div>
          )}

          {/* §3 FDR — Composition graphique */}
          <SectionTitre numero="3" title="Analyse du fonds de roulement" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Composition du FDR</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={fdrComposData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {fdrComposData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <table className="w-full text-xs border">
                <tbody>
                  <tr className="border-b bg-muted/20"><td className="p-2 font-semibold" colSpan={2}>FDR comptable</td><td className="p-2 text-right font-mono font-bold">{formatEur(R.fdrComptable)}</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Part encaissée (autonomie)</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartEncaissee)} ({safe.fdrPctEncaissee.toFixed(1)} %)</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Part non encaissée</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartNonEncaissee)} ({safe.fdrPctNonEncaissee.toFixed(1)} %)</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>FDR mobilisable</td><td className="p-2 text-right font-mono font-bold">{formatEur(safe.fdrMobilisable)}</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Jours FDR</td><td className="p-2 text-right font-mono font-bold">{Math.round(safe.joursFdr)} j</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          {commentaireFDR && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">
              {commentaireFDR}
            </div>
          )}

          {/* §4 BFR */}
          <SectionTitre numero="4" title="Besoin en fonds de roulement" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub={R.bfr < 0 ? 'Dégagement en FDR' : 'Besoin en FDR'} isText />
            <KPICard label="Créances" value={formatEur(safe.totalCreances)} color="blue" icon="📋" isText />
            <KPICard label="Dettes" value={formatEur(safe.totalDettes)} color="amber" icon="📋" isText />
          </div>
          <div className="bg-muted/20 rounded-lg p-3 mb-4 text-xs">
            <strong>Vérification FDR = BFR + Trésorerie :</strong>{' '}
            {formatEur(R.fdrComptable)} = {formatEur(R.bfr)} + {formatEur(R.tresorerie)} = {formatEur(R.bfr + R.tresorerie)}
            <span className={Math.abs(R.fdrComptable - R.bfr - R.tresorerie) < 1 ? ' text-emerald-600 font-bold' : ' text-destructive font-bold'}>
              {Math.abs(R.fdrComptable - R.bfr - R.tresorerie) < 1 ? ' ✓ Vérifié' : ' ⚠ Écart'}
            </span>
          </div>

          {/* §5 Trésorerie — Pie chart */}
          <SectionTitre numero="5" title="Composition de la trésorerie" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {tresoData.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><PieChartIcon className="h-3 w-3" /> Répartition de la trésorerie</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tresoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {tresoData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div>
              <table className="w-full text-xs border">
                <thead><tr className="bg-muted/50"><th className="p-2 text-left">Composante</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">%</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">Autonomie financière</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.autonomieFinanciere)}</td><td className="p-2 text-right">{pct(Math.abs(safe.tresoComposition.autonomieFinanciere), R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Dépôts & cautions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.depotsCautions)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.depotsCautions, R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Règlements en attente</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reglementsEnAttente)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.reglementsEnAttente, R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Reliquats subventions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reliquatsSubventions)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.reliquatsSubventions, R.tresorerie)}</td></tr>
                  <tr className="bg-muted/20 font-bold"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(R.tresorerie)}</td><td className="p-2 text-right">100 %</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>{Math.round(safe.joursTresorerie)} jours</strong> de fonctionnement couverts par la trésorerie.
              </p>
            </div>
          </div>
          {commentaireTresorerie && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">
              {commentaireTresorerie}
            </div>
          )}

          {/* §6 TMcap/TMnr + DGP/DGR */}
          <SectionTitre numero="6" title="Délais et taux de charges à payer / non-recouvrement" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMcap</div>
              <div className="text-2xl font-bold font-mono">{safe.tmcap.toFixed(2)} %</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMnr</div>
              <div className="text-2xl font-bold font-mono">{safe.tmnr.toFixed(2)} %</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgpJours > 30 ? 'border border-destructive/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGP</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgpJours > 30 ? 'text-destructive' : ''}`}>{Math.round(safe.dgpJours)} j</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgrJours > 60 ? 'border border-warning/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGR</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgrJours > 60 ? 'text-warning' : ''}`}>{Math.round(safe.dgrJours)} j</div>
            </div>
          </div>

          {/* §7 Patrimoine */}
          <SectionTitre numero="7" title="État du patrimoine" />
          <table className="w-full text-xs border mb-4">
            <tbody>
              <tr className="border-b bg-muted/20"><td className="p-2 font-semibold">Immobilisations brutes</td><td className="p-2 text-right font-mono">{formatEur(R.totalImmo)}</td></tr>
              <tr className="border-b"><td className="p-2">Amortissements</td><td className="p-2 text-right font-mono">- {formatEur(R.totalAmortissements)}</td></tr>
              <tr className="border-b font-bold"><td className="p-2">Valeur résiduelle</td><td className="p-2 text-right font-mono">{formatEur(safe.valeurNette)}</td></tr>
              <tr className="border-b"><td className="p-2">Fonds propres ({safe.patrimoineOriginesPctFP.toFixed(1)} %)</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesFondsPropres)}</td></tr>
              <tr className="border-b"><td className="p-2">Subv. investissement ({safe.patrimoineOriginesPctSub.toFixed(1)} %)</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesSubventions)}</td></tr>
            </tbody>
          </table>

          {/* §8 Créances/Dettes */}
          <SectionTitre numero="8" title="Créances et dettes" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Créance</th><th className="p-2 text-right">Montant</th></tr></thead>
              <tbody>
                {safe.creancesEtat > 0 && <tr className="border-b"><td className="p-2">État</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesEtat)}</td></tr>}
                {safe.creancesCollectivite > 0 && <tr className="border-b"><td className="p-2">Collectivité</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesCollectivite)}</td></tr>}
                {safe.creancesFamilles > 0 && <tr className="border-b"><td className="p-2">Familles</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesFamilles)}</td></tr>}
                {safe.creancesAutres > 0 && <tr className="border-b"><td className="p-2">Autres</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesAutres)}</td></tr>}
                <tr className="font-bold bg-muted/20"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(safe.totalCreances)}</td></tr>
              </tbody>
            </table>
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Dette</th><th className="p-2 text-right">Montant</th></tr></thead>
              <tbody>
                {safe.dettesFournisseurs > 0 && <tr className="border-b"><td className="p-2">Fournisseurs</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesFournisseurs)}</td></tr>}
                {safe.dettesEtat > 0 && <tr className="border-b"><td className="p-2">État</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesEtat)}</td></tr>}
                {safe.dettesCollectivite > 0 && <tr className="border-b"><td className="p-2">Collectivité</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesCollectivite)}</td></tr>}
                {safe.dettesAutres > 0 && <tr className="border-b"><td className="p-2">Autres</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesAutres)}</td></tr>}
                <tr className="font-bold bg-muted/20"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(safe.totalDettes)}</td></tr>
              </tbody>
            </table>
          </div>
          {commentaireCreances && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">
              {commentaireCreances}
            </div>
          )}

          {/* §9 Réserves + prélèvements */}
          <SectionTitre numero="9" title="Réserves et affectation du résultat" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="Réserves (c/1068)" value={formatEur(R.reserves)} color="blue" icon="🏛️" isText />
            <KPICard label="Dont SRH" value={formatEur(R.reservesSRH)} color="blue" icon="🍽️" isText />
            <KPICard label="Variation" value={formatEur(safe.prelevementsReserves.variationReserves)} color={safe.prelevementsReserves.variationReserves >= 0 ? 'green' : 'red'} icon="📈" isText />
          </div>
          <div className="text-xs bg-muted/10 rounded-lg p-4 mb-4">
            <p>Résultat de l'exercice : <strong>{formatEur(R.resultatComptable)}</strong></p>
            <p className="mt-1 text-muted-foreground">
              {R.resultatComptable >= 0
                ? `Proposition d'affectation au compte de réserves (c/1068).`
                : `Imputation sur les réserves. Après affectation : ${formatEur(R.reserves + R.resultatComptable)}.`}
            </p>
          </div>

          {/* §10 Ratios */}
          <SectionTitre numero="10" title="Ratios de gestion (M9-6 § IV)" />
          <table className="w-full text-xs border mb-4">
            <thead><tr className="bg-muted/50"><th className="p-2 text-left">Ratio</th><th className="p-2 text-right">Valeur</th><th className="p-2 text-left">Interprétation</th></tr></thead>
            <tbody>
              {[
                { label: 'Liquidité générale', value: safe.ratioLiquiditeGenerale, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 1 ? '✅ Correcte' : '⚠️ Insuffisante' },
                { label: 'Liquidité réduite', value: safe.ratioLiquiditeReduite, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 0.8 ? '✅' : '⚠️' },
                { label: 'Liquidité immédiate', value: safe.ratioLiquiditeImmediate, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 0.3 ? '✅' : '⚠️' },
                { label: 'Autonomie financière', value: safe.ratioAutonomieFinanciere, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.5 ? '✅ > 50%' : '⚠️ < 50%' },
                { label: 'Solvabilité', value: safe.ratioSolvabilite, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.5 ? '✅' : '⚠️' },
                { label: 'Endettement', value: safe.ratioEndettement, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v < 1 ? '✅' : '⚠️ Élevé' },
                { label: 'Couverture charges', value: safe.ratioCouvertureCharges, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.08 ? '✅ > 30 j' : '⚠️ < 30 j' },
              ].map(r => (
                <tr key={r.label} className="border-t">
                  <td className="p-2 font-semibold">{r.label}</td>
                  <td className="p-2 text-right font-mono font-bold">{r.fmt(r.value)}</td>
                  <td className="p-2 text-muted-foreground">{r.seuil(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* §11 Vérifications */}
          <SectionTitre numero="11" title="Vérifications comptables" />
          <div className="flex gap-3 mb-4 flex-wrap">
            <Badge className={nbBloq > 0 ? 'bg-destructive text-destructive-foreground' : nbAnom > 0 ? 'bg-warning text-warning-foreground' : 'bg-emerald-600 text-white'}>
              {nbBloq > 0 ? `🚫 ${nbBloq} point(s) bloquant(s)` : nbAnom > 0 ? `⚠️ ${nbAnom} anomalie(s)` : '✅ Concordance vérifiée'}
            </Badge>
          </div>

          {/* §12 Évolution N/N-1 */}
          {evolutionData.length > 0 && (
            <>
              <SectionTitre numero="12" title="Évolution N / N-1" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={evolutionData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="FDR" fill="hsl(215, 70%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="BFR" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Trésorerie" fill="hsl(160, 45%, 45%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* §13 Pluriannuel */}
          {history.length > 0 && (
            <>
              <SectionTitre numero="13" title="Évolution pluriannuelle" />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-bold border-r">Indicateur</th>
                      {history.map(h => <th key={h.exercice} className="p-2 text-right font-bold border-r">{h.exercice}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'FDR', key: 'fdr' },
                      { label: 'BFR', key: 'bfr' },
                      { label: 'Trésorerie', key: 'tresorerie' },
                      { label: 'CAF/IAF', key: 'caf' },
                      { label: 'Réserves', key: 'reserves' },
                      { label: 'Jours autonomie', key: 'jours_autonomie' },
                    ].map(row => (
                      <tr key={row.key} className="border-t">
                        <td className="p-2 font-medium border-r">{row.label}</td>
                        {history.map(h => (
                          <td key={h.exercice} className="p-2 text-right font-mono border-r">
                            {row.key === 'jours_autonomie' ? Math.round(h[row.key] || 0) : formatEur(h[row.key] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* §14 Observations IA */}
          <SectionTitre numero="14" title="Observations de l'agent comptable" />
          <Textarea value={aiObs} onChange={e => setAiObs(e.target.value)}
            placeholder="Cliquez sur 'Générer les observations IA' ou rédigez vos observations…" rows={12}
            className="bg-muted/30 text-sm mb-4" />

          {/* Signature — Agent comptable seul */}
          <div className="mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <div>
                <strong className="block text-foreground text-sm">L'agent comptable</strong>
                <div className="mt-12">{etab.agentComptable || '……………………'}</div>
                <span>Signature et cachet</span>
              </div>
              <div className="text-right">
                <p>Fait à {etab.commune || '………………'},</p>
                <p>le ……… / ……… / {etab.exercice + 1}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────
function SectionTitre({ numero, title }: { numero: string; title: string }) {
  return (
    <h3 className="text-sm font-bold border-l-4 border-warning pl-3 mb-3 mt-5 uppercase tracking-wide">
      {numero}. {title}
    </h3>
  );
}

function IndicatorBadge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-xs flex items-center gap-2">
      <span>{icon}</span>
      <div>
        <div className="text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}
