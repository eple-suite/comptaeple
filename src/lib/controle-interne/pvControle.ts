// PV de vérification généré PAR contrôle interne (PDF horodaté, archivable).
import jsPDF from "jspdf";
import type { PointControle } from "./store";
import { archiverPdf } from "@/lib/documents/archiver";

const NAVY: [number, number, number] = [30, 41, 59];
const STATUT_LABEL: Record<string, string> = {
  conforme: "Conforme", anomalie: "Anomalie", en_cours: "En cours", non_realise: "Non réalisé",
};

export function genererPvControle(c: PointControle, etablissement?: string, agent?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14);
  doc.text("Procès-verbal de contrôle interne comptable", 14, 14);
  doc.setFontSize(9);
  doc.text(`${etablissement || "Établissement"} — M9-6 / GBCP / RGP 2022-408`, 14, 20);
  doc.setTextColor(30, 30, 30);

  let y = 36;
  const ligne = (label: string, val: string) => {
    doc.setFontSize(9); doc.setTextColor(110, 110, 110); doc.text(label, 14, y);
    doc.setTextColor(20, 20, 20); doc.setFontSize(10);
    const s = doc.splitTextToSize(val || "—", W - 70); doc.text(s, 64, y); y += Math.max(7, s.length * 5 + 2);
  };
  ligne("Processus", c.processus);
  ligne("Contrôle", c.action);
  ligne("Fréquence", c.frequence);
  ligne("Niveau de risque", c.risque);
  ligne("Responsable", c.responsable);
  ligne("Date du contrôle", c.dateControle ? new Date(c.dateControle).toLocaleDateString("fr-FR") : "—");
  ligne("Résultat", STATUT_LABEL[c.statut] ?? c.statut);
  y += 2;
  doc.setFontSize(9); doc.setTextColor(110, 110, 110); doc.text("Observations", 14, y); y += 5;
  doc.setFontSize(10); doc.setTextColor(20, 20, 20);
  const obs = doc.splitTextToSize(c.observation || "—", W - 28); doc.text(obs, 14, y); y += obs.length * 5 + 12;

  doc.setFontSize(9); doc.setTextColor(60, 60, 60);
  doc.text(`Contrôle effectué par : ${agent || c.responsable || "—"}`, 14, y);
  doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, W - 14, y, { align: "right" });
  doc.text("Signature :", W - 14, y + 16, { align: "right" });

  const fileName = `PV_controle_${c.processus.split(" ")[0]}_${(c.dateControle || "").slice(0, 10) || "draft"}.pdf`;
  void archiverPdf(doc, { type: "pv_controle", titre: `PV de contrôle interne — ${c.processus}`, fileName, etablissementNom: etablissement });
  doc.save(fileName);
}
