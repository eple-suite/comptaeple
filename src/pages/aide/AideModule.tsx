import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { MODULES } from "@/data/aide/types";
import { articlesByModule } from "@/lib/aide/search";
import { exportModulePdf } from "@/lib/aide/pdfExport";

export default function AideModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) return <div className="container mx-auto p-6">Module introuvable.</div>;
  const articles = articlesByModule(mod.id);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi
        </Button>
        <Button size="sm" onClick={() => exportModulePdf(mod.id, articles)}>
          <Download className="h-4 w-4 mr-1" /> Télécharger le guide PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{mod.label}</CardTitle>
          <p className="text-sm text-muted-foreground">{articles.length} fiches pédagogiques structurées : vue d'ensemble, cadre réglementaire, pas-à-pas, approfondissement, expertise, pièges courants.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {articles.map((a) => (
            <Link key={a.slug} to={`/aide/article/${a.slug}`} className="block">
              <div className="rounded-md border p-3 hover:bg-muted/40 hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{a.titre}</div>
                    {a.resume && <div className="text-xs text-muted-foreground mt-0.5">{a.resume}</div>}
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{a.niveau}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}