import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHyperaleStore } from '@/store/useHyperaleStore';
import { parseOpaleFile, type ParseResult, type OpaleRow } from '@/lib/hyperaleOpaleParser';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Info,
  FileUp, Trash2, Loader2, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExpectedFilesGuide } from '@/components/import/ExpectedFilesGuide';
import { Link } from 'react-router-dom';
import { useCofiepleStore } from '@/store/useCofiepleStore';

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'done' | 'error';

export default function HyperaleImport() {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [importStats, setImportStats] = useState<{ etabs: number; annees: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const addEtablissement = useHyperaleStore(s => s.addEtablissement);
  const updateDonnees = useHyperaleStore(s => s.updateDonnees);
  const etablissements = useHyperaleStore(s => s.etablissements);

  // Le hub COFIEPLE (alimenté par « Import des données » ou « Compte financier »)
  // alimente déjà HYPER@LE automatiquement — inutile de ré-importer ici.
  const resultatsHub = useCofiepleStore(s => s.resultats);
  const hubAlimente = !!(resultatsHub.principal && (resultatsHub.principal.fdrBas || resultatsHub.principal.fdrHaut || resultatsHub.principal.tresorerie));

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    setResult(null);
    setImportStats(null);

    const parsed = await parseOpaleFile(file);
    setResult(parsed);
    setStatus(parsed.success ? 'preview' : 'error');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const integrer = useCallback(() => {
    if (!result || !result.success) return;

    // Group rows by UAI
    const grouped = new Map<string, { nom: string; rows: OpaleRow[] }>();
    for (const row of result.data) {
      if (!grouped.has(row.uai)) {
        grouped.set(row.uai, { nom: row.nom || 'Établissement importé', rows: [] });
      }
      grouped.get(row.uai)!.rows.push(row);
      if (row.nom) grouped.get(row.uai)!.nom = row.nom;
    }

    let etabCount = 0;
    let anneeCount = 0;

    for (const [uai, { nom, rows }] of grouped) {
      const exists = etablissements.some(e => e.uai === uai);
      if (!exists) {
        addEtablissement({ uai, nom, donnees: {} });
      }
      for (const row of rows) {
        updateDonnees(uai, row.annee, {
          fdr: row.fdr,
          caf: row.caf,
          tresorerie: row.tresorerie,
          reserves: row.reserves,
          drfn: row.drfn,
          resultatComptable: row.resultatComptable,
          tauxExecCharges: row.tauxExecCharges,
          tauxExecProduits: row.tauxExecProduits,
        });
        anneeCount++;
      }
      etabCount++;
    }

    setImportStats({ etabs: etabCount, annees: anneeCount });
    setStatus('done');
    toast.success(`Import réussi : ${etabCount} établissement(s), ${anneeCount} exercice(s) mis à jour.`);
  }, [result, etablissements, addEtablissement, updateDonnees]);

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setFileName('');
    setImportStats(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const fmtEur = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  // Unique UAIs in preview
  const previewUais = result?.data ? [...new Set(result.data.map(r => r.uai))] : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Importer des données Op@le
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chargez un fichier exporté depuis Op@le pour alimenter les indicateurs financiers.
        </p>
      </div>

      {/* Rappel : la balance/SDE/SDR importée dans « Import des données » alimente
          déjà HYPER@LE via le hub COFIEPLE — pas besoin de ré-importer ici. */}
      {hubAlimente ? (
        <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-foreground">
            Des données sont déjà disponibles (importées via « Import des données » ou « Compte financier ») et
            alimentent automatiquement HYPER@LE. Cet import n'est utile que pour un <strong>fichier consolidé
            pluriannuel multi-établissements</strong> (voir ci-dessous).
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-foreground">
            La balance, le SDE et le SDR importés dans{' '}
            <Link to="/import" className="font-semibold text-primary underline underline-offset-2">Import des données</Link>{' '}
            alimentent automatiquement HYPER@LE. Cet écran ne sert qu'à charger un <strong>fichier consolidé
            pluriannuel</strong> (indicateurs déjà calculés) pour comparer plusieurs EPLE.
          </p>
        </div>
      )}

      {/* Drop zone */}
      {(status === 'idle' || status === 'error') && (
        <Card
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Glissez-déposez votre fichier ici
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ou cliquez pour parcourir vos fichiers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">.csv</Badge>
              <Badge variant="outline" className="text-[10px]">.xlsx</Badge>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Parsing */}
      {status === 'parsing' && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Lecture de {fileName}…</p>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      {status === 'idle' && (
        <>
          <ExpectedFilesGuide
            title="Quels fichiers importer dans HYPER@LE ?"
            description="HYPER@LE alimente le fonds de roulement, la CAF, la trésorerie, les réserves et le DRFN. Les fichiers ci-dessous sont ceux qui produisent ces indicateurs."
            types={['balance', 'sde', 'sdr', 'ecbu']}
          />
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Variante : fichier consolidé pluriannuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Vous pouvez aussi déposer un CSV/XLSX consolidé contenant directement les indicateurs (utile pour comparer plusieurs EPLE et exercices) :
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-semibold">Colonne</th>
                      <th className="p-2 text-left font-semibold">Description</th>
                      <th className="p-2 text-left font-semibold">Exemple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['uai', "Code UAI de l'établissement", '0330089T'],
                      ['annee', "Année de l'exercice", '2023'],
                      ['fdr', 'Fonds de roulement (€)', '150000'],
                      ['caf', "Capacité d'autofinancement (€)", '86000'],
                      ['tresorerie', 'Trésorerie (€)', '102000'],
                      ['reserves', 'Réserves (€)', '130000'],
                    ].map(([col, desc, ex]) => (
                      <tr key={col} className="border-t">
                        <td className="p-2 font-mono font-bold text-primary">{col}</td>
                        <td className="p-2 text-muted-foreground">{desc}</td>
                        <td className="p-2 text-muted-foreground">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Les colonnes supplémentaires (nom, drfn, résultat comptable…) sont prises en charge automatiquement (insensible à la casse et aux accents).
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Error */}
      {status === 'error' && result && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm">Erreur lors de l'import</span>
            </div>
            {result.errors.map((e, i) => (
              <p key={i} className="text-sm text-destructive/80">{e}</p>
            ))}
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Recommencer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {status === 'preview' && result && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileUp className="h-4 w-4 text-primary" />
                Aperçu — {fileName}
              </CardTitle>
              <CardDescription>
                {result.rowCount} ligne(s) valide(s) · {previewUais.length} établissement(s) détecté(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
                </div>
              ))}
              <div className="overflow-x-auto rounded-lg border max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2 text-left font-semibold">UAI</th>
                      <th className="p-2 text-left font-semibold">Nom</th>
                      <th className="p-2 text-right font-semibold">Année</th>
                      <th className="p-2 text-right font-semibold">FDR</th>
                      <th className="p-2 text-right font-semibold">CAF</th>
                      <th className="p-2 text-right font-semibold">Trésorerie</th>
                      <th className="p-2 text-right font-semibold">Réserves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        <td className="p-2 font-mono font-bold text-primary">{row.uai}</td>
                        <td className="p-2 text-muted-foreground truncate max-w-[150px]">{row.nom || '—'}</td>
                        <td className="p-2 text-right">{row.annee}</td>
                        <td className="p-2 text-right">{fmtEur(row.fdr)}</td>
                        <td className="p-2 text-right">{fmtEur(row.caf)}</td>
                        <td className="p-2 text-right">{fmtEur(row.tresorerie)}</td>
                        <td className="p-2 text-right">{fmtEur(row.reserves)}</td>
                      </tr>
                    ))}
                    {result.data.length > 20 && (
                      <tr className="border-t">
                        <td colSpan={7} className="p-2 text-center text-muted-foreground italic">
                          … et {result.data.length - 20} ligne(s) supplémentaire(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={integrer} className="gap-2 flex-1 font-bold">
              <Download className="h-4 w-4" /> Intégrer les données dans HYPER@LE
            </Button>
            <Button variant="outline" onClick={reset}>Annuler</Button>
          </div>
        </>
      )}

      {/* Done */}
      {status === 'done' && importStats && (
        <Card className="border-green-500/30">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">Import réussi</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importStats.etabs} établissement(s) · {importStats.annees} exercice(s) intégré(s)
              </p>
            </div>
            <Button variant="outline" onClick={reset} className="gap-1.5">
              <FileUp className="h-3.5 w-3.5" /> Importer un autre fichier
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
