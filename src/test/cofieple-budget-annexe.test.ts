// Test calculerBudgetAnnexe (audit #3) — résultat du budget annexe et contrôle
// de la liaison BP/BA via le compte 185 (M9-6 § III.4.2). Complète la couverture
// cofieple (le reste du moteur M9-6 est testé par cofieple_chain).
import { describe, it, expect } from "vitest";
import type { LigneSDE, LigneSDR, LigneBalance } from "@/lib/cofieple_types";
import { calculerBudgetAnnexe } from "@/lib/cofieple_m96engine";

const sde = (over: Partial<LigneSDE>): LigneSDE => ({
  rne: "", exercice: 2026, service: "SRH", domaine: "", activite: "", compte: "606",
  budget: 0, engage: 0, realise: 0, encours: 0, disponible: 0, ext: "", ...over,
});
const sdr = (over: Partial<LigneSDR>): LigneSDR => ({
  rne: "", exercice: 2026, service: "SRH", domaine: "", activite: "", compte: "706",
  budget: 0, engage: 0, aor: 0, realise: 0, encours: 0, plusValues: 0, extourne: "", ...over,
});
const bal = (over: Partial<LigneBalance>): LigneBalance => ({
  compte: "", intituleReduit: "", type: "", antDbt: 0, antCrd: 0, dbt: 0, crd: 0,
  solDbt: 0, solCrd: 0, poste: "", classe: "", ssClasse: "", ssSsClasse: "", ...over,
});

describe("calculerBudgetAnnexe", () => {
  const r = calculerBudgetAnnexe(
    "ba1", "GRETA", "GRETA Nord",
    [sde({ compte: "606", realise: 8000, budget: 10000 })],
    [sdr({ compte: "706", realise: 9000, budget: 10000 })],
    // côté budget annexe : liaison 185 + résultat de bilan (compte 120 excédent)
    [bal({ compte: "185000", solDbt: 5000 }), bal({ compte: "120000", solCrd: 1000 })],
    [bal({ compte: "185000", solCrd: 5000 })], // côté budget principal
  );

  it("calcule charges/produits/taux (flux SDE/SDR) et résultat (bilan 120/129)", () => {
    expect(r).toMatchObject({ id: "ba1", type: "GRETA", libelle: "GRETA Nord" });
    expect(r.chargesBA).toBe(8000);
    expect(r.produitsBA).toBe(9000);
    expect(r.tauxExecChargesBA).toBeCloseTo(0.8, 5);
    expect(r.tauxExecProduitsBA).toBeCloseTo(0.9, 5);
    expect(r.resultatBA).toBe(1000); // excédent 120 − déficit 129
  });

  it("contrôle la liaison 185 : soldes BP/BA exactement opposés → équilibré", () => {
    expect(r.compte185BA).toBe(5000);
    expect(r.compte185BP).toBe(-5000);
    expect(r.equilibreCompte185).toBe(true);
    expect(r.avancesBPversBA).toBe(-5000);
  });

  it("détecte un déséquilibre 185 quand les soldes ne se compensent pas", () => {
    const desequilibre = calculerBudgetAnnexe(
      "ba2", "CFA", "CFA",
      [], [],
      [bal({ compte: "185000", solDbt: 5000 })],
      [bal({ compte: "185000", solCrd: 3000 })], // ≠ 5000
    );
    expect(desequilibre.equilibreCompte185).toBe(false);
  });
});
