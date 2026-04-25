import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, ExternalLink, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AlerteTransverse, EpleResume, NiveauAlerte } from "@/lib/cockpit/types";

interface Props {
  alertes: AlerteTransverse[];
  eples: EpleResume[];
}

const ORDRE: Record<NiveauAlerte, number> = { rouge: 0, orange: 1, jaune: 2, info: 3 };
const COULEURS: Record<NiveauAlerte, string> = {
  rouge: 'border-l-destructive bg-destructive/5',
  orange: 'border-l-warning bg-warning/5',
  jaune: 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
  info: 'border-l-primary bg-primary/5',
};

export function AlertesTransversesPanel({ alertes, eples }: Props) {
  const navigate = useNavigate();
  const [filtreNiveau, setFiltreNiveau] = useState<NiveauAlerte | 'all'>('all');
  const [filtreModule, setFiltreModule] = useState<string>('all');
  const [search, setSearch] = useState('');

  const eplesById = useMemo(() => Object.fromEntries(eples.map(e => [e.id, e])), [eples]);
  const modules = useMemo(() => Array.from(new Set(alertes.map(a => a.module_origine))), [alertes]);

  const filtered = useMemo(() => {
    return alertes
      .filter(a => filtreNiveau === 'all' || a.niveau === filtreNiveau)
      .filter(a => filtreModule === 'all' || a.module_origine === filtreModule)
      .filter(a => !search || (a.titre + ' ' + (a.description || '')).toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => ORDRE[a.niveau] - ORDRE[b.niveau]);
  }, [alertes, filtreNiveau, filtreModule, search]);

  const counters = useMemo(() => ({
    rouge: alertes.filter(a => a.niveau === 'rouge').length,
    orange: alertes.filter(a => a.niveau === 'orange').length,
    jaune: alertes.filter(a => a.niveau === 'jaune').length,
    info: alertes.filter(a => a.niveau === 'info').length,
  }), [alertes]);

  return (
    <Card className="rounded-xl" data-testid="cockpit-alertes">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Alertes du groupement
            <Badge variant="outline" className="ml-1 text-[10px]">{alertes.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'rouge', 'orange', 'jaune'] as const).map(n => (
              <Button
                key={n}
                size="sm"
                variant={filtreNiveau === n ? 'default' : 'outline'}
                onClick={() => setFiltreNiveau(n)}
                className="h-6 px-2 text-[10px]"
              >
                {n === 'all' ? 'Tous' : n.charAt(0).toUpperCase() + n.slice(1)}
                {n !== 'all' && <span className="ml-1 opacity-70">({counters[n]})</span>}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="Rechercher une alerte…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 text-xs flex-1"
          />
          <select
            value={filtreModule}
            onChange={e => setFiltreModule(e.target.value)}
            className="h-7 text-xs px-2 rounded-md border border-input bg-background"
          >
            <option value="all">Tous modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-3 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 italic">Aucune alerte ouverte 🎉</p>
        )}
        <div className="space-y-2">
          {filtered.map(a => {
            const eple = a.establishment_id ? eplesById[a.establishment_id] : null;
            return (
              <div key={a.id} className={`border-l-4 ${COULEURS[a.niveau]} rounded-md px-3 py-2 text-xs`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{a.titre}</p>
                    {a.description && <p className="text-muted-foreground mt-0.5 leading-relaxed">{a.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] py-0 h-4">{a.module_origine}</Badge>
                      {eple && <span>· {eple.nom}</span>}
                      {a.reference_reglementaire && <span>· {a.reference_reglementaire}</span>}
                      {a.echeance && <span>· éch. {new Date(a.echeance).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                  {a.action_url && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => navigate(a.action_url!)}>
                      Traiter <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
