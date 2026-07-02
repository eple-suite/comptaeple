// Tests moteur d'exécution budgétaire SDE/SDR Op@le (audit #3) — calcul des
// taux réglementaires (engagement, liquidation, mandatement, recouvrement),
// cohérence OI+DBM=OT et reconstruction de lignes depuis records normalisés.
import { describe, it, expect } from "vitest";
import type { SdeRow, SdrRow } from "@/lib/opaleSdeSdrParser";
import {
  calculerTauxDepenses, calculerTauxRecettes, verifierCoherenceOuvertures,
  buildSdeRowsFromRecords, buildSdrRowsFromRecords,
  computeTauxDepensesFromRecords, computeTauxRecettesFromRecords,
} from "@/lib/opaleSdeSdrParser";

const sde = (over: Partial<SdeRow>): SdeRow => ({
  service: "AP", activite: "A1", natureAnalytique: "", domaine: "D1",
  compte: "606", libelle: "", oi: 0, dbm: 0, ot: 0,
  engagementsJuridiques: 0, engagementsComptables: 0, liquidations: 0, mandats: 0, disponible: 0, ...over,
});

describe("SDE — taux d'exécution des dépenses", () => {
  const rows = [
    sde({ service: "AP", ot: 100000, engagementsComptables: 80000, liquidations: 60000, mandats: 50000, disponible: 20000 }),
    sde({ service: "ALO", domaine: "D2", activite: "A2", compte: "615", ot: 100000, disponible: 100000 }),
  ];

  it("consolide les 4 taux réglementaires", () => {
    const t = calculerTauxDepenses(rows).consolide;
    expect(t.ot).toBe(200000);
    expect(t.tauxEngagement).toBe(40);
    expect(t.tauxLiquidation).toBe(30);
    expect(t.tauxMandatement).toBe(25);
    expect(t.tauxDisponibilite).toBe(60);
  });

  it("ventile par service budgétaire", () => {
    const parService = calculerTauxDepenses(rows).parService;
    expect(parService.map((s) => s.scope)).toEqual(["service:AP", "service:ALO"]);
    expect(parService.find((s) => s.scope === "service:AP")!.tauxEngagement).toBe(80);
    expect(parService.find((s) => s.scope === "service:ALO")!.tauxEngagement).toBe(0);
  });

  it("taux nul si ouvertures totales à zéro (pas de division par zéro)", () => {
    expect(calculerTauxDepenses([sde({ ot: 0, engagementsComptables: 5000 })]).consolide.tauxEngagement).toBe(0);
  });
});

describe("SDE — cohérence OI + DBM = OT", () => {
  it("valide quand la somme est exacte", () => {
    const r = verifierCoherenceOuvertures([sde({ oi: 100000, dbm: 0, ot: 100000 })]);
    expect(r.ok).toBe(true);
    expect(r.ecarts).toHaveLength(0);
  });
  it("signale l'écart quand OT ≠ OI + DBM", () => {
    const r = verifierCoherenceOuvertures([sde({ compte: "606", oi: 100000, dbm: 5000, ot: 100000 })]);
    expect(r.ok).toBe(false);
    expect(r.ecarts).toEqual([{ compte: "606", ecart: -5000 }]);
  });
});

describe("SDR — taux d'exécution et de recouvrement des recettes", () => {
  const rows: SdrRow[] = [
    { service: "AP", activite: "A1", compte: "706", libelle: "", pi: 100000, dbm: 0, pt: 100000, ordresRecettes: 80000, recettesNotifiees: 0, recettesEncaissees: 60000, resteARecouvrer: 20000 },
  ];
  it("calcule taux d'exécution (ordres/prévision) et recouvrement (encaissé/ordres)", () => {
    const t = calculerTauxRecettes(rows).consolide;
    expect(t.tauxExecutionRecettes).toBe(80);
    expect(t.tauxRecouvrement).toBe(75);
  });
});

describe("Reconstruction depuis records normalisés Op@le", () => {
  it("recalcule OT = OI + DBM et Disponible = OT − engagements", () => {
    const rec = {
      "service budgetaire": "AP", "code activite": "A1", "compte par nature": "606",
      "ouvertures initiales": "100000", "dbm": "0", "engagements comptables": "80000",
      "liquidations": "60000", "mandats emis": "50000",
    };
    const [row] = buildSdeRowsFromRecords([rec]);
    expect(row.ot).toBe(100000);
    expect(row.disponible).toBe(20000);
    expect(row.compte).toBe("606");
  });

  it("SDE end-to-end records → taux consolidés", () => {
    const rec = {
      "service budgetaire": "AP", "code activite": "A1", "compte par nature": "606",
      "ouvertures initiales": "100000", "dbm": "0", "engagements comptables": "80000",
      "liquidations": "60000", "mandats emis": "50000",
    };
    const t = computeTauxDepensesFromRecords([rec]).consolide;
    expect(t.tauxEngagement).toBe(80);
    expect(t.tauxMandatement).toBe(50);
  });

  it("SDR end-to-end records → reste à recouvrer déduit", () => {
    const rec = {
      "service budgetaire": "AP", "code activite": "A1", "compte par nature": "706",
      "previsions initiales": "100000", "dbm": "0", "ordres de recettes": "80000",
      "recettes encaissees": "60000",
    };
    const [row] = buildSdrRowsFromRecords([rec]);
    expect(row.resteARecouvrer).toBe(20000);
    expect(computeTauxRecettesFromRecords([rec]).consolide.tauxRecouvrement).toBe(75);
  });
});
