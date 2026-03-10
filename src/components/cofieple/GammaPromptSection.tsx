// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Générateur de Prompt Expert pour Gamma.app
// Interopérabilité : génère un prompt structuré avec tous les
// chiffres clés pour créer un diaporama professionnel
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { toast } from 'sonner';

export function GammaPromptSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const [copied, setCopied] = useState(false);

  if (!R) return null;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : 'non renseignée';

  const prompt = `Crée un diaporama professionnel de 8 slides pour la présentation du compte financier d'un EPLE au conseil d'administration.

## Informations de l'établissement
- Nom : ${etab.nom || '—'}
- Code RNE (UAI) : ${etab.uai || '—'}
- Type : ${etab.type || '—'}
- Académie : ${etab.academie || '—'} — Région académique : ${etab.regionAcademique || '—'}
- Exercice comptable : ${etab.exercice}
- Date d'arrêté : ${dateArrete}
- Ordonnateur : ${etab.ordonnateur || '—'}
- Agent comptable : ${etab.agentComptable || '—'}

## Chiffres clés de l'exercice ${etab.exercice}
### Exécution budgétaire
- Mandatements (charges réelles) : ${formatEur(R.totalChargesReel)}
- Recettes comptabilisées (produits réels) : ${formatEur(R.totalProduitsReel)}
- Crédits ouverts (charges prévisionnelles) : ${formatEur(R.totalChargesPrev)}
- Prévisions de recettes : ${formatEur(R.totalProduitsPrev)}
- Taux d'exécution charges : ${(R.tauxExecCharges * 100).toFixed(1)} %
- Taux d'exécution produits : ${(R.tauxExecProduits * 100).toFixed(1)} %
- Résultat budgétaire : ${formatEur(R.resultatBudgetaire)} (${R.resultatBudgetaire >= 0 ? 'excédent' : 'déficit'})

### Situation patrimoniale au 31/12/${etab.exercice}
- Fonds de roulement (FDR) : ${formatEur(R.fdrComptable)}
- Besoin en fonds de roulement (BFR) : ${formatEur(R.bfr)}
- Trésorerie nette : ${formatEur(R.tresorerieNette)}
- Jours d'autonomie financière : ${Math.round(R.joursAutonomie)} jours
- Équation d'équilibre : FDR = BFR + Trésorerie → ${Math.abs(R.fdrComptable - R.bfr - R.tresorerieNette) < 0.05 ? 'Vérifié ✅' : 'Écart détecté ⚠️'}

### Autofinancement
- CAF/IAF budgétaire : ${formatEur(R.cafBudgetaire)} (${R.cafBudgetaire >= 0 ? 'capacité' : 'insuffisance'} d'autofinancement)
- CAF/IAF comptable : ${formatEur(R.cafComptable)}
- Résultat comptable : ${formatEur(R.resultatComptable)}
- Réserves (compte 1068) : ${formatEur(R.reserves)}

### Exécution par service
${Object.entries(R.parService).map(([svc, d]: [string, any]) => {
  const tx = d.chargesPrev > 0 ? ((d.chargesReel / d.chargesPrev) * 100).toFixed(1) : '—';
  return `- ${svc} (${d.libelle}) : charges ${formatEur(d.chargesReel)} / prévisions ${formatEur(d.chargesPrev)} → taux ${tx} %`;
}).join('\n')}

## Consignes de style
- Style institutionnel, sobre et professionnel (couleurs : bleu marine, blanc, touches de doré)
- Chaque slide doit avoir un titre clair en haut
- Utiliser des graphiques en barres ou jauges pour illustrer les taux d'exécution
- Graphique waterfall ou en cascade pour la construction du FDR
- Les montants doivent être en euros, format français (espaces comme séparateurs de milliers)
- Dernière slide : "Merci pour votre attention" avec les coordonnées

## Structure des slides
1. Couverture (nom, exercice, académie, ordonnateur, agent comptable)
2. Exécution budgétaire (mandatements vs recettes, taux d'exécution)
3. Résultat de l'exercice (excédent ou déficit, comparaison N/N-1 si dispo)
4. Situation patrimoniale (FDR, BFR, Trésorerie — équation d'équilibre)
5. Autofinancement (CAF/IAF, réserves)
6. Exécution par service (graphique à barres horizontales)
7. Points d'attention et perspectives
8. Conclusion et remerciements

Référence réglementaire : Instruction codificatrice M9-6 du 12/02/2026 — Décret n°2012-1246 (RGCP)`;

  function handleCopy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Prompt copié ! Collez-le dans Gamma.app');
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" />
          Option B — Prompt Expert pour Gamma.app
          <Badge variant="outline" className="text-xs ml-auto">Interopérabilité</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Ce prompt contient automatiquement tous les chiffres clés calculés par le moteur COFIEPLE.
          Collez-le dans <strong>Gamma.app</strong> pour générer un diaporama esthétique et professionnel en un clic.
        </p>
        <Textarea value={prompt} readOnly className="font-mono text-xs min-h-[200px] bg-muted/30" />
        <div className="flex gap-3">
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le prompt'}
          </Button>
          <Button variant="outline" asChild>
            <a href="https://gamma.app" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Ouvrir Gamma.app
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
