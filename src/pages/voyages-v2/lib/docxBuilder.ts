// ════════════════════════════════════════════════════════════════
// Builders DOCX — primitives partagées
// Tout repose sur le SDK `docx` (pas de gabarit binaire à charger).
// ════════════════════════════════════════════════════════════════
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
  Packer as _Packer, // alias placeholder, kept for clarity
} from "docx";

const FONT = "Arial";

function p(text: string, opts: { bold?: boolean; size?: number; align?: AlignmentType; italics?: boolean } = {}) {
  return new Paragraph({
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22, // 11pt
        font: FONT,
      }),
    ],
  });
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 180 },
    children: [new TextRun({ text, bold: true, size: 32, font: FONT })],
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: FONT })],
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun({ text: "", font: FONT })] });
}

function cell(text: string, opts: { bold?: boolean; width: number; bg?: string; align?: AlignmentType } = { width: 2000 }) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold, size: 20, font: FONT })],
      }),
    ],
  });
}

function table(rows: TableRow[], totalWidth = 9360) {
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "BBBBBB" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "BBBBBB" },
    },
  });
}

export interface DocxBuildContext {
  voyage: {
    libelle: string;
    reference_interne: string;
    destination_ville: string;
    destination_pays: string;
    date_depart?: string | null;
    date_retour?: string | null;
    nombre_nuitees?: number;
    type_projet?: string;
    classes_concernees?: string[];
    nb_eleves_prevus?: number;
    nb_accompagnateurs_prevus?: number;
    responsable_pedago_nom?: string;
    lien_projet_etablissement?: string;
    montant_total_ttc?: number;
    devise?: string;
    agence_nom?: string | null;
    agence_siret?: string | null;
    agence_garantie?: string | null;
    date_ca_autorisation?: string | null;
    numero_acte_ca?: string | null;
    erasmus_convention_ref?: string | null;
    erasmus_subvention_notifiee?: number;
  };
  etablissement: {
    nom: string;
    uai?: string;
    adresse?: string;
    chef_etab?: string;
    agent_comptable?: string;
  };
  recettes?: Array<{ libelle: string; nature?: string; montant: number; statut_financeur?: string; imputation_compte?: string }>;
  depenses?: Array<{ libelle: string; poste?: string; fournisseur?: string; montant_ttc: number; compte_charge?: string }>;
  participants?: Array<{ nom: string; prenom: string; classe: string; participation_reelle?: number; reste_a_payer?: number }>;
  meta: {
    date_generation: string;
    auteur: string;
  };
}

function fmtEur(n?: number, devise = "EUR") {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("fr-FR", { style: "currency", currency: devise || "EUR", minimumFractionDigits: 2 });
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("fr-FR");
}

function header(etabNom: string) {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: etabNom, bold: true, size: 18, font: FONT }),
        ],
      }),
    ],
  });
}

function footer(filename: string) {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${filename} — Page `, size: 16, font: FONT, italics: true }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT, italics: true }),
          new TextRun({ text: " / ", size: 16, font: FONT, italics: true }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: FONT, italics: true }),
        ],
      }),
    ],
  });
}

function doc(filename: string, etabNom: string, children: any[]): Document {
  return new Document({
    creator: "ComptaEPLE — Voyages v2",
    title: filename,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: FONT, color: "1F3864" },
          paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: FONT, color: "2E74B5" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 portrait
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: { default: header(etabNom) },
        footers: { default: footer(filename) },
        children,
      },
    ],
  });
}

function blocVoyage(c: DocxBuildContext) {
  return [
    h2("Identification du voyage"),
    table([
      new TableRow({ children: [cell("Libellé", { bold: true, width: 3000, bg: "DEEAF6" }), cell(c.voyage.libelle, { width: 6360 })] }),
      new TableRow({ children: [cell("Référence interne", { bold: true, width: 3000, bg: "DEEAF6" }), cell(c.voyage.reference_interne, { width: 6360 })] }),
      new TableRow({ children: [cell("Destination", { bold: true, width: 3000, bg: "DEEAF6" }), cell(`${c.voyage.destination_ville} (${c.voyage.destination_pays})`, { width: 6360 })] }),
      new TableRow({ children: [cell("Dates", { bold: true, width: 3000, bg: "DEEAF6" }), cell(`Du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)} — ${c.voyage.nombre_nuitees ?? 0} nuitée(s)`, { width: 6360 })] }),
      new TableRow({ children: [cell("Effectifs", { bold: true, width: 3000, bg: "DEEAF6" }), cell(`${c.voyage.nb_eleves_prevus ?? 0} élève(s) — ${c.voyage.nb_accompagnateurs_prevus ?? 0} accompagnateur(s)`, { width: 6360 })] }),
      new TableRow({ children: [cell("Classes", { bold: true, width: 3000, bg: "DEEAF6" }), cell((c.voyage.classes_concernees || []).join(", ") || "—", { width: 6360 })] }),
      new TableRow({ children: [cell("Responsable", { bold: true, width: 3000, bg: "DEEAF6" }), cell(c.voyage.responsable_pedago_nom || "—", { width: 6360 })] }),
    ]),
    spacer(),
  ];
}

// ── Builders par document ───────────────────────────────────────
function children_01(c: DocxBuildContext) {
  return [
    h1("Fiche projet pédagogique"),
    ...blocVoyage(c),
    h2("Lien avec le projet d'établissement"),
    p(c.voyage.lien_projet_etablissement || "(à compléter)"),
    h2("Objectifs pédagogiques"),
    p("• Objectif 1 : (à compléter)"),
    p("• Objectif 2 : (à compléter)"),
    p("• Objectif 3 : (à compléter)"),
    h2("Modalités d'évaluation"),
    p("(à compléter — restitution, exposé, dossier, etc.)"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`, { italics: true }),
    p(`${c.etablissement.chef_etab || "Le chef d'établissement"}`),
  ];
}

function children_02(c: DocxBuildContext) {
  return [
    h1("Rapport du chef d'établissement au CA"),
    p(`Objet : autorisation du voyage scolaire « ${c.voyage.libelle} »`, { bold: true }),
    spacer(),
    p(`Mesdames, Messieurs les membres du Conseil d'administration,`),
    spacer(),
    p(`J'ai l'honneur de soumettre à votre approbation le projet de voyage scolaire à ${c.voyage.destination_ville} (${c.voyage.destination_pays}), prévu du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    ...blocVoyage(c),
    h2("Cadre réglementaire"),
    p("Conformément aux articles L.421-14, R.421-20 du Code de l'éducation et à la circulaire MENE2407159C du 16 juillet 2024 (BO n°30 du 25/07/2024)."),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`, { italics: true }),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_03(c: DocxBuildContext) {
  return [
    h1("Délibération du Conseil d'administration"),
    p(`Acte n° ${c.voyage.numero_acte_ca || "(à attribuer)"} — Séance du ${fmtDate(c.voyage.date_ca_autorisation) }`, { bold: true }),
    spacer(),
    p(`Vu le Code de l'éducation, notamment ses articles L.421-14 et R.421-20 ;`),
    p(`Vu la circulaire MENE2407159C du 16 juillet 2024 ;`),
    p(`Vu le rapport présenté par le chef d'établissement ;`),
    spacer(),
    p(`Le Conseil d'administration, après en avoir délibéré, AUTORISE :`, { bold: true }),
    p(`• L'organisation du voyage scolaire « ${c.voyage.libelle} » à ${c.voyage.destination_ville} du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)} ;`),
    p(`• Le budget prévisionnel d'un montant total de ${fmtEur(c.voyage.montant_total_ttc, c.voyage.devise)} ;`),
    p(`• La participation des familles selon l'échéancier annexé.`),
    spacer(),
    h2("Vote"),
    p("Pour : ___ — Contre : ___ — Abstention : ___"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${fmtDate(c.voyage.date_ca_autorisation) || c.meta.date_generation}`, { italics: true }),
    p(c.etablissement.chef_etab || "Le chef d'établissement, président du CA"),
  ];
}

function children_04(c: DocxBuildContext) {
  return [
    h1("Charte du voyage scolaire"),
    p(`Voyage : ${c.voyage.libelle} — ${c.voyage.destination_ville}`, { bold: true }),
    h2("Article 1 — Comportement"),
    p("L'élève s'engage à respecter le règlement intérieur de l'établissement durant toute la durée du voyage, ainsi que les consignes des accompagnateurs."),
    h2("Article 2 — Sécurité"),
    p("Aucun élève ne peut quitter le groupe sans autorisation expresse d'un accompagnateur."),
    h2("Article 3 — Sanctions"),
    p("Tout manquement grave entraîne le rapatriement aux frais de la famille et des sanctions disciplinaires au retour."),
    h2("Article 4 — Engagement"),
    p("Je soussigné(e) _________________________ , élève de la classe _________ , m'engage à respecter la présente charte."),
    spacer(),
    p("Date et signature de l'élève :"),
    spacer(),
    p("Date et signature du responsable légal :"),
  ];
}

function children_05(c: DocxBuildContext) {
  return [
    h1("Convention avec le prestataire"),
    p("Entre les soussignés :", { bold: true }),
    p(`L'établissement ${c.etablissement.nom}${c.etablissement.uai ? ` (UAI ${c.etablissement.uai})` : ""}, représenté par ${c.etablissement.chef_etab || "son chef d'établissement"} ;`),
    p("Et"),
    p(`Le prestataire : ${c.voyage.agence_nom || "(à renseigner)"}${c.voyage.agence_siret ? ` — SIRET ${c.voyage.agence_siret}` : ""} ;`),
    p(c.voyage.agence_garantie ? `Garantie financière : ${c.voyage.agence_garantie}` : "Garantie financière : (à renseigner)"),
    spacer(),
    h2("Objet"),
    p(`Organisation du voyage scolaire à ${c.voyage.destination_ville} du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    h2("Prix et modalités de paiement"),
    p(`Montant total : ${fmtEur(c.voyage.montant_total_ttc, c.voyage.devise)} TTC.`),
    h2("Annulation"),
    p("Conditions d'annulation conformes aux articles R.211-10 et suivants du Code du tourisme."),
    spacer(),
    p("Fait en deux exemplaires, à _______________ , le _______________"),
    spacer(),
    p("Pour l'établissement                              Pour le prestataire"),
  ];
}

function children_06(c: DocxBuildContext) {
  return [
    h1("Acte constitutif de régie (post-RGP)"),
    p("Vu le décret n° 2012-1246 du 7 novembre 2012 relatif à la GBCP ;"),
    p("Vu l'ordonnance n° 2022-408 du 23 mars 2022 relative au régime de responsabilité financière des gestionnaires publics ;"),
    p(`Vu l'avis conforme de l'agent comptable ${c.etablissement.agent_comptable || ""} ;`),
    spacer(),
    p("ARTICLE 1 — Une régie est instituée auprès de l'établissement pour les opérations relatives au voyage scolaire :"),
    p(`« ${c.voyage.libelle} » — ${c.voyage.destination_ville}`),
    p("ARTICLE 2 — Nature : (préciser : régie d'avances / de recettes / mixte)."),
    p("ARTICLE 3 — Montant maximum de l'encaisse : (à préciser)."),
    p("ARTICLE 4 — Le régisseur perçoit une indemnité de maniement de fonds (et NON un cautionnement, supprimé par l'ordonnance RGP)."),
    spacer(),
    p(`Fait le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_07(c: DocxBuildContext) {
  return [
    h1("Arrêté de nomination du régisseur"),
    p(`Le chef d'établissement, vu l'acte constitutif de régie du ${c.meta.date_generation}, nomme :`),
    spacer(),
    p("• Régisseur titulaire : _____________________________"),
    p("• Régisseur suppléant : _____________________________"),
    spacer(),
    p("Indemnité de maniement de fonds : conforme au barème en vigueur (Ord. RGP 2022-408)."),
    p("Mention obligatoire : aucune mention de cautionnement (supprimé)."),
    spacer(),
    p(`Fait le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_08(c: DocxBuildContext) {
  return [
    h1("Information aux familles"),
    p(`Madame, Monsieur,`),
    p(`L'établissement ${c.etablissement.nom} organise un voyage scolaire à ${c.voyage.destination_ville} (${c.voyage.destination_pays}) du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    ...blocVoyage(c),
    h2("Coût et participation"),
    p(`Coût total estimé : ${fmtEur(c.voyage.montant_total_ttc, c.voyage.devise)}.`),
    p("La participation des familles sera précisée dans l'échéancier joint."),
    h2("Documents à retourner"),
    p("• Formulaire d'engagement signé"),
    p("• Autorisation parentale"),
    p("• Fiche sanitaire"),
    p("• Copie de la pièce d'identité (et passeport si voyage hors UE)"),
    spacer(),
    p("Le chef d'établissement, " + (c.etablissement.chef_etab || "")),
  ];
}

function children_09(c: DocxBuildContext) {
  return [
    h1("Formulaire d'engagement de la famille"),
    p(`Voyage : ${c.voyage.libelle}`, { bold: true }),
    spacer(),
    p("Je soussigné(e) ____________________________, responsable légal de l'élève :"),
    p("Nom : __________________ Prénom : __________________ Classe : ________"),
    spacer(),
    p("• Autorise mon enfant à participer au voyage ci-dessus."),
    p(`• M'engage à régler la participation due selon l'échéancier joint, soit ${fmtEur(c.voyage.montant_total_ttc, c.voyage.devise)} (à actualiser).`),
    p("• Accepte la charte du voyage et le règlement intérieur."),
    p("• Reconnais avoir été informé(e) que le défaut de paiement empêche la participation."),
    spacer(),
    p("Date :                                  Signature :"),
  ];
}

function children_10(c: DocxBuildContext) {
  return [
    h1("Autorisation de sortie du territoire (AST)"),
    p("Cerfa n° 15646*01 — référence officielle.", { italics: true }),
    spacer(),
    p("Je soussigné(e) ____________________________ , titulaire de l'autorité parentale,"),
    p("autorise l'enfant : Nom _____________ Prénom _____________ né(e) le _________"),
    p(`à quitter le territoire français pour se rendre à : ${c.voyage.destination_ville} (${c.voyage.destination_pays})`),
    p(`du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    spacer(),
    p("Pièce d'identité du signataire : type _____ n° _____ délivrée le _____ par _____"),
    spacer(),
    p("Date :                                  Signature :"),
    spacer(),
    p("Document à présenter au passage de la frontière avec la pièce d'identité du mineur.", { italics: true }),
  ];
}

function children_11(_c: DocxBuildContext) {
  return [
    h1("Fiche sanitaire de liaison"),
    p("Élève : Nom ____________ Prénom ____________ Classe ________ Date naissance ________"),
    h2("1. Vaccinations"),
    p("Date du dernier rappel DTPolio : __________"),
    h2("2. Antécédents médicaux"),
    p("Allergies : __________________________________"),
    p("Traitements en cours : ________________________"),
    h2("3. Médecin traitant"),
    p("Nom : ___________ Téléphone : ___________"),
    h2("4. Personne à prévenir en cas d'urgence"),
    p("Nom : ___________ Lien : ________ Téléphone : ___________"),
    spacer(),
    p("Date :                                  Signature du responsable légal :"),
  ];
}

function children_12(_c: DocxBuildContext) {
  return [
    h1("Autorisation parentale"),
    p("Je soussigné(e) ____________________________ , responsable légal de l'enfant"),
    p("___________________________ , élève de la classe ________ ,"),
    spacer(),
    p("• Autorise mon enfant à participer au voyage scolaire."),
    p("• Autorise les accompagnateurs à prendre toute mesure d'urgence en cas d'accident."),
    p("• Autorise / N'autorise PAS la prise et l'usage à but pédagogique de photographies de mon enfant."),
    spacer(),
    p("Date :                                  Signature :"),
  ];
}

function children_13(c: DocxBuildContext) {
  return [
    h1("Échéancier de paiement"),
    p(`Voyage : ${c.voyage.libelle} — ${c.voyage.destination_ville}`, { bold: true }),
    spacer(),
    table([
      new TableRow({ children: [
        cell("Échéance", { bold: true, width: 3000, bg: "DEEAF6" }),
        cell("Date limite", { bold: true, width: 3000, bg: "DEEAF6" }),
        cell("Montant", { bold: true, width: 3360, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [cell("Acompte (30%)", { width: 3000 }), cell("J-45", { width: 3000 }), cell(fmtEur((c.voyage.montant_total_ttc || 0) * 0.3, c.voyage.devise), { width: 3360, align: AlignmentType.RIGHT })] }),
      new TableRow({ children: [cell("Échéance 2 (40%)", { width: 3000 }), cell("J-30", { width: 3000 }), cell(fmtEur((c.voyage.montant_total_ttc || 0) * 0.4, c.voyage.devise), { width: 3360, align: AlignmentType.RIGHT })] }),
      new TableRow({ children: [cell("Solde (30%)", { width: 3000 }), cell("J-14", { width: 3000 }), cell(fmtEur((c.voyage.montant_total_ttc || 0) * 0.3, c.voyage.devise), { width: 3360, align: AlignmentType.RIGHT })] }),
      new TableRow({ children: [cell("TOTAL", { bold: true, width: 3000, bg: "F2F2F2" }), cell("", { width: 3000, bg: "F2F2F2" }), cell(fmtEur(c.voyage.montant_total_ttc, c.voyage.devise), { bold: true, width: 3360, bg: "F2F2F2", align: AlignmentType.RIGHT })] }),
    ]),
  ];
}

function children_14(c: DocxBuildContext) {
  return [
    h1("Quittance de paiement"),
    p(`Établissement : ${c.etablissement.nom}`),
    p(`Voyage : ${c.voyage.libelle}`),
    spacer(),
    p("Reçu de :  M./Mme _______________________"),
    p("Pour l'élève : Nom ___________ Prénom ___________ Classe ______"),
    p("Montant : ___________ €  —  Mode de règlement : ☐ espèces ☐ chèque n° ____ ☐ virement"),
    p("Échéance concernée : ☐ acompte ☐ solde ☐ autre : _________"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ____________`),
    p("Le régisseur,"),
  ];
}

function children_15(c: DocxBuildContext) {
  return [
    h1("Attestation globale de paiement"),
    p(`Je soussigné(e), agent comptable de ${c.etablissement.nom}, atteste que :`),
    p("M./Mme ____________________ s'est acquitté(e) de l'intégralité de la participation pour l'élève ____________________"),
    p(`au voyage scolaire « ${c.voyage.libelle} » pour un montant de ___________ €.`),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.agent_comptable || "L'agent comptable"),
  ];
}

function children_16(c: DocxBuildContext) {
  return [
    h1("Courrier de remboursement individualisé"),
    p(`Madame, Monsieur,`),
    p(`Suite au bilan financier du voyage « ${c.voyage.libelle} » approuvé par le Conseil d'administration, un excédent a été constaté.`),
    spacer(),
    p("Conformément à la loi de finances n° 66-948 du 22 décembre 1966 (article 21), un remboursement vous est dû pour l'élève :", { bold: true }),
    p("Nom ___________ Prénom ___________ Classe ______"),
    spacer(),
    p("Montant à rembourser : ___________ €"),
    p("Mode : virement bancaire (RIB à transmettre) — chèque (à retirer à l'intendance)"),
    spacer(),
    p("Note importante : si le reliquat individuel est inférieur ou égal à 8 €, il est conservé par l'établissement au titre du don tacite (LF 66-948 art. 21).", { italics: true }),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.agent_comptable || "L'agent comptable"),
  ];
}

function children_17(c: DocxBuildContext) {
  return [
    h1("Cahier des charges"),
    p(`Voyage scolaire : ${c.voyage.libelle}`, { bold: true }),
    h2("1. Objet"),
    p(`Organisation d'un voyage scolaire à ${c.voyage.destination_ville} (${c.voyage.destination_pays}) du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    h2("2. Public concerné"),
    p(`${c.voyage.nb_eleves_prevus ?? 0} élèves + ${c.voyage.nb_accompagnateurs_prevus ?? 0} accompagnateurs.`),
    h2("3. Prestations attendues"),
    p("• Transport aller-retour"),
    p("• Hébergement (préciser type, normes)"),
    p("• Restauration (pension complète / demi-pension)"),
    p("• Activités pédagogiques"),
    p("• Assurance assistance et rapatriement"),
    h2("4. Critères de jugement des offres"),
    p("• Prix (40%)"),
    p("• Qualité des prestations (35%)"),
    p("• Sécurité et garanties (15%)"),
    p("• Engagements RSE / pédagogiques (10%)"),
    h2("5. Modalités de réponse"),
    p("Les offres sont à transmettre à l'établissement avant le ____________ par voie électronique."),
  ];
}

function children_18(c: DocxBuildContext) {
  return [
    h1("Lettre de consultation"),
    p(`Madame, Monsieur,`),
    p(`L'établissement ${c.etablissement.nom} envisage l'organisation d'un voyage scolaire à ${c.voyage.destination_ville} du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}.`),
    p(`Nous vous invitons à nous soumettre votre meilleure offre pour les prestations détaillées dans le cahier des charges joint.`),
    p(`Date limite de remise des offres : __________`),
    spacer(),
    p("Modalités : voir cahier des charges."),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_19(_c: DocxBuildContext) {
  return [
    h1("Grille d'analyse des offres"),
    table([
      new TableRow({ children: [
        cell("Critère", { bold: true, width: 3000, bg: "DEEAF6" }),
        cell("Pondération", { bold: true, width: 1500, bg: "DEEAF6", align: AlignmentType.CENTER }),
        cell("Offre A", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.CENTER }),
        cell("Offre B", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.CENTER }),
        cell("Offre C", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.CENTER }),
      ]}),
      ...["Prix (40%)", "Qualité (35%)", "Sécurité (15%)", "RSE/pédago (10%)"].map(crit =>
        new TableRow({ children: [
          cell(crit, { width: 3000 }),
          cell("__/20", { width: 1500, align: AlignmentType.CENTER }),
          cell("__", { width: 1620, align: AlignmentType.CENTER }),
          cell("__", { width: 1620, align: AlignmentType.CENTER }),
          cell("__", { width: 1620, align: AlignmentType.CENTER }),
        ]})
      ),
      new TableRow({ children: [
        cell("TOTAL pondéré", { bold: true, width: 3000, bg: "F2F2F2" }),
        cell("100%", { bold: true, width: 1500, bg: "F2F2F2", align: AlignmentType.CENTER }),
        cell("__", { bold: true, width: 1620, bg: "F2F2F2", align: AlignmentType.CENTER }),
        cell("__", { bold: true, width: 1620, bg: "F2F2F2", align: AlignmentType.CENTER }),
        cell("__", { bold: true, width: 1620, bg: "F2F2F2", align: AlignmentType.CENTER }),
      ]}),
    ]),
    spacer(),
    p("Commission d'analyse réunie le ___________"),
  ];
}

function children_20(c: DocxBuildContext) {
  return [
    h1("Décision d'attribution"),
    p(`À l'issue de la consultation lancée le ___________ pour le voyage « ${c.voyage.libelle} », et après analyse comparative des offres :`),
    spacer(),
    p("Le marché est attribué à : __________________________________", { bold: true }),
    p("Pour un montant de : ___________ € TTC"),
    spacer(),
    p("Motivation : meilleur rapport qualité/prix au regard des critères pondérés."),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_21(c: DocxBuildContext) {
  const recettes = c.recettes || [];
  const depenses = c.depenses || [];
  const totR = recettes.reduce((s, r) => s + (r.montant || 0), 0);
  const totD = depenses.reduce((s, d) => s + (d.montant_ttc || 0), 0);

  return [
    h1("Budget prévisionnel pour le CA"),
    ...blocVoyage(c),
    h2("Recettes"),
    table([
      new TableRow({ children: [
        cell("Libellé", { bold: true, width: 3500, bg: "DEEAF6" }),
        cell("Nature", { bold: true, width: 2000, bg: "DEEAF6" }),
        cell("Statut", { bold: true, width: 1500, bg: "DEEAF6" }),
        cell("Imputation", { bold: true, width: 1100, bg: "DEEAF6" }),
        cell("Montant", { bold: true, width: 1260, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(recettes.length ? recettes : [{ libelle: "(à compléter)", montant: 0 } as any]).map(r =>
        new TableRow({ children: [
          cell(r.libelle || "—", { width: 3500 }),
          cell(String(r.nature || "—"), { width: 2000 }),
          cell(String(r.statut_financeur || "—"), { width: 1500 }),
          cell(r.imputation_compte || "—", { width: 1100 }),
          cell(fmtEur(r.montant), { width: 1260, align: AlignmentType.RIGHT }),
        ]})
      ),
      new TableRow({ children: [
        cell("TOTAL RECETTES", { bold: true, width: 8100, bg: "F2F2F2" }),
        cell(fmtEur(totR), { bold: true, width: 1260, bg: "F2F2F2", align: AlignmentType.RIGHT }),
      ]}),
    ]),
    spacer(),
    h2("Dépenses"),
    table([
      new TableRow({ children: [
        cell("Libellé", { bold: true, width: 3500, bg: "DEEAF6" }),
        cell("Poste", { bold: true, width: 2000, bg: "DEEAF6" }),
        cell("Fournisseur", { bold: true, width: 1500, bg: "DEEAF6" }),
        cell("Compte", { bold: true, width: 1100, bg: "DEEAF6" }),
        cell("Montant TTC", { bold: true, width: 1260, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(depenses.length ? depenses : [{ libelle: "(à compléter)", montant_ttc: 0 } as any]).map(d =>
        new TableRow({ children: [
          cell(d.libelle || "—", { width: 3500 }),
          cell(String(d.poste || "—"), { width: 2000 }),
          cell(d.fournisseur || "—", { width: 1500 }),
          cell(d.compte_charge || "—", { width: 1100 }),
          cell(fmtEur(d.montant_ttc), { width: 1260, align: AlignmentType.RIGHT }),
        ]})
      ),
      new TableRow({ children: [
        cell("TOTAL DÉPENSES", { bold: true, width: 8100, bg: "F2F2F2" }),
        cell(fmtEur(totD), { bold: true, width: 1260, bg: "F2F2F2", align: AlignmentType.RIGHT }),
      ]}),
    ]),
    spacer(),
    p(`Équilibre : ${totR === totD ? "✓ équilibré" : "⚠ écart de " + fmtEur(Math.abs(totR - totD))}`, { bold: true }),
  ];
}

function children_22(c: DocxBuildContext) {
  const recettes = c.recettes || [];
  return [
    h1("État des titres de recettes à émettre"),
    table([
      new TableRow({ children: [
        cell("N° titre", { bold: true, width: 1500, bg: "DEEAF6" }),
        cell("Débiteur / origine", { bold: true, width: 4000, bg: "DEEAF6" }),
        cell("Imputation", { bold: true, width: 1860, bg: "DEEAF6" }),
        cell("Montant", { bold: true, width: 2000, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(recettes.length ? recettes : [{ libelle: "(à compléter)", montant: 0 } as any]).map((r, i) =>
        new TableRow({ children: [
          cell(`${i + 1}`, { width: 1500 }),
          cell(r.libelle || "—", { width: 4000 }),
          cell(r.imputation_compte || "—", { width: 1860 }),
          cell(fmtEur(r.montant), { width: 2000, align: AlignmentType.RIGHT }),
        ]})
      ),
    ]),
  ];
}

function children_23(c: DocxBuildContext) {
  const depenses = c.depenses || [];
  return [
    h1("Bons de commande"),
    p(`Voyage : ${c.voyage.libelle}`, { bold: true }),
    spacer(),
    ...(depenses.length ? depenses : [{ libelle: "(à compléter)", montant_ttc: 0 } as any]).flatMap((d, i) => [
      h2(`BC n°${i + 1} — ${d.libelle}`),
      p(`Fournisseur : ${d.fournisseur || "—"}`),
      p(`Imputation : ${d.compte_charge || "—"}`),
      p(`Montant TTC : ${fmtEur(d.montant_ttc)}`),
      spacer(),
    ]),
  ];
}

function children_24(c: DocxBuildContext) {
  const depenses = c.depenses || [];
  return [
    h1("État de liquidation"),
    p("Conformément à l'article 31 du décret GBCP 2012-1246 — service fait constaté.", { italics: true }),
    spacer(),
    table([
      new TableRow({ children: [
        cell("Libellé", { bold: true, width: 4000, bg: "DEEAF6" }),
        cell("Fournisseur", { bold: true, width: 2360, bg: "DEEAF6" }),
        cell("Service fait", { bold: true, width: 1500, bg: "DEEAF6", align: AlignmentType.CENTER }),
        cell("Montant TTC", { bold: true, width: 1500, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(depenses.length ? depenses : [{ libelle: "(à compléter)", montant_ttc: 0 } as any]).map(d =>
        new TableRow({ children: [
          cell(d.libelle || "—", { width: 4000 }),
          cell(d.fournisseur || "—", { width: 2360 }),
          cell("☐", { width: 1500, align: AlignmentType.CENTER }),
          cell(fmtEur(d.montant_ttc), { width: 1500, align: AlignmentType.RIGHT }),
        ]})
      ),
    ]),
  ];
}

function children_25(_c: DocxBuildContext) {
  return [
    h1("Tableau de mobilisation des bourses"),
    p("Réf. Circulaire MENE1704160C du 17/02/2017 — bourses 2nd degré.", { italics: true }),
    table([
      new TableRow({ children: [
        cell("Élève", { bold: true, width: 3500, bg: "DEEAF6" }),
        cell("Échelon", { bold: true, width: 1500, bg: "DEEAF6", align: AlignmentType.CENTER }),
        cell("Montant bourse", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
        cell("% affecté voyage", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [cell("(à compléter)", { width: 3500 }), cell("—", { width: 1500, align: AlignmentType.CENTER }), cell("—", { width: 2180, align: AlignmentType.RIGHT }), cell("—", { width: 2180, align: AlignmentType.RIGHT })] }),
    ]),
  ];
}

function children_26(_c: DocxBuildContext) {
  return [
    h1("Tableau d'affectation des fonds sociaux"),
    p("Aide aux familles via fonds social collège/lycée.", { italics: true }),
    table([
      new TableRow({ children: [
        cell("Élève", { bold: true, width: 4000, bg: "DEEAF6" }),
        cell("Décision FSE/FSL", { bold: true, width: 2680, bg: "DEEAF6" }),
        cell("Aide accordée", { bold: true, width: 2680, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [cell("(à compléter)", { width: 4000 }), cell("—", { width: 2680 }), cell("—", { width: 2680, align: AlignmentType.RIGHT })] }),
    ]),
  ];
}

function children_27(c: DocxBuildContext) {
  return [
    h1("Procès-verbal de réception des prestations"),
    p(`Voyage : ${c.voyage.libelle} — ${c.voyage.destination_ville}`, { bold: true }),
    p(`Période : du ${fmtDate(c.voyage.date_depart)} au ${fmtDate(c.voyage.date_retour)}`),
    spacer(),
    h2("Prestations contrôlées"),
    p("☐ Transport conforme au cahier des charges"),
    p("☐ Hébergement conforme"),
    p("☐ Restauration conforme"),
    p("☐ Activités pédagogiques réalisées"),
    p("☐ Aucune réserve / Réserves : __________________"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement"),
  ];
}

function children_28(c: DocxBuildContext) {
  const recettes = c.recettes || [];
  const depenses = c.depenses || [];
  const totR = recettes.reduce((s, r) => s + (r.montant || 0), 0);
  const totD = depenses.reduce((s, d) => s + (d.montant_ttc || 0), 0);
  const reliquat = totR - totD;

  return [
    h1("Bilan financier (modèle Créteil)"),
    ...blocVoyage(c),
    h2("1. Recettes réalisées"),
    table([
      new TableRow({ children: [
        cell("Origine", { bold: true, width: 5000, bg: "DEEAF6" }),
        cell("Prévu", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
        cell("Réalisé", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(recettes.length ? recettes : [{ libelle: "(aucune)", montant: 0 } as any]).map(r =>
        new TableRow({ children: [
          cell(r.libelle || "—", { width: 5000 }),
          cell(fmtEur(r.montant), { width: 2180, align: AlignmentType.RIGHT }),
          cell(fmtEur(r.montant), { width: 2180, align: AlignmentType.RIGHT }),
        ]})
      ),
      new TableRow({ children: [
        cell("TOTAL", { bold: true, width: 5000, bg: "F2F2F2" }),
        cell(fmtEur(totR), { bold: true, width: 2180, bg: "F2F2F2", align: AlignmentType.RIGHT }),
        cell(fmtEur(totR), { bold: true, width: 2180, bg: "F2F2F2", align: AlignmentType.RIGHT }),
      ]}),
    ]),
    h2("2. Dépenses réalisées"),
    table([
      new TableRow({ children: [
        cell("Poste", { bold: true, width: 5000, bg: "DEEAF6" }),
        cell("Prévu", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
        cell("Réalisé", { bold: true, width: 2180, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(depenses.length ? depenses : [{ libelle: "(aucune)", montant_ttc: 0 } as any]).map(d =>
        new TableRow({ children: [
          cell(d.libelle || "—", { width: 5000 }),
          cell(fmtEur(d.montant_ttc), { width: 2180, align: AlignmentType.RIGHT }),
          cell(fmtEur(d.montant_ttc), { width: 2180, align: AlignmentType.RIGHT }),
        ]})
      ),
      new TableRow({ children: [
        cell("TOTAL", { bold: true, width: 5000, bg: "F2F2F2" }),
        cell(fmtEur(totD), { bold: true, width: 2180, bg: "F2F2F2", align: AlignmentType.RIGHT }),
        cell(fmtEur(totD), { bold: true, width: 2180, bg: "F2F2F2", align: AlignmentType.RIGHT }),
      ]}),
    ]),
    spacer(),
    h2("3. Résultat"),
    p(`Solde (recettes − dépenses) : ${fmtEur(reliquat)}`, { bold: true }),
    p(reliquat > 0
      ? `Excédent à reverser aux familles (sauf reliquats individuels ≤ 8 € — LF 66-948 art. 21).`
      : reliquat < 0
        ? `Déficit à régulariser sur ressources de l'établissement.`
        : `Équilibre exact.`),
  ];
}

function children_29(c: DocxBuildContext) {
  return [
    h1("Acte du CA — Vote du bilan"),
    p(`Vu le Code de l'éducation, articles L.421-14 et R.421-20 ;`),
    p(`Vu le bilan financier du voyage « ${c.voyage.libelle} » ;`),
    spacer(),
    p("Le Conseil d'administration, après en avoir délibéré, APPROUVE le bilan financier présenté.", { bold: true }),
    p("Pour : ___ — Contre : ___ — Abstention : ___"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.chef_etab || "Le chef d'établissement, président du CA"),
  ];
}

function children_30(c: DocxBuildContext) {
  const participants = c.participants || [];
  return [
    h1("État des remboursements aux familles"),
    p("Application de l'article 21 de la loi n° 66-948 du 22/12/1966 : reliquats ≤ 8 € conservés (don tacite).", { italics: true }),
    spacer(),
    table([
      new TableRow({ children: [
        cell("Élève", { bold: true, width: 3500, bg: "DEEAF6" }),
        cell("Classe", { bold: true, width: 1500, bg: "DEEAF6" }),
        cell("Versé", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.RIGHT }),
        cell("Coût réel", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.RIGHT }),
        cell("À rembourser", { bold: true, width: 1620, bg: "DEEAF6", align: AlignmentType.RIGHT }),
      ]}),
      ...(participants.length ? participants : [{ nom: "(à compléter)", prenom: "", classe: "" } as any]).map(p_ => {
        const verse = p_.participation_reelle ?? 0;
        const cout = (verse) - (p_.reste_a_payer ?? 0);
        const rbt = Math.max(0, verse - cout);
        const dontacite = rbt > 0 && rbt <= 8;
        return new TableRow({ children: [
          cell(`${p_.nom} ${p_.prenom}`, { width: 3500 }),
          cell(p_.classe || "—", { width: 1500 }),
          cell(fmtEur(verse), { width: 1620, align: AlignmentType.RIGHT }),
          cell(fmtEur(cout), { width: 1620, align: AlignmentType.RIGHT }),
          cell(dontacite ? "0 € (don ≤8€)" : fmtEur(rbt), { width: 1620, align: AlignmentType.RIGHT }),
        ]});
      }),
    ]),
  ];
}

function children_31(c: DocxBuildContext) {
  return [
    h1("Rapport pédagogique de bilan"),
    p(`Voyage : ${c.voyage.libelle} — ${c.voyage.destination_ville}`, { bold: true }),
    h2("Objectifs pédagogiques atteints"),
    p("(à compléter)"),
    h2("Activités réalisées"),
    p("(à compléter)"),
    h2("Bilan qualitatif"),
    p("(à compléter)"),
    h2("Difficultés rencontrées"),
    p("(à compléter)"),
    h2("Perspectives / réinvestissement pédagogique"),
    p("(à compléter)"),
    spacer(),
    p(`Rédigé par ${c.voyage.responsable_pedago_nom || "(responsable)"} le ${c.meta.date_generation}`),
  ];
}

function children_32(c: DocxBuildContext) {
  return [
    h1("Fiche de clôture comptable"),
    p("Conforme à l'instruction M9-6 tome 3.", { italics: true }),
    h2("Écritures à passer"),
    p("• Émission/annulation des titres et mandats résiduels"),
    p("• Constatation du résultat du voyage en classe 7/6"),
    p("• Reversement aux familles (compte 4664) ou don tacite (compte 7588) si reliquat ≤ 8 €"),
    p("• Solde du compte de tiers correspondant"),
    spacer(),
    h2("Pièces justificatives à archiver (10 ans)"),
    p("• Acte CA d'autorisation et bilan"),
    p("• Conventions et factures"),
    p("• Quittances aux familles"),
    p("• États de remboursement"),
    spacer(),
    p(`Fait à ${c.etablissement.nom}, le ${c.meta.date_generation}`),
    p(c.etablissement.agent_comptable || "L'agent comptable"),
  ];
}

const BUILDERS: Record<string, (c: DocxBuildContext) => any[]> = {
  "fiche-projet": children_01,
  "rapport-chef-etab": children_02,
  "acte-ca-autorisation": children_03,
  "charte-voyage": children_04,
  "convention-prestataire": children_05,
  "acte-regie": children_06,
  "arrete-regisseur": children_07,
  "info-familles": children_08,
  "engagement-famille": children_09,
  "cerfa-ast": children_10,
  "fiche-sanitaire": children_11,
  "autorisation-parentale": children_12,
  "echeancier": children_13,
  "quittance": children_14,
  "attestation-paiement": children_15,
  "courrier-remboursement": children_16,
  "cahier-charges": children_17,
  "lettre-consultation": children_18,
  "grille-analyse": children_19,
  "decision-attribution": children_20,
  "budget-previsionnel": children_21,
  "titres-recettes": children_22,
  "bons-commande": children_23,
  "etat-liquidation": children_24,
  "tableau-bourses": children_25,
  "tableau-fonds-sociaux": children_26,
  "pv-reception": children_27,
  "bilan-financier-creteil": children_28,
  "acte-ca-bilan": children_29,
  "etat-remboursements": children_30,
  "rapport-pedago-bilan": children_31,
  "fiche-cloture": children_32,
};

export async function buildDocxBlob(docId: string, filename: string, ctx: DocxBuildContext): Promise<Blob> {
  const builder = BUILDERS[docId];
  if (!builder) throw new Error(`Aucun builder pour le document ${docId}`);
  const document = doc(filename, ctx.etablissement.nom, builder(ctx));
  return await Packer.toBlob(document);
}

export function isBuilderImplemented(docId: string): boolean {
  return !!BUILDERS[docId];
}