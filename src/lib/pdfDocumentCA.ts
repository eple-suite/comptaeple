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
  const { etab, R } = data;
  const doc = new jsPDF({ orientation: 'portrait' });
  const pw = doc.internal.pageSize.getWidth();
  const ex = etab.exercice || new Date().getFullYear();

  const drawHeader = (title: string, subtitle: string) => {
    doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.rect(0, 0, pw, 16, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 14, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(subtitle, 14, 14);
    doc.setTextColor(0);
  };

  drawHeader(
    'DOCUMENT CA \u2014 SPHERE ORDONNATEUR',
    `${etab.nom || 'Etablissement'} \u00B7 UAI ${etab.uai || '\u2014'} \u00B7 Exercice ${ex}`,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Tableau 1 \u2014 Execution budgetaire', 14, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Synthese strictement budgetaire : depenses, recettes, resultat et taux d\'execution.', 14, 33);

  autoTable(doc, {
    startY: 38,
    head: [['Indicateur ordonnateur', 'Valeur N', 'Valeur N-1']],
    body: [
      ['Credits / recettes ouverts', fmt(R.totalChargesPrev), fmt(R.totalProduitsPrev)],
      ['Depenses mandatees / payees', fmt(R.totalChargesSde), fmt(R.totalChargesSdeN1 || 0)],
      ['Recettes encaissees', fmt(R.totalProduitsSdr), fmt(R.totalProduitsSdrN1 || 0)],
      ['Resultat budgetaire', fmt(R.resultatBudgetaire), fmt(R.resultatBudgetaireN1 || 0)],
      ['Taux d\'execution des depenses', pct(R.tauxExecCharges), '\u2014'],
      ['Taux d\'execution des recettes', pct(R.tauxExecProduits), '\u2014'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  const resultComment = R.resultatBudgetaire >= 0
    ? `L'exercice ${ex} presente un excedent budgetaire de ${fmt(R.resultatBudgetaire)}.`
    : `L'exercice ${ex} presente un deficit budgetaire de ${fmt(Math.abs(R.resultatBudgetaire))}.`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(70);
  doc.text(resultComment, 14, (doc as any).lastAutoTable.finalY + 8);

  doc.addPage();
  drawHeader(
    'DOCUMENT CA \u2014 SPHERE COMPTABLE',
    `${etab.nom || 'Etablissement'} \u00B7 separation ordonnateur / agent comptable respectee`,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Tableau 2 \u2014 Sante financiere et patrimoniale', 14, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Synthese strictement comptable : FDR, tresorerie, CAF, patrimoine et ratios clefs.', 14, 33);

  autoTable(doc, {
    startY: 38,
    head: [['Indicateur comptable', 'Valeur']],
    body: [
      ['Fonds de roulement (FDR)', fmt(R.fdrComptable)],
      ['Jours de FDR', `${(R.joursFdr ?? 0).toFixed(2)} jours`],
      ['Tresorerie nette', fmt(R.tresorerie)],
      ['Jours de tresorerie', `${(R.joursTresorerie ?? 0).toFixed(2)} jours`],
      ['Besoin en fonds de roulement (BFR)', fmt(R.bfr)],
      ['Part encaissee du FDR', `${fmt(R.fdrPartEncaissee ?? 0)} (${(R.fdrPctEncaissee ?? 0).toFixed(2)} %)`],
      ['Part non encaissee du FDR', `${fmt(R.fdrPartNonEncaissee ?? 0)} (${(R.fdrPctNonEncaissee ?? 0).toFixed(2)} %)`],
      ['Capacite d\'autofinancement', fmt(R.cafBudgetaire)],
      ['Autonomie financiere', `${((R.ratioAutonomieFinanciere ?? 0) * 100).toFixed(2)} %`],
      ['TMcap', `${(R.tmcap ?? 0).toFixed(2)} %`],
      ['TMnr', `${(R.tmnr ?? 0).toFixed(2)} %`],
      ['Reserves', fmt(R.reserves)],
      ['Immobilisations nettes', fmt(R.valeurNette)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' } },
  });

  addPDFFooters(doc, `Document CA \u2014 ${etab.nom} \u2014 Exercice ${ex}`);

  doc.save(`Document_CA_${etab.uai || 'EPLE'}_${ex}.pdf`);
}
