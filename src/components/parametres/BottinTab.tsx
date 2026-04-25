import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookUser, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Bottin = {
  id: string;
  categorie: string;
  organisme: string;
  correspondant_nom: string | null;
  fonction: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
};

const CATEGORIES = [
  ["rectorat", "Rectorat"], ["dsden", "DSDEN"], ["collectivite", "Collectivité"],
  ["dgfip", "DGFiP"], ["ddfip", "DDFiP / DRFiP"], ["ars", "ARS"],
  ["prefecture", "Préfecture"], ["police", "Police"], ["gendarmerie", "Gendarmerie"],
  ["pompiers", "Pompiers"], ["medecine_scolaire", "Médecine scolaire"],
  ["dsi", "DSI"], ["eafc", "EAFC"], ["autre", "Autre"],
] as const;

/** Bottin institutionnel — annuaire des contacts utiles au groupement */
export default function BottinTab() {
  const [rows, setRows] = useState<Bottin[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Bottin>>({ categorie: "rectorat", actif: true });

  const reload = async () => {
    const { data } = await supabase.from("bottin_institutionnel").select("*").order("categorie").order("organisme");
    setRows((data || []) as any);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.organisme, r.correspondant_nom, r.email, r.fonction].some((v) => (v || "").toLowerCase().includes(s))
    );
  }, [rows, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, Bottin[]>();
    for (const r of filtered) {
      const arr = m.get(r.categorie) || [];
      arr.push(r);
      m.set(r.categorie, arr);
    }
    return m;
  }, [filtered]);

  const save = async () => {
    if (!form.organisme || !form.categorie) { toast.error("Catégorie et organisme requis."); return; }
    const { error } = await supabase.from("bottin_institutionnel").insert({
      categorie: form.categorie as any,
      organisme: form.organisme!,
      correspondant_nom: form.correspondant_nom ?? null,
      fonction: form.fonction ?? null,
      email: form.email ?? null,
      telephone: form.telephone ?? null,
      adresse: form.adresse ?? null,
      notes: form.notes ?? null,
      actif: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Contact ajouté au bottin");
    setOpen(false);
    setForm({ categorie: "rectorat", actif: true });
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce contact ?")) return;
    await supabase.from("bottin_institutionnel").delete().eq("id", id);
    reload();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><BookUser className="h-4 w-4 text-primary" /><CardTitle className="text-base">Bottin institutionnel</CardTitle></div>
            <div className="flex items-center gap-2">
              <div className="relative"><Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-7 w-64" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button></DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader><DialogTitle>Nouveau contact</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Catégorie</Label>
                      <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Organisme</Label><Input value={form.organisme ?? ""} onChange={(e) => setForm({ ...form, organisme: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Correspondant</Label><Input value={form.correspondant_nom ?? ""} onChange={(e) => setForm({ ...form, correspondant_nom: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Fonction</Label><Input value={form.fonction ?? ""} onChange={(e) => setForm({ ...form, fonction: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Téléphone</Label><Input value={form.telephone ?? ""} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="mt-1" /></div>
                    <div className="sm:col-span-2"><Label className="text-xs">Adresse</Label><Input value={form.adresse ?? ""} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={save}>Enregistrer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {grouped.size === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun contact dans le bottin.</p>}
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="uppercase text-[10px]">{CATEGORIES.find(([v]) => v === cat)?.[1] ?? cat}</Badge>
                <span className="text-xs text-muted-foreground">{items.length} contact(s)</span>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Organisme</TableHead><TableHead>Correspondant</TableHead><TableHead>Fonction</TableHead>
                  <TableHead>E-mail</TableHead><TableHead>Téléphone</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.organisme}</TableCell>
                      <TableCell>{r.correspondant_nom || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.fonction || "—"}</TableCell>
                      <TableCell className="text-xs">{r.email || "—"}</TableCell>
                      <TableCell className="text-xs">{r.telephone || "—"}</TableCell>
                      <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}