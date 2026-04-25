import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

export type ProfilCockpit = 'agent_comptable' | 'ordonnateur' | 'secretaire_general' | 'regisseur' | 'autre';

const LABELS: Record<ProfilCockpit, string> = {
  agent_comptable: 'Agent comptable',
  ordonnateur: 'Ordonnateur',
  secretaire_general: 'Secrétaire général',
  regisseur: 'Régisseur',
  autre: 'Autre',
};

interface Props {
  value: ProfilCockpit;
  onChange: (p: ProfilCockpit) => void;
}

export function ProfilSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Vue</span>
      {(Object.keys(LABELS) as ProfilCockpit[]).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
            value === p
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-border/60 hover:bg-accent'
          }`}
        >
          {LABELS[p]}
        </button>
      ))}
    </div>
  );
}
