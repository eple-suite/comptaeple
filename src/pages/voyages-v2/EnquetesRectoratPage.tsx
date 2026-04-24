// ════════════════════════════════════════════════════════════════
// Module Enquêtes Rectorat — Voyages scolaires v2
// Formulaire structuré (agrégats voyages) + cycle de vie (brouillon →
// soumise → validée/rejetée) + exports PDF & CSV.
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileDown, FileText, Save, Send, Loader2, Plus, Trash2, RefreshCw, ClipboardCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Statut = "brouillon" | "soumise" | "validee" | "rejetee";

const STATUT_LABEL: Record<Statut, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  validee: "Validée",
  rejetee: "Rejetée",
};
const STATUT_COLOR: Record<Statut, string> = {
  brouillon: "bg-muted text-muted-foreground",
  soumise: "bg-blue-500 text-white",
  validee: "bg-emerald-500 text-white",
  rejetee: "bg-destructive text-destructive-foreground",
};

interface DonneesEnquete {
  responsable_nom: string;
  responsable_fonction: string;
  responsable_email: string;
  nb_voyages_realises: number;
  nb_voyages_annules: number;
  nb_eleves_concernes: number;
  nb_accompagnateurs: number;
  budget_total_ttc: number;
  participation_familles_ttc: number;
  subventions_publiques_ttc: number;
  fonds_sociaux_mobilises: number;
  destinations_france: string;
  destinations_etranger: string;
  difficultes_rencontrees: string;
  bonnes_pratiques: string;
  conformite_8euros: "oui" | "non" | "na";
  observations: string;
}

const DEFAULT_DONNEES: DonneesEnquete = {
  responsable_nom: "",
  responsable_fonction: "Adjoint-gestionnaire",
  responsable_email: "",
  nb_voyages_realises: 0,
  nb_voyages_annules: 0,
  nb_eleves_concernes: 0,
  nb_accompagnateurs: 0,
  budget_total_ttc: 0,
  participation_familles_ttc: 0,
  subventions_publiques_ttc: 0,
  fonds_sociaux_mobilises: 0,
  destinations_france: "",
  destinations_etranger: "",
  difficultes_rencontrees: "",
  bonnes_pratiques: "",
  conformite_8euros: "oui",
  observations: "",
};

interface EnqueteRow {
  id: string;
  establishment_id: string;
  user_id: string;
  annee_scolaire: string;
  periode: string;
  statut: Statut;
  donnees: DonneesEnquete;
  commentaires_rectorat: string;
  date_soumission: string | null;
  date_validation: string | null;
  created_at: string;
  updated_at: string;
}

function currentAnneeScolaire(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default function EnquetesRectoratPage() {
  const navigate = useNavigate();
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();

  const [list, setList] = useState<EnqueteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EnqueteRow | null>(null);
  const [annee, setAnnee] = useState(currentAnneeScolaire());
  const [periode, setPeriode] = useState("annuel");
  const [donnees, setDonnees] = useState<DonneesEnquete>(DEFAULT_DONNEES);

  const isFinal = editing && (editing.statut === "soumise" || editing.statut === "validee");

  const formatLockError = (raw: string | undefined): { title: string; description: string } => {
    const msg = raw || "";
    if (/Enquête verrouillée/i.test(msg) || /check_violation/i.test(msg)) {
      return {
        title: "Enquête verrouillée",
        description:
          "Cette enquête est soumise ou validée : son contenu ne peut plus être modifié ni supprimée. Demandez une réouverture à un administrateur.",
      };
    }
    if (/insufficient_privilege/i.test(msg) || /seul un administrateur/i.test(msg)) {
      return {
        title: "Action réservée à l'administrateur",
        description: "Seul un administrateur peut valider ou rejeter une enquête déjà soumise.",
      };
    }
    return { title: "Échec d'enregistrement", description: msg || "Erreur inconnue" };
  };

  const refresh = async () => {
    if (!selectedEstablishment?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("vs_enquetes_rectorat")
      .select("*")
      .eq("establishment_id", selectedEstablishment.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erreur de chargement", { description: error.message });
      return;
    }
    setList(
      (data || []).map((r: any) => ({
        ...r,
        donnees: { ...DEFAULT_DONNEES, ...(r.donnees || {}) },
      }))
    );
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEstablishment?.id]);

  const startNew = () => {
    setEditing(null);
    setAnnee(currentAnneeScolaire());
    setPeriode("annuel");
    setDonnees(DEFAULT_DONNEES);
  };

  const startEdit = (row: EnqueteRow) => {
    setEditing(row);
    setAnnee(row.annee_scolaire);
    setPeriode(row.periode);
    setDonnees({ ...DEFAULT_DONNEES, ...row.donnees });
  };

  const handleSave = async (nextStatut?: Statut) => {
    if (!selectedEstablishment?.id || !user?.id) {
      toast.error("Établissement ou utilisateur manquant");
      return;
    }
    if (!annee.trim()) {
      toast.error("L'année scolaire est obligatoire");
      return;
    }
    setSaving(true);
    const payload: any = {
      establishment_id: selectedEstablishment.id,
      user_id: user.id,
      annee_scolaire: annee.trim(),
      periode,
      donnees,
    };
    if (nextStatut) {
      payload.statut = nextStatut;
      if (nextStatut === "soumise") {
        payload.date_soumission = new Date().toISOString();
        payload.soumis_par_user_id = user.id;
      }
      if (nextStatut === "validee" || nextStatut === "rejetee") {
        payload.date_validation = new Date().toISOString();
      }
    }

    let error;
    if (editing) {
      ({ error } = await (supabase as any)
        .from("vs_enquetes_rectorat")
        .update(payload)
        .eq("id", editing.id));
    } else {
      payload.statut = nextStatut || "brouillon";
      ({ error } = await (supabase as any).from("vs_enquetes_rectorat").insert(payload));
    }
    setSaving(false);
    if (error) {
      const f = formatLockError(error.message);
      toast.error(f.title, { description: f.description });
      return;
    }
    toast.success(
      nextStatut === "soumise"
        ? "Enquête soumise au rectorat"
        : nextStatut
        ? `Statut : ${STATUT_LABEL[nextStatut]}`
        : "Brouillon enregistré"
    );
    await refresh();
    startNew();
  };

  const handleDelete = async (row: EnqueteRow) => {
    if (!confirm(`Supprimer l'enquête ${row.annee_scolaire} (${row.periode}) ?`)) return;
    const { error } = await (supabase as any)
      .from("vs_enquetes_rectorat")
      .delete()
      .eq("id", row.id);
    if (error) {
      const f = formatLockError(error.message);
      toast.error(f.title, { description: f.description });
      return;
    }
    toast.success("Enquête supprimée");
    refresh();
  };

  const exportCSV = (row: EnqueteRow) => {
    const lines: string[][] = [
      ["Champ", "Valeur"],
      ["Établissement", selectedEstablishment?.name || ""],
      ["UAI", (selectedEstablishment as any)?.uai || ""],
      ["Année scolaire", row.annee_scolaire],
      ["Période", row.periode],
      ["Statut", STATUT_LABEL[row.statut]],
      ["Date soumission", row.date_soumission || ""],
    ];
    Object.entries(row.donnees).forEach(([k, v]) => lines.push([k, String(v)]));
    const csv = lines
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enquete-rectorat-${row.annee_scolaire}-${row.periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (row: EnqueteRow) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    let y = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Enquête voyages scolaires — Rectorat", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Établissement : ${selectedEstablishment?.name || "—"}`, margin, y);
    y += 5;
    doc.text(`UAI : ${(selectedEstablishment as any)?.uai || "—"}`, margin, y);
    y += 5;
    doc.text(`Année scolaire : ${row.annee_scolaire}    Période : ${row.periode}`, margin, y);
    y += 5;
    doc.text(`Statut : ${STATUT_LABEL[row.statut]}`, margin, y);
    y += 5;
    if (row.date_soumission) {
      doc.text(`Date de soumission : ${new Date(row.date_soumission).toLocaleString("fr-FR")}`, margin, y);
      y += 5;
    }
    y += 3;
    doc.setDrawColor(180);
    doc.line(margin, y, 210 - margin, y);
    y += 6;

    const section = (titre: string) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(titre, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };
    const ligne = (label: string, val: string | number) => {
      if (y > 280) { doc.addPage(); y = margin; }
      const txt = `${label} : ${val}`;
      const lines = doc.splitTextToSize(txt, 180);
      lines.forEach((l: string) => { doc.text(l, margin, y); y += 5; });
    };

    section("Responsable de l'enquête");
    ligne("Nom", row.donnees.responsable_nom || "—");
    ligne("Fonction", row.donnees.responsable_fonction || "—");
    ligne("E-mail", row.donnees.responsable_email || "—");
    y += 2;

    section("Indicateurs quantitatifs");
    ligne("Voyages réalisés", row.donnees.nb_voyages_realises);
    ligne("Voyages annulés", row.donnees.nb_voyages_annules);
    ligne("Élèves concernés", row.donnees.nb_eleves_concernes);
    ligne("Accompagnateurs", row.donnees.nb_accompagnateurs);
    y += 2;

    section("Données financières (TTC)");
    ligne("Budget total", `${row.donnees.budget_total_ttc.toLocaleString("fr-FR")} €`);
    ligne("Participation des familles", `${row.donnees.participation_familles_ttc.toLocaleString("fr-FR")} €`);
    ligne("Subventions publiques", `${row.donnees.subventions_publiques_ttc.toLocaleString("fr-FR")} €`);
    ligne("Fonds sociaux mobilisés", `${row.donnees.fonds_sociaux_mobilises.toLocaleString("fr-FR")} €`);
    y += 2;

    section("Destinations");
    ligne("France", row.donnees.destinations_france || "—");
    ligne("Étranger", row.donnees.destinations_etranger || "—");
    y += 2;

    section("Conformité & retours");
    ligne("Conformité règle des 8 €", row.donnees.conformite_8euros);
    ligne("Difficultés rencontrées", row.donnees.difficultes_rencontrees || "—");
    ligne("Bonnes pratiques", row.donnees.bonnes_pratiques || "—");
    ligne("Observations", row.donnees.observations || "—");

    if (row.commentaires_rectorat) {
      y += 3;
      section("Commentaires du rectorat");
      const lines = doc.splitTextToSize(row.commentaires_rectorat, 180);
      lines.forEach((l: string) => { doc.text(l, margin, y); y += 5; });
    }

    doc.save(`enquete-rectorat-${row.annee_scolaire}-${row.periode}.pdf`);
  };

  const setNum = (key: keyof DonneesEnquete, v: string) =>
    setDonnees((d) => ({ ...d, [key]: Number(v) || 0 }));
  const setStr = (key: keyof DonneesEnquete, v: string) =>
    setDonnees((d) => ({ ...d, [key]: v as any }));

  const totauxOk = useMemo(() => {
    const sum =
      donnees.participation_familles_ttc +
      donnees.subventions_publiques_ttc +
      donnees.fonds_sociaux_mobilises;
    if (donnees.budget_total_ttc <= 0) return null;
    const diff = Math.abs(donnees.budget_total_ttc - sum);
    return diff < 0.5;
  }, [donnees]);

  if (!selectedEstablishment) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>Sélectionnez un établissement</AlertTitle>
          <AlertDescription>Choisissez un établissement pour gérer les enquêtes rectorat.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/voyages-v2")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour Voyages v2
          </Button>
          <div className="flex items-center gap-2 mt-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Enquêtes Rectorat — Voyages scolaires</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Collecte, soumission et archivage des enquêtes du rectorat sur les voyages scolaires de l'EPLE.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Rafraîchir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-2 flex-wrap">
            <span>{editing ? `Édition — ${editing.annee_scolaire} / ${editing.periode}` : "Nouvelle enquête"}</span>
            {editing && (
              <Badge className={STATUT_COLOR[editing.statut]}>{STATUT_LABEL[editing.statut]}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Renseignez les agrégats annuels ou trimestriels. Une fois soumise, l'enquête est verrouillée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFinal && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Enquête verrouillée — lecture seule</AlertTitle>
              <AlertDescription>
                Statut « {STATUT_LABEL[editing!.statut]} » : le contenu est figé côté base
                de données (déclencheur PostgreSQL). Aucune modification ni suppression
                n'est possible. Pour rouvrir cette enquête, contactez un administrateur.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Année scolaire</Label>
              <Input value={annee} onChange={(e) => setAnnee(e.target.value)} placeholder="2025-2026" disabled={!!isFinal} />
            </div>
            <div>
              <Label>Période</Label>
              <Select value={periode} onValueChange={setPeriode} disabled={!!isFinal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annuel">Annuelle</SelectItem>
                  <SelectItem value="t1">Trimestre 1</SelectItem>
                  <SelectItem value="t2">Trimestre 2</SelectItem>
                  <SelectItem value="t3">Trimestre 3</SelectItem>
                  <SelectItem value="semestre1">Semestre 1</SelectItem>
                  <SelectItem value="semestre2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conformité règle 8 €</Label>
              <Select value={donnees.conformite_8euros} onValueChange={(v) => setStr("conformite_8euros", v)} disabled={!!isFinal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui — conforme</SelectItem>
                  <SelectItem value="non">Non — anomalies détectées</SelectItem>
                  <SelectItem value="na">Non applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <div className="text-sm font-semibold">Responsable de l'enquête</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Nom complet</Label><Input value={donnees.responsable_nom} onChange={(e) => setStr("responsable_nom", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Fonction</Label><Input value={donnees.responsable_fonction} onChange={(e) => setStr("responsable_fonction", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>E-mail</Label><Input type="email" value={donnees.responsable_email} onChange={(e) => setStr("responsable_email", e.target.value)} disabled={!!isFinal} /></div>
          </div>

          <Separator />
          <div className="text-sm font-semibold">Indicateurs quantitatifs</div>
          <div className="grid gap-3 md:grid-cols-4">
            <div><Label>Voyages réalisés</Label><Input type="number" min="0" value={donnees.nb_voyages_realises} onChange={(e) => setNum("nb_voyages_realises", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Voyages annulés</Label><Input type="number" min="0" value={donnees.nb_voyages_annules} onChange={(e) => setNum("nb_voyages_annules", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Élèves concernés</Label><Input type="number" min="0" value={donnees.nb_eleves_concernes} onChange={(e) => setNum("nb_eleves_concernes", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Accompagnateurs</Label><Input type="number" min="0" value={donnees.nb_accompagnateurs} onChange={(e) => setNum("nb_accompagnateurs", e.target.value)} disabled={!!isFinal} /></div>
          </div>

          <Separator />
          <div className="text-sm font-semibold">Données financières (TTC, en €)</div>
          <div className="grid gap-3 md:grid-cols-4">
            <div><Label>Budget total</Label><Input type="number" step="0.01" value={donnees.budget_total_ttc} onChange={(e) => setNum("budget_total_ttc", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Participation familles</Label><Input type="number" step="0.01" value={donnees.participation_familles_ttc} onChange={(e) => setNum("participation_familles_ttc", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Subventions publiques</Label><Input type="number" step="0.01" value={donnees.subventions_publiques_ttc} onChange={(e) => setNum("subventions_publiques_ttc", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Fonds sociaux mobilisés</Label><Input type="number" step="0.01" value={donnees.fonds_sociaux_mobilises} onChange={(e) => setNum("fonds_sociaux_mobilises", e.target.value)} disabled={!!isFinal} /></div>
          </div>
          {totauxOk === false && (
            <Alert variant="destructive">
              <AlertTitle>Incohérence financière</AlertTitle>
              <AlertDescription>
                La somme participation + subventions + fonds sociaux ne correspond pas au budget total TTC.
              </AlertDescription>
            </Alert>
          )}

          <Separator />
          <div className="text-sm font-semibold">Destinations & retours qualitatifs</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Destinations France</Label><Textarea rows={2} value={donnees.destinations_france} onChange={(e) => setStr("destinations_france", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Destinations étranger</Label><Textarea rows={2} value={donnees.destinations_etranger} onChange={(e) => setStr("destinations_etranger", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Difficultés rencontrées</Label><Textarea rows={3} value={donnees.difficultes_rencontrees} onChange={(e) => setStr("difficultes_rencontrees", e.target.value)} disabled={!!isFinal} /></div>
            <div><Label>Bonnes pratiques</Label><Textarea rows={3} value={donnees.bonnes_pratiques} onChange={(e) => setStr("bonnes_pratiques", e.target.value)} disabled={!!isFinal} /></div>
            <div className="md:col-span-2"><Label>Observations</Label><Textarea rows={2} value={donnees.observations} onChange={(e) => setStr("observations", e.target.value)} disabled={!!isFinal} /></div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={startNew}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle enquête
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleSave()} disabled={saving || !!isFinal}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer brouillon
              </Button>
              <Button onClick={() => handleSave("soumise")} disabled={saving || !!isFinal}>
                <Send className="h-4 w-4 mr-2" /> Soumettre au rectorat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Historique des enquêtes ({list.length})
          </CardTitle>
          <CardDescription>Cliquez sur une ligne pour reprendre l'édition (si brouillon).</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune enquête enregistrée pour cet établissement.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Voyages</TableHead>
                    <TableHead>Élèves</TableHead>
                    <TableHead>Budget TTC</TableHead>
                    <TableHead>Soumise le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.annee_scolaire}</TableCell>
                      <TableCell className="capitalize">{row.periode}</TableCell>
                      <TableCell><Badge className={STATUT_COLOR[row.statut]}>{STATUT_LABEL[row.statut]}</Badge></TableCell>
                      <TableCell>{row.donnees.nb_voyages_realises}</TableCell>
                      <TableCell>{row.donnees.nb_eleves_concernes}</TableCell>
                      <TableCell>{row.donnees.budget_total_ttc.toLocaleString("fr-FR")} €</TableCell>
                      <TableCell className="text-xs">
                        {row.date_soumission ? new Date(row.date_soumission).toLocaleDateString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                            {row.statut === "brouillon" ? "Éditer" : "Voir"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => exportPDF(row)} title="Export PDF">
                            <FileDown className="h-4 w-4" /> PDF
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => exportCSV(row)} title="Export CSV">
                            <FileDown className="h-4 w-4" /> CSV
                          </Button>
                          {row.statut === "brouillon" && (
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(row)} title="Supprimer">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}