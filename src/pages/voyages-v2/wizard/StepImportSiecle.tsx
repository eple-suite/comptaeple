// ════════════════════════════════════════════════════════════════
// Composant import SIECLE OPÉRATIONNEL — voyages v2
// ────────────────────────────────────────────────────────────────
// Réutilise src/lib/import/parsers/siecleParser (zéro duplication)
// Workflow : drop → preview 10 lignes → mapping détecté → upsert
// 4 modes : create / update / both / dry-run
// Élève absent du nouvel import → marqué "sorti", JAMAIS supprimé
// Encodages : UTF-8 + Windows-1252 auto-détectés (TextDecoder fallback)
// ════════════════════════════════════════════════════════════════
import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, ShieldAlert, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  parseSiecleCsv,
  parseSiecleWorkbook,
  type SiecleParseResult,
  type EleveSiecle,
  RGPD_SIECLE_MENTION,
} from "@/lib/import";
import { toast } from "sonner";

export type SiecleImportMode = "create" | "update" | "both" | "dry_run";

interface Props {
  voyageId: string;
  onImported?: (result: SiecleImportReport) => void;
}

export interface SiecleImportReport {
  mode: SiecleImportMode;
  total_eleves_lus: number;
  doublons: number;
  ine_invalides: number;
  crees: number;
  mis_a_jour: number;
  marques_sortis: number;
  erreurs: string[];
}

/** Détection auto encodage CSV : tente UTF-8, fallback Windows-1252. */
async function readCsvWithEncoding(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  // BOM UTF-8 explicite
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buf.slice(3));
  }
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  // Heuristique : présence de caractères de remplacement → re-décoder en cp1252
  if (utf8.includes("\uFFFD")) {
    return new TextDecoder("windows-1252").decode(buf);
  }
  return utf8;
}

async function parseFile(file: File): Promise<SiecleParseResult> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = await readCsvWithEncoding(file);
    return parseSiecleCsv(text);
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return parseSiecleWorkbook(wb);
}

export function StepImportSiecle({ voyageId, onImported }: Props) {
  const [parseResult, setParseResult] = useState<SiecleParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<SiecleImportMode>("both");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<SiecleImportReport | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const r = await parseFile(f);
      setParseResult(r);
      setFileName(f.name);
      setReport(null);
      toast.success(`${r.eleves.length} élèves détectés (${r.source.toUpperCase()})`);
    } catch (err: any) {
      toast.error("Échec lecture fichier : " + (err?.message || "erreur"));
    }
  };

  const lancerImport = async () => {
    if (!parseResult || !voyageId) return;
    setRunning(true);
    const out: SiecleImportReport = {
      mode,
      total_eleves_lus: parseResult.eleves.length,
      doublons: parseResult.doublons,
      ine_invalides: parseResult.ineInvalides,
      crees: 0,
      mis_a_jour: 0,
      marques_sortis: 0,
      erreurs: [],
    };

    try {
      // 1) Liste actuelle des participants du voyage
      const { data: existants } = await supabase
        .from("vs_participants")
        .select("id, ine, nom, prenom, date_naissance, statut_inscription")
        .eq("voyage_id", voyageId);

      const indexExistants = new Map<string, any>();
      (existants || []).forEach((p) => {
        const k = (p.ine || "").toUpperCase() ||
          `${p.nom}|${p.prenom}|${p.date_naissance || ""}`.toLowerCase();
        indexExistants.set(k, p);
      });

      const inesImportes = new Set<string>();

      for (const e of parseResult.eleves) {
        const key = (e.ine || "").toUpperCase() ||
          `${e.nom}|${e.prenom}|${e.dateNaissance?.toISOString().slice(0, 10) || ""}`.toLowerCase();
        if (e.ine) inesImportes.add(e.ine.toUpperCase());
        const existant = indexExistants.get(key);

        if (existant) {
          if (mode === "update" || mode === "both") {
            if (mode !== "dry_run") {
              const { error } = await supabase
                .from("vs_participants")
                .update({
                  ine: e.ine || null,
                  numero_interne: e.numeroInterne || null,
                  nom: e.nom,
                  prenom: e.prenom,
                  sexe: e.sexe || null,
                  date_naissance: e.dateNaissance?.toISOString().slice(0, 10) || null,
                  classe: e.classe || "",
                  mef: e.mef || null,
                  regime: e.regime || null,
                  boursier: !!e.boursier,
                  echelon_bourse: e.echelon ? Number(e.echelon) || null : null,
                  statut_inscription: existant.statut_inscription === "sorti" ? "inscrit" : existant.statut_inscription,
                })
                .eq("id", existant.id);
              if (error) out.erreurs.push(`MAJ ${e.nom} ${e.prenom} : ${error.message}`);
              else out.mis_a_jour += 1;
            } else {
              out.mis_a_jour += 1;
            }
          }
        } else {
          if (mode === "create" || mode === "both") {
            if (mode !== "dry_run") {
              const { error } = await supabase.from("vs_participants").insert({
                voyage_id: voyageId,
                ine: e.ine || null,
                numero_interne: e.numeroInterne || null,
                nom: e.nom,
                prenom: e.prenom,
                sexe: e.sexe || null,
                date_naissance: e.dateNaissance?.toISOString().slice(0, 10) || null,
                classe: e.classe || "",
                mef: e.mef || null,
                regime: e.regime || null,
                boursier: !!e.boursier,
                echelon_bourse: e.echelon ? Number(e.echelon) || null : null,
              });
              if (error) out.erreurs.push(`CRÉATION ${e.nom} ${e.prenom} : ${error.message}`);
              else out.crees += 1;
            } else {
              out.crees += 1;
            }
          }
        }
      }

      // 2) Élèves absents du nouvel import → marqués "sorti", JAMAIS supprimés
      for (const p of existants || []) {
        const k = (p.ine || "").toUpperCase();
        if (k && !inesImportes.has(k) && p.statut_inscription !== "sorti") {
          if (mode !== "dry_run" && (mode === "update" || mode === "both")) {
            const { error } = await supabase
              .from("vs_participants")
              .update({ statut_inscription: "sorti" })
              .eq("id", p.id);
            if (error) out.erreurs.push(`SORTIE ${p.nom} ${p.prenom} : ${error.message}`);
            else out.marques_sortis += 1;
          } else if (mode === "dry_run") {
            out.marques_sortis += 1;
          }
        }
      }

      setReport(out);
      onImported?.(out);
      toast.success(`Import ${mode} : ${out.crees} créés / ${out.mis_a_jour} MAJ / ${out.marques_sortis} sortis`);
    } catch (err: any) {
      toast.error("Erreur import : " + (err?.message || "inconnue"));
    } finally {
      setRunning(false);
    }
  };

  const previewLignes = parseResult?.eleves.slice(0, 10) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" /> Import SIECLE — élèves participants
        </CardTitle>
        <CardDescription>
          XLSX & CSV (UTF-8 / Windows-1252 / BOM). Mapping INE / nom / prénom / date naissance / classe / MEF / régime / bourse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Mention RGPD obligatoire</AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-1">
            <div><strong>Finalité :</strong> {RGPD_SIECLE_MENTION.finalite}</div>
            <div><strong>Base légale :</strong> {RGPD_SIECLE_MENTION.baseLegale}</div>
            <div><strong>Conservation :</strong> {RGPD_SIECLE_MENTION.conservation}</div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            id="siecle-file"
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            onChange={handleFile}
            className="text-xs"
          />
          {fileName && <Badge variant="outline">{fileName}</Badge>}
        </div>

        {parseResult && (
          <>
            <div className="text-xs text-muted-foreground">
              {parseResult.eleves.length} élèves lus — {parseResult.ineValides} INE valides — {parseResult.doublons} doublons écartés.
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Aperçu (10 premières lignes)</div>
              <div className="border rounded overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INE</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Naissance</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Boursier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewLignes.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[11px] font-mono">{e.ine || "—"}</TableCell>
                        <TableCell className="text-xs">{e.nom}</TableCell>
                        <TableCell className="text-xs">{e.prenom}</TableCell>
                        <TableCell className="text-[11px]">{e.dateNaissance?.toISOString().slice(0, 10) || "—"}</TableCell>
                        <TableCell className="text-xs">{e.classe}</TableCell>
                        <TableCell className="text-xs">{e.boursier ? `Oui (éch. ${e.echelon || "?"})` : "Non"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(["create", "update", "both", "dry_run"] as SiecleImportMode[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "default" : "outline"}
                  onClick={() => setMode(m)}
                >
                  {m === "dry_run" ? "Dry-run" : m === "both" ? "Créer + MAJ" : m === "create" ? "Créer" : "MAJ"}
                </Button>
              ))}
              <Button onClick={lancerImport} disabled={running}>
                <Upload className="h-3 w-3 mr-1" />
                {running ? "Import…" : "Lancer l'import"}
              </Button>
            </div>
          </>
        )}

        {report && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Rapport d'import — mode {report.mode}</AlertTitle>
            <AlertDescription className="text-xs space-y-0.5 mt-1">
              <div>{report.crees} créés • {report.mis_a_jour} mis à jour • {report.marques_sortis} marqués « sorti »</div>
              <div>{report.doublons} doublons • {report.ine_invalides} INE invalides</div>
              {report.erreurs.length > 0 && (
                <div className="text-destructive">{report.erreurs.length} erreur(s) — voir console</div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}