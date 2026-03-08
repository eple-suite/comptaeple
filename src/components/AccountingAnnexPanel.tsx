import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, Clock, Edit3, Save, Plus, Trash2, X, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FaitMarquant {
  id: string;
  titre: string;
  description: string;
  impact: "positif" | "negatif" | "neutre";
  categorie: string;
}

interface Section {
  num: number;
  titre: string;
  sousTitre: string;
  status: "ready" | "warning" | "draft";
  contenu: string;
  editable: boolean;
}

const categoriesFaits = [
  "Effectifs & vie scolaire",
  "Gestion matérielle & sécurité",
  "Restauration & hébergement",
  "Ressources humaines",
  "Subventions & financements",
  "Travaux & investissements",
  "Marchés & contrats",
  "Événements exceptionnels",
];

const initialFaitsMarquants: FaitMarquant[] = [
  { id: "1", titre: "Hausse des effectifs de 5%", description: "L'établissement a accueilli 45 élèves supplémentaires à la rentrée, portant les effectifs à 950 élèves. Cette hausse a impacté la dotation de fonctionnement et le service de restauration (+2 200 repas/trimestre).", impact: "neutre", categorie: "Effectifs & vie scolaire" },
  { id: "2", titre: "Mise aux normes du système de sécurité incendie", description: "Travaux réalisés au 2ème trimestre pour un montant de 42 000 € financés sur le budget d'investissement (subvention Région à hauteur de 30 000 €). Impact sur le service général : dépassement de 12 000 € compensé par des économies sur l'énergie.", impact: "negatif", categorie: "Gestion matérielle & sécurité" },
  { id: "3", titre: "Revalorisation du tarif de restauration", description: "Augmentation de 3,5% du tarif élève (passage de 3,80 € à 3,93 €) et de 4% du tarif commensal, conformément à la délibération du CA du 12/11/2022. Impact positif sur les recettes SRH : +8 500 € sur l'exercice.", impact: "positif", categorie: "Restauration & hébergement" },
  { id: "4", titre: "Réception tardive de la subvention Région", description: "La notification de la subvention de fonctionnement (lot 2) n'a été reçue qu'en novembre, entraînant un retard dans l'exécution de certaines dépenses d'équipement et un report de crédits sur N+1.", impact: "negatif", categorie: "Subventions & financements" },
  { id: "5", titre: "Convention de mutualisation transport scolaire", description: "Signature d'une convention avec 3 établissements voisins pour la mutualisation des transports de voyages scolaires. Économie estimée à 15% sur les prestations de transport.", impact: "positif", categorie: "Marchés & contrats" },
];

const initialSections: Section[] = [
  {
    num: 1, titre: "Présentation de l'établissement", sousTitre: "Identité, structure, environnement", status: "ready",
    contenu: `L'établissement est un EPLE (Établissement Public Local d'Enseignement) rattaché à la collectivité territoriale de rattachement (Région/Département).

▪ Type : Lycée polyvalent
▪ Académie : Aix-Marseille
▪ Effectifs N-1 : 950 élèves (dont 180 internes, 620 demi-pensionnaires, 150 externes)
▪ Personnel : 85 enseignants, 32 personnels ATSS, 12 AED
▪ Sections : enseignement général, technologique et professionnel
▪ Internat : capacité 200 places (taux d'occupation 90%)
▪ Service de restauration : 750 rationnaires/jour (self-service)

L'établissement est doté d'un budget principal et de budgets annexes pour les services spéciaux (restauration/hébergement, bourses).`,
    editable: true,
  },
  {
    num: 2, titre: "Faits marquants de l'exercice", sousTitre: "Événements ayant impacté l'exécution budgétaire", status: "warning",
    contenu: `Cette section recense les événements significatifs survenus au cours de l'exercice qui ont eu un impact sur l'exécution budgétaire. Ces faits sont documentés ci-dessous et analysés dans les sections suivantes du rapport.

[Les faits marquants sont gérés dans l'onglet dédié ci-dessus]`,
    editable: false,
  },
  {
    num: 3, titre: "Exécution budgétaire", sousTitre: "Taux de réalisation des recettes et des dépenses", status: "ready",
    contenu: `L'exécution budgétaire de l'exercice fait apparaître les éléments suivants :

RECETTES (services généraux + spéciaux) :
▪ Prévisions : 1 920 000 € — Réalisations : 1 855 230 € — Taux d'exécution : 96,6%
▪ La sous-exécution s'explique principalement par le retard de notification de la subvention Région (lot 2).

DÉPENSES :
▪ Prévisions : 1 900 000 € — Réalisations : 1 840 000 € — Taux d'exécution : 96,8%
▪ Les restes à réaliser en dépenses s'élèvent à 35 000 €, principalement sur le chapitre A1 (activités pédagogiques).

RÉSULTAT DE L'EXERCICE : +15 230 €
▪ Ce résultat excédentaire sera proposé en affectation au fonds de roulement lors du vote du compte financier.

SERVICE DE RESTAURATION ET D'HÉBERGEMENT (SRH) :
▪ Recettes SRH : 485 000 € — Dépenses SRH : 462 000 € — Résultat SRH : +23 000 €
▪ Le crédit nourriture est maîtrisé (voir section dédiée).`,
    editable: true,
  },
  {
    num: 4, titre: "Analyse du fonds de roulement", sousTitre: "FDR brut, FDR mobilisable, jours de fonctionnement", status: "ready",
    contenu: `Le fonds de roulement s'analyse comme suit :

▪ FDR brut : 245 832 € soit 42 jours de fonctionnement
▪ Éléments de fragilité à déduire :
  — Stocks (classe 3) : 33 000 €
  — Créances anciennes (> 1 an) : 8 200 €
  — Créances douteuses (compte 416) : 3 200 €
  — Total fragilité : 44 400 €

▪ FDR MOBILISABLE : 201 432 € soit 34 jours de fonctionnement

Ce niveau de FDR mobilisable est conforme aux recommandations de la collectivité de rattachement (seuil plancher de 30 jours). L'analyse détaillée est disponible dans le module Fonds de roulement.`,
    editable: true,
  },
  {
    num: 5, titre: "Analyse de la trésorerie", sousTitre: "Trésorerie brute, dettes à court terme, trésorerie propre", status: "ready",
    contenu: `La trésorerie de l'établissement se décompose ainsi :

▪ Trésorerie brute : 167 382 €
  — Dépôt au Trésor (515100) : 158 420 €
  — Caisse (531000) : 2 350 €
  — Valeurs à encaisser (511000) : 6 612 €

▪ Dettes à court terme à déduire :
  — Subventions reçues non consommées : 45 000 €
  — Reliquats de subventions : 12 300 €
  — Avances des familles : 18 500 €
  — Avances des commensaux : 4 200 €
  — Total dettes CT : 80 000 €

▪ TRÉSORERIE PROPRE : 87 382 €

La trésorerie propre est positive, témoignant de l'autonomie financière réelle de l'établissement.`,
    editable: true,
  },
  {
    num: 6, titre: "État des créances et recouvrement", sousTitre: "Créances, admissions en non-valeur, compte 416", status: "warning",
    contenu: `L'état des créances au 31/12 se présente comme suit :

▪ Créances sur usagers (411) : 12 500 € — ancienneté < 1 an
▪ Créances douteuses (416) : 3 200 € — ancienneté > 1 an
▪ Subventions à recevoir (441) : 45 000 € — ancienneté < 6 mois
▪ Bourses à recevoir (443110) : 8 700 € — ancienneté < 3 mois

TOTAL CRÉANCES : 69 400 €

ACTIONS DE RECOUVREMENT :
▪ 15 relances amiables émises au cours de l'exercice
▪ 4 titres transmis à l'huissier
▪ 2 demandes d'admission en non-valeur présentées à la collectivité (montant : 1 800 €)

Le compte 416 (3 200 €) devra faire l'objet d'un examen en commission pour éventuelle admission en non-valeur au titre de l'exercice suivant.`,
    editable: true,
  },
  {
    num: 7, titre: "Subventions et financements (441/443110)", sousTitre: "Subventions reçues, rattachement, reliquats", status: "ready",
    contenu: `Les subventions reçues et à recevoir au cours de l'exercice :

SUBVENTIONS DE LA COLLECTIVITÉ (441) :
▪ Dotation globale de fonctionnement : 380 000 € (notifiée et perçue)
▪ Subvention équipement (lot 2) : 45 000 € (notifiée mais non perçue au 31/12)
▪ Subvention travaux SSI : 30 000 € (perçue)

SUBVENTIONS DE L'ÉTAT :
▪ Bourses nationales (443110) : 125 000 € (perçu : 116 300 € — reste : 8 700 €)
▪ Fonds sociaux : 18 000 € (intégralement consommés)

AUTRES FINANCEMENTS :
▪ Taxe d'apprentissage : 12 500 €
▪ Subventions projets pédagogiques (FSE, Erasmus+) : 8 200 €

Les reliquats de subventions s'élèvent à 12 300 €. Ils feront l'objet d'un reversement ou d'une demande de report selon les conventions.`,
    editable: true,
  },
  {
    num: 8, titre: "Service de restauration et d'hébergement (SRH)", sousTitre: "Crédit nourriture, coût denrées, prévisions", status: "ready",
    contenu: `Le SRH constitue un service spécial à budget propre :

▪ Nombre de rationnaires/jour : 750 (dont 180 internes, 520 DP, 50 commensaux)
▪ Nombre de repas servis dans l'exercice : 112 500
▪ Coût denrée/repas : 2,15 € — Coût complet/repas : 4,10 €

EXÉCUTION SRH :
▪ Recettes : 485 000 € (contributions familles 82%, subventions 12%, commensaux 6%)
▪ Dépenses : 462 000 € (denrées 52%, personnel 32%, fonctionnement 16%)
▪ Résultat SRH : +23 000 €

CRÉDIT NOURRITURE (analyse au dernier trimestre) :
▪ Budget restant : 62 000 € — Repas restants à servir : 28 500
▪ Coût denrée prévisionnel par repas : 2,17 €
▪ VERDICT : le crédit nourriture est suffisant pour couvrir les services du trimestre.

Poids du SRH dans les charges : 62,3% — conforme à la moyenne académique.`,
    editable: true,
  },
  {
    num: 9, titre: "Investissements et immobilisations", sousTitre: "Programme d'investissement, amortissements, sorties d'inventaire", status: "draft",
    contenu: `Les immobilisations de l'établissement :

▪ Valeur brute des immobilisations : 1 250 000 €
▪ Amortissements cumulés : 520 000 €
▪ Valeur nette comptable : 730 000 €

INVESTISSEMENTS DE L'EXERCICE :
▪ Renouvellement parc informatique (salle B204) : 28 000 €
▪ Équipement cuisine (four mixte) : 15 000 €
▪ Mise aux normes SSI (détection incendie) : 42 000 €
▪ Total investissements : 85 000 €

SORTIES D'INVENTAIRE :
▪ Matériel informatique réformé : VNC 2 500 €
▪ Mobilier hors d'usage : VNC 800 €

AMORTISSEMENTS DE L'EXERCICE : 65 000 €`,
    editable: true,
  },
  {
    num: 10, titre: "Contrats et marchés", sousTitre: "État des marchés en cours, renouvellements, alertes seuils", status: "draft",
    contenu: `L'établissement a les marchés et contrats suivants :

MARCHÉS EN COURS :
▪ Denrées alimentaires (groupement d'achat académique) : 242 000 €/an — échéance 31/08/2025
▪ Maintenance chaufferie : 12 000 €/an — échéance 31/12/2024
▪ Nettoyage des locaux : 85 000 €/an — procédure adaptée — échéance 31/07/2025
▪ Fournitures de bureau : 8 500 €/an — achat simple

RENOUVELLEMENTS À PRÉVOIR :
▪ Maintenance chaufferie : relancer la consultation au T3 2024
▪ Transport voyages scolaires : vérifier le cumul annuel (voir module Voyages)

Le module Voyages scolaires assure le suivi des seuils de marchés publics par nature de prestation (transport, hébergement, etc.).`,
    editable: true,
  },
  {
    num: 11, titre: "Perspectives et orientations N+1", sousTitre: "Prévisions, projets, points de vigilance", status: "draft",
    contenu: `Les perspectives pour l'exercice suivant :

PRÉVISIONS :
▪ Effectifs attendus : stabilité (~950 élèves)
▪ Hypothèse de DGF : reconduction à périmètre constant
▪ Inflation denrées alimentaires : provision de +5% sur le crédit nourriture

PROJETS :
▪ Réfection du préau (demande de subvention en cours : 60 000 €)
▪ Remplacement du serveur informatique
▪ Étude pour panneaux photovoltaïques (convention avec la Région)

POINTS DE VIGILANCE :
▪ Créances anciennes du compte 416 à traiter (3 200 €)
▪ Échéance du marché de nettoyage (juillet 2025) : anticiper la procédure
▪ Suivi du FDR mobilisable (objectif : maintenir > 30 jours de fonctionnement)`,
    editable: true,
  },
];

const statusConfig = {
  ready: { label: "Prêt", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  warning: { label: "À vérifier", class: "bg-warning/10 text-warning border-0", icon: AlertTriangle },
  draft: { label: "Brouillon", class: "bg-muted text-muted-foreground border-0", icon: Clock },
};

const impactConfig = {
  positif: { label: "Impact positif", class: "bg-success/10 text-success border-0" },
  negatif: { label: "Impact négatif", class: "bg-destructive/10 text-destructive border-0" },
  neutre: { label: "Neutre", class: "bg-muted text-muted-foreground border-0" },
};

export function AccountingAnnexPanel() {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [faitsMarquants, setFaitsMarquants] = useState<FaitMarquant[]>(initialFaitsMarquants);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSection, setPreviewSection] = useState<Section | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [newFait, setNewFait] = useState({ titre: "", description: "", impact: "neutre" as FaitMarquant["impact"], categorie: categoriesFaits[0] });
  const [faitFormOpen, setFaitFormOpen] = useState(false);

  const handleSaveSection = (num: number, newContenu: string) => {
    setSections(sections.map(s => s.num === num ? { ...s, contenu: newContenu } : s));
    setEditingSection(null);
    toast({ title: "Section sauvegardée" });
  };

  const handleAddFait = () => {
    setFaitsMarquants([...faitsMarquants, { id: Date.now().toString(), ...newFait }]);
    setNewFait({ titre: "", description: "", impact: "neutre", categorie: categoriesFaits[0] });
    setFaitFormOpen(false);
    toast({ title: "Fait marquant ajouté" });
  };

  const handlePreviewAll = () => {
    setPreviewSection(null);
    setPreviewOpen(true);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pw - 2 * margin;

    doc.setFontSize(24); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 60, 120);
    doc.text("ANNEXE DU COMPTABLE", pw / 2, 60, { align: "center" });
    doc.setFontSize(16);
    doc.text("AU COMPTE FINANCIER", pw / 2, 75, { align: "center" });
    doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    doc.text("Exercice N-1 (2023)", pw / 2, 90, { align: "center" });
    doc.setDrawColor(30, 60, 120); doc.setLineWidth(0.8);
    doc.line(margin, 100, pw - margin, 100);
    doc.setFontSize(10);
    doc.text("Instruction codificatrice M9.6 — Tome 3 — Compte financier", pw / 2, 115, { align: "center" });
    doc.text("Établissement Public Local d'Enseignement", pw / 2, 125, { align: "center" });
    doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")}`, pw / 2, 140, { align: "center" });

    doc.addPage();
    let y = 30;
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 60, 120);
    doc.text("SOMMAIRE", margin, y); y += 15;
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
    sections.forEach(s => {
      doc.text(`${s.num}. ${s.titre}`, margin + 5, y);
      doc.setTextColor(120, 120, 120);
      doc.text(`[${statusConfig[s.status].label}]`, pw - margin, y, { align: "right" });
      doc.setTextColor(40, 40, 40);
      y += 7;
    });

    sections.forEach((section) => {
      doc.addPage(); y = 30;
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 60, 120);
      doc.text(`${section.num}. ${section.titre}`, margin, y); y += 6;
      doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(120, 120, 120);
      doc.text(section.sousTitre, margin, y); y += 10;

      if (section.num === 2) {
        doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40); doc.setFontSize(10);
        doc.text("Les événements suivants ont impacté l'exécution budgétaire de l'exercice :", margin, y); y += 10;
        faitsMarquants.forEach((fait, idx) => {
          if (y > ph - 40) { doc.addPage(); y = 30; }
          doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.text(`${idx + 1}. ${fait.titre} [${impactConfig[fait.impact].label}]`, margin + 3, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(fait.description, contentWidth - 10);
          doc.text(lines, margin + 6, y); y += lines.length * 4.5 + 6;
          doc.setTextColor(40, 40, 40);
        });
      } else {
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
        section.contenu.split("\n").forEach(para => {
          if (y > ph - 30) { doc.addPage(); y = 30; }
          const trimmed = para.trim();
          if (!trimmed) { y += 3; return; }
          if (trimmed.startsWith("▪")) {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(trimmed, contentWidth - 10);
            doc.text(lines, margin + 5, y); y += lines.length * 4.5 + 2;
          } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith("[")) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.text(trimmed, margin, y); y += 6; doc.setFont("helvetica", "normal");
          } else {
            const lines = doc.splitTextToSize(trimmed, contentWidth);
            doc.text(lines, margin, y); y += lines.length * 4.5 + 2;
          }
        });
      }
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
      doc.text(`Annexe du comptable — Compte financier 2023 — Page ${i}/${totalPages}`, pw / 2, ph - 10, { align: "center" });
      if (i > 1) { doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(margin, ph - 15, pw - margin, ph - 15); }
    }

    doc.save("annexe-comptable-2023.pdf");
    toast({ title: "PDF exporté", description: "L'annexe du comptable a été téléchargée." });
  };

  const handlePrint = () => {
    handleExportPdf();
  };

  const readySections = sections.filter(s => s.status === "ready").length;
  const warningSections = sections.filter(s => s.status === "warning").length;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Document du comptable au compte financier — Instruction M9.6 — Exercice 2023
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviewAll}>
            <Eye className="h-4 w-4 mr-1" /> Aperçu complet
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimer
          </Button>
          <Button size="sm" className="gradient-primary border-0" onClick={handleExportPdf}>
            <Download className="h-4 w-4 mr-1" /> Exporter PDF
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-foreground">{sections.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Sections</p>
        </Card>
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-success">{readySections}</p>
          <p className="text-xs text-muted-foreground mt-1">Prêtes</p>
        </Card>
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-warning">{warningSections}</p>
          <p className="text-xs text-muted-foreground mt-1">À vérifier</p>
        </Card>
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-muted-foreground">{faitsMarquants.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Faits marquants</p>
        </Card>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
          <TabsTrigger value="faits">Faits marquants ({faitsMarquants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-2 mt-4">
          {sections.map((section) => {
            const StatusIcon = statusConfig[section.status].icon;
            const isExpanded = expandedSection === section.num;
            const isEditing = editingSection === section.num;

            return (
              <motion.div key={section.num} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: section.num * 0.03 }}>
                <Card className="shadow-card">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedSection(isExpanded ? null : section.num)}>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{section.num}</div>
                      <div>
                        <p className="text-sm font-medium">{section.titre}</p>
                        <p className="text-[11px] text-muted-foreground">{section.sousTitre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`text-[10px] ${statusConfig[section.status].class}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />{statusConfig[section.status].label}
                      </Badge>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <Separator className="mb-4" />
                      {isEditing ? (
                        <div className="space-y-3">
                          <Textarea defaultValue={section.contenu} rows={12} id={`section-${section.num}`} className="font-mono text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => {
                              const el = document.getElementById(`section-${section.num}`) as HTMLTextAreaElement;
                              handleSaveSection(section.num, el.value);
                            }} className="gradient-primary border-0"><Save className="h-4 w-4 mr-1" /> Sauvegarder</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}><X className="h-4 w-4 mr-1" /> Annuler</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <pre className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">{section.contenu}</pre>
                          {section.editable && (
                            <Button size="sm" variant="outline" className="mt-3" onClick={(e) => { e.stopPropagation(); setEditingSection(section.num); }}>
                              <Edit3 className="h-4 w-4 mr-1" /> Modifier
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="faits" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Événements ayant impacté l'exécution budgétaire de l'exercice</p>
            <Button size="sm" className="gradient-primary border-0" onClick={() => setFaitFormOpen(!faitFormOpen)}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>

          {faitFormOpen && (
            <Card className="shadow-card p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Titre</Label><Input value={newFait.titre} onChange={(e) => setNewFait({ ...newFait, titre: e.target.value })} placeholder="Ex: Hausse des effectifs" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Impact</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newFait.impact} onChange={(e) => setNewFait({ ...newFait, impact: e.target.value as FaitMarquant["impact"] })}>
                      <option value="positif">Positif</option><option value="negatif">Négatif</option><option value="neutre">Neutre</option>
                    </select>
                  </div>
                  <div><Label>Catégorie</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newFait.categorie} onChange={(e) => setNewFait({ ...newFait, categorie: e.target.value })}>
                      {categoriesFaits.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2"><Label>Description et impact budgétaire</Label><Textarea value={newFait.description} onChange={(e) => setNewFait({ ...newFait, description: e.target.value })} rows={3} placeholder="Décrivez l'événement et son impact sur l'exécution budgétaire..." /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddFait} className="gradient-primary border-0">Ajouter</Button>
                <Button size="sm" variant="outline" onClick={() => setFaitFormOpen(false)}>Annuler</Button>
              </div>
            </Card>
          )}

          {faitsMarquants.map((fait, idx) => (
            <motion.div key={fait.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{fait.titre}</span>
                        <Badge variant="secondary" className={`text-[10px] ${impactConfig[fait.impact].class}`}>{impactConfig[fait.impact].label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{fait.categorie}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{fait.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setFaitsMarquants(faitsMarquants.filter(f => f.id !== fait.id))} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog aperçu */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewSection ? `${previewSection.num}. ${previewSection.titre}` : "Annexe du comptable — Aperçu complet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {(previewSection ? [previewSection] : sections).map((section) => (
              <div key={section.num}>
                <h3 className="text-sm font-bold text-primary mb-1">{section.num}. {section.titre}</h3>
                <p className="text-[11px] text-muted-foreground italic mb-2">{section.sousTitre}</p>
                {section.num === 2 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Les événements suivants ont impacté l'exécution budgétaire :</p>
                    {faitsMarquants.map((fait, idx) => (
                      <div key={fait.id} className="pl-3 border-l-2 border-primary/30">
                        <p className="text-sm font-medium">{idx + 1}. {fait.titre} <Badge variant="secondary" className={`text-[9px] ml-1 ${impactConfig[fait.impact].class}`}>{impactConfig[fait.impact].label}</Badge></p>
                        <p className="text-sm text-muted-foreground">{fait.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">{section.contenu}</pre>
                )}
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
