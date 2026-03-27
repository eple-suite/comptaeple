/**
 * Onglet Documents PDF — Génération de courriers réglementaires
 * Conformité : M9-6, Décret n°2019-798 du 26/07/2019 (régies de recettes),
 * Décret n°2020-922 du 29/07/2020, Circulaire du 16/07/2024 (voyages scolaires)
 * 
 * Documents produits :
 * ── ORDONNATEUR / SG ──
 * 1. Engagement financier des familles (talon-réponse)
 * 2. Budget prévisionnel CA
 * 3. Procuration mandataire (enseignant collecteur)
 * 
 * ── RÉGISSEUR / AGENT COMPTABLE ──
 * 4. Bordereau de remise du mandataire au régisseur
 * 5. Bordereau de versement du régisseur à l'AC
 * 6. État nominatif des participants
 * 7. Bilan financier avec écritures comptables M9-6
 */
import { useState } from "react";
import { FileText, Download, Users, Euro, ClipboardCheck, BarChart3, BookOpen, Stamp, Banknote, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Voyage, CATEGORIES_PRESTATIONS, MODES_PAIEMENT } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { toast } from "sonner";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { validerEquilibreBudgetaire } from "@/lib/voyageBudgetEngine";

interface Props {
  voyage: Voyage;
}

// ═══════════════════════════════════════════════════════════════
// Catalogue de documents par catégorie
// ═══════════════════════════════════════════════════════════════
const DOC_CATEGORIES = [
  {
    id: "ordonnateur",
    label: "Ordonnateur / Secrétaire général",
    description: "Documents signés par le chef d'établissement et le secrétaire général",
    docs: [
      { id: "engagement", label: "Engagement financier des familles", icon: ClipboardCheck, description: "Courrier avec échéancier, modalités de paiement, conditions d'annulation et talon-réponse" },
      { id: "budget_previsionnel", label: "Budget prévisionnel pour le CA", icon: Euro, description: "Ventilation dépenses/recettes pour présentation et vote au conseil d'administration" },
      { id: "procuration_mandataire", label: "Procuration mandataire (enseignant)", icon: Stamp, description: "Mandat de collecte confié à l'enseignant référent — Décret n°2019-798 art. 4 et Décret n°2020-922" },
    ],
  },
  {
    id: "regisseur",
    label: "Régisseur / Agent comptable",
    description: "Documents pour le régisseur de recettes et l'agent comptable",
    docs: [
      { id: "bordereau_mandataire", label: "Bordereau de remise mandataire → régisseur", icon: Receipt, description: "État des sommes collectées par l'enseignant à remettre au régisseur — Décret n°2019-798 art. 10" },
      { id: "bordereau_regisseur", label: "Bordereau de versement régisseur → AC", icon: Banknote, description: "État récapitulatif des encaissements du régisseur versés à l'agent comptable — Décret n°2019-798 art. 11" },
      { id: "etat_eleves", label: "État nominatif des participants", icon: Users, description: "Liste complète avec situation de paiement et documents reçus" },
    ],
  },
  {
    id: "bilan",
    label: "Bilan financier & écritures comptables",
    description: "Bilan du voyage avec écritures M9-6 à passer",
    docs: [
      { id: "bilan_financier", label: "Bilan financier complet", icon: BarChart3, description: "Recettes/dépenses, recouvrement, titres de recette (OR), titres de réduction, écritures M9-6" },
      { id: "ecritures_comptables", label: "Journal des écritures comptables", icon: BookOpen, description: "Titres de recette, mandats, régularisations, réductions de recette — Plan comptable M9-6" },
    ],
  },
];

export const VoyageCourriersPdfTab = ({ voyage }: Props) => {
  const [nomChefEts, setNomChefEts] = useState("");
  const [nomGestionnaire, setNomGestionnaire] = useState("");
  const [nomAgentComptable, setNomAgentComptable] = useState("");
  const [nomRegisseur, setNomRegisseur] = useState("");
  const [nomMandataire, setNomMandataire] = useState("");
  const [fonctionMandataire, setFonctionMandataire] = useState("Professeur référent");
  const [texteEngagement, setTexteEngagement] = useState(
    `Je soussigné(e), responsable légal de l'élève, m'engage à participer aux frais occasionnés par le voyage scolaire à ${voyage.destination}, selon l'échéancier ci-dessous.\n\nDès signature du présent document, même en cas de non-participation de l'élève au voyage qui ne serait pas le fait d'une décision de l'établissement, je suis redevable de la totalité de la somme indiquée.`
  );
  const [texteMoyensPaiement, setTexteMoyensPaiement] = useState(
    `Moyens de paiement acceptés : chèque à l'ordre de l'agent comptable, virement bancaire, espèces (dans la limite réglementaire de 300 €), paiement en ligne.\n\nToute difficulté financière peut être signalée à l'assistant(e) social(e) de l'établissement en vue d'une éventuelle aide du fonds social.`
  );

  const v = voyage;
  const participationParEleve = v.nbEleves > 0 ? v.participationFamilles / v.nbEleves : 0;
  const totalDu = v.eleves.reduce((s, e) => s + e.participationDue, 0);
  const totalPaye = v.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
  const totalReste = totalDu - totalPaye;

  // ═══════════════════════════════════════════════════════════════
  // 1. ENGAGEMENT FINANCIER DES FAMILLES
  // ═══════════════════════════════════════════════════════════════
  const generateEngagementPDF = () => {
    const doc = createStyledPDF({ title: "Engagement financier", subtitle: `Voyage ${v.intitule || v.destination} — ${v.classe}` });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Informations du voyage", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Destination : ${v.destination}, ${v.pays}`, 14, y); y += 4;
    doc.text(`Dates : ${v.dateDepart} — ${v.dateRetour}`, 14, y); y += 4;
    doc.text(`Classe : ${v.classe} — Professeur référent : ${v.professeur}`, 14, y); y += 4;
    if (v.objectifPedagogique) { doc.text(`Objectif : ${v.objectifPedagogique}`, 14, y); y += 4; }
    y += 4;
    const coutParEleve = v.nbEleves > 0 ? v.budgetTotal / v.nbEleves : 0;
    doc.setFont("helvetica", "bold");
    doc.text("Participation financière", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Coût total du voyage : ${formatCurrency(v.budgetTotal)} — soit ${formatCurrency(coutParEleve)} par participant`, 14, y); y += 4;
    doc.text(`Participation demandée aux familles : ${formatCurrency(participationParEleve)} par élève`, 14, y); y += 8;
    if (v.echeances.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Versement", "Échéance", "Montant"]],
        body: v.echeances.map((e, i) => [`Versement n°${i + 1}`, e.date || "—", formatCurrency(participationParEleve * e.pourcentage / 100)]),
        headStyles: { fillColor: [37, 68, 120], textColor: 255 },
        margin: { left: 14, right: 14 }, styles: { fontSize: 8 },
        columnStyles: { 2: { halign: "right" } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    const engLines = doc.splitTextToSize(texteEngagement, 175);
    doc.text(engLines, 14, y); y += engLines.length * 3.8 + 6;
    const payLines = doc.splitTextToSize(texteMoyensPaiement, 175);
    doc.text(payLines, 14, y); y += payLines.length * 3.8 + 10;
    doc.setDrawColor(150); doc.setLineDashPattern([2, 2], 0);
    doc.line(14, y, 196, y); y += 6;
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "bold");
    doc.text("TALON-RÉPONSE à retourner avant le " + (v.dateLimiteInscription || "___/___/____"), 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Nom de l'élève : _________________________________ Classe : __________", 14, y); y += 6;
    doc.text("Nom du responsable : ___________________________________", 14, y); y += 6;
    doc.text("□ J'autorise mon enfant à participer et m'engage à régler la somme de ____________ €", 14, y); y += 5;
    doc.text("□ Je ne souhaite pas que mon enfant participe au voyage", 14, y); y += 8;
    doc.text("Date : ___/___/____                Signature du responsable légal :", 14, y);
    savePDF(doc, `Engagement_${v.destination}_${v.classe}.pdf`);
    toast.success("Engagement financier généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. BUDGET PRÉVISIONNEL
  // ═══════════════════════════════════════════════════════════════
  const generateBudgetPrevisionnelPDF = () => {
    const doc = createStyledPDF({ title: "Budget prévisionnel — Voyage scolaire", subtitle: `${v.intitule || v.destination} — ${v.classe}` });
    const validation = validerEquilibreBudgetaire({
      nbEleves: v.nbEleves, participationFamilles: v.participationFamilles,
      subventionCollectivite: v.subventionCollectivite, subventionEtat: v.subventionEtat,
      subventionAutre: v.subventionAutre, autofinancement: v.autofinancement,
      transport: v.transport, hebergement: v.hebergement, restauration: v.restauration,
      activites: v.activites, assurance: v.assurance, divers: v.divers,
    });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(`Destination : ${v.destination}, ${v.pays}`, 14, y); y += 4;
    doc.text(`Dates : ${v.dateDepart} → ${v.dateRetour}`, 14, y); y += 4;
    doc.text(`Participants : ${v.nbEleves} élèves + ${v.nbAccompagnateurs} accompagnateurs`, 14, y); y += 6;
    autoTable(doc, {
      startY: y,
      head: [["DÉPENSES", "Montant", "", "RECETTES", "Montant"]],
      body: [
        ["Transport", formatCurrency(v.transport), "", "Participation familles", formatCurrency(v.participationFamilles)],
        ["Hébergement", formatCurrency(v.hebergement), "", "Subvention collectivité", formatCurrency(v.subventionCollectivite)],
        ["Restauration", formatCurrency(v.restauration), "", "Subvention État", formatCurrency(v.subventionEtat)],
        ["Activités", formatCurrency(v.activites), "", "Subvention autre", formatCurrency(v.subventionAutre)],
        ["Assurance", formatCurrency(v.assurance), "", "Autofinancement", formatCurrency(v.autofinancement)],
        ["Divers", formatCurrency(v.divers), "", "", ""],
      ],
      foot: [["TOTAL", formatCurrency(validation.totalDepenses), "", "TOTAL", formatCurrency(validation.totalRecettes)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 10, right: 10 }, styles: { fontSize: 8 },
      columnStyles: { 1: { halign: "right" }, 2: { cellWidth: 5 }, 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Solde : ${formatCurrency(validation.solde)}`, 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    if (validation.participationSuggestion) {
      doc.text(`Participation suggérée par élève : ${formatCurrency(validation.participationSuggestion)}`, 14, y); y += 4;
    }
    y += 10;
    doc.setFontSize(9);
    doc.text("L'ordonnateur", 14, y); doc.text("Le secrétaire général", 110, y); y += 5;
    doc.text(nomChefEts || "(Nom et prénom)", 14, y); doc.text(nomGestionnaire || "(Nom et prénom)", 110, y);
    savePDF(doc, `Budget_previsionnel_${v.destination}.pdf`);
    toast.success("Budget prévisionnel généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. PROCURATION MANDATAIRE (enseignant collecteur)
  // Décret n°2019-798 art. 4, Décret n°2020-922
  // ═══════════════════════════════════════════════════════════════
  const generateProcurationMandatairePDF = () => {
    const doc = createStyledPDF({ title: "Procuration de mandataire", subtitle: "Décret n°2019-798 du 26/07/2019 — art. 4" });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("MANDAT DE COLLECTE — VOYAGE SCOLAIRE", 14, y); y += 8;
    doc.setFont("helvetica", "normal");

    const text1 = `Le chef d'établissement, ordonnateur de l'EPLE, agissant en application du décret n°2019-798 du 26 juillet 2019 relatif aux régies de recettes et aux régies d'avances des organismes publics, modifié par le décret n°2020-922 du 29 juillet 2020,\n\nDonne mandat à :`;
    const lines1 = doc.splitTextToSize(text1, 175);
    doc.text(lines1, 14, y); y += lines1.length * 3.8 + 6;

    doc.setFont("helvetica", "bold");
    doc.text(`Nom : ${nomMandataire || "________________________________"}`, 20, y); y += 5;
    doc.text(`Fonction : ${fonctionMandataire || "________________________________"}`, 20, y); y += 8;
    doc.setFont("helvetica", "normal");

    doc.text("Pour procéder à la collecte des participations financières des familles relatives au voyage :", 14, y); y += 6;
    doc.text(`• Destination : ${v.destination}, ${v.pays}`, 20, y); y += 4;
    doc.text(`• Dates : ${v.dateDepart} — ${v.dateRetour}`, 20, y); y += 4;
    doc.text(`• Classe : ${v.classe}`, 20, y); y += 4;
    doc.text(`• Montant de la participation par élève : ${formatCurrency(participationParEleve)}`, 20, y); y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Obligations du mandataire :", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    const obligations = [
      "Collecter uniquement les sommes correspondant à la participation arrêtée par le CA.",
      "Délivrer un reçu à chaque famille pour tout versement en espèces (plafond : 300 € — art. L.112-6 CMF).",
      "Ne pas conserver les fonds collectés au-delà de 5 jours ouvrés (Décret n°2019-798, art. 10).",
      "Remettre l'intégralité des sommes collectées au régisseur de recettes contre bordereau de remise.",
      "Transmettre au régisseur les pièces justificatives : liste des versements, reçus, chèques.",
      "Ne procéder à aucune compensation, déduction ni rétention sur les sommes collectées.",
      "Ne pas encaisser les chèques — les remettre endossés au régisseur.",
    ];
    obligations.forEach((o, i) => {
      doc.text(`${i + 1}. ${o}`, 14, y, { maxWidth: 175 });
      y += doc.splitTextToSize(`${i + 1}. ${o}`, 175).length * 3.8 + 1;
    });
    y += 4;

    const text2 = `Le mandataire est personnellement et pécuniairement responsable des fonds qu'il détient à compter de leur encaissement jusqu'à leur remise au régisseur (art. 18 du décret n°2012-1246 — RGCP).\n\nLe présent mandat est valable pour la durée de la collecte relative au voyage susvisé.`;
    const lines2 = doc.splitTextToSize(text2, 175);
    doc.text(lines2, 14, y); y += lines2.length * 3.8 + 10;

    // Signatures
    doc.setFontSize(9);
    doc.text("L'ordonnateur", 14, y); doc.text("Le mandataire (lu et approuvé)", 110, y); y += 5;
    doc.text(nomChefEts || "(Nom et prénom)", 14, y); doc.text(nomMandataire || "(Nom et prénom)", 110, y); y += 10;
    doc.text(`Fait le : ${new Date().toLocaleDateString("fr-FR")}`, 14, y);

    savePDF(doc, `Procuration_mandataire_${v.destination}.pdf`);
    toast.success("Procuration mandataire générée");
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. BORDEREAU DE REMISE — Mandataire → Régisseur
  // Décret n°2019-798 art. 10
  // ═══════════════════════════════════════════════════════════════
  const generateBordereauMandatairePDF = () => {
    const doc = createStyledPDF({ title: "Bordereau de remise — Mandataire au Régisseur", subtitle: `Décret n°2019-798 art. 10 — ${v.intitule || v.destination}` });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(`Voyage : ${v.intitule || v.destination} — ${v.classe}`, 14, y); y += 4;
    doc.text(`Mandataire : ${nomMandataire || "(Nom du mandataire)"}`, 14, y); y += 4;
    doc.text(`Régisseur : ${nomRegisseur || "(Nom du régisseur)"}`, 14, y); y += 6;

    // Détail par mode
    const byMode: Record<string, { count: number; total: number }> = {};
    const allPaiements = v.eleves.flatMap(e => e.paiements.map(p => ({ eleve: `${e.nom} ${e.prenom}`, ...p })));
    allPaiements.forEach(p => {
      if (!byMode[p.mode]) byMode[p.mode] = { count: 0, total: 0 };
      byMode[p.mode].count++;
      byMode[p.mode].total += p.montant;
    });

    autoTable(doc, {
      startY: y,
      head: [["N°", "Élève", "Date", "Mode", "Montant", "Référence"]],
      body: allPaiements.map((p, i) => [String(i + 1), p.eleve, p.date, MODES_PAIEMENT[p.mode as keyof typeof MODES_PAIEMENT] || p.mode, formatCurrency(p.montant), p.reference]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      foot: [["", "", "", "TOTAL", formatCurrency(allPaiements.reduce((s, p) => s + p.montant, 0)), ""]],
      footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Récapitulatif par mode
    doc.setFont("helvetica", "bold"); doc.text("Récapitulatif par mode de paiement :", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    Object.entries(byMode).forEach(([mode, data]) => {
      doc.text(`• ${MODES_PAIEMENT[mode as keyof typeof MODES_PAIEMENT] || mode} : ${data.count} pièce(s) — ${formatCurrency(data.total)}`, 20, y);
      y += 4;
    });
    y += 6;
    doc.text(`Nombre total de pièces : ${allPaiements.length}`, 14, y); y += 4;
    doc.text(`Montant total remis : ${formatCurrency(allPaiements.reduce((s, p) => s + p.montant, 0))}`, 14, y); y += 10;

    // Signatures
    doc.text("Le mandataire (remettant)", 14, y); doc.text("Le régisseur (réceptionnaire)", 110, y); y += 5;
    doc.text(nomMandataire || "(Nom et signature)", 14, y); doc.text(nomRegisseur || "(Nom et signature)", 110, y); y += 8;
    doc.text(`Date de remise : ${new Date().toLocaleDateString("fr-FR")}`, 14, y);

    savePDF(doc, `Bordereau_mandataire_${v.destination}.pdf`);
    toast.success("Bordereau mandataire → régisseur généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 5. BORDEREAU DE VERSEMENT — Régisseur → Agent comptable
  // Décret n°2019-798 art. 11
  // ═══════════════════════════════════════════════════════════════
  const generateBordereauRegisseurPDF = () => {
    const doc = createStyledPDF({ title: "Bordereau de versement — Régisseur à l'Agent comptable", subtitle: `Décret n°2019-798 art. 11 — ${v.intitule || v.destination}` });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(`Voyage : ${v.intitule || v.destination} — ${v.classe}`, 14, y); y += 4;
    doc.text(`Régisseur : ${nomRegisseur || "(Nom du régisseur)"}`, 14, y); y += 4;
    doc.text(`Agent comptable : ${nomAgentComptable || "(Nom de l'agent comptable)"}`, 14, y); y += 6;

    // Synthèse par mode
    const byMode: Record<string, number> = {};
    v.eleves.forEach(e => e.paiements.forEach(p => { byMode[p.mode] = (byMode[p.mode] || 0) + p.montant; }));
    autoTable(doc, {
      startY: y,
      head: [["Mode de paiement", "Nombre de pièces", "Montant"]],
      body: Object.entries(byMode).map(([mode, montant]) => {
        const count = v.eleves.reduce((s, e) => s + e.paiements.filter(p => p.mode === mode).length, 0);
        return [MODES_PAIEMENT[mode as keyof typeof MODES_PAIEMENT] || mode, String(count), formatCurrency(montant)];
      }),
      foot: [["TOTAL", String(v.eleves.reduce((s, e) => s + e.paiements.length, 0)), formatCurrency(totalPaye)]],
      headStyles: { fillColor: [37, 120, 68], textColor: 255 },
      footStyles: { fillColor: [240, 248, 244], fontStyle: "bold" },
      margin: { left: 14, right: 14 }, styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Observations :", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Montant total versé à l'agent comptable : ${formatCurrency(totalPaye)}`, 14, y); y += 4;
    doc.text(`Reste à recouvrer : ${formatCurrency(totalReste)}`, 14, y); y += 4;
    const nbNonEncaisses = v.eleves.reduce((s, e) => s + e.paiements.filter(p => !p.encaisse).length, 0);
    if (nbNonEncaisses > 0) {
      doc.text(`${nbNonEncaisses} pièce(s) non encore encaissée(s) au moment de ce versement.`, 14, y); y += 4;
    }
    y += 6;
    doc.text(`Le régisseur certifie l'exactitude du présent bordereau et déclare avoir versé la totalité`, 14, y); y += 3.5;
    doc.text(`des fonds collectés, conformément au décret n°2019-798 du 26/07/2019.`, 14, y); y += 10;

    doc.text("Le régisseur", 14, y); doc.text("L'agent comptable", 110, y); y += 5;
    doc.text(nomRegisseur || "(Nom et signature)", 14, y); doc.text(nomAgentComptable || "(Nom et signature)", 110, y); y += 8;
    doc.text(`Date de versement : ${new Date().toLocaleDateString("fr-FR")}`, 14, y);

    savePDF(doc, `Bordereau_regisseur_AC_${v.destination}.pdf`);
    toast.success("Bordereau régisseur → AC généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 6. ÉTAT NOMINATIF DES PARTICIPANTS
  // ═══════════════════════════════════════════════════════════════
  const generateEtatElevesPDF = () => {
    const doc = createStyledPDF({ title: "État nominatif des participants", subtitle: `${v.intitule || v.destination} — ${v.classe}` });
    autoTable(doc, {
      startY: 52,
      head: [["N°", "Nom", "Prénom", "Classe", "Dû", "Payé", "Reste", "Aut.", "F.San.", "Ass.", "Passp."]],
      body: v.eleves.map((e, i) => {
        const paye = e.paiements.reduce((s, p) => s + p.montant, 0);
        return [String(i + 1), e.nom, e.prenom, e.classe, formatCurrency(e.participationDue), formatCurrency(paye), formatCurrency(e.participationDue - paye), e.autorisationParentale ? "✓" : "✗", e.ficheSanitaire ? "✓" : "✗", e.assuranceRC ? "✓" : "✗", e.passeport ? "✓" : "✗"];
      }),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "center" }, 8: { halign: "center" }, 9: { halign: "center" }, 10: { halign: "center" } },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.text(`${v.eleves.length} participants — Total dû : ${formatCurrency(totalDu)} — Encaissé : ${formatCurrency(totalPaye)} — Reste : ${formatCurrency(totalReste)}`, 14, y);
    savePDF(doc, `Etat_participants_${v.destination}.pdf`);
    toast.success("État nominatif généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 7. BILAN FINANCIER COMPLET avec écritures M9-6
  // ═══════════════════════════════════════════════════════════════
  const generateBilanFinancierPDF = () => {
    const doc = createStyledPDF({ title: "Bilan financier du voyage scolaire", subtitle: `${v.intitule || v.destination} — ${v.classe} — Exercice ${new Date().getFullYear()}` });
    const budgetData = {
      nbEleves: v.nbEleves, nbAccompagnateurs: v.nbAccompagnateurs,
      participationFamilles: v.participationFamilles, subventionCollectivite: v.subventionCollectivite,
      subventionEtat: v.subventionEtat, subventionAutre: v.subventionAutre, autofinancement: v.autofinancement,
      transport: v.transport, hebergement: v.hebergement, restauration: v.restauration,
      activites: v.activites, assurance: v.assurance, divers: v.divers,
    };
    const validation = validerEquilibreBudgetaire(budgetData);
    let y = 52;

    // ── Section 1 : Dépenses ──
    autoTable(doc, {
      startY: y, head: [["Nature de la dépense", "Prévu", "Réalisé", "Écart"]],
      body: CATEGORIES_PRESTATIONS.map(c => [c.label, formatCurrency(v[c.key]), formatCurrency(v[c.key]), formatCurrency(0)]),
      foot: [["TOTAL DÉPENSES", formatCurrency(validation.totalDepenses), formatCurrency(validation.totalDepenses), formatCurrency(0)]],
      headStyles: { fillColor: [180, 40, 40], textColor: 255 }, footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 10, right: 10 }, styles: { fontSize: 8 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // ── Section 2 : Recettes ──
    autoTable(doc, {
      startY: y, head: [["Origine de la recette", "Prévu", "Réalisé", "Écart"]],
      body: [
        ["Participation familles (c/706700)", formatCurrency(v.participationFamilles), formatCurrency(totalPaye), formatCurrency(totalPaye - v.participationFamilles)],
        ["Subvention collectivité (c/7443)", formatCurrency(v.subventionCollectivite), formatCurrency(v.subventionCollectivite), formatCurrency(0)],
        ["Subvention État (c/7411)", formatCurrency(v.subventionEtat), formatCurrency(v.subventionEtat), formatCurrency(0)],
        ["Subvention autre (c/7488)", formatCurrency(v.subventionAutre), formatCurrency(v.subventionAutre), formatCurrency(0)],
        ["Prélèvement FDR (c/10688)", formatCurrency(v.autofinancement), formatCurrency(v.autofinancement), formatCurrency(0)],
      ],
      foot: [["TOTAL RECETTES", formatCurrency(validation.totalRecettes), formatCurrency(totalPaye + v.subventionCollectivite + v.subventionEtat + v.subventionAutre + v.autofinancement), ""]],
      headStyles: { fillColor: [37, 120, 68], textColor: 255 }, footStyles: { fillColor: [240, 248, 244], fontStyle: "bold" },
      margin: { left: 10, right: 10 }, styles: { fontSize: 8 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // ── Section 3 : Solde et recouvrement ──
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Solde budgétaire : ${formatCurrency(validation.solde)} — ${validation.equilibre ? "ÉQUILIBRÉ ✓" : "DÉSÉQUILIBRÉ ✗"}`, 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Taux de recouvrement familles : ${totalDu > 0 ? ((totalPaye / totalDu) * 100).toFixed(1) : "—"}%`, 14, y); y += 4;
    doc.text(`Reste à recouvrer : ${formatCurrency(totalReste)}`, 14, y); y += 8;

    // ── Section 4 : Écritures comptables M9-6 ──
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("ÉCRITURES COMPTABLES À PASSER — Plan comptable M9-6", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);

    const ecritures: string[][] = [];

    // 1. OR initial — Titre de recette global (dès vote CA)
    ecritures.push(["OR initial", "Émission du titre de recette", "4116xx", "Familles — Créances élèves", formatCurrency(v.participationFamilles), ""]);
    ecritures.push(["", "(contrepartie produit)", "706700", "Participations aux voyages scolaires", "", formatCurrency(v.participationFamilles)]);

    // 2. Encaissements
    if (totalPaye > 0) {
      ecritures.push(["Encaisst.", "Encaissement des participations", "5159xx", "Régisseur — compte d'attente", formatCurrency(totalPaye), ""]);
      ecritures.push(["", "(solde créance)", "4116xx", "Familles — Créances élèves", "", formatCurrency(totalPaye)]);
    }

    // 3. Versement régisseur → AC
    if (totalPaye > 0) {
      ecritures.push(["Versemt.", "Versement du régisseur à l'AC", "5151xx", "Compte au Trésor", formatCurrency(totalPaye), ""]);
      ecritures.push(["", "(solde compte régisseur)", "5159xx", "Régisseur — compte d'attente", "", formatCurrency(totalPaye)]);
    }

    // 4. Subventions
    if (v.subventionCollectivite > 0) {
      ecritures.push(["Subv. CT", "Notification subvention collectivité", "4411xx", "Subventions à recevoir", formatCurrency(v.subventionCollectivite), ""]);
      ecritures.push(["", "(produit)", "7443xx", "Subventions collectivités", "", formatCurrency(v.subventionCollectivite)]);
    }
    if (v.subventionEtat > 0) {
      ecritures.push(["Subv. État", "Notification subvention État", "4411xx", "Subventions à recevoir", formatCurrency(v.subventionEtat), ""]);
      ecritures.push(["", "(produit)", "7411xx", "Subventions de l'État", "", formatCurrency(v.subventionEtat)]);
    }

    // 5. Prélèvement sur FDR
    if (v.autofinancement > 0) {
      ecritures.push(["FDR", "Prélèvement sur fonds de roulement", "10688x", "Réserves — Autres", formatCurrency(v.autofinancement), ""]);
      ecritures.push(["", "(recette interne)", "7588xx", "Produits divers gestion courante", "", formatCurrency(v.autofinancement)]);
    }

    // 6. Titre de réduction de recette (si trop-perçu ou annulations)
    const tropPercu = totalPaye - v.participationFamilles;
    if (tropPercu > 0) {
      ecritures.push(["TRR", "Titre de réduction de recette (trop-perçu)", "706700", "Participations voyages (réduction)", formatCurrency(tropPercu), ""]);
      ecritures.push(["", "(remboursement familles)", "4116xx", "Familles — Créances élèves", "", formatCurrency(tropPercu)]);
    }

    // 7. Créances irrécouvrables (le cas échéant)
    if (totalReste > 0) {
      ecritures.push(["⚠ Info", `Créances restantes : ${formatCurrency(totalReste)}`, "", "À recouvrer ou à admettre en NV", "", ""]);
      ecritures.push(["", "Si admission en non-valeur :", "654xxx", "Pertes sur créances irrécouvrables", formatCurrency(totalReste), ""]);
      ecritures.push(["", "(solde créance)", "4116xx", "Familles — Créances élèves", "", formatCurrency(totalReste)]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Phase", "Opération", "Compte", "Intitulé", "Débit", "Crédit"]],
      body: ecritures,
      headStyles: { fillColor: [60, 60, 90], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 }, styles: { fontSize: 6.5 },
      columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
      didParseCell: (data: any) => {
        if (data.row.index >= 0 && data.section === "body") {
          const phase = ecritures[data.row.index]?.[0];
          if (phase === "TRR" || phase === "⚠ Info") {
            data.cell.styles.fillColor = [255, 245, 238];
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Signatures ──
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y); y += 8;
    const colW = 60;
    doc.text("L'ordonnateur", 14, y); doc.text("Le secrétaire général", 14 + colW, y); doc.text("L'agent comptable", 14 + colW * 2, y); y += 5;
    doc.text(nomChefEts || "(Nom et prénom)", 14, y); doc.text(nomGestionnaire || "(Nom et prénom)", 14 + colW, y); doc.text(nomAgentComptable || "(Nom et prénom)", 14 + colW * 2, y);

    savePDF(doc, `Bilan_financier_${v.destination}.pdf`);
    toast.success("Bilan financier avec écritures M9-6 généré");
  };

  // ═══════════════════════════════════════════════════════════════
  // 8. JOURNAL DES ÉCRITURES COMPTABLES (document isolé)
  // ═══════════════════════════════════════════════════════════════
  const generateEcrituresComptablesPDF = () => {
    const doc = createStyledPDF({ title: "Journal des écritures comptables — Voyage", subtitle: `${v.intitule || v.destination} — Plan comptable M9-6` });
    let y = 52;
    doc.setFontSize(8); doc.setTextColor(0, 0, 0);
    doc.text("Référence réglementaire : Instruction codificatrice M9-6, Plan comptable des EPLE", 14, y); y += 4;
    doc.text(`Code activité GFC : ${v.codeActiviteGFC || "N/R"} — Service AP (activités pédagogiques)`, 14, y); y += 6;

    // Phase 1 : Avant le voyage
    doc.setFont("helvetica", "bold"); doc.text("PHASE 1 — AVANT LE VOYAGE (dès vote du CA)", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y, head: [["N°", "Opération", "Compte débit", "Compte crédit", "Montant"]],
      body: [
        ["1", `OR — Titre de recette familles (${v.nbEleves} × ${formatCurrency(participationParEleve)})`, "4116 — Créances élèves", "70667 — Participations voyages", formatCurrency(v.participationFamilles)],
        ...(v.subventionCollectivite > 0 ? [["2", "OR — Titre subvention collectivité", "4411 — Subventions à recevoir", "7443 — Subv. collectivités", formatCurrency(v.subventionCollectivite)]] : []),
        ...(v.subventionEtat > 0 ? [["3", "OR — Titre subvention État", "4411 — Subventions à recevoir", "7411 — Subv. État", formatCurrency(v.subventionEtat)]] : []),
        ...(v.autofinancement > 0 ? [["4", "DBM — Prélèvement sur réserves", "10688 — Autres réserves", "7588 — Produits divers", formatCurrency(v.autofinancement)]] : []),
      ],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Phase 2 : Pendant la collecte
    doc.setFont("helvetica", "bold"); doc.text("PHASE 2 — COLLECTE DES PARTICIPATIONS", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y, head: [["N°", "Opération", "Compte débit", "Compte crédit", "Montant"]],
      body: [
        ["5", "Encaissement par le régisseur", "5159 — Régisseur (att.)", "4116 — Créances élèves", formatCurrency(totalPaye)],
        ["6", "Versement du régisseur à l'AC", "5151 — Compte Trésor", "5159 — Régisseur (att.)", formatCurrency(totalPaye)],
      ],
      headStyles: { fillColor: [37, 120, 68], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Phase 3 : Mandatement des dépenses
    doc.setFont("helvetica", "bold"); doc.text("PHASE 3 — MANDATEMENT DES DÉPENSES", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y, head: [["N°", "Opération", "Compte débit", "Compte crédit", "Montant"]],
      body: CATEGORIES_PRESTATIONS.filter(c => v[c.key] > 0).map((c, i) => {
        const comptes: Record<string, string> = { transport: "6245", hebergement: "6256", restauration: "6257", activites: "6288", assurance: "616", divers: "618" };
        return [String(7 + i), `Mandat — ${c.label}`, `${comptes[c.key] || "62xx"} — ${c.label}`, "401 — Fournisseurs", formatCurrency(v[c.key])];
      }),
      headStyles: { fillColor: [180, 40, 40], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Phase 4 : Régularisations
    const tropPercu = totalPaye - v.participationFamilles;
    if (tropPercu > 0 || totalReste > 0) {
      doc.setFont("helvetica", "bold"); doc.text("PHASE 4 — RÉGULARISATIONS", 14, y); y += 5;
      doc.setFont("helvetica", "normal");
      const regul: string[][] = [];
      if (tropPercu > 0) {
        regul.push(["R1", "Titre de réduction de recette (trop-perçu)", "70667 — Participations voyages", "4116 — Créances (avoir)", formatCurrency(tropPercu)]);
        regul.push(["R2", "Remboursement aux familles", "4116 — Créances (avoir)", "5151 — Compte Trésor", formatCurrency(tropPercu)]);
      }
      if (totalReste > 0 && totalReste > 100) {
        regul.push(["R3", "Admission en non-valeur (si irrécouv.)", "654 — Pertes sur créances", "4116 — Créances élèves", formatCurrency(totalReste)]);
      }
      if (regul.length > 0) {
        autoTable(doc, {
          startY: y, head: [["N°", "Opération", "Compte débit", "Compte crédit", "Montant"]],
          body: regul,
          headStyles: { fillColor: [200, 120, 40], textColor: 255, fontSize: 7 },
          margin: { left: 8, right: 8 }, styles: { fontSize: 7 },
          columnStyles: { 4: { halign: "right" } },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }

    // Signature AC
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.text("L'agent comptable", 14, y); y += 5;
    doc.text(nomAgentComptable || "(Nom et prénom)", 14, y);
    savePDF(doc, `Ecritures_comptables_${v.destination}.pdf`);
    toast.success("Journal des écritures comptables généré");
  };

  const generators: Record<string, () => void> = {
    engagement: generateEngagementPDF,
    etat_eleves: generateEtatElevesPDF,
    bilan_financier: generateBilanFinancierPDF,
    budget_previsionnel: generateBudgetPrevisionnelPDF,
    procuration_mandataire: generateProcurationMandatairePDF,
    bordereau_mandataire: generateBordereauMandatairePDF,
    bordereau_regisseur: generateBordereauRegisseurPDF,
    ecritures_comptables: generateEcrituresComptablesPDF,
  };

  return (
    <div className="space-y-5">
      {/* Signataires */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signataires et acteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">Chef d'établissement (ordonnateur)</Label><Input value={nomChefEts} onChange={e => setNomChefEts(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Secrétaire général (gestionnaire)</Label><Input value={nomGestionnaire} onChange={e => setNomGestionnaire(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Agent comptable</Label><Input value={nomAgentComptable} onChange={e => setNomAgentComptable(e.target.value)} placeholder="M. / Mme ..." /></div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">Régisseur de recettes</Label><Input value={nomRegisseur} onChange={e => setNomRegisseur(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Mandataire (enseignant)</Label><Input value={nomMandataire} onChange={e => setNomMandataire(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Fonction du mandataire</Label><Input value={fonctionMandataire} onChange={e => setFonctionMandataire(e.target.value)} placeholder="Professeur d'anglais..." /></div>
          </div>
        </CardContent>
      </Card>

      {/* Personnalisation engagement */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Personnalisation du courrier d'engagement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Texte d'engagement financier</Label>
            <Textarea value={texteEngagement} onChange={e => setTexteEngagement(e.target.value)} rows={3} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Moyens de paiement & aides sociales</Label>
            <Textarea value={texteMoyensPaiement} onChange={e => setTexteMoyensPaiement(e.target.value)} rows={2} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Documents par catégorie */}
      {DOC_CATEGORIES.map(cat => (
        <Card key={cat.id} className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {cat.id === "ordonnateur" && <Stamp className="h-4 w-4" />}
              {cat.id === "regisseur" && <Banknote className="h-4 w-4" />}
              {cat.id === "bilan" && <BookOpen className="h-4 w-4" />}
              {cat.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{cat.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.docs.map(d => {
                const Icon = d.icon;
                return (
                  <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{d.description}</p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px]" onClick={() => generators[d.id]?.()}>
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
