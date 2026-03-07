import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const importTypes = [
  { id: "balance", label: "Balance comptable", description: "Balance générale des comptes", format: "CSV / Excel", icon: FileSpreadsheet },
  { id: "budget", label: "Exécution budgétaire", description: "Données d'exécution budgétaire", format: "CSV / Excel", icon: FileSpreadsheet },
  { id: "immobilisations", label: "Immobilisations", description: "Inventaire des immobilisations", format: "CSV / Excel", icon: FileSpreadsheet },
  { id: "creances", label: "Créances & dettes", description: "État des créances et dettes", format: "CSV / Excel", icon: FileSpreadsheet },
];

const DataImport = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Import de données</h1>
        <p className="text-sm text-muted-foreground mt-1">Importez vos données comptables au format CSV ou Excel</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {importTypes.map((type) => (
          <Card key={type.id} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <type.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-sm">{type.label}</h3>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                  <Badge variant="secondary" className="text-[10px] mt-2">{type.format}</Badge>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">
                  <Upload className="h-4 w-4 mr-1" /> Importer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-dashed border-2">
        <CardContent className="p-10 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Glissez-déposez vos fichiers ici</p>
            <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner • CSV, XLS, XLSX acceptés</p>
          </div>
          <Button variant="outline">Parcourir les fichiers</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Derniers imports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "balance_2023.csv", date: "15/01/2024", status: "success" },
            { name: "budget_exec_2023.xlsx", date: "14/01/2024", status: "success" },
            { name: "creances_2023.csv", date: "14/01/2024", status: "error" },
          ].map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.date}</p>
                </div>
              </div>
              {file.status === "success" ? (
                <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Importé
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-0">
                  <AlertCircle className="h-3 w-3 mr-1" /> Erreur
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImport;
