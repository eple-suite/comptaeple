import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, ArrowLeft, Search, Edit, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";

type Fiche = {
  id: string;
  intitule: string;
  service: string | null;
  filiere: string | null;
  categorie: string | null;
  corps_grade_cible: string | null;
  positionnement_hierarchique: string | null;
  missions_principales: string | null;
  activites: string | null;
  competences_requises: string | null;
  conditions_exercice: string | null;
  contraintes_specificites: string | null;
  partagee_groupement: boolean;
};

const TEMPLATES = [
  { intitule: "Adjoint gestionnaire / SGEPLE", filiere: "AENES", categorie: "A",
    missions: "- Pilotage administratif et financier de l'EPLE\n- Encadrement de l'équipe BIATSS\n- Préparation et exécution du budget\n- Suivi des marchés et contrats" },
  { intitule: "Secrétaire d'intendance", filiere: "AENES", categorie: "C",
    missions: "- Tenue de la comptabilité courante\n- Émission des mandats et titres de recettes\n- Accueil des familles\n- Gestion des bourses" },
  { intitule: "Agent d'accueil et de scolarité", filiere: "AENES", categorie: "C",
    missions: "- Accueil physique et téléphonique\n- Suivi de la scolarité (SIECLE)\n- Gestion des absences et retards\n- Lien avec les familles" },
  { intitule: "Technicien informatique RUPN", filiere: "ITRF", categorie: "B",
    missions: "- Maintenance du parc informatique\n- Support utilisateurs\n- Administration réseau\n- Sécurité numérique" },
  { intitule: "Adjoint technique de laboratoire", filiere: "ITRF", categorie: "C",
    missions: "- Préparation des TP\n- Gestion des matériels et produits\n- Sécurité des laboratoires\n- Inventaire" },
];

export default function FichesPostePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Fiche> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entretiens_fiches_poste")
        .select("*")
        .order("intitule");
      setFiches((data || []) as any);
      setLoading(false);
    })();
  }, []);

  const filtered = fiches.filter(
    (f) =>
      !search.trim() ||
      f.intitule?.toLowerCase().includes(search.toLowerCase()) ||
      f.service?.toLowerCase().includes(search.toLowerCase()),
  );

  function startNew() {
    setEditing({
      intitule: "",
      service: "",
      filiere: "AENES" as any,
      categorie: "C" as any,
      missions_principales: "",
      activites: "",
      competences_requises: "",
      conditions_exercice: "",
      partagee_groupement: false,
    });
  }

  function loadTemplate(t: typeof TEMPLATES[number]) {
    setEditing({
      intitule: t.intitule,
      filiere: t.filiere as any,
      categorie: t.categorie as any,
      missions_principales: t.missions,
      partagee_groupement: true,
    });
  }

  async function saveFiche() {
    if (!editing?.intitule?.trim() || !user || !selectedEstablishment) {
      toast.error("Intitulé requis et EPLE sélectionné");
      return;
    }
    const payload: any = {
      establishment_id: selectedEstablishment.id,
      intitule: editing.intitule,
      service: editing.service || null,
      filiere: editing.filiere || null,
      categorie: editing.categorie || null,
      corps_grade_cible: editing.corps_grade_cible || null,
      positionnement_hierarchique: editing.positionnement_hierarchique || null,
      missions_principales: editing.missions_principales || null,
      activites: editing.activites || null,
      competences_requises: editing.competences_requises || null,
      conditions_exercice: editing.conditions_exercice || null,
      contraintes_specificites: editing.contraintes_specificites || null,
      partagee_groupement: editing.partagee_groupement || false,
      created_by: user.id,
    };
    if (editing.id) {
      const { error } = await supabase.from("entretiens_fiches_poste").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erreur : " + error.message); return; }
    } else {
      const { error } = await supabase.from("entretiens_fiches_poste").insert(payload);
      if (error) { toast.error("Erreur : " + error.message); return; }
    }
    toast.success("Fiche enregistrée");
    setEditing(null);
    const { data } = await supabase.from("entretiens_fiches_poste").select("*").order("intitule");
    setFiches((data || []) as any);
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/entretiens")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Référentiel des fiches de poste</h1>
          <p className="text-sm text-muted-foreground">Annexées au CREP — référentiel REFERENS (ITRF) / RIFSEEP groupes (AENES).</p>
        </div>
        <Button onClick={startNew} className="gap-2"><Plus className="h-4 w-4" /> Nouvelle fiche</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Bibliothèque générique</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {TEMPLATES.map((t, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => loadTemplate(t)} className="text-xs">
              {t.intitule}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
        {!loading && filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune fiche enregistrée.</CardContent></Card>
        )}
        {filtered.map((f) => (
          <Card key={f.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setEditing(f)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm">{f.intitule}</CardTitle>
                <Edit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {f.filiere && <Badge variant="secondary" className="text-[10px]">{f.filiere}</Badge>}
                {f.categorie && <Badge variant="outline" className="text-[10px]">Cat. {f.categorie}</Badge>}
                {f.partagee_groupement && <Badge className="text-[10px]">Groupement</Badge>}
              </div>
            </CardHeader>
            {f.missions_principales && (
              <CardContent className="text-xs text-muted-foreground line-clamp-3 pt-0">
                {f.missions_principales}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier la fiche" : "Nouvelle fiche de poste"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Intitulé *</Label>
                  <Input value={editing.intitule || ""} onChange={(e) => setEditing({ ...editing, intitule: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Service</Label>
                  <Input value={editing.service || ""} onChange={(e) => setEditing({ ...editing, service: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Corps / grade cible</Label>
                  <Input value={editing.corps_grade_cible || ""} onChange={(e) => setEditing({ ...editing, corps_grade_cible: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Filière</Label>
                  <select value={editing.filiere || ""} onChange={(e) => setEditing({ ...editing, filiere: e.target.value as any })} className="w-full h-9 px-3 rounded-md border border-input bg-background">
                    <option value="AENES">AENES</option>
                    <option value="ITRF">ITRF</option>
                    <option value="Bibliotheques">Bibliothèques</option>
                    <option value="SAENES">SAENES</option>
                    <option value="Medico_sociale">Médico-sociale</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Catégorie</Label>
                  <select value={editing.categorie || ""} onChange={(e) => setEditing({ ...editing, categorie: e.target.value as any })} className="w-full h-9 px-3 rounded-md border border-input bg-background">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Positionnement hiérarchique</Label>
                <Textarea rows={2} value={editing.positionnement_hierarchique || ""} onChange={(e) => setEditing({ ...editing, positionnement_hierarchique: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Missions principales</Label>
                <Textarea rows={5} value={editing.missions_principales || ""} onChange={(e) => setEditing({ ...editing, missions_principales: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Activités principales</Label>
                <Textarea rows={4} value={editing.activites || ""} onChange={(e) => setEditing({ ...editing, activites: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Compétences requises</Label>
                <Textarea rows={4} value={editing.competences_requises || ""} onChange={(e) => setEditing({ ...editing, competences_requises: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Conditions d'exercice</Label>
                <Textarea rows={2} value={editing.conditions_exercice || ""} onChange={(e) => setEditing({ ...editing, conditions_exercice: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Contraintes / spécificités</Label>
                <Textarea rows={2} value={editing.contraintes_specificites || ""} onChange={(e) => setEditing({ ...editing, contraintes_specificites: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={editing.partagee_groupement || false} onChange={(e) => setEditing({ ...editing, partagee_groupement: e.target.checked })} />
                Partagée avec le groupement
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={saveFiche} className="gap-2"><Save className="h-4 w-4" /> Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}