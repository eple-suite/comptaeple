// ═══════════════════════════════════════════════════════════════
// Page liste des élèves — module Action sociale v2
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Search, Pencil, Trash2, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useEleves, useDeleteEleve } from "./useFsData";
import { EleveFormDialog } from "./EleveFormDialog";
import { EleveImportCsvDialog } from "./EleveImportCsvDialog";
import { FsEleve } from "./fsv2Types";
import { ProfilCompletudeBadge } from "./ProfilCompletudeBadge";
import { evaluerCompletudeEleve } from "./fsEnqueteHelpers";
import { VoieBadge } from "./VoieBadge";
import { toast } from "sonner";

export default function ElevesPage() {
  const { data: eleves = [], isLoading } = useEleves();
  const del = useDeleteEleve();
  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editing, setEditing] = useState<FsEleve | null>(null);
  const [search, setSearch] = useState("");
  const [voieFilter, setVoieFilter] = useState("all");
  const [boursierFilter, setBoursierFilter] = useState("all");
  const [completudeFilter, setCompletudeFilter] = useState("all");

  const filtered = useMemo(() => eleves.filter(e => {
    if (voieFilter !== "all" && e.voie !== voieFilter) return false;
    if (boursierFilter === "oui" && !e.statut_boursier) return false;
    if (boursierFilter === "non" && e.statut_boursier) return false;
    if (completudeFilter === "incompletes") {
      const c = evaluerCompletudeEleve(e);
      if (c.pct === 100) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!`${e.nom} ${e.prenom} ${e.classe}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [eleves, search, voieFilter, boursierFilter, completudeFilter]);

  const handleEdit = (e: FsEleve) => { setEditing(e); setOpenForm(true); };
  const handleNew = () => { setEditing(null); setOpenForm(true); };
  const handleDelete = async (e: FsEleve) => {
    if (!confirm(`Supprimer ${e.prenom} ${e.nom} ?`)) return;
    try { await del.mutateAsync(e.id); toast.success("Élève supprimé"); }
    catch (err: any) { toast.error(err.message || "Erreur"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/fonds-sociaux/v2"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Base élèves</h1>
            <p className="text-sm text-muted-foreground">Gestion de la base élèves pour le suivi des aides sociales</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/fonds-sociaux/v2/eleves/import"><Upload className="h-4 w-4 mr-1" /> Import CSV/Excel + IA</Link>
          </Button>
          <Button variant="ghost" onClick={() => setOpenImport(true)}><Upload className="h-4 w-4 mr-1" /> Import CSV simple</Button>
          <Button onClick={handleNew} className="gradient-primary border-0"><Plus className="h-4 w-4 mr-1" /> Ajouter un élève</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span>{eleves.length} élève{eleves.length > 1 ? "s" : ""} en base</span>
            <Badge variant="outline">{filtered.length} affichés</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, prénom, classe…" className="pl-9" />
            </div>
            <Select value={voieFilter} onValueChange={setVoieFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes voies</SelectItem>
                <SelectItem value="GT">Générale & Techno</SelectItem>
                <SelectItem value="PRO">Professionnelle</SelectItem>
                <SelectItem value="1er_degre">1er degré</SelectItem>
              </SelectContent>
            </Select>
            <Select value={boursierFilter} onValueChange={setBoursierFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="oui">Boursiers</SelectItem>
                <SelectItem value="non">Non boursiers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={completudeFilter} onValueChange={setCompletudeFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes fiches</SelectItem>
                <SelectItem value="incompletes">Fiches incomplètes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Voie</TableHead>
                  <TableHead>Boursier</TableHead>
                  <TableHead>Régime</TableHead>
                  <TableHead>Complétude</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Chargement…</TableCell></TableRow>}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Aucun élève — utilisez « Ajouter » ou « Importer CSV »</TableCell></TableRow>
                )}
                {filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold">{e.nom}</TableCell>
                    <TableCell>{e.prenom}</TableCell>
                    <TableCell>{e.classe}</TableCell>
                    <TableCell><VoieBadge voie={e.voie} /></TableCell>
                    <TableCell>{e.statut_boursier ? <Badge className="bg-success/15 text-success border-0">Éch. {e.echelon_bourse ?? "?"}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs">
                      {e.interne ? "Interne" : e.demi_pensionnaire ? "DP" : "Externe"}
                    </TableCell>
                    <TableCell><ProfilCompletudeBadge eleve={e} onEdit={() => handleEdit(e)} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(e)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(e)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EleveFormDialog open={openForm} onOpenChange={setOpenForm} initial={editing} />
      <EleveImportCsvDialog open={openImport} onOpenChange={setOpenImport} />
    </div>
  );
}