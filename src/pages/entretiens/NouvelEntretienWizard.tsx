import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, FileText, Calendar, User, Briefcase, Target, GraduationCap, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  WIZARD_STEPS,
  EMPTY_WIZARD_STATE,
  type WizardState,
  currentAnneeScolaire,
  defaultPeriodeObservation,
  validateStep,
  buildCompetencesFromFichePoste,
} from "@/lib/entretiens/wizard";
import { SOUS_CRITERES_REGLEMENTAIRES, RUBRIQUES_C_LABELS, NIVEAUX_LABELS, type RubriqueC } from "@/lib/entretiens/types";

const ICONS = [User, Calendar, Briefcase, FileText, Target, GraduationCap, ClipboardCheck];

export default function NouvelEntretienWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({ ...EMPTY_WIZARD_STATE });
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Pré-remplissage : campagne + année ---------------- */
  useEffect(() => {
    if (!state.campagne_annee) {
      const annee = currentAnneeScolaire();
      const periode = defaultPeriodeObservation(annee);
      setState((s) => ({
        ...s,
        campagne_annee: annee,
        periode_debut: periode.debut,
        periode_fin: periode.fin,
      }));
    }
    if (user && !state.evaluateur_user_id) {
      setState((s) => ({ ...s, evaluateur_user_id: user.id }));
    }
  }, [user]);

  /* ---------------- Données ---------------- */
  const { data: agents = [] } = useQuery({
    queryKey: ["wizard-agents", selectedEstablishment?.id],
    queryFn: async () => {
      if (!selectedEstablishment) return [];
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("establishment_id", selectedEstablishment.id)
        .eq("actif", true)
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedEstablishment,
  });

  const { data: fichesPoste = [] } = useQuery({
    queryKey: ["wizard-fiches-poste", selectedEstablishment?.id],
    queryFn: async () => {
      if (!selectedEstablishment) return [];
      const { data, error } = await supabase
        .from("entretiens_fiches_poste")
        .select("*")
        .or(`establishment_id.eq.${selectedEstablishment.id},partagee_groupement.eq.true`)
        .order("intitule");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedEstablishment,
  });

  const { data: campagnes = [] } = useQuery({
    queryKey: ["wizard-campagnes", selectedEstablishment?.id],
    queryFn: async () => {
      if (!selectedEstablishment) return [];
      const { data, error } = await supabase
        .from("entretiens_campagnes")
        .select("*")
        .eq("establishment_id", selectedEstablishment.id)
        .order("annee_scolaire", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedEstablishment,
  });

  /* ---------------- Effets de pré-remplissage liés à la sélection ---------------- */
  useEffect(() => {
    if (!state.agent_id) return;
    const a = agents.find((x: any) => x.id === state.agent_id);
    if (!a) return;
    const fp = a.fiche_poste_id ? fichesPoste.find((f: any) => f.id === a.fiche_poste_id) : null;
    setState((s) => ({
      ...s,
      fiche_poste_id: a.fiche_poste_id ?? s.fiche_poste_id,
      agent_snapshot: {
        nom: a.nom,
        prenom: a.prenom,
        corps: a.corps,
        grade: a.grade,
        categorie: a.categorie,
        filiere: a.filiere,
        service: a.service,
        fonction: a.fonction,
        quotite_travail: a.quotite_travail,
      },
      fiche_poste_snapshot: fp
        ? {
            intitule: fp.intitule,
            missions_principales: fp.missions_principales,
            activites: fp.activites,
            competences_requises: fp.competences_requises,
          }
        : s.fiche_poste_snapshot,
      autorite_n2_user_id: a.n2_user_id ?? s.autorite_n2_user_id,
      competences:
        s.competences.C1_resultats.length === 0
          ? buildCompetencesFromFichePoste(SOUS_CRITERES_REGLEMENTAIRES, fp?.competences_requises ?? null)
          : s.competences,
    }));
  }, [state.agent_id, agents, fichesPoste]);

  useEffect(() => {
    if (!state.fiche_poste_id) return;
    const fp = fichesPoste.find((f: any) => f.id === state.fiche_poste_id);
    if (!fp) return;
    setState((s) => ({
      ...s,
      fiche_poste_snapshot: {
        intitule: fp.intitule,
        missions_principales: fp.missions_principales,
        activites: fp.activites,
        competences_requises: fp.competences_requises,
      },
    }));
  }, [state.fiche_poste_id, fichesPoste]);

  /* ---------------- Navigation ---------------- */
  const errors = validateStep(step, state);
  const progress = ((step - 1) / (WIZARD_STEPS.length - 1)) * 100;

  const goNext = () => {
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setStep((s) => Math.min(WIZARD_STEPS.length, s + 1));
  };
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  /* ---------------- Soumission finale ---------------- */
  const submit = async () => {
    if (!selectedEstablishment || !state.agent_id || !user) {
      toast.error("Établissement, agent ou session manquants.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Crée la campagne si elle n'existe pas
      let campagneId = state.campagne_id;
      if (!campagneId) {
        const { data: existing } = await supabase
          .from("entretiens_campagnes")
          .select("id")
          .eq("establishment_id", selectedEstablishment.id)
          .eq("annee_scolaire", state.campagne_annee)
          .maybeSingle();
        if (existing?.id) {
          campagneId = existing.id;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("entretiens_campagnes")
            .insert({
              establishment_id: selectedEstablishment.id,
              annee_scolaire: state.campagne_annee,
              libelle: `Campagne ${state.campagne_annee}`,
              statut: "ouverte",
              created_by: user.id,
            })
            .select("id")
            .single();
          if (cErr) throw cErr;
          campagneId = created.id;
        }
      }

      // 2. Crée l'entretien
      const { data: ent, error: eErr } = await supabase
        .from("entretiens_professionnels")
        .insert({
          establishment_id: selectedEstablishment.id,
          agent_evalue_id: state.agent_id,
          evaluateur_user_id: user.id,
          autorite_n2_user_id: state.autorite_n2_user_id,
          campagne_annee: state.campagne_annee,
          periode_debut: state.periode_debut || null,
          periode_fin: state.periode_fin || null,
          date_convocation: state.date_convocation || null,
          date_entretien: state.date_entretien || null,
          duree_entretien_min: state.duree_entretien_min,
          lieu: state.lieu || null,
          mode: state.mode,
          texte_libre_appreciation: state.texte_libre_appreciation || null,
          texte_libre_formation: state.texte_libre_formation || null,
          statut: "brouillon",
        })
        .select("id")
        .single();
      if (eErr) throw eErr;

      // 3. Insère les compétences pré-remplies
      const compRows: any[] = [];
      (Object.keys(state.competences) as RubriqueC[]).forEach((rub) => {
        state.competences[rub].forEach((c) => {
          if (c.critere) {
            compRows.push({
              entretien_id: ent.id,
              rubrique: rub,
              critere: c.critere,
              niveau: c.niveau,
              commentaire: c.commentaire || null,
            });
          }
        });
      });
      if (compRows.length > 0) {
        const { error: kErr } = await supabase.from("entretiens_competences").insert(compRows);
        if (kErr) console.warn("Compétences non insérées :", kErr.message);
      }

      // 4. Objectifs passés/futurs
      if (state.objectifs_passes.length > 0) {
        await supabase.from("entretiens_objectifs_passes").insert(
          state.objectifs_passes.map((o) => ({
            entretien_id: ent.id,
            libelle: o.libelle,
            atteinte: o.atteinte,
            commentaire: o.commentaire || null,
          }))
        );
      }
      if (state.objectifs_futurs.length > 0) {
        await supabase.from("entretiens_objectifs_futurs").insert(
          state.objectifs_futurs.map((o) => ({
            entretien_id: ent.id,
            libelle: o.libelle,
            indicateur: o.indicateur || null,
            echeance: o.echeance || null,
          }))
        );
      }
      if (state.formations_demandes.length > 0) {
        await supabase.from("entretiens_formation_demandes").insert(
          state.formations_demandes.map((f) => ({
            entretien_id: ent.id,
            intitule: f.intitule,
            categorie: f.categorie,
            priorite: f.priorite,
          }))
        );
      }

      toast.success("Brouillon d'entretien créé avec succès");
      navigate("/entretiens");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur lors de la création de l'entretien");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Rendu ---------------- */
  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      <header>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Nouvel entretien professionnel
            </h1>
            <p className="text-sm text-muted-foreground">
              Assistant guidé en 7 étapes — pré-remplissage depuis la fiche de poste et la campagne en cours.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/entretiens")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="grid grid-cols-7 gap-2 mt-3">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = ICONS[i];
            const done = step > s.id;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => step > s.id && setStep(s.id)}
                className={`text-left p-2 rounded-md border transition ${
                  active
                    ? "border-primary bg-primary/5"
                    : done
                    ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 cursor-pointer"
                    : "border-border bg-muted/30 opacity-70 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-medium">
                  {done ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Icon className="h-3 w-3" />}
                  <span>Étape {s.id}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.title}</div>
              </button>
            );
          })}
        </div>
      </header>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">{WIZARD_STEPS[step - 1].title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{WIZARD_STEPS[step - 1].description}</p>
        <Separator className="mb-4" />

        {step === 1 && (
          <Step1Agent
            state={state}
            setState={setState}
            agents={agents}
            fichesPoste={fichesPoste}
          />
        )}
        {step === 2 && (
          <Step2Campagne state={state} setState={setState} campagnes={campagnes} />
        )}
        {step === 3 && <Step3Convocation state={state} setState={setState} />}
        {step === 4 && <Step4Bilan state={state} setState={setState} />}
        {step === 5 && <Step5Competences state={state} setState={setState} />}
        {step === 6 && <Step6Futur state={state} setState={setState} />}
        {step === 7 && <Step7Recap state={state} />}

        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goPrev} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>
        {step < WIZARD_STEPS.length ? (
          <Button onClick={goNext} disabled={errors.length > 0}>
            Suivant <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting || errors.length > 0}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {submitting ? "Création…" : "Créer le brouillon"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Étapes                                                       */
/* ============================================================ */

function Step1Agent({ state, setState, agents, fichesPoste }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Agent évalué *</Label>
        <Select value={state.agent_id ?? ""} onValueChange={(v) => setState((s: WizardState) => ({ ...s, agent_id: v }))}>
          <SelectTrigger><SelectValue placeholder="— Choisir un agent BIATSS —" /></SelectTrigger>
          <SelectContent>
            {agents.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">Aucun agent enregistré pour cet établissement.</div>
            )}
            {agents.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nom.toUpperCase()} {a.prenom} — {a.corps ?? "—"} ({a.categorie ?? "?"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.agent_snapshot && (
        <div className="p-3 bg-muted/40 rounded-md text-sm space-y-1">
          <div className="font-medium">{state.agent_snapshot.prenom} {state.agent_snapshot.nom.toUpperCase()}</div>
          <div className="text-xs text-muted-foreground">
            {state.agent_snapshot.corps ?? "Corps —"} • Grade : {state.agent_snapshot.grade ?? "—"} • Cat. {state.agent_snapshot.categorie ?? "—"} • {state.agent_snapshot.filiere ?? "—"}
          </div>
          <div className="text-xs">
            Service : <span className="font-medium">{state.agent_snapshot.service ?? "—"}</span> • Fonction : <span className="font-medium">{state.agent_snapshot.fonction ?? "—"}</span> • Quotité : {state.agent_snapshot.quotite_travail ?? 100}%
          </div>
        </div>
      )}

      <div>
        <Label>Fiche de poste de référence</Label>
        <Select
          value={state.fiche_poste_id ?? ""}
          onValueChange={(v) => setState((s: WizardState) => ({ ...s, fiche_poste_id: v }))}
        >
          <SelectTrigger><SelectValue placeholder="— Sélectionner une fiche de poste —" /></SelectTrigger>
          <SelectContent>
            {fichesPoste.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">Aucune fiche de poste — saisissez les missions ci-dessous.</div>
            )}
            {fichesPoste.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.intitule}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          La fiche de poste pré-remplit les missions et les compétences à évaluer (étape 5).
        </p>
      </div>

      {state.fiche_poste_snapshot && (
        <div className="p-3 border rounded-md text-xs space-y-2 bg-card">
          <div className="font-semibold">{state.fiche_poste_snapshot.intitule}</div>
          {state.fiche_poste_snapshot.missions_principales && (
            <div><span className="text-muted-foreground">Missions :</span> {state.fiche_poste_snapshot.missions_principales}</div>
          )}
          {state.fiche_poste_snapshot.competences_requises && (
            <div><span className="text-muted-foreground">Compétences requises :</span> {state.fiche_poste_snapshot.competences_requises}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Step2Campagne({ state, setState, campagnes }: any) {
  const campagneActive = campagnes.find((c: any) => c.statut === "ouverte");
  return (
    <div className="space-y-4">
      {campagneActive && (
        <div className="p-3 bg-primary/5 border border-primary/30 rounded-md text-sm flex items-center justify-between">
          <div>
            <div className="font-medium">Campagne en cours : {campagneActive.libelle ?? campagneActive.annee_scolaire}</div>
            <div className="text-xs text-muted-foreground">
              Année scolaire {campagneActive.annee_scolaire}
              {campagneActive.date_butoir_signatures && ` • Butoir signatures : ${campagneActive.date_butoir_signatures}`}
            </div>
          </div>
          <Button
            size="sm"
            variant={state.campagne_id === campagneActive.id ? "default" : "outline"}
            onClick={() =>
              setState((s: WizardState) => ({
                ...s,
                campagne_id: campagneActive.id,
                campagne_annee: campagneActive.annee_scolaire,
              }))
            }
          >
            {state.campagne_id === campagneActive.id ? "Sélectionnée" : "Utiliser cette campagne"}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Année scolaire *</Label>
          <Input
            value={state.campagne_annee}
            onChange={(e) => setState((s: WizardState) => ({ ...s, campagne_annee: e.target.value }))}
            placeholder="2024-2025"
          />
        </div>
        <div>
          <Label>Modalité d'entretien</Label>
          <Badge variant="secondary" className="block w-fit mt-2">Pré-rempli depuis la date du jour</Badge>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Période d'observation — début *</Label>
          <Input type="date" value={state.periode_debut} onChange={(e) => setState((s: WizardState) => ({ ...s, periode_debut: e.target.value }))} />
        </div>
        <div>
          <Label>Période d'observation — fin *</Label>
          <Input type="date" value={state.periode_fin} onChange={(e) => setState((s: WizardState) => ({ ...s, periode_fin: e.target.value }))} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La période d'observation correspond aux 12 derniers mois (1er sept. → 31 août par défaut).
      </p>
    </div>
  );
}

function Step3Convocation({ state, setState }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date d'envoi de la convocation *</Label>
          <Input type="date" value={state.date_convocation} onChange={(e) => setState((s: WizardState) => ({ ...s, date_convocation: e.target.value }))} />
          <p className="text-xs text-muted-foreground mt-1">Délai réglementaire : ≥ 8 jours avant l'entretien.</p>
        </div>
        <div>
          <Label>Date prévue de l'entretien *</Label>
          <Input type="date" value={state.date_entretien} onChange={(e) => setState((s: WizardState) => ({ ...s, date_entretien: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Durée prévue (min)</Label>
          <Input type="number" min={15} max={240} value={state.duree_entretien_min} onChange={(e) => setState((s: WizardState) => ({ ...s, duree_entretien_min: parseInt(e.target.value) || 60 }))} />
        </div>
        <div>
          <Label>Modalité</Label>
          <Select value={state.mode} onValueChange={(v) => setState((s: WizardState) => ({ ...s, mode: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="presentiel">Présentiel</SelectItem>
              <SelectItem value="visio">Visio</SelectItem>
              <SelectItem value="hybride">Hybride</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lieu *</Label>
          <Input value={state.lieu} onChange={(e) => setState((s: WizardState) => ({ ...s, lieu: e.target.value }))} placeholder="Bureau du SG / Salle de réunion / Lien visio" />
        </div>
      </div>
    </div>
  );
}

function Step4Bilan({ state, setState }: any) {
  const addObjectif = () => setState((s: WizardState) => ({
    ...s,
    objectifs_passes: [...s.objectifs_passes, { libelle: "", atteinte: "atteint", commentaire: "" }],
  }));
  const removeObjectif = (i: number) => setState((s: WizardState) => ({
    ...s,
    objectifs_passes: s.objectifs_passes.filter((_, j) => j !== i),
  }));
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Objectifs N-1 et leur atteinte</Label>
          <Button size="sm" variant="outline" onClick={addObjectif}>+ Ajouter</Button>
        </div>
        {state.objectifs_passes.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun objectif renseigné — ajoutez les objectifs fixés lors du précédent entretien.</p>
        )}
        {state.objectifs_passes.map((o: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2">
            <Input className="col-span-6" placeholder="Libellé de l'objectif" value={o.libelle} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, objectifs_passes: s.objectifs_passes.map((x, j) => j === i ? { ...x, libelle: v } : x) }));
            }} />
            <Select value={o.atteinte} onValueChange={(v) =>
              setState((s: WizardState) => ({ ...s, objectifs_passes: s.objectifs_passes.map((x, j) => j === i ? { ...x, atteinte: v as any } : x) }))
            }>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="atteint">Atteint</SelectItem>
                <SelectItem value="partiellement_atteint">Partiellement atteint</SelectItem>
                <SelectItem value="non_atteint">Non atteint</SelectItem>
                <SelectItem value="sans_objet">Sans objet</SelectItem>
              </SelectContent>
            </Select>
            <Input className="col-span-2" placeholder="Commentaire" value={o.commentaire} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, objectifs_passes: s.objectifs_passes.map((x, j) => j === i ? { ...x, commentaire: v } : x) }));
            }} />
            <Button variant="ghost" size="sm" className="col-span-1" onClick={() => removeObjectif(i)}>×</Button>
          </div>
        ))}
      </div>
      <Separator />
      <div>
        <Label>Texte libre d'appréciation (optionnel — sera analysé par l'IA pendant la conduite)</Label>
        <Textarea
          rows={6}
          value={state.texte_libre_appreciation}
          onChange={(e) => setState((s: WizardState) => ({ ...s, texte_libre_appreciation: e.target.value }))}
          placeholder="Notes prises pendant ou après l'entretien…"
        />
      </div>
    </div>
  );
}

function Step5Competences({ state, setState }: any) {
  const rubriques = Object.keys(state.competences) as RubriqueC[];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        La grille est pré-remplie selon le décret 2010-888 et la fiche de poste sélectionnée. Vous l'affinerez pendant la conduite de l'entretien.
      </p>
      {rubriques.map((rub) => (
        <div key={rub} className="border rounded-md p-3">
          <div className="font-medium mb-2 text-sm">{RUBRIQUES_C_LABELS[rub]}</div>
          {state.competences[rub].map((c: any, i: number) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-1.5">
              <div className="col-span-7 text-sm py-1.5">{c.critere}</div>
              <Select value={c.niveau} onValueChange={(v) =>
                setState((s: WizardState) => ({
                  ...s,
                  competences: { ...s.competences, [rub]: s.competences[rub].map((x, j) => j === i ? { ...x, niveau: v as any } : x) },
                }))
              }>
                <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NIVEAUX_LABELS).map(([k, lab]) => (
                    <SelectItem key={k} value={k}>{lab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Step6Futur({ state, setState }: any) {
  const addFutur = () => setState((s: WizardState) => ({ ...s, objectifs_futurs: [...s.objectifs_futurs, { libelle: "", indicateur: "", echeance: "" }] }));
  const addForm = () => setState((s: WizardState) => ({ ...s, formations_demandes: [...s.formations_demandes, { intitule: "", categorie: "T1", priorite: "moyenne" }] }));
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Objectifs N+1</Label>
          <Button size="sm" variant="outline" onClick={addFutur}>+ Ajouter</Button>
        </div>
        {state.objectifs_futurs.map((o: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2">
            <Input className="col-span-6" placeholder="Libellé de l'objectif" value={o.libelle} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, objectifs_futurs: s.objectifs_futurs.map((x, j) => j === i ? { ...x, libelle: v } : x) }));
            }} />
            <Input className="col-span-4" placeholder="Indicateur de mesure" value={o.indicateur} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, objectifs_futurs: s.objectifs_futurs.map((x, j) => j === i ? { ...x, indicateur: v } : x) }));
            }} />
            <Input className="col-span-2" placeholder="Échéance" value={o.echeance} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, objectifs_futurs: s.objectifs_futurs.map((x, j) => j === i ? { ...x, echeance: v } : x) }));
            }} />
          </div>
        ))}
      </div>
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Demandes de formation (T1/T2/T3)</Label>
          <Button size="sm" variant="outline" onClick={addForm}>+ Ajouter</Button>
        </div>
        {state.formations_demandes.map((f: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2">
            <Input className="col-span-7" placeholder="Intitulé de la formation" value={f.intitule} onChange={(e) => {
              const v = e.target.value;
              setState((s: WizardState) => ({ ...s, formations_demandes: s.formations_demandes.map((x, j) => j === i ? { ...x, intitule: v } : x) }));
            }} />
            <Select value={f.categorie} onValueChange={(v) =>
              setState((s: WizardState) => ({ ...s, formations_demandes: s.formations_demandes.map((x, j) => j === i ? { ...x, categorie: v as any } : x) }))
            }>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="T1">T1 — Adaptation poste</SelectItem>
                <SelectItem value="T2">T2 — Évolution métier</SelectItem>
                <SelectItem value="T3">T3 — Développement (CPF)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={f.priorite} onValueChange={(v) =>
              setState((s: WizardState) => ({ ...s, formations_demandes: s.formations_demandes.map((x, j) => j === i ? { ...x, priorite: v as any } : x) }))
            }>
              <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div>
        <Label>Notes formation (optionnel)</Label>
        <Textarea rows={3} value={state.texte_libre_formation} onChange={(e) => setState((s: WizardState) => ({ ...s, texte_libre_formation: e.target.value }))} />
      </div>
    </div>
  );
}

function Step7Recap({ state }: { state: WizardState }) {
  const totalComp = (Object.values(state.competences) as any[]).reduce((acc, arr) => acc + arr.length, 0);
  return (
    <div className="space-y-3 text-sm">
      <RecapRow label="Agent" value={state.agent_snapshot ? `${state.agent_snapshot.prenom} ${state.agent_snapshot.nom}` : "—"} />
      <RecapRow label="Fiche de poste" value={state.fiche_poste_snapshot?.intitule ?? "—"} />
      <RecapRow label="Campagne" value={state.campagne_annee} />
      <RecapRow label="Période d'observation" value={`${state.periode_debut || "—"} → ${state.periode_fin || "—"}`} />
      <RecapRow label="Convocation" value={state.date_convocation || "—"} />
      <RecapRow label="Entretien" value={`${state.date_entretien || "—"} • ${state.mode} • ${state.lieu || "—"}`} />
      <RecapRow label="Objectifs N-1" value={`${state.objectifs_passes.length}`} />
      <RecapRow label="Compétences à évaluer" value={`${totalComp}`} />
      <RecapRow label="Objectifs N+1" value={`${state.objectifs_futurs.length}`} />
      <RecapRow label="Demandes formation" value={`${state.formations_demandes.length}`} />
      <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 rounded-md text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 inline mr-2" />
        Le brouillon sera créé en statut <strong>brouillon</strong>. Vous pourrez ensuite envoyer la convocation et conduire l'entretien.
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}