// ═══════════════════════════════════════════════════════════════════
// COFI ORDO — Vue Mosaïque (sommaire visuel)
// 4 sections (A/B/C/D) en colonnes, fiches en cartes cliquables avec
// mini-KPI calculé live à partir du store cofieple.
// ═══════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { ORDO_SECTIONS, ORDO_FICHES, OrdoFicheDef, OrdoSectionKey } from './catalog';
import { useOrdoData } from '../useOrdoData';
import { cn } from '@/lib/utils';

interface Props {
  onOpenFiche: (id: string) => void;
}

const fmtEur = (n: number | null | undefined) => {
  if (n == null || !isFinite(n) || n === 0) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n);
};
const fmtPct = (n: number | null | undefined) => {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)} %`;
};
const fmtNum = (n: number | null | undefined) => {
  if (n == null || !isFinite(n) || n === 0) return '—';
  return new Intl.NumberFormat('fr-FR').format(n);
};

function getMiniKpi(fiche: OrdoFicheDef, R: any, ind: any): { value: string; label: string } {
  const S = R?.services?.[fiche.service ?? ''] ?? null;
  switch (fiche.id) {
    case 'ordo_a3': return { value: fmtNum(ind?.effectif_eleves), label: 'élèves' };
    case 'ordo_a4': {
      const tx = ind?.effectif_eleves ? (ind.effectif_boursiers / ind.effectif_eleves) : null;
      return { value: tx ? `${(tx * 100).toFixed(1)} %` : '—', label: 'taux boursiers' };
    }
    case 'ordo_a5': return { value: '—', label: 'DGF (à saisir)' };
    case 'ordo_b3': return { value: fmtPct(R?.tauxExecCharges), label: 'exéc. charges' };
    case 'ordo_b2': return { value: fmtEur(R?.totalChargesSde), label: 'charges réal.' };
    case 'ordo_d11': return { value: fmtNum(ind?.nb_repas_servis), label: 'repas servis' };
    case 'ordo_d10': return { value: fmtNum(ind?.conso_electricite), label: 'kWh élec.' };
    case 'ordo_d6': return { value: fmtEur(ind?.montant_fonds_social), label: 'fonds soc.' };
  }
  if (fiche.section === 'C' && S) {
    if (fiche.flux === 'charges') return { value: fmtEur(S.chargesReel), label: 'charges réal.' };
    if (fiche.flux === 'produits') return { value: fmtEur(S.produitsReel), label: 'produits réal.' };
  }
  return { value: '—', label: fiche.meta };
}

function SectionColumn({ skey, label, subtitle, accent, fiches, R, ind, onOpenFiche }: {
  skey: OrdoSectionKey; label: string; subtitle: string; accent: string;
  fiches: OrdoFicheDef[]; R: any; ind: any; onOpenFiche: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div
        className="rounded-xl px-4 py-3 border"
        style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}1A, transparent)` }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
          Section {skey}
        </div>
        <div className="text-sm font-bold text-foreground mt-0.5">{label.replace(/^[A-Z]\.\s*/, '')}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {fiches.map(f => {
          const k = getMiniKpi(f, R, ind);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onOpenFiche(f.id)}
              className={cn(
                'group text-left rounded-lg border border-border bg-card hover:bg-muted/40',
                'px-3 py-2.5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5'
              )}
              style={{ borderLeftWidth: 3, borderLeftColor: accent }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {f.numero}
                    </span>
                    <span className="text-[11px] font-semibold text-foreground truncate">{f.title}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold tabular-nums" style={{ color: accent }}>{k.value}</span>
                    <span className="text-[10px] text-muted-foreground">{k.label}</span>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OrdoMosaique({ onOpenFiche }: Props) {
  const { etab, R, ind } = useOrdoData();
  const groups = useMemo(
    () => ORDO_SECTIONS.map(s => ({
      ...s,
      fiches: ORDO_FICHES.filter(f => f.section === s.key),
    })),
    []
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Sommaire visuel · COFI ORDO
        </div>
        <h2 className="mt-2 text-xl font-bold text-foreground">
          Compte financier — Sphère ordonnateur · {etab.exercice}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Survolez les 34 indicateurs de votre rapport en un coup d'œil. Chaque carte affiche un
          mini-KPI calculé à partir des données réellement importées ; cliquez pour ouvrir la fiche détaillée
          (tableau N-2/N-1/N, graphique, lecture IA et zone de commentaire).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {groups.map(g => (
          <SectionColumn key={g.key}
            skey={g.key} label={g.label} subtitle={g.subtitle} accent={g.accent}
            fiches={g.fiches} R={R} ind={ind} onOpenFiche={onOpenFiche} />
        ))}
      </div>
    </div>
  );
}