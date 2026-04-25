import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EpleResume } from "@/lib/cockpit/types";
import { niveauTresorerie, niveauFdr, niveauCICF } from "@/lib/cockpit/seuils";

interface Props {
  eples: EpleResume[];
}

function colorForNiveau(n: string) {
  switch (n) {
    case 'rouge': return 'bg-destructive/80 text-destructive-foreground';
    case 'orange': return 'bg-warning/80 text-warning-foreground';
    case 'jaune': return 'bg-yellow-300/80 text-yellow-900';
    case 'success': return 'bg-success/80 text-success-foreground';
    default: return 'bg-primary/70 text-primary-foreground';
  }
}

function colorForCount(n: number, threshold = { jaune: 1, orange: 5, rouge: 10 }) {
  if (n === 0) return 'bg-muted text-muted-foreground';
  if (n >= threshold.rouge) return 'bg-destructive/80 text-destructive-foreground';
  if (n >= threshold.orange) return 'bg-warning/80 text-warning-foreground';
  if (n >= threshold.jaune) return 'bg-yellow-300/80 text-yellow-900';
  return 'bg-primary/60 text-primary-foreground';
}

export function HeatmapEple({ eples }: Props) {
  const navigate = useNavigate();
  const [showTable, setShowTable] = useState(false);

  if (eples.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Aucun établissement rattaché. Ajoutez-en depuis la page Établissements.
        </CardContent>
      </Card>
    );
  }

  const cols: { key: keyof EpleResume; label: string; type: 'score' | 'jours-treso' | 'jours-fdr' | 'count'; nav?: string }[] = [
    { key: 'scoreCICF', label: 'CICF', type: 'score' },
    { key: 'joursTresorerie', label: 'Tréso (j)', type: 'jours-treso' },
    { key: 'joursFdr', label: 'FDR (j)', type: 'jours-fdr' },
    { key: 'creances', label: 'Créances €', type: 'count' },
    { key: 'anomalies', label: 'Anomalies', type: 'count', nav: '/balance' },
    { key: 'echeancesOuvertes', label: 'Échéances', type: 'count' },
    { key: 'voyagesEnCours', label: 'Voyages', type: 'count', nav: '/voyages-v2' },
    { key: 'marchesEnCours', label: 'Marchés', type: 'count', nav: '/agence' },
  ];

  return (
    <Card className="rounded-xl" data-testid="cockpit-heatmap">
      <CardHeader className="pb-3 border-b border-border/60 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Vue consolidée — {eples.length} EPLE
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setShowTable(s => !s)} className="text-xs h-7">
          {showTable ? 'Masquer le tableau' : 'Voir le tableau détaillé'}
        </Button>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-semibold pb-2 pr-2">EPLE</th>
              {cols.map(c => (
                <th key={String(c.key)} className="font-semibold pb-2 px-1 text-center">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eples.map(e => (
              <tr key={e.id} className="border-t border-border/30">
                <td className="py-1.5 pr-2">
                  <div>
                    <p className="font-medium truncate max-w-[180px]">{e.nom}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{e.uai}</p>
                  </div>
                </td>
                {cols.map(c => {
                  const v = e[c.key] as number;
                  let cls = '';
                  let display: string = String(v);
                  if (c.type === 'score') { cls = colorForNiveau(niveauCICF(v)); display = `${Math.round(v)}`; }
                  else if (c.type === 'jours-treso') { cls = colorForNiveau(niveauTresorerie(v)); }
                  else if (c.type === 'jours-fdr') { cls = colorForNiveau(niveauFdr(v)); }
                  else if (c.type === 'count') {
                    if (c.key === 'creances') {
                      cls = v > 30000 ? 'bg-warning/80 text-warning-foreground' : 'bg-muted text-foreground';
                      display = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v);
                    } else cls = colorForCount(v);
                  }
                  return (
                    <td key={String(c.key)} className="py-1 px-1 text-center">
                      <button
                        onClick={() => c.nav && navigate(c.nav)}
                        className={`w-full min-w-[52px] inline-block rounded-md px-1.5 py-1 text-[11px] font-semibold tabular-nums ${cls} ${c.nav ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                      >
                        {display}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {showTable && (
          <div className="mt-4 overflow-x-auto border-t border-border/40 pt-4">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left py-2 pr-2">EPLE</th>
                  <th className="text-left py-2 px-2">UAI</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Ordo</th>
                  <th className="text-left py-2 px-2">SG</th>
                  <th className="text-right py-2 px-2">Tréso €</th>
                  <th className="text-right py-2 px-2">j Tréso</th>
                  <th className="text-right py-2 px-2">FDR €</th>
                  <th className="text-right py-2 px-2">j FDR</th>
                  <th className="text-right py-2 px-2">Créances €</th>
                  <th className="text-right py-2 px-2">Anomalies</th>
                  <th className="text-right py-2 px-2">CICF</th>
                </tr>
              </thead>
              <tbody>
                {eples.map(e => (
                  <tr key={e.id} className="border-t border-border/30">
                    <td className="py-1.5 pr-2 font-medium">{e.nom}</td>
                    <td className="py-1 px-2 font-mono text-[10px]">{e.uai}</td>
                    <td className="py-1 px-2">{e.type}</td>
                    <td className="py-1 px-2">{e.ordonnateur}</td>
                    <td className="py-1 px-2">{e.secretaireGeneral}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.tresorerie.toLocaleString('fr-FR')}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.joursTresorerie}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.fdr.toLocaleString('fr-FR')}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.joursFdr}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.creances.toLocaleString('fr-FR')}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{e.anomalies}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{Math.round(e.scoreCICF)}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
