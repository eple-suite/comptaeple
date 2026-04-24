// ════════════════════════════════════════════════════════════════
// Sélecteur de voyage RÉEL + générateur 32 docs branché sur la base
// ────────────────────────────────────────────────────────────────
// Permet de :
//  • lister les voyages enregistrés via le wizard
//  • charger leurs données complètes (recettes/dépenses/participants)
//  • produire le ZIP des 32 documents pré-remplis
// ════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, RefreshCw, FolderOpen, Database } from "lucide-react";
import { toast } from "sonner";
import { DocumentsGenerator } from "./DocumentsGenerator";
import {
  listerVoyagesEtablissement,
  loadVoyageContext,
  libelleVoyage,
  type EtablissementBrief,
  type VoyageBrief,
} from "./lib/contextLoader";
import type { DocxBuildContext } from "./lib/docxBuilder";

interface Props {
  etablissement: EtablissementBrief | null;
}

export function DocumentsGeneratorReal({ etablissement }: Props) {
  const [voyages, setVoyages] = useState<VoyageBrief[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [context, setContext] = useState<DocxBuildContext | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(false);

  const refreshList = async () => {
    if (!etablissement?.id) return;
    setLoadingList(true);
    try {
      const list = await listerVoyagesEtablissement(etablissement.id);
      setVoyages(list);
      // Auto-sélection : reste sur le voyage courant s'il existe encore, sinon premier
      if (selectedId && !list.find((v) => v.id === selectedId)) {
        setSelectedId(list[0]?.id ?? null);
      } else if (!selectedId && list[0]) {
        setSelectedId(list[0].id);
      }
    } catch (e: any) {
      toast.error(`Impossible de charger les voyages : ${e?.message || "erreur"}`);
    } finally {
      setLoadingList(false);
    }
  };

  // Charge la liste à l'ouverture / changement d'établissement
  useEffect(() => {
    setSelectedId(null);
    setContext(null);
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etablissement?.id]);

  // Charge le contexte dès qu'un voyage est sélectionné
  useEffect(() => {
    if (!selectedId || !etablissement) {
      setContext(null);
      return;
    }
    setLoadingCtx(true);
    loadVoyageContext(selectedId, etablissement)
      .then((ctx) => {
        if (!ctx) {
          toast.error("Voyage introuvable.");
          setContext(null);
        } else {
          setContext(ctx);
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error(`Erreur chargement : ${e?.message || "inconnue"}`);
      })
      .finally(() => setLoadingCtx(false));
  }, [selectedId, etablissement]);

  if (!etablissement?.id) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Aucun établissement sélectionné</AlertTitle>
        <AlertDescription>
          Sélectionnez un établissement pour activer le générateur 32 documents.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Générateur sur voyage réel
              </CardTitle>
              <CardDescription>
                Sélectionnez un voyage enregistré via le wizard. Tous les champs (identification,
                dates, recettes, dépenses, agence, CA…) sont chargés depuis la base et pré-remplissent
                les 32 documents.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshList} disabled={loadingList}>
              {loadingList ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Rafraîchir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {voyages.length === 0 ? (
            <Alert>
              <FolderOpen className="h-4 w-4" />
              <AlertTitle>Aucun voyage enregistré</AlertTitle>
              <AlertDescription>
                Créez d'abord un voyage via le wizard (bouton « Lancer le wizard » ci-dessus).
                Une fois sauvegardé, il apparaîtra ici.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Select value={selectedId ?? undefined} onValueChange={(v) => setSelectedId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un voyage…" />
                </SelectTrigger>
                <SelectContent>
                  {voyages.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <span>{libelleVoyage(v)}</span>
                        {v.wizard_completed && (
                          <Badge variant="secondary" className="text-[10px]">Finalisé</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedId && context && (
                <div className="text-xs text-muted-foreground flex flex-wrap gap-3 pt-1">
                  <span>📍 {context.voyage.destination_ville}, {context.voyage.destination_pays}</span>
                  <span>👥 {context.voyage.nb_eleves_prevus} élèves · {context.voyage.nb_accompagnateurs_prevus ?? 0} accompagnateurs</span>
                  <span>💰 {(context.voyage.montant_total_ttc ?? 0).toLocaleString("fr-FR")} €</span>
                  <span>📥 {context.recettes?.length ?? 0} recette(s) · {context.depenses?.length ?? 0} dépense(s)</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {loadingCtx && (
        <Card>
          <CardContent className="py-8 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des données du voyage…
          </CardContent>
        </Card>
      )}

      {!loadingCtx && context && <DocumentsGenerator context={context} />}
    </div>
  );
}
