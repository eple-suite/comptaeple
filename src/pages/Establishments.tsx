import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, MapPin, Plus, Loader2, CheckCircle2, Building2, GraduationCap, BookOpen, UtensilsCrossed, Layers, Trash2, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";

interface AnnuaireResult {
  nom_etablissement: string;
  type_etablissement: string;
  nom_commune: string;
  libelle_academie: string;
  identifiant_de_l_etablissement: string;
}

type AnnexeType = "CFA" | "GRETA" | "SRH" | "AUTRE";

const ANNEXE_META: Record<AnnexeType, { label: string; full: string; icon: React.ReactNode; suffix: string; typeLabel: string }> = {
  CFA: { label: "CFA", full: "Centre de Formation d'Apprentis", icon: <BookOpen className="h-4 w-4" />, suffix: "C", typeLabel: "Budget annexe CFA" },
  GRETA: { label: "GRETA", full: "Formation continue (GRETA)", icon: <GraduationCap className="h-4 w-4" />, suffix: "G", typeLabel: "Budget annexe GRETA" },
  SRH: { label: "SRH", full: "Service de Restauration et d'Hébergement", icon: <UtensilsCrossed className="h-4 w-4" />, suffix: "R", typeLabel: "Budget annexe SRH" },
  AUTRE: { label: "Autre", full: "Autre budget annexe", icon: <Layers className="h-4 w-4" />, suffix: "X", typeLabel: "Budget annexe" },
};

const fetchEstablishmentByUAI = async (uai: string): Promise<AnnuaireResult | null> => {
  const url = `https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-annuaire-education&q=&refine.identifiant_de_l_etablissement=${uai.toUpperCase()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur réseau");
  const json = await res.json();
  if (json.records && json.records.length > 0) {
    return json.records[0].fields as AnnuaireResult;
  }
  return null;
};


const Establishments = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"principal" | "annexe">("principal");

  // ---- Onglet Principal (UAI annuaire) ----
  const [uaiInput, setUaiInput] = useState("");
  const [opaleNumber, setOpaleNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<AnnuaireResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // ---- Onglet Annexe (rattachement) ----
  const [annexeSupportId, setAnnexeSupportId] = useState<string>("");
  const [annexeType, setAnnexeType] = useState<AnnexeType>("CFA");
  const [annexeName, setAnnexeName] = useState("");
  const [annexeOpale, setAnnexeOpale] = useState("");
  const [annexeUaiInput, setAnnexeUaiInput] = useState("");
  const [annexeLookupLoading, setAnnexeLookupLoading] = useState(false);
  const [annexeLookupDone, setAnnexeLookupDone] = useState(false); // true après une recherche (succès ou échec)
  const [annexeLookupFound, setAnnexeLookupFound] = useState<AnnuaireResult | null>(null);
  const [annexeLookupError, setAnnexeLookupError] = useState("");

  const queryClient = useQueryClient();
  const { establishments, selectedEstablishment, selectEstablishment, isLoading, refetch } = useEstablishment();
  const { user } = useAuth();

  const uaiInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && tab === "principal") {
      setTimeout(() => uaiInputRef.current?.focus(), 100);
    }
  }, [open, tab]);

  const handleLookup = async (value?: string) => {
    const uai = (value || uaiInput).trim().toUpperCase();
    if (uai.length < 7) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const result = await fetchEstablishmentByUAI(uai);
      if (result) setLookupResult(result);
      else setLookupError("Aucun établissement trouvé. Si c'est un budget annexe (CFA, GRETA, SRH), utilisez l'onglet « Budget annexe ».");
    } catch {
      setLookupError("Erreur lors de la recherche. Vérifiez votre connexion.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setUaiInput(val);
    setLookupResult(null);
    setLookupError("");
    if (/^[0-9]{7}[A-Z]$/i.test(val)) handleLookup(val);
  };

  const existingLocal = establishments.find(
    (e) => e.uai.toUpperCase() === uaiInput.toUpperCase()
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!lookupResult) return;
      if (!opaleNumber.trim()) {
        throw new Error("L'identifiant Op@le est obligatoire (format : P + 5 chiffres, ex: P00804).");
      }
      if (!/^P\d{5}$/.test(opaleNumber.toUpperCase())) {
        throw new Error("Le numéro Op@le doit être au format P00804 (P suivi de 5 chiffres)");
      }

      const uaiUp = uaiInput.toUpperCase();
      let establishment: any = null;

      // 1) L'EPLE existe-t-il déjà en base (visible si non revendiqué ou déjà rattaché à moi) ?
      const { data: existing } = await supabase
        .from("establishments")
        .select("*")
        .eq("uai", uaiUp)
        .maybeSingle();

      if (existing) {
        establishment = existing;
        // Mise à jour facultative du n° Op@le si l'utilisateur en saisit un nouveau
        if (opaleNumber && existing.opale_number !== opaleNumber.toUpperCase()) {
          const { data: upd } = await supabase
            .from("establishments")
            .update({ opale_number: opaleNumber.toUpperCase() })
            .eq("id", existing.id)
            .select()
            .maybeSingle();
          if (upd) establishment = upd;
        }
      } else {
        // 2) Création — peut échouer RLS si l'UAI existe mais est déjà revendiqué par un autre compte
        const { data: created, error: insErr } = await supabase
          .from("establishments")
          .insert({
            uai: uaiUp,
            name: lookupResult.nom_etablissement,
            type: lookupResult.type_etablissement || "Lycée",
            academy: lookupResult.libelle_academie || "",
            city: lookupResult.nom_commune || "",
            opale_number: opaleNumber.toUpperCase(),
          })
          .select()
          .single();
        if (insErr) {
          if (insErr.message?.includes("row-level security") || insErr.code === "42501") {
            throw new Error(
              `L'UAI ${uaiUp} est déjà enregistré et rattaché à un autre compte. Demandez à un administrateur de vous y donner accès.`
            );
          }
          throw insErr;
        }
        establishment = created;
      }

      // 3) Rattachement de l'utilisateur (idempotent)
      if (user && establishment) {
        const { data: existingLink } = await supabase
          .from("user_establishments")
          .select("id")
          .eq("user_id", user.id)
          .eq("establishment_id", establishment.id)
          .maybeSingle();
        if (!existingLink) {
          const { error: linkErr } = await supabase.from("user_establishments").insert({
            user_id: user.id,
            establishment_id: establishment.id,
          });
          if (linkErr) {
            if (linkErr.message?.includes("row-level security") || linkErr.code === "42501") {
              throw new Error(
                `L'établissement ${uaiUp} est déjà rattaché à un autre compte. Contactez un administrateur pour obtenir l'accès.`
              );
            }
            throw linkErr;
          }
        }
      }
      return establishment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-establishments"] });
      refetch();
      toast.success(existingLocal ? "Établissement mis à jour" : "Établissement ajouté");
      if (data) selectEstablishment(data);
      resetDialog();
    },
    onError: (err: any) => toast.error(err.message || "Erreur lors de l'ajout"),
  });

  // Suppression : détache l'utilisateur de l'EPLE. Si plus aucun rattachement et EPLE non revendiqué,
  // on supprime aussi la fiche `establishments` et son lien `establishment_annexes` éventuel.
  const deleteMutation = useMutation({
    mutationFn: async (estId: string) => {
      if (!user) throw new Error("Non authentifié");
      // 1) Supprime mon rattachement
      const { error: delLinkErr } = await supabase
        .from("user_establishments")
        .delete()
        .eq("user_id", user.id)
        .eq("establishment_id", estId);
      if (delLinkErr) throw delLinkErr;

      // 2) S'il ne reste aucun utilisateur rattaché, on tente de supprimer la fiche
      const { count } = await supabase
        .from("user_establishments")
        .select("id", { count: "exact", head: true })
        .eq("establishment_id", estId);
      if ((count ?? 0) === 0) {
        // Nettoyage liens annexes (support ou annexe)
        await supabase.from("establishment_annexes").delete().eq("annexe_establishment_id", estId);
        await supabase.from("establishment_annexes").delete().eq("support_establishment_id", estId);
        // Suppression de l'établissement (peut être bloquée par RLS/FK : on ignore l'erreur silencieusement)
        await supabase.from("establishments").delete().eq("id", estId);
      }
      return estId;
    },
    onSuccess: (estId) => {
      queryClient.invalidateQueries({ queryKey: ["user-establishments"] });
      refetch();
      if (selectedEstablishment?.id === estId) {
        const remaining = establishments.filter((x) => x.id !== estId);
        if (remaining[0]) selectEstablishment(remaining[0]);
      }
      toast.success("Établissement retiré de votre liste");
    },
    onError: (err: any) => toast.error(err.message || "Suppression impossible"),
  });

  // ---- Lookup UAI pour annexe ----
  const handleAnnexeLookup = async (val?: string) => {
    const uai = (val ?? annexeUaiInput).trim().toUpperCase();
    if (!/^[0-9]{7}[A-Z]$/.test(uai)) return;
    setAnnexeLookupLoading(true);
    setAnnexeLookupError("");
    setAnnexeLookupFound(null);
    setAnnexeLookupDone(false);
    try {
      const res = await fetchEstablishmentByUAI(uai);
      if (res) {
        setAnnexeLookupFound(res);
        setAnnexeName(res.nom_etablissement || "");
      } else {
        setAnnexeLookupError("UAI introuvable dans l'annuaire — saisie manuelle activée ci-dessous.");
      }
    } catch {
      setAnnexeLookupError("Erreur réseau — vous pouvez saisir les informations manuellement ci-dessous.");
    } finally {
      setAnnexeLookupLoading(false);
      setAnnexeLookupDone(true);
    }
  };

  const handleAnnexeUaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setAnnexeUaiInput(val);
    setAnnexeLookupFound(null);
    setAnnexeLookupError("");
    setAnnexeLookupDone(false);
    if (/^[0-9]{7}[A-Z]$/.test(val)) handleAnnexeLookup(val);
  };

  const annexeUaiValid = /^[0-9]{7}[A-Z]$/.test(annexeUaiInput.trim().toUpperCase());
  const annexeUaiAlreadyExists = establishments.some(
    e => e.uai.toUpperCase() === annexeUaiInput.trim().toUpperCase()
  );

  // ---- Mutation Annexe ----
  const annexeMutation = useMutation({
    mutationFn: async () => {
      if (!annexeSupportId) throw new Error("Sélectionnez l'établissement support (lycée principal).");
      const uai = annexeUaiInput.trim().toUpperCase();
      if (!annexeUaiValid) throw new Error("UAI invalide (format : 7 chiffres + 1 lettre, ex: 9710746J).");
      if (annexeUaiAlreadyExists) throw new Error("Cet UAI est déjà enregistré dans votre liste.");
      if (!annexeName.trim()) throw new Error("Le nom du budget annexe est obligatoire.");
      if (!annexeOpale.trim() || !/^A\d{5}$/.test(annexeOpale.toUpperCase())) {
        throw new Error("Identifiant Op@le du budget annexe invalide (format A + 5 chiffres, ex: A00805).");
      }
      const support = establishments.find(e => e.id === annexeSupportId);
      if (!support) throw new Error("Établissement support introuvable.");

      const meta = ANNEXE_META[annexeType];
      const academy = annexeLookupFound?.libelle_academie || support.academy;
      const city = annexeLookupFound?.nom_commune || support.city;

      const { data: created, error } = await supabase.from("establishments").insert({
        uai,
        name: annexeName.trim(),
        type: meta.typeLabel,
        academy,
        city,
        opale_number: annexeOpale.toUpperCase(),
      }).select().single();
      if (error) throw error;

      if (user && created) {
        await supabase.from("user_establishments").insert({
          user_id: user.id,
          establishment_id: created.id,
        });
      }

      // Lien dans establishment_annexes (pour consolidation comptable compte 185)
      if (created) {
        const budgetTypeMap: Record<AnnexeType, string> = {
          CFA: "annexe_cfa",
          GRETA: "annexe_greta",
          SRH: "annexe_autre",
          AUTRE: "annexe_autre",
        };
        await supabase.from("establishment_annexes").insert({
          support_establishment_id: annexeSupportId,
          annexe_establishment_id: created.id,
          budget_type: budgetTypeMap[annexeType],
          compte_185_solde: 0,
        });
      }
      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-establishments"] });
      refetch();
      toast.success("Budget annexe créé et rattaché");
      if (data) selectEstablishment(data);
      resetDialog();
    },
    onError: (err: any) => toast.error(err.message || "Erreur lors de la création du budget annexe"),
  });

  const resetDialog = () => {
    setUaiInput("");
    setOpaleNumber("");
    setLookupResult(null);
    setLookupError("");
    setAnnexeSupportId("");
    setAnnexeType("CFA");
    setAnnexeName("");
    setAnnexeOpale("");
    setAnnexeUaiInput("");
    setAnnexeLookupFound(null);
    setAnnexeLookupError("");
    setAnnexeLookupDone(false);
    setTab("principal");
    setOpen(false);
  };

  const filtered = establishments.filter(
    (e) =>
      e.uai.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  // Établissements principaux uniquement (UAI finissant par une lettre standard non annexe)
  const supportCandidates = establishments.filter(e => {
    const t = (e.type || "").toLowerCase();
    return !t.includes("annexe") && !t.includes("cfa") && !t.includes("greta") && !t.includes("srh");
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display">Établissements</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos établissements et leurs budgets annexes (CFA, GRETA, SRH).</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/audit"><ClipboardCheck className="h-4 w-4 mr-1.5" /> Auditer un établissement</Link>
        </Button>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrer la liste ci-dessous (UAI ou nom)…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button
              className="gradient-primary border-0"
              onClick={() => {
                // Préremplit le dialogue avec ce qui est tapé dans la barre si c'est un UAI valide
                const candidate = search.trim().toUpperCase();
                if (/^[0-9]{7}[A-Z]$/.test(candidate)) {
                  setUaiInput(candidate);
                  // déclenche la recherche annuaire
                  setTimeout(() => handleLookup(candidate), 50);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter un établissement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
              <DialogTitle>Ajouter un établissement</DialogTitle>
              <DialogDescription>
                Établissement principal ou budget annexe (CFA, GRETA, SRH) — recherche par UAI.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-3 shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principal" className="gap-2">
                    <Building2 className="h-4 w-4" /> Établissement principal
                  </TabsTrigger>
                  <TabsTrigger value="annexe" className="gap-2">
                    <Layers className="h-4 w-4" /> Budget annexe
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {/* ============ ONGLET PRINCIPAL ============ */}
                <TabsContent value="principal" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Code UAI <span className="text-muted-foreground text-xs">(7 chiffres + 1 lettre)</span></Label>
                    <div className="flex gap-2">
                      <Input
                        ref={uaiInputRef}
                        placeholder="Ex: 0910620T"
                        value={uaiInput}
                        onChange={handleUaiChange}
                        maxLength={8}
                        className="font-mono"
                      />
                      {lookupLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />}
                    </div>
                    {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
                  </div>

                  {lookupResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold text-sm">Établissement trouvé</span>
                      </div>
                      {existingLocal && (
                        <div className="rounded-md bg-warning/10 border border-warning/30 p-2 text-xs text-warning">
                          ⚠️ Cet UAI est déjà dans votre liste. La fiche sera mise à jour.
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Nom</span>
                          <p className="font-medium">{lookupResult.nom_etablissement}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Type</span>
                          <p className="font-medium">{lookupResult.type_etablissement || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Académie</span>
                          <p className="font-medium">{lookupResult.libelle_academie || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Ville</span>
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lookupResult.nom_commune || "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {lookupResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <Label>Identifiant Op@le *</Label>
                      <Input
                        placeholder="Ex: P00804"
                        value={opaleNumber}
                        onChange={(e) => setOpaleNumber(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="font-mono"
                      />
                      <p className="text-xs text-destructive/80 font-medium">
                        ⚠️ Obligatoire — Verrou de sécurité pour l'import des fichiers Op@le.
                      </p>
                    </motion.div>
                  )}
                </TabsContent>

                {/* ============ ONGLET ANNEXE ============ */}
                <TabsContent value="annexe" className="space-y-4 mt-0">
                  {supportCandidates.length === 0 ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
                      <p className="font-medium text-warning">Aucun établissement support disponible.</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Ajoutez d'abord un établissement principal avant de créer un budget annexe rattaché.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Code UAI du budget annexe * <span className="text-muted-foreground text-xs">(7 chiffres + 1 lettre)</span></Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: 9710746J"
                            value={annexeUaiInput}
                            onChange={handleAnnexeUaiChange}
                            maxLength={8}
                            className="font-mono"
                          />
                          {annexeLookupLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />}
                        </div>
                        {annexeUaiAlreadyExists && (
                          <p className="text-xs text-destructive">⚠️ Cet UAI est déjà enregistré dans votre liste.</p>
                        )}
                        {annexeLookupFound && (
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                              <CheckCircle2 className="h-4 w-4" />
                              Trouvé dans l'annuaire — informations préremplies
                            </div>
                            <p className="text-foreground">{annexeLookupFound.nom_etablissement}</p>
                            <p className="text-muted-foreground">
                              {annexeLookupFound.libelle_academie} · {annexeLookupFound.nom_commune}
                            </p>
                          </div>
                        )}
                        {annexeLookupDone && !annexeLookupFound && annexeUaiValid && (
                          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
                            <p className="font-medium text-warning">ℹ️ UAI non référencé dans l'annuaire</p>
                            <p className="text-muted-foreground mt-1">
                              C'est normal pour la plupart des budgets annexes (CFA, GRETA, SRH). Complétez les champs ci-dessous manuellement.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Établissement support * <span className="text-muted-foreground text-xs">(lycée principal de rattachement comptable)</span></Label>
                        <Select value={annexeSupportId} onValueChange={setAnnexeSupportId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le lycée support…" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportCandidates.map(e => (
                              <SelectItem key={e.id} value={e.id}>
                                <span className="font-mono text-xs mr-2">{e.uai}</span>
                                {e.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Type de budget annexe *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(ANNEXE_META) as AnnexeType[]).map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setAnnexeType(t)}
                              className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-all ${
                                annexeType === t
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              {ANNEXE_META[t].icon}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{ANNEXE_META[t].label}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{ANNEXE_META[t].full}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Nom du budget annexe *</Label>
                        <Input
                          placeholder={`Ex: ${ANNEXE_META[annexeType].full}`}
                          value={annexeName}
                          onChange={(e) => setAnnexeName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Identifiant Op@le du budget annexe *</Label>
                        <Input
                          placeholder="Ex: A00805"
                          value={annexeOpale}
                          onChange={(e) => setAnnexeOpale(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Chaque budget annexe possède son propre code Op@le commençant par <strong>A</strong> (différent du support en P).
                        </p>
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              {tab === "principal" ? (
                <Button
                  className="gradient-primary border-0"
                  disabled={!lookupResult || addMutation.isPending}
                  onClick={() => addMutation.mutate()}
                >
                  {addMutation.isPending ? "En cours..." : existingLocal ? "Mettre à jour" : "Ajouter"}
                </Button>
              ) : (
                <Button
                  className="gradient-primary border-0"
                  disabled={
                    annexeMutation.isPending ||
                    supportCandidates.length === 0 ||
                    !annexeUaiValid ||
                    annexeUaiAlreadyExists ||
                    !annexeSupportId ||
                    !annexeName.trim() ||
                    !annexeOpale.trim()
                  }
                  onClick={() => annexeMutation.mutate()}
                >
                  {annexeMutation.isPending ? "Création…" : "Créer le budget annexe"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Code UAI</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Académie</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>N° Op@le</TableHead>
                <TableHead>Ordonnateur</TableHead>
                <TableHead>Agent comptable</TableHead>
                <TableHead>Secrétaire général</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {establishments.length === 0
                      ? "Aucun établissement. Cliquez sur « Ajouter » pour commencer."
                      : "Aucun résultat pour cette recherche."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const isSelected = selectedEstablishment?.id === e.id;
                  const isAnnexe = (e.type || "").toLowerCase().includes("annexe");
                  return (
                    <TableRow
                      key={e.id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"}`}
                      onClick={() => {
                        selectEstablishment(e);
                        toast.success(`${e.name} sélectionné`);
                      }}
                    >
                      <TableCell>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-primary">{e.uai}</TableCell>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell>
                        <Badge variant={isAnnexe ? "outline" : "secondary"} className="text-[10px]">
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.academy}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {e.city}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{e.opale_number || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.ordonnateur || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.agent_comptable || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.secretaire_general || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(ev) => ev.stopPropagation()}>
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              selectEstablishment(e);
                              toast.success(`${e.name} sélectionné`);
                            }}
                          >
                            {isSelected ? "✓ Actif" : "Sélectionner"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Supprimer de ma liste"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(ev) => ev.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer « {e.name} » ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  L'établissement <span className="font-mono">{e.uai}</span> sera retiré de votre liste.
                                  Si aucun autre utilisateur n'y est rattaché, sa fiche sera entièrement supprimée
                                  (y compris ses liens de budgets annexes). Les données d'imports et historiques
                                  associés peuvent être conservés selon les politiques en place.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(e.id)}
                                >
                                  {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Establishments;
