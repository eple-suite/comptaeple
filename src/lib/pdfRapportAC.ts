// ═══════════════════════════════════════════════════════════════
// PDF RAPPORT DE L'AGENT COMPTABLE — Document officiel
// Modèle REPROFI enrichi — M9-6 2026 · Décret 2012-1246
// Avec graphiques intégrés (barres horizontales, jauges)
// ═══════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BLEU = [0, 35, 149] as const;
const ROUGE = [237, 41, 57] as const;
const GRIS = [100, 100, 100] as const;
const VERT = [34, 139, 34] as const;
const ORANGE = [230, 126, 34] as const;

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
    fdrMobilisable: number;
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
  };
  aiText: string;
  history: { exercice: number; fdr: number; bfr: number; tresorerie: number; caf: number; reserves: number; jours_autonomie: number }[];
  nbAnom: number; nbBloq: number;
}

/** Strip exotic Unicode that jsPDF cannot render (Ø, Ü, Ê, ═, ☐, etc.) */
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
function pct(v: number, t: number): string {
  return t > 0 ? `${((v / t) * 100).toFixed(1)} %` : '—';
}

// ── Graphique: Barre horizontale avec étiquette ──
function drawHBar(doc: jsPDF, x: number, y: number, width: number, height: number, value: number, maxValue: number, color: readonly number[], label: string, valueLabel: string) {
  const ratio = maxValue > 0 ? Math.min(Math.abs(value) / maxValue, 1) : 0;
  // Background
  doc.setFillColor(235, 238, 245);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'F');
  // Fill
  const fillW = width * ratio;
  if (fillW > 2) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, fillW, height, 1.5, 1.5, 'F');
  }
  // Label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(label, x, y - 1.5);
  // Value
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(valueLabel, x + width + 2, y + height - 1);
  doc.setTextColor(0, 0, 0);
}

// ── Graphique: Jauge circulaire (arc) ──
function drawGauge(doc: jsPDF, cx: number, cy: number, radius: number, value: number, maxDays: number, label: string, color: readonly number[]) {
  const pctVal = Math.min(value / maxDays, 1);
  // Background circle
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius);
  // Value arc (simplified as filled segment)
  if (pctVal > 0) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(3);
    // Draw arc approximation
    const segments = Math.floor(pctVal * 36);
    for (let i = 0; i < segments; i++) {
      const a1 = (-Math.PI / 2) + (i / 36) * 2 * Math.PI;
      const a2 = (-Math.PI / 2) + ((i + 1) / 36) * 2 * Math.PI;
      doc.line(
        cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
        cx + radius * Math.cos(a2), cy + radius * Math.sin(a2)
      );
    }
  }
  // Center text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${Math.round(value)}j`, cx, cy + 1, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(label, cx, cy + radius + 5, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
}

// ── Mini stacked bar ──
function drawStackedBar(doc: jsPDF, x: number, y: number, w: number, h: number, parts: { value: number; color: readonly number[]; label: string }[], total: number) {
  doc.setFillColor(235, 238, 245);
  doc.roundedRect(x, y, w, h, 1, 1, 'F');
  let cx = x;
  for (const p of parts) {
    const pw = total > 0 ? (p.value / total) * w : 0;
    if (pw > 1) {
      doc.setFillColor(p.color[0], p.color[1], p.color[2]);
      doc.rect(cx, y, pw, h, 'F');
    }
    cx += pw;
  }
  // Legend
  let lx = x;
  doc.setFontSize(5.5);
  for (const p of parts) {
    const pctV = total > 0 ? ((p.value / total) * 100).toFixed(0) : '0';
    doc.setFillColor(p.color[0], p.color[1], p.color[2]);
    doc.rect(lx, y + h + 2, 3, 2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(`${p.label} (${pctV}%)`, lx + 4, y + h + 3.5);
    lx += 35;
  }
}

export function generateRapportACPdf(data: RapportACData) {
  const { etab, R, saisieComplementaire: saisie, aiText, history, nbAnom, nbBloq } = data;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pw - 2 * margin;

  // ════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ════════════════════════════════════════════════════════════
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw / 3, 8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(pw / 3, 0, pw / 3, 8, 'F');
  doc.setFillColor(ROUGE[0], ROUGE[1], ROUGE[2]);
  doc.rect((2 * pw) / 3, 0, pw / 3, 8, 'F');

  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 20, pw, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT FINANCIER', pw / 2, 36, { align: 'center' });
  doc.setFontSize(14);
  doc.text("DE L'AGENT COMPTABLE", pw / 2, 44, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`COMPTE FINANCIER — EXERCICE ${etab.exercice}`, pw / 2, 55, { align: 'center' });

  let y = 80;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(etab.nom || 'Établissement', pw / 2, y, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`RNE : ${etab.uai}`, pw / 2, y, { align: 'center' });
  if (etab.adresse) { y += 6; doc.text(etab.adresse, pw / 2, y, { align: 'center' }); }
  if (etab.codePostal || etab.commune) { y += 6; doc.text(`${etab.codePostal || ''} ${etab.commune || ''}`, pw / 2, y, { align: 'center' }); }
  if (etab.academie) { y += 6; doc.text(`Académie de ${etab.academie}`, pw / 2, y, { align: 'center' }); }

  y += 20;
  doc.setFillColor(240, 243, 248);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('CADRE RÉGLEMENTAIRE', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text('Instruction codificatrice M9-6 — OP@LE du 19 janvier 2026', margin + 5, y + 13);
  doc.text('Décret n°2012-1246 du 7 novembre 2012 (RGCP) — Art. 195-199', margin + 5, y + 18);
  doc.text("Code de l'Éducation — Art. R421-68 et suivants", margin + 5, y + 23);

  y += 38;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Ordonnateur : ${etab.ordonnateur || '—'}`, margin, y);
  doc.text(`Agent comptable : ${etab.agentComptable || '—'}`, margin, y + 7);
  if (etab.secretaireGeneral) doc.text(`Secrétaire général(e) : ${etab.secretaireGeneral}`, margin, y + 14);

  y += (etab.secretaireGeneral ? 28 : 25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.text('SOMMAIRE', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const sommaire = [
    '1. Rappel des dispositions réglementaires',
    '2. Présentation du résultat et de l\'autofinancement',
    '3. Analyse du fonds de roulement',
    '4. Analyse du besoin en fonds de roulement',
    '5. Analyse de la trésorerie',
    '6. Taux de charges à payer et de non-recouvrement',
    '7. État du patrimoine',
    '8. Créances et dettes',
    '9. Réserves et affectation du résultat',
    '10. Ratios de gestion M9-6',
    '11. Évolution pluriannuelle',
    '12. Observations de l\'agent comptable',
  ];
  sommaire.forEach((s, i) => doc.text(s, margin + 5, y + 10 + i * 6));

  // ════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ════════════════════════════════════════════════════════════
  function sectionHeader(title: string, currentY: number = ph): number {
    // Add a new page only if less than 70mm remain on current page
    if (currentY > ph - 70) {
      doc.addPage();
      doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.rect(0, 0, pw, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), pw / 2, 9, { align: 'center' });
      return 22;
    }
    // Inline section header on current page
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.rect(margin, currentY, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pw / 2, currentY + 7, { align: 'center' });
    return currentY + 16;
  }

  function subTitle(y: number, text: string): number {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(text, margin, y);
    doc.setTextColor(0, 0, 0);
    return y + 6;
  }

  function wrapText(y: number, text: string, maxY: number = ph - 25): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(sanitize(text), contentWidth);
    for (const line of lines) {
      if (y > maxY) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 4.5;
    }
    return y + 2;
  }

  function checkNewPage(y: number, needed: number): number {
    if (y + needed > ph - 25) { doc.addPage(); return 20; }
    return y;
  }

  // ════════════════════════════════════════════════════════════
  // § 1. RAPPEL RÉGLEMENTAIRE
  // ════════════════════════════════════════════════════════════
  let ys = sectionHeader('1. Rappel des dispositions réglementaires');
  ys = wrapText(ys,
    "L'agent comptable informe le conseil d'administration de l'état du patrimoine, des stocks, " +
    "des créances, des reliquats de subventions. Il présente et explique les différents indicateurs " +
    "financiers mentionnés à la pièce 14 du compte financier. L'analyse des données financières " +
    "s'effectue à partir du résultat, de la capacité d'autofinancement ainsi que des divers " +
    "indicateurs et de leur évolution. Elle est présentée par l'agent comptable qui explique, " +
    "notamment en fonction de la composition du fonds de roulement, la marge dont dispose " +
    "l'établissement pour financer des actions sur fonds propres.");

  // ════════════════════════════════════════════════════════════
  // § 2. RÉSULTAT ET AUTOFINANCEMENT + Graphiques
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('2. Presentation du resultat et de l\'autofinancement', ys);
  autoTable(doc, {
    startY: ys,
    head: [['Élément', 'Montant']],
    body: [
      ['Charges nettes (classe 6)', fmt(R.totalChargesSde)],
      ['Produits nets (classe 7)', fmt(R.totalProduitsSdr)],
      ['RÉSULTAT COMPTABLE', fmt(R.resultatComptable)],
      ['Charges non décaissables (68+675)', fmt(R.chargesNonDecaissables)],
      ['Produits non encaissables (78+775…)', fmt(R.produitsNonEncaissables)],
      [R.cafComptable >= 0 ? 'CAF (Capacité d\'autofinancement)' : 'IAF (Insuffisance d\'autofinancement)', fmt(R.cafComptable)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
    didParseCell: (d: any) => {
      if (d.section === 'body' && (d.row.index === 2 || d.row.index === 5)) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = d.row.index === 2 ? (R.resultatComptable >= 0 ? [220, 237, 200] : [255, 220, 220]) : (R.cafComptable >= 0 ? [220, 237, 200] : [255, 220, 220]);
      }
    },
  });
  ys = (doc as any).lastAutoTable.finalY + 8;

  // 📊 Graphique: Charges vs Produits
  const maxCP = Math.max(R.totalChargesSde, R.totalProduitsSdr);
  ys = subTitle(ys, '📊 Comparaison Charges / Produits');
  ys += 3;
  drawHBar(doc, margin, ys, contentWidth * 0.65, 5, R.totalChargesSde, maxCP, ROUGE, 'Charges (cl.6)', fmt(R.totalChargesSde));
  ys += 12;
  drawHBar(doc, margin, ys, contentWidth * 0.65, 5, R.totalProduitsSdr, maxCP, VERT, 'Produits (cl.7)', fmt(R.totalProduitsSdr));
  ys += 15;

  // Prélèvements
  if (saisie.prelevements.length > 0) {
    ys = checkNewPage(ys, 40);
    ys = subTitle(ys, 'Prélèvements sur fonds de roulement autorisés par le CA');
    const totalPrelev = saisie.prelevements.reduce((s, p) => s + p.montant, 0);
    autoTable(doc, {
      startY: ys,
      head: [['Objet', 'Montant', 'Date du CA']],
      body: [
        ...saisie.prelevements.map(p => [p.objet, fmt(p.montant), p.dateCA]),
        ['TOTAL PRÉLEVÉ', fmt(totalPrelev), ''],
      ],
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
    });
    ys = (doc as any).lastAutoTable.finalY + 3;
    const resultatHorsPrelev = R.resultatComptable + totalPrelev;
    ys = wrapText(ys,
      `Le résultat de l'exercice (${fmt(R.resultatComptable)}) inclut ${saisie.prelevements.length} prélèvement(s) sur fonds de roulement ` +
      `pour un total de ${fmt(totalPrelev)}. Sans ces prélèvements, le résultat aurait été de ${fmt(resultatHorsPrelev)}.`);
  }
  if (saisie.explicationsResultat) ys = wrapText(ys, saisie.explicationsResultat);

  // ════════════════════════════════════════════════════════════
  // § 3. FONDS DE ROULEMENT + Graphiques
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('3. Analyse du fonds de roulement');
  autoTable(doc, {
    startY: ys,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['FDR comptable (par le bas)', fmt(R.fdrComptable)],
      ['Jours de fonctionnement', `${Math.round(R.joursFdr)} jours`],
      ['Part encaissée (autonomie financière)', `${fmt(R.fdrPartEncaissee)} (${R.fdrPctEncaissee.toFixed(1)} %)`],
      ['Part non encaissée (créances)', `${fmt(R.fdrPartNonEncaissee)} (${R.fdrPctNonEncaissee.toFixed(1)} %)`],
      ['FDR mobilisable (hors stocks, c/416, cr. anciennes)', fmt(R.fdrMobilisable)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 8;

  // 📊 Jauges FDR et Trésorerie
  ys = subTitle(ys, '📊 Jours d\'autonomie');
  ys += 5;
  const fdrColor = R.joursFdr >= 30 ? VERT : (R.joursFdr >= 15 ? ORANGE : ROUGE);
  const tresoColor = R.joursTresorerie >= 20 ? VERT : (R.joursTresorerie >= 10 ? ORANGE : ROUGE);
  drawGauge(doc, margin + 30, ys + 12, 10, R.joursFdr, 90, 'FDR', fdrColor);
  drawGauge(doc, pw / 2, ys + 12, 10, R.joursTresorerie, 90, 'Trésorerie', tresoColor);
  // Seuil 30j
  doc.setFontSize(6);
  doc.setTextColor(ROUGE[0], ROUGE[1], ROUGE[2]);
  doc.text('Seuil : 30 jours minimum', pw - margin - 40, ys + 12);
  doc.setTextColor(0, 0, 0);
  ys += 35;

  // 📊 Composition FDR (stacked bar)
  ys = subTitle(ys, '📊 Composition du FDR');
  ys += 2;
  drawStackedBar(doc, margin, ys, contentWidth * 0.7, 6,
    [
      { value: R.fdrPartEncaissee, color: BLEU, label: 'Encaissée' },
      { value: R.fdrPartNonEncaissee, color: ORANGE, label: 'Non encaissée' },
    ],
    Math.abs(R.fdrComptable)
  );
  ys += 16;

  if (saisie.commentaireFDR) ys = wrapText(ys, saisie.commentaireFDR);

  // ════════════════════════════════════════════════════════════
  // § 4. BFR — Sur la même page si possible
  // ════════════════════════════════════════════════════════════
  ys = checkNewPage(ys, 60);
  ys = subTitle(ys, '4. Analyse du besoin en fonds de roulement');
  ys += 2;
  autoTable(doc, {
    startY: ys,
    head: [['Élément', 'Montant']],
    body: [
      ['Créances (cl.4 débit)', fmt(R.totalCreances)],
      ['Dettes (cl.4 crédit)', fmt(R.totalDettes)],
      [R.bfr < 0 ? 'DÉGAGEMENT EN FONDS DE ROULEMENT' : 'BESOIN EN FONDS DE ROULEMENT', fmt(R.bfr)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;
  ys = wrapText(ys,
    R.bfr < 0
      ? `Le BFR négatif (${fmt(R.bfr)}) constitue un dégagement en fonds de roulement, situation classique des EPLE. La relation FDR = BFR + Trésorerie est vérifiée : ${fmt(R.fdrComptable)} = ${fmt(R.bfr)} + ${fmt(R.tresorerie)}.`
      : `Le BFR positif (${fmt(R.bfr)}) indique que les créances excèdent les dettes d'exploitation.`
  );

  // 📊 Équation FDR = BFR + Trésorerie
  ys = checkNewPage(ys, 25);
  ys += 3;
  const maxFBT = Math.max(Math.abs(R.fdrComptable), Math.abs(R.bfr), Math.abs(R.tresorerie));
  drawHBar(doc, margin, ys, contentWidth * 0.55, 4, R.fdrComptable, maxFBT, BLEU, 'FDR', fmt(R.fdrComptable));
  ys += 10;
  drawHBar(doc, margin, ys, contentWidth * 0.55, 4, R.bfr, maxFBT, R.bfr < 0 ? VERT : ORANGE, 'BFR', fmt(R.bfr));
  ys += 10;
  drawHBar(doc, margin, ys, contentWidth * 0.55, 4, R.tresorerie, maxFBT, BLEU, 'Trésorerie', fmt(R.tresorerie));
  ys += 15;

  // ════════════════════════════════════════════════════════════
  // § 5. TRÉSORERIE
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('5. Analyse de la trésorerie');
  autoTable(doc, {
    startY: ys,
    head: [['Composante', 'Montant', '% Trésorerie']],
    body: [
      ['Autonomie financière', fmt(R.tresoComposition.autonomieFinanciere), pct(Math.abs(R.tresoComposition.autonomieFinanciere), R.tresorerie)],
      ['Dépôts et cautions', fmt(R.tresoComposition.depotsCautions), pct(R.tresoComposition.depotsCautions, R.tresorerie)],
      ['Règlements en attente', fmt(R.tresoComposition.reglementsEnAttente), pct(R.tresoComposition.reglementsEnAttente, R.tresorerie)],
      ['Reliquats de subventions', fmt(R.tresoComposition.reliquatsSubventions), pct(R.tresoComposition.reliquatsSubventions, R.tresorerie)],
      ['TRÉSORERIE TOTALE', fmt(R.tresorerie), '100 %'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: margin },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.row.index === 4) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = [240, 243, 248];
      }
    },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;
  ys = wrapText(ys, `La trésorerie nette s'élève à ${fmt(R.tresorerie)}, soit ${Math.round(R.joursTresorerie)} jours de fonctionnement.`);

  // 📊 Composition trésorerie
  ys += 2;
  ys = subTitle(ys, '📊 Répartition de la trésorerie');
  ys += 2;
  drawStackedBar(doc, margin, ys, contentWidth * 0.7, 6,
    [
      { value: Math.abs(R.tresoComposition.autonomieFinanciere), color: BLEU, label: 'Autonomie' },
      { value: R.tresoComposition.depotsCautions, color: VERT, label: 'Dépôts' },
      { value: R.tresoComposition.reglementsEnAttente, color: ORANGE, label: 'En attente' },
      { value: R.tresoComposition.reliquatsSubventions, color: ROUGE, label: 'Reliquats' },
    ],
    R.tresorerie
  );
  ys += 15;
  if (saisie.commentaireTresorerie) ys = wrapText(ys, saisie.commentaireTresorerie);

  // ════════════════════════════════════════════════════════════
  // § 6. TMcap / TMnr + § 7. PATRIMOINE — On same page if room
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('6. Charges à payer et recouvrement / 7. Patrimoine');

  // TMcap/TMnr table
  autoTable(doc, {
    startY: ys,
    head: [['Indicateur', 'Valeur', 'Interprétation']],
    body: [
      ['TMcap (charges à payer / charges)', `${R.tmcap.toFixed(2)} %`, R.tmcap < 5 ? 'Solvabilité correcte' : 'À surveiller'],
      ['TMnr (non-recouvrement)', `${R.tmnr.toFixed(2)} %`, R.tmnr < 5 ? 'Recouvrement satisfaisant' : 'Diligences nécessaires'],
      ['DGP (délai global paiement)', `${Math.round(R.dgpJours)} jours`, R.dgpJours <= 30 ? '≤ 30 jours — conforme' : '> 30 jours — attention'],
      ['DGR (délai global recouvrement)', `${Math.round(R.dgrJours)} jours`, R.dgrJours <= 60 ? 'Délai acceptable' : '> 60 jours — attention'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 8;

  // Patrimoine on same page
  ys = subTitle(ys, '7. État du patrimoine');
  ys += 2;
  autoTable(doc, {
    startY: ys,
    head: [['Élément', 'Montant']],
    body: [
      ['Immobilisations brutes (classe 2)', fmt(R.totalImmo)],
      ['Amortissements cumulés (compte 28)', `- ${fmt(R.totalAmortissements)}`],
      ['VALEUR RÉSIDUELLE', fmt(R.valeurNette)],
      ['Variation annuelle', fmt(R.variationPatrimoine)],
      [`Origines — Fonds propres (${R.patrimoineOriginesPctFP.toFixed(1)} %)`, fmt(R.patrimoineOriginesFondsPropres)],
      [`Origines — Subventions d'investissement (${R.patrimoineOriginesPctSub.toFixed(1)} %)`, fmt(R.patrimoineOriginesSubventions)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;

  // 📊 Origines patrimoine (stacked bar)
  if (R.totalImmo > 0) {
    ys = subTitle(ys, '📊 Origines du patrimoine');
    ys += 2;
    drawStackedBar(doc, margin, ys, contentWidth * 0.6, 6,
      [
        { value: R.patrimoineOriginesFondsPropres, color: BLEU, label: 'Fonds propres' },
        { value: R.patrimoineOriginesSubventions, color: VERT, label: 'Subventions' },
      ],
      R.patrimoineOriginesFondsPropres + R.patrimoineOriginesSubventions
    );
    ys += 15;
  }

  // ════════════════════════════════════════════════════════════
  // § 8. CRÉANCES ET DETTES
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('8. État des créances et des dettes');

  // Créances + Dettes side by side approach: both tables on same page
  ys = subTitle(22, 'Créances');
  const creancesBody: string[][] = [];
  if (R.creancesEtat > 0) creancesBody.push(['État', fmt(R.creancesEtat), pct(R.creancesEtat, R.totalCreances)]);
  if (R.creancesCollectivite > 0) creancesBody.push(['Collectivité', fmt(R.creancesCollectivite), pct(R.creancesCollectivite, R.totalCreances)]);
  if (R.creancesFamilles > 0) creancesBody.push(['Familles', fmt(R.creancesFamilles), pct(R.creancesFamilles, R.totalCreances)]);
  if (R.creancesAutres > 0) creancesBody.push(['Autres', fmt(R.creancesAutres), pct(R.creancesAutres, R.totalCreances)]);
  creancesBody.push(['TOTAL', fmt(R.totalCreances), '100 %']);
  autoTable(doc, {
    startY: ys,
    head: [['Origine', 'Montant', '%']],
    body: creancesBody,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;

  ys = subTitle(ys, 'Dettes');
  const dettesBody: string[][] = [];
  if (R.dettesFournisseurs > 0) dettesBody.push(['Fournisseurs', fmt(R.dettesFournisseurs), pct(R.dettesFournisseurs, R.totalDettes)]);
  if (R.dettesEtat > 0) dettesBody.push(['État', fmt(R.dettesEtat), pct(R.dettesEtat, R.totalDettes)]);
  if (R.dettesCollectivite > 0) dettesBody.push(['Collectivité', fmt(R.dettesCollectivite), pct(R.dettesCollectivite, R.totalDettes)]);
  if (R.dettesAutres > 0) dettesBody.push(['Autres', fmt(R.dettesAutres), pct(R.dettesAutres, R.totalDettes)]);
  dettesBody.push(['TOTAL', fmt(R.totalDettes), '100 %']);
  autoTable(doc, {
    startY: ys,
    head: [['Type', 'Montant', '%']],
    body: dettesBody,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 3;
  if (R.reliquatsSubventions > 0) ys = wrapText(ys, `Reliquats de subventions non consommées : ${fmt(R.reliquatsSubventions)}.`);
  if (saisie.commentaireCreances) ys = wrapText(ys, saisie.commentaireCreances);

  // 📊 Barres créances / dettes
  ys = checkNewPage(ys, 25);
  ys += 2;
  ys = subTitle(ys, '📊 Créances vs Dettes');
  ys += 3;
  const maxCD = Math.max(R.totalCreances, R.totalDettes);
  drawHBar(doc, margin, ys, contentWidth * 0.55, 5, R.totalCreances, maxCD, ORANGE, 'Créances', fmt(R.totalCreances));
  ys += 12;
  drawHBar(doc, margin, ys, contentWidth * 0.55, 5, R.totalDettes, maxCD, BLEU, 'Dettes', fmt(R.totalDettes));
  ys += 15;

  // ════════════════════════════════════════════════════════════
  // § 9. RÉSERVES — On same page if room
  // ════════════════════════════════════════════════════════════
  ys = checkNewPage(ys, 50);
  ys = subTitle(ys, '9. Réserves et affectation du résultat');
  ys += 2;
  autoTable(doc, {
    startY: ys,
    head: [['Compte', 'Montant']],
    body: [
      ['Réserves (c/1068)', fmt(R.reserves)],
      ['Dont SRH (c/106870)', fmt(R.reservesSRH)],
      ['Variation annuelle', fmt(R.prelevementsReserves.variationReserves)],
      ...(R.prelevementsReserves.totalPrelevements > 0 ? [
        ['Dont prélèvements investissement', fmt(R.prelevementsReserves.prelevementsInvestissement)],
        ['Dont prélèvements fonctionnement', fmt(R.prelevementsReserves.prelevementsFonctionnement)],
      ] : []),
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 5;
  ys = wrapText(ys,
    R.resultatComptable >= 0
      ? `Le résultat de l'exercice ${etab.exercice} (${fmt(R.resultatComptable)}) sera proposé à l'affectation au compte de réserves (c/1068).`
      : `Le déficit de l'exercice ${etab.exercice} (${fmt(R.resultatComptable)}) sera imputé sur les réserves (c/1068). Après affectation : ${fmt(R.reserves + R.resultatComptable)}.`
  );

  // ════════════════════════════════════════════════════════════
  // § 10. RATIOS
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('10. Ratios de gestion (M9-6 § IV)');
  autoTable(doc, {
    startY: ys,
    head: [['Ratio', 'Valeur', 'Interprétation']],
    body: [
      ['Liquidité générale', R.ratioLiquiditeGenerale.toFixed(2), R.ratioLiquiditeGenerale >= 1 ? '✓ Couverture correcte' : '⚠ Insuffisante'],
      ['Liquidité réduite', R.ratioLiquiditeReduite.toFixed(2), R.ratioLiquiditeReduite >= 0.8 ? '✓' : '⚠'],
      ['Liquidité immédiate', R.ratioLiquiditeImmediate.toFixed(2), R.ratioLiquiditeImmediate >= 0.3 ? '✓' : '⚠'],
      ['Autonomie financière', `${(R.ratioAutonomieFinanciere * 100).toFixed(1)} %`, R.ratioAutonomieFinanciere >= 0.5 ? '✓ > 50%' : '⚠ < 50%'],
      ['Solvabilité', `${(R.ratioSolvabilite * 100).toFixed(1)} %`, R.ratioSolvabilite >= 0.5 ? '✓' : '⚠'],
      ['Endettement', R.ratioEndettement.toFixed(2), R.ratioEndettement < 1 ? '✓' : '⚠ Élevé'],
      ['Charges personnel / Total', `${(R.ratioChargesPersonnel * 100).toFixed(1)} %`, '—'],
      ['Couverture charges par FDR', `${(R.ratioCouvertureCharges * 100).toFixed(1)} %`, R.ratioCouvertureCharges >= 0.08 ? '✓ > 30 j' : '⚠ < 30 j'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });
  ys = (doc as any).lastAutoTable.finalY + 8;

  // 📊 Radar simplifié → barres horizontales pour les ratios clés
  ys = subTitle(ys, '📊 Indicateurs de santé financière');
  ys += 3;
  const ratioItems = [
    { label: 'Liquidité', val: Math.min(R.ratioLiquiditeGenerale, 3), max: 3, color: R.ratioLiquiditeGenerale >= 1 ? VERT : ROUGE, display: R.ratioLiquiditeGenerale.toFixed(2) },
    { label: 'Autonomie fin.', val: R.ratioAutonomieFinanciere * 100, max: 100, color: R.ratioAutonomieFinanciere >= 0.5 ? VERT : ROUGE, display: `${(R.ratioAutonomieFinanciere * 100).toFixed(1)}%` },
    { label: 'Taux exec. charges', val: R.tauxExecCharges, max: 100, color: R.tauxExecCharges >= 85 ? VERT : ORANGE, display: `${R.tauxExecCharges.toFixed(1)}%` },
    { label: 'Taux exec. produits', val: R.tauxExecProduits, max: 100, color: R.tauxExecProduits >= 85 ? VERT : ORANGE, display: `${R.tauxExecProduits.toFixed(1)}%` },
  ];
  for (const ri of ratioItems) {
    drawHBar(doc, margin, ys, contentWidth * 0.5, 4, ri.val, ri.max, ri.color, ri.label, ri.display);
    ys += 11;
  }

  // ════════════════════════════════════════════════════════════
  // § 11. PLURIANNUEL
  // ════════════════════════════════════════════════════════════
  if (history.length > 0) {
    ys = sectionHeader('11. Évolution pluriannuelle');
    autoTable(doc, {
      startY: ys,
      head: [['Exercice', 'FDR', 'BFR', 'Trésorerie', 'CAF/IAF', 'Réserves', 'Jours']],
      body: history.map(h => [
        String(h.exercice), fmt(h.fdr), fmt(h.bfr), fmt(h.tresorerie),
        fmt(h.caf), fmt(h.reserves), String(Math.round(h.jours_autonomie)),
      ]),
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
      margin: { left: margin, right: margin },
    });
    ys = (doc as any).lastAutoTable.finalY + 8;

    // 📊 Graphique pluriannuel FDR/Trésorerie
    if (history.length >= 2) {
      ys = subTitle(ys, '📊 Tendance FDR / Trésorerie');
      ys += 3;
      const maxHist = Math.max(...history.map(h => Math.max(Math.abs(h.fdr), Math.abs(h.tresorerie))));
      for (const h of history) {
        drawHBar(doc, margin, ys, contentWidth * 0.35, 3, h.fdr, maxHist, BLEU, `${h.exercice} FDR`, fmt(h.fdr));
        drawHBar(doc, margin + contentWidth * 0.5, ys, contentWidth * 0.35, 3, h.tresorerie, maxHist, VERT, `${h.exercice} Tréso`, fmt(h.tresorerie));
        ys += 9;
      }
      ys += 5;
    }
  }

  // ════════════════════════════════════════════════════════════
  // § 12. OBSERVATIONS
  // ════════════════════════════════════════════════════════════
  ys = sectionHeader('12. Observations de l\'agent comptable');
  if (aiText) {
    ys = wrapText(22, aiText);
  }
  if (saisie.commentaireGeneral) {
    ys = wrapText(ys, saisie.commentaireGeneral);
  }
  if (!aiText && !saisie.commentaireGeneral) {
    ys = wrapText(22, '(Observations à compléter par l\'agent comptable)');
  }

  // ════════════════════════════════════════════════════════════
  // SIGNATURE
  // ════════════════════════════════════════════════════════════
  if (ys > ph - 50) { doc.addPage(); ys = 20; }
  ys += 10;
  doc.setDrawColor(0);
  doc.line(margin, ys, pw - margin, ys);
  ys += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text("L'agent comptable", margin, ys);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fait à ${etab.commune || '………………'},`, pw - margin - 60, ys);
  doc.text(`le ……… / ……… / ${etab.exercice + 1}`, pw - margin - 60, ys + 5);
  ys += 20;
  doc.text(etab.agentComptable || '……………………', margin, ys);
  doc.setFontSize(8);
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.text('Signature et cachet', margin, ys + 5);

  // ════════════════════════════════════════════════════════════
  // FOOTERS
  // ════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.rect(0, ph - 3, pw / 3, 3, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(pw / 3, ph - 3, pw / 3, 3, 'F');
    doc.setFillColor(ROUGE[0], ROUGE[1], ROUGE[2]);
    doc.rect((2 * pw) / 3, ph - 3, pw / 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
    doc.text(`${etab.nom} — Rapport de l'agent comptable — Exercice ${etab.exercice}`, pw / 2, ph - 6, { align: 'center' });
    doc.text(`Page ${i} / ${pageCount}`, pw - margin, ph - 6, { align: 'right' });
  }

  doc.save(`Rapport_AC_${etab.uai}_${etab.exercice}.pdf`);
}
