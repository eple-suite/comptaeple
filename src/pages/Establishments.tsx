import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AnnuaireResult {
  nom_etablissement: string;
  type_etablissement: string;
  nom_commune: string;
  libelle_academie: string;
  identifiant_de_l_etablissement: string;
}

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
  const [uaiInput, setUaiInput] = useState("");
  const [opaleNumber, setOpaleNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<AnnuaireResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const queryClient = useQueryClient();

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("establishments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleLookup = async () => {
    if (uaiInput.length < 7) {
      setLookupError("Le code UAI doit contenir au moins 7 caractères");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const result = await fetchEstablishmentByUAI(uaiInput);
      if (result) {
        setLookupResult(result);
      } else {
        setLookupError("Aucun établissement trouvé pour ce code UAI");
      }
    } catch {
      setLookupError("Erreur lors de la recherche. Vérifiez votre connexion.");
    } finally {
      setLookupLoading(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!lookupResult) return;
      const opaleRegex = /^P\d{5}$/;
      if (opaleNumber && !opaleRegex.test(opaleNumber.toUpperCase())) {
        throw new Error("Le numéro Op@le doit être au format P00804 (P suivi de 5 chiffres)");
      }
      const { data, error } = await supabase.from("establishments").insert({
        uai: uaiInput.toUpperCase(),
        name: lookupResult.nom_etablissement,
        type: lookupResult.type_etablissement || "Lycée",
        academy: lookupResult.libelle_academie || "",
        city: lookupResult.nom_commune || "",
        opale_number: opaleNumber.toUpperCase(),
      }).select().single();
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        await supabase.from("user_establishments").insert({
          user_id: user.id,
          establishment_id: data.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      toast.success("Établissement ajouté avec succès");
      resetDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'ajout");
    },
  });

  const resetDialog = () => {
    setUaiInput("");
    setOpaleNumber("");
    setLookupResult(null);
    setLookupError("");
    setOpen(false);
  };

  const filtered = establishments.filter(
    (e) =>
      e.uai.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Établissements</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion multi-établissements par code UAI</p>
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un établissement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* UAI Lookup */}
              <div className="space-y-2">
                <Label>Code UAI *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 0910620T"
                    value={uaiInput}
                    onChange={(e) => {
                      setUaiInput(e.target.value.toUpperCase());
                      setLookupResult(null);
                      setLookupError("");
                    }}
                    maxLength={8}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookupLoading || uaiInput.length < 7}
                    variant="secondary"
                  >
                    {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-1">Rechercher</span>
                  </Button>
                </div>
                {lookupError && (
                  <p className="text-sm text-destructive">{lookupError}</p>
                )}
              </div>

              {/* Results */}
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

              {/* Op@le Number */}
              {lookupResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <Label>Numéro Op@le</Label>
                  <Input
                    placeholder="Ex: P00804"
                    value={opaleNumber}
                    onChange={(e) => setOpaleNumber(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce numéro sera utilisé pour valider les documents Op@le importés.
                  </p>
                </motion.div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button
                className="gradient-primary border-0"
                disabled={!lookupResult || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? "Ajout..." : "Ajouter l'établissement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code UAI</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Académie</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>N° Op@le</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun établissement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-semibold text-primary">{e.uai}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{e.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{e.academy}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.city}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {(e as any).opale_number || "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Charger</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Establishments;
