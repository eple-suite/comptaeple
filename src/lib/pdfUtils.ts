import jsPDF from "jspdf";

export type PDFOrientation = "portrait" | "landscape";

interface PDFOptions {
  orientation?: PDFOrientation;
  title: string;
  subtitle?: string;
  establishment?: string;
  footerText?: string;
}

export function createStyledPDF(options: PDFOptions): jsPDF {
  const { orientation = "portrait", title, subtitle, establishment = "Cockpit Comptable EPLE", footerText } = options;
  const doc = new jsPDF({ orientation });
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, pw, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pw / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (subtitle) doc.text(subtitle, pw / 2, 25, { align: "center" });
  doc.setFontSize(8);
  doc.text(`${establishment} — Généré le ${new Date().toLocaleDateString("fr-FR")}`, pw / 2, 33, { align: "center" });

  return doc;
}

export function addPDFFooters(doc: jsPDF, footerText: string = "Cockpit Comptable EPLE") {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`${footerText} — Page ${i}/${pageCount}`, pw / 2, ph - 8, { align: "center" });
    doc.text(`Imprimé le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pw / 2, ph - 4, { align: "center" });
  }
}

export function savePDF(doc: jsPDF, filename: string) {
  addPDFFooters(doc);
  doc.save(filename);
}

// Print-specific: opens PDF in new tab for browser printing
export function printPDF(doc: jsPDF) {
  addPDFFooters(doc);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      win.print();
    });
  }
}
