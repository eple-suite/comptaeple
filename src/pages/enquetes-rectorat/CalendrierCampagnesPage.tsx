import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CALENDRIER_CAMPAGNES_RECTORAT, MOIS_LABELS, groupCampagnesParMois } from "@/lib/enquetes-rectorat/calendrierCampagnes";
import { CalendarClock, AlertCircle, CalendarDays } from "lucide-react";

export default function CalendrierCampagnesPage() {
  const grouped = groupCampagnesParMois();
  const moisOrdered = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Calendrier des campagnes Rectorat"
        description={`${CALENDRIER_CAMPAGNES_RECTORAT.length} échéances types pré-chargées — déclenchables par le rectorat ou l'AC du groupement.`}
      />

      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <strong>Alertes automatiques :</strong> J-30 email aux AC, J-15 bandeau cockpit,
            J-7 alerte rouge bloquante, J jour d'échéance escalade automatique.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {moisOrdered.map((mois) => (
          <Card key={mois}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                {MOIS_LABELS[mois]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grouped.get(mois)!.map((c) => (
                <div key={c.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{c.intitule}</div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {c.type_enquete}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  {c.reference_reglementaire && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Référence : {c.reference_reglementaire}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}