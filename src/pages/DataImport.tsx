import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, FileUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ImportResult {
  fileName: string;
  type: string;
  rows: number;
  columns: string[];
  data: Record<string, string>[];
  status: "success" | "error";
  error?: string;
  date: string;
}

const importTypes = [
  { id: "balance", label: "Balance comptable", description: "Balance générale des comptes", icon: FileSpreadsheet },
  { id: "budget", label: "Exécution budgétaire", description: "Données d'exécution budgétaire", icon: FileSpreadsheet },
  { id: "immobilisations", label: "Immobilisations", description: "Inventaire des immobilisations", icon: FileSpreadsheet },
  { id: "creances", label: "Créances & dettes", description: "État des créances et dettes", icon: FileSpreadsheet },
];

const DataImport = () => {
  const [imports, setImports] = useState<ImportResult[]>([]);
  const [selectedType, setSelectedType] = useState("balance");
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<ImportResult | null>(null);

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    const processData = (data: Record<string, string>[]) => {
      if (data.length === 0) {
        const result: ImportResult = {
          fileName: file.name, type: selectedType, rows: 0, columns: [], data: [],
          status: "error", error: "Fichier vide", date: new Date().toLocaleDateString("fr-FR"),
        };
        setImports((prev) => [result, ...prev]);
        toast({ title: "Erreur", description: "Le fichier est vide.", variant: "destructive" });
        return;
      }
      const columns = Object.keys(data[0]);
      const result: ImportResult = {
        fileName: file.name, type: selectedType, rows: data.length, columns,
        data: data.slice(0, 100), status: "success",
        date: new Date().toLocaleDateString("fr-FR"),
      };
      setImports((prev) => [result, ...prev]);
      setPreviewData(result);
      toast({ title: "Import réussi", description: `${data.length} lignes importées depuis ${file.name}` });
    };

    if (ext === "csv") {
      Papa.parse(file, {
        header: true, skipEmptyLines: true, encoding: "UTF-8",
        complete: (results) => processData(results.data as Record<string, string>[]),
        error: (error) => {
          setImports((prev) => [{
            fileName: file.name, type: selectedType, rows: 0, columns: [], data: [],
            status: "error", error: error.message, date: new Date().toLocaleDateString("fr-FR"),
          }, ...prev]);
          toast({ title: "Erreur de parsing", description: error.message, variant: "destructive" });
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
          processData(data);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur inconnue";
          setImports((prev) => [{
            fileName: file.name, type: selectedType, rows: 0, columns: [], data: [],
            status: "error", error: msg, date: new Date().toLocaleDateString("fr-FR"),
          }, ...prev]);
          toast({ title: "Erreur Excel", description: msg, variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({ title: "Format non supporté", description: "Utilisez CSV, XLS ou XLSX.", variant: "destructive" });
    }
  }, [selectedType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(parseFile);
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(parseFile);
    e.target.value = "";
  }, [parseFile]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Import de données</h1>
        <p className="text-sm text-muted-foreground mt-1">Importez vos données comptables au format CSV ou Excel</p>
      </motion.div>

      <div className="flex items-center gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {importTypes.map((t) => (<SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">Type : {importTypes.find((t) => t.id === selectedType)?.label}</Badge>
      </div>

      <Card
        className={`shadow-card border-dashed border-2 transition-colors ${dragActive ? "border-primary bg-primary/5" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-10 text-center space-y-4">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center transition-colors ${dragActive ? "bg-primary/20" : "bg-muted"}`}>
            <FileUp className={`h-8 w-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-semibold">{dragActive ? "Déposez le fichier ici" : "Glissez-déposez vos fichiers ici"}</p>
            <p className="text-sm text-muted-foreground mt-1">CSV, XLS, XLSX acceptés • Max 20 Mo</p>
          </div>
          <label>
            <input type="file" accept=".csv,.xls,.xlsx" multiple onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" asChild><span>Parcourir les fichiers</span></Button>
          </label>
        </CardContent>
      </Card>

      {previewData && previewData.status === "success" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Aperçu : {previewData.fileName} ({previewData.rows} lignes)
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setPreviewData(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap text-xs">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.data.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      {previewData.columns.map((col) => (
                        <TableCell key={col} className="text-xs whitespace-nowrap">{String(row[col] ?? "")}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {previewData.data.length > 20 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Affichage des 20 premières lignes sur {previewData.rows}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {imports.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Historique des imports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imports.map((imp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{imp.fileName}</p>
                    <p className="text-xs text-muted-foreground">{imp.date} • {imp.rows} lignes • {importTypes.find((t) => t.id === imp.type)?.label}</p>
                  </div>
                </div>
                {imp.status === "success" ? (
                  <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Importé
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-0">
                    <AlertCircle className="h-3 w-3 mr-1" /> {imp.error || "Erreur"}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataImport;
