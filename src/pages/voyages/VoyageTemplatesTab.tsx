import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";
import { Trash2, Copy, BookTemplate, Plus, MapPin, Users, Euro, Landmark, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/mockData";
import type { Voyage } from "./types";

interface TemplateDB {
  id: string;
  establishment_id: string;
  user_id: string;
  nom: string;
  description: string;
  destination: string;
  pays: string;
  transport_type: string;
  type_voyage: string;
  nb_eleves: number;
  nb_accompagnateurs: number;
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  divers: number;
  regie_avances: number;
  participation_familles: number;
  subvention_collectivite: number;
  subvention_etat: number;
  subvention_autre: number;
  autofinancement: number;
  service_ap: string;
  domaine: string;
  code_activite_gfc: string;
  compte_classe7: string;
  objectif_pedagogique: string;
  classe: string;
  echeances: any;
  created_at: string;
  updated_at: string;
}

const COMPTES_CLASSE7 = [
  { value: "706700", label: "706700 — Participation familles" },
  { value: "706880", label: "706880 — Autres prestations" },
  { value: "741100", label: "741100 — Subvention État" },
  { value: "744200", label: "744200 — Subvention Région" },
  { value: "744300", label: "744300 — Subvention Département" },
  { value: "754000", label: "754000 — Dons privés" },
  { value: "754110", label: "754110 — Versements FSE/AS" },
];

interface VoyageTemplatesTabProps {
  voyages: Voyage[];
  onCreateFromTemplate: (template: TemplateDB) => void;
}

export function VoyageTemplatesTab({ voyages, onCreateFromTemplate }: VoyageTemplatesTabProps) {
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const estId = selectedEstablishment?.id;
  const [createOpen, setCreateOpen] = useState(false);
  const [saveFromVoyageId, setSaveFromVoyageId] = useState<string | null>(null);

  // Form state for manual creation
  const [form, setForm] = useState({
    nom: "", description: "", destination: "", pays: "France",
    transport_type: "bus", type_voyage: "pedagogique",
    nb_eleves: 30, nb_accompagnateurs: 3,
    transport: 0, hebergement: 0, restauration: 0, activites: 0, assurance: 0, divers: 0, regie_avances: 0,
    participation_familles: 0, subvention_collectivite: 0, subvention_etat: 0, subvention_autre: 0, autofinancement: 0,
    service_ap: "AP", domaine: "", code_activite_gfc: "", compte_classe7: "706700",
    objectif_pedagogique: "", classe: "",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["voyage-templates", estId],
    queryFn: async () => {
      if (!estId) return [];
      const { data, error } = await supabase
        .from("voyage_templates" as any)
        .select("*")
        .eq("establishment_id", estId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TemplateDB[];
    },
    enabled: !!user && !!estId,
  });

  const createTemplate = useMutation({
    mutationFn: async (tpl: Partial<TemplateDB>) => {
      if (!user || !estId) throw new Error("Non authentifié");
      const { error } = await supabase
        .from("voyage_templates" as any)
        .insert({ ...tpl, establishment_id: estId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voyage-templates", estId] });
      toast.success("Modèle enregistré");
      setCreateOpen(false);
      setSaveFromVoyageId(null);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("voyage_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voyage-templates", estId] });
      toast.success("Modèle supprimé");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const handleSaveFromVoyage = (voyageId: string) => {
    const v = voyages.find(x => x.id === voyageId);
    if (!v) return;
    createTemplate.mutate({
      nom: `Modèle — ${v.intitule || v.destination}`,
      description: v.objectifPedagogique || "",
      destination: v.destination,
      pays: v.pays,
      transport_type: v.transportType || "bus",
      type_voyage: v.typeVoyage || "pedagogique",
      nb_eleves: v.nbEleves,
      nb_accompagnateurs: v.nbAccompagnateurs,
      transport: v.transport,
      hebergement: v.hebergement,
      restauration: v.restauration,
      activites: v.activites,
      assurance: v.assurance,
      divers: v.divers,
      regie_avances: 0,
      participation_familles: v.participationFamilles,
      subvention_collectivite: v.subventionCollectivite,
      subvention_etat: v.subventionEtat,
      subvention_autre: v.subventionAutre,
      autofinancement: v.autofinancement,
      service_ap: "AP",
      domaine: "",
      code_activite_gfc: v.codeActiviteGFC || "",
      compte_classe7: "706700",
      objectif_pedagogique: v.objectifPedagogique || "",
      classe: v.classe,
    });
  };

  const handleCreateManual = () => {
    if (!form.nom.trim()) { toast.error("Le nom du modèle est requis"); return; }
    createTemplate.mutate(form as any);
  };

  const budgetTotal = (t: TemplateDB) => t.transport + t.hebergement + t.restauration + t.activites + t.assurance + t.divers + t.regie_avances;
  const recettesTotal = (t: TemplateDB) => t.participation_familles + t.subvention_collectivite + t.subvention_etat + t.subvention_autre + t.autofinancement;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookTemplate className="h-5 w-5 text-primary" />
            Bibliothèque de modèles
          </h2>
          <p className="text-sm text-muted-foreground">
            {templates.length} modèle{templates.length > 1 ? "s" : ""} pour {selectedEstablishment?.name || "cet établissement"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Save from existing voyage */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={voyages.length === 0}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Depuis un voyage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un voyage comme modèle</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-3">
                Le modèle copiera la structure budgétaire et les paramètres. Les voyages existants ne seront pas affectés.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {voyages.map(v => (
                  <Card key={v.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleSaveFromVoyage(v.id)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{v.intitule || v.destination}</p>
                        <p className="text-xs text-muted-foreground">{v.classe} — {v.nbEleves} élèves — {formatCurrency(v.budgetTotal)}</p>
                      </div>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Manual creation */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau modèle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un modèle de voyage</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nom du modèle *</Label>
                    <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Voyage linguistique Angleterre" />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Objectif, contexte..." rows={2} />
                  </div>
                  <div>
                    <Label>Destination</Label>
                    <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
                  </div>
                  <div>
                    <Label>Pays</Label>
                    <Input value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })} />
                  </div>
                  <div>
                    <Label>Élèves</Label>
                    <Input type="number" value={form.nb_eleves} onChange={e => setForm({ ...form, nb_eleves: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Accompagnateurs</Label>
                    <Input type="number" value={form.nb_accompagnateurs} onChange={e => setForm({ ...form, nb_accompagnateurs: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Classe</Label>
                    <Input value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} />
                  </div>
                  <div>
                    <Label>Type de voyage</Label>
                    <Select value={form.type_voyage} onValueChange={v => setForm({ ...form, type_voyage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pedagogique">Pédagogique</SelectItem>
                        <SelectItem value="linguistique">Linguistique</SelectItem>
                        <SelectItem value="sportif">Sportif</SelectItem>
                        <SelectItem value="culturel">Culturel</SelectItem>
                        <SelectItem value="ski">Ski</SelectItem>
                        <SelectItem value="erasmus">Erasmus+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <h3 className="text-sm font-semibold">Ventilation budgétaire</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "transport", label: "Transport" },
                    { key: "hebergement", label: "Hébergement" },
                    { key: "restauration", label: "Restauration" },
                    { key: "activites", label: "Activités" },
                    { key: "assurance", label: "Assurance" },
                    { key: "divers", label: "Divers" },
                  ].map(f => (
                    <div key={f.key}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: +e.target.value })} />
                    </div>
                  ))}
                </div>

                <Separator />
                <h3 className="text-sm font-semibold">Recettes prévisionnelles</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Participation familles</Label><Input type="number" value={form.participation_familles} onChange={e => setForm({ ...form, participation_familles: +e.target.value })} /></div>
                  <div><Label className="text-xs">Subvention Collectivité</Label><Input type="number" value={form.subvention_collectivite} onChange={e => setForm({ ...form, subvention_collectivite: +e.target.value })} /></div>
                  <div><Label className="text-xs">Subvention État</Label><Input type="number" value={form.subvention_etat} onChange={e => setForm({ ...form, subvention_etat: +e.target.value })} /></div>
                  <div><Label className="text-xs">Autofinancement</Label><Input type="number" value={form.autofinancement} onChange={e => setForm({ ...form, autofinancement: +e.target.value })} /></div>
                </div>

                <Separator />
                <h3 className="text-sm font-semibold">Imputation comptable (Op@le)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Service</Label><Input value={form.service_ap} onChange={e => setForm({ ...form, service_ap: e.target.value })} /></div>
                  <div><Label className="text-xs">Domaine</Label><Input value={form.domaine} onChange={e => setForm({ ...form, domaine: e.target.value })} placeholder="VOY_ALL" /></div>
                  <div><Label className="text-xs">Code Activité (9 car.)</Label><Input value={form.code_activite_gfc} onChange={e => setForm({ ...form, code_activite_gfc: e.target.value })} maxLength={9} placeholder="2XXXXXXXX" /></div>
                </div>
                <div>
                  <Label className="text-xs">Compte de produit (Classe 7)</Label>
                  <Select value={form.compte_classe7} onValueChange={v => setForm({ ...form, compte_classe7: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPTES_CLASSE7.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleCreateManual} disabled={createTemplate.isPending}>
                  Enregistrer le modèle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : templates.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <BookTemplate className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun modèle enregistré pour cet établissement.</p>
            <p className="text-xs text-muted-foreground mt-1">Créez un modèle vierge ou enregistrez un voyage existant comme modèle.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tpl => {
            const budget = budgetTotal(tpl);
            const recettes = recettesTotal(tpl);
            const delta = recettes - budget;
            return (
              <Card key={tpl.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{tpl.nom}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {tpl.destination || "—"}, {tpl.pays}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le modèle</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le modèle « {tpl.nom} » ? Cette action est irréversible.
                            <br /><br />
                            <span className="font-medium">Les voyages déjà créés à partir de ce modèle ne seront pas affectés.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTemplate.mutate(tpl.id)}
                          >
                            Supprimer définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tpl.description && <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>}

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {tpl.nb_eleves} él. + {tpl.nb_accompagnateurs} acc.</span>
                    <Badge variant="secondary" className="text-[10px]">{tpl.type_voyage}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Dépenses</p>
                      <p className="font-mono font-semibold">{formatCurrency(budget)}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Recettes</p>
                      <p className="font-mono font-semibold">{formatCurrency(recettes)}</p>
                    </div>
                  </div>

                  {delta !== 0 && (
                    <p className={`text-xs font-semibold ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                      Δ {delta >= 0 ? "+" : ""}{formatCurrency(delta)}
                    </p>
                  )}

                  {/* Imputation comptable */}
                  {(tpl.domaine || tpl.code_activite_gfc) && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.service_ap && <Badge variant="outline" className="text-[9px]"><Landmark className="h-2.5 w-2.5 mr-0.5" />{tpl.service_ap}</Badge>}
                      {tpl.domaine && <Badge variant="outline" className="text-[9px]">{tpl.domaine}</Badge>}
                      {tpl.code_activite_gfc && <Badge variant="outline" className="text-[9px]">{tpl.code_activite_gfc}</Badge>}
                      <Badge variant="outline" className="text-[9px]"><FileText className="h-2.5 w-2.5 mr-0.5" />{tpl.compte_classe7}</Badge>
                    </div>
                  )}

                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onCreateFromTemplate(tpl)}>
                    <Plus className="h-3 w-3 mr-1" /> Créer un voyage depuis ce modèle
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
