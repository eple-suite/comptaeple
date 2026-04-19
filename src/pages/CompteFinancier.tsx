// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Page Compte Financier — Refonte v3.0
// 2 onglets principaux : Rapport Ordonnateur (13 sections)
//                        Rapport Agent Comptable (existant)
// + Onglets utilitaires : Accueil, Import, Journal, Contrôles…
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Badge } from '@/components/ui/badge';
import { AccueilSection } from '@/components/cofieple/AccueilSection';
import { ImportSection } from '@/components/cofieple/ImportSection';
import { CheckListSection } from '@/components/cofieple/CheckListSection';
import { SuperviseurSection, SyntheseSection, TableauxSection, BudgetAnnexeSection } from '@/components/cofieple/AnalysisSections';
import { RapportACSection } from '@/components/cofieple/RapportSections';
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
import { DocumentCASection } from '@/components/cofieple/DocumentCASection';
import { LiaisonsInterBudgets } from '@/components/cofieple/LiaisonsInterBudgets';
import { IndicateursGreta } from '@/components/cofieple/IndicateursGreta';
import { IndicateursCfa } from '@/components/cofieple/IndicateursCfa';
import { IndicateursSrh } from '@/components/cofieple/IndicateursSrh';
import { PerimetreComptable } from '@/components/cofieple/PerimetreComptable';
import { VueConsolidee } from '@/components/cofieple/VueConsolidee';
import { RapportImpression } from '@/components/rapport/RapportImpression';
import {
  OrdoS1Presentation, OrdoS2TableauBord, OrdoS3ExecFonctionnement,
  OrdoS4ExecRecettes, OrdoS5Pilotage, OrdoS6SRH, OrdoS7VieEleve,
  OrdoS8Viabilisation, OrdoS9ActivitesPeda, OrdoS10Creances,
  OrdoS11Resultat, OrdoS12Perspectives, OrdoS13Signatures,
} from '@/components/cofieple/ordo';
import {
  Home, Upload, ScrollText, Eye, ShieldCheck, AlertTriangle,
  History, PenTool, Bot, Gauge, Link2, GraduationCap, UtensilsCrossed,
  Layers, Landmark, BookOpen, Monitor, Building2, FileText, Shield,
  Search, ClipboardList, BarChart3, Printer,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
type MainTab = 'utils' | 'ordo' | 'ac';

interface NavItem {
  id: string; label: string; icon: React.ReactNode;
  badge?: string; badgeType?: 'error' | 'warning' | 'success' | 'info';
  requiresData?: boolean;
}

// ── Ordonnateur sub-sections ─────────────────────────────────────
const ORDO_SECTIONS: NavItem[] = [
  { id: 'ordo_s1', label: 'S1 Présentation', icon: <Home className="h-4 w-4" /> },
  { id: 'ordo_s2', label: 'S2 Tableau de bord', icon: <BarChart3 className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s3', label: 'S3 Dépenses', icon: <FileText className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s4', label: 'S4 Recettes', icon: <FileText className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s5', label: 'S5 Pilotage', icon: <Search className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s6', label: 'S6 SRH', icon: <UtensilsCrossed className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s7', label: 'S7 Vie élève', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'ordo_s8', label: 'S8 Énergie', icon: <Building2 className="h-4 w-4" /> },
  { id: 'ordo_s9', label: 'S9 Act. péda.', icon: <BookOpen className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s10', label: 'S10 Créances', icon: <AlertTriangle className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s11', label: 'S11 Résultat', icon: <ClipboardList className="h-4 w-4" />, requiresData: true },
  { id: 'ordo_s12', label: 'S12 Perspectives', icon: <PenTool className="h-4 w-4" /> },
  { id: 'ordo_s13', label: 'S13 Signatures', icon: <Shield className="h-4 w-4" /> },
];

const CompteFinancier = () => {
  const { selectedEstablishment } = useEstablishment();
  const switchEstablishment = useCofiepleStore(s => s.switchEstablishment);
  const syncFromBackend = useCofiepleStore(s => s.syncFromBackend);
  const setEtablissement = useCofiepleStore(s => s.setEtablissement);
  const activeTab = useCofiepleStore(s => s.activeTab);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const fichiers = useCofiepleStore(s => s.fichierCharge);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const budgets = useCofiepleStore(s => s.budgets);
  const resultats = useCofiepleStore(s => s.resultats);
  const etab = useCofiepleStore(s => s.etablissement);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);

  // ── Main tab state ─────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('utils');

  useEffect(() => {
    if (selectedEstablishment?.id) {
      switchEstablishment(selectedEstablishment.id).then(() => {
        setEtablissement({
          uai: selectedEstablishment.uai,
          nom: selectedEstablishment.name,
          type: selectedEstablishment.type,
          academie: selectedEstablishment.academy,
          commune: selectedEstablishment.city,
        });
        syncFromBackend();
      });
    }
  }, [selectedEstablishment?.id, switchEstablishment, syncFromBackend, setEtablissement]);

  const nbFichiers = Object.values(fichiers).filter(Boolean).length;
  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const hasBA = budgets.some(b => b.type !== 'principal');
  const hasData = !!resultats[activeBudget] || !!resultats.principal;
  const hasConsolidation = hasData && Object.values(resultats).filter(Boolean).length >= 2;

  // ── Utility tabs (non-rapport) ──────────────────────────────────
  const utilItems: NavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="h-4 w-4" /> },
    { id: 'import', label: 'Imports', icon: <Upload className="h-4 w-4" />, badge: `${nbFichiers}`, badgeType: nbFichiers >= 3 ? 'success' : 'info' },
    { id: 'journal', label: 'Journal', icon: <ScrollText className="h-4 w-4" /> },
    { id: 'vue_ensemble', label: 'Vue d\'ensemble', icon: <Eye className="h-4 w-4" />, requiresData: true },
    { id: 'controles', label: 'Contrôles', icon: <ShieldCheck className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? '🔴' : nbAnom > 0 ? '🟠' : '🟢') : undefined },
    { id: 'points_bloquants', label: 'Bloquants', icon: <AlertTriangle className="h-4 w-4" />, requiresData: true,
      badge: hasData ? (nbBloq > 0 ? `${nbBloq}` : '0') : undefined, badgeType: nbBloq > 0 ? 'error' : 'success' },
    { id: 'ratios', label: 'Ratios', icon: <Gauge className="h-4 w-4" />, requiresData: true },
    { id: 'pluriannuel', label: 'N à N-4', icon: <History className="h-4 w-4" /> },
    { id: 'indicateurs', label: 'Indicateurs', icon: <PenTool className="h-4 w-4" /> },
    { id: 'analyse_ia', label: 'Analyse IA', icon: <Bot className="h-4 w-4" />, requiresData: true },
    { id: 'budget_annexe', label: 'BA', icon: <Building2 className="h-4 w-4" />, badge: hasBA ? 'BA' : undefined, badgeType: 'info' },
    { id: 'liaisons_185', label: 'C/185', icon: <Link2 className="h-4 w-4" />, requiresData: true },
    ...(budgets.some(b => b.type === 'annexe_greta') ? [{ id: 'greta', label: 'GRETA', icon: <GraduationCap className="h-4 w-4" /> }] : []),
    ...(budgets.some(b => b.type === 'annexe_cfa') ? [{ id: 'cfa', label: 'CFA', icon: <BookOpen className="h-4 w-4" /> }] : []),
    ...(budgets.some(b => b.type === 'annexe_autre') ? [{ id: 'srh', label: 'SRH', icon: <UtensilsCrossed className="h-4 w-4" /> }] : []),
    ...(hasConsolidation ? [{ id: 'vue_consolidee', label: 'Consolidé', icon: <Layers className="h-4 w-4" />, requiresData: true }] : []),
    { id: 'document_ca', label: 'Doc. CA', icon: <Landmark className="h-4 w-4" />, requiresData: true },
    { id: 'annexe', label: 'Annexe', icon: <BookOpen className="h-4 w-4" />, requiresData: true },
    { id: 'diaporama', label: 'Diaporama', icon: <Monitor className="h-4 w-4" />, requiresData: true },
  ];

  // ── AC sub-sections (existing) ──────────────────────────────────
  const acItems: NavItem[] = [
    { id: 'rapport_ac', label: 'Rapport complet', icon: <Shield className="h-4 w-4" />, requiresData: true },
    { id: 'superviseur', label: 'Superviseur', icon: <Search className="h-4 w-4" />, requiresData: true },
    { id: 'synthese', label: 'Synthèse', icon: <ClipboardList className="h-4 w-4" />, requiresData: true },
    { id: 'tableaux', label: 'Tableaux', icon: <BarChart3 className="h-4 w-4" />, requiresData: true },
  ];

  const badgeColors: Record<string, string> = {
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    success: 'bg-emerald-600 text-white',
    info: 'bg-primary text-primary-foreground',
  };

  // ── Current sub-nav items ───────────────────────────────────────
  const currentSubItems = mainTab === 'ordo' ? ORDO_SECTIONS
    : mainTab === 'ac' ? acItems
    : utilItems;

  // ── Ensure activeTab is valid for current main tab ──────────────
  useEffect(() => {
    const validIds = currentSubItems.map(i => i.id);
    if (!validIds.includes(activeTab)) {
      setActiveTab(currentSubItems[0]?.id || 'accueil');
    }
  }, [mainTab]);

  const renderSection = () => {
    switch (activeTab) {
      // Utility tabs
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
      case 'srh': return <IndicateursSrh />;
      case 'vue_consolidee': return <VueConsolidee />;
      case 'document_ca': return <DocumentCASection />;
      case 'rapport_ac': return <RapportACSection />;
      case 'annexe': return <AnnexeComptableSection />;
      case 'diaporama': return <DiaporamaSection />;
      // Ordonnateur sections
      case 'ordo_s1': return <OrdoS1Presentation />;
      case 'ordo_s2': return <OrdoS2TableauBord />;
      case 'ordo_s3': return <OrdoS3ExecFonctionnement />;
      case 'ordo_s4': return <OrdoS4ExecRecettes />;
      case 'ordo_s5': return <OrdoS5Pilotage />;
      case 'ordo_s6': return <OrdoS6SRH />;
      case 'ordo_s7': return <OrdoS7VieEleve />;
      case 'ordo_s8': return <OrdoS8Viabilisation />;
      case 'ordo_s9': return <OrdoS9ActivitesPeda />;
      case 'ordo_s10': return <OrdoS10Creances />;
      case 'ordo_s11': return <OrdoS11Resultat />;
      case 'ordo_s12': return <OrdoS12Perspectives />;
      case 'ordo_s13': return <OrdoS13Signatures />;
      default: return <AccueilSection />;
    }
  };

  return (
    <>
      <div className="space-y-0 no-print-wrapper">
        {/* Header COFIEPLE */}
        <div className="bg-gradient-to-r from-[hsl(222,30%,14%)] to-[hsl(222,25%,20%)] shadow-xl rounded-xl no-print">
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-warning flex items-center justify-center text-2xl font-black text-white shadow-lg">₣</div>
              <div>
                <h1 className="text-xl font-black text-white tracking-wide">COFIEPLE</h1>
                <p className="text-xs text-warning font-medium tracking-widest uppercase">Compte Financier EPLE · M9-6 2026</p>
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
        <div className="no-print"><ProgressStepper /></div>

        {/* Périmètre Comptable */}
        {(hasData || nbFichiers > 0) && (
          <div className="mx-1 mt-2 no-print"><PerimetreComptable /></div>
        )}

        {/* Banner Budget Annexe */}
        {hasData && activeBudget !== 'principal' && resultats[activeBudget] && (() => {
          const bal = balance?.[activeBudget] || [];
          const c185 = bal.find((l: any) => l.compte?.startsWith('185'));
          const solde185 = c185 ? (c185.solDbt - c185.solCrd) : 0;
          return (
            <div className="mx-1 mt-2 no-print">
              <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-warning">ℹ️ BUDGET ANNEXE — Mode de calcul adapté (M9-6 §2.1.2.3.2)</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Compte 185000 — solde débiteur : <span className="font-semibold text-warning">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(solde185)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════ MAIN TAB SELECTOR ═══════ */}
        <div className="bg-[hsl(222,30%,12%)] rounded-t-xl mt-2 no-print">
          <div className="flex gap-1 px-3 pt-2">
            {[
              { key: 'utils' as MainTab, label: '🛠️ Outils', desc: 'Import, contrôles, indicateurs' },
              { key: 'ordo' as MainTab, label: '📋 Rapport Ordonnateur', desc: '13 sections M9-6' },
              { key: 'ac' as MainTab, label: '📊 Rapport Agent Comptable', desc: 'Analyse comptable' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all duration-200 ${
                  mainTab === tab.key
                    ? 'bg-[hsl(222,25%,18%)] text-warning border-b-2 border-warning shadow-sm'
                    : 'text-[hsl(220,15%,50%)] hover:text-[hsl(220,15%,70%)] hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className="hidden lg:inline text-[10px] ml-1.5 opacity-60">— {tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ SUB-NAVIGATION ═══════ */}
        <nav className="bg-[hsl(222,25%,18%)] border-b border-[hsl(222,25%,24%)] sticky top-0 z-40 no-print">
          <div className="px-2">
            <div className="flex overflow-x-auto scrollbar-hide">
              {currentSubItems.map(item => {
                const active = activeTab === item.id;
                const disabled = item.requiresData && !hasData;
                return (
                  <button
                    key={item.id}
                    onClick={() => !disabled && setActiveTab(item.id)}
                    disabled={disabled}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 shrink-0 rounded-t-lg ${
                      active ? 'border-warning bg-warning text-warning-foreground ring-2 ring-warning/40 shadow-sm font-extrabold' :
                      disabled ? 'border-transparent text-[hsl(222,15%,35%)] cursor-not-allowed' :
                      'border-transparent text-[hsl(220,15%,55%)] hover:text-[hsl(220,15%,80%)] hover:bg-white/5'
                    }`}
                    title={disabled ? 'Importez d\'abord les données CSV' : item.label}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-warning-foreground shrink-0" aria-hidden="true" />}
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

        {/* Print button for Rapport Ordonnateur */}
        {mainTab === 'ordo' && hasData && (
          <div className="flex justify-end px-5 pt-4 pb-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-warning text-warning-foreground hover:bg-warning/90 shadow-md transition-all duration-200"
            >
              <Printer className="h-4 w-4" />
              Imprimer le rapport
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {renderSection()}
        </div>
      </div>

      <RapportImpression />
    </>
  );
};

export default CompteFinancier;
