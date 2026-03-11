// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Tableau de Financement & Prélèvements sur réserves
// Extraction automatique des mouvements sur comptes 106*
// Conformité : M9-6 2026, GBCP, DAF A3
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ArrowDown, ArrowUp, Scale, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';
import type { PrelevementsReserves } from '@/lib/cofieple_types';

interface Props {
  prelevements: PrelevementsReserves;
  varFdrBas: number;
  exercice: number;
  nomEtablissement: string;
}

export function TableauFinancement({ prelevements, varFdrBas, exercice, nomEtablissement }: Props) {
  const { totalPrelevements, prelevementsInvestissement, prelevementsFonctionnement, detailParCompte, variationReserves, ecartFrngVsPrelevements, coherent } = prelevements;

  // Phrase de synthèse auto-générée pour le rapport AC
  const phraseSynthese = totalPrelevements > 0
    ? `Au cours de l'exercice ${exercice}, l'établissement a procédé à un prélèvement total sur ses réserves de ${formatCurrency(totalPrelevements)}, dont ${formatCurrency(prelevementsInvestissement)} pour le financement d'investissements et ${formatCurrency(prelevementsFonctionnement)} pour couvrir des dépenses exceptionnelles de fonctionnement.`
    : `Aucun prélèvement sur réserves n'a été constaté au cours de l'exercice ${exercice}.`;

  if (totalPrelevements === 0 && variationReserves === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Prélèvements sur réserves (classe 106)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun prélèvement sur réserves constaté durant l'exercice {exercice}.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Montant global */}
      <Card className="border-l-4 border-l-warning">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-warning" />
              Montant global des prélèvements sur réserves
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">M9-6 § IV — GBCP art. 195</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Décomposition investissement / fonctionnement */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total prélèvements</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalPrelevements)}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowDown className="h-3 w-3 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investissement</p>
              </div>
              <p className="text-lg font-bold text-primary">{formatCurrency(prelevementsInvestissement)}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Section d'opérations en capital</p>
            </div>
            <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowUp className="h-3 w-3 text-warning" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fonctionnement</p>
              </div>
              <p className="text-lg font-bold text-warning">{formatCurrency(prelevementsFonctionnement)}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Dépenses exceptionnelles</p>
            </div>
          </div>

          {/* Détail par compte */}
          {detailParCompte.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Compte</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Intitulé</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Montant prélevé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detailParCompte.map((d, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono font-semibold">{d.compte}</td>
                      <td className="px-3 py-2 text-muted-foreground">{d.intitule}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-destructive">{formatCurrency(d.montant)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={2} className="px-3 py-2 text-muted-foreground">TOTAL</td>
                    <td className="px-3 py-2 text-right font-mono text-destructive">{formatCurrency(totalPrelevements)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Variation des réserves */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Variation des réserves (N vs N-1)</span>
            <span className={`font-mono font-bold text-sm ${variationReserves >= 0 ? 'text-success' : 'text-destructive'}`}>
              {variationReserves >= 0 ? '+' : ''}{formatCurrency(variationReserves)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Contrôle de cohérence */}
      <Card className={`border-l-4 ${coherent ? 'border-l-success' : 'border-l-destructive'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {coherent ? (
              <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${coherent ? 'text-success' : 'text-destructive'}`}>
                {coherent ? 'Cohérence vérifiée' : '⚠️ Alerte de cohérence'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {coherent
                  ? `Le montant des prélèvements (${formatCurrency(totalPrelevements)}) est cohérent avec la variation du FRNG.`
                  : `Écart détecté : ${formatCurrency(ecartFrngVsPrelevements)} entre le montant des prélèvements et la diminution constatée du FRNG. Vérifiez les prélèvements non réalisés ou les restes à réaliser.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phrase de synthèse pour le rapport */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Synthèse pour le rapport de l'agent comptable</p>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                « {phraseSynthese} »
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                → Reporté automatiquement dans la Note n°7 (Financements) et la Note n°11 de l'Annexe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Generates the synthesis phrase for use by other modules */
export function genererPhraseSynthesePrelevements(
  totalPrelevements: number, investissement: number, fonctionnement: number, exercice: number
): string {
  if (totalPrelevements <= 0) return `Aucun prélèvement sur réserves n'a été constaté au cours de l'exercice ${exercice}.`;
  return `Au cours de l'exercice ${exercice}, l'établissement a procédé à un prélèvement total sur ses réserves de ${formatCurrency(totalPrelevements)}, dont ${formatCurrency(investissement)} pour le financement d'investissements et ${formatCurrency(fonctionnement)} pour couvrir des dépenses exceptionnelles de fonctionnement.`;
}
