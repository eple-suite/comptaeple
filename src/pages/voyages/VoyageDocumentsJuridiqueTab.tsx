import { useMemo } from "react";
import { FileText, Download, Printer, Calendar, User, CreditCard, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Voyage, Eleve, MODES_PAIEMENT } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { calculerResteApayer } from "@/lib/voyageBudgetEngine";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  voyage: Voyage;
}

// ─── Helpers PDF ───

function headerPDF(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 22);
  doc.setTextColor(0, 0, 0);
}

function footerPDF(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i}/${pages} — Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 287);
  }
}

// ─── 1. Échéancier intelligent ───

function genererEcheancier(voyage: Voyage) {
  const doc = new jsPDF();
  headerPDF(doc, "Échéancier de paiement", `${voyage.intitule || voyage.destination} — ${voyage.classe}`);

  let y = 36;
  doc.setFontSize(10);
  doc.text(`Destination : ${voyage.destination} (${voyage.pays})`, 14, y);
  doc.text(`Dates : ${voyage.dateDepart} → ${voyage.dateRetour}`, 14, y + 6);
  doc.text(`Professeur référent : ${voyage.professeur}`, 14, y + 12);
  y += 22;

  // Table par élève
  const rows = voyage.eleves.map(e => {
    const paye = e.paiements.reduce((s, p) => s + p.montant, 0);
    const fondsSocial = (e as any).fondsSocial || 0;
    const reste = calculerResteApayer(e.participationDue, paye, fondsSocial);
    const echeancesEleve = voyage.echeances.map(ech => {
      const montantEch = e.participationDue * ech.pourcentage / 100;
      return `${ech.date}: ${formatCurrency(montantEch)}`;
    });
    return [
      `${e.nom} ${e.prenom}`,
      e.classe,
      formatCurrency(e.participationDue),
      fondsSocial > 0 ? `-${formatCurrency(fondsSocial)}` : "—",
      formatCurrency(paye),
      reste <= 0 ? "Soldé" : formatCurrency(reste),
      echeancesEleve.join("\n"),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Élève", "Classe", "Dû", "Fonds social", "Payé", "Reste", "Échéancier"]],
    body: rows,
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 7, fontStyle: "bold" },
    styles: { fontSize: 6.5, cellPadding: 2 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 8, right: 8 },
  });

  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const totalDu = voyage.eleves.reduce((s, e) => s + e.participationDue, 0);
  const totalPaye = voyage.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
  doc.setFontSize(9);
  doc.setFont(undefined!, "bold");
  doc.text(`Total dû : ${formatCurrency(totalDu)}  |  Total encaissé : ${formatCurrency(totalPaye)}  |  Reste global : ${formatCurrency(Math.max(0, totalDu - totalPaye))}`, 14, finalY);

  footerPDF(doc);
  doc.save(`echeancier_${voyage.destination}_${voyage.classe.replace(/\s/g, "_")}.pdf`);
}

// ─── 2. Kit Mandataire (Décrets 2019/2020) ───

function genererActeNominationMandataire(voyage: Voyage) {
  const doc = new jsPDF();
  headerPDF(doc, "Acte de nomination du mandataire", "Régie d'avances — Décrets n°2019-798 et n°2020-922");

  const regieAvances = (voyage as any).regieAvances || 0;
  let y = 38;
  doc.setFontSize(10);

  doc.text("LE CHEF D'ÉTABLISSEMENT,", 14, y);
  y += 10;
  doc.setFontSize(9);
  const textes = [
    `Vu le décret n°2012-1246 du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique ;`,
    `Vu le décret n°2019-798 du 26 juillet 2019 relatif aux régies de recettes et d'avances des organismes publics ;`,
    `Vu le décret n°2020-922 du 29 juillet 2020 portant diverses dispositions relatives aux régies ;`,
    `Vu la délibération du conseil d'administration en date du ${voyage.dateVoteCA || "___/___/______"} ;`,
    ``,
    `ARRÊTE :`,
    ``,
    `Article 1 — Objet`,
    `Il est institué une régie d'avances pour le voyage scolaire à ${voyage.destination} (${voyage.pays}),`,
    `du ${voyage.dateDepart} au ${voyage.dateRetour}, classe ${voyage.classe}.`,
    ``,
    `Article 2 — Montant de l'avance`,
    `Le montant maximum de l'avance est fixé à ${formatCurrency(regieAvances)}.`,
    `Cette avance est destinée au paiement des menues dépenses sur place (entrées musées, péages, restauration).`,
    ``,
    `Article 3 — Nomination du mandataire`,
    `Est nommé(e) mandataire de la régie d'avances :`,
    ``,
    `Nom et prénom : ${voyage.professeur}`,
    `Qualité : Professeur référent du voyage`,
    ``,
    `Article 4 — Obligations`,
    `Le mandataire est personnellement et pécuniairement responsable des fonds qui lui sont confiés.`,
    `Il devra justifier de l'emploi des fonds dans un délai de 30 jours après le retour du voyage.`,
    ``,
    `Article 5 — Pièces justificatives`,
    `Chaque dépense devra être accompagnée d'un justificatif (ticket, facture, reçu).`,
    `Un état récapitulatif des dépenses sera établi et transmis à l'agent comptable.`,
    ``,
    `Fait à __________________________, le ___/___/______`,
    ``,
    `Le Chef d'établissement,                          L'Agent comptable,`,
    ``,
    ``,
    `Signature :                                        Visa :`,
  ];

  textes.forEach(t => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(t, 14, y, { maxWidth: 180 });
    y += t === "" ? 4 : 5.5;
  });

  footerPDF(doc);
  doc.save(`acte_mandataire_${voyage.destination}_${voyage.professeur.replace(/\s/g, "_")}.pdf`);
}

function genererEtatFrais(voyage: Voyage) {
  const doc = new jsPDF();
  headerPDF(doc, "État de frais — Régie d'avances", `Voyage : ${voyage.destination} — ${voyage.classe}`);

  let y = 38;
  const regieAvances = (voyage as any).regieAvances || 0;
  doc.setFontSize(9);
  doc.text(`Mandataire : ${voyage.professeur}`, 14, y);
  doc.text(`Montant de l'avance : ${formatCurrency(regieAvances)}`, 14, y + 6);
  y += 16;

  // Empty table for manual fill
  autoTable(doc, {
    startY: y,
    head: [["Date", "Nature de la dépense", "Fournisseur", "N° pièce", "Montant (€)", "Observations"]],
    body: Array.from({ length: 20 }, () => ["", "", "", "", "", ""]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, minCellHeight: 8 },
    columnStyles: { 4: { halign: "right" } },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text("Total des dépenses : ______________ €", 14, finalY);
  doc.text("Reliquat à reverser : ______________ €", 14, finalY + 8);
  doc.text(`Date : ___/___/______          Signature du mandataire :`, 14, finalY + 20);
  doc.text(`Visa de l'agent comptable :`, 120, finalY + 20);

  footerPDF(doc);
  doc.save(`etat_frais_${voyage.destination}.pdf`);
}

// ─── 3. Engagement des familles ───

function genererEngagementFamille(voyage: Voyage, eleve: Eleve) {
  const doc = new jsPDF();
  headerPDF(doc, "Engagement financier des familles", `Voyage : ${voyage.intitule || voyage.destination}`);

  let y = 38;
  doc.setFontSize(10);
  doc.text("ENGAGEMENT DE PAIEMENT", 14, y);
  y += 10;

  doc.setFontSize(9);
  const lignes = [
    `Établissement : ________________________________`,
    `Adresse : ________________________________`,
    ``,
    `Voyage : ${voyage.intitule || `Voyage à ${voyage.destination}`}`,
    `Destination : ${voyage.destination} (${voyage.pays})`,
    `Dates : du ${voyage.dateDepart} au ${voyage.dateRetour}`,
    `Professeur référent : ${voyage.professeur}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Élève : ${eleve.prenom} ${eleve.nom}`,
    `Classe : ${eleve.classe}`,
    `Régime : ${eleve.regime === "interne" ? "Interne" : eleve.regime === "demi-pensionnaire" ? "Demi-pensionnaire" : "Externe"}`,
    ``,
    `Responsable légal : ${eleve.responsable1}`,
    `Email : ${eleve.emailResponsable}`,
    `Téléphone : ${eleve.telResponsable}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `MONTANT TOTAL DÛ : ${formatCurrency(eleve.participationDue)}`,
  ];

  const fondsSocial = (eleve as any).fondsSocial || 0;
  if (fondsSocial > 0) {
    lignes.push(`Aide fonds social : -${formatCurrency(fondsSocial)}`);
    lignes.push(`MONTANT NET À RÉGLER : ${formatCurrency(Math.max(0, eleve.participationDue - fondsSocial))}`);
  }

  lignes.push(``);
  lignes.push(`ÉCHÉANCIER DE PAIEMENT :`);

  voyage.echeances.forEach((ech, i) => {
    const montantNet = fondsSocial > 0
      ? Math.max(0, eleve.participationDue - fondsSocial) * ech.pourcentage / 100
      : eleve.participationDue * ech.pourcentage / 100;
    lignes.push(`  • Échéance ${i + 1} : ${ech.date} — ${formatCurrency(montantNet)} (${ech.pourcentage}%)`);
  });

  lignes.push(``);
  lignes.push(`Modes de paiement acceptés : chèque à l'ordre de l'agent comptable,`);
  lignes.push(`virement bancaire, paiement en ligne (si disponible).`);
  lignes.push(``);
  lignes.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lignes.push(``);
  lignes.push(`Je soussigné(e), ______________________________,`);
  lignes.push(`responsable légal de l'élève ${eleve.prenom} ${eleve.nom},`);
  lignes.push(`m'engage à régler la totalité de la participation`);
  lignes.push(`selon l'échéancier ci-dessus.`);
  lignes.push(``);
  lignes.push(`Date : ___/___/______`);
  lignes.push(``);
  lignes.push(`Signature du responsable légal :`);
  lignes.push(`(précédée de la mention "Lu et approuvé")`);

  lignes.forEach(t => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(t, 14, y, { maxWidth: 180 });
    y += t === "" ? 3 : 5;
  });

  footerPDF(doc);
  doc.save(`engagement_${eleve.nom}_${eleve.prenom}_${voyage.destination}.pdf`);
}

function genererTousEngagements(voyage: Voyage) {
  voyage.eleves.forEach(e => genererEngagementFamille(voyage, e));
}

// ─── Composant principal ───

export const VoyageDocumentsJuridiqueTab = ({ voyage }: Props) => {
  const regieAvances = (voyage as any).regieAvances || 0;
  const totalDu = voyage.eleves.reduce((s, e) => s + e.participationDue, 0);
  const totalPaye = voyage.eleves.reduce((s, e) => s + e.paiements.reduce((ss, p) => ss + p.montant, 0), 0);
  const resteGlobal = Math.max(0, totalDu - totalPaye);

  const documents = [
    {
      id: "echeancier",
      title: "Échéancier intelligent",
      description: "Tableau de suivi des paiements par élève avec calcul automatique des échéances, fonds sociaux et reste à payer.",
      icon: Calendar,
      badge: `${voyage.eleves.length} élèves`,
      action: () => genererEcheancier(voyage),
    },
    {
      id: "acte-mandataire",
      title: "Acte de nomination du mandataire",
      description: "Nomination officielle du mandataire de la régie d'avances conformément aux Décrets n°2019-798 et n°2020-922.",
      icon: User,
      badge: regieAvances > 0 ? formatCurrency(regieAvances) : "Pas de régie",
      disabled: regieAvances <= 0,
      action: () => genererActeNominationMandataire(voyage),
    },
    {
      id: "etat-frais",
      title: "État de frais — Régie d'avances",
      description: "Formulaire vierge pour le suivi des dépenses sur place par le mandataire, avec tableau récapitulatif.",
      icon: CreditCard,
      badge: "Décrets 2019/2020",
      disabled: regieAvances <= 0,
      action: () => genererEtatFrais(voyage),
    },
    {
      id: "engagement-famille",
      title: "Engagement financier des familles",
      description: "Document contractuel pré-rempli par élève avec coordonnées, montant dû, échéancier et signature du responsable légal.",
      icon: Scale,
      badge: `${voyage.eleves.length} documents`,
      action: () => genererTousEngagements(voyage),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Total dû familles</div>
            <div className="text-lg font-bold font-mono">{formatCurrency(totalDu)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Total encaissé</div>
            <div className="text-lg font-bold font-mono text-success">{formatCurrency(totalPaye)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Reste à recouvrer</div>
            <div className={`text-lg font-bold font-mono ${resteGlobal > 0 ? "text-destructive" : "text-success"}`}>
              {resteGlobal > 0 ? formatCurrency(resteGlobal) : "Soldé"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Pack juridique — Documents réglementaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className={`flex items-center justify-between p-3 rounded-lg border ${doc.disabled ? "opacity-50 bg-muted/30" : "bg-card hover:bg-accent/30"} transition-colors`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <doc.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{doc.title}</div>
                  <div className="text-xs text-muted-foreground max-w-md">{doc.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{doc.badge}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={doc.disabled}
                  onClick={doc.action}
                >
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Aperçu échéancier */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Aperçu de l'échéancier</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                {voyage.echeances.map((ech, i) => (
                  <TableHead key={i} className="text-right text-[10px]">
                    Éch. {i + 1}<br /><span className="text-muted-foreground">{ech.date}</span>
                  </TableHead>
                ))}
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voyage.eleves.slice(0, 10).map(e => {
                const paye = e.paiements.reduce((s, p) => s + p.montant, 0);
                const fondsSocial = (e as any).fondsSocial || 0;
                const reste = calculerResteApayer(e.participationDue, paye, fondsSocial);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs font-medium">{e.nom} {e.prenom}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.classe}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{formatCurrency(e.participationDue)}</TableCell>
                    {voyage.echeances.map((ech, i) => (
                      <TableCell key={i} className="text-right text-xs font-mono text-muted-foreground">
                        {formatCurrency(e.participationDue * ech.pourcentage / 100)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono">{formatCurrency(paye)}</TableCell>
                    <TableCell className={`text-right text-xs font-mono font-semibold ${reste <= 0 ? "text-success" : "text-destructive"}`}>
                      {reste <= 0 ? "Soldé" : formatCurrency(reste)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {voyage.eleves.length > 10 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              ... et {voyage.eleves.length - 10} autres élèves (voir PDF complet)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
