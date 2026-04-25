import { ShieldAlert } from "lucide-react";

/**
 * Bandeau OBLIGATOIRE sur toute fiche affichée.
 * Rappelle que la plateforme est COMPLÉMENTAIRE à l'assistance Op@le officielle.
 */
export function RappelOfficielBanner() {
  return (
    <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 flex gap-3 items-start">
      <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">
        <p className="font-semibold text-foreground mb-1">Source d'expérience académique — usage complémentaire</p>
        <p className="text-muted-foreground">
          Cette fiche est issue de l'expérience d'agents comptables de l'académie de Guadeloupe.
          Pour les cas critiques ou non documentés ici, contactez l'assistance Op@le officielle :
          <span className="font-medium text-foreground"> DAF A3</span> (Pléiade) ou le bureau réglementation
          comptable du rectorat.
        </p>
      </div>
    </div>
  );
}