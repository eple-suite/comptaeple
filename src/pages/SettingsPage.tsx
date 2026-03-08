import { motion } from "framer-motion";
import { User, Bell, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SettingsPage = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration de l'application</p>
      </motion.div>

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
