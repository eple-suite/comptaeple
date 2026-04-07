import { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, TrendingUp, Landmark, ShieldCheck, ArrowRight,
  AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHyperaleData } from './useHyperaleData';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 + 1 }, (_, i) => CURRENT_YEAR - i);

const fmt = (v: number | null | undefined) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};

const CARD_DEFS = [
  { key: 'fdr', label: 'FDR', subtitle: 'Capacité à financer le cycle d\'exploitation', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'caf', label: 'CAF', subtitle: 'Capacité d\'autofinancement', icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'tresorerie', label: 'Trésorerie', subtitle: 'Liquidités disponibles', icon: Landmark, color: 'text-warning', bg: 'bg-warning/10' },
  { key: 'reserves', label: 'Réserves', subtitle: 'Marges de sécurité', icon: ShieldCheck, color: 'text-accent-foreground', bg: 'bg-accent/30' },
] as const;

export default function HyperaleAccueil() {
  const navigate = useNavigate();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();
  const etab = useCofiepleStore(s => s.etablissement);
  const [exercice, setExercice] = useState(etab.exercice || CURRENT_YEAR - 1);
  const data = useHyperaleData(exercice);

  const getValue = (key: string): number | null => {
    const v = (data as unknown as Record<string, unknown>)[key];
    return typeof v === 'number' ? v : null;
  };

  // Points d'attention
  const points: { severity: 'critical' | 'warning' | 'info'; text: string }[] = [];
  const missingKeys = CARD_DEFS.filter(c => getValue(c.key) == null);
  if (missingKeys.length > 0) {
    points.push({ severity: 'info', text: 'Certaines données ne sont pas disponibles.' });
  }
  if (data.fdr < 0) points.push({ severity: 'critical', text: 'Attention : le Fonds de roulement est en zone sensible.' });
  if (data.caf < 0) points.push({ severity: 'warning', text: 'Attention : la CAF est en zone sensible.' });
  if (data.tresorerie < 0) points.push({ severity: 'critical', text: 'Attention : la Trésorerie est en zone sensible.' });
  if (data.reserves < 0) points.push({ severity: 'warning', text: 'Attention : les Réserves sont en zone sensible.' });
  if (points.length === 0) points.push({ severity: 'info', text: 'Aucun point d\'attention particulier.' });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          HYPER@LE — Analyse Financière Augmentée
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez un établissement et une année pour afficher les indicateurs clés.
        </p>
      </div>

      {/* Sélecteurs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={selectedEstablishment?.id || 'none'}
          onValueChange={id => {
            const e = establishments.find(x => x.id === id);
            if (e) selectEstablishment(e);
          }}
        >
          <SelectTrigger className="w-full sm:w-[280px] text-sm">
            <SelectValue placeholder="Choisir un établissement" />
          </SelectTrigger>
          <SelectContent>
            {establishments.length === 0 && (
              <SelectItem value="none" disabled>Aucun établissement</SelectItem>
            )}
            {establishments.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} — {e.uai}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(exercice)} onValueChange={v => setExercice(Number(v))}>
          <SelectTrigger className="w-full sm:w-[140px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Établissement sélectionné */}
      {selectedEstablishment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline" className="border-primary/40 text-primary font-bold">
              {selectedEstablishment.uai}
            </Badge>
            <span className="font-semibold text-foreground">{selectedEstablishment.name}</span>
            {selectedEstablishment.city && (
              <span className="text-muted-foreground">— {selectedEstablishment.city}</span>
            )}
            <Badge className="ml-auto bg-warning/15 text-warning border-warning/30" variant="outline">
              Exercice {exercice}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Indicateurs clés — grille 2×2 mobile, 4×1 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARD_DEFS.map(card => {
          const value = getValue(card.key);
          return (
            <Card key={card.key} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 space-y-2">
                <div className={`inline-flex p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                <p className="text-xl font-black text-foreground">{fmt(value)}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Points d'attention */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Points d'attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {points.map((p, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                p.severity === 'critical'
                  ? 'bg-destructive/10 text-destructive'
                  : p.severity === 'warning'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {p.severity === 'critical' ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : p.severity === 'warning' ? (
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span className="font-medium">{p.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bouton d'action */}
      <Button
        size="lg"
        onClick={() => navigate('/hyperale/analyse')}
        className="w-full gap-2 font-bold text-base py-6 shadow-lg"
      >
        Afficher l'analyse complète
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
