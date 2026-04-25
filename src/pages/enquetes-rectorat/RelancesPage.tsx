import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { Send, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CampagneRow {
  id: string; intitule: string; statut: string;
  date_echeance: string; type_enquete: string;
}

interface ReponseRow {
  id: string; campagne_id: string; establishment_id: string;
  statut: string; soumise_le: string | null;
}

interface EtablissementRow {
  id: string; name: string; uai: string | null;
}

export default function RelancesPage() {
  const [campagnes, setCampagnes] = useState<CampagneRow[]>([]);
  const [reponses, setReponses] = useState<ReponseRow[]>([]);
  const [eples, setEples] = useState<EtablissementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("enquetes_campagnes").select("*").order("date_echeance", { ascending: true }),
      supabase.from("enquetes_reponses_eple").select("*"),
      supabase.from("establishments").select("id, name, uai"),
    ]).then(([c, r, e]) => {
      setCampagnes((c.data ?? []) as CampagneRow[]);
      setReponses((r.data ?? []) as ReponseRow[]);
      setEples((e.data ?? []) as EtablissementRow[]);
      setLoading(false);
    });
  }, []);

  function relancer(campagne: CampagneRow, eple: EtablissementRow) {
    const sujet = encodeURIComponent(`[Relance] ${campagne.intitule}`);
    const corps = encodeURIComponent(
      `Bonjour,\n\n` +
      `La campagne « ${campagne.intitule} » est due au plus tard le ${campagne.date_echeance}.\n` +
      `Votre EPLE (${eple.name} / UAI ${eple.uai ?? "—"}) n'a pas encore soumis de réponse.\n\n` +
      `Merci de procéder à la saisie sur la plateforme.\n\n` +
      `Bien cordialement,\n` +
      `Le service Enquêtes — Plateforme académique`,
    );
    window.open(`mailto:?subject=${sujet}&body=${corps}`);
    toast.success(`Relance préparée pour ${eple.name}`);
  }

  function getStatutEple(campagneId: string, epleId: string): string {
    const r = reponses.find((x) => x.campagne_id === campagneId && x.establishment_id === epleId);
    return r?.statut ?? "non_commencee";
  }

  if (loading) return <div className="p-6 text-muted-foreground">Chargement…</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={Send}
        title="Suivi & relances internes"
        description="Tableau de pilotage AC → ordonnateurs avec relances individualisées."
      />

      {campagnes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Aucune campagne active. Lancez-en depuis la <a className="underline" href="/enquetes-rectorat/bibliotheque">bibliothèque</a>.
          </CardContent>
        </Card>
      )}

      {campagnes.map((c) => {
        const echeance = new Date(c.date_echeance);
        const joursRestants = Math.ceil((echeance.getTime() - Date.now()) / 86400000);
        const enRetard = joursRestants < 0;
        return (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{c.intitule}</CardTitle>
                  <CardDescription>
                    Type : {c.type_enquete} · Échéance : {c.date_echeance}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={c.statut === "ouverte" ? "default" : "outline"}>{c.statut}</Badge>
                  <Badge variant={enRetard ? "destructive" : "secondary"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {enRetard ? `${Math.abs(joursRestants)}j de retard` : `J-${joursRestants}`}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPLE</TableHead>
                    <TableHead>UAI</TableHead>
                    <TableHead>Statut réponse</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eples.map((e) => {
                    const st = getStatutEple(c.id, e.id);
                    const need = ["non_commencee", "en_cours"].includes(st);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{e.name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.uai ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={st === "validee" ? "default" : need ? "destructive" : "secondary"}>
                            {st}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {need && (
                            <Button size="sm" variant="outline" onClick={() => relancer(c, e)}>
                              <Mail className="h-3 w-3 mr-1" />Relancer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}