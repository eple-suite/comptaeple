import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Plus, Loader2, CheckCircle2, Building2, GraduationCap, BookOpen, UtensilsCrossed, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
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

// Génère un UAI dérivé pour l'annexe : 7 chiffres du support + lettre dépendante du type
// Si collision (autre annexe même type), on incrémente le dernier chiffre numérique
const buildAnnexeUai = (supportUai: string, type: AnnexeType, existing: string[]): string => {
  const base = supportUai.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 7).padEnd(7, "0");
  const letter = ANNEXE_META[type].suffix;
  let candidate = `${base}${letter}`;
  let i = 1;
  while (existing.includes(candidate)) {
    // remplace dernier chiffre par i
    const num = base.slice(0, 6) + String(i % 10);
    candidate = `${num}${letter}`;
    i++;
    if (i > 99) break;
  }
  return candidate;
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

      const { data, error } = await supabase.from("establishments").upsert(
        {
          uai: uaiInput.toUpperCase(),
          name: lookupResult.nom_etablissement,
          type: lookupResult.type_etablissement || "Lycée",
          academy: lookupResult.libelle_academie || "",
          city: lookupResult.nom_commune || "",
          opale_number: opaleNumber.toUpperCase(),
        },
        { onConflict: "uai", ignoreDuplicates: false }
      ).select().single();
      if (error) throw error;

      if (user && data) {
        const { data: existingLink } = await supabase
          .from("user_establishments")
          .select("id")
          .eq("user_id", user.id)
          .eq("establishment_id", data.id)
          .maybeSingle();
        if (!existingLink) {
          await supabase.from("user_establishments").insert({
            user_id: user.id,
            establishment_id: data.id,
          });
        }
      }
      return data;
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
      if (!annexeOpale.trim() || !/^P\d{5}$/.test(annexeOpale.toUpperCase())) {
        throw new Error("Identifiant Op@le invalide (format P + 5 chiffres, ex: P00805).");
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Établissements</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos établissements et leurs budgets annexes (CFA, GRETA, SRH).</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code UAI ou nom..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-1" /> Ajouter
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
                          placeholder="Ex: P00805"
                          value={annexeOpale}
                          onChange={(e) => setAnnexeOpale(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Chaque budget annexe possède son propre code Op@le (différent du support).
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
