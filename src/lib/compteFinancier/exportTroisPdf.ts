// ═══════════════════════════════════════════════════════════════════
// COFI — Export unifié des 3 PDF finaux + ZIP + JSON (chantiers 9-10)
//
// Génère :
//   1. Rapport_Ordonnateur_<UAI>_<Exercice>.pdf
//   2. Rapport_Agent_Comptable_<UAI>_<Exercice>.pdf
//   3. Annexe_Comptable_<UAI>_<Exercice>.pdf
//
// Avec en-tête institutionnel (RF + MEN + Académie + lycée).
// Filigrane "PROJET" tant que le compte financier n'est pas voté.
// Compression cible < 20 Mo.
//
// Bundles aussi un export ZIP et un export JSON des indicateurs clés
// pour transmission rectorat / DDFiP / CRC.
// ═══════════════════════════════════════════════════════════════════
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';

export interface CofiExportContext {
  /** UAI de l'EPLE (ex : "9710001A"). */
  uai: string;
  /** Nom de l'établissement. */
  nom: string;
  /** Exercice budgétaire (année). */
  exercice: number;
  /** Académie. */
  academie?: string;
  /** Commune siège. */
  commune?: string;
  /** Ordonnateur signataire. */
  ordonnateur?: string;
  /** Agent comptable signataire. */
  agentComptable?: string;
  /** True tant que le CF n'est pas voté en CA → applique filigrane PROJET. */
  isProjet: boolean;
}

export interface CofiExportPayload {
  /** Indicateurs ordonnateur (sections A à D). */
  ordo: Record<string, unknown>;
  /** Indicateurs AC (pièce 14, REPROFI, ratios). */
  ac: Record<string, unknown>;
  /** Annexe (11 composantes). */
  annexe: Record<string, unknown>;
}

const RF_BLUE: [number, number, number] = [0, 35, 149]; // bleu République #002395
const RF_RED:  [number, number, number] = [237, 41, 57];

function pageSize(doc: jsPDF) {
  return { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
}

/** En-tête institutionnel A4 (Marianne fallback Arial via jsPDF default). */
function drawHeader(doc: jsPDF, ctx: CofiExportContext, label: string) {
  const { w } = pageSize(doc);
  doc.setFillColor(...RF_BLUE);
  doc.rect(0, 0, w, 14, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 14, w, 1, 'F');
  doc.setFillColor(...RF_RED);
  doc.rect(0, 15, w, 0.6, 'F');

  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPUBLIQUE FRANÇAISE', 8, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Ministère de l\'Éducation nationale', 8, 12.5);

  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.text(`Académie : ${ctx.academie || '—'}`, w - 8, 9, { align: 'right' });
  doc.text(`UAI ${ctx.uai} · ${ctx.commune || ''}`, w - 8, 12.5, { align: 'right' });

  // Bandeau titre rapport
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(label, 8, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ctx.nom} — Exercice ${ctx.exercice}`, 8, 27);

  doc.setDrawColor(...RF_BLUE);
  doc.setLineWidth(0.3);
  doc.line(8, 30, w - 8, 30);
}

function drawFooter(doc: jsPDF, ctx: CofiExportContext, docRef: string) {
  const { w, h } = pageSize(doc);
  const totalPages = (doc as any).internal.getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text(
      `${docRef} · Compte financier ${ctx.exercice} · ${ctx.nom}`,
      8, h - 6,
    );
    doc.text(`Page ${p} / ${totalPages}`, w - 8, h - 6, { align: 'right' });
  }
}

/** Filigrane "PROJET" en diagonale sur toutes les pages. */
function drawWatermark(doc: jsPDF, text = 'PROJET') {
  const totalPages = (doc as any).internal.getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const { w, h } = pageSize(doc);
    doc.saveGraphicsState?.();
    // jsPDF doesn't natively support opacity for setTextColor across versions,
    // so we use a light gray that still reads as a faded watermark.
    doc.setTextColor(220, 80, 90);
    doc.setFontSize(80);
    doc.setFont('helvetica', 'bold');
    // diagonal centre
    doc.text(text, w / 2, h / 2, {
      align: 'center',
      angle: 30,
    });
    doc.restoreGraphicsState?.();
  }
}

/** Page de garde commune. */
function drawCover(doc: jsPDF, ctx: CofiExportContext, title: string, subtitle: string) {
  const { w, h } = pageSize(doc);
  // Bandes tricolores
  doc.setFillColor(...RF_BLUE);
  doc.rect(0, 0, w / 3, 25, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(w / 3, 0, w / 3, 25, 'F');
  doc.setFillColor(...RF_RED);
  doc.rect((2 * w) / 3, 0, w / 3, 25, 'F');

  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(title, w / 2, h / 2 - 30, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, w / 2, h / 2 - 18, { align: 'center' });

  doc.setFontSize(11);
  doc.text(ctx.nom, w / 2, h / 2, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`UAI ${ctx.uai} · ${ctx.commune || '—'} · ${ctx.academie || '—'}`,
    w / 2, h / 2 + 7, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Exercice budgétaire ${ctx.exercice}`, w / 2, h / 2 + 20, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(110);
  doc.text('M9-6 tomes 1-4 · GBCP 2012-1246 art. 51-52 · Code éducation R.421-77',
    w / 2, h - 18, { align: 'center' });
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`,
    w / 2, h - 12, { align: 'center' });
}

function buildOrdoPdf(ctx: CofiExportContext, payload: CofiExportPayload): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCover(doc, ctx, 'RAPPORT DE L\'ORDONNATEUR', 'Compte financier — Sphère ordonnateur (REPROFI)');

  // Sommaire
  doc.addPage();
  drawHeader(doc, ctx, 'Sommaire');
  doc.setFontSize(11);
  doc.setTextColor(0);
  let y = 40;
  const sections = [
    ['A.', 'Indicateurs structurels (présentation, services, effectifs, dotation)'],
    ['B.', 'Bilan budgétaire (DBM, masses, taux, codes activité, commande publique)'],
    ['C.', 'Exécution budgétaire par service (AP, VE, ALO, SRH, OPC)'],
    ['D.', 'Analyse de gestion (focus thématiques)'],
  ];
  for (const [n, t] of sections) {
    doc.setFont('helvetica', 'bold');
    doc.text(n, 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(t, 22, y);
    y += 8;
  }

  // Indicateurs (récapitulatif tabulaire — la version riche utilise IndicateurAvecVisuel
  // côté UI ; ici on produit un export DAF-friendly)
  doc.addPage();
  drawHeader(doc, ctx, 'Sections A → D · Synthèse');
  const ordoRows = Object.entries(payload.ordo).map(([k, v]) => [k, JSON.stringify(v).slice(0, 100)]);
  if (ordoRows.length > 0) {
    autoTable(doc, {
      startY: 36,
      head: [['Indicateur', 'Valeur (extrait)']],
      body: ordoRows,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: RF_BLUE, textColor: 255 },
      margin: { left: 8, right: 8 },
    });
  }

  // Signature
  doc.addPage();
  drawHeader(doc, ctx, 'Signature de l\'ordonnateur');
  doc.setFontSize(10);
  doc.text(`Fait à ${ctx.commune || '—'}, le ${new Date().toLocaleDateString('fr-FR')}`, 14, 50);
  doc.text(`L'ordonnateur : ${ctx.ordonnateur || '—'}`, 14, 70);
  doc.text('Signature :', 14, 90);
  doc.rect(14, 95, 70, 35);

  drawFooter(doc, ctx, 'Rapport ordonnateur');
  if (ctx.isProjet) drawWatermark(doc);
  return doc;
}

function buildAcPdf(ctx: CofiExportContext, payload: CofiExportPayload): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCover(doc, ctx, 'RAPPORT DE L\'AGENT COMPTABLE', 'Compte financier — Pièce 14 enrichie');

  doc.addPage();
  drawHeader(doc, ctx, 'Indicateurs bilanciels & REPROFI');
  const acRows = Object.entries(payload.ac).map(([k, v]) => [k, JSON.stringify(v).slice(0, 100)]);
  if (acRows.length > 0) {
    autoTable(doc, {
      startY: 36,
      head: [['Indicateur', 'Valeur']],
      body: acRows,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: RF_BLUE, textColor: 255 },
      margin: { left: 8, right: 8 },
    });
  }

  doc.addPage();
  drawHeader(doc, ctx, 'Signature de l\'agent comptable');
  doc.setFontSize(10);
  doc.text(`Fait à ${ctx.commune || '—'}, le ${new Date().toLocaleDateString('fr-FR')}`, 14, 50);
  doc.text(`L'agent comptable : ${ctx.agentComptable || '—'}`, 14, 70);
  doc.text('Signature :', 14, 90);
  doc.rect(14, 95, 70, 35);

  drawFooter(doc, ctx, 'Rapport agent comptable');
  if (ctx.isProjet) drawWatermark(doc);
  return doc;
}

function buildAnnexePdf(ctx: CofiExportContext, payload: CofiExportPayload): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawCover(doc, ctx, 'ANNEXE COMPTABLE', 'Compte financier — 11 composantes M9-6');

  doc.addPage();
  drawHeader(doc, ctx, '11 composantes réglementaires');
  const ann = Object.entries(payload.annexe);
  if (ann.length > 0) {
    autoTable(doc, {
      startY: 36,
      head: [['Composante', 'Contenu (extrait)']],
      body: ann.map(([k, v]) => [k, JSON.stringify(v).slice(0, 200)]),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: RF_BLUE, textColor: 255 },
      margin: { left: 8, right: 8 },
    });
  }

  drawFooter(doc, ctx, 'Annexe comptable');
  if (ctx.isProjet) drawWatermark(doc);
  return doc;
}

export function generateOrdoPdf(ctx: CofiExportContext, payload: CofiExportPayload): Blob {
  return buildOrdoPdf(ctx, payload).output('blob');
}
export function generateAcPdf(ctx: CofiExportContext, payload: CofiExportPayload): Blob {
  return buildAcPdf(ctx, payload).output('blob');
}
export function generateAnnexePdf(ctx: CofiExportContext, payload: CofiExportPayload): Blob {
  return buildAnnexePdf(ctx, payload).output('blob');
}

/** Export JSON structuré des indicateurs clés (transmission rectorale). */
export function generateIndicateursJson(ctx: CofiExportContext, payload: CofiExportPayload): Blob {
  const json = {
    meta: {
      uai: ctx.uai,
      nom: ctx.nom,
      exercice: ctx.exercice,
      academie: ctx.academie,
      commune: ctx.commune,
      isProjet: ctx.isProjet,
      generatedAt: new Date().toISOString(),
      conformite: ['M9-6 tomes 1-4', 'GBCP 2012-1246', 'Code éducation R.421-77'],
    },
    ordonnateur: payload.ordo,
    agentComptable: payload.ac,
    annexe: payload.annexe,
  };
  return new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
}

/** Bundle ZIP complet = 3 PDF + JSON indicateurs + manifest. */
export async function generateZipBundle(
  ctx: CofiExportContext,
  payload: CofiExportPayload,
): Promise<Blob> {
  const zip = new JSZip();
  const base = `compte_financier_${ctx.uai}_${ctx.exercice}`;

  zip.file(`${base}/01_rapport_ordonnateur.pdf`, generateOrdoPdf(ctx, payload));
  zip.file(`${base}/02_rapport_agent_comptable.pdf`, generateAcPdf(ctx, payload));
  zip.file(`${base}/03_annexe_comptable.pdf`, generateAnnexePdf(ctx, payload));
  zip.file(`${base}/indicateurs.json`, generateIndicateursJson(ctx, payload));
  zip.file(
    `${base}/MANIFEST.txt`,
    [
      `Compte financier — ${ctx.nom}`,
      `UAI : ${ctx.uai}`,
      `Exercice : ${ctx.exercice}`,
      `Statut : ${ctx.isProjet ? 'PROJET (filigrane appliqué)' : 'DÉFINITIF'}`,
      `Édité le : ${new Date().toLocaleString('fr-FR')}`,
      ``,
      `Contenu :`,
      ` 1. Rapport de l'ordonnateur (sections A → D, REPROFI)`,
      ` 2. Rapport de l'agent comptable (pièce 14 enrichie)`,
      ` 3. Annexe comptable (11 composantes M9-6)`,
      ` 4. Indicateurs structurés JSON`,
      ``,
      `Conformité : M9-6 tomes 1-4 · GBCP 2012-1246 art. 51-52 · Code éducation R.421-77`,
    ].join('\n'),
  );

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Helper UI : déclenche le téléchargement d'un Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}