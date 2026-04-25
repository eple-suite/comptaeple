// ═══════════════════════════════════════════════════════════════
// Génération PDF — Documents Fonds Social :
// 1) Décision du chef d'établissement (avec visa délibération CA, voies de recours)
// 2) Notification famille
// 3) Pièce comptable — Demande de paiement Op@le (anciennement « mandat »)
// 4) Bordereau de demandes de paiement
// 5) Courrier complément de pièces
// 6) Courrier de refus motivé
// Stack : jsPDF + autoTable (cohérence avec le reste de l'app)
// ═══════════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEur, formatDateFr, montantEnLettres } from "./utils";
import type {
  FsDecision, FsEleve, FsCommission, FsCommissionConvocation,
} from "@/pages/fonds-sociaux-v2/fsv2Types";
import { NATURE_AIDE_LABELS, TYPE_FONDS_LABELS } from "@/pages/fonds-sociaux-v2/fsv2Types";

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
  /** Tribunal administratif territorialement compétent — défaut : TA Basse-Terre (Académie Guadeloupe) */
  tribunalAdministratif?: string;
  /** Référence de la délibération CA fixant les modalités */
  numeroDeliberationCa?: string;
  dateDeliberationCa?: string;
  /** Date de l'avis de la commission */
  dateAvisCommission?: string;
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

/** Bandeau « voies et délais de recours » — art. R.421-1 CJA */
function voiesDeRecours(doc: jsPDF, ctx: PdfContext, y: number): number {
  const tribunal = ctx.tribunalAdministratif ?? "Tribunal administratif de Basse-Terre";
  doc.setFont("helvetica", "bold").setFontSize(8);
  doc.text("Voies et délais de recours :", 20, y);
  doc.setFont("helvetica", "normal").setFontSize(8);
  const txt =
    "La présente décision peut faire l'objet, dans un délai de deux mois à compter de sa notification, " +
    "d'un recours gracieux auprès du chef d'établissement signataire, ou d'un recours contentieux devant le " +
    `${tribunal} (art. R.421-1 du Code de justice administrative).`;
  const lines = doc.splitTextToSize(txt, 170);
  doc.text(lines, 20, y + 4);
  return y + 4 + lines.length * 4;
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
    ctx.numeroDeliberationCa
      ? `La délibération du Conseil d'administration n° ${ctx.numeroDeliberationCa}${ctx.dateDeliberationCa ? ` du ${formatDateFr(ctx.dateDeliberationCa)}` : ""} fixant les modalités d'attribution des fonds sociaux ;`
      : "La délibération du Conseil d'administration fixant les modalités d'attribution des fonds sociaux ;",
    `La demande déposée pour l'élève ${eleve.prenom} ${eleve.nom} (classe ${eleve.classe}) ;`,
    decision.modalite_attribution === "commission"
      ? `L'avis de la commission fonds sociaux${ctx.dateAvisCommission ? ` du ${formatDateFr(ctx.dateAvisCommission)}` : ""} ;`
      : "L'urgence sociale appréciée au cas par cas (procédure d'urgence — circulaire 2017-122 § II.4) ;",
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
      ["Type de fonds", TYPE_FONDS_LABELS[decision.type_fonds] ?? decision.type_fonds],
      ["Nature de l'aide", NATURE_AIDE_LABELS[decision.nature_aide as keyof typeof NATURE_AIDE_LABELS] ?? decision.nature_aide],
      ["Montant attribué", formatEur(Number(decision.montant))],
      ["Montant en lettres", montantEnLettres(Number(decision.montant))],
      ["Modalité de versement", decision.extinction_creance_dp
        ? `Extinction de la créance famille (compte ${decision.compte_creance_famille ?? "411200"})`
        : decision.modalite_versement === "aide_directe"
          ? "Aide directe à la famille (demande de paiement Op@le)"
          : `Versement à l'organisme tiers : ${decision.organisme_tiers_nom ?? ""}`],
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

  // Voies et délais de recours — art. R.421-1 CJA
  voiesDeRecours(doc, ctx, 230);

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
    ? "Cette aide vous sera versée par demande de paiement Op@le sur votre compte bancaire."
    : `Cette aide sera versée directement à l'organisme : ${decision.organisme_tiers_nom ?? ""}.`;
  doc.splitTextToSize(modalite, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 8;
  doc.text("Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", 20, y);

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 8) PV de commission — anonymisé (diffusion membres / familles)
 *  Pas d'identité élève : seulement initiales, montants accordés et motif générique. */
export function generatePvCommissionAnonymisePdf(
  commission: FsCommission,
  dossiers: { initiales: string; classe: string; nature: string; montant: number; decision: "accord" | "refus" | "complement" }[],
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "PROCÈS-VERBAL — COMMISSION FONDS SOCIAUX (anonymisé)", ctx);

  let y = 62;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Date : ${formatDateFr(commission.date_commission)}`, 20, y); y += 6;
  doc.text(`Type : ${commission.type} · Année scolaire : ${commission.annee_scolaire}`, 20, y); y += 6;
  doc.text(`Membres présents : ${(commission.membres_presents ?? []).length}`, 20, y); y += 8;

  doc.setFont("helvetica", "bold").text(`Dossiers examinés : ${dossiers.length}`, 20, y); y += 4;
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Initiales", "Classe", "Nature aide", "Décision", "Montant"]],
    body: dossiers.map(d => [
      d.initiales, d.classe, d.nature,
      d.decision === "accord" ? "Accord" : d.decision === "refus" ? "Refus" : "Complément",
      d.decision === "accord" ? formatEur(d.montant) : "—",
    ]),
    foot: [["", "", "Total accordé", "", formatEur(dossiers.filter(d => d.decision === "accord").reduce((s, d) => s + d.montant, 0))]],
  });

  let yAfter = (doc as any).lastAutoTable.finalY + 8;
  if (commission.observations) {
    doc.setFont("helvetica", "bold").text("Observations :", 20, yAfter); yAfter += 6;
    doc.setFont("helvetica", "normal");
    doc.splitTextToSize(commission.observations, 170).forEach((l: string) => {
      doc.text(l, 20, yAfter); yAfter += 5;
    });
  }

  doc.setFont("helvetica", "italic").setFontSize(8);
  doc.text("Ce PV anonymisé respecte le RGPD (art. 5.1.c — minimisation). Identités complètes dans le PV intégral archivé.", 20, 240);

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 9) PV de commission — intégral nominatif (archive établissement, accès restreint)
 *  Contient l'identité complète des élèves, à conserver 5 ans (RGPD). */
export function generatePvCommissionIntegralPdf(
  commission: FsCommission,
  dossiers: { eleve_nom: string; eleve_prenom: string; classe: string; nature: string; montant: number; decision: "accord" | "refus" | "complement"; motif?: string }[],
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "PROCÈS-VERBAL — COMMISSION FONDS SOCIAUX (intégral)", ctx);

  // Bandeau confidentialité
  doc.setFillColor(255, 240, 200);
  doc.rect(20, 56, 170, 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(120, 60, 0);
  doc.text("CONFIDENTIEL — Document nominatif, accès restreint, conservation 5 ans (RGPD)", 105, 60, { align: "center" });
  doc.setTextColor(0, 0, 0);

  let y = 72;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Date : ${formatDateFr(commission.date_commission)}`, 20, y); y += 6;
  doc.text(`Type : ${commission.type} · Année scolaire : ${commission.annee_scolaire}`, 20, y); y += 6;
  doc.text(`Membres présents : ${(commission.membres_presents ?? []).map(m => `${m.nom} (${m.qualite})`).join(", ") || "—"}`, 20, y); y += 8;

  doc.setFont("helvetica", "bold").text(`Dossiers examinés : ${dossiers.length}`, 20, y); y += 4;
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8 },
    head: [["Élève", "Classe", "Nature aide", "Décision", "Montant", "Motif"]],
    body: dossiers.map(d => [
      `${d.eleve_nom} ${d.eleve_prenom}`,
      d.classe, d.nature,
      d.decision === "accord" ? "Accord" : d.decision === "refus" ? "Refus" : "Complément",
      d.decision === "accord" ? formatEur(d.montant) : "—",
      d.motif ?? "—",
    ]),
    foot: [["", "", "", "Total accordé", formatEur(dossiers.filter(d => d.decision === "accord").reduce((s, d) => s + d.montant, 0)), ""]],
  });

  let yAfter = (doc as any).lastAutoTable.finalY + 8;
  if (commission.observations) {
    doc.setFont("helvetica", "bold").text("Observations :", 20, yAfter); yAfter += 6;
    doc.setFont("helvetica", "normal");
    doc.splitTextToSize(commission.observations, 170).forEach((l: string) => {
      doc.text(l, 20, yAfter); yAfter += 5;
    });
  }

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 3) Pièce comptable — Demande de paiement Op@le (remplace l'ex « mandat ») */
export function generatePieceComptablePdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "PIÈCE COMPTABLE — DEMANDE DE PAIEMENT (Op@le)", ctx);

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
      ["N° demande de paiement", decision.numero_demande_paiement ?? "(à attribuer par Op@le)"],
      ["Date émission DP", decision.date_demande_paiement ? formatDateFr(decision.date_demande_paiement) : "—"],
      ["Extinction créance DP", decision.extinction_creance_dp
        ? `Oui — compte ${decision.compte_creance_famille ?? "411200"}`
        : "Non"],
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

/** 4) Bordereau de demandes de paiement — récapitulatif d'un lot envoyé à l'agent comptable */
export function generateBordereauDpPdf(
  decisions: Array<{ decision: FsDecision; eleve: FsEleve }>,
  ctx: PdfContext,
  numeroBordereau: string,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "BORDEREAU DE DEMANDES DE PAIEMENT — FONDS SOCIAL", ctx);

  let y = 62;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Bordereau n° : ${numeroBordereau}`, 20, y); y += 6;
  doc.text(`Date d'émission : ${formatDateFr(new Date().toISOString())}`, 20, y); y += 6;
  doc.text(`Nombre de demandes : ${decisions.length}`, 20, y); y += 8;

  const total = decisions.reduce((s, d) => s + Number(d.decision.montant || 0), 0);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 40, 80] },
    head: [["N° décision", "Bénéficiaire", "Classe", "Type", "Imputation", "Montant"]],
    body: decisions.map(({ decision, eleve }) => [
      decision.numero_decision,
      `${eleve.nom} ${eleve.prenom}`,
      eleve.classe,
      decision.type_fonds,
      `${decision.code_activite_opale}/${decision.compte_imputation_opale ?? "—"}`,
      formatEur(Number(decision.montant)),
    ]),
    foot: [["", "", "", "", "TOTAL", formatEur(total)]],
    footStyles: { fontStyle: "bold", fillColor: [220, 220, 230], textColor: 0 },
  });

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "L'Ordonnateur,");
  return doc.output("blob");
}

/** 5) Courrier de complément de pièces — demande de pièces justificatives manquantes */
export function generateCourrierComplementPdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
  piecesManquantes: string[],
  delaiJours: number = 15,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "DEMANDE DE COMPLÉMENT DE PIÈCES", ctx);

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
  doc.text("Madame, Monsieur,", 20, y); y += 8;
  const corps = `Suite à votre demande d'aide au titre du fonds social pour ${eleve.prenom} ${eleve.nom} ` +
    `(classe ${eleve.classe}), réf. ${decision.numero_decision}, l'instruction de votre dossier nécessite les pièces complémentaires suivantes :`;
  doc.splitTextToSize(corps, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 4;
  doc.setFont("helvetica", "bold").text("Pièces à fournir :", 20, y); y += 6;
  doc.setFont("helvetica", "normal");
  piecesManquantes.forEach(p => {
    const lines = doc.splitTextToSize("• " + p, 170);
    doc.text(lines, 22, y); y += lines.length * 5;
  });

  y += 6;
  const delai = `Merci de nous transmettre ces éléments dans un délai de ${delaiJours} jours ` +
    `à compter de la réception de ce courrier. Sans réponse de votre part, votre dossier sera classé sans suite.`;
  doc.splitTextToSize(delai, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 8;
  doc.text("Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", 20, y);

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 6) Courrier de refus motivé — avec voies et délais de recours */
export function generateCourrierRefusPdf(
  decision: FsDecision,
  eleve: FsEleve,
  ctx: PdfContext,
  motifRefus: string,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "DÉCISION DE REFUS — FONDS SOCIAL", ctx);

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
  doc.text("Madame, Monsieur,", 20, y); y += 8;
  const corps = `Après examen ${decision.modalite_attribution === "commission" ? "par la commission fonds sociaux" : "au titre de la procédure d'urgence"} ` +
    `de votre demande d'aide concernant ${eleve.prenom} ${eleve.nom} (classe ${eleve.classe}), réf. ${decision.numero_decision}, ` +
    `j'ai le regret de vous informer que celle-ci ne peut être satisfaite favorablement.`;
  doc.splitTextToSize(corps, 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  y += 6;
  doc.setFont("helvetica", "bold").text("Motif du refus :", 20, y); y += 6;
  doc.setFont("helvetica", "normal");
  doc.splitTextToSize(motifRefus || "—", 170).forEach((l: string) => { doc.text(l, 20, y); y += 5; });

  // Voies et délais de recours en bas
  voiesDeRecours(doc, ctx, 220);

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}

/** 7) Convocation à une commission fonds sociaux */
export function generateConvocationCommissionPdf(
  commission: FsCommission,
  convocation: FsCommissionConvocation,
  ctx: PdfContext,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "CONVOCATION — COMMISSION FONDS SOCIAUX", ctx);

  let y = 62;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Date de la commission : ${formatDateFr(commission.date_commission)}`, 20, y); y += 6;
  doc.text(`Type : ${commission.type}`, 20, y); y += 6;
  doc.text(`Année scolaire : ${commission.annee_scolaire}`, 20, y); y += 10;

  doc.setFont("helvetica", "bold").text("Membres convoqués :", 20, y); y += 6;
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Nom", "Prénom", "Qualité", "Email"]],
    body: (convocation.membres_convoques ?? []).map(m => [
      m.nom, m.prenom ?? "", m.qualite, m.email ?? "—",
    ]),
  });

  let yAfter = (doc as any).lastAutoTable.finalY + 8;
  if (convocation.ordre_du_jour) {
    doc.setFont("helvetica", "bold").text("Ordre du jour :", 20, yAfter); yAfter += 6;
    doc.setFont("helvetica", "normal");
    doc.splitTextToSize(convocation.ordre_du_jour, 170).forEach((l: string) => {
      doc.text(l, 20, yAfter); yAfter += 5;
    });
  }

  footer(doc, ctx, ctx.signataireOrdonnateur ?? "", "Le Chef d'établissement,");
  return doc.output("blob");
}