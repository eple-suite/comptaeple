// ═══════════════════════════════════════════════════════════════
// PDF RAPPORT DE L'AGENT COMPTABLE — Document officiel
// Modèle officiel — M9-6 2026 · Décret 2012-1246
// Avec graphiques intégrés, visuels professionnels, radar, trend charts
// ═══════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PanierReprofi } from './compteFinancier/reprofiIndicateursEngine';
import type { SyntheseCommentaires } from './compteFinancier/commentairesEngine';
import { ajouterPageReprofi } from './compteFinancier/pdfReprofiBlock';

const BLEU = [0, 35, 149] as const;
const BLEU_CLAIR = [41, 98, 255] as const;
const ROUGE = [237, 41, 57] as const;
const GRIS = [100, 100, 100] as const;
const GRIS_CLAIR = [180, 180, 180] as const;
const VERT = [22, 163, 74] as const;
const ORANGE = [234, 88, 12] as const;
const JAUNE = [202, 138, 4] as const;
const BLANC = [255, 255, 255] as const;

interface RapportACData {
  etab: {
    nom: string; uai: string; exercice: number;
    agentComptable?: string; ordonnateur?: string; secretaireGeneral?: string;
    commune?: string; academie?: string; regionAcademique?: string;
    type?: string; adresse?: string; codePostal?: string;
  };
  R: {
    resultatBudgetaire: number; resultatComptable: number;
    totalChargesSde: number; totalProduitsSdr: number;
    totalChargesPrev: number; totalProduitsPrev: number;
    cafComptable: number; cafBudgetaire: number;
    chargesNonDecaissables: number; produitsNonEncaissables: number;
    fdrComptable: number; bfr: number; tresorerie: number;
    joursFdr: number; joursTresorerie: number;
    fdrPartEncaissee: number; fdrPartNonEncaissee: number;
    fdrPctEncaissee: number; fdrPctNonEncaissee: number;
    fdrMobilisable: number; drfn: number;
    tmcap: number; tmnr: number;
    totalCreances: number; totalDettes: number;
    creancesEtat: number; creancesCollectivite: number;
    creancesFamilles: number; creancesAutres: number;
    dettesFournisseurs: number; dettesEtat: number;
    dettesCollectivite: number; dettesAutres: number;
    reliquatsSubventions: number;
    totalImmo: number; totalAmortissements: number;
    valeurNette: number; variationPatrimoine: number;
    patrimoineOriginesFondsPropres: number; patrimoineOriginesPctFP: number;
    patrimoineOriginesSubventions: number; patrimoineOriginesPctSub: number;
    reserves: number; reservesSRH: number;
    dgpJours: number; dgrJours: number;
    tauxExecCharges: number; tauxExecProduits: number;
    prelevementsReserves: {
      totalPrelevements: number; prelevementsInvestissement: number;
      prelevementsFonctionnement: number; variationReserves: number;
    };
    ratioLiquiditeGenerale: number; ratioLiquiditeReduite: number;
    ratioLiquiditeImmediate: number; ratioAutonomieFinanciere: number;
    ratioSolvabilite: number; ratioEndettement: number;
    ratioChargesPersonnel: number; ratioCouvertureCharges: number;
    tresoComposition: {
      autonomieFinanciere: number; depotsCautions: number;
      reglementsEnAttente: number; reliquatsSubventions: number;
    };
  };
  saisieComplementaire: {
    prelevements: { objet: string; montant: number; dateCA: string }[];
    explicationsResultat: string;
    commentaireFDR: string;
    commentaireTresorerie: string;
    commentaireCreances: string;
    commentaireGeneral: string;
    commentaireBFR?: string;
    commentaireChargesRecouvrement?: string;
    commentairePatrimoine?: string;
    commentaireReserves?: string;
    commentaireRatios?: string;
    commentairePluriannuel?: string;
  };
  aiText: string;
  history: { exercice: number; fdr: number; bfr: number; tresorerie: number; caf: number; reserves: number; jours_autonomie: number; jours_tresorerie?: number; tmcap?: number; tmnr?: number; resultat?: number }[];
  nbAnom: number; nbBloq: number;
  /** Panier REPROFI 4.6 (10 indicateurs + 5 réserves) — optionnel. */
  panierReprofi?: PanierReprofi;
  /** Synthèse rédigée (verdict + paragraphes) à insérer avec le bloc REPROFI. */
  syntheseCommentaires?: SyntheseCommentaires;
}

/** Strip exotic Unicode that jsPDF cannot render */
function sanitize(s: string): string {
  return s
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/[═╔╗╚╝║╠╣╬─│┌┐└┘├┤┬┴┼☐☑☒Ø×÷←→↑↓≤≥≠≈∞∑∏√∫∂∆∇⊕⊗⊘⊙⊚⊛⊜⊝]/g, '')
    .replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ]/g, (c) => {
      const map: Record<string, string> = { 'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH' };
      return map[c] ?? c;
    })
    .replace(/[àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ]/g, (c) => {
      const map: Record<string, string> = { 'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y' };
      return map[c] ?? c;
    });
}

function fmt(n: number): string {
  return sanitize(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n));
}
function fmtK(n: number): string {
  if (Math.abs(n) >= 1000) return sanitize(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n));
  return fmt(n);
}
function pct(v: number, t: number): string {
  return t > 0 ? `${((v / t) * 100).toFixed(1)} %` : '--';
}

type RGB = readonly [number, number, number];

// ══════════════════════════════════════════════════════════════════
// DRAWING PRIMITIVES — Professional chart components
// ══════════════════════════════════════════════════════════════════

/** Rounded rectangle with gradient-like effect */
function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number, bgColor: RGB, borderColor?: RGB) {
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  if (borderColor) {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'S');
  }
}

/** KPI card with value, label, and optional trend */
function drawKpiCard(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, trend?: string, color: RGB = BLEU) {
  drawCard(doc, x, y, w, 22, [245, 247, 252], color);
  // Colored left stripe
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, 2, 22, 'F');
  // Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(value, x + 6, y + 9);
  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(sanitize(label), x + 6, y + 15);
  // Trend
  if (trend) {
    doc.setFontSize(6);
    doc.setTextColor(trend.startsWith('+') || trend.startsWith('hausse') ? VERT[0] : trend.startsWith('-') || trend.startsWith('baisse') ? ROUGE[0] : GRIS[0],
      trend.startsWith('+') || trend.startsWith('hausse') ? VERT[1] : trend.startsWith('-') || trend.startsWith('baisse') ? ROUGE[1] : GRIS[1],
      trend.startsWith('+') || trend.startsWith('hausse') ? VERT[2] : trend.startsWith('-') || trend.startsWith('baisse') ? ROUGE[2] : GRIS[2]);
    doc.text(sanitize(trend), x + 6, y + 19);
  }
  doc.setTextColor(0, 0, 0);
}

/** Professional horizontal bar chart */
function drawHBar(doc: jsPDF, x: number, y: number, width: number, height: number, value: number, maxValue: number, color: RGB, label: string, valueLabel: string) {
  const ratio = maxValue > 0 ? Math.min(Math.abs(value) / maxValue, 1) : 0;
  doc.setFillColor(235, 238, 245);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'F');
  const fillW = width * ratio;
  if (fillW > 2) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, fillW, height, 1.5, 1.5, 'F');
  }
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(sanitize(label), x, y - 1.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(valueLabel, x + width + 2, y + height - 0.5);
  doc.setTextColor(0, 0, 0);
}

/** Circular gauge with percentage arc */
function drawGauge(doc: jsPDF, cx: number, cy: number, radius: number, value: number, maxDays: number, label: string, color: RGB) {
  const pctVal = Math.min(Math.max(value, 0) / maxDays, 1);
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius);
  if (pctVal > 0) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(3);
    const segments = Math.floor(pctVal * 36);
    for (let i = 0; i < segments; i++) {
      const a1 = (-Math.PI / 2) + (i / 36) * 2 * Math.PI;
      const a2 = (-Math.PI / 2) + ((i + 1) / 36) * 2 * Math.PI;
      doc.line(cx + radius * Math.cos(a1), cy + radius * Math.sin(a1), cx + radius * Math.cos(a2), cy + radius * Math.sin(a2));
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${Math.round(value)}j`, cx, cy + 1.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(sanitize(label), cx, cy + radius + 5, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
}

/** Donut/Pie chart */
function drawDonut(doc: jsPDF, cx: number, cy: number, outerR: number, innerR: number, slices: { value: number; color: RGB; label: string }[]) {
  const total = slices.reduce((s, sl) => s + Math.abs(sl.value), 0);
  if (total === 0) return;
  let startAngle = -Math.PI / 2;
  for (const slice of slices) {
    const sweepAngle = (Math.abs(slice.value) / total) * 2 * Math.PI;
    doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);
    // Draw arc as polygon approximation
    const points: [number, number][] = [];
    const steps = Math.max(Math.ceil(sweepAngle / (Math.PI / 18)), 2);
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (i / steps) * sweepAngle;
      points.push([cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)]);
    }
    for (let i = steps; i >= 0; i--) {
      const a = startAngle + (i / steps) * sweepAngle;
      points.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
    }
    // Draw filled polygon
    if (points.length >= 3) {
      const lines: number[] = [];
      points.forEach(p => { lines.push(p[0]); lines.push(p[1]); });
      // Use triangle fan approach
      for (let i = 1; i < points.length - 1; i++) {
        doc.triangle(
          points[0][0], points[0][1],
          points[i][0], points[i][1],
          points[i + 1][0], points[i + 1][1],
          'F'
        );
      }
    }
    startAngle += sweepAngle;
  }
}

/** Mini sparkline / trend line chart */
function drawTrendLine(doc: jsPDF, x: number, y: number, w: number, h: number, values: number[], color: RGB, label: string, labels?: string[]) {
  if (values.length < 2) return;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  
  // Background
  doc.setFillColor(250, 251, 254);
  doc.roundedRect(x, y, w, h, 1, 1, 'F');
  doc.setDrawColor(230, 232, 240);
  doc.setLineWidth(0.15);
  doc.roundedRect(x, y, w, h, 1, 1, 'S');
  
  // Grid lines
  doc.setDrawColor(235, 237, 245);
  doc.setLineWidth(0.1);
  for (let i = 1; i < 4; i++) {
    const gy = y + (h * i) / 4;
    doc.line(x + 2, gy, x + w - 2, gy);
  }
  
  // Zero line if range crosses zero
  if (minV < 0 && maxV > 0) {
    const zeroY = y + h - ((0 - minV) / range) * (h - 8) - 4;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(x + 2, zeroY, x + w - 2, zeroY);
  }
  
  // Plot line
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.8);
  const stepX = (w - 10) / (values.length - 1);
  const points: [number, number][] = values.map((v, i) => [
    x + 5 + i * stepX,
    y + h - ((v - minV) / range) * (h - 12) - 6
  ]);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  
  // Dots
  for (const pt of points) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(pt[0], pt[1], 1, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(pt[0], pt[1], 0.5, 'F');
  }
  
  // Labels below
  if (labels) {
    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    labels.forEach((l, i) => {
      if (i < points.length) doc.text(l, points[i][0], y + h + 3, { align: 'center' });
    });
  }
  
  // Title
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(sanitize(label), x + 3, y - 1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
}

/** Stacked bar */
function drawStackedBar(doc: jsPDF, x: number, y: number, w: number, h: number, parts: { value: number; color: RGB; label: string }[], total: number) {
  doc.setFillColor(235, 238, 245);
  doc.roundedRect(x, y, w, h, 1, 1, 'F');
  let cx = x;
  for (const p of parts) {
    const pw = total > 0 ? (Math.abs(p.value) / total) * w : 0;
    if (pw > 1) {
      doc.setFillColor(p.color[0], p.color[1], p.color[2]);
      doc.rect(cx, y, pw, h, 'F');
    }
    cx += pw;
  }
  let lx = x;
  doc.setFontSize(5.5);
  for (const p of parts) {
    const pctV = total > 0 ? ((Math.abs(p.value) / total) * 100).toFixed(0) : '0';
    doc.setFillColor(p.color[0], p.color[1], p.color[2]);
    doc.rect(lx, y + h + 2, 3, 2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(`${sanitize(p.label)} (${pctV}%)`, lx + 4, y + h + 3.5);
    lx += 38;
  }
}

/** Traffic light indicator */
function drawTrafficLight(doc: jsPDF, x: number, y: number, value: number, thresholds: { green: number; yellow: number }, label: string, unit: string = '') {
  const color: RGB = value >= thresholds.green ? VERT : value >= thresholds.yellow ? JAUNE : ROUGE;
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x + 4, y + 4, 3.5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 4, y + 4, 1.5, 'F');
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x + 4, y + 4, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}${unit}`, x + 11, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text(sanitize(label), x + 11, y + 9);
  doc.setTextColor(0, 0, 0);
}

/** Waterfall-style comparison bars (vertical) */
function drawComparisonBars(doc: jsPDF, x: number, y: number, w: number, h: number, items: { label: string; value: number; color: RGB }[]) {
  const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1);
  const barW = Math.min((w - 8) / items.length - 3, 20);
  const startX = x + (w - items.length * (barW + 3)) / 2;
  
  // Baseline
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(x, y + h, x + w, y + h);
  
  items.forEach((item, i) => {
    const bx = startX + i * (barW + 3);
    const barH = (Math.abs(item.value) / maxVal) * (h - 4);
    const by = item.value >= 0 ? y + h - barH : y + h;
    
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    if (barH > 1) doc.roundedRect(bx, by, barW, barH, 1, 1, 'F');
    
    // Value on top
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(fmtK(item.value), bx + barW / 2, item.value >= 0 ? by - 2 : by + barH + 4, { align: 'center' });
    
    // Label below
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(80, 80, 80);
    doc.text(sanitize(item.label), bx + barW / 2, y + h + 5, { align: 'center' });
  });
  doc.setTextColor(0, 0, 0);
}


// ══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════

export function generateRapportACPdf(data: RapportACData) {
  const { etab, R, saisieComplementaire: saisie, aiText, history, nbAnom, nbBloq } = data;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pw - 2 * margin;
  const colHalf = (contentWidth - 4) / 2;

  // Sort history chronologically
  const sortedHistory = [...history].sort((a, b) => a.exercice - b.exercice);
  // Include current year in history for charts if not already there
  const currentInHistory = sortedHistory.find(h => h.exercice === etab.exercice);
  const fullHistory = currentInHistory ? sortedHistory : [
    ...sortedHistory,
    { exercice: etab.exercice, fdr: R.fdrComptable, bfr: R.bfr, tresorerie: R.tresorerie, caf: R.cafComptable, reserves: R.reserves, jours_autonomie: R.joursFdr, jours_tresorerie: R.joursTresorerie, tmcap: R.tmcap, tmnr: R.tmnr, resultat: R.resultatComptable }
  ];
  const histLabels = fullHistory.map(h => String(h.exercice));

  // ════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ════════════════════════════════════════════════════════════
  // Tricolore top
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw / 3, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(pw / 3, 0, pw / 3, 8, 'F');
  doc.setFillColor(ROUGE[0], ROUGE[1], ROUGE[2]);
  doc.rect((2 * pw) / 3, 0, pw / 3, 8, 'F');

  // Blue header band
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 18, pw, 48, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT FINANCIER', pw / 2, 36, { align: 'center' });
  doc.setFontSize(14);
  doc.text("DE L'AGENT COMPTABLE", pw / 2, 44, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`COMPTE FINANCIER -- EXERCICE ${etab.exercice}`, pw / 2, 56, { align: 'center' });

  let y = 80;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(etab.nom || 'Etablissement'), pw / 2, y, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`RNE : ${etab.uai}`, pw / 2, y, { align: 'center' });
  if (etab.adresse) { y += 6; doc.text(sanitize(etab.adresse), pw / 2, y, { align: 'center' }); }
  if (etab.codePostal || etab.commune) { y += 6; doc.text(sanitize(`${etab.codePostal || ''} ${etab.commune || ''}`), pw / 2, y, { align: 'center' }); }
  if (etab.academie) { y += 6; doc.text(sanitize(`Academie de ${etab.academie}`), pw / 2, y, { align: 'center' }); }

  // KPI strip on cover page
  y += 15;
  const kpiW = (contentWidth - 12) / 4;
  const fdrTrend = fullHistory.length >= 2 ? `${fullHistory[fullHistory.length - 1].fdr >= fullHistory[fullHistory.length - 2].fdr ? '+' : '-'} vs ${fullHistory[fullHistory.length - 2].exercice}` : undefined;
  drawKpiCard(doc, margin, y, kpiW, 'Fonds de roulement', fmtK(R.fdrComptable), fdrTrend, R.fdrComptable >= 0 ? BLEU : ROUGE);
  drawKpiCard(doc, margin + kpiW + 4, y, kpiW, 'Tresorerie nette', fmtK(R.tresorerie), `${R.joursTresorerie.toFixed(2)} jours`, R.tresorerie >= 0 ? VERT : ROUGE);
  drawKpiCard(doc, margin + 2 * (kpiW + 4), y, kpiW, R.cafComptable >= 0 ? 'CAF' : 'IAF', fmtK(R.cafComptable), undefined, R.cafComptable >= 0 ? VERT : ROUGE);
  drawKpiCard(doc, margin + 3 * (kpiW + 4), y, kpiW, 'Resultat', fmtK(R.resultatComptable), undefined, R.resultatComptable >= 0 ? BLEU : ROUGE);

  y += 32;
  // Regulatory box
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('CADRE REGLEMENTAIRE', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Instruction codificatrice M9-6 -- OP@LE du 19 janvier 2026', margin + 5, y + 11);
  doc.text("Decret n. 2012-1246 du 7 novembre 2012 (RGCP) -- Art. 195-199 / Code de l'Education Art. R421-68+", margin + 5, y + 16);

  y += 28;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(sanitize(`Ordonnateur : ${etab.ordonnateur || '--'}`), margin, y);
  doc.text(sanitize(`Agent comptable : ${etab.agentComptable || '--'}`), pw / 2, y);
  if (etab.secretaireGeneral) { y += 6; doc.text(sanitize(`Secretaire general(e) : ${etab.secretaireGeneral}`), margin, y); }

  // ════════════════════════════════════════════════════════════
  // PAGE SOMMAIRE (page dédiée — 2 colonnes)
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  // Blue header band
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SOMMAIRE', pw / 2, 11, { align: 'center' });

  y = 30;
  doc.setTextColor(0, 0, 0);
  const sommaire = [
    { num: '1', title: 'Resultat de l\'exercice et autofinancement' },
    { num: '2', title: 'Analyse du fonds de roulement' },
    { num: '3', title: 'Besoin en fonds de roulement' },
    { num: '4', title: 'Analyse de la tresorerie' },
    { num: '5', title: 'Charges a payer et recouvrement' },
    { num: '6', title: 'Etat du patrimoine' },
    { num: '7', title: 'Etat des creances et des dettes' },
    { num: '8', title: 'Reserves et affectation du resultat' },
    { num: '9', title: 'Ratios de gestion (M9-6 S IV)' },
    { num: '10', title: 'Evolution pluriannuelle (Piece 14)' },
    { num: '11', title: 'Observations de l\'agent comptable' },
  ];
  // 2-column layout
  const somColW = (contentWidth - 10) / 2;
  const leftCol = sommaire.slice(0, 6);
  const rightCol = sommaire.slice(6);
  const drawSomItem = (s: { num: string; title: string }, sx: number, sy: number) => {
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.circle(sx + 2, sy - 1.5, 1.5, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(s.num + '.', sx + 7, sy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(s.title, sx + 18, sy);
    // Dotted leader
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    const titleW = doc.getTextWidth(s.title);
    const dotStart = sx + 18 + titleW + 3;
    const dotEnd = sx + somColW;
    for (let dx = dotStart; dx < dotEnd; dx += 2) {
      doc.line(dx, sy - 0.5, dx + 0.5, sy - 0.5);
    }
  };
  leftCol.forEach((s, i) => drawSomItem(s, margin, y + i * 14));
  rightCol.forEach((s, i) => drawSomItem(s, margin + somColW + 10, y + i * 14));
  // Decorative vertical separator
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.3);
  doc.line(margin + somColW + 5, y - 5, margin + somColW + 5, y + Math.max(leftCol.length, rightCol.length) * 14 - 5);
  // Regulatory note at bottom of TOC page
  const tocBottomY = y + Math.max(leftCol.length, rightCol.length) * 14 + 15;
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(margin, tocBottomY, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce rapport est etabli en application de la M9-6 -- OP@LE (19 janvier 2026)', margin + 5, tocBottomY + 7);
  doc.text('Il presente la situation comptable et financiere a la cloture de l\'exercice.', margin + 5, tocBottomY + 12);

  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════
  /** Ensures section header + content block starts on a page with enough room.
   *  If remaining space < neededAfter, forces a new page. */
  function sectionHeader(title: string, currentY: number = ph, neededAfter: number = 80): number {
    if (currentY > ph - neededAfter) {
      doc.addPage();
      doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.rect(0, 0, pw, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(title.toUpperCase()), pw / 2, 8, { align: 'center' });
      return 18;
    }
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitize(title.toUpperCase()), pw / 2, currentY + 6.5, { align: 'center' });
    return currentY + 14;
  }

  function subTitle(y: number, text: string): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(sanitize(text), margin, y);
    doc.setTextColor(0, 0, 0);
    return y + 5;
  }

  function wrapText(y: number, text: string, maxY: number = ph - 20): number {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(sanitize(text), contentWidth);
    for (const line of lines) {
      if (y > maxY) { doc.addPage(); y = 18; }
      doc.text(line, margin, y);
      y += 4;
    }
    return y + 2;
  }

  function checkNewPage(y: number, needed: number): number {
    if (y + needed > ph - 20) { doc.addPage(); return 18; }
    return y;
  }

  /** Comment box for each section — auto-sizes to comment length, ALWAYS on same page as its content */
  function drawCommentBox(currentY: number, sectionLabel: string, existingComment?: string): number {
    const hasComment = existingComment && existingComment.trim();
    // Estimate height needed
    let boxH = 16;
    let commentLines: string[] = [];
    if (hasComment) {
      doc.setFontSize(7);
      commentLines = doc.splitTextToSize(sanitize(existingComment!), contentWidth - 6);
      boxH = Math.max(16, 8 + commentLines.length * 3.5 + 4);
    }
    // Ensure box fits on current page
    currentY = checkNewPage(currentY, boxH + 4);
    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.3);
    doc.setFillColor(252, 252, 255);
    doc.roundedRect(margin, currentY, contentWidth, boxH, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(sanitize(`Commentaire -- ${sectionLabel}`), margin + 3, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    if (hasComment) {
      commentLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 3, currentY + 8 + i * 3.5);
      });
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text('(A completer par l\'agent comptable)', margin + 3, currentY + 9);
    }
    doc.setTextColor(0, 0, 0);
    return currentY + boxH + 4;
  }
  // ════════════════════════════════════════════════════════════
  // S1. RESULTAT ET AUTOFINANCEMENT
  // ════════════════════════════════════════════════════════════
  let ys = sectionHeader('1. Resultat de l\'exercice et autofinancement', ph, 120);

  // Two-column layout: table left, chart right
  autoTable(doc, {
    startY: ys,
    head: [['Element', 'Montant']],
    body: [
      ['Charges nettes (cl. 6)', fmt(R.totalChargesSde)],
      ['Produits nets (cl. 7)', fmt(R.totalProduitsSdr)],
      ['RESULTAT COMPTABLE', fmt(R.resultatComptable)],
      ['Charges non decaissables (68+675)', fmt(R.chargesNonDecaissables)],
      ['Produits non encaissables (78+775...)', fmt(R.produitsNonEncaissables)],
      [R.cafComptable >= 0 ? 'CAF' : 'IAF', fmt(R.cafComptable)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
    didParseCell: (d: any) => {
      if (d.section === 'body' && (d.row.index === 2 || d.row.index === 5)) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = d.row.index === 2
          ? (R.resultatComptable >= 0 ? [220, 245, 220] : [255, 225, 225])
          : (R.cafComptable >= 0 ? [220, 245, 220] : [255, 225, 225]);
      }
    },
  });
  const tableBottom = (doc as any).lastAutoTable.finalY;

  // Chart: Charges vs Produits comparison bars (right side)
  const chartX = margin + colHalf + 8;
  const chartW = colHalf - 4;
  drawComparisonBars(doc, chartX, ys, chartW, 35, [
    { label: 'Charges', value: R.totalChargesSde, color: ROUGE },
    { label: 'Produits', value: R.totalProduitsSdr, color: VERT },
    { label: 'Resultat', value: R.resultatComptable, color: R.resultatComptable >= 0 ? BLEU : ROUGE },
    { label: R.cafComptable >= 0 ? 'CAF' : 'IAF', value: R.cafComptable, color: R.cafComptable >= 0 ? VERT : ORANGE },
  ]);

  ys = Math.max(tableBottom, ys + 45) + 5;

  // Trend line if history
  if (fullHistory.length >= 2) {
    ys = checkNewPage(ys, 35);
    drawTrendLine(doc, margin, ys, colHalf, 25, fullHistory.map(h => h.resultat ?? 0), BLEU, 'Tendance du resultat', histLabels);
    drawTrendLine(doc, margin + colHalf + 8, ys, colHalf - 4, 25, fullHistory.map(h => h.caf), R.cafComptable >= 0 ? VERT : ROUGE, 'Tendance CAF/IAF', histLabels);
    ys += 33;
  }

  // Prelevements
  if (saisie.prelevements.length > 0) {
    ys = checkNewPage(ys, 35);
    ys = subTitle(ys, 'Prelevements sur fonds de roulement autorises par le CA');
    const totalPrelev = saisie.prelevements.reduce((s, p) => s + p.montant, 0);
    autoTable(doc, {
      startY: ys,
      head: [['Objet', 'Montant', 'Date du CA']],
      body: [
        ...saisie.prelevements.map(p => [sanitize(p.objet), fmt(p.montant), p.dateCA]),
        ['TOTAL PRELEVE', fmt(totalPrelev), ''],
      ],
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
      styles: { fontSize: 7.5 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
    });
    ys = (doc as any).lastAutoTable.finalY + 3;
  }
  ys = drawCommentBox(ys, 'Resultat et autofinancement', saisie.explicationsResultat);

  // ════════════════════════════════════════════════════════════
  // S2. FONDS DE ROULEMENT
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('2. Analyse du fonds de roulement', ys, 110);

  // KPI strip
  const fdrKpiW = (contentWidth - 8) / 3;
  drawKpiCard(doc, margin, ys, fdrKpiW, 'FDR comptable', fmtK(R.fdrComptable), undefined, R.fdrComptable >= 0 ? BLEU : ROUGE);
  drawKpiCard(doc, margin + fdrKpiW + 4, ys, fdrKpiW, 'Jours de fonctionnement', `${R.joursFdr.toFixed(2)} jours`, R.joursFdr >= 30 ? 'Superieur au seuil de 30j' : 'INFERIEUR au seuil de 30j', R.joursFdr >= 30 ? VERT : ROUGE);
  drawKpiCard(doc, margin + 2 * (fdrKpiW + 4), ys, fdrKpiW, 'FDR mobilisable', fmtK(R.fdrMobilisable), undefined, BLEU);
  ys += 28;

  // Table + gauges side by side
  autoTable(doc, {
    startY: ys,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['FDR comptable (par le bas)', fmt(R.fdrComptable)],
      ['Part encaissee (autonomie financiere)', `${fmt(R.fdrPartEncaissee)} (${R.fdrPctEncaissee.toFixed(1)} %)`],
      ['Part non encaissee (creances)', `${fmt(R.fdrPartNonEncaissee)} (${R.fdrPctNonEncaissee.toFixed(1)} %)`],
      ['FDR mobilisable', fmt(R.fdrMobilisable)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
  });
  const fdrTableBottom = (doc as any).lastAutoTable.finalY;

  // Gauges on right
  const fdrColor: RGB = R.joursFdr >= 30 ? VERT : (R.joursFdr >= 15 ? ORANGE : ROUGE);
  const tresoColor: RGB = R.joursTresorerie >= 20 ? VERT : (R.joursTresorerie >= 10 ? ORANGE : ROUGE);
  drawGauge(doc, chartX + 30, ys + 15, 11, R.joursFdr, 120, 'Jours FDR', fdrColor);
  drawGauge(doc, chartX + chartW - 30, ys + 15, 11, R.joursTresorerie, 300, 'Jours Treso', tresoColor);

  ys = Math.max(fdrTableBottom, ys + 38) + 5;

  // Composition stacked bar
  ys = subTitle(ys, 'Composition du FDR');
  ys += 1;
  drawStackedBar(doc, margin, ys, contentWidth * 0.7, 5,
    [
      { value: R.fdrPartEncaissee, color: BLEU, label: 'Encaissee' },
      { value: R.fdrPartNonEncaissee, color: ORANGE, label: 'Non encaissee' },
    ],
    Math.abs(R.fdrComptable) || 1
  );
  ys += 14;

  // Trend
  if (fullHistory.length >= 2) {
    drawTrendLine(doc, margin, ys, contentWidth * 0.45, 22, fullHistory.map(h => h.fdr), BLEU, 'Evolution du FDR', histLabels);
    drawTrendLine(doc, margin + contentWidth * 0.5, ys, contentWidth * 0.45, 22, fullHistory.map(h => h.jours_autonomie), fdrColor, 'Evolution jours FDR', histLabels);
    ys += 30;
  }

  ys = drawCommentBox(ys, 'Fonds de roulement', saisie.commentaireFDR);

  // ════════════════════════════════════════════════════════════
  // S3. BFR
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('3. Besoin en fonds de roulement', ys, 90);
  autoTable(doc, {
    startY: ys,
    head: [['Element', 'Montant']],
    body: [
      ['Creances (cl.4 debit)', fmt(R.totalCreances)],
      ['Dettes (cl.4 credit)', fmt(R.totalDettes)],
      [R.bfr < 0 ? 'DEGAGEMENT EN FONDS DE ROULEMENT' : 'BESOIN EN FONDS DE ROULEMENT', fmt(R.bfr)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.row.index === 2) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = R.bfr < 0 ? [220, 245, 220] : [255, 240, 220];
      }
    },
  });
  const bfrTableBot = (doc as any).lastAutoTable.finalY;

  // Equation FDR = BFR + TN (bar chart right)
  drawComparisonBars(doc, chartX, ys, chartW, 28, [
    { label: 'FDR', value: R.fdrComptable, color: BLEU },
    { label: 'BFR', value: R.bfr, color: R.bfr < 0 ? VERT : ORANGE },
    { label: 'Tresorerie', value: R.tresorerie, color: BLEU_CLAIR },
  ]);

  ys = Math.max(bfrTableBot, ys + 38) + 3;
  ys = wrapText(ys,
    R.bfr < 0
      ? `Le BFR negatif (${fmt(R.bfr)}) constitue un degagement en fonds de roulement, situation classique des EPLE. Relation FDR = BFR + Tresorerie verifiee : ${fmt(R.fdrComptable)} = ${fmt(R.bfr)} + ${fmt(R.tresorerie)}.`
      : `Le BFR positif (${fmt(R.bfr)}) indique que les creances excedent les dettes d'exploitation.`
  );
  ys = drawCommentBox(ys, 'Besoin en fonds de roulement', saisie.commentaireBFR);

  // ════════════════════════════════════════════════════════════
  // S4. TRESORERIE
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('4. Analyse de la tresorerie', ys, 100);

  // Composition table + donut chart
  autoTable(doc, {
    startY: ys,
    head: [['Composante', 'Montant', '% Tresorerie']],
    body: [
      ['Autonomie financiere', fmt(R.tresoComposition.autonomieFinanciere), pct(Math.abs(R.tresoComposition.autonomieFinanciere), Math.abs(R.tresorerie))],
      ['Depots et cautions', fmt(R.tresoComposition.depotsCautions), pct(R.tresoComposition.depotsCautions, Math.abs(R.tresorerie))],
      ['Reglements en attente', fmt(R.tresoComposition.reglementsEnAttente), pct(R.tresoComposition.reglementsEnAttente, Math.abs(R.tresorerie))],
      ['Reliquats de subventions', fmt(R.tresoComposition.reliquatsSubventions), pct(R.tresoComposition.reliquatsSubventions, Math.abs(R.tresorerie))],
      ['TRESORERIE TOTALE', fmt(R.tresorerie), '100 %'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.row.index === 4) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = [240, 243, 248];
      }
    },
  });
  const tresoTabBot = (doc as any).lastAutoTable.finalY;

  // Donut on right
  const donutCx = chartX + chartW / 2;
  const donutCy = ys + 18;
  drawDonut(doc, donutCx, donutCy, 14, 8, [
    { value: Math.abs(R.tresoComposition.autonomieFinanciere), color: BLEU, label: 'Autonomie' },
    { value: R.tresoComposition.depotsCautions, color: VERT, label: 'Depots' },
    { value: R.tresoComposition.reglementsEnAttente, color: ORANGE, label: 'En attente' },
    { value: R.tresoComposition.reliquatsSubventions, color: ROUGE, label: 'Reliquats' },
  ]);
  // Donut center label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text(fmtK(R.tresorerie), donutCx, donutCy + 1, { align: 'center' });
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Tresorerie', donutCx, donutCy + 5, { align: 'center' });

  ys = Math.max(tresoTabBot, ys + 42) + 3;
  ys = wrapText(ys, `La tresorerie nette s'eleve a ${fmt(R.tresorerie)}, soit ${R.joursTresorerie.toFixed(2)} jours de fonctionnement.`);
  if (saisie.commentaireTresorerie) ys = wrapText(ys, saisie.commentaireTresorerie);

  // Trend
  if (fullHistory.length >= 2) {
    ys = checkNewPage(ys, 30);
    drawTrendLine(doc, margin, ys, contentWidth * 0.45, 22, fullHistory.map(h => h.tresorerie), VERT, 'Evolution tresorerie', histLabels);
    drawTrendLine(doc, margin + contentWidth * 0.5, ys, contentWidth * 0.45, 22, fullHistory.map(h => h.jours_tresorerie ?? 0), BLEU_CLAIR, 'Jours de tresorerie', histLabels);
    ys += 30;
  }
  ys = drawCommentBox(ys, 'Tresorerie', saisie.commentaireTresorerie);

  // ════════════════════════════════════════════════════════════
  // S5. TMCAP / TMNR
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('5. Charges a payer et recouvrement', ys, 100);

  // Traffic lights + table
  drawTrafficLight(doc, margin, ys, R.tmcap, { green: 0, yellow: 10 }, 'TMcap (charges a payer)', '%');
  drawTrafficLight(doc, margin + 70, ys, R.tmnr, { green: 0, yellow: 10 }, 'TMNR (non-recouvrement)', '%');
  drawTrafficLight(doc, margin + 140, ys, Math.round(R.dgpJours), { green: 0, yellow: 30 }, 'DGP (delai paiement)', 'j');
  drawTrafficLight(doc, margin + 210, ys, Math.round(R.dgrJours), { green: 0, yellow: 60 }, 'DGR (delai recouvrement)', 'j');
  ys += 18;

  autoTable(doc, {
    startY: ys,
    head: [['Indicateur', 'Valeur', 'Interpretation']],
    body: [
      ['TMcap (charges a payer / charges)', `${R.tmcap.toFixed(2)} %`, R.tmcap < 5 ? 'Solvabilite correcte' : R.tmcap < 15 ? 'Normal en cloture d\'exercice' : 'A surveiller'],
      ['TMnr (non-recouvrement)', `${R.tmnr.toFixed(2)} %`, R.tmnr < 5 ? 'Recouvrement satisfaisant' : 'Diligences necessaires'],
      ['DGP (delai global paiement)', `${Math.round(R.dgpJours)} jours`, R.dgpJours <= 30 ? 'Conforme (<=30j)' : '> 30 jours -- attention'],
      ['DGR (delai global recouvrement)', `${Math.round(R.dgrJours)} jours`, R.dgrJours <= 60 ? 'Delai acceptable' : '> 60 jours -- attention'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;

  if (fullHistory.length >= 2) {
    drawTrendLine(doc, margin, ys, colHalf, 20, fullHistory.map(h => h.tmcap ?? 0), ORANGE, 'Evolution TMcap (%)', histLabels);
    drawTrendLine(doc, margin + colHalf + 8, ys, colHalf - 4, 20, fullHistory.map(h => h.tmnr ?? 0), ROUGE, 'Evolution TMNR (%)', histLabels);
    ys += 28;
  }
  ys = drawCommentBox(ys, 'Charges a payer et recouvrement', saisie.commentaireChargesRecouvrement);

  // ════════════════════════════════════════════════════════════
  // S6. PATRIMOINE
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('6. Etat du patrimoine', ys, 90);
  autoTable(doc, {
    startY: ys,
    head: [['Element', 'Montant']],
    body: [
      ['Immobilisations brutes (cl. 2)', fmt(R.totalImmo)],
      ['Amortissements cumules (c/28)', `- ${fmt(R.totalAmortissements)}`],
      ['VALEUR RESIDUELLE', fmt(R.valeurNette)],
      ['Variation annuelle', fmt(R.variationPatrimoine)],
      [`Origines -- Fonds propres (${R.patrimoineOriginesPctFP.toFixed(1)} %)`, fmt(R.patrimoineOriginesFondsPropres)],
      [`Origines -- Subventions d'investissement (${R.patrimoineOriginesPctSub.toFixed(1)} %)`, fmt(R.patrimoineOriginesSubventions)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.row.index === 2) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = [240, 243, 248];
      }
    },
  });
  const patriTableBot = (doc as any).lastAutoTable.finalY;

  // Donut patrimoine
  if (R.totalImmo > 0) {
    drawDonut(doc, chartX + chartW / 2, ys + 20, 14, 8, [
      { value: R.patrimoineOriginesFondsPropres, color: BLEU, label: 'FP' },
      { value: R.patrimoineOriginesSubventions, color: VERT, label: 'Sub' },
    ]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(fmtK(R.valeurNette), chartX + chartW / 2, ys + 21, { align: 'center' });
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Valeur nette', chartX + chartW / 2, ys + 25, { align: 'center' });
  }
  ys = Math.max(patriTableBot, ys + 45) + 3;
  ys = drawCommentBox(ys, 'Patrimoine', saisie.commentairePatrimoine);

  // ════════════════════════════════════════════════════════════
  // S7. CREANCES ET DETTES
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('7. Etat des creances et des dettes', ys, 100);

  // Créances table (left)
  ys = subTitle(ys, 'Creances');
  const creancesBody: string[][] = [];
  if (R.creancesEtat > 0) creancesBody.push(['Etat', fmt(R.creancesEtat), pct(R.creancesEtat, R.totalCreances)]);
  if (R.creancesCollectivite > 0) creancesBody.push(['Collectivite', fmt(R.creancesCollectivite), pct(R.creancesCollectivite, R.totalCreances)]);
  if (R.creancesFamilles > 0) creancesBody.push(['Familles', fmt(R.creancesFamilles), pct(R.creancesFamilles, R.totalCreances)]);
  if (R.creancesAutres > 0) creancesBody.push(['Autres', fmt(R.creancesAutres), pct(R.creancesAutres, R.totalCreances)]);
  creancesBody.push(['TOTAL', fmt(R.totalCreances), '100 %']);
  autoTable(doc, {
    startY: ys,
    head: [['Origine', 'Montant', '%']],
    body: creancesBody,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
  });
  const creancesBot = (doc as any).lastAutoTable.finalY;

  // Dettes table (right)
  const dettesBody: string[][] = [];
  if (R.dettesFournisseurs > 0) dettesBody.push(['Fournisseurs', fmt(R.dettesFournisseurs), pct(R.dettesFournisseurs, R.totalDettes)]);
  if (R.dettesEtat > 0) dettesBody.push(['Etat', fmt(R.dettesEtat), pct(R.dettesEtat, R.totalDettes)]);
  if (R.dettesCollectivite > 0) dettesBody.push(['Collectivite', fmt(R.dettesCollectivite), pct(R.dettesCollectivite, R.totalDettes)]);
  if (R.dettesAutres > 0) dettesBody.push(['Autres', fmt(R.dettesAutres), pct(R.dettesAutres, R.totalDettes)]);
  dettesBody.push(['TOTAL', fmt(R.totalDettes), '100 %']);
  autoTable(doc, {
    startY: ys,
    head: [['Type', 'Montant', '%']],
    body: dettesBody,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin + colHalf + 8, right: margin },
  });
  ys = Math.max(creancesBot, (doc as any).lastAutoTable.finalY) + 5;

  // Comparison bars
  ys = checkNewPage(ys, 25);
  const maxCD = Math.max(R.totalCreances, R.totalDettes, 1);
  drawHBar(doc, margin, ys + 2, contentWidth * 0.5, 4, R.totalCreances, maxCD, ORANGE, 'Creances', fmt(R.totalCreances));
  drawHBar(doc, margin, ys + 14, contentWidth * 0.5, 4, R.totalDettes, maxCD, BLEU, 'Dettes', fmt(R.totalDettes));
  ys += 25;

  if (R.reliquatsSubventions > 0) ys = wrapText(ys, `Reliquats de subventions non consommees : ${fmt(R.reliquatsSubventions)}.`);
  ys = drawCommentBox(ys, 'Creances et dettes', saisie.commentaireCreances);

  // ════════════════════════════════════════════════════════════
  // S8. RESERVES
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('8. Reserves et affectation du resultat', ys, 90);
  autoTable(doc, {
    startY: ys,
    head: [['Compte', 'Montant']],
    body: [
      ['Reserves (c/1068)', fmt(R.reserves)],
      ['Dont SRH (c/106870)', fmt(R.reservesSRH)],
      ['Variation annuelle', fmt(R.prelevementsReserves.variationReserves)],
      ...(R.prelevementsReserves.totalPrelevements > 0 ? [
        ['Dont prelevements investissement', fmt(R.prelevementsReserves.prelevementsInvestissement)],
        ['Dont prelevements fonctionnement', fmt(R.prelevementsReserves.prelevementsFonctionnement)],
      ] : []),
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: pw - margin - colHalf },
  });
  const resTableBot = (doc as any).lastAutoTable.finalY;

  // Reserves trend
  if (fullHistory.length >= 2) {
    drawTrendLine(doc, chartX, ys, chartW, 22, fullHistory.map(h => h.reserves), BLEU, 'Evolution des reserves', histLabels);
  }
  ys = Math.max(resTableBot, ys + 30) + 3;

  ys = wrapText(ys,
    R.resultatComptable >= 0
      ? `Le resultat de l'exercice ${etab.exercice} (${fmt(R.resultatComptable)}) sera propose a l'affectation au compte de reserves (c/1068).`
      : `Le deficit de l'exercice ${etab.exercice} (${fmt(R.resultatComptable)}) sera impute sur les reserves (c/1068). Apres affectation : ${fmt(R.reserves + R.resultatComptable)}.`
  );
  ys = drawCommentBox(ys, 'Reserves et affectation', saisie.commentaireReserves);

  // ════════════════════════════════════════════════════════════
  // S9. RATIOS DE GESTION
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('9. Ratios de gestion (M9-6 S IV)', ys, 110);

  // Professional table with color-coded interpretations
  autoTable(doc, {
    startY: ys,
    head: [['Ratio', 'Valeur', 'Seuil', 'Interpretation']],
    body: [
      ['Liquidite generale', R.ratioLiquiditeGenerale.toFixed(2), '>= 1,00', R.ratioLiquiditeGenerale >= 1 ? 'Couverture correcte' : 'Insuffisante'],
      ['Liquidite reduite', R.ratioLiquiditeReduite.toFixed(2), '>= 0,80', R.ratioLiquiditeReduite >= 0.8 ? 'OK' : 'Insuffisante'],
      ['Liquidite immediate', R.ratioLiquiditeImmediate.toFixed(2), '>= 0,30', R.ratioLiquiditeImmediate >= 0.3 ? 'OK' : 'A surveiller'],
      ['Autonomie financiere', `${(R.ratioAutonomieFinanciere * 100).toFixed(1)} %`, '>= 50 %', R.ratioAutonomieFinanciere >= 0.5 ? '> 50%' : '< 50%'],
      ['Solvabilite', `${(R.ratioSolvabilite * 100).toFixed(1)} %`, '>= 50 %', R.ratioSolvabilite >= 0.5 ? 'OK' : 'A surveiller'],
      ['Endettement', R.ratioEndettement.toFixed(2), '< 1,00', R.ratioEndettement < 1 ? 'OK' : 'Eleve'],
      ['Charges personnel / Total', `${(R.ratioChargesPersonnel * 100).toFixed(1)} %`, '--', 'Information'],
      ['Couverture charges par FDR', `${(R.ratioCouvertureCharges * 100).toFixed(1)} %`, '>= 8 %', R.ratioCouvertureCharges >= 0.08 ? '> 30 jours' : '< 30 jours'],
      ['Taux execution depenses', `${(R.tauxExecCharges * 100).toFixed(1)} %`, '>= 85 %', R.tauxExecCharges >= 0.85 ? 'Conforme' : 'Sous-consommation'],
      ['Taux execution recettes', `${(R.tauxExecProduits * 100).toFixed(1)} %`, '>= 90 %', R.tauxExecProduits >= 0.9 ? 'Conforme' : 'Sous-estimation'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
    margin: { left: margin, right: margin },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.column.index === 3) {
        const val = d.cell.raw as string;
        if (val.includes('Insuffisante') || val.includes('Eleve') || val.includes('Sous')) {
          d.cell.styles.textColor = [ROUGE[0], ROUGE[1], ROUGE[2]];
        } else if (val !== 'Information' && val !== '--') {
          d.cell.styles.textColor = [VERT[0], VERT[1], VERT[2]];
        }
      }
    },
  });
  ys = (doc as any).lastAutoTable.finalY + 8;

  // Horizontal bars for key ratios
  ys = checkNewPage(ys, 50);
  ys = subTitle(ys, 'Indicateurs de sante financiere');
  ys += 2;
  const ratioItems = [
    { label: 'Liquidite', val: Math.min(R.ratioLiquiditeGenerale, 3), max: 3, color: (R.ratioLiquiditeGenerale >= 1 ? VERT : ROUGE) as RGB, display: R.ratioLiquiditeGenerale.toFixed(2) },
    { label: 'Autonomie fin.', val: R.ratioAutonomieFinanciere * 100, max: 100, color: (R.ratioAutonomieFinanciere >= 0.5 ? VERT : ROUGE) as RGB, display: `${(R.ratioAutonomieFinanciere * 100).toFixed(1)}%` },
    { label: 'Tx exec. charges', val: R.tauxExecCharges * 100, max: 100, color: (R.tauxExecCharges >= 0.85 ? VERT : ORANGE) as RGB, display: `${(R.tauxExecCharges * 100).toFixed(1)}%` },
    { label: 'Tx exec. produits', val: R.tauxExecProduits * 100, max: 100, color: (R.tauxExecProduits >= 0.9 ? VERT : ORANGE) as RGB, display: `${(R.tauxExecProduits * 100).toFixed(1)}%` },
  ];
  for (const ri of ratioItems) {
    drawHBar(doc, margin, ys, contentWidth * 0.5, 4, ri.val, ri.max, ri.color, ri.label, ri.display);
    ys += 10;
  }
  ys = drawCommentBox(ys, 'Ratios de gestion', saisie.commentaireRatios);

  // ════════════════════════════════════════════════════════════
  // S10. PLURIANNUEL (COMPLET)
  // ════════════════════════════════════════════════════════════
  if (fullHistory.length > 1) {
    ys = sectionHeader('10. Evolution pluriannuelle (Piece 14)', ys, 100);

    // Full table
    autoTable(doc, {
      startY: ys,
      head: [['Exercice', 'FDR', 'Jours FDR', 'BFR', 'Tresorerie', 'Jours Treso', 'TMcap %', 'TMNR %', 'Resultat', 'CAF/IAF', 'Reserves']],
      body: fullHistory.map(h => [
        String(h.exercice), fmt(h.fdr), String(Math.round(h.jours_autonomie)),
        fmt(h.bfr), fmt(h.tresorerie), String(Math.round(h.jours_tresorerie || 0)),
        (h.tmcap || 0).toFixed(1), (h.tmnr || 0).toFixed(1),
        fmt(h.resultat || 0), fmt(h.caf), fmt(h.reserves),
      ]),
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 6.5 },
      styles: { fontSize: 6.5 },
      columnStyles: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, { halign: 'right' as const }])),
      margin: { left: margin, right: margin },
      // Highlight current year row
      didParseCell: (d: any) => {
        if (d.section === 'body') {
          const rowExercice = fullHistory[d.row.index]?.exercice;
          if (rowExercice === etab.exercice) {
            d.cell.styles.fontStyle = 'bold';
            d.cell.styles.fillColor = [235, 240, 255];
          }
        }
      },
    });
    ys = (doc as any).lastAutoTable.finalY + 8;

    // Four trend charts in 2x2 grid
    ys = checkNewPage(ys, 60);
    ys = subTitle(ys, 'Graphiques d\'evolution');
    ys += 2;
    const chartTrendW = colHalf - 2;
    const chartTrendH = 24;
    drawTrendLine(doc, margin, ys, chartTrendW, chartTrendH, fullHistory.map(h => h.fdr), BLEU, 'FDR', histLabels);
    drawTrendLine(doc, margin + colHalf + 6, ys, chartTrendW, chartTrendH, fullHistory.map(h => h.tresorerie), VERT, 'Tresorerie', histLabels);
    ys += chartTrendH + 12;
    drawTrendLine(doc, margin, ys, chartTrendW, chartTrendH, fullHistory.map(h => h.caf), BLEU_CLAIR, 'CAF/IAF', histLabels);
    drawTrendLine(doc, margin + colHalf + 6, ys, chartTrendW, chartTrendH, fullHistory.map(h => h.reserves), ORANGE, 'Reserves', histLabels);
    ys += chartTrendH + 10;

    // Variations table
    if (fullHistory.length >= 2) {
      ys = checkNewPage(ys, 35);
      ys = subTitle(ys, 'Variations annuelles');
      const varBody: string[][] = [];
      for (let i = 1; i < fullHistory.length; i++) {
        const prev = fullHistory[i - 1];
        const curr = fullHistory[i];
        const varFdr = curr.fdr - prev.fdr;
        const varTreso = curr.tresorerie - prev.tresorerie;
        const varCaf = curr.caf - prev.caf;
        const varRes = curr.reserves - prev.reserves;
        varBody.push([
          `${prev.exercice} -> ${curr.exercice}`,
          fmt(varFdr), prev.fdr !== 0 ? `${((varFdr / Math.abs(prev.fdr)) * 100).toFixed(1)} %` : '--',
          fmt(varTreso), fmt(varCaf), fmt(varRes),
        ]);
      }
      autoTable(doc, {
        startY: ys,
        head: [['Periode', 'Var. FDR', '% FDR', 'Var. Treso', 'Var. CAF', 'Var. Reserves']],
        body: varBody,
        headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontSize: 7 },
        styles: { fontSize: 7 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        margin: { left: margin, right: margin },
        didParseCell: (d: any) => {
          if (d.section === 'body' && d.column.index >= 1) {
            const rawVal = d.cell.raw as string;
            if (rawVal.startsWith('-') || rawVal.startsWith('- ')) {
              d.cell.styles.textColor = [ROUGE[0], ROUGE[1], ROUGE[2]];
            }
          }
        },
      });
      ys = (doc as any).lastAutoTable.finalY + 5;
    }
  }
  ys = drawCommentBox(ys, 'Evolution pluriannuelle', saisie.commentairePluriannuel);

  // ════════════════════════════════════════════════════════════
  // S11. OBSERVATIONS
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('11. Observations de l\'agent comptable', ys, 60);
  if (aiText) {
    ys = wrapText(ys, aiText);
  }
  if (saisie.commentaireGeneral) {
    ys = wrapText(ys, saisie.commentaireGeneral);
  }
  if (!aiText && !saisie.commentaireGeneral) {
    ys = wrapText(ys, '(Observations a completer par l\'agent comptable)');
  }

  // ════════════════════════════════════════════════════════════
  // PAGE DEDIEE — DIAGNOSTIC REPROFI 4.6 (10 indicateurs + reserves)
  // ════════════════════════════════════════════════════════════
  if (data.panierReprofi) {
    try {
      ajouterPageReprofi(doc, data.panierReprofi, {
        margin,
        width: contentWidth,
        synthese: data.syntheseCommentaires,
        inclureReserves: true,
        titre: `Diagnostic Financier EPLE - Exercice ${etab.exercice}`,
      });
      // Force la signature sur une page propre apres le diagnostic REPROFI.
      doc.addPage();
      ys = 18;
    } catch (e) {
      console.warn('[pdfRapportAC] page REPROFI : fallback', e);
    }
  }

  // ════════════════════════════════════════════════════════════
  // SIGNATURE
  // ════════════════════════════════════════════════════════════
  ys = checkNewPage(ys, 45);
  ys += 8;
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, ys, pw - margin, ys);
  ys += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text("L'agent comptable", margin, ys);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(sanitize(`Fait a ${etab.commune || '............'},`), pw - margin - 60, ys);
  doc.text(`le 31 decembre ${etab.exercice}`, pw - margin - 60, ys + 5);
  ys += 18;
  doc.text(sanitize(etab.agentComptable || '..................'), margin, ys);
  doc.setFontSize(8);
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.text('Signature et cachet', margin, ys + 5);

  // ════════════════════════════════════════════════════════════
  // FOOTERS on all pages
  // ════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Tricolore bottom
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.rect(0, ph - 3, pw / 3, 3, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(pw / 3, ph - 3, pw / 3, 3, 'F');
    doc.setFillColor(ROUGE[0], ROUGE[1], ROUGE[2]);
    doc.rect((2 * pw) / 3, ph - 3, pw / 3, 3, 'F');
    // Text
    doc.setFontSize(6.5);
    doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
    doc.text(sanitize(`${etab.nom} -- Rapport de l'agent comptable -- Exercice ${etab.exercice}`), pw / 2, ph - 6, { align: 'center' });
    doc.text(`Page ${i} / ${pageCount}`, pw - margin, ph - 6, { align: 'right' });
  }

  doc.save(`Rapport_AC_${etab.uai}_${etab.exercice}.pdf`);
}
