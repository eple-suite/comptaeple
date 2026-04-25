import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ThumbsUp, ThumbsDown, Flag, Eye } from "lucide-react";
import { toast } from "sonner";
import type { OpaleFiche } from "@/lib/opale/types";
import { OPALE_MODULES_LABELS, OPALE_TYPES_LABELS } from "@/lib/opale/types";
import { BadgeActualite, BadgeVersion, BadgeVisibilite } from "@/components/opale/StatutBadges";
import { RappelOfficielBanner } from "@/components/opale/RappelOfficielBanner";
import { logOpaleAcces, logOpaleConsultation } from "@/lib/opale/access";

export default function OpaleFicheDetail() {
  const { slug } = useParams();
  const [fiche, setFiche] = useState<OpaleFiche | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from("opale_fiches").select("*").eq("slug", slug).maybeSingle();
      if (data) {
        setFiche(data as unknown as OpaleFiche);
        await logOpaleConsultation((data as { id: string }).id);
      }
      setLoading(false);
    })();
  }, [slug]);

  const evaluer = async (vote: "utile" | "pas_utile") => {
    if (!fiche) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Connexion requise"); return; }
    const { error } = await supabase.from("opale_fiches_evaluations").upsert({
      fiche_id: fiche.id, evaluateur_id: user.id, vote,
    }, { onConflict: "fiche_id,evaluateur_id" });
    if (error) { toast.error(error.message); return; }
    await logOpaleAcces(vote === "utile" ? "evaluation_utile" : "evaluation_pas_utile", { cible_type: "fiche", cible_id: fiche.id });
    toast.success("Merci pour votre évaluation");
  };

  if (loading) return <div className="container py-8">Chargement...</div>;
  if (!fiche) return <div className="container py-8">Fiche introuvable.</div>;

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale/bibliotheque"><ArrowLeft className="h-4 w-4 mr-1" /> Bibliothèque</Link>
      </Button>

      <header className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <BadgeActualite statut={fiche.statut_actualite} />
          <BadgeVersion version={fiche.version_opale_concernee} />
          <BadgeVisibilite visibilite={fiche.visibilite} />
        </div>
        <h1 className="font-display text-3xl font-bold">{fiche.titre}</h1>
        <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
          <span>{OPALE_MODULES_LABELS[fiche.module_opale]} · {OPALE_TYPES_LABELS[fiche.type_contenu]}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {fiche.nb_consultations} consultations</span>
          <span>Utilité : {fiche.taux_utilite_pct}%</span>
        </div>
      </header>

      <RappelOfficielBanner />

      {fiche.symptome_observe && (
        <Card><CardHeader><CardTitle className="text-base">Symptôme observé</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{fiche.symptome_observe}</CardContent></Card>
      )}
      {fiche.contexte_apparition && (
        <Card><CardHeader><CardTitle className="text-base">Contexte</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{fiche.contexte_apparition}</CardContent></Card>
      )}
      {fiche.cause_identifiee && (
        <Card><CardHeader><CardTitle className="text-base">Cause identifiée</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{fiche.cause_identifiee}</CardContent></Card>
      )}
      {fiche.procedure_resolution?.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Procédure de résolution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fiche.procedure_resolution.map((e) => (
              <div key={e.numero} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm font-semibold">Étape {e.numero}</p>
                <p className="text-sm whitespace-pre-wrap">{e.description}</p>
                {e.vigilance && <p className="text-xs text-warning mt-1">⚠ {e.vigilance}</p>}
              </div>
            ))}
          </CardContent></Card>
      )}
      {fiche.references_documentation_officielle && (
        <Card><CardHeader><CardTitle className="text-base">Références documentation officielle</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{fiche.references_documentation_officielle}</CardContent></Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => evaluer("utile")}><ThumbsUp className="h-4 w-4 mr-1" /> Utile</Button>
        <Button variant="outline" onClick={() => evaluer("pas_utile")}><ThumbsDown className="h-4 w-4 mr-1" /> Pas utile</Button>
        <Button variant="outline" onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from("opale_fiches_signalements").insert({
            fiche_id: fiche.id, signaleur_id: user.id, motif: "obsolete",
          });
          toast.success("Signalement transmis aux modérateurs");
        }}><Flag className="h-4 w-4 mr-1" /> Signaler obsolète</Button>
      </div>
    </div>
  );
}