// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Générateur de Prompt Expert pour Gamma AI
// Extraction des variables m9-6engine.ts + données pluriannuelles
// Structure 10 diapositives pour le Conseil d'Administration
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HistoricalYear {
  exercice: number;
  resultat_budgetaire: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  caf: number;
  reserves: number;
  jours_autonomie: number;
  taux_exec_charges: number;
  taux_exec_produits: number;
}

export function GammaPromptSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoricalYear[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  // Load pluriannual data N-1 to N-4
  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      setLoadingHist(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data } = await supabase
          .from('cofieple_exercises')
          .select('exercice,resultat_budgetaire,fdr,bfr,tresorerie,caf,reserves,jours_autonomie,taux_exec_charges,taux_exec_produits')
          .eq('uai', etab.uai)
          .eq('user_id', session.session.user.id)
          .lt('exercice', etab.exercice)
          .order('exercice', { ascending: false })
          .limit(4);
        if (data) setHistory(data as HistoricalYear[]);
      } catch {} finally { setLoadingHist(false); }
    })();
  }, [etab.uai, etab.exercice, R]);

  if (!R) return null;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : 'non renseignée';

  const histBlock = history.length > 0
    ? `\n## Historique pluriannuel (N-1 à N-${history.length})
${history.map(h => `### Exercice ${h.exercice}
- Résultat budgétaire : ${formatEur(h.resultat_budgetaire)}
- FRNG (FDR) : ${formatEur(h.fdr)}
- BFR : ${formatEur(h.bfr)}
- Trésorerie : ${formatEur(h.tresorerie)}
- CAF/IAF : ${formatEur(h.caf)}
- Réserves : ${formatEur(h.reserves)}
- Jours d'autonomie : ${Math.round(h.jours_autonomie)}
- Taux exécution charges : ${(h.taux_exec_charges * 100).toFixed(1)} %
- Taux exécution produits : ${(h.taux_exec_produits * 100).toFixed(1)} %`).join('\n')}`
    : '\n## Historique pluriannuel\nDonnées N-1 à N-4 non encore saisies. Complétez l\'onglet « N à N-4 » pour enrichir ce prompt.\n';

  const variationsBlock = history.length > 0
    ? (() => {
        const n1 = history[0];
        const varFdr = n1 ? ((R.fdrComptable - n1.fdr) / Math.abs(n1.fdr || 1) * 100).toFixed(1) : '—';
        const varCaf = n1 ? ((R.cafBudgetaire - n1.caf) / Math.abs(n1.caf || 1) * 100).toFixed(1) : '—';
        const varTreso = n1 ? ((R.tresorerieNette - n1.tresorerie) / Math.abs(n1.tresorerie || 1) * 100).toFixed(1) : '—';
        return `\n## Variations significatives N / N-1
- FDR : ${varFdr} % (${formatEur(R.fdrComptable)} vs ${formatEur(n1.fdr)})
- CAF : ${varCaf} % (${formatEur(R.cafBudgetaire)} vs ${formatEur(n1.caf)})
- Trésorerie : ${varTreso} % (${formatEur(R.tresorerieNette)} vs ${formatEur(n1.tresorerie)})
Analyse les variations significatives des stocks et de la trésorerie. Signale toute variation > 20 % avec une explication contextuelle.\n`;
      })()
    : '';

  const prompt = `Agis en tant qu'Expert M9.6. Crée une présentation professionnelle de 10 diapositives pour le Conseil d'Administration de l'EPLE. Utilise exclusivement les données calculées ci-dessous. N'invente aucun chiffre.

## Informations de l'établissement
- Nom : ${etab.nom || '—'}
- Code RNE (UAI) : ${etab.uai || '—'}
- Type : ${etab.type || '—'}
- Académie : ${etab.academie || '—'} — Région académique : ${etab.regionAcademique || '—'}
- Exercice comptable : ${etab.exercice}
- Date d'arrêté : ${dateArrete}
- Ordonnateur : ${etab.ordonnateur || '—'}
- Agent comptable : ${etab.agentComptable || '—'}

## Données calculées — Exercice ${etab.exercice}
### Exécution budgétaire
- Mandatements (charges réelles) : ${formatEur(R.totalChargesReel)}
- Recettes comptabilisées (produits réels) : ${formatEur(R.totalProduitsReel)}
- Crédits ouverts (charges prévisionnelles) : ${formatEur(R.totalChargesPrev)}
- Prévisions de recettes : ${formatEur(R.totalProduitsPrev)}
- Taux d'exécution charges : ${(R.tauxExecCharges * 100).toFixed(1)} %
- Taux d'exécution produits : ${(R.tauxExecProduits * 100).toFixed(1)} %
- Résultat budgétaire : ${formatEur(R.resultatBudgetaire)} (${R.resultatBudgetaire >= 0 ? 'excédent' : 'déficit'})

### Situation patrimoniale au 31/12/${etab.exercice}
- FRNG (Fonds de roulement net global) : ${formatEur(R.fdrComptable)}
- BFR (Besoin en fonds de roulement) : ${formatEur(R.bfr)}
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
${histBlock}${variationsBlock}
## Structure obligatoire des 10 slides
1. **Couverture** — Nom, exercice, académie, ordonnateur, agent comptable, date d'arrêté
2. **Contexte** — Présentation de l'EPLE, effectifs, boursiers, type d'établissement
3. **Exécution budgétaire** — Mandatements vs recettes, taux d'exécution (graphique à barres)
4. **Résultat de l'exercice** — Excédent ou déficit, comparaison N/N-1
5. **Situation patrimoniale** — FRNG, BFR, Trésorerie avec équation d'équilibre (graphique waterfall)
6. **Autofinancement** — CAF/IAF budgétaire et comptable, réserves disponibles
7. **Évolution pluriannuelle** — Graphiques de tendance sur 5 ans (FDR, Trésorerie, CAF)
8. **Exécution par service** — Graphique à barres horizontales avec taux d'exécution
9. **Points d'attention et perspectives** — Risques identifiés, recommandations
10. **Conclusion** — Synthèse et remerciements

## Consignes de style
- Style institutionnel, sobre et professionnel (couleurs : bleu marine, blanc, touches de doré)
- Chaque slide doit avoir un titre clair en haut
- Graphiques en barres ou jauges pour les taux d'exécution
- Graphique waterfall pour la construction du FRNG
- Les montants en euros format français (espaces comme séparateurs de milliers)
- Comparer systématiquement N avec N-1 quand les données sont disponibles

Référence réglementaire : Instruction codificatrice M9-6 du 12/02/2026 — Décret n°2012-1246 (RGCP)`;

  function handleCopy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Prompt copié ! Collez-le dans Gamma AI');
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" />
          Prompt Expert pour Gamma AI — 10 diapositives
          <Badge variant="outline" className="text-xs ml-auto">
            {loadingHist ? 'Chargement historique…' : history.length > 0 ? `${history.length} exercice(s) antérieur(s) inclus` : 'Interopérabilité'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Ce prompt extrait automatiquement <strong>toutes les variables calculées</strong> par le moteur m9-6engine.ts
          et les données pluriannuelles N-1 à N-4. Collez-le dans <strong>Gamma AI</strong> pour générer un diaporama
          professionnel de 10 slides en un clic.
        </p>
        <Textarea value={prompt} readOnly className="font-mono text-xs min-h-[250px] bg-muted/30" />
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le prompt'}
          </Button>
          <Button variant="outline" asChild>
            <a href="https://gamma.app" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Ouvrir Gamma AI
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
