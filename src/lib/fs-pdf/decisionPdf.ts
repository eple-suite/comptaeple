// ═══════════════════════════════════════════════════════════════
// Génération PDF — 3 documents Fonds Social :
// 1) Décision du chef d'établissement
// 2) Notification famille
// 3) Pièce comptable (mandat)
// Stack : jsPDF + autoTable (cohérence avec le reste de l'app)
// ═══════════════════════════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEur, formatDateFr, montantEnLettres } from "./utils";
import type { FsDecision, FsEleve } from "@/pages/fonds-sociaux-v2/fsv2Types";
import { NATURE_AIDE_LABELS } from "@/pages/fonds-sociaux-v2/fsv2Types";

export interface PdfContext {
  etablissementNom: string;
  etablissementAdresse?: string;
  etablissementCp?: string;
  etablissementVille?: string;
  uai?: string;
  signataireOrdonnateur?: string;
  signataireAgentComptable?: string;
  ville?: string;
  logoDataUrl?: string | null;
}

function header(doc: jsPDF, titre: string, ctx: PdfContext) {
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text(ctx.etablissementNom, 20, 18);
  doc.setFont("helvetica", "normal").setFontSize(9);
  if (ctx.etablissementAdresse) doc.text(ctx.etablissementAdresse, 20, 24);
  if (ctx.etablissementCp || ctx.etablissementVille)
    doc.text(`${ctx.etablissementCp ?? ""} ${ctx.etablissementVille ?? ""}`.trim(), 20, 29);
  if (ctx.uai) doc.text(`UAI : ${ctx.uai}`, 20, 34);
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text(titre, 105, 48, { align: "center" });
  doc.setLineWidth(0.3).line(20, 52, 190, 52);
}

function footer(doc: jsPDF, ctx: PdfContext, signataire: string, fonction: string) {
  const y = 250;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Fait à ${ctx.ville ?? ctx.etablissementVille ?? "—"}, le ${formatDateFr(new Date().toISOString())}`, 20, y);
  doc.text(fonction, 130, y + 10);
  doc.setFont("helvetica", "bold");
  doc.text(signataire || "—", 130, y + 30);
}

/** 1) Décision du chef d'établissement */
export function generateDecisionChefEtablissementPdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "DÉCISION DU CHEF D'ÉTABLISSEMENT", ctx);

  doc.setFontSize(10).setFont("helvetica", "normal");
  let y = 62;
  doc.text(`Décision n° : ${decision.numero_decision}`, 20, y); y += 6;
  doc.text(`Date : ${formatDateFr(decision.date_decision)}`, 20, y); y += 6;
  doc.text(`Année scolaire : ${decision.annee_scolaire}`, 20, y); y += 10;

  doc.setFont("helvetica", "bold").text("Vu :", 20, y); y += 6;
  doc.setFont("helvetica", "normal");
  const vus = [
    "Le Code de l'éducation, notamment ses articles L.531-1 à L.531-5 et D.531-7 à D.531-12 ;",
    "La circulaire n° 2017-122 du 22-08-2017 relative aux fonds sociaux ;",
    "L'instruction codificatrice M9-6 ;",
    `La demande déposée pour l'élève ${eleve.prenom} ${eleve.nom} (classe ${eleve.classe}) ;`,
    decision.modalite_attribution === "commission"
      ? "L'avis de la commission fonds social réunie en séance ordinaire ;"
      : "L'urgence sociale appréciée au cas par cas ;",
  ];
  vus.forEach(v => {
    const lines = doc.splitTextToSize("• " + v, 170);
    doc.text(lines, 22, y);
    y += lines.length * 5;
  });

  y += 4;
  doc.setFont("helvetica", "bold").text("DÉCIDE :", 20, y); y += 7;
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9 },
    body: [
      ["Bénéficiaire", `${eleve.prenom} ${eleve.nom} — ${eleve.classe}`],
      ["Type de fonds", decision.type_fonds === "FS" ? "Fonds social lycéen / collégien (FS)" : "Fonds social pour les cantines (FSC)"],
      ["Nature de l'aide", NATURE_AIDE_LABELS[decision.nature_aide as keyof typeof NATURE_AIDE_LABELS] ?? decision.nature_aide],
      ["Montant attribué", formatEur(Number(decision.montant))],
      ["Montant en lettres", montantEnLettres(Number(decision.montant))],
      ["Modalité de versement", decision.modalite_versement === "aide_directe" ? "Aide directe à la famille" : `Versement à l'organisme tiers : ${decision.organisme_tiers_nom ?? ""}`],
      ["Imputation Op@le", `${decision.code_activite_opale} / ${decision.compte_imputation_opale ?? ""}`],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  if (decision.motif) {
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold").text("Motif :", 20, finalY);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(decision.motif, 170);
    doc.text(lines, 20, finalY + 6);
  }

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "L'Ordonnateur,");
  return doc.output("blob");
}

/** 2) Notification famille */
export function generateNotificationFamillePdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "NOTIFICATION D'AIDE — FONDS SOCIAL", ctx);

  let y = 62;
  doc.setFontSize(10).setFont("helvetica", "normal");
  const resp = (eleve.responsables_legaux ?? [])[0];
  if (resp) {
    doc.text(`${resp.prenom ?? ""} ${resp.nom ?? ""}`, 130, y); y += 5;
    if (resp.adresse) {
      doc.splitTextToSize(resp.adresse, 60).forEach((l: string) => { doc.text(l, 130, y); y += 5; });
    }
  }

  y = 95;
  doc.text(`Madame, Monsieur,`, 20, y); y += 8;
  const corps = `Suite à l'examen de votre demande d'aide concernant ${eleve.prenom} ${eleve.nom} ` +
    `(classe ${eleve.classe}), j'ai le plaisir de vous informer qu'une aide d'un montant de ` +
    `${formatEur(Number(decision.montant))} (${montantEnLettres(Number(decision.montant))}) ` +
    `vous est attribuée au titre du ${decision.type_fonds === "FS" ? "Fonds social lycéen / collégien" : "Fonds social pour les cantines"}, ` +
    `pour : ${NATURE_AIDE_LABELS[decision.nature_aide as keyof typeof NATURE_AIDE_LABELS] ?? decision.nature_aide}.`;
  doc.splitTextToSize(corps, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 6;
  const modalite = decision.modalite_versement === "aide_directe"
    ? "Cette aide vous sera versée directement par mandat administratif."
    : `Cette aide sera versée directement à l'organisme : ${decision.organisme_tiers_nom ?? ""}.`;
  doc.splitTextToSize(modalite, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 8;
  doc.text("Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", 20, y);

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 3) Pièce comptable */
export function generatePieceComptablePdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "PIÈCE COMPTABLE — MANDAT", ctx);

  let y = 62;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Référence décision : ${decision.numero_decision}`, 20, y); y += 6;
  doc.text(`Date décision : ${formatDateFr(decision.date_decision)}`, 20, y); y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Information", "Valeur"]],
    body: [
      ["Bénéficiaire", `${eleve.prenom} ${eleve.nom}`],
      ["INE", eleve.ine ?? "—"],
      ["Classe", eleve.classe],
      ["Tiers payé", decision.modalite_versement === "aide_directe" ? "Famille (aide directe)" : (decision.organisme_tiers_nom ?? "—")],
      ["SIRET tiers", decision.organisme_tiers_siret ?? "—"],
      ["Code activité", decision.code_activite_opale],
      ["Compte d'imputation", decision.compte_imputation_opale ?? "—"],
      ["Montant", formatEur(Number(decision.montant))],
      ["Montant en lettres", montantEnLettres(Number(decision.montant))],
      ["Année scolaire", decision.annee_scolaire],
      ["N° mandat", decision.numero_mandat ?? "(à attribuer)"],
      ["Date mandatement", formatDateFr(decision.date_mandatement)],
    ],
  });

  footer(doc, ctx, ctx.signataireAgentComptable ?? "", "L'Agent comptable,");
  return doc.output("blob");
}

/** Helper UI : déclenche le téléchargement d'un Blob */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}