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
    'DOCUMENT CA — SPHÈRE ORDONNATEUR',
    `${etab.nom || 'Établissement'} · UAI ${etab.uai || '—'} · Exercice ${ex}`,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Tableau 1 — Exécution budgétaire', 14, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Synthèse strictement budgétaire : dépenses, recettes, résultat et taux d’exécution.', 14, 33);

  autoTable(doc, {
    startY: 38,
    head: [['Indicateur ordonnateur', 'Valeur N', 'Valeur N-1']],
    body: [
      ['Crédits / recettes ouverts', fmt(R.totalChargesPrev), fmt(R.totalProduitsPrev)],
      ['Dépenses mandatées / payées', fmt(R.totalChargesReel), fmt(R.totalChargesSdeN1 || 0)],
      ['Recettes encaissées', fmt(R.totalProduitsReel), fmt(R.totalProduitsSdrN1 || 0)],
      ['Résultat budgétaire', fmt(R.resultatBudgetaire), fmt(R.resultatBudgetaireN1 || 0)],
      ['Taux d’exécution des dépenses', pct(R.tauxExecCharges), '—'],
      ['Taux d’exécution des recettes', pct(R.tauxExecProduits), '—'],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  const resultComment = R.resultatBudgetaire >= 0
    ? `L’exercice ${ex} présente un excédent budgétaire de ${fmt(R.resultatBudgetaire)}.`
    : `L’exercice ${ex} présente un déficit budgétaire de ${fmt(Math.abs(R.resultatBudgetaire))}.`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(70);
  doc.text(resultComment, 14, (doc as any).lastAutoTable.finalY + 8);

  doc.addPage();
  drawHeader(
    'DOCUMENT CA — SPHÈRE COMPTABLE',
    `${etab.nom || 'Établissement'} · séparation ordonnateur / agent comptable respectée`,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Tableau 2 — Santé financière et patrimoniale', 14, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Synthèse strictement comptable : FDR, trésorerie, CAF, patrimoine et ratios clefs.', 14, 33);

  autoTable(doc, {
    startY: 38,
    head: [['Indicateur comptable', 'Valeur']],
    body: [
      ['Fonds de roulement (FDR)', fmt(R.fdrComptable)],
      ['Trésorerie nette', fmt(R.tresorerieNette)],
      ['Part encaissée du FDR', `${fmt(R.fdrPartEncaissee)} (${R.fdrPctEncaissee.toFixed(2)} %)`],
      ['Part non encaissée du FDR', `${fmt(R.fdrPartNonEncaissee)} (${R.fdrPctNonEncaissee.toFixed(2)} %)`],
      ['Capacité d’autofinancement', fmt(R.cafBudgetaire)],
      ['Autonomie financière', `${(R.ratioAutonomieFinanciere * 100).toFixed(2)} %`],
      ['TMcap', `${R.tmcap.toFixed(2)} %`],
      ['TMnr', `${R.tmnr.toFixed(2)} %`],
      ['Réserves', fmt(R.reserves)],
      ['Immobilisations nettes', fmt(R.valeurNette)],
    ],
    headStyles: { fillColor: [BLEU[0], BLEU[1], BLEU[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right' } },
  });

  addPDFFooters(doc, `Document CA — ${etab.nom} — Exercice ${ex}`);

  doc.save(`Document_CA_${etab.uai || 'EPLE'}_${ex}.pdf`);
}
