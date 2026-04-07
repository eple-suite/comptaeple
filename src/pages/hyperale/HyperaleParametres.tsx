import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Settings, Gauge, BarChart3, GraduationCap, Zap } from 'lucide-react';

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

export default function HyperaleParametres() {
  const etab = useCofiepleStore(s => s.etablissement);
  const key = `hyperale_settings_${etab.uai || 'global'}`;
  const [settings, setSettings] = usePersistedState<HyperaleSettings>(key, DEFAULTS);

  const update = <K extends keyof HyperaleSettings>(field: K, value: HyperaleSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Paramétrages intelligents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Personnalisez les seuils et le comportement du module HYPER@LE</p>
      </div>

      {/* Seuils */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4 text-warning" /> Seuils d'alerte</CardTitle>
          <CardDescription>En nombre de jours de fonctionnement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">FDR (jours)</Label>
              <Input
                type="number"
                value={settings.seuilFdr}
                onChange={e => update('seuilFdr', Number(e.target.value))}
                min={0}
                max={365}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Recommandé : 30 j</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">FDR mobilisable (jours)</Label>
              <Input
                type="number"
                value={settings.seuilFdrMobilisable}
                onChange={e => update('seuilFdrMobilisable', Number(e.target.value))}
                min={0}
                max={365}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Recommandé : 20 j</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Trésorerie (jours)</Label>
              <Input
                type="number"
                value={settings.seuilTresorerie}
                onChange={e => update('seuilTresorerie', Number(e.target.value))}
                min={0}
                max={365}
                className="text-sm"
              />
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
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
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
  );
}
