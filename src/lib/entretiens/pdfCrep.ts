/**
 * Génération du PDF CREP (Compte Rendu d'Entretien Professionnel)
 * Conformité : annexe C9 du décret 2010-888 — modèle académie de la Guadeloupe.
 *
 * Structure stricte :
 *   En-tête institutionnel (RF / MEN / Académie Guadeloupe / DPAE)
 *   Rubrique A — Identification agent et supérieur hiérarchique
 *   Rubrique B — Description du poste et objectifs passés
 *   Rubrique C — Appréciation de la valeur professionnelle (C.1, C.2, C.3, C.4)
 *   Rubrique D — Appréciation générale et perspectives
 *   Signatures (N+1, agent, N+2)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type Agent,
  type EntretienProfessionnel,
  type IaRepartitionResponse,
  type RubriqueC,
  RUBRIQUES_C_LABELS,
  NIVEAUX_LABELS,
  CATEGORIES_FORMATION_LABELS,
} from "./types";

const BLEU_RF = [0, 35, 149] as const;
const ROUGE_RF = [237, 41, 57] as const;
const GRIS_FONCE = [55, 65, 81] as const;
const GRIS_CLAIR = [229, 231, 235] as const;
const NOIR = [0, 0, 0] as const;

export interface CrepPdfPayload {
  agent: Agent;
  entretien: EntretienProfessionnel;
  ia?: IaRepartitionResponse | null;
  etablissement: {
    nom: string;
    uai: string;
    academie: string;
    type?: string;
    commune?: string;
    chef_etablissement?: string;
  };
  evaluateur: {
    nom: string;
    fonction: string;
  };
  autorite_n2?: {
    nom: string;
    fonction: string;
  };
}

/* ───────────────────────────────────── helpers ──────── */

function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function setFill(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setDraw(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function frenchDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number, footer: () => void): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 25) {
    footer();
    doc.addPage();
    return drawHeader(doc, "");
  }
  return y;
}

function drawHeader(doc: jsPDF, sousTitre: string): number {
  const pageW = doc.internal.pageSize.getWidth();
  setFill(doc, BLEU_RF);
  doc.rect(0, 0, pageW, 22, "F");

  // Marianne stylisée — bandeau RF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(doc, [255, 255, 255]);
  doc.text("RÉPUBLIQUE FRANÇAISE", 10, 8);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Liberté · Égalité · Fraternité", 10, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Ministère de l'Éducation nationale", 10, 18);

  // bloc droit
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Académie de la Guadeloupe", pageW - 10, 8, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Rectorat — DPAE", pageW - 10, 13, { align: "right" });
  doc.text("Personnels BIATSS", pageW - 10, 18, { align: "right" });

  // bande rouge
  setFill(doc, ROUGE_RF);
  doc.rect(0, 22, pageW, 1.5, "F");

  if (sousTitre) {
    setColor(doc, GRIS_FONCE);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(sousTitre, pageW / 2, 30, { align: "center" });
  }

  return 36;
}

function makeFooter(doc: jsPDF, totalPages: () => number) {
  return () => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    setDraw(doc, GRIS_CLAIR);
    doc.setLineWidth(0.3);
    doc.line(10, pageH - 18, pageW - 10, pageH - 18);

    setColor(doc, GRIS_FONCE);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(
      "Document confidentiel — Article 6 du décret n° 2010-888 du 28/07/2010",
      10,
      pageH - 12,
    );
    doc.text(
      "Annexe C9 (CREP) — Circulaire MENH1310955C du 30/05/2013",
      10,
      pageH - 7,
    );
    const current = (doc as any).internal.getNumberOfPages();
    doc.text(`Page ${current} / ${totalPages()}`, pageW - 10, pageH - 7, {
      align: "right",
    });
  };
}

/* ───────────────────────────────────── sections ──────── */

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  setFill(doc, BLEU_RF);
  doc.rect(10, y, 190, 7, "F");
  setColor(doc, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, 13, y + 5);
  return y + 12;
}

function subSectionTitle(doc: jsPDF, y: number, title: string): number {
  setFill(doc, GRIS_CLAIR);
  doc.rect(10, y, 190, 5, "F");
  setColor(doc, GRIS_FONCE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, 13, y + 3.5);
  return y + 9;
}

function rubriqueA(doc: jsPDF, y: number, p: CrepPdfPayload): number {
  y = sectionTitle(doc, y, "RUBRIQUE A — IDENTIFICATION DE L'AGENT");
  setColor(doc, NOIR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const rows: [string, string][] = [
    ["Nom, prénom", `${p.agent.nom.toUpperCase()} ${p.agent.prenom}`],
    ["Date de naissance", frenchDate(p.agent.date_naissance)],
    ["Corps · Grade · Échelon", `${p.agent.corps ?? "—"} · ${p.agent.grade ?? "—"} · échelon ${p.agent.echelon ?? "—"} (indice ${p.agent.indice ?? "—"})`],
    ["Catégorie · Filière", `${p.agent.categorie ?? "—"} · ${p.agent.filiere ?? "—"}`],
    ["Statut", p.agent.statut],
    ["Date d'entrée dans le corps", frenchDate(p.agent.date_entree_corps)],
    ["Date d'entrée dans l'établissement", frenchDate(p.agent.date_entree_etablissement)],
    ["Date de la dernière promotion", frenchDate(p.agent.date_derniere_promotion)],
    ["Établissement d'affectation", `${p.etablissement.nom} (UAI ${p.etablissement.uai}) — ${p.etablissement.commune ?? ""}`],
    ["Service / fonction", `${p.agent.service ?? "—"} / ${p.agent.fonction ?? "—"}`],
    ["Quotité de travail", `${p.agent.quotite_travail ?? 100} %`],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [243, 244, 246], cellWidth: 70 },
      1: { cellWidth: 120 },
    },
    margin: { left: 10, right: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 4;
  y = subSectionTitle(doc, y, "Évaluateurs et entretien");

  const rows2: [string, string][] = [
    ["Évaluateur N+1", `${p.evaluateur.nom} — ${p.evaluateur.fonction}`],
    ["Autorité hiérarchique N+2", p.autorite_n2 ? `${p.autorite_n2.nom} — ${p.autorite_n2.fonction}` : "—"],
    ["Date de l'entretien", frenchDate(p.entretien.date_entretien)],
    ["Durée", p.entretien.duree_entretien_min ? `${p.entretien.duree_entretien_min} min` : "—"],
    ["Lieu · Mode", `${p.entretien.lieu ?? "—"} · ${p.entretien.mode ?? "présentiel"}`],
    ["Période d'observation", `${frenchDate(p.entretien.periode_debut)} → ${frenchDate(p.entretien.periode_fin)}`],
    ["Campagne", p.entretien.campagne_annee],
  ];
  autoTable(doc, {
    startY: y,
    body: rows2,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [243, 244, 246], cellWidth: 70 },
      1: { cellWidth: 120 },
    },
    margin: { left: 10, right: 10 },
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

function rubriqueB(doc: jsPDF, y: number, p: CrepPdfPayload, footer: () => void): number {
  y = ensureSpace(doc, y, 30, footer);
  y = sectionTitle(doc, y, "RUBRIQUE B — DESCRIPTION DU POSTE & OBJECTIFS PASSÉS");
  setColor(doc, NOIR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Activités principales exercées durant la période évaluée :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const activites = p.agent.fonction ?? "Activités à compléter par l'évaluateur.";
  const lines = doc.splitTextToSize(activites, 190);
  doc.text(lines, 10, y);
  y += lines.length * 4 + 4;

  // objectifs passés (depuis IA)
  y = subSectionTitle(doc, y, "Bilan des objectifs fixés lors de l'entretien précédent");
  const objs = p.ia?.objectifs_passes ?? [];
  if (objs.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    setColor(doc, GRIS_FONCE);
    doc.text("Aucun objectif antérieur renseigné.", 10, y);
    y += 6;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Objectif", "Atteinte", "Commentaire"]],
      body: objs.map((o) => [o.libelle, o.atteinte, o.commentaire]),
      theme: "striped",
      headStyles: { fillColor: [BLEU_RF[0], BLEU_RF[1], BLEU_RF[2]] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }
  return y + 2;
}

function rubriqueC(doc: jsPDF, y: number, p: CrepPdfPayload, footer: () => void): number {
  y = ensureSpace(doc, y, 25, footer);
  y = sectionTitle(doc, y, "RUBRIQUE C — APPRÉCIATION DE LA VALEUR PROFESSIONNELLE");

  const rubriques: RubriqueC[] = [
    "C1_resultats",
    "C2_competences_techniques",
    "C3_qualites_personnelles",
    "C4_encadrement",
  ];
  for (const rub of rubriques) {
    y = ensureSpace(doc, y, 25, footer);
    y = subSectionTitle(doc, y, RUBRIQUES_C_LABELS[rub]);
    const sect = p.ia?.competences?.[rub];
    if (!sect || sect.sous_criteres.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      setColor(doc, GRIS_FONCE);
      doc.text("Non renseigné par l'évaluateur.", 10, y);
      y += 6;
      continue;
    }
    autoTable(doc, {
      startY: y,
      head: [["Sous-critère", "Niveau", "Commentaire"]],
      body: sect.sous_criteres.map((sc) => [
        sc.critere,
        NIVEAUX_LABELS[sc.niveau] ?? sc.niveau,
        sc.commentaire,
      ]),
      theme: "grid",
      headStyles: { fillColor: [BLEU_RF[0], BLEU_RF[1], BLEU_RF[2]] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 90 },
      },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 2;
    if (sect.synthese) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      setColor(doc, GRIS_FONCE);
      const lines = doc.splitTextToSize(`Synthèse : ${sect.synthese}`, 190);
      doc.text(lines, 10, y);
      y += lines.length * 3.5 + 3;
    }
    setColor(doc, NOIR);
  }
  return y + 2;
}

function rubriqueD(doc: jsPDF, y: number, p: CrepPdfPayload, footer: () => void): number {
  y = ensureSpace(doc, y, 50, footer);
  y = sectionTitle(doc, y, "RUBRIQUE D — APPRÉCIATION GÉNÉRALE & PERSPECTIVES");
  setColor(doc, NOIR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Appréciation générale exprimant la valeur professionnelle :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const appText = p.entretien.appreciation_generale || p.ia?.appreciation_generale || "À compléter par l'évaluateur.";
  const apLines = doc.splitTextToSize(appText, 190);
  doc.text(apLines, 10, y);
  y += apLines.length * 4 + 5;

  y = ensureSpace(doc, y, 30, footer);
  doc.setFont("helvetica", "bold");
  doc.text("Perspectives d'évolution professionnelle :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const perspText = p.entretien.perspectives || p.ia?.perspectives || "—";
  const pLines = doc.splitTextToSize(perspText, 190);
  doc.text(pLines, 10, y);
  y += pLines.length * 4 + 5;

  // objectifs futurs
  const objsF = p.ia?.objectifs_futurs_suggeres ?? [];
  if (objsF.length > 0) {
    y = ensureSpace(doc, y, 25, footer);
    y = subSectionTitle(doc, y, "Objectifs fixés pour l'année à venir");
    autoTable(doc, {
      startY: y,
      head: [["Objectif", "Indicateur", "Échéance"]],
      body: objsF.map((o) => [o.libelle, o.indicateur, o.echeance]),
      theme: "striped",
      headStyles: { fillColor: [BLEU_RF[0], BLEU_RF[1], BLEU_RF[2]] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }
  return y;
}

function blocSignatures(doc: jsPDF, y: number, p: CrepPdfPayload, footer: () => void): number {
  y = ensureSpace(doc, y, 70, footer);
  y = sectionTitle(doc, y, "SIGNATURES — Circuit séquentiel imposé (décret 2010-888 art. 4)");
  setColor(doc, NOIR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const blocW = 60;
  const startX = 10;
  const gap = 5;

  const blocs = [
    {
      titre: "1. N+1 — Évaluateur",
      sub: `${p.evaluateur.nom}\n${p.evaluateur.fonction}`,
      date: p.entretien.signature_n1_at,
    },
    {
      titre: "2. N+2 — Autorité hiérarchique",
      sub: p.autorite_n2 ? `${p.autorite_n2.nom}\n${p.autorite_n2.fonction}` : "—",
      date: p.entretien.visa_n2_at,
    },
    {
      titre: "3. Agent (prise de connaissance)",
      sub: `${p.agent.prenom} ${p.agent.nom.toUpperCase()}\n${p.agent.fonction ?? ""}`,
      date: p.entretien.signature_agent_at,
    },
  ];

  blocs.forEach((b, i) => {
    const x = startX + i * (blocW + gap);
    setDraw(doc, GRIS_FONCE);
    doc.setLineWidth(0.3);
    doc.rect(x, y, blocW, 45);

    setFill(doc, GRIS_CLAIR);
    doc.rect(x, y, blocW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(doc, GRIS_FONCE);
    doc.text(b.titre, x + 2, y + 5);

    doc.setFont("helvetica", "normal");
    setColor(doc, NOIR);
    doc.setFontSize(7.5);
    const subLines = doc.splitTextToSize(b.sub, blocW - 4);
    doc.text(subLines, x + 2, y + 12);

    doc.setFont("helvetica", "italic");
    setColor(doc, GRIS_FONCE);
    doc.setFontSize(7);
    doc.text(b.date ? `Signé le ${frenchDate(b.date)}` : "Non signé", x + 2, y + 42);
  });

  y += 50;

  // Observations agent
  y = ensureSpace(doc, y, 25, footer);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, NOIR);
  doc.text("Observations éventuelles de l'agent :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const obs = p.entretien.observations_agent || "—";
  const obsLines = doc.splitTextToSize(obs, 190);
  doc.text(obsLines, 10, y);
  y += obsLines.length * 4 + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Visa et observations de l'autorité hiérarchique (N+2) :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const obsN2 = p.entretien.observations_n2 || "—";
  const obsN2Lines = doc.splitTextToSize(obsN2, 190);
  doc.text(obsN2Lines, 10, y);
  y += obsN2Lines.length * 4;

  return y;
}

/* ───────────────────────────────────── public ──────── */

export function generateCrepPdf(payload: CrepPdfPayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  let y = drawHeader(
    doc,
    `COMPTE RENDU D'ENTRETIEN PROFESSIONNEL — Campagne ${payload.entretien.campagne_annee}`,
  );

  // titre principal
  setColor(doc, BLEU_RF);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CREP — Personnel BIATSS", 105, y, { align: "center" });
  setColor(doc, GRIS_FONCE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Annexe C9 — Décret n° 2010-888 du 28/07/2010 · Modèle académie de la Guadeloupe",
    105,
    y + 5,
    { align: "center" },
  );
  y += 12;

  const totalPagesRef = { current: 1 };
  const footer = makeFooter(doc, () => totalPagesRef.current);

  y = rubriqueA(doc, y, payload);
  y = rubriqueB(doc, y, payload, footer);
  y = rubriqueC(doc, y, payload, footer);
  y = rubriqueD(doc, y, payload, footer);
  y = blocSignatures(doc, y, payload, footer);

  // appliquer footer sur toutes les pages
  const total = (doc as any).internal.getNumberOfPages();
  totalPagesRef.current = total;
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    footer();
  }
  return doc;
}

/* ─────────────────────── CREF (annexe C9 bis) ────────── */

export function generateCrefPdf(payload: CrepPdfPayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = drawHeader(
    doc,
    `COMPTE RENDU D'ENTRETIEN DE FORMATION — Campagne ${payload.entretien.campagne_annee}`,
  );

  setColor(doc, BLEU_RF);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CREF — Personnel BIATSS", 105, y, { align: "center" });
  setColor(doc, GRIS_FONCE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Annexe C9 bis — Circulaire MENH1310955C · Modèle académie de la Guadeloupe",
    105,
    y + 5,
    { align: "center" },
  );
  y += 12;

  const totalPagesRef = { current: 1 };
  const footer = makeFooter(doc, () => totalPagesRef.current);

  // Bloc identification (réduit)
  y = sectionTitle(doc, y, "AGENT CONCERNÉ");
  autoTable(doc, {
    startY: y,
    body: [
      ["Nom, prénom", `${payload.agent.nom.toUpperCase()} ${payload.agent.prenom}`],
      ["Corps · Grade", `${payload.agent.corps ?? "—"} · ${payload.agent.grade ?? "—"}`],
      ["Service / fonction", `${payload.agent.service ?? "—"} / ${payload.agent.fonction ?? "—"}`],
      ["Établissement", `${payload.etablissement.nom} (UAI ${payload.etablissement.uai})`],
    ],
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [243, 244, 246], cellWidth: 70 },
      1: { cellWidth: 120 },
    },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // F.1 Bilan formations suivies
  y = ensureSpace(doc, y, 25, footer);
  y = sectionTitle(doc, y, "F.1 — BILAN DES FORMATIONS SUIVIES");
  const bilan = payload.ia?.formation?.bilan_periode ?? [];
  if (bilan.length === 0) {
    setColor(doc, GRIS_FONCE);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("Aucune formation renseignée pour la période.", 10, y);
    y += 6;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Intitulé", "Organisme", "Durée", "Évaluation", "Réinvestissement"]],
      body: bilan.map((b) => [
        b.intitule,
        b.organisme ?? "—",
        b.duree_heures ? `${b.duree_heures}h` : "—",
        b.evaluation ?? "—",
        b.reinvestissement ?? "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [BLEU_RF[0], BLEU_RF[1], BLEU_RF[2]] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // F.2-F.4 — demandes (regroupées par catégorie)
  y = ensureSpace(doc, y, 30, footer);
  y = sectionTitle(doc, y, "F.2 à F.4 — BESOINS & DEMANDES DE FORMATION");
  const demandes = payload.ia?.formation?.demandes ?? [];

  for (const cat of ["T1", "T2", "T3"] as const) {
    const filt = demandes.filter((d) => d.categorie === cat);
    y = ensureSpace(doc, y, 15, footer);
    y = subSectionTitle(doc, y, CATEGORIES_FORMATION_LABELS[cat]);
    if (filt.length === 0) {
      setColor(doc, GRIS_FONCE);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Aucune demande dans cette catégorie.", 10, y);
      y += 5;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Intitulé", "Priorité", "Fondement"]],
        body: filt.map((d) => [d.intitule, d.priorite, d.fondement]),
        theme: "grid",
        headStyles: { fillColor: [BLEU_RF[0], BLEU_RF[1], BLEU_RF[2]] },
        styles: { fontSize: 8, cellPadding: 1.5 },
        margin: { left: 10, right: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }
  }

  // F.5 — projet professionnel
  y = ensureSpace(doc, y, 25, footer);
  y = sectionTitle(doc, y, "F.5 — PROJET PROFESSIONNEL & OBSERVATIONS");
  setColor(doc, NOIR);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Projet professionnel :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const proj = payload.ia?.formation?.projet_professionnel || "—";
  const projLines = doc.splitTextToSize(proj, 190);
  doc.text(projLines, 10, y);
  y += projLines.length * 4 + 5;

  doc.setFont("helvetica", "bold");
  doc.text("Observations de l'agent :", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const obs = payload.entretien.observations_agent || "—";
  const obsLines = doc.splitTextToSize(obs, 190);
  doc.text(obsLines, 10, y);
  y += obsLines.length * 4 + 4;

  // Signatures (mêmes règles)
  y = blocSignatures(doc, y, payload, footer);

  const total = (doc as any).internal.getNumberOfPages();
  totalPagesRef.current = total;
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    footer();
  }
  return doc;
}