// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Rapport Ordonnateur + Rapport Agent Comptable
// Modèle REPROFI 25 pages — M9-6 2026, Décret 2012-1246
// Version enrichie : domaines D1-D9, N/N-1, opérations d'ordre,
// DGP/DGR, 12 ratios, composition FDR/BFR/Trésorerie
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Printer, Loader2 } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
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

  // Chart data for domain-level execution
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
          {/* Header officiel */}
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

          {/* 1. Présentation de l'établissement */}
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

          {/* 2. Exécution budgétaire globale */}
          <SectionTitre numero="2" title={`Exécution budgétaire de l'exercice ${etab.exercice}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Crédits ouverts" value={formatEur(R.totalChargesPrev)} color="blue" icon="💸" sub="Budget voté + DBM" isText />
            <KPICard label="Dépenses réalisées" value={formatEur(R.totalChargesSde)} color="amber" icon="✅" sub={`Taux : ${(R.tauxExecCharges * 100).toFixed(1)} %`} isText />
            <KPICard label="Prévisions recettes" value={formatEur(R.totalProduitsPrev)} color="blue" icon="💰" sub="Budget voté + DBM" isText />
            <KPICard label="Recettes réalisées" value={formatEur(R.totalProduitsSdr)} color={R.totalProduitsSdr >= R.totalProduitsPrev ? 'green' : 'red'} icon="✅" sub={`Taux : ${(R.tauxExecProduits * 100).toFixed(1)} %`} isText />
          </div>

          {/* N vs N-1 comparison */}
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

          {/* 3. Exécution par domaine D1-D9 */}
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

              {/* Graphique dépenses/recettes par domaine */}
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

              {/* Écarts significatifs (> 10%) */}
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

          {/* 4. Opérations d'ordre */}
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
            reprises sur provisions et neutralisations de subventions d'investissement. Le résultat comptable intègre ces opérations,
            tandis que la CAF/IAF les exclut pour mesurer l'impact réel sur les fonds propres.
          </div>

          {/* 5. SRH */}
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

          {/* 6. Situation financière */}
          <SectionTitre numero="6" title="Situation financière et patrimoniale" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub={`${Math.round(R.joursFdr ?? 0)} jours`} isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub={R.bfr < 0 ? 'DFR' : 'BFR'} isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursTresorerie ?? 0)} jours`} isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
          </div>

          {/* N-1 financial comparison */}
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

          {/* 7. Points d'attention */}
          <SectionTitre numero="7" title="Points d'attention et perspectives" />
          <Textarea value={aiText3} onChange={e => setAiText3(e.target.value)}
            placeholder="Cliquez sur 'Générer le texte IA' ou saisissez votre texte ici…" rows={4}
            className="mb-4 bg-muted/30 text-sm" />

          {ind && ind.montant_fonds_social > 0 && (
            <div className="mb-4 bg-muted/30 rounded-lg p-3 text-xs">
              <strong>Fonds social mobilisé :</strong> {formatEur(ind.montant_fonds_social)} — {ind.effectif_boursiers} boursier(s)
            </div>
          )}

          {/* Signatures */}
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
// RAPPORT DE L'AGENT COMPTABLE — 25 sections REPROFI
// M9-6 § V.2 — Décret 2012-1246 art. 195-199
// ═══════════════════════════════════════════════════════════════
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

  // Safe defaults for REPROFI properties
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

  const pct = (v: number, t: number) => t > 0 ? `${((v / t) * 100).toFixed(1)} %` : '—';

  // Chart data for FDR/BFR/Trésorerie evolution from balance N-1 data
  const hasN1Financial = safe.fdrComptableN1 !== 0 || safe.bfrN1 !== 0 || safe.tresorerieN1 !== 0;
  const evolutionData = hasN1Financial ? [
    { exercice: `N-1`, FDR: safe.fdrComptableN1, BFR: safe.bfrN1, Trésorerie: safe.tresorerieN1 },
    { exercice: `N`, FDR: R.fdrComptable, BFR: R.bfr, Trésorerie: R.tresorerie },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Button onClick={genererIA} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Génération IA…' : 'Générer les observations IA'}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimer / PDF
        </Button>
      </div>

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

          {/* Section 1: Rappel réglementaire */}
          <SectionTitre numero="1" title="Rappel des dispositions réglementaires" />
          <div className="text-xs leading-relaxed mb-4 bg-muted/30 rounded-lg p-4">
            L'agent comptable informe le conseil d'administration de l'état du patrimoine, des stocks,
            des créances, des reliquats de subventions. Il présente et explique les différents indicateurs
            financiers mentionnés à la pièce 14 du compte financier. L'analyse des données financières
            s'effectue à partir du résultat, de la capacité d'autofinancement ainsi que des divers
            indicateurs et de leur évolution. Elle est présentée par l'agent comptable qui explique,
            notamment en fonction de la composition du fonds de roulement, la marge dont dispose
            l'établissement pour financer des actions sur fonds propres.
          </div>

          {/* Section 2: Résultat + CAF/IAF */}
          <SectionTitre numero="2" title="Présentation du résultat et de l'autofinancement" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <tbody>
                <tr className="border-b bg-muted/20">
                  <td className="p-2 font-semibold">Charges nettes (classe 6)</td>
                  <td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td>
                  <td className="p-2 font-semibold">Produits nets (classe 7)</td>
                  <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-semibold">Charges non décaissables (68+675)</td>
                  <td className="p-2 text-right font-mono">{formatEur(safe.chargesNonDecaissables)}</td>
                  <td className="p-2 font-semibold">Produits non encaissables (78+775…)</td>
                  <td className="p-2 text-right font-mono">{formatEur(safe.produitsNonEncaissables)}</td>
                </tr>
                <tr className={`border-b font-bold ${R.resultatComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                  <td className="p-2" colSpan={2}>RÉSULTAT DE L'EXERCICE</td>
                  <td className="p-2 text-right font-mono" colSpan={2}>{formatEur(R.resultatComptable)}</td>
                </tr>
                <tr className={`font-bold ${safe.cafComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                  <td className="p-2" colSpan={2}>{safe.cafComptable >= 0 ? 'CAF (Capacité d\'autofinancement)' : 'IAF (Insuffisance d\'autofinancement)'}</td>
                  <td className="p-2 text-right font-mono" colSpan={2}>{formatEur(safe.cafComptable)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Variation FDR */}
          <SectionTitre numero="3" title="Variation du fonds de roulement" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label={safe.cafComptable >= 0 ? 'CAF' : 'IAF'} value={formatEur(safe.cafComptable)} color={safe.cafComptable >= 0 ? 'green' : 'red'} icon="🔄" sub="Autofinancement" isText />
            <KPICard label="Investissements" value={formatEur(safe.prelevementsReserves.prelevementsInvestissement)} color="amber" icon="🏗️" sub="Achats immobilisés" isText />
            <KPICard label="Variation FDR" value={formatEur(safe.varFdrBas)} color={safe.varFdrBas >= 0 ? 'green' : 'red'} icon="📈" sub="FDR BF - FDR BE" isText />
            <KPICard label="FDR clôture" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub={`${Math.round(safe.joursFdr)} jours`} isText />
          </div>

          {/* N-1 evolution chart */}
          {evolutionData.length > 0 && (
            <div className="mb-4">
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
            </div>
          )}

          {/* Section 4: Composition FDR */}
          <SectionTitre numero="4" title="Présentation du fonds de roulement" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <tbody>
                <tr className="border-b bg-muted/20"><td className="p-2 font-semibold" colSpan={2}>Composition du FDR</td><td className="p-2 text-right font-mono">{formatEur(R.fdrComptable)}</td></tr>
                <tr className="border-b"><td className="p-2" colSpan={2}>Part encaissée (autonomie financière)</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartEncaissee)} ({safe.fdrPctEncaissee.toFixed(1)} %)</td></tr>
                <tr className="border-b"><td className="p-2" colSpan={2}>Part non encaissée (créances & CCA)</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartNonEncaissee)} ({safe.fdrPctNonEncaissee.toFixed(1)} %)</td></tr>
                <tr className="border-b"><td className="p-2" colSpan={2}>Jours de fonctionnement</td><td className="p-2 text-right font-mono font-bold">{Math.round(safe.joursFdr)} jours</td></tr>
                <tr className="border-b"><td className="p-2" colSpan={2}>FDR mobilisable (hors stocks, créances anciennes, c/416)</td><td className="p-2 text-right font-mono font-bold">{formatEur(safe.fdrMobilisable)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: BFR */}
          <SectionTitre numero="5" title="Présentation du besoin en fonds de roulement" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub={R.bfr < 0 ? 'Dégagement en FDR' : 'Besoin en FDR'} isText />
            <KPICard label="Créances (cl.4 débit)" value={formatEur(safe.totalCreances)} color="blue" icon="📋" isText />
            <KPICard label="Dettes (cl.4 crédit)" value={formatEur(safe.totalDettes)} color="amber" icon="📋" isText />
          </div>

          {/* Section 6: Trésorerie */}
          <SectionTitre numero="6" title="Présentation de la trésorerie" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Trésorerie" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(safe.joursTresorerie)} jours`} isText />
            <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" isText />
            <KPICard label="FDR = BFR + Tréso" value={formatEur(R.bfr + R.tresorerie)} color="blue" icon="⚖️" sub="Vérification" isText />
          </div>

          {/* Section 7: Composition trésorerie */}
          <SectionTitre numero="7" title="Composition de la trésorerie" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Composante</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">% Trésorerie</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Autonomie financière</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.autonomieFinanciere)}</td><td className="p-2 text-right font-mono">{pct(Math.abs(safe.tresoComposition.autonomieFinanciere), R.tresorerie)}</td></tr>
                <tr className="border-b"><td className="p-2">Dépôts et cautions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.depotsCautions)}</td><td className="p-2 text-right font-mono">{pct(safe.tresoComposition.depotsCautions, R.tresorerie)}</td></tr>
                <tr className="border-b"><td className="p-2">Règlements en attente</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reglementsEnAttente)}</td><td className="p-2 text-right font-mono">{pct(safe.tresoComposition.reglementsEnAttente, R.tresorerie)}</td></tr>
                <tr className="border-b"><td className="p-2">Reliquats de subventions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reliquatsSubventions)}</td><td className="p-2 text-right font-mono">{pct(safe.tresoComposition.reliquatsSubventions, R.tresorerie)}</td></tr>
                <tr className="border-b font-bold bg-muted/20"><td className="p-2">TRÉSORERIE TOTALE</td><td className="p-2 text-right font-mono">{formatEur(R.tresorerie)}</td><td className="p-2 text-right">100 %</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 8: TMcap & TMnr + DGP/DGR */}
          <SectionTitre numero="8" title="Délais et taux de charges à payer / non-recouvrement" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMcap</div>
              <div className="text-2xl font-bold font-mono">{safe.tmcap.toFixed(2)} %</div>
              <div className="text-muted-foreground mt-1">Charges à payer / Charges totales</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMnr</div>
              <div className="text-2xl font-bold font-mono">{safe.tmnr.toFixed(2)} %</div>
              <div className="text-muted-foreground mt-1">Non-recouvrement / Recettes totales</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgpJours > 30 ? 'border border-destructive/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGP</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgpJours > 30 ? 'text-destructive' : ''}`}>{Math.round(safe.dgpJours)} jours</div>
              <div className="text-muted-foreground mt-1">Délai global de paiement {safe.dgpJours > 30 ? '⚠️ > 30j' : '✅ ≤ 30j'}</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgrJours > 60 ? 'border border-warning/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGR</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgrJours > 60 ? 'text-warning' : ''}`}>{Math.round(safe.dgrJours)} jours</div>
              <div className="text-muted-foreground mt-1">Délai global de recouvrement</div>
            </div>
          </div>

          {/* Section 9: État du patrimoine */}
          <SectionTitre numero="9" title="État du patrimoine" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <tbody>
                <tr className="border-b bg-muted/20"><td className="p-2 font-semibold">Immobilisations brutes (classe 2)</td><td className="p-2 text-right font-mono">{formatEur(R.totalImmo)}</td></tr>
                <tr className="border-b"><td className="p-2">Amortissements cumulés (compte 28)</td><td className="p-2 text-right font-mono">- {formatEur(R.totalAmortissements)}</td></tr>
                <tr className="border-b font-bold"><td className="p-2">Valeur résiduelle du patrimoine</td><td className="p-2 text-right font-mono">{formatEur(safe.valeurNette)}</td></tr>
                <tr className="border-b"><td className="p-2">Variation annuelle</td><td className="p-2 text-right font-mono">{formatEur(safe.variationPatrimoine)}</td></tr>
                <tr className="border-b"><td className="p-2">Origines — Fonds propres</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesFondsPropres)} ({safe.patrimoineOriginesPctFP.toFixed(1)} %)</td></tr>
                <tr className="border-b"><td className="p-2">Origines — Subventions d'investissement</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesSubventions)} ({safe.patrimoineOriginesPctSub.toFixed(1)} %)</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 10: Créances */}
          <SectionTitre numero="10" title="État des créances" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Origine</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">%</th></tr></thead>
              <tbody>
                {safe.creancesEtat > 0 && <tr className="border-b"><td className="p-2">État</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesEtat)}</td><td className="p-2 text-right font-mono">{pct(safe.creancesEtat, safe.totalCreances)}</td></tr>}
                {safe.creancesCollectivite > 0 && <tr className="border-b"><td className="p-2">Collectivité de rattachement</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesCollectivite)}</td><td className="p-2 text-right font-mono">{pct(safe.creancesCollectivite, safe.totalCreances)}</td></tr>}
                {safe.creancesFamilles > 0 && <tr className="border-b"><td className="p-2">Familles (DP, internes)</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesFamilles)}</td><td className="p-2 text-right font-mono">{pct(safe.creancesFamilles, safe.totalCreances)}</td></tr>}
                {safe.creancesAutres > 0 && <tr className="border-b"><td className="p-2">Autres débiteurs</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesAutres)}</td><td className="p-2 text-right font-mono">{pct(safe.creancesAutres, safe.totalCreances)}</td></tr>}
                <tr className="border-b font-bold bg-muted/20"><td className="p-2">TOTAL CRÉANCES</td><td className="p-2 text-right font-mono">{formatEur(safe.totalCreances)}</td><td className="p-2 text-right">100 %</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 11: Dettes */}
          <SectionTitre numero="11" title="État des dettes" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Type</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">%</th></tr></thead>
              <tbody>
                {safe.dettesFournisseurs > 0 && <tr className="border-b"><td className="p-2">Fournisseurs</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesFournisseurs)}</td><td className="p-2 text-right font-mono">{pct(safe.dettesFournisseurs, safe.totalDettes)}</td></tr>}
                {safe.dettesEtat > 0 && <tr className="border-b"><td className="p-2">État (subventions, bourses)</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesEtat)}</td><td className="p-2 text-right font-mono">{pct(safe.dettesEtat, safe.totalDettes)}</td></tr>}
                {safe.dettesCollectivite > 0 && <tr className="border-b"><td className="p-2">Collectivité de rattachement</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesCollectivite)}</td><td className="p-2 text-right font-mono">{pct(safe.dettesCollectivite, safe.totalDettes)}</td></tr>}
                {safe.dettesAutres > 0 && <tr className="border-b"><td className="p-2">Autres créditeurs</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesAutres)}</td><td className="p-2 text-right font-mono">{pct(safe.dettesAutres, safe.totalDettes)}</td></tr>}
                <tr className="border-b font-bold bg-muted/20"><td className="p-2">TOTAL DETTES</td><td className="p-2 text-right font-mono">{formatEur(safe.totalDettes)}</td><td className="p-2 text-right">100 %</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 12: Reliquats */}
          <SectionTitre numero="12" title="État des reliquats de subventions" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <KPICard label="Reliquats subventions" value={formatEur(safe.reliquatsSubventions)} color="amber" icon="📋" sub="Subventions non consommées à la clôture" isText />
            <KPICard label="% de la trésorerie" value={pct(safe.reliquatsSubventions, R.tresorerie)} color="blue" icon="📊" sub="Poids des reliquats dans la trésorerie" isText />
          </div>

          {/* Section 13: Prélèvements sur réserves */}
          {safe.prelevementsReserves.totalPrelevements > 0 && (
            <>
              <SectionTitre numero="13" title="Prélèvements sur réserves (classe 106)" />
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 mb-4 text-xs leading-relaxed">
                <p className="font-semibold text-foreground mb-2">
                  Total prélevé : <strong className="text-destructive">{formatEur(safe.prelevementsReserves.totalPrelevements)}</strong>
                </p>
                <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                  <li><strong className="text-foreground">{formatEur(safe.prelevementsReserves.prelevementsInvestissement)}</strong> pour investissements</li>
                  <li><strong className="text-foreground">{formatEur(safe.prelevementsReserves.prelevementsFonctionnement)}</strong> pour fonctionnement</li>
                </ul>
              </div>
            </>
          )}

          {/* Section 14: Réserves */}
          <SectionTitre numero="14" title="Situation des comptes de réserves" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="Réserves (c/1068)" value={formatEur(R.reserves)} color="blue" icon="🏛️" isText />
            <KPICard label="Dont SRH (c/106870)" value={formatEur(R.reservesSRH)} color="blue" icon="🍽️" isText />
            <KPICard label="Variation annuelle" value={formatEur(safe.prelevementsReserves.variationReserves)} color={safe.prelevementsReserves.variationReserves >= 0 ? 'green' : 'red'} icon="📈" isText />
          </div>

          {/* Section 15: Fonds mobilisables */}
          <SectionTitre numero="15" title="Situation des fonds mobilisables" />
          <div className="bg-muted/30 rounded-lg p-4 mb-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">FDR mobilisable</div>
                <div className="text-2xl font-bold font-mono">{formatEur(safe.fdrMobilisable)}</div>
                <div className="text-muted-foreground mt-1">= FDR brut − Stocks − Créances anciennes − Compte 416</div>
              </div>
              <div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">Jours d'autonomie mobilisable</div>
                <div className="text-2xl font-bold font-mono">{R.totalChargesSde > 0 ? Math.round(safe.fdrMobilisable / (R.totalChargesSde / 365)) : 0} jours</div>
                <div className="text-muted-foreground mt-1">Base de décision pour le CA (seuil recommandé : 30 jours)</div>
              </div>
            </div>
          </div>

          {/* Section 16: Ratios M9-6 */}
          <SectionTitre numero="16" title="Ratios de gestion (M9-6 § IV)" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Ratio</th><th className="p-2 text-right">Valeur</th><th className="p-2 text-left">Interprétation</th></tr></thead>
              <tbody>
                {[
                  { label: 'Liquidité générale', value: safe.ratioLiquiditeGenerale, fmt: (v: number) => v.toFixed(2), seuil: v => v >= 1 ? '✅ Couverture correcte' : '⚠️ Insuffisante' },
                  { label: 'Liquidité réduite', value: safe.ratioLiquiditeReduite, fmt: (v: number) => v.toFixed(2), seuil: v => v >= 0.8 ? '✅' : '⚠️' },
                  { label: 'Liquidité immédiate', value: safe.ratioLiquiditeImmediate, fmt: (v: number) => v.toFixed(2), seuil: v => v >= 0.3 ? '✅' : '⚠️' },
                  { label: 'Autonomie financière', value: safe.ratioAutonomieFinanciere, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: v => v >= 0.5 ? '✅ > 50%' : '⚠️ < 50%' },
                  { label: 'Solvabilité', value: safe.ratioSolvabilite, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: v => v >= 0.5 ? '✅' : '⚠️' },
                  { label: 'Endettement', value: safe.ratioEndettement, fmt: (v: number) => v.toFixed(2), seuil: v => v < 1 ? '✅' : '⚠️ Endettement élevé' },
                  { label: 'Charges de personnel / Total', value: safe.ratioChargesPersonnel, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: () => '' },
                  { label: 'Couverture des charges par le FDR', value: safe.ratioCouvertureCharges, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: v => v >= 0.08 ? '✅ > 30 jours' : '⚠️ < 30 jours' },
                ].map(r => (
                  <tr key={r.label} className="border-t">
                    <td className="p-2 font-semibold">{r.label}</td>
                    <td className="p-2 text-right font-mono font-bold">{r.fmt(r.value)}</td>
                    <td className="p-2 text-muted-foreground">{r.seuil(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 17: Rapprochements */}
          <SectionTitre numero="17" title="Vérifications et rapprochements comptables" />
          <div className="flex gap-3 mb-4 flex-wrap">
            <Badge className={nbBloq > 0 ? 'bg-destructive text-destructive-foreground' : nbAnom > 0 ? 'bg-warning text-warning-foreground' : 'bg-emerald-600 text-white'}>
              {nbBloq > 0 ? `🚫 ${nbBloq} point(s) bloquant(s)` : nbAnom > 0 ? `⚠️ ${nbAnom} anomalie(s)` : '✅ Concordance vérifiée'}
            </Badge>
          </div>

          {/* Section 18: Pluriannuel */}
          {history.length > 0 && (
            <>
              <SectionTitre numero="18" title="Évolution pluriannuelle des indicateurs financiers" />
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
                      { label: 'Résultat budgétaire', key: 'resultat_budgetaire' },
                      { label: 'FRNG (FDR)', key: 'fdr' },
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

          {/* Section 19: Affectation du résultat */}
          <SectionTitre numero="19" title="Propositions d'affectation du résultat" />
          <div className="text-xs bg-muted/10 rounded-lg p-4 mb-4">
            <p>Le résultat de l'exercice {etab.exercice} s'élève à <strong>{formatEur(R.resultatComptable)}</strong>.</p>
            <p className="mt-2 text-muted-foreground">
              {R.resultatComptable >= 0
                ? `Il sera proposé au conseil d'administration d'affecter cet excédent au compte de réserves (c/1068).`
                : `Ce déficit sera imputé sur les réserves (c/1068). Après affectation : ${formatEur(R.reserves + R.resultatComptable)}.`}
            </p>
            {R.resultatComptable < 0 && R.reserves + R.resultatComptable < 0 && (
              <p className="mt-2 text-destructive font-semibold">
                ⚠️ Réserves négatives après affectation — Plan de redressement nécessaire.
              </p>
            )}
          </div>

          {/* Section 20: Observations IA */}
          <SectionTitre numero="20" title="Observations et analyse de l'agent comptable" />
          <Textarea value={aiObs} onChange={e => setAiObs(e.target.value)}
            placeholder="Cliquez sur 'Générer les observations IA' ou rédigez vos observations…" rows={12}
            className="bg-muted/30 text-sm mb-4" />

          {/* Signatures */}
          <div className="flex justify-between mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground">L'agent comptable</strong>
              <div className="mt-8">{etab.agentComptable || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-right">
              <strong className="block text-foreground">Visa du comptable supérieur</strong>
              <div className="mt-8">……………………</div>
              <span>Signature et cachet</span>
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
