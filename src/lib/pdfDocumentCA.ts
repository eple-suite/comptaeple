// ═══════════════════════════════════════════════════════════════
// DOCUMENT JOINT À LA CONVOCATION DU CONSEIL D'ADMINISTRATION
// Synthèse du compte financier — Modèle REPROFI
// Partie I : Exécution budgétaire (Bourses, TA, viabilisation, taux)
// Partie II : Santé financière (Résultat, CAF, FDR, BFR, Tréso, Immo)
// M9-6 2026 · Décret 2012-1246 (RGCP)
// ═══════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFFooters } from '@/lib/pdfUtils';

const BLEU: [number, number, number] = [37, 68, 120];
const VERT: [number, number, number] = [34, 139, 34];
const ROUGE: [number, number, number] = [220, 38, 38];
const ORANGE: [number, number, number] = [230, 126, 34];
const GRIS: [number, number, number] = [100, 100, 100];

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
    totalChargesReel: number; totalProduitsReel: number;
    totalChargesPrev: number; totalProduitsPrev: number;
    tauxExecCharges: number; tauxExecProduits: number;
    cafBudgetaire: number; cafComptable: number;
    chargesNonDecaissables: number; produitsNonEncaissables: number;
    fdrComptable: number; bfr: number; tresorerie: number; tresorerieNette: number;
    joursFdr: number; joursTresorerie: number; joursAutonomie: number;
    fdrMobilisable: number; tmcap: number; tmnr: number;
    totalCreances: number; totalDettes: number;
    totalImmo: number; totalAmortissements: number; valeurNette: number;
    reserves: number; reservesSRH: number;
    parService: Record<string, { libelle: string; chargesPrev: number; chargesReel: number; produitsPrev: number; produitsReel: number; tauxExecution: number }>;
    chargesNature?: Record<string, number>;
    produitsOrigine?: Record<string, number>;
    prelevementsReserves?: { totalPrelevements: number };
  };
  indicateurs?: {
    effectif_eleves?: number; effectif_dp?: number; effectif_internes?: number;
    nb_repas_servis?: number; cout_denrees_repas?: number;
  };
  commentaireOrdonnateur?: string;
  historique?: HistoriqueRow[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n).replace(/[\u202F\u00A0]/g, ' ');
}
function pct(v: number): string {
  return `${(v * 100).toFixed(1)} %`;
}

// ── Helper: draw horizontal bar chart ──
function drawBar(doc: jsPDF, x: number, y: number, w: number, h: number, ratio: number, color: readonly number[]) {
  doc.setFillColor(235, 238, 245);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  const fillW = w * Math.min(Math.abs(ratio), 1);
  if (fillW > 1) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, fillW, h, 1.5, 1.5, 'F');
  }
}

export function generateDocumentCA(data: DocumentCAData): void {
  const { etab, R, indicateurs } = data;
  const doc = new jsPDF({ orientation: 'portrait' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ex = etab.exercice || new Date().getFullYear();

  // ════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ════════════════════════════════════════════════════════════
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 65, 'F');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT JOINT À LA CONVOCATION', pw / 2, 18, { align: 'center' });
  doc.text('DU CONSEIL D\'ADMINISTRATION', pw / 2, 28, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`Présentation du compte financier — Exercice ${ex}`, pw / 2, 42, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`${(etab.nom || '').toUpperCase()}`, pw / 2, 55, { align: 'center' });
  if (etab.uai) doc.text(`UAI : ${etab.uai}`, pw / 2, 62, { align: 'center' });

  // Identité
  doc.setTextColor(0);
  let y = 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Identification de l\'établissement', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 8;
  const infoLines = [
    ['Établissement', etab.nom || '—'],
    ['Type', etab.type || '—'],
    ['Commune', etab.commune || '—'],
    ['Académie', `${etab.regionAcademique || ''} — ${etab.academie || '—'}`],
    ['Ordonnateur', etab.ordonnateur || '—'],
    ['Agent comptable', etab.agentComptable || '—'],
    ['Secrétaire général', etab.secretaireGeneral || '—'],
    ['Exercice', `${ex}`],
  ];
  for (const [label, value] of infoLines) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, y);
    y += 6;
  }

  // Cadre réglementaire
  y += 6;
  doc.setFillColor(240, 243, 248);
  doc.rect(14, y, pw - 28, 22, 'F');
  doc.setFontSize(7);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'bold');
  doc.text('Cadre réglementaire', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Instruction codificatrice M9-6 du 12/02/2026 — Décret n° 2012-1246 du 07/11/2012 (RGCP)', 18, y + 12);
  doc.text('Ce document est soumis au vote du Conseil d\'Administration (Art. R421-64 Code de l\'Éducation)', 18, y + 18);

  // Sommaire
  y += 32;
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Sommaire', 14, y);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 8;
  const sommaire = [
    'Partie I — Exécution budgétaire',
    '   1.1  Résultat de l\'exercice',
    '   1.2  Exécution par service',
    '   1.3  Répartition des dépenses par nature',
    '   1.4  Origine des recettes',
    'Partie II — Santé financière',
    '   2.1  Structure patrimoniale (FDR, BFR, Trésorerie)',
    '   2.2  Capacité d\'autofinancement (CAF/IAF)',
    '   2.3  Réserves et immobilisations',
    '   2.4  Indicateurs de gestion',
  ];
  for (const line of sommaire) {
    doc.text(line, 20, y);
    y += 5.5;
  }

  // ════════════════════════════════════════════════════════════
  // PARTIE I — EXÉCUTION BUDGÉTAIRE
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  y = 14;

  // Title bar
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 12, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIE I — EXÉCUTION BUDGÉTAIRE', pw / 2, 8, { align: 'center' });

  y = 22;

  // 1.1 Résultat de l'exercice
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1.1  Résultat de l\'exercice', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['', 'Prévisions', 'Réalisations', 'Taux exéc.', 'Écart']],
    body: [
      [
        'CHARGES (dépenses)',
        fmt(R.totalChargesPrev),
        fmt(R.totalChargesReel),
        pct(R.tauxExecCharges),
        fmt(R.totalChargesReel - R.totalChargesPrev),
      ],
      [
        'PRODUITS (recettes)',
        fmt(R.totalProduitsPrev),
        fmt(R.totalProduitsReel),
        pct(R.tauxExecProduits),
        fmt(R.totalProduitsReel - R.totalProduitsPrev),
      ],
      [
        { content: 'RÉSULTAT BUDGÉTAIRE', styles: { fontStyle: 'bold' } },
        '',
        { content: fmt(R.resultatBudgetaire), styles: { fontStyle: 'bold', textColor: R.resultatBudgetaire >= 0 ? VERT : ROUGE } },
        '',
        '',
      ],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Commentary on result
  const isDeficit = R.resultatBudgetaire < 0;
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'italic');
  if (isDeficit) {
    const prelev = R.prelevementsReserves?.totalPrelevements || 0;
    if (prelev > 0) {
      doc.text(`Le déficit de ${fmt(Math.abs(R.resultatBudgetaire))} s'explique par ${fmt(prelev)} de prélèvements sur FDR votés en CA.`, 14, y);
    } else {
      doc.text(`Le résultat est déficitaire de ${fmt(Math.abs(R.resultatBudgetaire))}. Ce déficit sera imputé sur les réserves.`, 14, y);
    }
  } else {
    doc.text(`L'exercice ${ex} dégage un excédent budgétaire de ${fmt(R.resultatBudgetaire)}.`, 14, y);
  }
  y += 10;

  // 1.2 Exécution par service
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1.2  Exécution par service', 14, y);
  y += 6;

  const serviceRows = Object.entries(R.parService).map(([svc, d]) => {
    const tx = d.chargesPrev > 0 ? d.chargesReel / d.chargesPrev : 0;
    return [
      `${svc} — ${d.libelle}`,
      fmt(d.chargesPrev),
      fmt(d.chargesReel),
      pct(tx),
      fmt(d.produitsReel),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Service', 'Prévisions dép.', 'Réalisé dép.', 'Taux', 'Recettes']],
    body: serviceRows,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 1.3 Répartition des dépenses par nature
  if (y > ph - 60) { doc.addPage(); y = 20; }
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1.3  Répartition des dépenses par nature', 14, y);
  y += 6;

  const cn = R.chargesNature ?? {};
  const labels: Record<string, string> = { '60': 'Achats et approvisionnements', '61': 'Services extérieurs', '62': 'Autres services ext.', '63': 'Impôts et taxes', '64': 'Charges de personnel', '65': 'Autres charges gestion', '66': 'Charges financières', '67': 'Charges exceptionnelles', '68': 'Dotations amort./prov.' };
  const natureRows = Object.entries(cn)
    .filter(([, v]) => Math.abs(v) > 10)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => {
      const pctV = R.totalChargesReel > 0 ? v / R.totalChargesReel : 0;
      return [labels[k] || `Compte ${k}x`, fmt(v), pct(pctV)];
    });

  if (natureRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nature de la dépense', 'Montant', '% du total']],
      body: natureRows,
      headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 1.4 Origine des recettes
  if (y > ph - 60) { doc.addPage(); y = 20; }
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1.4  Origine des recettes', 14, y);
  y += 6;

  const po = R.produitsOrigine ?? {};
  let recEtat = 0, recCollectivite = 0, recPropres = 0, recTA = 0, recAutres = 0;
  Object.entries(po).forEach(([k, v]) => {
    if (['741', '744', '745', '746'].some(p => k.startsWith(p))) recEtat += v;
    else if (['742', '743', '747'].some(p => k.startsWith(p))) recCollectivite += v;
    else if (k.startsWith('748')) recTA += v;
    else if (['70', '71', '72', '75', '76'].some(p => k.startsWith(p))) recPropres += v;
    else recAutres += v;
  });

  const recetteRows = [
    ['État (bourses, subventions)', fmt(recEtat), pct(R.totalProduitsReel > 0 ? recEtat / R.totalProduitsReel : 0)],
    ['Collectivité territoriale', fmt(recCollectivite), pct(R.totalProduitsReel > 0 ? recCollectivite / R.totalProduitsReel : 0)],
    ['Taxe d\'apprentissage (C/748*)', fmt(recTA), pct(R.totalProduitsReel > 0 ? recTA / R.totalProduitsReel : 0)],
    ['Ressources propres', fmt(recPropres), pct(R.totalProduitsReel > 0 ? recPropres / R.totalProduitsReel : 0)],
    ['Autres', fmt(recAutres), pct(R.totalProduitsReel > 0 ? recAutres / R.totalProduitsReel : 0)],
    [{ content: 'TOTAL RECETTES', styles: { fontStyle: 'bold' as const } }, { content: fmt(R.totalProduitsReel), styles: { fontStyle: 'bold' as const } }, '100 %'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Origine', 'Montant', '% du total']],
    body: recetteRows,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  // ════════════════════════════════════════════════════════════
  // PARTIE II — SANTÉ FINANCIÈRE
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  y = 14;

  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 12, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIE II — SANTÉ FINANCIÈRE', pw / 2, 8, { align: 'center' });

  y = 22;

  // 2.1 Structure patrimoniale
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2.1  Structure patrimoniale (FDR, BFR, Trésorerie)', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur', 'En jours', 'Appréciation']],
    body: [
      ['Fonds de roulement (FDR)', fmt(R.fdrComptable), `${Math.round(R.joursFdr)} j`, R.fdrComptable >= 0 ? '✅ Positif' : '🔴 Négatif'],
      ['Besoin en FDR (BFR)', fmt(R.bfr), '', R.bfr <= R.fdrComptable ? '✅ Couvert par le FDR' : '⚠️ Supérieur au FDR'],
      ['Trésorerie nette', fmt(R.tresorerieNette), `${Math.round(R.joursAutonomie)} j`, R.joursAutonomie >= 30 ? '✅ > 30 jours' : R.joursAutonomie >= 15 ? '⚠️ Vigilance' : '🔴 Critique'],
      ['FDR mobilisable', fmt(R.fdrMobilisable), '', ''],
      ['TMcap (charges à payer)', pct(R.tmcap / 100), '', R.tmcap > 15 ? '⚠️ Élevé' : 'ℹ️ Normal'],
      ['TMnr (titres non recouvrés)', pct(R.tmnr / 100), '', R.tmnr > 20 ? '⚠️ Élevé' : '✅ Maîtrisé'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Equation
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'italic');
  const eqOk = Math.abs(R.fdrComptable - R.bfr - R.tresorerieNette) < 0.5;
  doc.text(`Vérification : FDR = BFR + Trésorerie → ${fmt(R.fdrComptable)} = ${fmt(R.bfr)} + ${fmt(R.tresorerieNette)}  ${eqOk ? '✅' : '❌'}`, 14, y);
  y += 10;

  // Visual bars
  const maxVal = Math.max(Math.abs(R.fdrComptable), Math.abs(R.bfr), Math.abs(R.tresorerieNette), 1);
  const barItems = [
    { label: 'FDR', value: R.fdrComptable, color: R.fdrComptable >= 0 ? VERT : ROUGE },
    { label: 'BFR', value: R.bfr, color: R.bfr <= R.fdrComptable ? VERT : ORANGE },
    { label: 'Trésorerie', value: R.tresorerieNette, color: R.tresorerieNette >= 0 ? VERT : ROUGE },
  ];
  for (const item of barItems) {
    doc.setFontSize(7);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, 14, y);
    drawBar(doc, 42, y - 3, 100, 4, Math.abs(item.value) / maxVal, item.color);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(fmt(item.value), 148, y);
    y += 8;
  }

  y += 6;

  // 2.2 CAF/IAF
  if (y > ph - 60) { doc.addPage(); y = 20; }
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2.2  Capacité d\'autofinancement (CAF/IAF)', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Composante', 'Montant']],
    body: [
      ['Résultat comptable de l\'exercice', fmt(R.resultatComptable)],
      ['+ Charges non décaissables (C/68, C/675)', fmt(R.chargesNonDecaissables)],
      ['− Produits non encaissables (C/78, C/775-777)', fmt(R.produitsNonEncaissables)],
      [{ content: R.cafBudgetaire >= 0 ? '= CAF BUDGÉTAIRE' : '= IAF (Insuffisance d\'autofinancement)', styles: { fontStyle: 'bold', textColor: R.cafBudgetaire >= 0 ? VERT : ROUGE } },
       { content: fmt(R.cafBudgetaire), styles: { fontStyle: 'bold', textColor: R.cafBudgetaire >= 0 ? VERT : ROUGE } }],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'italic');
  if (R.cafBudgetaire >= 0) {
    doc.text(`L'établissement dégage une capacité d'autofinancement de ${fmt(R.cafBudgetaire)}, lui permettant de financer ses investissements.`, 14, y);
  } else {
    doc.text(`Insuffisance d'autofinancement de ${fmt(Math.abs(R.cafBudgetaire))} : l'établissement prélève sur ses réserves pour financer son fonctionnement.`, 14, y);
  }
  y += 10;

  // 2.3 Réserves et immobilisations
  if (y > ph - 60) { doc.addPage(); y = 20; }
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2.3  Réserves et immobilisations', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Élément', 'Montant']],
    body: [
      ['Réserves (C/1068)', fmt(R.reserves)],
      ['dont réserves SRH', fmt(R.reservesSRH)],
      ['Immobilisations brutes', fmt(R.totalImmo)],
      ['Amortissements cumulés', fmt(R.totalAmortissements)],
      [{ content: 'Valeur nette du patrimoine', styles: { fontStyle: 'bold' } }, { content: fmt(R.valeurNette), styles: { fontStyle: 'bold' } }],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 2.4 Indicateurs de gestion
  if (y > ph - 60) { doc.addPage(); y = 20; }
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2.4  Indicateurs de gestion', 14, y);
  y += 6;

  const gestionRows: (string | { content: string; styles?: any })[][] = [
    ['Taux d\'exécution des dépenses', pct(R.tauxExecCharges), R.tauxExecCharges >= 0.85 ? '✅ Bon' : '⚠️ Sous-exécution'],
    ['Taux d\'exécution des recettes', pct(R.tauxExecProduits), R.tauxExecProduits >= 0.90 ? '✅ Bon' : '⚠️ Sous-recouvrement'],
    ['Autonomie financière (FDR en jours)', `${Math.round(R.joursFdr)} jours`, R.joursFdr >= 30 ? '✅ > 30 j' : '⚠️ < 30 j'],
    ['Autonomie de trésorerie', `${Math.round(R.joursAutonomie)} jours`, R.joursAutonomie >= 30 ? '✅ Confortable' : '⚠️ Tendue'],
    ['Créances (total)', fmt(R.totalCreances), ''],
    ['Dettes (total)', fmt(R.totalDettes), ''],
  ];

  // Add restaurant/viabilisation indicators if available
  if (indicateurs?.nb_repas_servis) {
    gestionRows.push(['Nombre de repas servis', `${indicateurs.nb_repas_servis.toLocaleString('fr-FR')}`, '']);
  }
  if (indicateurs?.cout_denrees_repas) {
    gestionRows.push(['Coût denrées par repas', fmt(indicateurs.cout_denrees_repas), indicateurs.cout_denrees_repas <= 2.5 ? '✅ Maîtrisé' : '⚠️ Élevé']);
  }
  if (indicateurs?.effectif_eleves) {
    gestionRows.push(['Effectif élèves', `${indicateurs.effectif_eleves}`, '']);
  }

  // Viabilisation
  const cn60 = cn['60'] ?? 0;
  const viabilisation = (cn['61'] ?? 0) + (cn['62'] ?? 0);
  if (viabilisation > 0) {
    gestionRows.push(['Viabilisation (C/61+62)', fmt(viabilisation), pct(R.totalChargesReel > 0 ? viabilisation / R.totalChargesReel : 0)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur', 'Appréciation']],
    body: gestionRows,
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ════════════════════════════════════════════════════════════
  // COMMENTAIRES DE L'ORDONNATEUR
  // ════════════════════════════════════════════════════════════
  if (data.commentaireOrdonnateur && data.commentaireOrdonnateur.trim()) {
    if (y > ph - 80) { doc.addPage(); y = 20; }
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Commentaires de l\'ordonnateur — Faits caractéristiques', 14, y);
    y += 6;
    doc.setFillColor(245, 247, 252);
    const lines = doc.splitTextToSize(data.commentaireOrdonnateur.trim(), pw - 32);
    const blockH = Math.max(lines.length * 4.5 + 8, 16);
    doc.rect(14, y, pw - 28, blockH, 'F');
    doc.setTextColor(40);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 18, y + 5);
    y += blockH + 8;
  }

  // ════════════════════════════════════════════════════════════
  // SIGNATURES
  // ════════════════════════════════════════════════════════════
  if (y > ph - 50) { doc.addPage(); y = 20; }

  doc.setFillColor(240, 243, 248);
  doc.rect(14, y, pw - 28, 36, 'F');
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce document est soumis au vote du Conseil d\'Administration conformément à l\'article R421-64 du Code de l\'Éducation.', 18, y + 7);
  doc.text('Le compte financier est voté par le Conseil d\'Administration et transmis au comptable supérieur.', 18, y + 13);

  y += 24;
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const colW = (pw - 28) / 2;
  // Ordonnateur
  doc.setFont('helvetica', 'bold');
  doc.text('L\'Ordonnateur', 14 + colW / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(etab.ordonnateur || '________________________', 14 + colW / 2, y + 6, { align: 'center' });
  doc.text('Date et signature :', 14 + colW / 2, y + 14, { align: 'center' });

  // Agent comptable
  doc.setFont('helvetica', 'bold');
  doc.text('L\'Agent Comptable', 14 + colW + colW / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(etab.agentComptable || '________________________', 14 + colW + colW / 2, y + 6, { align: 'center' });
  doc.text('Date et signature :', 14 + colW + colW / 2, y + 14, { align: 'center' });

  // Footers
  addPDFFooters(doc, `Document CA — ${etab.nom} — Exercice ${ex}`);

  doc.save(`Document_CA_${etab.uai || 'EPLE'}_${ex}.pdf`);
}
