// ═══════════════════════════════════════════════════════════════
// Noyau commun de génération .docx pour les pièces de marché
// En-tête institutionnel RF + MEN + Académie + logo établissement
// ═══════════════════════════════════════════════════════════════

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
  Header,
  Footer,
  PageNumber,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ImageRun,
  PageOrientation,
} from "docx";
import type { EstablishmentBranding } from "@/hooks/useEstablishmentBranding";
import type { Marche, FournisseurMarche } from "../types";

export interface DocContext {
  marche: Marche;
  branding: EstablishmentBranding | null;
  logoArrayBuffer: ArrayBuffer | null;
  fournisseurAttributaire?: FournisseurMarche | null;
}

// ───────── helpers ─────────
export const fmtDate = (d?: string | null) => {
  if (!d) return "____/____/______";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

export const fmtEur = (n: number) =>
  Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export function P(text: string, opts: Partial<{ bold: boolean; size: number; align: AlignmentType; color: string }> = {}) {
  return new Paragraph({
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color, font: "Arial" })],
    spacing: { after: 80 },
  });
}

export function H1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F3864" })],
  });
}

export function H2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "2E75B6" })],
  });
}

export function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [new TextRun({ text: "", font: "Arial" })] });
}

export function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}

export function buildHeader(ctx: DocContext) {
  const lines: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "RÉPUBLIQUE FRANÇAISE", bold: true, size: 18, font: "Arial", color: "1F3864" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Ministère de l'Éducation nationale — Académie de Guadeloupe", size: 16, font: "Arial" }),
      ],
    }),
  ];
  if (ctx.branding?.full_name) {
    lines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [new TextRun({ text: ctx.branding.full_name, bold: true, size: 18, font: "Arial" })],
      })
    );
  }
  if (ctx.branding?.address || ctx.branding?.city) {
    lines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${ctx.branding.address || ""} ${ctx.branding.postal_code || ""} ${ctx.branding.city || ""}`.trim(),
            size: 14,
            font: "Arial",
          }),
        ],
      })
    );
  }
  return new Header({ children: lines });
}

export function buildFooter(ctx: DocContext) {
  const ref = ctx.marche.reference_interne || "—";
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
        children: [
          new TextRun({ text: `Marché ${ref} — `, size: 14, font: "Arial", color: "666666" }),
          new TextRun({ text: ctx.branding?.full_name || "", size: 14, font: "Arial", color: "666666" }),
          new TextRun({ text: "    Page ", size: 14, font: "Arial", color: "666666" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, font: "Arial", color: "666666" }),
          new TextRun({ text: " / ", size: 14, font: "Arial", color: "666666" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, font: "Arial", color: "666666" }),
        ],
      }),
    ],
  });
}

export function titleBlock(ctx: DocContext, titre: string, sousTitre?: string) {
  const out: Paragraph[] = [];
  if (ctx.logoArrayBuffer) {
    try {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: "png",
              data: ctx.logoArrayBuffer,
              transformation: { width: 120, height: 120 },
            } as any),
          ],
          spacing: { before: 200, after: 120 },
        })
      );
    } catch {
      // fallback silencieux si format non supporté
    }
  }
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: titre.toUpperCase(), bold: true, size: 36, font: "Arial", color: "1F3864" })],
    })
  );
  if (sousTitre) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: sousTitre, italics: true, size: 22, font: "Arial", color: "555555" })],
      })
    );
  }
  return out;
}

export function infoTable(rows: { label: string; value: string }[]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows: rows.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              shading: { fill: "F2F4F8", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: r.label, bold: true, size: 20, font: "Arial" })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 6160, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: r.value || "—", size: 20, font: "Arial" })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

export function signatureBlock(branding: EstablishmentBranding | null, side: "ordonnateur" | "titulaire" | "double" = "ordonnateur") {
  const ord = branding?.signataire_ordonnateur || "L'Ordonnateur";
  const ville = branding?.city || "";
  if (side === "ordonnateur") {
    return [
      spacer(400),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `Fait à ${ville}, le ${new Date().toLocaleDateString("fr-FR")}`, size: 20, font: "Arial" })],
      }),
      spacer(),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: ord, bold: true, size: 22, font: "Arial" })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Ordonnateur", italics: true, size: 18, font: "Arial", color: "666666" })],
      }),
      spacer(800),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "(Signature)", italics: true, size: 18, font: "Arial", color: "999999" })],
      }),
    ];
  }
  if (side === "double") {
    return [
      spacer(400),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 4680, type: WidthType.DXA },
                margins: { top: 200, bottom: 200, left: 120, right: 120 },
                children: [
                  P("Pour l'établissement", { bold: true, size: 22 }),
                  P(ord, { size: 20 }),
                  P("Ordonnateur", { size: 18, color: "666666" }),
                  spacer(600),
                  P("(Signature, cachet)", { size: 18, color: "999999" }),
                ],
              }),
              new TableCell({
                width: { size: 4680, type: WidthType.DXA },
                margins: { top: 200, bottom: 200, left: 120, right: 120 },
                children: [
                  P("Pour le titulaire", { bold: true, size: 22 }),
                  P("Nom du représentant : __________________", { size: 20 }),
                  P("Qualité : __________________", { size: 18, color: "666666" }),
                  spacer(600),
                  P("(Signature, cachet)", { size: 18, color: "999999" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];
  }
  return [];
}

export async function buildDocxBuffer(
  ctx: DocContext,
  body: Paragraph[] | (Paragraph | Table)[],
  opts: { orientation?: "portrait" | "landscape" } = {}
): Promise<Blob> {
  const portrait = (opts.orientation || "portrait") === "portrait";
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "1F3864" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: portrait
              ? { width: 11906, height: 16838 } // A4 portrait
              : { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
            margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 },
          },
        },
        headers: { default: buildHeader(ctx) },
        footers: { default: buildFooter(ctx) },
        children: body as any,
      },
    ],
  });
  return Packer.toBlob(doc);
}

/** Charge le logo de l'établissement comme ArrayBuffer, ou null si KO. */
export async function loadLogoBuffer(logoUrl: string | null): Promise<ArrayBuffer | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
