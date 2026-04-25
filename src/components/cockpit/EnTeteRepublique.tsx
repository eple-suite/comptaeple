import { Building2 } from "lucide-react";

interface EnTeteProps {
  groupement: string;
  rectorat: string;
  siege: string;
}

export function EnTeteRepublique({ groupement, rectorat, siege }: EnTeteProps) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      {/* Bandeau République */}
      <div className="bg-gradient-to-r from-[hsl(228,100%,28%)] via-[hsl(228,100%,32%)] to-[hsl(228,100%,28%)] text-white px-5 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Trois bandes RF */}
            <div className="flex flex-col gap-0.5">
              <span className="block h-1 w-8 bg-white" />
              <span className="block h-1 w-8 bg-white/60" />
              <span className="block h-1 w-8 bg-[hsl(355,80%,50%)]" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold">République Française</p>
              <p className="text-[10px] opacity-90">Ministère de l'Éducation nationale, de la Jeunesse et des Sports</p>
            </div>
          </div>
          <div className="text-right leading-tight">
            <p className="text-[10px] uppercase tracking-wider opacity-90">{rectorat}</p>
            <p className="text-[11px] font-semibold">Application de pilotage de l'agent comptable</p>
          </div>
        </div>
      </div>
      {/* Bandeau groupement */}
      <div className="bg-card px-5 py-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-display font-bold">{groupement}</h2>
          <p className="text-xs text-muted-foreground">Lycée siège : {siege}</p>
        </div>
      </div>
    </div>
  );
}
