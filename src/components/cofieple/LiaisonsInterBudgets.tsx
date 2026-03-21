// ═══════════════════════════════════════════════════════════════
// MODULE — Vérification des liaisons inter-budgets (Compte 185)
// M9-6 §5.3.2 — Comptes de liaison entre BP et BA
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';
import { Link2, CheckCircle2, XCircle, Save, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'cockpit_cf_liaisons_185';

interface Solde185Annexe {
  label: string;
  budgetKey: string;
  auto: number | null; // auto-calculated from imported balance, or null
  manual: string;      // manual input (string for controlled input)
}

const sumBal185 = (bal: any[], side: 'solDbt' | 'solCrd') =>
  bal.filter((b: any) => b.compte?.startsWith('185')).reduce((s: number, b: any) => s + ((b[side] as number) || 0), 0);

export function LiaisonsInterBudgets() {
  const balance = useCofiepleStore(s => s.balance);
  const budgets = useCofiepleStore(s => s.budgets);
  const resultats = useCofiepleStore(s => s.resultats);

  const [manualValues, setManualValues] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);

  const balBP = balance?.principal || [];
  const hasBPData = balBP.length > 0;

  // C/185 on BP: normally créditeur (BP owes money to annexes)
  const solde185BP_crd = sumBal185(balBP, 'solCrd');
  const solde185BP_dbt = sumBal185(balBP, 'solDbt');
  const solde185BP = solde185BP_crd - solde185BP_dbt; // positive = créditeur

  // Build annexe lines
  const annexeLines = useMemo<Solde185Annexe[]>(() => {
    const lines: Solde185Annexe[] = [];
    const annexeConfigs = [
      { key: 'annexe_greta', label: 'GRETA' },
      { key: 'annexe_cfa', label: 'CFA' },
      { key: 'annexe_autre', label: 'SRH / Autre' },
    ];
    for (const cfg of annexeConfigs) {
      const balBA = (balance as any)?.[cfg.key] || [];
      const hasData = balBA.length > 0 && !!resultats[cfg.key as keyof typeof resultats];
      const auto = hasData
        ? sumBal185(balBA, 'solDbt') - sumBal185(balBA, 'solCrd') // positive = débiteur
        : null;
      lines.push({
        label: cfg.label,
        budgetKey: cfg.key,
        auto,
        manual: manualValues[cfg.key] || '',
      });
    }
    return lines;
  }, [balance, resultats, manualValues]);

  // Effective values for each annexe
  const effectiveValues = annexeLines.map(l => {
    if (l.auto !== null) return l.auto;
    const v = parseFloat(l.manual.replace(/\s/g, '').replace(',', '.'));
    return isNaN(v) ? null : v;
  });

  const totalAnnexes = effectiveValues.reduce((s, v) => s + (v ?? 0), 0);
  const ecartTotal = Math.abs(solde185BP - totalAnnexes);
  const concordant = ecartTotal < 0.02;
  const hasAnyAnnexeValue = effectiveValues.some(v => v !== null && v !== 0);

  const handleManualChange = (key: string, value: string) => {
    setManualValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(manualValues));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!hasBPData) {
    return <EmptyState msg="Importez la balance du budget principal pour vérifier les liaisons inter-budgets (C/185)." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5 rounded-t-lg pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            🔗 Vérification des liaisons inter-budgets (Compte 185)
            <Badge variant="outline" className="ml-auto text-[10px] font-mono">M9-6 §5.3.2</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* BP line */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Solde C/185 sur ce budget (Principal)</div>
                <div className="text-xl font-black text-primary">{formatEur(solde185BP)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {solde185BP > 0 ? 'CRÉDITEUR' : solde185BP < 0 ? 'DÉBITEUR' : 'NUL'}
                  {' — calculé automatiquement depuis la balance importée'}
                </div>
              </div>
              <div className="text-3xl opacity-30">🏛️</div>
            </div>
          </div>

          {/* Annexe lines */}
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            {annexeLines.some(l => l.auto !== null)
              ? 'Soldes C/185 des budgets annexes (auto-calculés ou à saisir) :'
              : 'Saisir les soldes C/185 des budgets annexes :'}
          </div>

          <div className="space-y-2">
            {annexeLines.map((line, i) => {
              const val = effectiveValues[i];
              const ecart = val !== null ? Math.abs(val) : null;
              const lineEcart = val !== null ? val : null;

              return (
                <div key={line.budgetKey} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="w-28 shrink-0">
                    <div className="text-sm font-bold">{line.label}</div>
                    <div className="text-[10px] text-muted-foreground">débiteur attendu</div>
                  </div>

                  {line.auto !== null ? (
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                          {formatEur(line.auto)} (auto)
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={line.manual}
                        onChange={e => handleManualChange(line.budgetKey, e.target.value)}
                        placeholder="0,00"
                        className="text-sm h-8 w-40 font-mono"
                      />
                    </div>
                  )}

                  <div className="w-36 text-right shrink-0">
                    {lineEcart !== null ? (
                      <span className="text-xs font-mono">
                        Écart : <span className={ecart! < 0.02 ? 'text-emerald-600' : 'text-destructive font-bold'}>
                          {formatEur(ecart!)} {ecart! < 0.02 ? '✅' : '❌'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Écart : ? €</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total concordance */}
          <div className={`rounded-lg border-2 p-4 ${
            !hasAnyAnnexeValue
              ? 'border-muted bg-muted/20'
              : concordant
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                : 'border-destructive bg-destructive/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasAnyAnnexeValue ? (
                  concordant ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-bold">
                    TOTAL C/185 Principal = Σ C/185 Annexes
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    {formatEur(solde185BP)} = {formatEur(totalAnnexes)}
                    {hasAnyAnnexeValue && (
                      <span className={`ml-2 font-bold ${concordant ? 'text-emerald-600' : 'text-destructive'}`}>
                        → Écart : {formatEur(ecartTotal)} {concordant ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasAnyAnnexeValue && (
                <Badge className={concordant ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'}>
                  {concordant ? 'Concordant' : 'Non concordant'}
                </Badge>
              )}
            </div>

            {hasAnyAnnexeValue && !concordant && (
              <div className="mt-3 text-xs text-destructive border-t border-destructive/20 pt-2">
                <strong>POINT BLOQUANT</strong> — L'écart de {formatEur(ecartTotal)} doit être justifié
                et corrigé avant l'arrêté du compte financier.<br />
                <em>Réf. : M9-6 §5.3.2 — « Les soldes des comptes de liaison doivent être soldés en fin d'exercice
                ou faire l'objet d'une justification. »</em>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {saved ? 'Enregistré ✓' : 'Enregistrer et vérifier'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
