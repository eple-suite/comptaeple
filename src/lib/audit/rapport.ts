// Rapport d'audit — génération PDF (jsPDF + autotable). Synthèse, cartographie,
// anomalies, plan d'actions, signature.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditMission } from "./types";
import { scoreMission, cartographie, critMeta } from "./engine";
import { CONTROLES, domaineLabel } from "./referentiel";
import { archiverPdf } from "@/lib/documents/archiver";

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

  void archiverPdf(doc, {
    type: "rapport_audit",
    titre: `Rapport d'audit — ${mission.etablissementNom} · ${mission.campagne}`,
    fileName: `Rapport_audit_${mission.budgetType}_${mission.campagne}.pdf`,
    etablissementId: mission.etablissementId,
    etablissementNom: mission.etablissementNom,
    exercice: mission.campagne,
  });
  doc.save(`Rapport_audit_${mission.budgetType}_${mission.campagne}.pdf`);
}

// Lettre d'observations à l'ordonnateur (amélioration #30) : courrier institutionnel
// reprenant les observations critiques/importantes et leurs recommandations.
const RANG_RISQUE: Record<string, number> = { critique: 0, important: 1, moyen: 2, faible: 3 };

export function genererLettreObservations(mission: AuditMission) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString("fr-FR");

  // En-tête institutionnel
  doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text("Agence comptable du groupement Coeffin", 14, 18);
  doc.setFontSize(9); doc.setTextColor(60, 60, 60);
  doc.text(mission.etablissementNom, 14, 24);
  doc.text("À l'attention de Madame, Monsieur l'Ordonnateur", W - 14, 18, { align: "right" });
  doc.text(`Le ${today}`, W - 14, 24, { align: "right" });

  doc.setTextColor(30, 30, 30); doc.setFontSize(11);
  doc.text("Objet : lettre d'observations — audit comptable", 14, 40);

  doc.setFontSize(9.5);
  const intro = doc.splitTextToSize(
    `Madame, Monsieur l'Ordonnateur,\n\nÀ l'issue de l'audit conduit sur le périmètre ${mission.budgetType} au titre de la campagne ${mission.campagne}, `
    + `je vous prie de bien vouloir trouver ci-après les principales observations relevées ainsi que les recommandations associées, `
    + `établies conformément à l'instruction M9-6, au décret GBCP n° 2012-1246 et au règlement général sur la comptabilité publique (ordonnance n° 2022-408).`,
    W - 28);
  doc.text(intro, 14, 48);
  let y = 48 + intro.length * 5 + 4;

  const obs = Object.entries(mission.controles)
    .filter(([, s]) => s.resultat === "non_conforme" || s.resultat === "conforme_reserve")
    .map(([id, s]) => ({ d: def(id), s }))
    .sort((a, b) => (RANG_RISQUE[a.d?.risque ?? "faible"] ?? 3) - (RANG_RISQUE[b.d?.risque ?? "faible"] ?? 3));

  if (obs.length) {
    autoTable(doc, {
      startY: y,
      head: [["Domaine", "Observation", "Recommandation"]],
      body: obs.map(({ d, s }) => [
        domaineLabel(d?.domaineId ?? ""),
        d?.intitule ?? "—",
        s.recommandation || d?.objectif || "Mettre en conformité au regard du fondement réglementaire.",
      ]),
      theme: "grid", headStyles: { fillColor: NAVY }, styles: { fontSize: 7.5, cellPadding: 1.6 },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 70 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.text("L'audit n'a pas relevé d'observation majeure sur le périmètre contrôlé.", 14, y);
    y += 8;
  }

  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(9.5);
  const clot = doc.splitTextToSize(
    `Je vous saurais gré de bien vouloir mettre en œuvre les mesures correctives correspondantes et de m'en tenir informé. `
    + `Le suivi des recommandations fera l'objet d'un point d'étape à échéance que je vous propose de fixer à trois mois.\n\n`
    + `Je vous prie d'agréer, Madame, Monsieur l'Ordonnateur, l'expression de ma considération distinguée.`,
    W - 28);
  doc.text(clot, 14, y);
  y += clot.length * 5 + 10;

  doc.setFontSize(9); doc.setTextColor(40, 40, 40);
  doc.text("L'Agent comptable", W - 14, y, { align: "right" });
  doc.text(mission.signatureAuditeur || mission.auditeur || "____________________", W - 14, y + 10, { align: "right" });

  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${today} — EPLE Suite · M9-6 · GBCP · RGP 2022-408`, 14, H - 10);

  void archiverPdf(doc, {
    type: "lettre_observations",
    titre: `Lettre d'observations — ${mission.etablissementNom} · ${mission.campagne}`,
    fileName: `Lettre_observations_${mission.budgetType}_${mission.campagne}.pdf`,
    etablissementId: mission.etablissementId,
    etablissementNom: mission.etablissementNom,
    exercice: mission.campagne,
  });
  doc.save(`Lettre_observations_${mission.budgetType}_${mission.campagne}.pdf`);
}
