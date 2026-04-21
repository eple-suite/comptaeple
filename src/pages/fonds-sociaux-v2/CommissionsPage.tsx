// ═══════════════════════════════════════════════════════════════
// Page Commissions fonds social — liste + dialog création
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, ClipboardCheck, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommissions, useUpsertCommission } from "./useFsData";
import { currentAnneeScolaire, type FsCommission } from "./fsv2Types";
import { toast } from "sonner";

export default function CommissionsPage() {
  const { data: commissions = [], isLoading } = useCommissions();
  const upsert = useUpsertCommission();
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<FsCommission["type"]>("ordinaire");
  const [annee, setAnnee] = useState(currentAnneeScolaire());
  const [observations, setObservations] = useState("");
  const [membresText, setMembresText] = useState("");

  async function handleSave() {
    if (!date) return toast.error("Date requise");
    const membres = membresText.split("\n").filter(l => l.trim()).map(l => {
      const [nom, qualite] = l.split("—").map(s => s?.trim() ?? "");
      return { nom: nom || l, qualite: qualite || "Membre" };
    });
    try {
      await upsert.mutateAsync({
        date_commission: date, type, annee_scolaire: annee,
        observations, membres_presents: membres,
      });
      toast.success("Commission enregistrée");
      setOpen(false); setObservations(""); setMembresText("");
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/fonds-sociaux/v2"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display">Commissions fonds social</h1>
          <p className="text-sm text-muted-foreground">{commissions.length} commission(s) enregistrée(s)</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle commission</Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : commissions.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
          Aucune commission enregistrée.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commissions.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{new Date(c.date_commission).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                    <div className="text-xs text-muted-foreground">{c.annee_scolaire}</div>
                  </div>
                  <Badge variant={c.type === "urgence" ? "destructive" : c.type === "extraordinaire" ? "secondary" : "outline"}>{c.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Membres présents : </span>{(c.membres_presents ?? []).length}</div>
                <div><span className="text-muted-foreground">Dossiers examinés : </span>{c.dossiers_examines_count}</div>
                {c.observations && <p className="text-xs text-muted-foreground line-clamp-3">{c.observations}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle commission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div><Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as FsCommission["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaire">Ordinaire</SelectItem>
                    <SelectItem value="extraordinaire">Extraordinaire</SelectItem>
                    <SelectItem value="urgence">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Année scolaire</Label><Input value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2025-2026" /></div>
            <div>
              <Label>Membres présents (un par ligne, format « Nom — Qualité »)</Label>
              <Textarea rows={4} value={membresText} onChange={e => setMembresText(e.target.value)} placeholder="Mme Dupont — Proviseure&#10;M. Martin — Agent comptable&#10;Mme Leroy — CPE" />
            </div>
            <div><Label>Observations</Label><Textarea rows={3} value={observations} onChange={e => setObservations(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}