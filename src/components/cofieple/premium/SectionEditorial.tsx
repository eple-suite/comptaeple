// Bandeau de section éditoriale style magazine
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionEditorialProps {
  kicker: string;        // ex: "Section 03 · Ordonnateur"
  title: string;         // ex: "Exécution des dépenses"
  lede?: string;         // chapeau éditorial
  meta?: string;         // ex: "M9-6 §2.3.1"
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';
  children?: ReactNode;
}

export function SectionEditorial({
  kicker, title, lede, meta, accent = 'primary', children,
}: SectionEditorialProps) {
  const accentMap = {
    primary: 'from-primary to-primary/40',
    success: 'from-success to-success/40',
    warning: 'from-warning to-warning/40',
    destructive: 'from-destructive to-destructive/40',
    secondary: 'from-secondary to-secondary/40',
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative pl-6 mb-8"
    >
      {/* Filet vertical accent */}
      <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full bg-gradient-to-b ${accentMap[accent]}`} />

      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
        <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-muted-foreground">{kicker}</span>
        {meta && (
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70 px-2 py-0.5 rounded bg-muted/40">
            {meta}
          </span>
        )}
      </div>

      <h2 className="font-serif-accent text-3xl lg:text-[2.25rem] font-light leading-tight tracking-tight text-foreground">
        {title}
      </h2>

      {lede && (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-3xl border-l-2 border-border pl-4 italic">
          {lede}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </motion.header>
  );
}
