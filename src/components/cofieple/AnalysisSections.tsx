// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Sections Superviseur, Synthèse, Tableaux, Budget Annexe
// Conformité : M9-6 2026 §§ II, III, IV — Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur, formatPct } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard, FinancialBlock, FinancialRow } from './SharedComponents';
import { Search, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SUPERVISEUR — Vérification du sens des soldes (M9-6 Plan comptable EPLE)
// ═══════════════════════════════════════════════════════════════
export function SuperviseurSection() {
  const anomalies = useCofiepleStore(s => s.anomaliesBalance);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const bal = balance[activeBudget] || [];

  const anomalesOnly = anomalies.filter(a => a.anomalie);
  const bloqOnly = anomalies.filter(a => a.gravite === 'bloquant');

  if (bal.length === 0) return <EmptyState msg="Importez la balance (IMPORT BAL) et lancez l'analyse pour afficher le superviseur." />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Comptes analysés" value={anomalies.length} color="blue" icon="🔍" sub="Dans la balance" />
        <KPICard label="Soldes anormaux" value={anomalesOnly.length} color={anomalesOnly.length > 0 ? 'amber' : 'green'} icon="⚠️" sub="Sens inversé" />
        <KPICard label="Points bloquants" value={bloqOnly.length} color={bloqOnly.length > 0 ? 'red' : 'green'} icon="🚫" sub="FDR / Résultat" />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Vérification du sens des soldes — Balance comptable
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-2.5 text-left font-semibold">Compte</th>
                <th className="px-4 py-2.5 text-left font-semibold">Intitulé</th>
                <th className="px-4 py-2.5 text-center font-semibold">Cl.</th>
                <th className="px-4 py-2.5 text-right font-semibold">Solde débit</th>
                <th className="px-4 py-2.5 text-right font-semibold">Solde crédit</th>
                <th className="px-4 py-2.5 text-center font-semibold">Sens attendu</th>
                <th className="px-4 py-2.5 text-center font-semibold">Statut</th>
                <th className="px-4 py-2.5 text-left font-semibold">Conséquence M9-6</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {anomalies.map(a => (
                <tr key={a.compte} className={a.gravite === 'bloquant' ? 'bg-destructive/5' : a.anomalie ? 'bg-warning/5' : ''}>
                  <td className="px-4 py-2 font-mono font-bold text-primary">{a.compte}</td>
                  <td className="px-4 py-2 max-w-[180px] truncate">{a.intitule}</td>
                  <td className="px-4 py-2 text-center font-bold text-muted-foreground">{a.classe}</td>
                  <td className="px-4 py-2 text-right font-mono">{a.solDbt > 0 ? formatEur(a.solDbt) : ''}</td>
                  <td className="px-4 py-2 text-right font-mono">{a.solCrd > 0 ? formatEur(a.solCrd) : ''}</td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant="outline" className="text-xs">{a.sensAttendu === 'nul' ? 'Nul' : a.sensAttendu === 'créditeur' ? 'Crd' : a.sensAttendu === 'débiteur' ? 'Dbt' : 'Mix'}</Badge>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {a.anomalie ? (
                      <Badge className={a.gravite === 'bloquant' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}>
                        {a.gravite === 'bloquant' ? '🚫 BLOQ' : '⚠️ Anom'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold">✅ OK</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground max-w-[200px] text-xs">{a.conseqM96}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SYNTHÈSE — Exécution budgétaire par service (M9-6 § II)
// ═══════════════════════════════════════════════════════════════
export function SyntheseSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher la synthèse budgétaire." />;

  const services = Object.entries(R.parService);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Charges prévues" value={formatEur(R.totalChargesPrev)} color="blue" icon="💸" sub="Budget voté" isText />
        <KPICard label="Charges réalisées" value={formatEur(R.totalChargesReel)} color="amber" icon="✅" sub={`${((R.totalChargesReel / Math.max(R.totalChargesPrev, 1)) * 100).toFixed(1)} % exécuté`} isText />
        <KPICard label="Produits prévus" value={formatEur(R.totalProduitsPrev)} color="blue" icon="💰" sub="Budget voté" isText />
        <KPICard label="Produits réalisés" value={formatEur(R.totalProduitsReel)} color={R.plusMoinsValues >= 0 ? 'green' : 'red'} icon="✅" sub={`${R.plusMoinsValues >= 0 ? '+' : ''}${formatEur(R.plusMoinsValues)} vs prev.`} isText />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm uppercase tracking-wide">
            Synthèse de l'exécution budgétaire par service
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-right">Prévu charges</th>
                <th className="px-4 py-3 text-right">Réalisé charges</th>
                <th className="px-4 py-3 text-right">Reliquats</th>
                <th className="px-4 py-3 text-center">Taux exéc.</th>
                <th className="px-4 py-3 text-right">Prévu produits</th>
                <th className="px-4 py-3 text-right">Réalisé produits</th>
                <th className="px-4 py-3 text-right">+/- values</th>
                <th className="px-4 py-3 text-right">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map(([svc, d]) => (
                <tr key={svc} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-bold">
                    <div>{svc}</div>
                    <div className="text-muted-foreground font-normal text-xs">{d.libelle}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatEur(d.chargesPrev)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatEur(d.chargesReel)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatEur(d.reliquats)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[40px]">
                        <div className={`h-1.5 rounded-full ${d.tauxExecution >= 0.9 ? 'bg-emerald-500' : d.tauxExecution >= 0.7 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${Math.min(d.tauxExecution * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-12 text-right">{(d.tauxExecution * 100).toFixed(1)} %</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatEur(d.produitsPrev)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatEur(d.produitsReel)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${d.plusMoinsValues >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {d.plusMoinsValues !== 0 ? formatEur(d.plusMoinsValues) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${d.solde >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
                    {formatEur(d.solde)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-800 text-white font-bold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalChargesPrev)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalChargesReel)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.reliquatsCharges)}</td>
                <td className="px-4 py-3 text-center">{(R.totalChargesReel / Math.max(R.totalChargesPrev, 1) * 100).toFixed(1)} %</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalProduitsPrev)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalProduitsReel)}</td>
                <td className={`px-4 py-3 text-right font-mono ${R.plusMoinsValues >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatEur(R.plusMoinsValues)}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${R.resultatBudgetaire >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatEur(R.resultatBudgetaire)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TABLEAUX — FDR / BFR / Trésorerie / CAF (M9-6 §§ IV.1-3)
// ═══════════════════════════════════════════════════════════════
export function TableauxSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher les tableaux de bord." />;

  const fdr = R.fdrComptable;
  const bfr = R.bfr;
  const treso = R.tresorerieNette;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Fonds de roulement" value={formatEur(fdr)} color={fdr >= 0 ? 'green' : 'red'} icon="🏦" sub="Ressources perm. - Emplois perm." isText />
        <KPICard label="Besoin en FDR" value={formatEur(bfr)} color={bfr <= 0 ? 'green' : 'amber'} icon="📊" sub="Créances - Dettes d'exploit." isText />
        <KPICard label="Trésorerie nette" value={formatEur(treso)} color={treso >= 0 ? 'green' : 'red'} icon="💳" sub="Classe 5 nette" isText />
        <KPICard label="CAF/IAF budgétaire" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub="Capacité d'autofinancement" isText />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm uppercase tracking-wide">
            Structuration financière — M9-6 §§ IV.1-3
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <FinancialBlock title="Fonds de Roulement" color="blue">
              <FinancialRow label="FDR par le haut" value={R.fdrHaut} formatFn={formatEur} />
              <FinancialRow label="FDR par le bas" value={R.fdrBas} formatFn={formatEur} />
              <FinancialRow label="Variation FDR N/N-1" value={R.varFdrBas} highlight formatFn={formatEur} />
              <FinancialRow label="CAF/IAF budgétaire" value={R.cafBudgetaire} formatFn={formatEur} />
              <FinancialRow label="Variation FDR depuis CAF" value={R.varFdrDepuisCaf} formatFn={formatEur} />
            </FinancialBlock>

            <FinancialBlock title="Besoin en Fonds de Roulement" color="amber">
              <FinancialRow label="BFR (fin N)" value={R.bfr} formatFn={formatEur} />
              <FinancialRow label="Variation BFR synthétique" value={R.varBfrSynthetique} highlight formatFn={formatEur} />
              <FinancialRow label="Variation BFR soustractive" value={R.varBfrSoustractive} formatFn={formatEur} />
              <FinancialRow label="BFR TF" value={R.varBfrTableauFinancement} formatFn={formatEur} />
              <FinancialRow label="BFR comptable" value={R.varBfrComptable} formatFn={formatEur} />
            </FinancialBlock>

            <FinancialBlock title="Trésorerie" color="emerald">
              <FinancialRow label="Trésorerie nette" value={R.tresorerieNette} highlight formatFn={formatEur} />
              <FinancialRow label="Var. trésorerie comptable" value={R.varTresorerieComptable} formatFn={formatEur} />
              <FinancialRow label="Var. trésorerie TF" value={R.varTresorerieTableauFinancement} formatFn={formatEur} />
              <FinancialRow label="Total flux trésorerie" value={R.totalFluxTresorerie} formatFn={formatEur} />
              <FinancialRow label="Structuration trésorerie" value={R.structurationTresorerie} formatFn={formatEur} />
            </FinancialBlock>
          </div>

          {/* Équation FDR = BFR + Tréso */}
          <div className="mt-4 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="text-muted-foreground font-medium">Équation FDR :</div>
              <div className="font-mono font-bold text-primary bg-primary/10 rounded px-2 py-1">FDR = {formatEur(fdr)}</div>
              <span className="text-muted-foreground">=</span>
              <div className="font-mono font-bold text-warning bg-warning/10 rounded px-2 py-1">BFR = {formatEur(bfr)}</div>
              <span className="text-muted-foreground">+</span>
              <div className="font-mono font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20 rounded px-2 py-1">Tréso = {formatEur(treso)}</div>
              <span className={`ml-auto font-bold text-sm ${Math.abs(fdr - bfr - treso) < 0.05 ? 'text-emerald-600' : 'text-destructive'}`}>
                {Math.abs(fdr - bfr - treso) < 0.05 ? '✅ Équilibré' : `❌ Écart : ${formatEur(fdr - bfr - treso)}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats et CAF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm uppercase tracking-wide">Résultats de l'exercice</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <FinancialRow label="Résultat budgétaire" value={R.resultatBudgetaire} highlight formatFn={formatEur} />
            <FinancialRow label="Résultat comptable" value={R.resultatComptable} formatFn={formatEur} />
            <FinancialRow label="Excédent (compte 120)" value={R.excedent} formatFn={formatEur} />
            <FinancialRow label="Déficit (compte 129)" value={-R.deficit} formatFn={formatEur} />
            <FinancialRow label="Réserves (compte 1068)" value={R.reserves} formatFn={formatEur} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm uppercase tracking-wide">CAF / IAF</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <FinancialRow label="CAF/IAF budgétaire" value={R.cafBudgetaire} highlight formatFn={formatEur} />
            <FinancialRow label="CAF/IAF comptable" value={R.cafComptable} formatFn={formatEur} />
            <FinancialRow label="Jours d'autonomie" value={R.joursAutonomie} formatFn={v => `${Math.round(v)} jours`} />
            <FinancialRow label="Ratio FDR/BFR" value={R.ratioFdrBfr} formatFn={v => v.toFixed(2)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUDGET ANNEXE — GRETA / CFA (M9-6 Titre III § III.4)
// ═══════════════════════════════════════════════════════════════
export function BudgetAnnexeSection() {
  const budgets = useCofiepleStore(s => s.budgets);
  const resultats = useCofiepleStore(s => s.resultats);
  const annexes = budgets.filter(b => b.type !== 'principal');

  if (annexes.length === 0) {
    return <EmptyState msg="Aucun budget annexe configuré. Rendez-vous dans Accueil pour activer un GRETA ou CFA." />;
  }

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs">
          <strong>Budgets annexes EPLE — Cadre réglementaire :</strong>{' '}
          Le budget annexe est voté et exécuté séparément du budget principal. La M9-6 2026 impose
          l'équilibre du GRETA (Art. L423-1 Code de l'Éducation) et prévoit les comptes de liaison 185
          pour les flux inter-budgets (M9-6 §2.3.4).
        </CardContent>
      </Card>

      {annexes.map(ba => {
        const R = resultats[ba.type];
        const isGreta = ba.type === 'annexe_greta';
        return (
          <Card key={ba.type}>
            <CardHeader className={`bg-gradient-to-r ${isGreta ? 'from-blue-900 to-blue-800' : 'from-purple-900 to-purple-800'} rounded-t-lg`}>
              <CardTitle className="text-white text-sm">
                {isGreta ? '🎓' : '🔧'} {ba.libelle}
                <span className="text-xs text-blue-300 ml-2">
                  {isGreta ? 'Art. L423-1 Code de l\'Éducation' : 'Art. L6232-1 Code du travail'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {!R ? (
                <p className="text-center text-muted-foreground text-sm italic py-4">
                  Importez les fichiers CSV du budget annexe et lancez l'analyse.
                </p>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KPICard label="Charges réalisées" value={formatEur(R.totalChargesReel)} color="amber" icon="💸" sub="Budget annexe" isText />
                  <KPICard label="Produits réalisés" value={formatEur(R.totalProduitsReel)} color="green" icon="💰" sub="Budget annexe" isText />
                  <KPICard label="Résultat budgétaire" value={formatEur(R.resultatBudgetaire)} color={R.resultatBudgetaire >= 0 ? 'green' : 'red'} icon="📊" sub={R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit'} isText />
                  <KPICard label="FDR" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Budget annexe" isText />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
