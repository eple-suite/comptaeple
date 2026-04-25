import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { usePersistedState } from "@/hooks/usePersistedState";

type Etape = { titre: string; resume: string; lien?: string };

const PARCOURS: Record<string, { label: string; resume: string; etapes: Etape[] }> = {
  sg: {
    label: "Secrétaire général", resume: "Maîtrise des saisies courantes et de l'instruction des dossiers.",
    etapes: [
      { titre: "Profil & rattachement", resume: "Compléter votre profil et confirmer l'EPLE de rattachement.", lien: "/parametres" },
      { titre: "Découvrir le cockpit", resume: "Comprendre les KPI réglementaires et la heatmap.", lien: "/" },
      { titre: "Importer une balance", resume: "Exporter Op@le et importer un fichier .xlsx.", lien: "/import" },
      { titre: "Saisir un voyage scolaire", resume: "Suivre les 7 étapes du wizard voyages.", lien: "/voyages-v2" },
      { titre: "Préparer un fonds social", resume: "Créer un dossier élève, une commission, une décision.", lien: "/fonds-sociaux/v2" },
      { titre: "Lancer un entretien", resume: "Démarrer un CREP et compléter la fiche de poste.", lien: "/entretiens/nouveau" },
      { titre: "Consulter la FAQ", resume: "Trouver une réponse rapide.", lien: "/aide/faq" },
      { titre: "Activer le bouton Claude", resume: "Poser une question contextualisée à l'assistant.", lien: "/" },
    ],
  },
  ac: {
    label: "Agent comptable", resume: "Pilotage, contrôles, clôture mensuelle, CICF.",
    etapes: [
      { titre: "Vue d'ensemble groupement", resume: "Cockpit + carte d'identité + alertes transverses.", lien: "/" },
      { titre: "Importer balance + SDE/SDR", resume: "Les 3 imports comptables prioritaires.", lien: "/import" },
      { titre: "Lancer le compte financier", resume: "Section REPROFI et indicateurs réglementaires.", lien: "/compte-financier" },
      { titre: "Évaluer le FdR / BFR / Trésorerie", resume: "Indicateurs HYPER@LE et seuils.", lien: "/hyperale" },
      { titre: "Contrôle interne", resume: "Cartographie, plan d'action, score CICF.", lien: "/controle-interne" },
      { titre: "Régies & SATD", resume: "Vérifier journal de caisse + alertes SATD.", lien: "/regies" },
      { titre: "Marchés publics", resume: "Vérifier le respect des seuils CCP 2026.", lien: "/aide/article/marches-cadre-reglementaire" },
      { titre: "Voyages : conformité", resume: "Audit des dossiers voyages avant clôture.", lien: "/voyages-v2" },
      { titre: "Exporter PDF Cockpit", resume: "Document de référence pour le rectorat.", lien: "/" },
      { titre: "Tour guidé complet", resume: "Refaire le tour de 7 étapes pour validation.", lien: "/" },
    ],
  },
  ordo: {
    label: "Ordonnateur / Chef d'établissement", resume: "Validation, signatures, présentation au CA.",
    etapes: [
      { titre: "Mode démo / présentation", resume: "Activer le mode présentation pour le CA.", lien: "/" },
      { titre: "Lire les KPI", resume: "Comprendre rouge / orange / vert.", lien: "/" },
      { titre: "Valider un voyage", resume: "Signer la délibération CA voyage.", lien: "/voyages-v2" },
      { titre: "Valider un marché", resume: "Décision d'attribution et notification.", lien: "/aide/article/marches-pas-a-pas" },
      { titre: "Signer un entretien", resume: "Approuver le CREP après le N+1/N+2.", lien: "/entretiens" },
      { titre: "Préparer le CA", resume: "Exporter document CA et notes pédagogiques.", lien: "/compte-financier" },
    ],
  },
};

export default function AideOnboarding() {
  const { profilId } = useParams<{ profilId: string }>();
  const navigate = useNavigate();
  const parcours = profilId ? PARCOURS[profilId] : null;
  const [done, setDone] = usePersistedState<number[]>(`aide-onboarding-${profilId}`, []);

  if (!parcours) return <div className="container mx-auto p-6">Parcours introuvable.</div>;

  const total = parcours.etapes.length;
  const completed = done.length;
  const pct = Math.round((completed / total) * 100);

  const toggle = (i: number) => {
    setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}><ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi</Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{parcours.label}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{parcours.resume}</p>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">{completed}/{total}</Badge>
          </div>
          <div className="mt-4">
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{pct}% du parcours réalisé</p>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {parcours.etapes.map((e, i) => {
          const isDone = done.includes(i);
          return (
            <Card key={i} className={isDone ? "border-emerald-300/60 bg-emerald-50/30 dark:bg-emerald-900/10" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(i)} aria-label={isDone ? "Marquer non fait" : "Marquer fait"}>
                    {isDone ? <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-0.5" /> : <Circle className="h-6 w-6 text-muted-foreground mt-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground">Étape {i + 1}</span>
                      <h3 className="font-medium">{e.titre}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{e.resume}</p>
                  </div>
                  {e.lien && (
                    <Link to={e.lien}>
                      <Button size="sm" variant="outline">Y aller <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}