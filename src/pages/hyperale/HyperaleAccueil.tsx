import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { useHyperaleSeuilsStore } from '@/store/useHyperaleSeuilsStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, TrendingUp, Landmark, ShieldCheck, ArrowRight,
  Building2, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHyperaleData } from './useHyperaleData';
import { comparerBatch, type ComparateurResult } from '@/lib/hyperaleComparateur';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HyperaleHero } from '@/components/hyperale/HyperaleHero';
import { KpiPremiumCard } from '@/components/hyperale/KpiPremiumCard';
import { SuggestionsPanel } from '@/components/hyperale/SuggestionsPanel';
import { useHyperaleScore } from '@/components/hyperale/useHyperaleScore';

const fmtEur = (v: number | null | undefined) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};

function mapNiveau(comp: ComparateurResult): 'excellent' | 'satisfaisant' | 'surveiller' | 'critique' {
  if (comp.niveau === 'critique') return 'critique';
  if (comp.niveau === 'surveiller') return 'surveiller';
  // satisfaisant — promote to excellent if growing strongly
  if (comp.variationPourcentage != null && comp.variationPourcentage > 0.05) return 'excellent';
  return 'satisfaisant';
}

export default function HyperaleAccueil() {
  const navigate = useNavigate();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();

  const hyperaleEtabs = useHyperaleStore(s => s.etablissements);
  const selection = useHyperaleStore(s => s.selection);
  const setSelection = useHyperaleStore(s => s.setSelection);
  const getAnneesDisponibles = useHyperaleStore(s => s.getAnneesDisponibles);
  const getSeuils = useHyperaleSeuilsStore(s => s.getSeuils);

  const anneesDisponibles = getAnneesDisponibles();
  const data = useHyperaleData(selection.annee);

  const selectedUai = selection.uai || selectedEstablishment?.uai || '';
  const currentHyperaleEtab = hyperaleEtabs.find(e => e.uai === selectedUai) || null;
  const seuils = getSeuils(currentHyperaleEtab);

  const prevYear = data.historique.find(h => h.exercice === selection.annee - 1);

  const batch = useMemo(() => comparerBatch({
    fdr: data.fdr, caf: data.caf, tresorerie: data.tresorerie, reserves: data.reserves,
    fdrPrev: prevYear?.fdr ?? null, cafPrev: prevYear?.caf ?? null,
    tresPrev: prevYear?.tresorerie ?? null, resPrev: prevYear?.reserves ?? null,
    seuils: {
      fdrCritique: seuils.fdr.critique, fdrSatisfaisant: seuils.fdr.satisfaisant,
      tresCritique: seuils.tresorerie.critique, tresSatisfaisant: seuils.tresorerie.satisfaisant,
      cafCritique: seuils.caf.critique, cafSatisfaisant: seuils.caf.satisfaisant,
      resCritique: seuils.reserves.critique, resSatisfaisant: seuils.reserves.satisfaisant,
    },
  }), [data, prevYear, seuils]);

  const allEtabs = [
    ...establishments.map(e => ({ id: e.id, uai: e.uai, nom: e.name, source: 'supabase' as const })),
    ...hyperaleEtabs
      .filter(he => !establishments.some(e => e.uai === he.uai))
      .map(he => ({ id: he.uai, uai: he.uai, nom: he.nom, source: 'local' as const })),
  ];

  const handleSelectEtab = (id: string) => {
    const supEtab = establishments.find(x => x.id === id);
    if (supEtab) {
      selectEstablishment(supEtab);
      setSelection({ uai: supEtab.uai });
      return;
    }
    setSelection({ uai: id });
  };

  const selectedEtab = allEtabs.find(e => e.uai === selectedUai);
  const etabName = selectedEtab?.nom || 'Établissement de démonstration';

  // Score & suggestions
  const score = useHyperaleScore(data, etabName);

  // Sparklines
  const fdrSpark = data.historique.map(h => h.fdr);
  const cafSpark = data.historique.map(h => h.caf);
  const tresSpark = data.historique.map(h => h.tresorerie);
  const resSpark = data.historique.map(h => h.reserves);

  // Points d'attention
  const points: { severity: 'critical' | 'warning' | 'info'; text: string }[] = [];
  if (!data.hasData) points.push({ severity: 'info', text: 'Données de démonstration affichées. Sélectionnez un établissement pour une analyse réelle.' });
  if (batch.fdr.niveau === 'critique') points.push({ severity: 'critical', text: batch.messages.fdr });
  else if (batch.fdr.niveau === 'surveiller') points.push({ severity: 'warning', text: batch.messages.fdr });
  if (batch.tresorerie.niveau === 'critique') points.push({ severity: 'critical', text: batch.messages.tresorerie });
  else if (batch.tresorerie.niveau === 'surveiller') points.push({ severity: 'warning', text: batch.messages.tresorerie });
  if (batch.caf.niveau === 'critique') points.push({ severity: 'warning', text: batch.messages.caf });
  if (points.length === 0) points.push({ severity: 'info', text: 'Aucun point d\'attention particulier. Les indicateurs sont dans les normes.' });

  return (
    <div className="space-y-6">
      {/* Premium hero */}
      <HyperaleHero
        etabName={etabName}
        exercice={selection.annee}
        hasData={data.hasData}
        scoreSante={score.scoreSante}
        niveauGlobal={score.niveauGlobal}
        resumeStoryteller={score.resumeStoryteller}
        alertesCount={score.alertesCount}
      />

      {/* Sélecteurs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" /> Établissement
                </label>
                <Select value={selectedUai || 'none'} onValueChange={handleSelectEtab}>
                  <SelectTrigger className="w-full text-sm h-9"><SelectValue placeholder="Choisir un établissement" /></SelectTrigger>
                  <SelectContent>
                    {allEtabs.length === 0 && <SelectItem value="none" disabled>Aucun établissement</SelectItem>}
                    {allEtabs.map(e => (
                      <SelectItem key={e.uai} value={e.source === 'supabase' ? e.id : e.uai}>
                        {e.nom} — {e.uai}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[160px] space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exercice</label>
                <Select value={String(selection.annee)} onValueChange={v => setSelection({ annee: Number(v) })}>
                  <SelectTrigger className="w-full text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {anneesDisponibles.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedEtab && (
              <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="border-primary/40 text-primary font-bold text-[10px]">{selectedEtab.uai}</Badge>
                <span className="font-medium text-foreground text-xs">{selectedEtab.nom}</span>
                <Badge className="ml-auto bg-muted text-muted-foreground text-[10px]" variant="outline">Exercice {selection.annee}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Premium grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-bold text-foreground">Indicateurs clés</h2>
          <span className="text-[10px] text-muted-foreground font-medium">vs N-1 · données sur 5 ans</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiPremiumCard
            label="Fonds de roulement"
            value={fmtEur(data.fdr)}
            sublabel={`${data.fdrJours.toFixed(1)} jours d'autonomie`}
            icon={Wallet}
            niveau={mapNiveau(batch.fdr)}
            variation={batch.fdr.variationPourcentage}
            variationLabel="vs N-1"
            sparklineData={fdrSpark}
            delay={0.1}
            onClick={() => navigate('/hyperale/analyse')}
          />
          <KpiPremiumCard
            label="CAF"
            value={fmtEur(data.caf)}
            sublabel="Capacité d'autofinancement"
            icon={TrendingUp}
            niveau={mapNiveau(batch.caf)}
            variation={batch.caf.variationPourcentage}
            variationLabel="vs N-1"
            sparklineData={cafSpark}
            delay={0.15}
            onClick={() => navigate('/hyperale/analyse')}
          />
          <KpiPremiumCard
            label="Trésorerie"
            value={fmtEur(data.tresorerie)}
            sublabel={`${data.tresorerieJours.toFixed(1)} jours de couverture`}
            icon={Landmark}
            niveau={mapNiveau(batch.tresorerie)}
            variation={batch.tresorerie.variationPourcentage}
            variationLabel="vs N-1"
            sparklineData={tresSpark}
            delay={0.2}
            onClick={() => navigate('/hyperale/analyse')}
          />
          <KpiPremiumCard
            label="Réserves"
            value={fmtEur(data.reserves)}
            sublabel="Marges de sécurité"
            icon={ShieldCheck}
            niveau={mapNiveau(batch.reserves)}
            variation={batch.reserves.variationPourcentage}
            variationLabel="vs N-1"
            sparklineData={resSpark}
            delay={0.25}
            onClick={() => navigate('/hyperale/analyse')}
          />
        </div>
      </div>

      {/* Points d'attention */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <h3 className="text-xs font-bold text-foreground">Points d'attention</h3>
          </div>
          <CardContent className="p-3 space-y-1.5">
            {points.map((p, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs ${
                p.severity === 'critical' ? 'bg-destructive/10 text-destructive'
                  : p.severity === 'warning' ? 'bg-warning/10 text-warning'
                    : 'bg-muted/50 text-muted-foreground'
              }`}>
                {p.severity === 'critical' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  : p.severity === 'warning' ? <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    : <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                <span className="font-medium leading-snug">{p.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <Button size="lg" onClick={() => navigate('/hyperale/analyse')} className="w-full gap-2 font-bold gradient-primary border-0 shadow-primary hover:shadow-lg transition-all">
        Afficher l'analyse complète
        <ArrowRight className="h-4 w-4" />
      </Button>

      {/* Floating proactive AI suggestions */}
      <SuggestionsPanel suggestions={score.suggestions} contextLabel="Suggestions proactives" />
    </div>
  );
}
