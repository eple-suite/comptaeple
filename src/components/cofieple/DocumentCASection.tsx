// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Document joint à la convocation du CA
// Synthèse à destination du Conseil d'Administration
// Partie I : Exécution budgétaire · Partie II : Santé financière
// M9-6 2026 · Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, FileText, BarChart3, Wallet, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, MessageSquare, History } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { generateDocumentCA } from '@/lib/pdfDocumentCA';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HistoriqueRow {
  exercice: number;
  resultat: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  caf: number;
  jours_autonomie: number;
  reserves: number;
  taux_exec_charges: number;
  taux_exec_produits: number;
}

export function DocumentCASection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  // Load extra indicators + historical data
  const [ind, setInd] = useState<any>(null);
  const [historique, setHistorique] = useState<HistoriqueRow[]>([]);
  useEffect(() => {
    if (!etab.uai) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const userId = session.session.user.id;
        const [indRes, histRes] = await Promise.all([
          supabase.from('cofieple_extra_indicators')
            .select('effectif_eleves,effectif_dp,effectif_internes,nb_repas_servis,cout_denrees_repas')
            .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', userId)
            .maybeSingle(),
          supabase.from('cofieple_exercises')
            .select('exercice,resultat_budgetaire,fdr,bfr,tresorerie,caf,jours_autonomie,reserves,taux_exec_charges,taux_exec_produits')
            .eq('uai', etab.uai).eq('user_id', userId).eq('type_budget', 'principal')
            .order('exercice', { ascending: true }).limit(5),
        ]);
        if (indRes.data) setInd(indRes.data);
        if (histRes.data) {
          setHistorique(histRes.data.map(r => ({
            exercice: r.exercice, resultat: Number(r.resultat_budgetaire),
            fdr: Number(r.fdr), bfr: Number(r.bfr), tresorerie: Number(r.tresorerie),
            caf: Number(r.caf), jours_autonomie: Number(r.jours_autonomie),
            reserves: Number(r.reserves), taux_exec_charges: Number(r.taux_exec_charges),
            taux_exec_produits: Number(r.taux_exec_produits),
          })));
        }
      } catch {}
    })();
  }, [etab.uai, etab.exercice]);

  // Recette breakdown — must be before any early return
  const recettes = useMemo(() => {
    if (!R) return { etat: 0, collectivite: 0, propres: 0, ta: 0 };
    const po = R.produitsOrigine ?? {};
    let etat = 0, collectivite = 0, propres = 0, ta = 0;
    Object.entries(po).forEach(([k, v]) => {
      if (['741', '744', '745', '746'].some(p => k.startsWith(p))) etat += v;
      else if (['742', '743', '747'].some(p => k.startsWith(p))) collectivite += v;
      else if (k.startsWith('748')) ta += v;
      else if (['70', '71', '72', '75', '76'].some(p => k.startsWith(p))) propres += v;
    });
    return { etat, collectivite, propres, ta };
  }, [R]);

  const [commentaireOrdonnateur, setCommentaireOrdonnateur] = useState('');

  if (!R) return <EmptyState msg="Lancez l'analyse M9-6 pour générer le document à destination du Conseil d'Administration." />;

  const fdr = R.fdrComptable;
  const treso = R.tresorerieNette;
  const resBudg = R.resultatBudgetaire;
  const caf = R.cafBudgetaire;

  const handleExportPdf = () => {
    try {
      generateDocumentCA({ etab, R: R as any, indicateurs: ind, commentaireOrdonnateur, historique });
      toast.success('Document CA exporté en PDF', { description: `Document_CA_${etab.uai}_${etab.exercice}.pdf` });
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document joint à la convocation du CA
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synthèse du compte financier — Exercice {etab.exercice} — Art. R421-64 Code de l'Éducation
          </p>
        </div>
        <Button onClick={handleExportPdf} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter en PDF
        </Button>
      </div>

      {/* PARTIE I — EXÉCUTION BUDGÉTAIRE */}
      <Card className="shadow-card border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Partie I — Exécution budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Résultat */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Résultat budgétaire" value={formatEur(resBudg)}
              color={resBudg >= 0 ? 'green' : 'red'} icon={resBudg >= 0 ? '✅' : '⚠️'} isText />
            <KPICard label="Taux exéc. dépenses" value={`${(R.tauxExecCharges * 100).toFixed(1)} %`}
              color={R.tauxExecCharges >= 0.85 ? 'green' : 'amber'} icon="📊" isText />
            <KPICard label="Taux exéc. recettes" value={`${(R.tauxExecProduits * 100).toFixed(1)} %`}
              color={R.tauxExecProduits >= 0.90 ? 'green' : 'amber'} icon="📊" isText />
            <KPICard label="Taxe apprentissage" value={formatEur(recettes.ta)}
              color={recettes.ta > 0 ? 'green' : 'amber'} icon="🎓" isText />
          </div>

          {/* Exécution par service */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-xs font-bold text-foreground mb-3">Exécution par service</h3>
            <div className="space-y-2">
              {Object.entries(R.parService).map(([svc, d]: [string, any]) => {
                const tx = d.chargesPrev > 0 ? d.chargesReel / d.chargesPrev : 0;
                return (
                  <div key={svc} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground w-28 shrink-0 truncate">{svc} — {d.libelle}</span>
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all" style={{
                        width: `${Math.min(tx * 100, 100)}%`,
                        backgroundColor: tx >= 0.9 ? 'hsl(160,45%,45%)' : tx >= 0.7 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,55%)',
                      }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-14 text-right">{(tx * 100).toFixed(1)} %</span>
                    <span className="text-xs text-muted-foreground w-24 text-right">{formatEur(d.chargesReel)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Origine des recettes */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              { label: 'État (bourses)', value: recettes.etat, color: 'hsl(215,70%,50%)' },
              { label: 'Collectivité', value: recettes.collectivite, color: 'hsl(160,45%,45%)' },
              { label: 'Taxe apprentissage', value: recettes.ta, color: 'hsl(280,50%,50%)' },
              { label: 'Ress. propres', value: recettes.propres, color: 'hsl(38,92%,50%)' },
            ].map((r, i) => (
              <div key={i} className="rounded-lg border p-2.5 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.label}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{formatEur(r.value)}</div>
                <div className="text-[10px] text-muted-foreground">
                  {R.totalProduitsReel > 0 ? `${((r.value / R.totalProduitsReel) * 100).toFixed(1)} %` : '—'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PARTIE II — SANTÉ FINANCIÈRE */}
      <Card className="shadow-card border-t-4 border-t-emerald-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Partie II — Santé financière
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPICard label="Fonds de roulement" value={formatEur(fdr)} color={fdr >= 0 ? 'green' : 'red'}
              icon="🏦" sub={`${Math.round(R.joursFdr)} jours`} isText />
            <KPICard label="Besoin en FDR" value={formatEur(R.bfr)} color={R.bfr <= fdr ? 'green' : 'amber'}
              icon="📦" isText />
            <KPICard label="Trésorerie nette" value={formatEur(treso)} color={treso >= 0 ? 'green' : 'red'}
              icon="💰" sub={`${Math.round(R.joursAutonomie)} j. autonomie`} isText />
            <KPICard label="CAF budgétaire" value={formatEur(caf)} color={caf >= 0 ? 'green' : 'red'}
              icon={caf >= 0 ? '📈' : '📉'} isText />
            <KPICard label="Réserves" value={formatEur(R.reserves)} color="green"
              icon="🏛️" isText />
          </div>

          {/* Equation d'équilibre */}
          <div className="bg-muted/30 rounded-xl p-3 text-center text-sm">
            <span className="text-muted-foreground">Équation d'équilibre : </span>
            <span className="font-mono font-bold text-foreground">FDR = BFR + Trésorerie</span>
            <span className="ml-2">
              {Math.abs(fdr - R.bfr - treso) < 0.5
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                : <AlertTriangle className="h-4 w-4 text-destructive inline" />}
            </span>
          </div>

          {/* Immobilisations */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Immobilisations brutes</div>
              <div className="text-sm font-bold text-foreground mt-1">{formatEur(R.totalImmo)}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Amortissements</div>
              <div className="text-sm font-bold text-foreground mt-1">{formatEur(R.totalAmortissements)}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Valeur nette</div>
              <div className="text-sm font-bold text-foreground mt-1">{formatEur(R.valeurNette)}</div>
            </div>
          </div>

          {/* TMcap / TMnr */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">TMcap (charges à payer)</span>
                <Badge variant={R.tmcap > 15 ? 'destructive' : 'secondary'} className="text-[10px]">
                  {R.tmcap.toFixed(1)} %
                </Badge>
              </div>
              <div className="mt-1.5 bg-muted rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${Math.min(R.tmcap, 100)}%`,
                  backgroundColor: R.tmcap > 15 ? 'hsl(0,72%,55%)' : 'hsl(160,45%,45%)',
                }} />
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">TMnr (titres non recouvrés)</span>
                <Badge variant={R.tmnr > 20 ? 'destructive' : 'secondary'} className="text-[10px]">
                  {R.tmnr.toFixed(1)} %
                </Badge>
              </div>
              <div className="mt-1.5 bg-muted rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${Math.min(R.tmnr, 100)}%`,
                  backgroundColor: R.tmnr > 20 ? 'hsl(0,72%,55%)' : 'hsl(160,45%,45%)',
                }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commentaires de l'ordonnateur */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Commentaires de l'ordonnateur — Faits caractéristiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="commentaire-ordo" className="text-xs text-muted-foreground mb-2 block">
            Ce texte libre sera intégré au PDF avant les signatures. Décrivez les faits marquants de l'exercice,
            les décisions du CA, les événements exceptionnels, etc.
          </Label>
          <Textarea
            id="commentaire-ordo"
            value={commentaireOrdonnateur}
            onChange={e => setCommentaireOrdonnateur(e.target.value)}
            placeholder="Ex : L'exercice 2025 a été marqué par la rénovation du bâtiment B, financée par un prélèvement sur le fonds de roulement voté en CA du 15/03/2025…"
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="rounded-xl border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">📋 À propos de ce document :</strong> Ce document est joint à la convocation du Conseil d'Administration
        pour la session de vote du compte financier (Art. R421-64 Code de l'Éducation). Il présente une synthèse
        en deux parties : l'exécution budgétaire de l'exercice et la situation financière patrimoniale de l'établissement.
        Le PDF généré est prêt à être imprimé et joint à la convocation.
      </div>
    </div>
  );
}
