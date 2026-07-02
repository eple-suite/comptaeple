// Tests moteur d'analyse HYPER@LE (audit #3) — runAIEngine (variations,
// niveaux, recommandations dédupliquées) et analyser (causes/conséquences/
// vigilance/événements pilotant les alertes). Modules purs.
import { describe, it, expect } from "vitest";
import type { AIEngineInput } from "@/lib/hyperaleAnalyseEngine";
import type { HyperaleIndicators } from "@/pages/hyperale/useHyperaleData";
import { runAIEngine, analyser } from "@/lib/hyperaleAnalyseEngine";

const seuils = { fdrCritique: 50000, fdrSatisfaisant: 100000, tresCritique: 20000, tresSatisfaisant: 50000 };

describe("runAIEngine — situation saine sans historique", () => {
  const out = runAIEngine({
    fdr: 200000, caf: 50000, tresorerie: 100000, reserves: 80000,
    fdrPrev: null, cafPrev: null, tresPrev: null, resPrev: null, seuils,
  } as AIEngineInput);

  it("produit un résumé « satisfaisant » et 4 analyses détaillées", () => {
    expect(out.resume).toContain("satisfaisant");
    expect(out.analyseDetaillee).toHaveLength(4);
  });
  it("recommandations minimales (aucune alerte de niveau)", () => {
    expect(out.recommandations).toHaveLength(2);
  });
});

describe("runAIEngine — FDR et trésorerie critiques, CAF en baisse", () => {
  const out = runAIEngine({
    fdr: 10000, caf: 40000, tresorerie: 5000, reserves: 50000,
    fdrPrev: 100000, cafPrev: 80000, tresPrev: 50000, resPrev: 50000, seuils,
  } as AIEngineInput);

  it("détecte le niveau critique", () => {
    expect(out.resume).toContain("niveau critique");
  });
  it("chiffre la variation du FDR (−90 %)", () => {
    expect(out.analyseDetaillee[0]).toContain("-90.0 %");
  });
  it("empile les recommandations (dédupliquées, plafond 6)", () => {
    expect(out.recommandations.length).toBe(6);
    expect(new Set(out.recommandations).size).toBe(out.recommandations.length);
  });
});

// ── analyser : fixture HyperaleIndicators complète ────────────────────
const indic = (over: Partial<HyperaleIndicators> = {}): HyperaleIndicators => ({
  fdr: 50000, fdrJours: 50, caf: 10000, tresorerie: 20000, tresorerieJours: 35,
  reserves: 40000, tnr: 0, drfn: 365000, resultatComptable: 1000,
  tauxExecCharges: 92, tauxExecProduits: 90, alertes: [], hasData: true,
  historique: [], moyenneNationale: { fdrJours: 45, tresorerieJours: 30, tauxExecCharges: 90 },
  moyenneCollectivite: { fdrJours: 45, tresorerieJours: 30, tauxExecCharges: 90 }, ...over,
});

describe("analyser — situation saine", () => {
  const a = analyser({ nom: "Lycée", exercice: 2026, data: indic() });
  it("aucune cause ni anomalie signalée", () => {
    expect(a.causes).toContain("Aucune cause d'alerte identifiée.");
    expect(a.evenements.some((e) => e.severity === "info")).toBe(true);
  });
  it("relève des points positifs (FDR/CAF/trésorerie)", () => {
    expect(a.positifs.length).toBeGreaterThan(0);
  });
});

describe("analyser — FDR négatif", () => {
  const a = analyser({ nom: "Lycée", exercice: 2026, data: indic({ fdr: -10000 }) });
  it("identifie la cause structurelle et un événement critique FDR", () => {
    expect(a.causes).toContain("Emplois stables supérieurs aux ressources stables");
    expect(a.consequences).toContain("Risque d'incident de paiement à court terme");
    expect(a.evenements.some((e) => e.category === "fdr" && e.severity === "critical")).toBe(true);
  });
  it("priorise les 2 premières recommandations en 'haute'", () => {
    expect(a.recommandationsAvecPriorite.slice(0, 2).every((r) => r.priorite === "haute")).toBe(true);
  });
});

describe("analyser — trésorerie négative", () => {
  const a = analyser({ nom: "Lycée", exercice: 2026, data: indic({ tresorerie: -5000 }) });
  it("signale la vigilance et l'événement critique trésorerie", () => {
    expect(a.vigilance.some((v) => /Trésorerie négative/.test(v))).toBe(true);
    expect(a.evenements.some((e) => e.category === "tresorerie" && e.severity === "critical")).toBe(true);
  });
});
