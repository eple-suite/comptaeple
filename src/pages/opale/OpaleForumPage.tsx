import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { OPALE_MODULES, OPALE_MODULES_LABELS, type OpaleModule } from "@/lib/opale/types";
import { contientElementsSensibles } from "@/lib/opale/anonymisation";
import { logOpaleAcces } from "@/lib/opale/access";

interface Question {
  id: string;
  titre: string;
  contexte: string | null;
  module_concerne: OpaleModule;
  version_opale: string | null;
  statut: string;
  date_creation: string;
  fiche_resultante_id: string | null;
}

export default function OpaleForumPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [contexte, setContexte] = useState("");
  const [moduleQ, setModuleQ] = useState<OpaleModule>("comptabilite_generale");
  const [versionQ, setVersionQ] = useState("");

  const charger = async () => {
    const { data } = await supabase
      .from("opale_questions")
      .select("id,titre,contexte,module_concerne,version_opale,statut,date_creation,fiche_resultante_id")
      .order("date_creation", { ascending: false })
      .limit(100);
    if (data) setQuestions(data as unknown as Question[]);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const poser = async () => {
    if (!titre.trim() || titre.length < 5) { toast.error("Titre trop court (≥ 5 car.)"); return; }
    if (contientElementsSensibles(`${titre} ${contexte}`)) {
      toast.error("Données sensibles détectées (UAI, INE, email, IBAN...). Anonymisez avant de publier.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Connexion requise"); return; }
    const { error, data } = await supabase.from("opale_questions").insert({
      auteur_id: user.id,
      titre: titre.trim(),
      contexte: contexte.trim() || null,
      module_concerne: moduleQ,
      version_opale: versionQ.trim() || null,
      statut: "ouverte",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await logOpaleAcces("creation_question", { cible_type: "question", cible_id: (data as { id: string }).id });
    toast.success("Question publiée");
    setShowForm(false);
    setTitre(""); setContexte(""); setVersionQ("");
    charger();
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
        </Button>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Poser une question
        </Button>
      </div>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Forum Q&R inter-AC</h1>
        <p className="text-muted-foreground">Demandez de l'aide à la communauté académique. Les questions résolues peuvent être promues en fiches.</p>
      </header>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nouvelle question</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre court et explicite" />
            <Textarea value={contexte} onChange={(e) => setContexte(e.target.value)} rows={4} placeholder="Décrivez le contexte (sans données nominatives ni UAI/INE/IBAN)" />
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={moduleQ} onValueChange={(v) => setModuleQ(v as OpaleModule)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPALE_MODULES.map((m) => <SelectItem key={m} value={m}>{OPALE_MODULES_LABELS[m]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={versionQ} onChange={(e) => setVersionQ(e.target.value)} placeholder="Version Op@le (ex. 2026.1)" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={poser}>Publier</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <p>Chargement…</p> : (
        <div className="space-y-3">
          {questions.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune question pour l'instant. Lancez la conversation !</CardContent></Card>
          )}
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> {q.titre}
                  </CardTitle>
                  <div className="flex gap-1.5 items-center">
                    {q.statut === "resolue" && <Badge className="bg-success/15 text-success border-success/30" variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" /> Résolue</Badge>}
                    {q.statut === "ouverte" && <Badge variant="outline">Ouverte</Badge>}
                    {q.statut === "en_discussion" && <Badge variant="outline">En discussion</Badge>}
                    <Badge variant="secondary">{OPALE_MODULES_LABELS[q.module_concerne]}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {q.contexte && <p className="line-clamp-2">{q.contexte}</p>}
                <p className="text-xs">Posée le {new Date(q.date_creation).toLocaleDateString("fr-FR")} · {q.version_opale ? `Op@le ${q.version_opale}` : "version non précisée"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}