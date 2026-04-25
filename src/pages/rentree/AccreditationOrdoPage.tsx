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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, FileCheck, ShieldCheck, Send, Lock } from "lucide-react";
import { type AccreditationChef, diagnostiquerAccreditation, PIECES_ACCREDITATION } from "./types";

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-muted" },
  pieces_recues_partielles: { label: "Pièces partielles", className: "bg-warning/20 text-warning" },
  completes: { label: "Complètes", className: "bg-info/20" },
  valide_par_ac: { label: "Validée AC", className: "bg-success/20 text-success" },
  transmis_drfip: { label: "Transmis DRFiP", className: "bg-primary/20 text-primary" },
  expire: { label: "Expirée", className: "bg-destructive/20 text-destructive" },
};

export default function AccreditationOrdoPage() {
  const { selectedEstablishment } = useEstablishment();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Partial<AccreditationChef>>({ statut: "en_attente", piece_identite_chiffree: true });

  const { data: accreditations = [] } = useQuery({
    queryKey: ["accreditations", selectedEstablishment?.id],
    enabled: !!selectedEstablishment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accreditations_chefs_etablissement")
        .select("*")
        .eq("establishment_id", selectedEstablishment!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccreditationChef[];
    },
  });

  const upload = async (cle: typeof PIECES_ACCREDITATION[number]["cle"], file: File) => {
    if (!selectedEstablishment) return;
    const path = `${selectedEstablishment.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("accreditation-pieces").upload(path, file);
    if (error) {
      toast({ title: "Upload impossible", description: error.message, variant: "destructive" });
      return;
    }
    setDraft(d => ({ ...d, [cle]: path }));
    toast({ title: "Pièce téléversée", description: file.name });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!selectedEstablishment) throw new Error("Aucun établissement actif");
      const verdict = diagnostiquerAccreditation({
        arrete_affectation_pdf_url: draft.arrete_affectation_pdf_url ?? null,
        piece_identite_pdf_url: draft.piece_identite_pdf_url ?? null,
        accreditation_drfip_pdf_url: draft.accreditation_drfip_pdf_url ?? null,
        specimen_signature_url: draft.specimen_signature_url ?? null,
        statut: (draft.statut as AccreditationChef["statut"]) ?? "en_attente",
      });
      const statut: AccreditationChef["statut"] = verdict.complete ? "completes" : "pieces_recues_partielles";
      const { error } = await supabase.from("accreditations_chefs_etablissement").insert({
        establishment_id: selectedEstablishment.id,
        chef_etablissement_nom: draft.chef_etablissement_nom ?? null,
        date_prise_fonction: draft.date_prise_fonction ?? null,
        date_arrete_affectation: draft.date_arrete_affectation ?? null,
        numero_arrete: draft.numero_arrete ?? null,
        arrete_affectation_pdf_url: draft.arrete_affectation_pdf_url ?? null,
        piece_identite_pdf_url: draft.piece_identite_pdf_url ?? null,
        accreditation_drfip_pdf_url: draft.accreditation_drfip_pdf_url ?? null,
        specimen_signature_url: draft.specimen_signature_url ?? null,
        observations: draft.observations ?? null,
        statut,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Accréditation enregistrée" });
      qc.invalidateQueries({ queryKey: ["accreditations"] });
      setDraft({ statut: "en_attente", piece_identite_chiffree: true });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const verdictDraft = diagnostiquerAccreditation({
    arrete_affectation_pdf_url: draft.arrete_affectation_pdf_url ?? null,
    piece_identite_pdf_url: draft.piece_identite_pdf_url ?? null,
    accreditation_drfip_pdf_url: draft.accreditation_drfip_pdf_url ?? null,
    specimen_signature_url: draft.specimen_signature_url ?? null,
    statut: (draft.statut as AccreditationChef["statut"]) ?? "en_attente",
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Accréditation des nouveaux ordonnateurs"
        description="Pièces obligatoires conformes GBCP art. 10. Sans pièces complètes, l'AC ne peut valider les actes d'ordonnancement."
        icon={ShieldCheck}
      />

      {!verdictDraft.complete && (
        <Alert className="border-destructive bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertTitle>Pièces incomplètes — signature ordonnateur bloquée</AlertTitle>
          <AlertDescription className="text-sm">
            Manquant : {verdictDraft.manquantes.join(", ")}. L'AC ne pourra pas valider les actes
            émis par cet ordonnateur tant que ces pièces ne sont pas reçues.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Identification du chef d'établissement entrant</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Nom prénom</Label>
            <Input value={draft.chef_etablissement_nom ?? ""} onChange={e => setDraft(d => ({ ...d, chef_etablissement_nom: e.target.value }))} />
          </div>
          <div>
            <Label>Date de prise de fonction</Label>
            <Input type="date" value={draft.date_prise_fonction ?? ""} onChange={e => setDraft(d => ({ ...d, date_prise_fonction: e.target.value }))} />
          </div>
          <div>
            <Label>N° arrêté d'affectation</Label>
            <Input value={draft.numero_arrete ?? ""} onChange={e => setDraft(d => ({ ...d, numero_arrete: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Téléversement des pièces (chiffrées RGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PIECES_ACCREDITATION.map(p => {
            const value = (draft as Record<string, unknown>)[p.cle] as string | undefined;
            return (
              <div key={p.cle} className="flex items-center gap-3 text-sm border rounded-md p-3">
                {value ? <FileCheck className="h-4 w-4 text-success" /> : <ShieldAlert className="h-4 w-4 text-warning" />}
                <span className="flex-1">{p.libelle}</span>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  className="max-w-xs"
                  onChange={e => e.target.files?.[0] && upload(p.cle, e.target.files[0])}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Observations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={draft.observations ?? ""} onChange={e => setDraft(d => ({ ...d, observations: e.target.value }))} />
          <div className="flex gap-3">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer le dossier</Button>
            <Button variant="outline" disabled={!verdictDraft.complete}>
              <Send className="mr-2 h-4 w-4" /> Transmettre à la DRFiP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dossiers existants</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {accreditations.length === 0 && <p className="text-sm text-muted-foreground">Aucun dossier d'accréditation enregistré.</p>}
          {accreditations.map(a => (
            <div key={a.id} className="flex items-center justify-between border-b py-2">
              <span className="text-sm font-medium">{a.chef_etablissement_nom ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{a.date_prise_fonction ?? "—"}</span>
              <Badge className={STATUT_BADGE[a.statut]?.className ?? ""}>{STATUT_BADGE[a.statut]?.label ?? a.statut}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}