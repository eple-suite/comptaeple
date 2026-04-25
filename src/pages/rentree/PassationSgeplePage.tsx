import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftRight, FileSignature, ShieldCheck, ClipboardList, Mail, Lock } from "lucide-react";
import {
  INVENTAIRE_DOSSIERS_DEFAUT,
  INVENTAIRE_OUTILS_DEFAUT,
  type InventaireItem,
  type PassationSgeple,
  type StatutPassation,
} from "./types";

const STATUT_LABEL: Record<StatutPassation, string> = {
  programmee: "Programmée",
  en_cours: "En cours",
  cloturee: "Clôturée",
  abandonnee: "Abandonnée",
};

export default function PassationSgeplePage() {
  const { selectedEstablishment: activeEstablishment } = useEstablishment();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Partial<PassationSgeple>>({
    inventaire_outils: INVENTAIRE_OUTILS_DEFAUT,
    inventaire_dossiers: INVENTAIRE_DOSSIERS_DEFAUT,
    statut: "programmee",
  });

  const { data: passations = [] } = useQuery({
    queryKey: ["passations", activeEstablishment?.id],
    enabled: !!activeEstablishment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passations_sgeple")
        .select("*")
        .eq("establishment_id", activeEstablishment!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PassationSgeple[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<PassationSgeple>) => {
      if (!activeEstablishment) throw new Error("Aucun établissement actif");
      const payload = {
        establishment_id: activeEstablishment.id,
        statut: p.statut ?? "programmee",
        inventaire_outils: p.inventaire_outils ?? [],
        inventaire_dossiers: p.inventaire_dossiers ?? [],
        date_dernier_jour_sortant: p.date_dernier_jour_sortant ?? null,
        date_premier_jour_entrant: p.date_premier_jour_entrant ?? null,
        date_effective_passation: p.date_effective_passation ?? null,
        observations: p.observations ?? null,
      };
      const { error } = await supabase.from("passations_sgeple").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Passation enregistrée", description: "Le PV pourra être généré une fois les 8 étapes complétées." });
      qc.invalidateQueries({ queryKey: ["passations"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  function toggle(list: "inventaire_outils" | "inventaire_dossiers", cle: string) {
    setDraft(d => ({
      ...d,
      [list]: (d[list] ?? []).map((it: InventaireItem) =>
        it.cle === cle ? { ...it, fait: !it.fait } : it,
      ),
    }));
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Passation de service SGEPLE"
        description="Wizard guidé conforme R.421-13 du code de l'éducation et GBCP 2012-1246."
        icon={ArrowLeftRight}
      />

      <Tabs defaultValue="wizard">
        <TabsList>
          <TabsTrigger value="wizard">Nouveau passation</TabsTrigger>
          <TabsTrigger value="historique">Historique ({passations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="space-y-4">
          {/* Étape 1 — Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4" /> Étape 1 — Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Dernier jour SGEPLE sortant</Label>
                <Input
                  type="date"
                  value={draft.date_dernier_jour_sortant ?? ""}
                  onChange={e => setDraft(d => ({ ...d, date_dernier_jour_sortant: e.target.value }))}
                />
              </div>
              <div>
                <Label>Premier jour SGEPLE entrant</Label>
                <Input
                  type="date"
                  value={draft.date_premier_jour_entrant ?? ""}
                  onChange={e => setDraft(d => ({ ...d, date_premier_jour_entrant: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date effective de passation</Label>
                <Input
                  type="date"
                  value={draft.date_effective_passation ?? ""}
                  onChange={e => setDraft(d => ({ ...d, date_effective_passation: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Étape 2 — Outils numériques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Étape 2 — Inventaire des outils numériques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(draft.inventaire_outils ?? []).map(it => (
                <label key={it.cle} className="flex items-center gap-3 text-sm">
                  <Checkbox checked={it.fait} onCheckedChange={() => toggle("inventaire_outils", it.cle)} />
                  <span className={it.fait ? "line-through text-muted-foreground" : ""}>{it.libelle}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Étape 3 — Dossiers physiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" /> Étape 3 — Inventaire des dossiers physiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(draft.inventaire_dossiers ?? []).map(it => (
                <label key={it.cle} className="flex items-center gap-3 text-sm">
                  <Checkbox checked={it.fait} onCheckedChange={() => toggle("inventaire_dossiers", it.cle)} />
                  <span className={it.fait ? "line-through text-muted-foreground" : ""}>{it.libelle}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Étapes 4 → 7 (synthèse) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Étapes 4 à 7 — Dossiers, habilitations, PV, notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                • Dossiers en cours à transférer (lié aux modules voyages, marchés, fonds sociaux).<br />
                • Habilitations Op@le sortantes à révoquer / entrantes à créer (interconnexion module Habilitations).<br />
                • PV de passation .docx → PDF avec 4 signatures (sortant, entrant, chef d'établissement, AC).<br />
                • Notifications automatiques rectorat DPAE, DRFiP, fournisseurs, membres CA.
              </p>
              <Textarea
                placeholder="Observations / réserves émises par les parties"
                value={draft.observations ?? ""}
                onChange={e => setDraft(d => ({ ...d, observations: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Étape 8 — Clôture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Étape 8 — Clôture et archivage 10 ans
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => upsert.mutate({ ...draft, statut: "programmee" })} disabled={upsert.isPending}>
                Enregistrer la passation
              </Button>
              <Button variant="outline" onClick={() => upsert.mutate({ ...draft, statut: "cloturee" })} disabled={upsert.isPending}>
                Clôturer + archiver
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardContent className="pt-6 space-y-2">
              {passations.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune passation enregistrée pour cet établissement.</p>
              )}
              {passations.map(p => (
                <div key={p.id} className="flex items-center justify-between border-b py-2">
                  <span className="text-sm">{p.date_effective_passation ?? "—"}</span>
                  <Badge variant="outline">{STATUT_LABEL[p.statut]}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}