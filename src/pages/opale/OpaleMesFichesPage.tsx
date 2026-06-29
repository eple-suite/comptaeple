import { Link } from "react-router-dom";
import { useMesFiches } from "@/hooks/queries/useOpaleFiches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import type { OpaleFiche } from "@/lib/opale/types";
import { OPALE_MODULES_LABELS, STATUT_PUBLICATION_LABELS } from "@/lib/opale/types";
import { BadgeActualite } from "@/components/opale/StatutBadges";

export default function OpaleMesFichesPage() {
  const { data: fiches = [], isLoading: loading } = useMesFiches();

  const par = (statut: string) => fiches.filter((f) => f.statut_publication === statut);

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
        </Button>
        <Button asChild>
          <Link to="/ressources/opale/nouvelle"><Plus className="h-4 w-4 mr-1" /> Nouvelle fiche</Link>
        </Button>
      </div>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Mes fiches</h1>
        <p className="text-muted-foreground">Brouillons, soumissions, publications et rejets.</p>
      </header>

      {loading ? <p>Chargement…</p> : (
        <Tabs defaultValue="brouillon">
          <TabsList>
            <TabsTrigger value="brouillon">Brouillons ({par("brouillon").length})</TabsTrigger>
            <TabsTrigger value="soumise">Soumises ({par("soumise").length})</TabsTrigger>
            <TabsTrigger value="publiee">Publiées ({par("publiee").length})</TabsTrigger>
            <TabsTrigger value="rejetee">Rejetées ({par("rejetee").length})</TabsTrigger>
          </TabsList>
          {(["brouillon", "soumise", "publiee", "rejetee"] as const).map((s) => (
            <TabsContent key={s} value={s} className="space-y-3 mt-4">
              {par(s).length === 0 ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground">Aucune fiche.</CardContent></Card>
              ) : par(s).map((f) => (
                <Card key={f.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> {f.titre || "(sans titre)"}</CardTitle>
                      <div className="flex gap-1.5">
                        <BadgeActualite statut={f.statut_actualite} />
                        <Badge variant="secondary">{STATUT_PUBLICATION_LABELS[f.statut_publication]}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                    <span>{OPALE_MODULES_LABELS[f.module_opale]} · MàJ {new Date(f.date_maj).toLocaleDateString("fr-FR")}</span>
                    <div className="flex gap-2">
                      {f.statut_publication === "publiee" && (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/ressources/opale/fiche/${f.slug}`}>Voir</Link>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/ressources/opale/edition/${f.id}`}>Éditer</Link>
                      </Button>
                    </div>
                  </CardContent>
                  {f.statut_publication === "rejetee" && f.motif_rejet && (
                    <CardContent className="pt-0 text-xs text-destructive">Motif : {f.motif_rejet}</CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}