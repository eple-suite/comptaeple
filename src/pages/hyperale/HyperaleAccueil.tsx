import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { useHyperaleSeuilsStore } from '@/store/useHyperaleSeuilsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Wallet, TrendingUp, Landmark, ShieldCheck, ArrowRight,
  AlertTriangle, CheckCircle2, Info, Building2,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHyperaleData } from './useHyperaleData';
import { comparerBatch, couleurToClass, type ComparateurResult } from '@/lib/hyperaleComparateur';
import { useMemo } from 'react';

const fmtEur = (v: number | null | undefined) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} %`;

const CARDS = [
  { key: 'fdr' as const, label: 'FDR', subtitle: 'Capacité à financer le cycle d\'exploitation', icon: Wallet, daysKey: 'fdrJours' as const },
  { key: 'caf' as const, label: 'CAF', subtitle: 'Capacité d\'autofinancement', icon: TrendingUp, daysKey: null },
  { key: 'tresorerie' as const, label: 'Trésorerie', subtitle: 'Liquidités disponibles', icon: Landmark, daysKey: 'tresorerieJours' as const },
  { key: 'reserves' as const, label: 'Réserves', subtitle: 'Marges de sécurité', icon: ShieldCheck, daysKey: null },
] as const;

function TendanceIcon({ comp }: { comp: ComparateurResult }) {
  const cls = `h-3.5 w-3.5 ${couleurToClass(comp.couleur, 'text')}`;
  if (comp.tendance === 'hausse') return <ArrowUpRight className={cls} />;
  if (comp.tendance === 'baisse') return <ArrowDownRight className={cls} />;
  return <Minus className={cls} />;
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

  // Get current hyperale establishment for auto-seuils
  const selectedUai = selection.uai || selectedEstablishment?.uai || '';
  const currentHyperaleEtab = hyperaleEtabs.find(e => e.uai === selectedUai) || null;
  const seuils = getSeuils(currentHyperaleEtab);

  // Previous year data
  const prevYear = data.historique.find(h => h.exercice === selection.annee - 1);

  const batch = useMemo(() => comparerBatch({
    fdr: data.fdr,
    caf: data.caf,
    tresorerie: data.tresorerie,
    reserves: data.reserves,
    fdrPrev: prevYear?.fdr ?? null,
    cafPrev: prevYear?.caf ?? null,
    tresPrev: prevYear?.tresorerie ?? null,
    resPrev: prevYear?.reserves ?? null,
    seuils: {
      fdrCritique: seuils.fdr.critique,
      fdrSatisfaisant: seuils.fdr.satisfaisant,
      tresCritique: seuils.tresorerie.critique,
      tresSatisfaisant: seuils.tresorerie.satisfaisant,
      cafCritique: seuils.caf.critique,
      cafSatisfaisant: seuils.caf.satisfaisant,
      resCritique: seuils.reserves.critique,
      resSatisfaisant: seuils.reserves.satisfaisant,
    },
  }), [data, prevYear, seuils]);

  // Merge establishment lists
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

  // Seuil labels for tooltips
  const seuilLabels: Record<string, { satisfaisant: number; critique: number }> = {
    fdr: seuils.fdr,
    caf: seuils.caf,
    tresorerie: seuils.tresorerie,
    reserves: seuils.reserves,
  };

  // Points d'attention
  const points: { severity: 'critical' | 'warning' | 'info'; text: string }[] = [];
  if (!data.hasData) points.push({ severity: 'info', text: 'Données de démonstration affichées. Sélectionnez un établissement pour une analyse réelle.' });
  if (batch.fdr.niveau === 'critique') points.push({ severity: 'critical', text: batch.messages.fdr });
  else if (batch.fdr.niveau === 'surveiller') points.push({ severity: 'warning', text: batch.messages.fdr });
  if (batch.tresorerie.niveau === 'critique') points.push({ severity: 'critical', text: batch.messages.tresorerie });
  else if (batch.tresorerie.niveau === 'surveiller') points.push({ severity: 'warning', text: batch.messages.tresorerie });
  if (batch.caf.niveau === 'critique') points.push({ severity: 'warning', text: batch.messages.caf });
  if (points.length === 0) points.push({ severity: 'info', text: 'Aucun point d\'attention particulier. Les indicateurs sont dans les normes.' });

  const compResults = { fdr: batch.fdr, caf: batch.caf, tresorerie: batch.tresorerie, reserves: batch.reserves };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground">Sélectionnez un établissement et une année pour afficher les indicateurs clés.</p>
        </div>

        {/* Sélecteurs */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Établissement
                </label>
                <Select value={selectedUai || 'none'} onValueChange={handleSelectEtab}>
                  <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Choisir un établissement" /></SelectTrigger>
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
                <label className="text-xs font-semibold text-muted-foreground">Exercice</label>
                <Select value={String(selection.annee)} onValueChange={v => setSelection({ annee: Number(v) })}>
                  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {anneesDisponibles.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedEtab && (
              <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="border-primary/40 text-primary font-bold">{selectedEtab.uai}</Badge>
                <span className="font-medium text-foreground">{selectedEtab.nom}</span>
                <Badge className="ml-auto bg-muted text-muted-foreground" variant="outline">Exercice {selection.annee}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Indicateurs clés avec comparateur + tooltip seuils */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CARDS.map(card => {
            const value = data[card.key];
            const days = card.daysKey ? data[card.daysKey] : null;
            const comp = compResults[card.key];
            const sl = seuilLabels[card.key];
            return (
              <Tooltip key={card.key}>
                <TooltipTrigger asChild>
                  <Card className={`transition-shadow hover:shadow-md cursor-help ${couleurToClass(comp.couleur, 'border')}`}>
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex p-2 rounded-lg ${couleurToClass(comp.couleur, 'bg')}`}>
                          <card.icon className={`h-4 w-4 ${couleurToClass(comp.couleur, 'text')}`} />
                        </div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 ${couleurToClass(comp.couleur, 'text')}`}>
                          {comp.niveau === 'critique' ? 'Critique' : comp.niveau === 'surveiller' ? 'À surveiller' : 'Satisfaisant'}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
                      <p className="text-xl font-black text-foreground leading-tight">{fmtEur(value)}</p>
                      {days != null && <p className="text-xs text-muted-foreground">≈ {days.toFixed(1)} jours</p>}
                      <div className="flex items-center gap-1.5">
                        <TendanceIcon comp={comp} />
                        <span className={`text-xs font-medium ${couleurToClass(comp.couleur, 'text')}`}>
                          {comp.variationPourcentage != null ? fmtPct(comp.variationPourcentage) : '—'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{comp.variationTexte}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 leading-snug">{card.subtitle}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Seuil satisfaisant : {fmtEur(sl.satisfaisant)}</p>
                  <p className="text-xs">Seuil critique : {fmtEur(sl.critique)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Points d'attention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {points.map((p, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg p-3 text-sm ${
                p.severity === 'critical' ? 'bg-destructive/10 text-destructive'
                  : p.severity === 'warning' ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {p.severity === 'critical' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  : p.severity === 'warning' ? <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
                <span className="font-medium">{p.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button size="lg" onClick={() => navigate('/hyperale/analyse')} className="w-full gap-2 font-bold text-base py-6 shadow-md">
          Afficher l'analyse complète
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </TooltipProvider>
  );
}
