// ═══════════════════════════════════════════════════════════════
// MODULE — Périmètre Comptable (sélection de profils budgétaires)
// Affiche la liste des budgets configurés, leur statut de chargement,
// et permet de lancer l'analyse ou la vue consolidée.
// M9-6 2026 — Titre 3 (budgets annexes)
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import type { TypeBudget } from '@/lib/cofieple_storeTypes';
import {
  FolderOpen, Plus, CheckCircle2, Circle, BarChart3,
  Layers, Building2, GraduationCap, BookOpen, UtensilsCrossed,
} from 'lucide-react';

const BUDGET_META: Record<TypeBudget, { label: string; icon: React.ReactNode; fullLabel: string }> = {
  principal: { label: 'Budget Principal', fullLabel: 'Budget Principal', icon: <Building2 className="h-4 w-4" /> },
  annexe_greta: { label: 'Budget Annexe GRETA', fullLabel: 'GRETA — Formation Continue', icon: <GraduationCap className="h-4 w-4" /> },
  annexe_cfa: { label: 'Budget Annexe CFA', fullLabel: 'CFA — Apprentissage', icon: <BookOpen className="h-4 w-4" /> },
  annexe_autre: { label: 'Budget Annexe SRH', fullLabel: 'SRH — Restauration/Hébergement', icon: <UtensilsCrossed className="h-4 w-4" /> },
};

type FileKey = 'sde' | 'sde1' | 'sdr' | 'sdr1' | 'balance' | 'balance1';
const FILE_KEYS: { key: FileKey; label: string }[] = [
  { key: 'sde', label: 'SDE N' }, { key: 'sde1', label: 'SDE N-1' },
  { key: 'sdr', label: 'SDR N' }, { key: 'sdr1', label: 'SDR N-1' },
  { key: 'balance', label: 'Bal N' }, { key: 'balance1', label: 'Bal N-1' },
];

export function PerimetreComptable() {
  const budgets = useCofiepleStore(s => s.budgets);
  const fichierCharge = useCofiepleStore(s => s.fichierCharge);
  const resultats = useCofiepleStore(s => s.resultats);
  const resultatsConsolides = useCofiepleStore(s => s.resultatsConsolides);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const setActiveBudget = useCofiepleStore(s => s.setActiveBudget);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const addBudgetAnnexe = useCofiepleStore(s => s.addBudgetAnnexe);
  const lancerAnalyse = useCofiepleStore(s => s.lancerAnalyse);
  const analysisRunning = useCofiepleStore(s => s.analysisRunning);
  const etab = useCofiepleStore(s => s.etablissement);

  const budgetStatuses = useMemo(() => {
    return budgets.map(b => {
      const bt = b.type;
      const meta = BUDGET_META[bt];
      const loaded: string[] = [];
      const missing: string[] = [];
      for (const fk of FILE_KEYS) {
        const storageKey = fk.key === 'balance' ? `bal_${bt}` : fk.key === 'balance1' ? `bal1_${bt}` : `${fk.key}_${bt}`;
        if (fichierCharge[storageKey]) loaded.push(fk.label);
        else missing.push(fk.label);
      }
      const hasResult = !!resultats[bt];
      const status: 'complet' | 'partiel' | 'vide' =
        hasResult ? 'complet' : loaded.length > 0 ? 'partiel' : 'vide';
      return { ...b, meta, loaded, missing, hasResult, status };
    });
  }, [budgets, fichierCharge, resultats]);

  const nbBudgetsAvecDonnees = budgetStatuses.filter(b => b.hasResult).length;
  const canConsolidate = nbBudgetsAvecDonnees >= 2 && budgetStatuses.some(b => b.type === 'principal' && b.hasResult);

  const availableAnnexes: { type: TypeBudget; label: string }[] = [
    { type: 'annexe_greta', label: 'GRETA' },
    { type: 'annexe_cfa', label: 'CFA' },
    { type: 'annexe_autre', label: 'SRH' },
  ].filter(a => !budgets.some(b => b.type === a.type));

  const statusConfig = {
    complet: { badge: '✅ Complet', className: 'bg-emerald-600 text-white' },
    partiel: { badge: '🟡 Partiel', className: 'bg-warning text-warning-foreground' },
    vide: { badge: '⬜ Vide', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,20%)] rounded-t-lg pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <FolderOpen className="h-5 w-5 text-warning" />
          PÉRIMÈTRE COMPTABLE
          {availableAnnexes.length > 0 && (
            <div className="ml-auto flex gap-1">
              {availableAnnexes.map(a => (
                <Button key={a.type} variant="ghost" size="sm"
                  className="h-7 text-xs text-white/60 hover:text-white hover:bg-white/10 gap-1"
                  onClick={() => addBudgetAnnexe({ type: a.type, libelle: a.label })}>
                  <Plus className="h-3 w-3" /> {a.label}
                </Button>
              ))}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        {budgetStatuses.map(b => {
          const isActive = activeBudget === b.type;
          return (
            <button
              key={b.type}
              onClick={() => setActiveBudget(b.type)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-muted/30 ${
                isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
              }`}
            >
              {/* Checkbox-like indicator */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                b.hasResult ? 'bg-primary border-primary' : 'border-muted-foreground/30'
              }`}>
                {b.hasResult && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
              </div>

              {/* Icon */}
              <span className="shrink-0 text-muted-foreground">{b.meta.icon}</span>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{b.meta.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {b.hasResult
                    ? `${etab.nom || 'Établissement'}`
                    : b.status === 'partiel'
                      ? `${b.loaded.length}/6 fichiers · Manque : ${b.missing.join(', ')}`
                      : '(non configuré)'}
                </div>
              </div>

              {/* Status badge */}
              <Badge className={`shrink-0 text-[10px] ${statusConfig[b.status].className}`}>
                {statusConfig[b.status].badge}
              </Badge>
            </button>
          );
        })}

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Button size="sm" onClick={() => { lancerAnalyse(); }}
            disabled={analysisRunning}
            className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {analysisRunning ? 'Analyse en cours…' : 'Analyser le budget sélectionné'}
          </Button>

          {canConsolidate && (
            <Button size="sm" variant="outline" onClick={() => setActiveTab('vue_consolidee')}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Layers className="h-4 w-4" />
              Vue Consolidée ({nbBudgetsAvecDonnees} budgets)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
