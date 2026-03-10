// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Annexe Comptable « Mode Preuve & Analyse Juridique »
// Destination : Rectorat (Dém'act) + Juge des comptes (Infocentre)
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bot, Loader2, Printer, FileText, Users, Building, Sparkles,
  TrendingUp, AlertTriangle, Activity, Landmark, Scale, BookOpen,
  ArrowRight, Info, Lightbulb, BarChart3, CheckCircle2, Search,
  Shield, Eye, Table2, ArrowDown, ArrowUp, Minus, ChevronRight,
  ShieldAlert, Download, Lock, Unlock, FileWarning
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart,
  ReferenceLine
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
interface AnnexeTexts {
  presentation: string; execution: string; patrimoine: string;
  srh: string; perspectives: string;
  restesARecouvrer: string; reserves: string; tresorerie: string;
}

interface ContexteQualif {
  changementOrdonnateur: string; changementGestionnaire: string;
  mouvementsAgence: string; evenementsMarquants: string;
  travauxImportants: string; reformesPedagogiques: string; difficultes: string;
}

interface AuditAnomaly {
  id: string;
  compte: string;
  intitule: string;
  type: 'solde_atypique' | 'amort_manquant' | 'coherence' | 'provision_absente' | 'amort_28_68' | 'anciennete_cl4' | 'unite_caisse';
  severity: 'bloquant' | 'anomalie';
  description: string;
  refM96: string;
  justification: string;
  annexeTarget?: keyof AnnexeTexts; // Section de l'annexe où injecter la justification
  drilldownPrefix?: string; // Préfixe pour le drill-down Grand Livre
}

// ── Onglets « Preuve & Contrôle » ────────────────────────────
const ANNEXE_TABS = [
  { id: 'autoAudit', label: 'Auto-Audit', icon: <ShieldAlert className="h-4 w-4" /> },
  { id: 'activite', label: 'Activité & Contexte', icon: <Activity className="h-4 w-4" /> },
  { id: 'equilibre', label: 'Équilibre Financier', icon: <Scale className="h-4 w-4" /> },
  { id: 'patrimoine', label: 'Patrimoine & Tiers', icon: <Landmark className="h-4 w-4" /> },
  { id: 'financement', label: 'Tableau de Financement', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'etats', label: 'États Réglementaires', icon: <Table2 className="h-4 w-4" /> },
  { id: 'pisteAudit', label: 'Piste d\'Audit', icon: <Search className="h-4 w-4" /> },
  { id: 'perspectives', label: 'Perspectives', icon: <Sparkles className="h-4 w-4" /> },
] as const;

const ALL_SECTIONS = ['presentation', 'execution', 'patrimoine', 'srh', 'perspectives', 'restesARecouvrer', 'reserves', 'tresorerie'] as const;

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  presentation: { label: 'I. Présentation générale', icon: <Building className="h-4 w-4" /> },
  execution: { label: 'II. Exécution budgétaire', icon: <TrendingUp className="h-4 w-4" /> },
  patrimoine: { label: 'III. Situation patrimoniale', icon: <FileText className="h-4 w-4" /> },
  srh: { label: 'IV. SRH & Viabilisation', icon: <Users className="h-4 w-4" /> },
  perspectives: { label: 'V. Perspectives', icon: <Sparkles className="h-4 w-4" /> },
  restesARecouvrer: { label: 'Note : Restes à recouvrer (Cl. 4)', icon: <Search className="h-4 w-4" /> },
  reserves: { label: 'Note : Utilisation des réserves', icon: <Landmark className="h-4 w-4" /> },
  tresorerie: { label: 'Note : Trésorerie & Unité de caisse', icon: <Shield className="h-4 w-4" /> },
};

const COLORS = {
  primary: 'hsl(215, 70%, 45%)', success: 'hsl(160, 45%, 45%)',
  warning: 'hsl(38, 92%, 50%)', purple: 'hsl(280, 50%, 50%)',
  danger: 'hsl(0, 70%, 50%)', muted: 'hsl(215, 15%, 70%)',
  teal: 'hsl(185, 60%, 40%)', indigo: 'hsl(240, 50%, 55%)',
};

const DONUT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.danger, COLORS.teal, COLORS.indigo, COLORS.muted];

export function AnnexeComptableSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const budgets = useCofiepleStore(s => s.budgets);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const anomaliesBalance = useCofiepleStore(s => s.anomaliesBalance);
  const R = resultats[activeBudget];

  const [activeAnnexeTab, setActiveAnnexeTab] = useState('autoAudit');
  const [texts, setTexts] = useState<AnnexeTexts>({
    presentation: '', execution: '', patrimoine: '', srh: '', perspectives: '',
    restesARecouvrer: '', reserves: '', tresorerie: '',
  });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [contexte, setContexte] = useState<ContexteQualif>({
    changementOrdonnateur: '', changementGestionnaire: '', mouvementsAgence: '',
    evenementsMarquants: '', travauxImportants: '', reformesPedagogiques: '', difficultes: '',
  });
  const [indicators, setIndicators] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedEtab, setSelectedEtab] = useState<string>('principal');
  const [drilldownCompte, setDrilldownCompte] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'isolé' | 'consolidé'>('isolé');
  const [auditAnomalies, setAuditAnomalies] = useState<AuditAnomaly[]>([]);
  const [auditValidated, setAuditValidated] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const completedSections = useMemo(() => {
    return Object.values(texts).filter(t => t.length > 0).length;
  }, [texts]);
  const progressPct = Math.round((completedSections / ALL_SECTIONS.length) * 100);

  // Load indicators and history
  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const uid = session.session.user.id;
        const [indRes, histRes] = await Promise.all([
          supabase.from('cofieple_extra_indicators').select('*')
            .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', uid).maybeSingle(),
          supabase.from('cofieple_exercises').select('*')
            .eq('uai', etab.uai).eq('user_id', uid)
            .order('exercice', { ascending: false }).limit(5),
        ]);
        if (indRes.data) setIndicators(indRes.data);
        if (histRes.data) setHistory(histRes.data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  // ── AUTO-AUDIT: scan balance for anomalies ─────────────────
  const balanceData = useMemo(() => balance[activeBudget] || [], [balance, activeBudget]);

  const balance1Data = useMemo(() => balance[activeBudget === 'principal' ? 'principal' : activeBudget] || [], [balance, activeBudget]);
  // We use balance1 (N-1) from the store for aging analysis
  const balance1Store = useCofiepleStore(s => s.balance1);
  const balance1DataN1 = useMemo(() => balance1Store[activeBudget] || [], [balance1Store, activeBudget]);

  useEffect(() => {
    if (!R || balanceData.length === 0) return;
    const anomalies: AuditAnomaly[] = [];
    let idx = 0;

    // 1. Soldes atypiques from store anomalies
    anomaliesBalance
      .filter(a => a.anomalie && (a.gravite === 'bloquant' || a.gravite === 'anomalie'))
      .forEach(a => {
        anomalies.push({
          id: `sol_${idx++}`,
          compte: a.compte, intitule: a.intitule,
          type: 'solde_atypique', severity: a.gravite === 'bloquant' ? 'bloquant' : 'anomalie',
          description: `Solde ${a.sensAttendu === 'débiteur' ? 'créditeur' : 'débiteur'} anormal. ${a.conseqM96}`,
          refM96: a.conseqM96.includes('§') ? a.conseqM96.split('(').pop()?.replace(')', '') || 'M9-6' : 'M9-6 Plan comptable',
          justification: '',
          annexeTarget: 'patrimoine',
          drilldownPrefix: a.compte.substring(0, 3),
        });
      });

    // 2. Amortissements non pratiqués sur immobilisations neuves
    const immoNeuves = balanceData.filter((b: any) =>
      b.compte?.startsWith('2') && !b.compte?.startsWith('28') && !b.compte?.startsWith('29') &&
      (b.dbt || 0) > 0 && (b.solDbt || 0) > 0
    );
    immoNeuves.forEach((immo: any) => {
      const cpteAmort = '28' + immo.compte.substring(1, 4);
      const hasAmort = balanceData.some((b: any) =>
        b.compte?.startsWith(cpteAmort) && ((b.crd || 0) > 0)
      );
      if (!hasAmort && !immo.compte.startsWith('23') && !immo.compte.startsWith('27')) {
        anomalies.push({
          id: `amort_${idx++}`,
          compte: immo.compte, intitule: immo.intituleReduit || '',
          type: 'amort_manquant', severity: 'bloquant',
          description: `Immobilisation au débit (${formatEur(immo.solDbt || 0)}) sans dotation aux amortissements correspondante (${cpteAmort}*). L'absence d'amortissement fausse le bilan et le résultat.`,
          refM96: 'M9-6 § III.3',
          justification: '',
          annexeTarget: 'patrimoine',
          drilldownPrefix: immo.compte.substring(0, 3),
        });
      }
    });

    // 3. Créances douteuses sans provision
    const creancesDouteuses = balanceData.filter((b: any) =>
      b.compte?.startsWith('416') && (b.solDbt || 0) > 0
    );
    const provisionsSolde = balanceData.filter((b: any) =>
      b.compte?.startsWith('491') && (b.solCrd || 0) > 0
    ).reduce((s: number, b: any) => s + (b.solCrd || 0), 0);

    if (creancesDouteuses.length > 0 && provisionsSolde === 0) {
      const totalDouteux = creancesDouteuses.reduce((s: number, b: any) => s + (b.solDbt || 0), 0);
      anomalies.push({
        id: `prov_${idx++}`,
        compte: '416/491', intitule: 'Créances douteuses / Provisions',
        type: 'provision_absente', severity: 'bloquant',
        description: `Créances douteuses (416) de ${formatEur(totalDouteux)} sans aucune provision (491*). Obligation de provisionner selon M9-6 § V.4.`,
        refM96: 'M9-6 § V.4',
        justification: '',
        annexeTarget: 'restesARecouvrer',
        drilldownPrefix: '416',
      });
    }

    // 4. Cohérence FDR = BFR + Trésorerie
    const ecartFdr = Math.abs((R.fdrComptable || 0) - (R.bfr || 0) - (R.tresorerieNette || 0));
    if (ecartFdr > 1) {
      anomalies.push({
        id: `coh_${idx++}`,
        compte: 'Global', intitule: 'Cohérence FDR/BFR/Trésorerie',
        type: 'coherence', severity: ecartFdr > 100 ? 'bloquant' : 'anomalie',
        description: `Écart de ${formatEur(ecartFdr)} dans l'équation FDR (${formatEur(R.fdrComptable)}) ≠ BFR (${formatEur(R.bfr)}) + Trésorerie (${formatEur(R.tresorerieNette)}). Vérifier les écritures d'inventaire.`,
        refM96: 'M9-6 § III.1',
        justification: '',
        annexeTarget: 'patrimoine',
      });
    }

    // ═══ 5. COHÉRENCE AMORTISSEMENTS 28/68 ═══
    // Le total des dotations au bilan (crédit 28*) doit correspondre
    // au total des charges (débit 68*) sauf sorties d'actifs (cessions/mises au rebut)
    const totalDotBilan28 = balanceData
      .filter((b: any) => b.compte?.startsWith('28'))
      .reduce((s: number, b: any) => s + (b.crd || 0), 0);
    const totalDotResultat68 = balanceData
      .filter((b: any) => b.compte?.startsWith('68'))
      .reduce((s: number, b: any) => s + (b.dbt || 0), 0);
    const sortiesActifs = balanceData
      .filter((b: any) => b.compte?.startsWith('28') && (b.dbt || 0) > 0)
      .reduce((s: number, b: any) => s + (b.dbt || 0), 0);
    const ecartAmort = Math.abs(totalDotBilan28 - sortiesActifs - totalDotResultat68);
    if (ecartAmort > 10 && (totalDotBilan28 > 0 || totalDotResultat68 > 0)) {
      anomalies.push({
        id: `amort28_68_${idx++}`,
        compte: '28*/68*', intitule: 'Cohérence Amortissements Bilan / Résultat',
        type: 'amort_28_68', severity: 'bloquant',
        description: `Écart de ${formatEur(ecartAmort)} entre les dotations au bilan (Crédit 28* = ${formatEur(totalDotBilan28)}, hors sorties ${formatEur(sortiesActifs)}) et les charges d'amortissement au résultat (Débit 68* = ${formatEur(totalDotResultat68)}). L'écart ne correspond pas aux sorties d'actifs.`,
        refM96: 'M9-6 § III.3 / § IV.3',
        justification: '',
        annexeTarget: 'patrimoine',
        drilldownPrefix: '28',
      });
    }

    // ═══ 6. ANCIENNETÉ CLASSE 4 (411, 416) ═══
    // Identifie les soldes 411/416 qui n'ont pas bougé depuis N-1
    // (antérieur > 0 mais aucun mouvement en N)
    const comptesAnciens = balanceData.filter((b: any) => {
      if (!b.compte?.startsWith('411') && !b.compte?.startsWith('416')) return false;
      const solde = (b.solDbt || 0) - (b.solCrd || 0);
      if (solde <= 0) return false;
      // Pas de mouvement en N : débit et crédit = 0
      const pasMouvement = (b.dbt || 0) === 0 && (b.crd || 0) === 0;
      // Ou vérifier via la balance N-1 si disponible
      if (pasMouvement) return true;
      // Si balance N-1 disponible, vérifier que le solde est identique
      if (balance1DataN1.length > 0) {
        const compteN1 = balance1DataN1.find((bn1: any) => bn1.compte === b.compte);
        if (compteN1) {
          const soldeN1 = (compteN1.solDbt || 0) - (compteN1.solCrd || 0);
          if (Math.abs(solde - soldeN1) < 1 && soldeN1 > 0) return true;
        }
      }
      return false;
    });

    comptesAnciens.forEach((b: any) => {
      anomalies.push({
        id: `ancien_${idx++}`,
        compte: b.compte, intitule: b.intituleReduit || '',
        type: 'anciennete_cl4', severity: 'anomalie',
        description: `Solde débiteur de ${formatEur((b.solDbt || 0) - (b.solCrd || 0))} inchangé depuis N-1. Créance non mouvementée — absence de diligences de recouvrement ou créance à admettre en non-valeur.`,
        refM96: 'M9-6 § V.4',
        justification: '',
        annexeTarget: 'restesARecouvrer',
        drilldownPrefix: b.compte.substring(0, 3),
      });
    });

    // ═══ 7. UNITÉ DE CAISSE — Cohérence compte 515 (Trésor) ═══
    const cpte515 = balanceData.filter((b: any) => b.compte?.startsWith('515'));
    const solde515 = cpte515.reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);
    const cpte512 = balanceData.filter((b: any) => b.compte?.startsWith('512'));
    const solde512 = cpte512.reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);
    const cpte531 = balanceData.filter((b: any) => b.compte?.startsWith('531'));
    const solde531 = cpte531.reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);
    const totalDispo = solde515 + solde512 + solde531;
    
    // Vérification : pas de fonds hors comptabilité (comptes 46* avec solde anormal)
    const fonds46 = balanceData.filter((b: any) => b.compte?.startsWith('46'));
    const soldeFonds46 = fonds46.reduce((s: number, b: any) => s + Math.abs((b.solDbt || 0) - (b.solCrd || 0)), 0);
    
    if (solde515 < 0) {
      anomalies.push({
        id: `caisse_515_${idx++}`,
        compte: '515', intitule: 'Compte Trésor Public',
        type: 'unite_caisse', severity: 'bloquant',
        description: `Le compte 515 (Trésor) présente un solde créditeur de ${formatEur(Math.abs(solde515))}. Le compte au Trésor ne peut être débiteur que dans des cas exceptionnels (avances). Vérifier la concordance avec le relevé DFT et l'absence d'opérations de trésorerie non comptabilisées.`,
        refM96: 'M9-6 § IV.2 / RGCP Art. 28',
        justification: '',
        annexeTarget: 'tresorerie',
        drilldownPrefix: '515',
      });
    }
    if (soldeFonds46 > 5000) {
      anomalies.push({
        id: `fonds46_${idx++}`,
        compte: '46*', intitule: 'Fonds de tiers',
        type: 'unite_caisse', severity: 'anomalie',
        description: `Soldes sur comptes de tiers (46*) de ${formatEur(soldeFonds46)}. Vérifier la régularité de ces fonds et le respect du principe d'unité de caisse. Aucun fonds ne doit être détenu hors de la comptabilité de l'EPLE.`,
        refM96: 'RGCP Art. 47 / M9-6 § V.6',
        justification: '',
        annexeTarget: 'tresorerie',
        drilldownPrefix: '46',
      });
    }

    setAuditAnomalies(anomalies);
    setAuditValidated(anomalies.filter(a => a.severity === 'bloquant').length === 0);
  }, [R, balanceData, anomaliesBalance, balance1DataN1]);

  const blockingAnomalies = useMemo(() => auditAnomalies.filter(a => a.severity === 'bloquant'), [auditAnomalies]);
  const unjustifiedBlocking = useMemo(() => blockingAnomalies.filter(a => !a.justification.trim()), [blockingAnomalies]);
  const canGenerateAnnexe = unjustifiedBlocking.length === 0;

  const buildContextString = useCallback(() => {
    return Object.entries(contexte)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          changementOrdonnateur: 'Changement d\'ordonnateur',
          changementGestionnaire: 'Changement de gestionnaire',
          mouvementsAgence: 'Mouvements agence comptable',
          evenementsMarquants: 'Événements marquants',
          travauxImportants: 'Travaux importants',
          reformesPedagogiques: 'Réformes pédagogiques',
          difficultes: 'Difficultés logistiques',
        };
        return `${labels[k] || k} : ${v}`;
      }).join(' | ');
  }, [contexte]);

  const getComptesForPrefix = useCallback((prefix: string) => {
    return balanceData.filter((b: any) => b.compte?.startsWith(prefix)).map((b: any) => ({
      compte: b.compte, intitule: b.intituleReduit || b.intitule || '',
      debit: b.dbt || 0, credit: b.crd || 0,
      soldeDebit: b.solDbt || 0, soldeCredit: b.solCrd || 0,
      soldeNet: (b.solDbt || 0) - (b.solCrd || 0),
    }));
  }, [balanceData]);

  // ── Regulatory tables from balance ─────────────────────────
  const amortissementsTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.startsWith('28'))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        antDbt: b.antDbt || 0, antCrd: b.antCrd || 0,
        dbt: b.dbt || 0, crd: b.crd || 0,
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        isAtypical: (b.solDbt || 0) > 0,
      }));
  }, [balanceData]);

  const provisionsTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.startsWith('14') || b.compte?.startsWith('15') || b.compte?.startsWith('39') || b.compte?.startsWith('49'))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        antCrd: b.antCrd || 0, dotation: b.crd || 0, reprise: b.dbt || 0,
        solCrd: b.solCrd || 0,
        isAtypical: (b.solDbt || 0) > (b.solCrd || 0),
      }));
  }, [balanceData]);

  const creancesTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.charAt(0) === '4' && (b.solDbt || 0) > 0)
      .sort((a: any, b: any) => (b.solDbt || 0) - (a.solDbt || 0))
      .slice(0, 20)
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        antDbt: b.antDbt || 0,
        isAncien: (b.antDbt || 0) > 0 && (b.dbt || 0) === 0,
        isAtypical: b.compte?.startsWith('416'),
      }));
  }, [balanceData]);

  const dettesTable = useMemo(() => {
    return balanceData
      .filter((b: any) => b.compte?.charAt(0) === '4' && (b.solCrd || 0) > 0)
      .sort((a: any, b: any) => (b.solCrd || 0) - (a.solCrd || 0))
      .slice(0, 20)
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solDbt: b.solDbt || 0, solCrd: b.solCrd || 0,
        isAtypical: (b.antCrd || 0) > 0 && (b.crd || 0) === 0,
      }));
  }, [balanceData]);

  // ── Tableau de Financement data ────────────────────────────
  const tableauFinancement = useMemo(() => {
    if (!R) return null;
    const prevYear = history.length >= 2 ? history[1] : null;

    // Emplois (utilisations du FRNG)
    const investissements = balanceData.filter((b: any) =>
      b.compte?.startsWith('2') && !b.compte?.startsWith('28') && !b.compte?.startsWith('29') &&
      (b.dbt || 0) > 0
    ).reduce((s: number, b: any) => s + (b.dbt || 0), 0);

    const remboursementDettes = balanceData.filter((b: any) =>
      (b.compte?.startsWith('16') || b.compte?.startsWith('17')) && (b.dbt || 0) > 0
    ).reduce((s: number, b: any) => s + (b.dbt || 0), 0);

    const chargesRepartir = balanceData.filter((b: any) =>
      b.compte?.startsWith('48') && (b.dbt || 0) > 0
    ).reduce((s: number, b: any) => s + (b.dbt || 0), 0);

    // Ressources
    const cafBudgetaire = R.cafBudgetaire || 0;
    const cessionImmo = balanceData.filter((b: any) =>
      b.compte?.startsWith('775') && (b.crd || 0) > 0
    ).reduce((s: number, b: any) => s + (b.crd || 0), 0);
    const subvInvest = balanceData.filter((b: any) =>
      (b.compte?.startsWith('131') || b.compte?.startsWith('138')) && (b.crd || 0) > 0
    ).reduce((s: number, b: any) => s + (b.crd || 0), 0);
    const emprunts = balanceData.filter((b: any) =>
      (b.compte?.startsWith('16') || b.compte?.startsWith('17')) && (b.crd || 0) > 0
    ).reduce((s: number, b: any) => s + (b.crd || 0), 0);

    const totalEmplois = investissements + remboursementDettes + chargesRepartir;
    const totalRessources = cafBudgetaire + cessionImmo + subvInvest + emprunts;
    const variationFrng = totalRessources - totalEmplois;

    return {
      emplois: [
        { label: 'Acquisitions d\'immobilisations', value: investissements, ref: 'Cptes 2* (hors 28, 29)' },
        { label: 'Remboursement de dettes', value: remboursementDettes, ref: 'Cptes 16, 17 (débit)' },
        { label: 'Charges à répartir', value: chargesRepartir, ref: 'Cpte 48 (débit)' },
      ],
      ressources: [
        { label: 'CAF budgétaire', value: cafBudgetaire, ref: 'M9-6 § IV.3' },
        { label: 'Cessions d\'immobilisations', value: cessionImmo, ref: 'Cpte 775' },
        { label: 'Subventions d\'investissement reçues', value: subvInvest, ref: 'Cptes 131, 138' },
        { label: 'Emprunts nouveaux', value: emprunts, ref: 'Cptes 16, 17 (crédit)' },
      ],
      totalEmplois, totalRessources, variationFrng,
      fdrN1: prevYear?.fdr || 0,
      fdrN: R.fdrComptable || 0,
    };
  }, [R, balanceData, history]);

  async function genererSection(sectionId: string) {
    if (!R) return;
    if (!canGenerateAnnexe && !auditValidated) {
      toast.error('Veuillez justifier toutes les anomalies bloquantes dans l\'onglet Auto-Audit avant de générer.');
      setActiveAnnexeTab('autoAudit');
      return;
    }
    setLoadingSection(sectionId);
    try {
      const balanceSummary = {
        cl4Debiteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solDbt || 0) > 0)
          .reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
        cl4Crediteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solCrd || 0) > 0)
          .reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
        cl5Solde: balanceData.filter((b: any) => b.compte?.charAt(0) === '5')
          .reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0),
        creancesDouteuses416: balanceData.filter((b: any) => b.compte?.startsWith('416'))
          .reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
        provisions: balanceData.filter((b: any) => b.compte?.startsWith('49'))
          .reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
      };

      const { data, error } = await supabase.functions.invoke('generate-annexe', {
        body: {
          section: sectionId, etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable, bfr: R.bfr, tresorerieNette: R.tresorerieNette,
            cafBudgetaire: R.cafBudgetaire, cafComptable: R.cafComptable,
            totalChargesReel: R.totalChargesReel, totalProduitsReel: R.totalProduitsReel,
            totalChargesPrev: R.totalChargesPrev, totalProduitsPrev: R.totalProduitsPrev,
            tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
            joursAutonomie: R.joursAutonomie, reserves: R.reserves,
            totalImmo: R.totalImmo, totalAmortissements: R.totalAmortissements,
          },
          balanceSummary,
          indicateurs: indicators, historique: history, contexte: buildContextString(),
        },
      });
      if (error) throw error;
      setTexts(prev => ({ ...prev, [sectionId]: data?.text || '' }));
      toast.success(`Section "${SECTION_META[sectionId]?.label}" générée`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération IA');
    }
    setLoadingSection(null);
  }

  async function genererTout() {
    if (!canGenerateAnnexe) {
      toast.error('Justifiez d\'abord les anomalies bloquantes dans l\'onglet Auto-Audit.');
      setActiveAnnexeTab('autoAudit');
      return;
    }
    for (const s of ALL_SECTIONS) {
      await genererSection(s);
    }
  }

  // ── EXPORT PDF DÉM'ACT ────────────────────────────────────
  async function exportDemact() {
    if (!R) return;
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      const addHeader = (pageNum: number) => {
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text(`Annexe au Compte Financier — ${etab.nom} — RNE ${etab.uai} — Ex. ${etab.exercice}`, margin, 8);
        doc.text(`Page ${pageNum}`, pageW - margin, 8, { align: 'right' });
        doc.setDrawColor(200);
        doc.line(margin, 10, pageW - margin, 10);
      };

      const addFooter = () => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text('M9-6 2026 — Décret n°2012-1246 (RGCP) — Document généré par COFIEPLE', margin, pageH - 5);
        doc.text(new Date().toLocaleDateString('fr-FR'), pageW - margin, pageH - 5, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
          addFooter();
          doc.addPage();
          addHeader(doc.getNumberOfPages());
          y = 18;
        }
      };

      // ── Page 1: Title page
      addHeader(1);
      y = 40;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('RÉPUBLIQUE FRANÇAISE', pageW / 2, y, { align: 'center' });
      y += 5;
      doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE', pageW / 2, y, { align: 'center' });
      y += 15;
      doc.setFontSize(18);
      doc.setTextColor(30);
      doc.text('ANNEXE AU COMPTE FINANCIER', pageW / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(12);
      doc.text(`Exercice ${etab.exercice}`, pageW / 2, y, { align: 'center' });
      y += 15;
      doc.setFontSize(11);
      doc.text(etab.nom || 'Établissement', pageW / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`RNE : ${etab.uai} — ${etab.academie || ''}`, pageW / 2, y, { align: 'center' });
      y += 6;
      doc.text(`${etab.commune || ''}`, pageW / 2, y, { align: 'center' });
      y += 15;
      doc.setFontSize(8);
      doc.text(`Ordonnateur : ${etab.ordonnateur || '—'}`, margin, y);
      doc.text(`Agent comptable : ${etab.agentComptable || '—'}`, pageW / 2, y);
      y += 12;

      // Index
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text('SOMMAIRE', margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(60);
      const chapters = [
        'I. Présentation générale',
        'II. Exécution budgétaire',
        'III. Situation patrimoniale et financière',
        'IV. SRH & Viabilisation',
        'V. Perspectives et recommandations',
        'Note : Restes à recouvrer',
        'Note : Utilisation des réserves',
        'Note : Trésorerie & Unité de caisse',
        'Tableau de financement',
        'États réglementaires',
        'Rapport Auto-Audit',
      ];
      chapters.forEach((ch, i) => {
        doc.text(`${ch}`, margin + 3, y);
        y += 5;
      });

      // ── Narrative sections
      const sectionOrder: (keyof AnnexeTexts)[] = ['presentation', 'execution', 'patrimoine', 'srh', 'perspectives', 'restesARecouvrer', 'reserves', 'tresorerie'];
      for (const sId of sectionOrder) {
        const text = texts[sId];
        if (!text) continue;
        addFooter();
        doc.addPage();
        addHeader(doc.getNumberOfPages());
        y = 18;
        const meta = SECTION_META[sId];
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.text(meta?.label || sId, margin, y);
        y += 8;
        doc.setFontSize(8.5);
        doc.setTextColor(50);
        const cleanText = text.replace(/[#*_]/g, '').replace(/\n\n+/g, '\n\n');
        const lines = doc.splitTextToSize(cleanText, pageW - 2 * margin);
        for (const line of lines) {
          checkNewPage(5);
          doc.text(line, margin, y);
          y += 4;
        }
      }

      // ── Tableau de financement
      if (tableauFinancement) {
        addFooter();
        doc.addPage();
        addHeader(doc.getNumberOfPages());
        y = 18;
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.text('Tableau de Financement — Emplois et Ressources du FRNG', margin, y);
        y += 3;

        autoTable(doc, {
          startY: y,
          head: [['Poste', 'Montant (€)', 'Référence']],
          body: [
            [{ content: 'RESSOURCES', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [230, 240, 250] } }],
            ...tableauFinancement.ressources.map(r => [r.label, formatEur(r.value), r.ref]),
            [{ content: `TOTAL RESSOURCES`, styles: { fontStyle: 'bold' } }, { content: formatEur(tableauFinancement.totalRessources), styles: { fontStyle: 'bold' } }, ''],
            [{ content: 'EMPLOIS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [250, 235, 230] } }],
            ...tableauFinancement.emplois.map(e => [e.label, formatEur(e.value), e.ref]),
            [{ content: `TOTAL EMPLOIS`, styles: { fontStyle: 'bold' } }, { content: formatEur(tableauFinancement.totalEmplois), styles: { fontStyle: 'bold' } }, ''],
            [{ content: `VARIATION DU FRNG`, styles: { fontStyle: 'bold' } }, { content: formatEur(tableauFinancement.variationFrng), styles: { fontStyle: 'bold', textColor: tableauFinancement.variationFrng >= 0 ? [0, 128, 0] : [200, 0, 0] } }, 'M9-6 § III.1'],
          ],
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
        });
      }

      // ── Auto-Audit report
      if (auditAnomalies.length > 0) {
        addFooter();
        doc.addPage();
        addHeader(doc.getNumberOfPages());
        y = 18;
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.text('Rapport Auto-Audit — Observations du comptable', margin, y);
        y += 3;

        autoTable(doc, {
          startY: y,
          head: [['Compte', 'Type', 'Sévérité', 'Description', 'Observation du comptable']],
          body: auditAnomalies.map(a => [
            a.compte, a.type.replace('_', ' '),
            a.severity === 'bloquant' ? 'BLOQUANT' : 'Anomalie',
            a.description.substring(0, 80) + (a.description.length > 80 ? '…' : ''),
            a.justification || '—',
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
          columnStyles: { 3: { cellWidth: 45 }, 4: { cellWidth: 40 } },
        });
      }

      // ── Signatures page
      addFooter();
      doc.addPage();
      addHeader(doc.getNumberOfPages());
      y = 50;
      doc.setFontSize(9);
      doc.setTextColor(50);
      doc.text(`Fait à ${etab.commune || '………………'},`, pageW / 2, y, { align: 'center' });
      y += 6;
      doc.text(`le ……… / ……… / ${etab.exercice + 1}`, pageW / 2, y, { align: 'center' });
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text('L\'ordonnateur', margin + 20, y, { align: 'center' });
      doc.text('L\'agent comptable', pageW - margin - 20, y, { align: 'center' });
      y += 25;
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(etab.ordonnateur || '……………………', margin + 20, y, { align: 'center' });
      doc.text(etab.agentComptable || '……………………', pageW - margin - 20, y, { align: 'center' });
      y += 5;
      doc.text('Signature et cachet', margin + 20, y, { align: 'center' });
      doc.text('Signature et cachet', pageW - margin - 20, y, { align: 'center' });

      addFooter();

      const filename = `Annexe_CF_${etab.uai}_${etab.exercice}.pdf`;
      doc.save(filename);
      toast.success(`PDF Dém'act exporté : ${filename}`);
    } catch (e: any) {
      toast.error('Erreur d\'export PDF : ' + (e.message || 'Erreur inconnue'));
    }
    setExportingPdf(false);
  }

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer l'annexe comptable réglementaire (M9-6 § V.3)." />;

  // ── Waterfall chart data (N-1 → N) ────────────────────────
  const prevYear = history.length >= 2 ? history[1] : null;
  const waterfallData = prevYear ? buildWaterfallData(prevYear, R) : [];
  const waterfallTresoData = prevYear ? [
    { name: `Tréso N-1`, value: prevYear.tresorerie, cumul: prevYear.tresorerie, type: 'base' },
    { name: 'Δ FDR', value: R.fdrComptable - (prevYear.fdr || 0), cumul: prevYear.tresorerie + (R.fdrComptable - (prevYear.fdr || 0)), type: (R.fdrComptable - (prevYear.fdr || 0)) >= 0 ? 'positive' : 'negative' },
    { name: 'Δ BFR', value: -((R.bfr || 0) - (prevYear.bfr || 0)), cumul: prevYear.tresorerie + (R.fdrComptable - (prevYear.fdr || 0)) - ((R.bfr || 0) - (prevYear.bfr || 0)), type: -((R.bfr || 0) - (prevYear.bfr || 0)) >= 0 ? 'positive' : 'negative' },
    { name: `Tréso N`, value: R.tresorerieNette, cumul: R.tresorerieNette, type: 'total' },
  ] : [];

  const trendData = history.length > 0
    ? [...history].reverse().map(h => ({
        exercice: h.exercice, FDR: h.fdr, BFR: h.bfr, Trésorerie: h.tresorerie, CAF: h.caf,
      }))
    : [];

  const chargesData = Object.entries(R.parService).map(([svc, d]: [string, any], i) => ({
    name: d.libelle || svc, value: d.chargesReel || 0, fill: DONUT_COLORS[i % DONUT_COLORS.length],
  })).filter(d => d.value > 0);

  const hasMultipleBudgets = budgets.length > 1;

  // ── Alert flags ─────────────────────────
  const alerts: { level: 'bloq' | 'warn' | 'info'; text: string; ref: string }[] = [];
  if (R.joursAutonomie < 30) alerts.push({ level: 'bloq', text: `Autonomie financière : ${Math.round(R.joursAutonomie)} jours (< 30 j)`, ref: 'M9-6 § IV.2' });
  if (R.fdrComptable < 0) alerts.push({ level: 'bloq', text: `FRNG négatif : ${formatEur(R.fdrComptable)}`, ref: 'M9-6 § III.1' });
  if (R.tauxExecCharges > 0 && R.tauxExecCharges < 0.80) alerts.push({ level: 'warn', text: `Taux exécution charges : ${(R.tauxExecCharges * 100).toFixed(1)}% (< 80%)`, ref: 'RGCP Art. 24' });

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="rounded-xl border-2 border-border bg-card p-5 print:border-0">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-primary/50 text-primary">
                Dém'act / Infocentre
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-muted-foreground/30">
                M9-6 2026
              </Badge>
              {!canGenerateAnnexe && (
                <Badge className="bg-destructive text-destructive-foreground text-[10px] gap-1">
                  <Lock className="h-3 w-3" /> {unjustifiedBlocking.length} anomalie{unjustifiedBlocking.length > 1 ? 's' : ''} non justifiée{unjustifiedBlocking.length > 1 ? 's' : ''}
                </Badge>
              )}
              {canGenerateAnnexe && blockingAnomalies.length > 0 && (
                <Badge className="bg-warning text-warning-foreground text-[10px] gap-1">
                  <Unlock className="h-3 w-3" /> Audit validé avec observations
                </Badge>
              )}
              {blockingAnomalies.length === 0 && auditAnomalies.length === 0 && (
                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Audit conforme
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Annexe au Compte Financier
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {etab.nom || 'Établissement'} — RNE {etab.uai} — Exercice {etab.exercice}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <Button onClick={genererTout} disabled={!!loadingSection || !canGenerateAnnexe} className="gap-2 font-bold">
              {loadingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Générer toutes les notes (IA)
            </Button>
            <Button variant="default" onClick={exportDemact} disabled={exportingPdf || !canGenerateAnnexe} className="gap-2 text-xs bg-primary">
              {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export Dém'act (PDF)
            </Button>
          </div>
        </div>

        {/* Progress + Alerts */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold shrink-0">Complétude</span>
          <Progress value={progressPct} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-mono shrink-0">{completedSections}/{ALL_SECTIONS.length}</span>
          {completedSections === ALL_SECTIONS.length && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        {alerts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((a, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${
                a.level === 'bloq' ? 'border-destructive/50 text-destructive bg-destructive/5' :
                a.level === 'warn' ? 'border-warning/50 text-warning bg-warning/5' :
                'border-primary/50 text-primary bg-primary/5'
              }`}>
                {a.level === 'bloq' ? '🚫' : '⚠️'} {a.text} — {a.ref}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Multi-establishment */}
      {hasMultipleBudgets && (
        <Card className="border-primary/20">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold">Vision :</span>
            <Button variant={viewMode === 'isolé' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('isolé')} className="text-xs">Isolée (Dém'act)</Button>
            <Button variant={viewMode === 'consolidé' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('consolidé')} className="text-xs">Consolidée (AC)</Button>
            <div className="border-l border-border pl-3 ml-2 flex gap-2">
              {budgets.map(b => (
                <Button key={b.type} variant={selectedEtab === b.type ? 'secondary' : 'ghost'} size="sm"
                  onClick={() => setSelectedEtab(b.type)} className="text-xs">{b.libelle}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ ONGLETS ═══ */}
      <Tabs value={activeAnnexeTab} onValueChange={setActiveAnnexeTab} className="space-y-4">
        <TabsList className="w-full h-auto flex-wrap bg-muted/30 p-1 rounded-lg gap-1">
          {ANNEXE_TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="flex-1 min-w-[100px] gap-1.5 text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'autoAudit' && blockingAnomalies.length > 0 && (
                <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  canGenerateAnnexe ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>{blockingAnomalies.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ TAB 0: AUTO-AUDIT ═══ */}
        <TabsContent value="autoAudit" className="space-y-5 mt-0">
          <Card className={`border-2 ${canGenerateAnnexe ? 'border-emerald-500/30' : 'border-destructive/30'}`}>
            <CardHeader className="py-3 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Scanner Auto-Audit — Contrôle de cohérence pré-annexe
                <Badge variant="outline" className="ml-auto text-[10px]">M9-6 § V.3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Le système analyse la balance pour détecter les anomalies de solde, les ruptures de cohérence et les obligations comptables non remplies.
                <strong className="text-foreground"> Les anomalies bloquantes doivent être justifiées</strong> avant toute génération de l'annexe.
              </p>

              {auditAnomalies.length === 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">Aucune anomalie détectée</p>
                  <p className="text-xs text-muted-foreground mt-1">La balance est cohérente. Vous pouvez procéder à la génération de l'annexe.</p>
                </div>
              )}

              {auditAnomalies.map((anomaly, idx) => (
                <div key={anomaly.id} className={`rounded-lg border p-4 space-y-3 ${
                  anomaly.severity === 'bloquant'
                    ? 'border-destructive/40 bg-destructive/5'
                    : 'border-warning/40 bg-warning/5'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {anomaly.severity === 'bloquant' ? (
                        <FileWarning className="h-5 w-5 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-bold ${
                          anomaly.severity === 'bloquant' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                        }`}>
                          {anomaly.severity === 'bloquant' ? 'BLOQUANT' : 'ANOMALIE'}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-foreground">{anomaly.compte}</span>
                        <span className="text-xs text-muted-foreground">{anomaly.intitule}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">{anomaly.refM96}</Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{anomaly.description}</p>
                    </div>
                  </div>

                  {anomaly.severity === 'bloquant' && (
                    <div className="ml-8">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                        <FileText className="h-3 w-3" />
                        Observations du comptable sur les soldes atypiques
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        value={anomaly.justification}
                        onChange={e => {
                          const val = e.target.value;
                          setAuditAnomalies(prev => prev.map(a =>
                            a.id === anomaly.id ? { ...a, justification: val } : a
                          ));
                        }}
                        placeholder="Justification obligatoire — Expliquez la cause de cette anomalie et les mesures prises ou prévues…"
                        className="text-xs min-h-[60px] bg-background"
                      />
                      {!anomaly.justification.trim() && (
                        <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Justification obligatoire pour débloquer la génération de l'annexe
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {auditAnomalies.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {blockingAnomalies.length} bloquante{blockingAnomalies.length > 1 ? 's' : ''} · {auditAnomalies.length - blockingAnomalies.length} anomalie{auditAnomalies.length - blockingAnomalies.length > 1 ? 's' : ''}
                  </div>
                  {canGenerateAnnexe ? (
                    <Badge className="bg-emerald-600 text-white gap-1">
                      <Unlock className="h-3 w-3" /> Génération autorisée
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive text-destructive-foreground gap-1">
                      <Lock className="h-3 w-3" /> {unjustifiedBlocking.length} justification{unjustifiedBlocking.length > 1 ? 's' : ''} manquante{unjustifiedBlocking.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 1: ACTIVITÉ & CONTEXTE ═══ */}
        <TabsContent value="activite" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Résultat" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📊" sub="Comptable" isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Cpte 1068" isText />
            <KPICard label="Autonomie" value={`${Math.round(R.joursAutonomie)} j`} color={R.joursAutonomie >= 30 ? 'green' : 'red'} icon="⏱️" sub={R.joursAutonomie >= 30 ? '≥ 30 j' : '< 30 j ⚠️'} isText />
            <KPICard label="CAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
          </div>

          <Card>
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Contexte & Justifications de ruptures
                <Badge variant="outline" className="ml-auto text-xs">Saisie libre</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Ces éléments justifient les ruptures de séries statistiques auprès du contrôleur rectoral et du juge.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ContextField label="Changement d'ordonnateur" value={contexte.changementOrdonnateur}
                  onChange={v => setContexte(p => ({ ...p, changementOrdonnateur: v }))} placeholder="Date et identité…" />
                <ContextField label="Changement de gestionnaire" value={contexte.changementGestionnaire}
                  onChange={v => setContexte(p => ({ ...p, changementGestionnaire: v }))} placeholder="Date et identité…" />
                <ContextField label="Mouvements agence comptable" value={contexte.mouvementsAgence}
                  onChange={v => setContexte(p => ({ ...p, mouvementsAgence: v }))} placeholder="Mutations, arrivées…" />
                <ContextField label="Événements marquants" value={contexte.evenementsMarquants}
                  onChange={v => setContexte(p => ({ ...p, evenementsMarquants: v }))} placeholder="Fusion, ouverture section…" />
                <ContextField label="Travaux importants" value={contexte.travauxImportants}
                  onChange={v => setContexte(p => ({ ...p, travauxImportants: v }))} placeholder="Nature, montant, impact…" />
                <ContextField label="Réformes pédagogiques" value={contexte.reformesPedagogiques}
                  onChange={v => setContexte(p => ({ ...p, reformesPedagogiques: v }))} placeholder="Impact budgétaire…" />
                <ContextField label="Difficultés" value={contexte.difficultes}
                  onChange={v => setContexte(p => ({ ...p, difficultes: v }))} className="lg:col-span-2" placeholder="Logistiques, sinistres…" />
              </div>
            </CardContent>
          </Card>

          <NarrativeSection sectionId="presentation" text={texts.presentation}
            onTextChange={v => setTexts(p => ({ ...p, presentation: v }))}
            onGenerate={() => genererSection('presentation')} loading={loadingSection === 'presentation'} />

          {indicators && indicators.effectif_eleves > 0 && (
            <Card>
              <CardHeader className="py-3 bg-muted/10">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Données hors-comptables
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ContextBadge label="Élèves" value={indicators.effectif_eleves} />
                  <ContextBadge label="DP" value={indicators.effectif_dp} />
                  <ContextBadge label="Internes" value={indicators.effectif_internes} />
                  <ContextBadge label="Boursiers" value={indicators.effectif_boursiers}
                    suffix={indicators.effectif_eleves > 0 ? ` (${((indicators.effectif_boursiers / indicators.effectif_eleves) * 100).toFixed(1)}%)` : ''} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB 2: ÉQUILIBRE FINANCIER ═══ */}
        <TabsContent value="equilibre" className="space-y-5 mt-0">
          {waterfallData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Graphique en cascade — Variation du FRNG (N-1 → N)
                  <Badge variant="outline" className="ml-auto text-[10px]">Waterfall Chart</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                    <Bar dataKey="invisible" stackId="stack" fill="transparent" />
                    <Bar dataKey="display" stackId="stack" radius={[3, 3, 0, 0]}>
                      {waterfallData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.type === 'total' || entry.type === 'base' ? COLORS.primary : entry.value >= 0 ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {waterfallTresoData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Cascade — Variation de la Trésorerie (N-1 → N)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={waterfallTresoData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {waterfallTresoData.map((entry, i) => (
                        <Cell key={i} fill={entry.type === 'base' || entry.type === 'total' ? COLORS.primary : entry.type === 'positive' ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taux d'exécution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-around p-4">
                <GaugeSimple label="Dépenses" value={Math.round((R.tauxExecCharges || 0) * 100)} color={COLORS.primary} />
                <GaugeSimple label="Recettes" value={Math.round((R.tauxExecProduits || 0) * 100)} color={COLORS.success} />
              </CardContent>
            </Card>
            {chargesData.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Structure des charges par service</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chargesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={45} outerRadius={80} fontSize={9}
                        label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`}>
                        {chargesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          <NarrativeSection sectionId="execution" text={texts.execution}
            onTextChange={v => setTexts(p => ({ ...p, execution: v }))}
            onGenerate={() => genererSection('execution')} loading={loadingSection === 'execution'} />
        </TabsContent>

        {/* ═══ TAB 3: PATRIMOINE & TIERS ═══ */}
        <TabsContent value="patrimoine" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="FRNG" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color={R.bfr <= 0 ? 'green' : 'amber'} icon="⚖️" sub="Besoin fonds roulement" isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} j`} isText />
            <KPICard label="Immo nettes" value={formatEur(R.totalImmo - R.totalAmortissements)} color="blue" icon="🏗️" sub="Valeur nette" isText />
          </div>

          {trendData.length > 1 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Évolution pluriannuelle — FRNG, BFR, Trésorerie, CAF</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gFDR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="exercice" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatEur(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="FDR" stroke={COLORS.primary} fill="url(#gFDR)" strokeWidth={2.5} dot={{ r: 4 }} name="FRNG" />
                    <Line type="monotone" dataKey="Trésorerie" stroke={COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="BFR" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="CAF" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <NarrativeSection sectionId="restesARecouvrer" text={texts.restesARecouvrer}
            onTextChange={v => setTexts(p => ({ ...p, restesARecouvrer: v }))}
            onGenerate={() => genererSection('restesARecouvrer')} loading={loadingSection === 'restesARecouvrer'} />
          <NarrativeSection sectionId="reserves" text={texts.reserves}
            onTextChange={v => setTexts(p => ({ ...p, reserves: v }))}
            onGenerate={() => genererSection('reserves')} loading={loadingSection === 'reserves'} />
          <NarrativeSection sectionId="tresorerie" text={texts.tresorerie}
            onTextChange={v => setTexts(p => ({ ...p, tresorerie: v }))}
            onGenerate={() => genererSection('tresorerie')} loading={loadingSection === 'tresorerie'} />
          <NarrativeSection sectionId="patrimoine" text={texts.patrimoine}
            onTextChange={v => setTexts(p => ({ ...p, patrimoine: v }))}
            onGenerate={() => genererSection('patrimoine')} loading={loadingSection === 'patrimoine'} />
        </TabsContent>

        {/* ═══ TAB 4: TABLEAU DE FINANCEMENT ═══ */}
        <TabsContent value="financement" className="space-y-5 mt-0">
          {tableauFinancement && (
            <>
              <Card>
                <CardHeader className="py-3 bg-muted/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Tableau de Financement — Emplois et Ressources du FRNG
                    <Badge variant="outline" className="ml-auto text-[10px]">M9-6 § III.1 — Juge des comptes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    {/* RESSOURCES */}
                    <div className="p-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                        <ArrowDown className="h-4 w-4" /> Ressources stables
                      </h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 text-left font-bold text-muted-foreground">Poste</th>
                            <th className="py-2 text-right font-bold text-muted-foreground">Montant</th>
                            <th className="py-2 text-right font-bold text-muted-foreground">Réf.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableauFinancement.ressources.map((r, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-2">{r.label}</td>
                              <td className="py-2 text-right font-mono font-semibold">{formatEur(r.value)}</td>
                              <td className="py-2 text-right text-muted-foreground text-[10px]">{r.ref}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-primary/5 font-bold border-t-2 border-primary/30">
                            <td className="py-2">TOTAL RESSOURCES</td>
                            <td className="py-2 text-right font-mono">{formatEur(tableauFinancement.totalRessources)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* EMPLOIS */}
                    <div className="p-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-destructive mb-3 flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" /> Emplois stables
                      </h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 text-left font-bold text-muted-foreground">Poste</th>
                            <th className="py-2 text-right font-bold text-muted-foreground">Montant</th>
                            <th className="py-2 text-right font-bold text-muted-foreground">Réf.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableauFinancement.emplois.map((e, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-2">{e.label}</td>
                              <td className="py-2 text-right font-mono font-semibold">{formatEur(e.value)}</td>
                              <td className="py-2 text-right text-muted-foreground text-[10px]">{e.ref}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-destructive/5 font-bold border-t-2 border-destructive/30">
                            <td className="py-2">TOTAL EMPLOIS</td>
                            <td className="py-2 text-right font-mono">{formatEur(tableauFinancement.totalEmplois)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Variation FRNG */}
                  <div className={`p-4 border-t-2 ${tableauFinancement.variationFrng >= 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-destructive/50 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black">VARIATION DU FRNG</span>
                        <span className="text-xs text-muted-foreground">(Ressources − Emplois)</span>
                      </div>
                      <span className={`text-lg font-black font-mono ${tableauFinancement.variationFrng >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatEur(tableauFinancement.variationFrng)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground">
                      <span>FRNG N-1 : <strong className="font-mono text-foreground">{formatEur(tableauFinancement.fdrN1)}</strong></span>
                      <ArrowRight className="h-3 w-3" />
                      <span>FRNG N : <strong className="font-mono text-foreground">{formatEur(tableauFinancement.fdrN)}</strong></span>
                      <span className="ml-auto">
                        Écart vérification : <strong className="font-mono">{formatEur(tableauFinancement.fdrN - tableauFinancement.fdrN1 - tableauFinancement.variationFrng)}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Répartition Emplois vs Ressources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      ...tableauFinancement.ressources.filter(r => r.value > 0).map(r => ({ name: r.label.substring(0, 18), Ressources: r.value, Emplois: 0 })),
                      ...tableauFinancement.emplois.filter(e => e.value > 0).map(e => ({ name: e.label.substring(0, 18), Ressources: 0, Emplois: e.value })),
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                      <YAxis type="category" dataKey="name" width={130} fontSize={9} />
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                      <Legend />
                      <Bar dataKey="Ressources" fill={COLORS.success} radius={[0, 3, 3, 0]} />
                      <Bar dataKey="Emplois" fill={COLORS.danger} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ TAB 5: ÉTATS RÉGLEMENTAIRES ═══ */}
        <TabsContent value="etats" className="space-y-5 mt-0">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Les soldes atypiques sont surlignés. Cliquez sur un compte pour voir les écritures sources.
          </div>

          <RegulatoryTable title="État des amortissements (Comptes 28*)" refM96="M9-6 § V.3.a"
            columns={['Compte', 'Intitulé', 'Solde ant.', 'Dotations', 'Reprises', 'Solde final']}
            rows={amortissementsTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.antCrd), formatEur(r.crd), formatEur(r.dbt), formatEur(r.solCrd)],
              isAtypical: r.isAtypical, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} totalLabel="Total amortissements" totalValue={formatEur(R.totalAmortissements)} />

          <RegulatoryTable title="État des provisions (Comptes 14*, 15*, 39*, 49*)" refM96="M9-6 § V.3.b"
            columns={['Compte', 'Intitulé', 'Solde ant.', 'Dotation', 'Reprise', 'Solde final']}
            rows={provisionsTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.antCrd), formatEur(r.dotation), formatEur(r.reprise), formatEur(r.solCrd)],
              isAtypical: r.isAtypical, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} />

          <RegulatoryTable title="État des créances (Classe 4 — soldes débiteurs)" refM96="M9-6 § V.3.c"
            columns={['Compte', 'Intitulé', 'Solde Dbt', 'Ancien ?', 'Observation']}
            rows={creancesTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.solDbt), r.isAncien ? '⚠️ Ancien' : '—',
                r.isAtypical ? '🔴 Douteux (416)' : r.isAncien ? 'Non mouvementé' : ''],
              isAtypical: r.isAtypical || r.isAncien, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} />

          <RegulatoryTable title="État des dettes (Classe 4 — soldes créditeurs)" refM96="M9-6 § V.3.d"
            columns={['Compte', 'Intitulé', 'Solde Crd', 'Observation']}
            rows={dettesTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.solCrd), r.isAtypical ? '⚠️ Ancien' : ''],
              isAtypical: r.isAtypical, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} />
        </TabsContent>

        {/* ═══ TAB 6: PISTE D'AUDIT ═══ */}
        <TabsContent value="pisteAudit" className="space-y-5 mt-0">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" /> Piste d'audit — Remontée aux écritures sources
                <Badge variant="outline" className="ml-auto text-[10px]">Juge des comptes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Input placeholder="Préfixe de compte (ex: 411, 512, 6…)" value={drilldownCompte || ''}
                  onChange={e => setDrilldownCompte(e.target.value || null)} className="max-w-xs font-mono text-sm" />
                <div className="flex gap-1">
                  {['411', '416', '512', '531', '6', '7'].map(p => (
                    <Button key={p} variant="ghost" size="sm" className="text-xs font-mono h-7 px-2"
                      onClick={() => setDrilldownCompte(p)}>{p}*</Button>
                  ))}
                </div>
              </div>

              {drilldownCompte && (
                <DrilldownTable comptes={getComptesForPrefix(drilldownCompte)} prefix={drilldownCompte} />
              )}

              {!drilldownCompte && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Saisissez un préfixe de compte ou cliquez sur un compte dans les États Réglementaires.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <NarrativeSection sectionId="srh" text={texts.srh}
            onTextChange={v => setTexts(p => ({ ...p, srh: v }))}
            onGenerate={() => genererSection('srh')} loading={loadingSection === 'srh'} />
        </TabsContent>

        {/* ═══ TAB 7: PERSPECTIVES ═══ */}
        <TabsContent value="perspectives" className="space-y-5 mt-0">
          <NarrativeSection sectionId="perspectives" text={texts.perspectives}
            onTextChange={v => setTexts(p => ({ ...p, perspectives: v }))}
            onGenerate={() => genererSection('perspectives')} loading={loadingSection === 'perspectives'} />
        </TabsContent>
      </Tabs>

      {/* ═══ SIGNATURES ═══ */}
      <Card className="print:shadow-none print:border-0 mt-6">
        <CardContent className="p-8">
          <div className="flex justify-between text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground text-sm">L'ordonnateur</strong>
              <div className="mt-12">{etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-center">
              <p>Fait à {etab.commune || '………………'},</p>
              <p>le ……… / ……… / {etab.exercice + 1}</p>
            </div>
            <div className="text-right">
              <strong className="block text-foreground text-sm">L'agent comptable</strong>
              <div className="mt-12">{etab.agentComptable || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WATERFALL DATA BUILDER
// ═══════════════════════════════════════════════════════════════
function buildWaterfallData(prevYear: any, R: any) {
  const fdrN1 = prevYear.fdr || 0;
  const fdrN = R.fdrComptable || 0;
  const items = [
    { name: `FRNG N-1`, value: fdrN1, type: 'base' },
    { name: 'CAF/IAF', value: R.cafBudgetaire || 0, type: (R.cafBudgetaire || 0) >= 0 ? 'positive' : 'negative' },
    { name: 'Investissements', value: -(R.totalImmo || 0) * 0.1, type: 'negative' },
    { name: 'Financement reçu', value: Math.max(0, fdrN - fdrN1 - (R.cafBudgetaire || 0) + (R.totalImmo || 0) * 0.1), type: 'positive' },
    { name: `FRNG N`, value: fdrN, type: 'total' },
  ];

  let cumul = 0;
  return items.map(item => {
    if (item.type === 'base' || item.type === 'total') {
      const result = { ...item, invisible: 0, display: item.value };
      cumul = item.value;
      return result;
    }
    const invisible = item.value >= 0 ? cumul : cumul + item.value;
    const display = Math.abs(item.value);
    cumul += item.value;
    return { ...item, invisible: Math.max(0, invisible), display };
  });
}

// ═══════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════

function NarrativeSection({ sectionId, text, onTextChange, onGenerate, loading }: {
  sectionId: string; text: string; onTextChange: (v: string) => void;
  onGenerate: () => void; loading: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const meta = SECTION_META[sectionId];

  return (
    <Card>
      <CardHeader className="py-3 flex-row items-center gap-2 bg-muted/10">
        <div className="flex items-center gap-2 flex-1">
          {meta?.icon}
          <CardTitle className="text-sm font-bold">{meta?.label}</CardTitle>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onGenerate} disabled={loading} className="text-xs h-7 gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
            {loading ? 'IA…' : 'Générer'}
          </Button>
          {text && (
            <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)} className="text-xs h-7">
              {editMode ? 'Aperçu' : 'Modifier'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {text ? (
          editMode ? (
            <Textarea value={text} onChange={e => onTextChange(e.target.value)}
              className="text-sm min-h-[120px] bg-muted/5 leading-relaxed" />
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="bg-muted/5 rounded-lg p-6 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Cliquez sur <strong>Générer</strong> pour que l'IA rédige cette note explicative.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegulatoryTable({ title, refM96, columns, rows, onDrilldown, totalLabel, totalValue }: {
  title: string; refM96: string; columns: string[];
  rows: { cells: string[]; isAtypical: boolean; compte: string }[];
  onDrilldown: (compte: string) => void; totalLabel?: string; totalValue?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Table2 className="h-4 w-4" /> {title}
          <Badge variant="outline" className="ml-auto text-[10px]">{refM96}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {columns.map((c, i) => (
                  <th key={i} className="py-2 px-3 text-left font-bold text-muted-foreground uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} onClick={() => onDrilldown(row.compte)}
                  className={`border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors ${row.isAtypical ? 'bg-destructive/5 font-semibold' : ''}`}
                  title={`Cliquer pour voir les écritures du compte ${row.compte}`}>
                  {row.cells.map((cell, j) => (
                    <td key={j} className={`py-2 px-3 ${j >= 2 ? 'font-mono text-right' : ''}`}>
                      {j === 0 ? (
                        <span className="flex items-center gap-1">
                          {row.isAtypical && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                          <span className="font-mono">{cell}</span>
                        </span>
                      ) : cell}
                    </td>
                  ))}
                </tr>
              ))}
              {totalLabel && (
                <tr className="bg-muted/30 font-bold border-t-2 border-border">
                  <td colSpan={columns.length - 1} className="py-2 px-3">{totalLabel}</td>
                  <td className="py-2 px-3 font-mono text-right">{totalValue}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DrilldownTable({ comptes, prefix }: { comptes: any[]; prefix: string }) {
  if (comptes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Aucune écriture trouvée pour le préfixe <span className="font-mono font-bold">{prefix}*</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="py-2 px-3 text-left font-bold">Compte</th>
            <th className="py-2 px-3 text-left font-bold">Intitulé</th>
            <th className="py-2 px-3 text-right font-bold">Débit</th>
            <th className="py-2 px-3 text-right font-bold">Crédit</th>
            <th className="py-2 px-3 text-right font-bold">Solde Dbt</th>
            <th className="py-2 px-3 text-right font-bold">Solde Crd</th>
            <th className="py-2 px-3 text-right font-bold">Solde Net</th>
          </tr>
        </thead>
        <tbody>
          {comptes.map((c, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-1.5 px-3 font-mono">{c.compte}</td>
              <td className="py-1.5 px-3 truncate max-w-[200px]">{c.intitule}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.debit ? formatEur(c.debit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.credit ? formatEur(c.credit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.soldeDebit ? formatEur(c.soldeDebit) : '—'}</td>
              <td className="py-1.5 px-3 text-right font-mono">{c.soldeCredit ? formatEur(c.soldeCredit) : '—'}</td>
              <td className={`py-1.5 px-3 text-right font-mono font-bold ${c.soldeNet >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatEur(c.soldeNet)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/20 font-bold border-t-2 border-border">
            <td colSpan={2} className="py-2 px-3">Total {prefix}*</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s: number, c: any) => s + c.debit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s: number, c: any) => s + c.credit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s: number, c: any) => s + c.soldeDebit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono">{formatEur(comptes.reduce((s: number, c: any) => s + c.soldeCredit, 0))}</td>
            <td className="py-2 px-3 text-right font-mono font-bold">{formatEur(comptes.reduce((s: number, c: any) => s + c.soldeNet, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function GaugeSimple({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${value * 2.64} ${264 - value * 2.64}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black font-mono">{value}%</span>
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ContextField({ label, value, onChange, placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 text-sm" />
    </div>
  );
}

function ContextBadge({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-2.5 border border-border/50">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className="font-bold font-mono">{value}{suffix}</div>
    </div>
  );
}
