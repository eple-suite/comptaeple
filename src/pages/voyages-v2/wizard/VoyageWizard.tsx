// ════════════════════════════════════════════════════════════════
// Wizard Voyage v2 — orchestration 8 étapes
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVoyageDraft, saveVoyage } from "../hooks/useVoyageV2";
import {
  Step1Identification,
  Step2TypeProjet,
  Step3DatesEffectifs,
  Step4Recettes,
  Step5Depenses,
  Step6Accompagnateurs,
  Step7ValidationCA,
  Step8Recap,
} from "./steps";
import { StepRetroplanning } from "./StepRetroplanning";
import type { JalonStatut } from "../lib/retroplanningEngine";
import type { Voyage, VoyageRecette, VoyageDepense } from "../types";
import { evaluerRegle8Euros, type Regle8Result } from "../lib/regle8Euros";
import { snapshotVoyage } from "../lib/financialEngine";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { n: 1, key: "identification", label: "Identification" },
  { n: 2, key: "type", label: "Type de projet" },
  { n: 3, key: "effectifs", label: "Dates & effectifs" },
  { n: 4, key: "recettes", label: "Recettes" },
  { n: 5, key: "depenses", label: "Dépenses" },
  { n: 6, key: "accomp", label: "Accompagnateurs" },
  { n: 7, key: "ca", label: "Validation CA" },
  { n: 8, key: "retroplanning", label: "Rétroplanning" },
  { n: 9, key: "recap", label: "Récapitulatif" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  establishmentId: string;
  initial?: Partial<Voyage>;
  onSaved?: (voyageId: string) => void;
}

export function VoyageWizard({ open, onOpenChange, establishmentId, initial, onSaved }: Props) {
  const { draft, update, updateMany, reset } = useVoyageDraft(initial);
  const [recettes, setRecettes] = useState<Partial<VoyageRecette>[]>([]);
  const [depenses, setDepenses] = useState<Partial<VoyageDepense>[]>([]);
  const [jalonsState, setJalonsState] = useState<Record<string, { statut: JalonStatut }>>({});
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [voyageId, setVoyageId] = useState<string | undefined>(initial?.id);
  const [userId, setUserId] = useState<string | null>(null);
  const [donTaciteAccepte, setDonTaciteAccepte] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  // Reset à l'ouverture
  useEffect(() => {
    if (open && !initial) {
      reset();
      setRecettes([]);
      setDepenses([]);
      setJalonsState({});
      setStep(1);
      setVoyageId(undefined);
      setDonTaciteAccepte(false);
    }
  }, [open, initial, reset]);

  const regle8 = useMemo<Regle8Result>(() => {
    const snap = snapshotVoyage(
      { nb_eleves_prevus: Number(draft.nb_eleves_prevus) || 0 },
      recettes as any,
      depenses as any,
    );
    return evaluerRegle8Euros({
      nbEleves: Number(draft.nb_eleves_prevus) || 0,
      totalDepensesTTC: snap.totalDepensesTTC,
      partFamilles: snap.partFamilles,
      partSubventions: snap.partSubventions,
      partAutres: snap.partAutres,
      donTaciteAccepte,
    });
  }, [draft.nb_eleves_prevus, recettes, depenses, donTaciteAccepte]);

  const canNext = useMemo(
    () => validateStep(step, draft, recettes, depenses, regle8),
    [step, draft, recettes, depenses, regle8],
  );
  const progress = (step / STEPS.length) * 100;

  const persistAndAdvance = async (nextStep?: number) => {
    if (!userId) {
      toast.error("Session expirée, reconnectez-vous.");
      return;
    }
    if (!establishmentId) {
      toast.error("Aucun établissement sélectionné.");
      return;
    }
    setSaving(true);
    const targetStep = nextStep ?? step;
    const id = await saveVoyage(
      { ...draft, wizard_step: targetStep, wizard_completed: targetStep === STEPS.length },
      {
        establishment_id: establishmentId,
        user_id: userId,
        voyageId,
        recettes: step >= 4 ? recettes : undefined,
        depenses: step >= 5 ? depenses : undefined,
      },
    );
    setSaving(false);
    if (id) {
      setVoyageId(id);
      if (nextStep) setStep(nextStep);
      toast.success(nextStep ? "Étape sauvegardée" : "Voyage sauvegardé");
      return id;
    }
    return null;
  };

  const handleNext = async () => {
    if (!canNext.ok) {
      toast.error(canNext.message || "Champs requis manquants");
      return;
    }
    if (step < STEPS.length) {
      await persistAndAdvance(step + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    if (regle8.bloquant) {
      toast.error("Règle des 8 € non respectée — voyage non enregistrable.", {
        description: regle8.recommandation,
      });
      return;
    }
    const id = await persistAndAdvance();
    if (id) {
      onSaved?.(id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">Étape {step}/{STEPS.length}</Badge>
            {STEPS[step - 1].label}
          </DialogTitle>
          <DialogDescription>
            Création d'un voyage scolaire — conforme circulaire MENE2407159C, GBCP, M9-6.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5" />

        <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground overflow-x-auto pb-1">
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => s.n < step && setStep(s.n)}
              className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                s.n === step
                  ? "bg-primary text-primary-foreground font-semibold"
                  : s.n < step
                  ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 cursor-pointer"
                  : "bg-muted"
              }`}
            >
              {s.n < step && <CheckCircle2 className="inline h-3 w-3 mr-0.5" />}
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        <div className="py-2">
          {step === 1 && <Step1Identification draft={draft} update={update} />}
          {step === 2 && <Step2TypeProjet draft={draft} update={update} />}
          {step === 3 && <Step3DatesEffectifs draft={draft} update={update} />}
          {step === 4 && <Step4Recettes recettes={recettes} setRecettes={setRecettes} />}
          {step === 5 && <Step5Depenses depenses={depenses} setDepenses={setDepenses} />}
          {step === 6 && <Step6Accompagnateurs draft={draft} update={update} />}
          {step === 7 && <Step7ValidationCA draft={draft} update={update} />}
          {step === 8 && (
            <StepRetroplanning draft={draft} jalonsState={jalonsState} setJalonsState={setJalonsState} />
          )}
          {step === 9 && <Step8Recap draft={draft} recettes={recettes} depenses={depenses} />}
        </div>

        {/* Bandeau permanent règle 8 € — visible dès l'étape 5 */}
        {step >= 5 && (
          <Regle8Banner
            result={regle8}
            donTaciteAccepte={donTaciteAccepte}
            onToggleDon={setDonTaciteAccepte}
          />
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || saving}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => persistAndAdvance()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Sauvegarder le brouillon
            </Button>
            {step < STEPS.length ? (
              <Button onClick={handleNext} disabled={saving}>
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving || regle8.bloquant}
                className="gradient-primary border-0"
                title={regle8.bloquant ? "Règle des 8 € non respectée" : undefined}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Finaliser le voyage
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bandeau règle 8 € ───────────────────────────────────────────
function Regle8Banner({
  result,
  donTaciteAccepte,
  onToggleDon,
}: {
  result: Regle8Result;
  donTaciteAccepte: boolean;
  onToggleDon: (v: boolean) => void;
}) {
  const variant =
    result.niveau === "bloquant" ? "destructive" : result.niveau === "warning" ? "default" : "default";
  const Icon =
    result.niveau === "bloquant" ? ShieldAlert : result.niveau === "warning" ? AlertTriangle : ShieldCheck;
  const tone =
    result.niveau === "bloquant"
      ? "border-destructive/50 bg-destructive/5"
      : result.niveau === "warning"
      ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20"
      : "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20";
  return (
    <Alert variant={variant as any} className={`mt-2 ${tone}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Règle des 8 € — LF n° 66-948 art. 21
        <Badge variant={result.niveau === "bloquant" ? "destructive" : "outline"} className="text-[10px]">
          {result.niveau === "bloquant" ? "BLOQUANT" : result.niveau === "warning" ? "VIGILANCE" : "CONFORME"}
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-xs space-y-1.5 mt-1">
        <div>{result.message}</div>
        {result.recommandation && (
          <div className="text-muted-foreground italic">→ {result.recommandation}</div>
        )}
        <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
          <span>Coût/élève : <strong>{result.coutParEleve.toFixed(2)} €</strong></span>
          <span>Participation famille/élève : <strong>{result.participationFamilleParEleve.toFixed(2)} €</strong></span>
          <span>Reste à charge prévisionnel/élève : <strong>{result.resteAChargeParEleve.toFixed(2)} €</strong></span>
        </div>
        {result.niveau === "bloquant" && (
          <label className="flex items-center gap-2 pt-2 cursor-pointer text-[11px]">
            <Checkbox
              checked={donTaciteAccepte}
              onCheckedChange={(v) => onToggleDon(v === true)}
            />
            <span>
              J'assume le don tacite (compte 7588) et le mentionnerai dans la délibération CA.
            </span>
          </label>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ─── Validation par étape ────────────────────────────────────────
function validateStep(
  step: number,
  draft: ReturnType<typeof useVoyageDraft>["draft"],
  recettes: Partial<VoyageRecette>[],
  depenses: Partial<VoyageDepense>[],
  regle8?: Regle8Result,
): { ok: boolean; message?: string } {
  switch (step) {
    case 1:
      if (!draft.libelle || draft.libelle.trim().length < 3)
        return { ok: false, message: "Le libellé doit comporter au moins 3 caractères." };
      return { ok: true };
    case 2:
      if (!draft.type_projet) return { ok: false, message: "Sélectionnez un type de projet." };
      return { ok: true };
    case 3:
      if (!draft.nb_eleves_prevus || draft.nb_eleves_prevus <= 0)
        return { ok: false, message: "Renseignez un nombre d'élèves > 0." };
      if (draft.date_depart && draft.date_retour && draft.date_retour < draft.date_depart)
        return { ok: false, message: "Date retour antérieure à la date départ." };
      return { ok: true };
    case 4:
      // Recettes facultatives mais avertissement si vides ; ok pour passer
      return { ok: true };
    case 5:
      if (regle8?.bloquant) {
        return {
          ok: false,
          message:
            "Règle des 8 € (LF 66-948) non respectée : reste à charge sous le seuil légal. Ajustez ou cochez le don tacite.",
        };
      }
      return { ok: true };
    case 6:
      return { ok: true };
    case 7:
      if (regle8?.bloquant) {
        return {
          ok: false,
          message: "Règle des 8 € non respectée — corrigez avant validation CA.",
        };
      }
      return { ok: true };
    case 8:
      return { ok: true };
    default:
      return { ok: true };
  }
}