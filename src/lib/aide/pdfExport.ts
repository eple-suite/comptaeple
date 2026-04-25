import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import type { AideArticleSeed, AideGlossaireSeed } from "@/data/aide/types";
import { MODULES } from "@/data/aide/types";
import { GLOSSAIRE_SEED } from "@/data/aide/glossaire";

function moduleLabel(id: string) {
  return MODULES.find((m) => m.id === id)?.label ?? id;
}

function stripMd(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " | ")
    .replace(/\r\n/g, "\n");
}

/** Export d'un article unique (A4 portrait). */
export function exportArticlePdf(article: AideArticleSeed) {
  const doc = createStyledPDF({
    orientation: "portrait",
    title: `Mode d'emploi — ${moduleLabel(article.module)}`,
    subtitle: article.titre,
    establishment: "Académie de Guadeloupe — Cockpit Comptable EPLE",
  });
  let y = 50;
  const pw = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pw - margin * 2;

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(article.titre, margin, y);
  y += 6;

  if (article.resume) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const rs = doc.splitTextToSize(article.resume, maxW);
    doc.text(rs, margin, y);
    y += rs.length * 4.5 + 3;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  const text = stripMd(article.contenu_md);
  const lines = doc.splitTextToSize(text, maxW);
  for (const ln of lines) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(ln, margin, y);
    y += 4.6;
  }

  // Références
  if (article.references_legales.length) {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Références légales", margin, y); y += 5;
    doc.setFont("helvetica", "normal");
    for (const r of article.references_legales) {
      doc.text(`• ${r}`, margin + 2, y); y += 4.5;
    }
  }

  savePDF(doc, `mode-emploi-${article.slug}.pdf`);
}

/** Export complet d'un module (A4 portrait) — toutes les sections + glossaire filtré. */
export function exportModulePdf(moduleId: string, articles: AideArticleSeed[]) {
  const label = moduleLabel(moduleId);
  const doc = createStyledPDF({
    orientation: "portrait",
    title: `Guide ${label}`,
    subtitle: "Mode d'emploi pédagogique — Niveau IH2EF / EAFC",
    establishment: "Académie de Guadeloupe — Cockpit Comptable EPLE",
  });

  const pw = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pw - margin * 2;
  let y = 55;

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(`Conformité : M9-6 (19/01/2026), GBCP 2012-1246, Code éducation, RGP 2022-408, RGPD.`, margin, y);
  y += 8;

  // Sommaire
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(13);
  doc.text("Sommaire", margin, y); y += 6;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  articles.forEach((a, idx) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(`${idx + 1}. ${a.titre}`, margin + 2, y); y += 5;
  });

  // Sections
  for (const article of articles) {
    doc.addPage(); y = 20;
    doc.setFillColor(245, 248, 252);
    doc.rect(margin - 4, y - 6, maxW + 8, 12, "F");
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(article.titre, margin, y + 2);
    y += 12;

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const text = stripMd(article.contenu_md);
    const lines = doc.splitTextToSize(text, maxW);
    for (const ln of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(ln, margin, y);
      y += 4.6;
    }
    if (article.references_legales.length) {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Références", margin, y); y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (const r of article.references_legales) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(`• ${r}`, margin + 2, y); y += 4.2;
      }
    }
  }

  // Glossaire ciblé
  const gloss = GLOSSAIRE_SEED.filter((g) => g.modules.includes(moduleId) || g.modules.includes("transverse"));
  if (gloss.length) {
    doc.addPage(); y = 20;
    doc.setTextColor(37, 68, 120);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Glossaire", margin, y); y += 8;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    for (const g of gloss) {
      const head = g.acronyme ? `${g.acronyme} — ${g.terme}` : g.terme;
      doc.setFont("helvetica", "bold");
      const headLines = doc.splitTextToSize(head, maxW);
      for (const hl of headLines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(hl, margin, y); y += 4.4;
      }
      doc.setFont("helvetica", "normal");
      const defLines = doc.splitTextToSize(g.definition, maxW);
      for (const dl of defLines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(dl, margin + 2, y); y += 4.2;
      }
      y += 2;
    }
  }

  savePDF(doc, `guide-${moduleId}.pdf`);
}

export function exportGlossairePdf(items: AideGlossaireSeed[] = GLOSSAIRE_SEED) {
  const doc = createStyledPDF({
    orientation: "portrait",
    title: "Glossaire institutionnel",
    subtitle: "Mode d'emploi — Cockpit Comptable EPLE",
    establishment: "Académie de Guadeloupe",
  });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pw - margin * 2;
  let y = 50;

  doc.setFontSize(9);
  for (const g of items) {
    const head = g.acronyme ? `${g.acronyme} — ${g.terme}` : g.terme;
    doc.setFont("helvetica", "bold");
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(head, margin, y); y += 4.4;
    doc.setFont("helvetica", "normal");
    const defLines = doc.splitTextToSize(g.definition, maxW);
    for (const dl of defLines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(dl, margin + 2, y); y += 4.2;
    }
    y += 2;
  }
  savePDF(doc, `glossaire-cockpit-eple.pdf`);
}