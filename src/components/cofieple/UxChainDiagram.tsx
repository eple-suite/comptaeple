// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Diagramme UX : COFIEPLE vs REPROFI
// Comparaison visuelle de la chaîne de valeur utilisateur
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, Zap } from 'lucide-react';

interface Step {
  label: string;
  reprofi: string;
  cofieple: string;
  advantage: 'cofieple' | 'equal';
}

const STEPS: Step[] = [
  {
    label: '1. Import des données',
    reprofi: 'Export Op@le → Copier-coller dans tableur Excel pré-formaté (risque d\'erreur)',
    cofieple: 'Drag & drop CSV directement — parsing automatique avec détection du format Op@le',
    advantage: 'cofieple',
  },
  {
    label: '2. Identification EPLE',
    reprofi: 'Saisie manuelle de toutes les informations (nom, adresse, académie…)',
    cofieple: 'Auto-complétion via API Éducation Nationale à partir du code UAI',
    advantage: 'cofieple',
  },
  {
    label: '3. Contrôles de cohérence',
    reprofi: '15 contrôles statiques avec résultat OK/KO sans explication',
    cofieple: '15+ contrôles dynamiques avec voyants 🟢🟠🔴, écritures correctives Op@le et analyse prédictive',
    advantage: 'cofieple',
  },
  {
    label: '4. Calculs financiers',
    reprofi: 'FDR, BFR, Trésorerie — formules figées dans les cellules Excel',
    cofieple: 'Moteur TypeScript : FRNG, BFR, CAF détaillée, score de risque 0-100, jours d\'autonomie',
    advantage: 'cofieple',
  },
  {
    label: '5. Analyse pluriannuelle',
    reprofi: 'Saisie manuelle des données N-1 à N-4 dans un onglet séparé',
    cofieple: 'Persistance base de données (5 ans), graphiques de tendance automatiques, alertes IA sur variations atypiques',
    advantage: 'cofieple',
  },
  {
    label: '6. Rapports institutionnels',
    reprofi: 'Rapport pré-formaté à compléter intégralement à la main',
    cofieple: 'Rapport Ordonnateur + Agent Comptable pré-remplis par l\'IA, zones de saisie commentaires',
    advantage: 'cofieple',
  },
  {
    label: '7. Présentation CA',
    reprofi: 'Pas de génération de diaporama — l\'utilisateur crée son PowerPoint seul',
    cofieple: 'Diaporama intégré (6 slides) + Prompt Expert Gamma.app avec tous les chiffres injectés',
    advantage: 'cofieple',
  },
  {
    label: '8. Indicateurs hors-comptables',
    reprofi: 'Non disponible — données contextuelles absentes',
    cofieple: 'Formulaire dédié : effectifs, SRH, patrimoine, viabilisation avec ratios automatiques',
    advantage: 'cofieple',
  },
];

export function UxChainDiagram() {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Chaîne de valeur UX — COFIEPLE vs REPROFI 4.5
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-bold w-1/6">Étape</th>
                <th className="text-left p-3 font-bold w-5/12">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> REPROFI 4.5
                  </span>
                </th>
                <th className="text-left p-3 font-bold w-5/12">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> COFIEPLE
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((step, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-bold text-primary whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {step.label}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{step.reprofi}</td>
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-emerald-600 text-white shrink-0 text-[9px] px-1.5 mt-0.5">+</Badge>
                      <span className="font-medium">{step.cofieple}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-muted/30 flex items-center justify-center gap-3 text-xs text-muted-foreground border-t">
          <Badge className="bg-emerald-600 text-white">8 / 8</Badge>
          <span>avantages COFIEPLE sur les 8 étapes de la chaîne de production du compte financier</span>
        </div>
      </CardContent>
    </Card>
  );
}
