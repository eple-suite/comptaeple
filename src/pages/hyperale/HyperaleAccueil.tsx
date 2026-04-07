import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, TrendingUp, Landmark, ShieldCheck, ArrowRight,
  AlertTriangle, CheckCircle2, Info, Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHyperaleData } from './useHyperaleData';

const fmtEur = (v: number | null | undefined) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};

const CARDS = [
  { key: 'fdr' as const, label: 'FDR', subtitle: 'Capacité à financer le cycle d\'exploitation', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10', daysKey: 'fdrJours' as const },
  { key: 'caf' as const, label: 'CAF', subtitle: 'Capacité d\'autofinancement', icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10', daysKey: null },
  { key: 'tresorerie' as const, label: 'Trésorerie', subtitle: 'Liquidités disponibles', icon: Landmark, color: 'text-warning', bg: 'bg-warning/10', daysKey: 'tresorerieJours' as const },
  { key: 'reserves' as const, label: 'Réserves', subtitle: 'Marges de sécurité', icon: ShieldCheck, color: 'text-accent-foreground', bg: 'bg-accent/30', daysKey: null },
] as const;

export default function HyperaleAccueil() {
  const navigate = useNavigate();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();

  // HYPER@LE store
  const hyperaleEtabs = useHyperaleStore(s => s.etablissements);
  const selection = useHyperaleStore(s => s.selection);
  const setSelection = useHyperaleStore(s => s.setSelection);
  const getAnneesDisponibles = useHyperaleStore(s => s.getAnneesDisponibles);

  const anneesDisponibles = getAnneesDisponibles();
  const data = useHyperaleData(selection.annee);

  // Merge establishment lists: Supabase establishments + HYPER@LE store
  const allEtabs = [
    ...establishments.map(e => ({ id: e.id, uai: e.uai, nom: e.name, source: 'supabase' as const })),
    ...hyperaleEtabs
      .filter(he => !establishments.some(e => e.uai === he.uai))
      .map(he => ({ id: he.uai, uai: he.uai, nom: he.nom, source: 'local' as const })),
  ];

  const handleSelectEtab = (id: string) => {
    // Try Supabase establishment first
    const supEtab = establishments.find(x => x.id === id);
    if (supEtab) {
      selectEstablishment(supEtab);
      setSelection({ uai: supEtab.uai });
      return;
    }
    // Local HYPER@LE establishment
    setSelection({ uai: id });
  };

  const selectedUai = selection.uai || selectedEstablishment?.uai || '';
  const selectedEtab = allEtabs.find(e => e.uai === selectedUai);

  // Points d'attention
  const points: { severity: 'critical' | 'warning' | 'info'; text: string }[] = [];
  if (!data.hasData) points.push({ severity: 'info', text: 'Données de démonstration affichées. Sélectionnez un établissement pour une analyse réelle.' });
  if (data.fdr < 0) points.push({ severity: 'critical', text: `Le Fonds de roulement est négatif (${fmtEur(data.fdr)}).` });
  else if (data.fdrJours < 30) points.push({ severity: 'warning', text: `Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours (seuil : 30 j).` });
  if (data.tresorerie < 0) points.push({ severity: 'critical', text: `La trésorerie est négative (${fmtEur(data.tresorerie)}).` });
  else if (data.tresorerieJours < 15) points.push({ severity: 'warning', text: `La trésorerie ne couvre que ${data.tresorerieJours.toFixed(1)} jours (seuil : 15 j).` });
  if (data.caf < 0) points.push({ severity: 'warning', text: 'La CAF est négative : l\'exploitation ne génère pas assez de ressources.' });
  if (points.length === 0) points.push({ severity: 'info', text: 'Aucun point d\'attention particulier. Les indicateurs sont dans les normes.' });

  return (
    <div className="space-y-6">
      {/* En-tête */}
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
              <Select
                value={selectedUai || 'none'}
                onValueChange={handleSelectEtab}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Choisir un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {allEtabs.length === 0 && (
                    <SelectItem value="none" disabled>Aucun établissement</SelectItem>
                  )}
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
                <SelectTrigger className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anneesDisponibles.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
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

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map(card => {
          const value = data[card.key];
          const days = card.daysKey ? data[card.daysKey] : null;
          const isNeg = typeof value === 'number' && value < 0;
          return (
            <Card key={card.key} className={`transition-shadow hover:shadow-md ${isNeg ? 'border-destructive/40' : ''}`}>
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  {isNeg && <Badge variant="destructive" className="text-[9px] px-1.5">Négatif</Badge>}
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
                <p className="text-xl font-black text-foreground leading-tight">{fmtEur(value)}</p>
                {days != null && <p className="text-xs text-muted-foreground">≈ {days.toFixed(1)} jours</p>}
                <p className="text-[10px] text-muted-foreground/70 leading-snug">{card.subtitle}</p>
              </CardContent>
            </Card>
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

      {/* Bouton */}
      <Button size="lg" onClick={() => navigate('/hyperale/analyse')} className="w-full gap-2 font-bold text-base py-6 shadow-md">
        Afficher l'analyse complète
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
