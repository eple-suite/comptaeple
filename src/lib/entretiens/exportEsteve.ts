/**
 * Export ESTEVE — Évaluation Saisie Temps réel et Évaluation.
 *
 * Génération du fichier XML/CSV destiné à l'application ministérielle ESTEVE
 * (DGRH B1) pour transmission rectorat des CREP finalisés.
 *
 * Format : norme XML ministérielle (struct fictive documentée — à aligner
 * sur la DTD officielle lors du déploiement). Fournit aussi un export CSV
 * de secours pour exploitation tableur SG/AC.
 *
 * Référence : circulaire MENH1310955C — annexe 4 transmission académique.
 */
import type { Agent, EntretienProfessionnel, IaRepartitionResponse } from "./types";

export interface EstevePayload {
  entretien: EntretienProfessionnel;
  agent: Agent;
  ia?: IaRepartitionResponse | null;
  evaluateurNom: string;
  autoriteN2Nom?: string;
  etablissementUai: string;
  etablissementNom: string;
}

function escXml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escCsv(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  const v = String(s);
  if (v.includes(";") || v.includes("\"") || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

/** Génère le payload XML ESTEVE pour un entretien. */
export function genererXmlEsteve(p: EstevePayload): string {
  const { entretien: e, agent, ia, evaluateurNom, autoriteN2Nom, etablissementUai, etablissementNom } = p;
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<EstevePayload xmlns=\"urn:education:esteve:crep:v1\">");
  lines.push("  <Entete>");
  lines.push(`    <CampagneAnnee>${escXml(e.campagne_annee)}</CampagneAnnee>`);
  lines.push(`    <DateGeneration>${new Date().toISOString()}</DateGeneration>`);
  lines.push(`    <Source>plateforme-academique-pilotage</Source>`);
  lines.push("  </Entete>");
  lines.push("  <Etablissement>");
  lines.push(`    <UAI>${escXml(etablissementUai)}</UAI>`);
  lines.push(`    <Nom>${escXml(etablissementNom)}</Nom>`);
  lines.push("  </Etablissement>");
  lines.push("  <Agent>");
  lines.push(`    <Nom>${escXml(agent.nom)}</Nom>`);
  lines.push(`    <Prenom>${escXml(agent.prenom)}</Prenom>`);
  lines.push(`    <Categorie>${escXml(agent.categorie ?? "")}</Categorie>`);
  lines.push(`    <Filiere>${escXml(agent.filiere ?? "")}</Filiere>`);
  lines.push(`    <Statut>${escXml(agent.statut)}</Statut>`);
  lines.push(`    <Corps>${escXml(agent.corps ?? "")}</Corps>`);
  lines.push(`    <Grade>${escXml(agent.grade ?? "")}</Grade>`);
  lines.push(`    <Echelon>${agent.echelon ?? ""}</Echelon>`);
  lines.push(`    <Fonction>${escXml(agent.fonction ?? "")}</Fonction>`);
  lines.push(`    <Quotite>${agent.quotite_travail ?? 100}</Quotite>`);
  lines.push("  </Agent>");
  lines.push("  <Entretien>");
  lines.push(`    <DateEntretien>${escXml(e.date_entretien ?? "")}</DateEntretien>`);
  lines.push(`    <Mode>${escXml(e.mode ?? "presentiel")}</Mode>`);
  lines.push(`    <Evaluateur>${escXml(evaluateurNom)}</Evaluateur>`);
  lines.push(`    <AutoriteHierarchique>${escXml(autoriteN2Nom ?? "")}</AutoriteHierarchique>`);
  lines.push(`    <DateSignatureN1>${escXml(e.signature_n1_at ?? "")}</DateSignatureN1>`);
  lines.push(`    <DateVisaN2>${escXml(e.visa_n2_at ?? "")}</DateVisaN2>`);
  lines.push(`    <DateSignatureAgent>${escXml(e.signature_agent_at ?? "")}</DateSignatureAgent>`);
  lines.push(`    <DateFinalisation>${escXml(e.finalise_at ?? "")}</DateFinalisation>`);
  lines.push("  </Entretien>");
  if (ia) {
    lines.push("  <Appreciations>");
    lines.push(`    <Generale>${escXml(ia.appreciation_generale)}</Generale>`);
    lines.push(`    <Perspectives>${escXml(ia.perspectives)}</Perspectives>`);
    (["C1_resultats", "C2_competences_techniques", "C3_qualites_personnelles", "C4_encadrement"] as const).forEach((k) => {
      const r = ia.competences[k];
      lines.push(`    <Rubrique code="${k}">`);
      lines.push(`      <Synthese>${escXml(r.synthese)}</Synthese>`);
      r.sous_criteres.forEach((sc) => {
        lines.push(`      <SousCritere niveau="${escXml(sc.niveau)}">${escXml(sc.critere)}</SousCritere>`);
      });
      lines.push("    </Rubrique>");
    });
    lines.push("  </Appreciations>");
    lines.push("  <Formation>");
    ia.formation.demandes.forEach((d) => {
      lines.push(`    <Demande categorie="${escXml(d.categorie)}" priorite="${escXml(d.priorite)}">${escXml(d.intitule)}</Demande>`);
    });
    lines.push("  </Formation>");
  }
  lines.push("</EstevePayload>");
  return lines.join("\n");
}

/** Génère un export CSV de secours (1 ligne par entretien). */
export function genererCsvEsteve(payloads: EstevePayload[]): string {
  const headers = [
    "campagne", "uai", "etablissement", "nom", "prenom", "categorie", "filiere",
    "corps", "grade", "echelon", "fonction", "quotite",
    "date_entretien", "mode", "evaluateur", "autorite_n2",
    "signature_n1_at", "visa_n2_at", "signature_agent_at", "finalise_at",
    "score_completude",
  ];
  const lines = [headers.join(";")];
  for (const p of payloads) {
    const e = p.entretien;
    const a = p.agent;
    lines.push([
      escCsv(e.campagne_annee),
      escCsv(p.etablissementUai),
      escCsv(p.etablissementNom),
      escCsv(a.nom),
      escCsv(a.prenom),
      escCsv(a.categorie ?? ""),
      escCsv(a.filiere ?? ""),
      escCsv(a.corps ?? ""),
      escCsv(a.grade ?? ""),
      escCsv(String(a.echelon ?? "")),
      escCsv(a.fonction ?? ""),
      escCsv(String(a.quotite_travail ?? 100)),
      escCsv(e.date_entretien ?? ""),
      escCsv(e.mode ?? ""),
      escCsv(p.evaluateurNom),
      escCsv(p.autoriteN2Nom ?? ""),
      escCsv(e.signature_n1_at ?? ""),
      escCsv(e.visa_n2_at ?? ""),
      escCsv(e.signature_agent_at ?? ""),
      escCsv(e.finalise_at ?? ""),
      escCsv(String(e.ia_score_completude ?? "")),
    ].join(";"));
  }
  return "\uFEFF" + lines.join("\n");
}

/** Vérifie qu'un entretien est éligible à l'export ESTEVE. */
export function eligibleExportEsteve(e: EntretienProfessionnel): { ok: boolean; raison?: string } {
  if (e.statut !== "finalise" && e.statut !== "archive") {
    return { ok: false, raison: "Entretien non finalisé (statut requis : finalisé ou archivé)." };
  }
  if (!e.signature_n1_at) return { ok: false, raison: "Signature N+1 manquante." };
  if (!e.visa_n2_at) return { ok: false, raison: "Visa N+2 manquant." };
  if (!e.signature_agent_at) return { ok: false, raison: "Signature agent manquante." };
  if (!e.finalise_at) return { ok: false, raison: "Date de finalisation manquante." };
  return { ok: true };
}