// Hero éditorial magazine pour le Compte Financier
// Inspiration : Linear / Notion / Le Monde Diplomatique
import { motion } from 'framer-motion';
import { Sparkles, Building2, Calendar, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CofiepleHeroProps {
  etabNom: string;
  exercice: number;
  uai: string;
  commune?: string;
  hasData: boolean;
  nbBloq: number;
  nbAnom: number;
  resultatComptable?: number;
  fdr?: number;
  treso?: number;
}

const fmtEur = (n?: number) =>
  n === undefined ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function CofiepleHero({
  etabNom, exercice, uai, commune, hasData, nbBloq, nbAnom,
  resultatComptable, fdr, treso,
}: CofiepleHeroProps) {
  const status = nbBloq > 0 ? 'critical' : nbAnom > 0 ? 'warning' : hasData ? 'ok' : 'pending';

  const statusConfig = {
    critical: { label: 'Points bloquants détectés', dot: 'bg-destructive', ring: 'ring-destructive/30' },
    warning: { label: 'Vigilance requise', dot: 'bg-warning', ring: 'ring-warning/30' },
    ok: { label: 'Comptes équilibrés', dot: 'bg-success', ring: 'ring-success/30' },
    pending: { label: 'En attente d\'import', dot: 'bg-muted-foreground', ring: 'ring-muted' },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-accent/30 shadow-xl"
    >
      {/* Bandeau tricolore institutionnel */}
      <div className="absolute top-0 inset-x-0 h-1 flex">
        <div className="flex-1 bg-[#002395]" />
        <div className="flex-1 bg-white border-y border-border" />
        <div className="flex-1 bg-[#ED2939]" />
      </div>

      {/* Texture décorative */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Compte Financier · Exercice {exercice}</span>
          </div>

          <div>
            <h1 className="font-serif-accent text-4xl lg:text-5xl font-light leading-[1.05] tracking-tight text-foreground">
              {etabNom || <span className="italic text-muted-foreground">Établissement non sélectionné</span>}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> RNE {uai || '—'}
              </span>
              {commune && <span className="text-border">·</span>}
              {commune && <span>{commune}</span>}
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Clôture au 31/12/{exercice}
              </span>
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur ring-1 ${statusConfig.ring}`}>
            <span className={`h-2 w-2 rounded-full ${statusConfig.dot} animate-pulse`} />
            <span className="text-xs font-semibold text-foreground">{statusConfig.label}</span>
            {hasData && nbBloq === 0 && nbAnom === 0 && (
              <Badge variant="outline" className="text-[10px] border-success/40 text-success">M9-6 conforme</Badge>
            )}
          </div>
        </div>

        {/* KPI éditoriaux */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-3 gap-4 lg:min-w-[420px]"
          >
            {[
              { label: 'Résultat', value: fmtEur(resultatComptable), accent: (resultatComptable ?? 0) >= 0 ? 'text-success' : 'text-destructive' },
              { label: 'FDR', value: fmtEur(fdr), accent: 'text-primary' },
              { label: 'Trésorerie', value: fmtEur(treso), accent: 'text-secondary' },
            ].map((kpi) => (
              <div key={kpi.label} className="space-y-1">
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">{kpi.label}</div>
                <div className={`font-mono text-lg font-bold ${kpi.accent} tabular-nums`}>{kpi.value}</div>
                <div className="h-px bg-gradient-to-r from-border to-transparent" />
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Pied de hero — méta éditoriale */}
      <div className="relative border-t border-border/50 bg-background/40 backdrop-blur-sm px-8 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          <span>Conformité M9-6 2026 · Décret 2012-1246 · Code de l'éducation</span>
        </div>
        <div className="font-mono tracking-wider">COFIEPLE / RAPPORT v3.0</div>
      </div>
    </motion.div>
  );
}
