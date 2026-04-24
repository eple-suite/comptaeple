// ════════════════════════════════════════════════════════════════
// Étapes du wizard Voyage v2
// 1.Identification 2.Type 3.Dates/Effectifs 4.Recettes
// 5.Dépenses 6.Accompagnateurs 7.Validation CA 8.Récap
// ════════════════════════════════════════════════════════════════
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  TYPE_PROJET_LABELS,
  NATURE_RECETTE_LABELS,
  POSTE_DEPENSE_LABELS,
  STATUT_FINANCEUR_LABELS,
  STATUT_FINANCEUR_COLORS,
} from "../types";
import type { TypeProjet, NatureRecette, PosteDepense, StatutFinanceur, VoyageRecette, VoyageDepense } from "../types";
import type { VoyageDraft } from "../hooks/useVoyageV2";
import { snapshotVoyage, formatEuro, compteSuggereDepense, compteSuggereRecette } from "../lib/financialEngine";

type Updater = <K extends keyof VoyageDraft>(key: K, value: VoyageDraft[K]) => void;

// ─── Étape 1 — Identification ────────────────────────────────────
export function Step1Identification({ draft, update }: { draft: VoyageDraft; update: Updater }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Libellé du voyage *" required>
          <Input value={draft.libelle || ""} onChange={(e) => update("libelle", e.target.value)} placeholder="Ex : Séjour pédagogique Berlin" />
        </Field>
        <Field label="Référence interne" hint="Auto-générée si laissée vide">
          <Input value={draft.reference_interne || ""} onChange={(e) => update("reference_interne", e.target.value)} placeholder="VS-2026-0001" />
        </Field>
        <Field label="Destination — ville">
          <Input value={draft.destination_ville || ""} onChange={(e) => update("destination_ville", e.target.value)} placeholder="Berlin" />
        </Field>
        <Field label="Destination — pays">
          <Input value={draft.destination_pays || ""} onChange={(e) => update("destination_pays", e.target.value)} placeholder="Allemagne" />
        </Field>
        <Field label="Responsable pédagogique">
          <Input value={draft.responsable_pedago_nom || ""} onChange={(e) => update("responsable_pedago_nom", e.target.value)} placeholder="Mme Dupont" />
        </Field>
        <Field label="Caractère du voyage">
          <Select value={draft.caractere || "facultatif"} onValueChange={(v) => update("caractere", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="facultatif">Facultatif</SelectItem>
              <SelectItem value="obligatoire">Obligatoire (gratuité familles)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Lien avec le projet d'établissement">
        <Textarea
          value={draft.lien_projet_etablissement || ""}
          onChange={(e) => update("lien_projet_etablissement", e.target.value)}
          placeholder="Axe 2 du projet : ouverture européenne, mobilité…"
          rows={3}
        />
      </Field>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Rattachement ADAGE</p>
          <p className="text-xs text-muted-foreground">Action recensée dans l'application ADAGE</p>
        </div>
        <Switch checked={!!draft.rattachement_adage} onCheckedChange={(v) => update("rattachement_adage", v)} />
      </div>
      {draft.caractere === "obligatoire" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Voyage obligatoire</AlertTitle>
          <AlertDescription className="text-xs">
            Aucune participation ne peut être demandée aux familles (loi 66-948 art. 21). Le financement repose intégralement sur les ressources de l'établissement et les subventions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── Étape 2 — Type de projet ────────────────────────────────────
export function Step2TypeProjet({ draft, update }: { draft: VoyageDraft; update: Updater }) {
  const options: TypeProjet[] = ["cle_en_main", "prestataires_separes", "erasmus_porteur", "erasmus_partenaire"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update("type_projet", opt)}
            className={`text-left rounded-xl border p-4 transition-all ${
              draft.type_projet === opt
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40"
            }`}
          >
            <p className="font-semibold text-sm">{TYPE_PROJET_LABELS[opt]}</p>
            <p className="text-xs text-muted-foreground mt-1">{describeProjet(opt)}</p>
          </button>
        ))}
      </div>

      {draft.type_projet === "cle_en_main" && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground">AGENCE / PRESTATAIRE GLOBAL</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nom de l'agence"><Input value={draft.agence_nom || ""} onChange={(e) => update("agence_nom", e.target.value)} /></Field>
            <Field label="SIRET"><Input value={draft.agence_siret || ""} onChange={(e) => update("agence_siret", e.target.value)} placeholder="14 chiffres" /></Field>
            <Field label="Garantie financière (immatric. Atout France…)"><Input value={draft.agence_garantie || ""} onChange={(e) => update("agence_garantie", e.target.value)} /></Field>
          </div>
        </div>
      )}

      {(draft.type_projet === "erasmus_porteur" || draft.type_projet === "erasmus_partenaire") && (
        <div className="space-y-3 rounded-lg bg-primary/5 p-4 border border-primary/20">
          <p className="text-xs font-semibold text-primary">ERASMUS+</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Type d'action (KA1, KA2…)"><Input value={draft.erasmus_type || ""} onChange={(e) => update("erasmus_type", e.target.value)} /></Field>
            <Field label="N° de convention"><Input value={draft.erasmus_convention_ref || ""} onChange={(e) => update("erasmus_convention_ref", e.target.value)} /></Field>
            <Field label="Subvention notifiée (€)"><Input type="number" value={draft.erasmus_subvention_notifiee || 0} onChange={(e) => update("erasmus_subvention_notifiee", Number(e.target.value))} /></Field>
            <Field label="Avance reçue (€)"><Input type="number" value={draft.erasmus_avance_recue || 0} onChange={(e) => update("erasmus_avance_recue", Number(e.target.value))} /></Field>
          </div>
        </div>
      )}
    </div>
  );
}

function describeProjet(t: TypeProjet): string {
  switch (t) {
    case "cle_en_main": return "Une agence prend en charge transport, hébergement, activités. Marché unique.";
    case "prestataires_separes": return "L'EPLE contractualise séparément (transport / hébergement / activités). Allotissement.";
    case "erasmus_porteur": return "L'EPLE est titulaire de la convention Erasmus+ et gère la subvention.";
    case "erasmus_partenaire": return "L'EPLE participe à un consortium Erasmus+ porté par un autre établissement.";
  }
}

// ─── Étape 3 — Dates & Effectifs ─────────────────────────────────
export function Step3DatesEffectifs({ draft, update }: { draft: VoyageDraft; update: Updater }) {
  const nuitees = computeNuitees(draft.date_depart, draft.date_retour);
  const tauxAccomp = draft.nb_eleves_prevus && draft.nb_eleves_prevus > 0
    ? (Number(draft.nb_accompagnateurs_prevus || 0) / Number(draft.nb_eleves_prevus)) * 100
    : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Date de départ">
          <Input type="date" value={draft.date_depart || ""} onChange={(e) => update("date_depart", e.target.value || null)} />
        </Field>
        <Field label="Date de retour">
          <Input type="date" value={draft.date_retour || ""} onChange={(e) => update("date_retour", e.target.value || null)} />
        </Field>
        <Field label="Nuitées (auto)" hint={nuitees > 0 ? `${nuitees} nuit(s)` : ""}>
          <Input type="number" value={nuitees} readOnly disabled />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Nombre d'élèves prévus *" required>
          <Input type="number" min={0} value={draft.nb_eleves_prevus || 0} onChange={(e) => update("nb_eleves_prevus", Number(e.target.value))} />
        </Field>
        <Field label="Nombre d'accompagnateurs *" required hint={tauxAccomp ? `Ratio : 1 pour ${(100 / tauxAccomp).toFixed(1)} élèves` : ""}>
          <Input type="number" min={0} value={draft.nb_accompagnateurs_prevus || 0} onChange={(e) => update("nb_accompagnateurs_prevus", Number(e.target.value))} />
        </Field>
        <Field label="Classes concernées (séparées par virgule)">
          <Input
            value={(draft.classes_concernees || []).join(", ")}
            onChange={(e) => update("classes_concernees", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="3eA, 3eB"
          />
        </Field>
      </div>

      {draft.nb_eleves_prevus && draft.nb_accompagnateurs_prevus && tauxAccomp < 8 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Taux d'encadrement insuffisant</AlertTitle>
          <AlertDescription className="text-xs">
            Le taux d'encadrement recommandé est d'au moins 1 accompagnateur pour 12 élèves (circulaire MENE2407159C). Vérifiez la conformité.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function computeNuitees(d1: string | null | undefined, d2: string | null | undefined): number {
  if (!d1 || !d2) return 0;
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ─── Étape 4 — Recettes prévisionnelles ──────────────────────────
export function Step4Recettes({
  recettes,
  setRecettes,
}: {
  recettes: Partial<VoyageRecette>[];
  setRecettes: (r: Partial<VoyageRecette>[]) => void;
}) {
  const add = () =>
    setRecettes([...recettes, { libelle: "", nature: "famille", montant: 0, statut_financeur: "hypothese", imputation_compte: compteSuggereRecette("famille") }]);
  const update = (i: number, patch: Partial<VoyageRecette>) => {
    const next = [...recettes];
    next[i] = { ...next[i], ...patch };
    if (patch.nature) next[i].imputation_compte = compteSuggereRecette(patch.nature);
    setRecettes(next);
  };
  const remove = (i: number) => setRecettes(recettes.filter((_, idx) => idx !== i));

  const total = recettes.reduce((s, r) => s + (Number(r.montant) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Recettes prévisionnelles ({recettes.length})</p>
        <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter</Button>
      </div>
      {recettes.length === 0 && (
        <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
          Aucune recette. Ajoutez au minimum la participation des familles ou les subventions attendues.
        </p>
      )}
      {recettes.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border border-border bg-card">
          <div className="col-span-12 md:col-span-4">
            <Label className="text-xs">Libellé</Label>
            <Input value={r.libelle || ""} onChange={(e) => update(i, { libelle: e.target.value })} placeholder="Ex : Participation familles" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <Label className="text-xs">Nature</Label>
            <Select value={r.nature || "famille"} onValueChange={(v) => update(i, { nature: v as NatureRecette })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NATURE_RECETTE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 md:col-span-2">
            <Label className="text-xs">Montant (€)</Label>
            <Input type="number" value={r.montant ?? 0} onChange={(e) => update(i, { montant: Number(e.target.value) })} />
          </div>
          <div className="col-span-3 md:col-span-2">
            <Label className="text-xs">Statut</Label>
            <Select value={r.statut_financeur || "hypothese"} onValueChange={(v) => update(i, { statut_financeur: v as StatutFinanceur })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUT_FINANCEUR_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-1">
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="col-span-12 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">M9-6 : {r.imputation_compte || compteSuggereRecette(r.nature || "famille")}</Badge>
            {r.statut_financeur && (
              <Badge className={`text-[10px] ${STATUT_FINANCEUR_COLORS[r.statut_financeur]}`}>{STATUT_FINANCEUR_LABELS[r.statut_financeur]}</Badge>
            )}
          </div>
        </div>
      ))}
      <div className="text-right text-sm font-semibold pt-2">
        Total recettes prévisionnelles : <span className="text-primary">{formatEuro(total)}</span>
      </div>
    </div>
  );
}

// ─── Étape 5 — Dépenses prévisionnelles ──────────────────────────
export function Step5Depenses({
  depenses,
  setDepenses,
}: {
  depenses: Partial<VoyageDepense>[];
  setDepenses: (d: Partial<VoyageDepense>[]) => void;
}) {
  const add = () =>
    setDepenses([...depenses, { libelle: "", poste: "transport", montant_ht: 0, montant_ttc: 0, taux_tva: 0, compte_charge: compteSuggereDepense("transport") }]);
  const update = (i: number, patch: Partial<VoyageDepense>) => {
    const next = [...depenses];
    next[i] = { ...next[i], ...patch };
    if (patch.poste) next[i].compte_charge = compteSuggereDepense(patch.poste);
    if (patch.montant_ht !== undefined || patch.taux_tva !== undefined) {
      const ht = Number(next[i].montant_ht) || 0;
      const tva = Number(next[i].taux_tva) || 0;
      next[i].montant_ttc = +(ht * (1 + tva / 100)).toFixed(2);
    }
    setDepenses(next);
  };
  const remove = (i: number) => setDepenses(depenses.filter((_, idx) => idx !== i));

  const total = depenses.reduce((s, d) => s + (Number(d.montant_ttc) || Number(d.montant_ht) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Dépenses prévisionnelles ({depenses.length})</p>
        <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter</Button>
      </div>
      {depenses.length === 0 && (
        <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
          Aucune dépense. Ajoutez au moins le transport et l'hébergement.
        </p>
      )}
      {depenses.map((d, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border border-border bg-card">
          <div className="col-span-12 md:col-span-4">
            <Label className="text-xs">Libellé</Label>
            <Input value={d.libelle || ""} onChange={(e) => update(i, { libelle: e.target.value })} placeholder="Ex : Bus Berlin AR" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <Label className="text-xs">Poste</Label>
            <Select value={d.poste || "transport"} onValueChange={(v) => update(i, { poste: v as PosteDepense })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POSTE_DEPENSE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 md:col-span-2">
            <Label className="text-xs">HT (€)</Label>
            <Input type="number" value={d.montant_ht ?? 0} onChange={(e) => update(i, { montant_ht: Number(e.target.value) })} />
          </div>
          <div className="col-span-3 md:col-span-1">
            <Label className="text-xs">TVA %</Label>
            <Input type="number" value={d.taux_tva ?? 0} onChange={(e) => update(i, { taux_tva: Number(e.target.value) })} />
          </div>
          <div className="col-span-3 md:col-span-1">
            <Label className="text-xs">TTC</Label>
            <Input type="number" value={d.montant_ttc ?? 0} readOnly disabled />
          </div>
          <div className="col-span-12 md:col-span-1">
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="col-span-12">
            <Badge variant="outline" className="text-[10px]">M9-6 : {d.compte_charge || compteSuggereDepense(d.poste || "transport")}</Badge>
          </div>
        </div>
      ))}
      <div className="text-right text-sm font-semibold pt-2">
        Total dépenses prévisionnelles : <span className="text-destructive">{formatEuro(total)}</span>
      </div>
    </div>
  );
}

// ─── Étape 6 — Accompagnateurs ───────────────────────────────────
export function Step6Accompagnateurs({ draft, update }: { draft: VoyageDraft; update: Updater }) {
  const ratio = draft.nb_eleves_prevus && draft.nb_eleves_prevus > 0
    ? Number(draft.nb_accompagnateurs_prevus || 0) / Number(draft.nb_eleves_prevus)
    : 0;
  const conforme = ratio >= 1 / 12;
  return (
    <div className="space-y-4">
      <Alert className={conforme ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" : "border-orange-300 bg-orange-50 dark:bg-orange-950/20"}>
        {conforme ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-orange-600" />}
        <AlertTitle className="text-sm">Taux d'encadrement</AlertTitle>
        <AlertDescription className="text-xs">
          {draft.nb_accompagnateurs_prevus} accompagnateur(s) pour {draft.nb_eleves_prevus} élève(s).{" "}
          {ratio > 0 && (
            <>
              Soit 1 pour {(1 / ratio).toFixed(1)} élèves.{" "}
              {conforme
                ? "Conforme à la circulaire MENE2407159C (≥ 1/12)."
                : "Inférieur au seuil recommandé (1/12)."}
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">Frais des accompagnateurs</p>
        <p className="text-xs text-muted-foreground">
          Les frais des accompagnateurs sont à la charge de l'établissement. Ils sont pris en compte automatiquement
          dans le calcul du coût par élève si vous avez ajouté une ligne de dépense « Coût des accompagnateurs » à l'étape 5.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nombre d'accompagnateurs">
            <Input type="number" value={draft.nb_accompagnateurs_prevus || 0} onChange={(e) => update("nb_accompagnateurs_prevus", Number(e.target.value))} />
          </Field>
          <Field label="Note (qualité, fonction…)">
            <Input value={(draft as any).note_accomp || ""} onChange={(e) => update("note_accomp" as any, e.target.value as any)} placeholder="2 enseignants, 1 CPE, 1 infirmière" />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Étape 7 — Validation CA ─────────────────────────────────────
export function Step7ValidationCA({ draft, update }: { draft: VoyageDraft; update: Updater }) {
  // Calcul du délai entre le vote du budget et le départ (alerte critique)
  const dateRefCa = draft.date_ca_budget || draft.date_ca_autorisation;
  const delaiJours =
    dateRefCa && draft.date_depart
      ? Math.round(
          (new Date(draft.date_depart).getTime() - new Date(dateRefCa).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
  const delaiNiveau =
    delaiJours === null
      ? null
      : delaiJours < 0
      ? "critique-passe"
      : delaiJours < 30
      ? "critique"
      : delaiJours < 60
      ? "vigilance"
      : "ok";

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Deux délibérations CA distinctes — R.421-20 Code éducation</AlertTitle>
        <AlertDescription className="text-xs">
          Un voyage scolaire requiert <strong>deux votes du CA</strong> :{" "}
          <strong>(1)</strong> autorisation de principe (programmation, contributions familles),
          puis <strong>(2)</strong> approbation du budget définitif après mise en concurrence.
          Les actes ne deviennent exécutoires qu'à l'issue du contrôle de légalité (15 à 30 jours
          après transmission — art. L.421-14).
        </AlertDescription>
      </Alert>

      {/* Vote n°1 — autorisation de principe */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">Vote n°1</Badge>
          <h3 className="font-semibold text-sm">Autorisation de principe</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Le CA autorise le principe du voyage, la programmation et les contributions familles
          (avant mise en concurrence). Aucune dépense ne peut être engagée avant ce vote.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Date du vote — autorisation de principe">
            <Input
              type="date"
              value={draft.date_ca_principe || ""}
              onChange={(e) => update("date_ca_principe", e.target.value || null)}
            />
          </Field>
          <Field label="Numéro de l'acte (vote n°1)">
            <Input
              value={draft.numero_acte_ca_principe || ""}
              onChange={(e) => update("numero_acte_ca_principe", e.target.value)}
              placeholder="Ex : 2026-08"
            />
          </Field>
        </div>
      </div>

      {/* Vote n°2 — approbation du budget */}
      <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white">Vote n°2</Badge>
          <h3 className="font-semibold text-sm">Approbation du budget définitif</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Après mise en concurrence, le CA approuve le budget chiffré définitif. C'est la date
          de référence pour le contrôle de légalité et le calcul des délais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Date du vote — approbation du budget">
            <Input
              type="date"
              value={draft.date_ca_budget || ""}
              onChange={(e) => update("date_ca_budget", e.target.value || null)}
            />
          </Field>
          <Field label="Numéro de l'acte (vote n°2)">
            <Input
              value={draft.numero_acte_ca_budget || ""}
              onChange={(e) => update("numero_acte_ca_budget", e.target.value)}
              placeholder="Ex : 2026-15"
            />
          </Field>
        </div>
      </div>

      {/* Alerte délai vote budget → départ */}
      {delaiJours !== null && (
        <Alert
          variant={delaiNiveau === "critique" || delaiNiveau === "critique-passe" ? "destructive" : "default"}
          className={
            delaiNiveau === "ok"
              ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20"
              : delaiNiveau === "vigilance"
              ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20"
              : ""
          }
        >
          {delaiNiveau === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle className="text-sm">
            Délai vote budget CA → départ : <strong>{delaiJours} jour(s)</strong>
          </AlertTitle>
          <AlertDescription className="text-xs">
            {delaiNiveau === "critique-passe" && (
              <span>
                ⛔ Le vote du budget est postérieur au départ. <strong>Engagement irrégulier</strong> :
                le voyage est entrepris sans budget exécutoire. Régulariser d'urgence.
              </span>
            )}
            {delaiNiveau === "critique" && (
              <span>
                ⛔ Délai trop court ({delaiJours} j &lt; 30 j). Les actes EPLE deviennent
                exécutoires entre 15 et 30 jours après transmission au contrôle de légalité
                (art. L.421-14). <strong>Risque : voyage entrepris sur acte non exécutoire.</strong>
                {" "}Reporter la délibération ou la date de départ.
              </span>
            )}
            {delaiNiveau === "vigilance" && (
              <span>
                ⚠️ Délai serré ({delaiJours} j). Vérifier auprès de la DSDEN/rectorat que l'acte
                est rendu exécutoire avant le départ.
              </span>
            )}
            {delaiNiveau === "ok" && (
              <span>
                ✅ Délai conforme : l'acte budgétaire pourra être rendu exécutoire largement avant
                le départ.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Statut du voyage">
          <Select value={draft.statut || "projet"} onValueChange={(v) => update("statut", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="projet">En projet (avant CA)</SelectItem>
              <SelectItem value="autorise_ca">Autorisé en CA</SelectItem>
              <SelectItem value="en_cours">En cours d'exécution</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

// ─── Étape 8 — Récapitulatif ─────────────────────────────────────
export function Step8Recap({
  draft,
  recettes,
  depenses,
}: {
  draft: VoyageDraft;
  recettes: Partial<VoyageRecette>[];
  depenses: Partial<VoyageDepense>[];
}) {
  const snapshot = useMemo(
    () => snapshotVoyage(
      { nb_eleves_prevus: draft.nb_eleves_prevus || 0 },
      recettes as VoyageRecette[],
      depenses as VoyageDepense[],
    ),
    [draft.nb_eleves_prevus, recettes, depenses],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RecapCard label="Recettes" value={formatEuro(snapshot.totalRecettes)} sub={`dont ${formatEuro(snapshot.totalRecettesSecurisees)} sécurisées`} tone="primary" />
        <RecapCard label="Dépenses TTC" value={formatEuro(snapshot.totalDepensesTTC)} sub={`${depenses.length} ligne(s)`} tone="warning" />
        <RecapCard
          label="Solde"
          value={formatEuro(snapshot.solde)}
          sub={snapshot.equilibre === "deficit" ? "Déficit" : snapshot.equilibre === "excedent" ? "Excédent" : "Équilibré"}
          tone={snapshot.equilibre === "deficit" ? "destructive" : snapshot.equilibre === "excedent" ? "success" : "muted"}
        />
        <RecapCard label="Coût / élève" value={formatEuro(snapshot.coutParEleve)} sub={`${draft.nb_eleves_prevus || 0} élèves`} tone="muted" />
      </div>

      <div className="rounded-lg border border-border p-4 space-y-2">
        <p className="text-sm font-semibold">Identité</p>
        <p className="text-xs text-muted-foreground">
          {draft.libelle} — {draft.destination_ville}{draft.destination_pays ? `, ${draft.destination_pays}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {draft.date_depart || "?"} → {draft.date_retour || "?"} ({computeNuitees(draft.date_depart, draft.date_retour)} nuit·s) — {TYPE_PROJET_LABELS[draft.type_projet as TypeProjet] || draft.type_projet}
        </p>
      </div>

      {snapshot.alertes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Alertes & recommandations</p>
          {snapshot.alertes.map((a) => (
            <Alert key={a.code} variant={a.niveau === "critical" ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs">{a.message}</AlertTitle>
              {a.recommandation && <AlertDescription className="text-xs">{a.recommandation}</AlertDescription>}
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants UI ──────────────────────────────────────────
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RecapCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "primary" | "success" | "warning" | "destructive" | "muted" }) {
  const cls = {
    primary: "border-primary/30 bg-primary/5",
    success: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20",
    warning: "border-orange-300 bg-orange-50 dark:bg-orange-950/20",
    destructive: "border-destructive/40 bg-destructive/5",
    muted: "border-border bg-muted/30",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}