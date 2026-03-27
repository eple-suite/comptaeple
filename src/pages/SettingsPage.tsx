import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Database, Building2, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { selectedEstablishment, refetch } = useEstablishment();
  const [ordonnateur, setOrdonnateur] = useState("");
  const [agentComptable, setAgentComptable] = useState("");
  const [secretaireGeneral, setSecretaireGeneral] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedEstablishment) {
      setOrdonnateur(selectedEstablishment.ordonnateur || "");
      setAgentComptable(selectedEstablishment.agent_comptable || "");
      setSecretaireGeneral(selectedEstablishment.secretaire_general || "");
    }
  }, [selectedEstablishment]);

  const handleSaveIdentity = async () => {
    if (!selectedEstablishment) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({
          ordonnateur,
          agent_comptable: agentComptable,
          secretaire_general: secretaireGeneral,
        })
        .eq("id", selectedEstablishment.id);
      if (error) throw error;
      refetch();
      toast.success("Identité de l'établissement sauvegardée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration de l'application</p>
      </motion.div>

      {/* Identité établissement */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Identité de l'établissement
              {selectedEstablishment && (
                <span className="ml-2 text-muted-foreground font-normal">— {selectedEstablishment.name} ({selectedEstablishment.uai})</span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedEstablishment ? (
            <p className="text-sm text-muted-foreground">Sélectionnez un établissement dans le menu « Établissements » pour configurer son identité.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Ces noms seront automatiquement repris dans tous les rapports, signatures et documents PDF générés.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Ordonnateur (chef d'établissement)</Label>
                  <Input value={ordonnateur} onChange={e => setOrdonnateur(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Agent comptable</Label>
                  <Input value={agentComptable} onChange={e => setAgentComptable(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Secrétaire général(e)</Label>
                  <Input value={secretaireGeneral} onChange={e => setSecretaireGeneral(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
                </div>
              </div>
              <Button size="sm" onClick={handleSaveIdentity} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Enregistrer l'identité
              </Button>
            </>
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
