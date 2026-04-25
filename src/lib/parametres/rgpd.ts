// ═══════════════════════════════════════════════════════════════
// RGPD — Module Paramètres (chantier 7)
// Réf : Règlement UE 2016/679, loi Informatique et Libertés modifiée.
// ═══════════════════════════════════════════════════════════════

export interface TraitementFiche {
  id: string;
  finalite: string;
  baseLegale: string;
  destinataires: string[];
  conservation: string;
  donneesCollectees: string[];
  reference: string;
}

export const REGISTRE_TRAITEMENTS: TraitementFiche[] = [
  {
    id: "agents",
    finalite: "Gestion administrative et RH des agents BIATSS du groupement comptable",
    baseLegale: "Mission d'intérêt public (art. 6.1.e RGPD) — décret 86-83 / GBCP 2012-1246",
    destinataires: ["Agent comptable", "Chef d'établissement", "Rectorat (DPAE)"],
    conservation: "10 ans après fin de fonction (référentiel CNIL secteur public)",
    donneesCollectees: ["Identité", "Coordonnées professionnelles", "Statut, corps, grade", "RIFSEEP", "Historique de fonctions"],
    reference: "Art. 30 RGPD",
  },
  {
    id: "etablissements",
    finalite: "Référentiel des EPLE rattachés au groupement",
    baseLegale: "Obligation légale (Code éducation art. R.421-77, GBCP art. 86)",
    destinataires: ["Agent comptable", "Rectorat", "DDFiP/DRFiP"],
    conservation: "Durée de vie du groupement",
    donneesCollectees: ["UAI", "SIRET", "Adresse", "Effectifs", "Gouvernance"],
    reference: "Art. 30 RGPD",
  },
  {
    id: "actes",
    finalite: "Génération et archivage des actes administratifs (régies, délégations, engagements)",
    baseLegale: "Obligation légale — instruction 06-031-A-B-M, ordonnance RGP 2022-408",
    destinataires: ["Intéressé(s)", "DDFiP", "Contrôle de légalité"],
    conservation: "10 ans minimum (durée légale)",
    donneesCollectees: ["Identité de l'agent concerné", "Périmètre, plafonds", "Dates, signataires"],
    reference: "Art. 30 RGPD",
  },
  {
    id: "evaluations",
    finalite: "Conduite et archivage des entretiens professionnels (CREP)",
    baseLegale: "Obligation légale — décret 2010-888",
    destinataires: ["Agent évalué", "N+1, N+2", "Rectorat (recours)"],
    conservation: "Pendant la carrière + 10 ans",
    donneesCollectees: ["Identité", "Évaluation, objectifs, formation", "Signatures hiérarchiques"],
    reference: "Art. 30 RGPD",
  },
  {
    id: "regies",
    finalite: "Gestion des régies de recettes et d'avances",
    baseLegale: "Décret 2008-227 modifié, instruction 06-031-A-B-M",
    destinataires: ["AC", "Régisseur", "DDFiP"],
    conservation: "10 ans après abrogation de la régie",
    donneesCollectees: ["Identité régisseur/suppléant", "Plafonds", "Indemnité de maniement de fonds"],
    reference: "Art. 30 RGPD",
  },
];

export const MENTION_INFORMATION_AGENT = `Conformément aux articles 13 et 14 du règlement (UE) 2016/679 (RGPD), les données vous concernant sont traitées par le groupement comptable au titre de l'exécution d'une mission d'intérêt public (gestion RH, génération d'actes administratifs). Elles sont conservées pendant 10 ans après votre fin de fonction. Vous disposez d'un droit d'accès, de rectification, d'effacement (sauf obligation légale de conservation), de limitation et d'opposition. Pour exercer ces droits ou pour toute question, contactez le délégué à la protection des données de l'académie ou écrivez à dpo@ac-guadeloupe.fr.`;

/** Construit le PDF/HTML "demande d'accès" (art. 15 RGPD) pour un agent. */
export function buildDemandeAccesHtml(agent: any, contexte: { actes: any[]; historique: any[] }): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Demande d'accès RGPD</title>
<style>
  body { font-family: Inter, Arial, sans-serif; max-width: 820px; margin: 32px auto; padding: 24px; color: #111; }
  h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 8px; }
  h2 { color: #334155; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  td, th { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background: #f1f5f9; }
  .meta { background: #eff6ff; border-left: 4px solid #1e3a8a; padding: 10px 14px; margin: 16px 0; font-size: 12px; }
</style></head><body>
  <h1>Communication des données personnelles (art. 15 RGPD)</h1>
  <div class="meta">Demande d'accès produite le ${new Date().toLocaleDateString("fr-FR")} concernant : <strong>${escape(agent?.prenom || "")} ${escape(agent?.nom || "")}</strong>.<br/>Référence : règlement (UE) 2016/679, loi Informatique et Libertés modifiée.</div>
  <h2>Identité et statut</h2>
  <table><tbody>
    ${kvRow("Civilité", agent?.civilite)}
    ${kvRow("Nom de naissance", agent?.nom_naissance)}
    ${kvRow("Nom d'usage", agent?.nom_usage ?? agent?.nom)}
    ${kvRow("Prénom", agent?.prenom)}
    ${kvRow("Date de naissance", agent?.date_naissance)}
    ${kvRow("Lieu de naissance", agent?.lieu_naissance)}
    ${kvRow("Matricule EN", agent?.matricule_education_nationale)}
    ${kvRow("Statut", agent?.statut)}
    ${kvRow("Corps / Grade", `${agent?.corps ?? "—"} / ${agent?.grade ?? "—"}`)}
    ${kvRow("Échelon / Indice majoré", `${agent?.echelon ?? "—"} / ${agent?.indice_majore ?? "—"}`)}
    ${kvRow("Quotité", agent?.quotite_travail != null ? agent.quotite_travail + " %" : "—")}
    ${kvRow("Rôle principal", agent?.role_principal)}
  </tbody></table>
  <h2>Coordonnées professionnelles</h2>
  <table><tbody>
    ${kvRow("E-mail pro", agent?.email_professionnel)}
    ${kvRow("Téléphone pro", agent?.telephone_professionnel)}
    ${kvRow("Bureau", agent?.bureau)}
  </tbody></table>
  <h2>Actes administratifs vous concernant (${contexte.actes?.length ?? 0})</h2>
  ${contexte.actes && contexte.actes.length ? `<table><thead><tr><th>Type</th><th>Date</th><th>Établissement</th></tr></thead><tbody>${contexte.actes.map((a: any) => `<tr><td>${escape(a.type)}</td><td>${escape(a.date_signature)}</td><td>${escape(a.establishment_id ?? "—")}</td></tr>`).join("")}</tbody></table>` : "<p>Aucun acte enregistré.</p>"}
  <h2>Historique de fonctions (${contexte.historique?.length ?? 0})</h2>
  ${contexte.historique && contexte.historique.length ? `<table><thead><tr><th>Rôle</th><th>Début</th><th>Fin</th><th>Motif</th></tr></thead><tbody>${contexte.historique.map((h: any) => `<tr><td>${escape(h.role)}</td><td>${escape(h.date_debut)}</td><td>${escape(h.date_fin ?? "en cours")}</td><td>${escape(h.motif_changement ?? "—")}</td></tr>`).join("")}</tbody></table>` : "<p>Aucun historique.</p>"}
  <h2>Vos droits</h2>
  <p style="font-size:12px;">${escape(MENTION_INFORMATION_AGENT)}</p>
</body></html>`;
}

function kvRow(k: string, v: any): string {
  return `<tr><th style="width:35%">${escape(k)}</th><td>${escape(v ?? "—")}</td></tr>`;
}
function escape(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function downloadHtmlAsFile(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}