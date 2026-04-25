import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, ShieldCheck, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { currentAnneeScolaire } from "./fsv2Types";
import {
  TARGET_FIELDS,
  type TargetField,
  coerceValue,
  eleveImportSchema,
  toFsElevePayload,
} from "@/lib/fs-import/eleveSchema";

type Step = 1 | 2 | 3 | 4;
type RowError = { ligne: number; champ: string; message: string; valeur: unknown };
type ParsedFile = {
  nom: string;
  type: "csv" | "xlsx" | "xls";
  headers: string[];
  rows: Record<string, unknown>[];
};

function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: false,
        });
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "csv";
        const type: ParsedFile["type"] =
          ext === "xlsx" ? "xlsx" : ext === "xls" ? "xls" : "csv";
        resolve({ nom: file.name, type, headers, rows: json });
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function EleveImportPage() {
  const { establishment } = useEstablishment();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [parsing, setParsing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, TargetField | "">>({});
  const [mappingSource, setMappingSource] = useState<"ia" | "manuel" | "mixte">("manuel");
  const [errors, setErrors] = useState<RowError[]>([]);
  const [validRows, setValidRows] = useState<Record<string, unknown>[]>([]);
  const [importId, setImportId] = useState<string | null>(null);
  const [anneeScolaire] = useState<string>(currentAnneeScolaire());

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    try {
      const result = await parseFile(file);
      if (result.headers.length === 0) {
        toast.error("Fichier vide ou en-têtes introuvables");
        return;
      }
      setParsed(result);
      // Initialise le mapping vide
      const init: Record<string, TargetField | ""> = {};
      for (const h of result.headers) init[h] = "";
      setMapping(init);
      setStep(2);
      toast.success(`${result.rows.length} lignes lues — ${result.headers.length} colonnes détectées`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de lecture");
    } finally {
      setParsing(false);
    }
  }, []);

  const askAi = useCallback(async () => {
    if (!parsed) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fs-import-mapping", {
        body: { headers: parsed.headers, sample: parsed.rows.slice(0, 5) },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") {
        toast.error("Trop de requêtes — réessayez dans un instant");
        return;
      }
      if (data?.error === "credits_exhausted") {
        toast.error("Crédits IA épuisés — ajoutez des fonds dans Lovable Cloud");
        return;
      }
      const next: Record<string, TargetField | ""> = { ...mapping };
      let high = 0;
      for (const m of data.mappings ?? []) {
        if (m.target && TARGET_FIELDS.includes(m.target)) {
          next[m.source] = m.target;
          if (m.confidence >= 0.7) high++;
        }
      }
      setMapping(next);
      setMappingSource("ia");
      toast.success(`Mapping IA proposé : ${high} colonnes avec haute confiance`);
    } catch (e) {
      toast.error("Mapping IA indisponible — passez en saisie manuelle");
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }, [parsed, mapping]);

  const updateMapping = (source: string, target: string) => {
    setMapping((m) => ({ ...m, [source]: (target === "__none__" ? "" : target) as TargetField | "" }));
    setMappingSource((s) => (s === "ia" ? "mixte" : s));
  };

  const usedTargets = useMemo(() => {
    const set = new Set<TargetField>();
    Object.values(mapping).forEach((t) => t && set.add(t as TargetField));
    return set;
  }, [mapping]);

  const requiredOk = usedTargets.has("nom") && usedTargets.has("prenom");

  const validate = useCallback(() => {
    if (!parsed) return;
    const errs: RowError[] = [];
    const ok: Record<string, unknown>[] = [];
    parsed.rows.forEach((row, idx) => {
      const ligne = idx + 2; // ligne 1 = en-têtes
      const projected: Record<string, unknown> = {};
      for (const [src, tgt] of Object.entries(mapping)) {
        if (!tgt) continue;
        projected[tgt] = coerceValue(tgt as TargetField, row[src]);
      }
      const parsedRow = eleveImportSchema.safeParse(projected);
      if (parsedRow.success) {
        ok.push(parsedRow.data);
      } else {
        for (const issue of parsedRow.error.issues) {
          errs.push({
            ligne,
            champ: issue.path.join(".") || "_",
            message: issue.message,
            valeur: projected[issue.path[0] as string],
          });
        }
      }
    });
    setErrors(errs);
    setValidRows(ok);
    setStep(3);
    if (ok.length === 0) {
      toast.error("Aucune ligne valide");
    } else if (errs.length > 0) {
      toast.warning(`${ok.length} valides, ${errs.length} erreur(s) sur ${parsed.rows.length} lignes`);
    } else {
      toast.success(`Toutes les lignes sont valides (${ok.length})`);
    }
  }, [parsed, mapping]);

  const runImport = useCallback(async () => {
    if (!parsed || !establishment?.id || !user?.id) return;
    setImporting(true);
    setProgress(0);
    try {
      // 1. Créer l'enregistrement d'import (statut en_cours)
      const { data: imp, error: errImp } = await supabase
        .from("fs_imports_eleves")
        .insert({
          establishment_id: establishment.id,
          user_id: user.id,
          fichier_nom: parsed.nom,
          fichier_type: parsed.type,
          annee_scolaire: anneeScolaire,
          mapping_utilise: mapping as never,
          mapping_source: mappingSource,
          total_lignes: parsed.rows.length,
          rapport_erreurs: errors as never,
          statut: "en_cours",
        })
        .select()
        .single();
      if (errImp) throw errImp;
      setImportId(imp.id);

      // 2. Insertion par lots de 100
      const payloads = validRows.map((r) =>
        toFsElevePayload(r as never, {
          establishment_id: establishment.id,
          user_id: user.id,
          annee_scolaire: anneeScolaire,
        }),
      );
      const BATCH = 100;
      let inserted = 0;
      for (let i = 0; i < payloads.length; i += BATCH) {
        const slice = payloads.slice(i, i + BATCH);
        const { error } = await supabase.from("fs_eleves").insert(slice);
        if (error) throw error;
        inserted += slice.length;
        setProgress(Math.round((inserted / payloads.length) * 100));
      }

      // 3. Mettre à jour le statut
      await supabase
        .from("fs_imports_eleves")
        .update({
          statut: "termine",
          lignes_importees: inserted,
          lignes_rejetees: errors.length,
        })
        .eq("id", imp.id);

      setStep(4);
      toast.success(`Import terminé : ${inserted} élèves importés`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Échec import");
      if (importId) {
        await supabase.from("fs_imports_eleves").update({ statut: "echoue" }).eq("id", importId);
      }
    } finally {
      setImporting(false);
    }
  }, [parsed, establishment, user, anneeScolaire, mapping, mappingSource, validRows, errors, importId]);

  const downloadErrorsCsv = () => {
    if (errors.length === 0) return;
    const csv = [
      "ligne,champ,message,valeur",
      ...errors.map((e) =>
        [e.ligne, e.champ, `"${e.message.replace(/"/g, '""')}"`, `"${String(e.valeur ?? "").replace(/"/g, '""')}"`].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-eleves-erreurs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/fonds-sociaux/v2/eleves"><ArrowLeft className="h-4 w-4 mr-1" />Élèves</Link>
        </Button>
      </div>
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-7 w-7 text-primary" />
          Import CSV / Excel des élèves
        </h1>
        <p className="text-muted-foreground mt-1">
          Mapping automatique par IA, validation Zod, rapport d'erreurs téléchargeable.
        </p>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {(["Fichier", "Mapping", "Validation", "Terminé"] as const).map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-2">
              <Badge variant={active ? "default" : done ? "secondary" : "outline"}>
                {done ? "✓" : n}. {label}
              </Badge>
              {i < 3 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>

      {/* Étape 1 — Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Téléverser un fichier</CardTitle>
            <CardDescription>Formats acceptés : CSV, XLSX, XLS. La première feuille est utilisée pour Excel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              disabled={parsing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {parsing && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Lecture en cours…</p>}
          </CardContent>
        </Card>
      )}

      {/* Étape 2 — Mapping */}
      {step === 2 && parsed && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Mapping des colonnes</CardTitle>
                <CardDescription>
                  {parsed.rows.length} lignes • {parsed.headers.length} colonnes • <Badge variant="outline" className="ml-1">{mappingSource}</Badge>
                </CardDescription>
              </div>
              <Button onClick={askAi} disabled={aiLoading} size="sm">
                {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Proposer un mapping IA
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colonne source</TableHead>
                    <TableHead>Aperçu</TableHead>
                    <TableHead className="w-[260px]">Champ cible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.headers.map((h) => {
                    const sample = parsed.rows.slice(0, 2).map((r) => String(r[h] ?? "")).filter(Boolean).join(" • ");
                    const tgt = mapping[h] ?? "";
                    return (
                      <TableRow key={h}>
                        <TableCell className="font-medium">{h}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{sample || "—"}</TableCell>
                        <TableCell>
                          <Select value={tgt || "__none__"} onValueChange={(v) => updateMapping(h, v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— Ignorer —</SelectItem>
                              {TARGET_FIELDS.map((f) => (
                                <SelectItem key={f} value={f} disabled={usedTargets.has(f) && f !== tgt}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Champs obligatoires : <strong>nom</strong>, <strong>prenom</strong>. {requiredOk ? <span className="text-green-600">✓ OK</span> : <span className="text-destructive">manquants</span>}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Retour</Button>
                <Button onClick={validate} disabled={!requiredOk}>
                  <ShieldCheck className="h-4 w-4 mr-2" />Valider les données
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 — Validation */}
      {step === 3 && parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Rapport de validation</CardTitle>
            <CardDescription>
              Année scolaire d'import : <strong>{anneeScolaire}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{parsed.rows.length}</p><p className="text-xs text-muted-foreground">Lignes lues</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-green-600">{validRows.length}</p><p className="text-xs text-muted-foreground">Valides</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-destructive">{errors.length}</p><p className="text-xs text-muted-foreground">Erreurs</p></CardContent></Card>
            </div>

            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Lignes rejetées (premières 50 affichées) :</p>
                  <Button variant="outline" size="sm" onClick={downloadErrorsCsv}>
                    <Download className="h-4 w-4 mr-1" />Télécharger CSV erreurs
                  </Button>
                </div>
                <div className="border rounded-md max-h-72 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ligne</TableHead>
                        <TableHead>Champ</TableHead>
                        <TableHead>Erreur</TableHead>
                        <TableHead>Valeur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.slice(0, 50).map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{e.ligne}</TableCell>
                          <TableCell><code className="text-xs">{e.champ}</code></TableCell>
                          <TableCell className="text-sm">{e.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{String(e.valeur ?? "")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Insertion en cours… {progress}%</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={importing}>Retour mapping</Button>
              <Button onClick={runImport} disabled={validRows.length === 0 || importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Importer {validRows.length} ligne(s) valide(s)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4 — Terminé */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />Import terminé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              {validRows.length} élève(s) importé(s) dans la base. {errors.length > 0 && `${errors.length} ligne(s) rejetée(s).`}
            </p>
            <div className="flex gap-2">
              <Button asChild><Link to="/fonds-sociaux/v2/eleves">Voir les élèves</Link></Button>
              {errors.length > 0 && (
                <Button variant="outline" onClick={downloadErrorsCsv}>
                  <Download className="h-4 w-4 mr-1" />Rapport d'erreurs
                </Button>
              )}
              <Button variant="ghost" onClick={() => {
                setStep(1); setParsed(null); setMapping({}); setErrors([]); setValidRows([]); setProgress(0); setImportId(null);
              }}>Nouvel import</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}