import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Download, BookOpen } from "lucide-react";
import { REGISTRE_TRAITEMENTS, MENTION_INFORMATION_AGENT, buildDemandeAccesHtml, downloadHtmlAsFile } from "@/lib/parametres/rgpd";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** RGPD — Registre Art. 30, mentions Art. 13/14, génération demande Art. 15 */
export default function RgpdTab() {
  const [matricule, setMatricule] = useState("");

  const exportArt15 = async () => {
    if (!matricule.trim()) { toast.error("Saisissez un matricule EN ou un nom."); return; }
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`matricule_education_nationale.ilike.%${matricule}%,nom.ilike.%${matricule}%`)
      .limit(1);
    const agent = agents?.[0];
    if (!agent) { toast.error("Agent introuvable."); return; }
    const [actes, hist] = await Promise.all([
      supabase.from("arretes_actes").select("type,date_signature,establishment_id").eq("agent_concerne_id", agent.id),
      supabase.from("historique_fonctions").select("role,date_debut,date_fin,motif_changement").eq("agent_id", agent.id),
    ]);
    const html = buildDemandeAccesHtml(agent, { actes: actes.data || [], historique: hist.data || [] });
    downloadHtmlAsFile(html, `rgpd-art15-${agent.nom}-${agent.prenom}.html`);
    await supabase.from("rgpd_acces_logs").insert({ agent_concerne_id: agent.id, type_action: "export_art15", finalite: "Demande d'accès art. 15 RGPD" } as any).then(() => {}, () => {});
    toast.success("Demande d'accès générée");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-base">Registre des traitements (Art. 30 RGPD)</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {REGISTRE_TRAITEMENTS.map((t) => (
            <div key={t.id} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{t.finalite}</h3>
                <Badge variant="outline" className="text-[10px]">{t.reference}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div><strong>Base légale :</strong> {t.baseLegale}</div>
                <div><strong>Conservation :</strong> {t.conservation}</div>
                <div><strong>Destinataires :</strong> {t.destinataires.join(", ")}</div>
              </div>
              <div className="text-xs mt-1"><strong>Données :</strong> {t.donneesCollectees.join(" · ")}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><CardTitle className="text-base">Mention d'information (Art. 13/14 RGPD)</CardTitle></div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md leading-relaxed">{MENTION_INFORMATION_AGENT}</p>
          <p className="text-[10px] text-muted-foreground mt-2 italic">Cette mention doit être affichée à chaque collecte (formulaire d'inscription, fiche agent, etc.).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demande d'accès (Art. 15 RGPD)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Input value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Matricule EN ou nom" className="max-w-xs" />
          <Button onClick={exportArt15} className="gap-1"><Download className="h-4 w-4" /> Générer le rapport d'accès</Button>
          <p className="text-xs text-muted-foreground">Le rapport regroupe toutes les données détenues sur l'agent (identité, statut, actes, historique de fonctions). Trace conservée dans <code>rgpd_acces_logs</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}