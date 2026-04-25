// ═══════════════════════════════════════════════════════════════
// Export PDF — Rapport Anti-saucissonnage
// art. L2113-2 CCP, mémo DAJ « computation des seuils »
// ═══════════════════════════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CumulSaucissonnage, RepetitionFournisseur, CelluleHeatmap } from "./saucissonnageEngine";
import { formatEur } from "./seuilsEngine";

interface ExportOptions {
  etablissement: string;
  uai?: string;
  cumuls: CumulSaucissonnage[];
  repetitions: RepetitionFournisseur[];
  heatmap: CelluleHeatmap[];
  famillesLibelles: Record<string, string>;
}

export function exportSaucissonnagePdf(opts: ExportOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateGen = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  // En-tête tricolore institutionnel
  doc.setFillColor(0, 32, 91); doc.rect(0, 0, 70, 6, "F");
  doc.setFillColor(255, 255, 255); doc.rect(70, 0, 70, 6, "F");
  doc.setFillColor(206, 17, 38); doc.rect(140, 0, 70, 6, "F");

  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("Rapport Anti-saucissonnage", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`${opts.etablissement}${opts.uai ? ` — UAI ${opts.uai}` : ""}`, 14, 24);
  doc.setTextColor(120); doc.text(`Édité le ${dateGen} — art. L2113-2 CCP`, 14, 29);
  doc.setTextColor(0);

  // Synthèse
  const critiques = opts.cumuls.filter((c) => c.niveau === "critique").length;
  const alertes = opts.cumuls.filter((c) => c.niveau === "alerte").length;
  const repCritiques = opts.repetitions.filter((r) => r.niveau === "critique").length;

  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Synthèse", 14, 40);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`• Familles en dépassement (≥ 100 % seuil dispense) : ${critiques}`, 16, 46);
  doc.text(`• Familles en alerte (≥ 70 % seuil dispense) : ${alertes}`, 16, 51);
  doc.text(`• Présomptions répétition fournisseur (≥ 3 cmd / 6 mois) : ${repCritiques}`, 16, 56);

  // Cumuls par famille
  autoTable(doc, {
    startY: 64,
    head: [["Famille", "Libellé", "Cumul 12 m", "Seuil dispense", "% seuil", "Niveau"]],
    body: opts.cumuls.map((c) => [
      c.famille,
      opts.famillesLibelles[c.famille] || "—",
      formatEur(c.total12m),
      formatEur(c.seuilDispense),
      `${Math.round(c.pctDuSeuil)} %`,
      c.niveau.toUpperCase(),
    ]),
    headStyles: { fillColor: [0, 32, 91], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const v = String(data.cell.raw).toLowerCase();
        if (v === "critique") { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [153, 27, 27]; }
        else if (v === "alerte") { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
        else { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [22, 101, 52]; }
      }
    },
  });

  // Top 10 cellules heatmap
  const top10 = [...opts.heatmap].sort((a, b) => b.total_12m - a.total_12m).slice(0, 10);
  const yAfter = (doc as any).lastAutoTable?.finalY || 80;
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Top 10 — Concentration fournisseur × famille (12 mois)", 14, yAfter + 10);
  autoTable(doc, {
    startY: yAfter + 14,
    head: [["#", "Fournisseur", "Famille", "Cumul HT", "Nb cmd"]],
    body: top10.map((c, i) => [
      String(i + 1),
      c.fournisseur_nom,
      `${c.famille} — ${opts.famillesLibelles[c.famille] || ""}`,
      formatEur(c.total_12m),
      String(c.count),
    ]),
    headStyles: { fillColor: [0, 32, 91], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
  });

  // Alertes répétition
  const yRep = (doc as any).lastAutoTable?.finalY || 200;
  if (yRep > 240) doc.addPage();
  const yStart = yRep > 240 ? 20 : yRep + 10;
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Alertes — Répétition fournisseur (6 mois glissants)", 14, yStart);
  autoTable(doc, {
    startY: yStart + 4,
    head: [["Fournisseur", "Famille", "Nb cmd", "Cumul HT", "Niveau", "Motif"]],
    body: opts.repetitions.map((r) => [
      r.fournisseur_nom,
      `${r.famille} — ${opts.famillesLibelles[r.famille] || ""}`,
      String(r.count),
      formatEur(r.total_ht),
      r.niveau.toUpperCase(),
      r.motif,
    ]),
    headStyles: { fillColor: [0, 32, 91], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 5: { cellWidth: 60 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const v = String(data.cell.raw).toLowerCase();
        if (v === "critique") { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [153, 27, 27]; }
        else if (v === "alerte") { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
      }
    },
  });

  // Pied de page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(120);
    doc.text(
      `CCP 2026 (décrets 2025-1386 / 2025-1383) — Computation des seuils par famille homogène d'achat`,
      14, 290
    );
    doc.text(`Page ${i} / ${pages}`, 195, 290, { align: "right" });
  }

  doc.save(`anti-saucissonnage-${opts.uai || "EPLE"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}