// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Rapport Ordonnateur + Rapport Agent Comptable
// Génération IA via Lovable AI (Gemini 2.5 Flash)
// Conformité stricte : M9-6 2026, Décret 2012-1246 (RGCP),
// Code de l'Éducation Art. R421-68 et suivants
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Printer, Loader2, FileText } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'ORDONNATEUR
// Fondement : M9-6 § V.1 — Code Éducation Art. R421-68
// ═══════════════════════════════════════════════════════════════
export function RapportOrdoSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  const [aiText1, setAiText1] = useState('');
  const [aiText3, setAiText3] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'ordonnateur (M9-6 § V.1)." />;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';

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
  const [aiObs, setAiObs] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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
          },
          anomalies: nbAnom,
          bloquants: nbBloq,
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
            <strong>{etab.nom || 'l\'établissement'}</strong> (RNE {etab.uai || '…'}), certifie que le
            compte financier de l'exercice <strong>{etab.exercice}</strong> a été établi conformément aux
            dispositions de l'instruction codificatrice M9-6 du 12 février 2026, du décret n°2012-1246
            du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique (RGCP) et des
            articles R421-68 et suivants du code de l'éducation.
          </div>

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

// ── Sous-composant ──────────────────────────────────────────
function SectionTitre({ numero, title }: { numero: string; title: string }) {
  return (
    <h3 className="text-sm font-bold border-l-4 border-warning pl-3 mb-3 mt-5 uppercase tracking-wide">
      {numero}. {title}
    </h3>
  );
}
