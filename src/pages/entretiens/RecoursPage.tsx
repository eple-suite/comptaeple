import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Scale, AlertTriangle, FileText, Calendar, Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculerDelaisRecours } from "@/lib/entretiens/machineEtat";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Recours = {
  id: string;
  entretien_id: string;
  type: string;
  date_saisine: string;
  date_limite_reponse: string | null;
  motif: string | null;
  reponse: string | null;
  date_reponse: string | null;
  statut: string;
  date_avis_cap: string | null;
  sens_avis_cap: string | null;
  date_decision_finale: string | null;
  decision_finale: string | null;
};

type Entretien = {
  id: string;
  campagne_annee: string;
  finalise_at: string | null;
  statut: string;
};

export default function RecoursPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recours, setRecours] = useState<Recours[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [selectedEntretienId, setSelectedEntretienId] = useState<string>("");
  const [motif, setMotif] = useState("");
  const [type, setType] = useState<"recours_hierarchique" | "saisine_cap">("recours_hierarchique");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rec } = await supabase
        .from("entretiens_recours")
        .select("*")
        .order("date_saisine", { ascending: false });
      setRecours((rec || []) as any);
      const { data: ent } = await supabase
        .from("entretiens_professionnels")
        .select("id,campagne_annee,finalise_at,statut")
        .in("statut", ["finalise", "archive", "recours_en_cours"])
        .order("finalise_at", { ascending: false });
      setEntretiens((ent || []) as any);
      setLoading(false);
    })();
  }, [user]);

  async function submitRecours() {
    if (!selectedEntretienId || !motif.trim() || !user) {
      toast.error("Sélectionner un CREP et indiquer un motif");
      return;
    }
    const ent = entretiens.find((e) => e.id === selectedEntretienId);
    if (!ent?.finalise_at) {
      toast.error("Le CREP doit être finalisé pour ouvrir un recours");
      return;
    }
    const delais = calculerDelaisRecours(ent.finalise_at);
    if (type === "recours_hierarchique" && !delais.recoursHierarchiqueEncore) {
      toast.error("Délai de 15 jours francs dépassé pour le recours hiérarchique");
      return;
    }
    if (type === "saisine_cap" && !delais.saisineCAPEncore) {
      toast.error("Délai d'1 mois dépassé pour la saisine CAP/CCP");
      return;
    }
    setSubmitting(true);
    const dateLimite =
      type === "recours_hierarchique"
        ? delais.dateLimiteRecoursHierarchique
        : delais.dateLimiteSaisineCAP;
    const { error } = await supabase.from("entretiens_recours").insert({
      entretien_id: selectedEntretienId,
      type,
      date_saisine: new Date().toISOString().slice(0, 10),
      date_limite_reponse: dateLimite.toISOString().slice(0, 10),
      motif,
      statut: "en_attente_reponse" as any,
      user_saisie_id: user.id,
    });
    if (error) {
      toast.error("Erreur enregistrement : " + error.message);
      setSubmitting(false);
      return;
    }
    // Marquer entretien recours_en_cours
    if (type === "recours_hierarchique") {
      await supabase
        .from("entretiens_professionnels")
        .update({ statut: "recours_en_cours" })
        .eq("id", selectedEntretienId);
    }
    toast.success("Recours enregistré");
    setMotif("");
    setSelectedEntretienId("");
    setSubmitting(false);
    // refresh
    const { data: rec } = await supabase.from("entretiens_recours").select("*").order("date_saisine", { ascending: false });
    setRecours((rec || []) as any);
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/entretiens")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Scale className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Recours hiérarchique & saisine CAP/CCP</h1>
          <p className="text-sm text-muted-foreground">
            Décret 2010-888 art. 6 — délais 15 jours francs (N+2) puis 1 mois (CAP/CCP).
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Délais réglementaires</AlertTitle>
        <AlertDescription className="text-xs">
          • Recours hiérarchique auprès du N+2 : <strong>15 jours francs</strong> à compter de la notification finale du CREP.
          <br />• Saisine de la CAP/CCP : <strong>1 mois</strong> à compter de la réponse défavorable du N+2.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste">Mes recours ({recours.length})</TabsTrigger>
          <TabsTrigger value="nouveau">Nouvelle saisine</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!loading && recours.length === 0 && (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucun recours en cours.</CardContent></Card>
          )}
          {recours.map((r) => {
            const joursRestants = r.date_limite_reponse
              ? Math.ceil((new Date(r.date_limite_reponse).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {r.type === "recours_hierarchique" ? "Recours hiérarchique" : r.type === "saisine_cap" ? "Saisine CAP/CCP" : r.type}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.statut === "en_attente_reponse" ? "default" : "secondary"}>{r.statut}</Badge>
                      {joursRestants !== null && r.statut === "en_attente_reponse" && (
                        <Badge variant={joursRestants <= 3 ? "destructive" : "outline"} className="gap-1">
                          <Calendar className="h-3 w-3" /> J{joursRestants > 0 ? "-" : "+"}{Math.abs(joursRestants)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div><span className="text-muted-foreground">Saisine :</span> {format(new Date(r.date_saisine), "PPP", { locale: fr })}</div>
                  {r.date_limite_reponse && <div><span className="text-muted-foreground">Échéance :</span> {format(new Date(r.date_limite_reponse), "PPP", { locale: fr })}</div>}
                  {r.motif && <div className="mt-2 p-2 bg-muted rounded text-foreground/80">{r.motif}</div>}
                  {r.reponse && (
                    <div className="mt-2 p-2 border rounded">
                      <div className="font-medium text-foreground">Réponse du N+2 :</div>
                      <div>{r.reponse}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="nouveau">
          <Card>
            <CardHeader><CardTitle className="text-base">Nouvelle saisine</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Type de saisine</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={type === "recours_hierarchique" ? "default" : "outline"} size="sm" onClick={() => setType("recours_hierarchique")}>
                    Recours hiérarchique (N+2)
                  </Button>
                  <Button variant={type === "saisine_cap" ? "default" : "outline"} size="sm" onClick={() => setType("saisine_cap")}>
                    Saisine CAP/CCP
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">CREP concerné</Label>
                <select
                  value={selectedEntretienId}
                  onChange={(e) => setSelectedEntretienId(e.target.value)}
                  className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Sélectionner un CREP finalisé...</option>
                  {entretiens.map((e) => (
                    <option key={e.id} value={e.id}>
                      Campagne {e.campagne_annee} — {e.statut} {e.finalise_at && `(notifié le ${format(new Date(e.finalise_at), "P", { locale: fr })})`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEntretienId && (() => {
                const ent = entretiens.find((e) => e.id === selectedEntretienId);
                if (!ent?.finalise_at) return null;
                const d = calculerDelaisRecours(ent.finalise_at);
                return (
                  <Alert variant={(type === "recours_hierarchique" ? d.recoursHierarchiqueEncore : d.saisineCAPEncore) ? "default" : "destructive"}>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {type === "recours_hierarchique"
                        ? `Limite recours hiérarchique : ${format(d.dateLimiteRecoursHierarchique, "PPP", { locale: fr })} (${d.joursRestantsRecoursHierarchique} j restants)`
                        : `Limite saisine CAP : ${format(d.dateLimiteSaisineCAP, "PPP", { locale: fr })} (${d.joursRestantsSaisineCAP} j restants)`}
                    </AlertDescription>
                  </Alert>
                );
              })()}
              <div>
                <Label className="text-xs">Motifs de la demande de révision *</Label>
                <Textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Éléments factuels contestés, appréciation contestée, demande précise..."
                  rows={6}
                  className="mt-1"
                />
              </div>
              <Button onClick={submitRecours} disabled={submitting || !selectedEntretienId || !motif.trim()} className="gap-2">
                <Send className="h-4 w-4" /> Soumettre la saisine
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}