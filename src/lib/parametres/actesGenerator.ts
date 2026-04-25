// ═══════════════════════════════════════════════════════════════
// Générateur d'arrêtés et d'actes administratifs (chantier 5)
// 13 types d'actes, exigences visuelles institutionnelles.
// Réf : Code éducation R.421-9 / R.421-13, GBCP 2012-1246 art. 10/16,
//       instruction n° 06-031-A-B-M du 21/04/2006 art. 5 et 6,
//       décret 2008-227 modifié,
//       ordonnance RGP n° 2022-408 du 23/03/2022 (fin du cautionnement).
// ═══════════════════════════════════════════════════════════════

export type ActeType =
  | "nomination_regisseur_recettes"
  | "nomination_regisseur_avances"
  | "nomination_suppleant_regie"
  | "nomination_mandataire"
  | "arrete_constitutif_regie"
  | "arrete_abrogation_regie"
  | "delegation_signature_ordo"
  | "delegation_signature_ac"
  | "abrogation_delegation"
  | "engagement_ac"
  | "pv_installation_ac"
  | "pv_remise_service_ac"
  | "lettre_mission_cicf";

export interface ActeContext {
  type: ActeType;
  groupementNom: string;
  academie: string;
  etablissementNom?: string;
  etablissementUai?: string;
  agentNom?: string;
  agentPrenom?: string;
  agentFonction?: string;
  agentMatricule?: string;
  suppleantNom?: string;
  signataireNom?: string;
  signataireFonction?: string;
  dateSignature: string; // ISO
  dateEffet?: string;
  dateFin?: string;
  perimetre?: string;
  montantMax?: number;
  plafondEncaisse?: number;
  modeEncaissement?: string; // "espèces, chèques, CB"
  indemniteManiementFonds?: number;
  motifAbrogation?: string;
  acSortantNom?: string;
  acEntrantNom?: string;
}

const ACTE_LABEL: Record<ActeType, string> = {
  nomination_regisseur_recettes: "Arrêté de nomination de régisseur de recettes",
  nomination_regisseur_avances: "Arrêté de nomination de régisseur d'avances",
  nomination_suppleant_regie: "Arrêté de nomination de suppléant de régie",
  nomination_mandataire: "Arrêté de nomination de mandataire",
  arrete_constitutif_regie: "Arrêté constitutif de régie",
  arrete_abrogation_regie: "Arrêté d'abrogation de régie",
  delegation_signature_ordo: "Décision de délégation de signature de l'ordonnateur",
  delegation_signature_ac: "Décision de délégation de signature de l'agent comptable",
  abrogation_delegation: "Décision d'abrogation de délégation de signature",
  engagement_ac: "Acte d'engagement de l'agent comptable",
  pv_installation_ac: "Procès-verbal d'installation d'agent comptable",
  pv_remise_service_ac: "Procès-verbal de remise de service entre agents comptables",
  lettre_mission_cicf: "Lettre de mission du correspondant CICF",
};

export const ACTE_TYPES: { value: ActeType; label: string }[] = (
  Object.keys(ACTE_LABEL) as ActeType[]
).map((v) => ({ value: v, label: ACTE_LABEL[v] }));

/** Mention obligatoire post-RGP 2022-408 — pas de cautionnement. */
export const MENTION_RGP_2022_408 =
  "Conformément à l'ordonnance n° 2022-408 du 23 mars 2022 relative au régime de responsabilité financière des gestionnaires publics, le cautionnement n'est plus exigé.";

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(n?: number): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/**
 * Construit le HTML institutionnel d'un acte administratif (visas, articles, signatures).
 * Sortie utilisée pour impression PDF (window.print) ou aperçu.
 */
export function buildActeHtml(ctx: ActeContext): string {
  const titre = ACTE_LABEL[ctx.type];
  const visas = buildVisas(ctx);
  const considerants = buildConsiderants(ctx);
  const articles = buildArticles(ctx);
  const lieuDate = `Fait à ${escapeHtml(ctx.etablissementNom ?? ctx.groupementNom)}, le ${fmtDate(ctx.dateSignature)}.`;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>${escapeHtml(titre)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  body { font-family: Garamond, "Times New Roman", serif; color: #111; line-height: 1.45; }
  .entete { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
  .entete .republique { font-size: 11pt; letter-spacing: .2em; font-weight: 700; }
  .entete .ministere { font-size: 10pt; margin-top: 4px; }
  .entete .academie { font-size: 10pt; margin-top: 2px; font-style: italic; }
  .entete .grpt { margin-top: 6px; font-weight: 600; }
  h1 { text-align: center; font-size: 16pt; margin: 24px 0 18px; text-transform: uppercase; letter-spacing: .04em; }
  h2 { font-size: 12pt; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .visas p, .considerants p { margin: 4px 0; text-align: justify; }
  .articles article { margin: 12px 0; }
  .articles article h3 { font-size: 11pt; margin: 0 0 4px; }
  .articles article p { margin: 2px 0; text-align: justify; }
  .mention-rgp { background: #fef3c7; border-left: 4px solid #d97706; padding: 8px 10px; margin: 14px 0; font-size: 10pt; }
  .signature { margin-top: 36px; text-align: right; }
  .signature .lieu { font-style: italic; margin-bottom: 36px; }
  .signature .nom { font-weight: 700; }
  .transmissions { margin-top: 28px; font-size: 9pt; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
  @media screen { body { max-width: 800px; margin: 24px auto; padding: 32px; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.08); } }
</style></head><body>
  <header class="entete">
    <div class="republique">RÉPUBLIQUE FRANÇAISE</div>
    <div class="ministere">Ministère de l'Éducation nationale et de la Jeunesse</div>
    <div class="academie">Académie de ${escapeHtml(ctx.academie)}</div>
    <div class="grpt">${escapeHtml(ctx.groupementNom)}${ctx.etablissementNom ? " — " + escapeHtml(ctx.etablissementNom) : ""}${ctx.etablissementUai ? " (" + escapeHtml(ctx.etablissementUai) + ")" : ""}</div>
  </header>

  <h1>${escapeHtml(titre)}</h1>

  <section class="visas">
    <h2>Visas</h2>
    ${visas}
  </section>

  ${considerants ? `<section class="considerants"><h2>Considérants</h2>${considerants}</section>` : ""}

  <section class="articles">
    <h2>Décide / Arrête</h2>
    ${articles}
  </section>

  ${needsRgpMention(ctx.type) ? `<div class="mention-rgp">${MENTION_RGP_2022_408}</div>` : ""}

  <div class="signature">
    <div class="lieu">${lieuDate}</div>
    <div>${escapeHtml(ctx.signataireFonction ?? "Le signataire")}</div>
    <div class="nom">${escapeHtml(ctx.signataireNom ?? "—")}</div>
  </div>

  <div class="transmissions">
    <strong>Mentions de transmission :</strong>
    ${buildTransmissions(ctx.type)}
  </div>
</body></html>`;
}

function buildVisas(ctx: ActeContext): string {
  const items: string[] = [
    "Vu le Code de l'éducation, notamment ses articles R.421-9, R.421-13 et R.421-77 ;",
    "Vu le décret n° 2012-1246 du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique (GBCP), notamment ses articles 10, 16, 78 et 86 ;",
  ];
  if (ctx.type.startsWith("nomination_regisseur") || ctx.type === "arrete_constitutif_regie" || ctx.type === "arrete_abrogation_regie" || ctx.type === "nomination_suppleant_regie") {
    items.push(
      "Vu le décret n° 2008-227 du 5 mars 2008 modifié relatif à la responsabilité personnelle et pécuniaire des régisseurs ;",
      "Vu l'instruction codificatrice n° 06-031-A-B-M du 21 avril 2006 relative aux régies de recettes et d'avances dans les EPN, notamment ses articles 5 et 6 ;",
      "Vu l'ordonnance n° 2022-408 du 23 mars 2022 relative au régime de responsabilité financière des gestionnaires publics ;"
    );
  }
  if (ctx.type.startsWith("delegation_") || ctx.type === "abrogation_delegation") {
    items.push("Vu l'arrêté de nomination du délégant en qualité de chef d'établissement / agent comptable ;");
  }
  if (ctx.type === "engagement_ac" || ctx.type === "pv_installation_ac" || ctx.type === "pv_remise_service_ac") {
    items.push("Vu l'ordonnance n° 2022-408 du 23 mars 2022 (engagement professionnel sans cautionnement) ;");
  }
  return `<div class="visas-list">${items.map((v) => `<p>${escapeHtml(v)}</p>`).join("")}</div>`;
}

function buildConsiderants(ctx: ActeContext): string {
  switch (ctx.type) {
    case "nomination_regisseur_recettes":
    case "nomination_regisseur_avances":
      return `<p>Considérant la nécessité d'assurer la continuité du service public d'encaissement / de paiement au sein de ${escapeHtml(ctx.etablissementNom ?? ctx.groupementNom)} ;</p>`;
    case "delegation_signature_ordo":
    case "delegation_signature_ac":
      return `<p>Considérant la nécessité d'assurer la continuité du service et la fluidité de la chaîne de la dépense conformément aux articles 10 et 16 du décret GBCP ;</p>`;
    default:
      return "";
  }
}

function buildArticles(ctx: ActeContext): string {
  const agent = `${escapeHtml(ctx.agentPrenom ?? "")} ${escapeHtml(ctx.agentNom ?? "")}`.trim() || "—";
  const fonction = escapeHtml(ctx.agentFonction ?? "");
  const dEffet = fmtDate(ctx.dateEffet ?? ctx.dateSignature);
  const dFin = ctx.dateFin ? fmtDate(ctx.dateFin) : "indéterminée";
  const arts: string[] = [];

  switch (ctx.type) {
    case "nomination_regisseur_recettes":
      arts.push(
        `Article 1 — ${agent}${fonction ? ", " + fonction : ""}, est nommé(e) régisseur de recettes de ${escapeHtml(ctx.etablissementNom ?? ctx.groupementNom)} à compter du ${dEffet}, jusqu'au ${dFin}.`,
        `Article 2 — Le suppléant désigné est ${escapeHtml(ctx.suppleantNom ?? "—")} (article 5 de l'instruction n° 06-031-A-B-M).`,
        `Article 3 — Le plafond d'encaisse est fixé à ${fmtMoney(ctx.plafondEncaisse)}. Modes d'encaissement autorisés : ${escapeHtml(ctx.modeEncaissement ?? "espèces, chèques, carte bancaire")}.`,
        `Article 4 — L'indemnité mensuelle de maniement de fonds est fixée à ${fmtMoney(ctx.indemniteManiementFonds)}.`,
        `Article 5 — Le présent arrêté sera notifié à l'intéressé(e), à l'agent comptable et au directeur départemental des finances publiques.`
      );
      break;
    case "nomination_regisseur_avances":
      arts.push(
        `Article 1 — ${agent} est nommé(e) régisseur d'avances à compter du ${dEffet}, jusqu'au ${dFin}.`,
        `Article 2 — Le suppléant est ${escapeHtml(ctx.suppleantNom ?? "—")}.`,
        `Article 3 — Plafond d'avance : ${fmtMoney(ctx.plafondEncaisse)}. Périmètre des dépenses autorisées : ${escapeHtml(ctx.perimetre ?? "menues dépenses de fonctionnement")}.`,
        `Article 4 — Indemnité mensuelle : ${fmtMoney(ctx.indemniteManiementFonds)}.`
      );
      break;
    case "nomination_suppleant_regie":
      arts.push(
        `Article 1 — ${agent} est désigné(e) suppléant(e) du régisseur de ${escapeHtml(ctx.etablissementNom ?? "—")} à compter du ${dEffet}.`,
        `Article 2 — Le suppléant remplace le régisseur titulaire en cas d'absence ou d'empêchement, dans le respect strict de la séparation des fonctions (CICF).`
      );
      break;
    case "nomination_mandataire":
      arts.push(
        `Article 1 — ${agent} est désigné(e) mandataire de l'agent comptable du ${escapeHtml(ctx.groupementNom)} à compter du ${dEffet}.`,
        `Article 2 — Périmètre du mandat : ${escapeHtml(ctx.perimetre ?? "actes courants de la chaîne comptable")}.`
      );
      break;
    case "arrete_constitutif_regie":
      arts.push(
        `Article 1 — Il est créé une régie au sein de ${escapeHtml(ctx.etablissementNom ?? ctx.groupementNom)} à compter du ${dEffet}.`,
        `Article 2 — Périmètre : ${escapeHtml(ctx.perimetre ?? "—")}. Plafond : ${fmtMoney(ctx.plafondEncaisse)}.`,
        `Article 3 — La régie fonctionnera selon les règles fixées par le décret n° 2008-227 modifié et l'instruction n° 06-031-A-B-M.`
      );
      break;
    case "arrete_abrogation_regie":
      arts.push(
        `Article 1 — La régie de ${escapeHtml(ctx.etablissementNom ?? ctx.groupementNom)} est abrogée à compter du ${dEffet}.`,
        `Article 2 — Motif : ${escapeHtml(ctx.motifAbrogation ?? "—")}.`,
        `Article 3 — Le régisseur procède à l'apurement et au reversement des fonds à l'agent comptable.`
      );
      break;
    case "delegation_signature_ordo":
      arts.push(
        `Article 1 — Délégation de signature est donnée à ${agent}${fonction ? ", " + fonction : ""}, à compter du ${dEffet}, jusqu'au ${dFin}.`,
        `Article 2 — Périmètre : ${escapeHtml(ctx.perimetre ?? "actes de gestion courante")}. Plafond financier : ${fmtMoney(ctx.montantMax)}.`,
        `Article 3 — La présente délégation est révocable à tout moment.`
      );
      break;
    case "delegation_signature_ac":
      arts.push(
        `Article 1 — Délégation de signature est donnée à ${agent}, conformément à l'article 16 du décret GBCP, à compter du ${dEffet}, jusqu'au ${dFin}.`,
        `Article 2 — Périmètre : ${escapeHtml(ctx.perimetre ?? "—")}.`
      );
      break;
    case "abrogation_delegation":
      arts.push(
        `Article 1 — La délégation de signature consentie à ${agent} est abrogée à compter du ${dEffet}.`,
        `Article 2 — Motif : ${escapeHtml(ctx.motifAbrogation ?? "—")}.`
      );
      break;
    case "engagement_ac":
      arts.push(
        `Article 1 — ${agent} s'engage à exercer les fonctions d'agent comptable du ${escapeHtml(ctx.groupementNom)} dans le respect des règles de la comptabilité publique.`,
        `Article 2 — En application de l'ordonnance n° 2022-408 du 23 mars 2022, l'engagement professionnel ne donne plus lieu à constitution d'un cautionnement.`
      );
      break;
    case "pv_installation_ac":
      arts.push(
        `Le ${dEffet}, ${agent} a été installé(e) dans ses fonctions d'agent comptable du ${escapeHtml(ctx.groupementNom)}.`,
        `Cette installation a été effectuée conformément aux articles 78 et 86 du décret GBCP et à l'ordonnance n° 2022-408.`
      );
      break;
    case "pv_remise_service_ac":
      arts.push(
        `Le ${dEffet}, ${escapeHtml(ctx.acSortantNom ?? "l'agent comptable sortant")} a remis le service au successeur ${escapeHtml(ctx.acEntrantNom ?? "—")}.`,
        `La balance générale, l'état de l'actif/passif et l'inventaire des valeurs ont été conjointement vérifiés.`
      );
      break;
    case "lettre_mission_cicf":
      arts.push(
        `Article 1 — ${agent} est désigné(e) correspondant CICF du ${escapeHtml(ctx.groupementNom)}.`,
        `Article 2 — La mission consiste à animer le contrôle interne comptable et financier conformément à l'instruction M9-6, en toute indépendance vis-à-vis des fonctions d'ordonnancement et de comptabilité.`
      );
      break;
  }

  return arts.map((a) => `<article><h3>${escapeHtml(a.split(" — ")[0])}</h3><p>${escapeHtml(a.split(" — ").slice(1).join(" — "))}</p></article>`).join("");
}

function buildTransmissions(type: ActeType): string {
  const base = ["l'intéressé(e)", "agent comptable", "service du contrôle de légalité"];
  if (type.startsWith("nomination_regisseur") || type === "arrete_constitutif_regie") {
    base.push("DDFiP / DRFiP");
  }
  return base.map((t) => `<span>— ${t}</span>`).join(" ");
}

function needsRgpMention(type: ActeType): boolean {
  return (
    type.startsWith("nomination_regisseur") ||
    type === "arrete_constitutif_regie" ||
    type === "engagement_ac" ||
    type === "pv_installation_ac"
  );
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Hash sha-256 du contenu (côté navigateur) — sert de preuve d'archivage. */
export async function hashContent(html: string): Promise<string> {
  const enc = new TextEncoder().encode(html);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Imprime / exporte le HTML (l'utilisateur choisit "Enregistrer en PDF"). */
export function printActeHtml(html: string): void {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try { win.focus(); win.print(); } catch (_) {}
  }, 350);
}