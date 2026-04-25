import { ARTICLES_SEED, GLOSSAIRE_SEED, FAQ_SEED, MODELES_SEED, MODULES } from "@/data/aide";

export type AideHitKind = "article" | "glossaire" | "faq" | "modele";

export interface AideHit {
  kind: AideHitKind;
  module?: string;
  moduleLabel?: string;
  titre: string;
  resume?: string;
  href: string;
  score: number;
  refs?: string[];
  tags?: string[];
}

const moduleLabel = (id: string) => MODULES.find((m) => m.id === id)?.label ?? id;

function scoreText(haystack: string, q: string): number {
  if (!q) return 0;
  const h = haystack.toLowerCase();
  let s = 0;
  for (const token of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (!token) continue;
    const idx = h.indexOf(token);
    if (idx >= 0) {
      s += 10;
      if (idx === 0) s += 5;
      // multiple occurrences boost slightly
      const matches = h.split(token).length - 1;
      s += Math.min(matches, 4) * 2;
    }
  }
  return s;
}

export function searchAide(query: string, opts?: { module?: string; kinds?: AideHitKind[]; limit?: number }): AideHit[] {
  const q = (query || "").trim();
  const kinds = opts?.kinds ?? ["article", "glossaire", "faq", "modele"];
  const moduleFilter = opts?.module && opts.module !== "all" ? opts.module : undefined;
  const limit = opts?.limit ?? 50;
  const hits: AideHit[] = [];

  if (kinds.includes("article")) {
    for (const a of ARTICLES_SEED) {
      if (moduleFilter && a.module !== moduleFilter) continue;
      const text = [a.titre, a.resume ?? "", a.contenu_md, a.tags.join(" "), a.references_legales.join(" ")].join(" ");
      const score = q ? scoreText(text, q) : 1;
      if (score > 0) hits.push({
        kind: "article", module: a.module, moduleLabel: moduleLabel(a.module),
        titre: a.titre, resume: a.resume, href: `/aide/article/${a.slug}`, score, refs: a.references_legales, tags: a.tags,
      });
    }
  }
  if (kinds.includes("glossaire")) {
    for (const g of GLOSSAIRE_SEED) {
      if (moduleFilter && !g.modules.includes(moduleFilter)) continue;
      const text = [g.terme, g.acronyme ?? "", g.definition, g.references_legales.join(" ")].join(" ");
      const score = q ? scoreText(text, q) : 1;
      if (score > 0) hits.push({
        kind: "glossaire", module: g.modules[0], moduleLabel: g.modules[0] ? moduleLabel(g.modules[0]) : undefined,
        titre: g.acronyme ? `${g.acronyme} — ${g.terme}` : g.terme,
        resume: g.definition.slice(0, 180) + (g.definition.length > 180 ? "…" : ""),
        href: `/aide/glossaire#${encodeURIComponent(g.acronyme ?? g.terme)}`,
        score, refs: g.references_legales,
      });
    }
  }
  if (kinds.includes("faq")) {
    for (const f of FAQ_SEED) {
      if (moduleFilter && f.module !== moduleFilter) continue;
      const text = [f.question, f.reponse, f.tags.join(" ")].join(" ");
      const score = q ? scoreText(text, q) : 1;
      if (score > 0) hits.push({
        kind: "faq", module: f.module, moduleLabel: moduleLabel(f.module),
        titre: f.question, resume: f.reponse.slice(0, 180) + (f.reponse.length > 180 ? "…" : ""),
        href: `/aide/faq?q=${encodeURIComponent(f.question.slice(0, 40))}`, score, tags: f.tags,
      });
    }
  }
  if (kinds.includes("modele")) {
    for (const m of MODELES_SEED) {
      if (moduleFilter && m.module !== moduleFilter) continue;
      const text = [m.nom, m.description ?? "", m.tags.join(" "), m.references_legales.join(" ")].join(" ");
      const score = q ? scoreText(text, q) : 1;
      if (score > 0) hits.push({
        kind: "modele", module: m.module, moduleLabel: moduleLabel(m.module),
        titre: m.nom, resume: m.description, href: `/aide/modeles?module=${m.module}`,
        score, refs: m.references_legales, tags: m.tags,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export function getArticleBySlug(slug: string) {
  return ARTICLES_SEED.find((a) => a.slug === slug) ?? null;
}

export function articlesByModule(moduleId: string) {
  return ARTICLES_SEED.filter((a) => a.module === moduleId).sort((a, b) => a.ordre - b.ordre);
}

export function statsAide() {
  return {
    articles: ARTICLES_SEED.length,
    glossaire: GLOSSAIRE_SEED.length,
    faq: FAQ_SEED.length,
    modeles: MODELES_SEED.length,
    modules: MODULES.length,
  };
}