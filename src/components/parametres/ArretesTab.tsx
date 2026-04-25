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
import { FileSignature, Plus, Eye, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACTE_TYPES, ActeContext, ActeType, buildActeHtml, hashContent, printActeHtml } from "@/lib/parametres/actesGenerator";

type Acte = {
  id: string;
  type: ActeType;
  date_signature: string;
  date_effet: string | null;
  agent_concerne_id: string | null;
  signataire_id: string | null;
  statut: string | null;
  contenu_hash: string | null;
  payload: any;
};
type AgentLite = { id: string; nom: string; prenom: string };

/** Arrêtés & actes — générateur + archivage horodaté SHA-256 */
export default function ArretesTab() {
  const [rows, setRows] = useState<Acte[]>([]);
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [groupement, setGroupement] = useState<{ nom: string; academie: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ActeContext> & { agentId?: string; signataireId?: string }>({
    type: "delegation_signature_ordo",
    dateSignature: new Date().toISOString().slice(0, 10),
  });

  const reload = async () => {
    const [actes, ags, g] = await Promise.all([
      supabase.from("arretes_actes").select("*").order("date_signature", { ascending: false }).limit(50),
      supabase.from("agents").select("id,nom,prenom").eq("actif", true).order("nom"),
      supabase.from("groupements_comptables").select("nom,academie").limit(1).maybeSingle(),
    ]);
    setRows((actes.data || []) as any);
    setAgents((ags.data || []) as any);
    setGroupement(g.data as any);
  };
  useEffect(() => { reload(); }, []);

  const previewHtml = useMemo(() => {
    if (!groupement || !form.type) return "";
    const a = agents.find((x) => x.id === form.agentId);
    const s = agents.find((x) => x.id === form.signataireId);
    const ctx: ActeContext = {
      type: form.type as ActeType,
      groupementNom: groupement.nom,
      academie: groupement.academie,
      dateSignature: form.dateSignature || new Date().toISOString().slice(0, 10),
      dateEffet: form.dateEffet,
      dateFin: form.dateFin,
      agentNom: a?.nom, agentPrenom: a?.prenom, agentFonction: form.agentFonction,
      suppleantNom: form.suppleantNom,
      perimetre: form.perimetre,
      montantMax: form.montantMax,
      plafondEncaisse: form.plafondEncaisse,
      modeEncaissement: form.modeEncaissement,
      indemniteManiementFonds: form.indemniteManiementFonds,
      signataireNom: s ? `${s.prenom} ${s.nom}` : form.signataireNom,
      signataireFonction: form.signataireFonction || "Le chef d'établissement",
      etablissementNom: form.etablissementNom,
    };
    return buildActeHtml(ctx);
  }, [form, agents, groupement]);

  const enregistrer = async () => {
    if (!form.type || !form.dateSignature) { toast.error("Type et date requis."); return; }
    const html = previewHtml;
    const hash = await hashContent(html);
    const { error } = await supabase.from("arretes_actes").insert({
      type: form.type as any,
      date_signature: form.dateSignature,
      date_effet: form.dateEffet ?? null,
      date_fin_effet: form.dateFin ?? null,
      agent_concerne_id: form.agentId ?? null,
      signataire_id: form.signataireId ?? null,
      statut: "signe",
      contenu_hash: hash,
      payload: form,
      references_reglementaires: "GBCP 2012-1246, instruction 06-031-A-B-M, RGP 2022-408",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Acte archivé (hash SHA-256 généré)");
    setOpen(false);
    reload();
  };

  const apercu = (a: Acte) => {
    const html = buildActeHtml({
      type: a.type,
      groupementNom: groupement?.nom || "Groupement",
      academie: groupement?.academie || "",
      dateSignature: a.date_signature,
      ...((a.payload as any) || {}),
    });
    printActeHtml(html);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-primary" /><CardTitle className="text-base">Générateur d'arrêtés (13 types)</CardTitle></div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nouvel acte</Button></DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Générer un acte administratif</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><Label className="text-xs">Type d'acte</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActeType })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{ACTE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Date de signature</Label><Input type="date" value={form.dateSignature ?? ""} onChange={(e) => setForm({ ...form, dateSignature: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Date d'effet</Label><Input type="date" value={form.dateEffet ?? ""} onChange={(e) => setForm({ ...form, dateEffet: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Date de fin (le cas échéant)</Label><Input type="date" value={form.dateFin ?? ""} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Établissement (optionnel)</Label><Input value={form.etablissementNom ?? ""} onChange={(e) => setForm({ ...form, etablissementNom: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Agent concerné</Label>
                    <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Signataire</Label>
                    <Select value={form.signataireId} onValueChange={(v) => setForm({ ...form, signataireId: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Fonction du signataire</Label><Input value={form.signataireFonction ?? ""} onChange={(e) => setForm({ ...form, signataireFonction: e.target.value })} className="mt-1" placeholder="Le chef d'établissement" /></div>
                  <div><Label className="text-xs">Suppléant (régies)</Label><Input value={form.suppleantNom ?? ""} onChange={(e) => setForm({ ...form, suppleantNom: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Plafond / Encaisse (€)</Label><Input type="number" value={form.plafondEncaisse ?? ""} onChange={(e) => setForm({ ...form, plafondEncaisse: e.target.value ? Number(e.target.value) : undefined })} className="mt-1" /></div>
                  <div><Label className="text-xs">Plafond délégation (€)</Label><Input type="number" value={form.montantMax ?? ""} onChange={(e) => setForm({ ...form, montantMax: e.target.value ? Number(e.target.value) : undefined })} className="mt-1" /></div>
                  <div className="md:col-span-2"><Label className="text-xs">Périmètre / Modes d'encaissement</Label><Textarea rows={2} value={form.perimetre ?? ""} onChange={(e) => setForm({ ...form, perimetre: e.target.value })} className="mt-1" /></div>
                </div>
                <div className="flex justify-between gap-2 mt-3">
                  <Button variant="outline" onClick={() => printActeHtml(previewHtml)} className="gap-1"><Eye className="h-4 w-4" /> Aperçu A4</Button>
                  <div className="flex gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={enregistrer}>Archiver l'acte</Button></div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Signature</TableHead><TableHead>Effet</TableHead>
              <TableHead>Hash</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{ACTE_TYPES.find((t) => t.value === a.type)?.label ?? a.type}</TableCell>
                  <TableCell className="text-xs">{a.date_signature}</TableCell>
                  <TableCell className="text-xs">{a.date_effet ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[10px] truncate max-w-[140px]">{a.contenu_hash?.slice(0, 16)}…</TableCell>
                  <TableCell><Badge variant="outline">{a.statut ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => apercu(a)} className="gap-1"><Printer className="h-4 w-4" /> Imprimer</Button></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Aucun acte archivé.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}