import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertTriangle, CheckCircle2, Clock, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isDelegationExpired, isDelegationExpiringSoon } from "@/lib/parametres/validations";

type Delegation = {
  id: string;
  agent_delegant_id: string;
  agent_delegataire_id: string;
  type_delegation: string;
  perimetre: string | null;
  montant_max: number | null;
  date_debut: string;
  date_fin: string | null;
  statut: string;
  motif_abrogation: string | null;
};
type AgentLite = { id: string; nom: string; prenom: string };

const TYPES = [
  { v: "ordonnateur_general", l: "Délégation ordonnateur générale (R.421-13)" },
  { v: "ordonnateur_partiel", l: "Délégation ordonnateur partielle" },
  { v: "ac", l: "Délégation agent comptable (GBCP art. 16)" },
  { v: "fonde_pouvoir", l: "Fondé de pouvoir" },
  { v: "mandataire", l: "Mandataire" },
];

/**
 * Délégations de signature — registre actif
 * Réf : Code éducation R.421-13, GBCP 2012-1246 art. 16
 */
export default function DelegationsTab() {
  const [rows, setRows] = useState<Delegation[]>([]);
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Delegation>>({
    type_delegation: "ordonnateur_partiel",
    date_debut: new Date().toISOString().slice(0, 10),
    statut: "active",
  });

  const reload = async () => {
    const [d, a] = await Promise.all([
      supabase.from("delegations_signature").select("*").order("date_debut", { ascending: false }),
      supabase.from("agents").select("id,nom,prenom").eq("actif", true).order("nom"),
    ]);
    setRows((d.data || []) as any);
    setAgents((a.data || []) as any);
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const today = new Date();
    let active = 0, expSoon = 0, expired = 0;
    for (const r of rows) {
      if (r.statut === "abrogee") continue;
      if (isDelegationExpired(r.date_fin, today)) expired++;
      else if (isDelegationExpiringSoon(r.date_fin, 30, today)) expSoon++;
      else active++;
    }
    return { active, expSoon, expired };
  }, [rows]);

  const save = async () => {
    if (!form.agent_delegant_id || !form.agent_delegataire_id || !form.type_delegation || !form.date_debut) {
      toast.error("Champs obligatoires : délégant, délégataire, type, date de début.");
      return;
    }
    if (form.agent_delegant_id === form.agent_delegataire_id) {
      toast.error("Le délégant et le délégataire doivent être deux agents distincts.");
      return;
    }
    const { error } = await supabase.from("delegations_signature").insert({
      agent_delegant_id: form.agent_delegant_id!,
      agent_delegataire_id: form.agent_delegataire_id!,
      type_delegation: form.type_delegation as any,
      perimetre: form.perimetre ?? null,
      montant_max: form.montant_max ?? null,
      date_debut: form.date_debut!,
      date_fin: form.date_fin ?? null,
      statut: "active",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Délégation enregistrée");
    setOpen(false);
    setForm({ type_delegation: "ordonnateur_partiel", date_debut: new Date().toISOString().slice(0, 10), statut: "active" });
    reload();
  };

  const abroger = async (id: string) => {
    const motif = window.prompt("Motif d'abrogation :", "Fin de fonction") || "Abrogation";
    const { error } = await supabase.from("delegations_signature").update({
      statut: "abrogee", motif_abrogation: motif, date_fin: new Date().toISOString().slice(0, 10),
    }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Délégation abrogée"); reload(); }
  };

  const agentLabel = (id: string) => {
    const a = agents.find((x) => x.id === id);
    return a ? `${a.prenom} ${a.nom}` : "—";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><div className="text-2xl font-semibold">{stats.active}</div><div className="text-xs text-muted-foreground">Délégations actives</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-5 w-5 text-amber-600" /><div><div className="text-2xl font-semibold">{stats.expSoon}</div><div className="text-xs text-muted-foreground">Expirent &lt; 30 jours</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><div className="text-2xl font-semibold">{stats.expired}</div><div className="text-xs text-muted-foreground">Expirées non abrogées</div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Registre des délégations de signature</CardTitle>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nouvelle délégation</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Nouvelle délégation de signature</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Délégant</Label>
                    <Select value={form.agent_delegant_id} onValueChange={(v) => setForm({ ...form, agent_delegant_id: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Délégataire</Label>
                    <Select value={form.agent_delegataire_id} onValueChange={(v) => setForm({ ...form, agent_delegataire_id: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2"><Label className="text-xs">Type</Label>
                    <Select value={form.type_delegation} onValueChange={(v) => setForm({ ...form, type_delegation: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Date de début</Label>
                    <Input type="date" value={form.date_debut ?? ""} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className="mt-1" />
                  </div>
                  <div><Label className="text-xs">Date de fin (vide = indéterminée)</Label>
                    <Input type="date" value={form.date_fin ?? ""} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className="mt-1" />
                  </div>
                  <div><Label className="text-xs">Plafond financier (€)</Label>
                    <Input type="number" value={form.montant_max ?? ""} onChange={(e) => setForm({ ...form, montant_max: e.target.value ? Number(e.target.value) : null })} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2"><Label className="text-xs">Périmètre</Label>
                    <Textarea rows={2} value={form.perimetre ?? ""} onChange={(e) => setForm({ ...form, perimetre: e.target.value })} className="mt-1" placeholder="Actes de gestion courante, marchés < 25 000 €…" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button onClick={save}>Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Délégant</TableHead><TableHead>Délégataire</TableHead>
              <TableHead>Période</TableHead><TableHead className="text-right">Plafond</TableHead>
              <TableHead>Statut</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => {
                const expired = isDelegationExpired(r.date_fin);
                const soon = isDelegationExpiringSoon(r.date_fin, 30);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{TYPES.find((t) => t.v === r.type_delegation)?.l ?? r.type_delegation}</TableCell>
                    <TableCell>{agentLabel(r.agent_delegant_id)}</TableCell>
                    <TableCell>{agentLabel(r.agent_delegataire_id)}</TableCell>
                    <TableCell className="text-xs">{r.date_debut} → {r.date_fin ?? "indéterminée"}</TableCell>
                    <TableCell className="text-right text-xs">{r.montant_max != null ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(r.montant_max) : "—"}</TableCell>
                    <TableCell>
                      {r.statut === "abrogee" ? <Badge variant="secondary">Abrogée</Badge>
                        : expired ? <Badge variant="destructive">Expirée</Badge>
                        : soon ? <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Expire bientôt</Badge>
                        : <Badge variant="outline" className="text-emerald-700 border-emerald-300">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.statut !== "abrogee" && <Button size="sm" variant="ghost" onClick={() => abroger(r.id)}>Abroger</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Aucune délégation enregistrée.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}