import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function MarcheModeEmploi() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Mode d'emploi</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Guide pas-à-pas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p><strong>1. Exprimer le besoin</strong> — Démarrez un nouveau marché et complétez la fiche besoin.</p>
          <p><strong>2. Estimer le montant</strong> — La procédure (dispense / MAPA / formalisée) est calculée automatiquement selon les seuils CCP 2026.</p>
          <p><strong>3. Vérifier l'anti-saucissonnage</strong> — Cumul des achats par famille sur 12 mois glissants.</p>
          <p><strong>4. Générer les pièces</strong> — Téléchargez l'ensemble des pièces .docx en un clic depuis la fiche du marché.</p>
          <p><strong>5. Suivre l'exécution</strong> — Jalons, bons de commande, réception, solde.</p>
        </CardContent>
      </Card>
    </div>
  );
}
