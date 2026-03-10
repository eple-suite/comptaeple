// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Check-List M9-6 (15 vérifications réglementaires)
// Réf : M9-6 §§ II, III, IV — Décret 2012-1246 art. 195-199
// Avantage vs REPROFI : Score de risque prédictif, pistes de correction
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import type { CheckItem } from '@/lib/cofieple_storeTypes';
import { CheckCircle2, AlertTriangle, Ban, BookOpen, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';

export function CheckListSection() {
  const checkItems = useCofiepleStore(s => s.checkItems);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  const nbBloq = checkItems.filter(c => c.bloquant).length;
  const nbAnom = checkItems.filter(c => c.statut !== 'ok').length;
  const nbOK = checkItems.filter(c => c.statut === 'ok').length;

  if (!R) return <EmptyState msg="Lancez l'analyse depuis la section Imports pour afficher la check-list des rapprochements M9-6." />;

  const scoreRisque = R.scoreRisque ?? 0;
  const niveauRisque = R.niveauRisque ?? 'faible';
  const riskColors = {
    'faible': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    'modéré': 'text-warning bg-warning/20',
    'élevé': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    'critique': 'text-destructive bg-destructive/10',
  };

  return (
    <div className="space-y-5">
      {/* Score de risque prédictif — Avantage vs REPROFI */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ShieldAlert className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                Analyse prédictive — Score de risque financier
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black font-mono px-3 py-1 rounded-lg ${riskColors[niveauRisque]}`}>
                  {scoreRisque}/100
                </span>
                <Badge className={riskColors[niveauRisque]}>
                  Risque {niveauRisque}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {niveauRisque === 'faible' ? 'Situation financière saine — aucun signal d\'alerte' :
                   niveauRisque === 'modéré' ? 'Points de vigilance identifiés — à surveiller' :
                   niveauRisque === 'élevé' ? 'Alertes significatives — plan d\'action recommandé' :
                   'Situation financière dégradée — action immédiate requise'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {R.joursAutonomie > 0 && (
                <Badge variant="outline" className="font-mono">
                  {R.joursAutonomie >= 30 ? <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" /> : <TrendingDown className="h-3 w-3 mr-1 text-destructive" />}
                  {Math.round(R.joursAutonomie)} jours d'autonomie
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Points bloquants" value={nbBloq} color={nbBloq > 0 ? 'red' : 'green'} icon="🚫" sub="Au dépôt du compte financier" />
        <KPICard label="Anomalies" value={nbAnom} color={nbAnom > 0 ? 'amber' : 'green'} icon="⚠️" sub={`Sur ${checkItems.length} vérifications`} />
        <KPICard label="Contrôles conformes" value={nbOK} color="green" icon="✅" sub={`Sur ${checkItems.length} rapprochements`} />
        <KPICard label="Résultat budgétaire" value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="💰" sub={R.resultatBudgetaire >= 0 ? 'Excédent de fonctionnement' : 'Déficit de fonctionnement'} isText />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Check-List des rapprochements M9-6 — 15 vérifications réglementaires
            <span className="ml-auto text-slate-400 text-xs">Décret 2012-1246 art. 195-199 — M9-6 2026</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {checkItems.map(check => <CheckRow key={check.id} check={check} />)}
        </CardContent>
      </Card>

      {/* Légende réglementaire */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground mb-1.5">📖 Références réglementaires des contrôles</div>
          <div>• <strong>Points bloquants</strong> (🚫) — Empêchent le dépôt du compte financier (Décret 2012-1246 art. 195)</div>
          <div>• <strong>Rapprochement SDE/SDR ↔ Balance</strong> — Concordance ordonnateur / agent comptable (M9-6 § II)</div>
          <div>• <strong>FDR par le haut = FDR par le bas</strong> — Équilibre du bilan (M9-6 § IV.1)</div>
          <div>• <strong>FDR = BFR + Trésorerie</strong> — Structuration financière (M9-6 § IV.2)</div>
          <div>• <strong>CAF/IAF</strong> — Capacité / Insuffisance d'autofinancement (M9-6 § IV.3)</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckRow({ check }: { check: CheckItem }) {
  const icons = {
    ok: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    warn: <AlertTriangle className="h-5 w-5 text-warning" />,
    erreur: <AlertTriangle className="h-5 w-5 text-destructive" />,
    bloquant: <Ban className="h-5 w-5 text-destructive" />,
  };
  const rowBg = {
    ok: '',
    warn: 'bg-warning/5',
    erreur: 'bg-destructive/5',
    bloquant: 'bg-destructive/10 border-l-4 border-l-destructive',
  };
  const badgeVariant = {
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warn: 'bg-warning/20 text-warning',
    erreur: 'bg-destructive/20 text-destructive',
    bloquant: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className={`px-5 py-4 ${rowBg[check.statut]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icons[check.statut]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-semibold text-sm">{check.titre}</span>
            <Badge className={`text-xs ${badgeVariant[check.statut]}`}>
              {check.statut === 'ok' ? 'CONFORME' : check.statut === 'bloquant' ? 'BLOQUANT' : 'ANOMALIE'}
            </Badge>
            {check.statut !== 'ok' && <span className="text-xs text-muted-foreground font-mono">Écart : {formatEur(check.ecart)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{check.variable1Label}</div>
              <div className="font-bold text-sm font-mono">{formatEur(check.variable1)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{check.variable2Label}</div>
              <div className="font-bold text-sm font-mono">{formatEur(check.variable2)}</div>
            </div>
          </div>
          {check.piste && (
            <div className="text-xs text-primary bg-primary/5 rounded px-2 py-1.5 mt-1.5">
              💡 <strong>Piste de correction :</strong> {check.piste}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {check.regleM96}
          </div>
        </div>
      </div>
    </div>
  );
}
