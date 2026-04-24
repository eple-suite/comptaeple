import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function MarcheParametres() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration du module</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Seuils CCP en vigueur, délégations de signature, familles d'achat actives, modèles de critères par défaut.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
