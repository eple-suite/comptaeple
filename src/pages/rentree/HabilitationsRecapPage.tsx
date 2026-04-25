import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Send } from "lucide-react";

/**
 * Document récapitulatif rectorat — version socle.
 * Génère le PDF/Excel consolidé des habilitations Op@le du groupement.
 * (Génération PDF/Excel à étoffer dans un tour ultérieur.)
 */
export default function HabilitationsRecapPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Document récapitulatif rectorat"
        description="Synthèse consolidée du groupement — sphères ordonnateur et comptable signées séparément."
        icon={FileText}
      />
      <Card>
        <CardHeader><CardTitle className="text-base">Génération du document</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Le document agrège les habilitations actives par EPLE, présente la sphère ordonnateur signée par chaque
            chef d'établissement et la sphère comptable signée par l'AC, puis génère un lien magique de consultation
            pour le rectorat.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button><Download className="mr-2 h-4 w-4" />Générer PDF</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" />Générer Excel (4 onglets)</Button>
            <Button variant="outline"><Send className="mr-2 h-4 w-4" />Transmettre au rectorat</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}