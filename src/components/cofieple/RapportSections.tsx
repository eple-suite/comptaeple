// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Rapport Ordonnateur + Rapport Agent Comptable
// Génération IA via Lovable AI — Pré-rempli avec indicateurs
// hors-comptables (effectifs, boursiers, SRH)
// Conformité stricte : M9-6 2026, Décret 2012-1246 (RGCP),
// Code de l'Éducation Art. R421-68 et suivants
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Printer, Loader2, Users, Utensils } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';

interface Indicators {
  effectif_eleves: number;
  effectif_dp: number;
  effectif_internes: number;
  effectif_externes: number;
  effectif_boursiers: number;
  effectif_personnel: number;
  montant_fonds_social: number;
  nb_repas_servis: number;
  nb_repas_commensaux: number;
  cout_denrees_repas: number;
  etp_ressources_propres: number;
  surface_batiments: number;
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
          .eq('uai', etab.uai)
          .eq('exercice', etab.exercice)
          .eq('user_id', session.session.user.id)
          .maybeSingle();
        if (data) setInd(data as Indicators);
      } catch {}
    })();
  }, [etab.uai, etab.exercice]);

  return ind;
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'ORDONNATEUR
// Fondement : M9-6 § V.1 — Code Éducation Art. R421-68
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

  async function genererIA() {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'ordonnateur',
          etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire,
            fdrComptable: R.fdrComptable,
            tresorerieNette: R.tresorerieNette,
            cafBudgetaire: R.cafBudgetaire,
            totalChargesReel: R.totalChargesReel,
            totalProduitsReel: R.totalProduitsReel,
            joursAutonomie: R.joursAutonomie,
            reserves: R.reserves,
            tauxExecCharges: R.tauxExecCharges,
            tauxExecProduits: R.tauxExecProduits,
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
          {/* Indicateurs hors-comptables pré-remplis */}
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
            <KPICard label="Mandatements" value={formatEur(R.totalChargesReel)} color="amber" icon="💸" sub={`Taux : ${(R.tauxExecCharges * 100).toFixed(1)} %`} isText />
            <KPICard label="Recettes compt." value={formatEur(R.totalProduitsReel)} color="green" icon="💰" sub={`Taux : ${(R.tauxExecProduits * 100).toFixed(1)} %`} isText />
            <KPICard label="Résultat budg." value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="📊" sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'} isText />
            <KPICard label="CAF/IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
          </div>

          {/* SRH pre-filled section */}
          {ind && ind.nb_repas_servis > 0 && (
            <>
              <SectionTitre numero="2bis" title="Service de restauration et d'hébergement (SRH)" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                <IndicatorBadge icon="🍽️" label="Repas élèves" value={ind.nb_repas_servis.toLocaleString('fr-FR')} />
                {ind.nb_repas_commensaux > 0 && <IndicatorBadge icon="🍴" label="Repas commensaux" value={ind.nb_repas_commensaux.toLocaleString('fr-FR')} />}
                {ind.cout_denrees_repas > 0 && <IndicatorBadge icon="€" label="Coût denrées/repas" value={`${ind.cout_denrees_repas.toFixed(2)} €`} />}
              </div>
            </>
          )}

          <SectionTitre numero="3" title="Situation financière et patrimoniale" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub="Besoin en FDR" isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} jours`} isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
          </div>

          <SectionTitre numero="4" title="Points d'attention et perspectives" />
          <Textarea value={aiText3} onChange={e => setAiText3(e.target.value)}
            placeholder="Cliquez sur 'Générer le texte IA' ou saisissez votre texte ici…" rows={4}
            className="mb-4 bg-muted/30 text-sm" />

          {/* Fonds social */}
          {ind && ind.montant_fonds_social > 0 && (
            <div className="mb-4 bg-muted/30 rounded-lg p-3 text-xs">
              <strong>Fonds social mobilisé :</strong> {formatEur(ind.montant_fonds_social)} — {ind.effectif_boursiers} boursier(s)
            </div>
          )}

          <div className="flex justify-between mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground">L'ordonnateur</strong>
              <div className="mt-8">{etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-right">
              <strong className="block text-foreground">L'agent comptable</strong>
              <div className="mt-8">{etab.agentComptable || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'AGENT COMPTABLE
// Fondement : M9-6 § V.2 — Décret 2012-1246 art. 195-199
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

  // Load 5-year history for FRNG analysis
  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_exercises')
          .select('exercice,fdr,bfr,tresorerie,caf,reserves,jours_autonomie')
          .eq('uai', etab.uai)
          .eq('user_id', session.session.user.id)
          .order('exercice', { ascending: false })
          .limit(5);
        if (data) setHistory(data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'agent comptable (M9-6 § V.2)." />;

  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';

  async function genererIA() {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'agent_comptable',
          etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire,
            resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable,
            tresorerieNette: R.tresorerieNette,
            cafComptable: R.cafComptable,
            totalChargesReel: R.totalChargesReel,
            totalProduitsReel: R.totalProduitsReel,
            reserves: R.reserves,
            joursAutonomie: R.joursAutonomie,
            prelevementsReserves: R.prelevementsReserves,
          },
          anomalies: nbAnom,
          bloquants: nbBloq,
          indicateurs: ind,
          historique: history,
        },
      });
      if (error) throw error;
      setAiObs(data?.text || '');
    } catch (e) { console.error(e); }
    setAiLoading(false);
  }

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

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex justify-between items-start border-b-2 border-foreground pb-4 mb-5">
            <div>
              <h1 className="text-xl font-black">RAPPORT DE L'AGENT COMPTABLE</h1>
              <p className="text-muted-foreground text-xs">Exercice {etab.exercice} · M9-6 2026 · Décret 2012-1246 art. 195-199</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <strong className="text-sm block">{etab.nom}</strong>
              <span className="text-primary font-semibold">RNE : {etab.uai}</span>
            </div>
          </div>

          <div className="bg-slate-800 text-white text-center py-3 rounded-lg mb-5 text-sm font-bold tracking-widest uppercase">
            RAPPORT DE L'AGENT COMPTABLE SUR LE COMPTE FINANCIER {etab.exercice}
          </div>
          <p className="text-center text-xs text-muted-foreground mb-5">
            Rédigé par : <strong>{etab.agentComptable || '—'}</strong> · Arrêté au : {dateArrete}
          </p>

          <SectionTitre numero="1" title="Déclaration de l'agent comptable" />
          <div className="text-xs leading-relaxed mb-4 bg-muted/30 rounded-lg p-4">
            Je soussigné(e), <strong>{etab.agentComptable || '…………'}</strong>, agent comptable de{' '}
            <strong>{etab.nom || "l'établissement"}</strong> (RNE {etab.uai || '…'}), certifie que le
            compte financier de l'exercice <strong>{etab.exercice}</strong> a été établi conformément aux
            dispositions de l'instruction codificatrice M9-6 du 12 février 2026, du décret n°2012-1246
            du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique (RGCP) et des
            articles R421-68 et suivants du code de l'éducation.
          </div>

          {/* Context indicators */}
          {ind && ind.effectif_eleves > 0 && (
            <>
              <SectionTitre numero="1bis" title="Données de contexte" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                <IndicatorBadge icon="🎓" label="Élèves" value={`${ind.effectif_eleves}`} />
                <IndicatorBadge icon="📚" label="Boursiers" value={`${ind.effectif_boursiers}`} />
                {ind.nb_repas_servis > 0 && <IndicatorBadge icon="🍽️" label="Repas servis" value={ind.nb_repas_servis.toLocaleString('fr-FR')} />}
                {ind.effectif_personnel > 0 && <IndicatorBadge icon="👥" label="Personnel" value={`${ind.effectif_personnel}`} />}
              </div>
            </>
          )}

          <SectionTitre numero="2" title="Vérifications et rapprochements comptables" />
          <div className="flex gap-3 mb-4 flex-wrap">
            <Badge className={nbBloq > 0 ? 'bg-destructive text-destructive-foreground' : nbAnom > 0 ? 'bg-warning text-warning-foreground' : 'bg-emerald-600 text-white'}>
              {nbBloq > 0 ? `🚫 ${nbBloq} point(s) bloquant(s) au dépôt` : nbAnom > 0 ? `⚠️ ${nbAnom} anomalie(s) de rapprochement` : '✅ Aucune anomalie bloquante — concordance vérifiée'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-4 bg-muted/30 rounded-lg p-3">
            Les 15 rapprochements réglementaires M9-6 ont été effectués (concordance SDE/SDR ↔ Balance,
            équilibre FDR haut/bas, structuration FDR = BFR + Trésorerie, CAF/IAF budgétaire et comptable).
          </div>

          <SectionTitre numero="3" title="Situation financière et indicateurs clés" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <KPICard label="FDR comptable" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub="Besoin en FDR" isText />
            <KPICard label="Trésorerie nette" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} jours d'autonomie`} isText />
            <KPICard label="CAF/IAF comptable" value={formatEur(R.cafComptable)} color={R.cafComptable >= 0 ? 'green' : 'red'} icon="🔄" isText />
            <KPICard label="Résultat comptable" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📈" isText />
            <KPICard label="Réserves (cpte 1068)" value={formatEur(R.reserves)} color="blue" icon="🏛️" isText />
          </div>

          {/* FRNG 5-year table */}
          {history.length > 0 && (
            <>
              <SectionTitre numero="3bis" title="Évolution pluriannuelle du FRNG (5 ans)" />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-bold border-r">Indicateur</th>
                      {history.map(h => (
                        <th key={h.exercice} className="p-2 text-right font-bold border-r">{h.exercice}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
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
                            {row.key === 'jours_autonomie' ? Math.round(h[row.key]) : formatEur(h[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <SectionTitre numero="4" title="Observations de l'agent comptable" />
          <Textarea value={aiObs} onChange={e => setAiObs(e.target.value)}
            placeholder="Cliquez sur 'Générer le texte IA' ou saisissez vos observations ici…" rows={6}
            className="bg-muted/30 text-sm" />

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
