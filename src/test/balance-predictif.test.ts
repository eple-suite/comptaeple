// Tests moteur prédictif de balance (audit #3) — 6 projections CRC
// (comptes d'attente, érosion trésorerie, créances familles, sous-conso
// subventions, déséquilibre SRH, résultat annualisé). Module pur.
import { describe, it, expect } from "vitest";
import type { BalanceLigne } from "@/lib/balance/referentielTypes";
import type { BalanceSnapshot } from "@/lib/balance/predictifEngine";
import {
  projectionAttente, projectionErosion, projectionCreancesFamilles,
  projectionSousConsoSubv, projectionDesequilibreSRH, projectionResultatExercice,
  lancerProjections,
} from "@/lib/balance/predictifEngine";

const l = (compte: string, solde: number): BalanceLigne => ({ compte, debit: 0, credit: 0, solde });
const snap = (date: string, lignes: BalanceLigne[]): BalanceSnapshot => ({ date: new Date(date), year: 2026, lignes });

describe("Prédictif — comptes d'attente (467/47x)", () => {
  it("croissance forte → rouge, valeur = dernier point", () => {
    const p = projectionAttente([
      snap("2026-01-31", [l("467000", 1000)]),
      snap("2026-02-28", [l("467000", 5000)]),
    ]);
    expect(p.valeur).toBe(5000);
    expect(p.niveau).toBe("rouge");
  });
});

describe("Prédictif — érosion de trésorerie (5151)", () => {
  it("baisse rapide vers le seuil 30 jours → rouge", () => {
    const p = projectionErosion([
      snap("2026-01-31", [l("515100", 200000)]),
      snap("2026-02-28", [l("515100", 100000)]),
    ], 50000);
    expect(p.niveau).toBe("rouge");
    expect(p.valeur).toBeCloseTo(0.5, 5); // (100000 − 50000) / 100000 €/balance
  });
});

describe("Prédictif — créances familles (4112/4113)", () => {
  it("créances en hausse > 500 €/balance → rouge", () => {
    const p = projectionCreancesFamilles([
      snap("2026-01-31", [l("4112", 100)]),
      snap("2026-02-28", [l("4112", 1200)]),
    ]);
    expect(p.niveau).toBe("rouge");
  });
});

describe("Prédictif — sous-consommation subventions fléchées", () => {
  it("< 50 % consommé à mi-exercice → rouge", () => {
    const p = projectionSousConsoSubv(snap("2026-06-30", [l("4411", -100000), l("607", 30000)]), 6);
    expect(p.valeur).toBe(30);
    expect(p.niveau).toBe("rouge");
  });
});

describe("Prédictif — déséquilibre SRH", () => {
  it("deux balances déficitaires consécutives → rouge", () => {
    const deficitaire = [l("7062", -1000), l("6021", 1500)]; // recette DP 1000 − achats 1500 = −500
    const p = projectionDesequilibreSRH([snap("2026-01-31", deficitaire), snap("2026-02-28", deficitaire)]);
    expect(p.valeur).toBe(-500);
    expect(p.niveau).toBe("rouge");
  });
});

describe("Prédictif — résultat exercice annualisé", () => {
  it("annualise le résultat partiel (facteur 12/mois)", () => {
    const p = projectionResultatExercice(snap("2026-06-30", [l("706", -60000), l("606", 100000)]), 6);
    expect(p.valeur).toBe(-80000); // (60000 − 100000) × 12/6
    expect(p.niveau).toBe("rouge");
  });
});

describe("Prédictif — agrégateur", () => {
  it("sans snapshot → score nul, aucune projection", () => {
    expect(lancerProjections([])).toEqual({ projections: [], scoreRisque: 0, topVigilance: [] });
  });
  it("lance les 6 projections et borne le score à 100", () => {
    const r = lancerProjections([
      snap("2026-01-31", [l("467000", 1000), l("515100", 200000)]),
      snap("2026-02-28", [l("467000", 9000), l("515100", 100000)]),
    ], { fonctionnementMensuel: 50000, moisEcoules: 6 });
    expect(r.projections).toHaveLength(6);
    expect(r.scoreRisque).toBeGreaterThanOrEqual(0);
    expect(r.scoreRisque).toBeLessThanOrEqual(100);
  });
});
