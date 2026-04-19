// ═══════════════════════════════════════════════════════════════
// DOCUMENT JOINT À LA CONVOCATION DU CONSEIL D'ADMINISTRATION
// Synthèse du compte financier — Modèle officiel M9-6
// Version professionnelle avec visuels pour membres du CA
// M9-6 2026 · Décret 2012-1246 (RGCP)
// ═══════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFFooters } from '@/lib/pdfUtils';

const BLEU: [number, number, number] = [37, 68, 120];
const BLEU_CLAIR: [number, number, number] = [220, 230, 245];
const VERT: [number, number, number] = [22, 163, 74];
const ROUGE: [number, number, number] = [220, 38, 38];
const ORANGE: [number, number, number] = [234, 138, 30];
const GRIS: [number, number, number] = [120, 120, 120];
const GRIS_CLAIR: [number, number, number] = [245, 247, 252];
const FOND_KPI: [number, number, number] = [248, 250, 255];

export interface HistoriqueRow {
  exercice: number;
  resultat: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  caf: number;
  jours_autonomie: number;
  reserves: number;
  taux_exec_charges: number;
  taux_exec_produits: number;
}

export interface DocumentCAData {
  etab: {
    nom: string; uai: string; exercice: number;
    ordonnateur?: string; agentComptable?: string; secretaireGeneral?: string;
    commune?: string; academie?: string; regionAcademique?: string;
    type?: string;
  };
  R: {
    resultatBudgetaire: number; resultatComptable: number;
    totalChargesSde: number; totalProduitsSdr: number;
    totalChargesPrev: number; totalProduitsPrev: number;
    tauxExecCharges: number; tauxExecProduits: number;
    cafBudgetaire: number; cafComptable: number;
    chargesNonDecaissables: number; produitsNonEncaissables: number;
    fdrComptable: number; bfr: number; tresorerie: number;
    joursFdr: number; joursTresorerie: number; joursAutonomie: number;
    drfn: number;
    fdrMobilisable: number; tmcap: number; tmnr: number;
    totalCreances: number; totalDettes: number;
    totalImmo: number; totalAmortissements: number; valeurNette: number;
    reserves: number; reservesSRH: number;
    parService: Record<string, { libelle: string; chargesPrev: number; chargesReel: number; produitsPrev: number; produitsReel: number; tauxExecution: number }>;
    chargesNature?: Record<string, number>;
    produitsOrigine?: Record<string, number>;
    prelevementsReserves?: { totalPrelevements: number };
    totalChargesSdeN1?: number; totalProduitsSdrN1?: number; resultatBudgetaireN1?: number;
    fdrPartEncaissee?: number; fdrPctEncaissee?: number;
    fdrPartNonEncaissee?: number; fdrPctNonEncaissee?: number;
    ratioAutonomieFinanciere?: number;
  };
  indicateurs?: {
    effectif_eleves?: number; effectif_dp?: number; effectif_internes?: number;
    nb_repas_servis?: number; cout_denrees_repas?: number;
  };
  commentaireOrdonnateur?: string;
  historique?: HistoriqueRow[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n).replace(/[\u202F\u00A0]/g, ' ');
}
function fmtDec(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n).replace(/[\u202F\u00A0]/g, ' ');
}
function pct(v: number): string {
  return `${(v * 100).toFixed(1)} %`;
}
function sanitize(s: string): string {
  return s.replace(/[^\x20-\x7E\u00C0-\u017F\u2013\u2014\u2019\u201C\u201D\u00AB\u00BB\u2026]/g, ' ');
}

// ── Rounded rect helper ──
function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: [number, number, number], stroke?: [number, number, number]) {
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.4);
  }
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
}

// ── KPI Card ──
function drawKpiCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, color: [number, number, number],
  subtitle?: string
) {
  // Card background
  roundedRect(doc, x, y, w, h, 2.5, [255, 255, 255], [225, 230, 240]);
  // Color accent bar on top
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, w, 2.5, 2.5, 2.5, 'F');
  doc.rect(x, y + 1.5, w, 1, 'F');

  // Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(sanitize(value), x + w / 2, y + h / 2 - (subtitle ? 2 : 0), { align: 'center' });

  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(sanitize(label), x + w / 2, y + h - 5, { align: 'center' });

  // Subtitle
  if (subtitle) {
    doc.setFontSize(6.5);
    doc.setTextColor(140);
    doc.text(sanitize(subtitle), x + w / 2, y + h / 2 + 4, { align: 'center' });
  }
}

// ── Gauge arc ──
function drawGauge(
  doc: jsPDF, cx: number, cy: number, radius: number,
  value: number, maxValue: number, label: string, color: [number, number, number]
) {
  const ratio = Math.min(Math.max(value / maxValue, 0), 1);

  // Background arc
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(3);
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const a1 = Math.PI + (Math.PI * i) / steps;
    const a2 = Math.PI + (Math.PI * (i + 1)) / steps;
    doc.setDrawColor(230, 230, 235);
    doc.line(
      cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2), cy + radius * Math.sin(a2)
    );
  }

  // Filled arc
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(3.5);
  const filledSteps = Math.round(steps * ratio);
  for (let i = 0; i < filledSteps; i++) {
    const a1 = Math.PI + (Math.PI * i) / steps;
    const a2 = Math.PI + (Math.PI * (i + 1)) / steps;
    doc.line(
      cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2), cy + radius * Math.sin(a2)
    );
  }

  // Center value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${value.toFixed(0)}`, cx, cy - 1, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100);
  doc.text('jours', cx, cy + 3, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(sanitize(label), cx, cy + radius + 6, { align: 'center' });
}

// ── Progress bar ──
function drawProgressBar(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  ratio: number, label: string, color: [number, number, number]
) {
  // Background
  doc.setFillColor(230, 233, 240);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
  // Fill
  const fillW = w * Math.min(Math.abs(ratio), 1);
  if (fillW > 1) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, Math.max(fillW, h), h, h / 2, h / 2, 'F');
  }
  // Percentage text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255);
  if (fillW > 20) {
    doc.text(pct(ratio), x + fillW - 3, y + h / 2 + 1.5, { align: 'right' });
  }
  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text(sanitize(label), x, y - 2);
}

// ── Section title with decorative line ──
function sectionTitle(doc: jsPDF, y: number, title: string, pw: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text(sanitize(title), 14, y);
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.5);
  doc.line(14, y + 1.5, pw - 14, y + 1.5);
  doc.setTextColor(0);
}

// ── Sparkline for historique ──
function drawSparkline(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  values: number[], color: [number, number, number], label: string
) {
  if (values.length < 2) return;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = mx - mn || 1;

  // Background
  roundedRect(doc, x, y, w, h + 12, 2, [255, 255, 255], [225, 230, 240]);

  // Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text(sanitize(label), x + 4, y + 7);

  // Current value
  const last = values[values.length - 1];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(fmt(last), x + w - 4, y + 7, { align: 'right' });

  // Line chart
  const chartY = y + 10;
  const chartH = h - 2;
  const chartX = x + 4;
  const chartW = w - 8;

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.8);
  for (let i = 0; i < values.length - 1; i++) {
    const x1 = chartX + (chartW * i) / (values.length - 1);
    const y1 = chartY + chartH - ((values[i] - mn) / range) * chartH;
    const x2 = chartX + (chartW * (i + 1)) / (values.length - 1);
    const y2 = chartY + chartH - ((values[i + 1] - mn) / range) * chartH;
    doc.line(x1, y1, x2, y2);
  }

  // Dots
  for (let i = 0; i < values.length; i++) {
    const px = chartX + (chartW * i) / (values.length - 1);
    const py = chartY + chartH - ((values[i] - mn) / range) * chartH;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(px, py, 1, 'F');
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN GENERATION
// ══════════════════════════════════════════════════════════════
export function generateDocumentCA(data: DocumentCAData): void {
  const { etab, R } = data;
  const doc = new jsPDF({ orientation: 'portrait' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ex = etab.exercice || new Date().getFullYear();
  const margin = 14;

  // ═══════════════════════════════════════════════════════════
  // PAGE 1 — COUVERTURE
  // ═══════════════════════════════════════════════════════════

  // Full-width blue header band
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 70, 'F');

  // Decorative diagonal accent
  doc.setFillColor(47, 88, 150);
  doc.triangle(pw - 60, 0, pw, 0, pw, 50, 'F');

  // Title text
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('COMPTE FINANCIER', pw / 2, 25, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Exercice ${ex}`, pw / 2, 36, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Document joint a la convocation du Conseil d\'Administration', pw / 2, 48, { align: 'center' });
  doc.setFontSize(8);
  doc.text('M9-6 - Decret 2012-1246 (RGCP)', pw / 2, 56, { align: 'center' });

  // Establishment info card
  const cardY = 82;
  roundedRect(doc, margin, cardY, pw - 2 * margin, 42, 3, [250, 252, 255], [200, 210, 230]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text(sanitize(etab.nom || 'Etablissement'), pw / 2, cardY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  const infoLine1 = `UAI : ${etab.uai || '-'}    |    ${etab.type || 'EPLE'}    |    ${etab.commune || ''}`;
  doc.text(sanitize(infoLine1), pw / 2, cardY + 24, { align: 'center' });
  const infoLine2 = `Academie : ${etab.academie || '-'}`;
  doc.text(sanitize(infoLine2), pw / 2, cardY + 32, { align: 'center' });

  // Key figures preview — 4 KPI cards
  const kpiY = 138;
  const kpiW = (pw - 2 * margin - 12) / 4;
  const kpiH = 30;
  const resultColor: [number, number, number] = R.resultatBudgetaire >= 0 ? VERT : ROUGE;
  const fdrColor: [number, number, number] = R.joursFdr >= 30 ? VERT : R.joursFdr >= 15 ? ORANGE : ROUGE;
  const tresoColor: [number, number, number] = R.tresorerie >= 0 ? VERT : ROUGE;

  drawKpiCard(doc, margin, kpiY, kpiW, kpiH, 'Resultat budgetaire', fmt(R.resultatBudgetaire), resultColor);
  drawKpiCard(doc, margin + kpiW + 4, kpiY, kpiW, kpiH, 'Fonds de roulement', fmt(R.fdrComptable), fdrColor);
  drawKpiCard(doc, margin + (kpiW + 4) * 2, kpiY, kpiW, kpiH, 'Tresorerie', fmt(R.tresorerie), tresoColor);
  drawKpiCard(doc, margin + (kpiW + 4) * 3, kpiY, kpiW, kpiH, 'CAF', fmt(R.cafBudgetaire), R.cafBudgetaire >= 0 ? VERT : ROUGE);

  // Signataires
  const sigY = 185;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('Equipe de direction', margin, sigY);
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY + 1.5, margin + 50, sigY + 1.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60);
  const sigCol1 = margin;
  const sigCol2 = margin + 65;
  doc.text(`Ordonnateur : ${sanitize(etab.ordonnateur || '-')}`, sigCol1, sigY + 9);
  doc.text(`Agent comptable : ${sanitize(etab.agentComptable || '-')}`, sigCol2, sigY + 9);
  doc.text(`Secretaire general : ${sanitize(etab.secretaireGeneral || '-')}`, sigCol1, sigY + 16);

  // Sommaire
  const somY = 215;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('Sommaire', margin, somY);
  doc.line(margin, somY + 1.5, margin + 30, somY + 1.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60);
  const sommaire = [
    ['1.', 'Execution budgetaire', '— Sphere ordonnateur', 'page 2'],
    ['2.', 'Taux d\'execution', '— Barres visuelles', 'page 2'],
    ['3.', 'Sante financiere', '— Sphere comptable', 'page 3'],
    ['4.', 'Jauges de securite', '— FDR / Tresorerie / Autonomie', 'page 3'],
    ['5.', 'Evolution pluriannuelle', '— Tendances N a N-4', 'page 4'],
    ['6.', 'Faits caracteristiques', '— Commentaire de l\'ordonnateur', 'page 4'],
  ];
  sommaire.forEach((row, i) => {
    const ly = somY + 9 + i * 6;
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 2, ly);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sanitize(row[1])}  ${sanitize(row[2])}`, margin + 8, ly);
    doc.text(row[3], pw - margin, ly, { align: 'right' });
    // Dot leader
    const tw = doc.getTextWidth(`${sanitize(row[1])}  ${sanitize(row[2])}`);
    const dotStart = margin + 8 + tw + 2;
    const dotEnd = pw - margin - doc.getTextWidth(row[3]) - 2;
    doc.setTextColor(180);
    let dotX = dotStart;
    while (dotX < dotEnd) {
      doc.text('.', dotX, ly);
      dotX += 1.8;
    }
    doc.setTextColor(60);
  });

  // ═══════════════════════════════════════════════════════════
  // PAGE 2 — SPHERE ORDONNATEUR
  // ═══════════════════════════════════════════════════════════
  doc.addPage();

  // Page header band
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 14, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. EXECUTION BUDGETAIRE — Sphere de l\'ordonnateur', margin, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${sanitize(etab.nom)} | Exercice ${ex}`, pw - margin, 9, { align: 'right' });
  doc.setTextColor(0);

  // Explanation text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100);
  doc.text('Synthese des depenses mandatees et recettes encaissees comparees aux previsions budgetaires.', margin, 22);
  doc.setTextColor(0);

  // Main budget table
  autoTable(doc, {
    startY: 28,
    head: [['Indicateur', `Exercice ${ex}`, `Exercice ${ex - 1}`, 'Variation']],
    body: [
      [
        'Credits ouverts (depenses)',
        fmtDec(R.totalChargesPrev),
        '-',
        '-',
      ],
      [
        'Depenses mandatees',
        fmtDec(R.totalChargesSde),
        fmtDec(R.totalChargesSdeN1 || 0),
        R.totalChargesSdeN1 ? fmt(R.totalChargesSde - R.totalChargesSdeN1) : '-',
      ],
      [
        'Credits ouverts (recettes)',
        fmtDec(R.totalProduitsPrev),
        '-',
        '-',
      ],
      [
        'Recettes encaissees',
        fmtDec(R.totalProduitsSdr),
        fmtDec(R.totalProduitsSdrN1 || 0),
        R.totalProduitsSdrN1 ? fmt(R.totalProduitsSdr - R.totalProduitsSdrN1) : '-',
      ],
      [
        { content: 'Resultat budgetaire', styles: { fontStyle: 'bold' } },
        { content: fmtDec(R.resultatBudgetaire), styles: { fontStyle: 'bold', textColor: R.resultatBudgetaire >= 0 ? VERT : ROUGE } },
        { content: fmtDec(R.resultatBudgetaireN1 || 0), styles: { fontStyle: 'bold' } },
        { content: R.resultatBudgetaireN1 ? fmt(R.resultatBudgetaire - R.resultatBudgetaireN1) : '-', styles: { fontStyle: 'bold' } },
      ],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  let ys = (doc as any).lastAutoTable.finalY + 6;

  // Result interpretation box
  const isExcedent = R.resultatBudgetaire >= 0;
  const interpColor: [number, number, number] = isExcedent ? [235, 250, 240] : [255, 240, 240];
  const interpBorder: [number, number, number] = isExcedent ? VERT : ROUGE;
  const interpText = isExcedent
    ? `L'exercice ${ex} se solde par un excedent budgetaire de ${fmtDec(R.resultatBudgetaire)}, temoin d'une gestion equilibree des credits.`
    : `L'exercice ${ex} se solde par un deficit budgetaire de ${fmtDec(Math.abs(R.resultatBudgetaire))}. Une attention particuliere est necessaire.`;

  roundedRect(doc, margin, ys, pw - 2 * margin, 14, 2, interpColor, interpBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(interpBorder[0], interpBorder[1], interpBorder[2]);
  doc.text(isExcedent ? 'Excedent' : 'Deficit', margin + 4, ys + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text(sanitize(interpText), margin + 4, ys + 10);

  // Section 2: Taux d'execution
  ys += 22;
  sectionTitle(doc, ys, '2. Taux d\'execution budgetaire', pw);
  ys += 8;

  const barW = pw - 2 * margin - 60;
  drawProgressBar(doc, margin + 55, ys, barW, 6, R.tauxExecCharges, 'Taux d\'execution des depenses', BLEU);
  ys += 16;
  drawProgressBar(doc, margin + 55, ys, barW, 6, R.tauxExecProduits, 'Taux d\'execution des recettes', [47, 130, 180]);
  ys += 14;

  // Execution by service
  const services = Object.values(R.parService || {});
  if (services.length > 0) {
    ys += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text('Detail par service/domaine :', margin, ys);
    ys += 3;

    autoTable(doc, {
      startY: ys,
      head: [['Service', 'Prev. Charges', 'Reel Charges', 'Prev. Produits', 'Reel Produits', 'Taux exec.']],
      body: services.map(s => [
        sanitize(s.libelle),
        fmt(s.chargesPrev),
        fmt(s.chargesReel),
        fmt(s.produitsPrev),
        fmt(s.produitsReel),
        `${(s.tauxExecution * 100).toFixed(1)} %`,
      ]),
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7, cellPadding: 2 },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: GRIS_CLAIR },
      margin: { left: margin, right: margin },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' },
        3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE 3 — SPHERE COMPTABLE
  // ═══════════════════════════════════════════════════════════
  doc.addPage();

  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 14, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. SANTE FINANCIERE — Sphere du comptable', margin, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${sanitize(etab.nom)} | Exercice ${ex}`, pw - margin, 9, { align: 'right' });
  doc.setTextColor(0);

  // 3 KPI cards in a row
  let yp = 22;
  const cardW3 = (pw - 2 * margin - 8) / 3;

  drawKpiCard(doc, margin, yp, cardW3, 28,
    'Fonds de roulement', fmtDec(R.fdrComptable), fdrColor,
    `${R.joursFdr.toFixed(1)} jours`);
  drawKpiCard(doc, margin + cardW3 + 4, yp, cardW3, 28,
    'Tresorerie nette', fmtDec(R.tresorerie), tresoColor,
    `${R.joursTresorerie.toFixed(1)} jours`);
  drawKpiCard(doc, margin + (cardW3 + 4) * 2, yp, cardW3, 28,
    'Besoin en fonds de roulement', fmtDec(R.bfr), R.bfr <= 0 ? VERT : ORANGE);

  yp += 36;

  // Detailed financial table
  autoTable(doc, {
    startY: yp,
    head: [['Indicateur comptable', 'Valeur', 'Appreciation']],
    body: [
      ['Resultat comptable', fmtDec(R.resultatComptable), R.resultatComptable >= 0 ? 'Favorable' : 'Defavorable'],
      ['Capacite d\'autofinancement (CAF)', fmtDec(R.cafBudgetaire), R.cafBudgetaire >= 0 ? 'Positive' : 'Negative'],
      ['Part encaissee du FDR', `${fmtDec(R.fdrPartEncaissee ?? 0)} (${(R.fdrPctEncaissee ?? 0).toFixed(1)} %)`, ''],
      ['Part non encaissee du FDR', `${fmtDec(R.fdrPartNonEncaissee ?? 0)} (${(R.fdrPctNonEncaissee ?? 0).toFixed(1)} %)`, ''],
      ['Autonomie financiere', `${((R.ratioAutonomieFinanciere ?? 0) * 100).toFixed(1)} %`, ''],
      ['TMcap (taux de mobilisation)', `${(R.tmcap ?? 0).toFixed(2)} %`, ''],
      ['TMnr (taux de non-recouvrement)', `${(R.tmnr ?? 0).toFixed(2)} %`, R.tmnr > 5 ? 'Eleve' : 'Normal'],
      ['Reserves', fmtDec(R.reserves), ''],
      ['Immobilisations nettes', fmtDec(R.valeurNette), ''],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { halign: 'right', cellWidth: 55 },
      2: { halign: 'center', fontStyle: 'italic' },
    },
    didParseCell(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const val = hookData.cell.raw as string;
        if (val === 'Favorable' || val === 'Positive' || val === 'Normal') {
          hookData.cell.styles.textColor = VERT;
        } else if (val === 'Defavorable' || val === 'Negative' || val === 'Eleve') {
          hookData.cell.styles.textColor = ROUGE;
        }
      }
    },
  });

  yp = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Gauges
  sectionTitle(doc, yp, '4. Jauges de securite financiere', pw);
  yp += 8;

  const gaugeSpacing = (pw - 2 * margin) / 3;
  drawGauge(doc, margin + gaugeSpacing * 0.5, yp + 18, 14,
    R.joursFdr, 90, 'Jours de FDR', fdrColor);
  drawGauge(doc, margin + gaugeSpacing * 1.5, yp + 18, 14,
    R.joursTresorerie, 90, 'Jours de tresorerie', tresoColor);
  drawGauge(doc, margin + gaugeSpacing * 2.5, yp + 18, 14,
    R.joursAutonomie, 90, 'Jours d\'autonomie',
    R.joursAutonomie >= 30 ? VERT : R.joursAutonomie >= 15 ? ORANGE : ROUGE);

  // Interpretation
  yp += 48;
  const fdrVerdict = R.joursFdr >= 30 ? 'confortable' : R.joursFdr >= 15 ? 'a surveiller' : 'insuffisant';
  const tresoVerdict = R.tresorerie >= 0 ? 'positive' : 'negative';
  const verdictColor: [number, number, number] = R.joursFdr >= 30 && R.tresorerie >= 0 ? [235, 250, 240] : [255, 248, 235];
  const verdictBorder: [number, number, number] = R.joursFdr >= 30 && R.tresorerie >= 0 ? VERT : ORANGE;

  roundedRect(doc, margin, yp, pw - 2 * margin, 16, 2, verdictColor, verdictBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(verdictBorder[0], verdictBorder[1], verdictBorder[2]);
  doc.text('Synthese :', margin + 4, yp + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  const synthText = `Le fonds de roulement s'etablit a ${R.joursFdr.toFixed(1)} jours (${fdrVerdict}). La tresorerie est ${tresoVerdict} a ${fmtDec(R.tresorerie)}. La CAF de ${fmtDec(R.cafBudgetaire)} ${R.cafBudgetaire >= 0 ? 'temoigne d\'une capacite d\'investissement' : 'appelle a la vigilance'}.`;
  doc.text(sanitize(synthText), margin + 4, yp + 11);

  // ═══════════════════════════════════════════════════════════
  // PAGE 4 — EVOLUTION & COMMENTAIRE
  // ═══════════════════════════════════════════════════════════
  doc.addPage();

  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 14, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. EVOLUTION PLURIANNUELLE', margin, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${sanitize(etab.nom)} | Exercices N a N-4`, pw - margin, 9, { align: 'right' });
  doc.setTextColor(0);

  let yh = 22;
  const hist = data.historique || [];

  if (hist.length >= 2) {
    const sparkW = (pw - 2 * margin - 8) / 2;
    const sparkH = 22;

    drawSparkline(doc, margin, yh, sparkW, sparkH,
      hist.map(h => h.fdr), BLEU, 'Fonds de roulement');
    drawSparkline(doc, margin + sparkW + 8, yh, sparkW, sparkH,
      hist.map(h => h.tresorerie), [47, 130, 180], 'Tresorerie');

    yh += sparkH + 18;
    drawSparkline(doc, margin, yh, sparkW, sparkH,
      hist.map(h => h.resultat), VERT, 'Resultat budgetaire');
    drawSparkline(doc, margin + sparkW + 8, yh, sparkW, sparkH,
      hist.map(h => h.caf), ORANGE, 'CAF');

    yh += sparkH + 18;

    // Historical data table
    autoTable(doc, {
      startY: yh,
      head: [['Exercice', 'Resultat', 'FDR', 'Tresorerie', 'CAF', 'Jours autonomie', 'Reserves']],
      body: hist.map(h => [
        String(h.exercice),
        fmt(h.resultat), fmt(h.fdr), fmt(h.tresorerie),
        fmt(h.caf), `${h.jours_autonomie.toFixed(1)}`, fmt(h.reserves),
      ]),
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7, cellPadding: 2 },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: GRIS_CLAIR },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' },
      },
    });

    yh = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text('Donnees pluriannuelles non disponibles (moins de 2 exercices importes).', margin, yh + 5);
    yh += 16;
  }

  // Section 6: Commentary
  if (yh > ph - 80) {
    doc.addPage();
    yh = 20;
  }
  sectionTitle(doc, yh, '6. Faits caracteristiques de l\'exercice', pw);
  yh += 6;

  const comment = data.commentaireOrdonnateur || 'Aucun commentaire saisi par l\'ordonnateur.';
  const commentLines = doc.splitTextToSize(sanitize(comment), pw - 2 * margin - 10);
  const commentH = Math.max(30, commentLines.length * 4 + 14);

  roundedRect(doc, margin, yh, pw - 2 * margin, commentH, 2, [252, 252, 255], [200, 210, 230]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('Observations de l\'ordonnateur :', margin + 5, yh + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50);
  doc.text(commentLines, margin + 5, yh + 14);

  // Signature block
  yh += commentH + 10;
  if (yh > ph - 40) {
    doc.addPage();
    yh = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(`Fait a ${sanitize(etab.commune || '...')}, le ${new Date().toLocaleDateString('fr-FR')}`, margin, yh);
  yh += 10;

  const sigWidth = (pw - 2 * margin - 10) / 2;
  // Ordonnateur
  roundedRect(doc, margin, yh, sigWidth, 22, 2, [250, 252, 255], [210, 220, 235]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('L\'ordonnateur', margin + 4, yh + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text(sanitize(etab.ordonnateur || '(Nom et signature)'), margin + 4, yh + 13);

  // Agent comptable
  roundedRect(doc, margin + sigWidth + 10, yh, sigWidth, 22, 2, [250, 252, 255], [210, 220, 235]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('L\'agent comptable', margin + sigWidth + 14, yh + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text(sanitize(etab.agentComptable || '(Nom et signature)'), margin + sigWidth + 14, yh + 13);

  // Add footers to all pages
  addPDFFooters(doc, `Document CA - ${sanitize(etab.nom)} - Exercice ${ex}`);

  doc.save(`Document_CA_${etab.uai || 'EPLE'}_${ex}.pdf`);
}
