/**
 * Onglet Documents PDF — Génération de courriers réglementaires
 * Inspiré MobiliSCO T1080_Personnalisation_Courriers
 * Engagement financier, accusés, relances, bilan, bordereau
 */
import { useState } from "react";
import { FileText, Download, Printer, Users, Euro, Mail, ClipboardCheck, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Voyage, CATEGORIES_PRESTATIONS, MODES_PAIEMENT } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { toast } from "sonner";
import { createStyledPDF, savePDF, printPDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { validerEquilibreBudgetaire } from "@/lib/voyageBudgetEngine";

interface Props {
  voyage: Voyage;
}

const DOCS = [
  { id: "engagement", label: "Engagement financier des familles", icon: ClipboardCheck, description: "Courrier d'engagement avec échéancier, modalités de paiement et conditions d'annulation" },
  { id: "etat_eleves", label: "État nominatif des participants", icon: Users, description: "Liste complète des élèves avec situation de paiement et documents reçus" },
  { id: "bilan_financier", label: "Bilan financier du voyage", icon: BarChart3, description: "Tableau recettes/dépenses, taux de recouvrement, impact FDR — destiné au CA" },
  { id: "budget_previsionnel", label: "Budget prévisionnel", icon: Euro, description: "Ventilation dépenses/recettes pour présentation au conseil d'administration" },
] as const;

export const VoyageCourriersPdfTab = ({ voyage }: Props) => {
  const [nomChefEts, setNomChefEts] = useState("");
  const [nomGestionnaire, setNomGestionnaire] = useState("");
  const [nomAgentComptable, setNomAgentComptable] = useState("");
  const [texteEngagement, setTexteEngagement] = useState(
    `Je soussigné(e), responsable légal de l'élève, m'engage à participer aux frais occasionnés par le voyage scolaire à ${voyage.destination}, selon l'échéancier ci-dessous.\n\nDès signature du présent document, même en cas de non-participation de l'élève au voyage qui ne serait pas le fait d'une décision de l'établissement, je suis redevable de la totalité de la somme indiquée.`
  );
  const [texteMoyensPaiement, setTexteMoyensPaiement] = useState(
    `Moyens de paiement acceptés : chèque à l'ordre de l'agent comptable, virement bancaire, espèces (dans la limite réglementaire de 300 €), paiement en ligne.\n\nToute difficulté financière peut être signalée à l'assistant(e) social(e) de l'établissement en vue d'une éventuelle aide du fonds social.`
  );

  const v = voyage;

  const generateEngagementPDF = () => {
    const doc = createStyledPDF({ title: "Engagement financier", subtitle: `Voyage ${v.intitule || v.destination} — ${v.classe}` });
    let y = 52;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);

    // Infos voyage
    doc.setFont("helvetica", "bold");
    doc.text("Informations du voyage", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Destination : ${v.destination}, ${v.pays}`, 14, y); y += 4;
    doc.text(`Dates : ${v.dateDepart} — ${v.dateRetour}`, 14, y); y += 4;
    doc.text(`Classe : ${v.classe} — Professeur référent : ${v.professeur}`, 14, y); y += 4;
    if (v.objectifPedagogique) { doc.text(`Objectif : ${v.objectifPedagogique}`, 14, y); y += 4; }
    y += 4;

    // Coût et participation
    const coutParEleve = v.nbEleves > 0 ? v.budgetTotal / v.nbEleves : 0;
    const participationParEleve = v.nbEleves > 0 ? v.participationFamilles / v.nbEleves : 0;
    doc.setFont("helvetica", "bold");
    doc.text("Participation financière", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Coût total du voyage : ${formatCurrency(v.budgetTotal)} — soit ${formatCurrency(coutParEleve)} par participant`, 14, y); y += 4;
    doc.text(`Participation demandée aux familles : ${formatCurrency(participationParEleve)} par élève`, 14, y); y += 8;

    // Échéancier
    if (v.echeances.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Versement", "Échéance", "Montant"]],
        body: v.echeances.map((e, i) => [
          `Versement n°${i + 1}`,
          e.date || "—",
          formatCurrency(participationParEleve * e.pourcentage / 100),
        ]),
        headStyles: { fillColor: [37, 68, 120], textColor: 255 },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: { 2: { halign: "right" } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Texte engagement
    const engLines = doc.splitTextToSize(texteEngagement, 175);
    doc.text(engLines, 14, y); y += engLines.length * 3.8 + 6;

    // Moyens de paiement
    const payLines = doc.splitTextToSize(texteMoyensPaiement, 175);
    doc.text(payLines, 14, y); y += payLines.length * 3.8 + 10;

    // Talon réponse
    doc.setDrawColor(150); doc.setLineDashPattern([2, 2], 0);
    doc.line(14, y, 196, y); y += 6;
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "bold");
    doc.text("TALON-RÉPONSE à retourner avant le " + (v.dateLimiteInscription || "___/___/____"), 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Nom de l'élève : _________________________________ Classe : __________", 14, y); y += 6;
    doc.text("Nom du responsable : ___________________________________", 14, y); y += 6;
    doc.text("□ J'autorise mon enfant à participer au voyage et m'engage à régler la somme de ____________ €", 14, y); y += 5;
    doc.text("□ Je ne souhaite pas que mon enfant participe au voyage", 14, y); y += 8;
    doc.text("Date : ___/___/____                Signature du responsable légal :", 14, y);

    savePDF(doc, `Engagement_${v.destination}_${v.classe}.pdf`);
    toast.success("Engagement financier généré");
  };

  const generateEtatElevesPDF = () => {
    const doc = createStyledPDF({ title: "État nominatif des participants", subtitle: `${v.intitule || v.destination} — ${v.classe}` });
    autoTable(doc, {
      startY: 52,
      head: [["N°", "Nom", "Prénom", "Classe", "Dû", "Payé", "Reste", "Autor.", "Fiche San.", "Assur.", "Passeport"]],
      body: v.eleves.map((e, i) => {
        const paye = e.paiements.reduce((s, p) => s + p.montant, 0);
        return [
          String(i + 1), e.nom, e.prenom, e.classe,
          formatCurrency(e.participationDue), formatCurrency(paye), formatCurrency(e.participationDue - paye),
          e.autorisationParentale ? "✓" : "✗", e.ficheSanitaire ? "✓" : "✗", e.assuranceRC ? "✓" : "✗", e.passeport ? "✓" : "✗",
        ];
      }),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 7 },
      margin: { left: 8, right: 8 },
      styles: { fontSize: 7 },
      columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "center" }, 8: { halign: "center" }, 9: { halign: "center" }, 10: { halign: "center" } },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    const totalDu = v.eleves.reduce((s, e) => s + e.participationDue, 0);
    const totalPaye = v.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    doc.setFontSize(9);
    doc.text(`${v.eleves.length} participants — Total dû : ${formatCurrency(totalDu)} — Encaissé : ${formatCurrency(totalPaye)} — Reste : ${formatCurrency(totalDu - totalPaye)}`, 14, y);
    savePDF(doc, `Etat_participants_${v.destination}.pdf`);
    toast.success("État nominatif généré");
  };

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

    // Dépenses
    autoTable(doc, {
      startY: y, head: [["Nature", "Montant prévu", "Montant réalisé", "Écart"]],
      body: CATEGORIES_PRESTATIONS.map(c => [c.label, formatCurrency(v[c.key]), formatCurrency(v[c.key]), formatCurrency(0)]),
      foot: [["TOTAL DÉPENSES", formatCurrency(validation.totalDepenses), formatCurrency(validation.totalDepenses), formatCurrency(0)]],
      headStyles: { fillColor: [180, 40, 40], textColor: 255 }, footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 10, right: 10 }, styles: { fontSize: 8 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Recettes
    autoTable(doc, {
      startY: y, head: [["Origine", "Montant prévu", "Montant réalisé", "Écart"]],
      body: [
        ["Participation familles", formatCurrency(v.participationFamilles), formatCurrency(v.participationFamilles), formatCurrency(0)],
        ["Subvention collectivité", formatCurrency(v.subventionCollectivite), formatCurrency(v.subventionCollectivite), formatCurrency(0)],
        ["Subvention État", formatCurrency(v.subventionEtat), formatCurrency(v.subventionEtat), formatCurrency(0)],
        ["Subvention autre", formatCurrency(v.subventionAutre), formatCurrency(v.subventionAutre), formatCurrency(0)],
        ["Autofinancement / FDR", formatCurrency(v.autofinancement), formatCurrency(v.autofinancement), formatCurrency(0)],
      ],
      foot: [["TOTAL RECETTES", formatCurrency(validation.totalRecettes), formatCurrency(validation.totalRecettes), formatCurrency(0)]],
      headStyles: { fillColor: [37, 120, 68], textColor: 255 }, footStyles: { fillColor: [240, 248, 244], fontStyle: "bold" },
      margin: { left: 10, right: 10 }, styles: { fontSize: 8 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Solde
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Solde : ${formatCurrency(validation.solde)} — ${validation.equilibre ? "ÉQUILIBRÉ ✓" : "DÉSÉQUILIBRÉ ✗"}`, 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);

    // Recouvrement
    const totalDu = v.eleves.reduce((s, e) => s + e.participationDue, 0);
    const totalPaye = v.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
    doc.text(`Taux de recouvrement : ${totalDu > 0 ? ((totalPaye / totalDu) * 100).toFixed(1) : "—"}% — ${formatCurrency(totalPaye)} encaissé sur ${formatCurrency(totalDu)}`, 14, y); y += 4;
    doc.text(`Reste à recouvrer : ${formatCurrency(totalDu - totalPaye)}`, 14, y); y += 10;

    // Signatures
    doc.setFontSize(9);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 14, y); y += 8;
    const colW = 60;
    doc.text("L'ordonnateur", 14, y);
    doc.text("Le secrétaire général", 14 + colW, y);
    doc.text("L'agent comptable", 14 + colW * 2, y);
    y += 5;
    doc.text(nomChefEts || "(Nom et prénom)", 14, y);
    doc.text(nomGestionnaire || "(Nom et prénom)", 14 + colW, y);
    doc.text(nomAgentComptable || "(Nom et prénom)", 14 + colW * 2, y);

    savePDF(doc, `Bilan_financier_${v.destination}.pdf`);
    toast.success("Bilan financier généré");
  };

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
    doc.text("L'ordonnateur", 14, y);
    doc.text("Le secrétaire général", 110, y);
    y += 5;
    doc.text(nomChefEts || "(Nom et prénom)", 14, y);
    doc.text(nomGestionnaire || "(Nom et prénom)", 110, y);

    savePDF(doc, `Budget_previsionnel_${v.destination}.pdf`);
    toast.success("Budget prévisionnel généré");
  };

  const generators: Record<string, () => void> = {
    engagement: generateEngagementPDF,
    etat_eleves: generateEtatElevesPDF,
    bilan_financier: generateBilanFinancierPDF,
    budget_previsionnel: generateBudgetPrevisionnelPDF,
  };

  return (
    <div className="space-y-5">
      {/* Signataires */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signataires des documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">Chef d'établissement (ordonnateur)</Label><Input value={nomChefEts} onChange={e => setNomChefEts(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Secrétaire général (gestionnaire)</Label><Input value={nomGestionnaire} onChange={e => setNomGestionnaire(e.target.value)} placeholder="M. / Mme ..." /></div>
            <div><Label className="text-xs">Agent comptable</Label><Input value={nomAgentComptable} onChange={e => setNomAgentComptable(e.target.value)} placeholder="M. / Mme ..." /></div>
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
            <Textarea value={texteEngagement} onChange={e => setTexteEngagement(e.target.value)} rows={4} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Moyens de paiement & aides sociales</Label>
            <Textarea value={texteMoyensPaiement} onChange={e => setTexteMoyensPaiement(e.target.value)} rows={3} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Documents disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCS.map(d => {
          const Icon = d.icon;
          return (
            <Card key={d.id} className="shadow-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{d.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => generators[d.id]?.()}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
