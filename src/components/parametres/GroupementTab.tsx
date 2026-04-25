import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Building2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Groupement = {
  id: string;
  nom: string;
  academie: string;
  rectorat_libelle: string;
  code_groupement: string | null;
  region_academique: string | null;
  date_creation_arrete: string | null;
  arrete_constitutif_url: string | null;
  agent_comptable_titulaire: string | null;
  agent_comptable_prise_fonction: string | null;
  fonde_de_pouvoir: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  notes: string | null;
  perimetre_actif: boolean | null;
};

/**
 * Carte d'identité du groupement comptable
 * Réf : décret GBCP 2012-1246 art. 86, Code éducation R.421-77
 */
export default function GroupementTab() {
  const [g, setG] = useState<Groupement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("groupements_comptables")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setG(data as any);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!g) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("groupements_comptables")
        .update({
          nom: g.nom,
          academie: g.academie,
          rectorat_libelle: g.rectorat_libelle,
          code_groupement: g.code_groupement,
          region_academique: g.region_academique,
          date_creation_arrete: g.date_creation_arrete,
          arrete_constitutif_url: g.arrete_constitutif_url,
          agent_comptable_titulaire: g.agent_comptable_titulaire,
          agent_comptable_prise_fonction: g.agent_comptable_prise_fonction,
          fonde_de_pouvoir: g.fonde_de_pouvoir,
          adresse: g.adresse,
          telephone: g.telephone,
          email: g.email,
          notes: g.notes,
        })
        .eq("id", g.id);
      if (error) throw error;
      toast.success("Carte d'identité du groupement enregistrée");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>;
  if (!g) return <p className="text-sm text-muted-foreground">Aucun groupement comptable enregistré. Créez-en un via la migration ou le module d'administration.</p>;

  const set = <K extends keyof Groupement>(k: K, v: Groupement[K]) => setG({ ...g, [k]: v });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Carte d'identité du groupement</CardTitle>
            </div>
            <Badge variant="outline" className="gap-1"><Scale className="h-3 w-3" /> GBCP art. 86</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom officiel" value={g.nom} onChange={(v) => set("nom", v)} />
          <Field label="Code groupement" value={g.code_groupement ?? ""} onChange={(v) => set("code_groupement", v)} placeholder="ex : 971-GC-001" />
          <Field label="Rectorat" value={g.rectorat_libelle} onChange={(v) => set("rectorat_libelle", v)} />
          <Field label="Académie" value={g.academie} onChange={(v) => set("academie", v)} />
          <Field label="Région académique" value={g.region_academique ?? ""} onChange={(v) => set("region_academique", v)} />
          <Field label="Date de création (arrêté constitutif)" type="date" value={g.date_creation_arrete ?? ""} onChange={(v) => set("date_creation_arrete", v)} />
          <Field label="URL arrêté constitutif" value={g.arrete_constitutif_url ?? ""} onChange={(v) => set("arrete_constitutif_url", v)} placeholder="https://…" />
          <Field label="Téléphone" value={g.telephone ?? ""} onChange={(v) => set("telephone", v)} />
          <Field label="E-mail" value={g.email ?? ""} onChange={(v) => set("email", v)} />
          <div className="md:col-span-2">
            <Label className="text-xs">Adresse postale</Label>
            <Textarea value={g.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} rows={2} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gouvernance comptable</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Agent comptable titulaire" value={g.agent_comptable_titulaire ?? ""} onChange={(v) => set("agent_comptable_titulaire", v)} />
          <Field label="Date de prise de fonction" type="date" value={g.agent_comptable_prise_fonction ?? ""} onChange={(v) => set("agent_comptable_prise_fonction", v)} />
          <Field label="Fondé de pouvoir" value={g.fonde_de_pouvoir ?? ""} onChange={(v) => set("fonde_de_pouvoir", v)} />
          <div className="md:col-span-3">
            <Label className="text-xs">Notes internes</Label>
            <Textarea value={g.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer le groupement
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}