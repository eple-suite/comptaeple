// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Section Import CSV Op@le
// Formats attendus : SDE, SDR, Balance (IMPORT BAL)
// Conformité : M9-6 2026 — Extraction Op@le standard
// Verrou de sécurité : concordance UAI/Op@le fichier ↔ établissement
// ═══════════════════════════════════════════════════════════════

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Info, Upload, Play, Loader2, CheckCircle2, XCircle, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useEstablishment } from '@/contexts/EstablishmentContext';
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
  // Chercher dans les premières lignes
  for (const row of rows.slice(0, 20)) {
    for (const [key, val] of Object.entries(row)) {
      const v = String(val || '').trim().toUpperCase();
      const k = key.toLowerCase();
      // UAI/RNE : 7 chiffres + 1 lettre
      if (!uai && (k.includes('rne') || k.includes('uai') || k.includes('etablissement'))) {
        if (/^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      }
      // Op@le : P + 5 chiffres
      if (!opale && (k.includes('opale') || k.includes('op@le') || k.includes('identifiant'))) {
        if (/^P\d{5}$/.test(v)) opale = v;
      }
      // Also check values directly
      if (!uai && /^[0-9]{7}[A-Z]$/.test(v)) uai = v;
      if (!opale && /^P\d{5}$/.test(v)) opale = v;
    }
    if (uai) break; // Found in first rows
  }
  return { uai, opale };
}

/** Vérifie la concordance entre le fichier CSV et l'établissement sélectionné */
function checkConcordance(
  rows: Record<string, string>[],
  selectedUai: string,
  selectedOpale: string
): { ok: boolean; message?: string; fileUai?: string; fileOpale?: string } {
  const { uai: fileUai, opale: fileOpale } = extractCsvIdentifier(rows);

  // Si aucun identifiant détecté dans le fichier, on laisse passer avec avertissement
  if (!fileUai && !fileOpale) {
    return { ok: true, fileUai: fileUai || undefined, fileOpale: fileOpale || undefined };
  }

  // Vérification UAI
  if (fileUai && selectedUai && fileUai !== selectedUai.toUpperCase()) {
    return {
      ok: false,
      message: `🔒 Alerte de sécurité : Le fichier importé appartient à l'établissement UAI ${fileUai}, mais l'établissement sélectionné est ${selectedUai}. Veuillez vérifier votre export Op@le.`,
      fileUai, fileOpale: fileOpale || undefined,
    };
  }

  // Vérification Op@le
  if (fileOpale && selectedOpale && fileOpale !== selectedOpale.toUpperCase()) {
    return {
      ok: false,
      message: `🔒 Alerte de sécurité : Le fichier importé contient l'identifiant Op@le ${fileOpale}, mais l'établissement sélectionné utilise ${selectedOpale}. Veuillez vérifier votre export Op@le.`,
      fileUai: fileUai || undefined, fileOpale,
    };
  }

  return { ok: true, fileUai: fileUai || undefined, fileOpale: fileOpale || undefined };
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

  const [fileStats, setFileStats] = useState<Record<string, { rows: number; name: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [securityBlocks, setSecurityBlocks] = useState<Record<string, string>>({});

  const slots = getSlots(budgets);
  const obligatoires = slots.filter(s => s.obligatoire);
  const nbObligCharge = obligatoires.filter(s => fichierCharge[s.key]).length;
  const canAnalyse = nbObligCharge >= 3;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: FileSlot) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true, delimiter: '',
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrors(prev => ({ ...prev, [slot.key]: 'Fichier vide ou format non reconnu' }));
          return;
        }
        const rows = results.data as Record<string, string>[];

        // ── VERROU DE SÉCURITÉ : concordance établissement ──
        if (selectedEstablishment) {
          const concordance = checkConcordance(
            rows,
            selectedEstablishment.uai,
            selectedEstablishment.opale_number
          );
          if (!concordance.ok) {
            setSecurityBlocks(prev => ({ ...prev, [slot.key]: concordance.message! }));
            setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
            return; // IMPORT BLOQUÉ
          }
          // Clear any previous security block
          setSecurityBlocks(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
        }

        setFileStats(prev => ({ ...prev, [slot.key]: { rows: rows.length, name: file.name } }));
        setErrors(prev => { const n = { ...prev }; delete n[slot.key]; return n; });
        try {
          if (slot.type === 'sde') setSDE(parserSDE(rows, slot.typeBudget), slot.typeBudget);
          else if (slot.type === 'sde1') setSDE1(parserSDE(rows, slot.typeBudget), slot.typeBudget);
          else if (slot.type === 'sdr') setSDR(parserSDR(rows, slot.typeBudget), slot.typeBudget);
          else if (slot.type === 'sdr1') setSDR1(parserSDR(rows, slot.typeBudget), slot.typeBudget);
          else if (slot.type === 'bal') setBalance(parserBalance(rows, slot.typeBudget), slot.typeBudget);
          else if (slot.type === 'bal1') setBalance1(parserBalance(rows, slot.typeBudget), slot.typeBudget);
        } catch (err: any) {
          setErrors(prev => ({ ...prev, [slot.key]: err.message || 'Erreur de parsing' }));
        }
      },
      error: (err) => { setErrors(prev => ({ ...prev, [slot.key]: err.message })); },
    });
    e.target.value = '';
  }

  const budgetSlots = budgets.map(b => ({ budget: b, slots: slots.filter(s => s.typeBudget === b.type) }));

  return (
    <div className="space-y-5">
      {/* Bandeau de sécurité concordance */}
      {selectedEstablishment ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Verrou de sécurité actif</strong> — Les fichiers importés seront vérifiés contre l'établissement
              sélectionné : <span className="font-mono font-semibold text-primary">{selectedEstablishment.uai}</span>
              {selectedEstablishment.opale_number && (
                <> · Op@le <span className="font-mono font-semibold">{selectedEstablishment.opale_number}</span></>
              )}
              . Tout fichier ne correspondant pas sera bloqué.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs text-destructive">
              <strong>Aucun établissement sélectionné</strong> — Sélectionnez un établissement dans le menu principal
              avant d'importer des fichiers. Le verrou de sécurité ne peut pas fonctionner sans référence.
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
              {canAnalyse ? 'Prêt à lancer l\'analyse' : 'Chargez au minimum SDE, SDR et Balance du budget principal'}
            </div>
            <Progress value={(nbObligCharge / obligatoires.length) * 100} className="mt-2 w-48 h-2" />
          </div>
          <Button onClick={() => { lancerAnalyse(); setActiveTab('checklist'); }} disabled={!canAnalyse || analysisRunning} size="lg">
            {analysisRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyse en cours…</> : <><Play className="h-4 w-4 mr-2" />Lancer l'analyse M9-6</>}
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
      error ? 'border-destructive bg-destructive/5' :
      loaded ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-solid' :
      'border-border bg-muted/30 hover:border-primary hover:bg-primary/5'
    }`} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">
          {error ? <XCircle className="h-6 w-6 text-destructive" /> : loaded ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm">{slot.label}</span>
            {!slot.obligatoire && <span className="text-xs text-muted-foreground italic">optionnel</span>}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{slot.sublabel}</div>
          {loaded && stat && <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">{stat.rows} lignes — {stat.name}</div>}
          {error && <div className="text-xs text-destructive font-semibold">{error}</div>}
          {!loaded && !error && <div className="text-xs text-muted-foreground italic">Cliquer pour charger</div>}
          <div className="mt-2 text-xs text-muted-foreground"><strong>Colonnes :</strong> {slot.colonnes}</div>
        </div>
      </div>
      {loaded && (
        <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={e => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }} title="Remplacer">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}
