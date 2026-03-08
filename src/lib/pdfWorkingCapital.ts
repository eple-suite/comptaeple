import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/mockData";

interface WorkingCapitalPDFData {
  fdr: number;
  bfr: number;
  tresorerie: number;
  joursFonctionnement: number;
  tresoreriePropre: number;
  totalDettes: number;
  dettes: { subventions: number; reliquatsSubventions: number; avancesEleves: number; avancesCommensaux: number };
  fragiliteFDR: { stocks: number; creancesAnciennes: number; compte416: number };
  totalFragilite: number;
  fdrMobilisable: number;
  joursMobilisable: number;
  montantPrelevement: number;
  prelevementsAutorises: number;
  fdrApres: number;
  joursApres: number;
  isPrelevementViable: boolean;
  evolutionData: { year: string; fdr: number; bfr: number; tresorerie: number }[];
}

export function generateWorkingCapitalPDF(data: WorkingCapitalPDFData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, pw, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ANALYSE DU FONDS DE ROULEMENT", pw / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Document d'aide à la décision — Conseil d'Administration", pw / 2, 26, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Exercice 2023 — Généré le ${new Date().toLocaleDateString("fr-FR")}`, pw / 2, 34, { align: "center" });

  y = 50;

  // 1. Indicateurs
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Indicateurs clés", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Fonds de roulement brut", formatCurrency(data.fdr)],
      ["Besoin en fonds de roulement (BFR)", formatCurrency(data.bfr)],
      ["Trésorerie nette", formatCurrency(data.tresorerie)],
      ["Jours de fonctionnement (FDR brut)", `${data.joursFonctionnement} jours`],
      ["Trésorerie propre", formatCurrency(data.tresoreriePropre)],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 2. FDR mobilisable
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Calcul du FDR mobilisable", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Élément", "Montant"]],
    body: [
      ["FDR brut", formatCurrency(data.fdr)],
      ["(−) Stocks (Classe 3)", formatCurrency(data.fragiliteFDR.stocks)],
      ["(−) Créances anciennes (> 1 an)", formatCurrency(data.fragiliteFDR.creancesAnciennes)],
      ["(−) Compte 416000 — Créances douteuses", formatCurrency(data.fragiliteFDR.compte416)],
      ["= Total éléments de fragilité", formatCurrency(data.totalFragilite)],
      ["= FDR MOBILISABLE", formatCurrency(data.fdrMobilisable)],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 5) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [220, 237, 200];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Jours de fonctionnement (FDR mobilisable) : ${data.joursMobilisable} jours`, 14, y);
  y += 10;

  // 3. Autonomie financière
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. Autonomie financière (Trésorerie propre)", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Élément", "Montant"]],
    body: [
      ["Trésorerie nette", formatCurrency(data.tresorerie)],
      ["(−) Subventions non consommées", formatCurrency(data.dettes.subventions)],
      ["(−) Reliquats de subventions", formatCurrency(data.dettes.reliquatsSubventions)],
      ["(−) Avances des élèves", formatCurrency(data.dettes.avancesEleves)],
      ["(−) Avances des commensaux", formatCurrency(data.dettes.avancesCommensaux)],
      ["= TRÉSORERIE PROPRE", formatCurrency(data.tresoreriePropre)],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 5) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = data.tresoreriePropre > 0 ? [220, 237, 200] : [255, 220, 220];
      }
    },
  });

  // New page for prelevement analysis
  doc.addPage();
  y = 20;

  // 4. Analyse du prélèvement
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("4. Analyse du prélèvement sur FDR mobilisable", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Élément", "Valeur"]],
    body: [
      ["FDR mobilisable (base)", formatCurrency(data.fdrMobilisable)],
      ["Prélèvement demandé", formatCurrency(data.montantPrelevement)],
      ["Prélèvements déjà autorisés", formatCurrency(data.prelevementsAutorises)],
      ["FDR résiduel après prélèvement", formatCurrency(data.fdrApres)],
      ["Jours de fonctionnement résiduels", `${data.joursApres} jours (seuil : 30 j)`],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 3) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = data.fdrApres > 0 ? [220, 237, 200] : [255, 220, 220];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Avis
  doc.setFillColor(data.isPrelevementViable ? 220 : 255, data.isPrelevementViable ? 237 : 220, data.isPrelevementViable ? 200 : 220);
  doc.roundedRect(14, y, pw - 28, 30, 3, 3, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.isPrelevementViable ? "AVIS FAVORABLE" : "AVIS RÉSERVÉ", pw / 2, y + 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.isPrelevementViable) {
    doc.text(
      `Le prélèvement de ${formatCurrency(data.montantPrelevement)} laisse un FDR résiduel de ${formatCurrency(data.fdrApres)} (${data.joursApres} jours).`,
      pw / 2, y + 18, { align: "center" }
    );
    doc.text(`Trésorerie propre : ${formatCurrency(data.tresoreriePropre)}. Autonomie financière suffisante.`, pw / 2, y + 24, { align: "center" });
  } else {
    doc.text(
      `Le prélèvement ramènerait le FDR mobilisable à ${formatCurrency(data.fdrApres)} (${data.joursApres} jours < 30 j).`,
      pw / 2, y + 18, { align: "center" }
    );
    doc.text("Il est recommandé de réduire le montant ou de différer l'opération.", pw / 2, y + 24, { align: "center" });
  }

  y += 40;

  // 5. Évolution pluriannuelle
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("5. Évolution pluriannuelle", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Année", "FDR", "BFR", "Trésorerie"]],
    body: data.evolutionData.map((r) => [r.year, formatCurrency(r.fdr), formatCurrency(r.bfr), formatCurrency(r.tresorerie)]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // Footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Cockpit Comptable EPLE — Fonds de Roulement — Page ${i}/${pageCount}`, pw / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`Analyse_FDR_2023.pdf`);
}
