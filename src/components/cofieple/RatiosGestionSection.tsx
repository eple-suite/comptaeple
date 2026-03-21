// ═══════════════════════════════════════════════════════════════
// MODULE 3.3 — RATIOS DE GESTION (12 ratios M9-6 avec jauges)
// M9-6 §§ 4.5.3-4.5.8 — Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Loader2, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RatioConfig {
  id: string;
  nom: string;
  formule: string;
  seuilM96: string;
  reference: string;
  calculer: (R: any, bal: any[]) => number;
  format: (v: number) => string;
  evaluer: (v: number) => 'ok' | 'warn' | 'alert';
}

const sumBal = (bal: any[], test: (c: string) => boolean, field: string) =>
  bal.filter((b: any) => test(b.compte)).reduce((s: number, b: any) => s + ((b[field] as number) || 0), 0);

const RATIOS: RatioConfig[] = [
  {
    id: 'liq_gen', nom: 'Liquidité générale', formule: 'ACT / DCT',
    seuilM96: '≥ 1', reference: '§4.5.3',
    calculer: (R, bal) => {
      const act = sumBal(bal, c => c.charAt(0) === '3' || c.charAt(0) === '4', 'solDbt') + sumBal(bal, c => c.charAt(0) === '5', 'solDbt');
      const dct = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
      return dct > 0 ? act / dct : 0;
    },
    format: v => v.toFixed(2), evaluer: v => v >= 1 ? 'ok' : v >= 0.8 ? 'warn' : 'alert',
  },
  {
    id: 'liq_red', nom: 'Liquidité réduite', formule: '(ACT − Stocks) / DCT',
    seuilM96: '≥ 0,8', reference: '§4.5.3',
    calculer: (R, bal) => {
      const stocks = sumBal(bal, c => c.charAt(0) === '3' && !c.startsWith('39'), 'solDbt');
      const act = sumBal(bal, c => c.charAt(0) === '3' || c.charAt(0) === '4', 'solDbt') + sumBal(bal, c => c.charAt(0) === '5', 'solDbt') - stocks;
      const dct = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
      return dct > 0 ? act / dct : 0;
    },
    format: v => v.toFixed(2), evaluer: v => v >= 0.8 ? 'ok' : v >= 0.5 ? 'warn' : 'alert',
  },
  {
    id: 'liq_imm', nom: 'Liquidité immédiate', formule: 'TA / DCT',
    seuilM96: '≥ 0,2', reference: '§4.5.3',
    calculer: (R, bal) => {
      const ta = sumBal(bal, c => c.charAt(0) === '5', 'solDbt');
      const dct = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
      return dct > 0 ? ta / dct : 0;
    },
    format: v => v.toFixed(2), evaluer: v => v >= 0.2 ? 'ok' : v >= 0.1 ? 'warn' : 'alert',
  },
  {
    id: 'auto_fin', nom: 'Autonomie financière', formule: 'Fonds propres / Total passif',
    seuilM96: '≥ 0,5', reference: '§4.5.5',
    calculer: (R, bal) => {
      const fp = sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solCrd') - sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solDbt');
      const totalPassif = sumBal(bal, c => c.charAt(0) === '1', 'solCrd') + sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
      return totalPassif > 0 ? fp / totalPassif : 0;
    },
    format: v => `${(v * 100).toFixed(1)} %`, evaluer: v => v >= 0.5 ? 'ok' : v >= 0.3 ? 'warn' : 'alert',
  },
  {
    id: 'solv_gen', nom: 'Solvabilité générale', formule: 'Total actif / Total dettes',
    seuilM96: '≥ 1,5', reference: '§4.5.5',
    calculer: (R, bal) => {
      const totalActif = sumBal(bal, c => ['2','3','4','5'].includes(c.charAt(0)), 'solDbt');
      const totalDettes = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd') + sumBal(bal, c => c.startsWith('16'), 'solCrd');
      return totalDettes > 0 ? totalActif / totalDettes : 0;
    },
    format: v => v.toFixed(2), evaluer: v => v >= 1.5 ? 'ok' : v >= 1 ? 'warn' : 'alert',
  },
  {
    id: 'endett', nom: 'Taux d\'endettement', formule: 'Dettes LT / CP',
    seuilM96: '≤ 0,5', reference: '§4.5.5',
    calculer: (R, bal) => {
      const dettesLT = sumBal(bal, c => c.startsWith('16'), 'solCrd');
      const cp = sumBal(bal, c => c.charAt(0) === '1' && !c.startsWith('16'), 'solCrd');
      return cp > 0 ? dettesLT / cp : 0;
    },
    format: v => v.toFixed(2), evaluer: v => v <= 0.5 ? 'ok' : v <= 0.8 ? 'warn' : 'alert',
  },
  {
    id: 'dgp', nom: 'Délai global de paiement', formule: '(Dettes fourn. / Charges TTC) × 365',
    seuilM96: '≤ 30 jours', reference: '§4.5.6',
    calculer: (R) => {
      const df = R.dettesFournisseurs ?? 0;
      return R.totalChargesSde > 0 ? (df / R.totalChargesSde) * 365 : 0;
    },
    format: v => `${Math.round(v)} jours`, evaluer: v => v <= 30 ? 'ok' : v <= 45 ? 'warn' : 'alert',
  },
  {
    id: 'dgr', nom: 'Délai global de recouvrement', formule: '(Créances / Recettes TTC) × 365',
    seuilM96: 'À surveiller', reference: '§4.5.6',
    calculer: (R) => {
      const cr = R.totalCreances ?? 0;
      return R.totalProduitsSdr > 0 ? (cr / R.totalProduitsSdr) * 365 : 0;
    },
    format: v => `${Math.round(v)} jours`, evaluer: v => v <= 45 ? 'ok' : v <= 90 ? 'warn' : 'alert',
  },
  {
    id: 'charges_perso', nom: 'Taux charges de personnel', formule: 'C/641+643 / Total charges',
    seuilM96: 'Benchmark', reference: '§4.5.7',
    calculer: (R) => {
      const cp = (R.chargesNature?.['641'] || 0) + (R.chargesNature?.['643'] || 0) + (R.chargesNature?.['644'] || 0);
      return R.totalChargesSde > 0 ? cp / R.totalChargesSde : 0;
    },
    format: v => `${(v * 100).toFixed(1)} %`, evaluer: v => v <= 0.6 ? 'ok' : v <= 0.8 ? 'warn' : 'alert',
  },
  {
    id: 'ratio_invest', nom: 'Ratio d\'investissement', formule: 'Dép. Invest / Total dépenses',
    seuilM96: '—', reference: '§4.5.8',
    calculer: (R) => {
      const invest = R.prelevementsReserves?.prelevementsInvestissement || 0;
      return R.totalChargesSde > 0 ? invest / R.totalChargesSde : 0;
    },
    format: v => `${(v * 100).toFixed(1)} %`, evaluer: () => 'ok',
  },
  {
    id: 'real_rp', nom: 'Taux réalisation recettes propres', formule: 'Recettes propres / Prév. recettes propres',
    seuilM96: '≥ 90 %', reference: '§3.2',
    calculer: (R) => {
      return R.totalProduitsPrev > 0 ? R.ressourcesPropres / R.totalProduitsPrev : 0;
    },
    format: v => `${(v * 100).toFixed(1)} %`, evaluer: v => v >= 0.9 ? 'ok' : v >= 0.75 ? 'warn' : 'alert',
  },
  {
    id: 'couv_charges', nom: 'Taux de couverture des charges', formule: 'Recettes propres / Charges propres',
    seuilM96: '—', reference: '—',
    calculer: (R) => {
      return R.totalChargesSde > 0 ? R.ressourcesPropres / R.totalChargesSde : 0;
    },
    format: v => `${(v * 100).toFixed(1)} %`, evaluer: v => v >= 0.5 ? 'ok' : v >= 0.3 ? 'warn' : 'alert',
  },
];

export function RatiosGestionSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const R = resultats[activeBudget];
  const bal = balance[activeBudget] || [];
  const [comments, setComments] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('cockpit_cf_commentaires_ratios') || '{}'); } catch { return {}; }
  });

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher les 12 ratios de gestion M9-6." />;

  const saveComment = (id: string, text: string) => {
    const next = { ...comments, [id]: text };
    setComments(next);
    localStorage.setItem('cockpit_cf_commentaires_ratios', JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <strong>12 ratios de gestion — M9-6 2026 §§ 4.5.3 à 4.5.8</strong> — Chaque ratio est calculé automatiquement
        à partir des données importées, comparé aux seuils réglementaires et assorti d'un commentaire éditable.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RATIOS.map(ratio => {
          const valeur = ratio.calculer(R, bal);
          const status = ratio.evaluer(valeur);
          const statusColors = { ok: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/20', warn: 'bg-warning/10 border-warning/30', alert: 'bg-destructive/10 border-destructive/30' };
          const statusIcons = { ok: '✅', warn: '⚠️', alert: '🔴' };
          const barPct = Math.min(Math.abs(valeur) * (ratio.id.includes('liq') || ratio.id === 'solv_gen' || ratio.id === 'auto_fin' || ratio.id === 'endett' ? 50 : ratio.id.includes('dgp') || ratio.id.includes('dgr') ? (100/90) : 100), 100);

          return (
            <Card key={ratio.id} className={`border ${statusColors[status]}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{ratio.nom}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs"><strong>Formule :</strong> {ratio.formule}</p>
                            <p className="text-xs"><strong>Seuil M9-6 :</strong> {ratio.seuilM96}</p>
                            <p className="text-xs"><strong>Référence :</strong> M9-6 {ratio.reference}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-muted-foreground">{ratio.formule} · M9-6 {ratio.reference}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono">{ratio.format(valeur)}</div>
                    <div className="text-xs">{statusIcons[status]} Seuil : {ratio.seuilM96}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full transition-all ${status === 'ok' ? 'bg-emerald-500' : status === 'warn' ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(barPct, 100)}%` }} />
                </div>

                {/* Comment */}
                <Textarea value={comments[ratio.id] || ''} onChange={e => saveComment(ratio.id, e.target.value)}
                  placeholder="Commentaire du comptable…" rows={1} className="text-xs bg-muted/20 mt-1" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
