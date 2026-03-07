import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  mockIndicators,
  mockBalanceData,
  mockEvolutionData,
  mockTresorerieDetail,
  mockCreancesData,
  formatCurrency,
  formatPercent,
} from "@/lib/mockData";

export function generateFinancialReport(establishmentName: string = "Lycée Jean Moulin", uai: string = "0910620T") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(37, 68, 120); // primary blue
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT FINANCIER", pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${establishmentName} — ${uai}`, pageWidth / 2, 28, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Exercice 2023 — Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, 35, { align: "center" });

  y = 50;
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. Indicateurs financiers M9-6", 14, y);
  y += 8;

  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: y,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Fonds de roulement (FDR)", formatCurrency(mockIndicators.fdr)],
      ["Besoin en fonds de roulement (BFR)", formatCurrency(mockIndicators.bfr)],
      ["Trésorerie nette", formatCurrency(mockIndicators.tresorerie)],
      ["Jours de fonctionnement", `${mockIndicators.joursFonctionnement} jours`],
      ["Taux de recouvrement", formatPercent(mockIndicators.tauxRecouvrement)],
      ["Résultat de l'exercice", formatCurrency(mockIndicators.resultatExercice)],
      ["Poids des charges", formatPercent(mockIndicators.poidsCharges)],
      ["Part du SRH", formatPercent(mockIndicators.poidsSRH)],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("2. Balance comptable par classe", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Classe", "Libellé", "Débits", "Crédits", "Solde"]],
    body: mockBalanceData.map((r) => [r.classe, r.label, formatCurrency(r.debit), formatCurrency(r.credit), formatCurrency(r.solde)]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  // New page for evolution and treasury
  doc.addPage();
  y = 20;

  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3. Évolution pluriannuelle", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Année", "FDR", "BFR", "Trésorerie"]],
    body: mockEvolutionData.map((r) => [r.year, formatCurrency(r.fdr), formatCurrency(r.bfr), formatCurrency(r.tresorerie)]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("4. Détail de la trésorerie", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Compte", "Libellé", "Montant"]],
    body: mockTresorerieDetail.map((r) => [r.compte, r.label, formatCurrency(r.montant)]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 2: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("5. Analyse des créances", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Type", "Montant", "Ancienneté"]],
    body: mockCreancesData.map((r) => [r.type, formatCurrency(r.montant), r.anciennete]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Diagnostic
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("6. Diagnostic", 14, y);
  y += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const diagnosticLines = [
    `• Le fonds de roulement est positif à ${formatCurrency(mockIndicators.fdr)}, couvrant ${mockIndicators.joursFonctionnement} jours de fonctionnement.`,
    `• La trésorerie nette est positive (${formatCurrency(mockIndicators.tresorerie)}), assurant la liquidité.`,
    `• Le taux de recouvrement est satisfaisant à ${formatPercent(mockIndicators.tauxRecouvrement)}.`,
    `• Le résultat de l'exercice est excédentaire de ${formatCurrency(mockIndicators.resultatExercice)}.`,
    `• La part du SRH dans les charges s'élève à ${formatPercent(mockIndicators.poidsSRH)}.`,
  ];
  diagnosticLines.forEach((line) => {
    doc.text(line, 14, y, { maxWidth: pageWidth - 28 });
    y += 6;
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Cockpit Comptable EPLE — Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`Rapport_Financier_${uai}_2023.pdf`);
}
