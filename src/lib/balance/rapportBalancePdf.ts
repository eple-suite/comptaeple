/**
 * Rapport d'analyse de balance — PDF institutionnel A4 portrait.
 * Charte République + en-tête MEN + signataire AC.
 * Sections : page de garde, synthèse exécutive, cartographie, par classe,
 * anomalies détaillées, comparaison N/N-1/N-2, prédictif, annexe balance.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Anomalie } from './anomaliesEngine';
import type { Projection } from './predictifEngine';
import type { BalanceLigne } from './referentielTypes';

export interface RapportBalanceParams {
  groupement?: string;
  eple: string;
  uai?: string;
  periode: string;
  signataire?: string;
  anomalies: Anomalie[];
  projections: Projection[];
  scoreRisque: number;
  balance: BalanceLigne[];
  cartographiePngDataUrl?: string;
  trajectoirePngDataUrl?: string;
  totaux?: { debit: number; credit: number };
}

function fmtEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n || 0);
}

function enTeteRF(doc: jsPDF, pageNum: number, total: number): void {
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'normal');
  doc.text('RÉPUBLIQUE FRANÇAISE — Liberté · Égalité · Fraternité', 14, 8);
  doc.text(`Page ${pageNum} / ${total}`, 196, 8, { align: 'right' });
  doc.setDrawColor(37, 68, 120);
  doc.setLineWidth(0.4);
  doc.line(14, 10, 196, 10);
}

function piedDePage(doc: jsPDF, signataire?: string): void {
  const h = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(
    `Document généré conformément à la M9-6 et au GBCP 2012-1246${signataire ? ` — Édité par ${signataire}` : ''}`,
    14, h - 8,
  );
}

export function genererRapportBalancePdf(p: RapportBalanceParams): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPages = 1; // calculé en fin

  // ─── PAGE DE GARDE ─────────────────────────────────────────────
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('RÉPUBLIQUE FRANÇAISE', 105, 14, { align: 'center' });
  doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE', 105, 21, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport d\'analyse de balance', 105, 36, { align: 'center' });

  doc.setTextColor(37, 68, 120);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(p.eple, 105, 70, { align: 'center' });
  if (p.uai) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`UAI ${p.uai}`, 105, 78, { align: 'center' });
  }
  if (p.groupement) {
    doc.setFontSize(10);
    doc.text(`Groupement comptable : ${p.groupement}`, 105, 86, { align: 'center' });
  }
  doc.setFontSize(11);
  doc.text(`Période analysée : ${p.periode}`, 105, 96, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Conformité M9-6 (tomes 1-4) — GBCP 2012-1246 — Ord. RGP 2022-408', 105, 270, { align: 'center' });
  if (p.signataire) {
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Signataire : ${p.signataire}`, 105, 256, { align: 'center' });
  }

  // ─── SYNTHÈSE EXÉCUTIVE ────────────────────────────────────────
  doc.addPage();
  enTeteRF(doc, 2, totalPages);
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Synthèse exécutive', 14, 20);

  const c = p.anomalies.filter((a) => a.niveau === 'critique').length;
  const m = p.anomalies.filter((a) => a.niveau === 'majeure').length;
  const mi = p.anomalies.filter((a) => a.niveau === 'mineure').length;

  autoTable(doc, {
    startY: 28,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Total débits', fmtEUR(p.totaux?.debit ?? 0)],
      ['Total crédits', fmtEUR(p.totaux?.credit ?? 0)],
      ['Équilibre D = C', Math.abs((p.totaux?.debit ?? 0) - (p.totaux?.credit ?? 0)) < 1 ? '✓ équilibré' : '✗ déséquilibre'],
      ['Anomalies critiques', String(c)],
      ['Anomalies majeures', String(m)],
      ['Anomalies mineures', String(mi)],
      ['Score de risque global', `${p.scoreRisque} / 100`],
    ],
    headStyles: { fillColor: [37, 68, 120], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  const top3 = p.anomalies
    .filter((a) => a.niveau === 'critique' || a.niveau === 'majeure')
    .slice(0, 3);
  if (top3.length > 0) {
    const yTop = (doc as any).lastAutoTable.finalY + 8;
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 3 points de vigilance', 14, yTop);
    autoTable(doc, {
      startY: yTop + 4,
      head: [['Compte', 'Niveau', 'Message', 'Action']],
      body: top3.map((a) => [a.compte, a.niveau.toUpperCase(), a.message, a.action]),
      headStyles: { fillColor: [180, 30, 30], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 2: { cellWidth: 80 }, 3: { cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
  }
  piedDePage(doc, p.signataire);

  // ─── CARTOGRAPHIE ──────────────────────────────────────────────
  if (p.cartographiePngDataUrl) {
    doc.addPage();
    enTeteRF(doc, 3, totalPages);
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Cartographie générale', 14, 20);
    try {
      doc.addImage(p.cartographiePngDataUrl, 'PNG', 14, 28, 180, 200);
    } catch { /* ignore */ }
    piedDePage(doc, p.signataire);
  }

  // ─── ANOMALIES DÉTAILLÉES ──────────────────────────────────────
  doc.addPage();
  enTeteRF(doc, 4, totalPages);
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Anomalies détaillées', 14, 20);
  if (p.anomalies.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(0, 120, 0);
    doc.text('Aucune anomalie détectée.', 14, 32);
  } else {
    autoTable(doc, {
      startY: 28,
      head: [['Compte', 'Libellé', 'Solde', 'Niveau', 'Action']],
      body: p.anomalies.map((a) => [
        a.compte, a.libelle, fmtEUR(a.solde),
        a.niveau.toUpperCase(), a.action,
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      styles: { fontSize: 7, cellPadding: 1.3 },
      columnStyles: { 2: { halign: 'right' }, 4: { cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
  }
  piedDePage(doc, p.signataire);

  // ─── PRÉDICTIF ─────────────────────────────────────────────────
  if (p.projections.length > 0) {
    doc.addPage();
    enTeteRF(doc, 5, totalPages);
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Volet prédictif (6 projections)', 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [['Projection', 'Niveau', 'Valeur', 'Recommandation']],
      body: p.projections.map((pr) => [
        pr.titre, pr.niveau.toUpperCase(),
        `${pr.valeur.toFixed(1)} ${pr.unite}`, pr.recommandation,
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 3: { cellWidth: 75 } },
      margin: { left: 14, right: 14 },
    });
    piedDePage(doc, p.signataire);
  }

  // ─── ANNEXE BALANCE COMPLÈTE ───────────────────────────────────
  if (p.balance.length > 0) {
    doc.addPage();
    enTeteRF(doc, 6, totalPages);
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexe — Balance détaillée', 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
      body: p.balance.map((l) => [
        l.compte, l.libelle ?? '',
        fmtEUR(l.debit), fmtEUR(l.credit), fmtEUR(l.solde),
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255 },
      styles: { fontSize: 7, cellPadding: 1 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    piedDePage(doc, p.signataire);
  }

  // Renumérotation pages footer
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(`Page ${i} / ${pages}`, 196, 8, { align: 'right' });
  }

  return doc;
}