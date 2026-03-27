// ═══════════════════════════════════════════════════════════════
// MODULE 6 — ANALYSE IA GLOBALE
// Périmètre sélectionnable, 3 niveaux de détail
// Appel Lovable AI via Edge Function
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { getSystemPromptForBudgetType } from '@/lib/cofieple_budgetPrompts';
import { EmptyState } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Loader2, Copy, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type DetailLevel = 'resume' | 'standard' | 'exhaustif';

export function AnalyseIASection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const etab = useCofiepleStore(s => s.etablissement);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const R = resultats[activeBudget];

  const [scope, setScope] = useState({
    rapportOrdo: true, rapportAC: true, pointsBloquants: true,
    pluriannuel: true, recommandations: true, formulationCRC: true,
  });
  const [detail, setDetail] = useState<DetailLevel>('standard');
  const [aiText, setAiText] = useState(() => {
    try { return localStorage.getItem('cockpit_cf_analyse_ia') || ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(false);

  const safeText = (value: unknown) => {
    try {
      if (typeof value === 'string') return value;
      if (value instanceof Error) return `${value.name}: ${value.message}`;
      return JSON.stringify(value ?? '');
    } catch {
      return String(value ?? '');
    }
  };

  if (!R) return <EmptyState msg="Lancez l'analyse pour accéder au module d'analyse IA globale." />;

  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;

  const generate = async () => {
    setLoading(true);
    try {
      const scopeDesc = Object.entries(scope).filter(([, v]) => v).map(([k]) => k).join(', ');
      const lengthHint = detail === 'resume' ? '500 mots maximum, concis' : detail === 'exhaustif' ? '2000+ mots, très détaillé, chaque indicateur commenté' : '1000-1500 mots, équilibré';

      const systemPrompt = getSystemPromptForBudgetType(activeBudget);

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'analyse_ia_globale',
          systemPrompt,
          budgetType: activeBudget,
          etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable, tresorerieNette: R.tresorerie,
            cafComptable: R.cafComptable ?? 0, cafBudgetaire: R.cafBudgetaire,
            chargesNonDecaissables: R.chargesNonDecaissables ?? 0,
            produitsNonEncaissables: R.produitsNonEncaissables ?? 0,
            totalChargesReel: R.totalChargesSde, totalProduitsReel: R.totalProduitsSdr,
            reserves: R.reserves, joursAutonomie: R.joursAutonomie,
            joursFdr: R.joursFdr ?? 0, joursTresorerie: R.joursTresorerie ?? 0,
            bfr: R.bfr, tmcap: R.tmcap ?? 0, tmnr: R.tmnr ?? 0,
            totalCreances: R.totalCreances ?? 0, totalDettes: R.totalDettes ?? 0,
            reliquatsSubventions: R.reliquatsSubventions ?? 0,
            valeurNette: R.valeurNette ?? 0, variationPatrimoine: R.variationPatrimoine ?? 0,
            patrimoineOriginesPctFP: R.patrimoineOriginesPctFP ?? 0,
            fdrMobilisable: R.fdrMobilisable ?? 0,
            tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
            ressourcesPropres: R.ressourcesPropres, scoreRisque: R.scoreRisque,
          },
          anomalies: nbAnom, bloquants: nbBloq,
          scopeDescription: scopeDesc, detailLevel: lengthHint,
        },
      });
      if (error) {
        const errStr = [
          safeText(error?.message),
          safeText((error as any)?.context),
          safeText(error),
        ].join(' ').toLowerCase();
        if (errStr.includes('402') || errStr.includes('payment_required') || errStr.includes('crédits') || errStr.includes('credits') || errStr.includes('non-2xx')) {
          toast.error('Crédits IA épuisés — rechargez dans Settings → Cloud & AI balance puis réessayez.');
        } else if (errStr.includes('429') || errStr.includes('rate_limited') || errStr.includes('too many')) {
          toast.error('Limite de requêtes IA atteinte, réessayez dans quelques instants.');
        } else {
          toast.error('Erreur lors de la génération IA');
        }
        return;
      }
      const text = data?.text || '';
      setAiText(text);
      localStorage.setItem('cockpit_cf_analyse_ia', text);
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur lors de la génération IA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiText);
    toast.success('Texte copié dans le presse-papiers');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,22%)] rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            🤖 ANALYSE IA — Compte Financier Exercice {etab.exercice}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Périmètre */}
          <div>
            <Label className="text-sm font-bold mb-2 block">Périmètre de l'analyse :</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries({
                rapportOrdo: 'Rapport ordonnateur',
                rapportAC: 'Rapport comptable',
                pointsBloquants: 'Points bloquants',
                pluriannuel: 'Évolution pluriannuelle',
                recommandations: 'Recommandations N+1',
                formulationCRC: 'Formulation CRC',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox id={key} checked={scope[key as keyof typeof scope]}
                    onCheckedChange={v => setScope(s => ({ ...s, [key]: !!v }))} />
                  <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Niveau de détail */}
          <div>
            <Label className="text-sm font-bold mb-2 block">Niveau de détail :</Label>
            <div className="flex gap-3">
              {([['resume', 'Résumé'], ['standard', 'Standard'], ['exhaustif', 'Exhaustif']] as const).map(([val, lab]) => (
                <label key={val} className={`flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${
                  detail === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}>
                  <input type="radio" name="detail" value={val} checked={detail === val}
                    onChange={() => setDetail(val)} className="sr-only" />
                  {lab}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              {loading ? 'Génération en cours…' : 'Générer l\'analyse complète'}
            </Button>
            <Button variant="outline" onClick={() => { setAiText(''); localStorage.removeItem('cockpit_cf_analyse_ia'); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
            </Button>
            {aiText && (
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" /> Copier
              </Button>
            )}
          </div>

          {/* Résultat */}
          {aiText ? (
            <div className="bg-muted/30 rounded-lg p-5 prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{aiText}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8 italic">
              Cliquez sur « Générer l'analyse complète » pour obtenir un rapport IA structuré
              couvrant l'ensemble du périmètre sélectionné.
            </div>
          )}

          {/* Zone éditable */}
          {aiText && (
            <>
              <Label className="text-sm font-bold">Version éditable (modifiable avant inclusion au rapport) :</Label>
              <Textarea value={aiText} onChange={e => {
                setAiText(e.target.value);
                localStorage.setItem('cockpit_cf_analyse_ia', e.target.value);
              }} rows={10} className="text-sm bg-muted/20" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
