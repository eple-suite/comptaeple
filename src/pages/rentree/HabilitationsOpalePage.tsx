import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Building2, Eye, FileText, Lock } from "lucide-react";
import {
  type HabilitationOpale,
  type SphereOpale,
  PROFILS_OPALE_ORDONNATEUR,
  PROFILS_OPALE_COMPTABLE,
} from "./types";

const STATUT_LABEL: Record<HabilitationOpale["statut"], string> = {
  en_attente_signature: "En attente signature",
  active: "Active",
  a_revoquer: "À révoquer",
  revoquee: "Révoquée",
  archivee: "Archivée",
};

function SphereSection({ sphere }: { sphere: SphereOpale }) {
  const { selectedEstablishment } = useEstablishment();
  const qc = useQueryClient();
  const { toast } = useToast();
  const profils = sphere === "ordonnateur" ? PROFILS_OPALE_ORDONNATEUR : PROFILS_OPALE_COMPTABLE;
  const [draft, setDraft] = useState<{ agent_nom: string; profil: string; date_souhaitee: string }>({
    agent_nom: "",
    profil: profils[0],
    date_souhaitee: "",
  });

  const { data: habilitations = [] } = useQuery({
    queryKey: ["habilitations", sphere, selectedEstablishment?.id],
    enabled: !!selectedEstablishment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habilitations_opale")
        .select("*")
        .eq("establishment_id", selectedEstablishment!.id)
        .eq("sphere", sphere)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HabilitationOpale[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!selectedEstablishment) throw new Error("Aucun établissement");
      // Garde-fou : un agent ne peut être ordo + comptable du même EPLE
      const opposite: SphereOpale = sphere === "ordonnateur" ? "comptable" : "ordonnateur";
      const { data: conflit } = await supabase
        .from("habilitations_opale")
        .select("id")
        .eq("establishment_id", selectedEstablishment.id)
        .eq("sphere", opposite)
        .eq("agent_nom", draft.agent_nom)
        .eq("statut", "active")
        .maybeSingle();
      if (conflit) {
        throw new Error(
          `${draft.agent_nom} est déjà actif dans la sphère ${opposite} pour cet EPLE. Séparation des fonctions GBCP art. 9.`,
        );
      }
      const { error } = await supabase.from("habilitations_opale").insert({
        establishment_id: selectedEstablishment.id,
        agent_nom: draft.agent_nom,
        sphere,
        profil_opale: draft.profil,
        date_activation_souhaitee: draft.date_souhaitee || null,
        statut: "en_attente_signature",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Habilitation créée", description: "En attente de signature." });
      qc.invalidateQueries({ queryKey: ["habilitations"] });
      setDraft({ agent_nom: "", profil: profils[0], date_souhaitee: "" });
    },
    onError: (e: Error) => toast({ title: "Refus", description: e.message, variant: "destructive" }),
  });

  const sign = useMutation({
    mutationFn: async (id: string) => {
      const { data: u } = await supabase.auth.getUser();
      const champSignature = sphere === "ordonnateur" ? "signe_par_ordonnateur_id" : "signe_par_ac_id";
      const champDate = sphere === "ordonnateur" ? "date_signature_ordonnateur" : "date_signature_ac";
      const { error } = await supabase
        .from("habilitations_opale")
        .update({
          [champSignature]: u.user?.id ?? null,
          [champDate]: new Date().toISOString(),
          statut: "active",
          date_activation_effective: new Date().toISOString().slice(0, 10),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Habilitation signée et activée" });
      qc.invalidateQueries({ queryKey: ["habilitations"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("habilitations_opale")
        .update({
          statut: "revoquee",
          date_revocation_effective: new Date().toISOString().slice(0, 10),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Habilitation révoquée" });
      qc.invalidateQueries({ queryKey: ["habilitations"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Nouvelle habilitation — sphère {sphere}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label>Agent (nom prénom)</Label>
            <Input value={draft.agent_nom} onChange={e => setDraft(d => ({ ...d, agent_nom: e.target.value }))} />
          </div>
          <div>
            <Label>Profil Op@le</Label>
            <Select value={draft.profil} onValueChange={v => setDraft(d => ({ ...d, profil: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {profils.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activation souhaitée</Label>
            <Input type="date" value={draft.date_souhaitee} onChange={e => setDraft(d => ({ ...d, date_souhaitee: e.target.value }))} />
          </div>
          <div className="md:col-span-4">
            <Button onClick={() => create.mutate()} disabled={!draft.agent_nom || create.isPending}>
              Créer la demande d'habilitation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Habilitations existantes ({habilitations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {habilitations.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune habilitation pour la sphère {sphere}.</p>
          )}
          {habilitations.map(h => (
            <div key={h.id} className="flex items-center justify-between border-b py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{h.agent_nom}</div>
                <div className="text-xs text-muted-foreground">{h.profil_opale}</div>
              </div>
              <Badge variant="outline">{STATUT_LABEL[h.statut]}</Badge>
              {h.statut === "en_attente_signature" && (
                <Button size="sm" variant="outline" className="ml-2" onClick={() => sign.mutate(h.id)}>
                  Signer
                </Button>
              )}
              {h.statut === "active" && (
                <Button size="sm" variant="ghost" className="ml-2 text-destructive" onClick={() => revoke.mutate(h.id)}>
                  Révoquer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HabilitationsOpalePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTab = (params.get("sphere") as SphereOpale | "recap" | "rectorat") ?? "ordonnateur";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Habilitations Op@le"
        description="Séparation stricte des sphères ordonnateur et comptable (GBCP art. 9). Aucun agent ne peut figurer dans les deux sphères pour le même EPLE."
        icon={ShieldCheck}
      />

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Règle inviolable de séparation des fonctions</AlertTitle>
        <AlertDescription>
          Sphère ordonnateur signée par le chef d'établissement. Sphère comptable signée par l'agent comptable.
          La création d'une habilitation déclenche un contrôle automatique d'incompatibilité.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="ordonnateur"><Building2 className="h-4 w-4 mr-1" />Sphère ordonnateur</TabsTrigger>
          <TabsTrigger value="comptable"><Lock className="h-4 w-4 mr-1" />Sphère comptable</TabsTrigger>
          <TabsTrigger value="recap" onClick={() => navigate("/habilitations/recap")}>
            <FileText className="h-4 w-4 mr-1" />Document récapitulatif
          </TabsTrigger>
          <TabsTrigger value="rectorat" onClick={() => navigate("/habilitations/rectorat")}>
            <Eye className="h-4 w-4 mr-1" />Vue rectorat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordonnateur"><SphereSection sphere="ordonnateur" /></TabsContent>
        <TabsContent value="comptable"><SphereSection sphere="comptable" /></TabsContent>
      </Tabs>
    </div>
  );
}