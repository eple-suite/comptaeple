import { motion } from "framer-motion";
import { Settings, User, Bell, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SettingsPage = () => {
  const [uaiInput, setUaiInput] = useState("");
  const [opaleNumber, setOpaleNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<AnnuaireResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const queryClient = useQueryClient();

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
      setUaiInput("");
      setOpaleNumber("");
      setLookupResult(null);
      setLookupError("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'ajout");
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration de l'application</p>
      </motion.div>

      {/* Établissement — UAI lookup only */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Ajouter un établissement</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Code UAI</Label>
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
                onClick={handleLookup}
                disabled={lookupLoading || uaiInput.length < 7}
                variant="secondary"
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1">Rechercher</span>
              </Button>
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

              <Separator />

              <div className="space-y-2">
                <Label>Numéro Op@le</Label>
                <Input
                  placeholder="Ex: P00804"
                  value={opaleNumber}
                  onChange={(e) => setOpaleNumber(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Format : P suivi de 5 chiffres. Servira à valider les documents Op@le importés.
                </p>
              </div>

              <Button
                className="gradient-primary border-0"
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? "Ajout..." : "Ajouter l'établissement"}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Profil utilisateur */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Profil utilisateur</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nom</Label><Input defaultValue="Agent Comptable" /></div>
            <div><Label>Email</Label><Input type="email" defaultValue="agent@ac-versailles.fr" /></div>
          </div>
          <Button size="sm" variant="outline">Changer le mot de passe</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Notifications & Alertes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Alerte FDR sous le seuil", desc: "Notification si le FDR passe sous 30 jours", defaultChecked: true },
            { label: "Créances anciennes", desc: "Alerte pour les créances > 1 an", defaultChecked: true },
            { label: "Import de données", desc: "Notification après chaque import", defaultChecked: false },
            { label: "Rapports hebdomadaires", desc: "Résumé financier par email", defaultChecked: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.defaultChecked} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Données */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Données</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Exercice en cours</p>
              <p className="text-xs text-muted-foreground">Année de référence pour les analyses</p>
            </div>
            <Select defaultValue="2023">
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Exporter toutes les données</Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">Réinitialiser les données</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
