import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Loader2, FileSpreadsheet, Trash2, History, ScanSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  parseCsvText,
  selectLargestWorkbookSheet,
  detectFileType,
  IMPORT_TYPE_LABELS,
  type ImportFileType,
  findUaiInMatrix,
  runCrossChecks,
  type CrossCheckResult,
  parseGrandLivre,
  parseEtatTiers,
  parseSiecleCsv,
  parseSiecleWorkbook,
  parseBourses,
  parseRegies,
} from "@/lib/import";
import { selectOpaleBalanceSheet } from "@/lib/opaleWorkbook";
import { selectOpaleSdeSdrSheet, parseSdeRows, parseSdrRows } from "@/lib/opaleSdeSdrParser";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { persistImport } from "@/lib/import/importService";
import { DropZoneMulti } from "@/components/import/DropZoneMulti";
import { CrossValidationPanel } from "@/components/import/CrossValidationPanel";
import { HistoriqueImports } from "@/components/import/HistoriqueImports";
import { RgpdSiecleNotice } from "@/components/import/RgpdSiecleNotice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpectedFilesGuide } from "@/components/import/ExpectedFilesGuide";

interface ParsedFile {
  id: string;
  file: File;
  detectedType: ImportFileType;
  manualType?: ImportFileType;
  uaiDetecte: string | null;
  rowsCount: number;
  totaux: Record<string, number>;
  anomalies: string[];
  status: 'parsing' | 'ready' | 'error' | 'imported';
  error?: string;
  parsedData?: unknown;
}

const ALL_TYPES: ImportFileType[] = [
  'balance', 'sde', 'sdr', 'grand_livre', 'etat_tiers',
  'siecle_eleves', 'siecle_bourses', 'regies', 'paie', 'inconnu',
];

const SIECLE_TYPES: ImportFileType[] = ['siecle_eleves', 'siecle_bourses'];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / 1024 / 1024).toFixed(2)} Mo`;
}

const DataImport = () => {
  const { toast } = useToast();
  const { selectedEstablishment } = useEstablishment();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [pendingRgpd, setPendingRgpd] = useState<ParsedFile | null>(null);

  // ─── Parsing automatique d'un fichier ───
  const parseFile = useCallback(async (file: File): Promise<ParsedFile> => {
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    try {
      let parsedData: unknown = null;
      let totaux: Record<string, number> = {};
      let rowsCount = 0;
      let uai: string | null = null;
      let contentSample = '';
      const anomalies: string[] = [];

      if (ext === 'csv') {
        const text = await file.text();
        const records = parseCsvText(text);
        contentSample = (Object.keys(records[0] ?? {}).join(' ') + ' ' + text.slice(0, 500)).toLowerCase();
        rowsCount = records.length;

        const detected = detectFileType(file.name, contentSample);
        if (detected.type === 'siecle_eleves') {
          const r = parseSiecleCsv(text);
          parsedData = r;
          rowsCount = r.eleves.length;
          totaux = { eleves: r.eleves.length, ineValides: r.ineValides, ineInvalides: r.ineInvalides };
          if (r.ineInvalides > 0) anomalies.push(`${r.ineInvalides} INE invalides détectés`);
        } else {
          parsedData = records;
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });

        // Échantillon d'en-têtes pour la détection
        const sample = selectLargestWorkbookSheet(wb);
        contentSample = sample
          ? (sample.matrix.slice(0, 5).flat().map(String).join(' ')).toLowerCase()
          : '';
        if (sample) uai = findUaiInMatrix(sample.matrix);
      } else {
        throw new Error('Format non supporté (CSV, XLS, XLSX uniquement).');
      }

      // Détection finale
      const detected = detectFileType(file.name, contentSample);

      // Parsing typé selon détection (pour les xlsx)
      if ((ext === 'xlsx' || ext === 'xls') && detected.type !== 'inconnu') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });

        switch (detected.type) {
          case 'balance': {
            const sel = selectOpaleBalanceSheet(wb);
            if (sel) {
              rowsCount = Math.max(0, sel.matrix.length - sel.headerRowIndex - 1);
              parsedData = sel;
              uai = uai ?? findUaiInMatrix(sel.matrix);
              totaux = { lignes: rowsCount };
            } else {
              anomalies.push('Aucun onglet balance Op@le détecté.');
            }
            break;
          }
          case 'sde': {
            try {
              const sel = selectOpaleSdeSdrSheet(wb, 'sde');
              if (sel) {
                const rows = parseSdeRows(sel);
                parsedData = rows;
                rowsCount = rows.length;
                const mandats = rows.reduce((s, r) => s + (r.mandats || 0), 0);
                totaux = { lignes: rowsCount, mandatsEmis: Math.round(mandats * 100) / 100 };
              } else {
                anomalies.push('SDE : aucun onglet exploitable.');
              }
            } catch (e) { anomalies.push(`SDE : ${(e as Error).message}`); }
            break;
          }
          case 'sdr': {
            try {
              const sel = selectOpaleSdeSdrSheet(wb, 'sdr');
              if (sel) {
                const rows = parseSdrRows(sel);
                parsedData = rows;
                rowsCount = rows.length;
                const ordres = rows.reduce((s, r) => s + (r.ordresRecettes || 0), 0);
                totaux = { lignes: rowsCount, ordresEmis: Math.round(ordres * 100) / 100 };
              } else {
                anomalies.push('SDR : aucun onglet exploitable.');
              }
            } catch (e) { anomalies.push(`SDR : ${(e as Error).message}`); }
            break;
          }
          case 'grand_livre': {
            const r = parseGrandLivre(wb);
            if (r) {
              parsedData = r;
              rowsCount = r.ecritures.length;
              totaux = { ecritures: rowsCount, totalDebit: r.totalDebit, totalCredit: r.totalCredit };
              if (Math.abs(r.totalDebit - r.totalCredit) > 0.01) {
                anomalies.push(`Grand livre déséquilibré : écart ${(r.totalDebit - r.totalCredit).toFixed(2)} €`);
              }
            }
            break;
          }
          case 'etat_tiers': {
            const r = parseEtatTiers(wb);
            if (r) {
              parsedData = r;
              rowsCount = r.lignes.length;
              totaux = { tiers: rowsCount, totalFamilles: r.totalFamilles, totalFournisseurs: r.totalFournisseurs };
            }
            break;
          }
          case 'siecle_eleves': {
            const r = parseSiecleWorkbook(wb);
            parsedData = r;
            rowsCount = r.eleves.length;
            totaux = { eleves: r.eleves.length, ineValides: r.ineValides };
            if (r.ineInvalides > 0) anomalies.push(`${r.ineInvalides} INE invalides`);
            break;
          }
          case 'siecle_bourses': {
            const r = parseBourses(wb);
            if (r) {
              parsedData = r;
              rowsCount = r.lignes.length;
              totaux = { boursiers: rowsCount, totalDu: r.totalDu };
            }
            break;
          }
          case 'regies': {
            const r = parseRegies(wb);
            if (r) {
              parsedData = r;
              rowsCount = r.regies.length;
              totaux = { regies: rowsCount, totalSoldes: r.totalSoldes };
            }
            break;
          }
          default:
            break;
        }
      }

      return {
        id, file,
        detectedType: detected.type,
        uaiDetecte: uai,
        rowsCount,
        totaux,
        anomalies,
        status: 'ready',
        parsedData,
      };
    } catch (err) {
      return {
        id, file,
        detectedType: 'inconnu',
        uaiDetecte: null,
        rowsCount: 0,
        totaux: {},
        anomalies: [],
        status: 'error',
        error: (err as Error).message,
      };
    }
  }, []);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    // Placeholder en parsing
    const placeholders: ParsedFile[] = newFiles.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f, detectedType: 'inconnu', uaiDetecte: null, rowsCount: 0,
      totaux: {}, anomalies: [], status: 'parsing',
    }));
    setFiles((prev) => [...prev, ...placeholders]);

    for (let i = 0; i < newFiles.length; i += 1) {
      const parsed = await parseFile(newFiles[i]);
      setFiles((prev) => prev.map((p, idx) =>
        idx === prev.length - placeholders.length + i ? { ...parsed, id: p.id } : p,
      ));
    }
  }, [parseFile]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const setManualType = (id: string, type: ImportFileType) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, manualType: type } : f));
  };

  // ─── Validation croisée ───
  const crossChecks: CrossCheckResult[] = useMemo(() => {
    const ready = files.filter((f) => f.status === 'ready');
    const find = (t: ImportFileType) => ready.find((f) => (f.manualType ?? f.detectedType) === t);
    const balance = find('balance');
    const sde = find('sde');
    const sdr = find('sdr');
    const tiers = find('etat_tiers');
    const bourses = find('siecle_bourses');

    if (!balance && !sde && !sdr && !tiers && !bourses) return [];

    return runCrossChecks({
      balance: balance ? { classe6: 0, classe7: 0, c411: 0, c443110: 0 } : undefined,
      sde: sde ? { mandatsEmis: Number(sde.totaux.mandatsEmis ?? 0) } : undefined,
      sdr: sdr ? { ordresEmis: Number(sdr.totaux.ordresEmis ?? 0) } : undefined,
      tiers: tiers ? { totalFamilles: Number(tiers.totaux.totalFamilles ?? 0) } : undefined,
      bourses: bourses ? { totalDu: Number(bourses.totaux.totalDu ?? 0) } : undefined,
    });
  }, [files]);

  // ─── Import (persistance) ───
  const handleImportOne = async (pf: ParsedFile, skipRgpd = false) => {
    if (!selectedEstablishment) {
      toast({ title: 'Sélectionnez un établissement', variant: 'destructive' });
      return;
    }
    const type = pf.manualType ?? pf.detectedType;

    if (!skipRgpd && SIECLE_TYPES.includes(type)) {
      setPendingRgpd(pf);
      return;
    }

    setImporting(true);
    try {
      const result = await persistImport({
        establishmentId: selectedEstablishment.id,
        type,
        file: pf.file,
        uaiDetecte: pf.uaiDetecte,
        totaux: pf.totaux,
        anomalies: pf.anomalies,
      });
      setFiles((prev) => prev.map((f) => f.id === pf.id ? { ...f, status: 'imported' } : f));
      toast({
        title: 'Import archivé',
        description: `${pf.file.name} — ${IMPORT_TYPE_LABELS[type]} • ${result.ecraseCount > 0 ? `${result.ecraseCount} version(s) précédente(s) marquée(s) écrasée(s)` : 'aucune version précédente'}.`,
      });
    } catch (err) {
      toast({
        title: 'Échec d\'archivage',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportAll = async () => {
    const ready = files.filter((f) => f.status === 'ready');
    for (const f of ready) {
      const type = f.manualType ?? f.detectedType;
      if (SIECLE_TYPES.includes(type)) {
        setPendingRgpd(f);
        return; // bloque jusqu'à acceptation RGPD
      }
      // eslint-disable-next-line no-await-in-loop
      await handleImportOne(f, true);
    }
  };

  const readyCount = files.filter((f) => f.status === 'ready').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Plateforme d'import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Détection automatique du type de fichier · Validation croisée · Versioning et archivage 10 ans
        </p>
      </motion.div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {selectedEstablishment ? `EPLE : ${selectedEstablishment.uai} — ${selectedEstablishment.name}` : 'Aucun EPLE sélectionné'}
          </Badge>
          {readyCount > 0 && (
            <Badge className="bg-emerald-600 text-white text-xs">{readyCount} fichier{readyCount > 1 ? 's' : ''} prêt{readyCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <Button
          onClick={handleImportAll}
          disabled={importing || readyCount === 0 || !selectedEstablishment}
          className="gap-2"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Importer & archiver {readyCount > 0 ? `(${readyCount})` : ''}
        </Button>
      </div>

      <Tabs defaultValue="depot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="depot"><ScanSearch className="h-4 w-4 mr-1" /> Dépôt & analyse</TabsTrigger>
          <TabsTrigger value="historique"><History className="h-4 w-4 mr-1" /> Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="depot" className="space-y-4">
          <ExpectedFilesGuide
            title="Quels fichiers pouvez-vous déposer ici ?"
            description="La détection est automatique, mais voici la liste exhaustive des types reconnus, avec l'emplacement Op@le / SIECLE et un exemple de nom."
            types={['balance', 'sde', 'sdr', 'grand_livre', 'etat_tiers', 'siecle_eleves', 'siecle_bourses', 'regies', 'paie']}
          />
          {pendingRgpd ? (
            <RgpdSiecleNotice
              onAccept={() => { const p = pendingRgpd; setPendingRgpd(null); handleImportOne(p, true); }}
              onCancel={() => setPendingRgpd(null)}
            />
          ) : (
            <DropZoneMulti onFiles={handleFilesAdded} disabled={!selectedEstablishment} />
          )}

          {!selectedEstablishment && (
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="p-3 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                Veuillez sélectionner un établissement (sélecteur en haut de page) avant de déposer un fichier.
              </CardContent>
            </Card>
          )}

          {files.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aperçu pré-import ({files.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((f) => {
                  const type = f.manualType ?? f.detectedType;
                  return (
                    <div key={f.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileSpreadsheet className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={f.file.name}>{f.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtBytes(f.file.size)} {f.uaiDetecte ? `• UAI ${f.uaiDetecte}` : ''}
                              {f.rowsCount > 0 ? ` • ${f.rowsCount.toLocaleString('fr-FR')} lignes` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.status === 'parsing' && <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyse…</Badge>}
                          {f.status === 'ready' && (
                            <Select value={type} onValueChange={(v) => setManualType(f.id, v as ImportFileType)}>
                              <SelectTrigger className="h-8 w-48 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_TYPES.map((t) => (
                                  <SelectItem key={t} value={t} className="text-xs">{IMPORT_TYPE_LABELS[t]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {f.status === 'error' && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Erreur</Badge>
                          )}
                          {f.status === 'imported' && (
                            <Badge className="bg-emerald-600 text-white text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Archivé</Badge>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeFile(f.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {f.error && <p className="text-xs text-destructive">{f.error}</p>}
                      {f.anomalies.length > 0 && (
                        <ul className="text-xs text-warning space-y-0.5 pl-4 list-disc">
                          {f.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      )}
                      {Object.keys(f.totaux).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          {Object.entries(f.totaux).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-muted">
                              {k} : {typeof v === 'number' ? v.toLocaleString('fr-FR') : String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <CrossValidationPanel results={crossChecks} />
        </TabsContent>

        <TabsContent value="historique">
          <HistoriqueImports establishmentId={selectedEstablishment?.id ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImport;
