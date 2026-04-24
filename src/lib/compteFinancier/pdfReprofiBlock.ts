// =====================================================================
// Bloc PDF — Indicateurs REPROFI 4.6 + Réserves (M9-6)
// ---------------------------------------------------------------------
// Bloc réutilisable pour jsPDF, intégrable dans :
//   • le rapport de l'agent comptable (paysage A4)
//   • le document joint à la convocation du CA (portrait A4)
//
// Rendu : grille des 10 indicateurs + bandeau Réserves + verdict synthèse,
//         tout en respectant les couleurs REPROFI (critique/fragile/normal/
//         confortable/excellent).
// =====================================================================

import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PanierReprofi, IndicateurReprofi, Niveau, DetailReserves } from './reprofiIndicateursEngine';
import type { SyntheseCommentaires } from './commentairesEngine';

type RGB = [number, number, number];

const COULEURS_NIVEAU: Record<Niveau, { bg: RGB; bgLight: RGB; text: RGB; label: string }> = {
  critique:    { bg: [220, 38, 38],   bgLight: [254, 226, 226], text: [127, 29, 29],  label: 'CRITIQUE'    },
  fragile:     { bg: [234, 88, 12],   bgLight: [255, 237, 213], text: [124, 45, 18],  label: 'FRAGILE'     },
  normal:      { bg: [202, 138, 4],   bgLight: [254, 243, 199], text: [113, 63, 18],  label: 'NORMAL'      },
  confortable: { bg: [22, 163, 74],   bgLight: [220, 252, 231], text: [20, 83, 45],   label: 'CONFORTABLE' },
  excellent:   { bg: [21, 128, 61],   bgLight: [187, 247, 208], text: [20, 83, 45],   label: 'EXCELLENT'   },
};

const BLEU: RGB = [0, 35, 149];
const GRIS: RGB = [100, 100, 100];
const NOIR: RGB = [25, 25, 25];

function sanitize(s: string): string {
  return s
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/[«»“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[€]/g, 'EUR')
    .replace(/[^\x00-\x7F]/g, c => {
      const map: Record<string, string> = {
        'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C',
        'È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I',
        'Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y',
        'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c',
        'è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i',
        'ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','ÿ':'y',
        '°':'deg','…':'...','•':'-','·':'-','✓':'OK','✗':'X',
      };
      return map[c] ?? '';
    });
}

function fmtVal(ind: IndicateurReprofi): string {
  if (ind.unite === '€') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(ind.valeur).replace(/[\u202F\u00A0]/g, ' ').replace(/€/g, 'EUR');
  }
  if (ind.unite === '%') return `${ind.valeur.toFixed(1)} %`;
  if (ind.unite === 'années') return `${ind.valeur.toFixed(1)} ans`;
  return ind.valeur.toFixed(2);
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(n).replace(/[\u202F\u00A0]/g, ' ').replace(/€/g, 'EUR');
}

/**
 * Dessine le bloc REPROFI complet sur la page courante du document.
 * Gère automatiquement les sauts de page si nécessaire.
 *
 * @returns la coordonnée Y en bas du bloc, pour la suite du document.
 */
export interface ReprofiBlockOptions {
  /** Marge gauche/droite en mm. */
  margin?: number;
  /** Largeur disponible en mm (par défaut : pageWidth - 2*margin). */
  width?: number;
  /** Synthèse rédigée à insérer en haut du bloc (optionnel). */
  synthese?: SyntheseCommentaires;
  /** Inclure le panneau « Réserves » détaillé (M9-6 art. 43231). */
  inclureReserves?: boolean;
  /** Titre principal du bloc. */
  titre?: string;
}

export function dessinerBlocReprofi(
  doc: jsPDF,
  startY: number,
  panier: PanierReprofi,
  opts: ReprofiBlockOptions = {},
): number {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = opts.margin ?? 14;
  const width = opts.width ?? pw - 2 * margin;
  const titre = opts.titre ?? 'Diagnostic REPROFI 4.6 — 10 indicateurs reglementaires';
  let y = startY;

  // Saut de page si trop bas
  if (y > ph - 80) { doc.addPage(); y = 18; }

  // ─── En-tête de section ───────────────────────────────────────
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.roundedRect(margin, y, width, 9, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(titre.toUpperCase()), margin + width / 2, y + 6.2, { align: 'center' });
  y += 13;

  // ─── Synthèse (verdict + 1 paragraphe) ────────────────────────
  if (opts.synthese) {
    const verdict = opts.synthese.verdict;
    // Choisir une couleur en fonction de la première lettre du verdict
    let bg: RGB = COULEURS_NIVEAU.confortable.bgLight;
    let txt: RGB = COULEURS_NIVEAU.confortable.text;
    if (verdict.includes('risque') || verdict.includes('critique')) {
      bg = COULEURS_NIVEAU.critique.bgLight; txt = COULEURS_NIVEAU.critique.text;
    } else if (verdict.includes('vigilance') || verdict.includes('Situation deficitaire') || verdict.includes('déficitaire')) {
      bg = COULEURS_NIVEAU.fragile.bgLight; txt = COULEURS_NIVEAU.fragile.text;
    }
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(margin, y, width, 12, 1.5, 1.5, 'F');
    doc.setTextColor(txt[0], txt[1], txt[2]);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitize(verdict), margin + 4, y + 7.5);
    y += 16;

    // Paragraphe REPROFI (court)
    doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const lignes = doc.splitTextToSize(sanitize(opts.synthese.reprofi), width - 4);
    for (const l of lignes) {
      if (y > ph - 25) { doc.addPage(); y = 18; }
      doc.text(l, margin + 2, y);
      y += 3.6;
    }
    y += 3;
  }

  // ─── Bloc Réserves (M9-6 tome 4 art. 43231) ───────────────────
  if (opts.inclureReserves !== false) {
    if (y > ph - 60) { doc.addPage(); y = 18; }
    doc.setFillColor(245, 247, 252);
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    const reservesH = 28;
    doc.roundedRect(margin, y, width, reservesH, 1.5, 1.5, 'FD');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(sanitize("Reserves (M9-6 tome 4 art. 43231) - 5 rubriques reglementaires"), margin + 4, y + 5.5);

    const r = panier.reserves;
    const cellW = (width - 8) / 5;
    const cellY = y + 8;
    const items: Array<{ code: string; lib: string; val: number }> = [
      { code: '10681', lib: 'SRH',          val: r.reservesSRH },
      { code: '10682', lib: 'Generales',    val: r.reservesGenerales },
      { code: '10683', lib: 'Taxe appr.',   val: r.reservesTaxeApprent },
      { code: '10687', lib: 'Affectees',    val: r.reservesAffectees },
      { code: '1068x', lib: 'Autres',       val: r.reservesAutres },
    ];
    items.forEach((it, i) => {
      const cx = margin + 4 + i * cellW;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
      doc.text(sanitize(`${it.code} - ${it.lib}`), cx, cellY + 3);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
      doc.text(fmtEur(it.val), cx, cellY + 9);
    });
    // Total à droite
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.text(`TOTAL : ${fmtEur(r.total)}`, margin + width - 4, y + 5.5, { align: 'right' });
    y += reservesH + 5;
  }

  // ─── Tableau des 9 indicateurs (autoTable) ─────────────────────
  if (y > ph - 50) { doc.addPage(); y = 18; }
  const rows = panier.indicateurs.map(ind => {
    const c = COULEURS_NIVEAU[ind.niveau];
    return [
      ind.code,
      sanitize(ind.libelle),
      fmtVal(ind),
      c.label,
      sanitize(ind.commentaire),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: width,
    head: [['Code', 'Indicateur', 'Valeur', 'Niveau', 'Commentaire technique']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.6, lineColor: [220, 225, 235], lineWidth: 0.15, valign: 'middle' },
    headStyles: { fillColor: BLEU as unknown as [number, number, number], textColor: 255, fontStyle: 'bold', fontSize: 7.5, halign: 'left' },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: width * 0.28 },
      2: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const ind = panier.indicateurs[data.row.index];
        if (ind) {
          const c = COULEURS_NIVEAU[ind.niveau];
          data.cell.styles.fillColor = c.bg;
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
      if (data.section === 'body' && data.column.index === 2) {
        const ind = panier.indicateurs[data.row.index];
        if (ind) {
          const c = COULEURS_NIVEAU[ind.niveau];
          data.cell.styles.fillColor = c.bgLight;
          data.cell.styles.textColor = c.text;
        }
      }
    },
  });

  // @ts-ignore lastAutoTable
  const after = (doc as any).lastAutoTable?.finalY ?? y + 50;
  return after + 4;
}

/**
 * Variante : page autonome dédiée au diagnostic REPROFI.
 * Insère un saut de page propre, dessine le bloc + ajoute un footer "REPROFI 4.6".
 */
export function ajouterPageReprofi(
  doc: jsPDF,
  panier: PanierReprofi,
  opts: ReprofiBlockOptions = {},
): void {
  doc.addPage();
  // Bandeau institutionnel haut
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(0, 0, pw, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(sanitize('DIAGNOSTIC REPROFI 4.6 - INDICATEURS REGLEMENTAIRES'), pw / 2, 8, { align: 'center' });

  dessinerBlocReprofi(doc, 18, panier, {
    inclureReserves: true,
    ...opts,
    titre: opts.titre ?? '10 indicateurs additionnels (REPROFI 4.6) + Reserves (M9-6 art. 43231)',
  });
}