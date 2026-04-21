// ═══════════════════════════════════════════════════════════════════
// CRUD pour la table `cofieple_comptes_sens_normal`
// Permet à l'agent comptable de surcharger le sens normal d'un compte
// pour son UAI. Le moteur M9-6 consulte ces règles en priorité.
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Save, RefreshCcw, Sparkles, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { loadSensNormalOverridesFromSupabase } from "@/lib/cofieple_sensNormalOverrides";

type SensRow = {
  id: string;
  uai: string;
  user_id: string;
  compte_prefix: string;
  libelle: string;
  sens_normal: "debiteur" | "crediteur" | "mixte" | "nul";
  gravite_violation: "info" | "anomalie" | "bloquant";
  commentaire: string;
  source: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

const SENS_OPTIONS: { value: SensRow["sens_normal"]; label: string; hint: string }[] = [
  { value: "debiteur", label: "Débiteur", hint: "Solde attendu au débit (ex. 531 Caisse)" },
  { value: "crediteur", label: "Créditeur", hint: "Solde attendu au crédit (ex. 515900)" },
  { value: "mixte", label: "Mixte", hint: "Débit ou crédit autorisés" },
  { value: "nul", label: "Nul", hint: "Solde devant être à zéro" },
];

const GRAVITE_OPTIONS: { value: SensRow["gravite_violation"]; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "bg-muted text-muted-foreground" },
  { value: "anomalie", label: "Anomalie", color: "bg-warning/15 text-warning-foreground" },
  { value: "bloquant", label: "Bloquant", color: "bg-destructive/15 text-destructive" },
];

// Presets M9-6 — recommandés par défaut
const PRESETS_M96: Array<Omit<SensRow, "id" | "uai" | "user_id" | "created_at" | "updated_at">> = [
  { compte_prefix: "515900", libelle: "Trésor — règlements en cours (DFT)", sens_normal: "crediteur", gravite_violation: "bloquant", commentaire: "M9-6 Tome 3 : strictement créditeur. Débit = écriture à l'envers.", source: "M9-6", actif: true },
  { compte_prefix: "515100", libelle: "Trésor — compte courant DFT", sens_normal: "debiteur", gravite_violation: "bloquant", commentaire: "Compte de trésorerie principal — débit ou nul.", source: "M9-6", actif: true },
  { compte_prefix: "531", libelle: "Caisse", sens_normal: "debiteur", gravite_violation: "bloquant", commentaire: "Caisse — strictement débiteur ou nul.", source: "M9-6", actif: true },
  { compte_prefix: "28", libelle: "Amortissements des immobilisations", sens_normal: "crediteur", gravite_violation: "bloquant", commentaire: "Passifs correcteurs — crédit strict.", source: "M9-6", actif: true },
  { compte_prefix: "29", libelle: "Dépréciations des immobilisations", sens_normal: "crediteur", gravite_violation: "anomalie", commentaire: "Passifs correcteurs — crédit strict.", source: "M9-6", actif: true },
  { compte_prefix: "39", libelle: "Dépréciations des stocks", sens_normal: "crediteur", gravite_violation: "anomalie", commentaire: "Passifs correcteurs — crédit strict.", source: "M9-6", actif: true },
  { compte_prefix: "49", libelle: "Dépréciations des comptes de tiers", sens_normal: "crediteur", gravite_violation: "anomalie", commentaire: "Passifs correcteurs — crédit strict.", source: "M9-6", actif: true },
  { compte_prefix: "59", libelle: "Dépréciations des comptes financiers", sens_normal: "crediteur", gravite_violation: "anomalie", commentaire: "Passifs correcteurs — crédit strict.", source: "M9-6", actif: true },
  { compte_prefix: "419", libelle: "Avances et acomptes reçus", sens_normal: "crediteur", gravite_violation: "anomalie", commentaire: "Avances clients — crédit par nature.", source: "M9-6", actif: true },
  { compte_prefix: "409", libelle: "Avances versées aux fournisseurs", sens_normal: "debiteur", gravite_violation: "anomalie", commentaire: "Avances fournisseurs — débit par nature.", source: "M9-6", actif: true },
];

interface Props {
  uai: string | null;
}

export default function ComptesSensNormalManager({ uai }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<SensRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form (création / édition)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [comptePrefix, setComptePrefix] = useState("");
  const [libelle, setLibelle] = useState("");
  const [sensNormal, setSensNormal] = useState<SensRow["sens_normal"]>("crediteur");
  const [gravite, setGravite] = useState<SensRow["gravite_violation"]>("anomalie");
  const [commentaire, setCommentaire] = useState("");
  const [actif, setActif] = useState(true);

  const fetchRows = useCallback(async () => {
    if (!uai || !user) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cofieple_comptes_sens_normal")
      .select("*")
      .eq("uai", uai)
      .order("compte_prefix", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
      return;
    }
    setRows((data || []) as SensRow[]);
  }, [uai, user]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const resetForm = () => {
    setEditingId(null);
    setComptePrefix("");
    setLibelle("");
    setSensNormal("crediteur");
    setGravite("anomalie");
    setCommentaire("");
    setActif(true);
  };

  const startEdit = (row: SensRow) => {
    setEditingId(row.id);
    setComptePrefix(row.compte_prefix);
    setLibelle(row.libelle);
    setSensNormal(row.sens_normal);
    setGravite(row.gravite_violation);
    setCommentaire(row.commentaire);
    setActif(row.actif);
  };

  const refreshEngine = async () => {
    if (uai) await loadSensNormalOverridesFromSupabase(uai);
  };

  const handleSave = async () => {
    if (!uai || !user) {
      toast.error("Sélectionnez un établissement avant d'ajouter une règle.");
      return;
    }
    const prefix = comptePrefix.replace(/\s/g, "").replace(/^C\//i, "");
    if (!prefix) {
      toast.error("Préfixe de compte requis (ex : 515900, 28, 419).");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("cofieple_comptes_sens_normal")
          .update({
            compte_prefix: prefix,
            libelle,
            sens_normal: sensNormal,
            gravite_violation: gravite,
            commentaire,
            actif,
            source: "utilisateur",
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Règle mise à jour");
      } else {
        const { error } = await supabase
          .from("cofieple_comptes_sens_normal")
          .insert({
            uai,
            user_id: user.id,
            compte_prefix: prefix,
            libelle,
            sens_normal: sensNormal,
            gravite_violation: gravite,
            commentaire,
            actif,
            source: "utilisateur",
          });
        if (error) throw error;
        toast.success("Règle créée");
      }
      resetForm();
      await fetchRows();
      await refreshEngine();
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cofieple_comptes_sens_normal").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Règle supprimée");
    await fetchRows();
    await refreshEngine();
  };

  const handleToggleActif = async (row: SensRow) => {
    const { error } = await supabase
      .from("cofieple_comptes_sens_normal")
      .update({ actif: !row.actif })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await fetchRows();
    await refreshEngine();
  };

  const installPresets = async () => {
    if (!uai || !user) {
      toast.error("Sélectionnez d'abord un établissement.");
      return;
    }
    setSaving(true);
    try {
      const existingPrefixes = new Set(rows.map((r) => r.compte_prefix));
      const toInsert = PRESETS_M96
        .filter((p) => !existingPrefixes.has(p.compte_prefix))
        .map((p) => ({ ...p, uai, user_id: user.id }));
      if (toInsert.length === 0) {
        toast.info("Tous les presets M9-6 sont déjà installés.");
        return;
      }
      const { error } = await supabase.from("cofieple_comptes_sens_normal").insert(toInsert);
      if (error) throw error;
      toast.success(`${toInsert.length} règle(s) M9-6 installée(s)`);
      await fetchRows();
      await refreshEngine();
    } catch (e: any) {
      toast.error("Erreur installation presets : " + (e?.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const graviteBadge = (g: SensRow["gravite_violation"]) => {
    const opt = GRAVITE_OPTIONS.find((o) => o.value === g);
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${opt?.color}`}>{opt?.label}</span>;
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Règles « sens normal » des comptes
              {uai && <span className="ml-2 text-muted-foreground font-normal">— UAI {uai}</span>}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchRows} disabled={loading || !uai}>
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Recharger
            </Button>
            <Button size="sm" variant="outline" onClick={installPresets} disabled={saving || !uai}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Installer presets M9-6
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uai ? (
          <p className="text-sm text-muted-foreground">
            Sélectionnez un établissement pour gérer ses règles de sens normal.
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2 text-xs">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Le moteur M9-6 consulte ces règles en priorité.</p>
                <p className="text-muted-foreground">
                  Préfixe le plus long gagne (ex : <code className="font-mono">515900</code> l'emporte sur <code className="font-mono">515</code>).
                  Les modifications sont prises en compte immédiatement à la prochaine analyse.
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 rounded-lg bg-muted/30 border">
              <div className="md:col-span-2">
                <Label className="text-xs">Préfixe compte</Label>
                <Input
                  value={comptePrefix}
                  onChange={(e) => setComptePrefix(e.target.value)}
                  placeholder="515900"
                  className="mt-1 font-mono"
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Libellé (optionnel)</Label>
                <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Trésor règlements en cours" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Sens normal</Label>
                <Select value={sensNormal} onValueChange={(v) => setSensNormal(v as SensRow["sens_normal"])}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SENS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Gravité</Label>
                <Select value={gravite} onValueChange={(v) => setGravite(v as SensRow["gravite_violation"])}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRAVITE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Commentaire</Label>
                <Input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Justification / référence M9-6" className="mt-1" />
              </div>
              <div className="md:col-span-12 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={actif} onCheckedChange={setActif} id="actif-switch" />
                  <Label htmlFor="actif-switch" className="text-xs cursor-pointer">Règle active</Label>
                </div>
                <div className="flex gap-2">
                  {editingId && (
                    <Button size="sm" variant="ghost" onClick={resetForm}>Annuler</Button>
                  )}
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    {editingId ? "Mettre à jour" : "Ajouter la règle"}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Liste */}
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Chargement…
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucune règle pour le moment. Installez les presets M9-6 ou ajoutez votre première règle.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[110px]">Préfixe</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="w-[110px]">Sens</TableHead>
                      <TableHead className="w-[100px]">Gravité</TableHead>
                      <TableHead className="w-[90px]">Source</TableHead>
                      <TableHead className="w-[70px] text-center">Actif</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className={!row.actif ? "opacity-50" : ""}>
                        <TableCell className="font-mono text-xs">{row.compte_prefix}</TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{row.libelle || <span className="text-muted-foreground italic">—</span>}</div>
                          {row.commentaire && <div className="text-[10px] text-muted-foreground">{row.commentaire}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="capitalize">{row.sens_normal}</Badge>
                        </TableCell>
                        <TableCell>{graviteBadge(row.gravite_violation)}</TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={row.source === "M9-6" ? "default" : "secondary"} className="text-[10px]">
                                {row.source}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Source de la règle</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={row.actif} onCheckedChange={() => handleToggleActif(row)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>Éditer</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  La règle <code className="font-mono">{row.compte_prefix}</code> sera supprimée définitivement.
                                  Le moteur reviendra aux règles M9-6 codées en dur pour ce compte.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}