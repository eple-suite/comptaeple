/**
 * Génération PDF officielle pour enquêtes rectorat (chantier 9 / 10).
 * Utilise jsPDF (déjà disponible dans le projet) avec en-tête académique.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfSection {
  titre: string;
  lignes: [string, string][];
}

export interface PdfPayload {
  titre: string;
  soustitre?: string;
  sections: PdfSection[];
  enTeteAcademique?: string;
  signataireOrdo?: string;
  signataireAc?: string;
}

export async function generateEnquetePdf(payload: PdfPayload): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête République Française
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text("RÉPUBLIQUE FRANÇAISE", 15, 12);
  doc.text(payload.enTeteAcademique ?? "Ministère de l'Éducation nationale — Plateforme académique de pilotage", 15, 17);
  doc.setDrawColor(0, 38, 84);
  doc.setLineWidth(0.6);
  doc.line(15, 21, pageWidth - 15, 21);

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(0, 38, 84);
  doc.text(payload.titre, 15, 32);
  if (payload.soustitre) {
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(payload.soustitre, 15, 39);
  }

  // Sections
  let yPos = 48;
  for (const section of payload.sections) {
    doc.setFontSize(11);
    doc.setTextColor(0, 38, 84);
    doc.text(section.titre, 15, yPos);
    yPos += 2;
    autoTable(doc, {
      startY: yPos + 2,
      head: [["Champ", "Valeur"]],
      body: section.lignes,
      theme: "grid",
      headStyles: { fillColor: [0, 38, 84], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: 30 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
      margin: { left: 15, right: 15 },
    });
    // @ts-expect-error lastAutoTable injecté par autoTable
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    if (yPos > 260) { doc.addPage(); yPos = 20; }
  }

  // Pied de page signatures
  if (yPos > 240) { doc.addPage(); yPos = 30; }
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text("Signature ordonnateur :", 15, 270);
  doc.text(payload.signataireOrdo ?? "_____________________", 60, 270);
  doc.text("Visa AC :", 15, 280);
  doc.text(payload.signataireAc ?? "_____________________", 60, 280);

  // Pagination
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} / ${total} — généré le ${new Date().toLocaleString("fr-FR")}`,
      pageWidth - 15, 290, { align: "right" });
  }

  return doc.output("blob");
}

export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}