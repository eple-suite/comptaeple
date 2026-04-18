/**
 * Générateur Word universel — utilise la personnalisation EPLE (logo, signataires, couleurs)
 * Tous les rapports modules s'appuient sur buildWordReport() pour rester cohérents.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, PageOrientation,
  WidthType, BorderStyle, ShadingType, HeadingLevel, PageNumber,
  TabStopType, TabStopPosition, LevelFormat,
} from "docx";
import { saveAs } from "file-saver";
import type { EstablishmentBranding } from "@/hooks/useEstablishmentBranding";

export type WordSection =
  | { kind: "heading"; text: string; level?: 1 | 2 | 3 }
  | { kind: "paragraph"; text: string; bold?: boolean; italic?: boolean }
  | { kind: "spacer" }
  | { kind: "kpis"; items: { label: string; value: string; sub?: string }[] }
  | { kind: "table"; head: string[]; rows: string[][]; columnWidthsPct?: number[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "callout"; tone: "info" | "success" | "warning" | "danger"; title?: string; text: string }
  | { kind: "signatures" };

export interface WordReportInput {
  title: string;
  subtitle?: string;
  branding: EstablishmentBranding | null;
  orientation?: "portrait" | "landscape";
  sections: WordSection[];
  filename: string;
}

const PAGE_WIDTH_PORTRAIT = 11906; // A4
const PAGE_HEIGHT_PORTRAIT = 16838;
const MARGIN = 1134; // ~2cm

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 37;
  const g = parseInt(clean.substring(2, 4), 16) || 68;
  const b = parseInt(clean.substring(4, 6), 16) || 120;
  return [r, g, b];
};

async function fetchLogoBuffer(url: string): Promise<{ buffer: ArrayBuffer; type: "png" | "jpg" | "gif" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let type: "png" | "jpg" | "gif" = "png";
    if (ct.includes("jpeg") || ct.includes("jpg")) type = "jpg";
    else if (ct.includes("gif")) type = "gif";
    else if (url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) type = "jpg";
    return { buffer: buf, type };
  } catch {
    return null;
  }
}

const calloutColors = {
  info: { fill: "EAF2FB", border: "254478" },
  success: { fill: "E8F5EE", border: "1F8A4C" },
  warning: { fill: "FFF6E5", border: "C77700" },
  danger: { fill: "FBEAEA", border: "B42318" },
};

function buildSection(section: WordSection, primaryHex: string): Paragraph | Table | (Paragraph | Table)[] {
  const primary = primaryHex.replace("#", "").toUpperCase();

  switch (section.kind) {
    case "heading": {
      const level = section.level || 1;
      const headingMap = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };
      const sizeMap = { 1: 28, 2: 24, 3: 22 };
      return new Paragraph({
        heading: headingMap[level],
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: section.text, bold: true, size: sizeMap[level], color: primary })],
      });
    }
    case "paragraph":
      return new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: section.text, bold: section.bold, italics: section.italic, size: 22 })],
      });
    case "spacer":
      return new Paragraph({ spacing: { after: 240 }, children: [] });
    case "bullets":
      return section.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            children: [new TextRun({ text: item, size: 22 })],
          })
      );
    case "kpis": {
      const cellW = Math.floor(9000 / section.items.length);
      return new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: section.items.map(() => cellW),
        rows: [
          new TableRow({
            children: section.items.map(
              (it) =>
                new TableCell({
                  width: { size: cellW, type: WidthType.DXA },
                  margins: { top: 120, bottom: 120, left: 120, right: 120 },
                  shading: { fill: "F5F8FC", type: ShadingType.CLEAR },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: primary },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: primary },
                    left: { style: BorderStyle.SINGLE, size: 4, color: primary },
                    right: { style: BorderStyle.SINGLE, size: 4, color: primary },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: it.label, size: 16, color: "555555" })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: it.value, bold: true, size: 28, color: primary })],
                    }),
                    ...(it.sub
                      ? [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: it.sub, size: 14, color: "888888", italics: true })],
                          }),
                        ]
                      : []),
                  ],
                })
            ),
          }),
        ],
      });
    }
    case "table": {
      const cols = section.head.length;
      const tableW = 9000;
      const widths = section.columnWidthsPct
        ? section.columnWidthsPct.map((p) => Math.floor((tableW * p) / 100))
        : Array(cols).fill(Math.floor(tableW / cols));
      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
      const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

      return new Table({
        width: { size: tableW, type: WidthType.DXA },
        columnWidths: widths,
        rows: [
          new TableRow({
            tableHeader: true,
            children: section.head.map(
              (h, i) =>
                new TableCell({
                  width: { size: widths[i], type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  shading: { fill: primary, type: ShadingType.CLEAR },
                  borders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                })
            ),
          }),
          ...section.rows.map(
            (row, rIdx) =>
              new TableRow({
                children: row.map(
                  (cell, i) =>
                    new TableCell({
                      width: { size: widths[i], type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      shading: { fill: rIdx % 2 === 0 ? "FFFFFF" : "F5F8FC", type: ShadingType.CLEAR },
                      borders,
                      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                    })
                ),
              })
          ),
        ],
      });
    }
    case "callout": {
      const c = calloutColors[section.tone];
      return new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [9000],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 9000, type: WidthType.DXA },
                margins: { top: 160, bottom: 160, left: 200, right: 200 },
                shading: { fill: c.fill, type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.SINGLE, size: 24, color: c.border },
                },
                children: [
                  ...(section.title
                    ? [
                        new Paragraph({
                          spacing: { after: 80 },
                          children: [new TextRun({ text: section.title, bold: true, size: 22, color: c.border })],
                        }),
                      ]
                    : []),
                  new Paragraph({
                    children: [new TextRun({ text: section.text, size: 20, color: "333333" })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }
    case "signatures": {
      return new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [4500, 4500],
        rows: [
          new TableRow({
            children: ["L'Ordonnateur", "L'Agent comptable"].map(
              (label) =>
                new TableCell({
                  width: { size: 4500, type: WidthType.DXA },
                  margins: { top: 240, bottom: 800, left: 120, right: 120 },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "888888" },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: label, italics: true, size: 18, color: "666666" })],
                    }),
                  ],
                })
            ),
          }),
        ],
      });
    }
  }
}

export async function buildWordReport(input: WordReportInput): Promise<void> {
  const branding = input.branding;
  const primaryHex = (branding?.primary_color || "#254478").replace("#", "");
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  // Logo
  let logoChildren: (TextRun | ImageRun)[] = [];
  if (branding?.logo_url) {
    const logo = await fetchLogoBuffer(branding.logo_url);
    if (logo) {
      logoChildren = [
        new ImageRun({
          type: logo.type as any,
          data: logo.buffer,
          transformation: { width: 80, height: 80 },
          altText: { title: "Logo", description: "Logo établissement", name: "logo" },
        }),
      ];
    }
  }

  const headerRightLines = [
    branding?.full_name || "",
    [branding?.address, [branding?.postal_code, branding?.city].filter(Boolean).join(" ")].filter(Boolean).join(" — "),
    [branding?.phone && `Tél : ${branding.phone}`, branding?.email].filter(Boolean).join(" • "),
  ].filter(Boolean);

  const headerTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [1800, 7200],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: 80 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            children: [new Paragraph({ children: logoChildren })],
          }),
          new TableCell({
            width: { size: 7200, type: WidthType.DXA },
            margins: { top: 0, bottom: 80, left: 80, right: 0 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: primaryHex },
            },
            children: headerRightLines.length
              ? headerRightLines.map(
                  (line, idx) =>
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: line,
                          size: idx === 0 ? 22 : 16,
                          bold: idx === 0,
                          color: idx === 0 ? primaryHex : "555555",
                        }),
                      ],
                    })
                )
              : [new Paragraph({ children: [new TextRun({ text: "" })] })],
          }),
        ],
      }),
    ],
  });

  const titleParagraphs = [
    new Paragraph({ spacing: { before: 240, after: 60 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: input.title.toUpperCase(), bold: true, size: 36, color: primaryHex })],
    }),
    ...(input.subtitle
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: input.subtitle, italics: true, size: 22, color: "555555" })],
          }),
        ]
      : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: `Document généré le ${today}`, size: 18, color: "888888" })],
    }),
  ];

  // Build content
  const contentChildren: (Paragraph | Table)[] = [];
  for (const section of input.sections) {
    const built = buildSection(section, primaryHex);
    if (Array.isArray(built)) contentChildren.push(...built);
    else contentChildren.push(built);
  }

  // Signature footer line if signataires set
  if (branding && (branding.signataire_ordonnateur || branding.signataire_agent_comptable)) {
    contentChildren.push(
      new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `Fait à ${branding.city || "............"}, le ${today}`,
            italics: true,
            size: 20,
            color: "555555",
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [4500, 4500],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 4500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "L'Ordonnateur", bold: true, size: 20 })] }),
                  new Paragraph({
                    children: [new TextRun({ text: branding.signataire_ordonnateur || "", size: 18, color: "555555" })],
                  }),
                  new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "_______________________", color: "AAAAAA" })] }),
                ],
              }),
              new TableCell({
                width: { size: 4500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "L'Agent comptable", bold: true, size: 20 })] }),
                  new Paragraph({
                    children: [new TextRun({ text: branding.signataire_agent_comptable || "", size: 18, color: "555555" })],
                  }),
                  new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "_______________________", color: "AAAAAA" })] }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // Footer
  const footerText = branding?.footer_text || "Cockpit Comptable EPLE";
  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: footerText, size: 14, color: "888888" }),
      new TextRun({ text: "    •    ", size: 14, color: "AAAAAA" }),
      new TextRun({ text: "Page ", size: 14, color: "888888" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "888888" }),
      new TextRun({ text: " / ", size: 14, color: "888888" }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "888888" }),
    ],
  });

  const isLandscape = input.orientation === "landscape";
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_PORTRAIT,
              height: PAGE_HEIGHT_PORTRAIT,
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: {
          default: new Header({ children: [headerTable] }),
        },
        footers: {
          default: new Footer({ children: [footerParagraph] }),
        },
        children: [...titleParagraphs, ...contentChildren],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = input.filename.endsWith(".docx") ? input.filename : `${input.filename}.docx`;
  saveAs(blob, filename);
}
