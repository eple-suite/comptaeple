import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Sparkles, FileText, AlertTriangle, CheckCircle2, Loader2, Plus, LayoutDashboard, Scale, Briefcase, Send, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateIaResponse, computeCompletenessScore } from "@/lib/entretiens/iaSchema";
import { RUBRIQUES_C_LABELS, NIVEAUX_LABELS, type IaRepartitionResponse, type RubriqueC } from "@/lib/entretiens/types";
import { generateCrepPdf, generateCrefPdf, type CrepPdfPayload } from "@/lib/entretiens/pdfCrep";
import { ClaudeRhFloatingChat } from "@/components/entretiens/ClaudeRhFloatingChat";

const RUBRIQUES: RubriqueC[] = [
  "C1_resultats",
  "C2_competences_techniques",
  "C3_qualites_personnelles",
  "C4_encadrement",
];

export default function EntretiensHome() {
  const [texteApp, setTexteApp] = useState("");
  const [texteForm, setTexteForm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IaRepartitionResponse | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const analyser = async () => {
    if (!texteApp.trim() && !texteForm.trim()) {
      toast.error("Saisissez au moins un texte avant l'analyse.");
      return;
    }
    setLoading(true);
    setErrors([]);
    try {
      const { data, error } = await supabase.functions.invoke("entretiens-repartir-texte", {
        body: { texte_appreciation: texteApp, texte_formation: texteForm },
      });
      if (error) throw error;
      const v = validateIaResponse(data?.data);
      if (!v.ok) {
        setErrors(v.errors);
        toast.error("Réponse IA invalide — voir détails.");
      } else if (v.data) {
        setResult(v.data);
        toast.success(`Répartition terminée — score ${(computeCompletenessScore(v.data) * 100).toFixed(0)} %`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'analyse IA");
    } finally {
      setLoading(false);
    }
  };

  const downloadCrep = () => {
    if (!result) return;
    const payload: CrepPdfPayload = {
      agent: {
        id: "preview", establishment_id: "preview",
        nom: "DUPONT", prenom: "Marie", statut: "titulaire", actif: true,
        corps: "SAENES", grade: "Classe normale", echelon: 7, indice: 450,
        categorie: "B", filiere: "AENES",
        service: "Intendance", fonction: "Adjoint·e du gestionnaire",
        quotite_travail: 100,
      },
      entretien: {
        id: "preview", establishment_id: "preview", agent_evalue_id: "preview",
        evaluateur_user_id: "preview", campagne_annee: new Date().getFullYear().toString(),
        statut: "redaction_n1",
        periode_debut: `${new Date().getFullYear() - 1}-09-01`,
        periode_fin: `${new Date().getFullYear()}-08-31`,
        date_entretien: new Date().toISOString().slice(0, 10),
        duree_entretien_min: 60, lieu: "Bureau du SG", mode: "presentiel",
        ia_response_json: result,
        appreciation_generale: result.appreciation_generale,
        perspectives: result.perspectives,
      },
      ia: result,
      etablissement: {
        nom: "Établissement (aperçu)", uai: "9710000X",
        academie: "Guadeloupe", commune: "Pointe-à-Pitre",
      },
      evaluateur: { nom: "Le Secrétaire général", fonction: "N+1 — Supérieur hiérarchique direct" },
      autorite_n2: { nom: "Le Chef d'établissement", fonction: "N+2 — Autorité hiérarchique" },
    };
    const doc = generateCrepPdf(payload);
    doc.save(`CREP_apercu_${Date.now()}.pdf`);
  };

  const downloadCref = () => {
    if (!result) return;
    const payload: CrepPdfPayload = {
      agent: { id: "preview", establishment_id: "preview", nom: "DUPONT", prenom: "Marie", statut: "titulaire", actif: true, corps: "SAENES", grade: "Classe normale", service: "Intendance", fonction: "Adjoint·e du gestionnaire" },
      entretien: { id: "preview", establishment_id: "preview", agent_evalue_id: "preview", evaluateur_user_id: "preview", campagne_annee: new Date().getFullYear().toString(), statut: "redaction_n1", ia_response_json: result },
      ia: result,
      etablissement: { nom: "Établissement (aperçu)", uai: "9710000X", academie: "Guadeloupe" },
      evaluateur: { nom: "Le Secrétaire général", fonction: "N+1" },
      autorite_n2: { nom: "Le Chef d'établissement", fonction: "N+2" },
    };
    const doc = generateCrefPdf(payload);
    doc.save(`CREF_apercu_${Date.now()}.pdf`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Entretiens professionnels — CREP / CREF</h1>
          <p className="text-sm text-muted-foreground">
            Annexes C9 et C9 bis · Décret 2010-888 · Modèle académie de la Guadeloupe
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/entretiens/recours">
              <Scale className="h-4 w-4 mr-1" /> Recours
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/entretiens/fiches-poste">
              <Briefcase className="h-4 w-4 mr-1" /> Fiches de poste
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/entretiens/export-esteve">
              <Send className="h-4 w-4 mr-1" /> Export ESTEVE
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/entretiens/vue-rectorat">
              <Building2 className="h-4 w-4 mr-1" /> Vue AC
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/entretiens/campagne">
              <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard campagne
            </Link>
          </Button>
          <Button asChild>
            <Link to="/entretiens/nouveau">
              <Plus className="h-4 w-4 mr-1" /> Nouvel entretien (assistant 7 étapes)
            </Link>
          </Button>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Saisie en vrac — l'app range automatiquement</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Écrivez librement ce que vous pensez de l'agent. L'IA ventilera le contenu dans les rubriques officielles
          A, B, C (C.1 à C.4) et D, en signalant tout élément inapproprié pour un CREP officiel.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Appréciation libre (qualités, défauts, atouts, progrès…)
            </label>
            <Textarea
              value={texteApp}
              onChange={(e) => setTexteApp(e.target.value)}
              rows={14}
              placeholder="Ex : Marie a parfaitement repris la régie cette année, elle a apuré 8 mois de retard sur les encaissements voyages. Elle est très investie, rigoureuse, parfois trop perfectionniste. Difficulté à déléguer. Bonne maîtrise d'Op@le. Souhaiterait préparer le concours d'attaché."
              className="resize-y min-h-[200px] font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Volet formation (besoins, projets, formations suivies)
            </label>
            <Textarea
              value={texteForm}
              onChange={(e) => setTexteForm(e.target.value)}
              rows={14}
              placeholder="Ex : a suivi en 2024 la formation Op@le approfondie (3j, utile). Souhaite préparation concours attaché et formation contrôle interne comptable. Besoin d'une remise à niveau marchés publics."
              className="resize-y min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={analyser} disabled={loading} size="lg">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyser et répartir
          </Button>
        </div>
      </Card>

      {errors.length > 0 && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-semibold text-destructive">Erreurs de validation IA</span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Card>
      )}

      {result && (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h2 className="font-semibold">Répartition proposée — relisez et corrigez</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCrep}>
                  <FileText className="h-4 w-4 mr-2" /> PDF CREP
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCref}>
                  <FileText className="h-4 w-4 mr-2" /> PDF CREF
                </Button>
              </div>
            </div>

            {RUBRIQUES.map((rub) => {
              const sect = result.competences[rub];
              return (
                <div key={rub} className="border rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-2">{RUBRIQUES_C_LABELS[rub]}</h3>
                  {sect.synthese && (
                    <p className="text-xs italic text-muted-foreground mb-2">{sect.synthese}</p>
                  )}
                  <div className="space-y-2">
                    {sect.sous_criteres.map((sc, i) => (
                      <div key={i} className="text-xs border-l-2 border-primary/30 pl-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sc.critere}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {NIVEAUX_LABELS[sc.niveau] ?? sc.niveau} · confiance {sc.confiance}
                          </span>
                        </div>
                        <p className="mt-1">{sc.commentaire}</p>
                        {sc.extrait_source && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5">
                            🔍 « {sc.extrait_source} »
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="border rounded-lg p-3 bg-muted/30">
              <h3 className="font-semibold text-sm mb-1">Appréciation générale (rubrique D)</h3>
              <p className="text-xs whitespace-pre-line">{result.appreciation_generale}</p>
              <h4 className="font-semibold text-xs mt-3 mb-1">Perspectives</h4>
              <p className="text-xs whitespace-pre-line">{result.perspectives}</p>
            </div>

            {result.elements_a_retirer.length > 0 && (
              <div className="border rounded-lg p-3 border-destructive/40 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-sm text-destructive">
                    Éléments à retirer du document officiel ({result.elements_a_retirer.length})
                  </span>
                </div>
                <ul className="space-y-1 text-xs">
                  {result.elements_a_retirer.map((e, i) => (
                    <li key={i}>
                      <span className="italic">« {e.extrait} »</span>
                      <span className="block text-[10px] text-muted-foreground">Motif : {e.motif}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}
      <ClaudeRhFloatingChat />
    </div>
  );
}