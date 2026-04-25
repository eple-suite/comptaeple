import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { FileBarChart, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { controleAction, type ActionReliquat } from "@/lib/enquetes-rectorat/types";
import { generateEnquetePdf, downloadPdf } from "@/lib/enquetes-rectorat/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PROGRAMMES = [
  { code: "141", libelle: "BOP 141 — Enseignement scolaire 2nd degré" },
  { code: "230", libelle: "BOP 230 — Vie de l'élève" },
  { code: "214", libelle: "BOP 214 — Soutien" },
  { code: "139", libelle: "BOP 139 — Enseignement privé" },
  { code: "REGION", libelle: "Dotation Région" },
  { code: "DEPARTEMENT", libelle: "Dotation Département" },
];

const ACTIONS: { value: ActionReliquat; label: string }[] = [
  { value: "reaffectation", label: "Réaffectation interne" },
  { value: "despecialisation", label: "Déspécialisation" },
  { value: "reversement_familles", label: "Reversement aux familles" },
  { value: "restitution_rectorat", label: "Restitution au rectorat" },
  { value: "report_exercice_suivant", label: "Report exercice suivant" },
];

interface WizardData {
  programme: string;
  compte: string;
  despecialisable: boolean;
  exercice: string;
  montantInitial: number;
  montantEngage: number;
  montantPaye: number;
  action: ActionReliquat | "";
  justification: string;
  signataireOrdo: string;
}

const STEPS = [
  "Identification",
  "Compte concerné",
  "Montants",
  "Action proposée",
  "Justification",
  "Validation & PDF",
];

export default function WizardReliquatsBopPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>({
    programme: "",
    compte: "",
    despecialisable: true,
    exercice: new Date().getFullYear().toString(),
    montantInitial: 0,
    montantEngage: 0,
    montantPaye: 0,
    action: "",
    justification: "",
    signataireOrdo: "",
  });

  const reliquat = useMemo(
    () => data.montantInitial - data.montantPaye,
    [data.montantInitial, data.montantPaye],
  );

  const controle = useMemo(() => {
    if (!data.action || !data.compte) return null;
    return controleAction(
      { compte: data.compte, despecialisable: data.despecialisable, libelle: data.compte },
      data.action,
    );
  }, [data.compte, data.despecialisable, data.action]);

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const canNext = useMemo(() => {
    if (step === 0) return !!data.programme && !!data.exercice;
    if (step === 1) return !!data.compte;
    if (step === 2) return data.montantInitial > 0;
    if (step === 3) return !!data.action && controle?.autorise === true;
    if (step === 4) return data.justification.length >= 10;
    return true;
  }, [step, data, controle]);

  async function soumettre() {
    setSubmitting(true);
    try {
      const pdf = await generateEnquetePdf({
        titre: `Enquête reliquats ${data.programme}`,
        soustitre: `Compte ${data.compte} — exercice ${data.exercice}`,
        sections: [
          { titre: "Identification", lignes: [
            ["Programme", data.programme],
            ["Exercice", data.exercice],
            ["Compte", data.compte],
            ["Déspécialisable", data.despecialisable ? "Oui" : "Non"],
          ]},
          { titre: "Montants (€)", lignes: [
            ["Subvention initiale", data.montantInitial.toFixed(2)],
            ["Engagé", data.montantEngage.toFixed(2)],
            ["Payé", data.montantPaye.toFixed(2)],
            ["Reliquat", reliquat.toFixed(2)],
          ]},
          { titre: "Action", lignes: [
            ["Action proposée", data.action],
            ["Conformité", controle?.motif ?? ""],
            ["Référence", controle?.reference ?? ""],
          ]},
          { titre: "Justification", lignes: [["Texte", data.justification]] },
          { titre: "Signature", lignes: [["Ordonnateur", data.signataireOrdo]] },
        ],
      });

      // Création de la réponse (sans campagne — campagne_id null impossible : on utilise une campagne de capture)
      const { data: campagne, error: errCamp } = await supabase
        .from("enquetes_campagnes")
        .insert({
          intitule: `Saisie ad-hoc reliquats ${data.programme}`,
          type_enquete: "reliquats",
          date_echeance: new Date().toISOString().split("T")[0],
          statut: "ouverte",
          origine: "ac",
          perimetre_etablissement_ids: [],
        })
        .select("id")
        .single();
      if (errCamp) throw errCamp;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: ue } = await supabase
        .from("user_establishments")
        .select("establishment_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .maybeSingle();

      if (ue?.establishment_id) {
        await supabase.from("enquetes_reponses_eple").insert({
          campagne_id: campagne.id,
          establishment_id: ue.establishment_id,
          statut: "soumise",
          donnees: data as unknown as Record<string, unknown>,
          soumise_le: new Date().toISOString(),
          signataire_ordo: data.signataireOrdo,
        });
      }

      downloadPdf(pdf, `enquete-reliquats-${data.programme}-${data.exercice}.pdf`);
      toast.success("Enquête finalisée", { description: "PDF téléchargé et réponse archivée." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Échec de la soumission", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={FileBarChart}
        title="Wizard reliquats BOP"
        description="Saisie guidée 6 étapes — conformité M9-6 tome 3 & note DAF A3."
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Étape {step + 1} / {STEPS.length} — {STEPS[step]}</span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Sélection du programme et exercice concerné."}
            {step === 1 && "Compte concerné. Cocher si le compte est déspécialisable (exclu : 443110, 44114 AED, 441914)."}
            {step === 2 && "Montants en euros — le reliquat se calcule automatiquement."}
            {step === 3 && "Action proposée — contrôle automatique de conformité DAF A3."}
            {step === 4 && "Justification réglementaire (minimum 10 caractères)."}
            {step === 5 && "Récapitulatif, signature ordonnateur et génération PDF officiel."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Programme</Label>
                <Select value={data.programme} onValueChange={(v) => update("programme", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMMES.map((p) => (
                      <SelectItem key={p.code} value={p.code}>{p.libelle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exercice</Label>
                <Input value={data.exercice} onChange={(e) => update("exercice", e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Compte M9-6</Label>
                <Input placeholder="ex. 4411410, 443110, 44181X…" value={data.compte} onChange={(e) => update("compte", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="despecialisable"
                  type="checkbox"
                  checked={data.despecialisable}
                  onChange={(e) => update("despecialisable", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="despecialisable" className="font-normal cursor-pointer">
                  Compte déspécialisable (décocher pour 443110, 44114 AED, 441914)
                </Label>
              </div>
              {!data.despecialisable && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Compte non déspécialisable</AlertTitle>
                  <AlertDescription>
                    Seules les actions « reversement familles » et « restitution rectorat » seront autorisées (DAF A3).
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subvention initiale (€)</Label>
                  <Input type="number" min={0} step="0.01" value={data.montantInitial}
                    onChange={(e) => update("montantInitial", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Engagé (€)</Label>
                  <Input type="number" min={0} step="0.01" value={data.montantEngage}
                    onChange={(e) => update("montantEngage", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Payé (€)</Label>
                  <Input type="number" min={0} step="0.01" value={data.montantPaye}
                    onChange={(e) => update("montantPaye", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Reliquat calculé (€)</Label>
                  <Input value={reliquat.toFixed(2)} disabled />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Action proposée</Label>
                <Select value={data.action} onValueChange={(v) => update("action", v as ActionReliquat)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {controle && (
                <Alert variant={controle.autorise ? "default" : "destructive"}>
                  {controle.autorise ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>{controle.autorise ? "Action conforme" : "Action bloquée"}</AlertTitle>
                  <AlertDescription>
                    {controle.motif}
                    <div className="text-xs mt-1 opacity-80">Référence : {controle.reference}</div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea rows={6} value={data.justification} onChange={(e) => update("justification", e.target.value)}
                placeholder="Détailler le contexte, la conformité réglementaire et l'opportunité de l'action proposée." />
              <div className="text-xs text-muted-foreground">{data.justification.length} caractères (min 10)</div>
            </div>
          )}

          {step === 5 && (
            <>
              <div className="space-y-2">
                <Label>Signataire ordonnateur</Label>
                <Input value={data.signataireOrdo} onChange={(e) => update("signataireOrdo", e.target.value)}
                  placeholder="Nom et fonction" />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Récapitulatif</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between"><span>Programme</span><Badge>{data.programme}</Badge></div>
                  <div className="flex justify-between"><span>Compte</span><span className="font-mono">{data.compte}</span></div>
                  <div className="flex justify-between"><span>Reliquat</span><b>{reliquat.toFixed(2)} €</b></div>
                  <div className="flex justify-between"><span>Action</span><Badge variant="outline">{data.action}</Badge></div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Suivant <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!data.signataireOrdo || submitting} onClick={soumettre}>
            <Download className="mr-2 h-4 w-4" />
            {submitting ? "Génération…" : "Générer PDF & soumettre"}
          </Button>
        )}
      </div>
    </div>
  );
}