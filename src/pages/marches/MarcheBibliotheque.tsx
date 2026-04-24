import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function MarcheBibliotheque() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Bibliothèque des modèles</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Modèles de pièces de marché</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Catalogue des gabarits .docx (Fiche besoin, RC, CCAP, CCTP, AE, RAO, Décision, Notification…) — disponibles automatiquement depuis la fiche d'un marché.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
