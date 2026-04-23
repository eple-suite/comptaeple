// ═══════════════════════════════════════════════════════════════
// Badge "voie d'inscription" coloré (GT bleu / PRO violet / 1er deg orange)
// ═══════════════════════════════════════════════════════════════

import type { Voie } from "./fsv2Types";

interface Props { voie: Voie | null | undefined; }

const LABELS: Record<Voie, string> = {
  GT: "GT",
  PRO: "PRO",
  "1er_degre": "1er degré",
};

const STYLES: Record<Voie, string> = {
  GT: "bg-primary/10 text-primary border-primary/30",
  PRO: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
  "1er_degre": "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
};

export function VoieBadge({ voie }: Props) {
  if (!voie) {
    return (
      <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 font-semibold">
        Voie ?
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full border text-[10px] px-2 py-0.5 font-semibold ${STYLES[voie]}`}>
      {LABELS[voie]}
    </span>
  );
}