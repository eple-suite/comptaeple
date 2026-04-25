import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VueRectoratPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Vue rectorat — observateur"
        description="Accès lecture seule pour le rectorat. Périmètre paramétré par l'AC, expiration 1 an par défaut."
        icon={Eye}
      />
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertTitle>Rôle observateur_rectoral — lecture seule</AlertTitle>
        <AlertDescription>
          Habilitations + accréditations consultables. Toute consultation est tracée dans le journal RGPD côté AC.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader><CardTitle className="text-base">Tableau de bord rectoral</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Liste des EPLE accessibles, statut des habilitations (à jour / partiel / en retard), heatmap d'avancement,
          alertes EPLE non signataires au 15/09 et bouton « Demander mise à jour » avec email automatique.
        </CardContent>
      </Card>
    </div>
  );
}