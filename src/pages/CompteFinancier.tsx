// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Page Compte Financier (sous-menu Outils Métiers)
// 14 onglets : Accueil, Import, Check-list, Superviseur,
// Synthèse, Tableaux, Contrôles, Pluriannuel, Indicateurs,
// Budget Annexe, Rapport Ordo, Rapport AC, Annexe, Diaporama
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Badge } from '@/components/ui/badge';
import { AccueilSection } from '@/components/cofieple/AccueilSection';
import { ImportSection } from '@/components/cofieple/ImportSection';
import { CheckListSection } from '@/components/cofieple/CheckListSection';
import { SuperviseurSection, SyntheseSection, TableauxSection, BudgetAnnexeSection } from '@/components/cofieple/AnalysisSections';
import { RapportOrdoSection, RapportACSection } from '@/components/cofieple/RapportSections';
import { DiaporamaSection } from '@/components/cofieple/DiaporamaSection';
import { AuditControlesSection } from '@/components/cofieple/AuditControlesSection';
import { ProgressStepper } from '@/components/cofieple/ProgressStepper';
import { DashboardOnePage } from '@/components/cofieple/DashboardOnePage';
import { IndicateursHorsComptables } from '@/components/cofieple/IndicateursHorsComptables';
import { PluriannuelSection } from '@/components/cofieple/PluriannuelSection';
import { AnnexeComptableSection } from '@/components/cofieple/AnnexeComptableSection';
import { ImportHistorySection } from '@/components/cofieple/ImportHistorySection';
import {
  Home, Upload, CheckCircle2, Search, ClipboardList,
  BarChart3, Building2, FileText, Monitor, Shield, ShieldCheck,
  History, PenTool, BookOpen
} from 'lucide-react';

interface NavItem {
  id: string; label: string; icon: React.ReactNode;
  badge?: string; badgeType?: 'error' | 'warning' | 'success' | 'info';
  requiresData?: boolean;
}

const CompteFinancier = () => {
  const activeTab = useCofiepleStore(s => s.activeTab);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const fichiers = useCofiepleStore(s => s.fichierCharge);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const budgets = useCofiepleStore(s => s.budgets);
  const resultats = useCofiepleStore(s => s.resultats);
  const etab = useCofiepleStore(s => s.etablissement);

  const nbFichiers = Object.values(fichiers).filter(Boolean).length;
  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const hasBA = budgets.some(b => b.type !== 'principal');
  const hasData = !!resultats.principal;

  const items: NavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="h-4 w-4" /> },
    { id: 'import', label: 'Imports', icon: <Upload className="h-4 w-4" />, badge: `${nbFichiers}`, badgeType: nbFichiers >= 3 ? 'success' : 'info' },
    { id: 'checklist', label: 'Check-List', icon: <CheckCircle2 className="h-4 w-4" />,
      badge: hasData ? (nbBloq > 0 ? `${nbBloq} BLOQ` : nbAnom > 0 ? `${nbAnom}` : 'OK') : undefined,
      badgeType: hasData ? (nbBloq > 0 ? 'error' : nbAnom > 0 ? 'warning' : 'success') : undefined, requiresData: true },
    { id: 'superviseur', label: 'Superviseur', icon: <Search className="h-4 w-4" />, requiresData: true },
    { id: 'synthese', label: 'Synthèse', icon: <ClipboardList className="h-4 w-4" />, requiresData: true },
    { id: 'tableaux', label: 'Tableaux', icon: <BarChart3 className="h-4 w-4" />, requiresData: true },
    { id: 'controles', label: 'Contrôles', icon: <ShieldCheck className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? '🔴' : nbAnom > 0 ? '🟠' : '🟢') : undefined, badgeType: nbBloq > 0 ? 'error' : nbAnom > 0 ? 'warning' : 'success' },
    { id: 'pluriannuel', label: 'N à N-4', icon: <History className="h-4 w-4" /> },
    { id: 'indicateurs', label: 'Indicateurs', icon: <PenTool className="h-4 w-4" /> },
    { id: 'budget_annexe', label: 'BA', icon: <Building2 className="h-4 w-4" />, badge: hasBA ? 'BA' : undefined, badgeType: 'info' },
    { id: 'rapport_ordo', label: 'Rpt Ordo', icon: <FileText className="h-4 w-4" />, requiresData: true },
    { id: 'rapport_ac', label: 'Rpt AC', icon: <Shield className="h-4 w-4" />, requiresData: true },
    { id: 'annexe', label: 'Annexe', icon: <BookOpen className="h-4 w-4" />, requiresData: true },
    { id: 'diaporama', label: 'Diaporama', icon: <Monitor className="h-4 w-4" />, requiresData: true },
  ];

  const badgeColors: Record<string, string> = {
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    success: 'bg-emerald-600 text-white',
    info: 'bg-primary text-primary-foreground',
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'accueil': return <AccueilSection />;
      case 'import': return <ImportSection />;
      case 'checklist': return <CheckListSection />;
      case 'superviseur': return <SuperviseurSection />;
      case 'synthese': return <SyntheseSection />;
      case 'tableaux': return <TableauxSection />;
      case 'controles': return <AuditControlesSection />;
      case 'pluriannuel': return <PluriannuelSection />;
      case 'indicateurs': return <IndicateursHorsComptables />;
      case 'budget_annexe': return <BudgetAnnexeSection />;
      case 'rapport_ordo': return <RapportOrdoSection />;
      case 'rapport_ac': return <RapportACSection />;
      case 'annexe': return <AnnexeComptableSection />;
      case 'diaporama': return <DiaporamaSection />;
      default: return <AccueilSection />;
    }
  };

  return (
    <div className="space-y-0">
      {/* Header COFIEPLE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl rounded-t-xl">
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-warning flex items-center justify-center text-2xl font-black text-white shadow-lg">
              ₣
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide">COFIEPLE</h1>
              <p className="text-xs text-warning font-medium tracking-widest uppercase">
                Compte Financier EPLE · M9-6 2026
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 ml-4">
            {etab.nom ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-white font-semibold text-sm truncate">{etab.nom}</span>
                <span className="text-slate-400 text-xs">RNE {etab.uai}</span>
                <span className="text-slate-400 text-xs">{etab.commune}</span>
                <Badge variant="outline" className="border-warning/50 text-warning text-xs">Ex. {etab.exercice}</Badge>
              </div>
            ) : (
              <span className="text-slate-500 text-sm italic">Renseignez le code UAI pour identifier l'établissement</span>
            )}
            {etab.academie && <p className="text-xs text-slate-500 mt-0.5">{etab.regionAcademique} · {etab.academie}</p>}
          </div>

          {hasData && (
            <div className="flex items-center gap-2 shrink-0">
              {nbBloq > 0 ? (
                <Badge className="bg-destructive text-destructive-foreground">🚫 {nbBloq} bloquant{nbBloq > 1 ? 's' : ''}</Badge>
              ) : nbAnom > 0 ? (
                <Badge className="bg-warning text-warning-foreground">⚠️ {nbAnom} anomalie{nbAnom > 1 ? 's' : ''}</Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white">✅ Aucun bloquant</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Stepper — Assistant mode */}
      <ProgressStepper />

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 rounded-none">
        <div className="px-2">
          <div className="flex overflow-x-auto scrollbar-hide">
            {items.map(item => {
              const active = activeTab === item.id;
              const disabled = item.requiresData && !hasData;
              return (
                <button key={item.id} onClick={() => !disabled && setActiveTab(item.id)} disabled={disabled}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                    active ? 'border-warning text-warning bg-white/5' :
                    disabled ? 'border-transparent text-slate-600 cursor-not-allowed' :
                    'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title={disabled ? 'Importez d\'abord les données CSV' : item.label}
                >
                  {item.icon}
                  <span className="tracking-wide">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColors[item.badgeType || 'info']}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Dashboard One-Page (visible quand données disponibles et sur accueil) */}
      {hasData && activeTab === 'accueil' && (
        <div className="p-5 pb-0">
          <DashboardOnePage />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {renderSection()}
      </div>
    </div>
  );
};

export default CompteFinancier;
