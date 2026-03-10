// ═══════════════════════════════════════════════════════════════
// COFIEPLE — 5 Algorithmes de contrôle automatique M9-6
// 1. Équilibre dynamique Bilan/Résultat
// 2. FRNG/BFR/Trésorerie (calcul + graphique)
// 3. Audit intelligent Classe 4
// 4. Validation des stocks et écritures de variation
// 5. Calcul automatisé et détaillé de la CAF
// Conformité : M9-6 2026 §§ II–IV, Décret 2012-1246 (RGCP)
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie,
} from 'recharts';
import {
  Scale, AlertTriangle, CheckCircle2, XCircle,
  Package, TrendingUp, FileText, ArrowRight,
} from 'lucide-react';
import type { LigneBalance } from '@/lib/cofieple_types';

// ── Helpers ──────────────────────────────────────────────────────
type Voyant = 'vert' | 'orange' | 'rouge';

function VoyantBadge({ v, label }: { v: Voyant; label: string }) {
  const cls: Record<Voyant, string> = {
    vert: 'bg-emerald-600 text-white',
    orange: 'bg-warning text-warning-foreground',
    rouge: 'bg-destructive text-destructive-foreground',
  };
  const icons: Record<Voyant, React.ReactNode> = {
    vert: <CheckCircle2 className="h-3.5 w-3.5" />,
    orange: <AlertTriangle className="h-3.5 w-3.5" />,
    rouge: <XCircle className="h-3.5 w-3.5" />,
  };
  return (
    <Badge className={`${cls[v]} gap-1 text-xs font-bold px-2.5 py-1`}>
      {icons[v]} {label}
    </Badge>
  );
}

function EcritureCorrectrice({ ecritures }: { ecritures: { compte: string; libelle: string; debit: string; credit: string }[] }) {
  if (!ecritures.length) return null;
  return (
    <div className="mt-3 bg-muted/60 rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary">
        <FileText className="h-3.5 w-3.5" />
        Écriture corrective à passer dans Op@le :
      </div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-1 px-2">Compte</th>
            <th className="text-left py-1 px-2">Libellé</th>
            <th className="text-right py-1 px-2">Débit</th>
            <th className="text-right py-1 px-2">Crédit</th>
          </tr>
        </thead>
        <tbody>
          {ecritures.map((e, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-1.5 px-2 font-bold text-primary">{e.compte}</td>
              <td className="py-1.5 px-2 text-foreground">{e.libelle}</td>
              <td className="py-1.5 px-2 text-right">{e.debit || ''}</td>
              <td className="py-1.5 px-2 text-right">{e.credit || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sumBal(bal: LigneBalance[], test: (c: string) => boolean, field: keyof LigneBalance): number {
  return bal.filter(b => test(b.compte)).reduce((s, b) => s + ((b[field] as number) || 0), 0);
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function AuditControlesSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const R = resultats[activeBudget];
  const bal = balance[activeBudget] || [];

  if (!R) return <EmptyState msg="Importez les fichiers CSV et lancez l'analyse pour afficher les 5 contrôles automatiques M9-6." />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs">
          <strong>Module de contrôle automatique — Conforme M9-6 2026 & RGCP (Décret 2012-1246)</strong><br />
          5 algorithmes de vérification avec voyants (🟢 Vert / 🟠 Orange / 🔴 Rouge).
          En cas de voyant rouge, une écriture comptable corrective est proposée pour saisie dans Op@le.
        </CardContent>
      </Card>

      <Controle1_EquilibreBilanResultat R={R} bal={bal} />
      <Controle2_FRNGBFRTresorerie R={R} bal={bal} />
      <Controle3_AuditClasse4 bal={bal} />
      <Controle4_Stocks bal={bal} />
      <Controle5_CAFDetaillee R={R} bal={bal} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRÔLE 1 — Équilibre dynamique Bilan / Résultat
// M9-6 § III.2-3 : Le résultat du CdR doit concorder avec la
// variation des capitaux propres au bilan (120/129 + réserves)
// ═══════════════════════════════════════════════════════════════
function Controle1_EquilibreBilanResultat({ R, bal }: { R: any; bal: LigneBalance[] }) {
  // Résultat du Compte de Résultat (produits − charges balance)
  const resultatCdR = R.totalProduitsBalance - R.totalChargesBalance;

  // Variation capitaux propres : comparer BF − BE sur classes 10/11/12/13
  const cpBF = sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solCrd')
             - sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'solDbt');
  const cpBE = sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'antCrd')
             - sumBal(bal, c => ['10','11','12'].some(p => c.startsWith(p)), 'antDbt');
  const varCP = cpBF - cpBE;

  // Résultat comptable (120 − 129)
  const resultatComptable = R.resultatComptable;

  // Concordances
  const ecartCdRvsComptable = Math.abs(resultatCdR - resultatComptable);
  const ecartBudgVsComptable = Math.abs(R.resultatBudgetaire - resultatComptable);
  const ecartBilanActifPassif = Math.abs(
    (sumBal(bal, c => ['2','3','4','5'].includes(c.charAt(0)), 'solDbt') -
     sumBal(bal, c => ['2','3','4','5'].includes(c.charAt(0)), 'solCrd')) -
    (sumBal(bal, c => c.charAt(0) === '1', 'solCrd') -
     sumBal(bal, c => c.charAt(0) === '1', 'solDbt'))
  );

  const voyantCdR: Voyant = ecartCdRvsComptable < 0.05 ? 'vert' : ecartCdRvsComptable < 100 ? 'orange' : 'rouge';
  const voyantBudg: Voyant = ecartBudgVsComptable < 0.05 ? 'vert' : ecartBudgVsComptable < 100 ? 'orange' : 'rouge';
  const voyantBilan: Voyant = ecartBilanActifPassif < 1 ? 'vert' : ecartBilanActifPassif < 100 ? 'orange' : 'rouge';

  const voyantGlobal: Voyant = [voyantCdR, voyantBudg, voyantBilan].includes('rouge') ? 'rouge' :
                                [voyantCdR, voyantBudg, voyantBilan].includes('orange') ? 'orange' : 'vert';

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Contrôle 1 — Équilibre dynamique Bilan / Résultat
          <span className="ml-auto"><VoyantBadge v={voyantGlobal} label={voyantGlobal === 'vert' ? 'Conforme' : voyantGlobal === 'orange' ? 'Attention' : 'Non conforme'} /></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground italic">
          M9-6 § III.2-3 — Le résultat net du Compte de Résultat doit être identique au résultat comptable
          (compte 120 − 129) et cohérent avec le résultat budgétaire (produits SDR − charges SDE).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CdR vs Comptable */}
          <div className={`rounded-lg border p-4 ${voyantCdR === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantCdR === 'orange' ? 'border-warning/50 bg-warning/5' : 'border-destructive/50 bg-destructive/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">CdR ↔ Comptable</span>
              <VoyantBadge v={voyantCdR} label={voyantCdR === 'vert' ? '✓' : `Écart ${formatEur(ecartCdRvsComptable)}`} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Résultat CdR (Cl.7 − Cl.6)</span><span className="font-mono">{formatEur(resultatCdR)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Résultat comptable (120 − 129)</span><span className="font-mono">{formatEur(resultatComptable)}</span></div>
            </div>
          </div>

          {/* Budgétaire vs Comptable */}
          <div className={`rounded-lg border p-4 ${voyantBudg === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantBudg === 'orange' ? 'border-warning/50 bg-warning/5' : 'border-destructive/50 bg-destructive/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Budgétaire ↔ Comptable</span>
              <VoyantBadge v={voyantBudg} label={voyantBudg === 'vert' ? '✓' : `Écart ${formatEur(ecartBudgVsComptable)}`} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Résultat budgétaire</span><span className="font-mono">{formatEur(R.resultatBudgetaire)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Résultat comptable</span><span className="font-mono">{formatEur(resultatComptable)}</span></div>
            </div>
          </div>

          {/* Équilibre Bilan */}
          <div className={`rounded-lg border p-4 ${voyantBilan === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantBilan === 'orange' ? 'border-warning/50 bg-warning/5' : 'border-destructive/50 bg-destructive/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Équilibre Bilan</span>
              <VoyantBadge v={voyantBilan} label={voyantBilan === 'vert' ? '✓' : `Écart ${formatEur(ecartBilanActifPassif)}`} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Variation capitaux propres</span><span className="font-mono">{formatEur(varCP)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Capitaux propres BF</span><span className="font-mono">{formatEur(cpBF)}</span></div>
            </div>
          </div>
        </div>

        {voyantGlobal === 'rouge' && (
          <EcritureCorrectrice ecritures={
            ecartCdRvsComptable >= 100 ? [
              { compte: '120000', libelle: 'Régul. excédent — concordance CdR/Comptable', debit: '', credit: formatEur(Math.abs(resultatCdR)) },
              { compte: '890000', libelle: 'Bilan d\'ouverture — Régularisation résultat', debit: formatEur(Math.abs(resultatCdR)), credit: '' },
            ] : ecartBudgVsComptable >= 100 ? [
              { compte: '672000', libelle: 'Charges sur exercices antérieurs — régularisation', debit: formatEur(ecartBudgVsComptable), credit: '' },
              { compte: '401000', libelle: 'Fournisseurs — charges à régulariser', debit: '', credit: formatEur(ecartBudgVsComptable) },
            ] : [
              { compte: '471000', libelle: 'Compte d\'attente — recherche écart bilan', debit: formatEur(ecartBilanActifPassif), credit: '' },
              { compte: '476000', libelle: 'Différences de conversion — Actif', debit: '', credit: formatEur(ecartBilanActifPassif) },
            ]
          } />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRÔLE 2 — FRNG / BFR / Trésorerie (calcul + graphique)
// M9-6 § IV.1-2 : FDR = BFR + Trésorerie
// ═══════════════════════════════════════════════════════════════
function Controle2_FRNGBFRTresorerie({ R, bal }: { R: any; bal: LigneBalance[] }) {
  const fdr = R.fdrComptable;
  const bfr = R.bfr;
  const treso = R.tresorerieNette;
  const ecartEquation = Math.abs(fdr - bfr - treso);

  // Voyants individuels
  const voyantFDR: Voyant = fdr > 0 ? 'vert' : fdr === 0 ? 'orange' : 'rouge';
  const voyantBFR: Voyant = bfr <= 0 ? 'vert' : bfr < fdr ? 'orange' : 'rouge';
  const voyantTreso: Voyant = treso > 0 && R.joursAutonomie >= 30 ? 'vert' :
                              treso > 0 ? 'orange' : 'rouge';
  const voyantEquation: Voyant = ecartEquation < 0.05 ? 'vert' : ecartEquation < 100 ? 'orange' : 'rouge';

  const voyantGlobal: Voyant = [voyantFDR, voyantBFR, voyantTreso, voyantEquation].includes('rouge') ? 'rouge' :
                                [voyantFDR, voyantBFR, voyantTreso, voyantEquation].includes('orange') ? 'orange' : 'vert';

  // Données pour le graphique en barres
  const chartData = [
    { name: 'FDR', value: fdr, fill: fdr >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
    { name: 'BFR', value: bfr, fill: bfr <= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(38, 92%, 50%)' },
    { name: 'Tréso', value: treso, fill: treso >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
  ];

  // Waterfall : FDR → BFR → Trésorerie
  const waterfallData = [
    { name: 'Ress. permanentes', value: R.fdrHaut > 0 ? R.fdrHaut : 0, base: 0 },
    { name: '− Emplois stables', value: -(R.fdrHaut > 0 ? R.fdrHaut - fdr : -fdr), base: R.fdrHaut > 0 ? R.fdrHaut : 0 },
    { name: '= FDR', value: fdr, base: 0 },
    { name: '− BFR', value: -bfr, base: fdr },
    { name: '= Trésorerie', value: treso, base: 0 },
  ];

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Contrôle 2 — FRNG / BFR / Trésorerie
          <span className="ml-auto"><VoyantBadge v={voyantGlobal} label={voyantGlobal === 'vert' ? 'Sain' : voyantGlobal === 'orange' ? 'Vigilance' : 'Alerte'} /></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground italic">
          M9-6 § IV.1-2 — Structuration financière de l'EPLE. L'équation d'équilibre FDR = BFR + Trésorerie
          doit être vérifiée. Le seuil d'alerte est fixé à 30 jours d'autonomie financière.
        </p>

        <div className="grid grid-cols-4 gap-3">
          <div className={`rounded-lg border p-3 text-center ${voyantFDR === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantFDR === 'rouge' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
            <div className="text-xs font-bold mb-1">FDR</div>
            <div className="font-mono text-lg font-black">{formatEur(fdr)}</div>
            <VoyantBadge v={voyantFDR} label={voyantFDR === 'vert' ? 'Positif' : voyantFDR === 'orange' ? 'Nul' : 'Négatif !'} />
          </div>
          <div className={`rounded-lg border p-3 text-center ${voyantBFR === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantBFR === 'rouge' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
            <div className="text-xs font-bold mb-1">BFR</div>
            <div className="font-mono text-lg font-black">{formatEur(bfr)}</div>
            <VoyantBadge v={voyantBFR} label={voyantBFR === 'vert' ? 'Couvert' : voyantBFR === 'rouge' ? '> FDR !' : 'À surveiller'} />
          </div>
          <div className={`rounded-lg border p-3 text-center ${voyantTreso === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantTreso === 'rouge' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
            <div className="text-xs font-bold mb-1">Trésorerie</div>
            <div className="font-mono text-lg font-black">{formatEur(treso)}</div>
            <VoyantBadge v={voyantTreso} label={voyantTreso === 'vert' ? `${Math.round(R.joursAutonomie)} j.` : voyantTreso === 'rouge' ? 'Négative !' : `${Math.round(R.joursAutonomie)} j. < 30`} />
          </div>
          <div className={`rounded-lg border p-3 text-center ${voyantEquation === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : 'border-destructive/50 bg-destructive/5'}`}>
            <div className="text-xs font-bold mb-1">FDR = BFR + T</div>
            <div className="font-mono text-lg font-black">{ecartEquation < 0.05 ? '✓' : formatEur(ecartEquation)}</div>
            <VoyantBadge v={voyantEquation} label={voyantEquation === 'vert' ? 'Vérifié' : 'Écart !'} />
          </div>
        </div>

        {/* Graphique barres FDR/BFR/Tréso */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Structure financière</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), 'Montant']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Décomposition FDR → Trésorerie</h4>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {[
                { label: 'Ressources permanentes (Cl. 1)', value: sumBal(bal, c => c.charAt(0) === '1', 'solCrd'), color: 'text-primary' },
                { label: '− Emplois stables (Cl. 2 net)', value: -(R.totalImmo - R.totalAmortissements), color: 'text-destructive' },
                { label: '= Fonds de Roulement (FDR)', value: fdr, color: fdr >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive', bold: true },
                { label: '− Stocks et créances (Cl. 3+4 Dbt)', value: -(sumBal(bal, c => c.charAt(0) === '3' || c.charAt(0) === '4', 'solDbt')), color: 'text-destructive' },
                { label: '+ Dettes d\'exploitation (Cl. 4 Crd)', value: sumBal(bal, c => c.charAt(0) === '4', 'solCrd'), color: 'text-primary' },
                { label: '= BFR', value: bfr, color: bfr <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-warning', bold: true },
                { label: '= Trésorerie (FDR − BFR)', value: treso, color: treso >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive', bold: true },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between text-xs ${row.bold ? 'font-bold border-t border-border pt-2' : ''}`}>
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-mono ${row.color}`}>{formatEur(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {voyantGlobal === 'rouge' && (
          <EcritureCorrectrice ecritures={
            treso < 0 ? [
              { compte: '515000', libelle: 'Compte au Trésor (DFT) — Régularisation trésorerie', debit: formatEur(Math.abs(treso)), credit: '' },
              { compte: '167000', libelle: 'Emprunt / Avance Trésor — Couverture trésorerie', debit: '', credit: formatEur(Math.abs(treso)) },
            ] : fdr < 0 ? [
              { compte: '102000', libelle: 'Dotation — Renforcement fonds propres', debit: '', credit: formatEur(Math.abs(fdr)) },
              { compte: '131000', libelle: 'Subv. d\'équipement État — Financement investissement', debit: '', credit: '' },
            ] : [
              { compte: '471000', libelle: 'Compte d\'attente — Recherche écart structurel', debit: formatEur(ecartEquation), credit: '' },
              { compte: '476000', libelle: 'Différences de conversion — Régularisation', debit: '', credit: formatEur(ecartEquation) },
            ]
          } />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRÔLE 3 — Audit intelligent Classe 4
// M9-6 § II : Concordance ordonnateur / agent comptable
// Détection des soldes anormaux et créances anciennes
// ═══════════════════════════════════════════════════════════════
function Controle3_AuditClasse4({ bal }: { bal: LigneBalance[] }) {
  const cl4 = bal.filter(b => b.classe === '4' && b.compte.length >= 3);
  if (cl4.length === 0) return null;

  // Comptes 4 normalement créditeurs (fournisseurs, organismes sociaux, État)
  const CREDITEURS = new Set(['401','402','403','404','408','421','422','423','424','425','426','427','428','431','432','437','438','443','444','447','448','451','452','455','456','457','458','463','464','465','467','468']);
  // Comptes 4 normalement débiteurs (clients/familles, avances, TVA déductible)
  const DEBITEURS = new Set(['409','411','413','416','417','418','419','441','445','446','449','453','454','456','461','462','466','471','472','476']);

  const anomalies: { compte: string; intitule: string; solDbt: number; solCrd: number; sensAttendu: string; anomalie: string; gravite: Voyant }[] = [];

  for (const b of cl4) {
    const ss = b.compte.substring(0, 3);
    const isCrd = CREDITEURS.has(ss);
    const isDbt = DEBITEURS.has(ss);
    const hasDbt = b.solDbt > 0;
    const hasCrd = b.solCrd > 0;

    // Fournisseurs débiteurs = avoirs non régularisés ou double paiement
    if (isCrd && hasDbt && b.solDbt > 50) {
      anomalies.push({
        compte: b.compte, intitule: b.intituleReduit, solDbt: b.solDbt, solCrd: b.solCrd,
        sensAttendu: 'Créditeur',
        anomalie: ss.startsWith('40') ? 'Fournisseur débiteur — Avoir non régularisé ou double paiement' :
                  ss.startsWith('42') ? 'Personnel débiteur — Trop-perçu non récupéré' :
                  ss.startsWith('43') ? 'Organisme social débiteur — Trop-versé ou remboursement attendu' :
                  'Compte de tiers débiteur anormal',
        gravite: b.solDbt > 1000 ? 'rouge' : 'orange',
      });
    }

    // Familles/clients créditeurs = sur-paiement ou recette comptabilisée à tort
    if (isDbt && hasCrd && b.solCrd > 50 && ['411','413','416','417','418'].includes(ss)) {
      anomalies.push({
        compte: b.compte, intitule: b.intituleReduit, solDbt: b.solDbt, solCrd: b.solCrd,
        sensAttendu: 'Débiteur',
        anomalie: 'Famille/redevable créditeur — Sur-paiement, avoir à émettre ou remboursement dû',
        gravite: b.solCrd > 1000 ? 'rouge' : 'orange',
      });
    }

    // Compte 416 — Créances douteuses (M9-6 provisionnement obligatoire)
    if (b.compte.startsWith('416') && b.solDbt > 0) {
      anomalies.push({
        compte: b.compte, intitule: b.intituleReduit, solDbt: b.solDbt, solCrd: b.solCrd,
        sensAttendu: 'Débiteur (provisionné)',
        anomalie: `Créances douteuses : ${formatEur(b.solDbt)} — Vérifier le provisionnement (compte 491)`,
        gravite: b.solDbt > 5000 ? 'rouge' : 'orange',
      });
    }

    // Comptes d'attente (471/472) non soldés
    if (['471','472'].includes(ss) && (b.solDbt > 50 || b.solCrd > 50)) {
      anomalies.push({
        compte: b.compte, intitule: b.intituleReduit, solDbt: b.solDbt, solCrd: b.solCrd,
        sensAttendu: 'Soldé',
        anomalie: 'Compte d\'attente non soldé en fin d\'exercice — BLOQUANT au compte financier',
        gravite: 'rouge',
      });
    }
  }

  // Vérification provisionnement créances douteuses
  const totalCreancesDouteuses = sumBal(bal, c => c.startsWith('416'), 'solDbt');
  const totalProvisions491 = sumBal(bal, c => c.startsWith('491'), 'solCrd');
  const tauxProv = totalCreancesDouteuses > 0 ? totalProvisions491 / totalCreancesDouteuses : 1;

  const voyantProv: Voyant = totalCreancesDouteuses === 0 ? 'vert' :
                             tauxProv >= 0.8 ? 'vert' : tauxProv >= 0.5 ? 'orange' : 'rouge';

  const nbRouge = anomalies.filter(a => a.gravite === 'rouge').length;
  const nbOrange = anomalies.filter(a => a.gravite === 'orange').length;
  const voyantGlobal: Voyant = nbRouge > 0 || voyantProv === 'rouge' ? 'rouge' :
                                nbOrange > 0 || voyantProv === 'orange' ? 'orange' : 'vert';

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Contrôle 3 — Audit intelligent Classe 4 (Tiers)
          <span className="ml-auto"><VoyantBadge v={voyantGlobal} label={`${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''}`} /></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground italic">
          M9-6 § II — Rapprochement ordonnateur / agent comptable. Détection des soldes anormaux en classe 4
          (fournisseurs débiteurs, familles créditrices, comptes d'attente non soldés, créances douteuses non provisionnées).
        </p>

        {/* KPI provisionnement */}
        {totalCreancesDouteuses > 0 && (
          <div className={`rounded-lg border p-3 flex items-center gap-4 ${voyantProv === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantProv === 'rouge' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
            <VoyantBadge v={voyantProv} label={`Prov. ${(tauxProv * 100).toFixed(0)}%`} />
            <div className="text-xs">
              <span className="font-bold">Créances douteuses (416) : </span>
              <span className="font-mono">{formatEur(totalCreancesDouteuses)}</span>
              <span className="text-muted-foreground"> — Provisions (491) : </span>
              <span className="font-mono">{formatEur(totalProvisions491)}</span>
              <span className="text-muted-foreground ml-1">(M9-6 : provisionnement obligatoire Art. R421-77)</span>
            </div>
          </div>
        )}

        {anomalies.length === 0 ? (
          <div className="text-center py-4 text-emerald-600 font-bold text-sm">✅ Aucune anomalie détectée en classe 4</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="px-3 py-2 text-left">Compte</th>
                  <th className="px-3 py-2 text-left">Intitulé</th>
                  <th className="px-3 py-2 text-right">Solde Dbt</th>
                  <th className="px-3 py-2 text-right">Solde Crd</th>
                  <th className="px-3 py-2 text-center">Attendu</th>
                  <th className="px-3 py-2 text-center">Voyant</th>
                  <th className="px-3 py-2 text-left">Anomalie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {anomalies.map((a, i) => (
                  <tr key={i} className={a.gravite === 'rouge' ? 'bg-destructive/5' : 'bg-warning/5'}>
                    <td className="px-3 py-2 font-mono font-bold text-primary">{a.compte}</td>
                    <td className="px-3 py-2 max-w-[150px] truncate">{a.intitule}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.solDbt > 0 ? formatEur(a.solDbt) : ''}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.solCrd > 0 ? formatEur(a.solCrd) : ''}</td>
                    <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{a.sensAttendu}</Badge></td>
                    <td className="px-3 py-2 text-center"><VoyantBadge v={a.gravite} label={a.gravite === 'rouge' ? 'BLOQ' : 'ATT'} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{a.anomalie}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nbRouge > 0 && (
          <EcritureCorrectrice ecritures={
            anomalies.filter(a => a.gravite === 'rouge').slice(0, 2).flatMap(a => {
              if (a.compte.startsWith('471') || a.compte.startsWith('472')) {
                return [
                  { compte: '672000', libelle: `Charges exerc. ant. — Régul. cpte attente ${a.compte}`, debit: formatEur(a.solDbt), credit: '' },
                  { compte: a.compte, libelle: `Solde du compte d'attente ${a.compte}`, debit: '', credit: formatEur(a.solDbt) },
                ];
              }
              if (a.compte.startsWith('416')) {
                const montantProv = a.solDbt - totalProvisions491;
                return [
                  { compte: '681400', libelle: 'Dotation aux provisions pour dépréciation créances', debit: formatEur(montantProv > 0 ? montantProv : a.solDbt), credit: '' },
                  { compte: '491000', libelle: 'Provisions pour dépréciation des comptes de redevables', debit: '', credit: formatEur(montantProv > 0 ? montantProv : a.solDbt) },
                ];
              }
              if (a.compte.startsWith('40') && a.solDbt > 0) {
                return [
                  { compte: a.compte, libelle: `Régul. fournisseur débiteur — solde anormal`, debit: '', credit: formatEur(a.solDbt) },
                  { compte: '467000', libelle: 'Autres comptes débiteurs — reclassement avoir', debit: formatEur(a.solDbt), credit: '' },
                ];
              }
              return [
                { compte: a.compte, libelle: `Régularisation solde anormal`, debit: a.solCrd > 0 ? formatEur(a.solCrd) : '', credit: a.solDbt > 0 ? formatEur(a.solDbt) : '' },
                { compte: '758000', libelle: 'Produits divers de gestion — régularisation', debit: '', credit: a.solCrd > 0 ? formatEur(a.solCrd) : '' },
              ];
            })
          } />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRÔLE 4 — Validation des stocks et écritures de variation
// M9-6 § III.3 : Inventaire physique et variation de stocks
// ═══════════════════════════════════════════════════════════════
function Controle4_Stocks({ bal }: { bal: LigneBalance[] }) {
  const cl3 = bal.filter(b => b.classe === '3' && b.compte.length >= 3);

  // Stocks bruts (31-37)
  const stocksBruts = cl3.filter(b => !b.compte.startsWith('39')).reduce((s, b) => s + b.solDbt, 0);
  const stocksBE = cl3.filter(b => !b.compte.startsWith('39')).reduce((s, b) => s + (b.antDbt || 0), 0);
  const variationStocks = stocksBruts - stocksBE;

  // Provisions pour dépréciation stocks (39X)
  const prov39 = sumBal(bal, c => c.startsWith('39'), 'solCrd');
  const prov39BE = sumBal(bal, c => c.startsWith('39'), 'antCrd');
  const varProv39 = prov39 - prov39BE;

  // Vérification écriture de variation en classe 6 (603)
  const ecriture603Dbt = sumBal(bal, c => c.startsWith('603'), 'dbt');
  const ecriture603Crd = sumBal(bal, c => c.startsWith('603'), 'crd');
  const variation603 = ecriture603Dbt - ecriture603Crd;

  // Vérification concordance : variation stocks (classe 3) doit ≈ écriture 603
  const ecartVariation = Math.abs(variationStocks - variation603);

  // Stocks créditeurs = anomalie
  const stocksCrediteurs = cl3.filter(b => !b.compte.startsWith('39') && b.solCrd > 0);

  // Voyants
  const voyantVariation: Voyant = stocksBruts === 0 && stocksBE === 0 ? 'vert' :
                                  ecartVariation < 1 ? 'vert' : ecartVariation < 100 ? 'orange' : 'rouge';
  const voyantSolde: Voyant = stocksCrediteurs.length === 0 ? 'vert' : 'rouge';
  const voyantProv: Voyant = stocksBruts === 0 ? 'vert' :
                             prov39 >= 0 ? 'vert' : 'rouge';
  const voyantGlobal: Voyant = [voyantVariation, voyantSolde, voyantProv].includes('rouge') ? 'rouge' :
                                [voyantVariation, voyantSolde, voyantProv].includes('orange') ? 'orange' : 'vert';

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Contrôle 4 — Stocks et écritures de variation
          <span className="ml-auto"><VoyantBadge v={voyantGlobal} label={voyantGlobal === 'vert' ? 'Conforme' : voyantGlobal === 'orange' ? 'Vérifier' : 'Anomalie'} /></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground italic">
          M9-6 § III.3 — Inventaire physique et variation de stocks. Les comptes 31-37 enregistrent les stocks de
          l'EPLE (denrées, matières). La variation de stocks (603) doit correspondre à l'écart entre stock initial et final.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-bold text-muted-foreground mb-1">Stocks fin N (Cl. 31-37)</div>
            <div className="font-mono text-lg font-black">{formatEur(stocksBruts)}</div>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-bold text-muted-foreground mb-1">Stocks début N (BE)</div>
            <div className="font-mono text-lg font-black">{formatEur(stocksBE)}</div>
          </div>
          <div className={`rounded-lg border p-3 ${voyantVariation === 'vert' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : voyantVariation === 'rouge' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
            <div className="text-xs font-bold text-muted-foreground mb-1">Variation (BF − BE)</div>
            <div className="font-mono text-lg font-black">{formatEur(variationStocks)}</div>
            <VoyantBadge v={voyantVariation} label={voyantVariation === 'vert' ? 'Concordant' : `Écart 603 : ${formatEur(ecartVariation)}`} />
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-bold text-muted-foreground mb-1">Écriture 603 (net)</div>
            <div className="font-mono text-lg font-black">{formatEur(variation603)}</div>
            <div className="text-xs text-muted-foreground mt-1">Dbt {formatEur(ecriture603Dbt)} / Crd {formatEur(ecriture603Crd)}</div>
          </div>
        </div>

        {/* Provisions sur stocks */}
        {(prov39 > 0 || prov39BE > 0) && (
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-3 text-xs">
              <VoyantBadge v={voyantProv} label="Prov. 39X" />
              <span>Provisions pour dépréciation (39) : <span className="font-mono font-bold">{formatEur(prov39)}</span></span>
              <span className="text-muted-foreground">Variation : {formatEur(varProv39)}</span>
            </div>
          </div>
        )}

        {/* Stocks créditeurs */}
        {stocksCrediteurs.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-destructive mb-2">
              <XCircle className="h-3.5 w-3.5" />
              Stocks à solde créditeur (anomalie M9-6)
            </div>
            {stocksCrediteurs.map(b => (
              <div key={b.compte} className="text-xs flex items-center gap-3">
                <span className="font-mono font-bold">{b.compte}</span>
                <span>{b.intituleReduit}</span>
                <span className="font-mono text-destructive">{formatEur(-b.solCrd)} (créditeur)</span>
              </div>
            ))}
          </div>
        )}

        {voyantGlobal === 'rouge' && (
          <EcritureCorrectrice ecritures={
            stocksCrediteurs.length > 0 ? stocksCrediteurs.slice(0, 2).flatMap(b => [
              { compte: b.compte, libelle: `Régul. stock créditeur — remise à zéro`, debit: formatEur(b.solCrd), credit: '' },
              { compte: '603000', libelle: 'Variation des stocks — Régularisation inventaire', debit: '', credit: formatEur(b.solCrd) },
            ]) : ecartVariation >= 100 ? [
              { compte: '603000', libelle: 'Variation des stocks de matières et denrées', debit: variationStocks > variation603 ? formatEur(variationStocks - variation603) : '', credit: variationStocks < variation603 ? formatEur(variation603 - variationStocks) : '' },
              { compte: stocksBruts > stocksBE ? '310000' : '310000', libelle: `Stock — Ajustement inventaire physique`, debit: variationStocks < variation603 ? formatEur(variation603 - variationStocks) : '', credit: variationStocks > variation603 ? formatEur(variationStocks - variation603) : '' },
            ] : []
          } />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRÔLE 5 — Calcul automatisé et détaillé de la CAF
// M9-6 § IV.3 — Capacité / Insuffisance d'Autofinancement
// Méthode additive (à partir du résultat net comptable)
// ═══════════════════════════════════════════════════════════════
function Controle5_CAFDetaillee({ R, bal }: { R: any; bal: LigneBalance[] }) {
  // CAF méthode additive (M9-6 § IV.3)
  // CAF = Résultat net + Dotations (68) − Reprises (78)
  //       + VNC cessions (675) − Produits de cession (775)
  //       − Quote-part subv. virée au résultat (777)
  const resultatNet = R.totalProduitsBalance - R.totalChargesBalance;

  const dot681 = sumBal(bal, c => c.startsWith('681'), 'dbt') - sumBal(bal, c => c.startsWith('681'), 'crd');
  const dot686 = sumBal(bal, c => c.startsWith('686'), 'dbt') - sumBal(bal, c => c.startsWith('686'), 'crd');
  const dot687 = sumBal(bal, c => c.startsWith('687'), 'dbt') - sumBal(bal, c => c.startsWith('687'), 'crd');
  const totalDot = dot681 + dot686 + dot687;

  const repr781 = sumBal(bal, c => c.startsWith('781'), 'crd') - sumBal(bal, c => c.startsWith('781'), 'dbt');
  const repr786 = sumBal(bal, c => c.startsWith('786'), 'crd') - sumBal(bal, c => c.startsWith('786'), 'dbt');
  const repr787 = sumBal(bal, c => c.startsWith('787'), 'crd') - sumBal(bal, c => c.startsWith('787'), 'dbt');
  const totalRepr = repr781 + repr786 + repr787;

  const vnc675 = sumBal(bal, c => c.startsWith('675'), 'dbt') - sumBal(bal, c => c.startsWith('675'), 'crd');
  const prodCession775 = sumBal(bal, c => c.startsWith('775'), 'crd') - sumBal(bal, c => c.startsWith('775'), 'dbt');
  const qpSubv777 = sumBal(bal, c => c.startsWith('777'), 'crd') - sumBal(bal, c => c.startsWith('777'), 'dbt');

  const cafAdditive = resultatNet + totalDot - totalRepr + vnc675 - prodCession775 - qpSubv777;

  // Concordance CAF additive vs CAF budgétaire
  const ecartCAF = Math.abs(cafAdditive - R.cafBudgetaire);
  const ecartCAFvsComptable = Math.abs(cafAdditive - R.cafComptable);

  const voyantCAF: Voyant = cafAdditive > 0 ? 'vert' : cafAdditive === 0 ? 'orange' : 'rouge';
  const voyantConcordance: Voyant = ecartCAFvsComptable < 1 ? 'vert' : ecartCAFvsComptable < 500 ? 'orange' : 'rouge';
  const voyantGlobal: Voyant = voyantCAF === 'rouge' || voyantConcordance === 'rouge' ? 'rouge' :
                                voyantCAF === 'orange' || voyantConcordance === 'orange' ? 'orange' : 'vert';

  // Données pour graphique waterfall CAF
  const cafSteps = [
    { name: 'Résultat net', value: resultatNet, color: resultatNet >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)' },
    { name: 'Dot. amort. (681)', value: dot681, color: 'hsl(215, 70%, 55%)' },
    { name: 'Dot. prov. (686)', value: dot686, color: 'hsl(215, 70%, 55%)' },
    { name: 'Dot. except. (687)', value: dot687, color: 'hsl(215, 70%, 55%)' },
    { name: '− Repr. (781)', value: -repr781, color: 'hsl(0, 72%, 55%)' },
    { name: '− Repr. (786)', value: -repr786, color: 'hsl(0, 72%, 55%)' },
    { name: '− Repr. (787)', value: -repr787, color: 'hsl(0, 72%, 55%)' },
    { name: 'VNC (675)', value: vnc675, color: 'hsl(215, 70%, 55%)' },
    { name: '− Cess. (775)', value: -prodCession775, color: 'hsl(0, 72%, 55%)' },
    { name: '− QP subv. (777)', value: -qpSubv777, color: 'hsl(0, 72%, 55%)' },
  ].filter(s => Math.abs(s.value) > 0.01);

  // Waterfall chart data
  let cumul = 0;
  const waterfallData = cafSteps.map(s => {
    const base = cumul;
    cumul += s.value;
    return {
      name: s.name,
      base: s.value >= 0 ? base : cumul,
      value: Math.abs(s.value),
      fill: s.color,
    };
  });
  waterfallData.push({
    name: '= CAF',
    base: 0,
    value: Math.abs(cafAdditive),
    fill: cafAdditive >= 0 ? 'hsl(160, 45%, 45%)' : 'hsl(0, 72%, 50%)',
  });

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Contrôle 5 — CAF détaillée (méthode additive)
          <span className="ml-auto"><VoyantBadge v={voyantGlobal} label={cafAdditive >= 0 ? 'CAF' : 'IAF'} /></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground italic">
          M9-6 § IV.3 — Méthode additive de calcul de la CAF/IAF. On part du résultat net comptable,
          on ajoute les charges calculées (dotations) et on retranche les produits calculés (reprises) et les
          plus-values de cession. Un résultat négatif constitue une Insuffisance d'Autofinancement (IAF).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tableau détaillé */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Décomposition</h4>
            {[
              { label: 'Résultat net comptable (Cl. 7 − Cl. 6)', value: resultatNet, bold: true },
              { label: '+ Dotations aux amortissements (681)', value: dot681 },
              { label: '+ Dotations aux provisions (686)', value: dot686 },
              { label: '+ Dotations exceptionnelles (687)', value: dot687 },
              { label: '− Reprises sur amortissements (781)', value: -repr781 },
              { label: '− Reprises sur provisions (786)', value: -repr786 },
              { label: '− Reprises exceptionnelles (787)', value: -repr787 },
              { label: '+ VNC des éléments cédés (675)', value: vnc675 },
              { label: '− Produits de cession (775)', value: -prodCession775 },
              { label: '− QP subventions virée au résultat (777)', value: -qpSubv777 },
              { label: cafAdditive >= 0 ? '= CAPACITÉ D\'AUTOFINANCEMENT' : '= INSUFFISANCE D\'AUTOFINANCEMENT', value: cafAdditive, bold: true, total: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between text-xs px-2 py-1.5 rounded ${
                row.total ? (cafAdditive >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/20 font-black text-sm' : 'bg-destructive/10 font-black text-sm') :
                row.bold ? 'font-bold border-b border-border' : ''
              }`}>
                <span className={row.total ? '' : 'text-muted-foreground'}>{row.label}</span>
                <span className={`font-mono ${row.value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>{formatEur(row.value)}</span>
              </div>
            ))}

            {/* Concordance */}
            <div className="mt-3 space-y-1">
              <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${voyantConcordance === 'vert' ? 'bg-emerald-50 dark:bg-emerald-900/10' : voyantConcordance === 'rouge' ? 'bg-destructive/5' : 'bg-warning/5'}`}>
                <VoyantBadge v={voyantConcordance} label={voyantConcordance === 'vert' ? '✓' : `Écart ${formatEur(ecartCAFvsComptable)}`} />
                <span>Concordance CAF additive / CAF comptable</span>
              </div>
              <div className="flex justify-between text-xs px-2 text-muted-foreground">
                <span>CAF budgétaire (moteur)</span>
                <span className="font-mono">{formatEur(R.cafBudgetaire)}</span>
              </div>
            </div>
          </div>

          {/* Graphique waterfall */}
          <div>
            <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Construction de la CAF</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={waterfallData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), 'Montant']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="base" stackId="w" fill="transparent" />
                <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {voyantGlobal === 'rouge' && (
          <EcritureCorrectrice ecritures={
            cafAdditive < 0 ? [
              { compte: '106840', libelle: 'Réserves disponibles — Prélèvement pour couvrir IAF', debit: formatEur(Math.abs(cafAdditive)), credit: '' },
              { compte: '110000', libelle: 'Report à nouveau créditeur — Couverture résultat', debit: '', credit: formatEur(Math.abs(cafAdditive)) },
            ] : [
              { compte: '120000', libelle: 'Résultat de l\'exercice — Régularisation concordance', debit: formatEur(ecartCAFvsComptable), credit: '' },
              { compte: '681100', libelle: 'Dotation aux amortissements — Ajustement plan', debit: '', credit: formatEur(ecartCAFvsComptable) },
            ]
          } />
        )}
      </CardContent>
    </Card>
  );
}
