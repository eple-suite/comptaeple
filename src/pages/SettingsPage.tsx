import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Database, Building2, Save, Loader2, MapPin, Phone, Mail, Users, Download, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clearAllCofiepleData } from "@/hooks/usePersistedState";
import { store } from "@/store/persistentStore";
import ComptesSensNormalManager from "@/components/settings/ComptesSensNormalManager";

const SettingsPage = () => {
  const { selectedEstablishment, refetch } = useEstablishment();
  const { user } = useAuth();
  const [ordonnateur, setOrdonnateur] = useState("");
  const [agentComptable, setAgentComptable] = useState("");
  const [secretaireGeneral, setSecretaireGeneral] = useState("");
  const [opaleNumber, setOpaleNumber] = useState("");
  const [saving, setSaving] = useState(false);

  // Profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [academy, setAcademy] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (selectedEstablishment) {
      setOrdonnateur(selectedEstablishment.ordonnateur || "");
      setAgentComptable(selectedEstablishment.agent_comptable || "");
      setSecretaireGeneral(selectedEstablishment.secretaire_general || "");
      setOpaleNumber(selectedEstablishment.opale_number || "");
    }
  }, [selectedEstablishment]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setAcademy(data.academy || "");
        }
      });
    }
  }, [user]);

  const handleSaveIdentity = async () => {
    if (!selectedEstablishment) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ ordonnateur, agent_comptable: agentComptable, secretaire_general: secretaireGeneral, opale_number: opaleNumber })
        .eq("id", selectedEstablishment.id);
      if (error) throw error;
      refetch();
      toast.success("Identité de l'établissement sauvegardée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName, academy })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil sauvegardé");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally { setSavingProfile(false); }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      const tables = ['cofieple_exercises', 'cofieple_extra_indicators', 'cofieple_snapshots', 'cofieple_audit_trail', 'cofieple_import_logs'] as const;
      const exportData: Record<string, any> = { _exportedAt: new Date().toISOString(), _userId: user.id };
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
        exportData[table] = data || [];
      }
      const { data: ueData } = await supabase.from('user_establishments').select('establishment_id, establishments(*)').eq('user_id', user.id);
      exportData['establishments'] = (ueData || []).map((r: any) => r.establishments);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `cockpit-eple-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Données exportées avec succès');
    } catch (e: any) { toast.error('Erreur export : ' + (e.message || '')); }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data._exportedAt) throw new Error('Fichier invalide');
      if (data.cofieple_exercises?.length > 0) {
        for (const row of data.cofieple_exercises) {
          const { id, created_at, ...rest } = row;
          await supabase.from('cofieple_exercises').upsert({ ...rest, user_id: user.id }, { onConflict: 'user_id,uai,exercice,type_budget' });
        }
      }
      if (data.cofieple_extra_indicators?.length > 0) {
        for (const row of data.cofieple_extra_indicators) {
          const { id, created_at, ...rest } = row;
          await supabase.from('cofieple_extra_indicators').upsert({ ...rest, user_id: user.id }, { onConflict: 'user_id,uai,exercice' });
        }
      }
      if (data.cofieple_snapshots?.length > 0) {
        for (const row of data.cofieple_snapshots) {
          const { id, created_at, ...rest } = row;
          await supabase.from('cofieple_snapshots').upsert({ ...rest, user_id: user.id }, { onConflict: 'user_id,uai,exercice,budget_type' });
        }
      }
      toast.success('Import terminé — données restaurées');
    } catch (err: any) { toast.error('Erreur import : ' + (err.message || 'fichier invalide')); }
    e.target.value = '';
  };

  const academies = [
    "Aix-Marseille", "Amiens", "Besançon", "Bordeaux", "Clermont-Ferrand",
    "Corse", "Créteil", "Dijon", "Grenoble", "Guadeloupe", "Guyane",
    "Lille", "Limoges", "Lyon", "Martinique", "Mayotte", "Montpellier",
    "Nancy-Metz", "Nantes", "Nice", "Normandie", "Nouvelle-Calédonie",
    "Orléans-Tours", "Paris", "Poitiers", "Polynésie française", "Reims",
    "Rennes", "Réunion", "Strasbourg", "Toulouse", "Versailles",
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration de l'application et de l'établissement</p>
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
              <p className="text-xs text-muted-foreground">Ces informations sont automatiquement reprises dans tous les rapports, signatures et documents PDF.</p>

              <Separator />
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wide text-primary">Équipe de direction</Label>
              </div>
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
                  <Label className="text-xs">Secrétaire général(e) (SGEPLE)</Label>
                  <Input value={secretaireGeneral} onChange={e => setSecretaireGeneral(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
                </div>
              </div>

              <Separator />
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wide text-primary">Coordonnées</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Nom de l'établissement</Label>
                  <Input value={selectedEstablishment.name} disabled className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Code UAI (RNE)</Label>
                  <Input value={selectedEstablishment.uai} disabled className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Input value={selectedEstablishment.type} disabled className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Académie</Label>
                  <Input value={selectedEstablishment.academy} disabled className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Ville</Label>
                  <Input value={selectedEstablishment.city} disabled className="mt-1 bg-muted/30" />
                </div>
              </div>

              <Separator />
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wide text-primary">Identifiant Op@le</Label>
              </div>
              <div className="max-w-sm">
                <Label className="text-xs">N° Op@le (ex : P12345)</Label>
                <Input
                  value={opaleNumber}
                  onChange={e => setOpaleNumber(e.target.value.toUpperCase())}
                  placeholder="P00000"
                  className="mt-1 font-mono"
                  maxLength={10}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Ce numéro sera utilisé pour valider automatiquement les fichiers importés depuis Op@le. Tout document portant un numéro différent sera rejeté.
                </p>
              </div>

              <p className="text-[10px] text-muted-foreground italic">Les informations grisées sont modifiables depuis le menu « Établissements ».</p>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Prénom</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nom</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label className="text-xs">Académie</Label>
              <Select value={academy} onValueChange={setAcademy}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {academies.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Enregistrer le profil
            </Button>
            <Button size="sm" variant="outline">Changer le mot de passe</Button>
          </div>
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
            <CardTitle className="text-sm font-semibold">Données & Exercice</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Exercice en cours</p>
              <p className="text-xs text-muted-foreground">Année de référence pour les analyses</p>
            </div>
            <Select defaultValue="2025">
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportData}>
              <Download className="h-3.5 w-3.5" /> Exporter les données (JSON)
            </Button>
            <label>
              <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer" asChild>
                <span><Upload className="h-3.5 w-3.5" /> Importer des données</span>
              </Button>
              <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
            </label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Effacer toutes les données
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>🗑️ Effacer toutes les données saisies</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr ? Cette action supprimera définitivement toutes vos données saisies
                    (commentaires, rapports, indicateurs manuels). Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      clearAllCofiepleData();
                      store.clearAll();
                      toast.success("Toutes les données locales ont été supprimées.");
                      window.location.reload();
                    }}
                  >
                    Confirmer la suppression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
