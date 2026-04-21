// ═══════════════════════════════════════════════════════════════
// Accueil du module Action sociale & Enquête Rectorat (v2)
// 4 tuiles principales + compteurs live
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, FileText, ClipboardCheck, BarChart3, HandHeart, FileCheck2, Mail, Receipt, FlaskConical } from "lucide-react";
import { useEleves, useDecisions, useCommissions } from "./useFsData";
import { currentAnneeScolaire, type FsDecision, type FsEleve } from "./fsv2Types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  generateDecisionChefEtablissementPdf,
  generateNotificationFamillePdf,
  generatePieceComptablePdf,
  downloadBlob,
  type PdfContext,
} from "@/lib/fs-pdf/decisionPdf";
import { toast } from "sonner";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useEstablishmentBranding } from "@/hooks/useEstablishmentBranding";

const tiles = [
  { to: "/fonds-sociaux/v2/eleves", icon: Users, label: "Élèves & Classes", desc: "Base élèves de l'établissement" },
  { to: "/fonds-sociaux/v2/decisions", icon: FileText, label: "Demandes & Décisions", desc: "Aides FS & FSC, workflow complet" },
  { to: "/fonds-sociaux/v2/commissions", icon: ClipboardCheck, label: "Commissions", desc: "Réunions commission fonds social" },
  { to: "/fonds-sociaux/v2/enquete", icon: BarChart3, label: "Tableau de bord Enquête", desc: "Préparation enquête Rectorat DGESCO" },
];

export default function FondsSociauxV2Home() {
  const { data: eleves = [] } = useEleves();
  const { data: decisions = [] } = useDecisions();
  const { data: commissions = [] } = useCommissions();
  const annee = currentAnneeScolaire();
  const decisionsAnnee = decisions.filter(d => d.annee_scolaire === annee);
  const totalVerse = decisions.filter(d => d.statut === "paye" || d.statut === "mandate" || d.statut === "decide")
    .reduce((s, d) => s + Number(d.montant), 0);

  const counters: Record<string, string> = {
    "/fonds-sociaux/v2/eleves": `${eleves.length} élève${eleves.length > 1 ? "s" : ""}`,
    "/fonds-sociaux/v2/decisions": `${decisionsAnnee.length} décision${decisionsAnnee.length > 1 ? "s" : ""} ${annee}`,
    "/fonds-sociaux/v2/commissions": `${commissions.length} commission${commissions.length > 1 ? "s" : ""}`,
    "/fonds-sociaux/v2/enquete": `${totalVerse.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
            <HandHeart className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-bold font-display tracking-tight">Action sociale & Enquête Rectorat</h1>
            <p className="italic text-muted-foreground max-w-2xl">
              « L'action sociale en faveur des élèves participe à la réduction des inégalités et à la réussite de tous. »
            </p>
            <p className="text-xs text-muted-foreground">
              Module additionnel — workflow réglementaire conforme M9-6 / Code de l'éducation L.531-1, D.531-7 / Circulaire 2017-122.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiles.map((t, i) => (
          <motion.div key={t.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={t.to}>
              <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-border/60">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center shrink-0">
                    <t.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">{t.label}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{t.desc}</p>
                    <div className="text-sm font-bold text-primary">{counters[t.to]}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tests PDF — génération d'exemples pour vérification visuelle avant envoi aux familles */}
      <PdfTestSection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Section Tests PDF
// Permet de générer un exemple de chacun des 3 documents avec
// soit une vraie décision sélectionnée, soit un jeu de données fictif.
// ═══════════════════════════════════════════════════════════════
function PdfTestSection() {
  const { selectedEstablishment } = useEstablishment();
  const { branding, logoUrl } = useEstablishmentBranding();

  const ctx: PdfContext = {
    etablissementNom: selectedEstablishment?.name ?? "Lycée Exemple",
    etablissementAdresse: branding?.address || "1 rue de l'École",
    etablissementCp: branding?.postal_code || "75000",
    etablissementVille: branding?.city || selectedEstablishment?.city || "Paris",
    uai: selectedEstablishment?.uai ?? "0000000X",
    signataireOrdonnateur: branding?.signataire_ordonnateur || selectedEstablishment?.ordonnateur || "Le Proviseur",
    signataireAgentComptable: branding?.signataire_agent_comptable || selectedEstablishment?.agent_comptable || "L'Agent comptable",
    ville: branding?.city || selectedEstablishment?.city,
    logoDataUrl: logoUrl ?? null,
  };

  // Jeu de données fictif conforme au modèle métier (additif, non persisté)
  const sampleEleve: FsEleve = {
    id: "sample-eleve",
    establishment_id: selectedEstablishment?.id ?? "sample",
    ine: "123456789AB",
    nom: "DUPONT",
    prenom: "Marie",
    date_naissance: "2008-05-12",
    classe: "2nde 4",
    niveau: "Seconde",
    voie: "GT",
    filiere: null,
    statut_boursier: true,
    echelon_bourse: 4,
    demi_pensionnaire: true,
    interne: false,
    responsables_legaux: [
      { nom: "DUPONT", prenom: "Sophie", lien: "Mère", adresse: "12 rue des Lilas\n75020 Paris", telephone: "06 12 34 56 78" },
    ],
    annee_scolaire: currentAnneeScolaire(),
    actif: true,
  };

  const sampleDecision: FsDecision = {
    id: "sample-decision",
    establishment_id: selectedEstablishment?.id ?? "sample",
    numero_decision: "FSC-2025-EXEMPLE",
    eleve_id: sampleEleve.id,
    annee_scolaire: currentAnneeScolaire(),
    type_fonds: "FSC",
    nature_aide: "restauration",
    modalite_attribution: "commission",
    commission_id: null,
    modalite_versement: "aide_directe",
    organisme_tiers_nom: null,
    organisme_tiers_siret: null,
    montant: 250,
    code_activite_opale: "16FSC",
    compte_imputation_opale: "6571",
    date_decision: new Date().toISOString().slice(0, 10),
    motif: "Aide à la restauration scolaire pour l'année en cours suite à la situation familiale précaire (perte d'emploi du responsable légal). Décision prise en commission fonds social du mois courant.",
    pieces_justificatives_urls: [],
    decision_chef_etablissement_pdf_url: null,
    notification_famille_pdf_url: null,
    piece_comptable_pdf_url: null,
    statut: "decide",
    date_mandatement: new Date().toISOString().slice(0, 10),
    numero_mandat: null,
  };

  const handleGenerate = (kind: "decision" | "notification" | "piece") => {
    try {
      let blob: Blob;
      let filename: string;
      switch (kind) {
        case "decision":
          blob = generateDecisionChefEtablissementPdf(sampleDecision, sampleEleve, ctx);
          filename = `EXEMPLE_decision_chef_etablissement_${sampleDecision.numero_decision}.pdf`;
          break;
        case "notification":
          blob = generateNotificationFamillePdf(sampleDecision, sampleEleve, ctx);
          filename = `EXEMPLE_notification_famille_${sampleDecision.numero_decision}.pdf`;
          break;
        case "piece":
          blob = generatePieceComptablePdf(sampleDecision, sampleEleve, ctx);
          filename = `EXEMPLE_piece_comptable_${sampleDecision.numero_decision}.pdf`;
          break;
      }
      downloadBlob(blob, filename);
      toast.success("PDF d'exemple généré", { description: filename });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const tests = [
    {
      key: "decision" as const,
      icon: FileCheck2,
      title: "Décision du chef d'établissement",
      desc: "Document officiel d'attribution avec visas réglementaires (L.531-1, D.531-7, circulaire 2017-122).",
    },
    {
      key: "notification" as const,
      icon: Mail,
      title: "Notification famille",
      desc: "Courrier informant la famille du montant attribué et des modalités de versement.",
    },
    {
      key: "piece" as const,
      icon: Receipt,
      title: "Pièce comptable (mandat)",
      desc: "Justificatif comptable pour mandatement Op@le avec imputation et tiers payé.",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="border-dashed border-border/60 bg-muted/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0">
              <FlaskConical className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Tests PDF — Aperçu des documents</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Générez un exemple de chacun des 3 documents avec un jeu de données fictif pour vérifier le rendu (en-tête, signatures, mise en page) avant envoi aux familles. Aucune donnée n'est persistée.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tests.map((t) => (
              <div key={t.key} className="rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">{t.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{t.desc}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(t.key)}
                  className="w-full"
                >
                  Générer l'exemple
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}