// PV / registre des valeurs inactives (P503) — PDF (jsPDF + autotable).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ValeurInactive, MouvementVI, ControleVI } from "./store";
import { TYPE_VALEUR_LABELS, stockTheorique, valeurStock, totalRegistre } from "./store";

const NAVY: [number, number, number] = [30, 41, 59];
const eur = (n: number) => (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function genererPvValeursInactives(
  valeurs: ValeurInactive[], mouvements: MouvementVI[], controles: ControleVI[],
  etablissement?: string, agent?: string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14);
  doc.text("Registre des valeurs inactives (P503)", 14, 14);
  doc.setFontSize(9); doc.text(`${etablissement || "Établissement"} — M9-6`, 14, 20);
  doc.setTextColor(30, 30, 30);

  const dernierControle = (vid: string) =>
    controles.filter((c) => c.valeurId === vid).sort((a, b) => b.date.localeCompare(a.date))[0];

  autoTable(doc, {
    startY: 34,
    head: [["Désignation", "Type", "Val. unit.", "Stock théo.", "Valeur", "Constaté", "Écart"]],
    body: valeurs.map((v) => {
      const theo = stockTheorique(v.id, mouvements);
      const ctrl = dernierControle(v.id);
      const ecart = ctrl ? ctrl.stockConstate - theo : null;
      return [
        v.designation, TYPE_VALEUR_LABELS[v.type], eur(v.valeurUnitaire),
        String(theo), eur(valeurStock(v, mouvements)),
        ctrl ? String(ctrl.stockConstate) : "—",
        ecart == null ? "—" : (ecart === 0 ? "0" : (ecart > 0 ? `+${ecart}` : String(ecart))),
      ];
    }),
    theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 },
  });
  let y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11); doc.setFont(undefined, "bold");
  doc.text(`Valeur totale du registre : ${eur(totalRegistre(valeurs, mouvements))}`, 14, y);
  doc.setFont(undefined, "normal"); y += 12;

  doc.setFontSize(9); doc.setTextColor(60, 60, 60);
  doc.text(`Contrôle effectué par l'agent comptable : ${agent || "—"}`, 14, y);
  doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, W - 14, y, { align: "right" });
  doc.text("Signature :", W - 14, y + 16, { align: "right" });
  doc.save(`Registre_valeurs_inactives_P503_${new Date().toISOString().slice(0, 10)}.pdf`);
}
