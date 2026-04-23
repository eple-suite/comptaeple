// ═══════════════════════════════════════════════════════════════
// PDF — Document d'aide à la saisie de l'enquête Rectorat DGESCO
// Reprend les KPIs Q1→Q17, la ventilation Q10, et les contrôles
// R1→R16 calculés par `validation.ts`. Format A4 portrait, jsPDF.
// ═══════════════════════════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEur, formatDateFr } from "./utils";
import type { PdfContext } from "./decisionPdf";
import type { EnqueteKpis, ValidationIssue } from "@/lib/enquete-rectorat/validation";
import { NATURE_AIDE_LABELS, type NatureAide } from "@/pages/fonds-sociaux-v2/fsv2Types";

function header(doc: jsPDF, ctx: PdfContext, anneeScolaire: string) {
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text(ctx.etablissementNom, 20, 18);
  doc.setFont("helvetica", "normal").setFontSize(9);
  if (ctx.etablissementAdresse) doc.text(ctx.etablissementAdresse, 20, 24);
  if (ctx.etablissementCp || ctx.etablissementVille) {
    doc.text(`${ctx.etablissementCp ?? ""} ${ctx.etablissementVille ?? ""}`.trim(), 20, 29);
  }
  if (ctx.uai) doc.text(`UAI : ${ctx.uai}`, 20, 34);

  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("AIDE À LA SAISIE — ENQUÊTE FONDS SOCIAUX (DGESCO)", 105, 46, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Année scolaire ${anneeScolaire} — Édité le ${formatDateFr(new Date().toISOString())}`,
    105, 52, { align: "center" });
  doc.setLineWidth(0.3).line(20, 56, 190, 56);
}

function footerAllPages(doc: jsPDF, ctx: PdfContext) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setFont("helvetica", "italic").setTextColor(120);
    doc.text(
      `${ctx.etablissementNom} — Document interne d'aide à la saisie — Page ${i}/${total}`,
      105, 290, { align: "center" },
    );
    doc.setTextColor(0);
  }
}

const SEVERITY_LABEL: Record<ValidationIssue["severity"], string> = {
  error: "Erreur",
  warning: "Avertiss.",
  info: "Info",
};

/** Génère le PDF d'aide à la saisie (1 doc complet). */
export function generateEnqueteAidePdf(
  ctx: PdfContext,
  params: {
    anneeScolaire: string;
    kpis: EnqueteKpis;
    issues: ValidationIssue[];
  },
): Blob {
  const { anneeScolaire, kpis, issues } = params;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, ctx, anneeScolaire);

  let y = 64;

  // ── 1. Synthèse ────────────────────────────────────────────
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("1. Synthèse — Indicateurs clés", 20, y); y += 4;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Code", "Libellé", "Valeur"]],
    headStyles: { fillColor: [37, 68, 120], textColor: 255 },
    body: [
      ["Q1", "Total des demandes (hors annulées)", String(kpis.q1_total_demandes)],
      ["Q2", "Aides accordées (décidées / mandatées / payées)", String(kpis.q2_total_aides_accordees)],
      ["Q3", "Montant total versé (mandaté + payé)", formatEur(kpis.q3_montant_total_verse)],
      ["Q4", "Montant moyen par aide accordée", formatEur(kpis.q4_montant_moyen)],
      ["Q5", "Élèves bénéficiaires uniques", String(kpis.q5_eleves_aides)],
      ["Q11", "Subventions Rectorat reçues sur l'année", formatEur(kpis.q11_subv_rectorat_recue)],
      ["Q12", "Reliquats d'ouverture", formatEur(kpis.q12_reliquats_ouverture)],
      ["Q13", "Taux de consommation (versé / (subv + reliq))", `${kpis.q13_taux_consommation.toFixed(1)} %`],
      ["Q14", "Nombre de commissions tenues", String(kpis.q14_nb_commissions)],
      ["Q15", "Élèves boursiers parmi les bénéficiaires", String(kpis.q15_nb_eleves_boursiers_aides)],
      ["Q16", "Aides attribuées en urgence", String(kpis.q16_nb_aides_urgence)],
      ["Q17", "Effectif élèves total (actifs)", String(kpis.q17_eleves_total_etablissement)],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 18 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 38 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 2. Répartitions Q6 / Q7 / Q8 / Q9 ──────────────────────
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("2. Répartitions structurelles (Q6 → Q9)", 20, y); y += 4;

  const repartRows: string[][] = [];
  const pushRepart = (q: string, libelle: string, data: Record<string, number>) => {
    const total = Object.values(data).reduce((s, n) => s + n, 0);
    if (total === 0) {
      repartRows.push([q, libelle, "—", "—"]);
      return;
    }
    Object.entries(data).forEach(([k, v], idx) => {
      const pct = total > 0 ? Math.round((v / total) * 100) : 0;
      repartRows.push([idx === 0 ? q : "", idx === 0 ? libelle : "", k, `${v} (${pct} %)`]);
    });
  };
  pushRepart("Q6", "Par voie", kpis.q6_repartition_voie);
  pushRepart("Q7", "Par type de fonds", kpis.q7_repartition_type_fonds as unknown as Record<string, number>);
  pushRepart("Q8", "Par modalité de versement", kpis.q8_repartition_modalite);
  pushRepart("Q9", "Par modalité d'attribution", kpis.q9_repartition_attribution);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Code", "Question", "Modalité", "Décisions"]],
    headStyles: { fillColor: [37, 68, 120], textColor: 255 },
    body: repartRows,
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 18 },
      3: { halign: "right", cellWidth: 38 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 3. Ventilation Q10 par nature ──────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("3. Q10 — Ventilation par nature d'aide", 20, y); y += 4;

  const q10Rows = (Object.entries(kpis.q10_repartition_nature) as [NatureAide, { count: number; montant: number }][])
    .map(([n, v]) => [
      NATURE_AIDE_LABELS[n] ?? n,
      String(v.count),
      formatEur(v.montant),
    ]);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Nature de l'aide (libellé DGESCO)", "Nombre", "Montant"]],
    headStyles: { fillColor: [37, 68, 120], textColor: 255 },
    body: q10Rows,
    columnStyles: {
      1: { halign: "right", cellWidth: 28 },
      2: { halign: "right", cellWidth: 38, fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 4. Contrôles R1 → R16 ──────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("4. Contrôles de cohérence (R1 → R16)", 20, y); y += 4;

  if (issues.length === 0) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0, 110, 60);
    doc.text("✓ Aucune anomalie détectée. Données prêtes pour transmission au Rectorat.", 20, y + 4);
    doc.setTextColor(0);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, valign: "top" },
      head: [["Code", "Sévérité", "Message", "Conseil"]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      body: issues.map(i => [i.code, SEVERITY_LABEL[i.severity], i.message, i.hint ?? "—"]),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 14 },
        1: { cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const sev = (issues[data.row.index]?.severity);
          if (sev === "error") data.cell.styles.textColor = [180, 30, 30];
          else if (sev === "warning") data.cell.styles.textColor = [180, 110, 0];
          else data.cell.styles.textColor = [60, 90, 160];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 5. Mode d'emploi de report dans la grille DGESCO ───────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("5. Comment reporter ces valeurs dans la grille DGESCO", 20, y); y += 6;
  doc.setFont("helvetica", "normal").setFontSize(9);
  const guide = [
    "• Q1 à Q5 : reportez directement les volumes et montants dans la section « Bilan annuel ».",
    "• Q6 à Q9 : utilisez les répartitions ci-dessus pour ventiler par voie / type de fonds / modalités.",
    "• Q10 : copiez la ventilation par nature dans le tableau « Nature des aides accordées ».",
    "• Q11 / Q12 : reportez les montants subventions Rectorat reçues et reliquats d'ouverture.",
    "• Q13 : le taux de consommation doit rester ≤ 100 %. Au-delà, vérifiez subventions et reliquats.",
    "• Q14 / Q16 : indiquez le nombre de commissions et le nombre d'aides en urgence.",
    "• Q15 / Q17 : reportez les élèves boursiers aidés et l'effectif total de l'établissement.",
    "• Avant transmission, traitez toutes les erreurs (bloquantes) listées en section 4.",
  ];
  guide.forEach(g => {
    const lines = doc.splitTextToSize(g, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4.5;
  });

  footerAllPages(doc, ctx);
  return doc.output("blob");
}
