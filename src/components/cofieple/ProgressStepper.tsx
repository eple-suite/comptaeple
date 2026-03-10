// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Barre de progression "Assistant" (fil d'Ariane)
// Guide l'utilisateur de l'identification à l'édition des annexes
// ═══════════════════════════════════════════════════════════════

import { useCofiepleStore } from '@/store/useCofiepleStore';
import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'accueil', label: 'Identification', tab: 'accueil' },
  { id: 'import', label: 'Import CSV', tab: 'import' },
  { id: 'analyse', label: 'Analyse M9-6', tab: 'checklist' },
  { id: 'controles', label: 'Contrôles', tab: 'controles' },
  { id: 'rapports', label: 'Rapports', tab: 'rapport_ordo' },
  { id: 'diaporama', label: 'Diaporama CA', tab: 'diaporama' },
];

export function ProgressStepper() {
  const activeTab = useCofiepleStore(s => s.activeTab);
  const etab = useCofiepleStore(s => s.etablissement);
  const fichiers = useCofiepleStore(s => s.fichierCharge);
  const resultats = useCofiepleStore(s => s.resultats);
  const hasData = !!resultats.principal;

  // Determine completion of each step
  const stepStatus = (id: string): 'done' | 'current' | 'pending' => {
    const currentIdx = STEPS.findIndex(s => s.tab === activeTab || 
      (activeTab === 'superviseur' && s.id === 'analyse') ||
      (activeTab === 'synthese' && s.id === 'analyse') ||
      (activeTab === 'tableaux' && s.id === 'analyse') ||
      (activeTab === 'rapport_ac' && s.id === 'rapports') ||
      (activeTab === 'budget_annexe' && s.id === 'analyse')
    );
    const stepIdx = STEPS.findIndex(s => s.id === id);

    if (id === 'accueil' && etab.uai) return stepIdx < currentIdx ? 'done' : stepIdx === currentIdx ? 'current' : 'done';
    if (id === 'import' && Object.values(fichiers).filter(Boolean).length >= 3) return stepIdx <= currentIdx ? 'done' : 'pending';
    if (id === 'analyse' && hasData) return stepIdx <= currentIdx ? 'done' : 'pending';

    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  const setActiveTab = useCofiepleStore(s => s.setActiveTab);

  return (
    <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((step, i) => {
          const status = stepStatus(step.id);
          const isClickable = status === 'done' || status === 'current';
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <button
                onClick={() => isClickable && setActiveTab(step.tab)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'current'
                    ? 'bg-warning text-warning-foreground shadow-md'
                    : status === 'done'
                    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 cursor-pointer'
                    : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {status === 'done' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    status === 'current' ? 'bg-warning-foreground text-warning' : 'bg-slate-700 text-slate-400'
                  }`}>{i + 1}</span>
                )}
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-0.5 ${status === 'done' ? 'bg-emerald-600/40' : 'bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
