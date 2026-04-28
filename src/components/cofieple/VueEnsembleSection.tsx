// ═══════════════════════════════════════════════════════════════
// MODULE 1 — VUE D'ENSEMBLE (Dashboard KPI + Radar 8 axes + Alertes)
// Spec: 6 KPI cards + Radar chart + Alertes automatiques
// M9-6 2026 §§ IV.1-3 — Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { toast } from 'sonner';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { Activity, Shield, AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

export function VueEnsembleSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sde = useCofiepleStore(s => s.sde[s.activeBudget] || []);
  const sdr = useCofiepleStore(s => s.sdr[s.activeBudget] || []);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const anomaliesBalance = useCofiepleStore(s => s.anomaliesBalance);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const lastAnalysisAt = useCofiepleStore(s => s.lastAnalysisAt);
  const lancerAnalyse = useCofiepleStore(s => s.lancerAnalyse);
  const analysisRunning = useCofiepleStore(s => s.analysisRunning);
  const R = resultats[activeBudget];

  if (!R) return <EmptyState msg="Importez les fichiers Op@le et lancez l'analyse pour afficher la vue d'ensemble du compte financier." />;

  const fdr = R.fdrComptable;
  const bfr = R.bfr;
  const treso = R.tresorerieNette;
  const caf = R.cafBudgetaire;
  const jours = R.joursAutonomie;
  const score = R.scoreRisque || 0;
  const niveau = R.niveauRisque || 'faible';
  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const nbSoldesAnormaux = anomaliesBalance.filter(a => a.anomalie).length;

  // Safe access to financial indicator properties
  const joursFdr = R.joursFdr ?? 0;
  const joursTreso = R.joursTresorerie ?? 0;
  const drfn = R.drfn ?? 0;
  const drfnJour = drfn > 0 ? (drfn / 365) : 0;
  const tmcap = R.tmcap ?? 0;
  const tmnr = R.tmnr ?? 0;
  const tooltipFdr = `Nombre de jours de fonctionnement couverts par le FDR, sur la base d'un coût journalier moyen de ${drfnJour > 0 ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(drfnJour) : '—'}/jour. Calcul conforme Op@le — Pièce 14 M9-6.`;
  const tooltipTreso = `Nombre de jours de fonctionnement couverts par la Trésorerie, sur la base d'un coût journalier moyen de ${drfnJour > 0 ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(drfnJour) : '—'}/jour. Calcul conforme Op@le — Pièce 14 M9-6.`;
  const legacyBrokenImports =
    (sde.length > 0 && sde.every((row) => !row.compte && row.budget === 0 && row.realise === 0)) ||
    (sdr.length > 0 && sdr.every((row) => !row.compte && row.budget === 0 && row.realise === 0));
  // Taux d'exécution : utiliser uniquement le vrai ratio réalisé/prévu
  // Ne PAS utiliser totalChargesRef en fallback car quand SDE existe,
  // totalChargesRef = totalChargesSde → ratio = 100% (faux)
  const hasChargeRate = R.totalChargesPrev > 0 && Number.isFinite(R.tauxExecCharges) && R.tauxExecCharges > 0;
  const hasProductRate = R.totalProduitsPrev > 0 && Number.isFinite(R.tauxExecProduits) && R.tauxExecProduits > 0;
  const effectiveChargeRate = hasChargeRate ? R.tauxExecCharges : null;
  const effectiveProductRate = hasProductRate ? R.tauxExecProduits : null;
  const tauxChargesDisplay = effectiveChargeRate !== null
    ? `${(effectiveChargeRate * 100).toFixed(1)} %`
    : (R.totalChargesSde > 0 && R.totalChargesPrev === 0)
      ? 'Budget non importé'
      : legacyBrokenImports
        ? 'À recalculer'
        : '0.0 %';
  const tauxProduitsDisplay = effectiveProductRate !== null
    ? `${(effectiveProductRate * 100).toFixed(1)} %`
    : (R.totalProduitsSdr > 0 && R.totalProduitsPrev === 0)
      ? 'Budget non importé'
      : legacyBrokenImports
        ? 'À recalculer'
        : '0.0 %';

  const sdeLinesCount = sde.length;
  const sdrLinesCount = sdr.length;

  // Radar 8 axes
  const normalize = (val: number, good: number, bad: number) => {
    if (good === bad) return 50;
    const raw = ((val - bad) / (good - bad)) * 100;
    return Math.max(0, Math.min(100, raw));
  };

  const radarData = [
    { subject: 'Liquidité', value: normalize(treso > 0 ? 1 : 0, 1, 0), fullMark: 100 },
    { subject: 'Solvabilité', value: normalize(fdr, 50000, -10000), fullMark: 100 },
    { subject: 'Autonomie', value: normalize(R.ressourcesPropres / Math.max(R.totalProduitsRef || R.totalProduitsSdr, 1), 0.5, 0), fullMark: 100 },
    { subject: 'Exéc. dépenses', value: Math.min(R.tauxExecCharges * 100, 100), fullMark: 100 },
    { subject: 'Exéc. recettes', value: Math.min(R.tauxExecProduits * 100, 100), fullMark: 100 },
    { subject: 'Délai paiem.', value: normalize(30 - tmcap, 30, 0), fullMark: 100 },
    { subject: 'CAF', value: normalize(caf, 50000, -10000), fullMark: 100 },
    { subject: 'Trésorerie', value: normalize(joursTreso, 60, 0), fullMark: 100 },
  ];

  // Structure chart
  const structureData = [
    { name: 'FDR', value: fdr, fill: fdr >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
    { name: 'BFR', value: bfr, fill: bfr <= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(38, 92%, 50%)' },
    { name: 'Tréso', value: treso, fill: treso >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
  ];

  const niveauColors: Record<string, string> = {
    faible: 'bg-emerald-600 text-white',
    modéré: 'bg-warning text-warning-foreground',
    élevé: 'bg-orange-600 text-white',
    critique: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Horodatage + bouton réanalyser */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {lastAnalysisAt && (
          <>
            <Activity className="h-3.5 w-3.5" />
            Dernière analyse : {new Date(lastAnalysisAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
          </>
        )}
        <Button size="sm" variant="outline" className="ml-auto gap-1.5" disabled={analysisRunning}
          onClick={() => {
            lancerAnalyse();
            toast.success('Analyse terminée — indicateurs mis à jour');
          }}>
          {analysisRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Réanalyser maintenant
        </Button>
      </div>
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KPICard label="Fonds de roulement" value={formatEur(fdr)} color={fdr >= 0 ? 'green' : 'red'}
          icon="🏦" sub={`${joursFdr.toFixed(2)} jours`} isText tooltip={tooltipFdr} />
        <KPICard label="Besoin en FDR" value={formatEur(bfr)} color={bfr < fdr ? 'green' : 'amber'}
          icon="📊" sub={bfr < 0 ? 'Dégagement' : 'Besoin'} isText />
        <KPICard label="Trésorerie nette" value={formatEur(treso)} color={treso >= 0 ? 'green' : 'red'}
          icon="💳" sub={`${joursTreso.toFixed(2)} jours`} isText tooltip={tooltipTreso} />
        <KPICard label="CAF / IAF" value={formatEur(caf)} color={caf >= 0 ? 'green' : 'red'}
          icon="🔄" sub={caf >= 0 ? 'Capacité' : 'Insuffisance'} isText />
        <KPICard label="Taux exéc. dépenses" value={tauxChargesDisplay} color={effectiveChargeRate !== null && effectiveChargeRate >= 0.85 && effectiveChargeRate <= 1 ? 'green' : 'amber'}
          icon="💸" sub={`Budget ${formatEur(R.totalChargesPrev)} · Réal. ${formatEur(R.totalChargesSde)}`} isText />
        <KPICard label="Taux exéc. recettes" value={tauxProduitsDisplay} color={effectiveProductRate !== null && effectiveProductRate >= 0.9 ? 'green' : 'amber'}
          icon="💰" sub={`Budget ${formatEur(R.totalProduitsPrev)} · Réal. ${formatEur(R.totalProduitsSdr)}`} isText />
      </div>

      {/* Indicateur de totalisation Op@le des taux d'exécution */}
      {(effectiveChargeRate !== null || effectiveProductRate !== null) && (
        <Card className="border-border/60">
          <CardContent className="p-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">Totalisation des taux d'exécution :</span>
            <span className="px-2 py-1 rounded-md border bg-primary/10 text-primary border-primary/30">
              Σ {sdeLinesCount} lignes SDE | Σ {sdrLinesCount} lignes SDR
            </span>
            <span className="ml-auto text-muted-foreground italic">
              SUM brute des lignes valides Op@le, sans filtre sur le compte par nature.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Alertes automatiques */}
      {(nbBloq > 0 || nbSoldesAnormaux > 0 || fdr < 0 || treso < 0 || caf < 0) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes automatiques — Points d'attention détectés
            </div>
            <div className="flex flex-wrap gap-2">
              {nbBloq > 0 && <Badge className="bg-destructive text-destructive-foreground">🚫 {nbBloq} point(s) bloquant(s)</Badge>}
              {nbSoldesAnormaux > 0 && <Badge className="bg-warning text-warning-foreground">⚠️ {nbSoldesAnormaux} solde(s) anormaux</Badge>}
              {fdr < 0 && <Badge className="bg-destructive text-destructive-foreground">🔴 FDR négatif</Badge>}
              {treso < 0 && <Badge className="bg-destructive text-destructive-foreground">🔴 Trésorerie négative</Badge>}
              {caf < 0 && <Badge className="bg-warning text-warning-foreground">⚠️ IAF (insuffisance autofinancement)</Badge>}
              {jours < 30 && jours >= 0 && <Badge className="bg-warning text-warning-foreground">⚠️ Autonomie &lt; 30 jours ({Math.round(jours)} j.)</Badge>}
              {R.tauxExecCharges < 0.75 && <Badge className="bg-warning text-warning-foreground">⚠️ Sous-consommation dépenses ({(R.tauxExecCharges * 100).toFixed(0)}%)</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {legacyBrokenImports && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-foreground">
              Vos anciens imports SDE/SDR ont bien été retrouvés, mais ils ont été enregistrés sans montants exploitables : la CAF est recalculée automatiquement, et les taux restent marqués <strong>À recalculer</strong> jusqu'au remplacement des fichiers.
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('import')}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Remplacer les imports
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar 8 axes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Profil financier (8 axes)
              <Badge className={`ml-auto ${niveauColors[niveau]}`}>{niveau}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Structure FDR/BFR/Tréso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Structure FDR = BFR + Trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={structureData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), 'Montant']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {structureData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Équation */}
            <div className="text-center text-xs font-semibold mt-2 text-muted-foreground">
              FDR ({formatEur(fdr)}) = BFR ({formatEur(bfr)}) + Tréso ({formatEur(treso)})
              <span className={`ml-2 ${Math.abs(fdr - bfr - treso) < 0.05 ? 'text-emerald-600' : 'text-destructive'}`}>
                {Math.abs(fdr - bfr - treso) < 0.05 ? '✅' : `❌ Écart: ${formatEur(fdr - bfr - treso)}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Résumé indicateurs clés */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Indicateurs clés M9-6
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <RatioRow label="Résultat comptable" value={formatEur(R.resultatComptable)} ok={R.resultatComptable >= 0} />
            <RatioRow label="TMcap (charges à payer)" value={`${tmcap.toFixed(2)} %`} ok={tmcap < 10} />
            <RatioRow label="TMnr (non-recouvrement)" value={`${tmnr.toFixed(2)} %`} ok={tmnr < 5} />
            <RatioRow label="Réserves (c/1068)" value={formatEur(R.reserves)} ok={R.reserves > 0} />
            <RatioRow label="Patrimoine net" value={formatEur(R.valeurNette ?? 0)} ok={(R.valeurNette ?? 0) >= 0} />
            <RatioRow label="Score de risque" value={`${100 - score}/100`} ok={score <= 30} />
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setActiveTab('rapport_ordo')}>
          <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Rapport ordonnateur
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('rapport_ac')}>
          <Shield className="h-3.5 w-3.5 mr-1.5" /> Rapport agent comptable
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('points_bloquants')}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Points bloquants
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('analyse_ia')}>
          <Activity className="h-3.5 w-3.5 mr-1.5" /> Analyse IA globale
        </Button>
      </div>
    </div>
  );
}

function RatioRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold">{value}</span>
        <span className={ok ? 'text-emerald-600' : 'text-destructive'}>{ok ? '✅' : '⚠️'}</span>
      </div>
    </div>
  );
}
