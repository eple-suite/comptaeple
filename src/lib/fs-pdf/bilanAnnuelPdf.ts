// ═══════════════════════════════════════════════════════════════
// PDF — Bilan annuel Fonds sociaux à présenter au CA
// Conforme à l'obligation de bilan annuel (circulaire 2017-122 § III)
// ═══════════════════════════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEur, formatDateFr } from "./utils";
import {
  TYPE_FONDS_LABELS, NATURE_AIDE_LABELS,
  type TypeFonds, type NatureAide,
} from "@/pages/fonds-sociaux-v2/fsv2Types";

export interface BilanAnnuelKpis {
  totalAttribue: number;
  totalPaye: number;
  totalEnAttente: number;
  beneficiairesUniques: number;
  subventionAnnee: number;
  tauxConsommation: number;
  reliquat: number;
  refus: number;
  tauxRefus: number;
  delaiMoyen: number | null;
  nbCommissions: number;
  nbDecisions: number;
}

export interface BilanAnnuelInput {
  etablissementNom: string;
  uai?: string;
  anneeScolaire: string;
  kpis: BilanAnnuelKpis;
  parTypeFonds: Record<string, { count: number; total: number }>;
  parNature: Record<string, { count: number; total: number }>;
}

export function generateBilanAnnuelPdf(input: BilanAnnuelInput): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // En-tête
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text(input.etablissementNom, 20, 18);
  doc.setFont("helvetica", "normal").setFontSize(9);
  if (input.uai) doc.text(`UAI : ${input.uai}`, 20, 24);
  doc.text(`Édité le ${formatDateFr(new Date().toISOString())}`, 190, 18, { align: "right" });

  doc.setFont("helvetica", "bold").setFontSize(15);
  doc.text("BILAN ANNUEL — FONDS SOCIAUX", 105, 38, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Année scolaire ${input.anneeScolaire}`, 105, 44, { align: "center" });
  doc.setLineWidth(0.3).line(20, 48, 190, 48);

  // Vu réglementaire
  doc.setFontSize(8).setFont("helvetica", "italic");
  doc.text(
    "Document à présenter au Conseil d'administration (circulaire n° 2017-122 du 22-08-2017 § III).",
    20, 53,
  );

  // ─── KPIs principaux ──────────────────────────────────
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("1. Indicateurs clés", 20, 62);

  autoTable(doc, {
    startY: 65,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Indicateur", "Valeur"]],
    headStyles: { fillColor: [40, 60, 120] },
    body: [
      ["Subvention notifiée (BOP 230 / 141)", formatEur(input.kpis.subventionAnnee)],
      ["Total attribué (décisions hors brouillon/refus/annulé)", formatEur(input.kpis.totalAttribue)],
      ["Dont payé", formatEur(input.kpis.totalPaye)],
      ["Dont en attente paiement", formatEur(input.kpis.totalEnAttente)],
      ["Taux de consommation", `${input.kpis.tauxConsommation.toFixed(1)} %`],
      ["Reliquat estimé", formatEur(input.kpis.reliquat)],
      ["Bénéficiaires uniques", String(input.kpis.beneficiairesUniques)],
      ["Aide moyenne par bénéficiaire", input.kpis.beneficiairesUniques > 0
        ? formatEur(input.kpis.totalAttribue / input.kpis.beneficiairesUniques) : "—"],
      ["Nombre total de décisions", String(input.kpis.nbDecisions)],
      ["Nombre de commissions tenues", String(input.kpis.nbCommissions)],
      ["Refus", `${input.kpis.refus} (${input.kpis.tauxRefus.toFixed(1)} %)`],
      ["Délai moyen instruction → DP",
        input.kpis.delaiMoyen !== null ? `${input.kpis.delaiMoyen} jours` : "n/a"],
    ],
    columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "right", fontStyle: "bold" } },
  });

  // ─── Répartition par type de fonds ────────────────────
  let y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("2. Répartition par type de fonds", 20, y);

  const tfBody = Object.entries(input.parTypeFonds).map(([k, v]) => [
    TYPE_FONDS_LABELS[k as TypeFonds] ?? k,
    String(v.count),
    formatEur(v.total),
    input.kpis.totalAttribue > 0 ? `${((v.total / input.kpis.totalAttribue) * 100).toFixed(1)} %` : "—",
  ]);
  if (tfBody.length === 0) {
    tfBody.push(["—", "0", formatEur(0), "—"]);
  }

  autoTable(doc, {
    startY: y + 3,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Type de fonds", "Décisions", "Montant", "% total"]],
    headStyles: { fillColor: [40, 60, 120] },
    body: tfBody,
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // ─── Répartition par nature (Q10 DGESCO) ──────────────
  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("3. Répartition par nature d'aide (alimente Q10 enquête DGESCO)", 20, y);

  const nBody = Object.entries(input.parNature)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([k, v]) => [
      NATURE_AIDE_LABELS[k as NatureAide] ?? k,
      String(v.count),
      formatEur(v.total),
      input.kpis.totalAttribue > 0 ? `${((v.total / input.kpis.totalAttribue) * 100).toFixed(1)} %` : "—",
    ]);
  if (nBody.length === 0) {
    nBody.push(["—", "0", formatEur(0), "—"]);
  }

  autoTable(doc, {
    startY: y + 3,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Nature de l'aide", "Décisions", "Montant", "% total"]],
    headStyles: { fillColor: [40, 60, 120] },
    body: nBody,
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // ─── Synthèse / commentaire ──────────────────────────
  y = (doc as any).lastAutoTable.finalY + 10;
  if (y > 245) { doc.addPage(); y = 20; }

  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("4. Analyse de gestion", 20, y); y += 6;
  doc.setFont("helvetica", "normal").setFontSize(9);

  const lignes = [
    `• Le taux de consommation de la subvention s'établit à ${input.kpis.tauxConsommation.toFixed(1)} %.`,
    input.kpis.reliquat < 0
      ? `• Attention : la consommation dépasse la subvention notifiée de ${formatEur(Math.abs(input.kpis.reliquat))}.`
      : `• Reliquat disponible : ${formatEur(input.kpis.reliquat)}.`,
    `• ${input.kpis.beneficiairesUniques} élève${input.kpis.beneficiairesUniques > 1 ? "s ont" : " a"} bénéficié d'au moins une aide (${input.kpis.nbDecisions} décisions, ${input.kpis.nbCommissions} commissions).`,
    input.kpis.tauxRefus > 30
      ? `• Le taux de refus (${input.kpis.tauxRefus.toFixed(1)} %) est élevé : revoir les critères d'attribution ou la communication aux familles.`
      : `• Taux de refus maîtrisé : ${input.kpis.tauxRefus.toFixed(1)} %.`,
    input.kpis.delaiMoyen !== null && input.kpis.delaiMoyen > 30
      ? `• Délai moyen d'instruction long (${input.kpis.delaiMoyen} jours) — fluidifier la chaîne décision → DP.`
      : `• Circuit Op@le DP : délais conformes.`,
  ];
  for (const l of lignes) {
    const wrapped = doc.splitTextToSize(l, 170);
    doc.text(wrapped, 20, y);
    y += wrapped.length * 5;
  }

  // Pied
  doc.setFontSize(8).setFont("helvetica", "italic");
  doc.text(
    "Document interne — Conforme circulaire 2017-122 du 22 août 2017 / instruction codificatrice M9-6 tome 3.",
    105, 287, { align: "center" },
  );

  return doc.output("blob");
}