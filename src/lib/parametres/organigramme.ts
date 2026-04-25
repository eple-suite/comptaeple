// ═══════════════════════════════════════════════════════════════
// Organigramme fonctionnel CICF — génération SVG dynamique
// 3 sphères : Ordonnateur, Agent comptable, Opérationnel.
// Réf : décret GBCP 2012-1246 art. 78/86, CICF M9-6.
// ═══════════════════════════════════════════════════════════════

export type Sphere = "ordo" | "ac" | "ope";

export interface OrgaAgent {
  id: string;
  nom: string;
  prenom: string;
  role_principal: string | null;
  fonction?: string | null;
  establishment_id?: string | null;
  photo_url?: string | null;
  delegation_signature?: boolean | null;
  n_plus_un_id?: string | null;
}

export interface OrgaInput {
  groupementNom: string;
  agents: OrgaAgent[];
}

const ROLE_TO_SPHERE: Record<string, Sphere> = {
  ordonnateur: "ordo",
  ordonnateur_suppleant: "ordo",
  sg: "ordo",
  adjoint_gestionnaire: "ordo",
  assistant_gestion: "ordo",
  correspondant_cicf: "ordo",
  magasinier: "ordo",
  ac: "ac",
  fp: "ac",
  regisseur_recettes: "ac",
  regisseur_avances: "ac",
  suppleant_regie: "ac",
  archiviste_comptable: "ac",
  chef_cuisine: "ope",
  secretaire_intendance: "ope",
  gestionnaire_materiel: "ope",
  responsable_cfa: "ope",
  responsable_greta: "ope",
  autre: "ope",
};

const SPHERE_LABELS: Record<Sphere, string> = {
  ordo: "Sphère ordonnateur (R.421-9 / GBCP art. 10)",
  ac: "Sphère agent comptable (GBCP art. 78 / 86)",
  ope: "Sphère opérationnelle",
};

const SPHERE_COLORS: Record<Sphere, { bg: string; border: string; text: string }> = {
  ordo: { bg: "#dbeafe", border: "#1e40af", text: "#1e3a8a" }, // bleu
  ac:   { bg: "#d1fae5", border: "#047857", text: "#064e3b" }, // vert
  ope:  { bg: "#f3f4f6", border: "#4b5563", text: "#1f2937" }, // gris
};

const ROLE_LABEL: Record<string, string> = {
  ac: "Agent comptable",
  fp: "Fondé de pouvoir",
  ordonnateur: "Ordonnateur",
  ordonnateur_suppleant: "Ordo. suppléant",
  sg: "Secrétaire général",
  adjoint_gestionnaire: "Adjoint gestionnaire",
  assistant_gestion: "Assistant de gestion",
  regisseur_recettes: "Régisseur recettes",
  regisseur_avances: "Régisseur avances",
  suppleant_regie: "Suppléant régie",
  magasinier: "Magasinier",
  chef_cuisine: "Chef cuisine",
  secretaire_intendance: "Secrétaire intendance",
  gestionnaire_materiel: "Gestionnaire matériel",
  responsable_cfa: "Responsable CFA",
  responsable_greta: "Responsable GRETA",
  correspondant_cicf: "Correspondant CICF",
  archiviste_comptable: "Archiviste comptable",
  autre: "Autre",
};

export function getSphere(role: string | null | undefined): Sphere {
  if (!role) return "ope";
  return ROLE_TO_SPHERE[role] ?? "ope";
}

export function groupBySphere(agents: OrgaAgent[]): Record<Sphere, OrgaAgent[]> {
  const out: Record<Sphere, OrgaAgent[]> = { ordo: [], ac: [], ope: [] };
  for (const a of agents) {
    out[getSphere(a.role_principal)].push(a);
  }
  return out;
}

/** Génère le SVG de l'organigramme. Largeur 1200, hauteur dynamique. */
export function buildOrganigrammeSvg(input: OrgaInput): string {
  const grouped = groupBySphere(input.agents);
  const cardW = 220;
  const cardH = 80;
  const gap = 16;
  const colWidth = 380;
  const startY = 110;

  const cols: Sphere[] = ["ordo", "ac", "ope"];
  const colTitles: Record<Sphere, number> = { ordo: 0, ac: 0, ope: 0 };

  // Calcul hauteur
  const heights = cols.map((s) => grouped[s].length * (cardH + gap) + 60);
  const maxH = Math.max(360, ...heights);
  const totalH = startY + maxH + 60;
  const totalW = 60 + cols.length * colWidth;

  const cards: string[] = [];
  const titles: string[] = [];

  cols.forEach((sphere, ci) => {
    const colors = SPHERE_COLORS[sphere];
    const x = 30 + ci * colWidth;
    titles.push(
      `<rect x="${x}" y="60" width="${colWidth - 30}" height="36" rx="8" fill="${colors.border}" />` +
      `<text x="${x + (colWidth - 30) / 2}" y="84" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">${escapeXml(SPHERE_LABELS[sphere])}</text>`
    );
    grouped[sphere].forEach((agent, ai) => {
      const y = startY + ai * (cardH + gap);
      const role = agent.role_principal ? ROLE_LABEL[agent.role_principal] || agent.role_principal : "—";
      const fullName = `${agent.prenom ?? ""} ${agent.nom ?? ""}`.trim() || "Agent";
      const deleg = agent.delegation_signature
        ? `<text x="${x + cardW - 18}" y="${y + 18}" text-anchor="end" font-size="10" font-weight="600" fill="#b45309">⚖ délégation</text>`
        : "";
      cards.push(
        `<g>
          <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="10" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1.5" />
          <text x="${x + 12}" y="${y + 24}" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="${colors.text}">${escapeXml(fullName)}</text>
          <text x="${x + 12}" y="${y + 44}" font-family="Inter, Arial, sans-serif" font-size="11" fill="${colors.text}">${escapeXml(role)}</text>
          <text x="${x + 12}" y="${y + 62}" font-family="Inter, Arial, sans-serif" font-size="10" fill="#6b7280">${escapeXml(agent.fonction ?? "")}</text>
          ${deleg}
        </g>`
      );
      colTitles[sphere] = colTitles[sphere] + 1;
    });
    if (grouped[sphere].length === 0) {
      const y = startY;
      cards.push(
        `<g><rect x="${x}" y="${y}" width="${cardW}" height="${cardH - 30}" rx="10" fill="#fafafa" stroke="#d1d5db" stroke-dasharray="4 4" />
         <text x="${x + cardW / 2}" y="${y + 30}" text-anchor="middle" font-size="12" fill="#9ca3af">— aucun agent —</text></g>`
      );
    }
  });

  const titleBar =
    `<rect x="0" y="0" width="${totalW}" height="48" fill="#1e3a8a" />` +
    `<text x="${totalW / 2}" y="30" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#fff">Organigramme fonctionnel CICF — ${escapeXml(input.groupementNom)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <style>text { font-family: Inter, Arial, sans-serif; }</style>
  ${titleBar}
  ${titles.join("\n")}
  ${cards.join("\n")}
  <text x="${totalW - 12}" y="${totalH - 12}" text-anchor="end" font-size="10" fill="#6b7280">Généré ${new Date().toLocaleDateString("fr-FR")} — Réf. GBCP art. 78/86 ; CICF M9-6</text>
</svg>`;
}

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadSvg(svg: string, filename = "organigramme-cicf.svg"): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}