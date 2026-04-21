// ═══════════════════════════════════════════════════════════════
// Modale ajout / édition d'un élève
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUpsertEleve } from "./useFsData";
import {
  FsEleve, ResponsableLegal, Voie, currentAnneeScolaire,
} from "./fsv2Types";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial?: FsEleve | null;
}

export function EleveFormDialog({ open, onOpenChange, initial }: Props) {
  const upsert = useUpsertEleve();
  const [form, setForm] = useState<Partial<FsEleve>>({});
  const [responsables, setResponsables] = useState<ResponsableLegal[]>([]);

  useEffect(() => {
    if (open) {
      setForm(initial ?? {
        voie: "GT" as Voie,
        statut_boursier: false,
        demi_pensionnaire: true,
        interne: false,
        actif: true,
        annee_scolaire: currentAnneeScolaire(),
      });
      setResponsables(initial?.responsables_legaux ?? []);
    }
  }, [open, initial]);

  const submit = async () => {
    if (!form.nom || !form.prenom) {
      toast.error("Nom et prénom obligatoires");
      return;
    }
    try {
      await upsert.mutateAsync({ ...(form as any), responsables_legaux: responsables });
      toast.success(initial ? "Élève mis à jour" : "Élève créé");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    }
  };

  const addResp = () =>
    setResponsables([...responsables, { nom: "", prenom: "", lien: "mère" }]);
  const removeResp = (i: number) =>
    setResponsables(responsables.filter((_, j) => j !== i));
  const updateResp = (i: number, patch: Partial<ResponsableLegal>) =>
    setResponsables(responsables.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier l'élève" : "Ajouter un élève"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>INE</Label>
              <Input value={form.ine ?? ""} onChange={e => setForm({ ...form, ine: e.target.value })} />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input type="date" value={form.date_naissance ?? ""} onChange={e => setForm({ ...form, date_naissance: e.target.value })} />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={form.nom ?? ""} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <Label>Prénom *</Label>
              <Input value={form.prenom ?? ""} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div>
              <Label>Classe</Label>
              <Input value={form.classe ?? ""} onChange={e => setForm({ ...form, classe: e.target.value })} placeholder="2nde B" />
            </div>
            <div>
              <Label>Niveau</Label>
              <Input value={form.niveau ?? ""} onChange={e => setForm({ ...form, niveau: e.target.value })} placeholder="Seconde" />
            </div>
            <div className="col-span-2">
              <Label>Voie</Label>
              <RadioGroup value={form.voie ?? "GT"} onValueChange={v => setForm({ ...form, voie: v as Voie })} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="GT" id="v-gt" /><Label htmlFor="v-gt" className="font-normal">Générale & Techno</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="PRO" id="v-pro" /><Label htmlFor="v-pro" className="font-normal">Professionnelle</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="1er_degre" id="v-1d" /><Label htmlFor="v-1d" className="font-normal">1er degré</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Filière</Label>
              <Input value={form.filiere ?? ""} onChange={e => setForm({ ...form, filiere: e.target.value })} placeholder="STMG" />
            </div>
            <div>
              <Label>Année scolaire</Label>
              <Input value={form.annee_scolaire ?? ""} onChange={e => setForm({ ...form, annee_scolaire: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Switch checked={!!form.statut_boursier} onCheckedChange={v => setForm({ ...form, statut_boursier: v })} />
              <Label className="cursor-pointer">Boursier</Label>
            </div>
            {form.statut_boursier && (
              <div>
                <Label className="text-xs">Échelon</Label>
                <Select value={String(form.echelon_bourse ?? "")} onValueChange={v => setForm({ ...form, echelon_bourse: Number(v) })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={String(n)}>Échelon {n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={!!form.demi_pensionnaire} onCheckedChange={v => setForm({ ...form, demi_pensionnaire: v })} />
              <Label className="cursor-pointer">Demi-pensionnaire</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.interne} onCheckedChange={v => setForm({ ...form, interne: v })} />
              <Label className="cursor-pointer">Interne</Label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Responsables légaux</Label>
              <Button size="sm" variant="outline" onClick={addResp}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {responsables.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 rounded bg-muted/20">
                  <Input className="col-span-3" placeholder="Nom" value={r.nom} onChange={e => updateResp(i, { nom: e.target.value })} />
                  <Input className="col-span-3" placeholder="Prénom" value={r.prenom} onChange={e => updateResp(i, { prenom: e.target.value })} />
                  <Select value={r.lien} onValueChange={v => updateResp(i, { lien: v })}>
                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mère">Mère</SelectItem>
                      <SelectItem value="père">Père</SelectItem>
                      <SelectItem value="tuteur">Tuteur</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="col-span-2" placeholder="Téléphone" value={r.telephone ?? ""} onChange={e => updateResp(i, { telephone: e.target.value })} />
                  <Input className="col-span-1" placeholder="Email" value={r.email ?? ""} onChange={e => updateResp(i, { email: e.target.value })} />
                  <Button size="sm" variant="ghost" className="col-span-1" onClick={() => removeResp(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {responsables.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">Aucun responsable renseigné</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={submit} disabled={upsert.isPending}>
              {upsert.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}