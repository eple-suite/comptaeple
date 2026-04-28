import { useMemo, useState } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import {
  diagnoseSdePerimetre, diagnoseSdrPerimetre,
  type PerimetreExclusionRaison, type PerimetreLigneDiagnostic,
} from '@/lib/opaleExecutionHierarchy';
import type { LigneSDE, LigneSDR } from '@/lib/cofieple_types';

const RAISON_LABELS: Record<PerimetreExclusionRaison, { label: string; color: string }> = {
  service_vide:  { label: 'Service vide / "-"',          color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  service_total: { label: 'Service libellé "Total"',     color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
  libelle_total: { label: 'Domaine/Activité "Total"',    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
  aucun_montant: { label: 'Aucun montant non nul',       color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' },
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

function MontantSDE(row: LigneSDE) {
  return (row.budget || 0) + (row.engage || 0) + (row.realise || 0) + (row.encours || 0);
}
function MontantSDR(row: LigneSDR) {
  return (row.budget || 0) + (row.realise || 0) + (row.aor || 0) + (row.encours || 0);
}

function LigneTable<T extends LigneSDE | LigneSDR>({
  diags, kind, mode,
}: { diags: PerimetreLigneDiagnostic<T>[]; kind: 'sde' | 'sdr'; mode: 'inclus' | 'exclus' }) {
  const filtered = diags.filter((d) => (mode === 'inclus' ? d.retenue : !d.retenue));

  if (filtered.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic px-3 py-6 text-center border rounded-md">
        Aucune ligne {mode === 'inclus' ? 'retenue' : 'exclue'} dans ce périmètre.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[420px] border rounded-md">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10">
          <tr className="text-left">
            <th className="px-2 py-2 font-semibold">Service</th>
            <th className="px-2 py-2 font-semibold">Domaine</th>
            <th className="px-2 py-2 font-semibold">Activité</th>
            <th className="px-2 py-2 font-semibold">Compte</th>
            <th className="px-2 py-2 font-semibold text-right">Budget</th>
            <th className="px-2 py-2 font-semibold text-right">Réalisé</th>
            {mode === 'exclus' && <th className="px-2 py-2 font-semibold">Raison(s) d'exclusion</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((d, i) => {
            const r = d.row as any;
            return (
              <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                <td className="px-2 py-1.5 font-medium">{r.service || <span className="text-muted-foreground italic">∅</span>}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{r.domaine || '—'}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{r.activite || '—'}</td>
                <td className="px-2 py-1.5 font-mono text-[11px]">{r.compte || <span className="text-muted-foreground italic">∅</span>}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmtEur(r.budget)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmtEur(r.realise)}</td>
                {mode === 'exclus' && (
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {d.raisons.map((raison) => (
                        <span
                          key={raison}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${RAISON_LABELS[raison].color}`}
                        >
                          {RAISON_LABELS[raison].label}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}

export function VerificationPerimetreDialog() {
  const [open, setOpen] = useState(false);
  const sde = useCofiepleStore((s) => s.sde);
  const sdr = useCofiepleStore((s) => s.sdr);
  const activeBudget = useCofiepleStore((s) => s.activeBudget);

  const sdeRows: LigneSDE[] = sde?.[activeBudget] || [];
  const sdrRows: LigneSDR[] = sdr?.[activeBudget] || [];

  const diagSDE = useMemo(() => diagnoseSdePerimetre(sdeRows), [sdeRows]);
  const diagSDR = useMemo(() => diagnoseSdrPerimetre(sdrRows), [sdrRows]);

  const sdeInclus = diagSDE.filter((d) => d.retenue).length;
  const sdeExclus = diagSDE.length - sdeInclus;
  const sdrInclus = diagSDR.filter((d) => d.retenue).length;
  const sdrExclus = diagSDR.length - sdrInclus;

  const totSDEBudget = diagSDE.filter((d) => d.retenue).reduce((s, d) => s + (d.row.budget || 0), 0);
  const totSDERealise = diagSDE.filter((d) => d.retenue).reduce((s, d) => s + (d.row.realise || 0), 0);
  const totSDRBudget = diagSDR.filter((d) => d.retenue).reduce((s, d) => s + (d.row.budget || 0), 0);
  const totSDRRealise = diagSDR.filter((d) => d.retenue).reduce((s, d) => s + (d.row.realise || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          Vérifier le périmètre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Vérification du périmètre Op@le SDE / SDR
          </DialogTitle>
          <DialogDescription>
            Liste des lignes <strong>retenues</strong> et <strong>exclues</strong> par la logique d'agrégation stricte M9-6
            (filtres : service renseigné, libellé non « Total », montants présents).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sde" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sde">
              SDE — Dépenses
              <Badge variant="secondary" className="ml-2">{diagSDE.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sdr">
              SDR — Recettes
              <Badge variant="secondary" className="ml-2">{diagSDR.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {([
            { key: 'sde', diags: diagSDE, inclus: sdeInclus, exclus: sdeExclus, totB: totSDEBudget, totR: totSDERealise },
            { key: 'sdr', diags: diagSDR, inclus: sdrInclus, exclus: sdrExclus, totB: totSDRBudget, totR: totSDRRealise },
          ] as const).map((cfg) => (
            <TabsContent key={cfg.key} value={cfg.key} className="space-y-3 mt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Lignes retenues
                  </div>
                  <div className="text-xl font-bold tabular-nums">{cfg.inclus}</div>
                </div>
                <div className="rounded-md border bg-rose-500/5 border-rose-500/30 p-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Lignes exclues
                  </div>
                  <div className="text-xl font-bold tabular-nums">{cfg.exclus}</div>
                </div>
                <div className="rounded-md border bg-muted/30 p-2">
                  <div className="text-[11px] font-semibold text-muted-foreground">Σ Budget retenu</div>
                  <div className="text-base font-bold tabular-nums">{fmtEur(cfg.totB)}</div>
                </div>
                <div className="rounded-md border bg-muted/30 p-2">
                  <div className="text-[11px] font-semibold text-muted-foreground">Σ Réalisé retenu</div>
                  <div className="text-base font-bold tabular-nums">{fmtEur(cfg.totR)}</div>
                </div>
              </div>

              <Tabs defaultValue="inclus">
                <TabsList>
                  <TabsTrigger value="inclus" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Retenues ({cfg.inclus})
                  </TabsTrigger>
                  <TabsTrigger value="exclus" className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Exclues ({cfg.exclus})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="inclus" className="mt-2">
                  <LigneTable diags={cfg.diags as any} kind={cfg.key} mode="inclus" />
                </TabsContent>
                <TabsContent value="exclus" className="mt-2">
                  <LigneTable diags={cfg.diags as any} kind={cfg.key} mode="exclus" />
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}