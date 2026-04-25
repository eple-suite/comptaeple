import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { OpaleFiche } from "@/lib/opale/types";
import { OPALE_MODULES_LABELS } from "@/lib/opale/types";
import { logOpaleAcces } from "@/lib/opale/access";

/**
 * Modération académique — réservée aux rôles `moderateur_opale` et `admin`.
 * RLS bloque déjà les autres rôles ; ce composant assure une UX cohérente.
 */
export default function OpaleModerationPage() {
  const [fiches, setFiches] = useState<OpaleFiche[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(true);
  const [autorise, setAutorise] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: rolesA } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      const { data: rolesM } = await supabase.rpc("has_role", { _user_id: user.id, _role: "moderateur_opale" });
      const ok = Boolean(rolesA) || Boolean(rolesM);
      setAutorise(ok);
      if (!ok) { setLoading(false); return; }
      const { data } = await supabase
        .from("opale_fiches")
        .select("*")
        .in("statut_publication", ["soumise", "en_validation"])
        .order("date_creation", { ascending: true });
      if (data) setFiches(data as unknown as OpaleFiche[]);
      setLoading(false);
    })();
  }, []);

  const decider = async (
    fiche: OpaleFiche,
    decision: "publiee" | "rejetee" | "en_validation",
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updates: Record<string, unknown> = {
      statut_publication: decision,
      modere_par_id: user.id,
      date_moderation: new Date().toISOString(),
    };
    if (decision === "rejetee") updates.motif_rejet = motif || "Non conforme à la charte académique";
    if (decision === "publiee") updates.date_publication = new Date().toISOString();
    const { error } = await supabase.from("opale_fiches").update(updates).eq("id", fiche.id);
    if (error) { toast.error(error.message); return; }
    await logOpaleAcces(
      decision === "publiee" ? "moderation_approbation" :
      decision === "rejetee" ? "moderation_rejet" : "moderation_modifs",
      { cible_type: "fiche", cible_id: fiche.id, metadata: { motif } },
    );
    setFiches((prev) => prev.filter((f) => f.id !== fiche.id));
    setSelection(null);
    setMotif("");
    toast.success("Décision enregistrée");
  };

  if (loading) return <div className="container py-8">Chargement…</div>;
  if (!autorise) {
    return (
      <div className="container max-w-3xl mx-auto py-12">
        <Card><CardContent className="py-10 text-center space-y-3">
          <p className="font-semibold">Accès réservé aux modérateurs académiques.</p>
          <p className="text-sm text-muted-foreground">Demandez l'attribution du rôle <code>moderateur_opale</code> au rectorat.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
      </Button>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Modération académique</h1>
        <p className="text-muted-foreground">{fiches.length} fiche(s) en attente de relecture.</p>
      </header>

      {fiches.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">File vide : tout est traité 👌</CardContent></Card>
      )}

      <div className="space-y-4">
        {fiches.map((f) => (
          <Card key={f.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">{f.titre}</CardTitle>
                <Badge variant="outline">{OPALE_MODULES_LABELS[f.module_opale]} · Op@le {f.version_opale_concernee}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Symptôme</p>
                <p className="whitespace-pre-wrap">{f.symptome_observe || "—"}</p>
              </div>
              {f.cause_identifiee && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Cause</p>
                  <p className="whitespace-pre-wrap">{f.cause_identifiee}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => decider(f, "publiee")}>
                  <Check className="h-4 w-4 mr-1" /> Approuver et publier
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelection(selection === f.id ? null : f.id)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Demander des modifs
                </Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  if (!motif && selection !== f.id) { setSelection(f.id); toast.info("Indiquez un motif de rejet"); return; }
                  decider(f, "rejetee");
                }}>
                  <X className="h-4 w-4 mr-1" /> Rejeter
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/ressources/opale/fiche/${f.slug}`}>Aperçu</Link>
                </Button>
              </div>
              {selection === f.id && (
                <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif de rejet ou demande de modification…" rows={3} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}