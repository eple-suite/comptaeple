// Documents Logements — arrêté de concession, titre exécutoire / ordre de
// recettes, décompte de charges (PDF, jsPDF). Pièces comptables prêtes à
// rapprocher de l'émission Op@le.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Logement, ReleveConso } from "./types";
import { CONCESSION_LABELS, FLUIDE_LABELS } from "./types";
import { decompteAnnuel, montantTitre } from "./engine";
import { archiverPdf } from "@/lib/documents/archiver";

const NAVY: [number, number, number] = [30, 41, 59];
const eur = (n: number) => (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fichier = (l: Logement, suffixe: string) => `${suffixe}_${l.libelle.replace(/[^\w-]+/g, "-")}.pdf`;

function entete(doc: jsPDF, etab: string, titre: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text(etab || "Établissement", 14, 14);
  doc.setTextColor(30, 30, 30); doc.setFontSize(15); doc.text(titre, 14, 34);
  doc.setDrawColor(200); doc.line(14, 38, W - 14, 38); doc.setFontSize(10);
}

export function arreteConcession(l: Logement, etab: string, signataire = "Le Chef d'établissement") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  entete(doc, etab, "Arrêté de concession de logement");
  const lignes = [
    "Vu le Code général de la propriété des personnes publiques (art. R.2124-65 et suivants) ;",
    "Vu le décret n°2012-752 du 9 mai 2012 relatif aux concessions de logement ;",
    "Vu le Code de l'éducation, notamment ses articles R.216-4 à R.216-19 ;",
    "Vu la délibération du conseil d'administration fixant les conditions d'occupation ;",
    "",
    `Article 1er — ${l.occupantNom}${l.occupantFonction ? `, ${l.occupantFonction}` : ""}, bénéficie d'une concession de logement par ${CONCESSION_LABELS[l.typeConcession]} pour le logement « ${l.libelle} »${l.surface ? ` (${l.surface} m²)` : ""}${l.adresse ? `, ${l.adresse}` : ""}.`,
    `Article 2 — La concession prend effet le ${new Date(l.dateDebut).toLocaleDateString("fr-FR")}${l.dateFin ? ` et prend fin le ${new Date(l.dateFin).toLocaleDateString("fr-FR")}` : ""}.`,
    l.typeConcession === "NAS"
      ? "Article 3 — Le logement est concédé par nécessité absolue de service (gratuité de la prestation ; avantage en nature soumis à cotisations selon la réglementation)."
      : `Article 3 — Une redevance mensuelle de ${eur(l.redevanceMensuelle)} est due, augmentée des provisions de charges (${eur(l.provisionsChargesMensuelles)} / mois). Un décompte annuel régularise les charges réelles.`,
    "Article 4 — L'occupant supporte les consommations individuelles (eau, électricité, gaz, chauffage) relevées contradictoirement.",
  ].filter(Boolean);
  let y = 46;
  lignes.forEach((t) => { const s = doc.splitTextToSize(t, W - 28); doc.text(s, 14, y); y += s.length * 6 + 1; });
  doc.text(`Fait à ${etab}, le ${new Date().toLocaleDateString("fr-FR")}`, W - 14, y + 8, { align: "right" });
  doc.text(signataire, W - 14, y + 22, { align: "right" });
  const fileName = fichier(l, "Arrete-concession");
  void archiverPdf(doc, { type: "autre", titre: `Arrêté de concession — ${l.libelle}`, fileName, etablissementNom: etab });
  doc.save(fileName);
}

export function titreExecutoire(l: Logement, etab: string, mois = 12, periode = "") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  entete(doc, etab, "Titre exécutoire / Ordre de recettes — logement");
  const m = montantTitre(l, mois);
  doc.text(`Débiteur : ${l.occupantNom}`, 14, 48);
  doc.text(`Logement : ${l.libelle}${l.adresse ? ` — ${l.adresse}` : ""}`, 14, 55);
  doc.text(`Période : ${periode || `${mois} mois`}`, 14, 62);
  autoTable(doc, {
    startY: 70,
    head: [["Objet", "Montant"]],
    body: [
      [`Redevance d'occupation (${eur(l.redevanceMensuelle)} × ${mois})`, eur(m.redevance)],
      [`Provisions de charges (${eur(l.provisionsChargesMensuelles)} × ${mois})`, eur(m.charges)],
      ["Total à recouvrer", eur(m.total)],
    ],
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 10 },
  });
  const y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.text("Pièce à rapprocher de l'ordre de recettes émis dans Op@le (compte de redevances).", 14, y);
  const fileName = fichier(l, "Titre-executoire");
  void archiverPdf(doc, { type: "titre_executoire", titre: `Titre exécutoire logement — ${l.occupantNom} (${l.libelle})`, fileName, etablissementNom: etab });
  doc.save(fileName);
}

export function decomptePdf(l: Logement, releves: ReleveConso[], annee: number, etab: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  entete(doc, etab, `Décompte de charges ${annee} — logement`);
  const d = decompteAnnuel(l, releves, annee);
  doc.text(`Occupant : ${l.occupantNom}  ·  Logement : ${l.libelle}`, 14, 48);
  autoTable(doc, {
    startY: 56,
    head: [["Fluide", "Consommation", "Montant"]],
    body: d.details.map((x) => [FLUIDE_LABELS[x.fluide], x.conso.toLocaleString("fr-FR"), eur(x.montant)]),
    theme: "striped", headStyles: { fillColor: NAVY }, styles: { fontSize: 9 },
  });
  let y = (doc as any).lastAutoTable.finalY + 8;
  const ligne = (label: string, val: string, bold = false) => {
    doc.setFontSize(10); if (bold) doc.setFont(undefined, "bold");
    doc.text(label, 14, y); doc.text(val, W - 14, y, { align: "right" });
    if (bold) doc.setFont(undefined, "normal"); y += 7;
  };
  ligne("Charges réelles", eur(d.chargesReelles));
  ligne("Provisions appelées", eur(d.provisionsAppelees));
  ligne(d.regularisation >= 0 ? "Solde à recouvrer auprès de l'occupant" : "Solde à restituer à l'occupant", eur(Math.abs(d.regularisation)), true);
  const fileName = fichier(l, `Decompte-charges-${annee}`);
  void archiverPdf(doc, { type: "decompte_charges", titre: `Décompte de charges ${annee} — ${l.libelle}`, fileName, etablissementNom: etab, exercice: annee });
  doc.save(fileName);
}
