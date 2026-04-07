import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { useHyperaleSeuilsStore, type IndicateurSeuilKey } from '@/store/useHyperaleSeuilsStore';
import { Settings, Gauge, BarChart3, GraduationCap, Zap, Sliders, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HyperaleSettings {
  seuilFdr: number;
  seuilFdrMobilisable: number;
  seuilTresorerie: number;
  modeComparaison: 'national' | 'collectivite';
  modeExpert: boolean;
}

const DEFAULTS: HyperaleSettings = {
  seuilFdr: 30,
  seuilFdrMobilisable: 20,
  seuilTresorerie: 15,
  modeComparaison: 'national',
  modeExpert: false,
};

const INDICATEUR_LABELS: Record<IndicateurSeuilKey, { label: string; desc: string }> = {
  fdr: { label: 'Fonds de roulement (FDR)', desc: 'Capacité à financer le cycle d\'exploitation' },
  caf: { label: 'CAF', desc: 'Capacité d\'autofinancement de l\'établissement' },
  tresorerie: { label: 'Trésorerie', desc: 'Liquidités disponibles pour les opérations courantes' },
  reserves: { label: 'Réserves', desc: 'Marges de sécurité accumulées' },
};

const fmtEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function HyperaleParametres() {
  const etab = useCofiepleStore(s => s.etablissement);
  const key = `hyperale_settings_${etab.uai || 'global'}`;
  const [settings, setSettings] = usePersistedState<HyperaleSettings>(key, DEFAULTS);

  const automatique = useHyperaleSeuilsStore(s => s.automatique);
  const setAutomatique = useHyperaleSeuilsStore(s => s.setAutomatique);
  const seuilsManuels = useHyperaleSeuilsStore(s => s.seuilsManuels);
  const setSeuilManuel = useHyperaleSeuilsStore(s => s.setSeuilManuel);
  const getSeuils = useHyperaleSeuilsStore(s => s.getSeuils);

  // Get current establishment from hyperale store for auto-seuils
  const selection = useHyperaleStore(s => s.selection);
  const hyperaleEtabs = useHyperaleStore(s => s.etablissements);
  const currentEtab = hyperaleEtabs.find(e => e.uai === (selection.uai || etab.uai)) || null;
  const seuilsActifs = getSeuils(currentEtab);

  const update = <K extends keyof HyperaleSettings>(field: K, value: HyperaleSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Paramétrages intelligents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Personnalisez les seuils et le comportement du module HYPER@LE</p>
        </div>

        {/* Mode de calcul des seuils */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" /> Mode de calcul des seuils
            </CardTitle>
            <CardDescription>Choisissez comment les seuils d'alerte sont calculés pour chaque indicateur financier.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={automatique ? 'auto' : 'manual'}
              onValueChange={v => setAutomatique(v === 'auto')}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="auto" id="mode-auto" className="mt-0.5" />
                <div>
                  <Label htmlFor="mode-auto" className="text-sm font-semibold cursor-pointer">
                    Mode automatique
                    <Badge variant="outline" className="ml-2 text-[10px] border-primary/30 text-primary">Recommandé</Badge>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Les seuils sont calculés automatiquement à partir de la moyenne des 3 dernières années.
                    Seuil satisfaisant = moyenne × 0,9 · Seuil critique = moyenne × 0,5.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="manual" id="mode-manual" className="mt-0.5" />
                <div>
                  <Label htmlFor="mode-manual" className="text-sm font-semibold cursor-pointer">Mode manuel (personnalisé)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous définissez vous-même les seuils d'alerte pour chaque indicateur financier.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Seuils personnalisés (mode manuel) */}
        {!automatique && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-warning" /> Seuils personnalisés (en euros)
              </CardTitle>
              <CardDescription>
                Définissez les seuils pour chaque indicateur. Les valeurs sont exprimées en euros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(Object.keys(INDICATEUR_LABELS) as IndicateurSeuilKey[]).map(ind => (
                <div key={ind} className="space-y-2 p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{INDICATEUR_LABELS[ind].label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs max-w-[200px]">{INDICATEUR_LABELS[ind].desc}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-green-600 dark:text-green-400 font-semibold">Seuil satisfaisant</Label>
                      <Input
                        type="number"
                        value={seuilsManuels[ind].satisfaisant}
                        onChange={e => setSeuilManuel(ind, 'satisfaisant', Number(e.target.value))}
                        min={0}
                        className="text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Niveau à partir duquel l'indicateur est considéré comme stable et sécurisé.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-destructive font-semibold">Seuil critique</Label>
                      <Input
                        type="number"
                        value={seuilsManuels[ind].critique}
                        onChange={e => setSeuilManuel(ind, 'critique', Number(e.target.value))}
                        min={0}
                        className="text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        En dessous de ce niveau, l'indicateur est en zone de danger.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Seuils actifs (lecture seule en mode auto) */}
        {automatique && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> Seuils calculés automatiquement
              </CardTitle>
              <CardDescription>
                Basés sur la moyenne des 3 dernières années de l'établissement sélectionné.
                {!currentEtab && ' Valeurs par défaut utilisées (aucun établissement sélectionné).'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(INDICATEUR_LABELS) as IndicateurSeuilKey[]).map(ind => (
                  <div key={ind} className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-xs font-semibold text-foreground">{INDICATEUR_LABELS[ind].label}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">✓ {fmtEur(seuilsActifs[ind].satisfaisant)}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-destructive">⚠ {fmtEur(seuilsActifs[ind].critique)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seuils en jours (legacy) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4 text-warning" /> Seuils d'alerte en jours</CardTitle>
            <CardDescription>En nombre de jours de fonctionnement (DRFN)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">FDR (jours)</Label>
                <Input type="number" value={settings.seuilFdr} onChange={e => update('seuilFdr', Number(e.target.value))} min={0} max={365} className="text-sm" />
                <p className="text-[10px] text-muted-foreground">Recommandé : 30 j</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">FDR mobilisable (jours)</Label>
                <Input type="number" value={settings.seuilFdrMobilisable} onChange={e => update('seuilFdrMobilisable', Number(e.target.value))} min={0} max={365} className="text-sm" />
                <p className="text-[10px] text-muted-foreground">Recommandé : 20 j</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Trésorerie (jours)</Label>
                <Input type="number" value={settings.seuilTresorerie} onChange={e => update('seuilTresorerie', Number(e.target.value))} min={0} max={365} className="text-sm" />
                <p className="text-[10px] text-muted-foreground">Recommandé : 15 j</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode comparaison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Mode de comparaison</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={settings.modeComparaison} onValueChange={v => update('modeComparaison', v as 'national' | 'collectivite')}>
              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national">Moyenne nationale</SelectItem>
                <SelectItem value="collectivite">Moyenne collectivité de rattachement</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Les graphiques de comparaison utiliseront ce référentiel.</p>
          </CardContent>
        </Card>

        {/* Mode expert */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {settings.modeExpert ? <Zap className="h-4 w-4 text-warning" /> : <GraduationCap className="h-4 w-4 text-secondary" />}
              Mode d'affichage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{settings.modeExpert ? 'Mode expert' : 'Mode débutant'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {settings.modeExpert ? 'Indicateurs bruts, sans explications pédagogiques' : 'Explications détaillées et pédagogiques pour chaque indicateur'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{settings.modeExpert ? 'Expert' : 'Débutant'}</Badge>
                <Switch checked={settings.modeExpert} onCheckedChange={v => update('modeExpert', v)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
