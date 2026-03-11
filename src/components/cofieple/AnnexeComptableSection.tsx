// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Annexe Comptable M9-6 : 11 Composantes Réglementaires
// Destination : Rectorat (Dém'act) + Juge des comptes (Infocentre)
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useAuditTrail } from '@/hooks/useAuditTrail';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bot, Loader2, FileText, Sparkles,
  TrendingUp, AlertTriangle, Activity, Landmark, Scale, BookOpen,
  ArrowRight, BarChart3, CheckCircle2, Search,
  Shield, Eye, Table2, ArrowDown, ArrowUp,
  ShieldAlert, Download, Lock, Unlock, FileWarning,
  Package, CreditCard, Coins, PiggyBank, Receipt, Info, Building
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Line, Area, AreaChart,
  ReferenceLine, Cell, LineChart
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
const ANNEXE_SECTION_IDS = [
  'autoAudit',
  'faitsCaracteristiques', 'principesComptables', 'actifImmobilise',
  'stocks', 'creances', 'dettes', 'financements',
  'provisions', 'charges', 'produits', 'autresInfos',
] as const;
type AnnexeSectionId = typeof ANNEXE_SECTION_IDS[number];

// Sections that have AI-generated text
const AI_SECTIONS: Exclude<AnnexeSectionId, 'autoAudit'>[] = [
  'faitsCaracteristiques', 'principesComptables', 'actifImmobilise',
  'stocks', 'creances', 'dettes', 'financements',
  'provisions', 'charges', 'produits', 'autresInfos',
];

type AnnexeTexts = Record<Exclude<AnnexeSectionId, 'autoAudit'>, string>;

const INITIAL_TEXTS: AnnexeTexts = {
  faitsCaracteristiques: '', principesComptables: '', actifImmobilise: '',
  stocks: '', creances: '', dettes: '', financements: '',
  provisions: '', charges: '', produits: '', autresInfos: '',
};

interface ContexteQualif {
  changementOrdonnateur: string; changementGestionnaire: string;
  mouvementsAgence: string; evenementsMarquants: string;
  travauxImportants: string; reformesPedagogiques: string; difficultes: string;
}

interface AuditAnomaly {
  id: string; compte: string; intitule: string;
  type: 'solde_atypique' | 'amort_manquant' | 'coherence' | 'provision_absente' | 'amort_28_68' | 'anciennete_cl4' | 'unite_caisse';
  severity: 'bloquant' | 'anomalie';
  description: string; refM96: string; justification: string;
  annexeTarget?: keyof AnnexeTexts;
  drilldownPrefix?: string;
}

// ── Tab config ───────────────────────────────────────────────
const ANNEXE_TABS: { id: AnnexeSectionId; label: string; icon: React.ReactNode; num?: string }[] = [
  { id: 'autoAudit', label: 'Auto-Audit', icon: <ShieldAlert className="h-4 w-4" /> },
  { id: 'faitsCaracteristiques', label: '1. Faits', icon: <Activity className="h-4 w-4" />, num: '1' },
  { id: 'principesComptables', label: '2. Principes', icon: <BookOpen className="h-4 w-4" />, num: '2' },
  { id: 'actifImmobilise', label: '3. Immobilisations', icon: <Building className="h-4 w-4" />, num: '3' },
  { id: 'stocks', label: '4. Stocks', icon: <Package className="h-4 w-4" />, num: '4' },
  { id: 'creances', label: '5. Créances', icon: <CreditCard className="h-4 w-4" />, num: '5' },
  { id: 'dettes', label: '6. Dettes', icon: <Receipt className="h-4 w-4" />, num: '6' },
  { id: 'financements', label: '7. Financements', icon: <PiggyBank className="h-4 w-4" />, num: '7' },
  { id: 'provisions', label: '8. Provisions', icon: <Shield className="h-4 w-4" />, num: '8' },
  { id: 'charges', label: '9. Charges', icon: <TrendingUp className="h-4 w-4" />, num: '9' },
  { id: 'produits', label: '10. Produits', icon: <Coins className="h-4 w-4" />, num: '10' },
  { id: 'autresInfos', label: '11. Autres', icon: <Info className="h-4 w-4" />, num: '11' },
];

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  faitsCaracteristiques: { label: '1. Faits caractéristiques de l\'exercice', icon: <Activity className="h-4 w-4" /> },
  principesComptables: { label: '2. Principes, règles et méthodes comptables', icon: <BookOpen className="h-4 w-4" /> },
  actifImmobilise: { label: '3. Notes sur l\'actif immobilisé et les amortissements', icon: <Building className="h-4 w-4" /> },
  stocks: { label: '4. Notes sur les stocks', icon: <Package className="h-4 w-4" /> },
  creances: { label: '5. Notes sur les créances', icon: <CreditCard className="h-4 w-4" /> },
  dettes: { label: '6. Notes sur les dettes', icon: <Receipt className="h-4 w-4" /> },
  financements: { label: '7. Notes sur les financements', icon: <PiggyBank className="h-4 w-4" /> },
  provisions: { label: '8. Notes sur les provisions', icon: <Shield className="h-4 w-4" /> },
  charges: { label: '9. Notes sur les charges', icon: <TrendingUp className="h-4 w-4" /> },
  produits: { label: '10. Notes sur les produits', icon: <Coins className="h-4 w-4" /> },
  autresInfos: { label: '11. Autres informations', icon: <Info className="h-4 w-4" /> },
};

const COLORS = {
  primary: 'hsl(215, 70%, 45%)', success: 'hsl(160, 45%, 45%)',
  warning: 'hsl(38, 92%, 50%)', purple: 'hsl(280, 50%, 50%)',
  danger: 'hsl(0, 70%, 50%)', muted: 'hsl(215, 15%, 70%)',
  teal: 'hsl(185, 60%, 40%)', indigo: 'hsl(240, 50%, 55%)',
};

export function AnnexeComptableSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const budgets = useCofiepleStore(s => s.budgets);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const anomaliesBalance = useCofiepleStore(s => s.anomaliesBalance);
  const R = resultats[activeBudget];
  const { logAction, getLastModification, getAuditHistory } = useAuditTrail();

  const [activeTab, setActiveTab] = useState<AnnexeSectionId>('autoAudit');
  const [texts, setTexts] = useState<AnnexeTexts>({ ...INITIAL_TEXTS });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [contexte, setContexte] = useState<ContexteQualif>({
    changementOrdonnateur: '', changementGestionnaire: '', mouvementsAgence: '',
    evenementsMarquants: '', travauxImportants: '', reformesPedagogiques: '', difficultes: '',
  });
  const [indicators, setIndicators] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [drilldownCompte, setDrilldownCompte] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'isolé' | 'consolidé'>('isolé');
  const [auditAnomalies, setAuditAnomalies] = useState<AuditAnomaly[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [auditDrilldown, setAuditDrilldown] = useState<string | null>(null);
  const [lastMods, setLastMods] = useState<Record<string, { user_name: string; created_at: string } | null>>({});

  const completedSections = useMemo(() => Object.values(texts).filter(t => t.length > 0).length, [texts]);
  const progressPct = Math.round((completedSections / AI_SECTIONS.length) * 100);

  const balanceData = useMemo(() => balance[activeBudget] || [], [balance, activeBudget]);
  const balance1Store = useCofiepleStore(s => s.balance1);
  const balance1DataN1 = useMemo(() => balance1Store[activeBudget] || [], [balance1Store, activeBudget]);

  const hasMultipleBudgets = budgets.length > 1;

  // ── Load indicators, history, and last modifications ────
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

  // Fetch last modification info for each section
  useEffect(() => {
    if (!etab.uai || !etab.exercice) return;
    (async () => {
      const mods: Record<string, { user_name: string; created_at: string } | null> = {};
      for (const s of AI_SECTIONS) {
        mods[s] = await getLastModification(etab.uai, etab.exercice, s);
      }
      setLastMods(mods);
    })();
  }, [etab.uai, etab.exercice, texts, getLastModification]);

  // ── AUTO-AUDIT ─────────────────────────────────────────────
  useEffect(() => {
    if (!R || balanceData.length === 0) return;
    const anomalies: AuditAnomaly[] = [];
    let idx = 0;

    // 1. Soldes atypiques
    anomaliesBalance
      .filter(a => a.anomalie && (a.gravite === 'bloquant' || a.gravite === 'anomalie'))
      .forEach(a => {
        anomalies.push({
          id: `sol_${idx++}`, compte: a.compte, intitule: a.intitule,
          type: 'solde_atypique', severity: a.gravite === 'bloquant' ? 'bloquant' : 'anomalie',
          description: `Solde ${a.sensAttendu === 'débiteur' ? 'créditeur' : 'débiteur'} anormal. ${a.conseqM96}`,
          refM96: 'M9-6 Plan comptable', justification: '',
          annexeTarget: 'actifImmobilise', drilldownPrefix: a.compte.substring(0, 3),
        });
      });

    // 2. Amortissements non pratiqués
    balanceData.filter((b: any) =>
      b.compte?.startsWith('2') && !b.compte?.startsWith('28') && !b.compte?.startsWith('29') &&
      (b.dbt || 0) > 0 && (b.solDbt || 0) > 0
    ).forEach((immo: any) => {
      const cpteAmort = '28' + immo.compte.substring(1, 4);
      const hasAmort = balanceData.some((b: any) => b.compte?.startsWith(cpteAmort) && ((b.crd || 0) > 0));
      if (!hasAmort && !immo.compte.startsWith('23') && !immo.compte.startsWith('27')) {
        anomalies.push({
          id: `amort_${idx++}`, compte: immo.compte, intitule: immo.intituleReduit || '',
          type: 'amort_manquant', severity: 'bloquant',
          description: `Immobilisation (${formatEur(immo.solDbt || 0)}) sans dotation aux amortissements (${cpteAmort}*).`,
          refM96: 'M9-6 § III.3', justification: '',
          annexeTarget: 'actifImmobilise', drilldownPrefix: immo.compte.substring(0, 3),
        });
      }
    });

    // 3. Créances douteuses sans provision
    const creancesDouteuses = balanceData.filter((b: any) => b.compte?.startsWith('416') && (b.solDbt || 0) > 0);
    const provisionsSolde = balanceData.filter((b: any) => b.compte?.startsWith('491') && (b.solCrd || 0) > 0)
      .reduce((s: number, b: any) => s + (b.solCrd || 0), 0);
    if (creancesDouteuses.length > 0 && provisionsSolde === 0) {
      const totalDouteux = creancesDouteuses.reduce((s: number, b: any) => s + (b.solDbt || 0), 0);
      anomalies.push({
        id: `prov_${idx++}`, compte: '416/491', intitule: 'Créances douteuses / Provisions',
        type: 'provision_absente', severity: 'bloquant',
        description: `Créances douteuses (416) de ${formatEur(totalDouteux)} sans provision (491*). M9-6 § V.4.`,
        refM96: 'M9-6 § V.4', justification: '',
        annexeTarget: 'creances', drilldownPrefix: '416',
      });
    }

    // 4. Cohérence FDR = BFR + Trésorerie
    const ecartFdr = Math.abs((R.fdrComptable || 0) - (R.bfr || 0) - (R.tresorerieNette || 0));
    if (ecartFdr > 1) {
      anomalies.push({
        id: `coh_${idx++}`, compte: 'Global', intitule: 'Cohérence FDR/BFR/Trésorerie',
        type: 'coherence', severity: ecartFdr > 100 ? 'bloquant' : 'anomalie',
        description: `Écart de ${formatEur(ecartFdr)} : FDR (${formatEur(R.fdrComptable)}) ≠ BFR (${formatEur(R.bfr)}) + Trésorerie (${formatEur(R.tresorerieNette)}).`,
        refM96: 'M9-6 § III.1', justification: '', annexeTarget: 'financements',
      });
    }

    // 5. Cohérence amortissements 28/68
    const totalDotBilan28 = balanceData.filter((b: any) => b.compte?.startsWith('28')).reduce((s: number, b: any) => s + (b.crd || 0), 0);
    const totalDotResultat68 = balanceData.filter((b: any) => b.compte?.startsWith('68')).reduce((s: number, b: any) => s + (b.dbt || 0), 0);
    const sortiesActifs = balanceData.filter((b: any) => b.compte?.startsWith('28') && (b.dbt || 0) > 0).reduce((s: number, b: any) => s + (b.dbt || 0), 0);
    const ecartAmort = Math.abs(totalDotBilan28 - sortiesActifs - totalDotResultat68);
    if (ecartAmort > 10 && (totalDotBilan28 > 0 || totalDotResultat68 > 0)) {
      anomalies.push({
        id: `amort28_68_${idx++}`, compte: '28*/68*', intitule: 'Cohérence Amort. Bilan/Résultat',
        type: 'amort_28_68', severity: 'bloquant',
        description: `Écart de ${formatEur(ecartAmort)} entre dotations bilan (28*) et charges résultat (68*).`,
        refM96: 'M9-6 § III.3', justification: '',
        annexeTarget: 'actifImmobilise', drilldownPrefix: '28',
      });
    }

    // 6. Ancienneté classe 4
    balanceData.filter((b: any) => {
      if (!b.compte?.startsWith('411') && !b.compte?.startsWith('416')) return false;
      const solde = (b.solDbt || 0) - (b.solCrd || 0);
      if (solde <= 0) return false;
      if ((b.dbt || 0) === 0 && (b.crd || 0) === 0) return true;
      if (balance1DataN1.length > 0) {
        const compteN1 = balance1DataN1.find((bn1: any) => bn1.compte === b.compte);
        if (compteN1 && Math.abs(solde - ((compteN1.solDbt || 0) - (compteN1.solCrd || 0))) < 1) return true;
      }
      return false;
    }).forEach((b: any) => {
      anomalies.push({
        id: `ancien_${idx++}`, compte: b.compte, intitule: b.intituleReduit || '',
        type: 'anciennete_cl4', severity: 'anomalie',
        description: `Solde débiteur de ${formatEur((b.solDbt || 0) - (b.solCrd || 0))} inchangé depuis N-1 — absence de diligences.`,
        refM96: 'M9-6 § V.4', justification: '',
        annexeTarget: 'creances', drilldownPrefix: b.compte.substring(0, 3),
      });
    });

    // 7. Unité de caisse
    const solde515 = balanceData.filter((b: any) => b.compte?.startsWith('515'))
      .reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);
    if (solde515 < 0) {
      anomalies.push({
        id: `caisse_515_${idx++}`, compte: '515', intitule: 'Compte Trésor Public',
        type: 'unite_caisse', severity: 'bloquant',
        description: `Compte 515 créditeur (${formatEur(Math.abs(solde515))}). Vérifier concordance relevé DFT.`,
        refM96: 'M9-6 § IV.2', justification: '', annexeTarget: 'autresInfos', drilldownPrefix: '515',
      });
    }

    setAuditAnomalies(anomalies);
  }, [R, balanceData, anomaliesBalance, balance1DataN1]);

  const blockingAnomalies = useMemo(() => auditAnomalies.filter(a => a.severity === 'bloquant'), [auditAnomalies]);
  const unjustifiedBlocking = useMemo(() => blockingAnomalies.filter(a => !a.justification.trim()), [blockingAnomalies]);
  const canGenerateAnnexe = unjustifiedBlocking.length === 0;

  // ── Helpers ────────────────────────────────────────────────
  const buildContextString = useCallback(() => {
    return Object.entries(contexte).filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          changementOrdonnateur: 'Changement d\'ordonnateur', changementGestionnaire: 'Changement de gestionnaire',
          mouvementsAgence: 'Mouvements agence comptable', evenementsMarquants: 'Événements marquants',
          travauxImportants: 'Travaux importants', reformesPedagogiques: 'Réformes pédagogiques', difficultes: 'Difficultés',
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

  // ── Data tables ────────────────────────────────────────────
  const immoTable = useMemo(() => {
    const immos = balanceData.filter((b: any) =>
      b.compte?.startsWith('2') && !b.compte?.startsWith('28') && !b.compte?.startsWith('29')
    );
    const amorts = balanceData.filter((b: any) => b.compte?.startsWith('28'));
    return immos.map((b: any) => {
      // Match amortization: 21xxx → 281xx, 20xxx → 280xx (use first 4 chars of immo after leading '2')
      const cpteAmortPrefix = '28' + b.compte.substring(1, 4);
      const amort = amorts.find((a: any) => a.compte?.startsWith(cpteAmortPrefix));
      const brut = (b.solDbt || 0);
      const cumAmort = amort ? (amort.solCrd || 0) : 0;
      return {
        compte: b.compte, intitule: b.intituleReduit || '',
        brut, amort: cumAmort, net: brut - cumAmort,
        mvtDbt: b.dbt || 0, mvtCrd: b.crd || 0,
      };
    }).filter(r => r.brut > 0);
  }, [balanceData]);

  const stocksTable = useMemo(() => {
    return balanceData.filter((b: any) => ['31', '32', '33'].some(p => b.compte?.startsWith(p)))
      .map((b: any) => {
        const antSolde = (b.antDbt || 0) - (b.antCrd || 0);
        const solde = (b.solDbt || 0) - (b.solCrd || 0);
        return { compte: b.compte, intitule: b.intituleReduit || '', soldeN1: antSolde, soldeN: solde, variation: solde - antSolde };
      });
  }, [balanceData]);

  const creancesTable = useMemo(() => {
    return balanceData.filter((b: any) => b.compte?.startsWith('41') && (b.solDbt || 0) > 0)
      .sort((a: any, b: any) => (b.solDbt || 0) - (a.solDbt || 0))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solDbt: b.solDbt || 0, antDbt: b.antDbt || 0,
        isAncien: (b.antDbt || 0) > 0 && (b.dbt || 0) === 0 && (b.crd || 0) === 0,
        isDouteux: b.compte?.startsWith('416'),
      }));
  }, [balanceData]);

  const dettesTable = useMemo(() => {
    return balanceData.filter((b: any) => (b.compte?.startsWith('40') || b.compte?.startsWith('42') || b.compte?.startsWith('43') || b.compte?.startsWith('44')) && (b.solCrd || 0) > 0)
      .sort((a: any, b: any) => (b.solCrd || 0) - (a.solCrd || 0))
      .map((b: any) => ({
        compte: b.compte, intitule: b.intituleReduit || '',
        solCrd: b.solCrd || 0, antCrd: b.antCrd || 0,
        isAncien: (b.antCrd || 0) > 0 && (b.dbt || 0) === 0 && (b.crd || 0) === 0,
      }));
  }, [balanceData]);

  const financementsTable = useMemo(() => {
    const reserves = balanceData.filter((b: any) => b.compte?.startsWith('106'));
    const subvInvest = balanceData.filter((b: any) => b.compte?.startsWith('13'));
    return [...reserves, ...subvInvest].map((b: any) => ({
      compte: b.compte, intitule: b.intituleReduit || '',
      solCrd: b.solCrd || 0, mvtDbt: b.dbt || 0, mvtCrd: b.crd || 0,
    }));
  }, [balanceData]);

  const provisionsTable = useMemo(() => {
    return balanceData.filter((b: any) =>
      b.compte?.startsWith('15') || b.compte?.startsWith('49') || b.compte?.startsWith('39')
    ).map((b: any) => ({
      compte: b.compte, intitule: b.intituleReduit || '',
      antCrd: b.antCrd || 0, dotation: b.crd || 0, reprise: b.dbt || 0, solCrd: b.solCrd || 0,
    }));
  }, [balanceData]);

  // ── Charges/Produits comparative N vs N-1 ──────────────────
  const chargesComparative = useMemo(() => {
    const cl6 = balanceData.filter((b: any) => b.compte?.charAt(0) === '6');
    const groups: Record<string, { label: string; totalN: number; totalN1: number }> = {};
    cl6.forEach((b: any) => {
      const prefix = b.compte?.substring(0, 2) || '6X';
      if (!groups[prefix]) {
        const labels: Record<string, string> = {
          '60': 'Achats', '61': 'Services ext.', '62': 'Autres serv. ext.', '63': 'Impôts',
          '64': 'Personnel', '65': 'Autres charges', '66': 'Charges financières',
          '67': 'Charges except.', '68': 'Dotations amort.',
        };
        groups[prefix] = { label: labels[prefix] || prefix, totalN: 0, totalN1: 0 };
      }
      groups[prefix].totalN += (b.solDbt || 0);
      groups[prefix].totalN1 += (b.antDbt || 0);
    });
    return Object.entries(groups).map(([k, v]) => ({
      name: v.label, N: v.totalN, 'N-1': v.totalN1, variation: v.totalN - v.totalN1,
    })).filter(r => r.N > 0 || r['N-1'] > 0);
  }, [balanceData]);

  const produitsComparative = useMemo(() => {
    const cl7 = balanceData.filter((b: any) => b.compte?.charAt(0) === '7');
    const groups: Record<string, { label: string; totalN: number; totalN1: number }> = {};
    cl7.forEach((b: any) => {
      const prefix = b.compte?.substring(0, 2) || '7X';
      if (!groups[prefix]) {
        const labels: Record<string, string> = {
          '70': 'Ventes / Prestations', '71': 'Production stockée', '74': 'Subventions',
          '75': 'Autres produits', '76': 'Produits financiers', '77': 'Produits except.',
          '78': 'Reprises amort.', '79': 'Transferts charges',
        };
        groups[prefix] = { label: labels[prefix] || prefix, totalN: 0, totalN1: 0 };
      }
      groups[prefix].totalN += (b.solCrd || 0);
      groups[prefix].totalN1 += (b.antCrd || 0);
    });
    return Object.entries(groups).map(([k, v]) => ({
      name: v.label, N: v.totalN, 'N-1': v.totalN1, variation: v.totalN - v.totalN1,
    })).filter(r => r.N > 0 || r['N-1'] > 0);
  }, [balanceData]);

  // ── Balance summary for edge function ──────────────────────
  const buildBalanceSummary = useCallback(() => {
    const sumByPrefix = (prefix: string, field: 'solDbt' | 'solCrd') =>
      balanceData.filter((b: any) => b.compte?.startsWith(prefix)).reduce((s: number, b: any) => s + (b[field] || 0), 0);
    return {
      cl4Debiteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solDbt || 0) > 0).reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
      cl4Crediteurs: balanceData.filter((b: any) => b.compte?.charAt(0) === '4' && (b.solCrd || 0) > 0).reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
      cl5Solde: balanceData.filter((b: any) => b.compte?.charAt(0) === '5').reduce((s: number, b: any) => s + (b.solDbt || 0) - (b.solCrd || 0), 0),
      creancesDouteuses416: sumByPrefix('416', 'solDbt'),
      provisions: sumByPrefix('49', 'solCrd'),
      totalImmo20: sumByPrefix('20', 'solDbt'), totalImmo21: sumByPrefix('21', 'solDbt'),
      totalAmort28: sumByPrefix('28', 'solCrd'),
      stocks31: sumByPrefix('31', 'solDbt'), stocks32: sumByPrefix('32', 'solDbt'),
      reserves106: sumByPrefix('106', 'solCrd'), subvInvest13: sumByPrefix('13', 'solCrd'),
      provisions15: sumByPrefix('15', 'solCrd'),
      totalCharges6: balanceData.filter((b: any) => b.compte?.charAt(0) === '6').reduce((s: number, b: any) => s + (b.solDbt || 0), 0),
      totalProduits7: balanceData.filter((b: any) => b.compte?.charAt(0) === '7').reduce((s: number, b: any) => s + (b.solCrd || 0), 0),
      cl8: balanceData.filter((b: any) => b.compte?.charAt(0) === '8').reduce((s: number, b: any) => s + Math.abs((b.solDbt || 0) - (b.solCrd || 0)), 0),
    };
  }, [balanceData]);

  // ── Generate section ───────────────────────────────────────
  async function genererSection(sectionId: string) {
    if (!R) return;
    if (!canGenerateAnnexe) {
      toast.error('Justifiez les anomalies bloquantes dans l\'onglet Auto-Audit.');
      setActiveTab('autoAudit');
      return;
    }
    setLoadingSection(sectionId);
    try {
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
          balanceSummary: buildBalanceSummary(),
          indicateurs: indicators, historique: history, contexte: buildContextString(),
          chargesComparative, produitsComparative,
        },
      });
      if (error) throw error;
      setTexts(prev => ({ ...prev, [sectionId]: data?.text || '' }));
      await logAction({
        action_type: 'generate_ai', uai: etab.uai, exercice: etab.exercice,
        section_id: sectionId,
        action_detail: `Génération IA de « ${SECTION_META[sectionId]?.label || sectionId} »`,
      });
      toast.success(`Section "${SECTION_META[sectionId]?.label}" générée`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération IA');
    }
    setLoadingSection(null);
  }

  async function genererTout() {
    if (!canGenerateAnnexe) {
      toast.error('Justifiez d\'abord les anomalies bloquantes.');
      setActiveTab('autoAudit');
      return;
    }
    for (const s of AI_SECTIONS) {
      await genererSection(s);
    }
  }

  // ── Log manual edits (on blur) ─────────────────────────────
  const logEditRef = useRef<Record<string, boolean>>({});
  const handleEditBlur = useCallback((sectionId: string) => {
    if (!etab.uai || logEditRef.current[sectionId]) return;
    logEditRef.current[sectionId] = true;
    logAction({
      action_type: 'edit_note', uai: etab.uai, exercice: etab.exercice,
      section_id: sectionId,
      action_detail: `Modification manuelle de « ${SECTION_META[sectionId]?.label || sectionId} »`,
    });
    // Reset after 10s to allow re-logging
    setTimeout(() => { logEditRef.current[sectionId] = false; }, 10000);
  }, [etab.uai, etab.exercice, logAction]);

  // ── Generate compliance certificate PDF ────────────────────
  async function exportComplianceCertificate() {
    setExportingPdf(true);
    try {
      const auditLogs = await getAuditHistory(etab.uai, etab.exercice);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // Header
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text('RAPPORT DE CONFORMITÉ ET DE TRAÇABILITÉ', pageW / 2, y, { align: 'center' }); y += 5;
      doc.setFontSize(6); doc.setTextColor(130);
      doc.text(`${etab.nom} — RNE ${etab.uai} — Exercice ${etab.exercice}`, pageW / 2, y, { align: 'center' }); y += 3;
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageW / 2, y, { align: 'center' }); y += 10;

      // Section 1: Triple Verrou
      doc.setFontSize(11); doc.setTextColor(30);
      doc.text('§1 — Validité des fichiers importés (Triple Verrou)', margin, y); y += 7;
      const importLogs = auditLogs.filter((l: any) => l.action_type === 'import');
      if (importLogs.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Fichier', 'Résultat']],
          body: importLogs.slice(0, 20).map((l: any) => [
            new Date(l.created_at).toLocaleString('fr-FR'),
            (l.metadata as any)?.file_name || l.action_detail,
            (l.metadata as any)?.result || '✓',
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
        });
        y = (doc as any).lastAutoTable?.finalY + 8 || y + 20;
      } else {
        doc.setFontSize(8); doc.setTextColor(80);
        doc.text('Aucun import enregistré dans le journal d\'audit.', margin, y); y += 8;
      }

      // Section 2: Completeness of 11 notes
      doc.setFontSize(11); doc.setTextColor(30);
      doc.text('§2 — Exhaustivité des 11 notes réglementaires', margin, y); y += 7;
      autoTable(doc, {
        startY: y,
        head: [['Note', 'Statut', 'Dernière modification']],
        body: AI_SECTIONS.map(s => {
          const meta = SECTION_META[s];
          const filled = texts[s]?.length > 0;
          const mod = lastMods[s];
          return [
            meta?.label || s,
            filled ? '✅ Renseignée' : '❌ Vide',
            mod ? `${mod.user_name} — ${new Date(mod.created_at).toLocaleString('fr-FR')}` : '—',
          ];
        }),
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
      });
      y = (doc as any).lastAutoTable?.finalY + 8 || y + 40;

      // Section 3: Audit trail history
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11); doc.setTextColor(30);
      doc.text('§3 — Historique des actions (Audit Trail)', margin, y); y += 7;
      if (auditLogs.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Date/Heure', 'Utilisateur', 'Action', 'Détail']],
          body: auditLogs.slice(0, 50).map((l: any) => [
            new Date(l.created_at).toLocaleString('fr-FR'),
            l.user_name,
            l.action_type,
            (l.action_detail || '').substring(0, 60),
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 6.5, cellPadding: 1.5 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
          columnStyles: { 3: { cellWidth: 50 } },
        });
        y = (doc as any).lastAutoTable?.finalY + 8 || y + 40;
      }

      // Signatures
      if (y > 220) { doc.addPage(); y = 30; }
      doc.setFontSize(8); doc.setTextColor(80);
      doc.text(`Fait à ${etab.commune || '………………'}, le ${new Date().toLocaleDateString('fr-FR')}`, pageW / 2, y, { align: 'center' }); y += 15;
      doc.setFontSize(9); doc.setTextColor(30);
      doc.text('L\'ordonnateur', margin + 25, y, { align: 'center' });
      doc.text('L\'agent comptable', pageW - margin - 25, y, { align: 'center' });
      y += 20;
      doc.setFontSize(7); doc.setTextColor(80);
      doc.text(etab.ordonnateur || '……………………', margin + 25, y, { align: 'center' });
      doc.text(etab.agentComptable || '……………………', pageW - margin - 25, y, { align: 'center' });

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(5); doc.setTextColor(150);
      doc.text('Ce document est généré automatiquement par COFIEPLE — Certificat de conformité Op@le-Standard', margin, pageH - 5);

      doc.save(`Certificat_Conformite_${etab.uai}_${etab.exercice}.pdf`);
      await logAction({
        action_type: 'export_pdf', uai: etab.uai, exercice: etab.exercice,
        action_detail: 'Export Certificat de Conformité et de Traçabilité',
      });
      toast.success('Certificat de conformité exporté');
    } catch (e: any) {
      toast.error('Erreur d\'export : ' + (e.message || ''));
    }
    setExportingPdf(false);
  }
    for (const s of AI_SECTIONS) {
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
        doc.setFontSize(7); doc.setTextColor(120);
        doc.text(`Annexe au Compte Financier — ${etab.nom} — RNE ${etab.uai} — Ex. ${etab.exercice}`, margin, 8);
        doc.text(`Page ${pageNum}`, pageW - margin, 8, { align: 'right' });
        doc.setDrawColor(200); doc.line(margin, 10, pageW - margin, 10);
      };
      const addFooter = () => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(6); doc.setTextColor(150);
        doc.text('M9-6 2026 — Décret n°2012-1246 (RGCP) — COFIEPLE', margin, pageH - 5);
        doc.text(new Date().toLocaleDateString('fr-FR'), pageW - margin, pageH - 5, { align: 'right' });
      };
      const checkNewPage = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
          addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 18;
        }
      };

      // Title page
      addHeader(1); y = 40;
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text('RÉPUBLIQUE FRANÇAISE', pageW / 2, y, { align: 'center' }); y += 5;
      doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE', pageW / 2, y, { align: 'center' }); y += 15;
      doc.setFontSize(18); doc.setTextColor(30);
      doc.text('ANNEXE AU COMPTE FINANCIER', pageW / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(12);
      doc.text(`Exercice ${etab.exercice}`, pageW / 2, y, { align: 'center' }); y += 15;
      doc.setFontSize(11);
      doc.text(etab.nom || 'Établissement', pageW / 2, y, { align: 'center' }); y += 6;
      doc.setFontSize(9); doc.setTextColor(80);
      doc.text(`RNE : ${etab.uai} — ${etab.academie || ''}`, pageW / 2, y, { align: 'center' }); y += 15;

      // Sommaire
      doc.setFontSize(10); doc.setTextColor(30);
      doc.text('SOMMAIRE', margin, y); y += 6;
      doc.setFontSize(8); doc.setTextColor(60);
      AI_SECTIONS.forEach(s => {
        const meta = SECTION_META[s];
        if (meta) { doc.text(meta.label, margin + 3, y); y += 5; }
      });

      // Sections narratives
      for (const sId of AI_SECTIONS) {
        const text = texts[sId];
        if (!text) continue;
        addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 18;
        const meta = SECTION_META[sId];
        doc.setFontSize(11); doc.setTextColor(30);
        doc.text(meta?.label || sId, margin, y); y += 8;
        doc.setFontSize(8.5); doc.setTextColor(50);
        const cleanText = text.replace(/[#*_]/g, '').replace(/\n\n+/g, '\n\n');
        const lines = doc.splitTextToSize(cleanText, pageW - 2 * margin);
        for (const line of lines) { checkNewPage(5); doc.text(line, margin, y); y += 4; }
      }

      // KPI Summary page
      addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 18;
      doc.setFontSize(11); doc.setTextColor(30);
      doc.text('Synthèse des indicateurs financiers', margin, y); y += 3;
      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur', 'Appréciation']],
        body: [
          ['Résultat budgétaire', formatEur(R.resultatBudgetaire), R.resultatBudgetaire >= 0 ? 'Excédentaire' : 'Déficitaire'],
          ['Résultat comptable', formatEur(R.resultatComptable), R.resultatComptable >= 0 ? 'Excédentaire' : 'Déficitaire'],
          ['CAF budgétaire', formatEur(R.cafBudgetaire), R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'],
          ['FDR comptable', formatEur(R.fdrComptable), R.fdrComptable >= 0 ? 'Positif' : 'NÉGATIF ⚠️'],
          ['BFR', formatEur(R.bfr), R.bfr <= 0 ? 'Favorable' : 'À surveiller'],
          ['Trésorerie nette', formatEur(R.tresorerieNette), R.tresorerieNette >= 0 ? 'Positive' : 'NÉGATIVE ⚠️'],
          ['Jours d\'autonomie', `${Math.round(R.joursAutonomie)} jours`, R.joursAutonomie >= 30 ? '≥ 30 j ✓' : '< 30 j ⚠️'],
          ['Réserves (1068)', formatEur(R.reserves), ''],
          ['Taux exéc. dépenses', `${((R.tauxExecCharges || 0) * 100).toFixed(1)} %`, ''],
          ['Taux exéc. recettes', `${((R.tauxExecProduits || 0) * 100).toFixed(1)} %`, ''],
          ['Immobilisations nettes', formatEur((R.totalImmo || 0) - (R.totalAmortissements || 0)), ''],
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
      });

      // Charges comparative table in PDF
      if (chargesComparative.length > 0) {
        addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 18;
        doc.setFontSize(11); doc.setTextColor(30);
        doc.text('Analyse comparative des charges N / N-1', margin, y); y += 3;
        autoTable(doc, {
          startY: y,
          head: [['Poste', 'Exercice N', 'Exercice N-1', 'Variation']],
          body: chargesComparative.map(c => [c.name, formatEur(c.N), formatEur(c['N-1']), formatEur(c.variation)]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
        });
      }

      // Produits comparative table in PDF
      if (produitsComparative.length > 0) {
        y = (doc as any).lastAutoTable?.finalY || y + 10;
        checkNewPage(40);
        doc.setFontSize(11); doc.setTextColor(30);
        doc.text('Analyse comparative des produits N / N-1', margin, y + 8); y += 11;
        autoTable(doc, {
          startY: y,
          head: [['Poste', 'Exercice N', 'Exercice N-1', 'Variation']],
          body: produitsComparative.map(p => [p.name, formatEur(p.N), formatEur(p['N-1']), formatEur(p.variation)]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
        });
      }
      if (auditAnomalies.length > 0) {
        addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 18;
        doc.setFontSize(11); doc.setTextColor(30);
        doc.text('Rapport Auto-Audit — Observations du comptable', margin, y); y += 3;
        autoTable(doc, {
          startY: y,
          head: [['Compte', 'Type', 'Sév.', 'Description', 'Observation']],
          body: auditAnomalies.map(a => [
            a.compte, a.type.replace(/_/g, ' '),
            a.severity === 'bloquant' ? 'BLOQ' : 'Anom.',
            a.description.substring(0, 80), a.justification || '—',
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [50, 60, 80], textColor: [255, 255, 255] },
          columnStyles: { 3: { cellWidth: 45 }, 4: { cellWidth: 40 } },
        });
      }

      // Signatures
      addFooter(); doc.addPage(); addHeader(doc.getNumberOfPages()); y = 50;
      doc.setFontSize(9); doc.setTextColor(50);
      doc.text(`Fait à ${etab.commune || '………………'},`, pageW / 2, y, { align: 'center' }); y += 6;
      doc.text(`le ……… / ……… / ${etab.exercice + 1}`, pageW / 2, y, { align: 'center' }); y += 20;
      doc.setFontSize(10); doc.setTextColor(30);
      doc.text('L\'ordonnateur', margin + 20, y, { align: 'center' });
      doc.text('L\'agent comptable', pageW - margin - 20, y, { align: 'center' });
      y += 25;
      doc.setFontSize(8); doc.setTextColor(80);
      doc.text(etab.ordonnateur || '……………………', margin + 20, y, { align: 'center' });
      doc.text(etab.agentComptable || '……………………', pageW - margin - 20, y, { align: 'center' });
      addFooter();

      doc.save(`Annexe_CF_${etab.uai}_${etab.exercice}.pdf`);
      await logAction({
        action_type: 'export_pdf', uai: etab.uai, exercice: etab.exercice,
        action_detail: `Export PDF Dém'act — Annexe Compte Financier ${etab.exercice}`,
      });
      toast.success('PDF Dém\'act exporté');
    } catch (e: any) {
      toast.error('Erreur d\'export PDF : ' + (e.message || ''));
    }
    setExportingPdf(false);
  }

  // ── Trend data for charges/produits charts ─────────────────
  const trendData = useMemo(() => history.map(h => ({
    exercice: h.exercice, FDR: h.fdr, Trésorerie: h.tresorerie, BFR: h.bfr, CAF: h.caf,
  })).reverse(), [history]);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer l'annexe comptable réglementaire (M9-6 § V.3)." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-5 border border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">M9-6 2026</Badge>
              <Badge variant="outline" className="text-[10px] border-muted-foreground/30">11 composantes réglementaires</Badge>
              {canGenerateAnnexe ? (
                <Badge className="bg-emerald-600 text-white text-[10px]"><Unlock className="h-3 w-3 mr-1" />Prêt</Badge>
              ) : (
                <Badge className="bg-destructive text-destructive-foreground text-[10px]"><Lock className="h-3 w-3 mr-1" />{unjustifiedBlocking.length} bloq.</Badge>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Annexe au Compte Financier</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{etab.nom || 'Établissement'} — RNE {etab.uai} — Exercice {etab.exercice}</p>
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
            <Button variant="outline" onClick={exportComplianceCertificate} disabled={exportingPdf} className="gap-2 text-xs">
              <Shield className="h-3 w-3" />
              Certificat de conformité
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold shrink-0">Complétude</span>
          <Progress value={progressPct} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-mono shrink-0">{completedSections}/{AI_SECTIONS.length}</span>
          {completedSections === AI_SECTIONS.length && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
      </div>

      {/* Multi-budget toggle */}
      {hasMultipleBudgets && (
        <Card className="border-primary/20">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold">Vision :</span>
            <Button variant={viewMode === 'isolé' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('isolé')} className="text-xs">Isolée (Dém'act)</Button>
            <Button variant={viewMode === 'consolidé' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('consolidé')} className="text-xs">Consolidée (AC)</Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ TABS : 11 composantes + Auto-Audit ═══ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnnexeSectionId)} className="space-y-4">
        <TabsList className="w-full h-auto flex-wrap bg-muted/30 p-1 rounded-lg gap-1">
          {ANNEXE_TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="flex-1 min-w-[80px] gap-1 text-[11px] font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'autoAudit' && blockingAnomalies.length > 0 && (
                <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  canGenerateAnnexe ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>{blockingAnomalies.length}</span>
              )}
              {tab.id !== 'autoAudit' && texts[tab.id as Exclude<AnnexeSectionId, 'autoAudit'>] && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ AUTO-AUDIT ═══ */}
        <TabsContent value="autoAudit" className="space-y-5 mt-0">
          <Card className={`border-2 ${canGenerateAnnexe ? 'border-emerald-500/30' : 'border-destructive/30'}`}>
            <CardHeader className="py-3 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Pré-validation Audit — Contrôle de gestion
                <Badge variant="outline" className="ml-auto text-[10px]">M9-6 § V.3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                7 contrôles automatiques. Les alertes 🔴 nécessitent une <strong className="text-foreground">justification obligatoire</strong>.
              </p>

              {auditAnomalies.length === 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">Aucune anomalie détectée</p>
                </div>
              )}

              {auditAnomalies.map(anomaly => (
                <div key={anomaly.id} className={`rounded-lg border p-4 space-y-3 ${
                  anomaly.severity === 'bloquant' ? 'border-destructive/40 bg-destructive/5' : 'border-warning/40 bg-warning/5'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {anomaly.severity === 'bloquant' ? <FileWarning className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-bold ${
                          anomaly.severity === 'bloquant' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                        }`}>{anomaly.severity === 'bloquant' ? '🔴 BLOQUANT' : '🟠 ANOMALIE'}</Badge>
                        <span className="font-mono text-xs font-bold text-foreground">{anomaly.compte}</span>
                        <span className="text-xs text-muted-foreground">{anomaly.intitule}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">{anomaly.refM96}</Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{anomaly.description}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {anomaly.drilldownPrefix && (
                          <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1 px-2"
                            onClick={() => setAuditDrilldown(auditDrilldown === anomaly.drilldownPrefix ? null : anomaly.drilldownPrefix!)}>
                            <Search className="h-3 w-3" />
                            {auditDrilldown === anomaly.drilldownPrefix ? 'Masquer' : `Grand Livre ${anomaly.drilldownPrefix}*`}
                          </Button>
                        )}
                        {anomaly.annexeTarget && anomaly.justification.trim() && (
                          <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1 px-2"
                            onClick={() => {
                              const target = anomaly.annexeTarget!;
                              setTexts(prev => ({
                                ...prev, [target]: (prev[target] || '') + `\n\n**Observation du comptable — ${anomaly.compte} :**\n${anomaly.justification}\n`,
                              }));
                              toast.success(`Justification insérée dans « ${SECTION_META[target]?.label || target} »`);
                            }}>
                            <ArrowRight className="h-3 w-3" /> Insérer dans l'annexe
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {anomaly.drilldownPrefix && auditDrilldown === anomaly.drilldownPrefix && (
                    <div className="ml-8 mt-2">
                      <DrilldownTable comptes={getComptesForPrefix(anomaly.drilldownPrefix)} prefix={anomaly.drilldownPrefix} />
                    </div>
                  )}
                  <div className="ml-8">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                      <FileText className="h-3 w-3" />
                      {anomaly.severity === 'bloquant' ? 'Observations du comptable sur les soldes atypiques' : 'Justification (recommandée)'}
                      {anomaly.severity === 'bloquant' && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea value={anomaly.justification}
                      onChange={e => {
                        const val = e.target.value;
                        setAuditAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, justification: val } : a));
                      }}
                      placeholder={anomaly.severity === 'bloquant' ? 'Justification obligatoire…' : 'Facultatif…'}
                      className="text-xs min-h-[60px] bg-background" />
                    {anomaly.severity === 'bloquant' && !anomaly.justification.trim() && (
                      <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Obligatoire pour débloquer la génération
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {auditAnomalies.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{blockingAnomalies.length} bloquante(s) · {auditAnomalies.length - blockingAnomalies.length} anomalie(s)</span>
                  {canGenerateAnnexe ? (
                    <Badge className="bg-emerald-600 text-white gap-1"><Unlock className="h-3 w-3" /> Génération autorisée</Badge>
                  ) : (
                    <Badge className="bg-destructive text-destructive-foreground gap-1"><Lock className="h-3 w-3" /> {unjustifiedBlocking.length} justification(s) manquante(s)</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 1. FAITS CARACTÉRISTIQUES ═══ */}
        <TabsContent value="faitsCaracteristiques" className="space-y-5 mt-0">
          <Card>
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Contexte & Justifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ContextField label="Changement d'ordonnateur" value={contexte.changementOrdonnateur}
                  onChange={v => setContexte(p => ({ ...p, changementOrdonnateur: v }))} placeholder="Date et identité…" />
                <ContextField label="Changement de gestionnaire" value={contexte.changementGestionnaire}
                  onChange={v => setContexte(p => ({ ...p, changementGestionnaire: v }))} placeholder="Date et identité…" />
                <ContextField label="Événements marquants" value={contexte.evenementsMarquants}
                  onChange={v => setContexte(p => ({ ...p, evenementsMarquants: v }))} placeholder="Fusion, ouverture section…" />
                <ContextField label="Travaux importants" value={contexte.travauxImportants}
                  onChange={v => setContexte(p => ({ ...p, travauxImportants: v }))} placeholder="Nature, montant…" />
                <ContextField label="Réformes pédagogiques" value={contexte.reformesPedagogiques}
                  onChange={v => setContexte(p => ({ ...p, reformesPedagogiques: v }))} placeholder="Impact budgétaire…" />
                <ContextField label="Difficultés" value={contexte.difficultes}
                  onChange={v => setContexte(p => ({ ...p, difficultes: v }))} placeholder="Logistiques, sinistres…" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Résultat" value={formatEur(R.resultatComptable)} color={R.resultatComptable >= 0 ? 'green' : 'red'} icon="📊" sub="Comptable" isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Cpte 1068" isText />
            <KPICard label="Autonomie" value={`${Math.round(R.joursAutonomie)} j`} color={R.joursAutonomie >= 30 ? 'green' : 'red'} icon="⏱️" sub={R.joursAutonomie >= 30 ? '≥ 30 j' : '< 30 j ⚠️'} isText />
            <KPICard label="CAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
          </div>
          <NarrativeSection sectionId="faitsCaracteristiques" text={texts.faitsCaracteristiques}
            onTextChange={v => setTexts(p => ({ ...p, faitsCaracteristiques: v }))}
            onGenerate={() => genererSection('faitsCaracteristiques')} loading={loadingSection === 'faitsCaracteristiques'}
            lastMod={lastMods['faitsCaracteristiques']} onBlur={() => handleEditBlur('faitsCaracteristiques')} />
        </TabsContent>

        {/* ═══ 2. PRINCIPES COMPTABLES ═══ */}
        <TabsContent value="principesComptables" className="space-y-5 mt-0">
          <NarrativeSection sectionId="principesComptables" text={texts.principesComptables}
            onTextChange={v => setTexts(p => ({ ...p, principesComptables: v }))}
            onGenerate={() => genererSection('principesComptables')} loading={loadingSection === 'principesComptables'}
            lastMod={lastMods['principesComptables']} onBlur={() => handleEditBlur('principesComptables')} />
        </TabsContent>

        {/* ═══ 3. ACTIF IMMOBILISÉ ═══ */}
        <TabsContent value="actifImmobilise" className="space-y-5 mt-0">
          {immoTable.length > 0 && (
            <RegulatoryTable title="Tableau de variation Brut / Amortissements / Net" refM96="M9-6 § V.3.a"
              columns={['Compte', 'Intitulé', 'Brut', 'Amort. cumulé', 'Net', 'Mvt Dbt', 'Mvt Crd']}
              rows={immoTable.map(r => ({
                cells: [r.compte, r.intitule, formatEur(r.brut), formatEur(r.amort), formatEur(r.net), formatEur(r.mvtDbt), formatEur(r.mvtCrd)],
                isAtypical: r.brut > 0 && r.amort === 0 && !r.compte.startsWith('23') && !r.compte.startsWith('27'),
                compte: r.compte,
              }))}
              onDrilldown={setDrilldownCompte}
              totalLabel="Total immobilisations nettes"
              totalValue={formatEur(immoTable.reduce((s, r) => s + r.net, 0))} />
          )}
          <NarrativeSection sectionId="actifImmobilise" text={texts.actifImmobilise}
            onTextChange={v => setTexts(p => ({ ...p, actifImmobilise: v }))}
            onGenerate={() => genererSection('actifImmobilise')} loading={loadingSection === 'actifImmobilise'}
            lastMod={lastMods['actifImmobilise']} onBlur={() => handleEditBlur('actifImmobilise')} />
        </TabsContent>

        {/* ═══ 4. STOCKS ═══ */}
        <TabsContent value="stocks" className="space-y-5 mt-0">
          {stocksTable.length > 0 ? (
            <RegulatoryTable title="Variation des stocks (Comptes 31, 32, 33)" refM96="M9-6 § V.3"
              columns={['Compte', 'Intitulé', 'Solde N-1', 'Solde N', 'Variation']}
              rows={stocksTable.map(r => ({
                cells: [r.compte, r.intitule, formatEur(r.soldeN1), formatEur(r.soldeN), formatEur(r.variation)],
                isAtypical: Math.abs(r.variation) > 0 && Math.abs(r.variation / (r.soldeN1 || 1)) > 0.5,
                compte: r.compte,
              }))}
              onDrilldown={setDrilldownCompte}
              totalLabel="Total stocks"
              totalValue={formatEur(stocksTable.reduce((s, r) => s + r.soldeN, 0))} />
          ) : (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucun stock détecté dans la balance (comptes 31, 32, 33).</CardContent></Card>
          )}
          <NarrativeSection sectionId="stocks" text={texts.stocks}
            onTextChange={v => setTexts(p => ({ ...p, stocks: v }))}
            onGenerate={() => genererSection('stocks')} loading={loadingSection === 'stocks'}
            lastMod={lastMods['stocks']} onBlur={() => handleEditBlur('stocks')} />
        </TabsContent>

        {/* ═══ 5. CRÉANCES ═══ */}
        <TabsContent value="creances" className="space-y-5 mt-0">
          <RegulatoryTable title="État des créances (Comptes 41*)" refM96="M9-6 § V.3.c — Piste d'audit"
            columns={['Compte', 'Intitulé', 'Solde Dbt', 'Ancien ?', 'Observation']}
            rows={creancesTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.solDbt),
                r.isAncien ? '⚠️ Ancien' : '—',
                r.isDouteux ? '🔴 Douteux (416)' : r.isAncien ? 'Non mouvementé' : ''],
              isAtypical: r.isDouteux || r.isAncien, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} />
          <NarrativeSection sectionId="creances" text={texts.creances}
            onTextChange={v => setTexts(p => ({ ...p, creances: v }))}
            onGenerate={() => genererSection('creances')} loading={loadingSection === 'creances'}
            lastMod={lastMods['creances']} onBlur={() => handleEditBlur('creances')} />
        </TabsContent>

        {/* ═══ 6. DETTES ═══ */}
        <TabsContent value="dettes" className="space-y-5 mt-0">
          <RegulatoryTable title="État des dettes (Comptes 40*, 42*, 43*, 44*)" refM96="M9-6 § V.3.d"
            columns={['Compte', 'Intitulé', 'Solde Crd', 'Ancien ?']}
            rows={dettesTable.map(r => ({
              cells: [r.compte, r.intitule, formatEur(r.solCrd), r.isAncien ? '⚠️ Ancien' : ''],
              isAtypical: r.isAncien, compte: r.compte,
            }))}
            onDrilldown={setDrilldownCompte} />
          <NarrativeSection sectionId="dettes" text={texts.dettes}
            onTextChange={v => setTexts(p => ({ ...p, dettes: v }))}
            onGenerate={() => genererSection('dettes')} loading={loadingSection === 'dettes'} />
        </TabsContent>

        {/* ═══ 7. FINANCEMENTS ═══ */}
        <TabsContent value="financements" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="FRNG" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
            <KPICard label="BFR" value={formatEur(R.bfr)} color={R.bfr <= 0 ? 'green' : 'amber'} icon="⚖️" sub="Besoin fonds roulement" isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} j`} isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Cpte 106" isText />
          </div>
          {financementsTable.length > 0 && (
            <RegulatoryTable title="Réserves (106) & Subventions d'investissement (13)" refM96="M9-6 § III"
              columns={['Compte', 'Intitulé', 'Solde Crd', 'Mvt Dbt', 'Mvt Crd']}
              rows={financementsTable.map(r => ({
                cells: [r.compte, r.intitule, formatEur(r.solCrd), formatEur(r.mvtDbt), formatEur(r.mvtCrd)],
                isAtypical: r.mvtDbt > 0 && r.compte.startsWith('106'), compte: r.compte,
              }))}
              onDrilldown={setDrilldownCompte} />
          )}
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
          <NarrativeSection sectionId="financements" text={texts.financements}
            onTextChange={v => setTexts(p => ({ ...p, financements: v }))}
            onGenerate={() => genererSection('financements')} loading={loadingSection === 'financements'} />
        </TabsContent>

        {/* ═══ 8. PROVISIONS ═══ */}
        <TabsContent value="provisions" className="space-y-5 mt-0">
          {provisionsTable.length > 0 ? (
            <RegulatoryTable title="État des provisions (Comptes 15*, 39*, 49*)" refM96="M9-6 § V.3.b"
              columns={['Compte', 'Intitulé', 'Solde ant.', 'Dotation', 'Reprise', 'Solde final']}
              rows={provisionsTable.map(r => ({
                cells: [r.compte, r.intitule, formatEur(r.antCrd), formatEur(r.dotation), formatEur(r.reprise), formatEur(r.solCrd)],
                isAtypical: r.dotation > 0 || r.reprise > 0, compte: r.compte,
              }))}
              onDrilldown={setDrilldownCompte} />
          ) : (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune provision détectée (comptes 15*, 39*, 49*). Si des provisions existent, vérifiez l'import.</CardContent></Card>
          )}
          <NarrativeSection sectionId="provisions" text={texts.provisions}
            onTextChange={v => setTexts(p => ({ ...p, provisions: v }))}
            onGenerate={() => genererSection('provisions')} loading={loadingSection === 'provisions'} />
        </TabsContent>

        {/* ═══ 9. CHARGES ═══ */}
        <TabsContent value="charges" className="space-y-5 mt-0">
          {chargesComparative.length > 0 && (
            <>
              <RegulatoryTable title="Analyse comparative des charges N / N-1 (Classe 6)" refM96="M9-6 § IV"
                columns={['Poste', 'N', 'N-1', 'Variation']}
                rows={chargesComparative.map(r => ({
                  cells: [r.name, formatEur(r.N), formatEur(r['N-1']), formatEur(r.variation)],
                  isAtypical: Math.abs(r.variation) > 0 && Math.abs(r.variation / (r['N-1'] || 1)) > 0.2,
                  compte: '',
                }))}
                onDrilldown={() => {}}
                totalLabel="Total charges"
                totalValue={formatEur(chargesComparative.reduce((s, r) => s + r.N, 0))} />
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <BarChart3 className="h-4 w-4 inline mr-2" />Tendance des charges N vs N-1
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chargesComparative} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                      <YAxis type="category" dataKey="name" width={120} fontSize={9} />
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                      <Legend />
                      <Bar dataKey="N" fill={COLORS.primary} name="Exercice N" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="N-1" fill={COLORS.muted} name="Exercice N-1" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
          <NarrativeSection sectionId="charges" text={texts.charges}
            onTextChange={v => setTexts(p => ({ ...p, charges: v }))}
            onGenerate={() => genererSection('charges')} loading={loadingSection === 'charges'} />
        </TabsContent>

        {/* ═══ 10. PRODUITS ═══ */}
        <TabsContent value="produits" className="space-y-5 mt-0">
          {produitsComparative.length > 0 && (
            <>
              <RegulatoryTable title="Analyse comparative des produits N / N-1 (Classe 7)" refM96="M9-6 § IV"
                columns={['Poste', 'N', 'N-1', 'Variation']}
                rows={produitsComparative.map(r => ({
                  cells: [r.name, formatEur(r.N), formatEur(r['N-1']), formatEur(r.variation)],
                  isAtypical: Math.abs(r.variation) > 0 && Math.abs(r.variation / (r['N-1'] || 1)) > 0.2,
                  compte: '',
                }))}
                onDrilldown={() => {}}
                totalLabel="Total produits"
                totalValue={formatEur(produitsComparative.reduce((s, r) => s + r.N, 0))} />
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <BarChart3 className="h-4 w-4 inline mr-2" />Tendance des produits N vs N-1
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={produitsComparative} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                      <YAxis type="category" dataKey="name" width={120} fontSize={9} />
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                      <Legend />
                      <Bar dataKey="N" fill={COLORS.success} name="Exercice N" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="N-1" fill={COLORS.muted} name="Exercice N-1" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
          <NarrativeSection sectionId="produits" text={texts.produits}
            onTextChange={v => setTexts(p => ({ ...p, produits: v }))}
            onGenerate={() => genererSection('produits')} loading={loadingSection === 'produits'} />
        </TabsContent>

        {/* ═══ 11. AUTRES INFORMATIONS ═══ */}
        <TabsContent value="autresInfos" className="space-y-5 mt-0">
          <Card>
            <CardHeader className="py-3 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" /> Engagements hors bilan & événements post-clôture
                <Badge variant="outline" className="ml-auto text-[10px]">Classe 8</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {balanceData.filter((b: any) => b.compte?.charAt(0) === '8').length > 0 ? (
                <DrilldownTable comptes={getComptesForPrefix('8')} prefix="8" />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun engagement hors bilan détecté (classe 8).</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" /> Piste d'audit — Recherche par compte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Input placeholder="Préfixe de compte (ex: 411, 512, 6…)" value={drilldownCompte || ''}
                  onChange={e => setDrilldownCompte(e.target.value || null)} className="max-w-xs font-mono text-sm" />
                <div className="flex gap-1">
                  {['411', '416', '515', '6', '7', '8'].map(p => (
                    <Button key={p} variant="ghost" size="sm" className="text-xs font-mono h-7 px-2"
                      onClick={() => setDrilldownCompte(p)}>{p}*</Button>
                  ))}
                </div>
              </div>
              {drilldownCompte && <DrilldownTable comptes={getComptesForPrefix(drilldownCompte)} prefix={drilldownCompte} />}
            </CardContent>
          </Card>
          <NarrativeSection sectionId="autresInfos" text={texts.autresInfos}
            onTextChange={v => setTexts(p => ({ ...p, autresInfos: v }))}
            onGenerate={() => genererSection('autresInfos')} loading={loadingSection === 'autresInfos'} />
        </TabsContent>
      </Tabs>

      {/* Signatures */}
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
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════

function NarrativeSection({ sectionId, text, onTextChange, onGenerate, loading, lastMod, onBlur }: {
  sectionId: string; text: string; onTextChange: (v: string) => void;
  onGenerate: () => void; loading: boolean;
  lastMod?: { user_name: string; created_at: string } | null;
  onBlur?: () => void;
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
            {loading ? 'IA…' : 'Générer l\'analyse'}
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
              onBlur={onBlur}
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
              Cliquez sur <strong>Générer l'analyse</strong> pour que l'IA rédige cette note.
            </p>
          </div>
        )}
        {lastMod && (
          <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Dernière modification par <strong className="text-foreground">{lastMod.user_name}</strong> le{' '}
            {new Date(lastMod.created_at).toLocaleDateString('fr-FR')} à{' '}
            {new Date(lastMod.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                <tr key={i} onClick={() => row.compte && onDrilldown(row.compte)}
                  className={`border-b border-border/50 ${row.compte ? 'cursor-pointer hover:bg-muted/20' : ''} transition-colors ${row.isAtypical ? 'bg-destructive/5 font-semibold' : ''}`}>
                  {row.cells.map((cell, j) => (
                    <td key={j} className={`py-2 px-3 ${j >= 2 ? 'font-mono text-right' : ''}`}>
                      {j === 0 && row.isAtypical ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
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
    return <div className="text-center py-4 text-muted-foreground text-sm">Aucune écriture pour <span className="font-mono font-bold">{prefix}*</span></div>;
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
            <td className="py-2 px-3 text-right font-mono font-bold">{formatEur(comptes.reduce((s: number, c: any) => s + c.soldeNet, 0))}</td>
          </tr>
        </tfoot>
      </table>
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
