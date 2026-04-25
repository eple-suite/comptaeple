import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CockpitDataset } from "@/lib/cockpit/types";

/**
 * Génère un PDF A4 paysage du cockpit pour transmission rectorat / réunion.
 * En-tête institutionnel + KPI + heatmap + top 10 alertes + pied de page.
 */
export function exportCockpitPDF(ds: CockpitDataset, signataire: string = "Agent comptable") {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // En-tête République
  doc.setFillColor(0, 0, 145);
  doc.rect(0, 0, W, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RÉPUBLIQUE FRANÇAISE', 24, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Ministère de l\'Éducation nationale, de la Jeunesse et des Sports', 24, 32);
  doc.text(ds.groupement.rectorat, 24, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COCKPIT AGENT COMPTABLE', W - 24, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Édition du ${ds.generationAt.toLocaleDateString('fr-FR')}`, W - 24, 36, { align: 'right' });

  // Bloc groupement
  doc.setTextColor(15, 15, 15);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(ds.groupement.nom, 24, 75);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Lycée siège : ${ds.groupement.siege}  ·  Agent comptable : ${ds.groupement.agentComptable}  ·  ${ds.groupement.nbEple} EPLE  ·  ${ds.groupement.nbAgents} agents`, 24, 90);

  // KPI table
  autoTable(doc, {
    startY: 105,
    head: [['Indicateur', 'Valeur', 'Sous-titre', 'Niveau', 'Source']],
    body: ds.kpis.map(k => [k.label, k.valeur, k.sublabel, k.niveau.toUpperCase(), k.source]),
    headStyles: { fillColor: [220, 230, 245], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: 24, right: 24 },
  });

  // Heatmap EPLE
  let y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Vue consolidée des EPLE', 24, y);
  autoTable(doc, {
    startY: y + 6,
    head: [['EPLE', 'UAI', 'CICF', 'Tréso (j)', 'FDR (j)', 'Créances €', 'Anomalies', 'Voyages', 'Marchés']],
    body: ds.eples.map(e => [e.nom, e.uai, `${Math.round(e.scoreCICF)}`, e.joursTresorerie, e.joursFdr, e.creances.toLocaleString('fr-FR'), e.anomalies, e.voyagesEnCours, e.marchesEnCours]),
    headStyles: { fillColor: [220, 230, 245], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 24, right: 24 },
  });

  // Top 10 alertes
  if (ds.alertes.length > 0) {
    y = (doc as any).lastAutoTable.finalY + 14;
    if (y > 480) { doc.addPage(); y = 40; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Top ${Math.min(10, ds.alertes.length)} alertes`, 24, y);
    autoTable(doc, {
      startY: y + 6,
      head: [['Niveau', 'Module', 'Titre', 'Référence']],
      body: ds.alertes.slice(0, 10).map(a => [a.niveau.toUpperCase(), a.module_origine, a.titre, a.reference_reglementaire || '—']),
      headStyles: { fillColor: [220, 230, 245], textColor: 20, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 24, right: 24 },
    });
  }

  // Pied de page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Document confidentiel — Édité par ${signataire} le ${ds.generationAt.toLocaleString('fr-FR')} — Page ${i}/${pages}`,
      W / 2, doc.internal.pageSize.getHeight() - 14, { align: 'center' }
    );
  }

  doc.save(`cockpit-ac-${ds.generationAt.toISOString().slice(0, 10)}.pdf`);
}
