/**
 * Import SIECLE / CSV pour les élèves — inspiré MobiliSCO T01_BASE ELEVE
 * Permet d'importer la base élèves depuis un export SIECLE CSV
 */
import { useState, useRef } from "react";
import { Upload, FileText, Users, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Voyage, Eleve } from "./types";
import { toast } from "sonner";
import Papa from "papaparse";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

interface ParsedEleve {
  nom: string;
  prenom: string;
  classe: string;
  regime: string;
  responsable: string;
  email: string;
  tel: string;
  selected: boolean;
}

// Mapping colonnes SIECLE BEE → champs internes
const SIECLE_MAPPINGS: Record<string, string[]> = {
  nom: ["Nom", "NomPrénomElève", "Nom de famille", "nom"],
  prenom: ["Prénom", "Prénom 2", "prenom"],
  classe: ["Lib Structure", "Code Structure", "classe"],
  regime: ["Lib Régime", "Code Régime", "regime"],
  responsable: ["ConcaReprLég", "Nom Repr Lég", "responsable", "responsable1"],
  email: ["Email Repr Lég", "email", "emailResponsable"],
  tel: ["Tél Portable Repr Lég", "Tél Personnel Repr Lég", "tel", "telResponsable"],
};

function mapField(row: Record<string, string>, fieldNames: string[]): string {
  for (const fn of fieldNames) {
    if (row[fn] && row[fn].trim()) return row[fn].trim();
  }
  return "";
}

export const VoyageImportSiecleTab = ({ voyage, onUpdateVoyage }: Props) => {
  const [parsedEleves, setParsedEleves] = useState<ParsedEleve[]>([]);
  const [filterClasse, setFilterClasse] = useState<string>("all");
  const [participationParEleve, setParticipationParEleve] = useState(
    voyage.nbEleves > 0 ? Math.round(voyage.participationFamilles / voyage.nbEleves) : 0
  );
  const [importDone, setImportDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const classes = [...new Set(parsedEleves.map(e => e.classe).filter(Boolean))].sort();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (result) => {
        const rows = result.data as Record<string, string>[];
        const eleves: ParsedEleve[] = rows
          .map(row => ({
            nom: mapField(row, SIECLE_MAPPINGS.nom),
            prenom: mapField(row, SIECLE_MAPPINGS.prenom),
            classe: mapField(row, SIECLE_MAPPINGS.classe),
            regime: mapField(row, SIECLE_MAPPINGS.regime),
            responsable: mapField(row, SIECLE_MAPPINGS.responsable),
            email: mapField(row, SIECLE_MAPPINGS.email),
            tel: mapField(row, SIECLE_MAPPINGS.tel),
            selected: true,
          }))
          .filter(e => e.nom);
        setParsedEleves(eleves);
        setImportDone(false);
        toast.success(`${eleves.length} élèves détectés dans le fichier — ${classes.length} classes`);
      },
      error: () => toast.error("Erreur de lecture du fichier CSV"),
    });
  };

  const filteredEleves = filterClasse === "all" ? parsedEleves : parsedEleves.filter(e => e.classe === filterClasse);
  const selectedCount = filteredEleves.filter(e => e.selected).length;

  const toggleAll = (checked: boolean) => {
    setParsedEleves(prev => prev.map(e =>
      filterClasse === "all" || e.classe === filterClasse ? { ...e, selected: checked } : e
    ));
  };

  const toggleOne = (idx: number) => {
    const globalIdx = parsedEleves.indexOf(filteredEleves[idx]);
    setParsedEleves(prev => prev.map((e, i) => i === globalIdx ? { ...e, selected: !e.selected } : e));
  };

  const handleImport = () => {
    const toImport = parsedEleves.filter(e => e.selected);
    if (toImport.length === 0) { toast.error("Aucun élève sélectionné"); return; }
    
    const existingIds = new Set(voyage.eleves.map(e => `${e.nom}-${e.prenom}`.toLowerCase()));
    const newEleves: Eleve[] = toImport
      .filter(e => !existingIds.has(`${e.nom}-${e.prenom}`.toLowerCase()))
      .map((e, i) => ({
        id: `eleve-import-${Date.now()}-${i}`,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe,
        regime: (e.regime.toLowerCase().includes("intern") ? "interne" :
          e.regime.toLowerCase().includes("demi") ? "demi-pensionnaire" : "externe") as Eleve["regime"],
        responsable1: e.responsable,
        emailResponsable: e.email,
        telResponsable: e.tel,
        participationDue: participationParEleve,
        paiements: [],
        autorisationParentale: false,
        ficheSanitaire: false,
        assuranceRC: false,
        passeport: false,
        dateInscription: new Date().toISOString().split("T")[0],
      }));

    const duplicates = toImport.length - newEleves.length;
    onUpdateVoyage({
      ...voyage,
      eleves: [...voyage.eleves, ...newEleves],
      nbEleves: voyage.eleves.length + newEleves.length,
      participationFamilles: (voyage.eleves.length + newEleves.length) * participationParEleve,
    });
    setImportDone(true);
    toast.success(`${newEleves.length} élèves importés${duplicates > 0 ? ` (${duplicates} doublons ignorés)` : ""}`);
  };

  return (
    <div className="space-y-5">
      <Alert className="border-primary/30 bg-primary/5">
        <Upload className="h-5 w-5" />
        <AlertTitle>Import base élèves SIECLE</AlertTitle>
        <AlertDescription className="text-sm">
          Importez un export CSV depuis SIECLE BEE (Base Élèves Établissement) pour pré-remplir la liste des participants au voyage. 
          Les colonnes sont détectées automatiquement (format SIECLE standard).
        </AlertDescription>
      </Alert>

      {/* Zone d'import */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Glissez un fichier CSV ou cliquez pour sélectionner</p>
              <p className="text-xs text-muted-foreground mt-1">Export SIECLE BEE (.csv) — séparateur ; ou ,</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </div>
        </CardContent>
      </Card>

      {/* Résultats du parsing */}
      {parsedEleves.length > 0 && (
        <>
          {/* Filtre classe + participation */}
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label className="text-xs">Filtrer par classe</Label>
              <Select value={filterClasse} onValueChange={setFilterClasse}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes ({parsedEleves.length})</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>{c} ({parsedEleves.filter(e => e.classe === c).length})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Participation par élève (€)</Label>
              <Input type="number" value={participationParEleve || ""} onChange={e => setParticipationParEleve(parseFloat(e.target.value) || 0)} className="w-[150px]" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>Tout sélectionner</Button>
              <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>Tout désélectionner</Button>
            </div>
            <Button onClick={handleImport} disabled={selectedCount === 0 || importDone}>
              <Users className="h-4 w-4 mr-1" />
              Importer {selectedCount} élève{selectedCount > 1 ? "s" : ""}
            </Button>
          </div>

          {importDone && (
            <Alert className="border-success/30 bg-success/5">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <AlertTitle className="text-success">Import réussi</AlertTitle>
              <AlertDescription>Les élèves ont été ajoutés au voyage. Vous pouvez maintenant gérer les paiements dans l'onglet Encaissements.</AlertDescription>
            </Alert>
          )}

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {filteredEleves.length} élèves — {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Régime</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEleves.map((e, i) => (
                    <TableRow key={i} className={e.selected ? "" : "opacity-40"}>
                      <TableCell>
                        <input type="checkbox" checked={e.selected} onChange={() => toggleOne(i)} className="rounded" />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{e.nom}</TableCell>
                      <TableCell className="text-sm">{e.prenom}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{e.classe || "—"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.regime || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.responsable || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.email || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
