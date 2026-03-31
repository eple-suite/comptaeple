// ═══════════════════════════════════════════════════════════════
// MODULE 5 — POINTS BLOQUANTS (15+ vérifications M9-6)
// 3 niveaux : PB (🔴 bloquants), PA (🟠 attention), PV (🟡 vigilance)
// M9-6 2026 — Décret 2012-1246 art. 195-199
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';
import { AlertTriangle, Ban, Eye } from 'lucide-react';

interface PointBloquant {
  code: string; titre: string; niveau: 'PB' | 'PA' | 'PV';
  refM96: string; prescription: string;
  calculer: (R: any, bal: any[], checkItems: any[], extraData?: any) => { detecte: boolean; detail: string };
}

const sumBal = (bal: any[], test: (c: string) => boolean, field: string) =>
  bal.filter((b: any) => !b.isAggregate && b.compte && test(b.compte)).reduce((s: number, b: any) => s + ((b[field] as number) || 0), 0);

const POINTS: PointBloquant[] = [
  // 🔴 BLOQUANTS
  {
    code: 'PB-01', titre: 'Compte 185 non soldé', niveau: 'PB',
    refM96: 'M9-6 §5.3.2', prescription: 'Les virements internes entre services doivent être tous extournés avant clôture.',
    calculer: (_, bal) => {
      const s = sumBal(bal, c => c.startsWith('185'), 'solDbt') - sumBal(bal, c => c.startsWith('185'), 'solCrd');
      return { detecte: Math.abs(s) > 0.01, detail: `Solde C/185 = ${formatEur(s)}` };
    },
  },
  {
    code: 'PB-02', titre: 'Déséquilibre de la balance', niveau: 'PB',
    refM96: 'M9-6 § II — Balance comptable', prescription: 'La somme des soldes débiteurs doit être égale à la somme des soldes créditeurs.',
    calculer: (_, bal) => {
      const filteredBal = bal.filter((b: any) => !b.isAggregate && b.compte);
      const sd = filteredBal.reduce((s: number, b: any) => s + (b.solDbt || 0), 0);
      const sc = filteredBal.reduce((s: number, b: any) => s + (b.solCrd || 0), 0);
      // Tolérance de 1€ — les centimes d'arrondis Op@le sont normaux
      return { detecte: Math.abs(sd - sc) > 1, detail: `SD = ${formatEur(sd)}, SC = ${formatEur(sc)}, Écart = ${formatEur(sd - sc)}` };
    },
  },
  {
    code: 'PB-03', titre: 'Résultat comptable ≠ résultat budgétaire inexplicable', niveau: 'PB',
    refM96: 'M9-6 § III.2 / RGCP art.24', prescription: 'L\'écart doit s\'expliquer exclusivement par les opérations d\'ordre (dotations aux amortissements, reprises, cessions).',
    calculer: (R) => {
      const ecart = R.resultatComptable - R.resultatBudgetaire;
      const soldeOO = R.operationsOrdre?.soldeOO ?? 0;
      const ecartInexplique = Math.abs(ecart - soldeOO);
      // Tolérance élargie : les OO peuvent ne pas être complètement détaillées dans les imports
      // Op@le arrondit aussi différemment entre budgétaire et comptable
      // Seuil : 1% du total des charges ou 500€ minimum
      const seuilDynamique = Math.max(500, Math.abs(R.totalChargesSde || R.totalChargesBalance || 0) * 0.01);
      return {
        detecte: ecartInexplique > seuilDynamique,
        detail: ecartInexplique <= seuilDynamique
          ? `Écart de ${formatEur(Math.abs(ecart))} expliqué par les opérations d'ordre (solde OO = ${formatEur(soldeOO)}). Conforme M9-6.`
          : `Écart inexpliqué = ${formatEur(ecartInexplique)} (seuil = ${formatEur(seuilDynamique)}). Résultat budg. = ${formatEur(R.resultatBudgetaire)}, Résultat compt. = ${formatEur(R.resultatComptable)}, Solde OO = ${formatEur(soldeOO)}`
      };
    },
  },
  {
    code: 'PB-04', titre: 'Concordance SDE/SDR ↔ Balance (rapprochement ordo/AC)', niveau: 'PB',
    refM96: 'M9-6 § II — Rapprochement', prescription: 'Les totaux des mandats/titres doivent correspondre aux classes 6/7 de la balance, aux opérations d\'ordre près.',
    calculer: (R) => {
      const ecartC = Math.abs(R.totalChargesSde - R.totalChargesBalance);
      const ecartP = Math.abs(R.totalProduitsSdr - R.totalProduitsBalance);
      // Les écarts SDE/SDR ↔ Balance sont normaux : les SDE/SDR ne contiennent que les mandats/titres
      // tandis que la balance inclut les écritures directes (OO, centralisation, ajustements).
      // Seuil de tolérance : 100 € (arrondis, centimes, ajustements de clôture)
      const seuilTolerance = 100;
      return {
        detecte: ecartC > seuilTolerance || ecartP > seuilTolerance,
        detail: ecartC <= seuilTolerance && ecartP <= seuilTolerance
          ? `Concordance vérifiée. Écart charges : ${formatEur(ecartC)}, Écart produits : ${formatEur(ecartP)} (dans la tolérance).`
          : `Écart charges : ${formatEur(ecartC)}, Écart produits : ${formatEur(ecartP)}. Vérifier les écritures directes et OO.`
      };
    },
  },
  {
    code: 'PB-05', titre: 'Concordance compte 185 Budget Principal ↔ Budget Annexe', niveau: 'PB',
    refM96: 'M9-6 §5.3.2 — Comptes de liaison',
    prescription: 'Le compte 185 est un compte de liaison : ses soldes doivent être en miroir entre le budget principal (créditeur) et chaque budget annexe (débiteur). Les soldes doivent être strictement égaux en valeur absolue.',
    calculer: (_R: any, _bal: any[], _checkItems: any[], extraData?: any) => {
      if (!extraData) return { detecte: false, detail: 'Pas de données multi-budgets disponibles' };
      const { balanceBP, balanceAnnexes } = extraData;
      if (!balanceBP || balanceBP.length === 0) return { detecte: false, detail: 'Balance BP non chargée' };

      const solde185BP = balanceBP.filter((b: any) => b.compte.startsWith('185')).reduce((s: number, b: any) => s + ((b.solCrd || 0) - (b.solDbt || 0)), 0);
      let totalSolde185BA = 0;
      const detailLines: string[] = [];
      detailLines.push(`C/185 Budget Principal = ${formatEur(solde185BP)} (créditeur)`);

      for (const [label, balBA] of Object.entries(balanceAnnexes as Record<string, any[]>)) {
        if (!balBA || balBA.length === 0) continue;
        const solde185BA = balBA.filter((b: any) => b.compte.startsWith('185')).reduce((s: number, b: any) => s + ((b.solDbt || 0) - (b.solCrd || 0)), 0);
        totalSolde185BA += solde185BA;
        detailLines.push(`C/185 ${label} = ${formatEur(solde185BA)} (débiteur)`);
      }

      if (totalSolde185BA === 0 && solde185BP === 0) return { detecte: false, detail: 'C/185 non utilisé (pas de budget annexe actif)' };

      const ecart = Math.abs(solde185BP - totalSolde185BA);
      detailLines.push(`Écart = ${formatEur(ecart)} ${ecart < 0.02 ? '✅' : '❌'}`);
      return { detecte: ecart >= 0.02, detail: detailLines.join('\n') };
    },
  },
  {
    code: 'PB-06', titre: 'C/185 incohérent avec TN calculée (budget annexe)', niveau: 'PB',
    refM96: 'M9-6 §2.1.2.3.2', prescription: 'Le solde débiteur du C/185 d\'un budget annexe doit correspondre à FDR − BFR. Un écart significatif indique une incohérence dans la balance de l\'annexe.',
    calculer: (R: any, bal: any[]) => {
      const has515 = bal.some((b: any) => b.compte?.startsWith('515'));
      if (has515) return { detecte: false, detail: 'Budget principal détecté (C/515100 présent) — non applicable' };
      const solde185 = bal.filter((b: any) => b.compte?.startsWith('185')).reduce((s: number, b: any) => s + ((b.solDbt || 0) - (b.solCrd || 0)), 0);
      const tnAttendue = (R.fdrComptable || 0) - (R.bfr || 0);
      const ecart = Math.abs(solde185 - tnAttendue);
      return { detecte: ecart > 100, detail: `C/185 débiteur = ${formatEur(solde185)}, FDR − BFR = ${formatEur(tnAttendue)}, Écart = ${formatEur(ecart)}` };
    },
  },
  // 🟠 ATTENTION
  {
    code: 'PA-01', titre: 'FDR négatif', niveau: 'PA',
    refM96: 'M9-6 § IV.1', prescription: 'L\'actif immobilisé n\'est pas intégralement financé par les ressources permanentes.',
    calculer: (R) => ({ detecte: R.fdrComptable < 0, detail: `FDR = ${formatEur(R.fdrComptable)}` }),
  },
  {
    code: 'PA-02', titre: 'Trésorerie nette négative', niveau: 'PA',
    refM96: 'M9-6 § IV.2 / RGCP art.28', prescription: 'Situation à signaler au comptable supérieur.',
    calculer: (R) => ({ detecte: R.tresorerie < 0, detail: `Trésorerie = ${formatEur(R.tresorerie)}` }),
  },
  {
    code: 'PA-03', titre: 'Taux d\'exécution dépenses < 75%', niveau: 'PA',
    refM96: 'M9-6 §4.3.2', prescription: 'Sous-consommation anormale des crédits.',
    calculer: (R) => ({ detecte: R.tauxExecCharges < 0.75, detail: `Taux = ${(R.tauxExecCharges * 100).toFixed(1)}%` }),
  },
  {
    code: 'PA-04', titre: 'RAR > 5% des titres sans provision', niveau: 'PA',
    refM96: 'M9-6 §4.5.6', prescription: 'Les créances significatives doivent être provisionnées (c/491).',
    calculer: (R, bal) => {
      const rar = R.totalCreances ?? 0;
      const prov = sumBal(bal, c => c.startsWith('491'), 'solCrd');
      const pct = R.totalProduitsSdr > 0 ? rar / R.totalProduitsSdr : 0;
      return { detecte: pct > 0.05 && prov < rar * 0.3, detail: `RAR = ${formatEur(rar)} (${(pct * 100).toFixed(1)}%), Provisions = ${formatEur(prov)}` };
    },
  },
  {
    code: 'PA-05', titre: 'DGP > 30 jours', niveau: 'PA',
    refM96: 'Décret 2013-269', prescription: 'Non-conformité au délai réglementaire de paiement.',
    calculer: (R) => {
      const dgp = R.totalChargesSde > 0 ? ((R.dettesFournisseurs ?? 0) / R.totalChargesSde) * 365 : 0;
      return { detecte: dgp > 30, detail: `DGP = ${Math.round(dgp)} jours` };
    },
  },
  {
    code: 'PA-06', titre: 'Dotations aux amortissements manquantes', niveau: 'PA',
    refM96: 'M9-6 § III.3', prescription: 'Des immobilisations amortissables existent sans dotation aux amortissements.',
    calculer: (R, bal) => {
      const immoAmort = sumBal(bal, c => c.startsWith('21') || c.startsWith('22'), 'solDbt');
      const dot68 = sumBal(bal, c => c.startsWith('68'), 'dbt');
      return { detecte: immoAmort > 1000 && dot68 < 1, detail: `Immo amortissables = ${formatEur(immoAmort)}, Dotations 68 = ${formatEur(dot68)}` };
    },
  },
  {
    code: 'PA-07', titre: 'Déficit reporté (C/119)', niveau: 'PA',
    refM96: 'M9-6 § III.2.4', prescription: 'Déficit antérieur non résorbé à surveiller.',
    calculer: (_, bal) => {
      const def119 = sumBal(bal, c => c.startsWith('119'), 'solDbt');
      return { detecte: def119 > 0.01, detail: `C/119 = ${formatEur(def119)}` };
    },
  },
  {
    code: 'PA-08', titre: 'Budget annexe déficitaire (résultat négatif)', niveau: 'PA',
    refM96: 'M9-6 §2.1.2.3.2', prescription: 'Un déficit du budget annexe se reporte sur le budget principal support. Le CA doit en être informé.',
    calculer: (R: any, bal: any[]) => {
      const has515 = bal.some((b: any) => b.compte?.startsWith('515'));
      if (has515) return { detecte: false, detail: 'Budget principal — non applicable' };
      const resultat = R.resultatBudgetaire || 0;
      return { detecte: resultat < -0.01, detail: `Résultat du budget annexe = ${formatEur(resultat)}` };
    },
  },
  {
    code: 'PA-09', titre: 'C/185 en solde CRÉDITEUR côté budget annexe', niveau: 'PA',
    refM96: 'M9-6 §5.3.2', prescription: 'Situation anormale : l\'annexe serait créancier de son budget principal. À justifier impérativement.',
    calculer: (_R: any, bal: any[]) => {
      const has515 = bal.some((b: any) => b.compte?.startsWith('515'));
      if (has515) return { detecte: false, detail: 'Budget principal — non applicable' };
      const solde185 = bal.filter((b: any) => b.compte?.startsWith('185')).reduce((s: number, b: any) => s + ((b.solDbt || 0) - (b.solCrd || 0)), 0);
      return { detecte: solde185 < -0.01, detail: `C/185 = ${formatEur(solde185)} (créditeur = anormal pour un BA)` };
    },
  },
  // 🟡 VIGILANCE
  {
    code: 'PV-01', titre: 'Forte variation FDR vs N-1 (>25%)', niveau: 'PV',
    refM96: 'M9-6 § IV.1', prescription: 'Variation significative à commenter dans le rapport.',
    calculer: (R) => {
      const varPct = R.fdrComptable !== 0 && R.varFdrBas !== 0 ? Math.abs(R.varFdrBas / (R.fdrComptable - R.varFdrBas)) : 0;
      return { detecte: varPct > 0.25, detail: `Variation FDR = ${(varPct * 100).toFixed(1)}%` };
    },
  },
  {
    code: 'PV-02', titre: 'Taux d\'exécution recettes < 90%', niveau: 'PV',
    refM96: 'M9-6 §3.2', prescription: 'Les prévisions de recettes sont significativement surévaluées.',
    calculer: (R) => ({ detecte: R.tauxExecProduits < 0.9, detail: `Taux = ${(R.tauxExecProduits * 100).toFixed(1)}%` }),
  },
  {
    code: 'PV-03', titre: 'CAF négative (IAF)', niveau: 'PV',
    refM96: 'M9-6 §4.5.4', prescription: 'L\'établissement ne génère pas suffisamment de ressources pour financer son renouvellement.',
    calculer: (R) => ({ detecte: R.cafBudgetaire < 0, detail: `CAF = ${formatEur(R.cafBudgetaire)}` }),
  },
  {
    code: 'PV-04', titre: 'Ratio liquidité < 1', niveau: 'PV',
    refM96: 'M9-6 §4.5.3', prescription: 'L\'actif circulant ne couvre pas les dettes à court terme.',
    calculer: (R, bal) => {
      const act = sumBal(bal, c => ['3','4','5'].includes(c.charAt(0)), 'solDbt');
      const dct = sumBal(bal, c => c.charAt(0) === '4', 'solCrd') + sumBal(bal, c => c.charAt(0) === '5', 'solCrd');
      const ratio = dct > 0 ? act / dct : 0;
      return { detecte: ratio < 1, detail: `Ratio = ${ratio.toFixed(2)}` };
    },
  },
  {
    code: 'PV-05', titre: 'Autonomie financière < 50%', niveau: 'PV',
    refM96: 'M9-6 §4.5.5', prescription: 'L\'établissement est majoritairement financé par des ressources externes.',
    calculer: (R) => {
      const pct = R.totalProduitsSdr > 0 ? R.ressourcesPropres / R.totalProduitsSdr : 0;
      return { detecte: pct < 0.5, detail: `Autonomie = ${(pct * 100).toFixed(1)}%` };
    },
  },
  {
    code: 'PV-07', titre: 'FDR de l\'annexe < 0 (C/185 insuffisant)', niveau: 'PV',
    refM96: 'M9-6 §2.1.2.3.2', prescription: 'L\'annexe est en tension de trésorerie. Le budget principal doit abonder le C/185.',
    calculer: (R: any, bal: any[]) => {
      const has515 = bal.some((b: any) => b.compte?.startsWith('515'));
      if (has515) return { detecte: false, detail: 'Budget principal — non applicable' };
      return { detecte: (R.fdrComptable || 0) < 0, detail: `FDR annexe = ${formatEur(R.fdrComptable || 0)}` };
    },
  },
  {
    code: 'PV-08', titre: 'Forte variation C/185 vs N-1 (> 20%)', niveau: 'PV',
    refM96: 'M9-6 §5.3.2', prescription: 'Variation significative du compte de liaison pouvant indiquer un changement d\'activité.',
    calculer: (_R: any, bal: any[], _ci: any[], extraData?: any) => {
      if (!extraData?.balance1) return { detecte: false, detail: 'Pas de données N-1' };
      const s185N = bal.filter((b: any) => b.compte?.startsWith('185')).reduce((s: number, b: any) => s + ((b.solDbt || 0) - (b.solCrd || 0)), 0);
      const bal1 = extraData.balance1 as any[];
      const s185N1 = bal1.filter((b: any) => b.compte?.startsWith('185')).reduce((s: number, b: any) => s + ((b.solDbt || 0) - (b.solCrd || 0)), 0);
      const variation = s185N1 !== 0 ? Math.abs((s185N - s185N1) / s185N1) : 0;
      return { detecte: variation > 0.2 && Math.abs(s185N1) > 100, detail: `C/185 N = ${formatEur(s185N)}, C/185 N-1 = ${formatEur(s185N1)}, Variation = ${(variation * 100).toFixed(1)}%` };
    },
  },
];

export function PointsBloquantsSection() {
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const balance = useCofiepleStore(s => s.balance);
  const balance1 = useCofiepleStore(s => s.balance1);
  const checkItems = useCofiepleStore(s => s.checkItems);
  const R = resultats[activeBudget];
  const bal = balance[activeBudget] || [];

  const [corrections, setCorrections] = useState<Record<string, { action: string; date: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('cockpit_cf_points_bloquants') || '{}'); } catch { return {}; }
  });

  if (!R) return <EmptyState msg="Lancez l'analyse pour afficher les points bloquants M9-6." />;

  const saveCorrection = (code: string, field: 'action' | 'date', value: string) => {
    const next = { ...corrections, [code]: { ...corrections[code], [field]: value } };
    setCorrections(next);
    localStorage.setItem('cockpit_cf_points_bloquants', JSON.stringify(next));
  };

  // Build extra data for cross-budget checks
  const extraData = {
    balanceBP: balance.principal || [],
    balanceAnnexes: {
      'GRETA': balance.annexe_greta || [],
      'CFA': balance.annexe_cfa || [],
      'Autre': balance.annexe_autre || [],
    },
    balance1: balance1?.[activeBudget] || [],
  };

  const evaluated = POINTS.map(p => ({
    ...p,
    result: p.calculer(R, bal, checkItems, ['PB-05', 'PV-08'].includes(p.code) ? extraData : undefined),
  }));
  const pbList = evaluated.filter(p => p.niveau === 'PB');
  const paList = evaluated.filter(p => p.niveau === 'PA');
  const pvList = evaluated.filter(p => p.niveau === 'PV');
  const nbPB = pbList.filter(p => p.result.detecte).length;
  const nbPA = paList.filter(p => p.result.detecte).length;
  const nbPV = pvList.filter(p => p.result.detecte).length;

  const niveauConfig = {
    PB: { icon: <Ban className="h-4 w-4" />, label: '🔴 Points bloquants MAJEURS', desc: 'Empêchent l\'arrêté du compte financier', color: 'destructive' },
    PA: { icon: <AlertTriangle className="h-4 w-4" />, label: '🟠 Points d\'attention MAJEURS', desc: 'Nécessitent justification', color: 'warning' },
    PV: { icon: <Eye className="h-4 w-4" />, label: '🟡 Points de vigilance', desc: 'À commenter dans le rapport', color: 'amber' },
  };

  const renderGroup = (items: typeof evaluated, niveau: 'PB' | 'PA' | 'PV') => {
    const cfg = niveauConfig[niveau];
    const detected = items.filter(p => p.result.detecte).length;
    const borderColor = niveau === 'PB' ? 'border-destructive/30' : niveau === 'PA' ? 'border-warning/30' : 'border-yellow-300/30';

    return (
      <Card key={niveau} className={`border ${borderColor}`}>
        <CardHeader className={`${niveau === 'PB' ? 'bg-destructive/10' : niveau === 'PA' ? 'bg-warning/10' : 'bg-yellow-50 dark:bg-yellow-900/10'} rounded-t-lg`}>
          <CardTitle className="text-sm flex items-center gap-2">
            {cfg.label}
            <Badge className={detected > 0 ? (niveau === 'PB' ? 'bg-destructive text-destructive-foreground' : niveau === 'PA' ? 'bg-warning text-warning-foreground' : 'bg-yellow-500 text-white') : 'bg-emerald-600 text-white'}>
              {detected > 0 ? `${detected} détecté(s)` : 'Aucun'}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground font-normal">{cfg.desc}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {items.map(p => {
            const corr = corrections[p.code] || { action: '', date: '' };
            return (
              <div key={p.code} className={`px-4 py-3 ${p.result.detecte ? (niveau === 'PB' ? 'bg-destructive/5' : niveau === 'PA' ? 'bg-warning/5' : 'bg-yellow-50/50 dark:bg-yellow-900/5') : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{p.result.detecte ? (niveau === 'PB' ? '🚫' : niveau === 'PA' ? '⚠️' : '🟡') : '✅'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{p.code}</Badge>
                      <span className="text-sm font-bold">{p.titre}</span>
                    </div>
                    {p.result.detecte && (
                      <div className="text-xs text-destructive font-mono mb-1 whitespace-pre-line">{p.result.detail}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{p.prescription}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 italic">Réf. : {p.refM96}</div>

                    {p.result.detecte && (
                      <div className="mt-2 space-y-2">
                        {p.code === 'PB-05' ? (
                          <>
                            <Textarea value={corr.action} onChange={e => saveCorrection(p.code, 'action', e.target.value)}
                              placeholder="Explication de l'écart sur le compte 185 (persistée)…" className="text-xs min-h-[60px]" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Date de correction Op@le :</span>
                              <Input type="date" value={corr.date} onChange={e => saveCorrection(p.code, 'date', e.target.value)}
                                className="text-xs h-7 w-40" />
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <Input value={corr.action} onChange={e => saveCorrection(p.code, 'action', e.target.value)}
                              placeholder="Action corrective prise…" className="text-xs h-7" />
                            <Input type="date" value={corr.date} onChange={e => saveCorrection(p.code, 'date', e.target.value)}
                              className="text-xs h-7 w-36" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`border-l-4 ${nbPB > 0 ? 'border-l-destructive' : 'border-l-emerald-500'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black">{nbPB}</div>
            <div className="text-xs text-muted-foreground">🔴 Bloquants</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${nbPA > 0 ? 'border-l-warning' : 'border-l-emerald-500'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black">{nbPA}</div>
            <div className="text-xs text-muted-foreground">🟠 Attention</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${nbPV > 0 ? 'border-l-yellow-400' : 'border-l-emerald-500'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black">{nbPV}</div>
            <div className="text-xs text-muted-foreground">🟡 Vigilance</div>
          </CardContent>
        </Card>
      </div>

      {/* Verdict */}
      <Card className={nbPB > 0 ? 'border-destructive bg-destructive/5' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'}>
        <CardContent className="p-4 text-center">
          <div className="text-lg font-bold">
            {nbPB > 0
              ? '🚫 Le compte financier NE PEUT PAS être présenté au CA en l\'état'
              : nbPA > 0
                ? '⚠️ Le compte financier peut être présenté au CA sous réserve de justifications'
                : '✅ Le compte financier est présentable au CA — Aucun point bloquant'}
          </div>
        </CardContent>
      </Card>

      {renderGroup(pbList, 'PB')}
      {renderGroup(paList, 'PA')}
      {renderGroup(pvList, 'PV')}
    </div>
  );
}
