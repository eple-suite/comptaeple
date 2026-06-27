// Rapport d'audit — génération PDF (jsPDF + autotable). Synthèse, cartographie,
// anomalies, plan d'actions, signature.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditMission } from "./types";
import { scoreMission, cartographie, critMeta } from "./engine";
import { CONTROLES, domaineLabel } from "./referentiel";

const NAVY: [number, number, number] = [30, 41, 59];
const def = (id: string) => CONTROLES.find((c) => c.id === id);

export function genererRapportAudit(mission: AuditMission) {
  const score = scoreMission(mission);
  const carto = cartographie(mission);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15);
  doc.text("Rapport d'audit comptable — EPLE", 14, 13);
  doc.setFontSize(10);
  doc.text(`${mission.etablissementNom} · ${mission.budgetType} · campagne ${mission.campagne}`, 14, 20);
  doc.setTextColor(30, 30, 30);

  doc.setFontSize(12); doc.text("Synthèse", 14, 36);
  doc.setFontSize(9);
  doc.text(
    `Conformité : ${score.tauxConformite.toFixed(0)} %  ·  Avancement : ${score.progression.toFixed(0)} %  ·  `
    + `Anomalies : ${score.nonConformes + score.reserves}  ·  `
    + `🔴 ${score.parCriticite.critique}  🟠 ${score.parCriticite.important}  🟡 ${score.parCriticite.vigilance}`,
    14, 43);

  autoTable(doc, {
    startY: 48, head: [["Domaine", "Contrôles", "Anomalies", "Criticité"]],
    body: carto.map((d) => [d.libelle, String(d.nbControles), String(d.nbAnomalies), `${critMeta(d.criticite).emoji} ${critMeta(d.criticite).label}`]),
    theme: "striped", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 },
  });
  let y = (doc as any).lastAutoTable.finalY + 8;

  // Anomalies détaillées
  const anomalies = Object.entries(mission.controles)
    .filter(([, s]) => s.resultat === "non_conforme" || s.resultat === "conforme_reserve");
  if (anomalies.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setTextColor(...NAVY); doc.text("Anomalies & observations", 14, y); y += 4;
    autoTable(doc, {
      startY: y, head: [["Domaine", "Contrôle", "Résultat", "Observation"]],
      body: anomalies.map(([id, s]) => {
        const d = def(id);
        return [domaineLabel(d?.domaineId ?? ""), d?.intitule ?? id, s.resultat.replace("_", " "), (s.observations ?? "").slice(0, 120)];
      }),
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 3: { cellWidth: 70 } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Plan d'actions
  if (mission.actions.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setTextColor(...NAVY); doc.text("Plan d'actions", 14, y); y += 4;
    autoTable(doc, {
      startY: y, head: [["Action", "Priorité", "Responsable", "Échéance", "État"]],
      body: mission.actions.map((a) => [a.libelle.slice(0, 80), a.priorite, a.responsable ?? "—", a.echeance ?? "—", a.etat.replace("_", " ")]),
      theme: "striped", headStyles: { fillColor: NAVY }, styles: { fontSize: 8 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Signature
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(9); doc.setTextColor(60, 60, 60);
  doc.text(`Auditeur : ${mission.signatureAuditeur || mission.auditeur || "—"}`, 14, y);
  doc.text(`Visa ordonnateur : ${mission.visaOrdonnateur || "—"}`, 14, y + 6);
  const H = doc.internal.pageSize.getHeight();
  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — EPLE Suite · M9-6 · GBCP · RGP 2022-408`, 14, H - 10);

  doc.save(`Rapport_audit_${mission.budgetType}_${mission.campagne}.pdf`);
}
