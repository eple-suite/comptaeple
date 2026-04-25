import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { instancierJalons } from "@/lib/cockpit/calendrierReglementaire";
import type { JalonInstancie } from "@/lib/cockpit/calendrierReglementaire";

const COULEUR_DOT: Record<string, string> = {
  rouge: 'bg-destructive',
  orange: 'bg-warning',
  jaune: 'bg-yellow-400',
  info: 'bg-primary',
  success: 'bg-success',
};

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function CalendrierTimeline() {
  const today = new Date();
  const moisCourant = today.getMonth();
  const jalons = useMemo(() => instancierJalons(today), []);
  const [selected, setSelected] = useState<JalonInstancie | null>(null);

  // Group jalons by month
  const parMois: JalonInstancie[][] = Array.from({ length: 12 }, (_, m) =>
    jalons.filter(j => j.mois === m)
  );

  return (
    <Card className="rounded-xl" data-testid="cockpit-calendrier">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Calendrier comptable annuel
          <Badge variant="outline" className="ml-1 text-[10px]">{jalons.length} jalons</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-12 gap-1 mb-3">
          {parMois.map((mois, idx) => {
            const isPast = idx < moisCourant;
            const isCurrent = idx === moisCourant;
            return (
              <div key={idx} className="text-center">
                <div className={`text-[10px] uppercase font-bold mb-1 ${isCurrent ? 'text-primary' : isPast ? 'text-muted-foreground/60' : 'text-foreground/70'}`}>
                  {MOIS[idx]}
                </div>
                <div className={`relative h-12 rounded-md border ${isCurrent ? 'border-primary bg-primary/10' : isPast ? 'border-border/30 bg-muted/30' : 'border-border/40 bg-background'}`}>
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {mois.map(j => (
                      <button
                        key={j.id}
                        onClick={() => setSelected(j)}
                        className={`h-2 w-2 rounded-full ${COULEUR_DOT[j.couleur] || 'bg-primary'} hover:scale-150 transition-transform`}
                        title={j.titre}
                        aria-label={j.titre}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected ? (
          <div className="rounded-lg border border-border/60 p-3 text-xs space-y-1.5 bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{selected.titre}</p>
              <Badge variant="outline" className="text-[9px] shrink-0">{selected.responsable}</Badge>
            </div>
            <p className="text-muted-foreground">{selected.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
              <span>📅 {selected.date.toLocaleDateString('fr-FR')}</span>
              <span>· 📚 {selected.reference}</span>
              <span>· {selected.passe ? 'Passé' : `J${selected.joursRestants >= 0 ? '+' : ''}${selected.joursRestants}`}</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic text-center">Cliquez sur un point pour afficher la fiche échéance.</p>
        )}
      </CardContent>
    </Card>
  );
}
