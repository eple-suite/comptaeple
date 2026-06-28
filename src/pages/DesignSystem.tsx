import { Palette, CheckCircle2, AlertTriangle, ShieldAlert, Ban } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";

// Page /design-system (amélioration #16) : documente les tokens sémantiques,
// l'échelle typographique et les composants partagés.

const SEMANTIC = [
  { name: "primary", label: "Primaire", desc: "Actions, liens, identité" },
  { name: "secondary", label: "Secondaire", desc: "Accents secondaires" },
  { name: "muted", label: "Atténué", desc: "Fonds, zones secondaires" },
  { name: "accent", label: "Accent", desc: "Survols, surbrillances" },
];

const ETATS = [
  { name: "success", label: "Conforme", icon: CheckCircle2, desc: "Contrôle OK, équilibre sain" },
  { name: "warning", label: "Vigilance", icon: AlertTriangle, desc: "Tension, anomalie à surveiller" },
  { name: "destructive", label: "Anomalie / Risque", icon: ShieldAlert, desc: "Irrégularité, créance en danger" },
];

const TYPE_SCALE = [
  { cls: "text-2xl font-bold font-display", label: "Titre de page — text-2xl / display" },
  { cls: "text-lg font-bold", label: "Titre de section — text-lg" },
  { cls: "text-sm", label: "Corps de texte — text-sm" },
  { cls: "text-xs text-muted-foreground", label: "Légende — text-xs muted" },
  { cls: "font-mono text-sm", label: "Données chiffrées — font-mono" },
];

function Swatch({ token, label, desc }: { token: string; label: string; desc: string }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="h-16 w-full" style={{ backgroundColor: `hsl(var(--${token}))` }} />
      <div className="p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{label}</span>
          <code className="text-[10px] text-muted-foreground">--{token}</code>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        icon={Palette}
        title="Système de design"
        description="Tokens, typographie et composants de l'Agence comptable du groupement Coeffin"
        showEstablishment={false}
      />

      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">Couleurs sémantiques</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SEMANTIC.map((s) => <Swatch key={s.name} token={s.name} label={s.label} desc={s.desc} />)}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">États métier (conforme / anomalie / risque)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ETATS.map((e) => (
            <div key={e.name} className="rounded-lg border p-3 flex items-start gap-3" style={{ borderLeftWidth: 4, borderLeftColor: `hsl(var(--${e.name}))` }}>
              <e.icon className="h-5 w-5 shrink-0" style={{ color: `hsl(var(--${e.name}))` }} />
              <div>
                <p className="text-sm font-semibold">{e.label}</p>
                <p className="text-[11px] text-muted-foreground">{e.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">Échelle typographique</CardTitle></CardHeader>
        <CardContent className="space-y-2.5">
          {TYPE_SCALE.map((t, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
              <span className={t.cls}>Agence comptable Coeffin</span>
              <code className="text-[10px] text-muted-foreground shrink-0">{t.label}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">Composants</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="destructive">Destructif</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Défaut</Badge>
            <Badge variant="secondary">Secondaire</Badge>
            <Badge variant="outline">Contour</Badge>
            <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Anomalie</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground mb-2">LoadingState</p><LoadingState rows={3} /></div>
            <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground mb-2">EmptyState</p><EmptyState title="Aucun élément" description="Ajoutez votre premier élément." /></div>
            <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground mb-2">ErrorState</p><ErrorState description="Une erreur réseau est survenue." onRetry={() => {}} /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
