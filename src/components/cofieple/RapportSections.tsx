// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Rapport Ordonnateur + Rapport Agent Comptable
// Modèle REPROFI 25 pages — M9-6 2026, Décret 2012-1246
// Version enrichie : dashboard financier complet, graphiques variés,
// commentaires d'analyse pour CA non spécialiste,
// PDF officiel AC, pas de visa comptable supérieur
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { usePersistedState, usePersistedText } from '@/hooks/usePersistedState';
import { SaveIndicator } from '@/components/SaveIndicator';
import { generateRapportPDF } from '@/utils/generateRapportPDF';
import { buildSectionsDepenses, buildSectionsRecettes, type LigneCGR } from '@/utils/calcsBudgetaires';
import { getServiceSdeRows, getServiceSdrRows, getEtsSdeRow, getEtsSdrRow } from '@/lib/executionRowFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bot, Printer, Loader2, Plus, Trash2, Download, MessageSquare,
  Scale, PieChart as PieChartIcon, BarChart3, ArrowRight, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, Info, Target, Utensils,
  Building2, Users, GraduationCap, Wallet, ShieldCheck, Clock,
} from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import { generateRapportACPdf } from '@/lib/pdfRapportAC';
import { generateRapportExecution } from '@/lib/rapportExecutionPdf';
import { toast } from 'sonner';
import type { LigneSDE, LigneSDR } from '@/lib/cofieple_types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
  PieChart, Pie, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

interface Indicators {
  effectif_eleves: number; effectif_dp: number; effectif_internes: number;
  effectif_externes: number; effectif_boursiers: number; effectif_personnel: number;
  montant_fonds_social: number; nb_repas_servis: number; nb_repas_commensaux: number;
  cout_denrees_repas: number; etp_ressources_propres: number; surface_batiments: number;
}

function useExtraIndicators() {
  const etab = useCofiepleStore(s => s.etablissement);
  const [ind, setInd] = useState<Indicators | null>(null);
  useEffect(() => {
    if (!etab.uai) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_extra_indicators')
          .select('effectif_eleves,effectif_dp,effectif_internes,effectif_externes,effectif_boursiers,effectif_personnel,montant_fonds_social,nb_repas_servis,nb_repas_commensaux,cout_denrees_repas,etp_ressources_propres,surface_batiments')
          .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', session.session.user.id)
          .maybeSingle();
        if (data) setInd(data as Indicators);
      } catch {}
    })();
  }, [etab.uai, etab.exercice]);
  return ind;
}

// ── Smart commentary helper ─────────────────────────────────
function genAutoComment(label: string, value: number, seuil: number, unit: string, bienSi: 'sup' | 'inf', contextHaut: string, contextBas: string): string {
  const ok = bienSi === 'sup' ? value >= seuil : value <= seuil;
  return ok ? `✅ ${label} : ${contextHaut}` : `⚠️ ${label} : ${contextBas}`;
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'ORDONNATEUR — M9-6 § V.1
// Dashboard financier complet avec commentaires pour CA
// ═══════════════════════════════════════════════════════════════
export function RapportOrdoSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeRows = useCofiepleStore(s => s.sde[activeBudget]) as LigneSDE[];
  const sdrRows = useCofiepleStore(s => s.sdr[activeBudget]) as LigneSDR[];
  const R = resultats[activeBudget];
  const ind = useExtraIndicators();
  const tmcapAlertThreshold = Math.max(0, etab.tmcapSeuilAlerte ?? 15);
  const [aiText1, setAiText1] = useState('');
  const [aiText3, setAiText3] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  // Noms des signataires
  const pKey = `cofieple_rapport_ordo_${etab.uai}_${etab.exercice}`;
  const [nomOrdonnateur, setNomOrdonnateur] = usePersistedState(`${pKey}_nom_ordo`, etab.ordonnateur || '');
  const [nomSecretaireGeneral, setNomSecretaireGeneral] = usePersistedState(`${pKey}_nom_sg`, etab.secretaireGeneral || '');
  // Commentaires ordonnateur sur chaque rubrique (REPROFI-style "Faits caractéristiques")
  const [commentairePresentation, setCommentairePresentation, statusPres, lastSavedPres] = usePersistedText(`${pKey}_com_presentation`, '');
  const [commentaireResultat, setCommentaireResultat, statusRes, lastSavedRes] = usePersistedText(`${pKey}_com_resultat`, '');
  const [commentaireRepartition, setCommentaireRepartition, statusRep, lastSavedRep] = usePersistedText(`${pKey}_com_repartition`, '');
  const [commentaireEvolution, setCommentaireEvolution, statusEvo, lastSavedEvo] = usePersistedText(`${pKey}_com_evolution`, '');
  const [commentaireDomaines, setCommentaireDomaines, statusDom, lastSavedDom] = usePersistedText(`${pKey}_com_domaines`, '');
  const [commentaireFDR, setCommentaireFDR, statusFDR, lastSavedFDR] = usePersistedText(`${pKey}_com_fdr`, '');
  const [commentaireTresorerie, setCommentaireTresorerie, statusTreso, lastSavedTreso] = usePersistedText(`${pKey}_com_tresorerie`, '');
  const [commentaireOO, setCommentaireOO, statusOO, lastSavedOO] = usePersistedText(`${pKey}_com_oo`, '');
  const [commentaireSRH, setCommentaireSRH, statusSRH, lastSavedSRH] = usePersistedText(`${pKey}_com_srh`, '');
  const [commentaireSubventions, setCommentaireSubventions, statusSub, lastSavedSub] = usePersistedText(`${pKey}_com_subventions`, '');
  const [commentairePatrimoine, setCommentairePatrimoine, statusPat, lastSavedPat] = usePersistedText(`${pKey}_com_patrimoine`, '');
  const [commentairePerspectives, setCommentairePerspectives, statusPersp, lastSavedPersp] = usePersistedText(`${pKey}_com_perspectives`, '');
  const [commentairePilotage, setCommentairePilotage, statusPil, lastSavedPil] = usePersistedText(`${pKey}_com_pilotage`, '');

  const depNatureDataRaw = useMemo(() => {
    if (!R) return [];
    const cn = R.chargesNature ?? {};
    const labels: Record<string, string> = { '60': 'Achats', '61': 'Serv. extérieurs', '62': 'Autres serv. ext.', '63': 'Impôts', '64': 'Personnel', '65': 'Autres charges', '66': 'Charges fin.', '67': 'Charges except.', '68': 'Dotations amort.', '20': 'Investissement', '21': 'Immobilisations' };
    const colors = ['hsl(215,70%,50%)', 'hsl(160,45%,45%)', 'hsl(38,92%,50%)', 'hsl(0,72%,55%)', 'hsl(280,50%,50%)', 'hsl(190,60%,40%)', 'hsl(340,65%,50%)', 'hsl(120,40%,40%)', 'hsl(30,70%,50%)', 'hsl(250,50%,50%)'];
    return Object.entries(cn).filter(([, v]) => v > 50).sort(([, a], [, b]) => b - a).slice(0, 10).map(([k, v], i) => ({ name: labels[k] || `Cpt ${k}`, value: v, fill: colors[i % colors.length] }));
  }, [R]);

  const recettesOrigineDataRaw = useMemo(() => {
    if (!R) return [];
    const po = R.produitsOrigine ?? {};
    let etat = 0, collectivite = 0, propres = 0, taxeApprentissage = 0, autres = 0;
    Object.entries(po).forEach(([k, v]) => {
      if (['741', '744', '745', '746'].some(p => k.startsWith(p))) etat += v;
      else if (['742', '743', '747'].some(p => k.startsWith(p))) collectivite += v;
      else if (k.startsWith('748')) taxeApprentissage += v;
      else if (['70', '71', '72', '75', '76'].some(p => k.startsWith(p))) propres += v;
      else autres += v;
    });
    return [
      { name: 'État', value: etat, fill: 'hsl(215,70%,50%)' },
      { name: 'Collectivité', value: collectivite, fill: 'hsl(160,45%,45%)' },
      { name: 'Taxe apprentissage', value: taxeApprentissage, fill: 'hsl(280,50%,50%)' },
      { name: 'Ress. propres', value: propres, fill: 'hsl(38,92%,50%)' },
      { name: 'Autres', value: autres, fill: 'hsl(340,65%,50%)' },
    ].filter(d => d.value > 0);
  }, [R]);

  const autoCommentsRaw = useMemo(() => {
    if (!R) return [];
    const c: string[] = [];
    const safeR = {
      joursFdr: R.joursFdr ?? 0, joursTresorerie: R.joursTresorerie ?? 0,
      prelevementsReserves: R.prelevementsReserves ?? { totalPrelevements: 0 },
    };
    if (R.resultatBudgetaire >= 0) {
      c.push(`✅ L'exercice ${etab.exercice} dégage un excédent de ${formatEur(R.resultatBudgetaire)}. Le budget a été maîtrisé.`);
    } else {
      const prelev = safeR.prelevementsReserves.totalPrelevements;
      if (prelev > 0) {
        const horsP = R.resultatBudgetaire + prelev;
        c.push(`📊 Le résultat est déficitaire de ${formatEur(Math.abs(R.resultatBudgetaire))} en raison de ${formatEur(prelev)} de prélèvements sur FDR votés en CA. ${horsP >= 0 ? `Sans ces prélèvements, le résultat aurait été excédentaire de ${formatEur(horsP)}.` : `Hors prélèvements, le résultat reste déficitaire de ${formatEur(Math.abs(horsP))}.`}`);
      } else {
        c.push(`⚠️ Le résultat est déficitaire de ${formatEur(Math.abs(R.resultatBudgetaire))}. Ce déficit sera imputé sur les réserves (solde actuel : ${formatEur(R.reserves)}).`);
      }
    }
    if (R.tauxExecCharges < 0.75) c.push(`⚠️ Taux d'exécution des dépenses faible (${(R.tauxExecCharges * 100).toFixed(1)}%).`);
    else if (R.tauxExecCharges > 0.95) c.push(`✅ Crédits consommés à ${(R.tauxExecCharges * 100).toFixed(1)}%.`);
    if (safeR.joursFdr >= 30) c.push(`✅ Le FDR couvre ${Math.round(safeR.joursFdr)} jours (seuil : 30 j).`);
    else if (safeR.joursFdr > 0) c.push(`🔴 Le FDR ne couvre que ${Math.round(safeR.joursFdr)} jours (< 30 j).`);
    if (safeR.joursTresorerie < 15) c.push(`🔴 Trésorerie tendue : ${Math.round(safeR.joursTresorerie)} jours.`);
    if (R.cafBudgetaire >= 0) c.push(`✅ CAF de ${formatEur(R.cafBudgetaire)}.`);
    else c.push(`⚠️ IAF de ${formatEur(Math.abs(R.cafBudgetaire))}.`);
    return c;
  }, [R, etab.exercice]);

  // ── Préconisations IA contextuelles ─────────────────────────
  const preconisationsRaw = useMemo(() => {
    if (!R) return [];
    const p: string[] = [];
    const sR = {
      joursFdr: R.joursFdr ?? 0, joursTresorerie: R.joursTresorerie ?? 0,
      ratioAutonomieFinanciere: R.ratioAutonomieFinanciere ?? 0,
      tmcap: R.tmcap ?? 0, tmnr: R.tmnr ?? 0,
      ratioLiquiditeGenerale: R.ratioLiquiditeGenerale ?? 0,
    };
    if (sR.joursFdr > 0 && sR.joursFdr < 30) {
      p.push(`🛡️ Autonomie financière insuffisante (${Math.round(sR.joursFdr)} j < 30 j). Ne pas procéder à des prélèvements sur FDR et rechercher des économies structurelles.`);
    } else if (sR.joursFdr >= 30 && sR.joursFdr < 60) {
      p.push(`📋 Autonomie correcte (${Math.round(sR.joursFdr)} j). Prélèvements modérés et ciblés sur des investissements ponctuels.`);
    } else if (sR.joursFdr >= 90) {
      p.push(`💰 Autonomie élevée (${Math.round(sR.joursFdr)} j). Prélèvement envisageable pour financer des investissements structurants.`);
    }
    if (sR.joursTresorerie > 0 && sR.joursTresorerie < 15) p.push(`⚡ Trésorerie tendue (${Math.round(sR.joursTresorerie)} j). Accélérer le recouvrement et différer les dépenses non urgentes.`);
    if (sR.tmnr > 5) p.push(`📬 Taux de non-recouvrement élevé (${sR.tmnr.toFixed(1)} %). Intensifier les relances amiables et engager les SATD.`);
    if (sR.tmcap > tmcapAlertThreshold) p.push(`⏱️ TMcap élevé (${sR.tmcap.toFixed(1)} %), au-dessus du seuil d’alerte configuré (${tmcapAlertThreshold.toFixed(1)} %). Accélérer la liquidation des factures (DGP ≤ 30 j).`);
    if (sR.ratioLiquiditeGenerale > 0 && sR.ratioLiquiditeGenerale < 1) p.push(`⚠️ Ratio de liquidité < 1. Risque à court terme. Préparer un plan de trésorerie prévisionnel.`);
    if (R.resultatBudgetaire < 0 && R.reserves > 0 && Math.abs(R.resultatBudgetaire) > R.reserves * 0.5) p.push(`🔴 Déficit > 50 % des réserves. Alerter la collectivité et préparer un plan de redressement.`);
    if (R.cafBudgetaire < 0) p.push(`📉 IAF de ${formatEur(Math.abs(R.cafBudgetaire))} : l'établissement consomme ses réserves. Réduire les charges ou augmenter les recettes propres.`);
    if (sR.ratioAutonomieFinanciere > 0 && sR.ratioAutonomieFinanciere < 0.3) p.push(`📊 Autonomie financière faible (${(sR.ratioAutonomieFinanciere * 100).toFixed(1)} %). Développer les recettes propres (taxe d'apprentissage, conventions, locations).`);
    const taxeApp = Object.entries(R.produitsOrigine ?? {}).filter(([k]) => k.startsWith('748')).reduce((s, [, v]) => s + v, 0);
    if (taxeApp > 0) p.push(`🎓 Taxe d'apprentissage : ${formatEur(taxeApp)}. Vérifier l'affectation aux sections éligibles.`);
    return p;
  }, [R, tmcapAlertThreshold]);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'ordonnateur (M9-6 § V.1)." />;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';
  const tauxBoursiers = ind && ind.effectif_eleves > 0 ? ((ind.effectif_boursiers / ind.effectif_eleves) * 100).toFixed(1) : null;
  const hasN1 = (R.totalChargesSdeN1 ?? 0) > 0;
  const oo = R.operationsOrdre ?? { dotationsAmort: 0, reprisesAmort: 0, vncCessions: 0, produitsCessions: 0, neutralisationSubInv: 0, totalChargesOO: 0, totalProduitsOO: 0, soldeOO: 0 };
  const domaines = R.domaines ?? {};
  const domainesList = Object.values(domaines).filter(d => d.chargesReel > 0 || d.produitsReel > 0).sort((a, b) => a.code.localeCompare(b.code));

  const safe = {
    joursFdr: R.joursFdr ?? 0,
    joursTresorerie: R.joursTresorerie ?? 0,
    tmcap: R.tmcap ?? 0,
    tmnr: R.tmnr ?? 0,
    dgpJours: R.dgpJours ?? 0,
    dgrJours: R.dgrJours ?? 0,
    fdrMobilisable: R.fdrMobilisable ?? 0,
    fdrPartEncaissee: R.fdrPartEncaissee ?? 0,
    fdrPartNonEncaissee: R.fdrPartNonEncaissee ?? 0,
    fdrPctEncaissee: R.fdrPctEncaissee ?? 0,
    cafComptable: R.cafComptable ?? 0,
    ratioLiquiditeGenerale: R.ratioLiquiditeGenerale ?? 0,
    ratioAutonomieFinanciere: R.ratioAutonomieFinanciere ?? 0,
    ratioSolvabilite: R.ratioSolvabilite ?? 0,
    ratioCouvertureCharges: R.ratioCouvertureCharges ?? 0,
    ratioChargesPersonnel: R.ratioChargesPersonnel ?? 0,
    prelevementsReserves: R.prelevementsReserves ?? { totalPrelevements: 0, prelevementsInvestissement: 0, prelevementsFonctionnement: 0, variationReserves: 0 },
    tresoComposition: R.tresoComposition ?? { autonomieFinanciere: 0, depotsCautions: 0, reglementsEnAttente: 0, reliquatsSubventions: 0 },
    totalCreances: R.totalCreances ?? 0,
    totalDettes: R.totalDettes ?? 0,
    creancesEtat: R.creancesEtat ?? 0,
    creancesCollectivite: R.creancesCollectivite ?? 0,
    creancesFamilles: R.creancesFamilles ?? 0,
    creancesAutres: R.creancesAutres ?? 0,
    reliquatsSubventions: R.reliquatsSubventions ?? 0,
    valeurNette: R.valeurNette ?? 0,
  };

  // ── Chart data ─────────────────────────────────────────────
  const domChartData = domainesList.map(d => ({
    name: `D${d.code}`,
    Dépenses: d.chargesReel,
    Recettes: d.produitsReel,
    Solde: d.solde,
  }));

  const depNatureData = depNatureDataRaw;
  const recettesOrigineData = recettesOrigineDataRaw;
  const autoComments = autoCommentsRaw;

  const execData = [
    { name: 'Dépenses', Prévu: R.totalChargesPrev, Réalisé: R.totalChargesSde, taux: R.tauxExecCharges },
    { name: 'Recettes', Prévu: R.totalProduitsPrev, Réalisé: R.totalProduitsSdr, taux: R.tauxExecProduits },
  ];
  const srhDomaine = domainesList.find(d => d.code === '5');
  const srhRecettes = srhDomaine?.produitsReel ?? 0;
  const srhDepenses = srhDomaine?.chargesReel ?? 0;
  const srhSolde = srhRecettes - srhDepenses;
  const subventionsData = [
    { name: 'Reçues', value: safe.totalCreances > 0 ? R.totalProduitsSdr - safe.totalCreances : R.totalProduitsSdr, fill: 'hsl(160,45%,45%)' },
    { name: 'En attente', value: safe.reliquatsSubventions, fill: 'hsl(38,92%,50%)' },
    { name: 'Créances État', value: safe.creancesEtat, fill: 'hsl(215,70%,50%)' },
    { name: 'Créances Coll.', value: safe.creancesCollectivite, fill: 'hsl(280,50%,50%)' },
  ].filter(d => d.value > 0);

  const genererIA = async () => {
    setAiLoading(true);
    const safeText = (value: unknown) => {
      try {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return `${value.name}: ${value.message}`;
        return JSON.stringify(value ?? '');
      } catch {
        return String(value ?? '');
      }
    };
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'ordonnateur', etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, fdrComptable: R.fdrComptable,
            tresorerieNette: R.tresorerie, cafBudgetaire: R.cafBudgetaire,
            totalChargesReel: R.totalChargesSde, totalProduitsReel: R.totalProduitsSdr,
            joursAutonomie: R.joursAutonomie, reserves: R.reserves,
            tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
            domaines, operationsOrdre: oo,
            joursFdr: safe.joursFdr, joursTresorerie: safe.joursTresorerie,
            fdrMobilisable: safe.fdrMobilisable, fdrPctEncaissee: safe.fdrPctEncaissee,
            dgpJours: safe.dgpJours, dgrJours: safe.dgrJours,
            tmcap: safe.tmcap, tmnr: safe.tmnr,
            ratioAutonomieFinanciere: safe.ratioAutonomieFinanciere,
          },
          indicateurs: ind,
        },
      });
      if (error) {
        const errStr = [
          safeText(error?.message),
          safeText((error as any)?.context),
          safeText(error),
        ].join(' ').toLowerCase();
        if (errStr.includes('402') || errStr.includes('payment_required') || errStr.includes('crédits') || errStr.includes('credits') || errStr.includes('non-2xx')) {
          toast.error('Crédits IA temporairement épuisés. Le rapport peut être généré sans les commentaires IA.');
        } else if (errStr.includes('429') || errStr.includes('rate_limited') || errStr.includes('too many')) {
          toast.error('Limite de requêtes IA atteinte, réessayez dans quelques instants.');
        } else {
          toast.error('Erreur lors de la génération des commentaires IA.');
        }
        return;
      }
      const text = data?.text || '';
      const parts = text.split('---');
      setAiText1((parts[0] || '').trim());
      setAiText3((parts[1] || '').trim());
      toast.success('Commentaires IA générés');
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap no-print">
        <Button onClick={genererIA} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Génération IA…' : 'Générer commentaires IA'}
        </Button>
        <Button variant="default" className="bg-[hsl(215,70%,45%)] hover:bg-[hsl(215,70%,40%)]" onClick={() => {
          try {
            const serviceRows = getServiceSdeRows(sdeRows || []);
            const sdrServiceRows = getServiceSdrRows(sdrRows || []);
            const etsSde = getEtsSdeRow(sdeRows || []);
            const etsSdr = getEtsSdrRow(sdrRows || []);

            const mapSdeSection = (code: string, label: string) => {
              const row = serviceRows.find(r => r.serviceCode === code || r.service?.includes(label));
              return row ? { code, libelle: label, budget: row.budget, realise: row.realise, disponible: row.budget - row.realise, taux: row.budget > 0 ? (row.realise / row.budget * 100) : 0 } : null;
            };

            const sg = mapSdeSection('SG', 'SERVICES GENERAUX');
            const ap = mapSdeSection('AP', 'ACTIVITES');
            const ve = mapSdeSection('VE', 'VIE');
            const alo = mapSdeSection('ALO', 'ADMIN');
            const ss = mapSdeSection('SS', 'SERVICES SPECIAUX');

            const sdeData = {
              totalBudget: etsSde?.budget ?? 0,
              totalRealise: etsSde?.realise ?? 0,
              totalDisponible: (etsSde?.budget ?? 0) - (etsSde?.realise ?? 0),
              sections: [
                sg ? { ...sg, sousLignes: [ap, ve, alo].filter(Boolean) as any[] } : null,
                ss ? { ...ss, sousLignes: [] } : null,
              ].filter(Boolean) as any[],
            };

            const mapSdrSection = (code: string, label: string) => {
              const row = sdrServiceRows.find(r => r.serviceCode === code || r.service?.includes(label));
              return row ? { code, libelle: label, budget: row.budget, realise: row.realise, ecart: row.realise - row.budget } : null;
            };

            const sdrData = {
              totalBudget: etsSdr?.budget ?? 0,
              totalRealise: etsSdr?.realise ?? 0,
              totalEcart: (etsSdr?.realise ?? 0) - (etsSdr?.budget ?? 0),
              sections: [mapSdrSection('SG', 'SERVICES GENERAUX'), mapSdrSection('AP', 'ACTIVITES'), mapSdrSection('VE', 'VIE'), mapSdrSection('ALO', 'ADMIN'), mapSdrSection('SS', 'SERVICES SPECIAUX')].filter(Boolean) as any[],
            };

            generateRapportPDF({
              etablissement: {
                nom: etab.nom || '',
                uai: etab.uai || '',
                adresse: etab.adresse || '',
                commune: etab.commune || '',
                academie: etab.academie || '',
                annee: etab.exercice,
                dateEdition: new Date().toLocaleDateString('fr-FR'),
                ordonnateur: nomOrdonnateur || etab.ordonnateur || '',
                agentComptable: etab.agentComptable || '',
              },
              sde: sdeData,
              sdr: sdrData,
              resultat: {
                recettesRealisees: etsSdr?.realise ?? R.totalProduitsSdr ?? 0,
                depensesRealisees: etsSde?.realise ?? R.totalChargesSde ?? 0,
                resultatComptable: R.resultatBudgetaire ?? 0,
                creditDisponible: (etsSde?.budget ?? 0) - (etsSde?.realise ?? 0),
                ecartRecettes: (etsSdr?.realise ?? 0) - (etsSdr?.budget ?? 0),
              },
              commentaires: {
                contexte: commentairePresentation || aiText1 || undefined,
                executionDepenses: commentaireDomaines || undefined,
                executionRecettes: commentaireSubventions || undefined,
                perspectivesFinancieres: commentairePerspectives || aiText3 || undefined,
              },
            });
            toast.success('Rapport PDF généré dans un nouvel onglet');
          } catch (e) { console.error(e); toast.error('Erreur lors de la génération du rapport'); }
        }}>
          <Download className="h-4 w-4 mr-2" /> 📄 Générer le rapport PDF
        </Button>
      </div>

      {/* ═══════════ ANALYSE AUTO POUR LE CA ═══════════ */}
      {autoComments.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 no-print">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Synthèse pour le conseil d'administration
              <Badge variant="outline" className="ml-auto text-[10px] border-primary/30">Commentaires automatiques</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs leading-relaxed">
              {autoComments.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ PRÉCONISATIONS IA ═══════════ */}
      {preconisationsRaw.length > 0 && (
        <Card className="border-warning/20 bg-warning/5 no-print">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />
              Préconisations
              <Badge variant="outline" className="ml-auto text-[10px] border-warning/30">Analyse des indicateurs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs leading-relaxed">
              {preconisationsRaw.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-5xl mx-auto print:shadow-none">
        <CardContent className="p-8">
          {/* Header officiel */}
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

          {/* §1 Présentation */}
          <SectionTitre numero="1" title="Présentation de l'établissement" />
          {ind && ind.effectif_eleves > 0 && (
            <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <IndicatorBadge icon={<GraduationCap className="h-4 w-4 text-primary" />} label="Élèves" value={`${ind.effectif_eleves}`} />
              <IndicatorBadge icon={<Utensils className="h-4 w-4 text-warning" />} label="DP" value={`${ind.effectif_dp}`} />
              <IndicatorBadge icon={<Building2 className="h-4 w-4 text-muted-foreground" />} label="Internes" value={`${ind.effectif_internes}`} />
              <IndicatorBadge icon={<Users className="h-4 w-4 text-emerald-600" />} label="Boursiers" value={`${ind.effectif_boursiers} (${tauxBoursiers} %)`} />
              {ind.nb_repas_servis > 0 && <IndicatorBadge icon={<Utensils className="h-4 w-4 text-warning" />} label="Repas/an" value={`${ind.nb_repas_servis.toLocaleString('fr-FR')}`} />}
              {ind.effectif_personnel > 0 && <IndicatorBadge icon={<Users className="h-4 w-4 text-primary" />} label="Personnel" value={`${ind.effectif_personnel} ETP`} />}
              {ind.etp_ressources_propres > 0 && <IndicatorBadge icon={<Wallet className="h-4 w-4 text-emerald-600" />} label="ETP ress. propres" value={`${ind.etp_ressources_propres}`} />}
              {ind.surface_batiments > 0 && <IndicatorBadge icon={<Building2 className="h-4 w-4 text-muted-foreground" />} label="Surface" value={`${ind.surface_batiments.toLocaleString('fr-FR')} m²`} />}
            </div>
          )}
          <Textarea value={aiText1} onChange={e => setAiText1(e.target.value)}
            placeholder="Cliquez sur 'Générer commentaires IA' ou saisissez votre texte ici…" rows={4}
            className="mb-2 bg-muted/30 text-sm" />
          <CommentaireBox label="Commentaire sur la présentation" value={commentairePresentation} onChange={setCommentairePresentation} status={statusPres} lastSaved={lastSavedPres} />

          {/* §2 Dashboard — KPI principaux */}
          <SectionTitre numero="2" title="Tableau de bord financier" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Résultat budgétaire" value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="📊" sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'} isText />
            <KPICard label="CAF / IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
            <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub={`${Math.round(safe.joursFdr)} jours`} isText />
            <KPICard label="Trésorerie" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(safe.joursTresorerie)} jours`} isText />
          </div>

          {/* Balance dépenses/recettes — graphique visuel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                <Scale className="h-3 w-3" /> Balance dépenses / recettes
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Dépenses', value: R.totalChargesSde, fill: 'hsl(0,70%,55%)' },
                  { name: 'Recettes', value: R.totalProduitsSdr, fill: 'hsl(160,45%,45%)' },
                ]} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    <Cell fill="hsl(0,70%,55%)" />
                    <Cell fill="hsl(160,45%,45%)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs mt-2 font-semibold">
                Solde : <span className={R.resultatBudgetaire >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(R.resultatBudgetaire)}</span>
              </div>
            </div>

            {/* Taux d'exécution budgétaire */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" /> Taux d'exécution budgétaire
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={execData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Prévu" fill="hsl(215,70%,50%)" opacity={0.4} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Réalisé" fill="hsl(215,70%,50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-around text-xs mt-2">
                <span>Dépenses : <strong className={R.tauxExecCharges >= 0.85 ? 'text-emerald-600' : 'text-warning'}>{(R.tauxExecCharges * 100).toFixed(1)} %</strong></span>
                <span>Recettes : <strong className={R.tauxExecProduits >= 0.9 ? 'text-emerald-600' : 'text-warning'}>{(R.tauxExecProduits * 100).toFixed(1)} %</strong></span>
              </div>
            </div>
          </div>
          <CommentaireBox label="Commentaire sur le résultat et l'exécution" value={commentaireResultat} onChange={setCommentaireResultat} />

          {/* §3 Répartition dépenses + recettes */}
          <SectionTitre numero="3" title="Répartition des dépenses et des recettes" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {depNatureData.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <PieChartIcon className="h-3 w-3" /> Dépenses par nature
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={depNatureData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {depNatureData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {recettesOrigineData.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <PieChartIcon className="h-3 w-3" /> Recettes par origine (État / Coll. / Propres)
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={recettesOrigineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {recettesOrigineData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <CommentaireBox label="Commentaire sur la répartition des dépenses et recettes" value={commentaireRepartition} onChange={setCommentaireRepartition} />

          {/* §4 Évolution par domaine */}
          {hasN1 && (
            <>
              <SectionTitre numero="4" title={`Évolution N / N-1`} />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead><tr className="bg-slate-700 text-white">
                    <th className="p-2 text-left">Agrégat</th>
                    <th className="p-2 text-right">N ({etab.exercice})</th>
                    <th className="p-2 text-right">N-1 ({etab.exercice - 1})</th>
                    <th className="p-2 text-right">Variation</th>
                    <th className="p-2 text-right">%</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { label: 'Dépenses réalisées', vN: R.totalChargesSde, vN1: R.totalChargesSdeN1 },
                      { label: 'Recettes réalisées', vN: R.totalProduitsSdr, vN1: R.totalProduitsSdrN1 },
                      { label: 'Résultat budgétaire', vN: R.resultatBudgetaire, vN1: R.resultatBudgetaireN1 },
                    ].map(row => {
                      const v = row.vN - (row.vN1 ?? 0);
                      const pct = (row.vN1 ?? 0) > 0 ? (v / (row.vN1 ?? 1)) * 100 : 0;
                      return (
                        <tr key={row.label} className="border-t">
                          <td className="p-2 font-semibold">{row.label}</td>
                          <td className="p-2 text-right font-mono">{formatEur(row.vN)}</td>
                          <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.vN1 ?? 0)}</td>
                          <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{v >= 0 ? '+' : ''}{formatEur(v)}</td>
                          <td className={`p-2 text-right font-mono ${v >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)} %</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <CommentaireBox label="Commentaire sur l'évolution N / N-1" value={commentaireEvolution} onChange={setCommentaireEvolution} />

          {/* §5 Exécution par domaine D1-D9 */}
          {domainesList.length > 0 && (
            <>
              <SectionTitre numero="5" title={`Exécution par domaine — Exercice ${etab.exercice}`} />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead><tr className="bg-slate-700 text-white">
                    <th className="p-2 text-left">Domaine</th>
                    <th className="p-2 text-right">Crédits ouverts</th>
                    <th className="p-2 text-right">Dépenses</th>
                    <th className="p-2 text-right">Taux exéc.</th>
                    <th className="p-2 text-right">Prév. recettes</th>
                    <th className="p-2 text-right">Recettes</th>
                    <th className="p-2 text-right">Solde</th>
                  </tr></thead>
                  <tbody>
                    {domainesList.map(d => (
                      <tr key={d.code} className="border-t">
                        <td className="p-2 font-semibold">{d.libelle}</td>
                        <td className="p-2 text-right font-mono">{formatEur(d.chargesPrev)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatEur(d.chargesReel)}</td>
                        <td className="p-2 text-right">
                          <span className={`font-semibold ${d.tauxExecCharges >= 0.9 ? 'text-emerald-600' : d.tauxExecCharges >= 0.7 ? 'text-warning' : 'text-destructive'}`}>
                            {(d.tauxExecCharges * 100).toFixed(1)} %
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono">{formatEur(d.produitsPrev)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatEur(d.produitsReel)}</td>
                        <td className={`p-2 text-right font-mono font-bold ${d.solde >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                          {formatEur(d.solde)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-800 text-white font-bold">
                      <td className="p-2">TOTAL</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalChargesPrev)}</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td>
                      <td className="p-2 text-right">{(R.tauxExecCharges * 100).toFixed(1)} %</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsPrev)}</td>
                      <td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td>
                      <td className={`p-2 text-right font-mono ${R.resultatBudgetaire >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatEur(R.resultatBudgetaire)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {domChartData.length > 1 && (
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={domChartData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Dépenses" fill="hsl(38,92%,50%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Recettes" fill="hsl(160,45%,45%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Écarts significatifs N/N-1 */}
              {hasN1 && (() => {
                const ecarts = domainesList.filter(d => Math.abs(d.pctVariationCharges) > 10 || Math.abs(d.pctVariationProduits) > 10);
                if (ecarts.length === 0) return null;
                return (
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 mb-4 text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" /> Écarts significatifs N / N-1 (&gt; 10%)</p>
                    {ecarts.map(d => (
                      <div key={d.code}>
                        <strong>{d.libelle}</strong> :
                        {Math.abs(d.pctVariationCharges) > 10 && (
                          <span className={d.pctVariationCharges > 0 ? ' text-destructive' : ' text-emerald-600'}>
                            {' '}Dépenses {d.pctVariationCharges > 0 ? '+' : ''}{d.pctVariationCharges.toFixed(1)} % ({formatEur(d.variationCharges)})
                          </span>
                        )}
                        {Math.abs(d.pctVariationProduits) > 10 && (
                          <span className={d.pctVariationProduits >= 0 ? ' text-emerald-600' : ' text-destructive'}>
                            {' '}Recettes {d.pctVariationProduits >= 0 ? '+' : ''}{d.pctVariationProduits.toFixed(1)} % ({formatEur(d.variationProduits)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
          <CommentaireBox label="Commentaire sur l'exécution par domaine" value={commentaireDomaines} onChange={setCommentaireDomaines} />

          {/* §6 FDR — Jauge avec seuil 30 jours */}
          <SectionTitre numero="6" title="Fonds de roulement — autonomie financière" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Jauge FDR en jours */}
            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground font-semibold mb-3">FDR en jours de fonctionnement</p>
              <div className="relative w-48 h-28">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                  {/* Fond */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
                  {/* Seuil 30 jours - ligne de repère */}
                  {(() => {
                    const maxJ = Math.max(90, safe.joursFdr + 10);
                    const seuilAngle = Math.min(1, 30 / maxJ);
                    const angle = Math.PI * (1 - seuilAngle);
                    const x = 100 + 80 * Math.cos(angle);
                    const y = 100 - 80 * Math.sin(angle);
                    return <circle cx={x} cy={y} r="4" fill="hsl(38,92%,50%)" />;
                  })()}
                  {/* Valeur */}
                  {(() => {
                    const maxJ = Math.max(90, safe.joursFdr + 10);
                    const pct = Math.min(1, Math.max(0, safe.joursFdr / maxJ));
                    const angle = Math.PI * (1 - pct);
                    const x = 100 + 80 * Math.cos(angle);
                    const y = 100 - 80 * Math.sin(angle);
                    const color = safe.joursFdr >= 30 ? 'hsl(160,45%,45%)' : safe.joursFdr >= 15 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,55%)';
                    // Draw arc
                    const endAngle = Math.PI;
                    const startAngle = angle;
                    const large = (endAngle - startAngle) > Math.PI ? 1 : 0;
                    const sx = 100 + 80 * Math.cos(endAngle);
                    const sy = 100 - 80 * Math.sin(endAngle);
                    return (
                      <>
                        <path d={`M ${sx} ${sy} A 80 80 0 ${large} 0 ${x} ${y}`} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
                        <text x="100" y="85" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{Math.round(safe.joursFdr)}</text>
                        <text x="100" y="102" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">jours</text>
                      </>
                    );
                  })()}
                  {/* Labels */}
                  <text x="20" y="108" fontSize="8" fill="hsl(var(--muted-foreground))">0</text>
                  <text x="180" y="108" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="end">{Math.max(90, Math.round(safe.joursFdr) + 10)}</text>
                </svg>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Seuil 30 j
              </div>
            </div>

            {/* FDR composition */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Composition du FDR</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={[
                  { name: 'Encaissé', value: safe.fdrPartEncaissee, fill: 'hsl(160,45%,45%)' },
                  { name: 'Non encaissé', value: safe.fdrPartNonEncaissee, fill: 'hsl(38,92%,50%)' },
                ]} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={90} fontSize={10} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    <Cell fill="hsl(160,45%,45%)" />
                    <Cell fill="hsl(38,92%,50%)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Structure FDR = BFR + Tréso */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">Structure bilantielle</p>
              <table className="w-full text-xs border">
                <tbody>
                  <tr className="border-b bg-muted/20"><td className="p-2 font-semibold">FDR</td><td className="p-2 text-right font-mono font-bold">{formatEur(R.fdrComptable)}</td></tr>
                  <tr className="border-b"><td className="p-2">= BFR</td><td className="p-2 text-right font-mono">{formatEur(R.bfr)}</td></tr>
                  <tr className="border-b"><td className="p-2">+ Trésorerie</td><td className="p-2 text-right font-mono">{formatEur(R.tresorerie)}</td></tr>
                  <tr><td className="p-2 font-semibold">FDR mobilisable</td><td className="p-2 text-right font-mono font-bold">{formatEur(safe.fdrMobilisable)}</td></tr>
                </tbody>
              </table>
              <div className="text-[10px] text-muted-foreground mt-2 text-center">
                {Math.abs(R.fdrComptable - R.bfr - R.tresorerie) < 1
                  ? <span className="text-emerald-600 font-bold">✅ Vérifié : FDR = BFR + Tréso</span>
                  : <span className="text-destructive font-bold">⚠ Écart : {formatEur(R.fdrComptable - R.bfr - R.tresorerie)}</span>
                }
              </div>
            </div>
          </div>
          <CommentaireBox label="Commentaire sur le fonds de roulement" value={commentaireFDR} onChange={setCommentaireFDR} />

          {/* §7 Trésorerie annuelle */}
          <SectionTitre numero="7" title="Trésorerie" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Trésorerie nette" value={formatEur(R.tresorerie)} color={R.tresorerie >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(safe.joursTresorerie)} jours`} isText />
            <KPICard label="DGP" value={`${Math.round(safe.dgpJours)} jours`} color={safe.dgpJours > 30 ? 'red' : 'green'} icon="⏱️" sub="Délai global paiement" isText />
            <KPICard label="DGR" value={`${Math.round(safe.dgrJours)} jours`} color={safe.dgrJours > 60 ? 'red' : 'green'} icon="⏱️" sub="Délai global recouvrement" isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
          </div>
          <CommentaireBox label="Commentaire sur la trésorerie" value={commentaireTresorerie} onChange={setCommentaireTresorerie} />

          {/* §8 Opérations d'ordre */}
          <SectionTitre numero="8" title="Opérations d'ordre" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Opération</th><th className="p-2 text-right">Charges (OO)</th><th className="p-2 text-right">Produits (OO)</th></tr></thead>
              <tbody>
                <tr className="border-t"><td className="p-2">Dotations aux amortissements (68)</td><td className="p-2 text-right font-mono">{formatEur(oo.dotationsAmort)}</td><td className="p-2 text-right font-mono">—</td></tr>
                <tr className="border-t"><td className="p-2">Reprises sur amortissements/provisions (78)</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.reprisesAmort)}</td></tr>
                <tr className="border-t"><td className="p-2">VNC des éléments cédés (675)</td><td className="p-2 text-right font-mono">{formatEur(oo.vncCessions)}</td><td className="p-2 text-right font-mono">—</td></tr>
                <tr className="border-t"><td className="p-2">Produits de cessions (775/776/777)</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.produitsCessions)}</td></tr>
                <tr className="border-t"><td className="p-2">Neutralisation subventions d'investissement</td><td className="p-2 text-right font-mono">—</td><td className="p-2 text-right font-mono">{formatEur(oo.neutralisationSubInv)}</td></tr>
                <tr className="border-t font-bold bg-muted/20">
                  <td className="p-2">TOTAL OO</td>
                  <td className="p-2 text-right font-mono">{formatEur(oo.totalChargesOO)}</td>
                  <td className="p-2 text-right font-mono">{formatEur(oo.totalProduitsOO)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground mb-4 bg-muted/10 rounded p-3">
            💡 <strong>Pour le CA :</strong> Les opérations d'ordre sont des écritures purement comptables (amortissements, provisions). Elles n'ont aucun impact sur la trésorerie. Un solde d'OO négatif est normal et traduit la politique d'amortissement du patrimoine.
          </div>
          <CommentaireBox label="Commentaire sur les opérations d'ordre" value={commentaireOO} onChange={setCommentaireOO} />

          {/* §9 Focus SRH */}
          {(srhDomaine || (ind && ind.nb_repas_servis > 0)) && (
            <>
              <SectionTitre numero="9" title="Focus — Service de restauration et d'hébergement (SRH)" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {srhDomaine && (
                  <>
                    <KPICard label="Recettes SRH" value={formatEur(srhRecettes)} color="green" icon="🍽️" isText />
                    <KPICard label="Dépenses SRH" value={formatEur(srhDepenses)} color="amber" icon="🍽️" isText />
                    <KPICard label="Solde SRH" value={formatEur(srhSolde)} color={srhSolde >= 0 ? 'green' : 'red'} icon="📊" sub={srhSolde >= 0 ? 'Excédent' : 'Déficit'} isText />
                    {srhDomaine.tauxExecCharges > 0 && (
                      <KPICard label="Taux exéc. SRH" value={`${(srhDomaine.tauxExecCharges * 100).toFixed(1)} %`} color={srhDomaine.tauxExecCharges >= 0.85 ? 'green' : 'amber'} icon="✅" isText />
                    )}
                  </>
                )}
              </div>
              {ind && ind.nb_repas_servis > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                  <IndicatorBadge icon={<Utensils className="h-4 w-4 text-warning" />} label="Repas élèves" value={ind.nb_repas_servis.toLocaleString('fr-FR')} />
                  {ind.nb_repas_commensaux > 0 && <IndicatorBadge icon={<Utensils className="h-4 w-4 text-muted-foreground" />} label="Repas commensaux" value={ind.nb_repas_commensaux.toLocaleString('fr-FR')} />}
                  {ind.cout_denrees_repas > 0 && (
                    <>
                      <IndicatorBadge icon={<Wallet className="h-4 w-4 text-primary" />} label="Coût denrées/repas" value={`${ind.cout_denrees_repas.toFixed(2)} €`} />
                      {srhDepenses > 0 && ind.nb_repas_servis > 0 && (
                        <IndicatorBadge icon={<Target className="h-4 w-4 text-emerald-600" />} label="Coût complet/repas" value={`${(srhDepenses / (ind.nb_repas_servis + (ind.nb_repas_commensaux || 0))).toFixed(2)} €`} />
                      )}
                    </>
                  )}
                </div>
              )}
              {srhDomaine && (
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={[
                      { name: 'Dépenses', value: srhDepenses, fill: 'hsl(38,92%,50%)' },
                      { name: 'Recettes', value: srhRecettes, fill: 'hsl(160,45%,45%)' },
                      { name: 'Solde', value: srhSolde, fill: srhSolde >= 0 ? 'hsl(160,45%,45%)' : 'hsl(0,72%,55%)' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        <Cell fill="hsl(38,92%,50%)" />
                        <Cell fill="hsl(160,45%,45%)" />
                        <Cell fill={srhSolde >= 0 ? 'hsl(160,45%,45%)' : 'hsl(0,72%,55%)'} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-2 bg-muted/10 rounded p-3">
                💡 <strong>Pour le CA :</strong> Le SRH doit être équilibré (recettes = dépenses). Un excédent est affecté aux réserves SRH (c/106870). Un déficit chronique nécessite une révision des tarifs de restauration.
              </div>
              <CommentaireBox label="Commentaire sur le SRH" value={commentaireSRH} onChange={setCommentaireSRH} />
            </>
          )}

          {/* §10 Suivi des subventions */}
          <SectionTitre numero="10" title="Suivi des subventions et financements" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {subventionsData.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <PieChartIcon className="h-3 w-3" /> Situation des financements
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={subventionsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {subventionsData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div>
              <table className="w-full text-xs border">
                <tbody>
                  {safe.creancesEtat > 0 && <tr className="border-b"><td className="p-2">Créances sur l'État</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesEtat)}</td></tr>}
                  {safe.creancesCollectivite > 0 && <tr className="border-b"><td className="p-2">Créances sur la collectivité</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesCollectivite)}</td></tr>}
                  {safe.creancesFamilles > 0 && <tr className="border-b"><td className="p-2">Créances familles</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesFamilles)}</td></tr>}
                  {safe.reliquatsSubventions > 0 && <tr className="border-b"><td className="p-2">Reliquats de subventions</td><td className="p-2 text-right font-mono">{formatEur(safe.reliquatsSubventions)}</td></tr>}
                  <tr className="font-bold bg-muted/20"><td className="p-2">Total créances</td><td className="p-2 text-right font-mono">{formatEur(safe.totalCreances)}</td></tr>
                </tbody>
              </table>
              <div className="text-xs text-muted-foreground mt-2 bg-muted/10 rounded p-2">
                💡 Les reliquats de subventions sont des fonds affectés non encore utilisés. Ils ne sont pas disponibles pour le fonctionnement courant.
              </div>
            </div>
          </div>
          <CommentaireBox label="Commentaire sur les subventions et financements" value={commentaireSubventions} onChange={setCommentaireSubventions} />

          {/* §11 Situation patrimoniale */}

          {/* §11 Situation patrimoniale */}
          <SectionTitre numero="11" title="Situation patrimoniale" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="Immobilisations" value={formatEur(R.totalImmo)} color="blue" icon="🏗️" isText />
            <KPICard label="Amortissements" value={formatEur(R.totalAmortissements)} color="amber" icon="📉" isText />
            <KPICard label="Valeur nette" value={formatEur(safe.valeurNette)} color={safe.valeurNette >= 0 ? 'green' : 'red'} icon="🏢" isText />
          </div>
          <CommentaireBox label="Commentaire sur la situation patrimoniale" value={commentairePatrimoine} onChange={setCommentairePatrimoine} />

          {/* §12 Pilotage budgétaire (REPROFI) */}
          <SectionTitre numero="12" title="Pilotage budgétaire — Budget initial vs exécuté" />
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border">
              <thead><tr className="bg-slate-700 text-white">
                <th className="p-2 text-left">Agrégat</th>
                <th className="p-2 text-right">Budget initial</th>
                <th className="p-2 text-right">Budget exécuté</th>
                <th className="p-2 text-right">Écart</th>
                <th className="p-2 text-right">Écart %</th>
              </tr></thead>
              <tbody>
                {[
                  { label: 'Charges totales', bi: R.totalChargesPrev, be: R.totalChargesSde },
                  { label: 'Produits totaux', bi: R.totalProduitsPrev, be: R.totalProduitsSdr },
                  { label: 'Résultat', bi: R.totalProduitsPrev - R.totalChargesPrev, be: R.resultatBudgetaire },
                ].map(row => {
                  const ecart = row.be - row.bi;
                  const pctE = row.bi !== 0 ? (ecart / Math.abs(row.bi)) * 100 : 0;
                  return (
                    <tr key={row.label} className="border-t">
                      <td className="p-2 font-semibold">{row.label}</td>
                      <td className="p-2 text-right font-mono text-muted-foreground">{formatEur(row.bi)}</td>
                      <td className="p-2 text-right font-mono font-bold">{formatEur(row.be)}</td>
                      <td className={`p-2 text-right font-mono ${ecart >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{ecart >= 0 ? '+' : ''}{formatEur(ecart)}</td>
                      <td className={`p-2 text-right font-mono ${ecart >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{pctE >= 0 ? '+' : ''}{pctE.toFixed(1)} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CommentaireBox label="Commentaire sur le pilotage budgétaire" value={commentairePilotage} onChange={setCommentairePilotage} />

          {/* §13 Points d'attention */}
          <SectionTitre numero="13" title="Points d'attention et perspectives" />
          <Textarea value={aiText3} onChange={e => setAiText3(e.target.value)}
            placeholder="Cliquez sur 'Générer commentaires IA' ou saisissez votre texte ici…" rows={4}
            className="mb-4 bg-muted/30 text-sm" />

          <CommentaireBox label="Perspectives pour l'exercice suivant" value={commentairePerspectives} onChange={setCommentairePerspectives} />

          {ind && ind.montant_fonds_social > 0 && (
            <div className="mb-4 bg-muted/30 rounded-lg p-3 text-xs">
              <strong>Fonds social mobilisé :</strong> {formatEur(ind.montant_fonds_social)} — {ind.effectif_boursiers} boursier(s)
            </div>
          )}

          {/* Signataires — Saisie des noms */}
          <SectionTitre numero="14" title="Signataires" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-xs font-bold">Nom de l'ordonnateur</Label>
              <Input value={nomOrdonnateur} onChange={e => setNomOrdonnateur(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold">Nom du secrétaire général</Label>
              <Input value={nomSecretaireGeneral} onChange={e => setNomSecretaireGeneral(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground">L'ordonnateur</strong>
              <div className="mt-8">{nomOrdonnateur || etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-right">
              <strong className="block text-foreground">Le secrétaire général</strong>
              <div className="mt-8">{nomSecretaireGeneral || etab.secretaireGeneral || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RAPPORT DE L'AGENT COMPTABLE — Version enrichie
// Saisie complémentaire, graphiques, PDF officiel
// PAS de visa du comptable supérieur
// ═══════════════════════════════════════════════════════════════

interface Prelevement { objet: string; montant: number; dateCA: string; }

export function RapportACSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const ind = useExtraIndicators();
  const [aiObs, setAiObs] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const tmcapAlertThreshold = Math.max(0, etab.tmcapSeuilAlerte ?? 15);

  // ── Saisie complémentaire (persistée) ──────────────────────
  const acKey = `cofieple_rapport_ac_${etab.uai}_${etab.exercice}`;
  const [nomAgentComptable, setNomAgentComptable] = usePersistedState(`${acKey}_nom_ac`, etab.agentComptable || '');
  const [prelevements, setPrelevements] = usePersistedState<Prelevement[]>(`${acKey}_prelevements`, []);
  const [explicationsResultat, setExplicationsResultat] = usePersistedState(`${acKey}_expl_resultat`, '');
  const [commentaireFDR, setCommentaireFDR] = usePersistedState(`${acKey}_com_fdr`, '');
  const [commentaireBFR, setCommentaireBFR] = usePersistedState(`${acKey}_com_bfr`, '');
  const [commentaireTresorerie, setCommentaireTresorerie] = usePersistedState(`${acKey}_com_tresorerie`, '');
  const [commentaireChargesRecouvrement, setCommentaireChargesRecouvrement] = usePersistedState(`${acKey}_com_charges`, '');
  const [commentairePatrimoine, setCommentairePatrimoine] = usePersistedState(`${acKey}_com_patrimoine`, '');
  const [commentaireCreances, setCommentaireCreances] = usePersistedState(`${acKey}_com_creances`, '');
  const [commentaireReserves, setCommentaireReserves] = usePersistedState(`${acKey}_com_reserves`, '');
  const [commentaireRatios, setCommentaireRatios] = usePersistedState(`${acKey}_com_ratios`, '');
  const [commentairePluriannuel, setCommentairePluriannuel] = usePersistedState(`${acKey}_com_pluriannuel`, '');
  const [commentaireGeneral, setCommentaireGeneral] = usePersistedState(`${acKey}_com_general`, '');

  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_exercises')
          .select('exercice,fdr,bfr,tresorerie,caf,reserves,jours_autonomie,resultat_budgetaire,resultat_comptable,jours_tresorerie,tmcap,tmnr')
          .eq('uai', etab.uai).eq('user_id', session.session.user.id)
          .order('exercice', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  const safe = {
    fdrPartEncaissee: R?.fdrPartEncaissee ?? 0,
    fdrPartNonEncaissee: R?.fdrPartNonEncaissee ?? 0,
    fdrPctEncaissee: R?.fdrPctEncaissee ?? 0,
    fdrPctNonEncaissee: R?.fdrPctNonEncaissee ?? 0,
    fdrMobilisable: R?.fdrMobilisable ?? 0,
    chargesNonDecaissables: R?.chargesNonDecaissables ?? 0,
    produitsNonEncaissables: R?.produitsNonEncaissables ?? 0,
    cafComptable: R?.cafComptable ?? 0,
    varFdrBas: R?.varFdrBas ?? 0,
    joursFdr: R?.joursFdr ?? 0,
    joursTresorerie: R?.joursTresorerie ?? 0,
    tmcap: R?.tmcap ?? 0,
    tmnr: R?.tmnr ?? 0,
    totalCreances: R?.totalCreances ?? 0,
    totalDettes: R?.totalDettes ?? 0,
    creancesEtat: R?.creancesEtat ?? 0,
    creancesCollectivite: R?.creancesCollectivite ?? 0,
    creancesFamilles: R?.creancesFamilles ?? 0,
    creancesAutres: R?.creancesAutres ?? 0,
    dettesFournisseurs: R?.dettesFournisseurs ?? 0,
    dettesEtat: R?.dettesEtat ?? 0,
    dettesCollectivite: R?.dettesCollectivite ?? 0,
    dettesAutres: R?.dettesAutres ?? 0,
    reliquatsSubventions: R?.reliquatsSubventions ?? 0,
    valeurNette: R?.valeurNette ?? 0,
    variationPatrimoine: R?.variationPatrimoine ?? 0,
    patrimoineOriginesFondsPropres: R?.patrimoineOriginesFondsPropres ?? 0,
    patrimoineOriginesPctFP: R?.patrimoineOriginesPctFP ?? 0,
    patrimoineOriginesSubventions: R?.patrimoineOriginesSubventions ?? 0,
    patrimoineOriginesPctSub: R?.patrimoineOriginesPctSub ?? 0,
    tresoComposition: R?.tresoComposition ?? { autonomieFinanciere: 0, depotsCautions: 0, reglementsEnAttente: 0, reliquatsSubventions: 0 },
    prelevementsReserves: R?.prelevementsReserves ?? { totalPrelevements: 0, prelevementsInvestissement: 0, prelevementsFonctionnement: 0, variationReserves: 0 },
    dgpJours: R?.dgpJours ?? 0,
    dgrJours: R?.dgrJours ?? 0,
    fdrComptableN1: R?.fdrComptableN1 ?? 0,
    bfrN1: R?.bfrN1 ?? 0,
    tresorerieN1: R?.tresorerieN1 ?? 0,
    ratioLiquiditeGenerale: R?.ratioLiquiditeGenerale ?? 0,
    ratioLiquiditeReduite: R?.ratioLiquiditeReduite ?? 0,
    ratioLiquiditeImmediate: R?.ratioLiquiditeImmediate ?? 0,
    ratioAutonomieFinanciere: R?.ratioAutonomieFinanciere ?? 0,
    ratioSolvabilite: R?.ratioSolvabilite ?? 0,
    ratioEndettement: R?.ratioEndettement ?? 0,
    ratioChargesPersonnel: R?.ratioChargesPersonnel ?? 0,
    ratioCouvertureCharges: R?.ratioCouvertureCharges ?? 0,
  };

  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;

  const totalPrelev = prelevements.reduce((s, p) => s + p.montant, 0);
  const resultatHorsPrelev = (R?.resultatComptable ?? 0) + totalPrelev;

  // ── Pie data for trésorerie composition ───────────────────
  const tresoData = useMemo(() => {
    const tc = safe.tresoComposition;
    return [
      { name: 'Autonomie financière', value: Math.abs(tc.autonomieFinanciere), fill: 'hsl(215, 70%, 50%)' },
      { name: 'Dépôts & cautions', value: tc.depotsCautions, fill: 'hsl(160, 45%, 45%)' },
      { name: 'Règlements en attente', value: tc.reglementsEnAttente, fill: 'hsl(38, 92%, 50%)' },
      { name: 'Reliquats subventions', value: tc.reliquatsSubventions, fill: 'hsl(280, 50%, 50%)' },
    ].filter(d => d.value > 0);
  }, [safe.tresoComposition]);

  // ── Créances/Dettes pie data ──────────────────────────────
  const creancesPieData = useMemo(() => [
    { name: 'État', value: safe.creancesEtat, fill: 'hsl(215,70%,50%)' },
    { name: 'Collectivité', value: safe.creancesCollectivite, fill: 'hsl(160,45%,45%)' },
    { name: 'Familles', value: safe.creancesFamilles, fill: 'hsl(38,92%,50%)' },
    { name: 'Autres', value: safe.creancesAutres, fill: 'hsl(280,50%,50%)' },
  ].filter(d => d.value > 0), [safe.creancesEtat, safe.creancesCollectivite, safe.creancesFamilles, safe.creancesAutres]);

  const dettesPieData = useMemo(() => [
    { name: 'Fournisseurs', value: safe.dettesFournisseurs, fill: 'hsl(0,70%,55%)' },
    { name: 'État', value: safe.dettesEtat, fill: 'hsl(215,70%,50%)' },
    { name: 'Collectivité', value: safe.dettesCollectivite, fill: 'hsl(160,45%,45%)' },
    { name: 'Autres', value: safe.dettesAutres, fill: 'hsl(38,92%,50%)' },
  ].filter(d => d.value > 0), [safe.dettesFournisseurs, safe.dettesEtat, safe.dettesCollectivite, safe.dettesAutres]);

  // ── Radar ratios ──────────────────────────────────────────
  const radarRatiosData = useMemo(() => [
    { subject: 'Liquidité gén.', value: Math.min(safe.ratioLiquiditeGenerale * 50, 100) },
    { subject: 'Liquidité réd.', value: Math.min(safe.ratioLiquiditeReduite * 60, 100) },
    { subject: 'Liquidité imm.', value: Math.min(safe.ratioLiquiditeImmediate * 100, 100) },
    { subject: 'Autonomie fin.', value: Math.min(safe.ratioAutonomieFinanciere * 100, 100) },
    { subject: 'Solvabilité', value: Math.min(safe.ratioSolvabilite * 100, 100) },
    { subject: 'Couverture ch.', value: Math.min(safe.ratioCouvertureCharges * 500, 100) },
  ], [safe.ratioLiquiditeGenerale, safe.ratioLiquiditeReduite, safe.ratioLiquiditeImmediate, safe.ratioAutonomieFinanciere, safe.ratioSolvabilite, safe.ratioCouvertureCharges]);

  // ── Patrimoine bar data ───────────────────────────────────
  const patrimoineData = [
    { name: 'Brut', value: R?.totalImmo ?? 0, fill: 'hsl(215,70%,50%)' },
    { name: 'Amort.', value: -(R?.totalAmortissements ?? 0), fill: 'hsl(0,70%,55%)' },
    { name: 'Net', value: safe.valeurNette, fill: 'hsl(160,45%,45%)' },
  ];

  // ── Evolution chart ───────────────────────────────────────
  const hasN1Financial = safe.fdrComptableN1 !== 0 || safe.bfrN1 !== 0 || safe.tresorerieN1 !== 0;
  const evolutionData = hasN1Financial ? [
    { exercice: 'N-1', FDR: safe.fdrComptableN1, BFR: safe.bfrN1, Trésorerie: safe.tresorerieN1 },
    { exercice: 'N', FDR: R?.fdrComptable ?? 0, BFR: R?.bfr ?? 0, Trésorerie: R?.tresorerie ?? 0 },
  ] : [];

  // ── Smart analysis text ───────────────────────────────────
  const smartAnalysis = useMemo(() => {
    if (!R) return [];
    const parts: string[] = [];
    if (R.resultatComptable < 0 && totalPrelev > 0) {
      parts.push(`📊 Le déficit de ${formatEur(R.resultatComptable)} s'explique principalement par ${prelevements.length} prélèvement(s) sur fonds de roulement (${formatEur(totalPrelev)}), autorisés par le CA. Sans ces prélèvements, le résultat aurait été ${resultatHorsPrelev >= 0 ? 'excédentaire' : 'déficitaire'} de ${formatEur(Math.abs(resultatHorsPrelev))}.`);
    } else if (R.resultatComptable < 0) {
      parts.push(`📊 Le résultat déficitaire (${formatEur(R.resultatComptable)}) devra être imputé sur les réserves. Après affectation, les réserves s'élèveraient à ${formatEur(R.reserves + R.resultatComptable)}.`);
    }
    if (safe.fdrPctEncaissee > 80) {
      parts.push(`🏦 Le FDR est très largement encaissé (${safe.fdrPctEncaissee.toFixed(0)} %), signe d'une bonne autonomie financière.`);
    } else if (safe.fdrPctEncaissee < 40) {
      parts.push(`⚠️ La part encaissée du FDR est faible (${safe.fdrPctEncaissee.toFixed(0)} %). L'autonomie financière repose en grande partie sur des créances non encore recouvrées.`);
    }
    if (safe.joursTresorerie < 15) {
      parts.push(`🔴 La trésorerie ne couvre que ${Math.round(safe.joursTresorerie)} jours de fonctionnement. Situation tendue.`);
    } else if (safe.joursTresorerie > 90) {
      parts.push(`💚 La trésorerie couvre ${Math.round(safe.joursTresorerie)} jours — marge confortable, possibilité de prélèvement.`);
    }
    const chargesRef = R.totalChargesRef > 0 ? R.totalChargesRef : (R.totalChargesSde > 0 ? R.totalChargesSde : 0);
    const joursMobilisable = chargesRef > 0 ? Math.round(safe.fdrMobilisable / (chargesRef / 365)) : 0;
    if (joursMobilisable < 30) {
      parts.push(`⚠️ Le FDR mobilisable (${formatEur(safe.fdrMobilisable)}, ${joursMobilisable} jours) est inférieur au seuil recommandé de 30 jours.`);
    }
    // Ratios commentary
    if (safe.ratioLiquiditeGenerale < 1) {
      parts.push(`⚠️ Le ratio de liquidité générale (${safe.ratioLiquiditeGenerale.toFixed(2)}) est inférieur à 1. L'établissement pourrait avoir des difficultés à faire face à ses engagements à court terme.`);
    }
    if (safe.tmcap > tmcapAlertThreshold) {
      parts.push(`⚠️ Le TMcap (${safe.tmcap.toFixed(1)}%) dépasse le seuil d’alerte configuré (${tmcapAlertThreshold.toFixed(1)}%). Ce niveau peut révéler un retard de règlement fournisseurs au-delà de la clôture normale.`);
    } else if (safe.tmcap > 10) {
      parts.push(`ℹ️ Le TMcap (${safe.tmcap.toFixed(1)}%) traduit le montant des charges à payer enregistrées en fin d'exercice (factures de décembre à régler début N+1). Ce niveau reste cohérent avec une clôture comptable.`);
    }
    if (safe.tmnr > 5) {
      parts.push(`⚠️ Le TMnr (${safe.tmnr.toFixed(1)}%) indique un taux de non-recouvrement significatif. Des relances actives sont recommandées.`);
    }
    return parts;
  }, [R, safe, totalPrelev, prelevements, resultatHorsPrelev, tmcapAlertThreshold]);

  // ── Balance scale data (résultat) ─────────────────────────
  const balanceData = [
    { name: 'Dépenses', value: R?.totalChargesSde ?? 0, fill: 'hsl(0, 70%, 55%)' },
    { name: 'Recettes', value: R?.totalProduitsSdr ?? 0, fill: 'hsl(160, 45%, 45%)' },
  ];

  // ── FDR composition bar data ──────────────────────────────
  const fdrComposData = [
    { name: 'Encaissé', value: safe.fdrPartEncaissee, fill: 'hsl(160, 45%, 45%)' },
    { name: 'Non encaissé', value: safe.fdrPartNonEncaissee, fill: 'hsl(38, 92%, 50%)' },
  ];

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le rapport de l'agent comptable (M9-6 § V.2)." />;

  const pct = (v: number, t: number) => t > 0 ? `${((v / t) * 100).toFixed(1)} %` : '—';

  async function genererIA() {
    setAiLoading(true);
    const safeText = (value: unknown) => {
      try {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return `${value.name}: ${value.message}`;
        return JSON.stringify(value ?? '');
      } catch {
        return String(value ?? '');
      }
    };
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'agent_comptable', etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire, resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable, bfr: R.bfr, tresorerie: R.tresorerie,
            cafBudgetaire: R.cafBudgetaire, cafComptable: R.cafComptable,
            chargesNonDecaissables: R.chargesNonDecaissables,
            produitsNonEncaissables: R.produitsNonEncaissables,
            totalChargesReel: R.totalChargesSde, totalProduitsReel: R.totalProduitsSdr,
            reserves: R.reserves, joursAutonomie: R.joursAutonomie,
            joursFdr: R.joursFdr, joursTresorerie: R.joursTresorerie,
            tmcap: R.tmcap, tmnr: R.tmnr,
            fdrPctEncaissee: R.fdrPctEncaissee, fdrPctNonEncaissee: R.fdrPctNonEncaissee,
            totalCreances: R.totalCreances, totalDettes: R.totalDettes,
            reliquatsSubventions: R.reliquatsSubventions,
            valeurNette: R.valeurNette, variationPatrimoine: R.variationPatrimoine,
            patrimoineOriginesPctFP: R.patrimoineOriginesPctFP,
            fdrMobilisable: R.fdrMobilisable,
            prelevementsReserves: R.prelevementsReserves,
            dgpJours: R.dgpJours, dgrJours: R.dgrJours,
          },
          anomalies: nbAnom, bloquants: nbBloq, indicateurs: ind, historique: history,
        },
      });
      if (error) {
        const errStr = [
          safeText(error?.message),
          safeText((error as any)?.context),
          safeText(error),
        ].join(' ').toLowerCase();
        if (errStr.includes('402') || errStr.includes('payment_required') || errStr.includes('crédits') || errStr.includes('credits') || errStr.includes('non-2xx')) {
          toast.error('Crédits IA épuisés — rechargez dans Settings → Cloud & AI balance. Le rapport PDF peut être généré sans les observations IA.', { duration: 8000 });
        } else if (errStr.includes('429') || errStr.includes('rate_limited') || errStr.includes('too many')) {
          toast.error('Limite de requêtes IA atteinte, réessayez dans quelques instants.', { duration: 6000 });
        } else {
          toast.error('Erreur lors de la génération des observations IA : ' + (error?.message || 'erreur inconnue'));
        }
        return;
      }
      setAiObs(data?.text || '');
      toast.success('Observations IA générées');
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  function handleExportPdf() {
    try {
      const etabWithName = { ...etab, agentComptable: nomAgentComptable || etab.agentComptable };
      generateRapportACPdf({
        etab: etabWithName, R: { ...R, ...safe } as any,
        saisieComplementaire: {
          prelevements,
          explicationsResultat,
          commentaireFDR,
          commentaireBFR,
          commentaireTresorerie,
          commentaireChargesRecouvrement,
          commentairePatrimoine,
          commentaireCreances,
          commentaireReserves,
          commentaireRatios,
          commentairePluriannuel,
          commentaireGeneral,
        },
        aiText: aiObs,
        history,
        nbAnom, nbBloq,
      });
      toast.success('Rapport PDF généré avec succès');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
    }
  }

  function addPrelevement() {
    setPrelevements([...prelevements, { objet: '', montant: 0, dateCA: '' }]);
  }
  function updatePrelevement(i: number, field: keyof Prelevement, value: string | number) {
    const updated = [...prelevements];
    (updated[i] as any)[field] = value;
    setPrelevements(updated);
  }
  function removePrelevement(i: number) {
    setPrelevements(prelevements.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={genererIA} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Génération IA…' : 'Générer les observations IA'}
        </Button>
        <Button variant="default" className="bg-[hsl(215,70%,45%)] hover:bg-[hsl(215,70%,40%)]" onClick={handleExportPdf}>
          <Download className="h-4 w-4 mr-2" /> Rapport PDF officiel
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SAISIE COMPLÉMENTAIRE — Questions à l'agent comptable  */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-warning" />
            Saisie complémentaire de l'agent comptable
            <Badge variant="outline" className="ml-auto text-[10px] border-warning/50 text-warning">Enrichit le rapport</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* Prélèvements sur FDR */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-xs font-bold">Prélèvements sur fonds de roulement autorisés par le CA</Label>
              <Button variant="ghost" size="sm" onClick={addPrelevement} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            {prelevements.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucun prélèvement déclaré — cliquez sur « Ajouter » si l'établissement a prélevé sur son fonds de roulement.</p>
            )}
            {prelevements.map((p, i) => (
              <div key={i} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Objet</Label>
                  <Input value={p.objet} onChange={e => updatePrelevement(i, 'objet', e.target.value)} placeholder="Ex: Acquisition mobilier" className="h-8 text-xs" />
                </div>
                <div className="w-32">
                  <Label className="text-[10px] text-muted-foreground">Montant (€)</Label>
                  <Input type="number" value={p.montant || ''} onChange={e => updatePrelevement(i, 'montant', parseFloat(e.target.value) || 0)} className="h-8 text-xs font-mono" />
                </div>
                <div className="w-32">
                  <Label className="text-[10px] text-muted-foreground">Date du CA</Label>
                  <Input value={p.dateCA} onChange={e => updatePrelevement(i, 'dateCA', e.target.value)} placeholder="01/03/2024" className="h-8 text-xs" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removePrelevement(i)} className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {totalPrelev > 0 && (
              <div className="bg-background rounded-lg p-3 mt-2 text-xs border">
                <p className="font-bold">Total prélevé : <span className="text-destructive">{formatEur(totalPrelev)}</span></p>
                <p className="text-muted-foreground mt-1">
                  Résultat hors prélèvements : <strong className={resultatHorsPrelev >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(resultatHorsPrelev)}</strong>
                  {resultatHorsPrelev >= 0 && ' → Le déficit est structurellement prévisible et résulte des prélèvements autorisés par le CA.'}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-bold">Explications sur le résultat de l'exercice</Label>
            <Textarea value={explicationsResultat} onChange={e => setExplicationsResultat(e.target.value)}
              placeholder="Ex: Le résultat déficitaire s'explique par les prélèvements votés en CA du 12/03/2024 pour l'acquisition de…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur le fonds de roulement</Label>
            <Textarea value={commentaireFDR} onChange={e => setCommentaireFDR(e.target.value)}
              placeholder="Ex: La part non encaissée élevée s'explique par une créance de l'État en attente de notification…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur le besoin en fonds de roulement (BFR)</Label>
            <Textarea value={commentaireBFR} onChange={e => setCommentaireBFR(e.target.value)}
              placeholder="Ex: Le BFR positif résulte de créances familles en attente de recouvrement…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur la trésorerie</Label>
            <Textarea value={commentaireTresorerie} onChange={e => setCommentaireTresorerie(e.target.value)}
              placeholder="Ex: La trésorerie inclut des reliquats de subventions État pour un montant important…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur les charges à payer et le recouvrement</Label>
            <Textarea value={commentaireChargesRecouvrement} onChange={e => setCommentaireChargesRecouvrement(e.target.value)}
              placeholder="Ex: Le TMcap élevé s'explique par des factures de décembre réglées début janvier…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur le patrimoine</Label>
            <Textarea value={commentairePatrimoine} onChange={e => setCommentairePatrimoine(e.target.value)}
              placeholder="Ex: Les immobilisations comprennent le mobilier acquis lors de la restructuration de 2023…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur les créances et dettes</Label>
            <Textarea value={commentaireCreances} onChange={e => setCommentaireCreances(e.target.value)}
              placeholder="Ex: Les créances familles incluent des impayés de restauration faisant l'objet de poursuites…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur les réserves et l'affectation du résultat</Label>
            <Textarea value={commentaireReserves} onChange={e => setCommentaireReserves(e.target.value)}
              placeholder="Ex: Le niveau des réserves permet de couvrir le déficit prévu et de maintenir un FDR suffisant…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur les ratios de gestion</Label>
            <Textarea value={commentaireRatios} onChange={e => setCommentaireRatios(e.target.value)}
              placeholder="Ex: Le ratio de liquidité générale est satisfaisant et en progression par rapport à N-1…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Commentaire sur l'évolution pluriannuelle</Label>
            <Textarea value={commentairePluriannuel} onChange={e => setCommentairePluriannuel(e.target.value)}
              placeholder="Ex: L'évolution sur 5 ans montre une amélioration régulière du FDR et de la trésorerie…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
          <div>
            <Label className="text-xs font-bold">Observations générales</Label>
            <Textarea value={commentaireGeneral} onChange={e => setCommentaireGeneral(e.target.value)}
              placeholder="Toute observation complémentaire de l'agent comptable…"
              rows={2} className="mt-1 text-xs bg-background" />
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ANALYSE INTELLIGENTE                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      {smartAnalysis.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Analyse automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs leading-relaxed">
              {smartAnalysis.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* RAPPORT VISUEL                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <Card className="max-w-5xl mx-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-foreground pb-4 mb-5">
            <div>
              <h1 className="text-xl font-black">RAPPORT FINANCIER DE L'EXERCICE {etab.exercice}</h1>
              <p className="text-muted-foreground text-xs">M9-6 2026 · Décret 2012-1246 art. 195-199</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <strong className="text-sm block">{etab.nom}</strong>
              <span className="text-primary font-semibold">RNE : {etab.uai}</span>
            </div>
          </div>

          <div className="bg-slate-800 text-white text-center py-3 rounded-lg mb-5 text-sm font-bold tracking-widest uppercase">
            RAPPORT DE L'AGENT COMPTABLE — COMPTE FINANCIER {etab.exercice}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-5">
            <span>Ordonnateur : <strong>{etab.ordonnateur || '—'}</strong></span>
            <span>Agent comptable : <strong>{etab.agentComptable || '—'}</strong></span>
          </div>

          {/* §1 Rappel */}
          <SectionTitre numero="1" title="Rappel des dispositions réglementaires" />
          <div className="text-xs leading-relaxed mb-4 bg-muted/30 rounded-lg p-4">
            L'agent comptable informe le conseil d'administration de l'état du patrimoine, des stocks,
            des créances, des reliquats de subventions. Il présente et explique les différents indicateurs
            financiers mentionnés à la pièce 14 du compte financier.
          </div>

          {/* §2 Résultat — Balance graphique */}
          <SectionTitre numero="2" title="Présentation du résultat et de l'autofinancement" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><Scale className="h-3 w-3" /> Balance dépenses / recettes</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={balanceData} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {balanceData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border">
                  <tbody>
                    <tr className="border-b bg-muted/20"><td className="p-2 font-semibold">Charges nettes</td><td className="p-2 text-right font-mono">{formatEur(R.totalChargesSde)}</td></tr>
                    <tr className="border-b"><td className="p-2 font-semibold">Produits nets</td><td className="p-2 text-right font-mono">{formatEur(R.totalProduitsSdr)}</td></tr>
                    <tr className={`border-b font-bold ${R.resultatComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                      <td className="p-2">RÉSULTAT</td><td className="p-2 text-right font-mono">{formatEur(R.resultatComptable)}</td>
                    </tr>
                    <tr className="border-b"><td className="p-2">Charges non décaissables</td><td className="p-2 text-right font-mono">{formatEur(safe.chargesNonDecaissables)}</td></tr>
                    <tr className="border-b"><td className="p-2">Produits non encaissables</td><td className="p-2 text-right font-mono">{formatEur(safe.produitsNonEncaissables)}</td></tr>
                    <tr className={`font-bold ${safe.cafComptable >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                      <td className="p-2">{safe.cafComptable >= 0 ? 'CAF' : 'IAF'}</td><td className="p-2 text-right font-mono">{formatEur(safe.cafComptable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {totalPrelev > 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs">
                  <p className="font-bold text-warning">⚠ Prélèvements sur FDR : {formatEur(totalPrelev)}</p>
                  <p className="text-muted-foreground mt-1">Résultat hors prélèvements : <strong className={resultatHorsPrelev >= 0 ? 'text-emerald-600' : 'text-destructive'}>{formatEur(resultatHorsPrelev)}</strong></p>
                </div>
              )}
            </div>
          </div>
          {explicationsResultat && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-warning">{explicationsResultat}</div>
          )}

          {/* §3 FDR — Composition graphique */}
          <SectionTitre numero="3" title="Analyse du fonds de roulement" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Composition du FDR</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={fdrComposData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {fdrComposData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <table className="w-full text-xs border">
                <tbody>
                  <tr className="border-b bg-muted/20"><td className="p-2 font-semibold" colSpan={2}>FDR comptable</td><td className="p-2 text-right font-mono font-bold">{formatEur(R.fdrComptable)}</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Part encaissée (autonomie)</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartEncaissee)} ({safe.fdrPctEncaissee.toFixed(1)} %)</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Part non encaissée</td><td className="p-2 text-right font-mono">{formatEur(safe.fdrPartNonEncaissee)} ({safe.fdrPctNonEncaissee.toFixed(1)} %)</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>FDR mobilisable</td><td className="p-2 text-right font-mono font-bold">{formatEur(safe.fdrMobilisable)}</td></tr>
                  <tr className="border-b"><td className="p-2" colSpan={2}>Jours FDR</td><td className="p-2 text-right font-mono font-bold">{Math.round(safe.joursFdr)} j</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          {commentaireFDR && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">{commentaireFDR}</div>
          )}

          {/* §4 BFR */}
          <SectionTitre numero="4" title="Besoin en fonds de roulement" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="BFR" value={formatEur(R.bfr)} color="amber" icon="📊" sub={R.bfr < 0 ? 'Dégagement en FDR' : 'Besoin en FDR'} isText />
            <KPICard label="Créances" value={formatEur(safe.totalCreances)} color="blue" icon="📋" isText />
            <KPICard label="Dettes" value={formatEur(safe.totalDettes)} color="amber" icon="📋" isText />
          </div>
          <div className="bg-muted/20 rounded-lg p-3 mb-4 text-xs">
            <strong>Vérification FDR = BFR + Trésorerie :</strong>{' '}
            {formatEur(R.fdrComptable)} = {formatEur(R.bfr)} + {formatEur(R.tresorerie)} = {formatEur(R.bfr + R.tresorerie)}
            <span className={Math.abs(R.fdrComptable - R.bfr - R.tresorerie) < 1 ? ' text-emerald-600 font-bold' : ' text-destructive font-bold'}>
              {Math.abs(R.fdrComptable - R.bfr - R.tresorerie) < 1 ? ' ✓ Vérifié' : ' ⚠ Écart'}
            </span>
          </div>

          {/* §5 Trésorerie — Pie chart */}
          <SectionTitre numero="5" title="Composition de la trésorerie" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {tresoData.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><PieChartIcon className="h-3 w-3" /> Répartition de la trésorerie</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tresoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {tresoData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div>
              <table className="w-full text-xs border">
                <thead><tr className="bg-muted/50"><th className="p-2 text-left">Composante</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">%</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">Autonomie financière</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.autonomieFinanciere)}</td><td className="p-2 text-right">{pct(Math.abs(safe.tresoComposition.autonomieFinanciere), R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Dépôts & cautions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.depotsCautions)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.depotsCautions, R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Règlements en attente</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reglementsEnAttente)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.reglementsEnAttente, R.tresorerie)}</td></tr>
                  <tr className="border-b"><td className="p-2">Reliquats subventions</td><td className="p-2 text-right font-mono">{formatEur(safe.tresoComposition.reliquatsSubventions)}</td><td className="p-2 text-right">{pct(safe.tresoComposition.reliquatsSubventions, R.tresorerie)}</td></tr>
                  <tr className="bg-muted/20 font-bold"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(R.tresorerie)}</td><td className="p-2 text-right">100 %</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>{Math.round(safe.joursTresorerie)} jours</strong> de fonctionnement couverts par la trésorerie.
              </p>
            </div>
          </div>
          {commentaireTresorerie && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">{commentaireTresorerie}</div>
          )}

          {/* §6 TMcap/TMnr + DGP/DGR */}
          <SectionTitre numero="6" title="Délais et taux de charges à payer / non-recouvrement" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMcap</div>
              <div className={`text-2xl font-bold font-mono ${safe.tmcap > tmcapAlertThreshold ? 'text-destructive' : ''}`}>{safe.tmcap.toFixed(2)} %</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-xs">
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">TMnr</div>
              <div className={`text-2xl font-bold font-mono ${safe.tmnr > 5 ? 'text-warning' : ''}`}>{safe.tmnr.toFixed(2)} %</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgpJours > 30 ? 'border border-destructive/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGP</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgpJours > 30 ? 'text-destructive' : ''}`}>{Math.round(safe.dgpJours)} j</div>
            </div>
            <div className={`bg-muted/30 rounded-lg p-4 text-xs ${safe.dgrJours > 60 ? 'border border-warning/30' : ''}`}>
              <div className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">DGR</div>
              <div className={`text-2xl font-bold font-mono ${safe.dgrJours > 60 ? 'text-warning' : ''}`}>{Math.round(safe.dgrJours)} j</div>
            </div>
          </div>

          {/* §7 Patrimoine — avec graphique */}
          <SectionTitre numero="7" title="État du patrimoine" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={patrimoineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(Math.abs(v)), '']} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {patrimoineData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-xs border">
              <tbody>
                <tr className="border-b bg-muted/20"><td className="p-2 font-semibold">Immobilisations brutes</td><td className="p-2 text-right font-mono">{formatEur(R.totalImmo)}</td></tr>
                <tr className="border-b"><td className="p-2">Amortissements</td><td className="p-2 text-right font-mono">- {formatEur(R.totalAmortissements)}</td></tr>
                <tr className="border-b font-bold"><td className="p-2">Valeur résiduelle</td><td className="p-2 text-right font-mono">{formatEur(safe.valeurNette)}</td></tr>
                <tr className="border-b"><td className="p-2">Fonds propres ({safe.patrimoineOriginesPctFP.toFixed(1)} %)</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesFondsPropres)}</td></tr>
                <tr className="border-b"><td className="p-2">Subv. investissement ({safe.patrimoineOriginesPctSub.toFixed(1)} %)</td><td className="p-2 text-right font-mono">{formatEur(safe.patrimoineOriginesSubventions)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* §8 Créances/Dettes — avec pie charts */}
          <SectionTitre numero="8" title="Créances et dettes" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><PieChartIcon className="h-3 w-3" /> Créances par origine</p>
              {creancesPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={creancesPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {creancesPieData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <table className="w-full text-xs border">
                  <tbody>
                    {safe.creancesEtat > 0 && <tr className="border-b"><td className="p-2">État</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesEtat)}</td></tr>}
                    {safe.creancesCollectivite > 0 && <tr className="border-b"><td className="p-2">Collectivité</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesCollectivite)}</td></tr>}
                    {safe.creancesFamilles > 0 && <tr className="border-b"><td className="p-2">Familles</td><td className="p-2 text-right font-mono">{formatEur(safe.creancesFamilles)}</td></tr>}
                    <tr className="font-bold bg-muted/20"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(safe.totalCreances)}</td></tr>
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1"><PieChartIcon className="h-3 w-3" /> Dettes par type</p>
              {dettesPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dettesPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true} fontSize={9}>
                      {dettesPieData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <table className="w-full text-xs border">
                  <tbody>
                    {safe.dettesFournisseurs > 0 && <tr className="border-b"><td className="p-2">Fournisseurs</td><td className="p-2 text-right font-mono">{formatEur(safe.dettesFournisseurs)}</td></tr>}
                    <tr className="font-bold bg-muted/20"><td className="p-2">TOTAL</td><td className="p-2 text-right font-mono">{formatEur(safe.totalDettes)}</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {commentaireCreances && (
            <div className="bg-muted/10 rounded-lg p-3 mb-4 text-xs italic border-l-4 border-primary">{commentaireCreances}</div>
          )}

          {/* §9 Réserves + prélèvements */}
          <SectionTitre numero="9" title="Réserves et affectation du résultat" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KPICard label="Réserves (c/1068)" value={formatEur(R.reserves)} color="blue" icon="🏛️" isText />
            <KPICard label="Dont SRH" value={formatEur(R.reservesSRH)} color="blue" icon="🍽️" isText />
            <KPICard label="Variation" value={formatEur(safe.prelevementsReserves.variationReserves)} color={safe.prelevementsReserves.variationReserves >= 0 ? 'green' : 'red'} icon="📈" isText />
          </div>
          <div className="text-xs bg-muted/10 rounded-lg p-4 mb-4">
            <p>Résultat de l'exercice : <strong>{formatEur(R.resultatComptable)}</strong></p>
            <p className="mt-1 text-muted-foreground">
              {R.resultatComptable >= 0
                ? `Proposition d'affectation au compte de réserves (c/1068).`
                : `Imputation sur les réserves. Après affectation : ${formatEur(R.reserves + R.resultatComptable)}.`}
            </p>
          </div>

          {/* §10 Ratios — avec radar */}
          <SectionTitre numero="10" title="Ratios de gestion (M9-6 § IV)" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">Profil des ratios</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarRatiosData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Ratios" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-xs border">
              <thead><tr className="bg-muted/50"><th className="p-2 text-left">Ratio</th><th className="p-2 text-right">Valeur</th><th className="p-2 text-left">Interprétation</th></tr></thead>
              <tbody>
                {[
                  { label: 'Liquidité générale', value: safe.ratioLiquiditeGenerale, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 1 ? '✅ Correcte' : '⚠️ Insuffisante' },
                  { label: 'Liquidité réduite', value: safe.ratioLiquiditeReduite, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 0.8 ? '✅' : '⚠️' },
                  { label: 'Liquidité immédiate', value: safe.ratioLiquiditeImmediate, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v >= 0.3 ? '✅' : '⚠️' },
                  { label: 'Autonomie financière', value: safe.ratioAutonomieFinanciere, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.5 ? '✅ > 50%' : '⚠️ < 50%' },
                  { label: 'Solvabilité', value: safe.ratioSolvabilite, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.5 ? '✅' : '⚠️' },
                  { label: 'Endettement', value: safe.ratioEndettement, fmt: (v: number) => v.toFixed(2), seuil: (v: number) => v < 1 ? '✅' : '⚠️ Élevé' },
                  { label: 'Couverture charges', value: safe.ratioCouvertureCharges, fmt: (v: number) => `${(v * 100).toFixed(1)} %`, seuil: (v: number) => v >= 0.08 ? '✅ > 30 j' : '⚠️ < 30 j' },
                ].map(r => (
                  <tr key={r.label} className="border-t">
                    <td className="p-2 font-semibold">{r.label}</td>
                    <td className="p-2 text-right font-mono font-bold">{r.fmt(r.value)}</td>
                    <td className="p-2 text-muted-foreground">{r.seuil(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* §11 Vérifications */}
          <SectionTitre numero="11" title="Vérifications comptables" />
          <div className="flex gap-3 mb-4 flex-wrap">
            <Badge className={nbBloq > 0 ? 'bg-destructive text-destructive-foreground' : nbAnom > 0 ? 'bg-warning text-warning-foreground' : 'bg-emerald-600 text-white'}>
              {nbBloq > 0 ? `🚫 ${nbBloq} point(s) bloquant(s)` : nbAnom > 0 ? `⚠️ ${nbAnom} anomalie(s)` : '✅ Concordance vérifiée'}
            </Badge>
          </div>

          {/* §12 Évolution N/N-1 */}
          {evolutionData.length > 0 && (
            <>
              <SectionTitre numero="12" title="Évolution N / N-1" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={evolutionData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="FDR" fill="hsl(215, 70%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="BFR" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Trésorerie" fill="hsl(160, 45%, 45%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* §13 Pluriannuel */}
          {history.length > 0 && (
            <>
              <SectionTitre numero="13" title="Évolution pluriannuelle" />
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-bold border-r">Indicateur</th>
                      {history.map(h => <th key={h.exercice} className="p-2 text-right font-bold border-r">{h.exercice}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'FDR', key: 'fdr' },
                      { label: 'BFR', key: 'bfr' },
                      { label: 'Trésorerie', key: 'tresorerie' },
                      { label: 'CAF/IAF', key: 'caf' },
                      { label: 'Réserves', key: 'reserves' },
                      { label: 'Jours autonomie', key: 'jours_autonomie' },
                    ].map(row => (
                      <tr key={row.key} className="border-t">
                        <td className="p-2 font-medium border-r">{row.label}</td>
                        {history.map(h => (
                          <td key={h.exercice} className="p-2 text-right font-mono border-r">
                            {row.key === 'jours_autonomie' ? Math.round(h[row.key] || 0) : formatEur(h[row.key] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* §14 Observations IA */}
          <SectionTitre numero="14" title="Observations de l'agent comptable" />
          <Textarea value={aiObs} onChange={e => setAiObs(e.target.value)}
            placeholder="Cliquez sur 'Générer les observations IA' ou rédigez vos observations…" rows={12}
            className="bg-muted/30 text-sm mb-4" />

          {/* Signataire — Saisie du nom */}
          <SectionTitre numero="15" title="Signataire" />
          <div className="mb-6 max-w-xs">
            <Label className="text-xs font-bold">Nom de l'agent comptable</Label>
            <Input value={nomAgentComptable} onChange={e => setNomAgentComptable(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
          </div>

          {/* Signature — Agent comptable seul */}
          <div className="mt-8 pt-5 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <div>
                <strong className="block text-foreground text-sm">L'agent comptable</strong>
                <div className="mt-12">{nomAgentComptable || etab.agentComptable || '……………………'}</div>
                <span>Signature et cachet</span>
              </div>
              <div className="text-right">
                <p>Fait à {etab.commune || '………………'},</p>
                <p>le ……… / ……… / {etab.exercice + 1}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────
function SectionTitre({ numero, title }: { numero: string; title: string }) {
  return (
    <h3 className="text-sm font-bold border-l-4 border-warning pl-3 mb-3 mt-5 uppercase tracking-wide">
      {numero}. {title}
    </h3>
  );
}

function IndicatorBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-xs flex items-center gap-2">
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      <div>
        <div className="text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

function CommentaireBox({ label, value, onChange, placeholder, status, lastSaved }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; status?: 'saved' | 'saving'; lastSaved?: Date | null }) {
  const textareaRef = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(48, el.scrollHeight)}px`;
    }
  };
  return (
    <div className="mb-4 section-rapport">
      <div className="flex items-center gap-1 mb-1 no-print">
        <MessageSquare className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
        {status && <span className="ml-auto"><SaveIndicator status={status} lastSaved={lastSaved} /></span>}
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          const t = e.target;
          t.style.height = 'auto';
          t.style.height = `${Math.max(48, t.scrollHeight)}px`;
        }}
        placeholder={placeholder || `Saisissez ici les faits caractéristiques de cette rubrique…`}
        rows={2}
        className="bg-muted/30 text-xs resize-none overflow-hidden"
        style={{ minHeight: 48 }}
      />
    </div>
  );
}
