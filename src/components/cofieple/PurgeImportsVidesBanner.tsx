// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Bandeau de détection automatique des imports SDE/SDR vides
// Bug 1 du prompt correction urgente : si un SDE/SDR existe en store
// mais que les colonnes numériques sont toutes nulles (ancien parser
// cassé), proposer une purge + ré-import.
// ═══════════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Trash2, ListRestart } from 'lucide-react';
import { toast } from 'sonner';
import type { TypeBudget } from '@/lib/cofieple_storeTypes';

type SlotKind = 'sde' | 'sde1' | 'sdr' | 'sdr1';

interface SlotEtat {
  kind: SlotKind;
  budget: TypeBudget;
  label: string;
  nbLignes: number;
  sommeBudget: number;
  sommeRealise: number;
  vide: boolean;
}

function inspecter(rows: any[] | undefined | null): { nbLignes: number; sommeBudget: number; sommeRealise: number } {
  if (!Array.isArray(rows)) return { nbLignes: 0, sommeBudget: 0, sommeRealise: 0 };
  let sB = 0, sR = 0;
  for (const r of rows) {
    sB += Math.abs(Number(r?.budget) || 0);
    sR += Math.abs(Number(r?.realise) || 0);
  }
  return { nbLignes: rows.length, sommeBudget: sB, sommeRealise: sR };
}

export function PurgeImportsVidesBanner() {
  const sde = useCofiepleStore(s => s.sde);
  const sde1 = useCofiepleStore(s => s.sde1);
  const sdr = useCofiepleStore(s => s.sdr);
  const sdr1 = useCofiepleStore(s => s.sdr1);
  const fichierCharge = useCofiepleStore(s => s.fichierCharge);
  const setSDE = useCofiepleStore(s => s.setSDE);
  const setSDE1 = useCofiepleStore(s => s.setSDE1);
  const setSDR = useCofiepleStore(s => s.setSDR);
  const setSDR1 = useCofiepleStore(s => s.setSDR1);
  const setFichierCharge = useCofiepleStore(s => s.setFichierCharge);
  const lancerAnalyse = useCofiepleStore(s => s.lancerAnalyse);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);

  const [openDetail, setOpenDetail] = useState(false);

  const etats: SlotEtat[] = useMemo(() => {
    const out: SlotEtat[] = [];
    const budgets: TypeBudget[] = ['principal', 'annexe_greta', 'annexe_cfa', 'annexe_autre'];
    const buckets: { kind: SlotKind; data: Record<string, any[]>; label: string }[] = [
      { kind: 'sde',  data: sde  as any, label: 'SDE' },
      { kind: 'sde1', data: sde1 as any, label: 'SDE N-1' },
      { kind: 'sdr',  data: sdr  as any, label: 'SDR' },
      { kind: 'sdr1', data: sdr1 as any, label: 'SDR N-1' },
    ];
    for (const b of buckets) {
      for (const bg of budgets) {
        const rows = b.data?.[bg];
        const flag = !!fichierCharge?.[`${b.kind}_${bg}`];
        if (!rows && !flag) continue;
        const ins = inspecter(rows);
        const vide = flag && (ins.nbLignes === 0 || (ins.sommeBudget === 0 && ins.sommeRealise === 0));
        out.push({
          kind: b.kind, budget: bg, label: `${b.label} · ${bg}`,
          nbLignes: ins.nbLignes, sommeBudget: ins.sommeBudget, sommeRealise: ins.sommeRealise, vide,
        });
      }
    }
    return out;
  }, [sde, sde1, sdr, sdr1, fichierCharge]);

  const vides = etats.filter(e => e.vide);
  if (vides.length === 0) return null;

  const purger = () => {
    for (const v of vides) {
      switch (v.kind) {
        case 'sde':  setSDE([], v.budget);  break;
        case 'sde1': setSDE1([], v.budget); break;
        case 'sdr':  setSDR([], v.budget);  break;
        case 'sdr1': setSDR1([], v.budget); break;
      }
      setFichierCharge(`${v.kind}_${v.budget}`, false);
    }
    setTimeout(() => {
      try { lancerAnalyse(); } catch {}
      toast.success(`${vides.length} import(s) vide(s) purgé(s). Ré-importez vos fichiers SDE / SDR à jour.`);
      setOpenDetail(false);
      setActiveTab('import');
    }, 50);
  };

  return (
    <>
      <div className="mx-1 mt-2 no-print">
        <div className="rounded-xl border-2 border-destructive/60 bg-destructive/10 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 text-sm">
              <p className="font-bold text-destructive">
                ⚠️ {vides.length} import(s) SDE/SDR détecté(s) mais vide(s)
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Le parser Op@le a été corrigé. Les anciens enregistrements sont conservés
                en cache mais leurs colonnes numériques (budget, réalisé, engagé) sont à
                zéro — c'est pourquoi les taux d'exécution affichent <strong>« Budget non
                importé »</strong>. Purgez-les puis re-téléversez vos fichiers.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="destructive" onClick={purger} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Purger automatiquement et ré-importer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpenDetail(true)} className="gap-1.5">
                  <ListRestart className="h-3.5 w-3.5" />
                  Voir le détail ({vides.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail des imports SDE/SDR</DialogTitle>
            <DialogDescription>
              Critère « vide » : aucune ligne extraite OU somme(budget)+somme(réalisé) = 0
              alors qu'un import est marqué comme chargé.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-xs border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Slot</th>
                  <th className="p-2 text-right">Lignes</th>
                  <th className="p-2 text-right">Σ budget</th>
                  <th className="p-2 text-right">Σ réalisé</th>
                  <th className="p-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {etats.map((e, i) => (
                  <tr key={i} className={e.vide ? 'bg-destructive/10' : ''}>
                    <td className="p-2 font-mono">{e.label}</td>
                    <td className="p-2 text-right tabular-nums">{e.nbLignes}</td>
                    <td className="p-2 text-right tabular-nums">{e.sommeBudget.toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums">{e.sommeRealise.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      {e.vide ? (
                        <span className="text-destructive font-bold">VIDE — à purger</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetail(false)}>Fermer</Button>
            <Button variant="destructive" onClick={purger} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Purger les {vides.length} import(s) vide(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}