import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { BIBLIOTHEQUE_ENQUETES, type ModeleEnquete } from "@/lib/enquetes-rectorat/bibliothequeEnquetes";
import { Library, ArrowRight, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BibliothequePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ModeleEnquete | null>(null);
  const [intitule, setIntitule] = useState("");
  const [description, setDescription] = useState("");
  const [echeance, setEcheance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function ouvrir(modele: ModeleEnquete) {
    setSelected(modele);
    setIntitule(modele.intitule);
    setDescription(modele.description);
    const d = new Date();
    d.setDate(d.getDate() + modele.delai_jours_defaut);
    setEcheance(d.toISOString().split("T")[0]);
  }

  async function lancer() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("enquetes_campagnes")
        .insert({
          intitule,
          type_enquete: selected.type_enquete,
          description,
          date_lancement: new Date().toISOString().split("T")[0],
          date_echeance: echeance,
          statut: "ouverte",
          origine: "ac",
          cree_par: user?.id ?? null,
          perimetre_etablissement_ids: [],
          periode_concernee: new Date().getFullYear().toString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Campagne lancée", { description: `Modèle « ${selected.intitule} » instancié.` });
      setSelected(null);
      navigate(`/enquetes-rectorat/relances?campagne=${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Échec du lancement", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={Library}
        title="Bibliothèque d'enquêtes"
        description={`${BIBLIOTHEQUE_ENQUETES.length} modèles pré-configurés — instanciation en un clic.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BIBLIOTHEQUE_ENQUETES.map((m) => (
          <Card key={m.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{m.intitule}</CardTitle>
                <Badge variant="outline">{m.periode_type}</Badge>
              </div>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1"><FileText className="h-3 w-3" />{m.champs.length} champs</div>
                {m.reference_reglementaire && <div>Réf : {m.reference_reglementaire}</div>}
                <div>Délai par défaut : {m.delai_jours_defaut} jours</div>
              </div>
              <Button size="sm" onClick={() => ouvrir(m)}>
                Lancer une campagne <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lancer la campagne</DialogTitle>
            <DialogDescription>
              Modèle : <b>{selected?.intitule}</b> — {selected?.champs.length} champs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intitule">Intitulé de la campagne</Label>
              <Input id="intitule" value={intitule} onChange={(e) => setIntitule(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="echeance">Date d'échéance</Label>
              <Input id="echeance" type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button>
            <Button onClick={lancer} disabled={submitting || !intitule || !echeance}>
              {submitting ? "Création…" : "Créer la campagne"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}