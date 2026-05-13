/**
 * Helpers partagés pour la génération de PDF professionnels (jsPDF).
 *
 * IMPORTANT — Formatage € pour jsPDF :
 * `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` insère
 * des espaces fines insécables (U+202F) et un NBSP (U+00A0) avant le €.
 * La police Helvetica embarquée par jsPDF ne possède pas ces glyphes et les
 * affiche sous forme de barres verticales noires (« | »).
 * → On remplace systématiquement par des espaces ASCII.
 */

const NARROW_NBSP = /\u202F/g;
const NBSP = /\u00A0/g;

/** Nettoie une chaîne pour jsPDF (supprime les espaces non-cassantes). */
export function sanitizePdf(s: string): string {
  return (s ?? '').replace(NARROW_NBSP, ' ').replace(NBSP, ' ');
}

/** Format euros sans décimales adapté au PDF : « 1 234 567 € ». */
export function formatEurPdf(n: number | null | undefined, decimals = 0): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  const s = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
  return sanitizePdf(s);
}

/** Format nombre adapté au PDF : « 1 234 ». */
export function formatNumPdf(n: number | null | undefined, decimals = 0): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  const s = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
  return sanitizePdf(s);
}

/** Format pourcentage adapté au PDF. */
export function formatPctPdf(n: number | null | undefined, decimals = 1): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `${v.toFixed(decimals).replace('.', ',')} %`;
}

/** Couleurs charte sobre Éducation nationale. */
export const PDF_COLORS = {
  primary: [37, 68, 120] as [number, number, number],
  primaryLight: [220, 230, 245] as [number, number, number],
  accent: [191, 153, 76] as [number, number, number], // or institutionnel
  success: [34, 139, 87] as [number, number, number],
  warning: [217, 138, 30] as [number, number, number],
  danger: [180, 30, 30] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [110, 110, 110] as [number, number, number],
  border: [210, 210, 215] as [number, number, number],
};

import type jsPDF from 'jspdf';

/** Bandeau République Française en en-tête (paysage ou portrait). */
export function drawRfHeader(doc: jsPDF, subtitle?: string): void {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, w, 14, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RÉPUBLIQUE FRANÇAISE', 10, 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Liberté · Égalité · Fraternité', 10, 10);
  if (subtitle) {
    doc.setFontSize(8);
    doc.text(sanitizePdf(subtitle), w - 10, 8, { align: 'right' });
  }
}

/** Pied de page institutionnel avec pagination. */
export function drawInstitutionalFooter(doc: jsPDF, label: string): void {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(10, h - 10, w - 10, h - 10);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(sanitizePdf(label), 10, h - 5);
    doc.text(`Page ${i} / ${pages}`, w - 10, h - 5, { align: 'right' });
  }
}

/** Dessine une carte KPI (rectangle arrondi + valeur + libellé + statut couleur). */
export function drawKpiCard(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  status: 'good' | 'warn' | 'bad' | 'neutral' = 'neutral',
  hint?: string,
): void {
  const color =
    status === 'good' ? PDF_COLORS.success :
    status === 'warn' ? PDF_COLORS.warning :
    status === 'bad' ? PDF_COLORS.danger :
    PDF_COLORS.primary;

  // Carte
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  // Liseré couleur à gauche
  doc.setFillColor(...color);
  doc.rect(x, y, 1.4, h, 'F');
  // Libellé
  doc.setTextColor(...PDF_COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(sanitizePdf(label).toUpperCase(), x + 4, y + 5);
  // Valeur
  doc.setTextColor(...PDF_COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(sanitizePdf(value), x + 4, y + 13);
  // Hint
  if (hint) {
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(sanitizePdf(hint), x + 4, y + h - 3);
  }
}

/** Mini bar chart natif (sans dépendance image). */
export function drawBarChart(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  labels: string[], values: number[],
  title?: string,
): void {
  if (title) {
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(sanitizePdf(title), x, y - 1);
  }
  const max = Math.max(1, ...values.map(v => Math.abs(v)));
  const n = values.length;
  const padding = 4;
  const chartW = w - padding * 2;
  const chartH = h - 12;
  const barW = (chartW / n) * 0.65;
  const gap = (chartW / n) * 0.35;

  // axes
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(x + padding, y + chartH + 2, x + w - padding, y + chartH + 2);

  values.forEach((v, i) => {
    const bx = x + padding + i * (barW + gap) + gap / 2;
    const bh = (Math.abs(v) / max) * chartH;
    const by = y + chartH + 2 - bh;
    doc.setFillColor(...(v < 0 ? PDF_COLORS.danger : PDF_COLORS.primary));
    doc.rect(bx, by, barW, bh, 'F');
    // value
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(sanitizePdf(formatShortEur(v)), bx + barW / 2, by - 1, { align: 'center' });
    // label
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(sanitizePdf(labels[i] ?? ''), bx + barW / 2, y + chartH + 7, { align: 'center' });
  });
}

/** Format compact pour mini-charts : 12 k€ / 1,2 M€. */
export function formatShortEur(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')} M€`;
  if (a >= 1_000) return `${Math.round(v / 1_000)} k€`;
  return `${Math.round(v)} €`;
}

/** Bloc paragraphe justifié multilignes (commentaire vulgarisé). */
export function drawParagraph(
  doc: jsPDF,
  x: number, y: number, w: number,
  text: string,
  fontSize = 9.5,
  color: [number, number, number] = PDF_COLORS.text,
): number {
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(sanitizePdf(text), w);
  doc.text(lines, x, y);
  return y + lines.length * fontSize * 0.4 + 2;
}

/** Encadré « callout » pour mise en avant d'un message clé. */
export function drawCallout(
  doc: jsPDF,
  x: number, y: number, w: number,
  title: string, body: string,
  status: 'good' | 'warn' | 'bad' | 'info' = 'info',
): number {
  const color =
    status === 'good' ? PDF_COLORS.success :
    status === 'warn' ? PDF_COLORS.warning :
    status === 'bad'  ? PDF_COLORS.danger :
    PDF_COLORS.primary;
  const bgFactor = 0.92;
  doc.setFillColor(
    Math.round(color[0] + (255 - color[0]) * bgFactor),
    Math.round(color[1] + (255 - color[1]) * bgFactor),
    Math.round(color[2] + (255 - color[2]) * bgFactor),
  );
  const lines = doc.splitTextToSize(sanitizePdf(body), w - 8);
  const h = 10 + lines.length * 4;
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  doc.setFillColor(...color);
  doc.rect(x, y, 1.4, h, 'F');
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(sanitizePdf(title), x + 4, y + 5);
  doc.setTextColor(...PDF_COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(lines, x + 4, y + 9.5);
  return y + h + 2;
}