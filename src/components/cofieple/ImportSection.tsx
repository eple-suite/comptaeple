// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Section Import CSV Op@le
// Formats attendus : SDE, SDR, Balance (IMPORT BAL)
// Conformité : M9-6 2026 — Extraction Op@le standard
// Verrou de sécurité : concordance UAI/Op@le fichier ↔ établissement
// ═══════════════════════════════════════════════════════════════

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Info, Upload, Play, Loader2, CheckCircle2, XCircle, RefreshCw, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { parserSDE, parserSDR, parserBalance } from '@/lib/cofieple_calculations';
import type { TypeBudget } from '@/lib/cofieple_storeTypes';

interface FileSlot {
  key: string; label: string; sublabel: string;
  type: 'sde' | 'sde1' | 'sdr' | 'sdr1' | 'bal' | 'bal1';
  typeBudget: TypeBudget; colonnes: string; obligatoire: boolean;
}

function getSlots(budgets: { type: TypeBudget; libelle: string }[]): FileSlot[] {
  const slots: FileSlot[] = [];
  for (const b of budgets) {
    const bt = b.type;
    const suffix = bt === 'principal' ? '' : ` (${b.libelle})`;
    slots.push(
      { key: `sde_${bt}`, label: `SDE${suffix}`, sublabel: 'Situation des dépenses — exercice N', type: 'sde', typeBudget: bt, obligatoire: true, colonnes: 'service, domaine, activité, compte, budget, réalisé, disponible' },
      { key: `sde1_${bt}`, label: `SDE N-1${suffix}`, sublabel: 'Situation des dépenses — exercice N-1', type: 'sde1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à SDE (exercice précédent)' },
      { key: `sdr_${bt}`, label: `SDR${suffix}`, sublabel: 'Situation des recettes — exercice N', type: 'sdr', typeBudget: bt, obligatoire: true, colonnes: 'service, domaine, activité, compte, budget, aor, réalisé' },
      { key: `sdr1_${bt}`, label: `SDR N-1${suffix}`, sublabel: 'Situation des recettes — exercice N-1', type: 'sdr1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à SDR (exercice précédent)' },
      { key: `bal_${bt}`, label: `Balance${suffix}`, sublabel: 'IMPORT BAL Op@le — exercice N', type: 'bal', typeBudget: bt, obligatoire: true, colonnes: 'Compte, Intitulé, Débit/Crédit antérieur, Débit/Crédit, Solde débit/crédit' },
      { key: `bal1_${bt}`, label: `Balance N-1${suffix}`, sublabel: 'IMPORT BAL — exercice N-1', type: 'bal1', typeBudget: bt, obligatoire: false, colonnes: 'Identique à Balance (exercice précédent)' },
    );
  }
  return slots;
}

/** Extrait l'identifiant UAI/RNE présent dans les données CSV */
function extractCsvIdentifier(rows: Record<string, string>[]): { uai: string | null; opale: string | null } {
  let uai: string | null = null;
  let opale: string | null = null;
  for (const row of rows.slice(0, 20)) {
    for (const [key, val] of Object.entries(row)) {
      const v = String(val || '').trim().toUpperCase();
      const k = key.toLowerCase();
      if (!uai && (k.includes('rne') || k.includes('uai') || k.includes('etablissement'))) {
        if (/^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      }
      if (!opale && (k.includes('opale') || k.includes('op@le') || k.includes('identifiant'))) {
        if (/^P\d{5}$/.test(v)) opale = v;
      }
      if (!uai && /^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      if (!opale && /^P\d{5}$/.test(v)) opale = v;
    }
    if (uai) break;
  }
  return { uai, opale };
}

/** Extrait l'exercice comptable depuis les données CSV */
function extractExercice(rows: Record<string, string>[]): number | null {
  for (const row of rows.slice(0, 20)) {
    for (const [key, val] of Object.entries(row)) {
      const k = key.toLowerCase();
      const v = String(val || '').trim();
      if (k.includes('exercice') || k.includes('année') || k.includes('annee')) {
        const year = parseInt(v, 10);
        if (year >= 2000 && year <= 2099) return year;
      }
    }
  }
  // Fallback: check any numeric column value that looks like a year
  for (const row of rows.slice(0, 5)) {
    for (const val of Object.values(row)) {
      const v = String(val || '').trim();
      const m = v.match(/\b(20[0-9]{2})\b/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
}

// ── Colonnes attendues par type de document ──────────────────────────
const COLONNES_ATTENDUES: Record<string, string[]> = {
  sde: ['service', 'domaine', 'compte', 'budget', 'réalisé', 'disponible', 'realise', 'engagé', 'engage'],
  sdr: ['service', 'domaine', 'compte', 'budget', 'réalisé', 'aor', 'realise', 'engagé', 'engage'],
  bal: ['compte', 'intitulé', 'débit', 'crédit', 'solde', 'montant', 'poste', 'type'],
};

/** Détecte le type de document CSV à partir de ses colonnes */
function detectDocumentType(headers: string[]): 'sde' | 'sdr' | 'bal' | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  // Balance: has 'solde' or both 'debit anterieur' and 'credit anterieur'
  const hasPoste = lowerHeaders.some(h => h.includes('poste'));
  const hasSolde = lowerHeaders.some(h => h.includes('solde'));
  const hasAnterieur = lowerHeaders.some(h => h.includes('anterieur'));
  if ((hasSolde && hasAnterieur) || (hasPoste && hasSolde)) return 'bal';
  // SDR: has 'aor' or '+values'
  const hasAor = lowerHeaders.some(h => h.includes('aor'));
  const hasPlusValues = lowerHeaders.some(h => h.includes('values') || h.includes('extourne'));
  if (hasAor || hasPlusValues) return 'sdr';
  // SDE: has 'disponible' or 'en cours'
  const hasDispo = lowerHeaders.some(h => h.includes('disponible'));
  const hasEncours = lowerHeaders.some(h => h.includes('en cours') || h.includes('encours'));
  const hasExt = lowerHeaders.some(h => h.includes('ext'));
  if (hasDispo || hasEncours || hasExt) return 'sde';
  return null;
}

/** Vérifie que les colonnes du fichier correspondent au type de slot attendu */
function validateColumns(headers: string[], slotType: string): { ok: boolean; detected: string | null; message?: string } {
  const baseType = slotType.replace('1', ''); // sde1 → sde
  const detected = detectDocumentType(headers);
  if (!detected) {
    return { ok: false, detected: null, message: `Structure de colonnes non reconnue. Le fichier ne correspond à aucun format Op@le connu (SDE, SDR, Balance).` };
  }
  if (detected !== baseType) {
    const labels: Record<string, string> = { sde: 'Situation des Dépenses (SDE)', sdr: 'Situation des Recettes (SDR)', bal: 'Balance (IMPORT BAL)' };
    return {
      ok: false, detected,
      message: `Ce fichier semble être une ${labels[detected] || detected}, mais vous l'importez dans l'emplacement ${labels[baseType] || baseType}.`,
    };
  }
  return { ok: true, detected };
}

interface TripleLockResult {
  ok: boolean;
  type: 'opale' | 'exercice' | 'colonnes' | null;
  title?: string;
  message?: string;
  details?: string;
}

/** Triple verrou de sécurité : Op@le + Exercice + Nature du flux */
function tripleLockCheck(
  rows: Record<string, string>[],
  headers: string[],
  slotType: string,
  selectedUai: string,
  selectedOpale: string,
  exerciceTravail: number,
): TripleLockResult {
  // ── VERROU 1 : Code Op@le / UAI ──
  const { uai: fileUai, opale: fileOpale } = extractCsvIdentifier(rows);
  if (fileUai && selectedUai && fileUai !== selectedUai.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Erreur de concordance — Établissement',
      message: `Le fichier importé appartient à l'établissement UAI ${fileUai}, mais l'établissement sélectionné est ${selectedUai}.`,
      details: 'Veuillez vérifier que vous avez sélectionné le bon établissement ou que votre export Op@le correspond.',
    };
  }
  if (fileOpale && selectedOpale && fileOpale !== selectedOpale.toUpperCase()) {
    return {
      ok: false, type: 'opale',
      title: 'Erreur de concordance — Identifiant Op@le',
      message: `Le fichier contient l'identifiant Op@le ${fileOpale}, mais l'établissement sélectionné utilise ${selectedOpale}.`,
      details: "Veuillez vérifier votre export Op@le ou l\u2019identifiant technique de l\u2019établissement.",
    };
  }

  // ── VERROU 2 : Exercice comptable ──
  const fileExercice = extractExercice(rows);
  if (fileExercice && exerciceTravail && fileExercice !== exerciceTravail) {
    // Allow N-1 files in N-1 slots
    const isN1Slot = slotType.endsWith('1');
    const expectedYear = isN1Slot ? exerciceTravail - 1 : exerciceTravail;
    if (fileExercice !== expectedYear) {
      return {
        ok: false, type: 'exercice',
        title: 'Erreur de concordance — Exercice comptable',
        message: `Vous tentez d'importer un fichier de l'exercice ${fileExercice} alors que vous travaillez sur l'exercice ${exerciceTravail}${isN1Slot ? ` (N-1 attendu : ${expectedYear})` : ''}.`,
        details: `L'exercice du fichier (${fileExercice}) ne correspond pas à l'exercice de travail. Veuillez vérifier votre export Op@le.`,
      };
    }
  }

  // ── VERROU 3 : Nature du flux (colonnes) ──
  const colCheck = validateColumns(headers, slotType);
  if (!colCheck.ok) {
    return {
      ok: false, type: 'colonnes',
      title: 'Erreur de concordance — Type de document',
      message: colCheck.message || 'Format de colonnes non reconnu.',
      details: `Colonnes détectées : ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '…' : ''}`,
    };
  }

  return { ok: true, type: null };
}


export function ImportSection() {
  const budgets = useCofiepleStore(s => s.budgets);
  const fichierCharge = useCofiepleStore(s => s.fichierCharge);
  const setSDE = useCofiepleStore(s => s.setSDE);
  const setSDE1 = useCofiepleStore(s => s.setSDE1);
  const setSDR = useCofiepleStore(s => s.setSDR);
  const setSDR1 = useCofiepleStore(s => s.setSDR1);
  const setBalance = useCofiepleStore(s => s.setBalance);
  const setBalance1 = useCofiepleStore(s => s.setBalance1);
  const lancerAnalyse = useCofiepleStore(s => s.lancerAnalyse);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);
  const analysisRunning = useCofiepleStore(s => s.analysisRunning);
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  const exerciceTravail = useCofiepleStore(s => s.etablissement.exercice);

  const [fileStats, setFileStats] = useState<Record<string, { rows: number; name: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [securityBlocks, setSecurityBlocks] = useState<Record<string, string>>({});
  const [lockAlert, setLockAlert] = useState<TripleLockResult & { slotLabel?: string } | null>(null);

  const slots = getSlots(budgets);
  const obligatoires = slots.filter(s => s.obligatoire);
  const nbObligCharge = obligatoires.filter(s => fichierCharge[s.key]).length;
  const canAnalyse = nbObligCharge >= 3;

  /** Consigne une tentative d'import dans le journal d'audit */
  async function logImport(params: {
    fileName: string; fileType: string; budgetType: string; rowsCount: number;
    result: string; rejectReason?: string;
    fileUai?: string | null; fileOpale?: string | null; fileExercice?: number | null; fileTypeDetected?: string | null;
  }) {
    if (!user || !selectedEstablishment) return;
    try {
      await supabase.from('cofieple_import_logs').insert({
        user_id: user.id,
        uai: selectedEstablishment.uai,
        opale_number: selectedEstablishment.opale_number || '',
        exercice: exerciceTravail,
        file_name: params.fileName,
        file_type: params.fileType,
        budget_type: params.budgetType,
        rows_count: params.rowsCount,
        result: params.result,
        reject_reason: params.rejectReason || null,
        file_uai_detected: params.fileUai || null,
        file_opale_detected: params.fileOpale || null,
        file_exercice_detected: params.fileExercice ?? null,
        file_type_detected: params.fileTypeDetected || null,
      });
    } catch (e) {
      console.error('Erreur journalisation import:', e);
    }
  }

  function processImportedRows(rows: Record<string, string>[], fileName: string, slot: FileSlot) {
    if (!rows || rows.length === 0) {
      setErrors(prev => ({ ...prev, [slot.key]: 'Fichier vide ou format non reconnu' }));
      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: 0, result: 'error', rejectReason: 'Fichier vide ou format non reconnu' });
      return;
    }
    const headers = Object.keys(rows[0] || {});
    const { uai: csvUai, opale: csvOpale } = extractCsvIdentifier(rows);
    const csvExercice = extractExercice(rows);
    const csvDocType = detectDocumentType(headers);

    // ── TRIPLE VERROU DE SÉCURITÉ ──
    if (selectedEstablishment) {
      const lock = tripleLockCheck(rows, headers, slot.type, selectedEstablishment.uai, selectedEstablishment.opale_number || '', exerciceTravail);
      if (!lock.ok) {
        const resultCode = lock.type === 'opale' ? 'blocked_opale' : lock.type === 'exercice' ? 'blocked_exercice' : 'blocked_colonnes';
        setSecurityBlocks(prev => ({ ...prev, [slot.key]: lock.message || 'Import bloqué' }));
        setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
        setLockAlert({ ...lock, slotLabel: slot.label });
        logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: resultCode, rejectReason: lock.message, fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
        return;
      }
      setSecurityBlocks(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
    }

    setFileStats(prev => ({ ...prev, [slot.key]: { rows: rows.length, name: fileName } }));
    setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
    try {
      if (slot.type === 'sde') setSDE(parserSDE(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sde1') setSDE1(parserSDE(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sdr') setSDR(parserSDR(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'sdr1') setSDR1(parserSDR(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'bal') setBalance(parserBalance(rows, slot.typeBudget), slot.typeBudget);
      else if (slot.type === 'bal1') setBalance1(parserBalance(rows, slot.typeBudget), slot.typeBudget);
      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: 'success', fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [slot.key]: err.message || 'Erreur de parsing' }));
      logImport({ fileName, fileType: slot.type, budgetType: slot.typeBudget, rowsCount: rows.length, result: 'error', rejectReason: err.message, fileUai: csvUai, fileOpale: csvOpale, fileExercice: csvExercice, fileTypeDetected: csvDocType });
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: FileSlot) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    // ── Excel files (.xlsx, .xls) ──
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
          processImportedRows(rows, file.name, slot);
        } catch (err: any) {
          setErrors(prev => ({ ...prev, [slot.key]: `Erreur Excel : ${err.message || 'Format non reconnu'}` }));
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
      return;
    }

    // ── CSV / TXT files ──
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        processImportedRows(results.data as Record<string, string>[], file.name, slot);
      },
      error: (err) => { setErrors(prev => ({ ...prev, [slot.key]: err.message })); },
    });
    e.target.value = '';
  }


  const budgetSlots = budgets.map(b => ({ budget: b, slots: slots.filter(s => s.typeBudget === b.type) }));

  const lockTypeIcons: Record<string, string> = { opale: '🏫', exercice: '📅', colonnes: '📊' };

  return (
    <div className="space-y-5">
      {/* Dialog d'alerte triple verrou */}
      <Dialog open={!!lockAlert} onOpenChange={() => setLockAlert(null)}>
        <DialogContent className="border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {lockAlert?.title || 'Import bloqué'}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">{lockAlert?.type ? lockTypeIcons[lockAlert.type] : '🔒'}</span>
                <p className="text-sm font-medium text-foreground">{lockAlert?.message}</p>
              </div>
              {lockAlert?.details && (
                <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">{lockAlert.details}</p>
              )}
              {lockAlert?.slotLabel && (
                <p className="text-xs text-muted-foreground">Emplacement : <strong>{lockAlert.slotLabel}</strong></p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3 mt-3">
                <AlertTriangle className="h-3 w-3" />
                Ce contrôle protège la responsabilité de l\u2019agent comptable.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="destructive" size="sm">Compris</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bandeau de sécurité triple verrou */}
      {selectedEstablishment ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Triple verrou de sécurité actif</strong> — Chaque fichier sera vérifié sur 3 critères :
              <span className="font-semibold"> 1) Code Op@le/UAI</span>,
              <span className="font-semibold"> 2) Exercice comptable ({exerciceTravail})</span>,
              <span className="font-semibold"> 3) Nature du flux</span>.
              <br />
              Établissement : <span className="font-mono font-semibold text-primary">{selectedEstablishment.uai}</span>
              {selectedEstablishment.opale_number && (
                <> · Op@le <span className="font-mono font-semibold">{selectedEstablishment.opale_number}</span></>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs text-destructive">
              <strong>Aucun établissement sélectionné</strong> — Sélectionnez un établissement dans le menu principal
              avant d\u2019importer des fichiers. Le verrou de sécurité ne peut pas fonctionner sans référence.
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs">
            Importez les fichiers CSV extraits depuis <strong>Op@le</strong>. Les fichiers{' '}
            <strong>SDE, SDR et Balance</strong> sont obligatoires. Les fichiers N-1 permettent les comparaisons
            inter-exercices. Pour les budgets annexes (GRETA/CFA), importez leurs fichiers dédiés.
          </div>
        </CardContent>
      </Card>

      {budgetSlots.map(({ budget, slots: bSlots }) => (
        <Card key={budget.type}>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {budget.libelle || budget.type}
              {budget.type !== 'principal' && <Badge className="bg-warning text-warning-foreground">BUDGET ANNEXE</Badge>}
              <span className="ml-auto text-slate-400 text-xs">
                {bSlots.filter(s => fichierCharge[s.key]).length} / {bSlots.length} fichiers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {bSlots.map(slot => (
              <ImportBox key={slot.key} slot={slot} loaded={!!fichierCharge[slot.key]}
                stat={fileStats[slot.key]} error={errors[slot.key]}
                securityBlock={securityBlocks[slot.key]}
                onFile={e => handleFile(e, slot)} />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold">{nbObligCharge} / {obligatoires.length} fichiers obligatoires chargés</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {canAnalyse ? "Prêt à lancer l\u2019analyse" : 'Chargez au minimum SDE, SDR et Balance du budget principal'}
            </div>
            <Progress value={(nbObligCharge / obligatoires.length) * 100} className="mt-2 w-48 h-2" />
          </div>
          <Button onClick={() => { lancerAnalyse(); setActiveTab('checklist'); }} disabled={!canAnalyse || analysisRunning} size="lg">
            {analysisRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyse en cours…</> : <><Play className="h-4 w-4 mr-2" />Lancer l\u2019analyse M9-6</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ImportBox({ slot, loaded, stat, error, securityBlock, onFile }: {
  slot: FileSlot; loaded: boolean; stat?: { rows: number; name: string }; error?: string;
  securityBlock?: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label className={`relative block border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all group ${
      securityBlock ? 'border-destructive bg-destructive/5 border-solid' :
      error ? 'border-destructive bg-destructive/5' :
      loaded ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-solid' :
      'border-border bg-muted/30 hover:border-primary hover:bg-primary/5'
    }`} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={onFile} />
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">
          {securityBlock ? <ShieldAlert className="h-6 w-6 text-destructive" /> :
           error ? <XCircle className="h-6 w-6 text-destructive" /> :
           loaded ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> :
           <Upload className="h-6 w-6 text-muted-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm">{slot.label}</span>
            {!slot.obligatoire && <span className="text-xs text-muted-foreground italic">optionnel</span>}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{slot.sublabel}</div>
          {securityBlock && (
            <div className="text-xs text-destructive font-semibold bg-destructive/10 rounded p-2 mb-1">
              {securityBlock}
            </div>
          )}
          {loaded && stat && <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">{stat.rows} lignes — {stat.name}</div>}
          {error && <div className="text-xs text-destructive font-semibold">{error}</div>}
          {!loaded && !error && !securityBlock && <div className="text-xs text-muted-foreground italic">Cliquer pour charger</div>}
          <div className="mt-2 text-xs text-muted-foreground"><strong>Colonnes :</strong> {slot.colonnes}</div>
        </div>
      </div>
      {(loaded || securityBlock) && (
        <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={e => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }} title="Remplacer">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}
