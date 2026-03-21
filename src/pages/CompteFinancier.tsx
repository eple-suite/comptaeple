// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Page Compte Financier — Refonte v2.0
// 7 modules + sous-modules : Vue d'ensemble, Rpt Ordo, Rpt AC,
// Pluriannuel, Points Bloquants, Analyse IA, Rapport PDF
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AccueilSection } from '@/components/cofieple/AccueilSection';
import { ImportSection } from '@/components/cofieple/ImportSection';
import { CheckListSection } from '@/components/cofieple/CheckListSection';
import { SuperviseurSection, SyntheseSection, TableauxSection, BudgetAnnexeSection } from '@/components/cofieple/AnalysisSections';
import { RapportOrdoSection, RapportACSection } from '@/components/cofieple/RapportSections';
import { DiaporamaSection } from '@/components/cofieple/DiaporamaSection';
import { AuditControlesSection } from '@/components/cofieple/AuditControlesSection';
import { ProgressStepper } from '@/components/cofieple/ProgressStepper';
import { VueEnsembleSection } from '@/components/cofieple/VueEnsembleSection';
import { RatiosGestionSection } from '@/components/cofieple/RatiosGestionSection';
import { PointsBloquantsSection } from '@/components/cofieple/PointsBloquantsSection';
import { AnalyseIASection } from '@/components/cofieple/AnalyseIASection';
import { IndicateursHorsComptables } from '@/components/cofieple/IndicateursHorsComptables';
import { PluriannuelSection } from '@/components/cofieple/PluriannuelSection';
import { AnnexeComptableSection } from '@/components/cofieple/AnnexeComptableSection';
import { ImportHistorySection } from '@/components/cofieple/ImportHistorySection';
import { LiaisonsInterBudgets } from '@/components/cofieple/LiaisonsInterBudgets';
import { IndicateursGreta } from '@/components/cofieple/IndicateursGreta';
import { IndicateursCfa } from '@/components/cofieple/IndicateursCfa';
import { detectBudgetType } from '@/lib/cofieple_csvParser';
import type { TypeBudget } from '@/lib/cofieple_storeTypes';
import {
  Home, Upload, CheckCircle2, Search, ClipboardList,
  BarChart3, Building2, FileText, Monitor, Shield, ShieldCheck,
  History, PenTool, BookOpen, ScrollText, AlertTriangle, Bot,
  Eye, Gauge, FolderOpen, Radio, Link2, GraduationCap
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
  const resultatsConsolides = useCofiepleStore(s => s.resultatsConsolides);
  const etab = useCofiepleStore(s => s.etablissement);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const setActiveBudget = useCofiepleStore(s => s.setActiveBudget);
  const balance = useCofiepleStore(s => s.balance);

  const nbFichiers = Object.values(fichiers).filter(Boolean).length;
  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const hasBA = budgets.some(b => b.type !== 'principal');
  const hasData = !!resultats.principal;

  // Budget type detection from loaded balance
  const balancePrincipal = balance?.principal || [];
  const detection = balancePrincipal.length > 0 ? detectBudgetType(balancePrincipal) : null;

  // Budget options for the selector
  const budgetOptions: { key: TypeBudget | 'consolide'; label: string; icon: string; hasData: boolean }[] = [
    { key: 'principal', label: 'Budget Principal', icon: '🏛️', hasData: !!resultats.principal },
    ...(budgets.some(b => b.type === 'annexe_greta') ? [{ key: 'annexe_greta' as TypeBudget, label: 'Budget Annexe — GRETA', icon: '📎', hasData: !!resultats.annexe_greta }] : []),
    ...(budgets.some(b => b.type === 'annexe_cfa') ? [{ key: 'annexe_cfa' as TypeBudget, label: 'Budget Annexe — CFA', icon: '📎', hasData: !!resultats.annexe_cfa }] : []),
    ...(budgets.some(b => b.type === 'annexe_autre') ? [{ key: 'annexe_autre' as TypeBudget, label: 'Budget Annexe — Autre', icon: '📎', hasData: !!resultats.annexe_autre }] : []),
    ...(resultatsConsolides ? [{ key: 'consolide' as const, label: 'Vue Consolidée', icon: '📊', hasData: true }] : []),
  ];

  const items: NavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="h-4 w-4" /> },
    { id: 'import', label: 'Imports', icon: <Upload className="h-4 w-4" />, badge: `${nbFichiers}`, badgeType: nbFichiers >= 3 ? 'success' : 'info' },
    { id: 'journal', label: 'Journal', icon: <ScrollText className="h-4 w-4" /> },
    { id: 'vue_ensemble', label: 'Vue d\'ensemble', icon: <Eye className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? '🔴' : '🟢') : undefined, badgeType: nbBloq > 0 ? 'error' : 'success' },
    { id: 'rapport_ordo', label: 'Rpt Ordo', icon: <FileText className="h-4 w-4" />, requiresData: true },
    { id: 'rapport_ac', label: 'Rpt AC', icon: <Shield className="h-4 w-4" />, requiresData: true },
    { id: 'ratios', label: 'Ratios', icon: <Gauge className="h-4 w-4" />, requiresData: true },
    { id: 'superviseur', label: 'Superviseur', icon: <Search className="h-4 w-4" />, requiresData: true },
    { id: 'synthese', label: 'Synthèse', icon: <ClipboardList className="h-4 w-4" />, requiresData: true },
    { id: 'tableaux', label: 'Tableaux', icon: <BarChart3 className="h-4 w-4" />, requiresData: true },
    { id: 'controles', label: 'Contrôles', icon: <ShieldCheck className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? '🔴' : nbAnom > 0 ? '🟠' : '🟢') : undefined, badgeType: nbBloq > 0 ? 'error' : nbAnom > 0 ? 'warning' : 'success' },
    { id: 'points_bloquants', label: 'Bloquants', icon: <AlertTriangle className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? `${nbBloq}` : '0') : undefined, badgeType: nbBloq > 0 ? 'error' : 'success' },
    { id: 'pluriannuel', label: 'N à N-4', icon: <History className="h-4 w-4" /> },
    { id: 'indicateurs', label: 'Indicateurs', icon: <PenTool className="h-4 w-4" /> },
    { id: 'analyse_ia', label: 'Analyse IA', icon: <Bot className="h-4 w-4" />, requiresData: true },
    { id: 'budget_annexe', label: 'BA', icon: <Building2 className="h-4 w-4" />, badge: hasBA ? 'BA' : undefined, badgeType: 'info' },
    { id: 'liaisons_185', label: 'C/185', icon: <Link2 className="h-4 w-4" />, requiresData: true },
    ...(budgets.some(b => b.type === 'annexe_greta') ? [{ id: 'greta', label: 'GRETA', icon: <GraduationCap className="h-4 w-4" />, requiresData: false }] : []),
    ...(budgets.some(b => b.type === 'annexe_cfa') ? [{ id: 'cfa', label: 'CFA', icon: <BookOpen className="h-4 w-4" />, requiresData: false }] : []),
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
      case 'journal': return <ImportHistorySection />;
      case 'vue_ensemble': return <VueEnsembleSection />;
      case 'checklist': return <CheckListSection />;
      case 'superviseur': return <SuperviseurSection />;
      case 'synthese': return <SyntheseSection />;
      case 'tableaux': return <TableauxSection />;
      case 'controles': return <AuditControlesSection />;
      case 'ratios': return <RatiosGestionSection />;
      case 'points_bloquants': return <PointsBloquantsSection />;
      case 'pluriannuel': return <PluriannuelSection />;
      case 'indicateurs': return <IndicateursHorsComptables />;
      case 'analyse_ia': return <AnalyseIASection />;
      case 'budget_annexe': return <BudgetAnnexeSection />;
      case 'liaisons_185': return <LiaisonsInterBudgets />;
      case 'greta': return <IndicateursGreta />;
      case 'cfa': return <IndicateursCfa />;
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
      <div className="bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,20%)] shadow-xl rounded-xl">
        <div className="px-5 py-4 flex items-center gap-4">
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
                <span className="text-[hsl(220,15%,55%)] text-xs">RNE {etab.uai}</span>
                <span className="text-[hsl(220,15%,55%)] text-xs">{etab.commune}</span>
                <Badge variant="outline" className="border-warning/50 text-warning text-xs">Ex. {etab.exercice}</Badge>
              </div>
            ) : (
              <span className="text-[hsl(220,15%,45%)] text-sm italic">Renseignez le code UAI pour identifier l'établissement</span>
            )}
            {etab.academie && <p className="text-xs text-[hsl(220,15%,45%)] mt-0.5">{etab.regionAcademique} · {etab.academie}</p>}
          </div>

          {hasData && (
            <div className="flex items-center gap-2 shrink-0">
              {nbBloq > 0 ? (
                <Badge className="bg-destructive text-destructive-foreground">🚫 {nbBloq} bloquant{nbBloq > 1 ? 's' : ''}</Badge>
              ) : nbAnom > 0 ? (
                <Badge className="bg-warning text-warning-foreground">⚠️ {nbAnom} anomalie{nbAnom > 1 ? 's' : ''}</Badge>
              ) : (
                <Badge className="bg-success text-success-foreground">✅ Aucun bloquant</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper />

      {/* Budget Selector Panel */}
      {hasData && (
        <div className="mx-1 mt-2">
          <Card className="border-[hsl(222,25%,24%)] bg-[hsl(222,28%,16%)]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-warning" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">Budget analysé</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {budgetOptions.map(opt => {
                  const isActive = activeBudget === opt.key || (opt.key === 'consolide' && activeBudget === 'principal' && false);
                  const isConsolide = opt.key === 'consolide';
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (!isConsolide) setActiveBudget(opt.key as TypeBudget);
                      }}
                      disabled={!opt.hasData && !isConsolide}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive && !isConsolide
                          ? 'bg-warning/20 border-2 border-warning text-warning shadow-[0_0_12px_hsl(var(--warning)/0.3)]'
                          : isConsolide
                          ? 'bg-primary/10 border border-primary/30 text-primary/80 hover:bg-primary/20 hover:text-primary cursor-pointer'
                          : opt.hasData
                          ? 'bg-white/5 border border-[hsl(222,25%,28%)] text-[hsl(220,15%,65%)] hover:bg-white/10 hover:text-white cursor-pointer'
                          : 'bg-transparent border border-[hsl(222,25%,22%)] text-[hsl(220,15%,35%)] cursor-not-allowed'
                      }`}
                    >
                      <Radio className={`h-3 w-3 ${isActive && !isConsolide ? 'text-warning' : 'text-current'}`} />
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                      {opt.hasData && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              {/* Detection info */}
              {detection && balancePrincipal.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[hsl(220,15%,50%)]">
                  <span className="inline-flex items-center gap-1 bg-white/5 rounded px-2 py-0.5">
                    Type détecté automatiquement :
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      detection.isAnnexe ? 'border-warning/50 text-warning' : 'border-emerald-500/50 text-emerald-400'
                    }`}>
                      {detection.type.replace('_', ' ')}
                    </Badge>
                    {detection.confidence === 'high' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  </span>
                  <span className="text-[hsl(220,15%,40%)]">
                    {detection.hasTresor ? '(C/515100 présent)' : '(C/515100 absent)'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner Budget Annexe — Mode de calcul adapté */}
      {hasData && activeBudget !== 'principal' && resultats[activeBudget] && (() => {
        const bal = balance?.[activeBudget] || [];
        const c185 = bal.find(l => l.compte.startsWith('185'));
        const solde185 = c185 ? (c185.solDbt - c185.solCrd) : 0;
        return (
          <div className="mx-1 mt-2">
            <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-warning">
                    ℹ️ BUDGET ANNEXE DÉTECTÉ — Mode de calcul adapté (M9-6 §2.1.2.3.2)
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Ce budget n'ayant pas de personnalité juridique (M9-6 §2.1.2.3.1), il ne dispose pas
                    de compte de dépôt des fonds au Trésor (C/515100). Sa trésorerie est matérialisée par
                    le <span className="font-semibold text-foreground">compte 185000</span>{' '}
                    (solde débiteur : <span className="font-semibold text-warning">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(solde185)}</span>),
                    qui représente les fonds mis à disposition par le budget principal support.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Tous les indicateurs (FDR, BFR, TN) ont été recalculés en conséquence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Navigation */}
      <nav className="bg-[hsl(222,25%,18%)] border-b border-[hsl(222,25%,24%)] sticky top-0 z-40 rounded-b-xl">
        <div className="px-2">
          <div className="flex overflow-x-auto scrollbar-hide">
            {items.map(item => {
              const active = activeTab === item.id;
              const disabled = item.requiresData && !hasData;
              return (
                <button key={item.id} onClick={() => !disabled && setActiveTab(item.id)} disabled={disabled}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 shrink-0 rounded-t-lg ${
                    active ? 'border-warning text-warning bg-white/5' :
                    disabled ? 'border-transparent text-[hsl(222,15%,35%)] cursor-not-allowed' :
                    'border-transparent text-[hsl(220,15%,55%)] hover:text-[hsl(220,15%,80%)] hover:bg-white/5'
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

      {/* Content */}
      <div className="p-5">
        {renderSection()}
      </div>
    </div>
  );
};

export default CompteFinancier;
