import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Save, Send, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  OPALE_MODULES, OPALE_MODULES_LABELS, OPALE_TYPES_CONTENU, OPALE_TYPES_LABELS,
  type OpaleEtapeProcedure, type OpaleFiche, type OpaleModule, type OpaleTypeContenu,
  type OpaleVisibilite,
} from "@/lib/opale/types";
import { detecterElementsSensibles, LABELS_SENSIBLES } from "@/lib/opale/anonymisation";
import { slugifyOpale } from "@/lib/opale/slug";
import { logOpaleAcces } from "@/lib/opale/access";

const ETAPES = [
  "Identification", "Contexte", "Diagnostic", "Procédure", "Versioning", "Visibilité", "Pré-publication",
] as const;

interface FormState {
  titre: string;
  module_opale: OpaleModule;
  sous_theme: string;
  type_contenu: OpaleTypeContenu;
  tags: string[];
  symptome_observe: string;
  contexte_apparition: string;
  cause_identifiee: string;
  source_information: string;
  reference_documentaire: string;
  procedure_resolution: OpaleEtapeProcedure[];
  version_opale_concernee: string;
  date_constatation: string;
  periodicite_reverification_mois: number;
  visibilite: OpaleVisibilite;
  liens_fiches_associees: string[];
  references_documentation_officielle: string;
  // Auto-évaluation
  ae_anonymise: boolean;
  ae_pas_manuel: boolean;
  ae_testee: boolean;
  ae_version_mentionnee: boolean;
  ae_conscience_partage: boolean;
}

const empty: FormState = {
  titre: "",
  module_opale: "autre",
  sous_theme: "",
  type_contenu: "procedure",
  tags: [],
  symptome_observe: "",
  contexte_apparition: "",
  cause_identifiee: "",
  source_information: "decouverte_personnelle",
  reference_documentaire: "",
  procedure_resolution: [{ numero: 1, description: "", capture_url: null, vigilance: null }],
  version_opale_concernee: "",
  date_constatation: new Date().toISOString().slice(0, 10),
  periodicite_reverification_mois: 6,
  visibilite: "prive_groupement",
  liens_fiches_associees: [],
  references_documentation_officielle: "",
  ae_anonymise: false,
  ae_pas_manuel: false,
  ae_testee: false,
  ae_version_mentionnee: false,
  ae_conscience_partage: false,
};

export default function OpaleWizardFiche() {
  const { id } = useParams();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [ficheId, setFicheId] = useState<string | null>(id ?? null);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Charger fiche existante (édition)
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("opale_fiches").select("*").eq("id", id).maybeSingle();
      if (data) {
        const f = data as unknown as OpaleFiche;
        setForm((s) => ({
          ...s,
          titre: f.titre,
          module_opale: f.module_opale,
          sous_theme: f.sous_theme ?? "",
          type_contenu: f.type_contenu,
          tags: f.tags ?? [],
          symptome_observe: f.symptome_observe ?? "",
          contexte_apparition: f.contexte_apparition ?? "",
          cause_identifiee: f.cause_identifiee ?? "",
          procedure_resolution: f.procedure_resolution?.length
            ? f.procedure_resolution
            : [{ numero: 1, description: "", capture_url: null, vigilance: null }],
          version_opale_concernee: f.version_opale_concernee ?? "",
          date_constatation: f.date_constatation ?? new Date().toISOString().slice(0, 10),
          periodicite_reverification_mois: f.periodicite_reverification_mois ?? 6,
          visibilite: f.visibilite,
          liens_fiches_associees: f.liens_fiches_associees ?? [],
          references_documentation_officielle: f.references_documentation_officielle ?? "",
        }));
      }
    })();
  }, [id]);

  // Détection sensible globale (textes + étapes)
  const sensibles = useMemo(() => {
    const blob = [
      form.symptome_observe,
      form.contexte_apparition,
      form.cause_identifiee,
      ...form.procedure_resolution.map((e) => e.description),
    ].join("\n");
    return detecterElementsSensibles(blob);
  }, [form]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((s) => ({ ...s, [k]: v }));

  const ajouterEtape = () => {
    setForm((s) => ({
      ...s,
      procedure_resolution: [
        ...s.procedure_resolution,
        { numero: s.procedure_resolution.length + 1, description: "", capture_url: null, vigilance: null },
      ],
    }));
  };
  const supprimerEtape = (idx: number) => {
    setForm((s) => ({
      ...s,
      procedure_resolution: s.procedure_resolution
        .filter((_, i) => i !== idx)
        .map((e, i) => ({ ...e, numero: i + 1 })),
    }));
  };
  const deplacerEtape = (idx: number, dir: -1 | 1) => {
    setForm((s) => {
      const arr = [...s.procedure_resolution];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...s, procedure_resolution: arr.map((e, i) => ({ ...e, numero: i + 1 })) };
    });
  };
  const updEtape = (idx: number, patch: Partial<OpaleEtapeProcedure>) => {
    setForm((s) => ({
      ...s,
      procedure_resolution: s.procedure_resolution.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  };

  const validations: Record<number, () => string | null> = {
    0: () => (!form.titre.trim() ? "Le titre est obligatoire" : null),
    1: () => (!form.symptome_observe.trim() ? "Décrire le symptôme observé" : null),
    2: () => null,
    3: () => (form.procedure_resolution.every((e) => !e.description.trim()) ? "Au moins une étape de procédure" : null),
    4: () => (!form.version_opale_concernee.trim() ? "La version Op@le est obligatoire" : null),
    5: () => null,
    6: () => null,
  };

  const next = () => {
    const err = validations[step]?.();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, ETAPES.length - 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const persist = async (statut_publication: "brouillon" | "soumise" | "publiee") => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifs RGPD pour publication directe
      if (statut_publication !== "brouillon") {
        const allChecked = form.ae_anonymise && form.ae_pas_manuel && form.ae_testee && form.ae_version_mentionnee && form.ae_conscience_partage;
        if (!allChecked) {
          toast.error("Cochez l'ensemble de l'auto-évaluation RGPD avant publication.");
          setSaving(false);
          return;
        }
        if (sensibles.length > 0) {
          toast.error(`Éléments sensibles détectés (${sensibles.length}) : anonymiser avant publication.`);
          setSaving(false);
          return;
        }
      }

      const baseSlug = slugifyOpale(form.titre || "fiche-sans-titre");
      const payload = {
        titre: form.titre,
        slug: ficheId ? undefined : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
        auteur_id: user.id,
        module_opale: form.module_opale,
        sous_theme: form.sous_theme || null,
        type_contenu: form.type_contenu,
        symptome_observe: form.symptome_observe,
        contexte_apparition: form.contexte_apparition,
        cause_identifiee: form.cause_identifiee,
        procedure_resolution: form.procedure_resolution as never,
        version_opale_concernee: form.version_opale_concernee,
        date_constatation: form.date_constatation || null,
        periodicite_reverification_mois: form.periodicite_reverification_mois,
        visibilite: form.visibilite,
        tags: form.tags,
        liens_fiches_associees: form.liens_fiches_associees,
        references_documentation_officielle: form.references_documentation_officielle || null,
        statut_publication,
        date_publication: statut_publication === "publiee" ? new Date().toISOString() : null,
      };

      let outId = ficheId;
      if (ficheId) {
        const { error } = await supabase.from("opale_fiches").update(payload).eq("id", ficheId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("opale_fiches").insert(payload).select("id").single();
        if (error) throw error;
        outId = data.id;
        setFicheId(outId);
      }

      await logOpaleAcces(
        statut_publication === "publiee" ? "publication_fiche" : statut_publication === "soumise" ? "soumission_fiche" : "consultation_fiche",
        { cible_type: "fiche", cible_id: outId ?? undefined }
      );

      toast.success(
        statut_publication === "brouillon" ? "Brouillon enregistré" :
        statut_publication === "soumise" ? "Fiche soumise à modération" :
        "Fiche publiée"
      );

      if (statut_publication !== "brouillon") {
        nav("/ressources/opale/mes-fiches");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarde brouillon automatique au changement d'étape
  useEffect(() => {
    const t = setTimeout(() => {
      if (form.titre.trim() && step > 0) persist("brouillon");
    }, 30000); // toutes les 30s
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">AIDE Op@le › Nouvelle fiche</p>
          <h1 className="font-display text-2xl font-bold mt-1">{form.titre || "Sans titre"}</h1>
        </div>
        <Button variant="outline" onClick={() => persist("brouillon")} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> Brouillon
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {ETAPES.map((e, i) => (
          <button
            key={e}
            onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
              i === step ? "bg-primary text-primary-foreground border-primary" :
              i < step ? "bg-success/15 text-success border-success/30" :
              "bg-muted text-muted-foreground border-border"
            }`}
          >
            {i + 1}. {e}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2"><Label>Titre</Label>
                <Input value={form.titre} onChange={(e) => update("titre", e.target.value)} placeholder="Ex: Blocage validation mandat sur compte 6068 V13.2" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Module Op@le</Label>
                  <Select value={form.module_opale} onValueChange={(v) => update("module_opale", v as OpaleModule)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OPALE_MODULES.map((m) => <SelectItem key={m} value={m}>{OPALE_MODULES_LABELS[m as OpaleModule]}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Type de contenu</Label>
                  <Select value={form.type_contenu} onValueChange={(v) => update("type_contenu", v as OpaleTypeContenu)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OPALE_TYPES_CONTENU.map((t) => <SelectItem key={t} value={t}>{OPALE_TYPES_LABELS[t as OpaleTypeContenu]}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div className="space-y-2"><Label>Sous-thème (libre)</Label>
                <Input value={form.sous_theme} onChange={(e) => update("sous_theme", e.target.value)} placeholder="Ex: Mandatement, Engagement juridique..." /></div>
              <div className="space-y-2"><Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Ajouter un tag" onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      update("tags", [...new Set([...form.tags, tagInput.trim()])]);
                      setTagInput("");
                    }
                  }} />
                  <Button type="button" variant="outline" onClick={() => {
                    if (tagInput.trim()) {
                      update("tags", [...new Set([...form.tags, tagInput.trim()])]);
                      setTagInput("");
                    }
                  }}>Ajouter</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => update("tags", form.tags.filter((x) => x !== t))}>{t} ×</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2"><Label>Symptôme observé</Label>
                <Textarea rows={4} value={form.symptome_observe} onChange={(e) => update("symptome_observe", e.target.value)} placeholder="Décrire ce qui s'affiche à l'écran, le message d'erreur, le comportement anormal..." /></div>
              <div className="space-y-2"><Label>Contexte d'apparition</Label>
                <Textarea rows={3} value={form.contexte_apparition} onChange={(e) => update("contexte_apparition", e.target.value)} placeholder="Quand, dans quelles circonstances : opération en cours, profil utilisateur, période..." /></div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2"><Label>Cause identifiée</Label>
                <Textarea rows={4} value={form.cause_identifiee} onChange={(e) => update("cause_identifiee", e.target.value)} placeholder="Diagnostic structuré : pourquoi cela se produit..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Source de l'information</Label>
                  <Select value={form.source_information} onValueChange={(v) => update("source_information", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daf_a3">DAF A3</SelectItem>
                      <SelectItem value="assistance_opale">Assistance Op@le</SelectItem>
                      <SelectItem value="forum_aji">Forum AJI</SelectItem>
                      <SelectItem value="collegue_ac">Collègue AC</SelectItem>
                      <SelectItem value="decouverte_personnelle">Découverte personnelle</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Référence documentaire</Label>
                  <Input value={form.reference_documentaire} onChange={(e) => update("reference_documentaire", e.target.value)} placeholder="N° ticket, n° fiche Pléiade..." /></div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center justify-between">
                <Label>Procédure de résolution</Label>
                <Button type="button" size="sm" variant="outline" onClick={ajouterEtape}><Plus className="h-3 w-3 mr-1" /> Étape</Button>
              </div>
              {form.procedure_resolution.map((e, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Étape {e.numero}</span>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => deplacerEtape(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => deplacerEtape(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => supprimerEtape(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
                    <Textarea rows={2} value={e.description} onChange={(ev) => updEtape(i, { description: ev.target.value })} placeholder="Décrire l'action à réaliser" />
                    <Input value={e.vigilance ?? ""} onChange={(ev) => updEtape(i, { vigilance: ev.target.value || null })} placeholder="Point de vigilance (optionnel)" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Version Op@le concernée *</Label>
                  <Input value={form.version_opale_concernee} onChange={(e) => update("version_opale_concernee", e.target.value)} placeholder="Ex: V13.2" /></div>
                <div className="space-y-2"><Label>Date de constatation</Label>
                  <Input type="date" value={form.date_constatation} onChange={(e) => update("date_constatation", e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Périodicité de revérification</Label>
                <Select value={String(form.periodicite_reverification_mois)} onValueChange={(v) => update("periodicite_reverification_mois", parseInt(v, 10))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">12 mois</SelectItem>
                  </SelectContent>
                </Select></div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="space-y-2"><Label>Visibilité</Label>
                <Select value={form.visibilite} onValueChange={(v) => update("visibilite", v as OpaleVisibilite)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prive_groupement">Privé groupement (publication directe)</SelectItem>
                    <SelectItem value="academique">Académique (soumis à modération)</SelectItem>
                    <SelectItem value="national_si_partage">National (modération renforcée)</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Références documentation officielle</Label>
                <Textarea rows={2} value={form.references_documentation_officielle} onChange={(e) => update("references_documentation_officielle", e.target.value)} placeholder="URL Pléiade, n° fiche officielle..." /></div>
            </>
          )}

          {step === 6 && (
            <>
              {sensibles.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-destructive mb-2">
                    <AlertTriangle className="h-4 w-4" /> {sensibles.length} élément(s) sensible(s) détecté(s)
                  </div>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {sensibles.slice(0, 8).map((s, i) => <li key={i}>• {LABELS_SENSIBLES[s.type]} : <code className="font-mono">{s.match}</code></li>)}
                  </ul>
                  <p className="text-xs mt-2">Anonymisez avant publication.</p>
                </div>
              )}
              <div className="space-y-3 rounded-md border p-4 bg-muted/30">
                <div className="font-semibold text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Auto-évaluation obligatoire</div>
                {[
                  ["ae_anonymise", "Mes captures et textes sont anonymisés (pas de noms d'élèves, pas de données nominatives)"],
                  ["ae_pas_manuel", "Je n'ai pas reproduit de manuel Op@le propriétaire (Inetum)"],
                  ["ae_testee", "Ma procédure a été testée et fonctionne"],
                  ["ae_version_mentionnee", "J'ai mentionné la version Op@le concernée"],
                  ["ae_conscience_partage", "J'ai conscience que cette fiche sera consultée par d'autres AC"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form[k as keyof FormState] as boolean} onCheckedChange={(v) => update(k as keyof FormState, !!v as never)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                {form.visibilite === "prive_groupement" ? (
                  <Button onClick={() => persist("publiee")} disabled={saving}>
                    <Send className="h-4 w-4 mr-1" /> Publier directement
                  </Button>
                ) : (
                  <Button onClick={() => persist("soumise")} disabled={saving}>
                    <Send className="h-4 w-4 mr-1" /> Soumettre à modération
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>
        {step < ETAPES.length - 1 && (
          <Button onClick={next}>Suivant <ChevronRight className="h-4 w-4 ml-1" /></Button>
        )}
      </div>
    </div>
  );
}