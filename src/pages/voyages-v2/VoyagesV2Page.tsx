// ════════════════════════════════════════════════════════════════
// Page parente Voyages v2 — accueil + lancement wizard + démo alertes
// Non destructif : /voyages (v1) reste intact.
// ════════════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Wand2,
  Calendar,
  Bug,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { VoyageWizard } from "./wizard/VoyageWizard";
import { DocumentsGenerator } from "./DocumentsGenerator";
import { DocumentsGeneratorReal } from "./DocumentsGeneratorReal";
import { SidebarAlertes } from "./SidebarAlertes";
import type { DocxBuildContext } from "./lib/docxBuilder";
import {
  evaluerAlertesVoyage,
  trierAlertes,
  type AlerteVoyage,
  type NiveauAlerte,
} from "./lib/alertesEngine";

const NIVEAU_BADGE: Record<NiveauAlerte, { color: string; label: string }> = {
  rouge: { color: "bg-destructive text-destructive-foreground", label: "Rouge bloquant" },
  orange: { color: "bg-orange-500 text-white", label: "Orange" },
  bleu: { color: "bg-blue-500 text-white", label: "Bleu (info)" },
  vert: { color: "bg-emerald-500 text-white", label: "Vert" },
};

function dateOffset(j: number): string {
  const d = new Date();
  d.setDate(d.getDate() + j);
  return d.toISOString().slice(0, 10);
}

export default function VoyagesV2Page() {
  const { selectedEstablishment } = useEstablishment();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [demoAlertes, setDemoAlertes] = useState<AlerteVoyage[] | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [docsMode, setDocsMode] = useState<"reel" | "demo">("reel");
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);

  const demoContext: DocxBuildContext = {
    voyage: {
      libelle: "Voyage de démonstration — Madrid",
      reference_interne: "VS-DEMO-001",
      destination_ville: "Madrid",
      destination_pays: "Espagne",
      date_depart: dateOffset(60),
      date_retour: dateOffset(65),
      nombre_nuitees: 5,
      type_projet: "cle_en_main",
      classes_concernees: ["3A", "3B"],
      nb_eleves_prevus: 45,
      nb_accompagnateurs_prevus: 4,
      responsable_pedago_nom: "Mme Dupont",
      lien_projet_etablissement: "Axe 2 — Ouverture européenne",
      montant_total_ttc: 18000,
      devise: "EUR",
      agence_nom: "EuroVoyages SAS",
      agence_siret: "12345678900012",
      agence_garantie: "APST n°123",
    },
    etablissement: {
      nom: selectedEstablishment?.name || "Établissement",
      uai: (selectedEstablishment as any)?.uai,
      chef_etab: "Le chef d'établissement",
      agent_comptable: "L'agent comptable",
    },
    recettes: [
      { libelle: "Participation des familles", nature: "famille", montant: 13500, statut_financeur: "demandee", imputation_compte: "C/70881" },
      { libelle: "Subvention Région", nature: "subv_region", montant: 3000, statut_financeur: "notifiee", imputation_compte: "C/7442" },
      { libelle: "FSE / coopérative", nature: "don_fse", montant: 1500, statut_financeur: "promesse", imputation_compte: "C/7588" },
    ],
    depenses: [
      { libelle: "Transport bus AR", poste: "transport", fournisseur: "TransAuto SARL", montant_ttc: 7000, compte_charge: "C/6245" },
      { libelle: "Hébergement 5 nuits", poste: "hebergement", fournisseur: "EuroVoyages SAS", montant_ttc: 8000, compte_charge: "C/6258" },
      { libelle: "Activités/visites", poste: "activites", fournisseur: "EuroVoyages SAS", montant_ttc: 2500, compte_charge: "C/6257" },
      { libelle: "Assurance assistance", poste: "assurance", fournisseur: "Mutuelle XYZ", montant_ttc: 500, compte_charge: "C/616" },
    ],
    participants: [],
    meta: {
      date_generation: new Date().toLocaleDateString("fr-FR"),
      auteur: "ComptaEPLE",
    },
  };

  const lancerDemo = () => {
    // Voyage volontairement fautif : départ dans 15 j, CA aujourd'hui, engagement antérieur,
    // budget déséquilibré, accompagnateurs facturés aux familles, étranger sans Ariane.
    const a = evaluerAlertesVoyage({
      date_depart: dateOffset(15),
      date_retour: dateOffset(20),
      date_ca_autorisation: dateOffset(0),
      date_premier_engagement: dateOffset(-10),
      destination_pays: "Espagne",
      inscription_ariane: false,
      budget_total: 12000,
      assurance_annulation_souscrite: false,
      acte_regie_mentionne_cautionnement: true,
      niveau_etablissement: "college",
      nb_eleves_prevus: 30,
      total_recettes_secured: 9000,
      total_depenses: 12000,
      depenses: [
        { libelle: "Hôtel accomp.", poste: "hebergement", est_accompagnateur: true, montant_ttc: 1200 },
        { libelle: "Bus transport", montant_ht: 6500, devis_present: false, poste: "transport" },
      ],
      recettes: [
        { libelle: "Subv région", statut_financeur: "notifiee", piece_jointe: false, montant: 2000 },
      ],
      cumul_fournisseur_12mois: { "TransAuto SARL": 95000 },
    });
    setDemoAlertes(trierAlertes(a));
  };

  const compteur = useMemo(() => {
    if (!demoAlertes) return null;
    return demoAlertes.reduce(
      (acc, x) => {
        acc[x.niveau] += 1;
        return acc;
      },
      { rouge: 0, orange: 0, bleu: 0, vert: 0 } as Record<NiveauAlerte, number>
    );
  }, [demoAlertes]);

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Colonne principale */}
        <div className="space-y-6 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="text-xs">Module Voyages scolaires</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Voyages scolaires</h1>
          <p className="text-muted-foreground mt-1">
            Créez, suivez et finalisez vos voyages scolaires en toute conformité (circulaire MENE2407159C, GBCP, M9-6).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setWizardOpen(true)} size="lg">
            <Wand2 className="h-4 w-4 mr-2" /> Créer un nouveau voyage
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/voyages-v2/enquetes-rectorat")}>
            <ClipboardCheck className="h-4 w-4 mr-2" /> Enquêtes rectorat
          </Button>
        </div>
          </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Comment démarrer&nbsp;?</AlertTitle>
        <AlertDescription>
          Cliquez sur <strong>«&nbsp;Créer un nouveau voyage&nbsp;»</strong> pour ouvrir l'assistant pas-à-pas
          (9 étapes guidées). Vous pouvez naviguer librement entre les étapes — aucune n'est verrouillée
          tant que vous ne finalisez pas le voyage. Les alertes réglementaires sont calculées en temps réel
          dans la colonne de droite.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Assistant de création
            </CardTitle>
            <CardDescription>
              Un parcours en 9 étapes&nbsp;: identification, type de projet, dates et effectifs, recettes,
              dépenses, accompagnateurs, validation CA, rétroplanning et récapitulatif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setWizardOpen(true)}>
              Créer un nouveau voyage
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Moteur d'alertes A.3
            </CardTitle>
            <CardDescription>
              17 catégories : délai CA 30/60/90 j, engagement avant CA, budget, accompagnateurs,
              MAPA, Ariane, RGP, passeport…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={lancerDemo}>
              <Bug className="h-4 w-4 mr-2" /> Tester sur voyage fictif fautif
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Statut livraison
            </CardTitle>
            <CardDescription>
              Liste exhaustive FAIT / PARTIEL / NON FAIT — aucune auto-déclaration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>✅ Moteur d'alertes + tests vitest</div>
            <div>✅ Wizard 9 étapes accessible</div>
            <div>✅ 32 documents — branchés voyages réels</div>
            <div>❌ Règle 8 € + bilan Créteil v2</div>
            <div>❌ Sidebar alertes permanente</div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowDocs(v => !v)}>
              {showDocs ? "Masquer" : "Ouvrir"} le générateur 32 docs
            </Button>
          </CardContent>
        </Card>
      </div>

      {showDocs && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">Source de données</Badge>
            <Button
              size="sm"
              variant={docsMode === "reel" ? "default" : "outline"}
              onClick={() => setDocsMode("reel")}
            >
              Voyage réel (base)
            </Button>
            <Button
              size="sm"
              variant={docsMode === "demo" ? "default" : "outline"}
              onClick={() => setDocsMode("demo")}
            >
              Démo (Madrid fictif)
            </Button>
          </div>
          {docsMode === "reel" ? (
            <DocumentsGeneratorReal
              key={docsRefreshKey}
              etablissement={
                selectedEstablishment
                  ? {
                      id: selectedEstablishment.id,
                      name: selectedEstablishment.name,
                      uai: (selectedEstablishment as any)?.uai,
                      address: (selectedEstablishment as any)?.address,
                      city: (selectedEstablishment as any)?.city,
                      zip_code: (selectedEstablishment as any)?.zip_code,
                    }
                  : null
              }
            />
          ) : (
            <DocumentsGenerator context={demoContext} />
          )}
        </div>
      )}

      {demoAlertes && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Démo alertes — {demoAlertes.length} alerte(s) remontée(s)</CardTitle>
                <CardDescription>
                  Voyage fictif : départ J+15, CA J+0, engagement J-10, accompagnateurs sur famille,
                  destination Espagne sans Ariane, fournisseur ≥ 95 k€ /12 mois.
                </CardDescription>
              </div>
              {compteur && (
                <div className="flex gap-2">
                  {(["rouge", "orange", "bleu"] as NiveauAlerte[]).map((n) =>
                    compteur[n] > 0 ? (
                      <Badge key={n} className={NIVEAU_BADGE[n].color}>
                        {compteur[n]} {NIVEAU_BADGE[n].label}
                      </Badge>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAlertes.map((a) => (
              <div
                key={a.id}
                className="border rounded-md p-3 flex items-start gap-3 bg-card"
              >
                <Badge className={NIVEAU_BADGE[a.niveau].color}>{a.niveau.toUpperCase()}</Badge>
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {a.titre}
                    {a.bloquant && (
                      <Badge variant="outline" className="text-[10px]">Bloquant</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{a.message}</div>
                  {a.reference_legale && (
                    <div className="text-[11px] mt-1 italic text-muted-foreground">
                      Réf. : {a.reference_legale}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedEstablishment?.id && (
        <VoyageWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          establishmentId={selectedEstablishment.id}
          onSaved={() => setDocsRefreshKey((k) => k + 1)}
        />
      )}
        </div>

        {/* Sidebar alertes permanente */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <SidebarAlertes
            establishmentId={selectedEstablishment?.id || null}
            refreshKey={docsRefreshKey}
          />
        </aside>
      </div>
    </div>
  );
}