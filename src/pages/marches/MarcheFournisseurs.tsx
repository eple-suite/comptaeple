import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function MarcheFournisseurs() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Base fournisseurs</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Annuaire des opérateurs économiques</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Référencement des fournisseurs avec familles d'achat, contrôle de la concentration et suivi du principe de non-discrimination (CCP art. L3).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
