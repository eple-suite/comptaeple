import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, ShieldCheck, MapPin } from "lucide-react";
import type { CockpitDataset } from "@/lib/cockpit/types";

interface Props {
  dataset: CockpitDataset;
}

export function CarteIdentiteGroupement({ dataset }: Props) {
  const { groupement, eples } = dataset;
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          À propos de mon groupement
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Agent comptable titulaire</p>
            <p className="font-medium">{groupement.agentComptable}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Fondé de pouvoir</p>
            <p className="font-medium">{groupement.fondeDePouvoir}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Lycée siège</p>
            <p className="font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {groupement.siege}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Rectorat</p>
            <p className="font-medium">{groupement.rectorat}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
            <p className="text-2xl font-bold tabular-nums">{groupement.nbEple}</p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">EPLE rattachés</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
            <p className="text-2xl font-bold tabular-nums flex items-center justify-center gap-1"><GraduationCap className="h-4 w-4" />{groupement.nbEleves || '—'}</p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Élèves</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
            <p className="text-2xl font-bold tabular-nums flex items-center justify-center gap-1"><Users className="h-4 w-4" />{groupement.nbAgents}</p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Agents</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Établissements rattachés</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {eples.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{e.nom}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{e.uai} · Ordo. {e.ordonnateur} · SG {e.secretaireGeneral}</p>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{e.type}</Badge>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground italic">Dernière mise à jour : {dataset.generationAt.toLocaleString('fr-FR')}</p>
      </CardContent>
    </Card>
  );
}
