// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Sections Superviseur, Synthèse, Tableaux, Budget Annexe
// Conformité stricte : M9-6 2026 §§ II, III, IV — Décret 2012-1246
// Terminologie : Section de fonctionnement, Section d'investissement,
//               Opérations d'ordre, CAF/IAF, FDR, BFR, Trésorerie
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur, formatPct } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard, FinancialBlock, FinancialRow } from './SharedComponents';
import { Search, Ban, AlertTriangle, CheckCircle2, Scale, FileSpreadsheet, TrendingUp } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SUPERVISEUR — Vérification du sens des soldes (M9-6 Plan comptable EPLE)
// Avantage vs REPROFI : détection automatique + conséquences M9-6
// ═══════════════════════════════════════════════════════════════
export function SuperviseurSection() {
  const anomalies = useCofiepleStore(s => s.anomaliesBalance);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const bal = balance[activeBudget] || [];

  const anomalesOnly = anomalies.filter(a => a.anomalie);
  const bloqOnly = anomalies.filter(a => a.gravite === 'bloquant');

  if (bal.length === 0) return <EmptyState msg="Importez la balance (IMPORT BAL Op@le) et lancez l'analyse pour afficher le superviseur des soldes." />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Comptes analysés" value={anomalies.length} color="blue" icon="🔍" sub="Balance de sortie" />
        <KPICard label="Soldes anormaux" value={anomalesOnly.length} color={anomalesOnly.length > 0 ? 'amber' : 'green'} icon="⚠️" sub="Sens inversé (Plan comptable M9-6)" />
        <KPICard label="Points bloquants" value={bloqOnly.length} color={bloqOnly.length > 0 ? 'red' : 'green'} icon="🚫" sub="Impact FDR / Résultat / Trésorerie" />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Superviseur des soldes — Balance comptable EPLE
            <span className="ml-auto text-slate-400 text-xs">M9-6 2026 Plan comptable EPLE</span>
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
                      <span className="text-xs text-emerald-600 font-bold">✅</span>
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
// Terminologie conforme : section de fonctionnement, crédits ouverts,
// mandatements, reliquats, plus ou moins-values de recettes
// ═══════════════════════════════════════════════════════════════
export function SyntheseSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher la synthèse de l'exécution budgétaire." />;

  const services = Object.entries(R.parService);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Crédits ouverts (dépenses)" value={formatEur(R.totalChargesPrev)} color="blue" icon="💸" sub="Budget voté + DBM" isText />
        <KPICard label="Mandatements" value={formatEur(R.totalChargesReel)} color="amber" icon="✅" sub={`Taux d'exécution : ${(R.tauxExecCharges * 100).toFixed(1)} %`} isText />
        <KPICard label="Prévisions de recettes" value={formatEur(R.totalProduitsPrev)} color="blue" icon="💰" sub="Budget voté + DBM" isText />
        <KPICard label="Recettes comptabilisées" value={formatEur(R.totalProduitsReel)} color={R.plusMoinsValues >= 0 ? 'green' : 'red'} icon="✅" sub={`${R.plusMoinsValues >= 0 ? '+' : ''}${formatEur(R.plusMoinsValues)} vs prévisions`} isText />
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exécution budgétaire par service — Section de fonctionnement
            <span className="ml-auto text-slate-400 text-xs">M9-6 § II — Compte financier</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-right">Crédits ouverts</th>
                <th className="px-4 py-3 text-right">Mandatements</th>
                <th className="px-4 py-3 text-right">Reliquats</th>
                <th className="px-4 py-3 text-center">Taux d'exéc.</th>
                <th className="px-4 py-3 text-right">Prév. recettes</th>
                <th className="px-4 py-3 text-right">Recettes compt.</th>
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
                <td className="px-4 py-3">TOTAL SECTION DE FONCTIONNEMENT</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalChargesPrev)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.totalChargesReel)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatEur(R.reliquatsCharges)}</td>
                <td className="px-4 py-3 text-center">{(R.tauxExecCharges * 100).toFixed(1)} %</td>
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
// TABLEAUX — FDR / BFR / Trésorerie / CAF / Bilan / Compte de Résultat
// M9-6 §§ IV.1-3 + Bilan fonctionnel + CdR par nature
// Avantage vs REPROFI : Bilan et CdR intégrés + vérification d'équilibre
// ═══════════════════════════════════════════════════════════════
export function TableauxSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const balance = useCofiepleStore(s => s.balance);
  const bal = balance[activeBudget] || [];

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher les tableaux de synthèse financière." />;

  const fdr = R.fdrComptable;
  const bfr = R.bfr;
  const treso = R.tresorerieNette;

  // Bilan simplifié EPLE (M9-6 § III.3)
  const bilanActif = [
    { poste: 'Immobilisations brutes (Cl. 2 hors 28/29)', montant: R.totalImmo },
    { poste: 'Amortissements (Cl. 28)', montant: -R.totalAmortissements },
    { poste: 'Valeur nette des immobilisations', montant: R.valeurNette, bold: true },
    { poste: 'Stocks et en-cours (Cl. 3)', montant: bal.filter(b => b.classe === '3' && !b.compte.startsWith('39')).reduce((s, b) => s + b.solDbt, 0) },
    { poste: 'Créances (Cl. 4 débiteurs)', montant: bal.filter(b => b.classe === '4').reduce((s, b) => s + b.solDbt, 0) },
    { poste: 'Disponibilités DFT et caisse (Cl. 5)', montant: bal.filter(b => b.classe === '5').reduce((s, b) => s + b.solDbt, 0) },
  ];
  const bilanPassif = [
    { poste: 'Capitaux propres (Cl. 10-11-12)', montant: bal.filter(b => ['10','11','12'].some(p => b.compte.startsWith(p))).reduce((s, b) => s + b.solCrd - b.solDbt, 0) },
    { poste: 'Subventions d\'investissement (Cl. 13)', montant: bal.filter(b => b.compte.startsWith('13') && !b.compte.startsWith('139')).reduce((s, b) => s + b.solCrd, 0) },
    { poste: 'Provisions (Cl. 15)', montant: bal.filter(b => b.compte.startsWith('15')).reduce((s, b) => s + b.solCrd, 0) },
    { poste: 'Dettes fournisseurs et organismes (Cl. 4 créditeurs)', montant: bal.filter(b => b.classe === '4').reduce((s, b) => s + b.solCrd, 0) },
    { poste: 'Concours bancaires (Cl. 519)', montant: bal.filter(b => b.compte.startsWith('519')).reduce((s, b) => s + b.solCrd, 0) },
  ];
  const totalActif = bilanActif.reduce((s, p) => s + p.montant, 0);
  const totalPassif = bilanPassif.reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Fonds de roulement" value={formatEur(fdr)} color={fdr >= 0 ? 'green' : 'red'} icon="🏦" sub="Ressources perm. − Emplois perm." isText />
        <KPICard label="Besoin en fonds de roulement" value={formatEur(bfr)} color={bfr <= 0 ? 'green' : 'amber'} icon="📊" sub="Créances − Dettes d'exploitation" isText />
        <KPICard label="Trésorerie nette" value={formatEur(treso)} color={treso >= 0 ? 'green' : 'red'} icon="💳" sub="Disponibilités DFT et caisse" isText />
        <KPICard label="CAF/IAF budgétaire" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité d\'autofinancement' : 'Insuffisance d\'autofinancement'} isText />
      </div>

      {/* Structuration financière FDR / BFR / Trésorerie */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2 uppercase tracking-wide">
            <Scale className="h-4 w-4" />
            Structuration financière — M9-6 §§ IV.1-3
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <FinancialBlock title="Fonds de Roulement (M9-6 § IV.1)" color="blue">
              <FinancialRow label="FDR par le haut (ressources permanentes)" value={R.fdrHaut} formatFn={formatEur} />
              <FinancialRow label="FDR par le bas (actif circulant net)" value={R.fdrBas} formatFn={formatEur} />
              <FinancialRow label="Variation FDR N / N-1" value={R.varFdrBas} highlight formatFn={formatEur} />
              <FinancialRow label="CAF/IAF budgétaire" value={R.cafBudgetaire} formatFn={formatEur} />
              <FinancialRow label="Variation FDR depuis CAF" value={R.varFdrDepuisCaf} formatFn={formatEur} />
            </FinancialBlock>

            <FinancialBlock title="Besoin en Fonds de Roulement (M9-6 § IV.2)" color="amber">
              <FinancialRow label="BFR (fin N)" value={R.bfr} formatFn={formatEur} />
              <FinancialRow label="Variation BFR synthétique (BF − BE)" value={R.varBfrSynthetique} highlight formatFn={formatEur} />
              <FinancialRow label="Variation BFR soustractive" value={R.varBfrSoustractive} formatFn={formatEur} />
              <FinancialRow label="Variation BFR tableau de financement" value={R.varBfrTableauFinancement} formatFn={formatEur} />
            </FinancialBlock>

            <FinancialBlock title="Trésorerie (M9-6 § IV.2)" color="emerald">
              <FinancialRow label="Trésorerie nette (DFT + caisse)" value={R.tresorerieNette} highlight formatFn={formatEur} />
              <FinancialRow label="Var. trésorerie comptable" value={R.varTresorerieComptable} formatFn={formatEur} />
              <FinancialRow label="Var. trésorerie tableau financement" value={R.varTresorerieTableauFinancement} formatFn={formatEur} />
              <FinancialRow label="Flux nets de trésorerie" value={R.totalFluxTresorerie} formatFn={formatEur} />
              <FinancialRow label="Jours d'autonomie financière (FDR)" value={R.joursFdr} formatFn={v => `${v.toFixed(2)} jours`} />
            </FinancialBlock>
          </div>

          {/* Équation FDR = BFR + Tréso (M9-6 § IV.2) */}
          <div className="mt-4 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="text-muted-foreground font-medium">Équation d'équilibre (M9-6 § IV.2) :</div>
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
            <CardTitle className="text-white text-sm uppercase tracking-wide">Résultat de l'exercice (M9-6 § III.2)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <FinancialRow label="Résultat budgétaire (produits − charges)" value={R.resultatBudgetaire} highlight formatFn={formatEur} />
            <FinancialRow label="Résultat comptable (Cl. 120 − Cl. 129)" value={R.resultatComptable} formatFn={formatEur} />
            <FinancialRow label="Excédent (compte 120)" value={R.excedent} formatFn={formatEur} />
            <FinancialRow label="Déficit (compte 129)" value={-R.deficit} formatFn={formatEur} />
            <FinancialRow label="Réserves disponibles (compte 1068)" value={R.reserves} formatFn={formatEur} />
            <FinancialRow label="dont réserves sans spécialité (106840)" value={R.reservesSsSpeciaux} formatFn={formatEur} />
            <FinancialRow label="dont réserves SRH (106870)" value={R.reservesSRH} formatFn={formatEur} />
            {/* Concordance résultat budgétaire / comptable */}
            <div className={`text-xs font-semibold mt-2 px-2 py-1.5 rounded ${
              Math.abs(R.resultatBudgetaire - R.resultatComptable) < 0.05
                ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20'
                : 'text-destructive bg-destructive/10'
            }`}>
              {Math.abs(R.resultatBudgetaire - R.resultatComptable) < 0.05
                ? '✅ Concordance résultat budgétaire / comptable'
                : `⚠️ Écart résultat budgétaire / comptable : ${formatEur(R.resultatBudgetaire - R.resultatComptable)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm uppercase tracking-wide">CAF / IAF (M9-6 § IV.3)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <FinancialRow label="CAF/IAF budgétaire" value={R.cafBudgetaire} highlight formatFn={formatEur} />
            <FinancialRow label="CAF/IAF comptable" value={R.cafComptable} formatFn={formatEur} />
            <FinancialRow label="Jours d'autonomie financière" value={R.joursAutonomie} formatFn={v => `${Math.round(v)} jours`} />
            <FinancialRow label="Ratio FDR / BFR" value={R.ratioFdrBfr} formatFn={v => v.toFixed(2)} />
            <FinancialRow label="Ressources propres (Cl. 70-76)" value={R.ressourcesPropres} formatFn={formatEur} />
            <FinancialRow label="Recettes auto-générées (Cl. 70-73)" value={R.recettesAutogenerees} formatFn={formatEur} />
            {/* Seuil réglementaire des 30 jours */}
            <div className={`text-xs font-semibold mt-2 px-2 py-1.5 rounded ${
              R.joursAutonomie >= 30
                ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20'
                : 'text-destructive bg-destructive/10'
            }`}>
              {R.joursAutonomie >= 30
                ? '✅ Au-dessus du seuil d\'alerte de 30 jours d\'autonomie'
                : `⚠️ En dessous du seuil d'alerte de 30 jours (${Math.round(R.joursAutonomie)} j.) — Situation à signaler`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilan simplifié EPLE (M9-6 § III.3) */}
      {bal.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm flex items-center gap-2 uppercase tracking-wide">
              <Scale className="h-4 w-4" />
              Bilan simplifié de l'EPLE — M9-6 § III.3
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="grid grid-cols-2 divide-x divide-border">
              {/* Actif */}
              <div>
                <div className="bg-primary/10 px-4 py-2 font-bold text-sm text-primary uppercase tracking-wide">Actif</div>
                <div className="divide-y divide-border">
                  {bilanActif.map((p, i) => (
                    <div key={i} className={`px-4 py-2 flex justify-between text-xs ${p.bold ? 'font-bold bg-muted/50' : ''}`}>
                      <span className="text-muted-foreground">{p.poste}</span>
                      <span className="font-mono ml-2">{formatEur(p.montant)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 flex justify-between text-sm font-black bg-slate-800 text-white">
                    <span>TOTAL ACTIF</span>
                    <span className="font-mono">{formatEur(totalActif)}</span>
                  </div>
                </div>
              </div>
              {/* Passif */}
              <div>
                <div className="bg-warning/10 px-4 py-2 font-bold text-sm text-warning uppercase tracking-wide">Passif</div>
                <div className="divide-y divide-border">
                  {bilanPassif.map((p, i) => (
                    <div key={i} className="px-4 py-2 flex justify-between text-xs">
                      <span className="text-muted-foreground">{p.poste}</span>
                      <span className="font-mono ml-2">{formatEur(p.montant)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 flex justify-between text-sm font-black bg-slate-800 text-white">
                    <span>TOTAL PASSIF</span>
                    <span className="font-mono">{formatEur(totalPassif)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Équilibre du bilan */}
            <div className={`px-4 py-2.5 text-center text-xs font-bold ${
              Math.abs(totalActif - totalPassif) < 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20' : 'bg-destructive/10 text-destructive'
            }`}>
              {Math.abs(totalActif - totalPassif) < 1
                ? `✅ Bilan équilibré — Actif = Passif = ${formatEur(totalActif)}`
                : `❌ Déséquilibre du bilan — Écart : ${formatEur(totalActif - totalPassif)}`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compte de Résultat simplifié (M9-6 § III.2) */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="h-4 w-4" />
            Compte de Résultat par nature — M9-6 § III.2
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* Charges */}
            <div>
              <div className="bg-destructive/10 px-4 py-2 font-bold text-sm text-destructive uppercase tracking-wide">Charges (Cl. 6)</div>
              <div className="divide-y divide-border">
                {Object.entries(R.chargesNature).sort(([a], [b]) => a.localeCompare(b)).map(([nat, montant]) => (
                  <div key={nat} className="px-4 py-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{nat}</span>
                    <span className="font-mono">{formatEur(montant)}</span>
                  </div>
                ))}
                <div className="px-4 py-2.5 flex justify-between text-sm font-black bg-slate-800 text-white">
                  <span>TOTAL CHARGES</span>
                  <span className="font-mono">{formatEur(R.totalChargesBalance)}</span>
                </div>
              </div>
            </div>
            {/* Produits */}
            <div>
              <div className="bg-emerald-100 dark:bg-emerald-900/20 px-4 py-2 font-bold text-sm text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Produits (Cl. 7)</div>
              <div className="divide-y divide-border">
                {Object.entries(R.produitsOrigine).sort(([a], [b]) => a.localeCompare(b)).map(([nat, montant]) => (
                  <div key={nat} className="px-4 py-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{nat}</span>
                    <span className="font-mono">{formatEur(montant)}</span>
                  </div>
                ))}
                <div className="px-4 py-2.5 flex justify-between text-sm font-black bg-slate-800 text-white">
                  <span>TOTAL PRODUITS</span>
                  <span className="font-mono">{formatEur(R.totalProduitsBalance)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Résultat net */}
          <div className={`px-4 py-3 text-center font-bold ${
            R.totalProduitsBalance - R.totalChargesBalance >= 0
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}>
            Résultat net (Produits − Charges) = {formatEur(R.totalProduitsBalance - R.totalChargesBalance)}
            {R.totalProduitsBalance - R.totalChargesBalance >= 0 ? ' — Excédent' : ' — Déficit'}
          </div>
        </CardContent>
      </Card>
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
    return <EmptyState msg="Aucun budget annexe configuré. Rendez-vous dans Accueil pour activer un budget annexe GRETA (Art. L423-1 Code de l'Éducation) ou CFA (Art. L6232-1 Code du travail)." />;
  }

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs">
          <strong>Budgets annexes EPLE — Cadre réglementaire :</strong>{' '}
          Le budget annexe est voté et exécuté séparément du budget principal. La M9-6 2026 (Titre III § III.4) impose
          l'équilibre du budget annexe et prévoit les <strong>comptes de liaison 185</strong> pour les flux inter-budgets.
          La consolidation élimine automatiquement les flux internes conformément au § III.4.2.
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
                  {isGreta ? 'Art. L423-1 Code de l\'Éducation — M9-6 Titre III' : 'Art. L6232-1 Code du travail — Loi Avenir Pro 2018'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {!R ? (
                <p className="text-center text-muted-foreground text-sm italic py-4">
                  Importez les fichiers CSV du budget annexe (SDE, SDR, Balance) et lancez l'analyse.
                </p>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KPICard label="Mandatements" value={formatEur(R.totalChargesReel)} color="amber" icon="💸" sub="Budget annexe" isText />
                  <KPICard label="Recettes comptabilisées" value={formatEur(R.totalProduitsReel)} color="green" icon="💰" sub="Budget annexe" isText />
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
