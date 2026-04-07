import { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, TrendingUp, Landmark, ShieldAlert, ArrowRight,
  AlertTriangle, CheckCircle2, Info, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHyperaleData } from './useHyperaleData';

export default function HyperaleAccueil() {
  const navigate = useNavigate();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();
  const etab = useCofiepleStore(s => s.etablissement);
  const [exercice, setExercice] = useState(etab.exercice || new Date().getFullYear() - 1);
  const data = useHyperaleData(exercice);

  const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const fmtDays = (v: number) => `${v.toFixed(1)} j`;

  const indicators = [
    { label: 'Fonds de roulement', value: data.fdr, days: data.fdrJours, icon: Wallet, color: 'text-primary', bgColor: 'bg-primary/10', threshold: data.fdr < 0 ? 'critical' : data.fdrJours < 30 ? 'warning' : 'ok' },
    { label: 'CAF', value: data.caf, icon: TrendingUp, color: 'text-secondary', bgColor: 'bg-secondary/10', threshold: data.caf < 0 ? 'critical' : 'ok' },
    { label: 'Trésorerie', value: data.tresorerie, days: data.tresorerieJours, icon: Landmark, color: 'text-warning', bgColor: 'bg-warning/10', threshold: data.tresorerie < 0 ? 'critical' : data.tresorerieJours < 15 ? 'warning' : 'ok' },
    { label: 'Réserves', value: data.reserves, icon: ShieldAlert, color: 'text-destructive', bgColor: 'bg-destructive/10', threshold: data.reserves < 5000 ? 'warning' : 'ok' },
  ];

  const alerts = data.alertes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span className="text-3xl">⚡</span> HYPER@LE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Analyse financière augmentée pour EPLE</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {establishments.length > 1 && (
            <Select value={selectedEstablishment?.id || ''} onValueChange={id => {
              const e = establishments.find(x => x.id === id);
              if (e) selectEstablishment(e);
            }}>
              <SelectTrigger className="w-[220px] text-xs">
                <SelectValue placeholder="Établissement" />
              </SelectTrigger>
              <SelectContent>
                {establishments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name} ({e.uai})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={String(exercice)} onValueChange={v => setExercice(Number(v))}>
            <SelectTrigger className="w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(i => {
                const y = new Date().getFullYear() - 1 - i;
                return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Établissement info */}
      {selectedEstablishment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center gap-3 text-sm">
            <Badge variant="outline" className="border-primary/40 text-primary font-bold">{selectedEstablishment.uai}</Badge>
            <span className="font-semibold text-foreground">{selectedEstablishment.name}</span>
            <span className="text-muted-foreground">— {selectedEstablishment.city}</span>
            <Badge className="ml-auto bg-warning/15 text-warning border-warning/30" variant="outline">Exercice {exercice}</Badge>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map(ind => (
          <Card key={ind.label} className={`relative overflow-hidden transition-shadow hover:shadow-lg border-l-4 ${
            ind.threshold === 'critical' ? 'border-l-destructive' : ind.threshold === 'warning' ? 'border-l-warning' : 'border-l-secondary'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${ind.bgColor}`}>
                  <ind.icon className={`h-5 w-5 ${ind.color}`} />
                </div>
                {ind.threshold === 'critical' && <Badge variant="destructive" className="text-[10px]">Critique</Badge>}
                {ind.threshold === 'warning' && <Badge className="bg-warning text-warning-foreground text-[10px]">Attention</Badge>}
                {ind.threshold === 'ok' && <Badge className="bg-secondary/15 text-secondary text-[10px]">Normal</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">{ind.label}</p>
              <p className="text-xl font-black text-foreground mt-1">{fmt(ind.value)}</p>
              {ind.days !== undefined && (
                <p className="text-xs text-muted-foreground mt-0.5">≈ {fmtDays(ind.days)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes intelligentes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes intelligentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                a.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                a.severity === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-info/10 text-info'
              }`}>
                {a.severity === 'critical' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> :
                 a.severity === 'warning' ? <Info className="h-4 w-4 mt-0.5 shrink-0" /> :
                 <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
                <span className="font-medium">{a.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={() => navigate('/hyperale/analyse')}
          className="gap-2 font-bold text-base px-8 shadow-lg"
        >
          Analyse complète
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
