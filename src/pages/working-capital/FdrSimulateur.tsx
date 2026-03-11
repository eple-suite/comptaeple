// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Simulateur de prélèvement avec slider
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';
import type { ResultatAnalyse } from './types';
import { SEUIL_CRITIQUE_JOURS } from './types';

export function SimulateurPrelevement({
  analyse,
  chargesJournalieres,
}: {
  analyse: ResultatAnalyse;
  chargesJournalieres: number;
}) {
  const [montantSimule, setMontantSimule] = useState(0);

  const joursApres = chargesJournalieres > 0
    ? (analyse.fondsRoulementMobilisable - montantSimule) / chargesJournalieres : 0;
  const peutPrelever = joursApres >= SEUIL_CRITIQUE_JOURS;
  const fdrResiduel = analyse.fondsRoulementMobilisable - montantSimule;
  const prelevementMax = Math.max(0,
    analyse.fondsRoulementMobilisable - (SEUIL_CRITIQUE_JOURS * chargesJournalieres)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Simulateur de prélèvement</CardTitle>
          <Badge variant="outline" className="text-[10px]">Interactif</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Montant du prélèvement envisagé</Label>
          <div className="flex gap-3 items-center">
            <input type="range" min="0" max={Math.max(analyse.fondsRoulementMobilisable, 1)} step="1000"
              value={montantSimule}
              onChange={(e) => setMontantSimule(parseInt(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            <Input type="number" value={montantSimule}
              onChange={(e) => setMontantSimule(Number(e.target.value) || 0)}
              className="w-28 text-right font-mono text-sm" />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">FDRm avant</span>
            <span className="font-mono font-semibold">{formatCurrency(analyse.fondsRoulementMobilisable)}</span>
          </div>
          <div className="flex justify-between text-destructive">
            <span>Prélèvement simulé</span>
            <span className="font-mono font-semibold">- {formatCurrency(montantSimule)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-medium">FDRm après</span>
            <span className={`font-mono font-bold ${peutPrelever ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(fdrResiduel)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jours de fonctionnement</span>
            <span className={`font-mono font-bold ${peutPrelever ? 'text-success' : 'text-destructive'}`}>
              {joursApres.toFixed(1)} j
            </span>
          </div>
        </div>

        <div className={`rounded-lg p-3 border-l-4 ${peutPrelever
          ? 'border-l-success bg-success/5'
          : 'border-l-destructive bg-destructive/5'}`}>
          <div className="flex items-start gap-2">
            {peutPrelever
              ? <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
              : <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
            <div>
              <p className={`text-sm font-medium ${peutPrelever ? 'text-success' : 'text-destructive'}`}>
                {peutPrelever ? 'Prélèvement autorisé' : 'Prélèvement déconseillé'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {peutPrelever
                  ? `Marge : ${(joursApres - SEUIL_CRITIQUE_JOURS).toFixed(1)} jours au-dessus du seuil`
                  : `Passe sous le seuil critique de ${SEUIL_CRITIQUE_JOURS} jours`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Prélèvement max autorisé :</span>
          </div>
          <button onClick={() => setMontantSimule(Math.floor(prelevementMax / 1000) * 1000)}
            className="font-mono font-semibold text-primary hover:underline">
            {formatCurrency(prelevementMax)}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
